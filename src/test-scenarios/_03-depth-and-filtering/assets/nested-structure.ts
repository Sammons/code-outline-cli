/* eslint-disable */
/**
 * Deeply nested structure for testing depth and filtering options
 * Contains multiple levels of nesting to test depth limitations
 */

export namespace Level1 {
  export interface Config {
    name: string;
    settings: Settings;
  }

  export namespace Level2 {
    export interface Settings {
      debug: boolean;
      options: Options;
    }

    export class SettingsManager {
      private config: Config;

      constructor(config: Config) {
        this.config = config;
      }

      getSettings(): Settings {
        return this.config.settings;
      }

      updateSettings(updates: Partial<Settings>): void {
        this.config.settings = { ...this.config.settings, ...updates };
      }

      // Nested method with complex body
      validateAndApply(newSettings: Settings): boolean {
        const validator = {
          validate(settings: Settings): boolean {
            if (!settings.debug && !settings.options) {
              return false;
            }
            
            return settings.options.enabled !== undefined;
          },
          
          apply(manager: SettingsManager, settings: Settings): void {
            if (this.validate(settings)) {
              manager.updateSettings(settings);
            }
          }
        };

        return validator.validate(newSettings);
      }
    }

    export namespace Level3 {
      export interface Options {
        enabled: boolean;
        advanced: AdvancedOptions;
      }

      export class OptionsProcessor {
        process(options: Options): ProcessedOptions {
          const processor = {
            normalizeOptions(opts: Options): NormalizedOptions {
              return {
                enabled: opts.enabled,
                advanced: this.processAdvanced(opts.advanced)
              };
            },

            processAdvanced(advanced: AdvancedOptions): ProcessedAdvanced {
              return {
                features: advanced.features.map(f => ({
                  name: f.name,
                  enabled: f.enabled ?? true,
                  config: this.processFeatureConfig(f.config)
                }))
              };
            },

            processFeatureConfig(config: FeatureConfig | undefined): ProcessedFeatureConfig {
              if (!config) {
                return { defaults: true };
              }

              const nestedProcessor = {
                transform: (cfg: FeatureConfig) => ({
                  transformed: true,
                  values: cfg.values || []
                })
              };

              return nestedProcessor.transform(config);
            }
          };

          const normalized = processor.normalizeOptions(options);
          return {
            result: normalized,
            timestamp: new Date(),
            metadata: {
              processed: true,
              version: '1.0'
            }
          };
        }
      }

      export namespace Level4 {
        export interface AdvancedOptions {
          features: Feature[];
        }

        export interface Feature {
          name: string;
          enabled?: boolean;
          config?: FeatureConfig;
        }

        export interface FeatureConfig {
          values?: string[];
        }

        export namespace Level5 {
          // Very deep nesting for depth testing
          export interface NormalizedOptions {
            enabled: boolean;
            advanced: ProcessedAdvanced;
          }

          export interface ProcessedAdvanced {
            features: ProcessedFeature[];
          }

          export interface ProcessedFeature {
            name: string;
            enabled: boolean;
            config: ProcessedFeatureConfig;
          }

          export interface ProcessedFeatureConfig {
            defaults?: boolean;
            transformed?: boolean;
            values?: string[];
          }

          export interface ProcessedOptions {
            result: NormalizedOptions;
            timestamp: Date;
            metadata: {
              processed: boolean;
              version: string;
            };
          }

          export namespace Level6 {
            // Maximum depth for testing
            export class DeepProcessor {
              private static instance: DeepProcessor;

              static getInstance(): DeepProcessor {
                if (!DeepProcessor.instance) {
                  DeepProcessor.instance = new DeepProcessor();
                }
                return DeepProcessor.instance;
              }

              processDeep(data: any): any {
                const deepWorker = {
                  level1: {
                    process: (input: any) => {
                      const level2Worker = {
                        transform: (data: any) => {
                          const level3Worker = {
                            validate: (item: any) => {
                              return item !== null && item !== undefined;
                            },
                            normalize: (item: any) => {
                              if (!level3Worker.validate(item)) {
                                return null;
                              }
                              
                              return {
                                processed: true,
                                original: item,
                                timestamp: new Date()
                              };
                            }
                          };
                          
                          if (Array.isArray(data)) {
                            return data.map(level3Worker.normalize);
                          }
                          
                          return level3Worker.normalize(data);
                        }
                      };
                      
                      return level2Worker.transform(input);
                    }
                  }
                };

                return deepWorker.level1.process(data);
              }

              // Deeply nested arrow functions
              createNestedHandler = () => {
                return {
                  handle: (input: any) => {
                    const processor = (data: any) => {
                      const validator = (item: any) => {
                        const checker = (value: any) => {
                          return typeof value !== 'undefined';
                        };
                        return checker(item);
                      };
                      
                      if (validator(data)) {
                        const transformer = (validData: any) => {
                          return { transformed: validData };
                        };
                        return transformer(data);
                      }
                      
                      return null;
                    };
                    
                    return processor(input);
                  }
                };
              };
            }

            // Extremely nested type definitions
            export type DeepNested<T> = {
              level1: {
                level2: {
                  level3: {
                    level4: {
                      level5: {
                        level6: T;
                      };
                    };
                  };
                };
              };
            };

            // Function with many nested scopes
            export function complexNestedFunction() {
              const outerVar = 'outer';
              
              function level1() {
                const level1Var = 'level1';
                
                function level2() {
                  const level2Var = 'level2';
                  
                  function level3() {
                    const level3Var = 'level3';
                    
                    function level4() {
                      const level4Var = 'level4';
                      
                      function level5() {
                        const level5Var = 'level5';
                        
                        return {
                          outerVar,
                          level1Var,
                          level2Var,
                          level3Var,
                          level4Var,
                          level5Var
                        };
                      }
                      
                      return level5();
                    }
                    
                    return level4();
                  }
                  
                  return level3();
                }
                
                return level2();
              }
              
              return level1();
            }
          }
        }
      }
    }
  }
}

// Top-level constructs for filtering tests
export interface TopLevelInterface {
  value: string;
}

export class TopLevelClass {
  constructor(private value: string) {}
  
  getValue(): string {
    return this.value;
  }
}

export function topLevelFunction(): string {
  return 'top-level';
}

export const topLevelArrow = (): number => 42;

// Unnamed constructs for testing named-only filtering
const unnamedConst = 'should be filtered in named-only mode';

const unnamedObject = {
  prop1: 'value1',
  prop2: 'value2',
  method() {
    return 'unnamed method';
  }
};

// Mixed named and unnamed
export const namedExportedObject = {
  namedProp: 'visible',
  unnamedProp: 'might be filtered',
  namedMethod(): string {
    const localVar = 'local';
    return localVar + this.namedProp;
  }
};