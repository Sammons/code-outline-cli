---
'@sammons/code-outline-formatter': patch
'@sammons/code-outline-parser': patch
'@sammons/code-outline-cli': patch
---

Fix `--format yaml` emitting values a YAML parser reads back incorrectly

The YAML output left scalars unquoted that a real parser resolves to something
other than the original string. The worst case is silent data loss: a path
containing `#` truncates at the comment marker.

```
$ code-outline --format yaml "utils #2.ts"
- file: utils #2.ts        # 2.1.0 — parses back as "utils"
- file: "utils #2.ts"      # 2.1.1 — parses back intact
```

Values now quoted that were not before:

- `#` and `,` at the start of a scalar, and `#` preceded by whitespace
- `?`, `:`, and quote characters at the start of a scalar
- case-insensitive reserved words: `true`, `false`, `null`, `~`, `.inf`, `.nan`
- octal and binary literals (`0o17`, `0b101`) alongside the decimal and hex
  cases already handled
- the document markers `---` and `...`
- any control character

Block scalars also keep a trailing newline via `|+` where `|-` stripped it, and
fall back to a double-quoted scalar when a line cannot survive re-indentation.

Verified against `yaml@2.8.2` by differential fuzzing: 0 divergences over 742
structured cases and 40,000 randomized round-trips, up from 17 and 52 failures
respectively.
