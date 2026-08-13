import type { Candle } from "@jane-power/shared";

const HISTORY_URL = process.env.NEXT_PUBLIC_MT5_HISTORY_URL ?? "http://127.0.0.1:8766";

/** Real OHLC history straight from the local MetaTrader 5 terminal. */
export async function fetchMt5Candles(symbol: string, tf: string, limit = 300): Promise<Candle[]> {
  const url = `${HISTORY_URL}/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mt5 candles ${res.status}`);
  const json = (await res.json()) as { candles?: Candle[] };
  return json.candles ?? [];
}