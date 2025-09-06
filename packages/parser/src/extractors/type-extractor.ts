import type TreeSitterParser from 'tree-sitter';
import type { BaseExtractor } from './base-extractor';
import { NodeUtils } from './base-extractor';

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
      'internal_module',
      'module',
    ];
  }

  extractName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    switch (node.type) {
      case 'type_alias_declaration':
        return this.extractTypeAliasName(node, source);

      case 'enum_declaration':
        return this.extractEnumName(node, source);

      case 'namespace_declaration':
      case 'module_declaration':
      case 'internal_module':
      case 'module':
        return this.extractNamespaceOrModuleName(node, source);

      default:
        return undefined;
    }
  }

  /**
   * Extract name from type alias declarations
   */
  private extractTypeAliasName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    return NodeUtils.extractIdentifier(node, source, [
      'type_identifier',
      'identifier',
    ]);
  }

  /**
   * Extract name from enum declarations
   */
  private extractEnumName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    return NodeUtils.extractIdentifier(node, source, [
      'identifier',
      'type_identifier',
    ]);
  }

  /**
   * Extract name from namespace or module declarations
   */
  private extractNamespaceOrModuleName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    // For module nodes, try broader search including direct text content
    const name = NodeUtils.extractIdentifier(node, source, [
      'identifier',
      'type_identifier',
    ]);
    if (name) {
      return name;
    }

    // If standard extraction fails, try to find name in children more broadly
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (
        child &&
        (child.type === 'identifier' || child.type === 'type_identifier')
      ) {
        return NodeUtils.getNodeText(child, source);
      }
    }

    return undefined;
  }
}
