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

function SourceBadge({ symbol }: { symbol: string }) {
  const m = META[symbol];
  const mt5Status = useFeedStore((s) => s.mt5);
  const cryptoStatus = useFeedStore((s) => s.crypto);
  const providerStatus = useFeedStore((s) => s.provider);

  let label = "SIM";
  let live = false;

  if (m?.binance && cryptoStatus === "live") {
    label = "BINANCE";
    live = true;
  } else if (m?.mt5 && mt5Status === "live") {
    label = "MT5";
    live = true;
  } else if (m?.provider && providerStatus === "live") {
    label = "LIVE";
    live = true;
  }

  return (
    <span
      className={`rounded px-1 py-0.5 font-mono text-[9px] font-bold tracking-wider ${
        live ? "bg-bull/15 text-bull-hi" : "bg-surface-2 text-mute"
      }`}
      title={live ? "Live market data" : "Simulated data — live feed unavailable"}
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
                  <div className="px-2 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mute">
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
                      {(s.binance || s.provider || s.mt5) && (
                        <span className="size-1 rounded-full bg-bull-hi" aria-hidden />
                      )}
                    </button>
                  ))}
                </div>
              ))
            }
          </Dropdown>

          <SourceBadge symbol={chart.symbol} />

          {quote && (
            <span
              className={`tnum text-[11px] ${up ? "text-bull-hi" : "text-bear-hi"}`}
              aria-live="off"
            >
              {fmtPrice(chart.symbol, quote.last)}{" "}
              <span className="text-[10px]">
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
                aria-pressed={chart.timeframe === t}
                className={`tnum rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                  chart.timeframe === t ? "bg-gold/15 text-gold-hi" : "text-mute hover:text-ink"
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
            title={focused ? "Exit focus" : "Focus chart"}
            aria-label={focused ? "Exit focus" : "Focus chart"}
            aria-pressed={focused}
            className={`flex size-6 items-center justify-center rounded-md transition-colors ${
              focused ? "bg-gold/15 text-gold-hi" : "text-mute hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {focused ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
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