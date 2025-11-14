import { NextRequest, NextResponse } from 'next/server';
import type { VerifiedFetch } from '@helia/verified-fetch';
import type { Helia } from '@helia/interface';
import { createHeliaHTTP } from '@helia/http';
import { createVerifiedFetch } from '@helia/verified-fetch';

// Create long-running singleton instances that persist while the Next.js server is running
let heliaInstance: Helia | null = null;
let verifiedFetchInstance: VerifiedFetch | null = null;

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

    // Get verified fetch instance and use it to fetch from IPFS
    const verifiedFetch = await getVerifiedFetch();
    const response = await verifiedFetch(`ipfs://${cid}`);

    if (!response.ok) {
      console.error(`Failed to fetch IPFS content for CID ${cid}: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching avatar from IPFS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error while fetching avatar',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}
