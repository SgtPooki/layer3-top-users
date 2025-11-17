/**
 * Blockchain explorer URL generators
 *
 * This module provides utilities to generate blockchain explorer URLs for transactions,
 * format chain names for display, and handle chain name variations.
 *
 * @module lib/explorers
 *
 * @remarks
 * Supported blockchains:
 * - Ethereum (Etherscan)
 * - Base (Basescan)
 * - Optimism (Optimistic Etherscan)
 * - Arbitrum (Arbiscan)
 * - Polygon (Polygonscan)
 * - Avalanche (Snowtrace)
 * - BSC (BscScan)
 * - Filecoin (Filfox)
 *
 * Features:
 * - Handles chain name variations (e.g., 'eth', 'ethereum', '1')
 * - Supports both full names and chain IDs
 * - Case-insensitive matching
 * - Partial matching (e.g., 'polygon-mainnet' -> 'polygon')
 */

/**
 * Generates a blockchain explorer URL for a given transaction hash.
 *
 * Supports multiple chain identifier formats including full names, short names,
 * and numeric chain IDs. Performs case-insensitive matching and supports partial
 * matches for composite chain names (e.g., 'ethereum-mainnet').
 *
 * @param chain - Blockchain identifier (e.g., 'ethereum', 'eth', '1', 'polygon-mainnet')
 * @param txHash - Transaction hash to link to
 * @returns Explorer URL string or null if chain not supported
 *
 * @example
 * ```typescript
 * // All of these work:
 * getExplorerUrl('ethereum', '0xabc...'); // Etherscan
 * getExplorerUrl('eth', '0xabc...');      // Etherscan
 * getExplorerUrl('1', '0xabc...');        // Etherscan
 * getExplorerUrl('polygon', '0xdef...');  // Polygonscan
 * getExplorerUrl('137', '0xdef...');      // Polygonscan
 * ```
 *
 * @remarks
 * - Matching is case-insensitive
 * - Tries exact match first, then partial match
 * - Returns null for unsupported chains
 * - Chain IDs are supported as strings (not numbers)
 */
export function getExplorerUrl(chain: string, txHash: string): string | null {
  const chainLower = chain.toLowerCase();

  // Map common chain identifiers to explorer URLs
  const explorers: Record<string, (hash: string) => string> = {
    // Ethereum mainnet
    eth: (hash) => `https://etherscan.io/tx/${hash}`,
    ethereum: (hash) => `https://etherscan.io/tx/${hash}`,
    '1': (hash) => `https://etherscan.io/tx/${hash}`,

    // Base
    base: (hash) => `https://basescan.org/tx/${hash}`,
    '8453': (hash) => `https://basescan.org/tx/${hash}`,

    // Optimism
    optimism: (hash) => `https://optimistic.etherscan.io/tx/${hash}`,
    '10': (hash) => `https://optimistic.etherscan.io/tx/${hash}`,

    // Arbitrum
    arbitrum: (hash) => `https://arbiscan.io/tx/${hash}`,
    '42161': (hash) => `https://arbiscan.io/tx/${hash}`,

    // Polygon
    polygon: (hash) => `https://polygonscan.com/tx/${hash}`,
    '137': (hash) => `https://polygonscan.com/tx/${hash}`,

    // Avalanche
    avalanche: (hash) => `https://snowtrace.io/tx/${hash}`,
    avax: (hash) => `https://snowtrace.io/tx/${hash}`,
    '43114': (hash) => `https://snowtrace.io/tx/${hash}`,

    // BSC
    bsc: (hash) => `https://bscscan.com/tx/${hash}`,
    binance: (hash) => `https://bscscan.com/tx/${hash}`,
    '56': (hash) => `https://bscscan.com/tx/${hash}`,

    // Filecoin
    filecoin: (hash) => `https://filfox.info/en/message/${hash}`,
    fil: (hash) => `https://filfox.info/en/message/${hash}`,
  };

  // Try exact match first
  if (explorers[chainLower]) {
    return explorers[chainLower](txHash);
  }

  // Try partial match (e.g., "polygon-mainnet" -> "polygon")
  for (const [key, fn] of Object.entries(explorers)) {
    if (chainLower.includes(key)) {
      return fn(txHash);
    }
  }

  return null;
}

/**
 * Gets explorer URL for the first recognized blockchain in an array.
 *
 * Useful when a transaction spans multiple chains or when the exact chain
 * is unknown. Iterates through the array and returns the first valid explorer URL.
 *
 * @param blockchains - Array of blockchain identifiers
 * @param txHash - Transaction hash to link to
 * @returns Explorer URL for first recognized chain, or null if none found
 *
 * @example
 * ```typescript
 * // Transaction on multiple chains
 * const chains = ['ethereum', 'polygon', 'base'];
 * const url = getExplorerUrlForBlockchains(chains, '0xabc...');
 * // Returns Etherscan URL (first match)
 * ```
 *
 * @remarks
 * - Returns URL for first matching blockchain
 * - Returns null if no blockchains match or array is empty
 * - Order of blockchain array matters
 */
export function getExplorerUrlForBlockchains(
  blockchains: string[],
  txHash: string
): string | null {
  if (!Array.isArray(blockchains) || blockchains.length === 0) {
    return null;
  }

  // Try each blockchain until we find one with an explorer
  for (const chain of blockchains) {
    const url = getExplorerUrl(chain, txHash);
    if (url) {
      return url;
    }
  }

  return null;
}

/**
 * Formats a blockchain identifier into a human-readable display name.
 *
 * Converts technical chain identifiers (short names, chain IDs, kebab-case) into
 * properly capitalized display names suitable for UI presentation.
 *
 * @param chain - Blockchain identifier in any format
 * @returns Formatted, human-readable chain name
 *
 * @example
 * ```typescript
 * formatChainName('eth');                // 'Ethereum'
 * formatChainName('1');                  // 'Ethereum'
 * formatChainName('bsc');                // 'BNB Smart Chain'
 * formatChainName('polygon-mainnet');    // 'Polygon'
 * formatChainName('some-unknown-chain'); // 'Some Unknown Chain'
 * ```
 *
 * @remarks
 * - Case-insensitive input
 * - Handles partial matches (e.g., 'ethereum-mainnet' -> 'Ethereum')
 * - Falls back to title-case formatting for unknown chains
 * - Splits on hyphens, underscores, and spaces for fallback formatting
 */
export function formatChainName(chain: string): string {
  const chainLower = chain.toLowerCase();

  const chainNames: Record<string, string> = {
    eth: 'Ethereum',
    ethereum: 'Ethereum',
    base: 'Base',
    optimism: 'Optimism',
    arbitrum: 'Arbitrum',
    polygon: 'Polygon',
    avalanche: 'Avalanche',
    avax: 'Avalanche',
    bsc: 'BNB Smart Chain',
    binance: 'BNB Smart Chain',
    filecoin: 'Filecoin',
    fil: 'Filecoin',
  };

  // Try exact match
  if (chainNames[chainLower]) {
    return chainNames[chainLower];
  }

  // Try partial match
  for (const [key, name] of Object.entries(chainNames)) {
    if (chainLower.includes(key)) {
      return name;
    }
  }

  // Capitalize first letter of each word if no match found
  return chain
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

