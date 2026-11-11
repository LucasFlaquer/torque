import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";

export class ResourceNotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(ERROR_CODES.NOT_FOUND, message);
    this.name = "ResourceNotFoundError";
  }
}
