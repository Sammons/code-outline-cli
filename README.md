# 🌳 Code Outline CLI

![Build Status](./badges/build.svg)
![Test Status](./badges/tests.svg)
![Coverage](./badges/coverage.svg)
![Version](./badges/version.svg)
![License](./badges/license.svg)

A powerful CLI tool that uses tree-sitter to parse JavaScript and TypeScript files, providing structured AST (Abstract Syntax Tree) output in multiple formats. Perfect for code analysis, documentation generation, and understanding project structure.

## ✨ Features

- 🚀 **Fast parsing** using tree-sitter for JavaScript/TypeScript/TSX files
- 📊 **Multiple output formats**: ASCII tree view, JSON, and YAML
- 🎯 **Flexible filtering**: Named-only or all nodes, with depth control
- 🎨 **Color-coded output** for better readability
- 🔍 **Pattern matching** with glob support
- ⚡ **Parallel processing** for multiple files
- 🧪 **Comprehensive testing** with 100% coverage

## 🚀 Installation

### Global Installation (Recommended)

```bash
npm install -g @sammons/code-outline-cli
```

### Local Installation

```bash
npm install --save-dev @sammons/code-outline-cli
```

### Using without installation

```bash
npx @sammons/code-outline-cli "src/**/*.ts"
```

## 📖 Usage

```bash
code-outline <pattern> [options]
```

### Basic Examples

Parse all TypeScript files in the src directory:

```bash
code-outline "src/**/*.ts"
```

Parse a single file:

```bash
code-outline "src/index.ts"
```

Output as JSON with depth limit:

```bash
code-outline "*.js" --format json --depth 2
```

Parse TSX files and output as YAML:

```bash
code-outline "src/**/*.tsx" --format yaml
```

Show all nodes including unnamed ones:

```bash
code-outline "src/**/*.ts" --all
```

## ⚙️ Options

| Option            | Short | Description                               | Default    |
| ----------------- | ----- | ----------------------------------------- | ---------- |
| `--format <type>` | `-f`  | Output format: `ascii`, `json`, or `yaml` | `ascii`    |
| `--depth <n>`     | `-d`  | Maximum AST depth to traverse             | `Infinity` |
| `--named-only`    |       | Show only named AST nodes                 | `true`     |
| `--all`           | `-a`  | Show all nodes (overrides `--named-only`) | `false`    |
| `--help`          | `-h`  | Show help message                         |            |
| `--version`       | `-v`  | Show version number                       |            |

## 📋 Output Formats

### ASCII Tree View (Default)

Provides a hierarchical tree visualization with color-coded node types:

```
📁 src/index.ts
├─ import_statement: { CLIOrchestrator } [3:0]
├─ function_declaration: main [5:0]
  └─ statement_block [5:37]
    └─ lexical_declaration: const orchestrator [6:2]
      └─ variable_declarator: orchestrator [6:8]
└─ export_statement: { main } [11:0]
```

**Color coding:**

- 🔵 **Functions**: Blue
- 🟢 **Classes**: Green
- 🟡 **Methods**: Yellow
- 🟣 **Interfaces**: Magenta
- 🔴 **Types/Enums**: Red
- 🔷 **Imports/Exports**: Cyan

### JSON Format

Structured JSON output perfect for programmatic processing:

```json
{
  "files": [
    {
      "path": "src/index.ts",
      "outline": {
        "type": "program",
        "children": [
          {
            "type": "function_declaration",
            "name": "main",
            "start": { "row": 4, "column": 0 },
            "end": { "row": 8, "column": 1 },
            "children": [...]
          }
        ]
      }
    }
  ]
}
```

### YAML Format

Human-readable YAML structure:

```yaml
files:
  - path: src/index.ts
    outline:
      type: program
      children:
        - type: function_declaration
          name: main
          start:
            row: 4
            column: 0
          end:
            row: 8
            column: 1
```

## 📝 Node Information

Each parsed node contains:

- **`type`**: AST node type (e.g., `function_declaration`, `class_declaration`)
- **`name`**: Identifier name (when applicable)
- **`start`**: Starting position with row and column
- **`end`**: Ending position with row and column
- **`children`**: Array of child nodes (respects depth limit)

## 📂 Supported File Types

| Extension | Language       | Tree-sitter Parser     |
| --------- | -------------- | ---------------------- |
| `.js`     | JavaScript     | tree-sitter-javascript |
| `.ts`     | TypeScript     | tree-sitter-typescript |
| `.tsx`    | TypeScript JSX | tree-sitter-tsx        |

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/sammons-software-llc/glance-with-tree-sitter.git
cd glance-with-tree-sitter

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev "src/**/*.ts"
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `pnpm build`      | Build all packages        |
| `pnpm dev`        | Run in development mode   |
| `pnpm test`       | Run test suite            |
| `pnpm lint`       | Lint TypeScript files     |
| `pnpm format`     | Format code with Prettier |
| `pnpm type-check` | Check TypeScript types    |

## 🏗️ Architecture

This project is a monorepo with the following packages:

- **`@code-outline/cli`**: Main CLI application
- **`@code-outline/parser`**: Tree-sitter parsing logic
- **`@code-outline/formatter`**: Output formatting utilities

```
code-outline-cli/
├── packages/
│   ├── cli/          # Main CLI package
│   ├── parser/       # AST parsing logic
│   └── formatter/    # Output formatting
├── src/
│   └── test-scenarios/  # Test files
└── scripts/          # Build and utility scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `pnpm test`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Quality

This project maintains high code quality standards:

- **ESLint**: Linting with TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **Vitest**: Unit and integration testing
- **100% test coverage**: All code paths tested

## 📚 Examples

### Analyzing a React Project

```bash
# Get overview of all React components
code-outline "src/components/**/*.tsx" --format json | jq '.files[].outline.children[] | select(.type == "function_declaration")'

# Check TypeScript interfaces
code-outline "src/types/**/*.ts" --format ascii --depth 2
```

### Code Quality Analysis

```bash
# Find all exported functions
code-outline "src/**/*.ts" --format json | grep -A5 "export.*function"

# Analyze component structure
code-outline "src/App.tsx" --all --depth 3
```

### Documentation Generation

```bash
# Extract all class and function names
code-outline "src/**/*.ts" --format yaml | grep -E "(class_declaration|function_declaration)"
```

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Operating System**: macOS, Linux, Windows
- **Memory**: Minimum 512MB RAM
- **Disk Space**: ~50MB for installation

## 📄 License

MIT © [Sammons Software LLC](https://github.com/sammons-software-llc)

## 🐛 Issues & Support

Found a bug or have a feature request? Please check our [issue tracker](https://github.com/sammons-software-llc/glance-with-tree-sitter/issues).

## 🙏 Acknowledgments

- [Tree-sitter](https://tree-sitter.github.io/) for the powerful parsing library
- [TypeScript](https://www.typescriptlang.org/) team for excellent language tooling
- All contributors who help improve this project

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/sammons-software-llc">Sammons Software LLC</a>
</p>
