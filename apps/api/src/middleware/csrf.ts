import { doubleCsrf } from "csrf-csrf";
import { env } from "../env";
import { Request } from "express";

export const {
  invalidCsrfTokenError,
  generateToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: env.NODE_ENV === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string | undefined,
});
