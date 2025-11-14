import Image from 'next/image';
import Link from 'next/link';
import { UserData } from './TopUserView';

interface Top3UserHeroProps {
  users: UserData[];
}

interface UserInfoProps {
  username: string;
  level: number;
  xp: number;
}

function UserInfo({ username, level, xp }: UserInfoProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-xs text-gray-600">Level {level}</p>
      <p className="text-xs text-gray-700">{xp.toLocaleString()} XP</p>
      <h3 className="font-bold text-sm text-center truncate max-w-full px-2">
        {username}
      </h3>
    </div>
  );
}

export function Top3UserHero({ users }: Top3UserHeroProps) {
  if (users.length === 0) return null;

  // Arrange users: 2nd place (left), 1st place (center), 3rd place (right)
  const first = users.find(u => u.rank === 1);
  const second = users.find(u => u.rank === 2);
  const third = users.find(u => u.rank === 3);

  return (
    <div className="grid grid-cols-3 gap-4 px-4 max-w-3xl mx-auto items-end">
      {/* 2nd Place - Left */}
      {second && (
        <Link href={`/user/${second.address}`} className="user-clickable flex flex-col items-center hover:opacity-80 transition-opacity">
          {/* Avatar (medium size, medium height) */}
          <div className="relative w-24 h-24 mb-4">
            <Image
              src={`/api/avatar/${second.avatarCid}`}
              alt={second.username}
              fill
              sizes="96px"
              className="rounded-lg object-cover border-4 border-gray-300"
            />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
          </div>

          {/* User info (aligned across all columns) */}
          <UserInfo username={second.username} level={second.level} xp={second.xp} />
        </Link>
      )}

      {/* 1st Place - Center (Tallest) */}
      {first && (
        <Link href={`/user/${first.address}`} className="user-clickable flex flex-col items-center hover:opacity-80 transition-opacity">
          {/* Avatar (largest, positioned highest) */}
          <div className="relative w-32 h-32 mb-4">
            <Image
              src={`/api/avatar/${first.avatarCid}`}
              alt={first.username}
              fill
              sizes="128px"
              loading="eager"
              priority
              className="rounded-lg object-cover border-4 border-yellow-400"
            />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-base font-bold">
              1
            </div>
          </div>

          {/* User info (aligned across all columns) */}
          <UserInfo username={first.username} level={first.level} xp={first.xp} />
        </Link>
      )}

      {/* 3rd Place - Right (Shortest) */}
      {third && (
        <Link href={`/user/${third.address}`} className="user-clickable flex flex-col items-center hover:opacity-80 transition-opacity">
          {/* Avatar (smallest, positioned lowest) */}
          <div className="relative w-20 h-20 mb-4">
            <Image
              src={`/api/avatar/${third.avatarCid}`}
              alt={third.username}
              fill
              sizes="80px"
              className="rounded-lg object-cover border-4 border-orange-300"
            />
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-300 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          </div>

          {/* User info (aligned across all columns) */}
          <UserInfo username={third.username} level={third.level} xp={third.xp} />
        </Link>
      )}
    </div>
  );
}
