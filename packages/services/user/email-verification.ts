import crypto from "crypto";
import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { TRPCError } from "@trpc/server";
import { emailService } from "../email/index";
import { env } from "../env";

/**
 * Generates a random secure token and its SHA-256 hash.
 */
export function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

/**
 * Sends a verification email for an existing user
 */
export async function resendVerificationEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, normalizedEmail),
  });

  if (!user) {
    // Silently return to prevent user enumeration
    return;
  }

  if (user.emailVerified) {
    return; // Already verified
  }

  const { rawToken, hashedToken } = generateVerificationToken();
  const verifyEmailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db
    .update(usersTable)
    .set({
      verifyEmailToken: hashedToken,
      verifyEmailExpires,
    })
    .where(eq(usersTable.id, user.id));

  const verifyUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${rawToken}`;
  await emailService.sendVerificationEmail(user.email, verifyUrl);
}

/**
 * Verifies the token and activates the user account
 */
export async function verifyEmail(token: string) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.verifyEmailToken, hashedToken),
  });

  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid verification token.",
    });
  }

  if (!user.verifyEmailExpires || user.verifyEmailExpires < new Date()) {
    // Token is expired, clear it
    await db
      .update(usersTable)
      .set({
        verifyEmailToken: null,
        verifyEmailExpires: null,
      })
      .where(eq(usersTable.id, user.id));

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Verification token has expired. Please request a new one.",
    });
  }

  // Success: mark as verified and clear token
  await db
    .update(usersTable)
    .set({
      emailVerified: true,
      verifyEmailToken: null,
      verifyEmailExpires: null,
    })
    .where(eq(usersTable.id, user.id));
}
