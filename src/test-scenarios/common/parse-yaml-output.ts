// Hand-rolled YAML parser for the CLOSED output shape our own `stringifyYaml`
// (packages/formatter/src/yaml-stringify.ts) emits. This is NOT a general-purpose
// YAML reader — it exists only to round-trip our own emitter's output back into
// a JS value for test assertions.
//
// Supported grammar (exactly what stringifyYaml can produce, nothing more):
//   - block mappings: `key: value`, nested by 2-space indent
//   - block sequences of mappings: `- key: value` (first key rides the dash line),
//     continuation keys at `  key: value` under the same indent as the dash's content
//   - plain scalars (unquoted)
//   - double-quoted scalars, with `\\`, `\"`, `\t` unescaping (the only escapes
//     `escapeDoubleQuoted` ever writes)
//   - block scalars introduced by `|-` (the only block-scalar form we emit)
//   - numeric-looking unquoted tokens -> JS number; everything else -> string
//     (there are no bare `true`/`false`/`null` tokens in our output shape --
//     those values are always quoted strings per `RESERVED_WORDS`, so an
//     unquoted `true`/`false`/`null` is never produced and is not parsed
//     specially here)
//
// Anything outside this grammar throws with the offending line number. A loud
// failure here is correct: this parser must never silently produce a wrong
// result for input it does not understand.

class YamlParseError extends Error {
  constructor(message: string, lineNumber: number) {
    super(`${message} (line ${lineNumber + 1})`);
    this.name = 'YamlParseError';
  }
}

const NUMERIC_LOOKING = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$|^0x[0-9a-fA-F]+$/;

const unescapeDoubleQuoted = (inner: string, lineNumber: number): string => {
  let out = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '\\') {
      const next = inner[i + 1];
      if (next === '\\') {
        out += '\\';
        i++;
      } else if (next === '"') {
        out += '"';
        i++;
      } else if (next === 't') {
        out += '\t';
        i++;
      } else {
        throw new YamlParseError(`Unsupported escape sequence "\\${next}" in double-quoted scalar`, lineNumber);
      }
    } else {
      out += ch;
    }
  }
  return out;
};

// Parses a scalar that appears after "key: " or "- key: " on a single line.
const parseScalar = (raw: string, lineNumber: number): unknown => {
  if (raw.length === 0) {
    throw new YamlParseError('Empty scalar (use "" for an empty string)', lineNumber);
  }
  if (raw[0] === '"') {
    if (raw[raw.length - 1] !== '"' || raw.length < 2) {
      throw new YamlParseError(`Unterminated double-quoted scalar: ${raw}`, lineNumber);
    }
    return unescapeDoubleQuoted(raw.slice(1, -1), lineNumber);
  }
  if (raw[0] === "'") {
    throw new YamlParseError('Single-quoted scalars are not supported (our writer never emits them)', lineNumber);
  }
  if (NUMERIC_LOOKING.test(raw)) {
    return Number(raw);
  }
  return raw;
};

interface Line {
  readonly indent: number;
  readonly content: string; // trimmed of leading indent, trailing whitespace kept out
  readonly lineNumber: number;
}

const tokenize = (text: string): Line[] => {
  const rawLines = text.split('\n');
  const lines: Line[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]!;
    if (rawLine.length === 0) {
      // Trailing newline produces one empty final split segment; skip blank lines.
      continue;
    }
    const match = /^( *)(.*)$/.exec(rawLine);
    if (!match) {
      throw new YamlParseError(`Could not tokenize line: ${JSON.stringify(rawLine)}`, i);
    }
    const indent = match[1]!.length;
    const content = match[2]!;
    lines.push({ indent, content, lineNumber: i });
  }
  return lines;
};

// Splits "key: rest" into [key, rest]. `rest` may be empty (value on following lines).
const splitKeyValue = (content: string, lineNumber: number): { key: string; rest: string } => {
  const colonIndex = content.indexOf(': ');
  if (colonIndex !== -1) {
    return { key: content.slice(0, colonIndex), rest: content.slice(colonIndex + 2) };
  }
  if (content.endsWith(':')) {
    return { key: content.slice(0, -1), rest: '' };
  }
  throw new YamlParseError(`Expected "key: value" or "key:" mapping entry, got: ${content}`, lineNumber);
};

