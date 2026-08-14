"use client";

import { useEffect, useState } from "react";

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
  const mins = Math.floor((Date.now() - ts) / 60_000);
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
    const id = setInterval(load, 300_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [category]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center border-b border-rule px-3">
        <span className="t-label text-[10px]">Newswire</span>
        <div className="ml-auto flex">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`px-2 py-0.5 text-[11px] capitalize transition-colors ${
                category === c ? "text-gold-hi" : "text-ink-4 hover:text-ink-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {state === "loading" && (
          <p className="px-3 py-4 text-[13px] text-ink-4">Loading headlines…</p>
        )}
        {state === "nokey" && (
          <p className="px-3 py-4 text-[13px] leading-relaxed text-ink-4">
            The newswire needs a Finnhub API key. Add FINNHUB_API_KEY to the environment.
          </p>
        )}
        {state === "empty" && (
          <p className="px-3 py-4 text-[13px] text-ink-4">No headlines right now.</p>
        )}
        {items.map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-b border-rule-soft px-3 py-2.5 transition-colors hover:bg-raised"
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span className="t-num text-[11px] text-gold">{ago(n.datetime)}</span>
              <span className="truncate text-[11px] text-ink-4">{n.source}</span>
            </div>
            <p className="text-[13px] leading-snug text-ink-2">{n.headline}</p>
          </a>
        ))}
      </div>
    </div>
  );
}