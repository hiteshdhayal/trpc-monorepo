import { serverRouter } from "@repo/trpc/server";

import type { Request, Response } from "express";

export function createTestCaller(session: { userId?: string } = {}) {
  // Mock extractIp for rate limiter to avoid undefined errors
  const req = {
    ip: "127.0.0.1",
    headers: { "x-forwarded-for": "127.0.0.1" },
    connection: { remoteAddress: "127.0.0.1" }
  } as unknown as Request;

  const res = {} as unknown as Response;

  // Create a context similar to what createContext would return
  const ctx = {
    userId: session.userId || null,
    req,
    res,
  };

  return serverRouter.createCaller(ctx);
}
