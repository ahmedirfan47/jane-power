"use client";

import { useRef, useState } from "react";
import { EconomicCalendar } from "./economic-calendar";
import { NewsFeed } from "./news-feed";
import { ErrorBoundary } from "@/components/error-boundary";

type Snap = "peek" | "half" | "full";
type Tab = "calendar" | "news";

const HEIGHTS: Record<Snap, string> = {
  peek: "36px",
  half: "46vh",
  full: "84vh",
};

export function MobileDock() {
  const [snap, setSnap] = useState<Snap>("peek");
  const [tab, setTab] = useState<Tab>("calendar");
  const startY = useRef(0);
  const moved = useRef(false);

  const cycle = (dir: 1 | -1) => {
    const order: Snap[] = ["peek", "half", "full"];
    const i = order.indexOf(snap);
    const next = order[Math.min(order.length - 1, Math.max(0, i + dir))];
    if (next) setSnap(next);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? 0;
    moved.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dy = startY.current - (e.touches[0]?.clientY ?? 0);
    if (Math.abs(dy) > 40 && !moved.current) {
      moved.current = true;
      cycle(dy > 0 ? 1 : -1);
    }
  };

  return (
    <section
      aria-label="Calendar and news"
      className="flex shrink-0 flex-col border-t border-rule bg-surface transition-[height] duration-300 ease-out"
      style={{ height: HEIGHTS[snap] }}
    >
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={() => setSnap(snap === "peek" ? "half" : snap === "half" ? "full" : "peek")}
        role="button"
        tabIndex={0}
        aria-label="Resize panel"
        aria-expanded={snap !== "peek"}
        className="flex h-9 shrink-0 touch-none items-center justify-between px-4 active:bg-raised"
      >
        <span className="t-label text-[10px]">Calendar &amp; news</span>
        <span className="h-px w-8 bg-ink-4" aria-hidden />
      </div>

      {snap !== "peek" && (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-px border-t border-rule bg-rule" role="tablist">
            {(["calendar", "news"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`h-11 text-[13px] font-medium capitalize transition-colors ${
                  tab === t ? "bg-raised text-gold-hi" : "bg-surface text-ink-3"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden border-t border-rule">
            {tab === "calendar" ? (
              <ErrorBoundary label="Calendar">
                <EconomicCalendar />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary label="News">
                <NewsFeed />
              </ErrorBoundary>
            )}
          </div>
        </>
      )}
    </section>
  );
}