"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useWorkspaceStore, type LayoutCount } from "@/stores/workspace";
import { useUiStore } from "@/stores/ui";
import { sessionInfo } from "@/lib/market/engine";
import { signOut } from "@/lib/actions/auth";
import { FeedStatusBar } from "./feed-status";

const LAYOUTS: LayoutCount[] = [1, 2, 4, 6, 8];
const SESSIONS = ["SYD", "TYO", "LDN", "NY"];

export function CommandBar({
  email,
  role,
  isGuest,
}: {
  email: string;
  role: string;
  isGuest: boolean;
}) {
  const { layout, setLayout, focusedIds, clearFocus } = useWorkspaceStore();
  const setPalette = useUiStore((s) => s.setPalette);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utcHour = now?.getUTCHours() ?? -1;
  const { active, killzone } = sessionInfo(utcHour);
  const utc = now ? now.toISOString().slice(11, 19) : "--:--:--";

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-hair bg-surface px-3">
      <div className="flex items-baseline gap-2">
        <span className="text-gold">◆</span>
        <span className="font-mono text-[13px] font-bold tracking-[0.14em]">JANE-POWER</span>
      </div>

      <button
        onClick={() => setPalette(true)}
        className="flex items-center gap-2 rounded-md border border-hair bg-bg px-2.5 py-1.5 text-mute transition-colors hover:border-gold/40 max-sm:hidden"
      >
        <Search size={12} />
        <span className="text-[11px]">Search markets</span>
        <kbd className="ml-3 rounded border border-hair-soft bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-mute-2">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        {LAYOUTS.map((n) => (
          <button
            key={n}
            onClick={() => {
              setLayout(n);
              clearFocus();
            }}
            className={`tnum size-6 rounded-md border text-[11px] font-semibold transition-colors ${
              layout === n
                ? "border-gold/40 bg-gold/12 text-gold-hi"
                : "border-hair bg-surface-2 text-mute hover:text-ink"
            }`}
          >
            {n}
          </button>
        ))}
        {focusedIds.length > 0 && (
          <button
            onClick={clearFocus}
            className="ml-1 flex items-center gap-1 rounded-md border border-bear/30 bg-bear/10 px-2 py-1 text-[10px] font-semibold text-bear-hi"
          >
            <X size={11} /> reset
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3 text-[11px] text-mute max-md:hidden">
        <div className="flex items-center gap-1">
          {SESSIONS.map((s) => (
            <span
              key={s}
              className={`tnum rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                active.includes(s) ? "bg-[#1a2a20] text-ink" : "bg-surface-2 text-mute-2"
              }`}
            >
              {s}
            </span>
          ))}
          {killzone && (
            <span className="tnum rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold text-void">KILLZONE</span>
          )}
        </div>
        <span className="tnum">
          <b className="text-ink">{utc}</b> UTC
        </span>
        <FeedStatusBar />
      </div>

      <div className="flex items-center gap-3">
        {isGuest ? (
          <Link
            href="/login"
            className="rounded-md bg-gold px-3 py-1 text-[11px] font-semibold text-void transition hover:bg-gold-hi"
          >
            Sign in
          </Link>
        ) : (
          <>
            <span className="rounded-full border border-gold/35 bg-gold/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gold max-sm:hidden">
              {role}
            </span>
            <span className="text-[11px] text-mute max-lg:hidden">{email}</span>
            <form action={signOut}>
              <button className="rounded-md border border-hair px-2.5 py-1 text-[11px] text-mute transition-colors hover:text-ink">
                Sign out
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}