import { BaseExtractor } from './base-extractor';
import { FunctionExtractor } from './function-extractor';
import { ClassExtractor } from './class-extractor';
import { VariableExtractor } from './variable-extractor';
import { ImportExportExtractor } from './import-export-extractor';
import { TypeExtractor } from './type-extractor';

/**
 * Registry for mapping node types to their appropriate extractors
 */
export class ExtractorRegistry {
  private static instance: ExtractorRegistry;
  private typeToExtractorMap: Map<string, BaseExtractor>;

  private constructor() {
    this.typeToExtractorMap = new Map();
    this.initializeExtractors();
  }

  static getInstance(): ExtractorRegistry {
    if (!ExtractorRegistry.instance) {
      ExtractorRegistry.instance = new ExtractorRegistry();
    }
    return ExtractorRegistry.instance;
  }

  /**
   * Initialize all extractors and build the mapping
   */
  private initializeExtractors(): void {
    const extractors = [
      new FunctionExtractor(),
      new ClassExtractor(),
      new VariableExtractor(),
      new ImportExportExtractor(),
      new TypeExtractor(),
    ];

    // Build the type-to-extractor mapping
    for (const extractor of extractors) {
      const supportedTypes = extractor.getSupportedTypes();
      for (const type of supportedTypes) {
        this.typeToExtractorMap.set(type, extractor);
      }
    }
  }

  /**
   * Get the appropriate extractor for a given node type
   */
  getExtractor(nodeType: string): BaseExtractor | undefined {
    return this.typeToExtractorMap.get(nodeType);
  }

  /**
   * Get all supported node types
   */
  getSupportedTypes(): string[] {
    return Array.from(this.typeToExtractorMap.keys());
  }

  /**
   * Check if a node type is supported
   */
  isSupported(nodeType: string): boolean {
    return this.typeToExtractorMap.has(nodeType);
  }

  /**
   * Get all registered extractors
   */
  getAllExtractors(): BaseExtractor[] {
    const extractors = new Set<BaseExtractor>();
    for (const extractor of this.typeToExtractorMap.values()) {
      extractors.add(extractor);
    }
    return Array.from(extractors);
  }
}