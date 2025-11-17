/**
 * Playwright global setup
 * Seeds database with mock data before tests run
 */

import { seedTestDatabase } from './setup';

async function globalSetup() {
  console.log('Setting up E2E tests...');

  // Force the test environment so seeding never touches the primary cache
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

  seedTestDatabase();
  console.log('E2E test setup complete');
}

export default globalSetup;
