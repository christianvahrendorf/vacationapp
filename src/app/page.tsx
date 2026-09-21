import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";
import { AddDestinationForm } from "@/components/add-destination-form";
import { RatingWidget } from "@/components/rating-widget";
import { RealtimeRefresher } from "@/components/realtime-refresher";

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
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <RealtimeRefresher />

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Destination Finder der Familie Meyer
          </h1>
          <p className="text-sm text-slate-500">Angemeldet als {myName}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Abmelden
          </button>
        </form>
      </header>

      <div className="mb-6">
        <AddDestinationForm />
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm text-slate-500">
          Noch keine Ziele vorgeschlagen. Sei die/der Erste!
        </p>
      ) : (
        <ol className="space-y-4">
          {ranked.map(({ destination, average, count, myVote, breakdown }, index) => (
            <li
              key={destination.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    #{index + 1}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {destination.title}
                  </h2>
                  {destination.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {destination.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {average !== null ? average.toFixed(1) : "–"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {count} {count === 1 ? "Stimme" : "Stimmen"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Deine Bewertung
                </p>
                <RatingWidget destinationId={destination.id} myScore={myVote} />
              </div>

              {breakdown.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {breakdown.map((b, i) => (
                    <span key={i}>
                      {b.name}: <span className="font-medium">{b.score}</span>
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
