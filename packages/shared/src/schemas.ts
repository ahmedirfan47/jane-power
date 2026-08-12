import { z } from "zod";

export const RoleSchema = z.enum(["admin", "analyst", "pro", "viewer"]);

export const AssetClassSchema = z.enum([
  "forex",
  "metals",
  "indices",
  "crypto",
  "commodities",
  "stocks",
]);

export const TimeframeSchema = z.enum(["1m", "5m", "15m", "1h", "4h", "1d"]);

/** A single OHLCV candle. `t` is a unix ms timestamp. */
export const CandleSchema = z.object({
  t: z.number().int(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number().nonnegative().optional(),
});

/** Reference metadata for a tradable instrument. */
export const InstrumentSchema = z.object({
  symbol: z.string().min(1).max(20),
  name: z.string(),
  assetClass: AssetClassSchema,
  decimals: z.number().int().min(0).max(8),
  providerSymbol: z.string().optional(),
});

/** A live quote snapshot for a symbol. */
export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePct: z.number(),
  high: z.number().optional(),
  low: z.number().optional(),
  ts: z.number().int(),
});