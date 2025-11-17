/**
 * NFTCard component
 *
 * Reusable card component for displaying NFTs and POAPs.
 * Shows image, name, and collection information.
 */

import Image from 'next/image';
import type { NFT } from '@/lib/wallet';

interface NFTCardProps {
  nft: NFT;
}

/**
 * Card component for displaying an NFT or POAP
 *
 * @param props.nft - NFT object to display
 *
 * @example
 * ```tsx
 * <NFTCard nft={nftData} />
 * ```
 *
 * @remarks
 * - Uses Next.js Image component with unoptimized flag for external NFT images
 * - Displays placeholder when no image is available
 * - Truncates long names and collection names
 */
export function NFTCard({ nft }: NFTCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
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
  );
}
