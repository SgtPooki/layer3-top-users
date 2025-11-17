/**
 * E2E test setup - seeds database with mock data
 */

import { saveUsers } from '@/lib/db';
import type { UserData } from '@/lib/types';

export const mockUsers: UserData[] = [
  {
    rank: 1,
    address: '0x1234567890123456789012345678901234567890',
    avatarCid: 'QmTest1',
    username: 'TestUser1',
    gmStreak: 100,
    xp: 50000,
    level: 50,
  },
  {
    rank: 2,
    address: '0x2234567890123456789012345678901234567890',
    avatarCid: 'QmTest2',
    username: 'TestUser2',
    gmStreak: 90,
    xp: 45000,
    level: 45,
  },
  {
    rank: 3,
    address: '0x3234567890123456789012345678901234567890',
    avatarCid: 'QmTest3',
    username: 'TestUser3',
    gmStreak: 80,
    xp: 40000,
    level: 40,
  },
];

/**
 * Seed database with mock users for testing
 */
export function seedTestDatabase(env: string | undefined = process.env.NODE_ENV ?? 'test') {
  if (env !== 'test') {
    console.warn(`Skipping test database seeding because NODE_ENV is "${env}"`);
    return;
  }

  saveUsers(mockUsers);
  console.log('✓ Seeded test database with mock users');
}
