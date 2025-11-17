/**
 * Playwright global setup
 * Seeds database with mock data before tests run
 */

import { seedTestDatabase } from './setup';

async function globalSetup() {
  console.log('Setting up E2E tests...');

  const env = process.env.NODE_ENV ?? 'test';

  seedTestDatabase(env);
  console.log('E2E test setup complete');
}

export default globalSetup;
