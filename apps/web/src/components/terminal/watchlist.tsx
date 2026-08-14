"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useMarketStore, type Quote } from "@/stores/market";
import { useWorkspaceStore } from "@/stores/workspace";
import { SYMBOLS_BY_GROUP, GROUP_ORDER, fmtPrice, META } from "@/lib/market/symbols";

const MIN_W = 200;
const DEFAULT_W = 264;
const STORAGE_KEY = "jp-rail";

function PriceCell({ symbol, value }: { symbol: string; value: number }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"" | "up" | "down">("");
  useEffect(() => {
    if (value > prev.current) setFlash("up");
    else if (value < prev.current) setFlash("down");
    prev.current = value;
    const t = setTimeout(() => setFlash(""), 400);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span
      className={`t-num px-1 text-[13px] text-ink ${
        flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""
      }`}
    >
      {fmtPrice(symbol, value)}
    </span>
  );
}

export function Watchlist() {
  const quotes = useMarketStore((s) => s.quotes);
  const loadSymbolIntoActive = useWorkspaceStore((s) => s.loadSymbolIntoActive);
  const [filter, setFilter] = useState("");
  const [width, setWidth] = useState(DEFAULT_W);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const f = filter.trim().toUpperCase();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWidth(Number(raw) || DEFAULT_W);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, String(width));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [width]);

  const clamp = useCallback(
    (w: number) => Math.min(Math.max(MIN_W, w), Math.max(MIN_W, window.innerWidth * 0.35)),
    [],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startW.current = width;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setWidth(clamp(startW.current + (e.clientX - startX.current)));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  return (
    <aside
      className="relative flex shrink-0 flex-col border-r border-rule bg-bg max-lg:hidden"
      style={{ width, transition: dragging ? "none" : "width 160ms ease" }}
    >
      <div className="flex h-9 items-center gap-2 border-b border-rule px-3 text-ink-4">
        <Search size={12} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-4"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {GROUP_ORDER.map((g) => {
          const items = SYMBOLS_BY_GROUP[g].filter((s) => !f || s.symbol.includes(f));
          if (!items.length) return null;
          return (
            <div key={g}>
              <div className="t-label sticky top-0 z-10 border-b border-rule-soft bg-bg px-3 py-1.5 text-[10px]">
                {g}
              </div>
              {items.map((s) => {
                const q: Quote | undefined = quotes[s.symbol];
                if (!q) return null;
                const up = q.changePct >= 0;
                const live = !!(META[s.symbol]?.binance || META[s.symbol]?.provider);
                return (
                  <button
                    key={s.symbol}
                    onClick={() => loadSymbolIntoActive(s.symbol)}
                    title={`Load ${s.symbol}`}
                    className="flex w-full items-baseline gap-2 border-b border-rule-soft px-3 py-2 text-left transition-colors hover:bg-raised"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-ink-2">{s.symbol}</span>
                      {live && <span className="size-1 rounded-full bg-bull-hi" aria-hidden />}
                    </span>
                    <span className="ml-auto flex items-baseline gap-2">
                      <PriceCell symbol={s.symbol} value={q.last} />
                      <span
                        className={`t-num w-14 text-right text-[12px] ${
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
        {f && !GROUP_ORDER.some((g) => SYMBOLS_BY_GROUP[g].some((s) => s.symbol.includes(f))) && (
          <p className="px-3 py-6 text-[13px] text-ink-4">No symbols match “{filter}”.</p>
        )}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize watchlist"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none ${
          dragging ? "bg-gold" : "hover:bg-rule"
        }`}
        style={{ marginRight: -2 }}
      />
    </aside>
  );
}