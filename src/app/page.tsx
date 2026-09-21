import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";
import { AddDestinationForm } from "@/components/add-destination-form";
import { RatingWidget } from "@/components/rating-widget";
import { RealtimeRefresher } from "@/components/realtime-refresher";

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #ff6b4d, #ffb199)",
  "linear-gradient(135deg, #0f9b8e, #79e0c9)",
  "linear-gradient(135deg, #5b5fef, #a5a8ff)",
  "linear-gradient(135deg, #e8a33d, #ffd68a)",
  "linear-gradient(135deg, #2f7a4f, #8fd4a8)",
];

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: destinations }, { data: votes }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("destinations")
        .select("id, title, description, created_at, created_by")
        .order("created_at", { ascending: false }),
      supabase.from("votes").select("destination_id, user_id, score"),
      supabase.from("profiles").select("id, display_name"),
    ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const myName = nameById.get(user.id) ?? user.email ?? "Du";

  const ranked = (destinations ?? [])
    .map((destination) => {
      const votesFor = (votes ?? []).filter(
        (v) => v.destination_id === destination.id
      );
      const average =
        votesFor.length > 0
          ? votesFor.reduce((sum, v) => sum + v.score, 0) / votesFor.length
          : null;
      const myVote =
        votesFor.find((v) => v.user_id === user.id)?.score ?? null;
      const breakdown = votesFor
        .map((v) => ({
          name: nameById.get(v.user_id) ?? "Unbekannt",
          score: v.score,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { destination, average, count: votesFor.length, myVote, breakdown };
    })
    .sort((a, b) => {
      if (a.average === null && b.average === null) return 0;
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <RealtimeRefresher />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Familie Meyer</p>
          <h1 className="font-display text-3xl font-bold text-ink">
            Destination Finder
          </h1>
        </div>
        <form
          action={logout}
          className="flex items-center gap-2 rounded-full bg-surface p-1.5 pl-4"
        >
          <span className="text-sm text-ink-soft">{myName}</span>
          <button
            type="submit"
            className="rounded-full bg-bg px-3 py-1.5 text-sm font-medium text-ink shadow-sm hover:bg-surface-2"
          >
            Abmelden
          </button>
        </form>
      </header>

      <div className="mb-8">
        <AddDestinationForm />
      </div>

      {ranked.length === 0 ? (
        <p className="rounded-3xl bg-surface px-5 py-10 text-center text-sm text-ink-soft">
          Noch keine Ziele vorgeschlagen. Sei die/der Erste!
        </p>
      ) : (
        <ol className="space-y-5">
          {ranked.map(({ destination, average, count, myVote, breakdown }, index) => {
            const isLeader = index === 0 && average !== null;
            return (
              <li
                key={destination.id}
                className={`overflow-hidden rounded-3xl bg-bg ${
                  isLeader ? "border-2 border-accent" : "border border-line"
                }`}
              >
                <div
                  className="relative flex h-28 items-start justify-between overflow-hidden p-4"
                  style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }}
                >
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
                    Platz {index + 1}
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-5 right-3 select-none font-display text-7xl font-bold text-white/25"
                  >
                    {destination.title.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {destination.title}
                    </h2>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-2xl font-bold text-ink">
                        {average !== null ? average.toFixed(1) : "–"}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {count} {count === 1 ? "Stimme" : "Stimmen"}
                      </p>
                    </div>
                  </div>

                  {destination.description && (
                    <p className="mt-1 text-sm text-ink-soft">
                      {destination.description}
                    </p>
                  )}

                  {breakdown.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {breakdown.map((b, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft"
                        >
                          {b.name} <span className="font-semibold text-ink">{b.score}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-ink-soft">
                      Deine Bewertung
                    </p>
                    <RatingWidget destinationId={destination.id} myScore={myVote} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
