import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

/**
 * Shared Oxfmt configuration for every workspace, built on the Ultracite preset.
 */
export const oxfmtConfig = defineConfig({
  ...ultracite,
});
