"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, X } from "lucide-react";
import { MobileWatchlist } from "./mobile-watchlist";
import { ThemeToggle } from "./theme-toggle";
import { useFeedStore } from "@/stores/feed";
import { useWorkspaceStore, type LayoutCount } from "@/stores/workspace";
import { useMarketStore } from "@/stores/market";
import { fmtPrice, META } from "@/lib/market/symbols";

const LAYOUTS: LayoutCount[] = [1, 2, 4, 6, 8];

function ActivePrice() {
  const { charts, activeId } = useWorkspaceStore();
  const quotes = useMarketStore((s) => s.quotes);
  const chart = charts.find((c) => c.id === activeId) ?? charts[0];
  if (!chart) return null;

  const q = quotes[chart.symbol];
  if (!q) return null;

  const m = META[chart.symbol];
  const up = q.changePct >= 0;
  const live = !!(m?.binance || m?.provider || m?.mt5);

  return (
    <span className="flex items-baseline gap-1.5">
      <span className="tnum text-[13px] font-bold">{fmtPrice(chart.symbol, q.last)}</span>
      <span className={`tnum text-[11px] font-semibold ${up ? "text-bull-hi" : "text-bear-hi"}`}>
        {up ? "+" : ""}
        {q.changePct.toFixed(2)}%
      </span>
      {!live && (
        <span className="rounded bg-surface-2 px-1 font-mono text-[8px] font-bold text-mute">
          SIM
        </span>
      )}
    </span>
  );
}

export function MobileBar({ isGuest }: { isGuest: boolean }) {
  const { crypto, provider, mt5 } = useFeedStore();
  const { layout, setLayout, clearFocus } = useWorkspaceStore();
  const [sheet, setSheet] = useState(false);
  const fxLive = provider === "live" || mt5 === "live";

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-hair bg-surface px-2">
        <MobileWatchlist />

        <span className="flex shrink-0 items-baseline gap-1">
          <span className="text-gold">◆</span>
          <span className="font-mono text-[11px] font-bold tracking-[0.08em]">JP</span>
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${
              fxLive && crypto === "live" ? "bg-bull-hi" : "bg-gold"
            }`}
            title={fxLive && crypto === "live" ? "All feeds live" : "Some feeds simulated"}
            aria-hidden
          />

          <button
            onClick={() => setSheet(true)}
            aria-label="Chart layout"
            className="flex h-9 items-center gap-1 rounded-lg border border-hair px-2 text-mute active:bg-surface-2"
          >
            <LayoutGrid size={14} />
            <span className="tnum text-[12px] font-bold">{layout}</span>
          </button>

          <ThemeToggle />

          {isGuest && (
            <Link
              href="/login"
              className="rounded-lg bg-gold px-2.5 py-1.5 text-[12px] font-semibold text-void"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* live price strip for the active chart */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hair bg-bg px-3">
        <ActivePrice />
      </div>

      {/* layout picker sheet */}
      {sheet && (
        <div className="fixed inset-0 z-[95] flex items-end bg-black/60" onClick={() => setSheet(false)}>
          <div
            className="w-full rounded-t-2xl border-t border-hair bg-elevated pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hair-soft px-4 py-3">
              <span className="text-sm font-semibold">Charts open</span>
              <button
                onClick={() => setSheet(false)}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-lg text-mute active:bg-surface-2"
              >
                <X size={16} />
              </button>
            </div>

            <p className="px-4 pt-3 text-[11px] leading-relaxed text-mute">
              On mobile one chart shows at a time — use the arrows below the chart to move between
              them.
            </p>

            <div className="flex gap-2 px-4 pt-3">
              {LAYOUTS.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setLayout(n);
                    clearFocus();
                    setSheet(false);
                  }}
                  aria-pressed={layout === n}
                  className={`tnum h-12 flex-1 rounded-xl text-[15px] font-bold transition-colors ${
                    layout === n ? "bg-gold text-void" : "bg-surface-2 text-mute active:bg-surface"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}