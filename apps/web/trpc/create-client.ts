import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

let cachedCsrfToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  // If we already have the token, return it
  if (cachedCsrfToken) return cachedCsrfToken;
  // If a fetch is currently in progress, wait for it
  if (tokenPromise) return tokenPromise;

  // Determine the API base URL.
  // Prefer NEXT_PUBLIC_API_BASE_URL; fall back to stripping /trpc from NEXT_PUBLIC_API_URL.
  const apiBase =
    env.NEXT_PUBLIC_API_BASE_URL ||
    (env.NEXT_PUBLIC_API_URL ?? "").replace(/\/trpc$/, "");
  const apiUrl = `${apiBase}/api/csrf-token`;
  
  tokenPromise = fetch(apiUrl, { credentials: "include" })
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((data) => {
      if (data?.csrfToken) {
        cachedCsrfToken = data.csrfToken;
      }
      return cachedCsrfToken;
    })
    .catch(() => {
      return null;
    })
    .finally(() => {
      // Clear the promise so if it failed we can try again
      tokenPromise = null;
    });

  return tokenPromise;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  
  // Kick off fetching the token early in the background on the client
  if (typeof window !== "undefined") {
    fetchCsrfToken();
  }

  return c({
    url: env.NEXT_PUBLIC_API_URL ?? "/trpc",
    async fetch(url, options) {
      let csrfToken = cachedCsrfToken;
      
      const method = (options?.method || "GET").toUpperCase();
      // Only wait and enforce CSRF token fetch if this is a mutating request
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
         csrfToken = await fetchCsrfToken();
      }

      return fetch(url, {
        ...options,
        credentials: "include", // Ensure cookies are always sent
        headers: {
          ...(options?.headers as Record<string, string> | undefined),
          // Attach CSRF token on all requests; backend validates it on mutations
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
      });
    },
  });
};
