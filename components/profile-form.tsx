"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export default function ProfileForm({
  userId,
  firstName,
  lastName,
  avatarUrl,
}: ProfileFormProps) {
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [avatar, setAvatar] = useState(avatarUrl);
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
    router.refresh();
  }

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("Uploading photo...");

    const supabase = createClient();

    const fileExtension = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      setMessage("Failed to upload photo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
      })
      .eq("id", userId);

    if (profileError) {
      setMessage("Photo uploaded, but profile could not be updated.");
      return;
    }

    setAvatar(publicUrl);
    setMessage("Profile photo updated!");
    router.refresh();
  }

  return (
    <div className="card mt-8">
      <div className="flex items-center gap-5">
        {avatar ? (
          <img
            src={avatar}
            alt="Profile"
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/5 text-3xl">
            👤
          </div>
        )}

        <label className="btn btn-secondary">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="sr-only"
          />
          {avatar ? "Change photo" : "Upload photo"}
        </label>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="first-name" className="field-label">
            First name
          </label>

          <input
            id="first-name"
            type="text"
            value={first}
            onChange={(event) => setFirst(event.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="last-name" className="field-label">
            Last name
          </label>

          <input
            id="last-name"
            type="text"
            value={last}
            onChange={(event) => setLast(event.target.value)}
            className="input"
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" className="btn btn-primary">
            Save profile
          </button>

          <Link href="/" className="btn btn-secondary">
            Back to feed
          </Link>

          {message && <p className="text-sm text-black/60">{message}</p>}
        </div>
      </form>
    </div>
  );
}
