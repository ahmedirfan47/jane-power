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
      className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}