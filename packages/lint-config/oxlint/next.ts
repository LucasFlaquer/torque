import { reactConfig } from "@torque/lint-config/oxlint/react";
import { defineConfig } from "oxlint";
import next from "ultracite/oxlint/next";

/**
 * App Router files that Next.js loads through their default export.
 */
const NEXT_DEFAULT_EXPORT_FILES =
  "**/app/**/{page,layout,template,loading,error,global-error,not-found,forbidden,unauthorized,default,icon,apple-icon,opengraph-image,twitter-image,sitemap,robots,manifest}.{js,jsx,ts,tsx}";

/**
 * Oxlint configuration for Next.js apps: React + the Ultracite Next.js preset.
 */
export const nextConfig = defineConfig({
  env: reactConfig.env,
  extends: [reactConfig, next],
  ignorePatterns: reactConfig.ignorePatterns,
  overrides: [
    {
      files: [NEXT_DEFAULT_EXPORT_FILES],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
});
