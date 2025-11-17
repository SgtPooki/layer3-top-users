import { NextRequest, NextResponse } from 'next/server';
import { getWalletData } from '@/lib/wallet';
import { isAddress } from 'viem';
import { isAddressAllowed, getWalletData as getCachedWalletData, saveWalletData } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const apiKey = process.env.ANKR_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANKR_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Security: Only allow wallet lookups for addresses from Layer3 API
    if (!isAddressAllowed(address)) {
      return NextResponse.json(
        { error: 'Address not found in top users list' },
        { status: 403 }
      );
    }

    // Check cache first
    const cached = getCachedWalletData(address);
    if (cached) {
      console.log(`Serving wallet data for ${address} from cache`);
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

    // Cache miss - fetch from Ankr API
    console.log(`Cache miss - fetching wallet data for ${address} from Ankr API`);
    const walletData = await getWalletData(address, apiKey);

    // Save to cache
    saveWalletData(address, walletData);

    return NextResponse.json(walletData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch wallet data',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}

