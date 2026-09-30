import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type WishlistItem = {
  id: number;
  name: string;
  brand: string;
  category: string;
  color: string | null;
  size: string | null;
  priority: number | null;
};

export default async function WishlistPage() {
  const supabase = await createClient();

  // 检查用户是否登录
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 没登录就不能访问 wishlist
  if (!user) {
    redirect("/");
  }

  // 从 Supabase 读取 wishlist
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .order("priority", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p>Failed to load wishlist.</p>
      </main>
    );
  }

  const items = (data ?? []) as WishlistItem[];

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Wishlist</h1>

        <p className="mt-2 text-gray-600">
          Signed in as {user.email}
        </p>

        <Link
          href="/profile"
          className="mt-2 inline-block underline"
        >
          Profile
        </Link>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border p-4"
          >
            <h2 className="font-bold">{item.name}</h2>

            <p className="text-gray-600">
              {item.brand} · {item.category}
            </p>

            {item.color && <p>Color: {item.color}</p>}

            {item.size && <p>Size: {item.size}</p>}

            {item.priority !== null && (
              <p>Priority: {item.priority}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}