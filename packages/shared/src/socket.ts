import { z } from "zod";

/* ── Client → Gateway ─────────────────────────────────────── */

export const ClientSubscribeSchema = z.object({
  type: z.literal("subscribe"),
  symbols: z.array(z.string()).min(1).max(200),
});

export const ClientUnsubscribeSchema = z.object({
  type: z.literal("unsubscribe"),
  symbols: z.array(z.string()).min(1),
});

export const ClientPingSchema = z.object({
  type: z.literal("ping"),
  t: z.number().int(),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  ClientSubscribeSchema,
  ClientUnsubscribeSchema,
  ClientPingSchema,
]);

/* ── Gateway → Client ─────────────────────────────────────── */

export const ServerHelloSchema = z.object({
  type: z.literal("hello"),
  sessionId: z.string(),
  ts: z.number().int(),
});

export const ServerTickSchema = z.object({
  type: z.literal("tick"),
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePct: z.number(),
  ts: z.number().int(),
});

export const ServerErrorSchema = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string(),
});

export const ServerPongSchema = z.object({
  type: z.literal("pong"),
  t: z.number().int(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  ServerHelloSchema,
  ServerTickSchema,
  ServerErrorSchema,
  ServerPongSchema,
]);

/* ── Inferred types ───────────────────────────────────────── */

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
export type ServerTick = z.infer<typeof ServerTickSchema>;

/** Safe-parse a raw inbound string into a typed server message. */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const json: unknown = JSON.parse(raw);
    const result = ServerMessageSchema.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}