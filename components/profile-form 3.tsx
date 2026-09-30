"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
};

export default function ProfileForm({
  userId,
  firstName,
  lastName,
}: ProfileFormProps) {
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [message, setMessage] = useState("");

  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: first,
        last_name: last,
      })
      .eq("id", userId);

    if (error) {
      setMessage("Failed to update profile.");
      return;
    }

    setMessage("Profile updated!");

    // 让 server component 重新读取最新的 profile 数据
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
      <div>
        <label className="block font-medium">First Name</label>

        <input
          type="text"
          value={first}
          onChange={(event) => setFirst(event.target.value)}
          className="mt-1 w-full rounded border p-2"
          required
        />
      </div>

      <div>
        <label className="block font-medium">Last Name</label>

        <input
          type="text"
          value={last}
          onChange={(event) => setLast(event.target.value)}
          className="mt-1 w-full rounded border p-2"
          required
        />
      </div>

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-white"
      >
        Save Profile
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}