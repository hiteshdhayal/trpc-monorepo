import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./env";

const dbUrl =
  process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL
    ? process.env.TEST_DATABASE_URL
    : env.DATABASE_URL;

export default defineConfig({
  out: "./drizzle",
  schema: "./schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
