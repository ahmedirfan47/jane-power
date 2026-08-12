import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@jane-power/shared";
import { createClient } from "@/lib/supabase/server";

const MODULES: { label: string; status: "online" | "planned" }[] = [
  { label: "Foundation", status: "online" },
  { label: "Auth & accounts", status: "online" },
  { label: "Multi-chart terminal", status: "planned" },
  { label: "Realtime gateway", status: "planned" },
  { label: "Economic calendar", status: "planned" },
  { label: "Live news feed", status: "planned" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-line bg-panel p-8 shadow-2xl">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="text-lg text-gold">◆</span>
          <h1 className="font-mono text-xl font-bold tracking-[0.14em] text-txt">
            {APP_NAME.toUpperCase()}
          </h1>
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
            TERMINAL
          </span>
        </div>

        <p className="mb-6 text-sm text-muted">
          Real-time market intelligence — charts, macro calendar, and live news
          in one workstation.
        </p>

        <ul className="mb-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {MODULES.map((m) => (
            <li
              key={m.label}
              className="flex items-center gap-2.5 rounded-md border border-line-soft bg-panel-2 px-3 py-2"
            >
              <span
                className={
                  m.status === "online"
                    ? "size-1.5 rounded-full bg-up"
                    : "size-1.5 rounded-full bg-muted-2"
                }
                aria-hidden
              />
              <span className="flex-1 text-xs text-txt">{m.label}</span>
              <span
                className={
                  m.status === "online"
                    ? "font-mono text-[9px] uppercase tracking-wider text-up"
                    : "font-mono text-[9px] uppercase tracking-wider text-muted-2"
                }
              >
                {m.status}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-center text-sm font-semibold text-bg transition hover:bg-gold-bright"
            >
              Enter terminal
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-center text-sm font-semibold text-bg transition hover:bg-gold-bright"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-lg border border-line px-4 py-2.5 text-center text-sm font-semibold text-txt transition hover:border-gold/50"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="font-mono text-[10px] text-muted-2">v{APP_VERSION}</span>
          <span className="font-mono text-[10px] text-muted-2">phase 1 · auth</span>
        </div>
      </div>
    </main>
  );
}