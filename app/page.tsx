import { supabase } from "@/lib/supabase";

type WishlistItem = {
  id: number;
  name: string;
  brand: string;
  category: string;
  color: string | null;
  size: string | null;
  priority: number | null;
};

export default async function Home() {
  const { data: items, error } = await supabase
    .from("wishlist")
    .select("*")
    .order("priority", { ascending: true });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <p className="mt-4">Failed to load wishlist.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-3xl font-bold">My Wishlist</h1>

      <div className="grid gap-4">
        {items?.map((item: WishlistItem) => (
          <div
            key={item.id}
            className="rounded-lg border p-5"
          >
            <h2 className="text-xl font-semibold">
              {item.name}
            </h2>

            <p className="mt-1 text-gray-600">
              {item.brand} · {item.category}
            </p>

            {item.color && (
              <p className="mt-2">
                Color: {item.color}
              </p>
            )}

            {item.size && (
              <p>
                Size: {item.size}
              </p>
            )}

            {item.priority !== null && (
              <p>
                Priority: {item.priority}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}