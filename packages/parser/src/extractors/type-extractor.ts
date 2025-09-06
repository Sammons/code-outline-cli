import TreeSitterParser from 'tree-sitter';
import { BaseExtractor, NodeUtils } from './base-extractor';

/**
 * Extractor for TypeScript type-related nodes (type aliases, enums, namespaces, modules)
 */
export class TypeExtractor implements BaseExtractor {
  getSupportedTypes(): string[] {
    return [
      'type_alias_declaration',
      'enum_declaration',
      'namespace_declaration',
      'module_declaration',
    ];
  }

  extractName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    switch (node.type) {
      case 'type_alias_declaration':
        return this.extractTypeAliasName(node, source);
      
      case 'enum_declaration':
        return this.extractEnumName(node, source);
      
      case 'namespace_declaration':
      case 'module_declaration':
        return this.extractNamespaceOrModuleName(node, source);
      
      default:
        return undefined;
    }
  }

  /**
   * Extract name from type alias declarations
   */
  private extractTypeAliasName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    return NodeUtils.extractIdentifier(node, source, ['type_identifier', 'identifier']);
  }

  /**
   * Extract name from enum declarations
   */
  private extractEnumName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    return NodeUtils.extractIdentifier(node, source, ['identifier', 'type_identifier']);
  }

  /**
   * Extract name from namespace or module declarations
   */
  private extractNamespaceOrModuleName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    return NodeUtils.extractIdentifier(node, source, ['identifier', 'type_identifier']);
  }
}