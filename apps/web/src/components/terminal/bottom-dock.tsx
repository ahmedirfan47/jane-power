"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EconomicCalendar } from "./economic-calendar";
import { NewsFeed } from "./news-feed";

export function BottomDock() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="flex shrink-0 flex-col border-t border-hair bg-surface transition-[height] duration-300"
      style={{ height: open ? 232 : 30 }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-[30px] shrink-0 items-center gap-2 px-3 text-mute transition-colors hover:text-ink"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Macro &amp; News</span>
        {open ? <ChevronDown size={12} className="ml-auto" /> : <ChevronUp size={12} className="ml-auto" />}
      </button>

      {open && (
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-x divide-hair border-t border-hair-soft lg:grid-cols-2">
          <div className="min-h-0">
            <EconomicCalendar />
          </div>
          <div className="min-h-0 max-lg:hidden">
            <NewsFeed />
          </div>
        </div>
      )}
    </div>
  );
}