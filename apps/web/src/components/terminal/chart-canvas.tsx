"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Candle, ChartType } from "@jane-power/shared";
import { useMarketStore } from "@/stores/market";
import { generateSeries, toHeikin } from "@/lib/market/engine";
import { fmtPrice } from "@/lib/market/symbols";

function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e!.contentRect;
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function ChartCanvas({
  symbol,
  tf,
  type,
}: {
  symbol: string;
  tf: string;
  type: ChartType;
}) {
  const [ref, { w, h }] = useSize();
  const quote = useMarketStore((s) => s.quotes[symbol]);
  const seriesRef = useRef<Candle[]>([]);
  const tickRef = useRef(0);
  const [, force] = useReducer((x) => x + 1, 0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // (re)seed when symbol or timeframe changes
  useEffect(() => {
    seriesRef.current = generateSeries(symbol, tf, quote?.last);
    tickRef.current = 0;
    force();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tf]);

  // advance the forming candle from the live quote
  const last = quote?.last;
  useEffect(() => {
    const s = seriesRef.current;
    if (!s.length || last === undefined) return;
    const bar = s[s.length - 1]!;
    bar.c = last;
    bar.h = Math.max(bar.h, last);
    bar.l = Math.min(bar.l, last);
    tickRef.current += 1;
    if (tickRef.current >= 6) {
      tickRef.current = 0;
      s.push({ t: Date.now(), o: last, h: last, l: last, c: last, v: (bar.v ?? 1) * (0.4 + Math.random()) });
      if (s.length > 140) s.shift();
    }
    force();
  }, [last]);

  const data = useMemo(
    () => (type === "heikin" ? toHeikin(seriesRef.current) : seriesRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, last, w, h],
  );

  const geom = useMemo(() => {
    if (!w || !h || !data.length) return null;
    const padL = 6;
    const padR = 62;
    const padT = 10;
    const padB = 4;
    const volH = Math.min(44, h * 0.15);
    const plotW = w - padL - padR;
    const plotH = h - padT - padB - volH;
    const step = 7.2;
    const count = Math.max(8, Math.min(data.length, Math.floor(plotW / step)));
    const vis = data.slice(data.length - count);
    let lo = Infinity;
    let hi = -Infinity;
    let vmax = 0;
    for (const d of vis) {
      if (d.l < lo) lo = d.l;
      if (d.h > hi) hi = d.h;
      if ((d.v ?? 0) > vmax) vmax = d.v ?? 0;
    }
    const pad = (hi - lo) * 0.08 || hi * 0.001;
    lo -= pad;
    hi += pad;
    const sx = plotW / count;
    const X = (i: number) => padL + i * sx + sx / 2;
    const Y = (p: number) => padT + (1 - (p - lo) / (hi - lo)) * plotH;
    const VY = (v: number) => padT + plotH + (1 - v / (vmax || 1)) * volH;
    return { padL, padR, padT, padB, plotH, volH, vis, lo, hi, sx, X, Y, VY, count };
  }, [w, h, data]);

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  if (!geom) return <div ref={ref} className="absolute inset-0" />;

  const { padL, padR, padT, plotH, VY, vis, lo, hi, X, Y } = geom;
  const bodyW = Math.max(1.4, Math.min(9, geom.sx * 0.62));
  const lastBar = vis[vis.length - 1]!;
  const firstBar = vis[0]!;
  const up = lastBar.c >= firstBar.o;
  const bull = "var(--color-bull)";
  const bear = "var(--color-bear)";
  const grid = 4;

  return (
    <div
      ref={ref}
      className="absolute inset-0 cursor-crosshair"
      onMouseMove={onMove}
      onMouseLeave={() => setCursor(null)}
    >
      <svg width={w} height={h} className="block">
        {Array.from({ length: grid + 1 }).map((_, i) => {
          const p = lo + ((hi - lo) * i) / grid;
          const y = Y(p);
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--color-hair-soft)" strokeWidth={1} />
              <text x={w - padR + 6} y={y + 3} className="tnum" fontSize={9} fill="var(--color-mute-2)">
                {fmtPrice(symbol, p)}
              </text>
            </g>
          );
        })}

        <text x={padL + 8} y={padT + 20} fontSize={24} fontWeight={700} fill="rgba(255,255,255,0.045)">
          {symbol}
        </text>

        {vis.map((d, i) => {
          const dir = d.c >= d.o;
          const y0 = padT + plotH + geom.volH;
          const y1 = VY(d.v ?? 0);
          return (
            <rect
              key={"v" + i}
              x={X(i) - bodyW / 2}
              y={y1}
              width={bodyW}
              height={Math.max(0.5, y0 - y1)}
              fill={dir ? bull : bear}
              opacity={0.16}
            />
          );
        })}

        {type === "line" || type === "area" ? (
          <g>
            {type === "area" && (
              <polygon
                points={`${X(0)},${Y(lo)} ${vis.map((d, i) => `${X(i)},${Y(d.c)}`).join(" ")} ${X(vis.length - 1)},${Y(lo)}`}
                fill="color-mix(in srgb, var(--color-gold) 10%, transparent)"
              />
            )}
            <polyline
              points={vis.map((d, i) => `${X(i)},${Y(d.c)}`).join(" ")}
              fill="none"
              stroke="var(--color-gold-hi)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </g>
        ) : (
          vis.map((d, i) => {
            const dir = d.c >= d.o;
            const col = dir ? bull : bear;
            return (
              <g key={i}>
                <line x1={X(i)} x2={X(i)} y1={Y(d.h)} y2={Y(d.l)} stroke={col} strokeWidth={1} />
                <rect
                  x={X(i) - bodyW / 2}
                  y={Math.min(Y(d.o), Y(d.c))}
                  width={bodyW}
                  height={Math.max(1, Math.abs(Y(d.o) - Y(d.c)))}
                  fill={col}
                />
              </g>
            );
          })
        )}

        <line
          x1={padL}
          x2={w - padR}
          y1={Y(lastBar.c)}
          y2={Y(lastBar.c)}
          stroke={up ? "var(--color-bull-hi)" : "var(--color-bear-hi)"}
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.7}
        />
        <rect x={w - padR} y={Y(lastBar.c) - 9} width={padR - 2} height={18} rx={2} fill={up ? bull : bear} />
        <text x={w - padR + 5} y={Y(lastBar.c) + 4} className="tnum" fontSize={9.5} fontWeight={600} fill="#08090c">
          {fmtPrice(symbol, lastBar.c)}
        </text>

        {cursor && (
          <g>
            <line x1={cursor.x} x2={cursor.x} y1={padT} y2={h - geom.padB} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
            <line x1={padL} x2={w - padR} y1={cursor.y} y2={cursor.y} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
            <rect x={w - padR} y={cursor.y - 9} width={padR - 2} height={18} rx={2} fill="var(--color-gold)" />
            <text x={w - padR + 5} y={cursor.y + 4} className="tnum" fontSize={9.5} fontWeight={700} fill="#08090c">
              {fmtPrice(symbol, lo + (1 - (cursor.y - padT) / plotH) * (hi - lo))}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}