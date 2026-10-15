'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { CopyButton, Photo, Spinner, VoiceTag } from '@/components/ui';
import { AlertIcon, ArrowUpRight, CheckIcon, UploadIcon } from '@/components/Icons';
import { CaptionError, DAILY_GENERATION_LIMIT, generateCaptions, uploadPhoto } from '@/lib/actions';
import { NEIGHBORHOODS, VIBES } from '@/lib/vibes';
import type { CaptionRow, ImageRow, Vibe } from '@/lib/types';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const FORMAT_ERROR =
  'We can’t read this photo format. Please use a JPG, PNG or WebP. iPhone photos are often HEIC: export as JPEG, or set Settings › Camera › Formats to Most Compatible.';

type Phase = 'idle' | 'working' | 'done';
interface Batch { vibe: Vibe; captions: CaptionRow[] }

export default function PostPage() {
  return (
    <RequireAuth>
      <PostFlow />
    </RequireAuth>
  );
}

function PostFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [neighborhood, setNeighborhood] = useState('');
  const [vibe, setVibe] = useState<Vibe>('funny');
  const [moreVibe, setMoreVibe] = useState<Vibe>('funny');
  const [phase, setPhase] = useState<Phase>('idle');
  const [image, setImage] = useState<ImageRow | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (phase !== 'working') return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function pickFile(f: File | undefined | null) {
    setFileError(null);
    setError(null);
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    const typeOk = ACCEPTED.includes(f.type) || (!f.type && ['jpg', 'jpeg', 'png', 'webp'].includes(ext));
    if (!typeOk || ['heic', 'heif'].includes(ext)) {
      setFile(null);
      setPreview(null);
      setFileError(FORMAT_ERROR);
      return;
    }
    const url = URL.createObjectURL(f);
    const probe = new Image();
    probe.onload = () => {
      setFile(f);
      setPreview(url);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setFile(null);
      setPreview(null);
      setFileError(FORMAT_ERROR);
    };
    probe.src = url;
  }

  async function write(v: Vibe) {
    if (!file) return;
    setError(null);
    setElapsed(0);
    setPhase('working');
    try {
      let img = image;
      if (!img) {
        img = await uploadPhoto(file, neighborhood.trim() || null, v);
        setImage(img);
      }
      const captions = await generateCaptions(img.id, v);
      setBatches((b) => [{ vibe: v, captions }, ...b]);
      setPhase('done');
      setTimeout(() => resultsRef.current?.focus(), 50);
    } catch (e) {
      setPhase(batches.length ? 'done' : 'idle');
      if (e instanceof CaptionError && e.code === 'busy') {
        setError('The caption AI is busy right now. Wait a few seconds and try again.');
      } else if (e instanceof CaptionError && e.code === 'limit') {
        setError(`You’ve used all ${DAILY_GENERATION_LIMIT} caption generations for today. Come back tomorrow for more.`);
      } else {
        setError('Something went wrong while writing your captions. Please try again.');
      }
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setNeighborhood('');
    setImage(null);
    setBatches([]);
    setError(null);
    setPhase('idle');
  }

  const working = phase === 'working';
  const hasResults = batches.length > 0;

  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Post a photo</span>
        <h1 className="h-xl">Caption your New York</h1>
        <p>Upload a photo or meme, pick a voice, and get three captions. They go straight to the feed for everyone to vote on.</p>
      </header>

      <div className="post-layout">
        <section aria-labelledby="photo-heading">
          <h2 id="photo-heading" className="sr-only">Your photo</h2>
          {preview ? (
            <div className="preview">
              <Photo src={preview} alt="Preview of your photo" />
              <div className="preview-actions">
                <span>{file?.name}</span>
                {image ? (
                  <span className="post-place"><CheckIcon size={16} /> Posted</span>
                ) : (
                  <label className="btn btn-outline btn-sm file-label">
                    Choose another
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickFile(e.target.files?.[0])} disabled={working} />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`dropzone${dragOver ? ' is-over' : ''}`}
              onDragEnter={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
              onDrop={() => setDragOver(false)}
            >
              <span className="dropzone-icon"><UploadIcon size={28} /></span>
              <strong style={{ fontSize: 20 }}>Drop a photo here</strong>
              <span className="muted">or tap to choose one. JPG, PNG or WebP.</span>
              <span className="btn btn-outline btn-sm" aria-hidden="true">Choose photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose a photo to upload (JPG, PNG or WebP)"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
          )}
          {fileError && (
            <div className="alert" role="alert" style={{ marginTop: 14 }}>
              <AlertIcon size={18} />
              <span>{fileError}</span>
            </div>
          )}
        </section>

        <section aria-labelledby="details-heading">
          {!hasResults ? (
            <form
              className="card form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                write(vibe);
              }}
            >
              <h2 id="details-heading" className="h-md">Details</h2>
              <div className="field">
                <label htmlFor="place" className="field-label">Where in New York? <span className="muted" style={{ fontWeight: 500 }}>(optional)</span></label>
                <input
                  id="place"
                  className="input"
                  list="neighborhoods"
                  placeholder="e.g. Morningside Heights"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  disabled={working || !!image}
                  autoComplete="off"
                />
                <datalist id="neighborhoods">
                  {NEIGHBORHOODS.map((n) => <option key={n} value={n} />)}
                </datalist>
                <span className="field-hint">Leave it blank and we’ll just say New York.</span>
              </div>

              <VoicePicker name="voice" value={vibe} onChange={setVibe} disabled={working} legend="Pick a voice" />

              {error && (
                <div className="alert" role="alert">
                  <AlertIcon size={18} />
                  <span>{error}</span>
                </div>
              )}

              {working ? (
                <GeneratingState elapsed={elapsed} />
              ) : (
                <button type="submit" className="btn btn-accent btn-block" disabled={!file}>
                  Write my captions
                </button>
              )}
              {!file && !working && <span className="field-hint" style={{ textAlign: 'center' }}>Add a photo first.</span>}
            </form>
          ) : (
            <div className="form-stack">
              <div className="card form-stack" tabIndex={-1} ref={resultsRef} aria-live="polite">
                <h2 id="details-heading" className="h-md">Your captions</h2>
                <div className="notice">
                  <CheckIcon size={18} />
                  <span>Posted to the feed. Everyone can vote on them now.</span>
                </div>
                {working && <GeneratingState elapsed={elapsed} />}
                {batches.map((b, i) => (
                  <div key={i} className="form-stack" style={{ gap: 12 }}>
                    <div className="batch-head">
                      <VoiceTag vibe={b.vibe} />
                      {i === 0 ? 'Latest' : 'Earlier'}
                    </div>
                    <ul className="result-list">
                      {b.captions.map((c) => (
                        <li key={c.id} className="result-item">
                          <p>{c.content}</p>
                          <CopyButton text={c.content} compact />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {image && (
                  <Link href={`/#post-${image.id}`} className="link-arrow">
                    See it in the feed
                    <span className="circle"><ArrowUpRight size={14} /></span>
                  </Link>
                )}
              </div>

              <form
                className="card form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  write(moreVibe);
                }}
              >
                <h3 className="h-md" style={{ fontSize: 22 }}>Write three more</h3>
                <VoicePicker name="more-voice" value={moreVibe} onChange={setMoreVibe} disabled={working} legend="Same photo, any voice" />
                {error && (
                  <div className="alert" role="alert">
                    <AlertIcon size={18} />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" className="btn btn-accent btn-block" disabled={working}>
                  {working ? 'Writing…' : 'Write three more'}
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={reset} disabled={working}>
                  Post another photo
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function VoicePicker({
  name, value, onChange, disabled, legend,
}: { name: string; value: Vibe; onChange: (v: Vibe) => void; disabled?: boolean; legend: string }) {
  return (
    <fieldset className="fieldset" disabled={disabled}>
      <legend className="field-label">{legend}</legend>
      <div className="voice-grid">
        {VIBES.map((v) => (
          <label key={v.id} className="voice-option">
            <input type="radio" name={name} value={v.id} checked={value === v.id} onChange={() => onChange(v.id)} />
            <span className="voice-card">
              <strong>{v.label}</strong>
              <span>{v.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GeneratingState({ elapsed }: { elapsed: number }) {
  return (
    <div className="gen-loading" role="status">
      <Spinner label={elapsed < 15 ? 'Writing your captions… this takes about 5 to 15 seconds.' : 'Almost there, still writing…'} />
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
