// Hand-rolled YAML serializer for the closed output shape this package emits:
// Array<{file, absolutePath, outline: NodeInfo & {file?}}>. Not a general-purpose
// YAML writer — see FROZEN-DESIGN.md Unit A for the quoting rules this must match.

// Exact indicator set from FROZEN-DESIGN.md: "* & ! % @ ` { } [ ] > | ~" at
// the start of a scalar forces quoting. `:` and `?` are handled separately
// (only unsafe with a trailing space or at end-of-string), and `-`/`- ` has
// its own dedicated check below.
const INDICATOR_START_CHARS = new Set([
  '*',
  '&',
  '!',
  '%',
  '@',
  '`',
  '{',
  '}',
  '[',
  ']',
  '>',
  '|',
  '~',
]);

const RESERVED_WORDS = new Set(['true', 'false', 'null']);

const NUMERIC_LOOKING = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$|^0x[0-9a-fA-F]+$/;

const isNumericLooking = (value: string): boolean => {
  if (value === 'Infinity' || value === 'NaN' || value === '-Infinity') {
    return false;
  }
  return NUMERIC_LOOKING.test(value);
};

const needsQuoting = (value: string): boolean => {
  if (value === '') {
    return true;
  }
  if (RESERVED_WORDS.has(value)) {
    return true;
  }
  if (isNumericLooking(value)) {
    return true;
  }
  if (value !== value.trim()) {
    return true;
  }
  if (value.includes(': ') || value.endsWith(':')) {
    return true;
  }
  if (value.includes('\n')) {
    // Handled separately via block scalar; caller checks this first.
    return false;
  }
  const first = value[0]!;
  if (INDICATOR_START_CHARS.has(first)) {
    return true;
  }
  if (first === '-' && value[1] === ' ') {
    return true;
  }
  if (value === '-') {
    return true;
  }
  return false;
};

const escapeDoubleQuoted = (value: string): string => {
  let out = '';
  for (const ch of value) {
    if (ch === '\\') {
      out += '\\\\';
    } else if (ch === '"') {
      out += '\\"';
    } else if (ch === '\t') {
      out += '\\t';
    } else {
      out += ch;
    }
  }
  return `"${out}"`;
};

const scalarToString = (value: unknown, indent: string, key?: string): string => {
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      const lines = value.split('\n');
      const blockIndent = `${indent}  `;
      const body = lines.map((line) => `${blockIndent}${line}`).join('\n');
      return `|-\n${body}`;
    }
    if (needsQuoting(value)) {
      return escapeDoubleQuoted(value);
    }
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  throw new Error(`Unsupported scalar value for key ${key ?? '?'}: ${String(value)}`);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringifyValue = (value: unknown, indent: string, lines: string[]): void => {
  if (Array.isArray(value)) {
    for (const item of value) {
      stringifyArrayItem(item, indent, lines);
    }
    return;
  }
  if (isPlainObject(value)) {
    stringifyObject(value, indent, lines);
    return;
  }
  throw new Error('stringifyValue expects an object or array at the top level');
};

const stringifyArrayItem = (item: unknown, indent: string, lines: string[]): void => {
  if (isPlainObject(item)) {
    const entries = Object.entries(item).filter(([, v]) => v !== undefined);
    entries.forEach(([key, value], index) => {
      // The first key of a list-item object rides on the "- " line; every
      // subsequent key of that same object indents as if "- " were spaces.
      const linePrefix = index === 0 ? `${indent}- ` : `${indent}  `;
      appendEntry(key, value, `${indent}  `, linePrefix, lines);
    });
    return;
  }
  if (Array.isArray(item)) {
    // Not exercised by this package's shape, but kept for completeness.
    lines.push(`${indent}-`);
    stringifyValue(item, `${indent}  `, lines);
    return;
  }
  const rendered = scalarToString(item, indent);
  lines.push(`${indent}- ${rendered}`);
};

const stringifyObject = (obj: Record<string, unknown>, indent: string, lines: string[]): void => {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  for (const [key, value] of entries) {
    appendEntry(key, value, indent, `${indent}`, lines);
  }
};

// `indent` = indentation for this key's children (map/seq bodies).
// `linePrefix` = the exact text before the key on this key's own line —
// normally equal to `indent`, but "- " for the first key of a list item.
const appendEntry = (
  key: string,
  value: unknown,
  indent: string,
  linePrefix: string,
  lines: string[]
): void => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${linePrefix}${key}: []`);
      return;
    }
    lines.push(`${linePrefix}${key}:`);
    // A sequence nested under a mapping key indents its "- " markers one
    // level deeper than the key (unlike a root-level sequence, which does not).
    for (const item of value) {
      stringifyArrayItem(item, `${indent}  `, lines);
    }
    return;
  }
  if (isPlainObject(value)) {
    lines.push(`${linePrefix}${key}:`);
    stringifyObject(value, `${indent}  `, lines);
    return;
  }
  const rendered = scalarToString(value, indent, key);
  lines.push(`${linePrefix}${key}: ${rendered}`);
};

export const stringifyYaml = (value: unknown): string => {
  const lines: string[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      stringifyArrayItem(item, '', lines);
    }
  } else if (isPlainObject(value)) {
    stringifyObject(value, '', lines);
  } else {
    lines.push(scalarToString(value, ''));
  }
  return `${lines.join('\n')}\n`;
};
