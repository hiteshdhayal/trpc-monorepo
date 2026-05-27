import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { formsTable } from "./form";
import { responseAnswersTable } from "./responseAnswer";

export const responsesTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .references(() => formsTable.id, { onDelete: "cascade" })
      .notNull(),
    respondentEmail: varchar("respondent_email", { length: 255 }),
    respondentDeviceToken: varchar("respondent_device_token", { length: 255 }),
    completed: boolean("completed").default(true).notNull(), // false for partial submissions, true for completed
    lastAnsweredFieldId: uuid("last_answered_field_id"), // tracks the last field answered before drop-off
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => [
    // Index high-frequency query columns
    index("responses_form_id_idx").on(table.formId),
    index("responses_completed_idx").on(table.completed),
    index("responses_form_completed_idx").on(table.formId, table.completed),
    // Partial unique index: 1 completed response per email per form (prevents race-condition duplication)
    uniqueIndex("unique_email_per_form_completed")
      .on(table.formId, table.respondentEmail)
      .where(sql`completed = true`),
  ],
);

export const responsesRelations = relations(responsesTable, ({ one, many }) => ({
  form: one(formsTable, {
    fields: [responsesTable.formId],
    references: [formsTable.id],
  }),
  answers: many(responseAnswersTable),
}));

export type SelectResponse = typeof responsesTable.$inferSelect;
export type InsertResponse = typeof responsesTable.$inferInsert;
