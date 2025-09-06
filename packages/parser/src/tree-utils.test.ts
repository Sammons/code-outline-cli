import { describe, it, expect } from 'vitest';
import { TreeUtils } from './tree-utils';
import type { NodeInfo, TreeVisitor, NodePredicate } from './tree-utils';

// Test helper to create nodes
function createNode(
  type: string,
  name?: string,
  children?: NodeInfo[]
): NodeInfo {
  return {
    type,
    name,
    start: { row: 0, column: 0 },
    end: { row: 0, column: 10 },
    children,
  };
}

// Test helper to create a simple tree structure
function createSimpleTree(): NodeInfo {
  return createNode('program', undefined, [
    createNode('function_declaration', 'foo'),
    createNode('class_declaration', 'Bar', [
      createNode('method_definition', 'constructor'),
      createNode('method_definition', 'getValue'),
    ]),
    createNode('variable_declaration', 'x'),
  ]);
}

// Test helper to create a deep nested tree
function createDeepTree(depth: number): NodeInfo {
  let current = createNode('program', 'root');
  for (let i = 0; i < depth; i++) {
    current = createNode('block', `level${i}`, [current]);
  }
  return current;
}

// Test helper to create a complex tree with various node types
function createComplexTree(): NodeInfo {
  return createNode('program', undefined, [
    createNode('import_statement', 'react'),
    createNode('interface_declaration', 'User', [
      createNode('property', 'id'),
      createNode('property', 'name'),
    ]),
    createNode('class_declaration', 'UserService', [
      createNode('constructor', undefined, [
        createNode('parameter', 'database'),
      ]),
      createNode('method_definition', 'getUser', [
        createNode('parameter', 'id'),
        createNode('statement_block', undefined, [
          createNode('return_statement', undefined),
        ]),
      ]),
      createNode('method_definition', 'createUser', [
        createNode('parameter', 'userData'),
      ]),
    ]),
    createNode('function_declaration', 'helper'),
    createNode('export_statement', undefined, [
      createNode('variable_declaration', 'API_URL'),
    ]),
  ]);
}

