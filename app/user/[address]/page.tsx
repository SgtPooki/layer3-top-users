import { UserData } from '@/components/TopUserView';
import { WalletInfo } from '@/components/WalletInfo';
import Image from 'next/image';
import Link from 'next/link';

interface UsersApiResponse {
  users: UserData[];
  error?: string;
}

async function getUsers(): Promise<UserData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000');
    const apiUrl = `${baseUrl}/api/users`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
    }

    const data: UsersApiResponse = await response.json();

    if (!data.users || !Array.isArray(data.users)) {
      throw new Error('Invalid response format from API');
    }

    return data.users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const users = await getUsers();
  const user = users.find((u) => u.address === address);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to leaderboard
          </Link>
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p>No user found with address {address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to leaderboard
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          {/* User Header */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={`/api/avatar/${user.avatarCid}`}
                alt={user.username}
                fill
                sizes="96px"
                className="rounded-lg object-cover border-4 border-gray-200 dark:border-zinc-700"
              />
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                #{user.rank}
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
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
