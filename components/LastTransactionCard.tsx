/**
 * LastTransactionCard component
 *
 * Displays the most recent transaction for a wallet, including chain info,
 * transaction hash with explorer link, date, and status.
 */

import Link from 'next/link';
import { getExplorerUrlForBlockchains, formatChainName } from '@/lib/explorers';
import { formatDate } from '@/lib/token-utils';
import type { Transaction } from '@/lib/wallet';

interface LastTransactionCardProps {
  transaction: Transaction;
}

/**
 * Card component for displaying transaction information
 *
 * @param props.transaction - Transaction object to display
 *
 * @example
 * ```tsx
 * {lastTransaction && <LastTransactionCard transaction={lastTransaction} />}
 * ```
 *
 * @remarks
 * - Automatically generates explorer link if blockchain is recognized
 * - Handles transactions with multiple blockchains (takes first match)
 * - Displays token information if available
 * - Color-codes status (green for success, red for failed)
 */
export function LastTransactionCard({ transaction }: LastTransactionCardProps) {
  // Normalize blockchain data to array
  const chains = Array.isArray(transaction.blockchain)
    ? transaction.blockchain
    : transaction.blockchain
      ? [String(transaction.blockchain)]
      : [];

  const explorerUrl = getExplorerUrlForBlockchains(chains, transaction.hash);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Last Transaction</h3>
      <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
        <div className="space-y-3">
          {/* Chain */}
          {chains.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Chain:</span>
              <span className="text-sm font-semibold">
                {chains.map((chain) => formatChainName(String(chain))).join(', ')}
              </span>
            </div>
          )}

          {/* Token */}
          {(transaction.tokenSymbol || transaction.tokenName) && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Token:</span>
              <span className="text-sm font-semibold">
                {transaction.tokenSymbol || transaction.tokenName}
                {transaction.tokenName &&
                  transaction.tokenSymbol &&
                  transaction.tokenName !== transaction.tokenSymbol
                    ? ` (${transaction.tokenName})`
                    : ''}
              </span>
            </div>
          )}

          {/* Transaction Hash with Explorer Link */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Hash:</span>
            <div className="flex items-center gap-2">
              {explorerUrl ? (
                <Link
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-mono"
                >
                  {transaction.hash.slice(0, 10)}...
                  {transaction.hash.slice(-8)} →
                </Link>
              ) : (
                <span className="text-sm font-mono truncate max-w-xs">
                  {transaction.hash.slice(0, 10)}...
                  {transaction.hash.slice(-8)}
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
            <span className="text-sm">{formatDate(transaction.timestamp)}</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <span
              className={`text-sm font-semibold ${
                transaction.status === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {transaction.status === 'success' ? 'Success' : 'Failed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
