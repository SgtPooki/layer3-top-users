import Image from 'next/image';
import { UserData } from './TopUserView';

interface Top3UserHeroProps {
  users: UserData[];
}

export function Top3UserHero({ users }: Top3UserHeroProps) {
  if (users.length === 0) return null;

  // Arrange users: 2nd place (left), 1st place (center), 3rd place (right)
  const first = users.find(u => u.rank === 1);
  const second = users.find(u => u.rank === 2);
  const third = users.find(u => u.rank === 3);

  return (
    <div className="flex items-end justify-center gap-4 px-4">
      {/* 2nd Place - Left */}
      {second && (
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 mb-3">
            <Image
              src={`https://ipfs.io/ipfs/${second.avatarCid}`}
              alt={second.username}
              fill
              className="rounded-full object-cover border-4 border-gray-300"
            />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
          </div>
          <h3 className="font-semibold text-sm text-center truncate max-w-[120px]">
            {second.username}
          </h3>
          <p className="text-xs text-gray-600">Level {second.level}</p>
          <p className="text-xs font-medium text-gray-700">{second.xp.toLocaleString()} XP</p>
          <div className="mt-3 bg-gray-200 rounded-t-lg px-8 py-6 border-4 border-gray-300">
            <div className="text-2xl font-bold text-center">🥈</div>
          </div>
        </div>
      )}

      {/* 1st Place - Center (Tallest) */}
      {first && (
        <div className="flex flex-col items-center mb-12">
          <div className="relative w-28 h-28 mb-4">
            <Image
              src={`https://ipfs.io/ipfs/${first.avatarCid}`}
              alt={first.username}
              fill
              className="rounded-full object-cover border-4 border-yellow-400"
            />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-base font-bold">
              1
            </div>
          </div>
          <h3 className="font-bold text-base text-center truncate max-w-[140px]">
            {first.username}
          </h3>
          <p className="text-sm text-gray-600">Level {first.level}</p>
          <p className="text-sm font-medium text-gray-700">{first.xp.toLocaleString()} XP</p>
          <div className="mt-4 bg-yellow-100 rounded-t-lg px-10 py-12 border-4 border-yellow-400">
            <div className="text-4xl font-bold text-center">🏆</div>
          </div>
        </div>
      )}

      {/* 3rd Place - Right (Shortest) */}
      {third && (
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-16 h-16 mb-2">
            <Image
              src={`https://ipfs.io/ipfs/${third.avatarCid}`}
              alt={third.username}
              fill
              className="rounded-full object-cover border-4 border-orange-300"
            />
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-300 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          </div>
          <h3 className="font-medium text-xs text-center truncate max-w-[100px]">
            {third.username}
          </h3>
          <p className="text-xs text-gray-600">Level {third.level}</p>
          <p className="text-xs font-medium text-gray-700">{third.xp.toLocaleString()} XP</p>
          <div className="mt-2 bg-orange-100 rounded-t-lg px-6 py-4 border-4 border-orange-300">
            <div className="text-xl font-bold text-center">🥉</div>
          </div>
        </div>
      )}
    </div>
  );
}
