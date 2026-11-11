import { buildApp } from "./app";
import { env } from "./env";

const app = await buildApp();

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.error(error, "Failed to start the server");
  process.exit(1);
}
