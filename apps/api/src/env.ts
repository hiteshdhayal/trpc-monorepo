import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("8000"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().default("http://localhost:8000"),
  FRONTEND_URL: z
    .string({ error: "FRONTEND_URL is required for CORS" })
    .url("FRONTEND_URL must be a valid URL"),
  /**
   * Comma-separated list of additional CORS origins (e.g. "http://localhost:3000").
   * FRONTEND_URL is always included. This is for extra dev/staging origins.
   * Example: CORS_ADDITIONAL_ORIGINS=http://localhost:3000,http://localhost:3001
   */
  CORS_ADDITIONAL_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string({ error: "DATABASE_URL is required to connect to the database" }),
  JWT_SECRET: z.string({ error: "JWT_SECRET is required for authentication" }),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  /**
   * The "from" address for all transactional emails.
   * Must be a verified sender domain in your Resend account.
   * Example: EMAIL_FROM=FinalForms <noreply@yourdomain.com>
   */
  EMAIL_FROM: z.string().default("FinalForms <noreply@example.com>"),
  /**
   * Public-facing app URL used in email templates (links, branding).
   * Example: APP_URL=https://finalforms.com
   */
  APP_URL: z.string().default("http://localhost:3000"),
  CSRF_SECRET: z.string().default("fallback-secret-for-dev"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    console.error("❌ Invalid environment variables:", safeParseResult.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Please check your .env file.");
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);
