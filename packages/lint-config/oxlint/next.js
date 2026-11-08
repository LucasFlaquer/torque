import { defineConfig } from "oxlint";
import next from "ultracite/oxlint/next";

import reactConfig from "./react.js";

/**
 * Oxlint configuration for Next.js apps: React + the Ultracite Next.js preset.
 */
export default defineConfig({
  env: reactConfig.env,
  extends: [reactConfig, next],
  ignorePatterns: reactConfig.ignorePatterns,
  settings: reactConfig.settings,
});
