/**
 * Blockchain explorer URL generators
 * Returns explorer URLs for transaction hashes based on blockchain
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
 * Get explorer URL for the first blockchain in the array, or null if none found
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
 * Format chain name for display
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

