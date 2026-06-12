"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setSessionToken } from "~/lib/auth";

/**
 * /auth/callback
 *
 * This page is the landing point after Google OAuth completes on the backend.
 * The backend cannot set a cross-domain cookie (Railway → Vercel), so it passes
 * the JWT as a URL query parameter:
 *
 *   https://trpc-monorepo-web.vercel.app/auth/callback?token=<jwt>
 *
 * This page:
 *   1. Reads ?token= from the URL
 *   2. Stores it as a "session_token" cookie on this (Vercel) domain via setSessionToken
 *   3. Redirects to /dashboard on success, /auth/login?error=... on failure
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace(`/auth/login?error=${error ?? "oauth_failed"}`);
      return;
    }

    // Store token as session_token cookie on this (Vercel) domain so all
    // subsequent tRPC calls and server components can authenticate the user.
    setSessionToken(token);
    router.replace("/dashboard");
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
      <div className="flex flex-col items-center gap-4 text-[#6B5744]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
        <p className="text-sm font-medium">Completing sign in…</p>
      </div>
    </div>
  );
}
