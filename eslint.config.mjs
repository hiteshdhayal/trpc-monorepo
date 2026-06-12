// Root-level ESLint flat config for ESLint v9.
//
// WHY THIS FILE EXISTS
// --------------------
// lint-staged runs `eslint --fix` from the monorepo root (see package.json
// "lint-staged" config). ESLint 9 requires a flat config file to be reachable
// by traversing up from the linted file. Without this root config, ESLint 9
// exits immediately with:
//   "ESLint couldn't find an eslint.config.(js|mjs|cjs) file."
//
// Each workspace package already has its own eslint.config.mjs which ESLint
// discovers and merges via the normal config-search algorithm. This root config
// acts as the "catch-all" baseline so ESLint doesn't error when it reaches the
// root before finding a package-level config.
//
// IMPORTANT: This file must stay as .js (CJS) because the root package.json
// does NOT set "type":"module". Workspace packages that do set "type":"module"
// use .mjs files.

import { config as baseConfig } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    // Ignore generated/compiled output and dependency directories at the root.
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/.turbo/**",
      "pnpm-lock.yaml",
    ],
  },
];
