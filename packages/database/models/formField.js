"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formFieldsRelations = exports.formFieldsTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const form_1 = require("./form");
const responseAnswer_1 = require("./responseAnswer");
exports.formFieldsTable = (0, pg_core_1.pgTable)("form_fields", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    formId: (0, pg_core_1.uuid)("form_id")
        .references(() => form_1.formsTable.id, { onDelete: "cascade" })
        .notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(), // short_text, long_text, email, number, select, checkbox, rating, date
    label: (0, pg_core_1.text)("label").notNull(),
    placeholder: (0, pg_core_1.text)("placeholder"),
    required: (0, pg_core_1.boolean)("required").default(false).notNull(),
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    options: (0, pg_core_1.jsonb)("options"), // Array of { label: string, value: string }
    validationRules: (0, pg_core_1.jsonb)("validation_rules"), // { min?: number, max?: number, pattern?: string, minLength?: number, maxLength?: number }
    conditionalLogic: (0, pg_core_1.jsonb)("conditional_logic"), // { showIfFieldId?: string, showIfValue?: string }
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.formFieldsRelations = (0, drizzle_orm_1.relations)(exports.formFieldsTable, ({ one, many }) => ({
    form: one(form_1.formsTable, {
        fields: [exports.formFieldsTable.formId],
        references: [form_1.formsTable.id],
    }),
    answers: many(responseAnswer_1.responseAnswersTable),
}));
