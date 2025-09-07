import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Result of a CLI execution
 */
export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  command: string;
  args: string[];
  duration: number;
}

/**
 * Options for CLI execution
 */
export interface CLIOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

/**
 * Error thrown when CLI execution times out
 */
export class CLITimeoutError extends Error {
  constructor(timeout: number, command: string, args: string[]) {
    super(
      `CLI execution timed out after ${timeout}ms: ${command} ${args.join(' ')}`
    );
    this.name = 'CLITimeoutError';
  }
}

/**
 * Centralized CLI runner for smoke tests
 * Provides standardized way to execute the CLI binary and capture results
 */
export class CLIRunner {
  private readonly cliPath: string;
  private readonly defaultTimeout: number;

  constructor(
    cliPath?: string,
    defaultTimeout: number = 30000 // 30 seconds
  ) {
    // Default to the built CLI path
    this.cliPath =
      cliPath || resolve(__dirname, '../../../packages/cli/dist/cli.js');
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Execute the CLI with given arguments
   */
  public async run(
    args: string[],
    options: CLIOptions = {}
  ): Promise<CLIResult> {
    const startTime = Date.now();
    const timeout = options.timeout || this.defaultTimeout;

    return new Promise<CLIResult>((resolve, reject) => {
      const child = spawn('node', [this.cliPath, ...args], {
        stdio: 'pipe',
        cwd: options.cwd || process.cwd(),
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
          ...options.env,
        },
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          child.kill('SIGKILL');
          reject(new CLITimeoutError(timeout, 'node', [this.cliPath, ...args]));
        }
      }, timeout);

      // Capture stdout
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle completion
      child.on('close', (code) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutHandle);

          const duration = Date.now() - startTime;
          resolve({
            stdout,
            stderr,
            exitCode: code,
            command: 'node',
            args: [this.cliPath, ...args],
            duration,
          });
        }
      });

      // Handle errors (e.g., ENOENT if node/CLI not found)
      child.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutHandle);
          reject(error);
        }
      });
    });
  }

  /**
   * Execute CLI and expect success (exit code 0)
   */
  public async runExpectSuccess(
    args: string[],
    options?: CLIOptions
  ): Promise<CLIResult> {
    const result = await this.run(args, options);
    if (result.exitCode !== 0) {
      throw new Error(
        `Expected successful CLI execution but got exit code ${result.exitCode}.\n` +
          `Command: ${result.command} ${result.args.join(' ')}\n` +
          `Stderr: ${result.stderr}\n` +
          `Stdout: ${result.stdout}`
      );
    }
    return result;
  }

  /**
   * Execute CLI and expect failure (non-zero exit code)
   */
  public async runExpectFailure(
    args: string[],
    options?: CLIOptions
  ): Promise<CLIResult> {
    const result = await this.run(args, options);
    if (result.exitCode === 0) {
      throw new Error(
        `Expected failed CLI execution but got exit code 0.\n` +
          `Command: ${result.command} ${result.args.join(' ')}\n` +
          `Stdout: ${result.stdout}`
      );
    }
    return result;
  }

  /**
   * Execute CLI with JSON format and parse result
   */
  public async runForJson(
    args: string[],
    options?: CLIOptions
  ): Promise<{ result: CLIResult; json: any }> {
    const argsWithJson = [...args, '--format', 'json'];
    const result = await this.runExpectSuccess(argsWithJson, options);

    let json: any;
    try {
      json = JSON.parse(result.stdout);
    } catch (error) {
      throw new Error(
        `Failed to parse CLI JSON output: ${error}\n` +
          `Stdout: ${result.stdout}`
      );
    }

    return { result, json };
  }

  /**
   * Get CLI help output
   */
  public async getHelp(): Promise<CLIResult> {
    return this.run(['--help']);
  }

  /**
   * Get CLI version output
   */
  public async getVersion(): Promise<CLIResult> {
    return this.run(['--version']);
  }

  /**
   * Test if CLI binary is accessible
   */
  public async testAccess(): Promise<boolean> {
    try {
      const result = await this.run(['--version'], { timeout: 5000 });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
}

/**
 * Default CLI runner instance for convenience
 */
export const cliRunner = new CLIRunner();

/**
 * Helper function for quick CLI execution
 */
export async function runCLI(
  args: string[],
  options?: CLIOptions
): Promise<CLIResult> {
  return cliRunner.run(args, options);
}
