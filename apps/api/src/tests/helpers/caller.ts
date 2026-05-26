import { serverRouter } from "@repo/trpc/server";

export function createTestCaller(session: { userId?: string } = {}) {
  // Create a context similar to what createContext would return
  const ctx = {
    userId: session.userId || null,
    req: {} as any, // Mock req if needed by rate limiters (which extract IP)
    res: {} as any, // Mock res if needed
  };

  // Mock extractIp for rate limiter to avoid undefined errors
  ctx.req.ip = "127.0.0.1";
  ctx.req.headers = { "x-forwarded-for": "127.0.0.1" };

  return serverRouter.createCaller(ctx);
}
