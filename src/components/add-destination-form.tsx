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
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Neues Ziel vorschlagen
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
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Titel
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="z. B. Toskana, Italien"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Warum sollten wir dorthin fahren?"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? "Wird gespeichert…" : "Vorschlagen"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
