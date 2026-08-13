import type { Candle } from "@jane-power/shared";

export async function fetchProviderCandles(symbol: string, tf: string): Promise<Candle[]> {
  const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}`);
  if (!res.ok) throw new Error(`candles ${res.status}`);
  const json = (await res.json()) as { candles?: Candle[] };
  return json.candles ?? [];
}