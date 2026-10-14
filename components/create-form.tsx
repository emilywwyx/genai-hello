"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageUp, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import CopyButton from "@/components/copy-button";
import VoiceBullet from "@/components/voice-bullet";
import { createClient } from "@/lib/supabase/client";
import { generateCaptionsAction } from "@/lib/generate-action";
import { NEIGHBORHOODS, VOICE_HINTS } from "@/lib/tone-style";
import { VIBES, type VibeId } from "@/lib/vibes";

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

function StepCard({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-baseline gap-3 border-b border-line px-5 py-3.5">
        <span className="display text-xl text-accent">{step}</span>
        <h2 className="font-semibold">{title}</h2>
        {hint && <span className="text-sm text-muted">{hint}</span>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function CreateForm({ userId }: { userId: string }) {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState("");
  const [vibe, setVibe] = useState<VibeId>(VIBES[0].id);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [imageId, setImageId] = useState<number | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    setCaptions([]);
    setMessage("");
    setUploadedPath(null);
    setImageId(null);

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
    setMessage("");

    let path = uploadedPath;

    if (!path) {
      const supabase = createClient();
      const newPath = `${userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("caption-images")
        .upload(newPath, photo, { contentType: "image/jpeg" });

      if (uploadError) {
        setMessage("Failed to upload photo.");
        setLoading(false);
        return;
      }

      path = newPath;
      setUploadedPath(newPath);
    }

    const result = await generateCaptionsAction(
      path,
      vibe,
      neighborhood || null,
      imageId ?? undefined
    );

    setLoading(false);

    if (result.error !== null) {
      setMessage(result.error);
      return;
    }

    setImageId(result.imageId);
    setCaptions(result.captions);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard step="01" title="Photo">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-[#f7f7f4] px-6 py-10 text-center transition duration-150 hover:border-ink">
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
                className="max-h-80 rounded-lg object-contain"
              />
              <span className="text-sm text-muted">
                {fileName} · Click to change
              </span>
            </>
          ) : (
            <>
              <ImageUp size={30} strokeWidth={1.5} className="text-muted" />
              <span className="font-semibold">Choose a photo or meme</span>
              <span className="text-sm text-muted">JPG, PNG or WebP</span>
            </>
          )}
        </label>
      </StepCard>

      <StepCard step="02" title="Where in New York?" hint="Optional">
        <div className="relative">
          <MapPin
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            list="neighborhoods"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            maxLength={40}
            disabled={imageId !== null}
            placeholder="Morningside Heights, Williamsburg, Central Park..."
            className="input pl-10 disabled:bg-[#f7f7f4] disabled:text-muted"
          />
          <datalist id="neighborhoods">
            {NEIGHBORHOODS.map((place) => (
              <option key={place} value={place} />
            ))}
          </datalist>
        </div>
        <p className="mt-2 text-sm text-muted">
          Shown on your post, and helps the AI write a more New York caption.
        </p>
      </StepCard>

      <StepCard step="03" title="Pick a voice">
        <div className="grid gap-2 sm:grid-cols-2">
          {VIBES.map((option) => {
            const selected = vibe === option.id;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setVibe(option.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition duration-150 ${
                  selected
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white hover:border-black/40"
                }`}
              >
                <VoiceBullet vibe={option.id} size="md" />
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span
                    className={`block text-sm ${
                      selected ? "text-white/65" : "text-muted"
                    }`}
                  >
                    {VOICE_HINTS[option.id]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </StepCard>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary px-7 py-3.5 text-base"
        >
          {loading ? (
            <>
              <LoaderCircle size={17} className="animate-spin" />
              Writing captions
            </>
          ) : imageId ? (
            <>
              <RefreshCw size={16} />
              Write three more in this voice
            </>
          ) : (
            "Write my captions"
          )}
        </button>

        {message && <p className="text-sm text-accent">{message}</p>}
      </div>

      {loading && (
        <div className="card space-y-4 p-5">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-6 animate-pulse rounded-full bg-black/[0.06]"
              style={{ width: `${85 - index * 15}%` }}
            />
          ))}
        </div>
      )}

      {!loading && captions.length > 0 && (
        <section className="card">
          <div className="sign">
            <span className="sign-title">Your captions</span>
            <span className="text-xs text-white/60">Posted to the feed</span>
          </div>

          <ol className="divide-y divide-line">
            {captions.map((caption, index) => (
              <li
                key={`${index}-${caption}`}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <span className="flex gap-3">
                  <VoiceBullet vibe={vibe} />
                  <span className="font-medium">{caption}</span>
                </span>
                <CopyButton text={caption} />
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <p className="text-sm text-muted">
              Want a different angle? Pick another voice and write again.
            </p>
            <Link href="/" className="btn btn-ghost">
              See it on the feed →
            </Link>
          </div>
        </section>
      )}
    </form>
  );
}
