#!/usr/bin/env node

import { CLIOrchestrator } from './cli-orchestrator.js';

async function main(): Promise<void> {
  const orchestrator = new CLIOrchestrator();
  await orchestrator.run();
}

main().catch((error: unknown) => {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown fatal error';
  console.error('Fatal error:', errorMessage);
  process.exit(1);
});
