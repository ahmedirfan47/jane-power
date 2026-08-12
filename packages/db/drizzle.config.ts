import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Reuse the same credentials the web app uses.
config({ path: "../../apps/web/.env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Check apps/web/.env.local (Session pooler string).",
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});