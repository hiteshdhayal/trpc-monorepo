import { z } from "zod";

export const formOutputSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  visibility: z.string(),
  theme: z.string(),
  customSlug: z.string().nullable(),
  expiryDate: z.date().nullable(),
  responseLimit: z.number().nullable(),
  isArchived: z.boolean(),
  isPasswordProtected: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FormOutput = z.infer<typeof formOutputSchema>;

export const formFieldSchema = z.object({
  id: z.string(),
  formId: z.string(),
  type: z.string(),
  label: z.string(),
  placeholder: z.string().nullable(),
  required: z.boolean(),
  orderIndex: z.number(),
  options: z.unknown().nullable(),
  validationRules: z.unknown().nullable(),
  conditionalLogic: z.unknown().nullable(),
  createdAt: z.date(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const getFormByIdOutputSchema = formOutputSchema.extend({
  fields: z.array(formFieldSchema),
});

export type GetFormByIdOutput = z.infer<typeof getFormByIdOutputSchema>;

export const createFormInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  theme: z.string().optional(),
  visibility: z.enum(["public", "unlisted"]).optional(),
});

export type CreateFormInput = z.infer<typeof createFormInputSchema>;

export const updateFormInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  visibility: z.enum(["public", "unlisted"]).optional(),
  theme: z.string().optional(),
  customSlug: z.string().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  responseLimit: z.number().optional().nullable(),
});

export type UpdateFormInput = z.infer<typeof updateFormInputSchema>;

export const updateFormFieldsInputSchema = z.object({
  formId: z.string(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      type: z.string(),
      label: z.string(),
      placeholder: z.string().optional().nullable(),
      required: z.boolean(),
      orderIndex: z.number(),
      options: z.unknown().optional().nullable(),
      validationRules: z.unknown().optional().nullable(),
      conditionalLogic: z.unknown().optional().nullable(),
    })
  ),
});

export type UpdateFormFieldsInput = z.infer<typeof updateFormFieldsInputSchema>;

export const startOrUpdateResponseInputSchema = z.object({
  formId: z.string(),
  responseId: z.string().optional(),
  fieldId: z.string(),
  answer: z.unknown(),
  respondentEmail: z.string().optional(),
  deviceToken: z.string().optional(),
  honeypot: z.string().optional(),
});

export type StartOrUpdateResponseInput = z.infer<typeof startOrUpdateResponseInputSchema>;

export const submitResponseInputSchema = z.object({
  formId: z.string(),
  responseId: z.string(),
  answers: z.array(
    z.object({
      fieldId: z.string(),
      answer: z.unknown(),
    })
  ),
  respondentEmail: z.string().optional(),
  honeypot: z.string().optional(),
});

export type SubmitResponseInput = z.infer<typeof submitResponseInputSchema>;
