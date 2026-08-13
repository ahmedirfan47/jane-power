import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "XAU/USD",
  XAGUSD: "XAG/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  AUDUSD: "AUD/USD",
  USDCAD: "USD/CAD",
};

const INTERVAL_MAP: Record<string, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

interface TdBar {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
}

/** Cache per symbol+interval so repeat views don't burn credits. */
const cache = new Map<string, { at: number; candles: unknown[] }>();
const TTL_MS = 300_000; // 5 min

export async function GET(request: Request) {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) {
    return NextResponse.json({ candles: [], error: "no_key" });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const tf = searchParams.get("tf") ?? "1h";

  const tdSymbol = SYMBOL_MAP[symbol];
  const interval = INTERVAL_MAP[tf];
  if (!tdSymbol || !interval) {
    return NextResponse.json({ candles: [], error: "unsupported" });
  }

  const cacheKey = `${symbol}:${tf}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ candles: hit.candles, cached: true });
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${interval}&outputsize=200&apikey=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json({ candles: hit?.candles ?? [], error: "upstream" });
    }

    const json = (await res.json()) as { values?: TdBar[]; code?: number; message?: string };
    if (json.code || !json.values) {
      return NextResponse.json({
        candles: hit?.candles ?? [],
        error: "provider",
        message: json.message ?? "",
      });
    }

    // Twelve Data returns newest-first; charts need oldest-first
    const candles = json.values
      .map((b) => ({
        t: new Date(`${b.datetime}Z`).getTime(),
        o: parseFloat(b.open ?? "0"),
        h: parseFloat(b.high ?? "0"),
        l: parseFloat(b.low ?? "0"),
        c: parseFloat(b.close ?? "0"),
        v: 0,
      }))
      .filter((b) => isFinite(b.t) && isFinite(b.c))
      .reverse();

    cache.set(cacheKey, { at: Date.now(), candles });
    return NextResponse.json({ candles });
  } catch {
    return NextResponse.json({ candles: hit?.candles ?? [], error: "fetch_failed" });
  }
}