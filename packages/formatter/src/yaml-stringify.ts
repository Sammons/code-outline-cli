// Hand-rolled YAML serializer for the closed output shape this package emits:
// Array<{file, absolutePath, outline: NodeInfo & {file?}}>. Not a general-purpose
// YAML writer — see FROZEN-DESIGN.md Unit A for the quoting rules this must match.

// Characters that force quoting when they START a scalar. YAML gives each of
// these a special meaning in that position, so an unquoted value beginning with
// one either changes meaning or fails to parse.
//
// `#` and `,` are load-bearing: a filename like "utils #2.ts" silently
// truncates at the comment marker, and ",comma.ts" produces YAML that a real
// parser rejects outright. Both are legal filenames on every supported
// platform, so both reach this code from ordinary use.
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
  '#',
  ',',
  '?',
  ':',
  "'",
  '"',
]);

// YAML 1.2 core schema resolves these to booleans or null regardless of case,
// so a string that happens to match must be quoted to survive a round-trip.
const RESERVED_WORDS = new Set([
  'true',
  'false',
  'null',
  '~',
  '.inf',
  '-.inf',
  '+.inf',
  '.nan',
]);

// Anything a YAML parser would resolve as a number rather than a string:
// decimal, float, exponent, hex, octal, and binary.
const NUMERIC_LOOKING =
  /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$|^[+-]?0x[0-9a-fA-F]+$|^[+-]?0o[0-7]+$|^[+-]?0b[01]+$/;

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
  if (RESERVED_WORDS.has(value.toLowerCase())) {
    return true;
  }
  if (isNumericLooking(value)) {
    return true;
  }
  // Leading or trailing whitespace is stripped by a plain scalar.
  if (value !== value.trim()) {
    return true;
  }
  // A colon followed by ANY whitespace opens a mapping, and a trailing colon
  // makes the value look like a key. Tab counts as whitespace here, not just
  // space -- "X:\tX" parses as a nested mapping.
  if (/:\s/.test(value) || value.endsWith(':')) {
    return true;
  }
  // A "#" preceded by ANY whitespace starts a comment, discarding the rest of
  // the line. Again tab counts: "X\t#" truncates just like "X #".
  if (/\s#/.test(value)) {
    return true;
  }
  // Any control character (tab included) is safer double-quoted than plain.
  // Checked by code point rather than a regex class: a literal control-char
  // range in a pattern is exactly what `no-control-regex` exists to catch.
  const hasControlChar = [...value].some((char) => {
    if (char === '\n') {
      return false;
    }
    const code = char.codePointAt(0)!;
    return code < 0x20 || code === 0x7f;
  });
  if (hasControlChar) {
    return true;
  }
  // A carriage return would corrupt the line structure.
  if (value.includes('\r')) {
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
  // "- " (or "-" plus any whitespace) reads as a nested sequence entry.
  if (first === '-' && /\s/.test(value[1] ?? '')) {
    return true;
  }
  if (value === '-') {
    return true;
  }
  // A document marker at the start of a line ends the current document.
  if (value === '---' || value === '...') {
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
    } else if (ch === '\n') {
      out += '\\n';
    } else if (ch === '\r') {
      out += '\\r';
    } else {
      out += ch;
    }
  }
  return `"${out}"`;
};

const scalarToString = (
  value: unknown,
  indent: string,
  key?: string
): string => {
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      // A block scalar can only carry lines that survive re-indentation. A
      // carriage return, or a line with leading/trailing spaces, does not:
      // the parser strips or rewrites it. Fall back to a double-quoted scalar
      // with escapes, which represents any string exactly.
      const lines = value.split('\n');
      const blockSafe =
        !value.includes('\r') &&
        lines.every((line) => line === line.trim() || line === '');
      if (blockSafe) {
        // `|-` strips every trailing newline, so a value ending in one needs
        // `|+` to keep it. Without this, "a\n" round-trips back as "a".
        const chomp = value.endsWith('\n') ? '+' : '-';
        const body = (chomp === '+' ? value.slice(0, -1) : value)
          .split('\n')
          .map((line) => `${indent}  ${line}`)
          .join('\n');
        return `|${chomp}\n${body}`;
      }
      return escapeDoubleQuoted(value);
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
  throw new Error(
    `Unsupported scalar value for key ${key ?? '?'}: ${String(value)}`
  );
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringifyValue = (
  value: unknown,
  indent: string,
  lines: string[]
): void => {
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

const stringifyArrayItem = (
  item: unknown,
  indent: string,
  lines: string[]
): void => {
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

const stringifyObject = (
  obj: Record<string, unknown>,
  indent: string,
  lines: string[]
): void => {
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
