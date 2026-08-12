import Link from "next/link";
import { APP_NAME } from "@jane-power/shared";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="text-2xl text-gold">◆</span>
          <h1 className="font-mono text-2xl font-bold tracking-[0.14em] text-ink">
            {APP_NAME.toUpperCase()}
          </h1>
        </div>

        <p className="mb-1 text-[15px] font-medium text-ink">
          The market, on one screen.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-mute">
          Live multi-chart workspace, macro sessions, and a real-time tape —
          built for traders who watch everything at once.
        </p>

        <div className="flex gap-3">
          {user ? (
            <Link
              href="/terminal"
              className="flex-1 rounded-lg bg-gold px-4 py-3 text-center text-sm font-semibold text-void transition hover:bg-gold-hi"
            >
              Enter terminal
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex-1 rounded-lg bg-gold px-4 py-3 text-center text-sm font-semibold text-void transition hover:bg-gold-hi"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-lg border border-hair px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-gold/50"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 font-mono text-[10px] tracking-wider text-mute-2">
        research & analysis · not investment advice
      </div>
    </main>
  );
}