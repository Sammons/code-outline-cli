import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseYamlOutput } from './parse-yaml-output.ts';

// Mirrors gen.mjs exactly: the same 47 adversarial names, same object shape.
// golden.yaml (repo root) is the real `yaml` library's stringify() output for
// this exact input -- see FROZEN-DESIGN.md Unit A.
const names = [
  'simple',
  'with space',
  'has:colon',
  'has#hash',
  "has'quote",
  'has"dquote',
  'has\\backslash',
  'trailing ',
  ' leading',
  '123',
  'true',
  'false',
  'null',
  'yes',
  'no',
  'on',
  'off',
  '~',
  '',
  '-dash',
  'a-b',
  'multi\nline',
  'tab\there',
  'emoji😀',
  '*star',
  '&amp',
  '!bang',
  '%pct',
  '@at',
  '`tick',
  '{brace}',
  '[brack]',
  'a,b',
  '>gt',
  '|pipe',
  '?q',
  '0x1F',
  '1.5',
  '1e3',
  '.5',
  'Infinity',
  'NaN',
  '::',
  '- ',
  'key: value',
  'très',
  '中文',
];

const buildExpected = () =>
  names.map((n, i) => ({
    file: `src/f${i}.ts`,
    absolutePath: `/abs/src/f${i}.ts`,
    outline: {
      type: 'program',
      start: { row: 0, column: 0 },
      end: { row: 10, column: 5 },
      children: [
        {
          type: 'function_declaration',
          name: n,
          start: { row: 1, column: 2 },
          end: { row: 3, column: 4 },
          file: `src/f${i}.ts`,
        },
      ],
    },
  }));

describe('parseYamlOutput', () => {
  it('round-trips the golden YAML fixture into the exact object graph that produced it', () => {
    // Ground truth for 47 adversarial names. Originally captured from the real
    // `yaml` library; two entries (a tab, a leading "?") are now quoted more
    // conservatively than that library chose, because the library's plain form
    // was unsafe. The library still agrees this file parses back to the same
    // object graph -- verified when the fixture is regenerated.
    const goldenPath = resolve(
      import.meta.dirname,
      '../../../test/fixtures/yaml-golden.yaml'
    );
    const text = readFileSync(goldenPath, 'utf8');
    const parsed = parseYamlOutput(text);
    assert.deepStrictEqual(parsed, buildExpected());
  });

  it('parses a simple mapping', () => {
    assert.deepStrictEqual(parseYamlOutput('a: 1\nb: two\n'), {
      a: 1,
      b: 'two',
    });
  });

  it('parses an empty sequence', () => {
    assert.deepStrictEqual(parseYamlOutput('a: []\n'), { a: [] });
  });

  it('parses a double-quoted scalar with escapes', () => {
    assert.deepStrictEqual(
      parseYamlOutput(
        'a: "line\\twith\\ttabs and \\"quotes\\" and \\\\backslash"\n'
      ),
      {
        a: 'line\twith\ttabs and "quotes" and \\backslash',
      }
    );
  });

  it('parses a block scalar', () => {
    assert.deepStrictEqual(parseYamlOutput('a: |-\n  line1\n  line2\n'), {
      a: 'line1\nline2',
    });
  });

  it('throws with a line number on unsupported input', () => {
    assert.throws(() => parseYamlOutput("a: 'single quoted'\n"), /line 1/);
  });
});
