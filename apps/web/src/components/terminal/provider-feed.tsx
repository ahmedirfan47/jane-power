"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMarketStore } from "@/stores/market";
import { useFeedStore } from "@/stores/feed";

interface ProviderQuote {
  symbol: string;
  price: number;
  changePct: number;
}

const POLL_MS = 20_000;

export function ProviderFeed() {
  const applyLive = useMarketStore((s) => s.applyLive);
  const setProvider = useFeedStore((s) => s.setProvider);
  const aliveRef = useRef(true);

  const load = useCallback(() => {
    // cache-bust so no CDN or browser layer serves a stale copy
    fetch(`/api/quotes?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { quotes?: ProviderQuote[]; error?: string }) => {
        if (!aliveRef.current) return;
        if (d.error === "no_key" || !d.quotes?.length) {
          setProvider("offline");
          return;
        }
        for (const q of d.quotes) {
          applyLive(q.symbol, { last: q.price, changePct: q.changePct });
        }
        setProvider("live");
      })
      .catch(() => {
        if (aliveRef.current) setProvider("offline");
      });
  }, [applyLive, setProvider]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, POLL_MS);

    // mobile browsers suspend timers in background tabs — refresh on return
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      aliveRef.current = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [load]);

  return null;
}