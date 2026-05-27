"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const drizzle_kit_1 = require("drizzle-kit");
const env_1 = require("./env");
const dbUrl = process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL
    ? process.env.TEST_DATABASE_URL
    : env_1.env.DATABASE_URL;
exports.default = (0, drizzle_kit_1.defineConfig)({
    out: "./drizzle",
    schema: "./schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: dbUrl,
    },
});
