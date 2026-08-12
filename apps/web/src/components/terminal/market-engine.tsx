"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/stores/market";

export function MarketEngine() {
  const tick = useMarketStore((s) => s.tick);
  useEffect(() => {
    const id = setInterval(tick, 1100);
    return () => clearInterval(id);
  }, [tick]);
  return null;
}