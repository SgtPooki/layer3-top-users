import Image from 'next/image';
import { UserData } from './TopUserView';

interface UserListViewProps {
  users: UserData[];
}

export function UserListView({ users }: UserListViewProps) {
  if (users.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Other Users</h2>
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.address}
            className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0 w-8 text-center font-bold text-gray-500">
              #{user.rank}
            </div>
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={`/api/avatar/${user.avatarCid}`}
                alt={user.username}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{user.username}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Level {user.level} • {user.gmStreak} day streak
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold">{user.xp.toLocaleString()}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
