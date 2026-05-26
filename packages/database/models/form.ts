import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./user";
import { formFieldsTable } from "./formField";
import { responsesTable } from "./response";

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("draft").notNull(), // draft, published, closed
    visibility: varchar("visibility", { length: 50 }).default("public").notNull(), // public, unlisted
    theme: varchar("theme", { length: 50 }).default("default").notNull(), // default, cyberpunk, hogwarts, startup
    customSlug: varchar("custom_slug", { length: 100 }).unique(),
    expiryDate: timestamp("expiry_date"),
    responseLimit: integer("response_limit"),
    isArchived: boolean("is_archived").default(false).notNull(), // soft-delete / archive state
    passwordHash: text("password_hash"), // nullable — bcrypt hash for password-protected forms
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("forms_creator_id_idx").on(table.creatorId),
    index("forms_status_idx").on(table.status),
    index("forms_archived_idx").on(table.isArchived),
  ]
);

export const formsRelations = relations(formsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [formsTable.creatorId],
    references: [usersTable.id],
  }),
  fields: many(formFieldsTable),
  responses: many(responsesTable),
}));

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
