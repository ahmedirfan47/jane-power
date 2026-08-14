"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
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
    <div className="flex items-baseline gap-3">
      <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
        {chart.symbol}
      </span>
      <span className="t-num text-[17px] text-ink">{fmtPrice(chart.symbol, q.last)}</span>
      <span className={`t-num text-[13px] ${up ? "text-bull-hi" : "text-bear-hi"}`}>
        {up ? "+" : ""}
        {q.changePct.toFixed(2)}%
      </span>
      <span className={`t-label ml-auto text-[10px] ${live ? "text-bull-hi" : "text-ink-4"}`}>
        {live ? "Live" : "Simulated"}
      </span>
    </div>
  );
}

export function MobileBar({ isGuest }: { isGuest: boolean }) {
  const { crypto, provider, mt5 } = useFeedStore();
  const { layout, setLayout, clearFocus } = useWorkspaceStore();
  const [sheet, setSheet] = useState(false);
  const allLive = (provider === "live" || mt5 === "live") && crypto === "live";

  return (
    <>
      <header className="flex h-12 shrink-0 items-center border-b border-rule bg-surface">
        <div className="flex h-full items-center border-r border-rule">
          <MobileWatchlist />
        </div>

        <span className="px-3 font-display text-[14px] font-semibold tracking-tight">
          jane<span className="text-gold">·</span>power
        </span>

        <div className="ml-auto flex h-full items-center">
          <span
            className={`size-1.5 ${allLive ? "bg-bull-hi" : "bg-gold"}`}
            title={allLive ? "All feeds live" : "Some feeds simulated"}
            aria-hidden
          />

          <button
            onClick={() => setSheet(true)}
            aria-label="Chart layout"
            className="ml-3 flex h-full items-center gap-1.5 border-l border-rule px-3 text-ink-3 active:bg-raised"
          >
            <span className="t-label text-[10px]">Charts</span>
            <span className="t-num text-[14px] text-ink">{layout}</span>
          </button>

          <div className="flex h-full items-center border-l border-rule px-3">
            <ThemeToggle />
          </div>

          {isGuest && (
            <Link
              href="/login"
              className="flex h-full items-center border-l border-rule bg-ink px-4 text-[13px] font-medium text-void"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* active instrument readout */}
      <div className="flex h-11 shrink-0 items-center border-b border-rule bg-bg px-3">
        <ActivePrice />
      </div>

      {sheet && (
        <div
          className="fixed inset-0 z-[95] flex items-end bg-black/70"
          onClick={() => setSheet(false)}
        >
          <div
            className="w-full border-t border-rule bg-elevated pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <span className="t-h2 text-ink">Charts open</span>
              <button
                onClick={() => setSheet(false)}
                aria-label="Close"
                className="flex size-11 items-center justify-center text-ink-3 active:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <p className="px-4 pt-4 text-[13px] leading-relaxed text-ink-3">
              One chart shows at a time on a phone. Use the arrows below the chart to move
              between them.
            </p>

            <div className="mt-4 grid grid-cols-5 gap-px border-y border-rule bg-rule">
              {LAYOUTS.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setLayout(n);
                    clearFocus();
                    setSheet(false);
                  }}
                  aria-pressed={layout === n}
                  className={`t-num h-14 text-[16px] transition-colors ${
                    layout === n ? "bg-gold text-void" : "bg-elevated text-ink-2 active:bg-raised"
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