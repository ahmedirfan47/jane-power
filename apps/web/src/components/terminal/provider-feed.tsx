"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMarketStore } from "@/stores/market";
import { useFeedStore } from "@/stores/feed";

interface ProviderQuote {
  symbol: string;
  price: number;
  changePct: number;
}

/** Client poll interval — keep at or above the server TTL. */
const POLL_MS = 30_000;

export function ProviderFeed() {
  const applyLive = useMarketStore((s) => s.applyLive);
  const setProvider = useFeedStore((s) => s.setProvider);
  const setProviderMeta = useFeedStore((s) => s.setProviderMeta);
  const aliveRef = useRef(true);
  const busyRef = useRef(false);

  const load = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setProviderMeta({ refreshing: true });

    fetch(`/api/quotes?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { quotes?: ProviderQuote[]; error?: string; ageMs?: number; stale?: boolean }) => {
        if (!aliveRef.current) return;
        if (d.error === "no_key" || !d.quotes?.length) {
          setProvider("offline");
          return;
        }
        for (const q of d.quotes) {
          applyLive(q.symbol, { last: q.price, changePct: q.changePct });
        }
        setProvider("live");
        setProviderMeta({ ageMs: d.ageMs ?? 0, stale: !!d.stale });
      })
      .catch(() => {
        if (aliveRef.current) setProvider("offline");
      })
      .finally(() => {
        busyRef.current = false;
        if (aliveRef.current) setProviderMeta({ refreshing: false });
      });
  }, [applyLive, setProvider, setProviderMeta]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, POLL_MS);

    // age ticks up between fetches so the UI shows real freshness
    const ageId = setInterval(() => {
      const s = useFeedStore.getState();
      if (!s.providerRefreshing) {
        useFeedStore.setState({ providerAgeMs: s.providerAgeMs + 1000 });
      }
    }, 1000);

    // mobile suspends timers in background tabs — refresh on return
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      aliveRef.current = false;
      clearInterval(id);
      clearInterval(ageId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [load]);

  return null;
}