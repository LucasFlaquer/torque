import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

/**
 * Base Oxlint configuration: the Ultracite core preset.
 *
 * Oxlint lints each file with its nearest config alone, and `extends` does not
 * carry over `env`, `ignorePatterns` or `settings`, so they are set explicitly.
 */
export default defineConfig({
  env: core.env,
  extends: [core],
  ignorePatterns: core.ignorePatterns,
});
