import * as YAML from 'yaml';
import pc from 'picocolors';
import { relative } from 'node:path';
import type { NodeInfo } from '@sammons/code-outline-parser';

export class Formatter {
  constructor(
    private outputFormat: 'json' | 'yaml' | 'ascii' | 'llmtext',
    private llmtext?: boolean
  ) {}

  format(results: Array<{ file: string; outline: NodeInfo | null }>): string {
    // Convert absolute paths to relative paths
    const cwd = process.cwd();
    const resultsWithRelativePaths = results.map((result) => ({
      ...result,
      file: this.getRelativePath(result.file, cwd),
      absolutePath: result.file,
    }));

    switch (this.outputFormat) {
      case 'json':
        return this.formatJSON(resultsWithRelativePaths);
      case 'yaml':
        return this.formatYAML(resultsWithRelativePaths);
      case 'ascii':
        return this.formatASCII(resultsWithRelativePaths);
      case 'llmtext':
        return this.formatLLMText(resultsWithRelativePaths);
      default: {
        const exhaustiveCheck: never = this.outputFormat;
        throw new Error(`Unknown format: ${String(exhaustiveCheck)}`);
      }
    }
  }

  private getRelativePath(filePath: string, cwd: string): string {
    const relativePath = relative(cwd, filePath);
    // If the file is outside the current directory, use the absolute path
    return relativePath.startsWith('..') ? filePath : relativePath;
  }

  private formatJSON(
    results: Array<{
      file: string;
      outline: NodeInfo | null;
      absolutePath?: string;
    }>
  ): string {
    const filtered = results.filter((r) => r.outline !== null);
    // Add file path to each node for easier reference
    const enhanced = filtered.map((result) => ({
      file: result.file,
      absolutePath: result.absolutePath,
      outline: this.addFileToNodes(result.outline!, result.file),
    }));
    return JSON.stringify(enhanced, null, 2);
  }

  private formatYAML(
    results: Array<{
      file: string;
      outline: NodeInfo | null;
      absolutePath?: string;
    }>
  ): string {
    const filtered = results.filter((r) => r.outline !== null);
    // Add file path to each node for easier reference
    const enhanced = filtered.map((result) => ({
      file: result.file,
      absolutePath: result.absolutePath,
      outline: this.addFileToNodes(result.outline!, result.file),
    }));
    return YAML.stringify(enhanced);
  }

  private addFileToNodes(
    node: NodeInfo,
    filePath: string
  ): NodeInfo & { file?: string } {
    const enhancedNode: NodeInfo & { file?: string } = { ...node };

    // Add file path to named nodes for easy reference
    if (node.name) {
      enhancedNode.file = filePath;
    }

    // Recursively add to children
    if (node.children) {
      enhancedNode.children = node.children.map((child) =>
        this.addFileToNodes(child, filePath)
      );
    }

    return enhancedNode;
  }

  private formatASCII(
    results: Array<{
      file: string;
      outline: NodeInfo | null;
      absolutePath?: string;
    }>
  ): string {
    const output: string[] = [];

    for (const { file, outline } of results) {
      if (!outline) {
        continue;
      }
      // Show the file as part of the tree structure
      output.push(`\n📁 ${pc.bold(pc.cyan(file))}`);
      if (outline.children && outline.children.length > 0) {
        // Format children with the file as the root
        outline.children.forEach((child, index) => {
          const isLast = index === outline.children!.length - 1;
          const prefix = isLast ? '└─ ' : '├─ ';
          output.push(this.formatNodeASCII(child, 0, file, prefix));
        });
      } else {
        output.push('  (no parseable content)');
      }
    }

    return output.join('\n');
  }

  private formatNodeASCII(
    node: NodeInfo,
    indent: number,
    filePath?: string,
    customPrefix?: string
  ): string {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);
    const prefix = customPrefix ?? (indent === 0 ? '' : '├─ ');

    let nodeStr = `${indentStr}${prefix}`;

    const typeColors: Record<string, (str: string) => string> = {
      function_declaration: pc.blue,
      class_declaration: pc.green,
      method_definition: pc.yellow,
      interface_declaration: pc.magenta,
      type_alias_declaration: pc.cyan,
      enum_declaration: pc.red,
      variable_declarator: pc.white,
      import_statement: pc.gray,
      export_statement: pc.gray,
    };

    const colorFn = typeColors[node.type] || pc.white;

    if (node.name) {
      nodeStr += colorFn(`${node.type}: ${pc.bold(node.name)}`);
    } else {
      nodeStr += colorFn(node.type);
    }

    // Add line:column information
    nodeStr += pc.gray(` [${node.start.row + 1}:${node.start.column}]`);

    // For ASCII format, we don't need the file path on every node since it's in the header
    // Only add line number for easy navigation
    if (node.name) {
      nodeStr += pc.dim(` :${node.start.row + 1}`);
    }

