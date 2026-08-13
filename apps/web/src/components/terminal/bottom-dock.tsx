"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize2 } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { EconomicCalendar } from "./economic-calendar";
import { NewsFeed } from "./news-feed";

type Tab = "both" | "calendar" | "news";

const MIN_H = 32;
const DEFAULT_H = 240;
const COLLAPSED_H = 32;
const STORAGE_KEY = "jp-dock";

export function BottomDock() {
  const [height, setHeight] = useState(DEFAULT_H);
  const [tab, setTab] = useState<Tab>("both");
  const [dragging, setDragging] = useState(false);
  const lastExpanded = useRef(DEFAULT_H);
  const startY = useRef(0);
  const startH = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collapsed = height <= COLLAPSED_H + 2;

  // restore saved size + tab
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { h?: number; tab?: Tab };
      if (typeof saved.h === "number") {
        setHeight(saved.h);
        if (saved.h > COLLAPSED_H + 2) lastExpanded.current = saved.h;
      }
      if (saved.tab === "both" || saved.tab === "calendar" || saved.tab === "news") {
        setTab(saved.tab);
      }
    } catch {
      // unreadable storage — fall back to defaults
    }
  }, []);

  // persist, debounced so dragging doesn't hammer storage
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ h: height, tab }));
      } catch {
        // storage unavailable — size just won't persist
      }
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [height, tab]);

  const clamp = useCallback((h: number) => {
    const max = Math.max(MIN_H, window.innerHeight - 180);
    return Math.min(max, Math.max(MIN_H, h));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    startH.current = height;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    // dragging up grows the dock
    setHeight(clamp(startH.current + (startY.current - e.clientY)));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
    if (height > COLLAPSED_H + 2) lastExpanded.current = height;
  };

  const toggle = useCallback(() => {
    setHeight((h) => {
      if (h <= COLLAPSED_H + 2) return clamp(lastExpanded.current || DEFAULT_H);
      lastExpanded.current = h;
      return COLLAPSED_H;
    });
  }, [clamp]);

  const expandFull = () => {
    const next = clamp(window.innerHeight - 180);
    lastExpanded.current = next;
    setHeight(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHeight((h) => clamp(h + 24));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHeight((h) => clamp(h - 24));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <section
      aria-label="Macro and news"
      className="flex shrink-0 flex-col border-t border-hair bg-surface"
      style={{ height, transition: dragging ? "none" : "height 220ms cubic-bezier(0.4,0,0.2,1)" }}
    >
      {/* drag handle */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize panel"
        aria-valuenow={height}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={toggle}
        onKeyDown={onKeyDown}
        className={`group relative h-1.5 shrink-0 cursor-row-resize touch-none ${
          dragging ? "bg-gold/50" : "bg-transparent hover:bg-gold/25"
        }`}
        style={{ marginTop: -3 }}
      >
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mute opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* header */}
      <div className="flex h-[26px] shrink-0 items-center gap-2 px-3">
        <div className="flex gap-0.5" role="tablist" aria-label="Panel view">
          {(["both", "calendar", "news"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                if (collapsed) setHeight(clamp(lastExpanded.current || DEFAULT_H));
              }}
              className={`rounded px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors ${
                tab === t ? "bg-gold/15 text-gold-hi" : "text-mute hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={expandFull}
            title="Expand panel"
            aria-label="Expand panel"
            className="flex size-5 items-center justify-center rounded text-mute transition-colors hover:text-ink"
          >
            <Maximize2 size={11} />
          </button>
          <button
            onClick={toggle}
            title={collapsed ? "Expand panel" : "Collapse panel"}
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
            aria-expanded={!collapsed}
            className="flex size-5 items-center justify-center rounded text-mute transition-colors hover:text-ink"
          >
            {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* content */}
      {!collapsed && (
        <div className="min-h-0 flex-1 border-t border-hair-soft">
          {tab === "both" ? (
            <div className="grid h-full min-h-0 grid-cols-1 divide-x divide-hair lg:grid-cols-2">
              <div className="min-h-0 overflow-hidden">
                <ErrorBoundary label="Calendar">
                  <EconomicCalendar />
                </ErrorBoundary>
              </div>
              <div className="min-h-0 overflow-hidden max-lg:hidden">
                <ErrorBoundary label="News">
                  <NewsFeed />
                </ErrorBoundary>
              </div>
            </div>
          ) : tab === "calendar" ? (
            <div className="h-full min-h-0 overflow-hidden">
              <ErrorBoundary label="Calendar">
                <EconomicCalendar />
              </ErrorBoundary>
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-hidden">
              <ErrorBoundary label="News">
                <NewsFeed />
              </ErrorBoundary>
            </div>
          )}
        </div>
      )}
    </section>
  );
}