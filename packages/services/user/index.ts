import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import { GetAuthenticationMethodOutputSchema } from "./model";
import { hashPassword, verifyPassword, signJwt } from "./auth";
import { TRPCError } from "@trpc/server";

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }

  public async register(fullName: string, email: string, passwordString: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, normalizedEmail),
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists.",
      });
    }

    const hashed = hashPassword(passwordString);

    const [user] = await db
      .insert(usersTable)
      .values({
        fullName,
        email: normalizedEmail,
        passwordHash: hashed,
        emailVerified: true,
      })
      .returning();

    if (!user) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user." });
    }

    const token = signJwt({ userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      },
    };
  }

  public async login(email: string, passwordString: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, normalizedEmail),
    });

    if (!user || !user.passwordHash) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      });
    }

    const isValid = verifyPassword(passwordString, user.passwordHash);
    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      });
    }

    const token = signJwt({ userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      },
    };
  }

  public async getUserById(id: string) {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, id),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isAdmin: user.isAdmin,
      profileImageUrl: user.profileImageUrl,
    };
  }

  public async isAdminUser(userId: string): Promise<boolean> {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });
    return user?.isAdmin === true;
  }
}

export default UserService;
export const userService = new UserService();
