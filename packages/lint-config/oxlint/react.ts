import { baseConfig } from "@torque/lint-config/oxlint/base";
import { defineConfig } from "oxlint";
import react from "ultracite/oxlint/react";

/**
 * Oxlint configuration for React libraries: base + the Ultracite React preset.
 */
export const reactConfig = defineConfig({
  env: baseConfig.env,
  extends: [baseConfig, react],
  ignorePatterns: baseConfig.ignorePatterns,
  rules: {
    // Rule 4: components are `function` declarations (Ultracite defaults to
    // arrow functions).
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "function-declaration",
        unnamedComponents: "arrow-function",
      },
    ],
  },
});
