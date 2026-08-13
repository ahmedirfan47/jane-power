import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

let cache: { at: number; events: CalendarEvent[] } = { at: 0, events: [] };
const TTL_MS = 900_000; // upstream allows only 2 pulls / 5 min

export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "calendar"), 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { events: cache.events, error: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }

  if (Date.now() - cache.at < TTL_MS && cache.events.length) {
    return NextResponse.json(
      { events: cache.events, cached: true },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
    );
  }

  try {
    const res = await fetch(FEED, {
      headers: { "User-Agent": "jane-power/1.0" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { events: cache.events, error: "upstream", status: res.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const text = await res.text();
    if (text.trim().startsWith("<")) {
      return NextResponse.json(
        { events: cache.events, error: "rate_limited_upstream" },
        { headers: { "Cache-Control": "no-store" } },
      );
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

    if (events.length) cache = { at: Date.now(), events };
    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
    );
  } catch {
    return NextResponse.json(
      { events: cache.events, error: "fetch_failed" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}