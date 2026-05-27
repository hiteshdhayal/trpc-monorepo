import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import helmet from "helmet";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";

import { serverRouter, createContext } from "@repo/trpc/server";
import { db, eq, and } from "@repo/database";
import { formsTable, responsesTable } from "@repo/database/schema";
import { verifyJwt } from "@repo/services/user/auth";

// Import and validate env at startup
import { env } from "./env";

export async function createApp() {
  const app = express();

  // Fix: enable trust proxy so req.ip is correctly populated from x-forwarded-for
  app.set("trust proxy", true);

  // Security middleware
  app.use(helmet());

  const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "FinalForms OpenAPI",
    version: "1.0.0",
    baseUrl: env.BASE_URL.concat("/api"),
  });

  // Strict CORS to the frontend URL only
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  app.use(express.json());

  app.get("/", (req, res) => {
    return res.json({ message: "Streamyst is up and running..." });
  });

  app.get("/health", (req, res) => {
    return res.json({ message: "Streamyst server is healthy", healthy: true });
  });

  logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
  app.get("/openapi.json", (req, res) => {
    return res.json(openApiDocument);
  });

  // Dynamic import to avoid ESM/CJS mismatch crash on Railway
  logger.debug(`docs: ${env.BASE_URL}/docs`);
  try {
    const { apiReference } = await import("@scalar/express-api-reference");
    app.use("/docs", apiReference({ url: "/openapi.json" }));
  } catch (err) {
    logger.warn("Failed to load @scalar/express-api-reference – /docs will be unavailable", { err });
  }


  /**
   * ─────────────────────────────────────────────────────────────────────────────
   * WHY THIS IS A RAW EXPRESS ENDPOINT AND NOT A tRPC PROCEDURE
   * ─────────────────────────────────────────────────────────────────────────────
   *
   * Every other API in this server is exposed through tRPC — this is the ONLY
   * intentional exception, and it exists for a fundamental technical reason:
   *
   * 1. STREAMING REQUIRES DIRECT ACCESS TO THE RAW NODE.js HTTP RESPONSE OBJECT
   *    tRPC procedures return a single serialised JSON value. The framework
   *    buffers the entire response in memory, serialises it, and sends it as one
   *    HTTP body. That design is perfect for JSON payloads but physically
   *    incompatible with chunked streaming:
   *      - We call `res.write()` repeatedly to push CSV rows as they arrive from
   *        the database, so the browser starts downloading immediately instead of
   *        waiting for every row to be fetched and buffered in RAM.
   *      - We call `res.end()` only after the last batch is written.
   *    tRPC gives no hook to do this — it controls the response lifecycle itself
   *    and there is no supported way to hand back a Node.js `ServerResponse` for
   *    mid-flight writes.
   *
   * 2. LARGE EXPORTS WOULD OOM THE SERVER IF HANDLED VIA tRPC
   *    Forms with thousands of responses would need to be loaded entirely into a
   *    JavaScript array, JSON-serialised, and held in memory before tRPC could
   *    send the response. Our streaming approach fetches rows in 100-row batches
   *    (`limit / offset` pagination), writes each batch to the socket, and
   *    discards it — keeping memory usage flat regardless of dataset size.
   *
   * 3. THE CONTENT-TYPE IS text/csv, NOT application/json
   *    tRPC always responds with `application/json`. A CSV download requires:
   *      - `Content-Type: text/csv`
   *      - `Content-Disposition: attachment; filename="..."` (triggers browser
   *        Save-As / download behaviour)
   *    These headers must be set before any body bytes are written. tRPC's
   *    response pipeline does not support overriding these headers.
   *
   * 4. AUTHENTICATION IS STILL ENFORCED — THIS IS NOT AN OPEN ENDPOINT
   *    We manually replicate the same JWT verification that tRPC's
   *    `protectedProcedure` performs: the session_token cookie (or Bearer header)
   *    is read, verified with `verifyJwt`, and the resulting userId is used to
   *    confirm the requesting user owns the form before any data is returned.
   *
   * 5. A COMPANION tRPC PROCEDURE STILL EXISTS FOR SMALL DATASETS
   *    `form.getResponsesForCsv` is a normal tRPC query that returns all answers
   *    as a JSON array. It is used by the client for in-memory CSV generation
   *    on small forms. This Express route is the scalable, streaming alternative
   *    used when the user clicks "Download CSV" in the Analytics tab.
   *
   * TL;DR — Streaming + custom HTTP headers + large-dataset memory safety are
   * three hard requirements that tRPC's architecture cannot satisfy. This single
   * Express GET route is the correct and intentional solution.
   * ─────────────────────────────────────────────────────────────────────────────
   */
  app.get("/api/forms/:formId/csv", async (req: any, res: any) => {
    try {
      const { formId } = req.params;
      let userId: string | null = null;

      // Check token from cookies or authorization header
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce(
          (acc: any, cookie: any) => {
            const [key, val] = cookie.trim().split("=");
            if (key && val) {
              acc[key] = decodeURIComponent(val);
            }
            return acc;
          },
          {} as Record<string, string>,
        );

        if (cookies.session_token) {
          const decoded = verifyJwt(cookies.session_token);
          if (decoded && decoded.userId) {
            userId = decoded.userId;
          }
        }
      }

      if (!userId) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const decoded = verifyJwt(token);
          if (decoded && decoded.userId) {
            userId = decoded.userId;
          }
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify form exists and belongs to the user
      const form = await db.query.formsTable.findFirst({
        where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
        with: {
          fields: {
            orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
          },
        },
      });

      if (!form) {
        return res.status(404).json({ error: "Form not found or unauthorized" });
      }

      // Set headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="responses-${form.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv"`,
      );

      // Escape CSV helper
      const escapeCSV = (val: any): string => {
        if (val === undefined || val === null) return "";
        let str = String(val);
        if (str.includes(",") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      // Write Headers
      const headers = ["Response ID", "Respondent Email", "Submitted At"];
      form.fields.forEach((f) => {
        headers.push(f.label);
      });
      res.write(headers.map(escapeCSV).join(",") + "\r\n");

      // Chunk pagination: fetch responses in batches and stream
      let limit = 100;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const responses = await db.query.responsesTable.findMany({
          where: and(eq(responsesTable.formId, formId), eq(responsesTable.completed, true)),
          orderBy: (responses, { desc }) => [desc(responses.submittedAt)],
          limit,
          offset,
          with: {
            answers: true,
          },
        });

        if (responses.length === 0) {
          hasMore = false;
          break;
        }

        for (const r of responses) {
          const row = [r.id, r.respondentEmail || "Anonymous", r.submittedAt.toISOString()];
          form.fields.forEach((f) => {
            const ans = r.answers.find((a) => a.fieldId === f.id)?.answer;
            if (ans === undefined || ans === null) {
              row.push("");
            } else if (Array.isArray(ans)) {
              row.push(ans.join(", "));
            } else {
              row.push(String(ans));
            }
          });
          res.write(row.map(escapeCSV).join(",") + "\r\n");
        }

        offset += limit;
        if (responses.length < limit) {
          hasMore = false;
        }
      }

      res.end();
    } catch (err) {
      logger.error("Error exporting CSV", { err });
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  });

  app.use(
    "/api",
    createOpenApiExpressMiddleware({
      router: serverRouter,
      createContext,
      onError({ error, path, type }) {
        logger.error(`[OpenAPI tRPC Error] ${type} at "${path}": ${error.message}`, {
          error,
          path,
          type,
        });
      },
    }),
  );

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: serverRouter,
      createContext,
      onError({ error, path, type }) {
        logger.error(`[tRPC Error] ${type} at "${path}": ${error.message}`, {
          error,
          path,
          type,
        });
      },
    }),
  );

  return app;
}

