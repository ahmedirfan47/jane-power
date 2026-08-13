"use client";

import { useMarketStore } from "@/stores/market";
import { useWorkspaceStore } from "@/stores/workspace";
import { ALL_SYMBOLS, fmtPrice, META } from "@/lib/market/symbols";

/** Horizontally scrollable strip of key prices — tap to load into the active chart. */
export function MobileTape() {
  const quotes = useMarketStore((s) => s.quotes);
  const loadSymbolIntoActive = useWorkspaceStore((s) => s.loadSymbolIntoActive);

  // prioritise live-fed symbols so the strip shows real data first
  const ordered = [...ALL_SYMBOLS].sort((a, b) => {
    const la = META[a]?.binance || META[a]?.provider ? 0 : 1;
    const lb = META[b]?.binance || META[b]?.provider ? 0 : 1;
    return la - lb;
  });

  return (
    <div className="flex h-9 shrink-0 items-center overflow-x-auto border-t border-hair bg-surface no-scrollbar">
      <div className="flex">
        {ordered.map((s) => {
          const q = quotes[s];
          if (!q) return null;
          const up = q.changePct >= 0;
          return (
            <button
              key={s}
              onClick={() => loadSymbolIntoActive(s)}
              className="flex shrink-0 items-center gap-1.5 border-r border-hair-soft px-3 active:bg-surface-2"
            >
              <span className="text-[10px] font-semibold text-mute">{s}</span>
              <span className="tnum text-[11px]">{fmtPrice(s, q.last)}</span>
              <span
                className={`tnum text-[10px] font-semibold ${up ? "text-bull-hi" : "text-bear-hi"}`}
              >
                {up ? "▲" : "▼"}
                {Math.abs(q.changePct).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}