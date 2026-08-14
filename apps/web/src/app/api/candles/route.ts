import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

/**
 * Cache per timeframe. Short intervals need frequent refreshes; long ones
 * barely change. These are historical bars only — the current price always
 * comes from the live quote, so this never decides what "now" costs.
 */
const TTL_BY_TF: Record<string, number> = {
  "1m": 30_000,
  "5m": 60_000,
  "15m": 120_000,
  "1h": 300_000,
  "4h": 600_000,
  "1d": 900_000,
};

interface TdBar {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
}

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/**
 * Twelve Data returns "YYYY-MM-DD HH:mm:ss" for intraday and "YYYY-MM-DD"
 * for daily, both without a timezone. Parse explicitly as UTC rather than
 * relying on Date's inconsistent handling of these two shapes.
 */
function parseDatetime(raw?: string): number {
  if (!raw) return NaN;
  const s = raw.trim();

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    return Date.UTC(+dateOnly[1]!, +dateOnly[2]! - 1, +dateOnly[3]!);
  }

  const full = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (full) {
    return Date.UTC(
      +full[1]!,
      +full[2]! - 1,
      +full[3]!,
      +full[4]!,
      +full[5]!,
      full[6] ? +full[6] : 0,
    );
  }

  const fallback = Date.parse(s);
  return isFinite(fallback) ? fallback : NaN;
}

const cache = new Map<string, { at: number; candles: Candle[] }>();

export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "candles"), 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { candles: [], error: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
    );
  }

  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) {
    return NextResponse.json(
      { candles: [], error: "no_key" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const tf = searchParams.get("tf") ?? "1h";

  const tdSymbol = SYMBOL_MAP[symbol];
  const interval = INTERVAL_MAP[tf];
  if (!tdSymbol || !interval) {
    return NextResponse.json(
      { candles: [], error: "unsupported" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const cacheKey = `${symbol}:${tf}`;
  const ttl = TTL_BY_TF[tf] ?? 300_000;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < ttl) {
    return NextResponse.json(
      { candles: hit.candles, cached: true, ageMs: Date.now() - hit.at },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
        tdSymbol,
      )}&interval=${interval}&outputsize=300&timezone=UTC&apikey=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { candles: hit?.candles ?? [], error: "upstream", status: res.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const json = (await res.json()) as {
      values?: TdBar[];
      code?: number;
      message?: string;
    };

    if (typeof json.code === "number" || !json.values) {
      return NextResponse.json(
        {
          candles: hit?.candles ?? [],
          error: "provider",
          message: typeof json.message === "string" ? json.message : "",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    // upstream returns newest-first; charts need oldest-first
    const candles: Candle[] = json.values
      .map((b) => ({
        t: parseDatetime(b.datetime),
        o: parseFloat(b.open ?? ""),
        h: parseFloat(b.high ?? ""),
        l: parseFloat(b.low ?? ""),
        c: parseFloat(b.close ?? ""),
        v: 0,
      }))
      .filter(
        (b) =>
          isFinite(b.t) && isFinite(b.o) && isFinite(b.h) && isFinite(b.l) && isFinite(b.c),
      )
      .sort((a, b) => a.t - b.t);

    if (candles.length) cache.set(cacheKey, { at: Date.now(), candles });

    return NextResponse.json(
      { candles, cached: false, ageMs: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { candles: hit?.candles ?? [], error: "fetch_failed" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}