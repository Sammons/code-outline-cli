/**
 * Tree traversal utilities for working with NodeInfo trees
 */

import type { NodeInfo } from './types';

// Re-export NodeInfo for convenience
export type { NodeInfo } from './types';

/**
 * Visitor function type for tree traversal
 */
export type TreeVisitor<T = void> = (
  node: NodeInfo,
  depth: number,
  parent?: NodeInfo
) => T;

/**
 * Predicate function type for filtering nodes
 */
export type NodePredicate = (
  node: NodeInfo,
  depth: number,
  parent?: NodeInfo
) => boolean;

/**
 * TreeUtils provides shared utilities for traversing and analyzing NodeInfo trees
 */
export class TreeUtils {
  /**
   * Count all nodes in a tree
   */
  static countNodes(node: NodeInfo): number {
    let count = 1;
    if (node.children) {
      count += node.children.reduce(
        (sum, child) => sum + TreeUtils.countNodes(child),
        0
      );
    }
    return count;
  }

  /**
   * Find all nodes of a specific type in a tree
   */
  static findNodesByType(node: NodeInfo, type: string): NodeInfo[] {
    const results: NodeInfo[] = [];

    if (node.type === type) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...TreeUtils.findNodesByType(child, type));
      }
    }

    return results;
  }

  /**
   * Find all nodes with a specific name in a tree
   */
  static findNodesByName(node: NodeInfo, name: string): NodeInfo[] {
    const results: NodeInfo[] = [];

    if (node.name === name) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...TreeUtils.findNodesByName(child, name));
      }
    }

    return results;
  }

  /**
   * Filter nodes by a predicate function
   */
  static filterNodes(
    node: NodeInfo,
    predicate: NodePredicate,
    currentDepth: number = 0,
    parent?: NodeInfo
  ): NodeInfo[] {
    const results: NodeInfo[] = [];

    if (predicate(node, currentDepth, parent)) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(
          ...TreeUtils.filterNodes(child, predicate, currentDepth + 1, node)
        );
      }
    }

    return results;
  }

  /**
   * Generic tree traversal with visitor pattern
   */
  static traverseTree<T>(
    node: NodeInfo,
    visitor: TreeVisitor<T>,
    currentDepth: number = 0,
    parent?: NodeInfo
  ): T[] {
    const results: T[] = [];

    const result = visitor(node, currentDepth, parent);
    if (result !== undefined) {
      results.push(result);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(
          ...TreeUtils.traverseTree(child, visitor, currentDepth + 1, node)
        );
      }
    }

    return results;
  }

  /**
   * Get the depth of a specific node in the tree
   */
  static getNodeDepth(rootNode: NodeInfo, targetNode: NodeInfo): number | null {
    const findDepth = (node: NodeInfo, depth: number): number | null => {
      if (node === targetNode) {
        return depth;
      }

      if (node.children) {
        for (const child of node.children) {
          const childDepth = findDepth(child, depth + 1);
          if (childDepth !== null) {
            return childDepth;
          }
        }
      }

      return null;
    };

    return findDepth(rootNode, 0);
  }

  /**
   * Get all leaf nodes (nodes without children) in the tree
   */
  static getAllLeaves(node: NodeInfo): NodeInfo[] {
    const leaves: NodeInfo[] = [];

    if (!node.children || node.children.length === 0) {
      leaves.push(node);
    } else {
      for (const child of node.children) {
        leaves.push(...TreeUtils.getAllLeaves(child));
      }
    }

    return leaves;
  }

  /**
   * Get the maximum depth of the tree
   */
  static getMaxDepth(node: NodeInfo): number {
    let maxDepth = 0;

    if (node.children) {
      for (const child of node.children) {
        maxDepth = Math.max(maxDepth, TreeUtils.getMaxDepth(child));
      }
    }

    return maxDepth + 1;
  }

  /**
   * Get all nodes at a specific depth level
   */
  static getNodesAtDepth(
    node: NodeInfo,
    targetDepth: number,
    currentDepth: number = 0
  ): NodeInfo[] {
    if (currentDepth === targetDepth) {
      return [node];
    }

    if (currentDepth < targetDepth && node.children) {
      const results: NodeInfo[] = [];
      for (const child of node.children) {
        results.push(
          ...TreeUtils.getNodesAtDepth(child, targetDepth, currentDepth + 1)
        );
      }
      return results;
    }

    return [];
  }

  /**
   * Check if a node has any children
   */
  static hasChildren(node: NodeInfo): boolean {
    return node.children !== undefined && node.children.length > 0;
  }

  /**
   * Check if a node is a leaf (no children)
   */
  static isLeaf(node: NodeInfo): boolean {
    return !TreeUtils.hasChildren(node);
  }

  /**
   * Get the first node matching a predicate using depth-first search
   */
  static findFirst(
    node: NodeInfo,
    predicate: NodePredicate,
    currentDepth: number = 0,
    parent?: NodeInfo
  ): NodeInfo | null {
    if (predicate(node, currentDepth, parent)) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = TreeUtils.findFirst(
          child,
          predicate,
          currentDepth + 1,
          node
        );
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Get the path from root to a specific node
   */
  static getPath(rootNode: NodeInfo, targetNode: NodeInfo): NodeInfo[] | null {
    const findPath = (node: NodeInfo, path: NodeInfo[]): NodeInfo[] | null => {
      const currentPath = [...path, node];

      if (node === targetNode) {
        return currentPath;
      }

      if (node.children) {
        for (const child of node.children) {
          const childPath = findPath(child, currentPath);
          if (childPath) {
            return childPath;
          }
        }
      }

      return null;
    };

    return findPath(rootNode, []);
  }

  /**
   * Map over all nodes in the tree, applying a transformation function
   */
  static mapTree<T>(
    node: NodeInfo,
    mapper: (node: NodeInfo, depth: number, parent?: NodeInfo) => T,
    currentDepth: number = 0,
    parent?: NodeInfo
  ): T {
    const mappedNode = mapper(node, currentDepth, parent);

    // If the mapper returns a NodeInfo-like structure and has children, map them too
    if (
      typeof mappedNode === 'object' &&
      mappedNode !== null &&
      'children' in mappedNode &&
      node.children
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (mappedNode as any).children = node.children.map((child) =>
        TreeUtils.mapTree(child, mapper, currentDepth + 1, node)
      );
    }

    return mappedNode;
  }

  /**
   * Clone a NodeInfo tree (deep copy)
   */
  static cloneTree(node: NodeInfo): NodeInfo {
    const cloned: NodeInfo = {
      type: node.type,
      start: { ...node.start },
      end: { ...node.end },
    };

    if (node.name !== undefined) {
      cloned.name = node.name;
    }

    if (node.children) {
      cloned.children = node.children.map((child) =>
        TreeUtils.cloneTree(child)
      );
    }

    return cloned;
  }
}
