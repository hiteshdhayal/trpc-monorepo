import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";
import * as schema from "./schema";

const databaseUrl =
  process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL
    ? process.env.TEST_DATABASE_URL
    : env.DATABASE_URL;

console.log("[@repo/database] Connecting to database URL:", databaseUrl);

export const db = drizzle(databaseUrl, { schema });
export * from "drizzle-orm";
export default db;
