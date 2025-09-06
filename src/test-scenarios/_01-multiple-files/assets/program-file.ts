/* eslint-disable */
/**
 * Program file with main application logic
 * Contains various TypeScript constructs for testing
 */

export interface ApplicationConfig {
  name: string;
  version: string;
  debug?: boolean;
  features: FeatureFlags;
}

export interface FeatureFlags {
  enableNewUI: boolean;
  enableBetaFeatures: boolean;
  enableAnalytics: boolean;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private level: LogLevel;
  private context: string;
  
  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.level = level;
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG][${this.context}]`, message, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO][${this.context}]`, message, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN][${this.context}]`, message, ...args);
    }
  }
  
  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR][${this.context}]`, message, error);
    }
  }
  
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  get currentLevel(): LogLevel {
    return this.level;
  }
}

export abstract class ApplicationModule {
  protected logger: Logger;
  protected config: ApplicationConfig;
  
  constructor(config: ApplicationConfig) {
    this.config = config;
    this.logger = new Logger(this.constructor.name);
  }
  
  abstract initialize(): Promise<void>;
  abstract cleanup(): Promise<void>;
  
  protected isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature] ?? false;
  }
}

export class Application {
  private modules: Map<string, ApplicationModule> = new Map();
  private isRunning = false;
  private logger: Logger;
  
  constructor(private config: ApplicationConfig) {
    this.logger = new Logger('Application');
  }
  
  registerModule(name: string, module: ApplicationModule): void {
    if (this.modules.has(name)) {
      throw new Error(`Module '${name}' is already registered`);
    }
    this.modules.set(name, module);
  }
  
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Application is already running');
      return;
    }
    
    this.logger.info('Starting application...', { version: this.config.version });
    
    try {
      // Initialize all modules
      for (const [name, module] of this.modules) {
        this.logger.debug(`Initializing module: ${name}`);
        await module.initialize();
      }
      
      this.isRunning = true;
      this.logger.info('Application started successfully');
    } catch (error) {
      this.logger.error('Failed to start application', error as Error);
      throw error;
    }
  }
  
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.logger.info('Stopping application...');
    
    // Cleanup modules in reverse order
    const modules = Array.from(this.modules.entries()).reverse();
    for (const [name, module] of modules) {
      try {
        this.logger.debug(`Cleaning up module: ${name}`);
        await module.cleanup();
      } catch (error) {
        this.logger.error(`Failed to cleanup module: ${name}`, error as Error);
      }
    }
    
    this.isRunning = false;
    this.logger.info('Application stopped');
  }
  
  getModule<T extends ApplicationModule>(name: string): T | undefined {
    return this.modules.get(name) as T;
  }
  
  get running(): boolean {
    return this.isRunning;
  }
}

// Helper functions
export function createDefaultConfig(): ApplicationConfig {
  return {
    name: 'Sample Application',
    version: '1.0.0',
    debug: false,
    features: {
      enableNewUI: true,
      enableBetaFeatures: false,
      enableAnalytics: true,
    },
  };
}

export const validateConfig = (config: Partial<ApplicationConfig>): config is ApplicationConfig => {
  return !!(config.name && config.version && config.features);
};

// Export type guards
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}