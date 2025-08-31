import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import TreeSitterParser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
const TypeScript = require('tree-sitter-typescript').typescript;
const TSX = require('tree-sitter-typescript').tsx;

export interface NodeInfo {
  type: string;
  name?: string;
  start: { row: number; column: number };
  end: { row: number; column: number };
  children?: NodeInfo[];
}

export class Parser {
  private jsParser: TreeSitterParser;
  private tsParser: TreeSitterParser;
  private tsxParser: TreeSitterParser;

  constructor() {
    this.jsParser = new TreeSitterParser();
    this.jsParser.setLanguage(JavaScript);

    this.tsParser = new TreeSitterParser();
    this.tsParser.setLanguage(TypeScript);

    this.tsxParser = new TreeSitterParser();
    this.tsxParser.setLanguage(TSX);
  }

  async parseFile(filePath: string, maxDepth: number = Infinity, namedOnly: boolean = true): Promise<NodeInfo | null> {
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();
    
    let parser: TreeSitterParser;
    if (ext === '.tsx') {
      parser = this.tsxParser;
    } else if (ext === '.ts') {
      parser = this.tsParser;
    } else {
      parser = this.jsParser;
    }

    const tree = parser.parse(content);
    return this.extractNodeInfo(tree.rootNode, content, 0, maxDepth, namedOnly);
  }

