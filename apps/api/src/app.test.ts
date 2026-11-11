import { afterEach, expect, it } from "vitest";

import { buildApp, REQUEST_ID_HEADER } from "./app";

let app: Awaited<ReturnType<typeof buildApp>> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

it("builds an app that answers requests without listening on a port", async () => {
  app = await buildApp();

  const response = await app.inject({ method: "GET", url: "/unknown" });

  expect(response.statusCode).toBe(404);
  expect(response.json()).toMatchObject({
    error: {
      code: "NOT_FOUND",
      requestId: response.headers[REQUEST_ID_HEADER],
    },
  });
});

it("returns a request id header on every response", async () => {
  app = await buildApp();

  const response = await app.inject({ method: "GET", url: "/health" });

  expect(response.headers[REQUEST_ID_HEADER]).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u
  );
});

it("gives each request its own id", async () => {
  app = await buildApp();

  const first = await app.inject({ method: "GET", url: "/health" });
  const second = await app.inject({ method: "GET", url: "/health" });

  expect(first.headers[REQUEST_ID_HEADER]).not.toBe(
    second.headers[REQUEST_ID_HEADER]
  );
});
