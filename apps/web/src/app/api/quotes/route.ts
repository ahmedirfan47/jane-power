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

const REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_MAP).map(([app, td]) => [td, app]),
);

interface TdQuote {
  close?: string;
  percent_change?: string;
  high?: string;
  low?: string;
}

export interface ProviderQuote {
  symbol: string;
  price: number;
  changePct: number;
  high: number;
  low: number;
}

/**
 * Upstream refresh interval. The provider's free tier allows 800 calls/day
 * (~one per 108s for 24h coverage). Lower this for fresher data at the cost
 * of running out of quota later in the day.
 *   30_000  → ~2,880/day  (fresh, dies after ~7h)
 *   60_000  → ~1,440/day  (dies after ~13h)
 *   110_000 → ~785/day    (safe for 24h)
 */
const TTL_MS = 30_000;

let cache: { at: number; quotes: ProviderQuote[] } = { at: 0, quotes: [] };
let inFlight: Promise<ProviderQuote[]> | null = null;
let quotaExhausted = false;
let quotaResetAt = 0;

async function fetchUpstream(key: string): Promise<ProviderQuote[]> {
  const symbols = Object.values(SYMBOL_MAP).join(",");
  const res = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${key}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`upstream ${res.status}`);

  const json: unknown = await res.json();
  if (typeof json !== "object" || json === null) {
    throw new Error("unexpected provider response");
  }

  const asError = json as { code?: unknown; message?: unknown };
  if (typeof asError.code === "number") {
    const detail = typeof asError.message === "string" ? asError.message : "provider error";
    // 429 means the daily allowance is spent — back off until tomorrow
    if (asError.code === 429) {
      quotaExhausted = true;
      quotaResetAt = Date.now() + 60 * 60 * 1000;
    }
    throw new Error(detail);
  }

  const quotes: ProviderQuote[] = [];
  for (const [tdSymbol, q] of Object.entries(json as Record<string, TdQuote>)) {
    const app = REVERSE[tdSymbol];
    const price = parseFloat(q?.close ?? "");
    if (!app || !isFinite(price)) continue;
    quotes.push({
      symbol: app,
      price,
      changePct: parseFloat(q?.percent_change ?? "0") || 0,
      high: parseFloat(q?.high ?? "") || price,
      low: parseFloat(q?.low ?? "") || price,
    });
  }
  return quotes;
}

export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "quotes"), 180, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { quotes: cache.quotes, error: "rate_limited", ageMs: Date.now() - cache.at },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) {
    return NextResponse.json(
      { quotes: [], error: "no_key" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (quotaExhausted && Date.now() > quotaResetAt) quotaExhausted = false;

  const age = Date.now() - cache.at;
  const fresh = age < TTL_MS && cache.quotes.length > 0;

  if (fresh || (quotaExhausted && cache.quotes.length)) {
    return NextResponse.json(
      {
        quotes: cache.quotes,
        cached: true,
        ageMs: age,
        stale: quotaExhausted,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    inFlight ??= fetchUpstream(key).finally(() => {
      inFlight = null;
    });
    const quotes = await inFlight;
    if (quotes.length) cache = { at: Date.now(), quotes };
    return NextResponse.json(
      { quotes, cached: false, ageMs: 0, stale: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        quotes: cache.quotes,
        error: "fetch_failed",
        stale: true,
        ageMs: Date.now() - cache.at,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}