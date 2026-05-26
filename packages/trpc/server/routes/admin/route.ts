import { z } from "../../schema";
import { adminService } from "@repo/services/admin/index";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Admin"];
const getPath = generatePath("/admin");

export const adminRouter = router({
  getSystemStats: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/stats"),
        tags: TAGS,
        summary: "Get platform-wide statistics",
        description: "Returns total counts for users, forms, and responses. Admin-only.",
      },
    })
    .input(z.undefined())
    .output(
      z.object({
        totalUsers: z.number(),
        totalForms: z.number(),
        totalResponses: z.number(),
        completedResponses: z.number(),
      })
    )
    .query(async () => {
      return await adminService.getSystemStats();
    }),

  getAllUsers: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/users"),
        tags: TAGS,
        summary: "List all users (paginated)",
        description: "Paginated list of all platform users with form counts. Admin-only.",
      },
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .output(
      z.object({
        users: z.array(
          z.object({
            id: z.string(),
            fullName: z.string(),
            email: z.string(),
            isAdmin: z.boolean(),
            createdAt: z.date().nullable(),
            formCount: z.number(),
          })
        ),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      })
    )
    .query(async ({ input }) => {
      return await adminService.getAllUsers(input.page, input.limit);
    }),

  getAllForms: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/forms"),
        tags: TAGS,
        summary: "List all forms (paginated)",
        description: "Paginated list of all forms across all creators. Admin-only.",
      },
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .output(
      z.object({
        forms: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            theme: z.string(),
            status: z.string(),
            visibility: z.string(),
            isArchived: z.boolean(),
            createdAt: z.date(),
            creatorName: z.string(),
            creatorEmail: z.string(),
            responseCount: z.number(),
          })
        ),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      })
    )
    .query(async ({ input }) => {
      return await adminService.getAllForms(input.page, input.limit);
    }),

  deleteUser: adminProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/users/{userId}"),
        tags: TAGS,
        summary: "Delete a user as admin",
        description: "Permanently deletes a user account and all their forms (CASCADE). Admin cannot self-delete.",
      },
    })
    .input(z.object({ userId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await adminService.deleteUser(ctx.userId, input.userId);
    }),

  deleteForm: adminProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/forms/{formId}"),
        tags: TAGS,
        summary: "Delete a form as admin",
        description: "Permanently deletes any form and all its responses. Admin-only.",
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      return await adminService.deleteForm(input.formId);
    }),
});
