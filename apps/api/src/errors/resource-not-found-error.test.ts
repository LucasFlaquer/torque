import { expect, it } from "vitest";

import { AppError } from "./app-error";
import { ResourceNotFoundError } from "./resource-not-found-error";

it("is an AppError with the NOT_FOUND code and a default message", () => {
  const error = new ResourceNotFoundError();

  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({
    code: "NOT_FOUND",
    message: "Resource not found",
    name: "ResourceNotFoundError",
  });
});

it("accepts a custom message", () => {
  const error = new ResourceNotFoundError("Work order not found");

  expect(error.message).toBe("Work order not found");
});
