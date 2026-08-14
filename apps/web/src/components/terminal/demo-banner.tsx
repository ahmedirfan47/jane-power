"use client";

import { useFeedStore } from "@/stores/feed";

export function DemoBanner() {
  const { mt5, provider } = useFeedStore();
  if (mt5 === "live" || provider === "live") return null;

  return (
    <div className="flex h-7 shrink-0 items-center justify-center gap-2 border-b border-rule bg-raised px-3">
      <span className="size-1.5 bg-gold" aria-hidden />
      <span className="text-[12px] text-ink-3">
        Crypto is live. Forex and metals are simulated until the feed connects.
      </span>
    </div>
  );
}