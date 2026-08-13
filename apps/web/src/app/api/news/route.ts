import { NextResponse } from "next/server";

export const revalidate = 300; // 5 min

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
    return NextResponse.json({ items: [], error: "no_key" }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "general"; // general | forex | crypto | merger

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${key}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      return NextResponse.json({ items: [], error: "upstream" }, { status: 200 });
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

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: "fetch_failed" }, { status: 200 });
  }
}