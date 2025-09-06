import type TreeSitterParser from 'tree-sitter';
import { ExtractorRegistry } from './extractors/extractor-registry';

/**
 * NameExtractor handles extraction of names from AST nodes using the Strategy pattern
 */
export class NameExtractor {
  private registry: ExtractorRegistry;

  constructor() {
    this.registry = ExtractorRegistry.getInstance();
  }

  /**
   * Extract name from a syntax node
   * @param node - The syntax node to extract name from
   * @param source - The source code string
   * @returns The extracted name or undefined if no name found
   */
  extractName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    const extractor = this.registry.getExtractor(node.type);
    return extractor ? extractor.extractName(node, source) : undefined;
  }
}
