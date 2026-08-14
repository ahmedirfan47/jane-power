"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import type { ChartPanelConfig, ChartType, Timeframe } from "@jane-power/shared";
import { TIMEFRAMES } from "@jane-power/shared";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketStore } from "@/stores/market";
import { useFeedStore } from "@/stores/feed";
import { Dropdown } from "@/components/ui/dropdown";
import { ErrorBoundary } from "@/components/error-boundary";
import { ChartCanvas } from "./chart-canvas";
import { SYMBOLS_BY_GROUP, GROUP_ORDER, fmtPrice, META } from "@/lib/market/symbols";

const CHART_TYPES: { k: ChartType; label: string }[] = [
  { k: "candles", label: "Candles" },
  { k: "heikin", label: "Heikin Ashi" },
  { k: "line", label: "Line" },
  { k: "area", label: "Area" },
];

function SourceTag({ symbol }: { symbol: string }) {
  const m = META[symbol];
  const mt5Status = useFeedStore((s) => s.mt5);
  const cryptoStatus = useFeedStore((s) => s.crypto);
  const providerStatus = useFeedStore((s) => s.provider);

  let label = "Simulated";
  let live = false;

  if (m?.binance && cryptoStatus === "live") {
    label = "Binance";
    live = true;
  } else if (m?.mt5 && mt5Status === "live") {
    label = "MT5";
    live = true;
  } else if (m?.provider && providerStatus === "live") {
    label = "Live";
    live = true;
  }

  return (
    <span
      className={`t-label text-[10px] ${live ? "text-bull-hi" : "text-ink-4"}`}
      title={live ? "Live market data" : "Simulated data"}
    >
      {label}
    </span>
  );
}

export function ChartPanel({ chart }: { chart: ChartPanelConfig }) {
  const { focusedIds, activeId, toggleFocus, setActive, updateChart } = useWorkspaceStore();
  const quote = useMarketStore((s) => s.quotes[chart.symbol]);
  const focused = focusedIds.includes(chart.id);
  const active = activeId === chart.id;
  const up = (quote?.changePct ?? 0) >= 0;

  return (
    <div
      onMouseDown={() => setActive(chart.id)}
      className={`flex h-full flex-col overflow-hidden border bg-surface transition-colors ${
        focused ? "border-gold" : active ? "border-ink-4" : "border-rule"
      }`}
    >
      <div
        className="flex h-9 items-center gap-3 border-b border-rule px-2"
        onDoubleClick={() => toggleFocus(chart.id)}
      >
        <Dropdown
          trigger={
            <span className="font-display text-[13px] font-semibold tracking-tight">
              {chart.symbol}
            </span>
          }
        >
          {(close) =>
            GROUP_ORDER.map((g) => (
              <div key={g}>
                <div className="t-label px-2 pb-1 pt-2 text-[10px]">{g}</div>
                {SYMBOLS_BY_GROUP[g].map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      updateChart(chart.id, { symbol: s.symbol });
                      close();
                    }}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[13px] text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                  >
                    <span>{s.symbol}</span>
                    {(s.binance || s.provider || s.mt5) && (
                      <span className="size-1 rounded-full bg-bull-hi" aria-hidden />
                    )}
                  </button>
                ))}
              </div>
            ))
          }
        </Dropdown>

        {quote && (
          <span className="flex items-baseline gap-2">
            <span className="t-num text-[14px] text-ink">{fmtPrice(chart.symbol, quote.last)}</span>
            <span className={`t-num text-[12px] ${up ? "text-bull-hi" : "text-bear-hi"}`}>
              {up ? "+" : ""}
              {quote.changePct.toFixed(2)}%
            </span>
          </span>
        )}

        <SourceTag symbol={chart.symbol} />

        <div className="ml-auto flex items-center">
          <div className="flex border-r border-rule pr-2">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => updateChart(chart.id, { timeframe: t as Timeframe })}
                aria-pressed={chart.timeframe === t}
                className={`t-num px-1.5 py-1 text-[11px] transition-colors ${
                  chart.timeframe === t ? "text-gold-hi" : "text-ink-4 hover:text-ink-2"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Dropdown
            width={150}
            align="right"
            trigger={
              <span className="text-[12px] text-ink-3">
                {CHART_TYPES.find((c) => c.k === chart.chartType)?.label}
              </span>
            }
          >
            {(close) =>
              CHART_TYPES.map((c) => (
                <button
                  key={c.k}
                  onClick={() => {
                    updateChart(chart.id, { chartType: c.k });
                    close();
                  }}
                  className="flex w-full px-2 py-1.5 text-left text-[13px] text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                >
                  {c.label}
                </button>
              ))
            }
          </Dropdown>

          <button
            onClick={() => toggleFocus(chart.id)}
            aria-label={focused ? "Exit focus" : "Focus chart"}
            aria-pressed={focused}
            className={`ml-1 flex size-7 items-center justify-center transition-colors ${
              focused ? "text-gold-hi" : "text-ink-4 hover:text-ink"
            }`}
          >
            {focused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <ErrorBoundary label="Chart">
          <ChartCanvas symbol={chart.symbol} tf={chart.timeframe} type={chart.chartType} />
        </ErrorBoundary>
      </div>
    </div>
  );
}