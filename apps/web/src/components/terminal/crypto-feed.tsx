"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);

  const connect = useCallback(() => {
    if (closedRef.current) return;

    const existing = wsRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setCrypto("connecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(binanceStreamUrl());
    } catch {
      setCrypto("offline");
      if (!closedRef.current) retryRef.current = setTimeout(connect, 4000);
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => setCrypto("live");

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { data?: TickerData };
        const d = msg.data;
        if (!d || d.e !== "24hrTicker" || !d.s) return;
        const sym = BINANCE_TO_SYMBOL[d.s];
        if (!sym) return;
        const price = parseFloat(d.c ?? "");
        if (!isFinite(price)) return;
        applyLive(sym, { last: price, changePct: parseFloat(d.P ?? "0") || 0 });
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setCrypto("offline");
      if (!closedRef.current) {
        retryRef.current = setTimeout(connect, 2500);
      }
    };

    ws.onerror = () => ws.close();
  }, [applyLive, setCrypto]);

  useEffect(() => {
    closedRef.current = false;
    connect();

    // mobile suspends sockets in background tabs — reconnect when we come back
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        connect();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      closedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return null;
}