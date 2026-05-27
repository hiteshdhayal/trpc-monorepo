import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

/**
 * Read the CSRF token from the `csrf_token` cookie set by the backend.
 * The cookie is non-httpOnly so JS can read it (intentional for CSRF double-submit pattern).
 */
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^|;)\s*csrf_token\s*=\s*([^;]+)/);
  return match ? decodeURIComponent(match[2]!) : "";
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return c({
    url: env.NEXT_PUBLIC_API_URL ?? "/trpc",
    fetch(url, options) {
      const csrfToken = getCsrfToken();
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...(options?.headers as Record<string, string> | undefined),
          // Attach CSRF token on all requests; backend validates it on mutations
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
      });
    },
  });
};
