import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   */
  server: {},

  /**
   * Client-side environment variables (must be prefixed with NEXT_PUBLIC_).
   *
   *  NEXT_PUBLIC_API_URL      : Full tRPC URL, e.g. "https://api.example.com/trpc"
   *  NEXT_PUBLIC_API_BASE_URL : API base (without /trpc), e.g. "https://api.example.com"
   *                             Used for non-tRPC endpoints like /auth/google, /api/csrf-token.
   *  NEXT_PUBLIC_APP_URL      : Public frontend URL, e.g. "https://finalforms.com"
   *                             Used for SSR-safe absolute links and share URLs.
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string().optional(),
    NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
