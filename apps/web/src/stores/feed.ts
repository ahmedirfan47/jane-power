import { create } from "zustand";

export type FeedStatus = "connecting" | "live" | "offline";

interface FeedState {
  mt5: FeedStatus;
  crypto: FeedStatus;
  provider: FeedStatus;
  setMt5: (s: FeedStatus) => void;
  setCrypto: (s: FeedStatus) => void;
  setProvider: (s: FeedStatus) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  mt5: "connecting",
  crypto: "connecting",
  provider: "connecting",
  setMt5: (s) => set({ mt5: s }),
  setCrypto: (s) => set({ crypto: s }),
  setProvider: (s) => set({ provider: s }),
}));