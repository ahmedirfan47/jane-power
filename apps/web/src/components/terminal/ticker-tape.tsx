"use client";

import { useMarketStore } from "@/stores/market";
import { ALL_SYMBOLS, fmtPrice } from "@/lib/market/symbols";

export function TickerTape() {
  const quotes = useMarketStore((s) => s.quotes);
  const items = ALL_SYMBOLS.map((s) => quotes[s]!).filter(Boolean);

  return (
    <footer className="flex h-7 shrink-0 items-center overflow-hidden border-t border-hair bg-surface">
      <div className="flex whitespace-nowrap" style={{ animation: "tape 64s linear infinite" }}>
        {[0, 1].map((dup) => (
          <div className="flex" key={dup} aria-hidden={dup === 1}>
            {items.map((q) => {
              const up = q.changePct >= 0;
              return (
                <span key={dup + q.symbol} className="flex items-center gap-2 border-r border-hair-soft px-4">
                  <span className="text-[10.5px] font-semibold text-mute">{q.symbol}</span>
                  <span className="tnum text-[10.5px]">{fmtPrice(q.symbol, q.last)}</span>
                  <span className={`tnum text-[10px] font-semibold ${up ? "text-bull-hi" : "text-bear-hi"}`}>
                    {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
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