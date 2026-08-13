import { NextResponse } from "next/server";

export const revalidate = 900; // cache 15 min — the upstream feed is rate limited

const FEED = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

interface RawEvent {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  time: string;
  impact: "high" | "medium" | "low" | "holiday";
  forecast: string;
  previous: string;
  actual: string;
}

function normalizeImpact(v?: string): CalendarEvent["impact"] {
  const s = (v ?? "").toLowerCase();
  if (s.includes("high")) return "high";
  if (s.includes("medium")) return "medium";
  if (s.includes("holiday")) return "holiday";
  return "low";
}

export async function GET() {
  try {
    const res = await fetch(FEED, {
      headers: { "User-Agent": "jane-power/1.0" },
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      return NextResponse.json({ events: [], error: "upstream" }, { status: 200 });
    }

    const text = await res.text();
    if (text.trim().startsWith("<")) {
      // rate limited — upstream returns an HTML "Request Denied" page
      return NextResponse.json({ events: [], error: "rate_limited" }, { status: 200 });
    }

    const raw = JSON.parse(text) as RawEvent[];
    const events: CalendarEvent[] = raw
      .filter((e) => e.date && e.title)
      .map((e, i) => ({
        id: `${e.date}-${i}`,
        title: e.title ?? "",
        currency: e.country ?? "",
        time: e.date ?? "",
        impact: normalizeImpact(e.impact),
        forecast: e.forecast ?? "",
        previous: e.previous ?? "",
        actual: e.actual ?? "",
      }));

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [], error: "fetch_failed" }, { status: 200 });
  }
}