import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

import { AppError } from "../errors/app-error";
import { ERROR_CODES } from "../errors/error-codes";
import type { ErrorCode } from "../errors/error-codes";

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    details?: unknown;
    message: string;
    requestId: string;
  };
}

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
} as const;

const FIRST_CLIENT_ERROR_STATUS = 400;
const FIRST_SERVER_ERROR_STATUS = 500;

// Typed as a Record over every code, so a new code without a status does not compile.
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: HTTP_STATUS.BAD_REQUEST,
  CONFLICT: 409,
  FORBIDDEN: 403,
  INTERNAL_ERROR: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  NOT_FOUND: HTTP_STATUS.NOT_FOUND,
  UNAUTHORIZED: 401,
  VALIDATION_ERROR: HTTP_STATUS.BAD_REQUEST,
};

function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  code: ErrorCode,
  message: string,
  details?: unknown
) {
  const body: ErrorResponse = {
    error: {
      code,
      ...(details === undefined ? {} : { details }),
      message,
      requestId: request.id,
    },
  };

  return reply.status(STATUS_BY_CODE[code]).send(body);
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return sendError(request, reply, error.code, error.message, error.details);
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    const details = error.validation.map((issue) => ({
      message: issue.message,
      path: issue.instancePath,
    }));

    return sendError(
      request,
      reply,
      ERROR_CODES.VALIDATION_ERROR,
      "Request validation failed",
      details
    );
  }

  const status = error.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isClientError =
    status >= FIRST_CLIENT_ERROR_STATUS && status < FIRST_SERVER_ERROR_STATUS;

  if (isClientError) {
    return sendError(request, reply, ERROR_CODES.BAD_REQUEST, error.message);
  }

  request.log.error(error);

  return sendError(
    request,
    reply,
    ERROR_CODES.INTERNAL_ERROR,
    "Internal server error"
  );
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return sendError(
    request,
    reply,
    ERROR_CODES.NOT_FOUND,
    `Route ${request.method} ${request.url} not found`
  );
}
