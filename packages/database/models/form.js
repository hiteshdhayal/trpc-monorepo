"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formsRelations = exports.formsTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const user_1 = require("./user");
const formField_1 = require("./formField");
const response_1 = require("./response");
exports.formsTable = (0, pg_core_1.pgTable)("forms", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    creatorId: (0, pg_core_1.uuid)("creator_id")
        .references(() => user_1.usersTable.id, { onDelete: "cascade" })
        .notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("draft").notNull(), // draft, published, closed
    visibility: (0, pg_core_1.varchar)("visibility", { length: 50 }).default("public").notNull(), // public, unlisted
    theme: (0, pg_core_1.varchar)("theme", { length: 50 }).default("default").notNull(), // default, cyberpunk, hogwarts, startup
    customSlug: (0, pg_core_1.varchar)("custom_slug", { length: 100 }).unique(),
    expiryDate: (0, pg_core_1.timestamp)("expiry_date"),
    responseLimit: (0, pg_core_1.integer)("response_limit"),
    isArchived: (0, pg_core_1.boolean)("is_archived").default(false).notNull(), // soft-delete / archive state
    passwordHash: (0, pg_core_1.text)("password_hash"), // nullable — bcrypt hash for password-protected forms
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)("forms_creator_id_idx").on(table.creatorId),
    (0, pg_core_1.index)("forms_status_idx").on(table.status),
    (0, pg_core_1.index)("forms_archived_idx").on(table.isArchived),
]);
exports.formsRelations = (0, drizzle_orm_1.relations)(exports.formsTable, ({ one, many }) => ({
    creator: one(user_1.usersTable, {
        fields: [exports.formsTable.creatorId],
        references: [user_1.usersTable.id],
    }),
    fields: many(formField_1.formFieldsTable),
    responses: many(response_1.responsesTable),
}));
