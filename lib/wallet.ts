/**
 * Wallet data fetching utilities using Ankr Advanced API and RPC
 *
 * This module provides functions to interact with the Ankr Advanced API to fetch
 * blockchain wallet data including token balances, NFTs, POAPs, and transactions.
 *
 * @module lib/wallet
 * @see {@link https://www.ankr.com/docs/advanced-api/ | Ankr Advanced API Documentation}
 *
 * @remarks
 * - All functions gracefully handle errors by returning empty arrays/null
 * - API calls use JSON-RPC 2.0 protocol
 * - Multichain endpoint queries all supported blockchains when blockchain array is empty
 *
 * @security
 * - API key must be kept confidential
 * - Never expose API key in client-side code
 * - Use API routes as proxy to protect API keys
 */

import { logger } from './logger';

const ANKR_API_BASE = 'https://rpc.ankr.com/multichain';
const FETCH_TIMEOUT = 10000; // 10 seconds

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
      throw new Error(`Request timeout: API did not respond within ${timeout}ms`);
    }
    throw error;
  }
}

export interface TokenBalance {
  blockchain: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenType: string;
  contractAddress: string | null;
  holderAddress: string;
  balance: string;
  balanceRawInteger: string;
  balanceUsd: string | null;
  tokenPrice: string | null;
}

export interface NFT {
  blockchain: string[];
  name: string;
  tokenId: string;
  tokenUrl: string | null;
  imageUrl: string | null;
  collectionName: string;
  collectionAddress: string;
  marketplace: string;
  attributes: Array<{
    traitType: string;
    value: string | number;
  }>;
  lastTransferTimestamp: string | null;
  lastTransferHash: string | null;
  mintedTimestamp: string | null;
  mintedHash: string | null;
  rarity: {
    rank: number | null;
    score: number | null;
  };
  rarityScore: number | null;
  rarityRank: number | null;
}

export interface Transaction {
  hash: string;
  blockchain: string[];
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'success' | 'failed';
  tokenSymbol?: string;
  tokenName?: string;
  contractAddress?: string;
}

export interface WalletData {
  balances: TokenBalance[];
  nfts: NFT[];
  poaps: NFT[];
  lastTransaction: Transaction | null;
}

/**
 * Fetches all token balances for a given wallet address across multiple blockchains.
 *
 * Uses Ankr's `ankr_getAccountBalance` method to query balances across all supported
 * blockchains in a single API call. Returns both native tokens (ETH, MATIC, etc.) and
 * ERC-20/fungible tokens.
 *
 * @param walletAddress - Ethereum-compatible wallet address (0x...)
 * @param apiKey - Ankr API key for authentication
 * @returns Promise resolving to array of token balances with USD values
 *
 * @example
 * ```typescript
 * const balances = await getWalletBalances('0x1234...', apiKey);
 * const totalUsd = balances.reduce((sum, b) => sum + parseFloat(b.balanceUsd || '0'), 0);
 * ```
 *
 * @remarks
 * - Empty blockchain array queries all supported chains
 * - Returns up to 50 assets (configurable via pageSize)
 * - USD values may be null if price data unavailable
 * - Returns empty array on error to prevent crashes
 *
 * @see {@link https://www.ankr.com/docs/advanced-api/api-methods/#ankr_getaccountbalance | API Documentation}
 */
