/**
 * TokenBalanceCard component
 *
 * Displays a single token balance with symbol, name, chain, and USD value.
 * Reusable card component for displaying token information in wallet views.
 */

import { formatChainName } from '@/lib/explorers';
import { formatBalance } from '@/lib/token-utils';
import type { TokenBalance } from '@/lib/wallet';

interface TokenBalanceCardProps {
  balance: TokenBalance;
}

/**
 * Card component for displaying a token balance
 *
 * @param props.balance - Token balance object to display
 *
 * @example
 * ```tsx
 * <TokenBalanceCard balance={ethBalance} />
 * ```
 */
export function TokenBalanceCard({ balance }: TokenBalanceCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
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
        {balance.balanceUsd && (() => {
          const usdValue = parseFloat(balance.balanceUsd);
          return !isNaN(usdValue) && usdValue > 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ${usdValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          ) : null;
        })()}
      </div>
    </div>
  );
}
