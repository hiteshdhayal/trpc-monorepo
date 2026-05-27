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
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false).notNull(), // grants access to admin dashboard
    profileImageUrl: (0, pg_core_1.text)("profile_image_url"),
    googleId: (0, pg_core_1.varchar)("google_id", { length: 255 }),
    provider: (0, pg_core_1.varchar)("provider", { length: 50 }),
    // Password reset — token stored as SHA-256 hash, NEVER raw
    resetPasswordToken: (0, pg_core_1.varchar)("reset_password_token", { length: 64 }),
    resetPasswordExpires: (0, pg_core_1.timestamp)("reset_password_expires"),
    // Email verification — token stored as SHA-256 hash, NEVER raw
    verifyEmailToken: (0, pg_core_1.varchar)("verify_email_token", { length: 64 }),
    verifyEmailExpires: (0, pg_core_1.timestamp)("verify_email_expires"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").$onUpdate(() => new Date()),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.usersTable, ({ many }) => ({
    forms: many(form_1.formsTable),
}));
