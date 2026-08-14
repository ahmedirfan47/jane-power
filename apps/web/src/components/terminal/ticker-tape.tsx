"use client";

import { useMarketStore } from "@/stores/market";
import { ALL_SYMBOLS, fmtPrice } from "@/lib/market/symbols";

export function TickerTape() {
  const quotes = useMarketStore((s) => s.quotes);
  const items = ALL_SYMBOLS.map((s) => quotes[s]!).filter(Boolean);

  return (
    <footer className="flex h-8 shrink-0 items-center overflow-hidden border-t border-rule bg-surface">
      <div className="flex whitespace-nowrap" style={{ animation: "tape 72s linear infinite" }}>
        {[0, 1].map((dup) => (
          <div className="flex" key={dup} aria-hidden={dup === 1}>
            {items.map((q) => {
              const up = q.changePct >= 0;
              return (
                <span
                  key={dup + q.symbol}
                  className="flex items-baseline gap-2 border-r border-rule-soft px-4"
                >
                  <span className="text-[11px] font-medium text-ink-3">{q.symbol}</span>
                  <span className="t-num text-[12px] text-ink-2">
                    {fmtPrice(q.symbol, q.last)}
                  </span>
                  <span className={`t-num text-[11px] ${up ? "text-bull-hi" : "text-bear-hi"}`}>
                    {up ? "+" : ""}
                    {q.changePct.toFixed(2)}%
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </footer>
  );
}