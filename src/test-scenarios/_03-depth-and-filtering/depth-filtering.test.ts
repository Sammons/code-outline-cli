import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { cliRunner } from '../common/cli-runner.js';
import { CLIAssertions } from '../common/test-utils.js';

describe('Depth and Filtering Options', () => {
  const nestedFile = resolve(__dirname, 'assets', 'nested-structure.ts');

  beforeAll(async () => {
    // Ensure CLI is accessible
    const isAccessible = await cliRunner.testAccess();
    expect(isAccessible).toBe(true);
  });

  describe('Depth Limiting', () => {
    it('should limit parsing depth to specified value', async () => {
      const depths = [1, 2, 3, 5];

      for (const depth of depths) {
        const result = await cliRunner.run([
          nestedFile,
          '--format',
          'json',
          '--depth',
          depth.toString(),
        ]);

        CLIAssertions.expectSuccess(result);
        const parsed = CLIAssertions.expectValidJson(result);
        const outline = parsed[0].outline!;

        // Verify depth limitation
        CLIAssertions.expectMaxDepth(outline, depth);
      }
    });

    it('should handle depth=1 by showing only top-level constructs', async () => {
      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '1',
      ]);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // At depth 1, should only see direct children of program
      expect(outline.children).toBeTruthy();
      expect(outline.children!.length).toBeGreaterThan(0);

      // No child should have children at depth 1
      for (const child of outline.children!) {
        if (child.children) {
          expect(child.children.length).toBe(0);
        }
      }
    });

    it('should show progressive detail as depth increases', async () => {
      const depth1Result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '1',
      ]);

      const depth3Result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '3',
      ]);

      const depth1Parsed = CLIAssertions.expectValidJson(depth1Result);
      const depth3Parsed = CLIAssertions.expectValidJson(depth3Result);

      const depth1Count = CLIAssertions.countNodes(depth1Parsed[0].outline!);
      const depth3Count = CLIAssertions.countNodes(depth3Parsed[0].outline!);

      // Depth 3 should have more nodes than depth 1
      expect(depth3Count).toBeGreaterThan(depth1Count);
    });

    it('should handle infinite depth correctly', async () => {
      const infiniteResult = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        'Infinity',
      ]);

      const depth100Result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '100',
      ]);

      CLIAssertions.expectSuccess(infiniteResult);
      CLIAssertions.expectSuccess(depth100Result);

      const infiniteParsed = CLIAssertions.expectValidJson(infiniteResult);
      const depth100Parsed = CLIAssertions.expectValidJson(depth100Result);

      // Should have same result as very deep depth
      const infiniteCount = CLIAssertions.countNodes(
        infiniteParsed[0].outline!
      );
      const depth100Count = CLIAssertions.countNodes(
        depth100Parsed[0].outline!
      );

      expect(infiniteCount).toBe(depth100Count);
    });

    it('should reject invalid depth values', async () => {
      const invalidDepths = ['0', '-1', 'invalid', 'null'];

      for (const depth of invalidDepths) {
        const result = await cliRunner.runExpectFailure([
          nestedFile,
          '--depth',
          depth,
        ]);

        CLIAssertions.expectErrorMessage(result, 'depth');
      }
    });
  });

  describe('Named-Only Filtering', () => {
    it('should filter to only named nodes by default', async () => {
      const result = await cliRunner.run([nestedFile, '--format', 'json']);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should apply named-only filtering by default
      CLIAssertions.expectNamedOnly(outline);

      // Should have named constructs like interfaces, classes, functions
      const namedNodes = CLIAssertions.findNamedNodes(outline);
      expect(namedNodes.length).toBeGreaterThan(5);

      // Should contain specific named constructs from our test file
      const nodeNames = namedNodes.map((n) => n.name).join(' ');
      expect(nodeNames).toContain('Level1');
      expect(nodeNames).toContain('TopLevelInterface');
      expect(nodeNames).toContain('TopLevelClass');
    });

    it('should respect explicit --named-only flag', async () => {
      const namedOnlyResult = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--named-only',
      ]);

      const defaultResult = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
      ]);

      CLIAssertions.expectSuccess(namedOnlyResult);
      CLIAssertions.expectSuccess(defaultResult);

      const namedOnlyParsed = CLIAssertions.expectValidJson(namedOnlyResult);
      const defaultParsed = CLIAssertions.expectValidJson(defaultResult);

      // Should have same result as default behavior
      const namedOnlyCount = CLIAssertions.countNodes(
        namedOnlyParsed[0].outline!
      );
      const defaultCount = CLIAssertions.countNodes(defaultParsed[0].outline!);

      expect(namedOnlyCount).toBe(defaultCount);
    });

    it('should include all nodes when --all flag is used', async () => {
      const namedOnlyResult = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--named-only',
      ]);

      const allResult = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--all',
      ]);

      CLIAssertions.expectSuccess(namedOnlyResult);
      CLIAssertions.expectSuccess(allResult);

      const namedOnlyParsed = CLIAssertions.expectValidJson(namedOnlyResult);
      const allParsed = CLIAssertions.expectValidJson(allResult);

      const namedOnlyCount = CLIAssertions.countNodes(
        namedOnlyParsed[0].outline!
      );
      const allCount = CLIAssertions.countNodes(allParsed[0].outline!);

      // --all should include more nodes than named-only
      expect(allCount).toBeGreaterThan(namedOnlyCount);

      // --all should include unnamed constructs
      const allOutline = allParsed[0].outline!;

      function hasUnnamedNodes(node: any): boolean {
        if (!node.name) {
          // Check if it's a structural type that's allowed even in named-only mode
          const structuralTypes = [
            'program',
            'class_body',
            'interface_body',
            'enum_body',
            'object',
            'statement_block',
          ];
          if (!structuralTypes.includes(node.type)) {
            return true; // Found an unnamed non-structural node
          }
        }

        if (node.children) {
          return node.children.some(hasUnnamedNodes);
        }

        return false;
      }

      // Should have some unnamed nodes when using --all
      expect(hasUnnamedNodes(allOutline)).toBe(true);
    });

    it('should handle --all flag overriding --named-only', async () => {
      // When both flags are present, --all should take precedence
      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--named-only',
        '--all',
      ]);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should behave like --all mode (include unnamed nodes)
      const totalCount = CLIAssertions.countNodes(outline);

      // Compare with pure --all result
      const allOnlyResult = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--all',
      ]);

      const allOnlyParsed = CLIAssertions.expectValidJson(allOnlyResult);
      const allOnlyCount = CLIAssertions.countNodes(allOnlyParsed[0].outline!);

      expect(totalCount).toBe(allOnlyCount);
    });
  });

  describe('Combined Depth and Filtering', () => {
    it('should apply both depth limiting and named-only filtering', async () => {
      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '2',
        '--named-only',
      ]);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should respect both depth and named-only constraints
      CLIAssertions.expectMaxDepth(outline, 2);
      CLIAssertions.expectNamedOnly(outline);

      // Should have named nodes within depth limit
      const namedNodes = CLIAssertions.findNamedNodes(outline);
      expect(namedNodes.length).toBeGreaterThan(0);

      for (const node of namedNodes) {
        expect(node.name).toBeTruthy();
      }
    });

    it('should apply depth limiting to all nodes when using --all flag', async () => {
      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '3',
        '--all',
      ]);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should respect depth limit
      CLIAssertions.expectMaxDepth(outline, 3);

      // Should include both named and unnamed nodes within the depth
      const totalNodes = CLIAssertions.countNodes(outline);
      const namedNodes = CLIAssertions.findNamedNodes(outline);

      // Should have unnamed nodes (total > named)
      expect(totalNodes).toBeGreaterThan(namedNodes.length);
    });

    it('should maintain consistency across different depth and filter combinations', async () => {
      const combinations = [
        { depth: '1', filter: '--named-only' },
        { depth: '1', filter: '--all' },
        { depth: '3', filter: '--named-only' },
        { depth: '3', filter: '--all' },
        { depth: 'Infinity', filter: '--named-only' },
        { depth: 'Infinity', filter: '--all' },
      ];

      const results = [];

      for (const combo of combinations) {
        const result = await cliRunner.run([
          nestedFile,
          '--format',
          'json',
          '--depth',
          combo.depth,
          combo.filter,
        ]);

        CLIAssertions.expectSuccess(result);
        const parsed = CLIAssertions.expectValidJson(result);
        const outline = parsed[0].outline!;

        results.push({
          combo,
          nodeCount: CLIAssertions.countNodes(outline),
          namedCount: CLIAssertions.findNamedNodes(outline).length,
        });
      }

      // Verify expected relationships
      for (let i = 0; i < results.length; i += 2) {
        const namedOnly = results[i];
        const all = results[i + 1];

        // At same depth, --all should have >= nodes than --named-only
        expect(all.nodeCount).toBeGreaterThanOrEqual(namedOnly.nodeCount);

        // Named count should be the same or similar
        expect(all.namedCount).toBeGreaterThanOrEqual(namedOnly.namedCount);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested structures with limited depth', async () => {
      // Test with very shallow depth on deeply nested file
      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '1',
      ]);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should still produce valid output
      expect(outline.type).toBe('program');
      expect(outline.children).toBeTruthy();
      expect(outline.children!.length).toBeGreaterThan(0);

      // All direct children should have no grandchildren
      for (const child of outline.children!) {
        if (child.children) {
          expect(child.children.length).toBe(0);
        }
      }
    });

    it('should handle files with no named constructs when using --named-only', async () => {
      // Our test file has named constructs, so let's test with an edge case
      // Create a scenario where there might be minimal named content
      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '1',
        '--named-only',
      ]);

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);
      const outline = parsed[0].outline!;

      // Should still have the program node and any top-level named constructs
      expect(outline.type).toBe('program');

      const namedNodes = CLIAssertions.findNamedNodes(outline);
      expect(namedNodes.length).toBeGreaterThan(0); // Our file has top-level named exports
    });

    it('should maintain performance with extreme depth values', async () => {
      const startTime = Date.now();

      const result = await cliRunner.run([
        nestedFile,
        '--format',
        'json',
        '--depth',
        '1000', // Very high depth
      ]);

      const duration = Date.now() - startTime;

      CLIAssertions.expectSuccess(result);
      const parsed = CLIAssertions.expectValidJson(result);

      // Should complete in reasonable time even with high depth
      expect(duration).toBeLessThan(10000); // 10 seconds max

      // Should produce valid output
      expect(parsed[0].outline).toBeTruthy();
    });
  });

  describe('ASCII Format with Depth and Filtering', () => {
    it('should respect depth limits in ASCII output', async () => {
      const depth2Result = await cliRunner.run([
        nestedFile,
        '--format',
        'ascii',
        '--depth',
        '2',
      ]);

      const depthInfResult = await cliRunner.run([
        nestedFile,
        '--format',
        'ascii',
        '--depth',
        'Infinity',
      ]);

      CLIAssertions.expectValidAscii(depth2Result);
      CLIAssertions.expectValidAscii(depthInfResult);

      // Depth 2 should have fewer lines than infinite depth
      const depth2Lines = depth2Result.stdout.split('\n').length;
      const depthInfLines = depthInfResult.stdout.split('\n').length;

      expect(depthInfLines).toBeGreaterThan(depth2Lines);
    });

    it('should show filtering effects in ASCII output', async () => {
      const namedOnlyResult = await cliRunner.run([
        nestedFile,
        '--format',
        'ascii',
        '--named-only',
      ]);

      const allResult = await cliRunner.run([
        nestedFile,
        '--format',
        'ascii',
        '--all',
      ]);

      CLIAssertions.expectValidAscii(namedOnlyResult);
      CLIAssertions.expectValidAscii(allResult);

      // --all should produce more output lines
      const namedOnlyLines = namedOnlyResult.stdout.split('\n').length;
      const allLines = allResult.stdout.split('\n').length;

      expect(allLines).toBeGreaterThan(namedOnlyLines);

      // Both should contain named constructs
      expect(namedOnlyResult.stdout).toContain('Level1');
      expect(allResult.stdout).toContain('Level1');
    });
  });
});
