import type TreeSitterParser from 'tree-sitter';
import type { BaseExtractor } from './base-extractor';
import { NodeUtils } from './base-extractor';

/**
 * Extractor for import and export statements
 */
export class ImportExportExtractor implements BaseExtractor {
  getSupportedTypes(): string[] {
    return ['import_statement', 'export_statement'];
  }

  extractName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    switch (node.type) {
      case 'import_statement':
        return this.extractImportName(node, source);

      case 'export_statement':
        return this.extractExportName(node, source);

      default:
        return undefined;
    }
  }

  /**
   * Extract import names from import statements
   * Simplified version of the original deeply nested method
   */
  private extractImportName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    const importClause = NodeUtils.findChildByType(node, 'import_clause');

    if (importClause) {
      return this.extractImportClauseNames(importClause, source);
    }

    // Fallback: look for string (module source)
    return this.extractImportSource(node, source);
  }

  /**
   * Extract names from import clause
   */
  private extractImportClauseNames(
    importClause: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    const imports: string[] = [];

    NodeUtils.forEachChild(importClause, (child) => {
      const name = this.getImportItemName(child, source);
      if (name) {
        imports.push(name);
      }
    });

    return imports.length > 0 ? imports.join(', ') : undefined;
  }

  /**
   * Get name from individual import items
   */
  private getImportItemName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    switch (node.type) {
      case 'identifier':
        return NodeUtils.getNodeText(node, source);

      case 'named_imports':
        return NodeUtils.getNodeText(node, source);

      case 'namespace_import': {
        // Handle "* as name" imports
        const identifier = NodeUtils.findChildByType(node, 'identifier');
        return identifier
          ? `* as ${NodeUtils.getNodeText(identifier, source)}`
          : '*';
      }

      default:
        return undefined;
    }
  }

  /**
   * Extract module source from import statement
   */
  private extractImportSource(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    const stringNode = NodeUtils.findChildByType(node, 'string');
    return stringNode
      ? NodeUtils.cleanString(NodeUtils.getNodeText(stringNode, source))
      : undefined;
  }

  /**
   * Extract name from export statements
   */
  private extractExportName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    // Look for export clause first
    const exportClause = NodeUtils.findChildByType(node, 'export_clause');
    if (exportClause) {
      return NodeUtils.getNodeText(exportClause, source);
    }

    // Look for exported declarations
    const exportedDeclaration = NodeUtils.findChildByType(node, [
      'class_declaration',
      'function_declaration',
      'interface_declaration',
      'type_alias_declaration',
      'variable_declaration',
      'lexical_declaration',
      'internal_module',
      'module',
      'namespace_declaration',
      'module_declaration',
    ]);

    if (exportedDeclaration) {
      // Special handling for internal_module (namespace)
      if (exportedDeclaration.type === 'internal_module') {
        return this.extractInternalModuleName(exportedDeclaration, source);
      }

      // Get the name from the exported declaration
      const identifier = NodeUtils.extractIdentifier(
        exportedDeclaration,
        source
      );
      return identifier;
    }

    // Handle default exports
    const defaultKeyword = NodeUtils.findChildByType(node, 'identifier');
    if (
      defaultKeyword &&
      NodeUtils.getNodeText(defaultKeyword, source) === 'default'
    ) {
      return 'default export';
    }

    return undefined;
  }

  /**
   * Extract name from internal_module (namespace) nodes
   */
  private extractInternalModuleName(
    node: TreeSitterParser.SyntaxNode,
    source: string
  ): string | undefined {
    // Look for namespace keyword followed by identifier
    let foundNamespace = false;

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) {
        continue;
      }

      const childText = NodeUtils.getNodeText(child, source);

      // Look for the 'namespace' keyword
      if (childText === 'namespace') {
        foundNamespace = true;
        continue;
      }

      // If we found namespace and this is an identifier, return it
      if (
        foundNamespace &&
        (child.type === 'identifier' || child.type === 'type_identifier')
      ) {
        return childText;
      }
    }

    // Fallback: look for any identifier in the node
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
