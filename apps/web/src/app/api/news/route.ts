import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["general", "forex", "crypto", "merger"]);

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  datetime: number;
}

interface RawNews {
  id?: number;
  headline?: string;
  source?: string;
  url?: string;
  datetime?: number;
}

const cache = new Map<string, { at: number; items: NewsItem[] }>();
const TTL_MS = 300_000;

export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "news"), 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { items: [], error: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }

  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return NextResponse.json(
      { items: [], error: "no_key" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("category") ?? "general";
  const category = ALLOWED.has(raw) ? raw : "general";

  const hit = cache.get(category);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(
      { items: hit.items, cached: true },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { items: hit?.items ?? [], error: "upstream", status: res.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const rows = (await res.json()) as RawNews[];
    const items: NewsItem[] = rows.slice(0, 60).map((n, i) => ({
      id: String(n.id ?? i),
      headline: n.headline ?? "",
      source: n.source ?? "",
      url: n.url ?? "",
      datetime: (n.datetime ?? 0) * 1000,
    }));

    cache.set(category, { at: Date.now(), items });
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json(
      { items: hit?.items ?? [], error: "fetch_failed" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}