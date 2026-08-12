import { create } from "zustand";
import type { ChartPanelConfig, ChartType, Timeframe } from "@jane-power/shared";

export type LayoutCount = 1 | 2 | 4 | 6 | 8;

const DEFAULTS = ["XAUUSD", "EURUSD", "BTCUSD", "NAS100", "GBPUSD", "US30", "ETHUSD", "USDJPY"];

function makeChart(i: number): ChartPanelConfig {
  return {
    id: `chart-${i}`,
    symbol: DEFAULTS[i % DEFAULTS.length]!,
    timeframe: (i % 2 ? "15m" : "1h") as Timeframe,
    chartType: (i === 2 ? "heikin" : "candles") as ChartType,
    indicators: [],
  };
}

interface WorkspaceState {
  layout: LayoutCount;
  charts: ChartPanelConfig[];
  focusedIds: string[];
  activeId: string;
  setLayout: (n: LayoutCount) => void;
  updateChart: (id: string, patch: Partial<ChartPanelConfig>) => void;
  toggleFocus: (id: string) => void;
  clearFocus: () => void;
  setActive: (id: string) => void;
  loadSymbolIntoActive: (symbol: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  layout: 4,
  charts: [0, 1, 2, 3].map(makeChart),
  focusedIds: [],
  activeId: "chart-0",

  setLayout: (n) =>
    set((state) => {
      const charts = [...state.charts];
      if (charts.length < n) {
        for (let i = charts.length; i < n; i++) charts.push(makeChart(i));
      } else {
        charts.length = n;
      }
      const ids = new Set(charts.map((c) => c.id));
      return {
        layout: n,
        charts,
        focusedIds: state.focusedIds.filter((id) => ids.has(id)),
        activeId: ids.has(state.activeId) ? state.activeId : charts[0]!.id,
      };
    }),

  updateChart: (id, patch) =>
    set((state) => ({
      charts: state.charts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  toggleFocus: (id) =>
    set((state) => {
      const f = state.focusedIds;
      const next = f.includes(id)
        ? f.filter((x) => x !== id)
        : f.length >= 3
          ? [...f.slice(1), id]
          : [...f, id];
      return { focusedIds: next };
    }),

  clearFocus: () => set({ focusedIds: [] }),
  setActive: (id) => set({ activeId: id }),
  loadSymbolIntoActive: (symbol) =>
    set((state) => ({
      charts: state.charts.map((c) => (c.id === state.activeId ? { ...c, symbol } : c)),
    })),
}));