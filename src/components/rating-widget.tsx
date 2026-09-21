"use client";

import { useTransition } from "react";
import { castVote } from "@/app/actions";

export function RatingWidget({
  destinationId,
  myScore,
}: {
  destinationId: string;
  myScore: number | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="inline-flex rounded-full bg-surface p-1"
      role="group"
      aria-label="Deine Bewertung, 1 bis 5"
    >
      {[1, 2, 3, 4, 5].map((score) => {
        const active = myScore === score;
        return (
          <button
            key={score}
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await castVote(destinationId, score);
              })
            }
            aria-pressed={active}
            aria-label={`${score} von 5`}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
              active
                ? "bg-accent text-accent-ink"
                : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
