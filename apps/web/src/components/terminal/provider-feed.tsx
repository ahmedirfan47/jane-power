"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/stores/market";
import { useFeedStore } from "@/stores/feed";

interface ProviderQuote {
  symbol: string;
  price: number;
  changePct: number;
}

const POLL_MS = 90_000;

export function ProviderFeed() {
  const applyLive = useMarketStore((s) => s.applyLive);
  const setProvider = useFeedStore((s) => s.setProvider);

  useEffect(() => {
    let alive = true;

    const load = () => {
      fetch("/api/quotes")
        .then((r) => r.json())
        .then((d: { quotes?: ProviderQuote[]; error?: string }) => {
          if (!alive) return;
          if (d.error === "no_key" || !d.quotes?.length) {
            setProvider("offline");
            return;
          }
          for (const q of d.quotes) {
            applyLive(q.symbol, { last: q.price, changePct: q.changePct });
          }
          setProvider("live");
        })
        .catch(() => alive && setProvider("offline"));
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [applyLive, setProvider]);

  return null;
}