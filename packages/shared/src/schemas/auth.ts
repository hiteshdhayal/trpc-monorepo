import { z } from "zod";

export const authUserResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
});

export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;

export const userProfileSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  isAdmin: z.boolean(),
  profileImageUrl: z.string().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: strongPasswordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const getAuthenticationMethodOutputSchema = z.object({
  provider: z.enum(["GOOGLE_OAUTH"]),
  displayName: z.string().optional(),
  displayText: z.string().optional(),
  authUrl: z.string(),
});

export type GetAuthenticationMethodOutputSchema = z.infer<typeof getAuthenticationMethodOutputSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
