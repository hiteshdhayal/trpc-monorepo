import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { ZodError } from "zod";

import { createContext } from "./context";
import { userService } from "@repo/services/user/index";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const isAuthed = tRPCContext.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated. Please log in." });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

export const protectedProcedure = tRPCContext.procedure.use(isAuthed);

export const isAdminMiddleware = tRPCContext.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated. Please log in." });
  }
  const isAdmin = await userService.isAdminUser(ctx.userId);
  if (!isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

export const adminProcedure = tRPCContext.procedure.use(isAdminMiddleware);
