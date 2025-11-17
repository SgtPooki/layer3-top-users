/**
 * Database singleton with in-memory cache layer
 *
 * Uses SQLite (better-sqlite3) for persistent storage with automatic expiration.
 * Implements an in-memory cache to minimize database reads for frequently accessed data.
 *
 * Architecture:
 * - SQLite provides persistent storage with TTL-based expiration
 * - In-memory Map provides fast access to hot data
 * - Cache invalidation happens automatically on writes
 * - All data expires after 24 hours
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { UserData } from './types';
import { logger } from './logger';

interface CachedUser extends UserData {
  expiresAt: number;
}

interface CachedWalletData {
  address: string;
  data: string; // JSON stringified wallet data
  expiresAt: number;
}

// Singleton database instance
let dbInstance: Database.Database | null = null;

// In-memory cache
const userCache = new Map<string, CachedUser>();
const walletCache = new Map<string, CachedWalletData>();
const avatarCache = new Set<string>();

// 24 hours in milliseconds
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Get or create database singleton instance
 */
function resolveDbDir(): string {
  if (process.env.CACHE_DB_DIR) {
    return path.resolve(process.env.CACHE_DB_DIR);
  }

  const cwd = process.cwd();

  // When running the standalone bundle, cwd may be .next/standalone; back out to project root.
  if (cwd.endsWith(path.join('.next', 'standalone'))) {
    return path.resolve(cwd, '..', '..', 'data');
  }

  return path.join(cwd, 'data');
}

