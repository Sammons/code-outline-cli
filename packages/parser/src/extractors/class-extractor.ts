import TreeSitterParser from 'tree-sitter';
import { BaseExtractor, NodeUtils } from './base-extractor';

/**
 * Extractor for class-related nodes (classes, interfaces)
 */
export class ClassExtractor implements BaseExtractor {
  getSupportedTypes(): string[] {
    return [
      'class_declaration',
      'interface_declaration',
    ];
  }

  extractName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    switch (node.type) {
      case 'class_declaration':
        return this.extractClassName(node, source);
      
      case 'interface_declaration':
        return this.extractInterfaceName(node, source);
      
      default:
        return undefined;
    }
  }

  /**
   * Extract name from class declarations
   */
  private extractClassName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    return NodeUtils.extractIdentifier(node, source, ['identifier', 'type_identifier']);
  }

  /**
   * Extract name from interface declarations
   */
  private extractInterfaceName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined {
    return NodeUtils.extractIdentifier(node, source, ['type_identifier', 'identifier']);
  }
}