    lines.push(nodeStr);

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const isLast = i === node.children.length - 1;
        const childPrefix = isLast ? '└─ ' : '├─ ';
        lines.push(
          this.formatNodeASCII(child, indent + 1, filePath, childPrefix)
        );
      }
    }

    return lines.join('\n');
  }

  private formatLLMText(
    results: Array<{
      file: string;
      outline: NodeInfo | null;
      absolutePath?: string;
    }>
  ): string {
    const filtered = results.filter((r) => r.outline !== null);

    // 1. Extract common path prefixes
    const pathMap = new Map<string, string>();
    const pathCounter = { value: 1 };
    const processedPaths = this.extractCommonPaths(
      filtered,
      pathMap,
      pathCounter
    );

    // 2. Create node type abbreviations
    const nodeTypeMap = this.createNodeTypeAbbreviations(filtered);

    // 3. Build compressed output
    const output: string[] = [];
    output.push('<Outline>');
    output.push('# Ultra-compressed code outline for LLM consumption');
    output.push('# Format: type_name line_number (indented for hierarchy)');
    output.push('# Import/export names joined with underscore: imp_parseArgs');
    output.push('# Variables and functions show actual names after type');
    output.push('# Line numbers indicate source location for navigation');
    output.push('');

    // Add path variable definitions if any
    if (pathMap.size > 0) {
      output.push('# Path variables');
      pathMap.forEach((varName, path) => {
        output.push(`${varName}=${path}`);
      });
    }

    // Add node type abbreviations if beneficial
    if (nodeTypeMap.size > 0) {
      output.push('# Type abbreviations');
      nodeTypeMap.forEach((abbr, type) => {
        output.push(`${abbr}=${type}`);
      });
    }

    // Add files in ultra-compressed format
    output.push('# Files');
    for (const { file, outline } of processedPaths) {
      if (!outline) {
        continue;
      }

      const compressedFile = this.compressPath(file, pathMap);
      const fileContent = this.formatNodeUltraCompressed(outline, nodeTypeMap);
      if (fileContent.trim()) {
        output.push(`${compressedFile}`);
        output.push(fileContent);
      }
    }

    output.push('</Outline>');
    return output.join('\n');
  }

  private extractCommonPaths(
    results: Array<{ file: string; outline: NodeInfo | null }>,
    pathMap: Map<string, string>,
    counter: { value: number }
  ): Array<{ file: string; outline: NodeInfo | null }> {
    // Find common directory prefixes that appear multiple times
    const pathParts = new Map<string, number>();

    results.forEach(({ file }) => {
      const parts = file.split('/');
      for (let i = 1; i <= parts.length - 1; i++) {
        const prefix = parts.slice(0, i).join('/');
        pathParts.set(prefix, (pathParts.get(prefix) ?? 0) + 1);
      }
    });

    // Only create variables for paths that appear 3+ times and save tokens
    const worthwhilePaths = Array.from(pathParts.entries())
      .filter(([path, count]) => count >= 3 && path.length > 10)
      .sort((a, b) => b[0].length - a[0].length); // Longest first

    worthwhilePaths.forEach(([path]) => {
      if (
        !Array.from(pathMap.keys()).some((existing) =>
          existing.startsWith(path)
        )
      ) {
        pathMap.set(path, `<p${counter.value++}>`);
      }
    });

    return results;
  }

  private createNodeTypeAbbreviations(
    results: Array<{ file: string; outline: NodeInfo | null }>
  ): Map<string, string> {
    const typeFrequency = new Map<string, number>();

    const countTypes = (node: NodeInfo): void => {
      typeFrequency.set(node.type, (typeFrequency.get(node.type) ?? 0) + 1);
      node.children?.forEach(countTypes);
    };

    results.forEach(({ outline }) => {
      if (outline?.children) {
        outline.children.forEach(countTypes);
      }
    });

    // Create abbreviations for frequently used long type names
    const abbreviations = new Map<string, string>();
    const commonAbbreviations: Record<string, string> = {
      import_statement: 'imp',
      export_statement: 'exp',
      function_declaration: 'fn',
      class_declaration: 'cls',
      interface_declaration: 'ifc',
      method_definition: 'mth',
      variable_declarator: 'var',
      lexical_declaration: 'let',
      statement_block: 'blk',
      class_body: 'cb',
      interface_body: 'ib',
      arrow_function: 'arr',
      type_alias_declaration: 'typ',
    };

    typeFrequency.forEach((count, type) => {
      if (count >= 5 && type.length > 8) {
        const abbr = commonAbbreviations[type] ?? type.slice(0, 3);
        abbreviations.set(type, abbr);
      }
    });

    return abbreviations;
  }

  private compressPath(path: string, pathMap: Map<string, string>): string {
    let compressed = path;

    // Replace with variables, longest paths first
    const sortedPaths = Array.from(pathMap.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    for (const [fullPath, varName] of sortedPaths) {
      if (compressed.startsWith(fullPath)) {
        compressed = compressed.replace(fullPath, varName);
        break;
      }
    }

    return compressed;
  }

  private formatNodeUltraCompressed(
    node: NodeInfo,
    typeMap: Map<string, string>,
    indent: string = ''
  ): string {
    if (!node.children || node.children.length === 0) {
      return '';
    }

    const lines: string[] = [];

    node.children.forEach((child) => {
      const type = typeMap.get(child.type) ?? child.type;
      const rawName = child.name === child.type ? '' : (child.name ?? '');
      const line = child.start.row + 1;

      // Special handling for imports/exports - remove brackets and join with underscore
      let name = rawName;
      if (type === 'imp' || type === 'import_statement') {
        name = rawName.replace(/[{}\s\n]/g, '').replace(/,/g, '_');
        if (name.length > 30) {
          name = `${name.substring(0, 27)}...`;
        }
      } else if (type === 'exp' || type === 'export_statement') {
        name = rawName.replace(/[{}\s\n]/g, '').replace(/,/g, '_');
        if (name.length > 30) {
          name = `${name.substring(0, 27)}...`;
        }
      }

      // Ultra minimal: "type_name line" or "type name line"
      const parts = name
        ? [`${type}_${name}`, line.toString()]
        : [type, line.toString()];
      lines.push(indent + parts.join(' '));

      if (child.children?.length) {
        const childContent = this.formatNodeUltraCompressed(
          child,
          typeMap,
          `${indent} `
        );
        if (childContent.trim()) {
          lines.push(childContent);
        }
      }
    });

    return lines.join('\n');
  }
}
