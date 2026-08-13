import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** app symbol -> Twelve Data symbol */
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
  symbol?: string;
  close?: string;
  percent_change?: string;
  high?: string;
  low?: string;
  status?: string;
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

/** Server-side cache — one upstream fetch serves every visitor. */
let cache: { at: number; quotes: ProviderQuote[] } = { at: 0, quotes: [] };
const TTL_MS = 90_000; // 90s → ~960 calls/day, inside the 800-credit batch allowance

export async function GET() {
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
      { quotes: cache.quotes, cached: true, ageMs: age },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const symbols = Object.values(SYMBOL_MAP).join(",");
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { quotes: cache.quotes, error: "upstream", status: res.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const json = (await res.json()) as Record<string, TdQuote> | TdQuote;

    // rate limited / errored responses come back as a single object with a code
    if ("code" in json && json.code) {
      return NextResponse.json(
        { quotes: cache.quotes, error: "provider", message: json.message ?? "" },
        { headers: { "Cache-Control": "no-store" } },
      );
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

    if (quotes.length) cache = { at: Date.now(), quotes };

    return NextResponse.json(
      { quotes, cached: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { quotes: cache.quotes, error: "fetch_failed" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}