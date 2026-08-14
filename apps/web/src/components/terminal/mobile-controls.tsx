"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ChartType, Timeframe } from "@jane-power/shared";
import { TIMEFRAMES } from "@jane-power/shared";
import { useWorkspaceStore } from "@/stores/workspace";
import { SYMBOLS_BY_GROUP, GROUP_ORDER } from "@/lib/market/symbols";

const CHART_TYPES: { k: ChartType; label: string }[] = [
  { k: "candles", label: "Candles" },
  { k: "heikin", label: "Heikin Ashi" },
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
      {/* timeframes — always one tap away */}
      <div className="grid shrink-0 grid-cols-6 gap-px border-t border-rule bg-rule">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => updateChart(chart.id, { timeframe: t as Timeframe })}
            aria-pressed={chart.timeframe === t}
            className={`t-num h-11 text-[13px] transition-colors ${
              chart.timeframe === t ? "bg-gold text-void" : "bg-surface text-ink-3 active:bg-raised"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* chart switcher + symbol + type */}
      <div className="flex h-12 shrink-0 items-stretch border-t border-rule bg-surface">
        <button
          onClick={() => go(-1)}
          aria-label="Previous chart"
          className="flex w-12 shrink-0 items-center justify-center border-r border-rule text-ink-3 active:bg-raised"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => setSheet("symbol")}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 active:bg-raised"
        >
          <span className="font-display text-[14px] font-semibold tracking-tight text-ink">
            {chart.symbol}
          </span>
          <span className="t-num text-[11px] text-ink-4">
            {index + 1}/{charts.length}
          </span>
        </button>

        <button
          onClick={() => go(1)}
          aria-label="Next chart"
          className="flex w-12 shrink-0 items-center justify-center border-x border-rule text-ink-3 active:bg-raised"
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={() => setSheet("type")}
          className="flex shrink-0 items-center px-4 text-[12px] text-ink-3 active:bg-raised"
        >
          {CHART_TYPES.find((c) => c.k === chart.chartType)?.label}
        </button>
      </div>

      {sheet !== "none" && (
        <div
          className="fixed inset-0 z-[90] flex items-end bg-black/70"
          onClick={() => setSheet("none")}
        >
          <div
            className="max-h-[72vh] w-full overflow-y-auto border-t border-rule bg-elevated pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-rule bg-elevated px-4 py-3">
              <span className="t-h2 text-ink">
                {sheet === "symbol" ? "Select instrument" : "Chart type"}
              </span>
              <button
                onClick={() => setSheet("none")}
                aria-label="Close"
                className="flex size-11 items-center justify-center text-ink-3 active:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {sheet === "symbol" ? (
              GROUP_ORDER.map((g) => (
                <div key={g}>
                  <div className="t-label border-b border-rule-soft bg-raised px-4 py-2 text-[10px]">
                    {g}
                  </div>
                  {SYMBOLS_BY_GROUP[g].map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        updateChart(chart.id, { symbol: s.symbol });
                        setSheet("none");
                      }}
                      className={`flex h-12 w-full items-center justify-between border-b border-rule-soft px-4 text-left active:bg-raised ${
                        s.symbol === chart.symbol ? "bg-raised" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-ink">{s.symbol}</span>
                        {(s.binance || s.provider) && (
                          <span className="size-1 rounded-full bg-bull-hi" aria-hidden />
                        )}
                      </span>
                      <span className="truncate pl-4 text-[12px] text-ink-4">{s.name}</span>
                    </button>
                  ))}
                </div>
              ))
            ) : (
              CHART_TYPES.map((c) => (
                <button
                  key={c.k}
                  onClick={() => {
                    updateChart(chart.id, { chartType: c.k });
                    setSheet("none");
                  }}
                  className={`flex h-12 w-full items-center border-b border-rule-soft px-4 text-left text-[14px] active:bg-raised ${
                    c.k === chart.chartType ? "bg-raised text-gold-hi" : "text-ink-2"
                  }`}
                >
                  {c.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}