import { expect, it } from "vitest";

import { buildLoggerOptions } from "./logger";

it("pretty prints logs in development", () => {
  const options = buildLoggerOptions({
    LOG_LEVEL: "debug",
    NODE_ENV: "development",
  });

  expect(options).toMatchObject({
    level: "debug",
    transport: { target: "pino-pretty" },
  });
});

it.each(["test", "production"] as const)("logs plain JSON in %s", (nodeEnv) => {
  const options = buildLoggerOptions({ LOG_LEVEL: "warn", NODE_ENV: nodeEnv });

  expect(options).toEqual({ level: "warn" });
});
