import type { NodeInfo } from './types';
import { FileReader } from './file-reader';
import { ParserFactory } from './parser-factory';
import { ASTTraverser, type TraversalOptions } from './ast-traverser';
import { NameExtractor } from './name-extractor';

/**
 * Main Parser class that coordinates the parsing process
 * Acts as a facade for the different parsing modules
 */
export class Parser {
  private fileReader: FileReader;
  private parserFactory: ParserFactory;
  private astTraverser: ASTTraverser;
  private nameExtractor: NameExtractor;

  constructor() {
    this.fileReader = new FileReader();
    this.parserFactory = ParserFactory.getInstance();
    this.nameExtractor = new NameExtractor();
    this.astTraverser = new ASTTraverser(this.nameExtractor);
  }

  /**
   * Parse a file and extract its AST structure
   * @param filePath - Path to the file to parse
   * @param maxDepth - Maximum depth to traverse (default: Infinity)
   * @param namedOnly - Only include nodes with names (default: true)
   * @returns Promise that resolves to parsed NodeInfo structure or null if parsing fails
   */
  async parseFile(
    filePath: string,
    maxDepth: number = Infinity,
    namedOnly: boolean = true
  ): Promise<NodeInfo | null> {
    try {
      // Validate file type support
      if (!this.fileReader.isSupported(filePath)) {
        throw new Error(`Unsupported file type: ${filePath}`);
      }

      // Read file content
      const content = await this.fileReader.readFile(filePath);

      // Determine file type and get appropriate parser
      const fileType = this.fileReader.getFileType(filePath);
      const tree = this.parserFactory.parseSource(content, fileType);

      // Configure traversal options
      const options: TraversalOptions = {
        maxDepth,
        namedOnly,
      };

      // Extract node information using AST traverser
      return this.astTraverser.extractNodeInfo(tree.rootNode, content, options);
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to parse file ${filePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Parse source code directly without reading from file
   * @param source - Source code to parse
   * @param fileType - Type of source code ('javascript', 'typescript', 'tsx')
   * @param maxDepth - Maximum depth to traverse (default: Infinity)
   * @param namedOnly - Only include nodes with names (default: true)
   * @returns Parsed NodeInfo structure or null if parsing fails
   */
  parseSource(
    source: string,
    fileType: 'javascript' | 'typescript' | 'tsx' = 'javascript',
    maxDepth: number = Infinity,
    namedOnly: boolean = true
  ): NodeInfo | null {
    try {
      const tree = this.parserFactory.parseSource(source, fileType);

      const options: TraversalOptions = {
        maxDepth,
        namedOnly,
      };

      return this.astTraverser.extractNodeInfo(tree.rootNode, source, options);
    } catch (error) {
      throw new Error(
        `Failed to parse source code: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get supported file extensions
   * @returns Array of supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.js', '.jsx', '.ts', '.tsx'];
  }

  /**
   * Check if a file is supported for parsing
   * @param filePath - Path to the file
   * @returns true if file is supported
   */
  isFileSupported(filePath: string): boolean {
    return this.fileReader.isSupported(filePath);
  }
}
