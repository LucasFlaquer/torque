import { defineConfig } from "oxlint";
import react from "ultracite/oxlint/react";

import base from "./base.js";

/**
 * Oxlint configuration for React libraries: base + the Ultracite React preset.
 */
export default defineConfig({
  env: base.env,
  extends: [base, react],
  ignorePatterns: base.ignorePatterns,
  settings: base.settings,
});
