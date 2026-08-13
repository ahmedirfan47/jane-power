"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import type { ChartPanelConfig, ChartType, Timeframe } from "@jane-power/shared";
import { TIMEFRAMES } from "@jane-power/shared";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketStore } from "@/stores/market";
import { Dropdown } from "@/components/ui/dropdown";
import { ChartCanvas } from "./chart-canvas";
import { SYMBOLS_BY_GROUP, GROUP_ORDER, fmtPrice, META } from "@/lib/market/symbols";

const CHART_TYPES: { k: ChartType; label: string }[] = [
  { k: "candles", label: "Candles" },
  { k: "heikin", label: "Heikin Ashi" },
  { k: "line", label: "Line" },
  { k: "area", label: "Area" },
];

function SourceBadge({ symbol }: { symbol: string }) {
  const m = META[symbol];
  const label = m?.mt5 ? "MT5" : m?.binance ? "BINANCE" : "SIM";
  const live = !!(m?.mt5 || m?.binance);
  return (
    <span
      className={`rounded px-1 py-0.5 font-mono text-[8px] font-bold tracking-wider ${
        live ? "bg-bull/15 text-bull-hi" : "bg-surface-2 text-mute-2"
      }`}
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
      className={`flex h-full flex-col overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow] ${
        focused
          ? "border-gold/55 shadow-[0_0_0_1px_rgba(224,164,60,0.25),0_10px_34px_rgba(0,0,0,0.45)]"
          : active
            ? "border-hair"
            : "border-hair-soft"
      }`}
    >
      <div
        className="flex h-8 items-center justify-between gap-2 border-b border-hair-soft bg-surface-2 pl-1 pr-1.5"
        onDoubleClick={() => toggleFocus(chart.id)}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
          <Dropdown trigger={<span className="font-semibold tracking-wide">{chart.symbol}</span>}>
            {(close) =>
              GROUP_ORDER.map((g) => (
                <div key={g}>
                  <div className="px-2 pb-1 pt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-mute-2">
                    {g}
                  </div>
                  {SYMBOLS_BY_GROUP[g].map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        updateChart(chart.id, { symbol: s.symbol });
                        close();
                      }}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11.5px] transition-colors hover:bg-gold/10 hover:text-gold-hi"
                    >
                      <span>{s.symbol}</span>
                      {(s.mt5 || s.binance) && <span className="size-1 rounded-full bg-bull-hi" />}
                    </button>
                  ))}
                </div>
              ))
            }
          </Dropdown>

          <SourceBadge symbol={chart.symbol} />

          {quote && (
            <span className={`tnum text-[11px] ${up ? "text-bull-hi" : "text-bear-hi"}`}>
              {fmtPrice(chart.symbol, quote.last)}{" "}
              <span className="text-[9.5px]">
                {up ? "+" : ""}
                {quote.changePct.toFixed(2)}%
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <div className="mr-0.5 flex rounded-md border border-hair bg-bg p-0.5">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => updateChart(chart.id, { timeframe: t as Timeframe })}
                className={`tnum rounded px-1.5 py-0.5 text-[9.5px] font-semibold transition-colors ${
                  chart.timeframe === t ? "bg-gold/15 text-gold-hi" : "text-mute-2 hover:text-mute"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Dropdown
            width={140}
            align="right"
            trigger={
              <span className="text-[10.5px] text-mute">
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
                  className="flex w-full rounded-md px-2 py-1.5 text-left text-[11.5px] transition-colors hover:bg-gold/10 hover:text-gold-hi"
                >
                  {c.label}
                </button>
              ))
            }
          </Dropdown>

          <button
            onClick={() => toggleFocus(chart.id)}
            title="Focus"
            className={`flex size-6 items-center justify-center rounded-md transition-colors ${
              focused ? "bg-gold/15 text-gold-hi" : "text-mute-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {focused ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <ChartCanvas symbol={chart.symbol} tf={chart.timeframe} type={chart.chartType} />
      </div>
    </div>
  );
}