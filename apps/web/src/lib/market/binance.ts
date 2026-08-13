import type { Candle } from "@jane-power/shared";
import { SYMBOLS } from "./symbols";

export const SYMBOL_TO_BINANCE: Record<string, string> = {};
export const BINANCE_TO_SYMBOL: Record<string, string> = {};
for (const s of SYMBOLS) {
  if (s.binance) {
    SYMBOL_TO_BINANCE[s.symbol] = s.binance;
    BINANCE_TO_SYMBOL[s.binance.toUpperCase()] = s.symbol;
  }
}

const LIVE_STREAMS = Object.values(SYMBOL_TO_BINANCE);

/** Combined 24h ticker stream for every live symbol. */
export function binanceStreamUrl(): string {
  const streams = LIVE_STREAMS.map((b) => `${b}@ticker`).join("/");
  return `wss://stream.binance.com:9443/stream?streams=${streams}`;
}

/** Real historical candles from Binance REST (public, no key). */
export async function fetchKlines(binanceSymbol: string, interval: string, limit = 200): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`klines ${res.status}`);
  const rows = (await res.json()) as unknown[][];
  return rows.map((r) => ({
    t: Number(r[0]),
    o: Number(r[1]),
    h: Number(r[2]),
    l: Number(r[3]),
    c: Number(r[4]),
    v: Number(r[5]),
  }));
}