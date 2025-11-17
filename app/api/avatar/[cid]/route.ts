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

// Mocking controls for tests/local development
const shouldMockIpfs =
  process.env.NODE_ENV === 'test' || process.env.MOCK_IPFS === 'true';

// 1x1 transparent PNG fallback for mocked responses
const mockAvatarPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function getVerifiedFetch() {
  if (!heliaInstance) {
    heliaInstance = await createHeliaHTTP();
  }
  if (!verifiedFetchInstance) {
    verifiedFetchInstance = await createVerifiedFetch(heliaInstance);
  }
  return verifiedFetchInstance;
}

// Force Node.js runtime to support native modules
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ cid: string }> }) {
  try {
    const { cid } = await params;

    if (!cid) {
      return NextResponse.json(
        { error: 'CID parameter is required' },
        { status: 400 }
      );
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
          // long cache since content is deterministic mock
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Get verified fetch instance and use it to fetch from IPFS
    const verifiedFetch = await getVerifiedFetch();
    let response: Response;

    try {
      response = await verifiedFetch(`ipfs://${cid}`);
    } catch (fetchError) {
      logger.error('Error during IPFS fetch', {
        cid,
        errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
        errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
        errorStack: fetchError instanceof Error ? fetchError.stack : undefined,
      });
      throw fetchError;
    }

    if (!response.ok) {
      logger.error('Failed to fetch IPFS content', {
        cid,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      return NextResponse.json(
        { error: 'Failed to fetch image from IPFS' },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    // Stream the response directly from verified-fetch, which includes cache headers for ipfs content as appropriate
    const headers = new Headers(response.headers);

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const { cid } = await params;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';

    logger.error('Error fetching avatar from IPFS', {
      cid,
      errorName,
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
      errorString: String(error),
    });

    // Return more specific status codes based on error type
    let statusCode = 500;
    if (errorName === 'AbortError' || errorMessage.includes('aborted')) {
      statusCode = 504; // Gateway Timeout
    }

    return NextResponse.json(
      {
        error: 'Internal server error while fetching avatar',
        ...(process.env.NODE_ENV === 'development' && {
          details: errorMessage,
          errorName,
        })
      },
      { status: statusCode }
    );
  }
}
