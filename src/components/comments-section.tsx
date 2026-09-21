"use client";

import { useRef, useState, useTransition } from "react";
import { addComment, deleteComment } from "@/app/actions";

export function CommentsSection({
  destinationId,
  comments,
}: {
  destinationId: string;
  comments: { id: string; authorName: string; body: string; isOwn: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
      >
        {comments.length === 0
          ? "Kommentieren"
          : `${comments.length} ${comments.length === 1 ? "Kommentar" : "Kommentare"}`}
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-2xl bg-surface p-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink">
                <span className="font-semibold">{comment.authorName}:</span>{" "}
                <span className="text-ink-soft">{comment.body}</span>
              </p>
              {comment.isOwn && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteComment(comment.id);
                    })
                  }
                  className="shrink-0 text-xs text-ink-soft hover:text-ink disabled:opacity-50"
                  aria-label="Kommentar löschen"
                >
                  Löschen
                </button>
              )}
            </div>
          ))}

          <form
            ref={formRef}
            action={(formData) => {
              startTransition(async () => {
                await addComment(destinationId, formData);
                formRef.current?.reset();
              });
            }}
            className="flex gap-2"
          >
            <input
              name="body"
              type="text"
              required
              placeholder="Kommentar schreiben…"
              className="min-w-0 flex-1 rounded-full border border-line bg-bg px-3.5 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="shrink-0 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-bg hover:opacity-90 disabled:opacity-50"
            >
              Senden
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
