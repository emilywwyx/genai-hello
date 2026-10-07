"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VIBES, type VibeId } from "@/lib/vibes";
import { generateCaptionsAction } from "@/app/create/actions";

const MAX_DIMENSION = 1600;

async function toJpeg(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    const canvas = document.createElement("canvas");

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
  } catch {
    return null;
  }
}

export default function CreateForm({ userId }: { userId: string }) {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [vibe, setVibe] = useState<VibeId>(VIBES[0].id);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    setCaptions([]);
    setMessage("");

    const jpeg = await toJpeg(selected);

    if (!jpeg) {
      setPhoto(null);
      setPreview(null);
      setMessage(
        "This photo can't be opened in your browser. If it's an iPhone HEIC photo, export it as JPEG first."
      );
      return;
    }

    setPhoto(jpeg);
    setFileName(selected.name);
    setPreview(URL.createObjectURL(jpeg));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!photo) {
      setMessage("Please choose a photo first.");
      return;
    }

    setLoading(true);
    setCaptions([]);
    setMessage("Uploading photo...");

    const supabase = createClient();

    const filePath = `${userId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("caption-images")
      .upload(filePath, photo, { contentType: "image/jpeg" });

    if (uploadError) {
      setMessage("Failed to upload photo.");
      setLoading(false);
      return;
    }

    setMessage("Writing captions...");

    const result = await generateCaptionsAction(filePath, vibe);

    setLoading(false);

    if (result.error !== null) {
      setMessage(result.error);
      return;
    }

    setCaptions(result.captions);
    setMessage("Done! Your captions are live on the feed.");
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-8 space-y-7">
      <div>
        <span className="field-label">1. Photo</span>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-[#fafafc] px-6 py-10 text-center transition duration-200 hover:border-[#0071e3] hover:bg-[#0071e3]/5">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />

          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="max-h-72 rounded-xl object-cover"
              />
              <span className="mt-2 text-sm text-black/50">
                {fileName} · Click to change
              </span>
            </>
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <span className="font-medium">Choose a photo</span>
              <span className="text-sm text-black/50">JPG, PNG or WebP</span>
            </>
          )}
        </label>
      </div>

      <div>
        <span className="field-label">2. Tone</span>

        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-black/5 p-1">
          {VIBES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={vibe === option.id}
              onClick={() => setVibe(option.id)}
              className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition duration-200 ${
                vibe === option.id
                  ? "bg-white text-black shadow-sm"
                  : "text-black/55 hover:text-black"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-black/5 pt-7 text-center">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3.5 text-base sm:w-80"
        >
          {loading ? "Generating..." : "✨ Generate captions"}
        </button>

        {message && <p className="mt-3 text-sm text-black/60">{message}</p>}
      </div>

      {captions.length > 0 && (
        <div className="space-y-2">
          {captions.map((caption, index) => (
            <p key={index} className="rounded-2xl bg-[#f5f5f7] p-4">
              {caption}
            </p>
          ))}

          <Link href="/" className="btn btn-secondary mt-2">
            Vote on the feed →
          </Link>
        </div>
      )}
    </form>
  );
}
