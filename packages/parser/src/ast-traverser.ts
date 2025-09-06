import TreeSitterParser from 'tree-sitter';
import type { NodeInfo } from './types';
import { isContainerType, isStructuralType, isInsignificantType } from './types';
import { NameExtractor } from './name-extractor';
import { TreeUtils } from './tree-utils';

/**
 * Configuration options for AST traversal
 */
export interface TraversalOptions {
  /** Maximum depth to traverse */
  maxDepth: number;
  /** Only include nodes with names */
  namedOnly: boolean;
}

/**
 * ASTTraverser handles tree traversal logic for extracting node information
 */
export class ASTTraverser {
  private nameExtractor: NameExtractor;

  constructor(nameExtractor?: NameExtractor) {
    this.nameExtractor = nameExtractor || new NameExtractor();
  }

  /**
   * Extract node information from a syntax node
   * @param node - The syntax node to process
   * @param source - The source code string
   * @param options - Traversal options
   * @param currentDepth - Current traversal depth (internal)
   * @returns NodeInfo or null if node should be excluded
   */
  extractNodeInfo(
    node: TreeSitterParser.SyntaxNode,
    source: string,
    options: TraversalOptions,
    currentDepth: number = 0
  ): NodeInfo | null {
    const info = this.createNodeInfo(node, source);
    
    if (!this.shouldIncludeNode(info, options)) {
      return this.handleSpecialCases(node, source, options, currentDepth, info);
    }

    this.processChildren(info, node, source, options, currentDepth);
    return info;
  }

  /**
   * Create basic node info structure from a syntax node
   * @private
   */
  private createNodeInfo(node: TreeSitterParser.SyntaxNode, source: string): NodeInfo {
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

    const name = this.nameExtractor.extractName(node, source);
    if (name) {
      info.name = name;
    }

    return info;
  }

  /**
   * Determine if a node should be included in the output
   * @private
   */
  private shouldIncludeNode(info: NodeInfo, options: TraversalOptions): boolean {
    const hasName = Boolean(info.name);
    const isStructural = isStructuralType(info.type);
    
    // Always include nodes with names
    if (hasName) {
      return true;
    }
    
    // In named-only mode, only include structural types without names
    if (options.namedOnly) {
      return isStructural;
    }
    
    // In non-named mode, include all non-insignificant nodes
    return true;
  }

  /**
   * Process children for container nodes
   * @private
   */
  private processChildren(
    info: NodeInfo,
    node: TreeSitterParser.SyntaxNode,
    source: string,
    options: TraversalOptions,
    currentDepth: number
  ): void {
    if (this.canHaveChildren(node, currentDepth, options.maxDepth)) {
      const children = this.extractChildren(node, source, options, currentDepth);
      if (children.length > 0) {
        info.children = children;
      }
    }
  }

  /**
   * Handle special cases for nodes that might still need processing
   * @private
   */
  private handleSpecialCases(
    node: TreeSitterParser.SyntaxNode,
    source: string,
    options: TraversalOptions,
    currentDepth: number,
    info: NodeInfo
  ): NodeInfo | null {
    // Only relevant for named-only mode with unnamed, non-structural nodes
    if (!this.shouldProcessForNamedOnly(info, options)) {
      return null;
    }

    // Try to find named children
    if (this.canHaveChildren(node, currentDepth, options.maxDepth)) {
      const children = this.extractChildren(node, source, options, currentDepth);
      return this.handleNamedOnlyResult(children, info);
    }
    
    return null;
  }

  /**
   * Check if node should be processed in named-only mode
   * @private
   */
  private shouldProcessForNamedOnly(info: NodeInfo, options: TraversalOptions): boolean {
    return options.namedOnly && !info.name && !isStructuralType(info.type);
  }

  /**
   * Check if node can have children based on depth and type
   * @private
   */
  private canHaveChildren(node: TreeSitterParser.SyntaxNode, currentDepth: number, maxDepth: number): boolean {
    return currentDepth < maxDepth && isContainerType(node.type);
  }

  /**
   * Handle the result of named-only traversal
   * @private
   */
  private handleNamedOnlyResult(children: NodeInfo[], info: NodeInfo): NodeInfo | null {
    if (children.length === 0) {
      return null;
    }
    
    if (children.length === 1) {
      return children[0];
    }
    
    // Multiple children - wrap them in the parent node
    return { ...info, children };
  }

  /**
   * Extract children from a container node
   * @private
   */
  private extractChildren(
    node: TreeSitterParser.SyntaxNode,
    source: string,
    options: TraversalOptions,
    currentDepth: number
  ): NodeInfo[] {
    const children: NodeInfo[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!this.shouldIncludeChild(child)) {
        continue;
      }
      
      const nextDepth = this.calculateNextDepth(currentDepth, options.namedOnly);
      const childInfo = this.extractNodeInfo(child!, source, options, nextDepth);
      
      if (childInfo) {
        children.push(childInfo);
      }
    }
    
    return children;
  }

  /**
   * Calculate the next depth for child traversal
   * @private
   */
  private calculateNextDepth(currentDepth: number, namedOnly: boolean): number {
    return namedOnly ? currentDepth : currentDepth + 1;
  }

  /**
   * Determine if a child node should be included in traversal
   * @private
   */
  private shouldIncludeChild(child: TreeSitterParser.SyntaxNode | null): child is TreeSitterParser.SyntaxNode {
    return (
      child !== null &&
      !isInsignificantType(child.type) &&
      child.type !== 'ERROR'
    );
  }

  /**
   * Count total nodes in a NodeInfo tree (utility function)
   */
  countNodes(node: NodeInfo): number {
    return TreeUtils.countNodes(node);
  }

  /**
   * Find nodes by type in a NodeInfo tree
   */
  findNodesByType(node: NodeInfo, type: string): NodeInfo[] {
    return TreeUtils.findNodesByType(node, type);
  }

  /**
   * Find nodes by name in a NodeInfo tree
   */
  findNodesByName(node: NodeInfo, name: string): NodeInfo[] {
    return TreeUtils.findNodesByName(node, name);
  }

  /**
   * Filter nodes by predicate function
   */
  filterNodes(node: NodeInfo, predicate: (node: NodeInfo, depth?: number, parent?: NodeInfo) => boolean): NodeInfo[] {
    return TreeUtils.filterNodes(node, predicate);
  }
}