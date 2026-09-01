import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TreeUtils } from './tree-utils.ts';
import type { NodeInfo, TreeVisitor, NodePredicate } from './tree-utils.ts';

// vitest's `toEqual` performs a recursive equality check that treats an
// object property explicitly set to `undefined` as equivalent to that
// property being absent. `assert.deepStrictEqual` does not: it treats
// `{ name: undefined }` and `{}` as different. This helper reproduces
// vitest's `toEqual` semantics exactly by stripping `undefined`-valued
// properties (recursively) from both sides before the strict deep compare,
// so ports of `expect(a).toEqual(b)` keep the original assertion's meaning
// when either side may carry explicit `undefined` fields.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        result[key] = stripUndefined(val);
      }
    }
    return result as T;
  }
  return value;
}

function assertVitestEqual(actual: unknown, expected: unknown): void {
  assert.deepStrictEqual(stripUndefined(actual), stripUndefined(expected));
}

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

      assert.strictEqual(methods.length, 2);
      assert.strictEqual(methods[0].name, 'constructor');
      assert.strictEqual(methods[1].name, 'getValue');
    });

    it('should return empty array when no nodes match', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.findNodesByType(tree, 'nonexistent_type');

      assert.deepStrictEqual(results, []);
    });

    it('should find root node if it matches type', () => {
      const tree = createSimpleTree();
      const programs = TreeUtils.findNodesByType(tree, 'program');

      assert.strictEqual(programs.length, 1);
      assert.strictEqual(programs[0], tree);
    });

    it('should handle nodes without children', () => {
      const leaf = createNode('function_declaration', 'test');
      const results = TreeUtils.findNodesByType(leaf, 'function_declaration');

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0], leaf);
    });

    it('should handle empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);
      const results = TreeUtils.findNodesByType(
        nodeWithEmptyChildren,
        'function_declaration'
      );

      assert.deepStrictEqual(results, []);
    });

    it('should handle complex nested structures', () => {
      const tree = createComplexTree();
      const methods = TreeUtils.findNodesByType(tree, 'method_definition');

      assert.strictEqual(methods.length, 2);
      assert.deepStrictEqual(
        methods.map((m) => m.name),
        ['getUser', 'createUser']
      );
    });
  });

  describe('findNodesByName', () => {
    it('should find all nodes with a specific name', () => {
      const tree = createComplexTree();
      const parameters = TreeUtils.findNodesByName(tree, 'id');

      assert.strictEqual(parameters.length, 2);
      assert.strictEqual(parameters[0].type, 'property');
      assert.strictEqual(parameters[1].type, 'parameter');
    });

    it('should return empty array when no nodes match name', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.findNodesByName(tree, 'nonexistent');

      assert.deepStrictEqual(results, []);
    });

    it('should handle nodes without names (undefined)', () => {
      const tree = createNode('program', undefined, [
        createNode('statement_block', undefined),
      ]);
      const results = TreeUtils.findNodesByName(tree, 'undefined');

      assert.deepStrictEqual(results, []);
    });

    it('should find root node if name matches', () => {
      const tree = createNode('function_declaration', 'testFunction');
      const results = TreeUtils.findNodesByName(tree, 'testFunction');

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0], tree);
    });

    it('should be case sensitive', () => {
      const tree = createNode('class_declaration', 'MyClass');
      const results = TreeUtils.findNodesByName(tree, 'myclass');

      assert.deepStrictEqual(results, []);
    });
  });

  describe('filterNodes', () => {
    it('should filter nodes by predicate', () => {
      const tree = createComplexTree();
      const predicate: NodePredicate = (node) =>
        node.type === 'method_definition';
      const results = TreeUtils.filterNodes(tree, predicate);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(
        results.every((node) => node.type === 'method_definition'),
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

      assert.deepStrictEqual(calls[0], { depth: 0, hasParent: false }); // root
      assert.deepStrictEqual(calls[1], { depth: 1, hasParent: true }); // first child
      assert.strictEqual(
        calls.some((call) => call.depth === 2),
        true
      ); // nested child
    });

    it('should handle empty results', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = () => false;
      const results = TreeUtils.filterNodes(tree, predicate);

      assert.deepStrictEqual(results, []);
    });

    it('should include all nodes when predicate always returns true', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = () => true;
      const results = TreeUtils.filterNodes(tree, predicate);

      const totalNodes = TreeUtils.countNodes(tree);
      assert.strictEqual(results.length, totalNodes);
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

      assert.strictEqual(results.length, 6);
      assert.strictEqual(visited[0], 'program:unnamed');
      assert.ok(visited.includes('function_declaration:foo'));
      assert.ok(visited.includes('class_declaration:Bar'));
    });

    it('should handle visitor returning undefined', () => {
      const tree = createSimpleTree();
      let callCount = 0;

      const visitor: TreeVisitor<string> = () => {
        callCount++;
        return undefined as any;
      };

      const results = TreeUtils.traverseTree(tree, visitor);

      assert.ok(callCount > 0);
      assert.deepStrictEqual(results, []);
    });

    it('should pass correct depth and parent to visitor', () => {
      const tree = createSimpleTree();
      const calls: Array<{ depth: number; parentType?: string }> = [];

      const visitor: TreeVisitor<void> = (node, depth, parent) => {
        calls.push({ depth, parentType: parent?.type });
      };

      TreeUtils.traverseTree(tree, visitor);

      assert.deepStrictEqual(calls[0], { depth: 0, parentType: undefined });
      assert.notStrictEqual(
        calls.find((call) => call.depth === 1 && call.parentType === 'program'),
        undefined
      );
      assert.notStrictEqual(
        calls.find(
          (call) => call.depth === 2 && call.parentType === 'class_declaration'
        ),
        undefined
      );
    });
  });

  describe('getNodeDepth', () => {
    it('should return correct depth for existing nodes', () => {
      const tree = createSimpleTree();
      const classNode = tree.children![1]; // Bar class
      const methodNode = classNode.children![0]; // constructor method

      assert.strictEqual(TreeUtils.getNodeDepth(tree, tree), 0);
      assert.strictEqual(TreeUtils.getNodeDepth(tree, classNode), 1);
      assert.strictEqual(TreeUtils.getNodeDepth(tree, methodNode), 2);
    });

    it('should return null for non-existent nodes', () => {
      const tree = createSimpleTree();
      const otherNode = createNode('other', 'test');

      assert.strictEqual(TreeUtils.getNodeDepth(tree, otherNode), null);
    });

    it('should handle deep nesting', () => {
      const tree = createDeepTree(5);
      let currentNode = tree;

      for (let i = 0; i <= 5; i++) {
        assert.strictEqual(TreeUtils.getNodeDepth(tree, currentNode), i);
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
      assert.strictEqual(leaves.length, 4);
      assert.ok(leaves.map((leaf) => leaf.name).includes('foo'));
      assert.ok(leaves.map((leaf) => leaf.name).includes('constructor'));
      assert.ok(leaves.map((leaf) => leaf.name).includes('getValue'));
      assert.ok(leaves.map((leaf) => leaf.name).includes('x'));
    });

    it('should return the node itself if it has no children', () => {
      const leaf = createNode('function_declaration', 'test');
      const leaves = TreeUtils.getAllLeaves(leaf);

      assert.strictEqual(leaves.length, 1);
      assert.strictEqual(leaves[0], leaf);
    });

    it('should handle empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);
      const leaves = TreeUtils.getAllLeaves(nodeWithEmptyChildren);

      assert.strictEqual(leaves.length, 1);
      assert.strictEqual(leaves[0], nodeWithEmptyChildren);
    });

    it('should handle complex tree structures', () => {
      const tree = createComplexTree();
      const leaves = TreeUtils.getAllLeaves(tree);

      // All nodes without children should be returned
      assert.ok(leaves.length > 0);
      leaves.forEach((leaf) => {
        assert.strictEqual(
          leaf.children === undefined || leaf.children.length === 0,
          true
        );
      });
    });
  });

  describe('getMaxDepth', () => {
    it('should return correct maximum depth', () => {
      const tree = createSimpleTree();
      const maxDepth = TreeUtils.getMaxDepth(tree);

      assert.strictEqual(maxDepth, 3); // program -> class -> method
    });

    it('should return 1 for leaf nodes', () => {
      const leaf = createNode('function_declaration', 'test');
      const maxDepth = TreeUtils.getMaxDepth(leaf);

      assert.strictEqual(maxDepth, 1);
    });

    it('should handle deep nesting', () => {
      const tree = createDeepTree(10);
      const maxDepth = TreeUtils.getMaxDepth(tree);

      assert.strictEqual(maxDepth, 11); // 10 levels + root
    });

    it('should handle empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);
      const maxDepth = TreeUtils.getMaxDepth(nodeWithEmptyChildren);

      assert.strictEqual(maxDepth, 1);
    });
  });

  describe('getNodesAtDepth', () => {
    it('should return nodes at specific depth', () => {
      const tree = createSimpleTree();

      const depthZero = TreeUtils.getNodesAtDepth(tree, 0);
      assert.strictEqual(depthZero.length, 1);
      assert.strictEqual(depthZero[0], tree);

      const depthOne = TreeUtils.getNodesAtDepth(tree, 1);
      assert.strictEqual(depthOne.length, 3); // foo, Bar, x

      const depthTwo = TreeUtils.getNodesAtDepth(tree, 2);
      assert.strictEqual(depthTwo.length, 2); // constructor, getValue
    });

    it('should return empty array for non-existent depth', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.getNodesAtDepth(tree, 10);

      assert.deepStrictEqual(results, []);
    });

    it('should handle negative depth', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.getNodesAtDepth(tree, -1);

      assert.deepStrictEqual(results, []);
    });

    it('should work with custom currentDepth parameter', () => {
      const tree = createSimpleTree();
      const results = TreeUtils.getNodesAtDepth(tree, 5, 5); // target=5, current=5

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0], tree);
    });
  });

  describe('hasChildren', () => {
    it('should return true for nodes with children', () => {
      const nodeWithChildren = createNode('program', undefined, [
        createNode('function_declaration', 'test'),
      ]);

      assert.strictEqual(TreeUtils.hasChildren(nodeWithChildren), true);
    });

    it('should return false for nodes without children', () => {
      const leaf = createNode('function_declaration', 'test');

      assert.strictEqual(TreeUtils.hasChildren(leaf), false);
    });

    it('should return false for nodes with empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);

      assert.strictEqual(TreeUtils.hasChildren(nodeWithEmptyChildren), false);
    });

    it('should return false for nodes with undefined children', () => {
      const node = createNode('function_declaration', 'test');
      node.children = undefined;

      assert.strictEqual(TreeUtils.hasChildren(node), false);
    });
  });

  describe('isLeaf', () => {
    it('should return true for leaf nodes', () => {
      const leaf = createNode('function_declaration', 'test');

      assert.strictEqual(TreeUtils.isLeaf(leaf), true);
    });

    it('should return false for nodes with children', () => {
      const nodeWithChildren = createNode('program', undefined, [
        createNode('function_declaration', 'test'),
      ]);

      assert.strictEqual(TreeUtils.isLeaf(nodeWithChildren), false);
    });

    it('should return true for nodes with empty children array', () => {
      const nodeWithEmptyChildren = createNode('program', undefined, []);

      assert.strictEqual(TreeUtils.isLeaf(nodeWithEmptyChildren), true);
    });

    it('should be opposite of hasChildren', () => {
      const nodes = [
        createNode('function_declaration', 'test'),
        createNode('program', undefined, []),
        createNode('class', undefined, [createNode('method', 'test')]),
      ];

      nodes.forEach((node) => {
        assert.strictEqual(
          TreeUtils.isLeaf(node),
          !TreeUtils.hasChildren(node)
        );
      });
    });
  });

  describe('findFirst', () => {
    it('should return first matching node using depth-first search', () => {
      const tree = createComplexTree();
      const predicate: NodePredicate = (node) =>
        node.type === 'method_definition';
      const result = TreeUtils.findFirst(tree, predicate);

      assert.ok(result);
      assert.strictEqual(result!.type, 'method_definition');
      assert.strictEqual(result!.name, 'getUser'); // Should be first one found
    });

    it('should return null when no node matches', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = (node) =>
        node.type === 'nonexistent_type';
      const result = TreeUtils.findFirst(tree, predicate);

      assert.strictEqual(result, null);
    });

    it('should return root node if it matches', () => {
      const tree = createSimpleTree();
      const predicate: NodePredicate = (node) => node.type === 'program';
      const result = TreeUtils.findFirst(tree, predicate);

      assert.strictEqual(result, tree);
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

      assert.ok(predicateCall);
      assert.strictEqual(predicateCall!.depth, 1);
      assert.strictEqual(predicateCall!.parent?.type, 'program');
    });
  });

  describe('getPath', () => {
    it('should return path from root to target node', () => {
      const tree = createSimpleTree();
      const classNode = tree.children![1];
      const methodNode = classNode.children![0];

      const path = TreeUtils.getPath(tree, methodNode);

      assert.strictEqual(path!.length, 3);
      assert.strictEqual(path![0], tree);
      assert.strictEqual(path![1], classNode);
      assert.strictEqual(path![2], methodNode);
    });

    it('should return single-node path for root', () => {
      const tree = createSimpleTree();
      const path = TreeUtils.getPath(tree, tree);

      assert.strictEqual(path!.length, 1);
      assert.strictEqual(path![0], tree);
    });

    it('should return null for non-existent node', () => {
      const tree = createSimpleTree();
      const otherNode = createNode('other', 'test');
      const path = TreeUtils.getPath(tree, otherNode);

      assert.strictEqual(path, null);
    });

    it('should work with deep nesting', () => {
      const tree = createDeepTree(5);
      let deepestNode = tree;

      // Navigate to the deepest node
      while (deepestNode.children && deepestNode.children.length > 0) {
        deepestNode = deepestNode.children[0];
      }

      const path = TreeUtils.getPath(tree, deepestNode);

      assert.strictEqual(path!.length, 6); // root + 5 levels
      assert.strictEqual(path![0], tree);
      assert.strictEqual(path![path!.length - 1], deepestNode);
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

      assert.strictEqual(result.type, 'PROGRAM');
      assert.ok('mapped' in result);
      assert.strictEqual((result as any).mapped, true);
      assert.ok('children' in result);
    });

    it('should preserve tree structure when mapping to similar objects', () => {
      const tree = createSimpleTree();

      const mapper = (node: NodeInfo) => ({
        ...node,
        transformed: true,
      });

      const result = TreeUtils.mapTree(tree, mapper);

      assert.ok('children' in result);
      // Type guard to ensure children exists and is an array
      if ('children' in result && Array.isArray(result.children)) {
        assert.strictEqual(result.children.length, 3);
        assert.ok('transformed' in result.children[0]);
        assert.strictEqual((result.children[0] as any).transformed, true);
        assert.ok('children' in result.children[1]);
        // Additional type guard for nested children
        const secondChild = result.children[1];
        if ('children' in secondChild && Array.isArray(secondChild.children)) {
          assert.strictEqual(secondChild.children.length, 2);
        } else {
          assert.fail('Second child should have children array');
        }
      } else {
        assert.fail('Result should have children array');
      }
    });

    it('should handle non-object return values', () => {
      const tree = createSimpleTree();

      const mapper = (node: NodeInfo) => node.type;

      const result = TreeUtils.mapTree(tree, mapper);

      assert.strictEqual(result, 'program');
      assert.strictEqual(typeof result, 'string');
    });

    it('should pass correct depth and parent to mapper', () => {
      const tree = createSimpleTree();
      const calls: Array<{ depth: number; hasParent: boolean }> = [];

      const mapper = (node: NodeInfo, depth: number, parent?: NodeInfo) => {
        calls.push({ depth, hasParent: parent !== undefined });
        return node;
      };

      TreeUtils.mapTree(tree, mapper);

      assert.deepStrictEqual(calls[0], { depth: 0, hasParent: false });
      assert.notStrictEqual(
        calls.find((call) => call.depth === 1 && call.hasParent),
        undefined
      );
      assert.notStrictEqual(
        calls.find((call) => call.depth === 2 && call.hasParent),
        undefined
      );
    });
  });

  describe('cloneTree', () => {
    it('should create deep copy of the tree', () => {
      const tree = createSimpleTree();
      const clone = TreeUtils.cloneTree(tree);

      assertVitestEqual(clone, tree);
      assert.notStrictEqual(clone, tree);
      assert.notStrictEqual(clone.children, tree.children);
    });

    it('should clone all nested children', () => {
      const tree = createComplexTree();
      const clone = TreeUtils.cloneTree(tree);

      // Verify structure is the same
      assert.strictEqual(clone.children!.length, tree.children!.length);

      // Verify objects are different instances
      assert.notStrictEqual(clone.children![0], tree.children![0]);
      assert.notStrictEqual(
        clone.children![2].children![0],
        tree.children![2].children![0]
      );
    });

    it('should handle nodes without children', () => {
      const leaf = createNode('function_declaration', 'test');
      const clone = TreeUtils.cloneTree(leaf);

      assertVitestEqual(clone, leaf);
      assert.notStrictEqual(clone, leaf);
    });

    it('should handle nodes with undefined name', () => {
      const node = createNode('program');
      const clone = TreeUtils.cloneTree(node);

      assert.strictEqual(clone.name, undefined);
      assertVitestEqual(clone, node);
      assert.notStrictEqual(clone, node);
    });

    it('should clone position objects', () => {
      const tree = createNode('test', 'name');
      tree.start = { row: 1, column: 2 };
      tree.end = { row: 3, column: 4 };

      const clone = TreeUtils.cloneTree(tree);

      assert.deepStrictEqual(clone.start, tree.start);
      assert.notStrictEqual(clone.start, tree.start);
      assert.deepStrictEqual(clone.end, tree.end);
      assert.notStrictEqual(clone.end, tree.end);
    });

    it('should handle empty children array', () => {
      const node = createNode('program', undefined, []);
      const clone = TreeUtils.cloneTree(node);

      assert.deepStrictEqual(clone.children, []);
      assert.notStrictEqual(clone.children, node.children);
    });
  });

  // Edge cases and performance tests
  describe('Edge Cases', () => {
    it('should handle extremely deep trees efficiently', () => {
      const startTime = performance.now();
      const tree = createDeepTree(100); // Very deep but linear
      const leaves = TreeUtils.getAllLeaves(tree);
      const endTime = performance.now();

      assert.ok(endTime - startTime < 50); // Should be fast
      assert.strictEqual(leaves.length, 1);
    });

    it('should handle wide trees efficiently', () => {
      const startTime = performance.now();
      const children = Array.from({ length: 1000 }, (_, i) =>
        createNode('function_declaration', `func${i}`)
      );
      const tree = createNode('program', undefined, children);

      const functions = TreeUtils.findNodesByType(tree, 'function_declaration');
      const endTime = performance.now();

      assert.ok(endTime - startTime < 50); // Should be fast
      assert.strictEqual(functions.length, 1000);
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
      assert.strictEqual(allNodes.length, 5); // program + 3 direct children + 1 method
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

      assert.ok(endTime - startTime < 20);
      assertVitestEqual(clone, complexTree);
    });
  });
});
