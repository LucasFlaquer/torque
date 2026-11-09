import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

/**
 * Files that a tool loads through their default export.
 */
const TOOL_CONFIG_FILES = "**/*.config.{js,mjs,cjs,ts,mts,cts}";

/**
 * Base Oxlint configuration: the Ultracite core preset, adjusted to the rules
 * in `.agents/rules/typescript.md`.
 *
 * Oxlint lints each file with its nearest config alone, and `extends` does not
 * carry over `env` or `ignorePatterns`, so they are set explicitly.
 */
export const baseConfig = defineConfig({
  env: core.env ?? {},
  extends: [core],
  ignorePatterns: core.ignorePatterns ?? [],
  overrides: [
    {
      files: [TOOL_CONFIG_FILES],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
  rules: {
    // Rule 4: functions are `function` declarations; arrow functions only as
    // inline callbacks (Ultracite defaults to arrow function expressions).
    "func-style": ["error", "declaration"],
    // Rule 8: named exports only, except framework and tool files.
    "import/no-default-export": "error",
    // Rule 6: parameters are immutable, including their properties.
    "no-param-reassign": ["error", { props: true }],
    // Rule 3: no `as` to silence the compiler; `as const` stays allowed.
    "typescript/consistent-type-assertions": [
      "error",
      { assertionStyle: "never" },
    ],
  },
});
