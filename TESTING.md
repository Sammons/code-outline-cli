# Testing

Tests run on Node's built-in test runner. There is no third-party test
framework, no transform step, and no test-only dependency.

## Stack

- **`node:test`** — test runner (`describe`, `it`, `before`, `after`, `mock.fn`)
- **`node:assert/strict`** — assertions
- **Node 26 native type stripping** — `.ts` test files run directly

Node 26 strips types natively, so a test file is executed as written. Nothing
compiles the tests first.

## Commands

```bash
pnpm test           # run every test
pnpm test:coverage  # run with coverage
```

Run a single file:

```bash
node --test packages/parser/src/parser.test.ts
```

Run one test by name:

```bash
node --test --test-name-pattern "parses a class declaration" packages/parser/src/parser.test.ts
```

## Layout

Tests sit beside the source they exercise:

```
packages/parser/src/parser.ts
packages/parser/src/parser.test.ts
```

End-to-end scenarios that drive the built CLI live in `src/test-scenarios/`.

## Writing a test

Import every helper explicitly. `node:test` defines no globals.

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSource } from './parser.ts';

describe('parseSource', () => {
  it('returns a program node for valid input', () => {
    const result = parseSource('const a = 1;');
    assert.strictEqual(result.type, 'program');
  });
});
```

## Faking collaborators

Classes take their collaborators as constructor parameters, each defaulting to
the real implementation. A test passes a fake; production code constructs
normally.

```ts
const orchestrator = new CLIOrchestrator(fakeParser, fakeFileProcessor);
```

Use `mock.fn()` from `node:test` to record calls. Do NOT reach for module
mocking: `mock.module()` is still experimental on Node 26, and a class that
needs it is missing an injection seam.

## Assertions

| Intent | Assertion |
|---|---|
| Exact equality | `assert.strictEqual(actual, expected)` |
| Deep shape | `assert.deepStrictEqual(actual, expected)` |
| Truthiness | `assert.ok(value)` |
| Throws | `assert.throws(() => fn())` |
| Rejects | `await assert.rejects(promise)` |
| Matches a pattern | `assert.match(text, /pattern/)` |

Prefer one `assert.deepStrictEqual` over several per-property checks. A deep
compare reports every drift at once.

## Rules

- Never weaken an assertion to make a failing test pass. Fix the code.
- Never add a snapshot test.
- A test that needs a network service or a Docker container is an integration
  test. Keep unit tests in-process.
