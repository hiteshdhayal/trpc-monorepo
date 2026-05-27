import * as trpcExpress from "@trpc/server/adapters/express";
import { verifyJwt } from "@repo/services/user/auth";

export async function createContext({ req, res }: trpcExpress.CreateExpressContextOptions) {
  let userId: string | null = null;

  // 1. Parse cookie header manually for cookies
  // Use cookie-parser's populated req.cookies object
  const cookies = req?.cookies || {};
  if (cookies.session_token) {
    const decoded = verifyJwt(cookies.session_token);
    if (decoded && decoded.userId) {
      userId = decoded.userId;
    }
  }

  // 2. Fall back to Authorization header
  if (!userId) {
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyJwt(token);
      if (decoded && decoded.userId) {
        userId = decoded.userId;
      }
    }
  }

  return {
    userId,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
