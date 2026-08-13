"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  datetime: number;
}

const CATEGORIES = ["general", "forex", "crypto"] as const;
type Category = (typeof CATEGORIES)[number];

function ago(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState<Category>("general");
  const [state, setState] = useState<"loading" | "ready" | "empty" | "nokey">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    const load = () => {
      fetch(`/api/news?category=${category}`)
        .then((r) => r.json())
        .then((d: { items?: NewsItem[]; error?: string }) => {
          if (!alive) return;
          if (d.error === "no_key") {
            setState("nokey");
            return;
          }
          const list = d.items ?? [];
          setItems(list);
          setState(list.length ? "ready" : "empty");
        })
        .catch(() => alive && setState("empty"));
    };
    load();
    const id = setInterval(load, 300000); // 5 min
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [category]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-hair-soft px-2.5 py-2">
        <Newspaper size={12} className="text-mute" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">News</span>
        <div className="ml-auto flex gap-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold capitalize transition-colors ${
                category === c ? "bg-gold/15 text-gold-hi" : "text-mute-2 hover:text-mute"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {state === "loading" && <div className="p-3 text-[11px] text-mute-2">Loading headlines…</div>}
        {state === "nokey" && (
          <div className="p-3 text-[11px] leading-relaxed text-mute-2">
            News feed needs a Finnhub API key. Add <span className="font-mono text-mute">FINNHUB_API_KEY</span> to your
            environment and restart.
          </div>
        )}
        {state === "empty" && <div className="p-3 text-[11px] text-mute-2">No headlines available.</div>}
        {items.map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border-b border-hair-soft px-2.5 py-2 transition-colors hover:bg-surface-2"
          >
            <div className="mb-0.5 flex items-center gap-2">
              <span className="tnum text-[9.5px] font-semibold text-gold">{ago(n.datetime)}</span>
              <span className="truncate text-[9.5px] text-mute-2">{n.source}</span>
              <ExternalLink size={9} className="ml-auto shrink-0 text-mute-2 opacity-0 group-hover:opacity-100" />
            </div>
            <p className="text-[11.5px] leading-snug text-ink">{n.headline}</p>
          </a>
        ))}
      </div>
    </div>
  );
}