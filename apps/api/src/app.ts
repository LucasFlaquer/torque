import { randomUUID } from "node:crypto";

import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { env } from "./env";
import { errorHandler, notFoundHandler } from "./http/error-handler";
import { buildLoggerOptions } from "./logger";
import { healthRoutes } from "./modules/health/routes";

export const REQUEST_ID_HEADER = "x-request-id";

export async function buildApp() {
  const app = fastify({
    genReqId: () => randomUUID(),
    logger: buildLoggerOptions(env),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.addHook("onSend", (request, reply, _payload, done) => {
    reply.header(REQUEST_ID_HEADER, request.id);
    done();
  });

  await app.register(healthRoutes);

  await app.ready();

  return app;
}
