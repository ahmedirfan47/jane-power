"use client";

import { useFeedStore, type FeedStatus } from "@/stores/feed";

function dotClass(status: FeedStatus): string {
  if (status === "live") return "bg-bull-hi";
  if (status === "connecting") return "bg-gold";
  return "bg-ink-4";
}

function ageLabel(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export function FeedStatusBar() {
  const { mt5, crypto, provider, providerAgeMs, providerRefreshing, providerStale } =
    useFeedStore();

  const fxStatus: FeedStatus = provider === "live" ? "live" : mt5;

  return (
    <div className="flex items-center gap-4">
      <span
        className="flex items-center gap-1.5"
        title={
          providerStale
            ? "Daily data allowance used — showing last known prices"
            : `Forex data updated ${ageLabel(providerAgeMs)} ago`
        }
      >
        <span
          className={`size-1.5 ${
            providerStale ? "bg-gold" : dotClass(fxStatus)
          } ${providerRefreshing ? "animate-pulse" : ""}`}
          aria-hidden
        />
        <span className="t-label text-[10px]">FX</span>
        {fxStatus === "live" && (
          <span className="t-num text-[10px] text-ink-4">{ageLabel(providerAgeMs)}</span>
        )}
      </span>

      <span className="flex items-center gap-1.5" title={`Crypto feed: ${crypto}`}>
        <span className={`size-1.5 ${dotClass(crypto)}`} aria-hidden />
        <span className="t-label text-[10px]">Crypto</span>
      </span>
    </div>
  );
}