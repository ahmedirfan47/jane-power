export type AssetGroup = "Forex" | "Metals" | "Indices" | "Crypto" | "Commodities";

export interface SymbolMeta {
  symbol: string;
  name: string;
  group: AssetGroup;
  base: number;
  decimals: number;
  vol: number; // per-tick fractional step magnitude
}

export const SYMBOLS: SymbolMeta[] = [
  { symbol: "EURUSD", name: "Euro / US Dollar", group: "Forex", base: 1.0842, decimals: 4, vol: 0.0006 },
  { symbol: "GBPUSD", name: "Pound / US Dollar", group: "Forex", base: 1.2718, decimals: 4, vol: 0.0006 },
  { symbol: "USDJPY", name: "US Dollar / Yen", group: "Forex", base: 156.32, decimals: 2, vol: 0.0006 },
  { symbol: "AUDUSD", name: "Aussie / US Dollar", group: "Forex", base: 0.6621, decimals: 4, vol: 0.0007 },
  { symbol: "USDCAD", name: "US Dollar / Loonie", group: "Forex", base: 1.3662, decimals: 4, vol: 0.0005 },

  { symbol: "XAUUSD", name: "Gold / US Dollar", group: "Metals", base: 2684.5, decimals: 2, vol: 0.0008 },
  { symbol: "XAGUSD", name: "Silver / US Dollar", group: "Metals", base: 31.24, decimals: 3, vol: 0.0013 },

  { symbol: "NAS100", name: "Nasdaq 100", group: "Indices", base: 20452, decimals: 1, vol: 0.0008 },
  { symbol: "SPX500", name: "S&P 500", group: "Indices", base: 5921, decimals: 1, vol: 0.0006 },
  { symbol: "US30", name: "Dow Jones 30", group: "Indices", base: 43860, decimals: 1, vol: 0.0006 },
  { symbol: "GER40", name: "DAX 40", group: "Indices", base: 20108, decimals: 1, vol: 0.0008 },
  { symbol: "JP225", name: "Nikkei 225", group: "Indices", base: 39210, decimals: 1, vol: 0.0009 },

  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", group: "Crypto", base: 96480, decimals: 1, vol: 0.0022 },
  { symbol: "ETHUSD", name: "Ethereum / US Dollar", group: "Crypto", base: 3352, decimals: 2, vol: 0.0026 },

  { symbol: "WTIUSD", name: "Crude Oil WTI", group: "Commodities", base: 71.42, decimals: 2, vol: 0.0018 },
  { symbol: "NGAS", name: "Natural Gas", group: "Commodities", base: 3.148, decimals: 3, vol: 0.003 },
];

export const GROUP_ORDER: AssetGroup[] = ["Metals", "Forex", "Indices", "Crypto", "Commodities"];

export const META: Record<string, SymbolMeta> = Object.fromEntries(
  SYMBOLS.map((s) => [s.symbol, s]),
);

export const ALL_SYMBOLS = SYMBOLS.map((s) => s.symbol);

export const SYMBOLS_BY_GROUP: Record<AssetGroup, SymbolMeta[]> = GROUP_ORDER.reduce(
  (acc, g) => {
    acc[g] = SYMBOLS.filter((s) => s.group === g);
    return acc;
  },
  {} as Record<AssetGroup, SymbolMeta[]>,
);

export function fmtPrice(symbol: string, value: number): string {
  const d = META[symbol]?.decimals ?? 2;
  return value.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}