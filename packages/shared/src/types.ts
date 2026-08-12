import type { z } from "zod";
import type {
  RoleSchema,
  AssetClassSchema,
  TimeframeSchema,
  CandleSchema,
  InstrumentSchema,
  QuoteSchema,
} from "./schemas";

export type Role = z.infer<typeof RoleSchema>;
export type AssetClass = z.infer<typeof AssetClassSchema>;
export type Timeframe = z.infer<typeof TimeframeSchema>;
export type Candle = z.infer<typeof CandleSchema>;
export type Instrument = z.infer<typeof InstrumentSchema>;
export type Quote = z.infer<typeof QuoteSchema>;

/** Chart render styles supported by the terminal. */
export type ChartType = "candles" | "heikin" | "line" | "area";

/** A single panel within a workspace layout. */
export interface ChartPanelConfig {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  indicators: string[];
}

/** A saved workspace layout (persisted as JSON in Phase 6). */
export interface WorkspaceLayout {
  name: string;
  panelCount: 1 | 2 | 4 | 6 | 8;
  panels: ChartPanelConfig[];
  focusedPanelIds: string[];
}