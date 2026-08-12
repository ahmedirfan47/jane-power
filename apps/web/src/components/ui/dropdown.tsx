"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Dropdown({
  trigger,
  children,
  align = "left",
  width = 168,
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
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-ink transition-colors hover:bg-surface-2"
      >
        {trigger}
        <ChevronDown size={11} className="text-mute" />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 max-h-[320px] overflow-y-auto rounded-lg border border-hair bg-elevated p-1.5 shadow-2xl"
          style={{ width, [align]: 0 }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}