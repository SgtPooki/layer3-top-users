import { NextResponse } from 'next/server';
import type { UserData } from '@/lib/types';
import { getUsers, saveUsers } from '@/lib/db';

const LAYER3_API_URL = 'https://layer3.xyz/api/assignment/users';
const CACHE_DURATION = 60; // seconds (for CDN edge caching)
const FETCH_TIMEOUT = 10000; // 10 seconds

interface Layer3ApiResponse {
  users: UserData[];
}

// Helper function to add timeout to fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Layer3 API did not respond in time');
    }
    throw error;
  }
}

export async function GET() {
  try {
    // Check database cache first (24hr TTL)
    const cachedUsers = getUsers();
    if (cachedUsers) {
      console.log(`Serving ${cachedUsers.length} users from database cache`);
      return NextResponse.json(
        { users: cachedUsers },
        {
          status: 200,
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Cache miss - fetch from Layer3 API
    console.log('Cache miss - fetching users from Layer3 API');
    const response = await fetchWithTimeout(
      LAYER3_API_URL,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Layer3 API error: ${response.status} ${response.statusText}`, errorText);

      return NextResponse.json(
        {
          error: 'Failed to fetch users from Layer3 API',
          status: response.status,
          message: response.statusText
        },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data: Layer3ApiResponse = await response.json();

    // Validate response structure
    if (!data || !Array.isArray(data.users)) {
      console.error('Invalid response structure from Layer3 API:', data);
      return NextResponse.json(
        { error: 'Invalid response format from Layer3 API' },
        { status: 502 }
      );
    }

    // Save to database cache with 24hr expiry
    saveUsers(data.users);
    console.log(`Cached ${data.users.length} users to database`);

    // Return users array directly for easier consumption
    return NextResponse.json(
      { users: data.users },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching users:', error);

    // Don't expose internal error details in production
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error while fetching users',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}

