import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";
import "dotenv/config";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is not set");
}

async function main() {
  console.log("Migrating test database programmatically...");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Test database migrated successfully!");
  await pool.end();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
