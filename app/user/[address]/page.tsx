import { WalletInfo } from '@/components/WalletInfo';
import { getUserByAddress } from '@/lib/users';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AvatarImage } from '@/components/AvatarImage';

// Disable static generation - render on demand
export const dynamic = 'force-dynamic';

export default async function UserPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const user = await getUserByAddress(address);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to leaderboard
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          {/* User Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="relative w-24 h-24 flex-shrink-0">
              <AvatarImage
                src={`/api/avatar/${user.avatarCid}`}
                alt={`${user.username} avatar`}
                fill
                sizes="96px"
                className="rounded-lg object-cover border-4 border-gray-200 dark:border-zinc-700"
              />
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                #{user.rank}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                {user.username}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                {user.address}
              </p>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Level</p>
              <p className="text-2xl font-bold">{user.level}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">XP</p>
              <p className="text-2xl font-bold">{user.xp.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">GM Streak</p>
              <p className="text-2xl font-bold">{user.gmStreak} days</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rank</p>
              <p className="text-2xl font-bold">#{user.rank}</p>
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <WalletInfo walletAddress={user.address} />
      </div>
    </div>
  );
}
