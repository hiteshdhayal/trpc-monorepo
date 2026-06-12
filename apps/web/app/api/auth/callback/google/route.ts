import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/callback/google
 *
 * Google OAuth callback handler — runs entirely server-side in Next.js.
 *
 * Flow:
 *  1. Google redirects here with ?code=<authorization_code>
 *  2. We exchange the code for tokens directly with Google
 *  3. We forward the code to the Railway backend which handles user
 *     find-or-create and JWT signing
 *  4. We store the returned JWT as an httpOnly cookie on this (Vercel) domain
 *  5. We redirect to /dashboard on success, /auth/login?error=... on failure
 *
 * Env vars required (set in Vercel project settings):
 *   GOOGLE_OAUTH_CLIENT_ID      — your Google OAuth client ID
 *   GOOGLE_OAUTH_CLIENT_SECRET  — your Google OAuth client secret
 *   GOOGLE_OAUTH_REDIRECT_URI   — must be https://trpc-monorepo-web.vercel.app/api/auth/callback/google
 *   NEXT_PUBLIC_API_BASE_URL    — Railway backend base, e.g. https://trpc-monorepo-production.up.railway.app
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── 1. Extract the authorization code ──────────────────────────────────────
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", request.url));
  }

  // ── 2. Read required env vars ───────────────────────────────────────────────
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    "https://trpc-monorepo-web.vercel.app/api/auth/callback/google";
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://trpc-monorepo-production.up.railway.app";

  if (!clientId || !clientSecret) {
    console.error("[google/callback] Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
    return NextResponse.redirect(new URL("/auth/login?error=oauth_misconfigured", request.url));
  }

  try {
    // ── 3. Exchange code for tokens with Google ─────────────────────────────
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error("[google/callback] Token exchange failed:", body);
      return NextResponse.redirect(new URL("/auth/login?error=token_exchange_failed", request.url));
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
      error?: string;
    };

    if (tokens.error || (!tokens.access_token && !tokens.id_token)) {
      console.error("[google/callback] Google returned token error:", tokens);
      return NextResponse.redirect(new URL("/auth/login?error=oauth_failed", request.url));
    }

    // ── 4. Forward to backend — backend handles user find-or-create + JWT ───
    // We re-use the existing /auth/google/callback endpoint on the Railway API.
    // However, since the code was already consumed above, we pass the access
    // token instead and call the userinfo endpoint path on the backend.
    //
    // Alternative: pass the access_token so the backend can fetch the profile.
    // The backend's /auth/google/callback already accepts ?code= and exchanges it,
    // but since we've already exchanged it here, we call the backend with the
    // access_token via a JSON endpoint instead.
    //
    // Simplest approach: fetch the user profile here, then call a backend endpoint.
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userinfoResponse.ok) {
      console.error("[google/callback] Failed to fetch Google user info");
      return NextResponse.redirect(new URL("/auth/login?error=userinfo_failed", request.url));
    }

    const profile = (await userinfoResponse.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    if (!profile.id || !profile.email) {
      return NextResponse.redirect(new URL("/auth/login?error=missing_profile", request.url));
    }

    // ── 5. Call the Railway backend to create/login the user ────────────────
    const backendResponse = await fetch(`${apiBaseUrl}/auth/google/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleId: profile.id,
        email: profile.email,
        fullName: profile.name ?? "",
        profileImageUrl: profile.picture ?? "",
      }),
    });

    if (!backendResponse.ok) {
      const errBody = await backendResponse.text();
      console.error("[google/callback] Backend session creation failed:", errBody);
      return NextResponse.redirect(new URL("/auth/login?error=session_failed", request.url));
    }

    const { token } = (await backendResponse.json()) as { token: string };

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login?error=no_token", request.url));
    }

    // ── 6. Set httpOnly cookie and redirect to dashboard ─────────────────────
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return response;
  } catch (err) {
    console.error("[google/callback] Unexpected error:", err);
    return NextResponse.redirect(new URL("/auth/login?error=oauth_failed", request.url));
  }
}
