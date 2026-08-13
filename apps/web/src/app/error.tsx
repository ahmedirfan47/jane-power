"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[jane-power] page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-2xl text-gold">◆</span>
      <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm text-mute">
        The terminal hit an unexpected error. Try again — if it keeps happening, reload the page.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-void transition hover:bg-gold-hi"
      >
        Try again
      </button>
    </main>
  );
}