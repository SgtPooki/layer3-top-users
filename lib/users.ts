import type { UserData, UsersApiResponse } from './types';
import { getUsers as getCachedUsers, getUserByAddress as getCachedUserByAddress } from './db';
import { logger } from './logger';

/**
 * Fetches the list of top Layer3 users.
 *
 * Server-side usage (in Server Components, API routes):
 * - Reads from database cache first (24hr TTL)
 * - Falls back to API fetch if cache is empty
 *
 * Client-side usage (in Client Components):
 * - Fetches from /api/users endpoint
 *
 * This function handles:
 * - Environment-aware URL construction (local, Vercel, or custom)
 * - HTTP caching with 60s CDN cache
 * - Error handling with graceful degradation
 * - Response validation
 *
 * @returns Promise<UserData[]> - Array of user data, empty array on error
 *
 * @example
 * ```tsx
 * const users = await getUsers();
 * if (users.length === 0) {
 *   // Handle empty state
 * }
 * ```
 *
 * @remarks
 * - Server: Uses DB cache with 24hr TTL, falls back to API
 * - Client: Uses HTTP caching with 60s CDN cache for optimal performance
 * - Returns empty array on error to prevent page crashes
 * - Logs errors to console for debugging
 */
export async function getUsers(): Promise<UserData[]> {
  try {
    // Server-side: Try database cache first
    if (typeof window === 'undefined') {
      const cached = getCachedUsers();
      if (cached) {
        return cached;
      }
      // Cache miss - will fetch from API and cache will be populated by /api/users
    }

    // Client-side OR server-side cache miss: fetch from API
    // Construct base URL based on environment
    // Priority: NEXT_PUBLIC_BASE_URL > Vercel URL > localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000');
    const apiUrl = `${baseUrl}/api/users`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // HTTP cache: Revalidate every 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
    }

    const data: UsersApiResponse = await response.json();

    // Validate response structure
    if (!data.users || !Array.isArray(data.users)) {
      throw new Error('Invalid response format from API');
    }

    return data.users.sort((a, b) => a.rank - b.rank);
  } catch (error) {
    logger.error('Error fetching users', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return empty array on error to prevent page crash
    // In production, consider using error boundaries or Sentry logging
    return [];
  }
}

/**
 * Finds a specific user by their wallet address.
 *
 * Server-side usage:
 * - Checks database cache first for O(1) lookup
 * - Falls back to fetching all users if not in cache
 *
 * Client-side usage:
 * - Fetches all users and performs linear search
 *
 * @param address - Ethereum wallet address (0x...)
 * @returns Promise<UserData | undefined> - User data if found, undefined otherwise
 *
 * @example
 * ```tsx
 * const user = await getUserByAddress('0x1234...');
 * if (!user) {
 *   return <NotFound />;
 * }
 * ```
 */
export async function getUserByAddress(address: string): Promise<UserData | undefined> {
  // Server-side: Try direct DB lookup (O(1) with cache)
  if (typeof window === 'undefined') {
    const cached = getCachedUserByAddress(address);
    if (cached) {
      return cached;
    }
  }

  // Client-side OR server-side cache miss: fetch all users and search
  const users = await getUsers();
  return users.find((user) => user.address === address);
}