describe('TreeUtils', () => {
  describe('findNodesByType', () => {
    it('should find all nodes of a specific type', () => {
      const tree = createSimpleTree();
      const methods = TreeUtils.findNodesByType(tree, 'method_definition');

      expect(methods).toHaveLength(2);
      expect(methods[0].name).toBe('constructor');
      expect(methods[1].name).toBe('getValue');
    });

    it('should return empty array when no nodes match', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.findNodesByType(tree, 'nonexistent_type');

      expect(results).toEqual([]);
    });

    it('should find root node if it matches type', () => {
      const tree = createSimpleTree();
      const programs = TreeUtils.findNodesByType(tree, 'program');

      expect(programs).toHaveLength(1);
      expect(programs[0]).toBe(tree);
    });

    it('should handle nodes without children', () => {
      const leaf = createNode('function_declaration', 'test');
      const results = TreeUtils.findNodesByType(leaf, 'function_declaration');

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(leaf);
    });

    it('should handle empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);
      const results = TreeUtils.findNodesByType(
        nodeWithEmptyChildren,
        'function_declaration'
      );

      expect(results).toEqual([]);
    });

    it('should handle complex nested structures', () => {
      const tree = createComplexTree();
      const methods = TreeUtils.findNodesByType(tree, 'method_definition');

      expect(methods).toHaveLength(2);
      expect(methods.map((m) => m.name)).toEqual(['getUser', 'createUser']);
    });
  });

  describe('findNodesByName', () => {
    it('should find all nodes with a specific name', () => {
      const tree = createComplexTree();
      const parameters = TreeUtils.findNodesByName(tree, 'id');

      expect(parameters).toHaveLength(2);
      expect(parameters[0].type).toBe('property');
      expect(parameters[1].type).toBe('parameter');
    });

    it('should return empty array when no nodes match name', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.findNodesByName(tree, 'nonexistent');

      expect(results).toEqual([]);
    });

    it('should handle nodes without names (undefined)', () => {
      const tree = createNode('program', undefined, [
        createNode('statement_block', undefined),
      ]);
      const results = TreeUtils.findNodesByName(tree, 'undefined');

      expect(results).toEqual([]);
    });

    it('should find root node if name matches', () => {
      const tree = createNode('function_declaration', 'testFunction');
      const results = TreeUtils.findNodesByName(tree, 'testFunction');

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(tree);
    });

    it('should be case sensitive', () => {
      const tree = createNode('class_declaration', 'MyClass');
      const results = TreeUtils.findNodesByName(tree, 'myclass');

      expect(results).toEqual([]);
    });
  });

  describe('filterNodes', () => {
    it('should filter nodes by predicate', () => {
      const tree = createComplexTree();
      const predicate: NodePredicate = (node) =>
        node.type === 'method_definition';
      const results = TreeUtils.filterNodes(tree, predicate);

      expect(results).toHaveLength(2);
      expect(results.every((node) => node.type === 'method_definition')).toBe(
        true
      );
    });

    it('should pass correct depth and parent to predicate', () => {
      const tree = createSimpleTree();
      const calls: Array<{ depth: number; hasParent: boolean }> = [];

      const predicate: NodePredicate = (node, depth, parent) => {
        calls.push({ depth, hasParent: parent !== undefined });
        return false;
      };

      TreeUtils.filterNodes(tree, predicate);

      expect(calls[0]).toEqual({ depth: 0, hasParent: false }); // root
      expect(calls[1]).toEqual({ depth: 1, hasParent: true }); // first child
      expect(calls.some((call) => call.depth === 2)).toBe(true); // nested child
    });

    it('should handle empty results', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = () => false;
      const results = TreeUtils.filterNodes(tree, predicate);

      expect(results).toEqual([]);
    });

    it('should include all nodes when predicate always returns true', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = () => true;
      const results = TreeUtils.filterNodes(tree, predicate);

      const totalNodes = TreeUtils.countNodes(tree);
      expect(results).toHaveLength(totalNodes);
    });
  });

  describe('traverseTree', () => {
    it('should visit all nodes with visitor function', () => {
      const tree = createSimpleTree();
      const visited: string[] = [];

      const visitor: TreeVisitor<string> = (node) => {
        const result = `${node.type}:${node.name ?? 'unnamed'}`;
        visited.push(result);
        return result;
      };

      const results = TreeUtils.traverseTree(tree, visitor);

      expect(results).toHaveLength(6);
      expect(visited[0]).toBe('program:unnamed');
      expect(visited).toContain('function_declaration:foo');
      expect(visited).toContain('class_declaration:Bar');
    });

    it('should handle visitor returning undefined', () => {
      const tree = createSimpleTree();
      let callCount = 0;

      const visitor: TreeVisitor<string> = () => {
        callCount++;
        return undefined as any;
      };

      const results = TreeUtils.traverseTree(tree, visitor);

      expect(callCount).toBeGreaterThan(0);
      expect(results).toEqual([]);
    });

    it('should pass correct depth and parent to visitor', () => {
      const tree = createSimpleTree();
      const calls: Array<{ depth: number; parentType?: string }> = [];

      const visitor: TreeVisitor<void> = (node, depth, parent) => {
        calls.push({ depth, parentType: parent?.type });
      };

      TreeUtils.traverseTree(tree, visitor);

      expect(calls[0]).toEqual({ depth: 0, parentType: undefined });
      expect(
        calls.find((call) => call.depth === 1 && call.parentType === 'program')
      ).toBeDefined();
      expect(
        calls.find(
          (call) => call.depth === 2 && call.parentType === 'class_declaration'
        )
      ).toBeDefined();
    });
  });

  describe('getNodeDepth', () => {
    it('should return correct depth for existing nodes', () => {
      const tree = createSimpleTree();
      const classNode = tree.children![1]; // Bar class
      const methodNode = classNode.children![0]; // constructor method

      expect(TreeUtils.getNodeDepth(tree, tree)).toBe(0);
      expect(TreeUtils.getNodeDepth(tree, classNode)).toBe(1);
      expect(TreeUtils.getNodeDepth(tree, methodNode)).toBe(2);
    });

    it('should return null for non-existent nodes', () => {
      const tree = createSimpleTree();
      const otherNode = createNode('other', 'test');

      expect(TreeUtils.getNodeDepth(tree, otherNode)).toBeNull();
    });

    it('should handle deep nesting', () => {
      const tree = createDeepTree(5);
      let currentNode = tree;

      for (let i = 0; i <= 5; i++) {
        expect(TreeUtils.getNodeDepth(tree, currentNode)).toBe(i);
        if (currentNode.children && currentNode.children.length > 0) {
          currentNode = currentNode.children[0];
        }
      }
    });
  });

  describe('getAllLeaves', () => {
    it('should return all leaf nodes', () => {
      const tree = createSimpleTree();
      const leaves = TreeUtils.getAllLeaves(tree);

      // Leaves should be: foo, constructor, getValue, x
      expect(leaves).toHaveLength(4);
      expect(leaves.map((leaf) => leaf.name)).toContain('foo');
      expect(leaves.map((leaf) => leaf.name)).toContain('constructor');
      expect(leaves.map((leaf) => leaf.name)).toContain('getValue');
      expect(leaves.map((leaf) => leaf.name)).toContain('x');
    });

    it('should return the node itself if it has no children', () => {
      const leaf = createNode('function_declaration', 'test');
      const leaves = TreeUtils.getAllLeaves(leaf);

      expect(leaves).toHaveLength(1);
      expect(leaves[0]).toBe(leaf);
    });

    it('should handle empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);
      const leaves = TreeUtils.getAllLeaves(nodeWithEmptyChildren);

      expect(leaves).toHaveLength(1);
      expect(leaves[0]).toBe(nodeWithEmptyChildren);
    });

    it('should handle complex tree structures', () => {
      const tree = createComplexTree();
      const leaves = TreeUtils.getAllLeaves(tree);

      // All nodes without children should be returned
      expect(leaves.length).toBeGreaterThan(0);
      leaves.forEach((leaf) => {
        expect(leaf.children === undefined || leaf.children.length === 0).toBe(
          true
        );
      });
    });
  });

  describe('getMaxDepth', () => {
    it('should return correct maximum depth', () => {
      const tree = createSimpleTree();
      const maxDepth = TreeUtils.getMaxDepth(tree);

      expect(maxDepth).toBe(3); // program -> class -> method
    });

    it('should return 1 for leaf nodes', () => {
      const leaf = createNode('function_declaration', 'test');
      const maxDepth = TreeUtils.getMaxDepth(leaf);

      expect(maxDepth).toBe(1);
    });

    it('should handle deep nesting', () => {
      const tree = createDeepTree(10);
      const maxDepth = TreeUtils.getMaxDepth(tree);

      expect(maxDepth).toBe(11); // 10 levels + root
    });

    it('should handle empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);
      const maxDepth = TreeUtils.getMaxDepth(nodeWithEmptyChildren);

      expect(maxDepth).toBe(1);
    });
  });

  describe('getNodesAtDepth', () => {
    it('should return nodes at specific depth', () => {
      const tree = createSimpleTree();

      const depthZero = TreeUtils.getNodesAtDepth(tree, 0);
      expect(depthZero).toHaveLength(1);
      expect(depthZero[0]).toBe(tree);

      const depthOne = TreeUtils.getNodesAtDepth(tree, 1);
      expect(depthOne).toHaveLength(3); // foo, Bar, x

      const depthTwo = TreeUtils.getNodesAtDepth(tree, 2);
      expect(depthTwo).toHaveLength(2); // constructor, getValue
    });

    it('should return empty array for non-existent depth', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.getNodesAtDepth(tree, 10);

      expect(results).toEqual([]);
    });

    it('should handle negative depth', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.getNodesAtDepth(tree, -1);

      expect(results).toEqual([]);
    });

    it('should work with custom currentDepth parameter', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.getNodesAtDepth(tree, 5, 5); // target=5, current=5

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(tree);
    });
  });

  describe('hasChildren', () => {
    it('should return true for nodes with children', () => {
      const nodeWithChildren = createNode('program', undefined, [
        createNode('function_declaration', 'test'),
      ]);

      expect(TreeUtils.hasChildren(nodeWithChildren)).toBe(true);
    });

    it('should return false for nodes without children', () => {
      const leaf = createNode('function_declaration', 'test');

      expect(TreeUtils.hasChildren(leaf)).toBe(false);
    });

    it('should return false for nodes with empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);

      expect(TreeUtils.hasChildren(nodeWithEmptyChildren)).toBe(false);
    });

    it('should return false for nodes with undefined children', () => {
      const node = createNode('function_declaration', 'test');
      node.children = undefined;

      expect(TreeUtils.hasChildren(node)).toBe(false);
    });
  });

  describe('isLeaf', () => {
    it('should return true for leaf nodes', () => {
      const leaf = createNode('function_declaration', 'test');

      expect(TreeUtils.isLeaf(leaf)).toBe(true);
    });

    it('should return false for nodes with children', () => {
      const nodeWithChildren = createNode('program', undefined, [
        createNode('function_declaration', 'test'),
      ]);

      expect(TreeUtils.isLeaf(nodeWithChildren)).toBe(false);
    });

    it('should return true for nodes with empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);

      expect(TreeUtils.isLeaf(nodeWithEmptyChildren)).toBe(true);
    });

    it('should be opposite of hasChildren', () => {
      const nodes = [
        createNode('function_declaration', 'test'),
        createNode('program', undefined, []),
        createNode('class', undefined, [createNode('method', 'test')]),
      ];

      nodes.forEach((node) => {
        expect(TreeUtils.isLeaf(node)).toBe(!TreeUtils.hasChildren(node));
      });
    });
  });

  describe('findFirst', () => {
    it('should return first matching node using depth-first search', () => {
      const tree = createComplexTree();
      const predicate: NodePredicate = (node) =>
        node.type === 'method_definition';
      const result = TreeUtils.findFirst(tree, predicate);

      expect(result).toBeTruthy();
      expect(result!.type).toBe('method_definition');
      expect(result!.name).toBe('getUser'); // Should be first one found
    });

    it('should return null when no node matches', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = (node) =>
        node.type === 'nonexistent_type';
      const result = TreeUtils.findFirst(tree, predicate);

      expect(result).toBeNull();
    });

    it('should return root node if it matches', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = (node) => node.type === 'program';
      const result = TreeUtils.findFirst(tree, predicate);

      expect(result).toBe(tree);
    });

    it('should pass correct parameters to predicate', () => {
      const tree = createSimpleTree();
      let predicateCall: {
        node: NodeInfo;
        depth: number;
        parent?: NodeInfo;
      } | null = null;

      const predicate: NodePredicate = (node, depth, parent) => {
        if (node.type === 'class_declaration') {
          predicateCall = { node, depth, parent };
          return true;
        }
        return false;
      };

      TreeUtils.findFirst(tree, predicate);

      expect(predicateCall).toBeTruthy();
      expect(predicateCall!.depth).toBe(1);
      expect(predicateCall!.parent?.type).toBe('program');
    });
  });

  describe('getPath', () => {
    it('should return path from root to target node', () => {
      const tree = createSimpleTree();
      const classNode = tree.children![1];
      const methodNode = classNode.children![0];

      const path = TreeUtils.getPath(tree, methodNode);

      expect(path).toHaveLength(3);
      expect(path![0]).toBe(tree);
      expect(path![1]).toBe(classNode);
      expect(path![2]).toBe(methodNode);
    });

    it('should return single-node path for root', () => {
      const tree = createSimpleTree();
      const path = TreeUtils.getPath(tree, tree);

      expect(path).toHaveLength(1);
      expect(path![0]).toBe(tree);
    });

    it('should return null for non-existent node', () => {
      const tree = createSimpleTree();
      const otherNode = createNode('other', 'test');
      const path = TreeUtils.getPath(tree, otherNode);

      expect(path).toBeNull();
    });

    it('should work with deep nesting', () => {
      const tree = createDeepTree(5);
      let deepestNode = tree;

      // Navigate to the deepest node
      while (deepestNode.children && deepestNode.children.length > 0) {
        deepestNode = deepestNode.children[0];
      }

      const path = TreeUtils.getPath(tree, deepestNode);

      expect(path).toHaveLength(6); // root + 5 levels
      expect(path![0]).toBe(tree);
      expect(path![path!.length - 1]).toBe(deepestNode);
    });
  });

  describe('mapTree', () => {
    it('should transform nodes using mapper function', () => {
      const tree = createSimpleTree();

      const mapper = (node: NodeInfo) => ({
        ...node,
        type: node.type.toUpperCase(),
        mapped: true,
      });

      const result = TreeUtils.mapTree(tree, mapper);

      expect(result.type).toBe('PROGRAM');
      expect(result).toHaveProperty('mapped', true);
      expect(result).toHaveProperty('children');
    });

    it('should preserve tree structure when mapping to similar objects', () => {
      const tree = createSimpleTree();

      const mapper = (node: NodeInfo) => ({
        ...node,
        transformed: true,
      });

      const result = TreeUtils.mapTree(tree, mapper);

      expect(result).toHaveProperty('children');
      // Type guard to ensure children exists and is an array
      if ('children' in result && Array.isArray(result.children)) {
        expect(result.children).toHaveLength(3);
        expect(result.children[0]).toHaveProperty('transformed', true);
        expect(result.children[1]).toHaveProperty('children');
        // Additional type guard for nested children
        const secondChild = result.children[1];
        if ('children' in secondChild && Array.isArray(secondChild.children)) {
          expect(secondChild.children).toHaveLength(2);
        } else {
          expect.fail('Second child should have children array');
        }
      } else {
        expect.fail('Result should have children array');
      }
    });

    it('should handle non-object return values', () => {
      const tree = createSimpleTree();

      const mapper = (node: NodeInfo) => node.type;

      const result = TreeUtils.mapTree(tree, mapper);

      expect(result).toBe('program');
      expect(typeof result).toBe('string');
    });

    it('should pass correct depth and parent to mapper', () => {
      const tree = createSimpleTree();
      const calls: Array<{ depth: number; hasParent: boolean }> = [];

      const mapper = (node: NodeInfo, depth: number, parent?: NodeInfo) => {
        calls.push({ depth, hasParent: parent !== undefined });
        return node;
      };

      TreeUtils.mapTree(tree, mapper);

      expect(calls[0]).toEqual({ depth: 0, hasParent: false });
      expect(
        calls.find((call) => call.depth === 1 && call.hasParent)
      ).toBeDefined();
      expect(
        calls.find((call) => call.depth === 2 && call.hasParent)
      ).toBeDefined();
    });
  });

  describe('cloneTree', () => {
    it('should create deep copy of the tree', () => {
      const tree = createSimpleTree();
      const clone = TreeUtils.cloneTree(tree);

      expect(clone).toEqual(tree);
      expect(clone).not.toBe(tree);
      expect(clone.children).not.toBe(tree.children);
    });

    it('should clone all nested children', () => {
      const tree = createComplexTree();
      const clone = TreeUtils.cloneTree(tree);

      // Verify structure is the same
      expect(clone.children).toHaveLength(tree.children!.length);

      // Verify objects are different instances
      expect(clone.children![0]).not.toBe(tree.children![0]);
      expect(clone.children![2].children![0]).not.toBe(
        tree.children![2].children![0]
      );
    });

    it('should handle nodes without children', () => {
      const leaf = createNode('function_declaration', 'test');
      const clone = TreeUtils.cloneTree(leaf);

      expect(clone).toEqual(leaf);
      expect(clone).not.toBe(leaf);
    });

    it('should handle nodes with undefined name', () => {
      const node = createNode('program');
      const clone = TreeUtils.cloneTree(node);

      expect(clone.name).toBeUndefined();
      expect(clone).toEqual(node);
      expect(clone).not.toBe(node);
    });

    it('should clone position objects', () => {
      const tree = createNode('test', 'name');
      tree.start = { row: 1, column: 2 };
      tree.end = { row: 3, column: 4 };

      const clone = TreeUtils.cloneTree(tree);

      expect(clone.start).toEqual(tree.start);
      expect(clone.start).not.toBe(tree.start);
      expect(clone.end).toEqual(tree.end);
      expect(clone.end).not.toBe(tree.end);
    });

    it('should handle empty children array', () => {
      const node = createNode('program', undefined, []);
      const clone = TreeUtils.cloneTree(node);

      expect(clone.children).toEqual([]);
      expect(clone.children).not.toBe(node.children);
    });
  });

  // Edge cases and performance tests
  describe('Edge Cases', () => {
    it('should handle extremely deep trees efficiently', () => {
      const startTime = performance.now();
      const tree = createDeepTree(100); // Very deep but linear
      const leaves = TreeUtils.getAllLeaves(tree);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be fast
      expect(leaves).toHaveLength(1);
    });

    it('should handle wide trees efficiently', () => {
      const startTime = performance.now();
      const children = Array.from({ length: 1000 }, (_, i) =>
        createNode('function_declaration', `func${i}`)
      );
      const tree = createNode('program', undefined, children);

      const functions = TreeUtils.findNodesByType(tree, 'function_declaration');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be fast
      expect(functions).toHaveLength(1000);
    });

    it('should handle nodes with mixed children types', () => {
      const tree = createNode('program', undefined, [
        createNode('function_declaration', 'test1'),
        createNode('class_declaration', 'Test2', [
          createNode('method_definition', 'method1'),
        ]),
        createNode('variable_declaration', 'var1'),
      ]);

      const allNodes = TreeUtils.filterNodes(tree, () => true);
      expect(allNodes).toHaveLength(5); // program + 3 direct children + 1 method
    });
  });

  // Performance-focused tests
  describe('Performance', () => {
    it('should perform tree operations efficiently', () => {
      const complexTree = createComplexTree();

      // Test multiple operations in sequence to ensure they're all fast
      const startTime = performance.now();

      TreeUtils.countNodes(complexTree);
      TreeUtils.findNodesByType(complexTree, 'method_definition');
      TreeUtils.findNodesByName(complexTree, 'getUser');
      TreeUtils.getAllLeaves(complexTree);
      TreeUtils.getMaxDepth(complexTree);
      TreeUtils.filterNodes(complexTree, (node) =>
        node.type.includes('declaration')
      );
      const clone = TreeUtils.cloneTree(complexTree);

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
      expect(clone).toEqual(complexTree);
    });
  });
});
