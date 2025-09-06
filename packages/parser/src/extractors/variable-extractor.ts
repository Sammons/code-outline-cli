import type TreeSitterParser from 'tree-sitter';
import type { BaseExtractor } from './base-extractor';
import { NodeUtils } from './base-extractor';

/**
 * Extractor for variable-related nodes (variables, properties, declarations)
 */
export class VariableExtractor implements BaseExtractor {
  getSupportedTypes(): string[] {
    return [
      'variable_declarator',
      'lexical_declaration',
      'variable_declaration',
      'public_field_definition',
      'getter',
      'setter',
      'pair',
      'call_expression',
    ];
  }

  extractName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    switch (node.type) {
      case 'variable_declarator':
        return this.extractVariableDeclaratorName(node, source);

      case 'lexical_declaration':
      case 'variable_declaration':
        return this.extractDeclarationName(node, source);

      case 'public_field_definition':
      case 'getter':
      case 'setter':
        return this.extractPropertyName(node, source);

      case 'pair':
        return this.extractPairName(node, source);

      case 'call_expression':
        return this.extractCallExpressionName(node, source);

      default:
        return undefined;
    }
  }

  /**
   * Extract name from variable declarator patterns
   */
  private extractVariableDeclaratorName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    // First child is usually the identifier pattern
    const pattern = node.child(0);
    if (pattern) {
      if (pattern.type === 'identifier') {
        return NodeUtils.getNodeText(pattern, source);
      } else if (
        pattern.type === 'object_pattern' ||
        pattern.type === 'array_pattern'
      ) {
        // For destructuring, return the pattern text
        return NodeUtils.getNodeText(pattern, source);
      }
    }
    return undefined;
  }

  /**
   * Extract names from variable/lexical declarations
   */
  private extractDeclarationName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    // Show const/let/var
    const keyword = node.child(0);
    if (!keyword) {
      return undefined;
    }

    const declarators: string[] = [];

    // Iterate through remaining children to find variable_declarator nodes
    NodeUtils.forEachChild(node, (child, index) => {
      if (index === 0) {
        return;
      } // Skip keyword
      if (child.type === 'variable_declarator') {
        const name = this.extractVariableDeclaratorName(child, source);
        if (name) {
          declarators.push(name);
        }
      }
    });

    if (declarators.length > 0) {
      const keywordText = NodeUtils.getNodeText(keyword, source);
      return `${keywordText} ${declarators.join(', ')}`;
    }
    return undefined;
  }

  /**
   * Extract property_identifier from node children
   */
  private extractPropertyName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    return NodeUtils.extractIdentifier(node, source, [
      'property_identifier',
      'identifier',
    ]);
  }

  /**
   * Extract name from object property key-value pairs
   */
  private extractPairName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    const key = node.child(0);
    if (
      key &&
      ['property_identifier', 'identifier', 'string'].includes(key.type)
    ) {
      const name = NodeUtils.getNodeText(key, source);
      return NodeUtils.cleanString(name);
    }
    return undefined;
  }

  /**
   * Extract name from call expressions
   */
  private extractCallExpressionName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    // Show function being called
    const func = node.child(0);
    if (func) {
      if (func.type === 'identifier') {
        return `${NodeUtils.getNodeText(func, source)}()`;
      } else if (func.type === 'member_expression') {
        return `${NodeUtils.getNodeText(func, source)}()`;
      }
    }
    return undefined;
  }
}
