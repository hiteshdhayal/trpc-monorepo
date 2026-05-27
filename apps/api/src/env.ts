import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().default("http://localhost:8000"),
  FRONTEND_URL: z
    .string({ error: "FRONTEND_URL is required for CORS" })
    .url("FRONTEND_URL must be a valid URL"),
  DATABASE_URL: z.string({ error: "DATABASE_URL is required to connect to the database" }),
  JWT_SECRET: z.string({ error: "JWT_SECRET is required for authentication" }),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
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
