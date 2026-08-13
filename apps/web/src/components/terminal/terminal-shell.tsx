"use client";

import type { ChartPanelConfig } from "@jane-power/shared";
import { useWorkspaceStore } from "@/stores/workspace";
import { useIsMobile } from "@/hooks/use-media-query";
import { MarketEngine } from "./market-engine";
import { CryptoFeed } from "./crypto-feed";
import { ProviderFeed } from "./provider-feed";
import { Mt5Feed } from "./mt5-feed";
import { CommandBar } from "./command-bar";
import { CommandPalette } from "./command-palette";
import { Watchlist } from "./watchlist";
import { TickerTape } from "./ticker-tape";
import { ChartPanel } from "./chart-panel";
import { BottomDock } from "./bottom-dock";
import { DemoBanner } from "./demo-banner";
import { MobileBar } from "./mobile-bar";
import { MobileControls } from "./mobile-controls";
import { MobileDock } from "./mobile-dock";

function useCellSize(chart: ChartPanelConfig) {
  const { charts, focusedIds } = useWorkspaceStore();
  const count = charts.length;
  const f = focusedIds.length;
  const isF = focusedIds.includes(chart.id);

  if (f === 0) {
    const eq: Record<number, { basis: string; height: string }> = {
      1: { basis: "100%", height: "100%" },
      2: { basis: "50%", height: "100%" },
      4: { basis: "50%", height: "50%" },
      6: { basis: "33.333%", height: "50%" },
      8: { basis: "25%", height: "50%" },
    };
    return { ...(eq[count] ?? { basis: "50%", height: "50%" }), order: 0 };
  }

  const u = count - f;
  if (isF) {
    const basis = f === 1 ? "100%" : f === 2 ? "50%" : "33.333%";
    return { basis, height: u > 0 ? "66%" : "100%", order: 0 };
  }
  const ub = u === 1 ? "100%" : u === 2 ? "50%" : u <= 3 ? "33.333%" : u <= 4 ? "25%" : "20%";
  return { basis: ub, height: "34%", order: 1 };
}

function Cell({ chart }: { chart: ChartPanelConfig }) {
  const size = useCellSize(chart);
  return (
    <div
      className="min-h-0 min-w-0 p-1 transition-[flex-basis,height] duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ flexBasis: size.basis, height: size.height, order: size.order }}
    >
      <ChartPanel chart={chart} />
    </div>
  );
}

function ChartGrid() {
  const charts = useWorkspaceStore((s) => s.charts);
  return (
    <main className="min-w-0 flex-1 p-1">
      <div className="flex h-full flex-wrap content-stretch">
        {charts.map((c) => (
          <Cell key={c.id} chart={c} />
        ))}
      </div>
    </main>
  );
}

/** One chart at a time — the only readable option on a phone. */
function MobileChart() {
  const { charts, activeId } = useWorkspaceStore();
  const chart = charts.find((c) => c.id === activeId) ?? charts[0];
  if (!chart) return null;
  return (
    <main className="min-h-0 flex-1 p-1">
      <ChartPanel chart={chart} />
    </main>
  );
}

export function TerminalShell({
  email,
  role,
  isGuest,
}: {
  email: string;
  role: string;
  isGuest: boolean;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <MarketEngine />
      <CryptoFeed />
      <ProviderFeed />
      <Mt5Feed />

      {isMobile ? (
        <>
          <MobileBar isGuest={isGuest} />
          <MobileChart />
          <MobileControls />
          <MobileDock />
        </>
      ) : (
        <>
          <CommandBar email={email} role={role} isGuest={isGuest} />
          <DemoBanner />
          <div className="flex min-h-0 flex-1">
            <Watchlist />
            <ChartGrid />
          </div>
          <BottomDock />
          <TickerTape />
          <CommandPalette />
        </>
      )}
    </div>
  );
}