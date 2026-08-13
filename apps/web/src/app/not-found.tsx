import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-2xl text-gold">◆</span>
      <h1 className="font-mono text-3xl font-bold tracking-tight text-ink">404</h1>
      <p className="max-w-sm text-sm text-mute">
        That page doesn&apos;t exist. The markets are still open, though.
      </p>
      <Link
        href="/terminal"
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-void transition hover:bg-gold-hi"
      >
        Open terminal
      </Link>
    </main>
  );
}