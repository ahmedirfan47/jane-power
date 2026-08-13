"use client";

import Link from "next/link";
import { MobileWatchlist } from "./mobile-watchlist";
import { ThemeToggle } from "./theme-toggle";
import { useFeedStore } from "@/stores/feed";

export function MobileBar({ isGuest }: { isGuest: boolean }) {
  const { crypto, provider, mt5 } = useFeedStore();
  const fxLive = provider === "live" || mt5 === "live";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-hair bg-surface px-2">
      <MobileWatchlist />

      <span className="flex items-baseline gap-1.5">
        <span className="text-gold">◆</span>
        <span className="font-mono text-[12px] font-bold tracking-[0.1em]">JANE-POWER</span>
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <span
          className={`size-1.5 rounded-full ${
            fxLive && crypto === "live" ? "bg-bull-hi" : "bg-gold"
          }`}
          title={fxLive && crypto === "live" ? "All feeds live" : "Some feeds simulated"}
          aria-hidden
        />
        <ThemeToggle />
        {isGuest && (
          <Link
            href="/login"
            className="rounded-lg bg-gold px-3 py-1.5 text-[12px] font-semibold text-void"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}