# @sammons/code-outline-cli

A CLI tool that parses JavaScript/TypeScript files using tree-sitter and provides an outline of the code structure. For understanding codebases and generating LLM-friendly code summaries.

## ✨ Features

- 🚀 **Tree-sitter parsing** for JavaScript, TypeScript, and TSX files
- 📊 **Multiple output formats**: JSON, YAML, and ASCII tree
- 🎯 **Configurable depth** limiting for AST traversal
- 🔍 **Named-only mode** to show only named entities (functions, classes, etc.)
- ⚡ **Parallel processing** for multiple files
- 🎨 **Colored output** in ASCII mode
- 📁 **Glob pattern support** for file selection

## 📦 Installation

```bash
npm install -g @sammons/code-outline-cli@2.1.0
```

Or use directly with npx:

```bash
npx @sammons/code-outline-cli <file-pattern> [options]
```

## 🚀 Usage

### Basic Usage

```bash
# Parse a single file
code-outline src/index.ts

# Parse multiple files with glob pattern
code-outline "src/**/*.ts"

# Parse all JavaScript/TypeScript files recursively
code-outline "**/*.{js,ts,tsx}"
```

### Output Formats

```bash
# JSON output (default)
code-outline src/index.ts --format json

# YAML output
code-outline src/index.ts --format yaml

# ASCII tree output (great for documentation)
code-outline src/index.ts --format ascii
```

### Depth Control

```bash
# Limit depth to 2 levels
code-outline src/index.ts --depth 2

# Show all levels (default)
code-outline src/index.ts --depth Infinity
```

### Filtering Options

```bash
# Show only named entities (default)
code-outline src/index.ts --named-only

# Show all nodes including anonymous ones
code-outline src/index.ts --all
```

## 📋 Command Line Options

| Option             | Alias | Description                              | Default    |
| ------------------ | ----- | ---------------------------------------- | ---------- | ---- | -------- | ------- |
| `--format <type>`  | `-f`  | Output format: `ascii                    | json       | yaml | llmtext` | `ascii` |
| `--depth <number>` | `-d`  | Maximum depth to traverse                | `Infinity` |
| `--named-only`     |       | Show only named nodes                    | `true`     |
| `--all`            | `-a`  | Show all nodes (including anonymous)     | `false`    |
| `--llmtext`        |       | Generate LLM-optimized compressed output | `false`    |
| `--help`           | `-h`  | Show help message                        |            |
| `--version`        | `-v`  | Show version number                      |            |

## 📖 Examples

### Example TypeScript File

```typescript
// example.ts
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<User> {
    return this.db.users.findById(id);
  }

  async createUser(data: UserData): Promise<User> {
    return this.db.users.create(data);
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### ASCII Tree Output

```bash
code-outline example.ts --format ascii
```

```
📁 example.ts
├─ class_declaration: UserService [1:0] :1
│  ├─ method_definition: constructor [2:2] :2
│  ├─ method_definition: getUser [4:2] :4
│  └─ method_definition: createUser [8:2] :8
└─ function_declaration: validateEmail [13:0] :13
```

### JSON Output

```bash
code-outline example.ts --format json
```

```json
[
  {
    "file": "example.ts",
    "outline": {
      "type": "program",
      "children": [
        {
          "type": "class_declaration",
          "name": "UserService",
          "start": { "row": 0, "column": 0 },
          "children": [
            {
              "type": "method_definition",
              "name": "constructor",
              "start": { "row": 1, "column": 2 }
            },
            {
              "type": "method_definition",
              "name": "getUser",
              "start": { "row": 3, "column": 2 }
            },
            {
              "type": "method_definition",
              "name": "createUser",
              "start": { "row": 7, "column": 2 }
            }
          ]
        },
        {
          "type": "function_declaration",
          "name": "validateEmail",
          "start": { "row": 12, "column": 0 }
        }
      ]
    }
  }
]
```

## 🤖 LLM Integration

This tool can provide code context to Large Language Models:

```bash
# Generate a code outline and pipe to your LLM tool
code-outline "src/**/*.ts" --format json | llm-tool

# Copy outline to clipboard (on macOS)
code-outline src/index.ts --format ascii | pbcopy

# Save outline to a file
code-outline "src/**/*.ts" --format yaml > codebase-outline.yaml

# Generate LLM-optimized compressed output
code-outline "src/**/*.ts" --format llmtext
```

## 🛠️ Advanced Usage

### Processing Large Codebases

```bash
# Process all TypeScript files in a project
code-outline "**/*.ts" --depth 2 --format json > project-outline.json

# Exclude node_modules and dist folders (use quotes to prevent shell expansion)
code-outline "src/**/*.{ts,tsx}" --format ascii
```

### Integration with Other Tools

```bash
# Use with jq for JSON processing
code-outline src/index.ts | jq '.[] | .outline.children[] | .name'

# Count functions in your codebase
code-outline "**/*.ts" | jq '[.[] | .outline.children[] | select(.type == "function_declaration")] | length'
```

## 🔧 Requirements

- Node.js >= 20.0.0
- npm or pnpm

## 📚 Programmatic Usage

You can also use this package programmatically in your Node.js applications:

```javascript
const { parseFiles } = require('@sammons/code-outline-cli');

// Parse files and get results as a string
const result = await parseFiles('src/**/*.ts', {
  format: 'json',
  depth: 3,
  namedOnly: true,
});

console.log(result);

// Save to file
await parseFiles('src/**/*.ts', {
  format: 'yaml',
  output: 'codebase-outline.yaml',
});
```

### TypeScript

```typescript
import {
  parseFiles,
  FileProcessor,
  CLIOutputHandler,
} from '@sammons/code-outline-cli';

// Simple usage
const outline = await parseFiles(['src/index.ts', 'src/utils.ts'], {
  format: 'ascii',
  depth: 2,
});

// Advanced usage with individual components
const processor = new FileProcessor();
const files = await processor.findFiles('src/**/*.ts');
const results = await processor.processFiles(files, 3, true);

const outputHandler = new CLIOutputHandler('json');
outputHandler.formatAndOutput(results);
```

## 📚 Related Packages

- [`@sammons/code-outline-parser`](https://www.npmjs.com/package/@sammons/code-outline-parser) - Core parsing functionality
- [`@sammons/code-outline-formatter`](https://www.npmjs.com/package/@sammons/code-outline-formatter) - Output formatting utilities

## 🤝 Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/sammons2/code-outline-cli) for more information.

## 📄 License

MIT © Sammons Software LLC

---

Made with ❤️ by [Sammons](https://github.com/sammons2) | This is a [Sammons Software LLC](https://github.com/sammons2) Production
