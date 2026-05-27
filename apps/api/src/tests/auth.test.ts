import { describe, it, expect } from "vitest";
import { createTestCaller } from "./helpers/caller";
import { testDb } from "./helpers/db";
import { usersTable } from "@repo/database/schema";
import { eq } from "@repo/database";
import { TRPCError } from "@trpc/server";

describe("Authentication Flow", () => {
  it("Register with valid email and password succeeds and returns a session", async () => {
    console.log("=== DEBUG ENV ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("TEST_DATABASE_URL:", process.env.TEST_DATABASE_URL);
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("=================");
    const caller = createTestCaller();
    const result = await caller.auth.register({
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.fullName).toBe("Test User");

    // Verify user is in DB
    const users = await testDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "test@example.com"));
    expect(users.length).toBe(1);
    expect(users[0]?.fullName).toBe("Test User");
  });

  it("Register with duplicate email returns a proper error", async () => {
    const caller = createTestCaller();

    // First registration
    await caller.auth.register({
      fullName: "Test User 1",
      email: "duplicate@example.com",
      password: "password123",
    });

    // Second registration with same email
    try {
      await caller.auth.register({
        fullName: "Test User 2",
        email: "duplicate@example.com",
        password: "password456",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("CONFLICT");
        expect(error.message).toContain("already exists");
      }
    }
  });

  it("Login with correct credentials returns session", async () => {
    const caller = createTestCaller();

    // Create user first
    await caller.auth.register({
      fullName: "Login Test",
      email: "login@example.com",
      password: "correctpassword",
    });

    // Manually verify user's email in DB to allow login
    await testDb
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.email, "login@example.com"));

    // Attempt login
    const result = await caller.auth.login({
      email: "login@example.com",
      password: "correctpassword",
    });

    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("login@example.com");
  });

  it("Login with wrong password returns unauthorized error", async () => {
    const caller = createTestCaller();

    // Create user first
    await caller.auth.register({
      fullName: "Login Fail Test",
      email: "loginfail@example.com",
      password: "correctpassword",
    });

    // Manually verify user's email in DB to allow login
    await testDb
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.email, "loginfail@example.com"));

    // Attempt login with wrong password
    try {
      await caller.auth.login({
        email: "loginfail@example.com",
        password: "wrongpassword",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("UNAUTHORIZED");
        expect(error.message).toContain("Invalid email or password");
      }
    }
  });

  it("Protected procedure fails without session context", async () => {
    // Unauthenticated caller
    const caller = createTestCaller();

    try {
      await caller.form.getForms();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }
  });

  it("Protected procedure succeeds with valid session context", async () => {
    // Setup a user directly in DB
    const caller = createTestCaller();
    await caller.auth.register({
      fullName: "Protected Test",
      email: "protected@example.com",
      password: "password",
    });

    // Get the user ID
    const users = await testDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "protected@example.com"));
    const userId = users[0]!.id;

    // Create an authenticated caller
    const authedCaller = createTestCaller({ userId });

    // Should succeed and return empty forms list
    const result = await authedCaller.form.getForms();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
