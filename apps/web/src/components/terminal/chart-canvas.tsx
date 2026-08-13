"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
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

function palette() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => s.getPropertyValue(n).trim() || f;
  return {
    text: v("--chart-text", "#737b89"),
    grid: v("--chart-grid", "#161b21"),
    border: v("--chart-border", "#212834"),
    bull: v("--c-bull", "#23b483"),
    bear: v("--c-bear", "#e2544f"),
    gold: v("--c-gold", "#e0a43c"),
  };
}

const sec = (t: number) => Math.floor(t / 1000) as UTCTimestamp;

export function ChartCanvas({ symbol, tf, type }: { symbol: string; tf: string; type: ChartType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rawRef = useRef<Candle[]>([]);
  const kindRef = useRef<"candle" | "value">("candle");
  const countRef = useRef(0);
  const realRef = useRef(false);

  const quote = useMarketStore((s) => s.quotes[symbol]);
  const theme = useThemeStore((s) => s.theme);
  const last = quote?.last;

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
        fontSize: 10,
        attributionLogo: false,
      },
      grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { borderColor: C.border, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: C.gold, width: 1, style: 2, labelBackgroundColor: C.gold },
        horzLine: { color: C.gold, width: 1, style: 2, labelBackgroundColor: C.gold },
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
      rightPriceScale: { borderColor: C.border },
      timeScale: { borderColor: C.border },
      crosshair: {
        vertLine: { color: C.gold, labelBackgroundColor: C.gold },
        horzLine: { color: C.gold, labelBackgroundColor: C.gold },
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
        (p as ISeriesApi<"Area">).applyOptions({ lineColor: C.gold });
      }
    }
  }, [theme, type]);

  // build series + load history
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let cancelled = false;
    const C = palette();
    const volUp = `${C.bull}73`;
    const volDown = `${C.bear}73`;

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
          ? chart.addSeries(LineSeries, { color: C.gold, lineWidth: 2, priceFormat })
          : chart.addSeries(AreaSeries, {
              lineColor: C.gold,
              topColor: `${C.gold}38`,
              bottomColor: `${C.gold}03`,
              lineWidth: 2,
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
        priceFormat,
      });
    }

    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
    volRef.current = vol;

    const applyData = (raw: Candle[], fit: boolean, real: boolean) => {
      const price = priceRef.current;
      const v = volRef.current;
      if (cancelled || !price || !v || !raw.length) return;
      rawRef.current = raw;
      realRef.current = real;
      countRef.current = 0;
      if (kindRef.current === "value") {
        (price as ISeriesApi<"Line">).setData(raw.map((d) => ({ time: sec(d.t), value: d.c })));
      } else {
        const src = type === "heikin" ? toHeikin(raw) : raw;
        (price as ISeriesApi<"Candlestick">).setData(
          src.map((d) => ({ time: sec(d.t), open: d.o, high: d.h, low: d.l, close: d.c })),
        );
      }
      (v as ISeriesApi<"Histogram">).setData(
        raw.map((d) => ({ time: sec(d.t), value: d.v ?? 0, color: d.c >= d.o ? volUp : volDown })),
      );
      if (fit) chart.timeScale().fitContent();
    };

    const simulate = () =>
      applyData(generateSeries(symbol, tf, useMarketStore.getState().quotes[symbol]?.last), true, false);

    const bmap = SYMBOL_TO_BINANCE[symbol];
    let refetch: ReturnType<typeof setInterval> | null = null;

    if (meta?.mt5) {
      // prefer local MT5, fall back to the provider, then simulation
      fetchMt5Candles(symbol, tf)
        .then((raw) => (raw.length ? applyData(raw, true, true) : Promise.reject(new Error("empty"))))
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
      }, 60000);
    } else if (meta?.provider) {
      fetchProviderCandles(symbol, tf)
        .then((raw) => (raw.length ? applyData(raw, true, true) : simulate()))
        .catch(simulate);
      refetch = setInterval(() => {
        fetchProviderCandles(symbol, tf)
          .then((raw) => raw.length && applyData(raw, false, true))
          .catch(() => {});
      }, 300000);
    } else if (bmap) {
      fetchKlines(bmap, tf)
        .then((raw) => (raw.length ? applyData(raw, true, true) : simulate()))
        .catch(simulate);
      refetch = setInterval(() => {
        fetchKlines(bmap, tf)
          .then((raw) => raw.length && applyData(raw, false, true))
          .catch(() => {});
      }, 60000);
    } else {
      simulate();
    }

    return () => {
      cancelled = true;
      if (refetch) clearInterval(refetch);
    };
  }, [symbol, tf, type, theme]);

  // live-update the forming bar
  useEffect(() => {
    const raw = rawRef.current;
    const price = priceRef.current;
    const vol = volRef.current;
    if (!raw.length || !price || !vol || last === undefined) return;
    const C = palette();

    const bar = raw[raw.length - 1]!;
    bar.c = last;
    bar.h = Math.max(bar.h, last);
    bar.l = Math.min(bar.l, last);

    if (!realRef.current) {
      countRef.current += 1;
      if (countRef.current >= 6) {
        countRef.current = 0;
        raw.push({
          t: bar.t + 60000,
          o: last,
          h: last,
          l: last,
          c: last,
          v: (bar.v ?? 1) * (0.4 + Math.random()),
        });
        if (raw.length > 220) raw.shift();
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
      color: cur.c >= cur.o ? `${C.bull}73` : `${C.bear}73`,
    });
  }, [last, type, symbol]);

  return <div ref={containerRef} className="absolute inset-0" />;
}