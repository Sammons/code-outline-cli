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
});
