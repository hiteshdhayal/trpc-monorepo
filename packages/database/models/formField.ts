import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formsTable } from "./form";
import { responseAnswersTable } from "./responseAnswer";

export const formFieldsTable = pgTable("form_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .references(() => formsTable.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // short_text, long_text, email, number, select, checkbox, rating, date
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  required: boolean("required").default(false).notNull(),
  orderIndex: integer("order_index").notNull(),
  options: jsonb("options"), // Array of { label: string, value: string }
  validationRules: jsonb("validation_rules"), // { min?: number, max?: number, pattern?: string, minLength?: number, maxLength?: number }
  conditionalLogic: jsonb("conditional_logic"), // { showIfFieldId?: string, showIfValue?: string }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formFieldsRelations = relations(formFieldsTable, ({ one, many }) => ({
  form: one(formsTable, {
    fields: [formFieldsTable.formId],
    references: [formsTable.id],
  }),
  answers: many(responseAnswersTable),
}));

export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
