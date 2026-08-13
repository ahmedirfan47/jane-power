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
  code?: number;
  message?: string;
}

export interface ProviderQuote {
  symbol: string;
  price: number;
  changePct: number;
  high: number;
  low: number;
}

let cache: { at: number; quotes: ProviderQuote[] } = { at: 0, quotes: [] };
let inFlight: Promise<ProviderQuote[]> | null = null;
const TTL_MS = 90_000;

async function fetchUpstream(key: string): Promise<ProviderQuote[]> {
  const symbols = Object.values(SYMBOL_MAP).join(",");
  const res = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${key}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`upstream ${res.status}`);

  const json = (await res.json()) as Record<string, TdQuote> | TdQuote;
  if ("code" in json && json.code) throw new Error(json.message ?? "provider error");

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
  const limited = rateLimit(clientKey(request, "quotes"), 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { quotes: cache.quotes, error: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }

  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) {
    return NextResponse.json(
      { quotes: [], error: "no_key" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const age = Date.now() - cache.at;
  if (age < TTL_MS && cache.quotes.length) {
    return NextResponse.json(
      { quotes: cache.quotes, cached: true },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  }

  try {
    // collapse concurrent misses into a single upstream call
    inFlight ??= fetchUpstream(key).finally(() => {
      inFlight = null;
    });
    const quotes = await inFlight;
    if (quotes.length) cache = { at: Date.now(), quotes };
    return NextResponse.json(
      { quotes, cached: false },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json(
      { quotes: cache.quotes, error: "fetch_failed", stale: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}