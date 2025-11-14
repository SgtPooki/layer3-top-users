/**
 * Wallet data fetching utilities using Ankr Advanced API and RPC
 * Reference: https://www.ankr.com/docs/advanced-api/react-hooks/
 */

const ANKR_API_BASE = 'https://rpc.ankr.com/multichain';

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
 * Get token balances for a wallet address
 * Using Ankr Advanced API - https://www.ankr.com/docs/advanced-api/
 */
export async function getWalletBalances(
  walletAddress: string,
  apiKey: string
): Promise<TokenBalance[]> {
  try {
    // Ankr Advanced API format: https://rpc.ankr.com/multichain/{api_key}
    const response = await fetch(`${ANKR_API_BASE}/${apiKey}`, {
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
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Unknown error fetching balances');
    }

    return data.result?.assets || [];
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return [];
  }
}

/**
 * Get NFTs (including POAPs) for a wallet address
 */
export async function getWalletNFTs(
  walletAddress: string,
  apiKey: string
): Promise<{ nfts: NFT[]; poaps: NFT[] }> {
  try {
    const response = await fetch(`${ANKR_API_BASE}/${apiKey}`, {
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
    });

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
        nft.blockchain?.some((chain) => chain.toLowerCase().includes('poap'))
    );

    const nfts = allNFTs.filter((nft) => !poaps.includes(nft));

    return { nfts, poaps };
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    return { nfts: [], poaps: [] };
  }
}

/**
 * Get recent transactions for a wallet address
 */
export async function getWalletTransactions(
  walletAddress: string,
  apiKey: string,
  limit: number = 10
): Promise<Transaction[]> {
  try {
    // Using Ankr's query API to get transactions
    const response = await fetch(`${ANKR_API_BASE}/${apiKey}`, {
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
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Unknown error fetching transactions');
    }

    return data.result?.transactions || [];
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
}

/**
 * Get all wallet data (balances, NFTs, POAPs, last transaction)
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
    console.error('Error fetching wallet data:', error);
    return {
      balances: [],
      nfts: [],
      poaps: [],
      lastTransaction: null,
    };
  }
}

