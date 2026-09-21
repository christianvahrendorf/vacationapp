"use client";

import { useRef, useState, useTransition } from "react";
import { deleteDestination, updateDestination } from "@/app/actions";
import { CommentsSection } from "@/components/comments-section";
import { ParticipantsSection } from "@/components/participants-section";
import { RatingWidget } from "@/components/rating-widget";
import type { DestinationClimate } from "@/lib/destination-climate";

export function DestinationCardInfo({
  destinationId,
  title,
  description,
  myVote,
  breakdown,
  isOwner,
  climate,
  participantNames,
  isParticipating,
  comments,
  createdByName,
}: {
  destinationId: string;
  title: string;
  description: string | null;
  myVote: number | null;
  breakdown: { name: string; score: number }[];
  isOwner: boolean;
  climate: DestinationClimate | null;
  participantNames: string[];
  isParticipating: boolean;
  comments: { id: string; authorName: string; body: string; isOwn: boolean }[];
  createdByName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (editing) {
    return (
      <div className="p-5">
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              await updateDestination(destinationId, formData);
              setEditing(false);
            });
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor={`title-${destinationId}`} className="block text-sm font-medium text-ink">
              Titel
            </label>
            <input
              id={`title-${destinationId}`}
              name="title"
              type="text"
              required
              defaultValue={title}
              className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`description-${destinationId}`}
              className="block text-sm font-medium text-ink"
            >
              Beschreibung
            </label>
            <textarea
              id={`description-${destinationId}`}
              name="description"
              rows={3}
              defaultValue={description ?? ""}
              className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Wird gespeichert…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-2"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-5">
      <p className="text-xs text-ink-soft">Vorgeschlagen von {createdByName}</p>

      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}

      {climate && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs text-ink-soft">
          <span className="font-semibold text-ink">Beste Reisezeit:</span>
          <span>{climate.bestMonthsLabel}</span>
          <span className="text-line">·</span>
          <span>⌀ {climate.avgHighBestMonths}°C</span>
        </div>
      )}

      <ParticipantsSection
        destinationId={destinationId}
        names={participantNames}
        isParticipating={isParticipating}
      />

      {isOwner && !confirmingDelete && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
          >
            Löschen
          </button>
        </div>
      )}

      {isOwner && confirmingDelete && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink">Wirklich löschen?</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteDestination(destinationId);
              })
            }
            className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Wird gelöscht…" : "Ja, löschen"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {breakdown.map((b, i) => (
            <span key={i} className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
              {b.name} <span className="font-semibold text-ink">{b.score}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-soft">Deine Bewertung</p>
        <RatingWidget destinationId={destinationId} myScore={myVote} />
      </div>

      <CommentsSection destinationId={destinationId} comments={comments} />
    </div>
  );
}
