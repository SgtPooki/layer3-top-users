import { NextRequest, NextResponse } from 'next/server';
import type { VerifiedFetch } from '@helia/verified-fetch';
import type { Helia } from '@helia/interface';
import { createHeliaHTTP } from '@helia/http';
import { createVerifiedFetch } from '@helia/verified-fetch';
import { isAvatarAllowed } from '@/lib/db';
import { logger } from '@/lib/logger';

// Create long-running singleton instances that persist while the Next.js server is running
let heliaInstance: Helia | null = null;
let verifiedFetchInstance: VerifiedFetch | null = null;
const avatarCache = new Map<
  string,
  { data: Buffer; contentType: string; cacheControl?: string; expiresAt: number }
>();
const inFlight = new Map<string, Promise<{ data: Buffer; contentType: string; cacheControl?: string }>>();

// Mocking controls for tests/local development
const shouldMockIpfs =
  process.env.NODE_ENV === 'test' || process.env.MOCK_IPFS === 'true';

// 1x1 transparent PNG fallback for mocked responses
const mockAvatarPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const IPFS_TIMEOUT_MS = 30_000; // 30 seconds

async function getVerifiedFetch() {
  if (!heliaInstance) {
    heliaInstance = await createHeliaHTTP();
  }
  if (!verifiedFetchInstance) {
    verifiedFetchInstance = await createVerifiedFetch(heliaInstance);
  }
  return verifiedFetchInstance;
}

async function fetchFromIpfs(cid: string) {
  const verifiedFetch = await getVerifiedFetch();
  const response = await verifiedFetch(`ipfs://${cid}`, {
    signal: AbortSignal.timeout(IPFS_TIMEOUT_MS),
  });
  return response;
}

async function getAvatarFromIpfs(cid: string) {
  const now = Date.now();

  // Check cache first
  const cached = avatarCache.get(cid);
  if (cached && cached.expiresAt > now) {
    return cached;
  }

  // Check if already fetching to prevent duplicate requests
  const inFlightPromise = inFlight.get(cid);
  if (inFlightPromise) {
    const result = await inFlightPromise;
    return { ...result, expiresAt: now + CACHE_TTL_MS };
  }

  // Start new fetch
  const fetchPromise = (async () => {
    const response = await fetchFromIpfs(cid);
    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
    const cacheControl = response.headers.get('cache-control') ?? undefined;
    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    return { data, contentType, cacheControl };
  })();

  inFlight.set(cid, fetchPromise);
  try {
    const result = await fetchPromise;
    avatarCache.set(cid, { ...result, expiresAt: now + CACHE_TTL_MS });
    return { ...result, expiresAt: now + CACHE_TTL_MS };
  } finally {
    inFlight.delete(cid);
  }
}

// Force Node.js runtime to support native modules
export const runtime = 'nodejs';
// Disable Next.js fetch cache for this route (IPFS fetches can be long/abort)
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ cid: string }> }) {
  const { cid } = await params;

  if (!cid) {
    return NextResponse.json({ error: 'CID parameter is required' }, { status: 400 });
  }

  // Security: Only allow avatar lookups for CIDs from Layer3 API users
  if (!isAvatarAllowed(cid)) {
    return NextResponse.json(
      { error: 'Avatar retrieval not allowed for non-top users' },
      { status: 403 }
    );
  }

  // In tests/local dev we short-circuit IPFS calls to avoid network access
  if (shouldMockIpfs) {
    logger.info('Serving mocked avatar', { cid });
    return new NextResponse(mockAvatarPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Check cache first - if we have it, return immediately
  const now = Date.now();
  const cached = avatarCache.get(cid);
  if (cached && cached.expiresAt > now) {
    return new NextResponse(new Uint8Array(cached.data), {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        ...(cached.cacheControl && { 'Cache-Control': cached.cacheControl }),
      },
    });
  }

  // Fetch from IPFS (client handles loading state)
  try {
    const avatar = await getAvatarFromIpfs(cid);
    return new NextResponse(new Uint8Array(avatar.data), {
      status: 200,
      headers: {
        'Content-Type': avatar.contentType,
        ...(avatar.cacheControl && { 'Cache-Control': avatar.cacheControl }),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';

    logger.error('IPFS fetch failed', {
      cid,
      errorName,
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    // Return error - client handles displaying placeholder via AvatarImage onError callback
    return NextResponse.json(
      { error: 'Failed to fetch avatar from IPFS', cid },
      { status: 500 }
    );
  }
}
