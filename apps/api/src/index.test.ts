import { afterEach, beforeEach, expect, it, vi } from "vitest";

const listen = vi.fn();
const logError = vi.fn();

vi.mock("./app", () => ({
  buildApp: () => Promise.resolve({ listen, log: { error: logError } }),
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  listen.mockReset();
  logError.mockReset();
});

it("listens on the configured host and port", async () => {
  listen.mockResolvedValue("http://0.0.0.0:3333");
  const { env } = await import("./env");

  await import("./index");

  expect(listen).toHaveBeenCalledExactlyOnceWith({
    host: env.API_HOST,
    port: env.API_PORT,
  });
});

it("logs the error and exits with code 1 when listening fails", async () => {
  const failure = new Error("EADDRINUSE");
  listen.mockRejectedValue(failure);
  const exit = vi.spyOn(process, "exit").mockImplementation(() => {
    throw new Error("process.exit called");
  });

  await expect(import("./index")).rejects.toThrow("process.exit called");

  expect(logError).toHaveBeenCalledWith(failure, "Failed to start the server");
  expect(exit).toHaveBeenCalledExactlyOnceWith(1);
});
