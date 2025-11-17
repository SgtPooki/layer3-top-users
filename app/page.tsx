import { TopUserView } from "@/components/TopUserView";
import { getUsers } from "@/lib/users";

// Disable static generation - render on demand
export const dynamic = 'force-dynamic';

export default async function Home() {
  const users = await getUsers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <main className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
            Layer3 Top Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Celebrating our most active community members
          </p>
        </div>
        <TopUserView users={users} />
      </main>
    </div>
  );
}
