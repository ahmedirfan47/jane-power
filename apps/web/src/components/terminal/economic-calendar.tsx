"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

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

const IMPACT_DOT: Record<CalendarEvent["impact"], string> = {
  high: "bg-bear",
  medium: "bg-gold",
  low: "bg-mute-2",
  holiday: "bg-mute-2",
};

type Filter = "all" | "high" | "today";

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
    const id = setInterval(load, 900000); // 15 min
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
      <div className="flex items-center gap-2 border-b border-hair-soft px-2.5 py-2">
        <CalendarDays size={12} className="text-mute" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">Calendar</span>
        <div className="ml-auto flex gap-0.5">
          {(["today", "high", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold capitalize transition-colors ${
                filter === f ? "bg-gold/15 text-gold-hi" : "text-mute-2 hover:text-mute"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {state === "loading" && <div className="p-3 text-[11px] text-mute-2">Loading events…</div>}
        {state !== "loading" && shown.length === 0 && (
          <div className="p-3 text-[11px] text-mute-2">No events for this filter.</div>
        )}
        {shown.map((e) => {
          const past = new Date(e.time).getTime() < now;
          return (
            <div
              key={e.id}
              className={`grid grid-cols-[42px_30px_1fr_auto] items-center gap-2 border-b border-hair-soft px-2.5 py-1.5 ${
                past ? "opacity-55" : ""
              }`}
            >
              <span className="tnum text-[10px] text-mute">{fmtTime(e.time)}</span>
              <span className="flex items-center gap-1">
                <span className={`size-1.5 rounded-full ${IMPACT_DOT[e.impact]}`} />
                <span className="text-[10px] font-semibold text-ink-dim">{e.currency}</span>
              </span>
              <span className="truncate text-[11px] text-ink" title={e.title}>
                {e.title}
              </span>
              <span className="flex gap-2 text-[9.5px]">
                {e.actual && <span className="tnum font-semibold text-gold-hi">A {e.actual}</span>}
                {e.forecast && <span className="tnum text-mute">F {e.forecast}</span>}
                {e.previous && <span className="tnum text-mute-2">P {e.previous}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}