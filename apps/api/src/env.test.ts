import { describe, expect, it } from "vitest";

import { env, parseEnv } from "./env";

const validSource = {
  DATABASE_URL: "postgresql://torque:torque@localhost:5432/torque",
  REDIS_URL: "redis://localhost:6379",
  WEB_ORIGIN: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("applies defaults for the optional variables", () => {
    const parsed = parseEnv(validSource);

    expect(parsed).toEqual({
      ...validSource,
      API_HOST: "0.0.0.0",
      API_PORT: 3333,
      LOG_LEVEL: "info",
      NODE_ENV: "development",
    });
  });

  it("uses the values it is given instead of the defaults", () => {
    const parsed = parseEnv({
      ...validSource,
      API_HOST: "127.0.0.1",
      API_PORT: "4000",
      LOG_LEVEL: "debug",
      NODE_ENV: "production",
    });

    expect(parsed).toMatchObject({
      API_HOST: "127.0.0.1",
      API_PORT: 4000,
      LOG_LEVEL: "debug",
      NODE_ENV: "production",
    });
  });

  it.each([
    { field: "DATABASE_URL", value: "not-a-url" },
    { field: "REDIS_URL", value: "not-a-url" },
    { field: "WEB_ORIGIN", value: "not-a-url" },
    { field: "API_PORT", value: "abc" },
    { field: "API_PORT", value: "0" },
    { field: "API_PORT", value: "65536" },
    { field: "API_PORT", value: "3000.5" },
    { field: "API_HOST", value: "" },
    { field: "LOG_LEVEL", value: "verbose" },
    { field: "NODE_ENV", value: "staging" },
  ])("throws naming $field when it is $value", ({ field, value }) => {
    const source = { ...validSource, [field]: value };

    expect(() => parseEnv(source)).toThrow(
      new RegExp(`^Invalid environment variables:\\n {2}${field}: `, "u")
    );
  });

  it.each(["DATABASE_URL", "REDIS_URL", "WEB_ORIGIN"])(
    "throws naming %s when it is missing",
    (field) => {
      const source = { ...validSource, [field]: undefined };

      expect(() => parseEnv(source)).toThrow(`  ${field}: `);
    }
  );

  it("lists every invalid field in one error", () => {
    expect(() => parseEnv({})).toThrow(
      /DATABASE_URL: .*\n {2}REDIS_URL: .*\n {2}WEB_ORIGIN: /u
    );
  });
});

describe("env", () => {
  it("is parsed from process.env", () => {
    expect(env.NODE_ENV).toBe("test");
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
  });
});
