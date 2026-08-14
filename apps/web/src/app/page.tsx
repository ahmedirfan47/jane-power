import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/terminal/theme-toggle";

export const dynamic = "force-dynamic";

const COVERAGE = [
  { group: "Metals", items: "Gold, Silver", live: true },
  { group: "Forex", items: "EUR, GBP, JPY, AUD, CAD", live: true },
  { group: "Crypto", items: "BTC, ETH, SOL, XRP, BNB, DOGE", live: true },
  { group: "Indices", items: "US500, US30, NAS100, DAX, Nikkei", live: false },
];

const CAPABILITIES = [
  {
    title: "Multi-chart workspace",
    body: "Open up to eight independent charts. Focus any two to compare without losing the others.",
  },
  {
    title: "Macro calendar",
    body: "Scheduled releases with forecast, previous, and actual — filtered by impact.",
  },
  {
    title: "Market newswire",
    body: "Headlines across general, forex, and crypto, refreshed continuously.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-50 border-b border-rule bg-void/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            jane<span className="text-gold">·</span>power
          </span>
          <nav className="ml-auto flex items-center gap-6">
            <Link
              href="/terminal"
              className="hidden text-[13px] text-ink-2 transition-colors hover:text-ink sm:block"
            >
              Terminal
            </Link>
            <ThemeToggle />
            {user ? (
              <Link
                href="/terminal"
                className="bg-ink px-4 py-2 text-[13px] font-medium text-void transition-opacity hover:opacity-90"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                Open terminal
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[13px] text-ink-2 transition-colors hover:text-ink"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24">
        <div className="max-w-3xl">
          <p className="t-label rise mb-6">Market intelligence terminal</p>
          <h1 className="t-display rise mb-6 text-ink" style={{ animationDelay: "60ms" }}>
            Every market you watch,
            <br />
            on one screen.
          </h1>
          <p
            className="rise mb-10 max-w-xl text-[17px] leading-relaxed text-ink-2"
            style={{ animationDelay: "120ms" }}
          >
            Live prices, multi-chart analysis, the macro calendar, and the newswire —
            in a single workspace built for people who watch more than one thing at once.
          </p>
          <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
            <Link
              href="/terminal"
              className="bg-gold px-5 py-3 text-[14px] font-medium text-void transition-colors hover:bg-gold-hi"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              Open the terminal
            </Link>
            {!user && (
              <Link
                href="/register"
                className="border border-rule px-5 py-3 text-[14px] font-medium text-ink transition-colors hover:border-ink-4"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                Create an account
              </Link>
            )}
            <span className="text-[13px] text-ink-4">No signup required to look around</span>
          </div>
        </div>
      </section>

      {/* coverage — the trust signal: what is real, stated plainly */}
      <section className="border-y border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="t-label">Coverage</h2>
            <span className="t-num text-[12px] text-ink-4">Updated continuously</span>
          </div>
          <div className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {COVERAGE.map((c) => (
              <div key={c.group} className="bg-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-display text-[15px] font-semibold text-ink">{c.group}</span>
                  {c.live && (
                    <span className="t-num text-[10px] font-semibold uppercase tracking-wider text-bull-hi">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed text-ink-3">{c.items}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-ink-4">
            Live feeds are labelled on every chart and quote. Anything not yet on a live
            feed is marked simulated — you always know which numbers are real.
          </p>
        </div>
      </section>

      {/* capabilities */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="t-label mb-8">What it does</h2>
        <div className="grid gap-px bg-rule md:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="bg-void p-6">
              <h3 className="t-h2 mb-3 text-ink">{c.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-3">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* close */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="t-h1 mb-2 text-ink">Open it and look around.</h2>
            <p className="text-[14px] text-ink-3">The terminal is public. Nothing to sign up for.</p>
          </div>
          <Link
            href="/terminal"
            className="shrink-0 bg-gold px-5 py-3 text-[14px] font-medium text-void transition-colors hover:bg-gold-hi"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Open the terminal
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-rule bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-[13px] font-semibold text-ink-3">
            jane<span className="text-gold">·</span>power
          </span>
          <p className="text-[12px] text-ink-4">
            Research and analysis only. Not investment advice.
          </p>
        </div>
      </footer>
    </div>
  );
}