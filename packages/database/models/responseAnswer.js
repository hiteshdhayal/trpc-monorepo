"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseAnswersRelations = exports.responseAnswersTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("./response");
const formField_1 = require("./formField");
exports.responseAnswersTable = (0, pg_core_1.pgTable)("response_answers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    responseId: (0, pg_core_1.uuid)("response_id")
        .references(() => response_1.responsesTable.id, { onDelete: "cascade" })
        .notNull(),
    fieldId: (0, pg_core_1.uuid)("field_id")
        .references(() => formField_1.formFieldsTable.id, { onDelete: "cascade" })
        .notNull(),
    answer: (0, pg_core_1.jsonb)("answer").notNull(), // can store string, array of strings (checkboxes), number (ratings), etc.
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.responseAnswersRelations = (0, drizzle_orm_1.relations)(exports.responseAnswersTable, ({ one }) => ({
    response: one(response_1.responsesTable, {
        fields: [exports.responseAnswersTable.responseId],
        references: [response_1.responsesTable.id],
    }),
    field: one(formField_1.formFieldsTable, {
        fields: [exports.responseAnswersTable.fieldId],
        references: [formField_1.formFieldsTable.id],
    }),
}));
