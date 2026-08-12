import Link from "next/link";
import { APP_NAME } from "@jane-power/shared";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MODULES: { label: string; status: "online" | "planned" }[] = [
  { label: "Live market data", status: "online" },
  { label: "Multi-chart workspace", status: "online" },
  { label: "Economic calendar", status: "planned" },
  { label: "News feed", status: "planned" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-hair bg-surface p-8 shadow-2xl">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="text-lg text-gold">◆</span>
          <h1 className="font-mono text-xl font-bold tracking-[0.14em] text-ink">
            {APP_NAME.toUpperCase()}
          </h1>
          <span className="font-mono text-[10px] tracking-[0.2em] text-mute">TERMINAL</span>
        </div>

        <p className="mb-6 text-sm text-mute">
          Real-time market intelligence — multi-chart workspace, macro calendar,
          and live news in one workstation.
        </p>

        <ul className="mb-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {MODULES.map((m) => (
            <li
              key={m.label}
              className="flex items-center gap-2.5 rounded-md border border-hair-soft bg-surface-2 px-3 py-2"
            >
              <span
                className={
                  m.status === "online" ? "size-1.5 rounded-full bg-bull-hi" : "size-1.5 rounded-full bg-mute-2"
                }
                aria-hidden
              />
              <span className="flex-1 text-xs text-ink">{m.label}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          {user ? (
            <Link
              href="/terminal"
              className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-center text-sm font-semibold text-void transition hover:bg-gold-hi"
            >
              Enter terminal
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-center text-sm font-semibold text-void transition hover:bg-gold-hi"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-lg border border-hair px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-gold/50"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}