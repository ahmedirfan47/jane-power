"use client";

export function ChartSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 bg-ink-4"
              style={{
                height: `${10 + ((i * 7) % 18)}px`,
                animation: `pulseBar 1.1s ${i * 90}ms ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        <span className="t-label text-[10px]">Loading price history</span>
      </div>
      <style>{`
        @keyframes pulseBar {
          0%, 100% { opacity: 0.25; transform: scaleY(0.7); }
          50% { opacity: 0.9; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}