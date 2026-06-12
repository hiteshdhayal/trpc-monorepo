import { config as baseConfig } from "@repo/eslint-config/base";
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // 1. Global ignores at the root
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/.turbo/**",
      "pnpm-lock.yaml",
      "**/seed-raw.js",
      "**/seed.js",
    ],
  },
  // 2. Base TypeScript and general rules for all files in the monorepo
  ...baseConfig,
  // 3. Next.js and React configuration specifically for the frontend application (apps/web)
  ...nextJsConfig.map((configBlock) => {
    // Global ignore blocks in subconfigs must remain as-is without any 'files' property
    if (configBlock.ignores && Object.keys(configBlock).length === 1) {
      return configBlock;
    }
    return {
      ...configBlock,
      files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
    };
  }),
];
