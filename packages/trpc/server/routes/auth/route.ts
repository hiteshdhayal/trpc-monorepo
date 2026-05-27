import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

const authUserResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
});

const userProfileSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  isAdmin: z.boolean(),
  profileImageUrl: z.string().nullable(),
});

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  register: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS } })
    .input(
      z.object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    )
    .output(authUserResponseSchema)
    .mutation(async ({ input }) => {
      return await userService.register(input.fullName, input.email, input.password);
    }),

  login: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string(),
      }),
    )
    .output(authUserResponseSchema)
    .mutation(async ({ input }) => {
      return await userService.login(input.email, input.password);
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(userProfileSchema)
    .query(async ({ ctx }) => {
      return await userService.getUserById(ctx.userId);
    }),
});
