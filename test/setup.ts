import { vi } from 'vitest';

// Global test setup
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Setup global mocks or configurations here if needed
