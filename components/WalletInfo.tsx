/**
 * WalletInfo component
 *
 * Main component for displaying comprehensive wallet information including
 * token balances, NFTs, POAPs, and recent transactions.
 *
 * This component has been refactored to follow SOLID principles:
 * - Single Responsibility: Delegates rendering to sub-components
 * - Dependency Inversion: Uses custom hooks for data fetching
 * - Separation of Concerns: Logic extracted to utility functions
 */

'use client';

import { useState, useMemo } from 'react';
import { useWalletData } from '@/hooks/useWalletData';
import { TokenFilter, type FilterOption } from './TokenFilter';
import { TokenBalanceCard } from './TokenBalanceCard';
import { NFTCard } from './NFTCard';
import { LastTransactionCard } from './LastTransactionCard';
import { isTopToken, isStablecoin, isNativeToken, sortTopTokens } from '@/lib/token-utils';

interface WalletInfoProps {
  walletAddress: string;
}

/**
 * Displays comprehensive wallet information with filtering capabilities
 *
 * @param props.walletAddress - Ethereum wallet address to display data for
 *
 * @example
 * ```tsx
 * <WalletInfo walletAddress="0x1234..." />
 * ```
 *
 * @remarks
 * Features:
 * - Automatic data fetching via custom hook
 * - Token filtering (all, top, stablecoins, native)
 * - Separate sections for top tokens, NFTs, POAPs
 * - Last transaction with explorer link
 * - Loading and error states
 * - Responsive grid layouts
 */
export function WalletInfo({ walletAddress }: WalletInfoProps) {
  const { walletData, loading, error } = useWalletData(walletAddress);
  const [filter, setFilter] = useState<FilterOption>('all');

  // Extract and sort top tokens
  const topTokens = useMemo(() => {
    if (!walletData) return [];
    const top = walletData.balances.filter(isTopToken);
    return sortTopTokens(top);
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

  // Loading state
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

  // Error state
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

  // No data state
  if (!walletData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Wallet Information</h2>

      {/* Token Balances Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Token Balances</h3>

        {/* Top Tokens Section */}
        {topTokens.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Top Tokens
            </h4>
            <div className="space-y-3">
              {topTokens.map((balance, index) => (
                <TokenBalanceCard
                  key={`${balance.blockchain}-${balance.tokenSymbol}-${balance.contractAddress || index}`}
                  balance={balance}
                />
              ))}
            </div>
          </div>
        )}

        {/* Token Filter */}
        {walletData.balances.length > 0 && (
          <div className="mb-4">
            <TokenFilter onFilterChange={setFilter} />
          </div>
        )}

        {/* Filtered Tokens List */}
        {walletData.balances.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No token balances found</p>
        ) : (
          <div className="space-y-3" id="token-list">
            {filter === 'top' ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                Showing only top tokens above
              </p>
            ) : (
              <>
                {filteredTokens
                  .filter((token) => !isTopToken(token))
                  .slice(0, 10)
                  .map((balance, index) => (
                    <TokenBalanceCard
                      key={`${balance.blockchain}-${balance.tokenSymbol}-${balance.contractAddress || index}`}
                      balance={balance}
                    />
                  ))}
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
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {walletData.nfts.slice(0, 8).map((nft, index) => (
                <NFTCard key={index} nft={nft} />
              ))}
            </div>
            {walletData.nfts.length > 8 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                +{walletData.nfts.length - 8} more NFTs
              </p>
            )}
          </>
        )}
      </div>

      {/* POAPs Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">POAPs ({walletData.poaps.length})</h3>
        {walletData.poaps.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No POAPs found</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {walletData.poaps.slice(0, 8).map((poap, index) => (
                <NFTCard key={index} nft={poap} />
              ))}
            </div>
            {walletData.poaps.length > 8 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                +{walletData.poaps.length - 8} more POAPs
              </p>
            )}
          </>
        )}
      </div>

      {/* Last Transaction Section */}
      {walletData.lastTransaction && (
        <LastTransactionCard transaction={walletData.lastTransaction} />
      )}
    </div>
  );
}