export async function getWalletBalances(
  walletAddress: string,
  apiKey: string
): Promise<TokenBalance[]> {
  try {
    // Ankr Advanced API format: https://rpc.ankr.com/multichain/{api_key}
    const response = await fetchWithTimeout(
      `${ANKR_API_BASE}/${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'ankr_getAccountBalance',
          params: {
            blockchain: [], // Empty array queries all supported blockchains
            walletAddress,
            pageSize: 50,
          },
          id: 1,
        }),
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Unknown error fetching balances');
    }

    return data.result?.assets || [];
  } catch (error) {
    logger.error('Error fetching wallet balances', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Fetches all NFTs owned by a wallet address and separates POAPs from regular NFTs.
 *
 * Uses Ankr's `ankr_getNFTsByOwner` method to retrieve NFT holdings. Automatically
 * detects and separates POAP (Proof of Attendance Protocol) tokens from standard NFTs
 * based on marketplace and collection name.
 *
 * @param walletAddress - Ethereum-compatible wallet address (0x...)
 * @param apiKey - Ankr API key for authentication
 * @returns Promise resolving to object containing separate nfts and poaps arrays
 *
 * @example
 * ```typescript
 * const { nfts, poaps } = await getWalletNFTs('0x1234...', apiKey);
 * console.log(`Found ${nfts.length} NFTs and ${poaps.length} POAPs`);
 * ```
 *
 * @remarks
 * - POAP detection is case-insensitive
 * - Checks marketplace, collectionName, and blockchain fields for 'poap'
 * - Returns up to 50 NFTs (configurable via pageSize)
 * - Includes metadata: images, attributes, rarity, timestamps
 * - Returns empty arrays on error
 *
 * @see {@link https://www.ankr.com/docs/advanced-api/api-methods/#ankr_getnftsbyowner | API Documentation}
 */
export async function getWalletNFTs(
  walletAddress: string,
  apiKey: string
): Promise<{ nfts: NFT[]; poaps: NFT[] }> {
  try {
    const response = await fetchWithTimeout(
      `${ANKR_API_BASE}/${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'ankr_getNFTsByOwner',
          params: {
            walletAddress,
            pageSize: 50,
          },
          id: 1,
        }),
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Unknown error fetching NFTs');
    }

    const allNFTs: NFT[] = data.result?.assets || [];

    // Separate POAPs from regular NFTs
    // POAPs typically have marketplace "poap" or collectionName containing "POAP"
    const poaps = allNFTs.filter(
      (nft) =>
        nft.marketplace?.toLowerCase().includes('poap') ||
        nft.collectionName?.toLowerCase().includes('poap') ||
        (Array.isArray(nft.blockchain) &&
          nft.blockchain.some((chain) => chain.toLowerCase().includes('poap')))
    );

    const nfts = allNFTs.filter((nft) => !poaps.includes(nft));

    return { nfts, poaps };
  } catch (error) {
    logger.error('Error fetching wallet NFTs', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { nfts: [], poaps: [] };
  }
}

/**
 * Fetches recent transactions for a wallet address across multiple blockchains.
 *
 * Uses Ankr's `ankr_getTransactionsByAddress` method to retrieve transaction history
 * in descending order (most recent first).
 *
 * @param walletAddress - Ethereum-compatible wallet address (0x...)
 * @param apiKey - Ankr API key for authentication
 * @param limit - Maximum number of transactions to return (default: 10)
 * @returns Promise resolving to array of transaction objects
 *
 * @example
 * ```typescript
 * const recentTxs = await getWalletTransactions('0x1234...', apiKey, 5);
 * const lastTx = recentTxs[0];
 * ```
 *
 * @remarks
 * - Transactions are returned in descending order (newest first)
 * - Includes both native and token transfers
 * - Transaction status is normalized to 'success' or 'failed'
 * - Returns empty array on error
 *
 * @see {@link https://www.ankr.com/docs/advanced-api/api-methods/#ankr_gettransactionsbyaddress | API Documentation}
 */
