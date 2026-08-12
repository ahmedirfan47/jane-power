import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core";

/** Access-control roles for every user. */
export const userRole = pgEnum("user_role", ["admin", "analyst", "pro", "viewer"]);

/**
 * One row per user. `id` matches the Supabase auth user id.
 * Rows are created automatically by a Postgres trigger on signup
 * (see the SQL you run in Step 8).
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;