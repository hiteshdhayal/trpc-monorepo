import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { responsesTable } from "./response";
import { formFieldsTable } from "./formField";

export const responseAnswersTable = pgTable("response_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .references(() => responsesTable.id, { onDelete: "cascade" })
    .notNull(),
  fieldId: uuid("field_id")
    .references(() => formFieldsTable.id, { onDelete: "cascade" })
    .notNull(),
  answer: jsonb("answer").notNull(), // can store string, array of strings (checkboxes), number (ratings), etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responseAnswersRelations = relations(responseAnswersTable, ({ one }) => ({
  response: one(responsesTable, {
    fields: [responseAnswersTable.responseId],
    references: [responsesTable.id],
  }),
  field: one(formFieldsTable, {
    fields: [responseAnswersTable.fieldId],
    references: [formFieldsTable.id],
  }),
}));

export type SelectResponseAnswer = typeof responseAnswersTable.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswersTable.$inferInsert;
