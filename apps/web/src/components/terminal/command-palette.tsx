"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { useUiStore } from "@/stores/ui";
import { useWorkspaceStore, type LayoutCount } from "@/stores/workspace";
import { SYMBOLS } from "@/lib/market/symbols";

interface Action {
  id: string;
  label: string;
  sub: string;
  run: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPalette } = useUiStore();
  const { loadSymbolIntoActive, setLayout, clearFocus } = useWorkspaceStore();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(!useUiStore.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPalette]);

  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [paletteOpen]);

  const actions = useMemo<Action[]>(() => {
    const close = () => setPalette(false);
    const symbolActions: Action[] = SYMBOLS.map((s) => ({
      id: `sym-${s.symbol}`,
      label: s.symbol,
      sub: s.name,
      run: () => {
        loadSymbolIntoActive(s.symbol);
        close();
      },
    }));
    const layoutActions: Action[] = ([1, 2, 4, 6, 8] as LayoutCount[]).map((n) => ({
      id: `layout-${n}`,
      label: `Layout: ${n} ${n === 1 ? "chart" : "charts"}`,
      sub: "Workspace",
      run: () => {
        setLayout(n);
        clearFocus();
        close();
      },
    }));
    return [...symbolActions, ...layoutActions];
  }, [loadSymbolIntoActive, setLayout, clearFocus, setPalette]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q));
  }, [query, actions]);

  if (!paletteOpen) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[index]?.run();
    } else if (e.key === "Escape") {
      setPalette(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[12vh] backdrop-blur-sm"
      onMouseDown={() => setPalette(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-hair bg-elevated shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-hair-soft px-3.5 py-3">
          <Search size={15} className="text-mute" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search symbols or commands…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-mute-2"
          />
          <kbd className="rounded border border-hair bg-surface px-1.5 py-0.5 font-mono text-[9px] text-mute-2">ESC</kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-mute-2">No matches</div>
          ) : (
            results.slice(0, 50).map((a, i) => (
              <button
                key={a.id}
                onMouseEnter={() => setIndex(i)}
                onClick={() => a.run()}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                  i === index ? "bg-gold/12" : ""
                }`}
              >
                <span className="flex items-baseline gap-2.5">
                  <span className={`text-[12.5px] font-semibold ${i === index ? "text-gold-hi" : "text-ink"}`}>
                    {a.label}
                  </span>
                  <span className="text-[10.5px] text-mute-2">{a.sub}</span>
                </span>
                {i === index && <CornerDownLeft size={12} className="text-mute" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}