function getDb(): Database.Database {
  if (!dbInstance) {
    // Use separate database for E2E tests to avoid polluting production data
    let dbName: string;
    if (process.env.CACHE_DB_NAME) {
      dbName = process.env.CACHE_DB_NAME;
    } else if (process.env.NODE_ENV === 'test') {
      dbName = 'cache.test.db';
    } else if (process.env.NODE_ENV === 'development') {
      dbName = 'cache.dev.db';
    } else {
      dbName = 'cache.db';
    }
    const dbDir = resolveDbDir();
    const dbPath = path.join(dbDir, dbName);

    try {
      // Ensure data directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info('Created data directory', { dbDir });
      }

      dbInstance = new Database(dbPath);

      // Enable WAL mode for better concurrent access
      dbInstance.pragma('journal_mode = WAL');

      // Create tables
      dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS users (
          address TEXT PRIMARY KEY,
          rank INTEGER NOT NULL,
          username TEXT NOT NULL,
          avatar_cid TEXT NOT NULL,
          gm_streak INTEGER NOT NULL,
          xp INTEGER NOT NULL,
          level INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_users_expires_at ON users(expires_at);
        CREATE INDEX IF NOT EXISTS idx_users_rank ON users(rank);

        CREATE TABLE IF NOT EXISTS wallet_data (
          address TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_wallet_expires_at ON wallet_data(expires_at);

        CREATE TABLE IF NOT EXISTS avatars (
          cid TEXT PRIMARY KEY,
          expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_avatars_expires_at ON avatars(expires_at);
      `);

      // Clean up expired entries on startup
      cleanExpiredEntries();
    } catch (error) {
      logger.error('Failed to initialize database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dbPath,
      });
      throw error; // Re-throw to prevent silent failures
    }
  }

  return dbInstance;
}

/**
 * Clean up expired entries from all tables
 */
function cleanExpiredEntries(): void {
  const db = getDb();
  const now = Date.now();

  db.prepare('DELETE FROM users WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM wallet_data WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM avatars WHERE expires_at < ?').run(now);

  // Clear in-memory caches
  userCache.clear();
  walletCache.clear();
  avatarCache.clear();
}

/**
 * Validate user data structure before saving
 */
function isValidUserData(user: unknown): user is UserData {
  if (!user || typeof user !== 'object') return false;
  const u = user as Record<string, unknown>;
  return (
    typeof u.address === 'string' &&
    u.address.length > 0 &&
    u.address.length <= 100 &&
    typeof u.rank === 'number' &&
    u.rank >= 0 &&
    typeof u.username === 'string' &&
    u.username.length > 0 &&
    u.username.length <= 200 &&
    typeof u.avatarCid === 'string' &&
    u.avatarCid.length > 0 &&
    u.avatarCid.length <= 200 &&
    typeof u.gmStreak === 'number' &&
    u.gmStreak >= 0 &&
    typeof u.xp === 'number' &&
    u.xp >= 0 &&
    typeof u.level === 'number' &&
    u.level >= 0
  );
}

/**
 * Save Layer3 users to database with 24hr expiration
 */
export function saveUsers(users: UserData[]): void {
  const db = getDb();
  const expiresAt = Date.now() + TTL_MS;

  // Filter out invalid users to prevent corrupted data
  const validUsers = users.filter(isValidUserData);
  if (validUsers.length !== users.length) {
    logger.warn('Filtered out invalid users', {
      total: users.length,
      valid: validUsers.length,
      filtered: users.length - validUsers.length,
    });
  }

  if (validUsers.length === 0) {
    logger.warn('No valid users to save');
    return;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO users (address, rank, username, avatar_cid, gm_streak, xp, level, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((usersToSave: UserData[]) => {
    for (const user of usersToSave) {
      stmt.run(
        user.address,
        user.rank,
        user.username,
        user.avatarCid,
        user.gmStreak,
        user.xp,
        user.level,
        expiresAt
      );

      // Update in-memory cache
      userCache.set(user.address.toLowerCase(), { ...user, expiresAt });

      // Cache avatar CID as valid
      avatarCache.add(user.avatarCid);
    }
  });

  transaction(users);
}

/**
 * Get all cached users (non-expired only)
 */
export function getUsers(): UserData[] | null {
  const db = getDb();
  const now = Date.now();

  const users = db
    .prepare('SELECT * FROM users WHERE expires_at > ? ORDER BY rank ASC')
    .all(now) as Array<{
      address: string;
      rank: number;
      username: string;
      avatar_cid: string;
      gm_streak: number;
      xp: number;
      level: number;
      expires_at: number;
    }>;

  if (users.length === 0) {
    return null; // No cached data, need to fetch from API
  }

  // Update in-memory cache
  userCache.clear();
  avatarCache.clear();
  users.forEach((user) => {
    const userData: UserData = {
      address: user.address,
      rank: user.rank,
      username: user.username,
      avatarCid: user.avatar_cid,
      gmStreak: user.gm_streak,
      xp: user.xp,
      level: user.level,
    };
    userCache.set(user.address.toLowerCase(), { ...userData, expiresAt: user.expires_at });
    avatarCache.add(user.avatar_cid);
  });

  return users.map((user) => ({
    address: user.address,
    rank: user.rank,
    username: user.username,
    avatarCid: user.avatar_cid,
    gmStreak: user.gm_streak,
    xp: user.xp,
    level: user.level,
  }));
}

/**
 * Get user by address (checks cache first, then DB)
 */
export function getUserByAddress(address: string): UserData | null {
  const normalizedAddress = address.toLowerCase();
  const now = Date.now();

  // Check in-memory cache first
  const cached = userCache.get(normalizedAddress);
  if (cached && cached.expiresAt > now) {
    // Extract expiresAt to exclude it from userData
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expiresAt, ...userData } = cached;
    return userData;
  }

  // Check database
  const db = getDb();
  const user = db
    .prepare('SELECT * FROM users WHERE LOWER(address) = ? AND expires_at > ?')
    .get(normalizedAddress, now) as {
    address: string;
    rank: number;
    username: string;
    avatar_cid: string;
    gm_streak: number;
    xp: number;
    level: number;
    expires_at: number;
  } | undefined;

  if (!user) {
    return null;
  }

  const userData: UserData = {
    address: user.address,
    rank: user.rank,
    username: user.username,
    avatarCid: user.avatar_cid,
    gmStreak: user.gm_streak,
    xp: user.xp,
    level: user.level,
  };

  // Update cache
  userCache.set(normalizedAddress, { ...userData, expiresAt: user.expires_at });

  return userData;
}

/**
 * Check if an address is allowed (cached from Layer3 API)
 */
export function isAddressAllowed(address: string): boolean {
  const normalizedAddress = address.toLowerCase();
  const now = Date.now();

  // Check in-memory cache first
  const cached = userCache.get(normalizedAddress);
  if (cached && cached.expiresAt > now) {
    return true;
  }

  // Check database
  const db = getDb();
  const result = db
    .prepare('SELECT 1 FROM users WHERE LOWER(address) = ? AND expires_at > ?')
    .get(normalizedAddress, now);

  return result !== undefined;
}

/**
 * Check if an avatar CID is allowed (associated with a cached user)
 */
export function isAvatarAllowed(cid: string): boolean {
  const now = Date.now();

  // Check in-memory cache first
  if (avatarCache.has(cid)) {
    return true;
  }

  // Check database
  const db = getDb();
  const result = db
    .prepare('SELECT 1 FROM users WHERE avatar_cid = ? AND expires_at > ?')
    .get(cid, now);

  const isValid = result !== undefined;
  if (isValid) {
    avatarCache.add(cid);
  }

  return isValid;
}

/**
 * Save wallet data for an address
 */
export function saveWalletData(address: string, data: unknown): void {
  const db = getDb();
  const expiresAt = Date.now() + TTL_MS;
  const jsonData = JSON.stringify(data);

  db.prepare(`
    INSERT OR REPLACE INTO wallet_data (address, data, expires_at)
    VALUES (?, ?, ?)
  `).run(address.toLowerCase(), jsonData, expiresAt);

  // Update cache
  walletCache.set(address.toLowerCase(), { address, data: jsonData, expiresAt });
}

/**
 * Get cached wallet data for an address
 */
export function getWalletData(address: string): unknown | null {
  const normalizedAddress = address.toLowerCase();
  const now = Date.now();

  // Check in-memory cache first
  const cached = walletCache.get(normalizedAddress);
  if (cached && cached.expiresAt > now) {
    try {
      return JSON.parse(cached.data);
    } catch (error) {
      // Corrupted cache data - remove from cache and fall through to database
      logger.error('Failed to parse cached wallet data', {
        address: normalizedAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      walletCache.delete(normalizedAddress);
    }
  }

  // Check database
  const db = getDb();
  const result = db
    .prepare('SELECT data, expires_at FROM wallet_data WHERE address = ? AND expires_at > ?')
    .get(normalizedAddress, now) as { data: string; expires_at: number } | undefined;

  if (!result) {
    return null;
  }

  // Update cache with actual expiration time from database
  try {
    const parsed = JSON.parse(result.data);
    walletCache.set(normalizedAddress, {
      address: normalizedAddress,
      data: result.data,
      expiresAt: result.expires_at,
    });
    return parsed;
  } catch (error) {
    // Corrupted database data - delete it and return null
    logger.error('Failed to parse wallet data from database', {
      address: normalizedAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Delete corrupted entry
    db.prepare('DELETE FROM wallet_data WHERE address = ?').run(normalizedAddress);
    return null;
  }
}

/**
 * Clear all caches and close database connection
 * Used for testing or graceful shutdown
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  userCache.clear();
  walletCache.clear();
  avatarCache.clear();
}
