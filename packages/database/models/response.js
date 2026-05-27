"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responsesRelations = exports.responsesTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const form_1 = require("./form");
const responseAnswer_1 = require("./responseAnswer");
exports.responsesTable = (0, pg_core_1.pgTable)("responses", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    formId: (0, pg_core_1.uuid)("form_id")
        .references(() => form_1.formsTable.id, { onDelete: "cascade" })
        .notNull(),
    respondentEmail: (0, pg_core_1.varchar)("respondent_email", { length: 255 }),
    respondentDeviceToken: (0, pg_core_1.varchar)("respondent_device_token", { length: 255 }),
    completed: (0, pg_core_1.boolean)("completed").default(true).notNull(), // false for partial submissions, true for completed
    lastAnsweredFieldId: (0, pg_core_1.uuid)("last_answered_field_id"), // tracks the last field answered before drop-off
    submittedAt: (0, pg_core_1.timestamp)("submitted_at").defaultNow().notNull(),
}, (table) => [
    // Index high-frequency query columns
    (0, pg_core_1.index)("responses_form_id_idx").on(table.formId),
    (0, pg_core_1.index)("responses_completed_idx").on(table.completed),
    (0, pg_core_1.index)("responses_form_completed_idx").on(table.formId, table.completed),
    // Partial unique index: 1 completed response per email per form (prevents race-condition duplication)
    (0, pg_core_1.uniqueIndex)("unique_email_per_form_completed")
        .on(table.formId, table.respondentEmail)
        .where((0, drizzle_orm_1.sql) `completed = true`),
]);
exports.responsesRelations = (0, drizzle_orm_1.relations)(exports.responsesTable, ({ one, many }) => ({
    form: one(form_1.formsTable, {
        fields: [exports.responsesTable.formId],
        references: [form_1.formsTable.id],
    }),
    answers: many(responseAnswer_1.responseAnswersTable),
}));
