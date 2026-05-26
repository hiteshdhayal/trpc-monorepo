"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRelations = exports.usersTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const form_1 = require("./form");
exports.usersTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    fullName: (0, pg_core_1.varchar)("full_name", { length: 80 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    passwordHash: (0, pg_core_1.text)("password_hash"),
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false).notNull(),
    profileImageUrl: (0, pg_core_1.text)("profile_image_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").$onUpdate(() => new Date()),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.usersTable, ({ many }) => ({
    forms: many(form_1.formsTable),
}));
