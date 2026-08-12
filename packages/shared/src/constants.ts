export const APP_NAME = "jane-power";
export const APP_DESCRIPTION =
  "Real-time market intelligence terminal — charts, macro calendar, and live news.";
export const APP_VERSION = "0.1.0";

/** Access-control roles, ordered from most to least privileged. */
export const ROLES = ["admin", "analyst", "pro", "viewer"] as const;

export const ASSET_CLASSES = [
  "forex",
  "metals",
  "indices",
  "crypto",
  "commodities",
  "stocks",
] as const;

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

/** Symbols seeded into a new user's default watchlist. */
export const DEFAULT_WATCHLIST = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "BTCUSD",
  "ETHUSD",
  "NAS100",
  "SPX500",
  "US30",
] as const;

/** WebSocket heartbeat interval (ms) — shared by client and gateway. */
export const WS_HEARTBEAT_MS = 15_000;

/** Max symbols a single socket connection may subscribe to. */
export const WS_MAX_SUBSCRIPTIONS = 200;