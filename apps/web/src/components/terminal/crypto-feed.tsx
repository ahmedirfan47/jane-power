"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/stores/market";
import { useFeedStore } from "@/stores/feed";
import { binanceStreamUrl, BINANCE_TO_SYMBOL } from "@/lib/market/binance";

interface TickerData {
  e?: string;
  s?: string;
  c?: string;
  P?: string;
}

export function CryptoFeed() {
  const applyLive = useMarketStore((s) => s.applyLive);
  const setCrypto = useFeedStore((s) => s.setCrypto);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      setCrypto("connecting");
      ws = new WebSocket(binanceStreamUrl());
      ws.onopen = () => setCrypto("live");
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as { data?: TickerData };
          const d = msg.data;
          if (!d || d.e !== "24hrTicker" || !d.s) return;
          const sym = BINANCE_TO_SYMBOL[d.s];
          if (!sym) return;
          applyLive(sym, { last: parseFloat(d.c ?? "0"), changePct: parseFloat(d.P ?? "0") });
        } catch {
          // ignore malformed frames
        }
      };
      ws.onclose = () => {
        setCrypto("offline");
        if (!closed) retry = setTimeout(connect, 2500);
      };
      ws.onerror = () => ws?.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, [applyLive, setCrypto]);

  return null;
}