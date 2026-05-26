import { describe, it, expect, beforeEach } from "vitest";
import { createTestCaller } from "./helpers/caller";
import { testDb } from "./helpers/db";
import { usersTable } from "@repo/database/schema";
import { eq } from "@repo/database";
import { TRPCError } from "@trpc/server";

describe("Form Submission Flow", () => {
  let authedCaller: ReturnType<typeof createTestCaller>;
  let publicCaller: ReturnType<typeof createTestCaller>;
  let formId: string;
  let fieldId: string;
  let selectFieldId: string;

  beforeEach(async () => {
    publicCaller = createTestCaller();

    // Setup an authenticated user
    await publicCaller.auth.register({
      name: "Submit Test User",
      email: "submit@example.com",
      password: "password123",
    });

    const users = await testDb.select().from(usersTable).where(eq(usersTable.email, "submit@example.com"));
    const userId = users[0]!.id;

    authedCaller = createTestCaller({ userId });

    // Create a form
    const form = await authedCaller.form.createForm({
      title: "Test Form",
      description: "A form for testing",
    });
    formId = form.id;

    // Add a required text field
    const field = await authedCaller.form.createField({
      formId,
      type: "short_text",
      label: "What is your name?",
      required: true,
      orderIndex: 0,
    });
    fieldId = field.id;

    // Add a single-select field
    const selectField = await authedCaller.form.createField({
      formId,
      type: "single_select",
      label: "Choose a color",
      required: true,
      orderIndex: 1,
      options: ["Red", "Green", "Blue"],
    });
    selectFieldId = selectField.id;

    // Publish the form
    await authedCaller.form.updateForm({
      id: formId,
      status: "published",
      customSlug: "test-slug",
    });
  });

  it("Submitting a valid response to a published public form succeeds", async () => {
    // 1. Start response
    const startRes = await publicCaller.form.startOrUpdateResponse({
      formId,
      fieldId,
      answer: "John Doe",
      respondentEmail: "johndoe@example.com",
    });

    expect(startRes.responseId).toBeDefined();

    // 2. Submit final response
    const submitRes = await publicCaller.form.submitResponse({
      formId,
      responseId: startRes.responseId,
      answers: [
        { fieldId, answer: "John Doe" },
        { fieldId: selectFieldId, answer: "Green" },
      ],
      respondentEmail: "johndoe@example.com",
    });

    expect(submitRes.success).toBe(true);
  });

  it("Submitting to an unpublished form returns a specific error", async () => {
    // Unpublish the form
    await authedCaller.form.updateForm({
      id: formId,
      status: "draft",
    });

    try {
      await publicCaller.form.startOrUpdateResponse({
        formId,
        fieldId,
        answer: "Test",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toContain("Form is not published");
      }
    }
  });

  it("Submitting with a missing required field returns a validation error", async () => {
    // Start response
    const startRes = await publicCaller.form.startOrUpdateResponse({
      formId,
      fieldId,
      answer: "John Doe",
    });

    // Submit but omit the required select field
    try {
      await publicCaller.form.submitResponse({
        formId,
        responseId: startRes.responseId,
        answers: [
          { fieldId, answer: "John Doe" },
          // Missing selectFieldId
        ],
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("Missing required field");
      }
    }
  });

  it("Submitting a fake fieldId that does not exist in the form schema returns an error", async () => {
    try {
      await publicCaller.form.startOrUpdateResponse({
        formId,
        fieldId: "00000000-0000-0000-0000-000000000000", // Fake UUID
        answer: "Hacked",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("Field not found");
      }
    }
  });

  it("Submitting an invalid option for a single-select field returns an error", async () => {
    const startRes = await publicCaller.form.startOrUpdateResponse({
      formId,
      fieldId,
      answer: "John Doe",
    });

    try {
      await publicCaller.form.submitResponse({
        formId,
        responseId: startRes.responseId,
        answers: [
          { fieldId, answer: "John Doe" },
          { fieldId: selectFieldId, answer: "Purple" }, // "Purple" is not in ["Red", "Green", "Blue"]
        ],
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("Invalid option selected");
      }
    }
  });

  it("Submitting to a nonexistent form slug returns a not-found error", async () => {
    try {
      await publicCaller.form.startOrUpdateResponse({
        formId: "nonexistent-slug",
        fieldId,
        answer: "Test",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toContain("Form not found");
      }
    }
  });
});
