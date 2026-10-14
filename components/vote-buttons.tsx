"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { castVote } from "@/app/actions";
import { signInWithGoogle } from "@/lib/auth-client";

type VoteButtonsProps = {
  captionId: number;
  upvotes: number;
  downvotes: number;
  myVote: 1 | -1 | null;
  signedIn: boolean;
};

const baseClass =
  "inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition duration-150 active:translate-y-px";

const idleClass = "bg-black/[0.05] text-ink hover:bg-black/10";

export default function VoteButtons({
  captionId,
  upvotes,
  downvotes,
  myVote,
  signedIn,
}: VoteButtonsProps) {
  const [vote, setVote] = useState(myVote);
  const [ups, setUps] = useState(upvotes);
  const [downs, setDowns] = useState(downvotes);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleVote(value: 1 | -1) {
    if (!signedIn) {
      signInWithGoogle();
      return;
    }

    if (isPending) {
      return;
    }

    const previous = { vote, ups, downs };
    const next = vote === value ? null : value;

    setUps(ups - (vote === 1 ? 1 : 0) + (next === 1 ? 1 : 0));
    setDowns(downs - (vote === -1 ? 1 : 0) + (next === -1 ? 1 : 0));
    setVote(next);
    setError("");

    startTransition(async () => {
      const result = await castVote(captionId, value);

      if (result.error) {
        setVote(previous.vote);
        setUps(previous.ups);
        setDowns(previous.downs);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => handleVote(1)}
        aria-pressed={vote === 1}
        title={signedIn ? "Upvote" : "Sign in to vote"}
        className={`${baseClass} ${
          vote === 1 ? "animate-pop bg-accent text-white" : idleClass
        }`}
      >
        <ArrowUp size={13} strokeWidth={2.5} />
        {ups}
      </button>

      <button
        onClick={() => handleVote(-1)}
        aria-pressed={vote === -1}
        title={signedIn ? "Downvote" : "Sign in to vote"}
        className={`${baseClass} ${
          vote === -1 ? "animate-pop bg-ink text-white" : idleClass
        }`}
      >
        <ArrowDown size={13} strokeWidth={2.5} />
        {downs}
      </button>

      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}
