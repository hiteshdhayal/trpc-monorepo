import "dotenv/config";
import * as schema from "./schema";
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export * from "drizzle-orm";
export default db;
//# sourceMappingURL=index.d.ts.map