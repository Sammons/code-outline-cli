import * as YAML from 'yaml';
import pc from 'picocolors';
import { NodeInfo } from './parser';

export class Formatter {
  constructor(private outputFormat: 'json' | 'yaml' | 'ascii') {}

  format(results: Array<{ file: string; outline: NodeInfo | null }>): string {
    switch (this.outputFormat) {
      case 'json':
        return this.formatJSON(results);
      case 'yaml':
        return this.formatYAML(results);
      case 'ascii':
        return this.formatASCII(results);
      default:
        throw new Error(`Unknown format: ${this.outputFormat}`);
    }
  }

  private formatJSON(results: Array<{ file: string; outline: NodeInfo | null }>): string {
    const filtered = results.filter(r => r.outline !== null);
    return JSON.stringify(filtered, null, 2);
  }

  private formatYAML(results: Array<{ file: string; outline: NodeInfo | null }>): string {
    const filtered = results.filter(r => r.outline !== null);
    return YAML.stringify(filtered);
  }

  private formatASCII(results: Array<{ file: string; outline: NodeInfo | null }>): string {
    const output: string[] = [];

    for (const { file, outline } of results) {
      if (!outline) continue;
      output.push(pc.bold(pc.cyan(`\n📁 ${file}`)));
      output.push(pc.gray('─'.repeat(80)));
      output.push(this.formatNodeASCII(outline, 0));
    }

    return output.join('\n');
  }

  private formatNodeASCII(node: NodeInfo, indent: number): string {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);
    const prefix = indent === 0 ? '' : '├─ ';
    
    let nodeStr = `${indentStr}${prefix}`;
    
    const typeColors: Record<string, (str: string) => string> = {
      'function_declaration': pc.blue,
      'class_declaration': pc.green,
      'method_definition': pc.yellow,
      'interface_declaration': pc.magenta,
      'type_alias_declaration': pc.cyan,
      'enum_declaration': pc.red,
      'variable_declarator': pc.white,
      'import_statement': pc.gray,
      'export_statement': pc.gray,
    };

    const colorFn = typeColors[node.type] || pc.white;
    
    if (node.name) {
      nodeStr += colorFn(`${node.type}: ${pc.bold(node.name)}`);
    } else {
      nodeStr += colorFn(node.type);
    }

    nodeStr += pc.gray(` [${node.start.row}:${node.start.column} - ${node.end.row}:${node.end.column}]`);
    lines.push(nodeStr);

    if (node.children) {
      for (const child of node.children) {
        lines.push(this.formatNodeASCII(child, indent + 1));
      }
    }

    return lines.join('\n');
  }
}