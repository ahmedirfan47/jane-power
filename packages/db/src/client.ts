import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse a single connection across dev hot-reloads to avoid exhausting the pool.
const globalForDb = globalThis as unknown as {
  __janePowerClient?: ReturnType<typeof postgres>;
};

const client = globalForDb.__janePowerClient ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") {
  globalForDb.__janePowerClient = client;
}

export const db = drizzle(client, { schema });