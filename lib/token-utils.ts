/**
 * Token classification and formatting utilities
 *
 * This module provides utility functions for working with token balances,
 * including classification (top tokens, stablecoins, native), formatting,
 * and sorting logic.
 *
 * @module lib/token-utils
 */

import type { TokenBalance } from './wallet';

/**
 * Formats a token balance for display
 *
 * @param balance - Raw balance string to format
 * @returns Formatted balance with proper decimal places
 *
 * @example
 * ```typescript
 * formatBalance('1234.567890123'); // '1,234.567890'
 * formatBalance('0.000001');       // '0.000001'
 * formatBalance('invalid');        // '0'
 * ```
 */
export function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

/**
 * Formats a Unix timestamp for display
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(1640000000); // 'Dec 20, 2021, 12:13 AM'
 * ```
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Identifies "top" tokens (major cryptocurrencies on specific chains)
 *
 * @param balance - Token balance object to check
 * @returns True if token is considered a "top" token
 *
 * @remarks
 * Top tokens include:
 * - ETH on Ethereum or Base
 * - USDC on Base
 * - BTC on Bitcoin
 * - FIL on Filecoin
 */
export function isTopToken(balance: TokenBalance): boolean {
  const symbol = balance.tokenSymbol.toUpperCase();
  const blockchain = balance.blockchain.toLowerCase();

  return (
    (symbol === 'ETH' && (blockchain === 'eth' || blockchain === 'ethereum')) ||
    (symbol === 'ETH' && blockchain === 'base') ||
    (symbol === 'USDC' && blockchain === 'base') ||
    (symbol === 'BTC' && (blockchain === 'btc' || blockchain === 'bitcoin')) ||
    (symbol === 'FIL' && (blockchain === 'filecoin' || blockchain === 'fil'))
  );
}

/**
 * Identifies stablecoin tokens
 *
 * @param balance - Token balance object to check
 * @returns True if token is a known stablecoin
 *
 * @remarks
 * Checks against a list of common stablecoin symbols including
 * USDC, USDT, DAI, BUSD, FRAX, TUSD, USDP, USDX
 */
export function isStablecoin(balance: TokenBalance): boolean {
  const symbol = balance.tokenSymbol.toUpperCase();
  const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDP', 'USDX'];
  return stablecoins.includes(symbol);
}

/**
 * Identifies native blockchain tokens
 *
 * @param balance - Token balance object to check
 * @returns True if token is the native token of its blockchain
 *
 * @remarks
 * Native tokens are the primary currency of a blockchain:
 * - ETH on Ethereum
 * - MATIC on Polygon
 * - AVAX on Avalanche
 * - BNB on BSC
 * - BTC on Bitcoin
 * - FIL on Filecoin
 */
export function isNativeToken(balance: TokenBalance): boolean {
  const symbol = balance.tokenSymbol.toUpperCase();
  const blockchain = balance.blockchain.toLowerCase();

  return (
    (symbol === 'ETH' && (blockchain === 'eth' || blockchain === 'ethereum')) ||
    (symbol === 'MATIC' && blockchain === 'polygon') ||
    (symbol === 'AVAX' && blockchain === 'avalanche') ||
    (symbol === 'BNB' && blockchain === 'bsc') ||
    (symbol === 'BTC' && (blockchain === 'btc' || blockchain === 'bitcoin')) ||
    (symbol === 'FIL' && (blockchain === 'filecoin' || blockchain === 'fil'))
  );
}

/**
 * Sorts top tokens in a specific priority order
 *
 * @param tokens - Array of token balances to sort
 * @returns Sorted array with top tokens in priority order
 *
 * @remarks
 * Priority order:
 * 1. ETH (Ethereum)
 * 2. ETH (Base)
 * 3. USDC (Base)
 * 4. BTC (Bitcoin)
 * 5. FIL (Filecoin)
 */
export function sortTopTokens(tokens: TokenBalance[]): TokenBalance[] {
  return [...tokens].sort((a, b) => {
    const aSymbol = a.tokenSymbol.toUpperCase();
    const bSymbol = b.tokenSymbol.toUpperCase();
    const aChain = a.blockchain.toLowerCase();
    const bChain = b.blockchain.toLowerCase();

    const order = [
      { symbol: 'ETH', chain: 'eth' },
      { symbol: 'ETH', chain: 'ethereum' },
      { symbol: 'ETH', chain: 'base' },
      { symbol: 'USDC', chain: 'base' },
      { symbol: 'BTC', chain: 'btc' },
      { symbol: 'BTC', chain: 'bitcoin' },
      { symbol: 'FIL', chain: 'filecoin' },
      { symbol: 'FIL', chain: 'fil' },
    ];

    const aIndex = order.findIndex(
      (o) => o.symbol === aSymbol && (o.chain === aChain || aChain.includes(o.chain))
    );
    const bIndex = order.findIndex(
      (o) => o.symbol === bSymbol && (o.chain === bChain || bChain.includes(o.chain))
    );

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
}
