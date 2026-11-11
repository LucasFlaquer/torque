import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { afterEach, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "../errors/app-error";
import { ERROR_CODES } from "../errors/error-codes";
import { ResourceNotFoundError } from "../errors/resource-not-found-error";
import { errorHandler, notFoundHandler } from "./error-handler";

function buildTestApp() {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.get("/not-found", () => {
    throw new ResourceNotFoundError("Work order not found");
  });
  app.get("/conflict", () => {
    throw new AppError(ERROR_CODES.CONFLICT, "Plate already exists", {
      plate: "ABC1D23",
    });
  });
  app.get("/crash", () => {
    throw new Error("database password is hunter2");
  });
  app.post(
    "/orders",
    { schema: { body: z.object({ title: z.string() }) } },
    () => ({
      ok: true,
    })
  );

  return app;
}

let app: ReturnType<typeof buildTestApp> | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

it("maps a ResourceNotFoundError to a 404 in the single error format", async () => {
  app = buildTestApp();

  const response = await app.inject({ method: "GET", url: "/not-found" });

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({
    error: {
      code: "NOT_FOUND",
      message: "Work order not found",
      requestId: "req-1",
    },
  });
});

it("maps an AppError to the status of its code and includes its details", async () => {
  app = buildTestApp();

  const response = await app.inject({ method: "GET", url: "/conflict" });

  expect(response.statusCode).toBe(409);
  expect(response.json()).toEqual({
    error: {
      code: "CONFLICT",
      details: { plate: "ABC1D23" },
      message: "Plate already exists",
      requestId: "req-1",
    },
  });
});

it("returns Zod validation errors as 400 VALIDATION_ERROR with the failing paths", async () => {
  app = buildTestApp();

  const response = await app.inject({
    method: "POST",
    payload: { title: 42 },
    url: "/orders",
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    error: {
      code: "VALIDATION_ERROR",
      details: [{ message: expect.any(String), path: "/title" }],
      message: "Request validation failed",
      requestId: "req-1",
    },
  });
});

it("returns Fastify client errors, like a malformed JSON body, as 400 BAD_REQUEST", async () => {
  app = buildTestApp();

  const response = await app.inject({
    headers: { "content-type": "application/json" },
    method: "POST",
    payload: "{not json",
    url: "/orders",
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toMatchObject({
    error: { code: "BAD_REQUEST", requestId: "req-1" },
  });
});

it("hides the message of unexpected errors behind a 500 INTERNAL_ERROR", async () => {
  app = buildTestApp();

  const response = await app.inject({ method: "GET", url: "/crash" });

  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId: "req-1",
    },
  });
});

it("answers unknown routes with a 404 in the same format", async () => {
  app = buildTestApp();

  const response = await app.inject({ method: "GET", url: "/nowhere" });

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({
    error: {
      code: "NOT_FOUND",
      message: "Route GET /nowhere not found",
      requestId: "req-1",
    },
  });
});
