"use client";

import { useRef, useState } from "react";
import { EconomicCalendar } from "./economic-calendar";
import { NewsFeed } from "./news-feed";
import { ErrorBoundary } from "@/components/error-boundary";

type Snap = "peek" | "half" | "full";
type Tab = "calendar" | "news";

const HEIGHTS: Record<Snap, string> = {
  peek: "38px",
  half: "45vh",
  full: "85vh",
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
      cycle(dy > 0 ? 1 : -1); // swipe up expands
    }
  };

  return (
    <section
      aria-label="Macro and news"
      className="flex shrink-0 flex-col border-t border-hair bg-surface transition-[height] duration-300 ease-out"
      style={{ height: HEIGHTS[snap] }}
    >
      {/* grab bar — swipe or tap */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={() => setSnap(snap === "peek" ? "half" : snap === "half" ? "full" : "peek")}
        role="button"
        tabIndex={0}
        aria-label="Resize panel"
        className="flex h-[38px] shrink-0 touch-none items-center justify-center gap-3 active:bg-surface-2"
      >
        <span className="h-1 w-10 rounded-full bg-mute" aria-hidden />
        {snap === "peek" && (
          <span className="text-[11px] font-semibold text-mute">Calendar &amp; News</span>
        )}
      </div>

      {snap !== "peek" && (
        <>
          <div className="flex shrink-0 gap-1 border-t border-hair-soft px-2 py-1.5" role="tablist">
            {(["calendar", "news"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`h-9 flex-1 rounded-lg text-[12px] font-semibold capitalize transition-colors ${
                  tab === t ? "bg-gold/15 text-gold-hi" : "bg-surface-2 text-mute"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden border-t border-hair-soft">
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