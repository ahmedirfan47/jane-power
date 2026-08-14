"use client";

import { useMarketStore } from "@/stores/market";
import { useWorkspaceStore } from "@/stores/workspace";
import { ALL_SYMBOLS, fmtPrice, META } from "@/lib/market/symbols";

export function MobileTape() {
  const quotes = useMarketStore((s) => s.quotes);
  const loadSymbolIntoActive = useWorkspaceStore((s) => s.loadSymbolIntoActive);

  const ordered = [...ALL_SYMBOLS].sort((a, b) => {
    const la = META[a]?.binance || META[a]?.provider ? 0 : 1;
    const lb = META[b]?.binance || META[b]?.provider ? 0 : 1;
    return la - lb;
  });

  return (
    <div className="no-scrollbar flex h-10 shrink-0 items-stretch overflow-x-auto border-t border-rule bg-surface">
      {ordered.map((s) => {
        const q = quotes[s];
        if (!q) return null;
        const up = q.changePct >= 0;
        return (
          <button
            key={s}
            onClick={() => loadSymbolIntoActive(s)}
            className="flex shrink-0 items-baseline gap-2 border-r border-rule-soft px-3 active:bg-raised"
          >
            <span className="text-[11px] font-medium text-ink-3">{s}</span>
            <span className="t-num text-[12px] text-ink-2">{fmtPrice(s, q.last)}</span>
            <span className={`t-num text-[11px] ${up ? "text-bull-hi" : "text-bear-hi"}`}>
              {up ? "+" : ""}
              {q.changePct.toFixed(2)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}