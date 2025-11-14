'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { WalletData, TokenBalance } from '@/lib/wallet';
import { getExplorerUrlForBlockchains, formatChainName } from '@/lib/explorers';
import { TokenFilter, type FilterOption } from './TokenFilter';

interface WalletInfoProps {
  walletAddress: string;
}

export function WalletInfo({ walletAddress }: WalletInfoProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('all');

  useEffect(() => {
    async function fetchWalletData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/wallet/${walletAddress}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch wallet data: ${response.statusText}`);
        }

        const data: WalletData = await response.json();
        setWalletData(data);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
      } finally {
        setLoading(false);
      }
    }

    if (walletAddress) {
      fetchWalletData();
    }
  }, [walletAddress]);

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Identify top tokens: ETH on Ethereum, ETH on Base, USDC on Base, Bitcoin, Filecoin
  const isTopToken = (balance: TokenBalance): boolean => {
    const symbol = balance.tokenSymbol.toUpperCase();
    const blockchain = balance.blockchain.toLowerCase();

    return (
      (symbol === 'ETH' && (blockchain === 'eth' || blockchain === 'ethereum')) ||
      (symbol === 'ETH' && blockchain === 'base') ||
      (symbol === 'USDC' && blockchain === 'base') ||
      (symbol === 'BTC' && (blockchain === 'btc' || blockchain === 'bitcoin')) ||
      (symbol === 'FIL' && (blockchain === 'filecoin' || blockchain === 'fil'))
    );
  };

  // Check if token is a stablecoin
  const isStablecoin = (balance: TokenBalance): boolean => {
    const symbol = balance.tokenSymbol.toUpperCase();
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDP', 'USDX'];
    return stablecoins.includes(symbol);
  };

  // Check if token is native token
  const isNativeToken = (balance: TokenBalance): boolean => {
    const symbol = balance.tokenSymbol.toUpperCase();
    const blockchain = balance.blockchain.toLowerCase();

    // Native tokens typically match their chain
    return (
      (symbol === 'ETH' && (blockchain === 'eth' || blockchain === 'ethereum')) ||
      (symbol === 'MATIC' && blockchain === 'polygon') ||
      (symbol === 'AVAX' && blockchain === 'avalanche') ||
      (symbol === 'BNB' && blockchain === 'bsc') ||
      (symbol === 'BTC' && (blockchain === 'btc' || blockchain === 'bitcoin')) ||
      (symbol === 'FIL' && (blockchain === 'filecoin' || blockchain === 'fil'))
    );
  };

  // Separate top tokens from other tokens
  const topTokens = useMemo(() => {
    if (!walletData) return [];

    const top: TokenBalance[] = [];

    walletData.balances.forEach((balance) => {
      if (isTopToken(balance)) {
        top.push(balance);
      }
    });

    // Sort top tokens in specific order: ETH (Ethereum), ETH (Base), USDC (Base), BTC, FIL
    top.sort((a, b) => {
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

    return top;
  }, [walletData]);

  // Filter tokens based on selected filter
  const filteredTokens = useMemo(() => {
    if (!walletData) return [];

    switch (filter) {
      case 'top':
        return topTokens;
      case 'stablecoins':
        return walletData.balances.filter(isStablecoin);
      case 'native':
        return walletData.balances.filter(isNativeToken);
      case 'all':
      default:
        return walletData.balances;
    }
  }, [walletData, filter, topTokens]);

  // Render token balance card
  const renderTokenCard = (balance: TokenBalance, index: number) => (
    <div
      key={`${balance.blockchain}-${balance.tokenSymbol}-${balance.contractAddress || index}`}
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg"
    >
      <div>
        <p className="font-semibold">{balance.tokenSymbol}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {balance.tokenName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {formatChainName(balance.blockchain)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold">{formatBalance(balance.balance)}</p>
        {balance.balanceUsd && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ${parseFloat(balance.balanceUsd).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4">Wallet Information</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4">Wallet Information</h2>
        <div className="text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Wallet Information</h2>

      {/* Balances Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Token Balances</h3>

        {/* Top Tokens Section */}
        {topTokens.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Top Tokens
            </h4>
            <div className="space-y-3">
              {topTokens.map((balance, index) => renderTokenCard(balance, index))}
            </div>
          </div>
        )}

        {/* Filter Component */}
        {walletData.balances.length > 0 && (
          <div className="mb-4">
            <TokenFilter onFilterChange={setFilter} />
          </div>
        )}

        {/* Filtered Tokens List */}
        {walletData.balances.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No token balances found</p>
        ) : (
          <div className="space-y-3">
            {/* For 'top' filter, show nothing (already shown above). For others, show filtered tokens excluding top tokens if shown above */}
            {filter === 'top' ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                Showing only top tokens above
              </p>
            ) : (
              <>
                {filteredTokens
                  .filter((token) => !isTopToken(token))
                  .slice(0, 10)
                  .map((balance, index) => renderTokenCard(balance, index))}
                {filteredTokens.filter((token) => !isTopToken(token)).length > 10 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                    +{filteredTokens.filter((token) => !isTopToken(token)).length - 10} more tokens
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* NFTs Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">NFTs ({walletData.nfts.length})</h3>
        {walletData.nfts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No NFTs found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {walletData.nfts.slice(0, 8).map((nft, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden"
              >
                {nft.imageUrl ? (
                  <div className="relative w-full h-32">
                    <Image
                      src={nft.imageUrl}
                      alt={nft.name || 'NFT'}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{nft.name || 'Unnamed NFT'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {nft.collectionName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {walletData.nfts.length > 8 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            +{walletData.nfts.length - 8} more NFTs
          </p>
        )}
      </div>

      {/* POAPs Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">POAPs ({walletData.poaps.length})</h3>
        {walletData.poaps.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No POAPs found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {walletData.poaps.slice(0, 8).map((poap, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden"
              >
                {poap.imageUrl ? (
                  <div className="relative w-full h-32">
                    <Image
                      src={poap.imageUrl}
                      alt={poap.name || 'POAP'}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{poap.name || 'Unnamed POAP'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {poap.collectionName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {walletData.poaps.length > 8 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            +{walletData.poaps.length - 8} more POAPs
          </p>
        )}
      </div>

      {/* Last Transaction Section */}
      {walletData.lastTransaction && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Last Transaction</h3>
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
            <div className="space-y-3">
              {/* Chain - Always show if we have blockchain data */}
              {(() => {
                const chains = Array.isArray(walletData.lastTransaction.blockchain)
                  ? walletData.lastTransaction.blockchain
                  : walletData.lastTransaction.blockchain
                    ? [String(walletData.lastTransaction.blockchain)]
                    : [];

                return chains.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Chain:</span>
                    <span className="text-sm font-semibold">
                      {chains.map((chain) => formatChainName(String(chain))).join(', ')}
                    </span>
                  </div>
                ) : null;
              })()}

              {/* Token - Always show if we have token data */}
              {(() => {
                const tokenSymbol = walletData.lastTransaction.tokenSymbol;
                const tokenName = walletData.lastTransaction.tokenName;

                return tokenSymbol || tokenName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Token:</span>
                    <span className="text-sm font-semibold">
                      {tokenSymbol || tokenName}
                      {tokenName && tokenSymbol && tokenName !== tokenSymbol
                        ? ` (${tokenName})`
                        : ''}
                    </span>
                  </div>
                ) : null;
              })()}

              {/* Transaction Hash with Explorer Link */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hash:</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const chains = Array.isArray(walletData.lastTransaction.blockchain)
                      ? walletData.lastTransaction.blockchain
                      : walletData.lastTransaction.blockchain
                        ? [String(walletData.lastTransaction.blockchain)]
                        : [];

                    const explorerUrl = getExplorerUrlForBlockchains(
                      chains,
                      walletData.lastTransaction.hash
                    );

                    if (explorerUrl) {
                      return (
                        <Link
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-mono"
                        >
                          {walletData.lastTransaction.hash.slice(0, 10)}...
                          {walletData.lastTransaction.hash.slice(-8)} →
                        </Link>
                      );
                    }

                    return (
                      <span className="text-sm font-mono truncate max-w-xs">
                        {walletData.lastTransaction.hash.slice(0, 10)}...
                        {walletData.lastTransaction.hash.slice(-8)}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-sm">
                  {formatDate(walletData.lastTransaction.timestamp)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span
                  className={`text-sm font-semibold ${
                    walletData.lastTransaction.status === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {walletData.lastTransaction.status === 'success' ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

