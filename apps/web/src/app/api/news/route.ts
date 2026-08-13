import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
}

interface RawNews {
  id?: number;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  datetime?: number;
  category?: string;
}

export async function GET(request: Request) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return NextResponse.json(
      { items: [], error: "no_key" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "general";

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { items: [], error: "upstream", status: res.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const raw = (await res.json()) as RawNews[];
    const items: NewsItem[] = raw.slice(0, 60).map((n, i) => ({
      id: String(n.id ?? i),
      headline: n.headline ?? "",
      summary: n.summary ?? "",
      source: n.source ?? "",
      url: n.url ?? "",
      datetime: (n.datetime ?? 0) * 1000,
      category: n.category ?? category,
    }));

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=300" } },
    );
  } catch {
    return NextResponse.json(
      { items: [], error: "fetch_failed" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}