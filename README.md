# glance-with-tree-sitter

A CLI tool that uses tree-sitter to parse JavaScript and TypeScript files and provide structured output in multiple formats.

## Installation

```bash
npm install -g @sammons/glance-with-tree-sitter
```

## Usage

```bash
glance-with-tree-sitter <glob-pattern> [options]
```

### Options

- `--format <type>` - Output format: `json`, `yaml`, or `ascii` (default: `ascii`)
- `--depth <n>` - Maximum depth to traverse the AST (default: `Infinity`)
- `--named-only` - Show only named entities (default: `true`)
- `--all` - Show all nodes, not just named ones (overrides `--named-only`)
- `--help` - Show help message
- `--version` - Show version number

### Examples

Parse all TypeScript files in src directory:
```bash
glance-with-tree-sitter "src/**/*.ts"
```

Output as JSON with depth limit:
```bash
glance-with-tree-sitter "*.js" --format json --depth 2
```

Parse TSX files and output as YAML:
```bash
glance-with-tree-sitter "src/**/*.tsx" --format yaml
```

Show all nodes including unnamed ones:
```bash
glance-with-tree-sitter "src/**/*.ts" --all
```

## Output Formats

### ASCII (default)
Provides a tree-like visualization with color-coded node types:
- Functions: blue
- Classes: green  
- Methods: yellow
- Interfaces: magenta
- Type aliases: cyan
- Enums: red

### JSON
Outputs a structured JSON representation of the AST with file paths and node information.

### YAML
Outputs a YAML representation of the parsed structure.

## Node Information

Each node in the output contains:
- `type` - The AST node type (e.g., `function_declaration`, `class_declaration`)
- `name` - The identifier name (when applicable)
- `start` - Starting position (row and column)
- `end` - Ending position (row and column)
- `children` - Child nodes (up to specified depth)

## Supported File Types

- `.js` - JavaScript
- `.ts` - TypeScript
- `.tsx` - TypeScript JSX

## Requirements

Node.js >= 18.0.0

## Development

```bash
# Clone repository
git clone https://github.com/sammons-software-llc/glance-with-tree-sitter.git
cd glance-with-tree-sitter

# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev -- "src/**/*.ts"
```

## License

MIT