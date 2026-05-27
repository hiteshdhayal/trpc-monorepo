/**
 * Password Reset Service — FinalForms
 *
 * Security design:
 *  1. Raw token (32 bytes) is generated with crypto.randomBytes — never stored in DB.
 *  2. SHA-256 hash of the token is stored. Even if the DB leaks, raw tokens cannot be derived.
 *  3. Token expires in 15 minutes (RESET_TOKEN_EXPIRY_MS).
 *  4. On use: token fields are immediately cleared — single-use guarantee.
 *  5. Password strength enforced via Zod regex before hashing.
 *  6. Email is always responded to with a generic success message — no user enumeration.
 */

import crypto from "crypto";
import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { hashPassword } from "./auth";
import { emailService } from "../email/index";
import { env } from "../env";
import { TRPCError } from "@trpc/server";

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/** Hash a raw token with SHA-256 for DB storage. */
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/** Validate password strength — min 8 chars, uppercase, lowercase, digit, special char. */
function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

/**
 * Initiate forgot-password flow.
 * Always returns a generic success message regardless of whether the email exists.
 * This prevents user enumeration attacks.
 */
export async function forgotPassword(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // Look up user — but do NOT reveal existence in the response
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, normalizedEmail),
  });

  if (!user) {
    // Silently return — no error, no hint that user doesn't exist
    return;
  }

  // Generate cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  // Store hashed token and expiry in DB
  await db
    .update(usersTable)
    .set({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    })
    .where(eq(usersTable.id, user.id));

  // Build the reset URL with the RAW token (user will send it back to us)
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  // Send the email — non-blocking failure (email service handles logging)
  await emailService.sendPasswordReset(user.email, resetUrl);
}

/**
 * Complete the password reset.
 * Validates the raw token against its stored hash.
 * Enforces password strength rules.
 * Clears the reset token after successful use.
 */
export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  if (!isStrongPassword(newPassword)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
    });
  }

  const hashedToken = hashToken(rawToken);
  const now = new Date();

  // Find user by hashed token, ensuring token is not expired
  // We deliberately do not use lt/gt operators here — instead we do manual check
  // to avoid any ORM nuance with null comparisons
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.resetPasswordToken, hashedToken),
  });

  if (!user || !user.resetPasswordExpires) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid or expired password reset token.",
    });
  }

  // Check expiry
  if (user.resetPasswordExpires < now) {
    // Clear the expired token
    await db
      .update(usersTable)
      .set({ resetPasswordToken: null, resetPasswordExpires: null })
      .where(eq(usersTable.id, user.id));

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Password reset token has expired. Please request a new one.",
    });
  }

  // Hash the new password using the existing scrypt-based hasher
  const newHash = hashPassword(newPassword);

  // Update password and IMMEDIATELY clear reset token fields (single-use guarantee)
  await db
    .update(usersTable)
    .set({
      passwordHash: newHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));
}
