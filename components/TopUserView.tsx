import { Top3UserHero } from './Top3UserHero';
import { UserListView } from './UserListView';
import type { UserData } from '@/lib/types';

export type { UserData };

interface TopUserViewProps {
  // sorted list of users by `user.rank`
  users: UserData[];
}

export function TopUserView({ users }: TopUserViewProps) {
  const top3 = users.slice(0, 3);
  const remaining = users.slice(3);

  return (
    <div className="w-full space-y-12">
      <Top3UserHero users={top3} />
      {remaining.length > 0 && <UserListView users={remaining} />}
    </div>
  );
}
