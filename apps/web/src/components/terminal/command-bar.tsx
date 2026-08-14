"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useWorkspaceStore, type LayoutCount } from "@/stores/workspace";
import { useUiStore } from "@/stores/ui";
import { sessionInfo } from "@/lib/market/engine";
import { signOut } from "@/lib/actions/auth";
import { FeedStatusBar } from "./feed-status";
import { ThemeToggle } from "./theme-toggle";

const LAYOUTS: LayoutCount[] = [1, 2, 4, 6, 8];
const SESSIONS = ["SYD", "TYO", "LDN", "NY"];

export function CommandBar({ email, role, isGuest }: { email: string; role: string; isGuest: boolean }) {
  const { layout, setLayout, focusedIds, clearFocus } = useWorkspaceStore();
  const setPalette = useUiStore((s) => s.setPalette);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utcHour = now?.getUTCHours() ?? -1;
  const { active } = sessionInfo(utcHour);
  const utc = now ? now.toISOString().slice(11, 19) : "--:--:--";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-rule bg-surface">
      <div className="flex h-full items-center border-r border-rule px-4">
        <span className="font-display text-[14px] font-semibold tracking-tight">
          jane<span className="text-gold">·</span>power
        </span>
      </div>

      <button
        onClick={() => setPalette(true)}
        className="flex h-full items-center gap-3 border-r border-rule px-4 text-ink-3 transition-colors hover:bg-raised hover:text-ink max-sm:hidden"
      >
        <Search size={13} />
        <span className="text-[13px]">Search</span>
        <kbd className="t-num border border-rule px-1.5 py-0.5 text-[10px] text-ink-4">⌘K</kbd>
      </button>

      <div className="flex h-full items-center border-r border-rule px-3">
        <span className="t-label mr-3 text-[10px]">Charts</span>
        <div className="flex">
          {LAYOUTS.map((n) => (
            <button
              key={n}
              onClick={() => {
                setLayout(n);
                clearFocus();
              }}
              aria-pressed={layout === n}
              className={`t-num size-7 text-[12px] transition-colors ${
                layout === n ? "bg-ink text-void" : "text-ink-3 hover:bg-raised hover:text-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {focusedIds.length > 0 && (
          <button
            onClick={clearFocus}
            className="ml-2 flex items-center gap-1 text-[11px] text-ink-3 transition-colors hover:text-ink"
          >
            <X size={11} /> Clear focus
          </button>
        )}
      </div>

      <div className="ml-auto flex h-full items-center max-md:hidden">
        <div className="flex h-full items-center gap-2 border-l border-rule px-4">
          {SESSIONS.map((s) => (
            <span
              key={s}
              className={`t-num text-[10px] font-semibold tracking-wide ${
                active.includes(s) ? "text-bull-hi" : "text-ink-4"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex h-full items-center border-l border-rule px-4">
          <span className="t-num text-[12px] text-ink-2">{utc}</span>
          <span className="t-label ml-1.5 text-[10px]">UTC</span>
        </div>
        <div className="flex h-full items-center border-l border-rule px-4">
          <FeedStatusBar />
        </div>
      </div>

      <div className="flex h-full items-center gap-3 border-l border-rule px-4">
        <ThemeToggle />
        {isGuest ? (
          <Link
            href="/login"
            className="bg-ink px-3 py-1.5 text-[12px] font-medium text-void transition-opacity hover:opacity-90"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Sign in
          </Link>
        ) : (
          <>
            <span className="t-label text-[10px] max-lg:hidden">{role}</span>
            <span className="text-[12px] text-ink-3 max-xl:hidden">{email}</span>
            <form action={signOut}>
              <button className="text-[12px] text-ink-3 transition-colors hover:text-ink">
                Sign out
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}