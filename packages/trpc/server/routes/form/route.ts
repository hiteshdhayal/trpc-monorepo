import { z, zodUndefinedModel } from "../../schema";
import { formService } from "@repo/services/form/index";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";
import {
  formOutputSchema,
  getFormByIdOutputSchema,
  createFormInputSchema,
  updateFormInputSchema,
  updateFormFieldsInputSchema,
  startOrUpdateResponseInputSchema,
  submitResponseInputSchema,
} from "@repo/shared";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");

// Rate limit helper: sliding window in-memory maps (separate for partial vs final)
const submitLimits = new Map<string, Array<number>>();
const partialLimits = new Map<string, Array<number>>();
const SUBMIT_RATE_WINDOW = 10 * 60 * 1000; // 10 minutes
const SUBMIT_MAX_REQUESTS = 10; // 10 final submissions per IP per 10 minutes
const PARTIAL_RATE_WINDOW = 60 * 1000; // 1 minute
const PARTIAL_MAX_REQUESTS = 60; // 60 partial syncs per IP per minute

function extractIp(req: any): string {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0]!.trim();
  }
  return req?.ip || req?.connection?.remoteAddress || "unknown";
}

function checkRateLimit(ip: string | undefined, bucket: "submit" | "partial") {
  if (!ip || ip === "unknown") return;
  const now = Date.now();
  const limitsMap = bucket === "submit" ? submitLimits : partialLimits;
  const window = bucket === "submit" ? SUBMIT_RATE_WINDOW : PARTIAL_RATE_WINDOW;
  const max = bucket === "submit" ? SUBMIT_MAX_REQUESTS : PARTIAL_MAX_REQUESTS;

  let timestamps = limitsMap.get(ip) || [];
  timestamps = timestamps.filter((t) => now - t < window);
  if (timestamps.length >= max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Spam protection: Too many form submissions from this IP. Please try again later.",
    });
  }
  timestamps.push(now);
  limitsMap.set(ip, timestamps);
}

