"use client";

import { useState } from "react";
import { List, X, Search } from "lucide-react";
import { useMarketStore } from "@/stores/market";
import { useWorkspaceStore } from "@/stores/workspace";
import { SYMBOLS_BY_GROUP, GROUP_ORDER, fmtPrice } from "@/lib/market/symbols";

export function MobileWatchlist() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const quotes = useMarketStore((s) => s.quotes);
  const loadSymbolIntoActive = useWorkspaceStore((s) => s.loadSymbolIntoActive);
  const f = filter.trim().toUpperCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open watchlist"
        className="flex size-9 items-center justify-center rounded-lg border border-hair text-mute active:bg-surface-2"
      >
        <List size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-[82%] max-w-xs flex-col border-r border-hair bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-hair-soft p-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-hair bg-void px-3 py-2 text-mute">
                <Search size={14} />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-mute"
                />
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-lg text-mute active:bg-surface-2"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {GROUP_ORDER.map((g) => {
                const items = SYMBOLS_BY_GROUP[g].filter((s) => !f || s.symbol.includes(f));
                if (!items.length) return null;
                return (
                  <div key={g} className="mb-2">
                    <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
                      {g}
                    </div>
                    {items.map((s) => {
                      const q = quotes[s.symbol];
                      if (!q) return null;
                      const up = q.changePct >= 0;
                      return (
                        <button
                          key={s.symbol}
                          onClick={() => {
                            loadSymbolIntoActive(s.symbol);
                            setOpen(false);
                          }}
                          className="flex h-12 w-full items-center justify-between rounded-lg px-2 text-left active:bg-surface"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{s.symbol}</span>
                            {(s.binance || s.provider) && (
                              <span className="size-1.5 rounded-full bg-bull-hi" aria-hidden />
                            )}
                          </span>
                          <span className="flex flex-col items-end">
                            <span className="tnum text-[12px]">{fmtPrice(s.symbol, q.last)}</span>
                            <span
                              className={`tnum text-[10px] font-semibold ${
                                up ? "text-bull-hi" : "text-bear-hi"
                              }`}
                            >
                              {up ? "+" : ""}
                              {q.changePct.toFixed(2)}%
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}