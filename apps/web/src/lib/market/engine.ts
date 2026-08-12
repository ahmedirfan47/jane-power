import type { Candle } from "@jane-power/shared";
import { META } from "./symbols";

/* ── seeded RNG ──────────────────────────────────────────── */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function gauss(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const TF_INDEX: Record<string, number> = { "1m": 0, "5m": 1, "15m": 2, "1h": 3, "4h": 4, "1d": 5 };

/** Deterministic historical candles for a symbol+timeframe, ending near `endPrice`. */
export function generateSeries(symbol: string, tf: string, endPrice?: number): Candle[] {
  const m = META[symbol];
  if (!m) return [];
  const rand = mulberry32(hashStr(symbol) ^ ((TF_INDEX[tf] ?? 0) * 2654435761));
  const n = 120;
  const vol = m.vol * (2 + (TF_INDEX[tf] ?? 0) * 1.4);
  let price = (endPrice ?? m.base) * (1 - (rand() - 0.5) * vol * 8);
  const now = Date.now();
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const o = price;
    const move = gauss(rand) * vol + (rand() - 0.5) * vol * 0.3;
    const c = o * (1 + move);
    const wick = vol * (0.4 + rand() * 0.9);
    const h = Math.max(o, c) * (1 + wick * rand());
    const l = Math.min(o, c) * (1 - wick * rand());
    const v = (Math.abs(c - o) / o + wick * 0.5) * (0.6 + rand());
    out.push({ t: now - (n - i) * 60000, o, h, l, c, v });
    price = c;
  }
  return out;
}

/** Heikin-Ashi transform. */
export function toHeikin(src: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < src.length; i++) {
    const s = src[i]!;
    const c = (s.o + s.h + s.l + s.c) / 4;
    const o = i === 0 ? (s.o + s.c) / 2 : (out[i - 1]!.o + out[i - 1]!.c) / 2;
    out.push({ t: s.t, o, h: Math.max(s.h, o, c), l: Math.min(s.l, o, c), c, v: s.v });
  }
  return out;
}

/** Active trading sessions + killzone flag from a UTC hour. */
export function sessionInfo(utcHour: number): { active: string[]; killzone: boolean } {
  const active: string[] = [];
  if (utcHour >= 21 || utcHour < 6) active.push("SYD");
  if (utcHour >= 0 && utcHour < 9) active.push("TYO");
  if (utcHour >= 7 && utcHour < 16) active.push("LDN");
  if (utcHour >= 12 && utcHour < 21) active.push("NY");
  const killzone = (utcHour >= 7 && utcHour < 10) || (utcHour >= 12 && utcHour < 15);
  return { active, killzone };
}