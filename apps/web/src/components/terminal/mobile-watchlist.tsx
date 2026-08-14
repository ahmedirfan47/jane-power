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

  const hasMatches = GROUP_ORDER.some((g) =>
    SYMBOLS_BY_GROUP[g].some((s) => !f || s.symbol.includes(f)),
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open watchlist"
        className="flex size-12 items-center justify-center text-ink-3 active:bg-raised"
      >
        <List size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex bg-black/70" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-[86%] max-w-sm flex-col border-r border-rule bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 shrink-0 items-center border-b border-rule">
              <div className="flex flex-1 items-center gap-2 px-4 text-ink-4">
                <Search size={14} />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter instruments"
                  className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4"
                />
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-12 shrink-0 items-center justify-center border-l border-rule text-ink-3 active:bg-raised"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {GROUP_ORDER.map((g) => {
                const items = SYMBOLS_BY_GROUP[g].filter((s) => !f || s.symbol.includes(f));
                if (!items.length) return null;
                return (
                  <div key={g}>
                    <div className="t-label sticky top-0 z-10 border-b border-rule-soft bg-raised px-4 py-2 text-[10px]">
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
                          className="flex h-14 w-full items-center border-b border-rule-soft px-4 text-left active:bg-raised"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-[14px] font-medium text-ink-2">{s.symbol}</span>
                            {(s.binance || s.provider) && (
                              <span className="size-1 rounded-full bg-bull-hi" aria-hidden />
                            )}
                          </span>
                          <span className="ml-auto flex items-baseline gap-3">
                            <span className="t-num text-[14px] text-ink">
                              {fmtPrice(s.symbol, q.last)}
                            </span>
                            <span
                              className={`t-num w-16 text-right text-[12px] ${
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
              {!hasMatches && (
                <p className="px-4 py-8 text-[13px] text-ink-4">
                  No instruments match “{filter}”.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}