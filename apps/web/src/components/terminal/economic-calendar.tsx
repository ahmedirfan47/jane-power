"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  time: string;
  impact: "high" | "medium" | "low" | "holiday";
  forecast: string;
  previous: string;
  actual: string;
}

const IMPACT: Record<CalendarEvent["impact"], string> = {
  high: "bg-bear",
  medium: "bg-gold",
  low: "bg-ink-4",
  holiday: "bg-ink-4",
};

type Filter = "today" | "high" | "all";

export function EconomicCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");
  const [filter, setFilter] = useState<Filter>("today");

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/calendar")
        .then((r) => r.json())
        .then((d: { events?: CalendarEvent[] }) => {
          if (!alive) return;
          const list = d.events ?? [];
          setEvents(list);
          setState(list.length ? "ready" : "empty");
        })
        .catch(() => alive && setState("empty"));
    };
    load();
    const id = setInterval(load, 900_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const now = Date.now();
  const todayStr = new Date().toDateString();

  const shown = events.filter((e) => {
    if (filter === "high") return e.impact === "high";
    if (filter === "today") return new Date(e.time).toDateString() === todayStr;
    return true;
  });

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? "--:--"
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center border-b border-rule px-3">
        <span className="t-label text-[10px]">Calendar</span>
        <div className="ml-auto flex">
          {(["today", "high", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-2 py-0.5 text-[11px] capitalize transition-colors ${
                filter === f ? "text-gold-hi" : "text-ink-4 hover:text-ink-2"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {state === "loading" && (
          <p className="px-3 py-4 text-[13px] text-ink-4">Loading events…</p>
        )}
        {state !== "loading" && shown.length === 0 && (
          <p className="px-3 py-4 text-[13px] text-ink-4">
            {filter === "today" ? "No releases scheduled today." : "No events for this filter."}
          </p>
        )}
        {shown.map((e) => {
          const past = new Date(e.time).getTime() < now;
          return (
            <div
              key={e.id}
              className={`flex items-center gap-3 border-b border-rule-soft px-3 py-2 ${
                past ? "opacity-50" : ""
              }`}
            >
              <span className="t-num w-11 shrink-0 text-[12px] text-ink-3">{fmtTime(e.time)}</span>
              <span className={`size-1.5 shrink-0 ${IMPACT[e.impact]}`} aria-hidden />
              <span className="w-8 shrink-0 text-[12px] font-medium text-ink-2">{e.currency}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink" title={e.title}>
                {e.title}
              </span>
              <span className="flex shrink-0 items-baseline gap-3 text-[11px]">
                {e.actual && <span className="t-num text-gold-hi">{e.actual}</span>}
                {e.forecast && <span className="t-num text-ink-3">{e.forecast}</span>}
                {e.previous && <span className="t-num text-ink-4">{e.previous}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}