export type AssetGroup = "Forex" | "Metals" | "Indices" | "Crypto" | "Commodities";

export interface SymbolMeta {
  symbol: string;
  name: string;
  group: AssetGroup;
  base: number;
  decimals: number;
  vol: number;
  binance?: string; // fed by real Binance data
  mt5?: boolean; // fed by the local MetaTrader 5 bridge
}

export const SYMBOLS: SymbolMeta[] = [
  { symbol: "EURUSD", name: "Euro / US Dollar", group: "Forex", base: 1.0842, decimals: 5, vol: 0.0006, mt5: true },
  { symbol: "GBPUSD", name: "Pound / US Dollar", group: "Forex", base: 1.2718, decimals: 5, vol: 0.0006, mt5: true },
  { symbol: "USDJPY", name: "US Dollar / Yen", group: "Forex", base: 156.32, decimals: 3, vol: 0.0006, mt5: true },
  { symbol: "AUDUSD", name: "Aussie / US Dollar", group: "Forex", base: 0.6621, decimals: 5, vol: 0.0007, mt5: true },
  { symbol: "USDCAD", name: "US Dollar / Loonie", group: "Forex", base: 1.3662, decimals: 5, vol: 0.0005, mt5: true },

  { symbol: "XAUUSD", name: "Gold / US Dollar", group: "Metals", base: 2684.5, decimals: 2, vol: 0.0008, mt5: true },
  { symbol: "XAGUSD", name: "Silver / US Dollar", group: "Metals", base: 31.24, decimals: 3, vol: 0.0013, mt5: true },

  { symbol: "NAS100", name: "US Tech 100", group: "Indices", base: 20452, decimals: 1, vol: 0.0008, mt5: true },
  { symbol: "SPX500", name: "US SPX 500", group: "Indices", base: 5921, decimals: 1, vol: 0.0006, mt5: true },
  { symbol: "US30", name: "US Wall Street 30", group: "Indices", base: 43860, decimals: 1, vol: 0.0006, mt5: true },
  { symbol: "GER40", name: "DAX 40", group: "Indices", base: 20108, decimals: 1, vol: 0.0008 },
  { symbol: "JP225", name: "Nikkei 225", group: "Indices", base: 39210, decimals: 1, vol: 0.0009 },

  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", group: "Crypto", base: 96480, decimals: 1, vol: 0.0022, binance: "btcusdt" },
  { symbol: "ETHUSD", name: "Ethereum / US Dollar", group: "Crypto", base: 3352, decimals: 2, vol: 0.0026, binance: "ethusdt" },
  { symbol: "SOLUSD", name: "Solana / US Dollar", group: "Crypto", base: 205, decimals: 2, vol: 0.003, binance: "solusdt" },
  { symbol: "XRPUSD", name: "XRP / US Dollar", group: "Crypto", base: 2.35, decimals: 4, vol: 0.003, binance: "xrpusdt" },
  { symbol: "BNBUSD", name: "BNB / US Dollar", group: "Crypto", base: 680, decimals: 2, vol: 0.0025, binance: "bnbusdt" },
  { symbol: "DOGEUSD", name: "Dogecoin / US Dollar", group: "Crypto", base: 0.32, decimals: 5, vol: 0.004, binance: "dogeusdt" },

  { symbol: "WTIUSD", name: "Crude Oil WTI", group: "Commodities", base: 71.42, decimals: 2, vol: 0.0018 },
  { symbol: "NGAS", name: "Natural Gas", group: "Commodities", base: 3.148, decimals: 3, vol: 0.003 },
];

export const GROUP_ORDER: AssetGroup[] = ["Metals", "Forex", "Indices", "Crypto", "Commodities"];

export const META: Record<string, SymbolMeta> = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s]));

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

/** True when a live feed drives this symbol (Binance or MT5). */
export function isLiveSymbol(symbol: string): boolean {
  const m = META[symbol];
  return !!(m?.binance || m?.mt5);
}