// Reads a block scalar body ("|-" already consumed). Returns the joined string
// and the index of the first line NOT part of the block.
const readBlockScalar = (lines: Line[], startIndex: number, parentIndent: number): { value: string; nextIndex: number } => {
  const bodyLines: string[] = [];
  let i = startIndex;
  let blockIndent: number | null = null;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.indent <= parentIndent) {
      break;
    }
    if (blockIndent === null) {
      blockIndent = line.indent;
    }
    bodyLines.push(' '.repeat(line.indent - blockIndent) + line.content);
    i++;
  }
  if (bodyLines.length === 0) {
    throw new YamlParseError('Block scalar ("|-") has no body lines', lines[startIndex - 1]?.lineNumber ?? startIndex);
  }
  return { value: bodyLines.join('\n'), nextIndex: i };
};

// Parses a block mapping starting at `startIndex`, all lines sharing `mapIndent`.
// Returns the parsed object and the index of the first line not part of this mapping.
const parseMapping = (lines: Line[], startIndex: number, mapIndent: number): { value: Record<string, unknown>; nextIndex: number } => {
  const result: Record<string, unknown> = {};
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.indent !== mapIndent) {
      break;
    }
    if (line.content.startsWith('- ')) {
      break;
    }
    const { key, rest } = splitKeyValue(line.content, line.lineNumber);
    if (rest === '') {
      // Value is on following, more-indented lines: nested mapping or sequence.
      const next = lines[i + 1];
      if (!next || next.indent <= mapIndent) {
        throw new YamlParseError(`Key "${key}" has no value and no nested block follows`, line.lineNumber);
      }
      if (next.content.startsWith('- ')) {
        const seqResult = parseSequence(lines, i + 1, next.indent);
        result[key] = seqResult.value;
        i = seqResult.nextIndex;
      } else {
        const mapResult = parseMapping(lines, i + 1, next.indent);
        result[key] = mapResult.value;
        i = mapResult.nextIndex;
      }
    } else if (rest === '[]') {
      result[key] = [];
      i++;
    } else if (rest === '|-') {
      const blockResult = readBlockScalar(lines, i + 1, mapIndent);
      result[key] = blockResult.value;
      i = blockResult.nextIndex;
    } else {
      result[key] = parseScalar(rest, line.lineNumber);
      i++;
    }
  }
  return { value: result, nextIndex: i };
};

// Parses a block sequence of mappings starting at `startIndex`, all "- " markers at `seqIndent`.
const parseSequence = (lines: Line[], startIndex: number, seqIndent: number): { value: unknown[]; nextIndex: number } => {
  const result: unknown[] = [];
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.indent !== seqIndent || !line.content.startsWith('- ')) {
      break;
    }
    // The item's own mapping starts on this line (first key rides the "- ") and
    // continues on lines indented two past the dash, i.e. at `seqIndent + 2`.
    const itemContentIndent = seqIndent + 2;
    const firstLineContent = line.content.slice(2);
    const syntheticFirstLine: Line = { indent: itemContentIndent, content: firstLineContent, lineNumber: line.lineNumber };
    const rest = lines.slice(i + 1);
    const itemMappingLines = [syntheticFirstLine, ...rest];
    const itemResult = parseMapping(itemMappingLines, 0, itemContentIndent);
    result.push(itemResult.value);
    // itemResult.nextIndex is an offset into itemMappingLines (0 = syntheticFirstLine).
    // Convert back to an offset into `lines`: index 0 was synthetic (consumed 1 real
    // line, the dash line itself), indices >= 1 map 1:1 to `rest`.
    i = i + itemResult.nextIndex;
  }
  return { value: result, nextIndex: i };
};

/**
 * Parses YAML text produced by our own `stringifyYaml` writer back into a JS value.
 * Supports only the closed grammar that writer can emit -- see file header. Throws
 * `YamlParseError` (naming the offending line) on anything outside that grammar.
 */
export const parseYamlOutput = (text: string): unknown => {
  const lines = tokenize(text);
  if (lines.length === 0) {
    return [];
  }
  const first = lines[0]!;
  if (first.indent !== 0) {
    throw new YamlParseError('Top-level content must start at column 0', first.lineNumber);
  }
  if (first.content.startsWith('- ')) {
    const result = parseSequence(lines, 0, 0);
    if (result.nextIndex !== lines.length) {
      throw new YamlParseError('Unexpected trailing content after top-level sequence', lines[result.nextIndex]!.lineNumber);
    }
    return result.value;
  }
  const result = parseMapping(lines, 0, 0);
  if (result.nextIndex !== lines.length) {
    throw new YamlParseError('Unexpected trailing content after top-level mapping', lines[result.nextIndex]!.lineNumber);
  }
  return result.value;
};
