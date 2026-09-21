import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="relative min-h-[320px] flex-1 overflow-hidden sm:min-h-[380px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10"
        />
        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-10 pt-14">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-sm font-medium text-white/70">Familie Meyer</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight text-white">
              Wohin geht&apos;s als Nächstes?
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Schlagt Ziele vor, stimmt gemeinsam ab und findet euren nächsten
              Urlaub.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 rounded-t-[2rem] bg-bg px-6 pt-8 pb-12 shadow-[0_-12px_30px_rgba(0,0,0,0.12)]">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-lg font-semibold text-ink">Anmelden</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Melde dich mit deinem Familien-Account an.
          </p>

          <form action={login} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink"
              >
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink"
              >
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Anmelden
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
