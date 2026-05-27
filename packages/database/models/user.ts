import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formsTable } from "./form";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  fullName: varchar("full_name", { length: 80 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  passwordHash: text("password_hash"),

  isAdmin: boolean("is_admin").default(false).notNull(), // grants access to admin dashboard

  profileImageUrl: text("profile_image_url"),

  googleId: varchar("google_id", { length: 255 }),
  provider: varchar("provider", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  forms: many(formsTable),
}));

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
