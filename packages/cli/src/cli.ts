#!/usr/bin/env node

import { CLIOrchestrator } from './cli-orchestrator.js';

async function main(): Promise<void> {
  const orchestrator = new CLIOrchestrator();
  await orchestrator.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
