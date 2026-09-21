"use client";

import { useRef, useState, useTransition } from "react";
import { addDestination } from "@/app/actions";

export function AddDestinationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-full bg-surface px-5 py-4 text-left text-ink-soft transition-colors hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-ink">
          +
        </span>
        <span className="font-medium">Wohin soll&apos;s als Nächstes gehen?</span>
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await addDestination(formData);
          formRef.current?.reset();
          setOpen(false);
        });
      }}
      className="space-y-4 rounded-3xl bg-surface p-5"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink">
          Titel
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="z. B. Toskana, Italien"
          className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Warum sollten wir dorthin fahren?"
          className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Wird gespeichert…" : "Vorschlagen"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-2"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
