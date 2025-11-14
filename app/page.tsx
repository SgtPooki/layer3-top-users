import { TopUserView, UserData } from "@/components/TopUserView";

interface UsersApiResponse {
  users: UserData[];
  error?: string;
}

async function getUsers(): Promise<UserData[]> {
  try {
    // Call our internal API endpoint
    // Using absolute URL for server-side fetch to ensure it works in all environments
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000');
    const apiUrl = `${baseUrl}/api/users`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
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
    // Return empty array on error to prevent page crash
    return [];
  }
}

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
