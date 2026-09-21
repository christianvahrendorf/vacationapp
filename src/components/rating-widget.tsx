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
    <div className="flex items-center gap-1" role="group" aria-label="Bewertung 1 bis 5">
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
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
              active
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
