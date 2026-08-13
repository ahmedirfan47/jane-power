"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/stores/market";
import { useFeedStore } from "@/stores/feed";

const BRIDGE_URL = process.env.NEXT_PUBLIC_MT5_BRIDGE_URL ?? "ws://127.0.0.1:8765";

interface BridgeTick {
  symbol: string;
  price: number;
  changePct: number;
}

export function Mt5Feed() {
  const applyLive = useMarketStore((s) => s.applyLive);
  const setMt5 = useFeedStore((s) => s.setMt5);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      setMt5("connecting");
      try {
        ws = new WebSocket(BRIDGE_URL);
      } catch {
        setMt5("offline");
        return;
      }

      ws.onopen = () => setMt5("live");

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as { type?: string; data?: BridgeTick[] };
          if (msg.type !== "ticks" || !msg.data) return;
          for (const t of msg.data) {
            applyLive(t.symbol, { last: t.price, changePct: t.changePct });
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setMt5("offline");
        if (!closed) retry = setTimeout(connect, 4000);
      };
      ws.onerror = () => ws?.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, [applyLive, setMt5]);

  return null;
}