/**
 * CSRF Protection — Double-Submit Cookie Pattern
 *
 * Why this approach?
 *  - Our frontend is a separate origin (Vercel) from the backend (Railway).
 *  - Cookies are sent with `credentials: "include"` from the frontend.
 *  - A malicious third-party site cannot READ our `csrf_token` cookie because of
 *    the Same-Origin Policy, so it cannot forge a matching X-CSRF-Token header.
 *
 * Flow:
 *  1. Any GET to the backend sets a `csrf_token` cookie (non-httpOnly, so JS can read it).
 *  2. On state-changing requests (POST/PUT/PATCH/DELETE), the middleware validates that
 *     the `X-CSRF-Token` header matches the `csrf_token` cookie value.
 *  3. Excluded: OAuth callbacks, health checks, and public webhooks.
 *
 * Frontend integration:
 *  - The trpc client (create-client.ts) reads the cookie and attaches the header automatically.
 */

import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/** Routes excluded from CSRF validation (OAuth callbacks, health, public webhooks). */
const EXCLUDED_PATHS = [
  "/auth/google/callback",
  "/health",
  "/",
  "/openapi.json",
  "/docs",
];

function isExcluded(path: string): boolean {
  return EXCLUDED_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      if (key) acc[key.trim()] = decodeURIComponent(rest.join("="));
      return acc;
    },
    {} as Record<string, string>,
  );
}

/** Generate a cryptographically secure CSRF token. */
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * CSRF middleware.
 *
 * - Sets `csrf_token` cookie on all responses (if not already set).
 * - Validates `X-CSRF-Token` header on mutating requests.
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  const cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {};
  const isProduction = process.env.NODE_ENV === "production";

  // Ensure the CSRF cookie is set (non-httpOnly so frontend JS can read it)
  let csrfToken = cookies[CSRF_COOKIE_NAME];
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,          // Must be readable by JavaScript
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  }

  // Only validate on state-changing methods
  const isStateMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!isStateMutating || isExcluded(req.path)) {
    next();
    return;
  }

  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!headerToken || headerToken !== csrfToken) {
    res.status(403).json({ error: "Invalid or missing CSRF token." });
    return;
  }

  next();
}
