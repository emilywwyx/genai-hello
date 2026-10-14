"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/avatar";
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

    setMessage("Saved.");
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
    setMessage("Profile photo updated.");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar
          name={first || "?"}
          avatarUrl={avatar}
          size="h-16 w-16 text-xl"
        />

        <label className="btn btn-ghost">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="sr-only"
          />
          {avatar ? "Change photo" : "Upload photo"}
        </label>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <div className="flex items-center gap-4 pt-1">
          <button type="submit" className="btn btn-primary">
            Save profile
          </button>
          {message && <p className="text-sm text-muted">{message}</p>}
        </div>
      </form>
    </div>
  );
}
