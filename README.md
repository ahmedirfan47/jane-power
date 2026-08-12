# jane-power

Real-time market intelligence terminal — live multi-market charting, a
Bloomberg-style widget layer, and an economic calendar + news engine. Research
and analysis only (no trading, no broker integration).

## Stack

- **Monorepo:** Turborepo + pnpm
- **Web:** Next.js 16, React 19, TypeScript, Tailwind v4, Zustand, TanStack Query
- **Auth + DB:** Supabase (Auth + Postgres + RLS), Drizzle ORM
- **Realtime:** Node WebSocket gateway (Fly.io) + Upstash Redis
- **Contracts:** Zod schemas shared across web and gateway

## Structure