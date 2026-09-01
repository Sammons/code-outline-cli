import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stringifyYaml } from './yaml-stringify.ts';

describe('stringifyYaml', () => {
  it('renders a bare colon-space value quoted, but a colon without trailing space unquoted', () => {
    assert.strictEqual(
      stringifyYaml({ name: 'has:colon' }),
      'name: has:colon\n'
    );
    assert.strictEqual(
      stringifyYaml({ name: 'key: value' }),
      'name: "key: value"\n'
    );
    assert.strictEqual(stringifyYaml({ name: '::' }), 'name: "::"\n');
  });

  it('quotes true/false/null but leaves yes/no/on/off bare', () => {
    assert.strictEqual(stringifyYaml({ v: 'true' }), 'v: "true"\n');
    assert.strictEqual(stringifyYaml({ v: 'false' }), 'v: "false"\n');
    assert.strictEqual(stringifyYaml({ v: 'null' }), 'v: "null"\n');
    assert.strictEqual(stringifyYaml({ v: 'yes' }), 'v: yes\n');
    assert.strictEqual(stringifyYaml({ v: 'no' }), 'v: no\n');
    assert.strictEqual(stringifyYaml({ v: 'on' }), 'v: on\n');
    assert.strictEqual(stringifyYaml({ v: 'off' }), 'v: off\n');
  });

  it('quotes numeric-looking strings but leaves Infinity/NaN bare', () => {
    assert.strictEqual(stringifyYaml({ v: '123' }), 'v: "123"\n');
    assert.strictEqual(stringifyYaml({ v: '1.5' }), 'v: "1.5"\n');
    assert.strictEqual(stringifyYaml({ v: '1e3' }), 'v: "1e3"\n');
    assert.strictEqual(stringifyYaml({ v: '.5' }), 'v: ".5"\n');
    assert.strictEqual(stringifyYaml({ v: '0x1F' }), 'v: "0x1F"\n');
    assert.strictEqual(stringifyYaml({ v: 'Infinity' }), 'v: Infinity\n');
    assert.strictEqual(stringifyYaml({ v: 'NaN' }), 'v: NaN\n');
  });

  it('quotes the empty string as ""', () => {
    assert.strictEqual(stringifyYaml({ v: '' }), 'v: ""\n');
  });

  it('quotes leading/trailing whitespace but leaves interior whitespace bare', () => {
    assert.strictEqual(stringifyYaml({ v: 'trailing ' }), 'v: "trailing "\n');
    assert.strictEqual(stringifyYaml({ v: ' leading' }), 'v: " leading"\n');
    assert.strictEqual(stringifyYaml({ v: 'with space' }), 'v: with space\n');
  });

  it('renders embedded newlines as a literal block scalar (|-)', () => {
    const result = stringifyYaml({ v: 'multi\nline' });
    assert.strictEqual(result, 'v: |-\n  multi\n  line\n');
  });

  it('renders unicode content bare and byte-safe', () => {
    assert.strictEqual(stringifyYaml({ v: 'très' }), 'v: très\n');
    assert.strictEqual(stringifyYaml({ v: '中文' }), 'v: 中文\n');
    assert.strictEqual(stringifyYaml({ v: 'emoji😀' }), 'v: emoji😀\n');
  });

  it('serializes nested children arrays with correctly stepped indentation', () => {
    const value = {
      file: 'src/f0.ts',
      outline: {
        type: 'program',
        children: [
          { type: 'function_declaration', name: 'simple' },
          { type: 'function_declaration', name: 'other' },
        ],
      },
    };
    const expected = [
      'file: src/f0.ts',
      'outline:',
      '  type: program',
      '  children:',
      '    - type: function_declaration',
      '      name: simple',
      '    - type: function_declaration',
      '      name: other',
      '',
    ].join('\n');
    assert.strictEqual(stringifyYaml(value), expected);
  });

  it('does not indent a root-level sequence', () => {
    const value = [{ file: 'a.ts' }, { file: 'b.ts' }];
    assert.strictEqual(stringifyYaml(value), '- file: a.ts\n- file: b.ts\n');
  });

  // Regression tests. Each of these shipped BROKEN in an earlier revision:
  // the writer left the value unquoted, so a real YAML parser silently
  // truncated it, resolved it to the wrong type, or refused to parse at all.
  // A filename containing "#" or "," is legal on every supported platform, so
  // these reach the writer from ordinary use, not just fuzzing.
  describe('values a real YAML parser would misread if left unquoted', () => {
    const mustQuote: ReadonlyArray<readonly [string, string]> = [
      ['#hash.ts', 'leading # starts a comment'],
      ['utils #2.ts', 'space before # starts a comment'],
      ['utils\t#2.ts', 'tab before # also starts a comment'],
      [',comma.ts', 'leading , is a flow indicator and fails to parse'],
      ['?query.ts', 'leading ? opens a complex mapping key'],
      ['a: b', 'colon-space opens a mapping'],
      ['a:\tb', 'colon-tab also opens a mapping'],
      ['True', 'resolves to boolean true'],
      ['FALSE', 'resolves to boolean false'],
      ['Null', 'resolves to null'],
      ['~', 'resolves to null'],
      ['.inf', 'resolves to Infinity'],
      ['.nan', 'resolves to NaN'],
      ['0o17', 'resolves to octal 15'],
      ['0b101', 'resolves to binary 5'],
      ['0x1F', 'resolves to hex 31'],
      ['---', 'starts a new document'],
      ['...', 'ends the document'],
      ["'quoted'", 'leading quote is a quoting indicator'],
      ['"quoted"', 'leading quote is a quoting indicator'],
    ];

    for (const [value, why] of mustQuote) {
      it(`quotes ${JSON.stringify(value)} because ${why}`, () => {
        const emitted = stringifyYaml([{ file: value }]);
        const scalar = emitted.slice('- file: '.length).trimEnd();
        assert.ok(
          scalar.startsWith('"'),
          `expected a quoted scalar, got ${JSON.stringify(scalar)}`
        );
        assert.strictEqual(JSON.parse(scalar), value);
      });
    }
  });
});
