import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
    await reply.send({ status: "OK" });
  });
}
