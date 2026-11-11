import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      thresholds: { 100: true },
    },
    // Valid values so importing src/env.ts works without a local .env file.
    env: {
      DATABASE_URL: "postgresql://torque:torque@localhost:5432/torque",
      LOG_LEVEL: "silent",
      REDIS_URL: "redis://localhost:6379",
      WEB_ORIGIN: "http://localhost:3000",
    },
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
