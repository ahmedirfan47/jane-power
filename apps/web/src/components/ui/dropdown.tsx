"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Dropdown({
  trigger,
  children,
  align = "left",
  width = 180,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 px-1.5 py-1 text-ink transition-colors hover:text-ink"
      >
        {trigger}
        <ChevronDown size={11} className="text-ink-4" />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 max-h-80 overflow-y-auto border border-rule bg-elevated py-1"
          style={{ width, [align]: 0, borderRadius: "var(--radius-sm)" }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}