export const formRouter = router({
  getForms: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/"),
        tags: TAGS,
        summary: "List all forms for the authenticated user",
        description:
          "Returns all forms created by the currently authenticated user, ordered by creation date. Excludes archived forms by default.",
      },
    })
    .input(zodUndefinedModel)
    .output(z.array(formOutputSchema))
    .query(async ({ ctx }) => {
      return await formService.getForms(ctx.userId);
    }),

  getArchivedForms: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/archived"),
        tags: TAGS,
        summary: "List archived forms for the authenticated user",
        description:
          "Returns all archived (soft-deleted) forms for the currently authenticated user.",
      },
    })
    .input(zodUndefinedModel)
    .output(z.array(formOutputSchema))
    .query(async ({ ctx }) => {
      return await formService.getArchivedForms(ctx.userId);
    }),

  getPublicExploreForms: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/explore"),
        tags: TAGS,
        summary: "List all public forms for the explore gallery",
        description:
          "Returns all forms with status=published and visibility=public for the public gallery.",
      },
    })
    .input(zodUndefinedModel)
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string().nullable(),
          theme: z.string(),
          createdAt: z.date(),
          creatorName: z.string(),
          isPasswordProtected: z.boolean(),
        }),
      ),
    )
    .query(async () => {
      return await formService.getPublicExploreForms();
    }),

  getFormById: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{id}"),
        tags: TAGS,
        summary: "Get a form by ID or custom slug",
        description:
          "Returns a form with all its fields. Accepts either the UUID or custom slug as the id parameter. isPasswordProtected indicates if the form requires a password.",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(getFormByIdOutputSchema)
    .query(async ({ input, ctx }) => {
      return await formService.getFormById(input.id, ctx.userId ?? undefined);
    }),

  createForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/create"),
        tags: TAGS,
        summary: "Create a new form",
        description: "Creates a new form in draft state for the authenticated user.",
      },
    })
    .input(createFormInputSchema)
    .output(
      z.object({
        id: z.string(),
        creatorId: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        status: z.string(),
        visibility: z.string(),
        theme: z.string(),
        customSlug: z.string().nullable(),
        isArchived: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await formService.createForm(ctx.userId, input);
    }),

  updateForm: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/{id}/update"),
        tags: TAGS,
        summary: "Update a form's settings",
        description:
          "Updates form metadata including title, status, visibility, theme, custom slug, expiry, and response limit.",
      },
    })
    .input(updateFormInputSchema)
    .output(formOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return await formService.updateForm(ctx.userId, id, data);
    }),

  // --- Archiving ---

  archiveForm: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/{id}/archive"),
        tags: TAGS,
        summary: "Archive a form",
        description:
          "Soft-deletes a form by setting isArchived=true. The form and all its responses are preserved.",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await formService.archiveForm(ctx.userId, input.id);
    }),

  unarchiveForm: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/{id}/unarchive"),
        tags: TAGS,
        summary: "Unarchive a form",
        description: "Restores an archived form by setting isArchived=false.",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await formService.unarchiveForm(ctx.userId, input.id);
    }),

  // --- Password Protection ---

  setFormPassword: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/{id}/password"),
        tags: TAGS,
        summary: "Set a password on a form",
        description:
          "Protects a form with a password. Respondents must enter the correct password before seeing form fields.",
      },
    })
    .input(
      z.object({
        id: z.string(),
        password: z.string().min(4, "Password must be at least 4 characters"),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await formService.setFormPassword(ctx.userId, input.id, input.password);
    }),

  removeFormPassword: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/{id}/password"),
        tags: TAGS,
        summary: "Remove password protection from a form",
        description:
          "Removes the password requirement from a form, making it publicly accessible again.",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await formService.removeFormPassword(ctx.userId, input.id);
    }),

  verifyFormPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/{formId}/verify-password"),
        tags: TAGS,
        summary: "Verify a form access password",
        description: "Checks if the provided password is correct for a password-protected form.",
      },
    })
    .input(
      z.object({
        formId: z.string(),
        password: z.string(),
      }),
    )
    .output(z.object({ valid: z.boolean() }))
    .mutation(async ({ input }) => {
      return await formService.verifyFormPassword(input.formId, input.password);
    }),

  cloneForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/{id}/clone"),
        tags: TAGS,
        summary: "Clone an existing form",
        description:
          "Creates a copy of a form (as a draft in unlisted visibility) with all its fields duplicated. Password is NOT copied.",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        id: z.string(),
        creatorId: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        status: z.string(),
        visibility: z.string(),
        theme: z.string(),
        isArchived: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await formService.cloneForm(ctx.userId, input.id);
    }),

  deleteForm: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/{id}/delete"),
        tags: TAGS,
        summary: "Delete a form",
        description: "Permanently deletes a form and all its fields and responses (CASCADE).",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return await formService.deleteForm(ctx.userId, input.id);
    }),

  updateFormFields: protectedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: getPath("/{formId}/fields"),
        tags: TAGS,
        summary: "Update all fields for a form",
        description:
          "Atomically replaces all fields for a form in a single transaction. Blocked if the form has existing responses.",
      },
    })
    .input(updateFormFieldsInputSchema)
    .output(getFormByIdOutputSchema.shape.fields)
    .mutation(async ({ input, ctx }) => {
      return await formService.updateFormFields(ctx.userId, input.formId, input.fields);
    }),

  startOrUpdateResponse: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/{formId}/responses/start"),
        tags: TAGS,
        summary: "Start or update a partial form response",
        description:
          "Called on each question navigation. Creates a new partial response or updates an existing one. Includes honeypot and rate-limit spam protection.",
      },
    })
    .input(startOrUpdateResponseInputSchema)
    .output(
      z.object({
        responseId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Honeypot check: reject if filled
      if (input.honeypot) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Spam block: Bot submission detected.",
        });
      }

      // 2. Rate limiting check (partial sync uses separate bucket)
      const ip = extractIp(ctx.req);
      checkRateLimit(ip, "partial");

      const { honeypot, ...data } = input;
      return await formService.startOrUpdateResponse(input.formId, data);
    }),

  submitResponse: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/{formId}/responses/submit"),
        tags: TAGS,
        summary: "Submit a completed form response",
        description:
          "Marks a response as completed, saves all final answers, and triggers a thank-you email to the respondent and a notification email to the form creator.",
      },
    })
    .input(submitResponseInputSchema)
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Honeypot check: reject if filled
      if (input.honeypot) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Spam block: Bot submission detected.",
        });
      }

      // 2. Rate limiting check (final submit uses tight bucket)
      const ip = extractIp(ctx.req);
      checkRateLimit(ip, "submit");

      return await formService.submitResponse(input.formId, {
        responseId: input.responseId,
        answers: input.answers,
        respondentEmail: input.respondentEmail
          ? input.respondentEmail.trim().toLowerCase()
          : undefined,
      });
    }),

  getFormAnalytics: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{formId}/analytics"),
        tags: TAGS,
        summary: "Get form analytics",
        description:
          "Returns completion stats, drop-off funnel data per field, and choice distribution for select/checkbox fields.",
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(
      z.object({
        summary: z.object({
          totalResponses: z.number(),
          completedResponses: z.number(),
          completionRate: z.number(),
        }),
        funnel: z.array(
          z.object({
            fieldId: z.string(),
            label: z.string(),
            type: z.string(),
            reached: z.number(),
            dropped: z.number(),
            dropOffRate: z.number(),
          }),
        ),
        distributions: z.record(
          z.string(),
          z.array(
            z.object({
              option: z.string(),
              count: z.number(),
            }),
          ),
        ),
        timeline: z.array(
          z.object({
            date: z.string(),
            count: z.number(),
          }),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await formService.getFormAnalytics(ctx.userId, input.formId);
    }),

  getResponsesPaginated: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{formId}/responses"),
        tags: TAGS,
        summary: "Get paginated responses for a form",
        description:
          "Returns paginated individual responses with their answers and field labels. Supports completedOnly filter.",
      },
    })
    .input(
      z.object({
        formId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        completedOnly: z.boolean().default(true),
      }),
    )
    .output(
      z.object({
        fields: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            type: z.string(),
          }),
        ),
        responses: z.array(
          z.object({
            id: z.string(),
            respondentEmail: z.string().nullable(),
            completed: z.boolean(),
            submittedAt: z.date(),
            answers: z.array(
              z.object({
                fieldId: z.string(),
                answer: z.unknown(),
              }),
            ),
          }),
        ),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await formService.getResponsesPaginated(ctx.userId, input.formId, {
        page: input.page,
        limit: input.limit,
        completedOnly: input.completedOnly,
      });
    }),

  getResponsesForCsv: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{formId}/responses/csv"),
        tags: TAGS,
        summary: "Get all completed responses for CSV export",
        description:
          "Returns all completed responses with their answers formatted for CSV download. For streaming export, use the /api/forms/:formId/csv Express endpoint.",
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(
      z.object({
        fields: z.array(z.unknown()),
        responses: z.array(z.record(z.string(), z.string())),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await formService.getResponsesForCsv(ctx.userId, input.formId);
    }),
});
