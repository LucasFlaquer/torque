import "dotenv/config";
import { z } from "zod";

const DEFAULT_API_PORT = 3333;

const envSchema = z.object({
  API_HOST: z.string().min(1).default("0.0.0.0"),
  API_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65_535)
    .default(DEFAULT_API_PORT),
  DATABASE_URL: z.url(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  REDIS_URL: z.url(),
  WEB_ORIGIN: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n  ");

    throw new Error(`Invalid environment variables:\n  ${problems}`);
  }

  return result.data;
}

export const env = parseEnv(process.env);
