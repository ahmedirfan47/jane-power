import { create } from "zustand";
import { ALL_SYMBOLS, META, isLiveSymbol } from "@/lib/market/symbols";
import { gauss, hashStr, mulberry32 } from "@/lib/market/engine";

export interface Quote {
  symbol: string;
  last: number;
  open: number;
  change: number;
  changePct: number;
  spark: number[];
  dir: -1 | 0 | 1;
  /** true once a real feed has delivered a price for this symbol */
  live: boolean;
}

function buildInitialQuotes(): Record<string, Quote> {
  const q: Record<string, Quote> = {};
  for (const symbol of ALL_SYMBOLS) {
    const m = META[symbol]!;
    const rand = mulberry32(hashStr(symbol));
    const open = m.base;
    const last = m.base * (1 + (rand() - 0.5) * m.vol * 6);
    const spark = Array.from({ length: 32 }, (_, i) =>
      m.base * (1 + (mulberry32(hashStr(symbol) + i)() - 0.5) * m.vol * 3),
    );
    q[symbol] = {
      symbol,
      open,
      last,
      change: last - open,
      changePct: ((last - open) / open) * 100,
      spark,
      dir: 0,
      live: false,
    };
  }
  return q;
}

interface MarketState {
  quotes: Record<string, Quote>;
  tick: () => void;
  applyLive: (symbol: string, data: { last: number; changePct: number }) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  quotes: buildInitialQuotes(),

  tick: () =>
    set((state) => {
      const quotes = { ...state.quotes };
      for (const symbol of ALL_SYMBOLS) {
        // never fake a symbol that has a real feed attached
        if (isLiveSymbol(symbol)) continue;
        const prev = quotes[symbol]!;
        const m = META[symbol]!;
        const step = gauss(Math.random) * m.base * m.vol * 0.5;
        const last = Math.max(m.base * 0.3, prev.last + step);
        quotes[symbol] = {
          ...prev,
          last,
          change: last - prev.open,
          changePct: ((last - prev.open) / prev.open) * 100,
          dir: step > 0 ? 1 : step < 0 ? -1 : 0,
          spark: [...prev.spark.slice(-31), last],
        };
      }
      return { quotes };
    }),

  applyLive: (symbol, data) =>
    set((state) => {
      const prev = state.quotes[symbol];
      if (!prev) return {};
      const dir = data.last > prev.last ? 1 : data.last < prev.last ? -1 : 0;
      return {
        quotes: {
          ...state.quotes,
          [symbol]: {
            ...prev,
            last: data.last,
            changePct: data.changePct,
            change: data.last - prev.open,
            dir,
            spark: [...prev.spark.slice(-31), data.last],
            live: true,
          },
        },
      };
    }),
}));