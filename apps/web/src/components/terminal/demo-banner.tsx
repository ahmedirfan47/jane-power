"use client";

import { useFeedStore } from "@/stores/feed";

export function DemoBanner() {
  const mt5 = useFeedStore((s) => s.mt5);
  if (mt5 === "live") return null;

  return (
    <div className="flex shrink-0 items-center justify-center gap-2 border-b border-gold/20 bg-gold/[0.07] px-3 py-1">
      <span className="size-1.5 rounded-full bg-gold" aria-hidden />
      <span className="text-[10.5px] text-ink-dim">
        Crypto prices are live. Forex, metals and indices are{" "}
        <span className="font-semibold text-gold-hi">simulated</span> in this demo.
      </span>
    </div>
  );
}