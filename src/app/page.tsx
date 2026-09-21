import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";
import { AddDestinationForm } from "@/components/add-destination-form";
import { DestinationCardInfo } from "@/components/destination-card-info";
import { DestinationsMap } from "@/components/destinations-map";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import type { DestinationClimate } from "@/lib/destination-climate";

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

  const [
    { data: destinations },
    { data: votes },
    { data: profiles },
    { data: participants },
    { data: comments },
  ] = await Promise.all([
    supabase
      .from("destinations")
      .select("id, title, description, image_url, climate, created_at, created_by")
      .order("created_at", { ascending: false }),
    supabase.from("votes").select("destination_id, user_id, score"),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("participants").select("destination_id, user_id"),
    supabase
      .from("comments")
      .select("id, destination_id, user_id, body, created_at")
      .order("created_at", { ascending: true }),
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

      const participantsFor = (participants ?? []).filter(
        (p) => p.destination_id === destination.id
      );
      const participantNames = participantsFor
        .map((p) => nameById.get(p.user_id) ?? "Unbekannt")
        .sort((a, b) => a.localeCompare(b));
      const isParticipating = participantsFor.some((p) => p.user_id === user.id);

      const destinationComments = (comments ?? [])
        .filter((c) => c.destination_id === destination.id)
        .map((c) => ({
          id: c.id,
          authorName: nameById.get(c.user_id) ?? "Unbekannt",
          body: c.body,
          isOwn: c.user_id === user.id,
        }));

      return {
        destination,
        average,
        count: votesFor.length,
        myVote,
        breakdown,
        participantNames,
        isParticipating,
        comments: destinationComments,
      };
    })
    .sort((a, b) => {
      if (a.average === null && b.average === null) return 0;
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    });

  const mapPins = ranked
    .map(({ destination }) => {
      const climate = destination.climate as DestinationClimate | null;
      return climate ? { id: destination.id, title: destination.title, lat: climate.lat, lon: climate.lon } : null;
    })
    .filter((pin): pin is { id: string; title: string; lat: number; lon: number } => pin !== null);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <RealtimeRefresher />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/meyer-emblem.png" alt="" className="h-11 w-11 object-contain" />
          <div>
            <p className="text-sm font-medium text-accent">Familie Meyer</p>
            <h1 className="font-display text-3xl font-bold text-ink">Hi, {myName} 👋</h1>
          </div>
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

      <DestinationsMap pins={mapPins} />

      {ranked.length === 0 ? (
        <p className="rounded-3xl bg-surface px-5 py-10 text-center text-sm text-ink-soft">
          Noch keine Ziele vorgeschlagen. Sei die/der Erste!
        </p>
      ) : (
        <ol className="space-y-5">
          {ranked.map(
            (
              {
                destination,
                average,
                count,
                myVote,
                breakdown,
                participantNames,
                isParticipating,
                comments: destinationComments,
              },
              index
            ) => {
            const isLeader = index === 0 && average !== null;
            return (
              <li
                key={destination.id}
                className={`overflow-hidden rounded-3xl bg-bg ${
                  isLeader ? "border-2 border-accent" : "border border-line"
                }`}
              >
                <div
                  className="relative h-60 overflow-hidden"
                  style={
                    destination.image_url
                      ? undefined
                      : { background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }
                  }
                >
                  {destination.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={destination.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {!destination.image_url && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-4 right-3 select-none font-display text-7xl font-bold text-white/20"
                    >
                      {destination.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/0"
                  />

                  <div className="absolute inset-x-4 top-4 flex items-start justify-between">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
                      Platz {index + 1}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
                      <span className="text-accent">★</span>
                      {average !== null ? average.toFixed(1) : "–"}
                    </span>
                  </div>

                  <div className="absolute inset-x-4 bottom-4">
                    <h2 className="font-display text-2xl font-bold text-white">
                      {destination.title}
                    </h2>
                    <p className="text-sm text-white/80">
                      {count} {count === 1 ? "Stimme" : "Stimmen"}
                    </p>
                  </div>
                </div>

                <DestinationCardInfo
                  destinationId={destination.id}
                  title={destination.title}
                  description={destination.description}
                  myVote={myVote}
                  breakdown={breakdown}
                  isOwner={destination.created_by === user.id}
                  climate={destination.climate as DestinationClimate | null}
                  participantNames={participantNames}
                  isParticipating={isParticipating}
                  comments={destinationComments}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
