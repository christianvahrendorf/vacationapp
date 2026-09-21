"use client";

import { useTransition } from "react";
import { toggleParticipant } from "@/app/actions";

export function ParticipantsSection({
  destinationId,
  names,
  isParticipating,
}: {
  destinationId: string;
  names: string[];
  isParticipating: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleParticipant(destinationId);
          })
        }
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          isParticipating
            ? "bg-accent text-accent-ink hover:opacity-90"
            : "bg-surface text-ink hover:bg-surface-2"
        }`}
      >
        {isParticipating ? "Du bist dabei ✓" : "Ich bin dabei"}
      </button>

      {names.length > 0 && (
        <span className="text-xs text-ink-soft">
          {names.length === 1 ? "Dabei" : `${names.length} dabei`}: {names.join(", ")}
        </span>
      )}
    </div>
  );
}
