"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
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
    const symbols: Action[] = SYMBOLS.map((s) => ({
      id: `sym-${s.symbol}`,
      label: s.symbol,
      sub: s.name,
      run: () => {
        loadSymbolIntoActive(s.symbol);
        close();
      },
    }));
    const layouts: Action[] = ([1, 2, 4, 6, 8] as LayoutCount[]).map((n) => ({
      id: `layout-${n}`,
      label: `${n} ${n === 1 ? "chart" : "charts"}`,
      sub: "Layout",
      run: () => {
        setLayout(n);
        clearFocus();
        close();
      },
    }));
    return [...symbols, ...layouts];
  }, [loadSymbolIntoActive, setLayout, clearFocus, setPalette]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q),
    );
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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[14vh]"
      onMouseDown={() => setPalette(false)}
    >
      <div
        className="w-full max-w-lg border border-rule bg-elevated"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
          <Search size={14} className="text-ink-4" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search instruments and layouts"
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4"
          />
          <kbd className="t-num border border-rule px-1.5 py-0.5 text-[10px] text-ink-4">esc</kbd>
        </div>

        <div className="max-h-[48vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-ink-4">
              Nothing matches “{query}”.
            </p>
          ) : (
            results.slice(0, 60).map((a, i) => (
              <button
                key={a.id}
                onMouseEnter={() => setIndex(i)}
                onClick={() => a.run()}
                className={`flex w-full items-baseline gap-3 border-b border-rule-soft px-4 py-2.5 text-left transition-colors ${
                  i === index ? "bg-raised" : ""
                }`}
              >
                <span
                  className={`text-[13px] font-medium ${i === index ? "text-gold-hi" : "text-ink"}`}
                >
                  {a.label}
                </span>
                <span className="text-[12px] text-ink-4">{a.sub}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}