"use client";

import { useFeedStore, type FeedStatus } from "@/stores/feed";

function dot(status: FeedStatus): string {
  if (status === "live") return "bg-bull-hi";
  if (status === "connecting") return "bg-gold";
  return "bg-ink-4";
}

function Pill({ name, status }: { name: string; status: FeedStatus }) {
  return (
    <span className="flex items-center gap-1.5" title={`${name}: ${status}`}>
      <span className={`size-1.5 ${dot(status)}`} aria-hidden />
      <span className="t-label text-[10px]">{name}</span>
    </span>
  );
}

export function FeedStatusBar() {
  const { mt5, crypto, provider } = useFeedStore();
  return (
    <div className="flex items-center gap-4">
      <Pill name="FX" status={provider === "live" ? "live" : mt5} />
      <Pill name="Crypto" status={crypto} />
    </div>
  );
}