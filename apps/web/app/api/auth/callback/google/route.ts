import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/callback/google
 *
 * Google OAuth callback handler — runs entirely server-side in Next.js.
 *
 * Flow:
 *  1. Google redirects here with ?code=<authorization_code>
 *  2. We extract the code from searchParams.
 *  3. We exchange the code for tokens directly with Google using GOOGLE_CLIENT_ID,
 *     GOOGLE_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI from process.env.
 *  4. We fetch Google user profile info.
 *  5. We call the backend to find or create the user session.
 *  6. We store the returned JWT as an httpOnly cookie (session_token).
 *  7. We redirect to /dashboard on success, or return an error response on failure.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Extract the authorization code and check for oauth errors
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `Google OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code from Google" }, { status: 400 });
  }

  // 2. Read required env vars (support both GOOGLE_CLIENT_ID and GOOGLE_OAUTH_CLIENT_ID formats)
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://trpc-monorepo-production.up.railway.app";

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[google/callback] Missing environment variables.", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
    });
    return NextResponse.json(
      { error: "OAuth configuration is incomplete on the server" },
      { status: 500 },
    );
  }

  try {
    // 3. Exchange code for tokens with Google
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
      return NextResponse.json(
        { error: "Failed to exchange authorization code for tokens" },
        { status: 500 },
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
      error?: string;
    };

    if (tokens.error || !tokens.access_token) {
      console.error("[google/callback] Google returned token error:", tokens);
      return NextResponse.json(
        { error: tokens.error || "Missing access token from Google response" },
        { status: 400 },
      );
    }

    // 4. Fetch user profile from Google using the access token
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userinfoResponse.ok) {
      const body = await userinfoResponse.text();
      console.error("[google/callback] Failed to fetch Google user info:", body);
      return NextResponse.json(
        { error: "Failed to fetch user profile from Google" },
        { status: 500 },
      );
    }

    const profile = (await userinfoResponse.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    if (!profile.id || !profile.email) {
      return NextResponse.json(
        { error: "Google profile is missing required fields (id, email)" },
        { status: 400 },
      );
    }

    // 5. Call the backend to create/login the user session
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
      return NextResponse.json(
        { error: "Failed to create user session on the backend" },
        { status: 500 },
      );
    }

    const { token } = (await backendResponse.json()) as { token: string };

    if (!token) {
      return NextResponse.json(
        { error: "No session token returned from backend" },
        { status: 500 },
      );
    }

    // 6. Set httpOnly cookie and redirect to dashboard
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
    return NextResponse.json(
      { error: "An unexpected authentication error occurred" },
      { status: 500 },
    );
  }
}
