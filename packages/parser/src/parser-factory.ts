import TreeSitterParser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import type { SupportedFileType } from './file-reader';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const TypeScript = require('tree-sitter-typescript').typescript;
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const TSX = require('tree-sitter-typescript').tsx;

/**
 * ParserFactory manages tree-sitter parser instances
 * Implements singleton pattern to reuse parser instances
 */
export class ParserFactory {
  private static instance: ParserFactory;
  private jsParser: TreeSitterParser;
  private tsParser: TreeSitterParser;
  private tsxParser: TreeSitterParser;

  private constructor() {
    this.jsParser = new TreeSitterParser();
    this.jsParser.setLanguage(JavaScript);

    this.tsParser = new TreeSitterParser();
    this.tsParser.setLanguage(TypeScript);

    this.tsxParser = new TreeSitterParser();
    this.tsxParser.setLanguage(TSX);
  }

  /**
   * Get the singleton instance of ParserFactory
   */
  public static getInstance(): ParserFactory {
    if (!ParserFactory.instance) {
      ParserFactory.instance = new ParserFactory();
    }
    return ParserFactory.instance;
  }

  /**
   * Get the appropriate parser for a given file type
   * @param fileType - The type of file to parse
   * @returns The appropriate TreeSitter parser instance
   */
  getParser(fileType: SupportedFileType): TreeSitterParser {
    switch (fileType) {
      case 'tsx':
        return this.tsxParser;
      case 'typescript':
        return this.tsParser;
      case 'javascript':
        return this.jsParser;
      default:
        // TypeScript will catch this, but adding runtime check for robustness
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Parse source code with the appropriate parser
   * @param source - Source code to parse
   * @param fileType - Type of the source file
   * @returns Parsed tree
   */
  parseSource(source: string, fileType: SupportedFileType): TreeSitterParser.Tree {
    const parser = this.getParser(fileType);
    return parser.parse(source);
  }

  /**
   * Reset all parser instances (useful for testing)
   * @internal
   */
  reset(): void {
    // Clear existing parsers to force recreation
    this.jsParser = new TreeSitterParser();
    this.jsParser.setLanguage(JavaScript);

    this.tsParser = new TreeSitterParser();
    this.tsParser.setLanguage(TypeScript);

    this.tsxParser = new TreeSitterParser();
    this.tsxParser.setLanguage(TSX);
  }
}