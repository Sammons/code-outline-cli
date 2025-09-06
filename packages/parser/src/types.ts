/**
 * Shared type definitions for the parser package
 */

// Base node types that can appear in AST
export const NODE_TYPES = [
  // Function types
  'function_declaration',
  'function_expression',
  'generator_function_declaration',
  'async_function_declaration',
  'arrow_function',
  'method_definition',
  'constructor',

  // Class types
  'class_declaration',
  'class_body',

  // Interface and type declarations
  'interface_declaration',
  'interface_body',
  'type_alias_declaration',

  // Enum types
  'enum_declaration',
  'enum_body',

  // Module and namespace types
  'namespace_declaration',
  'module_declaration',
  'internal_module',
  'module',

  // Variable declarations
  'variable_declaration',
  'lexical_declaration',
  'variable_declarator',

  // Import/Export
  'import_statement',
  'export_statement',
  'export_specifier',

  // Object and property types
  'object',
  'pair',
  'public_field_definition',
  'getter',
  'setter',

  // Control flow
  'statement_block',
  'switch_statement',
  'if_statement',
  'for_statement',
  'while_statement',
  'do_statement',
  'try_statement',

  // Expression types
  'call_expression',

  // Structural types
  'program',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

// Container types that can have children
export const CONTAINER_TYPES = [
  'program',
  'class_body',
  'function_declaration',
  'function_expression',
  'arrow_function',
  'method_definition',
  'constructor',
  'object',
  'class_declaration',
  'interface_declaration',
  'interface_body',
  'enum_declaration',
  'enum_body',
  'namespace_declaration',
  'module_declaration',
  'internal_module',
  'module',
  'export_statement',
  'export_specifier',
  'import_statement',
  'variable_declaration',
  'lexical_declaration',
  'statement_block',
  'switch_statement',
  'if_statement',
  'for_statement',
  'while_statement',
  'do_statement',
  'try_statement',
] as const;

export type ContainerType = (typeof CONTAINER_TYPES)[number];

// Structural node types that provide structure even without names
export const STRUCTURAL_TYPES = [
  'program',
  'class_body',
  'interface_body',
  'enum_body',
  'object',
  'statement_block',
  'export_statement',
] as const;

export type StructuralType = (typeof STRUCTURAL_TYPES)[number];

// Insignificant node types that should be filtered out
export const INSIGNIFICANT_TYPES = [
  'comment',
  ',',
  ';',
  '{',
  '}',
  '(',
  ')',
  '[',
  ']',
  'ERROR',
] as const;

export type InsignificantType = (typeof INSIGNIFICANT_TYPES)[number];

// Position information
export interface Position {
  row: number;
  column: number;
}

// Node information interface
export interface NodeInfo {
  type: string;
  name?: string;
  start: Position;
  end: Position;
  children?: NodeInfo[];
}

// Type guard to check if a node is named
export function isNamedNode(
  node: NodeInfo
): node is NodeInfo & { name: string } {
  return node.name !== undefined;
}

// Type guard to check if a node is unnamed
export function isUnnamedNode(
  node: NodeInfo
): node is NodeInfo & { name?: undefined } {
  return node.name === undefined;
}

// Type guard to check if a node type is a container type
export function isContainerType(type: string): type is ContainerType {
  return (CONTAINER_TYPES as readonly string[]).includes(type);
}

// Type guard to check if a node type is a structural type
export function isStructuralType(type: string): type is StructuralType {
  return (STRUCTURAL_TYPES as readonly string[]).includes(type);
}

// Type guard to check if a node type is insignificant
export function isInsignificantType(type: string): type is InsignificantType {
  return (INSIGNIFICANT_TYPES as readonly string[]).includes(type);
}

// Validation function for depth values
export function validateDepth(depth: string): number {
  if (depth === 'Infinity') {
    return Infinity;
  }

  const parsed = parseInt(depth, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new Error('Depth must be a positive number or "Infinity"');
  }

  return parsed;
}

// Output format types
export const OUTPUT_FORMATS = ['json', 'yaml', 'ascii'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

// Type guard for output format validation
export function isValidOutputFormat(format: string): format is OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(format as OutputFormat);
}

// Parse result type
export interface ParseResult {
  file: string;
  outline: NodeInfo | null;
}

// Parser configuration interface
export interface ParserConfig {
  maxDepth?: number;
  namedOnly?: boolean;
}

// Error types for better error handling
export class ParserError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

export class FileReaderError extends Error {
  constructor(
    message: string,
    public readonly filePath: string
  ) {
    super(message);
    this.name = 'FileReaderError';
  }
}

export class UnsupportedFileTypeError extends Error {
  constructor(filePath: string, supportedTypes: string[]) {
    super(
      `Unsupported file type for ${filePath}. Supported types: ${supportedTypes.join(', ')}`
    );
    this.name = 'UnsupportedFileTypeError';
  }
}

// CLI argument validation result
export interface ValidationResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}

// Validator function type
export type Validator<T> = (value: unknown) => ValidationResult<T>;

// Format validation function
export function validateFormat(
  format: unknown
): ValidationResult<OutputFormat> {
  if (typeof format !== 'string') {
    return {
      success: false,
      error: 'Format must be a string',
    };
  }

  if (!isValidOutputFormat(format)) {
    return {
      success: false,
      error: `Invalid format "${format}". Must be one of: ${OUTPUT_FORMATS.join(', ')}`,
    };
  }

  return {
    success: true,
    value: format,
  };
}

// Depth validation function
export function validateDepthValue(depth: unknown): ValidationResult<number> {
  if (typeof depth !== 'string') {
    return {
      success: false,
      error: 'Depth must be a string',
    };
  }

  try {
    const validated = validateDepth(depth);
    return {
      success: true,
      value: validated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid depth value',
    };
  }
}
