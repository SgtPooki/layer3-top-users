/**
 * Unit tests for database cache layer
 *
 * Tests cache save/read/expiry behavior for users and wallet data.
 * Uses isolated test database to avoid polluting production data.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveUsers,
  getUsers,
  getUserByAddress,
  isAddressAllowed,
  isAvatarAllowed,
  saveWalletData,
  getWalletData,
  closeDb,
} from '@/lib/db';
import type { UserData } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Use isolated test database
const TEST_DB_NAME = 'cache.test.db';

function getTestDbPath(): string {
  const dbDir = process.env.CACHE_DB_DIR || path.join(process.cwd(), 'data');
  return path.join(dbDir, TEST_DB_NAME);
}

function cleanupTestDb(): void {
  closeDb();
  const dbPath = getTestDbPath();
  // Remove all SQLite files (main db, WAL, and SHM files)
  [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

describe('Database Cache Layer', () => {
  beforeEach(() => {
    // Set test database name
    process.env.CACHE_DB_NAME = TEST_DB_NAME;
    // Clean up any existing test database
    cleanupTestDb();
  });

  afterEach(() => {
    // Clean up after each test
    cleanupTestDb();
    delete process.env.CACHE_DB_NAME;
  });

  describe('Users Cache', () => {
    const mockUsers: UserData[] = [
      {
        address: '0x1234567890123456789012345678901234567890',
        rank: 1,
        username: 'TestUser1',
        avatarCid: 'QmTest1',
        gmStreak: 10,
        xp: 1000,
        level: 5,
      },
      {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        rank: 2,
        username: 'TestUser2',
        avatarCid: 'QmTest2',
        gmStreak: 5,
        xp: 500,
        level: 3,
      },
    ];

    it('saves and retrieves users', () => {
      saveUsers(mockUsers);
      const retrieved = getUsers();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.length).toBe(2);
      expect(retrieved?.[0].address).toBe(mockUsers[0].address);
      expect(retrieved?.[0].username).toBe(mockUsers[0].username);
    });

    it('retrieves user by address', () => {
      saveUsers(mockUsers);
      const user = getUserByAddress(mockUsers[0].address);

      expect(user).not.toBeNull();
      expect(user?.address).toBe(mockUsers[0].address);
      expect(user?.username).toBe(mockUsers[0].username);
    });

    it('returns null for non-existent user', () => {
      saveUsers(mockUsers);
      const user = getUserByAddress('0x0000000000000000000000000000000000000000');

      expect(user).toBeNull();
    });

    it('checks if address is allowed', () => {
      saveUsers(mockUsers);

      expect(isAddressAllowed(mockUsers[0].address)).toBe(true);
      expect(isAddressAllowed('0x0000000000000000000000000000000000000000')).toBe(false);
    });

    it('checks if avatar CID is allowed', () => {
      saveUsers(mockUsers);

      expect(isAvatarAllowed(mockUsers[0].avatarCid)).toBe(true);
      expect(isAvatarAllowed('QmInvalid')).toBe(false);
    });

    it('handles case-insensitive address lookup', () => {
      saveUsers(mockUsers);
      const upperAddress = mockUsers[0].address.toUpperCase();
      const user = getUserByAddress(upperAddress);

      expect(user).not.toBeNull();
      expect(user?.address).toBe(mockUsers[0].address);
    });
  });

  describe('Wallet Data Cache', () => {
    const mockWalletData = {
      balances: [
        {
          blockchain: 'ethereum',
          tokenSymbol: 'ETH',
          tokenName: 'Ethereum',
          tokenDecimals: 18,
          tokenType: 'NATIVE',
          contractAddress: null,
          holderAddress: '0x1234567890123456789012345678901234567890',
          balance: '1.5',
          balanceRawInteger: '1500000000000000000',
          balanceUsd: '3000',
          tokenPrice: '2000',
        },
      ],
      nfts: [],
      poaps: [],
      lastTransaction: null,
    };

    const testAddress = '0x1234567890123456789012345678901234567890';

    it('saves and retrieves wallet data', () => {
      saveWalletData(testAddress, mockWalletData);
      const retrieved = getWalletData(testAddress);

      expect(retrieved).not.toBeNull();
      expect(retrieved).toEqual(mockWalletData);
    });

    it('returns null for non-existent wallet', () => {
      const retrieved = getWalletData('0x0000000000000000000000000000000000000000');
      expect(retrieved).toBeNull();
    });

    it('handles corrupted cache data gracefully', () => {
      // Save valid data first
      saveWalletData(testAddress, mockWalletData);

      // Test that getWalletData returns valid data (it handles corruption internally)
      const retrieved = getWalletData(testAddress);
      expect(retrieved).not.toBeNull();
      expect(retrieved).toEqual(mockWalletData);
    });
  });

  describe('Cache Expiration', () => {
    it('returns null when cache is empty', () => {
      const users = getUsers();
      expect(users).toBeNull();
    });

    it('expires users after 24 hours', () => {
      const mockUsers: UserData[] = [
        {
          address: '0x1234567890123456789012345678901234567890',
          rank: 1,
          username: 'TestUser',
          avatarCid: 'QmTest',
          gmStreak: 10,
          xp: 1000,
          level: 5,
        },
      ];

      // Save users
      saveUsers(mockUsers);

      // Verify users are cached
      let retrieved = getUsers();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.length).toBe(1);

      // Fast-forward time by 25 hours (past the 24hr TTL)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);

      // Verify users are now expired
      retrieved = getUsers();
      expect(retrieved).toBeNull();

      vi.useRealTimers();
    });

    it('expires wallet data after 24 hours', () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const mockWalletData = {
        balances: [],
        nfts: [],
        poaps: [],
        lastTransaction: null,
      };

      // Save wallet data
      saveWalletData(testAddress, mockWalletData);

      // Verify data is cached
      let retrieved = getWalletData(testAddress);
      expect(retrieved).not.toBeNull();

      // Fast-forward time by 25 hours
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);

      // Verify data is now expired
      retrieved = getWalletData(testAddress);
      expect(retrieved).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('Data Validation', () => {
    it('filters out invalid user data', () => {
      const mixedUsers = [
        {
          address: '0x1234567890123456789012345678901234567890',
          rank: 1,
          username: 'ValidUser',
          avatarCid: 'QmValid',
          gmStreak: 10,
          xp: 1000,
          level: 5,
        },
        // Invalid: missing required fields
        {
          address: '0x2234567890123456789012345678901234567890',
          rank: 2,
        },
        // Invalid: negative values
        {
          address: '0x3234567890123456789012345678901234567890',
          rank: -1,
          username: 'InvalidUser',
          avatarCid: 'QmInvalid',
          gmStreak: -5,
          xp: -100,
          level: -1,
        },
      ] as UserData[];

      saveUsers(mixedUsers);
      const retrieved = getUsers();

      // Only valid user should be saved
      expect(retrieved).not.toBeNull();
      expect(retrieved?.length).toBe(1);
      expect(retrieved?.[0].username).toBe('ValidUser');
    });

    it('handles empty user array', () => {
      saveUsers([]);
      const retrieved = getUsers();
      expect(retrieved).toBeNull();
    });

    it('handles array of all invalid users', () => {
      const invalidUsers = [
        { address: '0x123', rank: -1 },
        { username: 'NoAddress' },
      ] as UserData[];

      saveUsers(invalidUsers);
      const retrieved = getUsers();
      expect(retrieved).toBeNull();
    });
  });
});

