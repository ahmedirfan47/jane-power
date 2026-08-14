import { create } from "zustand";

export type FeedStatus = "connecting" | "live" | "offline";

interface FeedState {
  mt5: FeedStatus;
  crypto: FeedStatus;
  provider: FeedStatus;
  /** ms since the provider data was fetched upstream */
  providerAgeMs: number;
  /** true while a provider refresh is in flight */
  providerRefreshing: boolean;
  /** true when serving cached data because the daily quota ran out */
  providerStale: boolean;
  setMt5: (s: FeedStatus) => void;
  setCrypto: (s: FeedStatus) => void;
  setProvider: (s: FeedStatus) => void;
  setProviderMeta: (m: { ageMs?: number; refreshing?: boolean; stale?: boolean }) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  mt5: "connecting",
  crypto: "connecting",
  provider: "connecting",
  providerAgeMs: 0,
  providerRefreshing: false,
  providerStale: false,
  setMt5: (s) => set({ mt5: s }),
  setCrypto: (s) => set({ crypto: s }),
  setProvider: (s) => set({ provider: s }),
  setProviderMeta: (m) =>
    set((prev) => ({
      providerAgeMs: m.ageMs ?? prev.providerAgeMs,
      providerRefreshing: m.refreshing ?? prev.providerRefreshing,
      providerStale: m.stale ?? prev.providerStale,
    })),
}));