"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Star } from "lucide-react";
import { useMarketStore, type Quote } from "@/stores/market";
import { useWorkspaceStore } from "@/stores/workspace";
import { SYMBOLS_BY_GROUP, GROUP_ORDER, fmtPrice } from "@/lib/market/symbols";

const MIN_W = 168;
const DEFAULT_W = 240;
const STORAGE_KEY = "jp-rail";

function Spark({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <svg width={52} height={16} />;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const rng = hi - lo || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 52},${15 - ((v - lo) / rng) * 13}`)
    .join(" ");
  return (
    <svg width={52} height={16}>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "var(--c-bull-hi)" : "var(--c-bear-hi)"}
        strokeWidth={1.1}
        opacity={0.85}
      />
    </svg>
  );
}

function PriceCell({ symbol, value }: { symbol: string; value: number }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"" | "up" | "down">("");
  useEffect(() => {
    if (value > prev.current) setFlash("up");
    else if (value < prev.current) setFlash("down");
    prev.current = value;
    const t = setTimeout(() => setFlash(""), 440);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span
      className={`tnum rounded px-1 text-[11px] ${
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
  const f = filter.trim().toUpperCase();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWidth(Number(raw) || DEFAULT_W);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      // ignore
    }
  }, [width]);

  const clamp = useCallback(
    (w: number) => Math.min(Math.max(MIN_W, w), Math.max(MIN_W, window.innerWidth * 0.4)),
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
      className="relative flex shrink-0 flex-col border-r border-hair bg-bg max-lg:hidden"
      style={{ width, transition: dragging ? "none" : "width 180ms ease" }}
    >
      <div className="border-b border-hair-soft p-2.5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
          Watchlist
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-hair bg-void px-2 py-1.5 text-mute focus-within:border-gold/50">
          <Search size={12} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter symbols"
            className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-mute-2"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {GROUP_ORDER.map((g) => {
          const items = SYMBOLS_BY_GROUP[g].filter((s) => !f || s.symbol.includes(f));
          if (!items.length) return null;
          return (
            <div key={g} className="mb-1">
              <div className="px-1.5 pb-1 pt-2 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-mute-2">
                {g}
              </div>
              {items.map((s) => {
                const q: Quote | undefined = quotes[s.symbol];
                if (!q) return null;
                const up = q.changePct >= 0;
                return (
                  <button
                    key={s.symbol}
                    onClick={() => loadSymbolIntoActive(s.symbol)}
                    title={`Load ${s.symbol} into active chart`}
                    className="group grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Star size={10} className="text-mute-2 group-hover:text-gold" />
                      <span className="text-[11.5px] font-semibold">{s.symbol}</span>
                    </span>
                    <Spark data={q.spark} up={up} />
                    <span className="flex min-w-[62px] flex-col items-end">
                      <PriceCell symbol={s.symbol} value={q.last} />
                      <span
                        className={`tnum text-[9.5px] font-semibold ${
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

      <div className="border-t border-hair-soft px-2.5 py-2 text-[9.5px] text-mute-2">
        Tap a symbol to load the active chart
      </div>

      {/* drag handle on the right edge */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize watchlist"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none ${
          dragging ? "bg-gold/50" : "bg-transparent hover:bg-gold/25"
        }`}
        style={{ marginRight: -3 }}
      />
    </aside>
  );
}