  private extractNodeInfo(
    node: TreeSitterParser.SyntaxNode,
    source: string,
    currentDepth: number,
    maxDepth: number,
    namedOnly: boolean = true
  ): NodeInfo | null {
    const info: NodeInfo = {
      type: node.type,
      start: {
        row: node.startPosition.row,
        column: node.startPosition.column,
      },
      end: {
        row: node.endPosition.row,
        column: node.endPosition.column,
      },
    };

    const name = this.extractName(node, source);
    if (name) {
      info.name = name;
    }

    // If namedOnly is true and this node has no name, check if we should include it
    if (namedOnly && !name && !this.isStructuralNode(node)) {
      // For named-only mode, we still need to traverse children to find named entities
      if (currentDepth < maxDepth && this.shouldIncludeChildren(node)) {
        const children: NodeInfo[] = [];
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && this.isSignificantNode(child)) {
            const childInfo = this.extractNodeInfo(child, source, currentDepth, maxDepth, namedOnly);
            if (childInfo) {
              children.push(childInfo);
            }
          }
        }
        // If we found named children, create a structural parent node
        if (children.length > 0 && this.isStructuralNode(node)) {
          info.children = children;
          return info;
        }
        // If no named children and this node has no name, skip it
        return children.length === 1 ? children[0] : (children.length > 0 ? { ...info, children } : null);
      }
      return null;
    }

    if (currentDepth < maxDepth && this.shouldIncludeChildren(node)) {
      const children: NodeInfo[] = [];
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && this.isSignificantNode(child)) {
          const childInfo = this.extractNodeInfo(child, source, currentDepth + 1, maxDepth, namedOnly);
          if (childInfo) {
            children.push(childInfo);
          }
        }
      }
      if (children.length > 0) {
        info.children = children;
      }
    }

    return info;
  }

  private extractName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    // Try to extract names from various node types
    switch (node.type) {
      case 'function_declaration':
      case 'function_expression':
      case 'generator_function_declaration':
      case 'async_function_declaration':
      case 'class_declaration':
      case 'interface_declaration':
      case 'type_alias_declaration':
      case 'enum_declaration':
      case 'namespace_declaration':
      case 'module_declaration': {
        // Look for identifier or type_identifier
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && (child.type === 'identifier' || child.type === 'type_identifier')) {
            return source.substring(child.startIndex, child.endIndex);
          }
        }
        break;
      }

      case 'method_definition':
      case 'public_field_definition':
      case 'getter':
      case 'setter': {
        // Look for property_identifier
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && (child.type === 'property_identifier' || child.type === 'identifier')) {
            return source.substring(child.startIndex, child.endIndex);
          }
        }
        break;
      }

      case 'variable_declarator': {
        // First child is usually the identifier pattern
        const pattern = node.child(0);
        if (pattern) {
          if (pattern.type === 'identifier') {
            return source.substring(pattern.startIndex, pattern.endIndex);
          } else if (pattern.type === 'object_pattern' || pattern.type === 'array_pattern') {
            // For destructuring, return the pattern text
            return source.substring(pattern.startIndex, pattern.endIndex);
          }
        }
        break;
      }

      case 'arrow_function': {
        // Arrow functions may be assigned to variables
        const parent = node.parent;
        if (parent && parent.type === 'variable_declarator') {
          return this.extractName(parent, source);
        }
        // Check if it's a property in an object
        if (parent && parent.type === 'pair') {
          const key = parent.child(0);
          if (key) {
            if (key.type === 'property_identifier' || key.type === 'identifier' || key.type === 'string') {
              const name = source.substring(key.startIndex, key.endIndex);
              return name.replace(/['"]/g, ''); // Remove quotes if string
            }
          }
        }
        break;
      }

      case 'pair': {
        // Object property key-value pairs
        const key = node.child(0);
        if (key && (key.type === 'property_identifier' || key.type === 'identifier' || key.type === 'string')) {
          const name = source.substring(key.startIndex, key.endIndex);
          return name.replace(/['"]/g, ''); // Remove quotes if string
        }
        break;
      }

      case 'import_statement': {
        // Extract what's being imported
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && child.type === 'import_clause') {
            const imports: string[] = [];
            for (let j = 0; j < child.childCount; j++) {
              const clause = child.child(j);
              if (clause) {
                if (clause.type === 'identifier') {
                  imports.push(source.substring(clause.startIndex, clause.endIndex));
                } else if (clause.type === 'named_imports') {
                  const namedImports = source.substring(clause.startIndex, clause.endIndex);
                  imports.push(namedImports);
                }
              }
            }
            if (imports.length > 0) {
              return imports.join(', ');
            }
          }
        }
        // Fallback to showing the source
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && child.type === 'string') {
            return source.substring(child.startIndex, child.endIndex).replace(/['"]/g, '');
          }
        }
        break;
      }

      case 'export_statement': {
        // Look for what's being exported
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child && child.type === 'export_clause') {
            return source.substring(child.startIndex, child.endIndex);
          } else if (child && (child.type === 'class_declaration' || child.type === 'function_declaration')) {
            return this.extractName(child, source);
          }
        }
        break;
      }

      case 'call_expression': {
        // Show function being called
        const func = node.child(0);
        if (func) {
          if (func.type === 'identifier') {
            return source.substring(func.startIndex, func.endIndex) + '()';
          } else if (func.type === 'member_expression') {
            return source.substring(func.startIndex, func.endIndex) + '()';
          }
        }
        break;
      }

      case 'constructor': {
        return 'constructor';
      }

      case 'lexical_declaration':
      case 'variable_declaration': {
        // Show const/let/var
        const keyword = node.child(0);
        if (keyword) {
          const declarators: string[] = [];
          for (let i = 1; i < node.childCount; i++) {
            const child = node.child(i);
            if (child && child.type === 'variable_declarator') {
              const name = this.extractName(child, source);
              if (name) declarators.push(name);
            }
          }
          if (declarators.length > 0) {
            return `${source.substring(keyword.startIndex, keyword.endIndex)} ${declarators.join(', ')}`;
          }
        }
        break;
      }
    }

    return undefined;
  }

  private shouldIncludeChildren(node: TreeSitterParser.SyntaxNode): boolean {
    const containerTypes = [
      'program',
      'class_body',
      'function_declaration',
      'function_expression',
      'arrow_function',
      'method_definition',
      'constructor',
      'object',
      'class_declaration',
      'interface_declaration',
      'interface_body',
      'enum_declaration',
      'enum_body',
      'namespace_declaration',
      'module_declaration',
      'export_statement',
      'export_specifier',
      'import_statement',
      'variable_declaration',
      'lexical_declaration',
      'statement_block',
      'switch_statement',
      'if_statement',
      'for_statement',
      'while_statement',
      'do_statement',
      'try_statement',
    ];

    return containerTypes.includes(node.type);
  }

  private isSignificantNode(node: TreeSitterParser.SyntaxNode): boolean {
    const insignificantTypes = [
      'comment',
      ',',
      ';',
      '{',
      '}',
      '(',
      ')',
      '[',
      ']',
    ];

    if (insignificantTypes.includes(node.type)) {
      return false;
    }

    if (node.type === 'ERROR') {
      return false;
    }

    return true;
  }

  private isStructuralNode(node: TreeSitterParser.SyntaxNode): boolean {
    // These nodes provide structure even without names
    const structuralTypes = [
      'program',
      'class_body',
      'interface_body',
      'enum_body',
      'object',
      'statement_block',
    ];
    return structuralTypes.includes(node.type);
  }
}