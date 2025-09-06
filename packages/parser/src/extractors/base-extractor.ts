import TreeSitterParser from 'tree-sitter';

/**
 * Base interface for all name extractors
 */
export interface BaseExtractor {
  /**
   * Extract name from a syntax node
   * @param node - The syntax node to extract name from
   * @param source - The source code string
   * @returns The extracted name or undefined if no name found
   */
  extractName(node: TreeSitterParser.SyntaxNode, source: string): string | undefined;

  /**
   * Get the node types that this extractor can handle
   * @returns Array of node type strings
   */
  getSupportedTypes(): string[];
}

/**
 * Common utilities for node traversal and text extraction
 */
export class NodeUtils {
  /**
   * Extract text from a node
   */
  static getNodeText(node: TreeSitterParser.SyntaxNode, source: string): string {
    return source.substring(node.startIndex, node.endIndex);
  }

  /**
   * Find first child node of specified type(s)
   */
  static findChildByType(
    node: TreeSitterParser.SyntaxNode,
    types: string | string[]
  ): TreeSitterParser.SyntaxNode | undefined {
    const typeArray = Array.isArray(types) ? types : [types];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && typeArray.includes(child.type)) {
        return child;
      }
    }
    return undefined;
  }

  /**
   * Find all child nodes of specified type(s)
   */
  static findChildrenByType(
    node: TreeSitterParser.SyntaxNode,
    types: string | string[]
  ): TreeSitterParser.SyntaxNode[] {
    const typeArray = Array.isArray(types) ? types : [types];
    const children: TreeSitterParser.SyntaxNode[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && typeArray.includes(child.type)) {
        children.push(child);
      }
    }
    return children;
  }

  /**
   * Extract identifier name from common identifier node types
   */
  static extractIdentifier(
    node: TreeSitterParser.SyntaxNode,
    source: string,
    identifierTypes: string[] = ['identifier', 'type_identifier', 'property_identifier']
  ): string | undefined {
    const identifier = this.findChildByType(node, identifierTypes);
    return identifier ? this.getNodeText(identifier, source) : undefined;
  }

  /**
   * Clean string value by removing quotes
   */
  static cleanString(value: string): string {
    return value.replace(/^['"`]|['"`]$/g, '');
  }

  /**
   * Iterate through child nodes with a callback
   */
  static forEachChild(
    node: TreeSitterParser.SyntaxNode,
    callback: (child: TreeSitterParser.SyntaxNode, index: number) => boolean | void
  ): void {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const result = callback(child, i);
        if (result === false) break; // Allow early termination
      }
    }
  }
}