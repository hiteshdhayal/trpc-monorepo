import http from "node:http";
import { logger } from "@repo/logger";
import { createApp } from "./server";
import { env } from "./env";

async function init() {
  // ── Step 0: raw env diagnostics (visible even if structured logger fails) ──
  logger.info("=== SERVER STARTUP ===");
  logger.info(`NODE_ENV        : ${process.env.NODE_ENV ?? "(not set)"}`);
  logger.info(`PORT            : ${process.env.PORT ?? "(not set, will use 8000)"}`);
  logger.info(`DATABASE_URL    : ${process.env.DATABASE_URL ? "✓ exists" : "✗ MISSING"}`);
  logger.info(`FRONTEND_URL    : ${process.env.FRONTEND_URL ? "✓ exists" : "✗ MISSING"}`);
  logger.info(`JWT_SECRET      : ${process.env.JWT_SECRET ? "✓ exists" : "✗ MISSING"}`);
  logger.info("======================");

  try {
    // ── Step 1: validate env schema (throws with field-level errors if invalid) ──
    logger.info("[startup] Environment variables validated successfully");
    logger.info(`[startup] NODE_ENV=${env.NODE_ENV}, BASE_URL=${env.BASE_URL}`);

    // ── Step 2: verify database URL is reachable (basic connectivity check) ──
    logger.info("[startup] Checking database connectivity...");
    try {
      const { db } = await import("@repo/database");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      logger.info("[startup] ✓ Database connection OK");
    } catch (dbErr) {
      logger.error("[startup] ✗ Database connection FAILED", { err: dbErr });
      // Do not exit — let the app boot; DB errors will surface per-request
    }

    // ── Step 3: build the express app (registers all routes, loads Scalar, etc.) ──
    logger.info("[startup] Building Express application...");
    const app = await createApp();
    logger.info("[startup] ✓ Express application built");

    // ── Step 4: create HTTP server and start listening ──
    const server = http.createServer(app);
    const PORT: number = env.PORT ? +env.PORT : 8000;

    logger.info(`[startup] Starting HTTP server on port ${PORT}...`);
    server.listen(PORT, () => {
      logger.info(`[startup] ✓ HTTP server listening on PORT ${PORT}`);
    });

    server.on("error", (serverErr) => {
      logger.error("[startup] HTTP server error", { err: serverErr });
      process.exit(1);
    });
  } catch (err) {
    // ── Fatal startup failure — log everything possible ──
    logger.error("[startup] ✗ FATAL: server failed to start", { err });
    process.exit(1);
  }
}

init();
