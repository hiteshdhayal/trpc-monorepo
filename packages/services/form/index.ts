import { db, eq, and, or, desc, count, inArray, sql, ilike } from "@repo/database";
import {
  formsTable,
  formFieldsTable,
  responsesTable,
  responseAnswersTable,
  usersTable,
} from "@repo/database/schema";
import { TRPCError } from "@trpc/server";
import { emailService } from "../email/index";
import { hashPassword, verifyPassword } from "../user/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip HTML tags and trim whitespace to prevent Stored XSS */
function sanitizeString(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

/** Sanitize an answer value based on field type */
function sanitizeAnswer(type: string, value: any): any {
  if (value === null || value === undefined) return value;
  switch (type) {
    case "short_text":
    case "long_text":
    case "email":
      return typeof value === "string" ? sanitizeString(value) : value;
    case "checkbox":
      return Array.isArray(value)
        ? value.map((v: any) => (typeof v === "string" ? sanitizeString(v) : v))
        : value;
    default:
      return value;
  }
}

/** Validate a field answer against its validationRules */
function validateFieldAnswer(
  field: { type: string; label: string; required: boolean; validationRules: any },
  answer: any
): void {
  // Fix 6: Server-side email format validation for email fields
  if (field.type === "email" && answer && typeof answer === "string" && answer.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(answer)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `"${field.label}" must be a valid email address.`,
      });
    }
  }

  const rules = field.validationRules as {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  } | null;

  if (!rules) return;

  if (field.type === "short_text" || field.type === "long_text") {
    const val = typeof answer === "string" ? answer : "";
    if (rules.minLength !== undefined && val.length < rules.minLength) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `"${field.label}" must be at least ${rules.minLength} characters.`,
      });
    }
    if (rules.maxLength !== undefined && val.length > rules.maxLength) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `"${field.label}" must be at most ${rules.maxLength} characters.`,
      });
    }
    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(val)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `"${field.label}" does not match the required format.`,
        });
      }
    }
  }

  if (field.type === "number") {
    const num = Number(answer);
    if (!isNaN(num)) {
      if (rules.min !== undefined && num < rules.min) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `"${field.label}" must be at least ${rules.min}.`,
        });
      }
      if (rules.max !== undefined && num > rules.max) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `"${field.label}" must be at most ${rules.max}.`,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// FormService
// ---------------------------------------------------------------------------

export class FormService {
  // --- Form CRUD ---

  public async getForms(userId: string, includeArchived = false) {
    const conditions = [eq(formsTable.creatorId, userId)];
    if (!includeArchived) {
      conditions.push(eq(formsTable.isArchived, false));
    }
    return db
      .select()
      .from(formsTable)
      .where(and(...conditions))
      .orderBy(desc(formsTable.createdAt));
  }

