/**
 * Custom hook for fetching wallet data from the API
 *
 * This hook encapsulates the data fetching logic, loading states, and error handling
 * for wallet information. It separates concerns by keeping business logic out of
 * the presentation component.
 *
 * @module hooks/useWalletData
 *
 * @example
 * ```tsx
 * function WalletInfo({ walletAddress }) {
 *   const { walletData, loading, error } = useWalletData(walletAddress);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   return <WalletDisplay data={walletData} />;
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import type { WalletData } from '@/lib/wallet';

interface UseWalletDataResult {
  walletData: WalletData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches and manages wallet data state for a given wallet address
 *
 * @param walletAddress - Ethereum wallet address to fetch data for
 * @returns Object containing walletData, loading state, and error state
 *
 * @remarks
 * - Automatically fetches data when walletAddress changes
 * - Handles loading and error states
 * - Re-fetches if walletAddress changes during component lifecycle
 */
export function useWalletData(walletAddress: string): UseWalletDataResult {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchWalletData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/wallet/${walletAddress}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch wallet data: ${response.statusText}`);
        }

        const data: WalletData = await response.json();

        // Only update state if not aborted
        if (!abortController.signal.aborted) {
          setWalletData(data);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching wallet data:', err);
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (walletAddress) {
      fetchWalletData();
    }

    // Cleanup: abort fetch if component unmounts or walletAddress changes
    return () => {
      abortController.abort();
    };
  }, [walletAddress]);

  return { walletData, loading, error };
}
