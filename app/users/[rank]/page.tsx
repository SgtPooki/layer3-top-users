import { UserData } from '@/components/TopUserView';
import Image from 'next/image';

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

export default async function UserDebugPage({
  params,
}: {
  params: Promise<{ rank: string }>;
}) {
  const { rank: rankParam } = await params;
  const rank = parseInt(rankParam, 10);

  if (isNaN(rank)) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Invalid Rank</h1>
          <p>Rank must be a valid number. Received: {rankParam}</p>
        </div>
      </div>
    );
  }
  const users = await getUsers();
  const user = users.find((u) => u.rank === rank);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p>No user found with rank {rank}</p>
          <p className="mt-4 text-sm text-gray-600">
            Available ranks: {users.map((u) => u.rank).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  const avatarUrl = `/api/avatar/${user.avatarCid}`;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Avatar Debug Page</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2">
            <p><strong>Rank:</strong> {user.rank}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Address:</strong> {user.address}</p>
            <p><strong>Avatar CID:</strong> {user.avatarCid}</p>
            <p><strong>Avatar URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{avatarUrl}</code></p>
            <p><strong>Level:</strong> {user.level}</p>
            <p><strong>XP:</strong> {user.xp.toLocaleString()}</p>
            <p><strong>GM Streak:</strong> {user.gmStreak} days</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Next.js Image Component</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Using Next.js Image (fill):</p>
              <Image
                src={avatarUrl}
                alt={user.username}
              />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Using Next.js Image (fixed size):</p>
              <Image
                src={avatarUrl}
                alt={user.username}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Native HTML img Tag</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Direct img tag:</p>
              <Image
                src={avatarUrl}
                alt={user.username}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Direct API Test</h2>
          <p className="text-sm text-gray-600 mb-2">
            <a
              href={avatarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open avatar URL directly: {avatarUrl}
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This will open the API endpoint directly in a new tab to see the raw response.
          </p>
        </div>
      </div>
    </div>
  );
}

