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
    const output: string[] = [];

    // Add header explaining the format
    output.push('<Outline>');
    output.push('This is a compressed code outline for LLM consumption.');
    output.push(
      'The outline shows the structure and organization of the codebase.'
    );
    output.push(
      'Files and their code elements are listed in a hierarchical format.'
    );
    output.push('');

    for (const { file, outline } of results) {
      if (!outline) {
        continue;
      }

      // Show the file as part of the tree structure
      output.push(`File: ${file}`);
      if (outline.children && outline.children.length > 0) {
        // Format children with compressed symbols
        outline.children.forEach((child) => {
          output.push(this.formatNodeLLMText(child, 1));
        });
      } else {
        output.push('  (no parseable content)');
      }
      output.push(''); // Add blank line between files
    }

    output.push('</Outline>');
    return output.join('\n');
  }

  private formatNodeLLMText(node: NodeInfo, indent: number): string {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);

    let nodeStr = `${indentStr}`;

    if (node.name) {
      nodeStr += `${node.type}: ${node.name}`;
    } else {
      nodeStr += node.type;
    }

    // Add line number for easy navigation
    nodeStr += ` [${node.start.row + 1}:${node.start.column}]`;

    lines.push(nodeStr);

    if (node.children) {
      for (const child of node.children) {
        lines.push(this.formatNodeLLMText(child, indent + 1));
      }
    }

    return lines.join('\n');
  }
}
