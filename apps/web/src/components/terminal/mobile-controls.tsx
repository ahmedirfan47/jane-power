"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ChartType, Timeframe } from "@jane-power/shared";
import { TIMEFRAMES } from "@jane-power/shared";
import { useWorkspaceStore } from "@/stores/workspace";
import { SYMBOLS_BY_GROUP, GROUP_ORDER } from "@/lib/market/symbols";

const CHART_TYPES: { k: ChartType; label: string }[] = [
  { k: "candles", label: "Candles" },
  { k: "heikin", label: "Heikin" },
  { k: "line", label: "Line" },
  { k: "area", label: "Area" },
];

export function MobileControls() {
  const { charts, activeId, setActive, updateChart } = useWorkspaceStore();
  const [sheet, setSheet] = useState<"none" | "symbol" | "type">("none");

  const index = Math.max(0, charts.findIndex((c) => c.id === activeId));
  const chart = charts[index];
  if (!chart) return null;

  const go = (dir: -1 | 1) => {
    const next = (index + dir + charts.length) % charts.length;
    setActive(charts[next]!.id);
  };

  return (
    <>
      {/* chart switcher + symbol */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-t border-hair bg-surface px-2">
        <button
          onClick={() => go(-1)}
          aria-label="Previous chart"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-mute active:bg-surface-2"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => setSheet("symbol")}
          className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 active:bg-surface-2"
        >
          <span className="truncate text-sm font-bold tracking-wide">{chart.symbol}</span>
          <span className="tnum text-[10px] text-mute">
            {index + 1}/{charts.length}
          </span>
        </button>

        <button
          onClick={() => go(1)}
          aria-label="Next chart"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-mute active:bg-surface-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* timeframes — always one tap away */}
      <div className="flex h-12 shrink-0 items-center gap-1 border-t border-hair bg-surface px-2">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => updateChart(chart.id, { timeframe: t as Timeframe })}
            aria-pressed={chart.timeframe === t}
            className={`tnum h-10 flex-1 rounded-lg text-[12px] font-bold transition-colors ${
              chart.timeframe === t
                ? "bg-gold text-void"
                : "bg-surface-2 text-mute active:bg-elevated"
            }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={() => setSheet("type")}
          aria-label="Chart type"
          className="h-10 shrink-0 rounded-lg bg-surface-2 px-3 text-[11px] font-semibold text-mute active:bg-elevated"
        >
          {CHART_TYPES.find((c) => c.k === chart.chartType)?.label}
        </button>
      </div>

      {/* bottom sheet */}
      {sheet !== "none" && (
        <div
          className="fixed inset-0 z-[90] flex items-end bg-black/60"
          onClick={() => setSheet("none")}
        >
          <div
            className="max-h-[70vh] w-full overflow-y-auto rounded-t-2xl border-t border-hair bg-elevated pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-hair-soft bg-elevated px-4 py-3">
              <span className="text-sm font-semibold">
                {sheet === "symbol" ? "Select symbol" : "Chart type"}
              </span>
              <button
                onClick={() => setSheet("none")}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-lg text-mute active:bg-surface-2"
              >
                <X size={16} />
              </button>
            </div>

            {sheet === "symbol" ? (
              <div className="px-2 pt-2">
                {GROUP_ORDER.map((g) => (
                  <div key={g} className="mb-1">
                    <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
                      {g}
                    </div>
                    {SYMBOLS_BY_GROUP[g].map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          updateChart(chart.id, { symbol: s.symbol });
                          setSheet("none");
                        }}
                        className={`flex h-12 w-full items-center justify-between rounded-lg px-3 text-left active:bg-surface-2 ${
                          s.symbol === chart.symbol ? "bg-gold/10" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{s.symbol}</span>
                          {(s.binance || s.provider) && (
                            <span className="size-1.5 rounded-full bg-bull-hi" aria-hidden />
                          )}
                        </span>
                        <span className="truncate pl-3 text-[11px] text-mute">{s.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2 pt-2">
                {CHART_TYPES.map((c) => (
                  <button
                    key={c.k}
                    onClick={() => {
                      updateChart(chart.id, { chartType: c.k });
                      setSheet("none");
                    }}
                    className={`flex h-12 w-full items-center rounded-lg px-3 text-left text-sm active:bg-surface-2 ${
                      c.k === chart.chartType ? "bg-gold/10 text-gold-hi" : ""
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}