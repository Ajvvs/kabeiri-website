import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("Warning: .env.local file was not found");
}

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    BETTER_AUTH_URL: z.string().url(),
    // BETTER_AUTH_SECRET: z.string().startsWith("sk."), // TODO: Change secret to have sk. prefix
    BETTER_AUTH_SECRET: z.string().min(1),
    POLAR_DEV_TOKEN: z.string().min(1),
    POLAR_SUCCESS_URL: z.string().url(),
    POLAR_FREE_PRODUCT_ID: z.string().min(1),
    POLAR_PRO_PRODUCT_ID: z.string().min(1),
    POLAR_ENTERPRISE_PRODUCT_ID: z
      .string()
      .optional()
      .default("placeholder-enterprise-id"),
  },
  /**
   * Specify your client-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {},
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge
   * runtimes (e.g. middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    POLAR_DEV_TOKEN: process.env.POLAR_DEV_TOKEN,
    POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL,
    POLAR_FREE_PRODUCT_ID: process.env.POLAR_FREE_PRODUCT_ID,
    POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID || undefined,
    POLAR_ENTERPRISE_PRODUCT_ID:
      process.env.POLAR_ENTERPRISE_PRODUCT_ID || undefined,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,

  extends: [],
});
