import type { ErrorCode } from "./error-codes";

/**
 * Base class for errors the application raises on purpose (business rules).
 * It knows nothing about HTTP: the `code` is stable and the HTTP error handler
 * maps it to a status code.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}
