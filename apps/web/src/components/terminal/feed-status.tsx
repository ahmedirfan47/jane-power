"use client";

import { useFeedStore, type FeedStatus } from "@/stores/feed";

const COLORS: Record<FeedStatus, string> = {
  live: "bg-bull-hi",
  connecting: "bg-gold",
  offline: "bg-mute-2",
};

const LABELS: Record<FeedStatus, string> = {
  live: "live",
  connecting: "connecting",
  offline: "offline",
};

function Pill({ name, status }: { name: string; status: FeedStatus }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-md border border-hair bg-surface-2 px-1.5 py-0.5"
      title={`${name}: ${LABELS[status]}`}
    >
      <span className={`size-1.5 rounded-full ${COLORS[status]}`} aria-hidden />
      <span className="font-mono text-[9px] font-semibold tracking-wide text-mute">{name}</span>
    </span>
  );
}

export function FeedStatusBar() {
  const { mt5, crypto } = useFeedStore();
  return (
    <div className="flex items-center gap-1.5">
      <Pill name="MT5" status={mt5} />
      <Pill name="CRYPTO" status={crypto} />
    </div>
  );
}