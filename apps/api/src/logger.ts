import type { FastifyServerOptions } from "fastify";

import type { Env } from "./env";

export function buildLoggerOptions(
  env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">
): NonNullable<FastifyServerOptions["logger"]> {
  if (env.NODE_ENV === "development") {
    return {
      level: env.LOG_LEVEL,
      transport: {
        options: { ignore: "pid,hostname", translateTime: "HH:MM:ss" },
        target: "pino-pretty",
      },
    };
  }

  return { level: env.LOG_LEVEL };
}