export async function getWalletTransactions(
  walletAddress: string,
  apiKey: string,
  limit: number = 10
): Promise<Transaction[]> {
  try {
    // Using Ankr's query API to get transactions
    const response = await fetchWithTimeout(
      `${ANKR_API_BASE}/${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'ankr_getTransactionsByAddress',
          params: {
            blockchain: [],
            address: walletAddress,
            pageSize: limit,
            descOrder: true,
          },
          id: 1,
        }),
      },
      FETCH_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Unknown error fetching transactions');
    }

    return data.result?.transactions || [];
  } catch (error) {
    logger.error('Error fetching wallet transactions', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Fetches comprehensive wallet data in a single operation using parallel requests.
 *
 * This is the main entry point for retrieving all wallet information. It fetches
 * balances, NFTs, POAPs, and the most recent transaction concurrently using Promise.all
 * for optimal performance.
 *
 * @param walletAddress - Ethereum-compatible wallet address (0x...)
 * @param apiKey - Ankr API key for authentication
 * @returns Promise resolving to WalletData object containing all wallet information
 *
 * @example
 * ```typescript
 * const walletData = await getWalletData('0x1234...', process.env.ANKR_API_KEY!);
 * const { balances, nfts, poaps, lastTransaction } = walletData;
 *
 * // Calculate total portfolio value
 * const totalValue = balances.reduce((sum, b) =>
 *   sum + parseFloat(b.balanceUsd || '0'), 0
 * );
 * ```
 *
 * @remarks
 * Performance Optimization:
 * - Uses Promise.all to fetch data in parallel (not sequentially)
 * - Reduces total fetch time from ~3s to ~1s
 * - Each API call has independent error handling
 *
 * Data Extraction:
 * - Last transaction includes complex field extraction for blockchain/token info
 * - Handles multiple possible field names from Ankr API response
 * - Normalizes transaction data to consistent Transaction interface
 *
 * Error Handling:
 * - If any fetch fails, that section returns empty data
 * - Other sections continue successfully
 * - Never throws, always returns valid WalletData structure
 *
 * @see {@link WalletData} for return type structure
 * @see {@link getWalletBalances} for balance fetching details
 * @see {@link getWalletNFTs} for NFT fetching details
 * @see {@link getWalletTransactions} for transaction fetching details
 */
export async function getWalletData(
  walletAddress: string,
  apiKey: string
): Promise<WalletData> {
  try {
    const [balances, { nfts, poaps }, transactions] = await Promise.all([
      getWalletBalances(walletAddress, apiKey),
      getWalletNFTs(walletAddress, apiKey),
      getWalletTransactions(walletAddress, apiKey, 1),
    ]);

    const lastTransaction: Transaction | null =
      transactions.length > 0
        ? {
            hash: transactions[0].hash || '',
            blockchain: (() => {
              // Try multiple ways to extract blockchain
              const tx = transactions[0];
              if (Array.isArray(tx.blockchain)) {
                return tx.blockchain;
              }
              if (tx.blockchain && typeof tx.blockchain === 'string') {
                return [tx.blockchain];
              }
              // Check if it's in a different field
              const txAny = tx as unknown as Record<string, unknown>;
              if (txAny.blockchain && typeof txAny.blockchain === 'string') {
                return [txAny.blockchain];
              }
              if (txAny.chain && typeof txAny.chain === 'string') {
                return [txAny.chain];
              }
              if (Array.isArray(txAny.chains)) {
                return txAny.chains as string[];
              }
              return [];
            })(),
            from: transactions[0].from || '',
            to: transactions[0].to || '',
            value: transactions[0].value || '0',
            timestamp: transactions[0].timestamp || 0,
            status: transactions[0].status === 'failed' ? 'failed' : 'success',
            // Extract token info from transaction if available
            tokenSymbol: (() => {
              const tx = transactions[0] as unknown as Record<string, unknown>;
              if (tx.tokenSymbol) return String(tx.tokenSymbol);
              if (tx.asset && typeof tx.asset === 'object' && tx.asset !== null) {
                const asset = tx.asset as Record<string, unknown>;
                if (asset.symbol) return String(asset.symbol);
              }
              if (tx.token && typeof tx.token === 'object' && tx.token !== null) {
                const token = tx.token as Record<string, unknown>;
                if (token.symbol) return String(token.symbol);
              }
              return undefined;
            })(),
            tokenName: (() => {
              const tx = transactions[0] as unknown as Record<string, unknown>;
              if (tx.tokenName) return String(tx.tokenName);
              if (tx.asset && typeof tx.asset === 'object' && tx.asset !== null) {
                const asset = tx.asset as Record<string, unknown>;
                if (asset.name) return String(asset.name);
              }
              if (tx.token && typeof tx.token === 'object' && tx.token !== null) {
                const token = tx.token as Record<string, unknown>;
                if (token.name) return String(token.name);
              }
              return undefined;
            })(),
            contractAddress: (() => {
              const tx = transactions[0] as unknown as Record<string, unknown>;
              if (tx.contractAddress) return String(tx.contractAddress);
              if (tx.asset && typeof tx.asset === 'object' && tx.asset !== null) {
                const asset = tx.asset as Record<string, unknown>;
                if (asset.contractAddress) return String(asset.contractAddress);
              }
              if (tx.token && typeof tx.token === 'object' && tx.token !== null) {
                const token = tx.token as Record<string, unknown>;
                if (token.contractAddress) return String(token.contractAddress);
              }
              return undefined;
            })(),
          }
        : null;

    return {
      balances,
      nfts,
      poaps,
      lastTransaction,
    };
  } catch (error) {
    logger.error('Error fetching wallet data', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      balances: [],
      nfts: [],
      poaps: [],
      lastTransaction: null,
    };
  }
}

