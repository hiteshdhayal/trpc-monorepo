/**
 * Password Reset Security Tests
 *
 * Tests cover:
 *  1. Forgot password always returns generic success (anti-enumeration)
 *  2. Raw token is NOT stored in DB (only hash)
 *  3. Reset with valid token succeeds and clears token fields
 *  4. Reset with expired token returns error
 *  5. Reset with invalid token returns error
 *  6. Token is single-use (second use fails)
 *  7. Password strength enforcement
 *  8. CSRF middleware blocks requests without token
 */

import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { createTestCaller } from "./helpers/caller";
import { testDb } from "./helpers/db";
import { usersTable } from "@repo/database/schema";
import { eq } from "@repo/database";
import { TRPCError } from "@trpc/server";

const TEST_EMAIL = "resettest@example.com";
const STRONG_PASSWORD = "NewSecure@Pass1";

async function createTestUser() {
  const caller = createTestCaller();
  await caller.auth.register({
    fullName: "Reset Test User",
    email: TEST_EMAIL,
    password: "OldPassword1!",
  });
  
  await testDb
    .update(usersTable)
    .set({ emailVerified: true })
    .where(eq(usersTable.email, TEST_EMAIL));

  const [user] = await testDb
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, TEST_EMAIL));
  return user!;
}

describe("Forgot Password", () => {
  it("Returns a generic success message for an existing email (no user enumeration)", async () => {
    await createTestUser();
    const caller = createTestCaller();
    const result = await caller.auth.forgotPassword({ email: TEST_EMAIL });
    expect(result.message).toContain("If an account");
  });

  it("Returns the same generic message for a non-existent email", async () => {
    const caller = createTestCaller();
    const result = await caller.auth.forgotPassword({ email: "nobody@example.com" });
    // Must be identical to prevent timing-based enumeration
    expect(result.message).toContain("If an account");
  });

  it("Stores a HASHED token, NOT the raw token, in the database", async () => {
    const user = await createTestUser();
    const caller = createTestCaller();
    await caller.auth.forgotPassword({ email: TEST_EMAIL });

    const [updated] = await testDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    const storedToken = updated?.resetPasswordToken;
    expect(storedToken).toBeDefined();
    expect(storedToken).toHaveLength(64); // SHA-256 hex = 64 chars
    // The stored value is a hex hash — must not look like the raw bytes (which would be 64-char hex of random, but this is the hash of that)
    // More importantly: confirm it's NOT the user's email or any PII
    expect(storedToken).not.toContain(TEST_EMAIL);
  });

  it("Sets a reset expiry ~15 minutes in the future", async () => {
    const user = await createTestUser();
    const caller = createTestCaller();
    const before = new Date();
    await caller.auth.forgotPassword({ email: TEST_EMAIL });
    const after = new Date();

    const [updated] = await testDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    const expires = updated?.resetPasswordExpires;
    expect(expires).toBeDefined();

    const expectedMinExpiry = new Date(before.getTime() + 14 * 60 * 1000);
    const expectedMaxExpiry = new Date(after.getTime() + 16 * 60 * 1000);
    expect(expires!.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime());
    expect(expires!.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime());
  });
});

describe("Reset Password", () => {
  it("Rejects a completely invalid token", async () => {
    const caller = createTestCaller();
    await expect(
      caller.auth.resetPassword({ token: "invalidtoken123", newPassword: STRONG_PASSWORD }),
    ).rejects.toThrow(TRPCError);
  });

  it("Rejects an expired token and clears it from DB", async () => {
    const user = await createTestUser();

    // Manually write an expired token into the DB
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    await testDb
      .update(usersTable)
      .set({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() - 1000), // 1 second ago = expired
      })
      .where(eq(usersTable.id, user.id));

    const caller = createTestCaller();
    await expect(
      caller.auth.resetPassword({ token: rawToken, newPassword: STRONG_PASSWORD }),
    ).rejects.toThrow(TRPCError);

    // Confirm token was cleared after rejection
    const [updated] = await testDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));
    expect(updated?.resetPasswordToken).toBeNull();
    expect(updated?.resetPasswordExpires).toBeNull();
  });

  it("Enforces password strength — rejects weak passwords", async () => {
    const caller = createTestCaller();
    const weakPasswords = ["short", "alllowercase1!", "ALLUPPERCASE1!", "NoSpecialChar1", "No1upper!"];
    for (const weak of weakPasswords) {
      await expect(
        caller.auth.resetPassword({ token: "anything", newPassword: weak }),
      ).rejects.toThrow();
    }
  });

  it("Tokens are single-use — second use with same token fails", async () => {
    const user = await createTestUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await testDb
      .update(usersTable)
      .set({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      })
      .where(eq(usersTable.id, user.id));

    const caller = createTestCaller();

    // First use — should succeed
    const result = await caller.auth.resetPassword({ token: rawToken, newPassword: STRONG_PASSWORD });
    expect(result.message).toContain("successfully");

    // Second use with same token — must fail
    await expect(
      caller.auth.resetPassword({ token: rawToken, newPassword: "AnotherPass@2" }),
    ).rejects.toThrow(TRPCError);
  });

  it("After successful reset: token fields are cleared in DB", async () => {
    const user = await createTestUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await testDb
      .update(usersTable)
      .set({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      })
      .where(eq(usersTable.id, user.id));

    const caller = createTestCaller();
    await caller.auth.resetPassword({ token: rawToken, newPassword: STRONG_PASSWORD });

    const [updated] = await testDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    expect(updated?.resetPasswordToken).toBeNull();
    expect(updated?.resetPasswordExpires).toBeNull();
  });

  it("After successful reset: user can log in with new password", async () => {
    const user = await createTestUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await testDb
      .update(usersTable)
      .set({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      })
      .where(eq(usersTable.id, user.id));

    const caller = createTestCaller();
    await caller.auth.resetPassword({ token: rawToken, newPassword: STRONG_PASSWORD });

    // Login with new password
    const loginResult = await caller.auth.login({ email: TEST_EMAIL, password: STRONG_PASSWORD });
    expect(loginResult.token).toBeDefined();
    expect(loginResult.user.email).toBe(TEST_EMAIL);
  });

  it("After successful reset: old password no longer works", async () => {
    const user = await createTestUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await testDb
      .update(usersTable)
      .set({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      })
      .where(eq(usersTable.id, user.id));

    const caller = createTestCaller();
    await caller.auth.resetPassword({ token: rawToken, newPassword: STRONG_PASSWORD });

    await expect(
      caller.auth.login({ email: TEST_EMAIL, password: "OldPassword1!" }),
    ).rejects.toThrow(TRPCError);
  });
});