  public async getArchivedForms(userId: string) {
    return db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.creatorId, userId), eq(formsTable.isArchived, true)))
      .orderBy(desc(formsTable.updatedAt));
  }

  public async getPublicExploreForms() {
    try {
      const forms = await db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          description: formsTable.description,
          theme: formsTable.theme,
          createdAt: formsTable.createdAt,
          creatorName: usersTable.fullName,
          passwordHash: formsTable.passwordHash,
        })
        .from(formsTable)
        .innerJoin(usersTable, eq(formsTable.creatorId, usersTable.id))
        .where(
          and(
            eq(formsTable.status, "published"),
            eq(formsTable.visibility, "public"),
            eq(formsTable.isArchived, false)
          )
        )
        .orderBy(desc(formsTable.createdAt));
        
      return forms.map(form => ({
        id: form.id,
        title: form.title,
        description: form.description,
        theme: form.theme,
        createdAt: form.createdAt,
        creatorName: form.creatorName,
        isPasswordProtected: form.passwordHash !== null,
      }));
    } catch (error: any) {
      console.error("[FormService] getPublicExploreForms error:", error);
      // Return empty array instead of 500 error if DB is down or query fails
      return [];
    }
  }

  /** Fix: single OR query instead of two sequential queries */
  public async getFormById(formId: string, userId?: string) {
    const form = await db.query.formsTable.findFirst({
      where: or(eq(formsTable.id, formId), eq(formsTable.customSlug, formId)),
      with: {
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
        },
      },
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    const verified = this.verifyFormAccess(form, userId);

    // Never expose the passwordHash to clients — convert to isPasswordProtected flag
    const { passwordHash, ...safeForm } = verified as any;
    return {
      ...safeForm,
      isPasswordProtected: passwordHash !== null && passwordHash !== undefined,
    };
  }

  private verifyFormAccess(form: any, userId?: string) {
    // If owner, let them access
    if (userId && form.creatorId === userId) {
      return form;
    }

    // Fix: use NOT_FOUND instead of UNAUTHORIZED for public respondents
    if (form.status === "draft") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Form not found.",
      });
    }

    if (form.isArchived) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Form not found.",
      });
    }

    return form;
  }

  public async createForm(
    userId: string,
    data: { title: string; description?: string; theme?: string; visibility?: string }
  ) {
    const [newForm] = await db
      .insert(formsTable)
      .values({
        creatorId: userId,
        title: data.title,
        description: data.description || "",
        theme: data.theme || "default",
        visibility: data.visibility || "public",
        status: "draft",
      })
      .returning();

    if (!newForm) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create form." });
    }

    return newForm;
  }

  public async updateForm(
    userId: string,
    formId: string,
    data: {
      title?: string;
      description?: string;
      status?: "draft" | "published" | "closed";
      visibility?: "public" | "unlisted";
      theme?: string;
      customSlug?: string | null;
      expiryDate?: Date | null;
      responseLimit?: number | null;
    }
  ) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or unauthorized" });
    }

    // If setting custom slug, verify uniqueness
    if (data.customSlug && data.customSlug !== form.customSlug) {
      const existing = await db.query.formsTable.findFirst({
        where: eq(formsTable.customSlug, data.customSlug),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Custom URL slug is already taken.",
        });
      }
    }

    const [updatedForm] = await db
      .update(formsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(formsTable.id, formId))
      .returning();

    if (!updatedForm) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update form." });
    }

    return updatedForm;
  }

  // --- Form Archiving ---

  public async archiveForm(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or unauthorized" });
    }

    await db
      .update(formsTable)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(formsTable.id, formId));

    return { success: true };
  }

  public async unarchiveForm(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or unauthorized" });
    }

    await db
      .update(formsTable)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(eq(formsTable.id, formId));

    return { success: true };
  }

  // --- Password Protection ---

  public async setFormPassword(userId: string, formId: string, password: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or unauthorized" });
    }

    const hashed = hashPassword(password);

    await db
      .update(formsTable)
      .set({ passwordHash: hashed, updatedAt: new Date() })
      .where(eq(formsTable.id, formId));

    return { success: true };
  }

  public async removeFormPassword(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or unauthorized" });
    }

    await db
      .update(formsTable)
      .set({ passwordHash: null, updatedAt: new Date() })
      .where(eq(formsTable.id, formId));

    return { success: true };
  }

  public async verifyFormPassword(formId: string, password: string) {
    const form = await db.query.formsTable.findFirst({
      where: or(eq(formsTable.id, formId), eq(formsTable.customSlug, formId)),
    });

    if (!form || !form.passwordHash) {
      // Form not password-protected or doesn't exist — return valid: true so the form renders
      return { valid: true };
    }

    const isValid = verifyPassword(password, form.passwordHash);
    return { valid: isValid };
  }

  public async cloneForm(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: eq(formsTable.id, formId),
      with: { fields: true },
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    const [cloned] = await db
      .insert(formsTable)
      .values({
        creatorId: userId,
        title: `Copy of ${form.title}`,
        description: form.description,
        theme: form.theme,
        visibility: "unlisted",
        status: "draft",
        // Never copy the password hash — cloned forms start unprotected
        passwordHash: null,
        isArchived: false,
      })
      .returning();

    if (!cloned) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to clone form." });
    }

    if (form.fields && form.fields.length > 0) {
      const clonedFields = form.fields.map((f) => ({
        formId: cloned.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        required: f.required,
        orderIndex: f.orderIndex,
        options: f.options,
        validationRules: f.validationRules,
        conditionalLogic: f.conditionalLogic,
      }));
      await db.insert(formFieldsTable).values(clonedFields);
    }

    return cloned;
  }

  public async deleteForm(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or unauthorized" });
    }

    await db.delete(formsTable).where(eq(formsTable.id, formId));
    return { success: true };
  }

  // --- Field Config (Strict rules for published forms with responses) ---

  public async updateFormFields(
    userId: string,
    formId: string,
    fields: Array<{
      id?: string;
      type: string;
      label: string;
      placeholder?: string | null;
      required: boolean;
      orderIndex: number;
      options?: any;
      validationRules?: any;
      conditionalLogic?: any;
    }>
  ) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    // Check if the form is published and already has submissions
    if (form.status === "published" || form.status === "closed") {
      const responseCount = await db
        .select({ count: count() })
        .from(responsesTable)
        .where(eq(responsesTable.formId, formId));

      if (responseCount[0] && responseCount[0].count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "This form is published and already has responses. To avoid corruption, fields cannot be modified. Unpublish or duplicate the form to edit fields.",
        });
      }
    }

    // In a transaction, delete old fields and insert new ones
    await db.transaction(async (tx) => {
      await tx.delete(formFieldsTable).where(eq(formFieldsTable.formId, formId));

      if (fields.length > 0) {
        const valuesToInsert = fields.map((f) => ({
          formId,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          required: f.required,
          orderIndex: f.orderIndex,
          options: f.options || null,
          validationRules: f.validationRules || null,
          conditionalLogic: f.conditionalLogic || null,
        }));
        await tx.insert(formFieldsTable).values(valuesToInsert);
      }
    });

    return db.query.formFieldsTable.findMany({
      where: eq(formFieldsTable.formId, formId),
      orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
    });
  }

  // --- Response Submission & Drop-offs ---

  public async startOrUpdateResponse(
    formId: string,
    data: {
      responseId?: string;
      fieldId: string;
      answer: any;
      respondentEmail?: string;
      deviceToken?: string;
    }
  ) {
    const form = await db.query.formsTable.findFirst({
      where: eq(formsTable.id, formId),
      with: { fields: true },
    });

    if (!form || form.status !== "published") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Form is not accepting responses." });
    }

    // Enforce limits and expiry
    if (form.expiryDate && new Date() > form.expiryDate) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This form has expired." });
    }
    if (form.responseLimit) {
      const current = await db
        .select({ count: count() })
        .from(responsesTable)
        .where(and(eq(responsesTable.formId, formId), eq(responsesTable.completed, true)));
      if (current[0] && current[0].count >= form.responseLimit) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This form has reached its response limit." });
      }
    }

    // Sanitize & validate answer
    const fieldDef = form.fields.find((f) => f.id === data.fieldId);
    const sanitizedAnswer = fieldDef
      ? sanitizeAnswer(fieldDef.type, data.answer)
      : data.answer;
    if (fieldDef) {
      validateFieldAnswer(fieldDef, sanitizedAnswer);
    }

    let responseId = data.responseId;

    return await db.transaction(async (tx) => {
      if (!responseId) {
        // Enforce duplicate prevention by email
        if (data.respondentEmail) {
          const duplicate = await tx.query.responsesTable.findFirst({
            where: and(
              eq(responsesTable.formId, formId),
              eq(responsesTable.respondentEmail, data.respondentEmail),
              eq(responsesTable.completed, true)
            ),
          });
          if (duplicate) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You have already submitted a response to this form.",
            });
          }
        }

        const [newRes] = await tx
          .insert(responsesTable)
          .values({
            formId,
            completed: false,
            respondentEmail: data.respondentEmail || null,
            respondentDeviceToken: data.deviceToken || null,
            lastAnsweredFieldId: data.fieldId,
          })
          .returning();
        if (!newRes) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create response." });
        }
        responseId = newRes.id;
      } else {
        await tx
          .update(responsesTable)
          .set({
            lastAnsweredFieldId: data.fieldId,
            respondentEmail: data.respondentEmail || undefined,
            respondentDeviceToken: data.deviceToken || undefined,
          })
          .where(eq(responsesTable.id, responseId));
      }

      // Upsert answer for this field
      const existingAnswer = await tx.query.responseAnswersTable.findFirst({
        where: and(
          eq(responseAnswersTable.responseId, responseId),
          eq(responseAnswersTable.fieldId, data.fieldId)
        ),
      });

      if (existingAnswer) {
        await tx
          .update(responseAnswersTable)
          .set({ answer: sanitizedAnswer })
          .where(eq(responseAnswersTable.id, existingAnswer.id));
      } else {
        await tx.insert(responseAnswersTable).values({
          responseId: responseId!,
          fieldId: data.fieldId,
          answer: sanitizedAnswer,
        });
      }

      return { responseId };
    });
  }

  public async submitResponse(
    formId: string,
    data: {
      responseId: string;
      answers: Array<{ fieldId: string; answer: any }>;
      respondentEmail?: string;
    }
  ) {
    const form = await db.query.formsTable.findFirst({
      where: eq(formsTable.id, formId),
      with: {
        fields: true,
        creator: true,
      },
    } as any);

    if (!form || form.status !== "published") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Form is not accepting responses." });
    }

    // Fix 5: Server-side required field enforcement
    const answerMap = new Map(data.answers.map((a) => [a.fieldId, a.answer]));
    for (const field of (form as any).fields) {
      if (field.required) {
        const val = answerMap.get(field.id);
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Missing required field: "${field.label}"`,
          });
        }
      }
    }

    // Sanitize and validate all answers
    const sanitizedAnswers = data.answers.map((item) => {
      const fieldDef = (form as any).fields.find((f: any) => f.id === item.fieldId);
      const sanitized = fieldDef
        ? sanitizeAnswer(fieldDef.type, item.answer)
        : item.answer;
      if (fieldDef && sanitized !== null && sanitized !== undefined && sanitized !== "") {
        validateFieldAnswer(fieldDef, sanitized);
      }
      return { fieldId: item.fieldId, answer: sanitized };
    });

    await db.transaction(async (tx) => {
      // Update response metadata to completed
      await tx
        .update(responsesTable)
        .set({
          completed: true,
          respondentEmail: data.respondentEmail || undefined,
          submittedAt: new Date(),
        })
        .where(eq(responsesTable.id, data.responseId));

      // Fix N+1: batch-fetch all existing answers for this response in one query
      const answerFieldIds = sanitizedAnswers.map((a) => a.fieldId);
      const existingAnswers = answerFieldIds.length > 0
        ? await tx
            .select()
            .from(responseAnswersTable)
            .where(
              and(
                eq(responseAnswersTable.responseId, data.responseId),
                inArray(responseAnswersTable.fieldId, answerFieldIds)
              )
            )
        : [];

      const existingAnswerMap = new Map(
        existingAnswers.map((a) => [a.fieldId, a])
      );

      // Save answers using the pre-fetched map
      for (const item of sanitizedAnswers) {
        const existing = existingAnswerMap.get(item.fieldId);
        if (existing) {
          await tx
            .update(responseAnswersTable)
            .set({ answer: item.answer })
            .where(eq(responseAnswersTable.id, existing.id));
        } else {
          await tx.insert(responseAnswersTable).values({
            responseId: data.responseId,
            fieldId: item.fieldId,
            answer: item.answer,
          });
        }
      }
    });

    // Send thank-you email to respondent (non-blocking)
    if (data.respondentEmail) {
      const answerLabels = sanitizedAnswers.map((a) => {
        const field = (form as any).fields.find((f: any) => f.id === a.fieldId);
        return { label: field?.label ?? a.fieldId, answer: a.answer };
      });
      emailService
        .sendThankYou(data.respondentEmail, form.title, answerLabels)
        .catch((err) => console.error("[FormService] Failed to send thank-you email:", err));
    }

    // [Feature 1] Send creator notification email (non-blocking)
    const creator = (form as any).creator;
    if (creator?.email) {
      emailService
        .sendNewResponseNotification(creator.email, form.title, data.respondentEmail)
        .catch((err) => console.error("[FormService] Failed to send creator notification email:", err));
    }

    return { success: true };
  }

  // --- Paginated Response Viewer ---

  public async getResponsesPaginated(
    userId: string,
    formId: string,
    options: {
      page: number;
      limit: number;
      completedOnly: boolean;
    }
  ) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
      with: {
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
        },
      },
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    const { page, limit, completedOnly } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(responsesTable.formId, formId)];
    if (completedOnly) {
      conditions.push(eq(responsesTable.completed, true));
    }

    const [totalRes, responses] = await Promise.all([
      db
        .select({ count: count() })
        .from(responsesTable)
        .where(and(...conditions)),
      db.query.responsesTable.findMany({
        where: and(...conditions),
        orderBy: [desc(responsesTable.submittedAt)],
        limit,
        offset,
        with: { answers: true },
      }),
    ]);

    const total = totalRes[0]?.count ?? 0;

    return {
      fields: form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
      })),
      responses: responses.map((r) => ({
        id: r.id,
        respondentEmail: r.respondentEmail,
        completed: r.completed,
        submittedAt: r.submittedAt,
        answers: r.answers.map((a) => ({
          fieldId: a.fieldId,
          answer: a.answer,
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --- Analytics & Aggregations (DB Level) ---

  public async getFormAnalytics(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
      with: { fields: true },
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    // Fix: parallelize the four independent aggregate queries
    const [totalResponsesRes, completedResponsesRes, partialResponses, timelineRaw] = await Promise.all([
      db
        .select({ count: count() })
        .from(responsesTable)
        .where(eq(responsesTable.formId, formId)),
      db
        .select({ count: count() })
        .from(responsesTable)
        .where(and(eq(responsesTable.formId, formId), eq(responsesTable.completed, true))),
      db
        .select({
          lastAnsweredFieldId: responsesTable.lastAnsweredFieldId,
          count: count(),
        })
        .from(responsesTable)
        .where(and(eq(responsesTable.formId, formId), eq(responsesTable.completed, false)))
        .groupBy(responsesTable.lastAnsweredFieldId),
      db
        .select({
          date: sql<string>`date_trunc('day', ${responsesTable.submittedAt})::date`,
          count: count(),
        })
        .from(responsesTable)
        .where(and(eq(responsesTable.formId, formId), eq(responsesTable.completed, true)))
        .groupBy(sql`date_trunc('day', ${responsesTable.submittedAt})`)
        .orderBy(sql`date_trunc('day', ${responsesTable.submittedAt})`),
    ]);

    const total = totalResponsesRes[0]?.count ?? 0;
    const completed = completedResponsesRes[0]?.count ?? 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Process timeline data
    const timeline = timelineRaw.map((row) => {
      let dateStr = "";
      const rawDate = row.date as unknown;
      if (rawDate instanceof Date) {
        dateStr = rawDate.toISOString().split("T")[0]!;
      } else if (typeof rawDate === "string") {
        dateStr = rawDate.split("T")[0]!;
      } else {
        dateStr = String(row.date);
      }
      return {
        date: dateStr,
        count: row.count,
      };
    });

    // 2. Drop-off Funnel Chart Data
    const dropOffData = [];
    let accumulativeReaches = completed;

    const sortedFields = [...form.fields].sort((a, b) => a.orderIndex - b.orderIndex);

    for (let i = sortedFields.length - 1; i >= 0; i--) {
      const field = sortedFields[i];
      const dropOffCount = partialResponses.find((pr) => pr.lastAnsweredFieldId === field!.id)?.count ?? 0;
      accumulativeReaches += dropOffCount;
      dropOffData.unshift({
        fieldId: field!.id,
        label: field!.label,
        type: field!.type,
        reached: accumulativeReaches,
        dropped: dropOffCount,
        dropOffRate: accumulativeReaches > 0 ? Math.round((dropOffCount / accumulativeReaches) * 100) : 0,
      });
    }

    // 3. Option distribution analysis for selects/checkboxes
    const choiceDistributions: Record<string, Array<{ option: string; count: number }>> = {};

    const selectFields = form.fields.filter((f) => f.type === "select" || f.type === "checkbox");
    if (selectFields.length > 0) {
      const fieldIds = selectFields.map((f) => f.id);
      const answers = await db
        .select({
          fieldId: responseAnswersTable.fieldId,
          answer: responseAnswersTable.answer,
        })
        .from(responseAnswersTable)
        .innerJoin(responsesTable, eq(responseAnswersTable.responseId, responsesTable.id))
        .where(
          and(
            inArray(responseAnswersTable.fieldId, fieldIds),
            eq(responsesTable.completed, true)
          )
        );

      for (const field of selectFields) {
        const counts: Record<string, number> = {};
        const opts = (field.options as Array<{ label: string; value: string }>) || [];
        opts.forEach((o) => {
          counts[o.value || o.label] = 0;
        });

        const fieldAnswers = answers.filter((a) => a.fieldId === field.id);
        for (const fa of fieldAnswers) {
          const ans = fa.answer;
          if (Array.isArray(ans)) {
            ans.forEach((val) => {
              counts[val] = (counts[val] || 0) + 1;
            });
          } else if (typeof ans === "string") {
            counts[ans] = (counts[ans] || 0) + 1;
          }
        }

        choiceDistributions[field.id] = Object.entries(counts).map(([option, count]) => ({
          option,
          count,
        }));
      }
    }

    return {
      summary: {
        totalResponses: total,
        completedResponses: completed,
        completionRate,
      },
      funnel: dropOffData,
      distributions: choiceDistributions,
      timeline,
    };
  }

  // --- CSV Streaming Export ---
  public async getResponsesForCsv(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)),
      with: {
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
        },
      },
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    // Fetch all completed responses and their answers
    const responses = await db.query.responsesTable.findMany({
      where: and(eq(responsesTable.formId, formId), eq(responsesTable.completed, true)),
      orderBy: [desc(responsesTable.submittedAt)],
      with: {
        answers: true,
      },
    });

    return {
      fields: form.fields,
      responses: responses.map((r) => {
        const row: Record<string, string> = {
          "Response ID": r.id,
          "Respondent Email": r.respondentEmail || "Anonymous",
          "Submitted At": r.submittedAt.toISOString(),
        };

        form.fields.forEach((f) => {
          const ans = r.answers.find((a) => a.fieldId === f.id)?.answer;
          if (ans === undefined || ans === null) {
            row[f.label] = "";
          } else if (Array.isArray(ans)) {
            row[f.label] = ans.join(", ");
          } else {
            row[f.label] = String(ans);
          }
        });

        return row;
      }),
    };
  }
}

export const formService = new FormService();
export default FormService;
