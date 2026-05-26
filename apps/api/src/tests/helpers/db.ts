import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "@repo/database/schema";
import { beforeEach } from "vitest";

if (process.env.NODE_ENV !== "test") {
  throw new Error("Tests must be run with NODE_ENV=test. This prevents accidental truncation of development or production databases.");
}

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is required for tests.");
}

export const testDb = drizzle(process.env.TEST_DATABASE_URL, { schema });

// Helper to clean database between tests
beforeEach(async () => {
  // Disable foreign key checks for truncation (PostgreSQL CASCADE handles this)
  await testDb.execute(sql`
    TRUNCATE TABLE 
      response_answers, 
      responses, 
      form_fields, 
      forms, 
      users 
    CASCADE;
  `);
});
