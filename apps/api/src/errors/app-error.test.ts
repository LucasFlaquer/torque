import { expect, it } from "vitest";

import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";

it("keeps the code and message it is created with", () => {
  const error = new AppError(ERROR_CODES.CONFLICT, "Plate already exists");

  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({
    code: "CONFLICT",
    message: "Plate already exists",
    name: "AppError",
  });
  expect(error.details).toBeUndefined();
});

it("keeps the details when they are given", () => {
  const error = new AppError(ERROR_CODES.CONFLICT, "Plate already exists", {
    plate: "ABC1D23",
  });

  expect(error.details).toEqual({ plate: "ABC1D23" });
});
