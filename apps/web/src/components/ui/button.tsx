import type { ReactNode } from "react";

export function Button({
  children,
  pending,
  type = "submit",
}: {
  children: ReactNode;
  pending?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={pending}
      className="w-full bg-gold px-4 py-2.5 text-[14px] font-medium text-void transition-colors hover:bg-gold-hi disabled:cursor-not-allowed disabled:opacity-50"
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}