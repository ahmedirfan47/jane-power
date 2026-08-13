"use client";

import { useFeedStore, type FeedStatus } from "@/stores/feed";

const COLORS: Record<FeedStatus, string> = {
  live: "bg-bull-hi",
  connecting: "bg-gold",
  offline: "bg-mute-2",
};

function Pill({ name, status }: { name: string; status: FeedStatus }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-md border border-hair bg-surface-2 px-1.5 py-0.5"
      title={`${name}: ${status}`}
    >
      <span className={`size-1.5 rounded-full ${COLORS[status]}`} aria-hidden />
      <span className="font-mono text-[9px] font-semibold tracking-wide text-mute">{name}</span>
    </span>
  );
}

export function FeedStatusBar() {
  const { mt5, crypto, provider } = useFeedStore();
  return (
    <div className="flex items-center gap-1.5">
      <Pill name="FX" status={provider === "live" ? "live" : mt5} />
      <Pill name="CRYPTO" status={crypto} />
    </div>
  );
}