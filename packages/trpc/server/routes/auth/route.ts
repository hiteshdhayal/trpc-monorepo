import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { forgotPassword, resetPassword } from "@repo/services/user/password-reset";
import {
  getAuthenticationMethodOutputSchema,
  authUserResponseSchema,
  userProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "@repo/shared";
import { verifyEmail, resendVerificationEmail } from "@repo/services/user/email-verification";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  register: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS } })
    .input(
      z.object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    )
    .output(authUserResponseSchema)
    .mutation(async ({ input }) => {
      return await userService.register(input.fullName, input.email, input.password);
    }),

  login: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string(),
      }),
    )
    .output(authUserResponseSchema)
    .mutation(async ({ input }) => {
      return await userService.login(input.email, input.password);
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(userProfileSchema)
    .query(async ({ ctx }) => {
      return await userService.getUserById(ctx.userId);
    }),

  /**
   * POST /authentication/forgot-password
   *
   * Security: Always returns a generic success message regardless of whether
   * the email exists. This prevents user enumeration attacks.
   * Rate limited: 5 requests per hour per IP (enforced in Express middleware).
   */
  forgotPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/forgot-password"), tags: TAGS } })
    .input(forgotPasswordSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      // Service handles user lookup silently — no error on missing email
      await forgotPassword(input.email);
      return {
        message:
          "If an account with that email exists, a password reset link has been sent. Check your inbox.",
      };
    }),

  /**
   * POST /authentication/reset-password
   *
   * Security: Hashes the incoming token before DB lookup. Validates expiry.
   * Enforces password strength. Clears token after use (single-use).
   * Rate limited: 10 requests per hour per IP (enforced in Express middleware).
   */
  resetPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/reset-password"), tags: TAGS } })
    .input(resetPasswordSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      await resetPassword(input.token, input.newPassword);
      return { message: "Your password has been reset successfully. You can now log in." };
    }),

  verifyEmail: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/verify-email"), tags: TAGS } })
    .input(verifyEmailSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      await verifyEmail(input.token);
      return { message: "Your email has been verified successfully. You can now log in." };
    }),

  resendVerification: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/resend-verification"), tags: TAGS } })
    .input(resendVerificationSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      await resendVerificationEmail(input.email);
      return { message: "If your account exists and is unverified, a new verification link has been sent." };
    }),
});

