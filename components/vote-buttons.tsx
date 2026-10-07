"use client";

import { useState, useTransition } from "react";
import { castVote } from "@/app/actions";

type VoteButtonsProps = {
  captionId: number;
  upvotes: number;
  downvotes: number;
  myVote: 1 | -1 | null;
  signedIn: boolean;
};

const baseClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const idleClass = "bg-black/5 text-black/80 enabled:hover:bg-black/10";

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
    if (!signedIn || isPending) {
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
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={!signedIn}
        title={signedIn ? "Upvote" : "Sign in to vote"}
        className={`${baseClass} ${
          vote === 1
            ? "bg-[#0071e3] text-white enabled:hover:bg-[#0a84ff]"
            : idleClass
        }`}
      >
        👍 {ups}
      </button>

      <button
        onClick={() => handleVote(-1)}
        disabled={!signedIn}
        title={signedIn ? "Downvote" : "Sign in to vote"}
        className={`${baseClass} ${
          vote === -1
            ? "bg-[#1d1d1f] text-white enabled:hover:bg-black/75"
            : idleClass
        }`}
      >
        👎 {downs}
      </button>

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
