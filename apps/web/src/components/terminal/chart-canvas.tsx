"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, ChartType } from "@jane-power/shared";
import { useMarketStore } from "@/stores/market";
import { useThemeStore } from "@/stores/theme";
import { generateSeries, toHeikin } from "@/lib/market/engine";
import { META } from "@/lib/market/symbols";
import { SYMBOL_TO_BINANCE, fetchKlines } from "@/lib/market/binance";
import { fetchMt5Candles } from "@/lib/market/mt5";
import { fetchProviderCandles } from "@/lib/market/provider";
import { ChartSkeleton } from "./chart-skeleton";

function palette() {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    text: v("--chart-text", "#82858a"),
    grid: v("--chart-grid", "#161719"),
    rule: v("--chart-rule", "#232428"),
    bull: v("--c-bull", "#2e9e6b"),
    bear: v("--c-bear", "#cf4a45"),
    gold: v("--c-gold", "#c8963e"),
  };
}

function volumeTint(hex: string): string {
  return `${hex}40`;
}

const sec = (t: number) => Math.floor(t / 1000) as UTCTimestamp;

const TF_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
};

export function ChartCanvas({ symbol, tf, type }: { symbol: string; tf: string; type: ChartType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rawRef = useRef<Candle[]>([]);
  const kindRef = useRef<"candle" | "value">("candle");
  const countRef = useRef(0);
  const realRef = useRef(false);
  const requestRef = useRef(0);

  const [loading, setLoading] = useState(true);

  const quote = useMarketStore((s) => s.quotes[symbol]);
  const theme = useThemeStore((s) => s.theme);
  const last = quote?.last;
  const quoteIsLive = quote?.live ?? false;

  // create the chart once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const C = palette();

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: C.text,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: C.grid },
        horzLines: { color: C.grid },
      },
      rightPriceScale: {
        borderColor: C.rule,
        scaleMargins: { top: 0.1, bottom: 0.24 },
      },
      timeScale: {
        borderColor: C.rule,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: C.text,
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: C.gold,
        },
        horzLine: {
          color: C.text,
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: C.gold,
        },
      },
    });

    chartRef.current = chart;
    chart.resize(el.clientWidth, el.clientHeight);

    const ro = new ResizeObserver(() => {
      const c = containerRef.current;
      if (c) chart.resize(c.clientWidth, c.clientHeight);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      priceRef.current = null;
      volRef.current = null;
    };
  }, []);

  // re-theme without rebuilding data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const C = palette();

    chart.applyOptions({
      layout: { textColor: C.text },
      grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      rightPriceScale: { borderColor: C.rule },
      timeScale: { borderColor: C.rule },
      crosshair: {
        vertLine: { color: C.text, labelBackgroundColor: C.gold },
        horzLine: { color: C.text, labelBackgroundColor: C.gold },
      },
    });

    const p = priceRef.current;
    if (p) {
      if (kindRef.current === "candle") {
        (p as ISeriesApi<"Candlestick">).applyOptions({
          upColor: C.bull,
          downColor: C.bear,
          wickUpColor: C.bull,
          wickDownColor: C.bear,
        });
      } else if (type === "line") {
        (p as ISeriesApi<"Line">).applyOptions({ color: C.gold });
      } else {
        (p as ISeriesApi<"Area">).applyOptions({
          lineColor: C.gold,
          topColor: `${C.gold}2E`,
          bottomColor: `${C.gold}00`,
        });
      }
    }
  }, [theme, type]);

  // build series + load history
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const requestId = ++requestRef.current;
    const isStale = () => requestId !== requestRef.current;

    setLoading(true);

    const C = palette();
    const volUp = volumeTint(C.bull);
    const volDown = volumeTint(C.bear);

    if (priceRef.current) {
      chart.removeSeries(priceRef.current);
      priceRef.current = null;
    }
    if (volRef.current) {
      chart.removeSeries(volRef.current);
      volRef.current = null;
    }

    const meta = META[symbol];
    const decimals = meta?.decimals ?? 2;
    const priceFormat = {
      type: "price" as const,
      precision: decimals,
      minMove: 1 / Math.pow(10, decimals),
    };

    if (type === "line" || type === "area") {
      kindRef.current = "value";
      priceRef.current =
        type === "line"
          ? chart.addSeries(LineSeries, {
              color: C.gold,
              lineWidth: 2,
              priceLineStyle: LineStyle.Dotted,
              priceFormat,
            })
          : chart.addSeries(AreaSeries, {
              lineColor: C.gold,
              topColor: `${C.gold}2E`,
              bottomColor: `${C.gold}00`,
              lineWidth: 2,
              priceLineStyle: LineStyle.Dotted,
              priceFormat,
            });
    } else {
      kindRef.current = "candle";
      priceRef.current = chart.addSeries(CandlestickSeries, {
        upColor: C.bull,
        downColor: C.bear,
        wickUpColor: C.bull,
        wickDownColor: C.bear,
        borderVisible: false,
        priceLineStyle: LineStyle.Dotted,
        priceFormat,
      });
    }

    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.86, bottom: 0 } });
    volRef.current = vol;

    const applyData = (incoming: Candle[], fit: boolean, real: boolean) => {
      const price = priceRef.current;
      const v = volRef.current;
      if (isStale() || !price || !v || !incoming.length) return;

      const seen = new Set<number>();
      const raw = incoming
        .filter((d) => isFinite(d.t) && isFinite(d.c))
        .sort((a, b) => a.t - b.t)
        .filter((d) => {
          const key = Math.floor(d.t / 1000);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      if (!raw.length) return;

      // Pin the newest bar to the live quote — but ONLY if a real feed has
      // actually delivered one. Before that, the store still holds a seeded
      // placeholder, and stamping it here is what made real charts show
      // simulated prices on first paint.
      const liveQuote = useMarketStore.getState().quotes[symbol];
      if (real && liveQuote?.live && isFinite(liveQuote.last)) {
        const tip = raw[raw.length - 1]!;
        tip.c = liveQuote.last;
        if (liveQuote.last > tip.h) tip.h = liveQuote.last;
        if (liveQuote.last < tip.l) tip.l = liveQuote.last;
      }

      rawRef.current = raw;
      realRef.current = real;
      countRef.current = 0;
      setLoading(false);

      if (kindRef.current === "value") {
        (price as ISeriesApi<"Line">).setData(raw.map((d) => ({ time: sec(d.t), value: d.c })));
      } else {
        const src = type === "heikin" ? toHeikin(raw) : raw;
        (price as ISeriesApi<"Candlestick">).setData(
          src.map((d) => ({ time: sec(d.t), open: d.o, high: d.h, low: d.l, close: d.c })),
        );
      }

      (v as ISeriesApi<"Histogram">).setData(
        raw.map((d) => ({
          time: sec(d.t),
          value: d.v ?? 0,
          color: d.c >= d.o ? volUp : volDown,
        })),
      );

      if (fit) chart.timeScale().fitContent();
    };

    const simulate = () =>
      applyData(
        generateSeries(symbol, tf, useMarketStore.getState().quotes[symbol]?.last),
        true,
        false,
      );

    const bmap = SYMBOL_TO_BINANCE[symbol];
    let refetch: ReturnType<typeof setInterval> | null = null;

    if (meta?.mt5) {
      fetchMt5Candles(symbol, tf)
        .then((raw) =>
          raw.length ? applyData(raw, true, true) : Promise.reject(new Error("empty")),
        )
        .catch(() =>
          meta?.provider
            ? fetchProviderCandles(symbol, tf)
                .then((raw) => (raw.length ? applyData(raw, true, true) : simulate()))
                .catch(simulate)
            : simulate(),
        );

      refetch = setInterval(() => {
        fetchMt5Candles(symbol, tf)
          .then((raw) => raw.length && applyData(raw, false, true))
          .catch(() => {
            if (meta?.provider) {
              fetchProviderCandles(symbol, tf)
                .then((raw) => raw.length && applyData(raw, false, true))
                .catch(() => {});
            }
          });
      }, 60_000);
    } else if (meta?.provider) {
      fetchProviderCandles(symbol, tf)
        .then((raw) => (raw.length ? applyData(raw, true, true) : simulate()))
        .catch(simulate);

      refetch = setInterval(() => {
        fetchProviderCandles(symbol, tf)
          .then((raw) => raw.length && applyData(raw, false, true))
          .catch(() => {});
      }, 120_000);
    } else if (bmap) {
      fetchKlines(bmap, tf)
        .then((raw) => (raw.length ? applyData(raw, true, true) : simulate()))
        .catch(simulate);

      refetch = setInterval(() => {
        fetchKlines(bmap, tf)
          .then((raw) => raw.length && applyData(raw, false, true))
          .catch(() => {});
      }, 60_000);
    } else {
      simulate();
    }

    return () => {
      if (refetch) clearInterval(refetch);
    };
  }, [symbol, tf, type, theme]);

  // live-update the forming bar
  useEffect(() => {
    const raw = rawRef.current;
    const price = priceRef.current;
    const vol = volRef.current;
    if (!raw.length || !price || !vol || last === undefined) return;

    // A real chart must not be driven by a placeholder quote. Wait for the feed.
    if (realRef.current && !quoteIsLive) return;

    const C = palette();
    const bar = raw[raw.length - 1]!;

    bar.c = last;
    if (last > bar.h) bar.h = last;
    if (last < bar.l) bar.l = last;

    if (!realRef.current) {
      countRef.current += 1;
      if (countRef.current >= 6) {
        countRef.current = 0;
        raw.push({
          t: bar.t + (TF_MS[tf] ?? 60_000),
          o: last,
          h: last,
          l: last,
          c: last,
          v: (bar.v ?? 1) * (0.4 + Math.random()),
        });
        if (raw.length > 260) raw.shift();
      }
    }

    const cur = raw[raw.length - 1]!;

    if (kindRef.current === "value") {
      (price as ISeriesApi<"Line">).update({ time: sec(cur.t), value: cur.c });
    } else if (type === "heikin") {
      (price as ISeriesApi<"Candlestick">).setData(
        toHeikin(raw).map((d) => ({ time: sec(d.t), open: d.o, high: d.h, low: d.l, close: d.c })),
      );
    } else {
      (price as ISeriesApi<"Candlestick">).update({
        time: sec(cur.t),
        open: cur.o,
        high: cur.h,
        low: cur.l,
        close: cur.c,
      });
    }

    (vol as ISeriesApi<"Histogram">).update({
      time: sec(cur.t),
      value: cur.v ?? 0,
      color: cur.c >= cur.o ? volumeTint(C.bull) : volumeTint(C.bear),
    });
  }, [last, type, symbol, tf, quoteIsLive]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {loading && <ChartSkeleton />}
    </>
  );
}