import { NextRequest, NextResponse } from 'next/server';
import { getWalletData } from '@/lib/wallet';

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

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    const walletData = await getWalletData(address, apiKey);

    return NextResponse.json(walletData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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

