import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

/**
 * Supported file types for parsing
 */
export type SupportedFileType = 'javascript' | 'typescript' | 'tsx';

/**
 * FileReader handles file I/O operations for the parser
 */
export class FileReader {
  /**
   * Read file content from the filesystem
   * @param filePath - Path to the file to read
   * @returns Promise that resolves to file content as string
   * @throws Error if file cannot be read
   */
  async readFile(filePath: string): Promise<string> {
    // This method throws asynchronously if file doesn't exist, which is the expected behavior
    return await readFile(filePath, 'utf-8');
  }

  /**
   * Determine file type based on extension
   * @param filePath - Path to the file
   * @returns The detected file type
   */
  getFileType(filePath: string): SupportedFileType {
    const ext = extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.tsx':
        return 'tsx';
      case '.ts':
        return 'typescript';
      case '.js':
      case '.jsx':
      default:
        return 'javascript';
    }
  }

  /**
   * Check if a file extension is supported
   * @param filePath - Path to the file
   * @returns true if the file type is supported
   */
  isSupported(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
  }
}