/**
 * In-memory sliding window rate limiter.
 *
 * Security rationale:
 *  - forgotPassword: 5 req/hr/IP — prevents brute-force email enumeration via timing
 *  - resetPassword:  10 req/hr/IP — prevents token brute-force attacks
 *
 * This is intentionally a simple in-memory store. For multi-instance deployments,
 * replace the Map with a Redis-backed store (e.g., rate-limiter-flexible package).
 *
 * Entries are automatically pruned to prevent unbounded memory growth.
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/** Return (or create) the per-route tracking map. */
function getStore(routeKey: string): Map<string, RateLimitEntry> {
  if (!stores.has(routeKey)) {
    stores.set(routeKey, new Map());
  }
  return stores.get(routeKey)!;
}

/** Prune entries older than the window to prevent memory bloat. */
function pruneStore(store: Map<string, RateLimitEntry>, windowMs: number): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= windowMs) {
      store.delete(key);
    }
  }
}

/**
 * Creates an IP-based rate limiting middleware.
 *
 * @param routeKey   Unique identifier for this rate limit store (e.g. "forgot-password")
 * @param maxRequests Maximum number of requests allowed per window
 * @param windowMs   Window duration in milliseconds
 */
export function createRateLimiter(
  routeKey: string,
  maxRequests: number,
  windowMs: number,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Honour X-Forwarded-For set by Railway/Vercel (trust proxy enabled in server.ts)
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";

    const store = getStore(routeKey);
    const now = Date.now();

    // Prune stale entries occasionally (every 50 requests to the store)
    if (store.size % 50 === 0) pruneStore(store, windowMs);

    const entry = store.get(ip);

    if (!entry || now - entry.windowStart >= windowMs) {
      // New window — reset counter
      store.set(ip, { count: 1, windowStart: now });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    entry.count++;
    next();
  };
}

// Pre-built limiters matching the security spec
export const forgotPasswordRateLimiter = createRateLimiter(
  "forgot-password",
  5,           // 5 requests
  60 * 60 * 1000, // per hour
);

export const resetPasswordRateLimiter = createRateLimiter(
  "reset-password",
  10,          // 10 requests
  60 * 60 * 1000, // per hour
);

/** General auth limiter — applied to login & register to prevent brute force */
export const authRateLimiter = createRateLimiter(
  "auth-general",
  20,           // 20 requests
  60 * 60 * 1000, // per hour
);
