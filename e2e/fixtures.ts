/**
 * Playwright fixtures and test data
 *
 * Uses database seeding instead of API mocking for more realistic E2E tests.
 * Mock data is seeded into a separate test database (cache.test.db) via globalSetup.
 */

import { test as base } from '@playwright/test';
import { mockUsers } from './setup';

const mockWalletData = {
  balances: [
    {
      blockchain: 'eth',
      tokenName: 'Ethereum',
      tokenSymbol: 'ETH',
      tokenType: 'NATIVE',
      balance: '1.5',
      balanceRawInteger: '1500000000000000000',
      balanceUsd: '3000.00',
      tokenPrice: '2000.00',
      thumbnail: null,
    },
  ],
  nfts: [],
  poaps: [],
  transactions: [],
};

// 1x1 transparent PNG for avatar mocking
const mockAvatarPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock users API to return mock data
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: mockUsers }),
      });
    });

    // Mock wallet and avatar API routes (user data comes from seeded database)
    await page.route('**/api/wallet/*', async (route) => {
      const url = new URL(route.request().url());
      const address = url.pathname.split('/').pop();

      // Check if address is in our mock users
      const userExists = mockUsers.some(
        (user) => user.address.toLowerCase() === address?.toLowerCase()
      );

      if (!userExists) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Address not found in top users list' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWalletData),
      });
    });

    await page.route('**/api/avatar/*', async (route) => {
      const url = new URL(route.request().url());
      const cid = url.pathname.split('/').pop();

      // Check if CID is in our mock users
      const cidExists = mockUsers.some((user) => user.avatarCid === cid);

      if (!cidExists) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Avatar CID not found in top users list' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: mockAvatarPng,
      });
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { mockUsers };
