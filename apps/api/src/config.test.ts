import { describe, expect, it } from "vitest";
import { loadApiStartupConfig, type ApiEnvironment } from "./config.js";

const env = (overrides: ApiEnvironment = {}): ApiEnvironment => ({
  DATABASE_URL: "postgres://korre:local-only@127.0.0.1:5432/korre_test",
  APP_ORIGIN: "http://localhost:5173",
  NODE_ENV: "development",
  IDENTITY_SERVICE_SECRET: "s".repeat(32),
  IDENTITY_CSRF_SECRET: "c".repeat(32),
  IDENTITY_RATE_LIMIT_SECRET: "r".repeat(32),
  ...overrides,
});

describe("API startup configuration", () => {
  it("accepts explicit local development configuration without changing secrets", () => {
    const input = env();
    const config = loadApiStartupConfig(input);

    expect(config).toEqual({
      databaseUrl: input["DATABASE_URL"],
      appOrigin: input["APP_ORIGIN"],
      mode: "development",
      identityServiceSecret: input["IDENTITY_SERVICE_SECRET"],
      csrfSecret: input["IDENTITY_CSRF_SECRET"],
      rateLimitSecret: input["IDENTITY_RATE_LIMIT_SECRET"],
      port: 3001,
    });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("requires adequate secrets, a loopback dev origin, and a valid Postgres URL", () => {
    for (const invalid of [
      env({ IDENTITY_CSRF_SECRET: "short" }),
      env({ IDENTITY_RATE_LIMIT_SECRET: "short" }),
      env({ IDENTITY_SERVICE_SECRET: "short" }),
      env({ APP_ORIGIN: "https://counterball.example" }),
      env({ APP_ORIGIN: "http://localhost:5173/path" }),
      env({ DATABASE_URL: "https://example.test/database" }),
      env({ DATABASE_URL: "postgres://localhost/" }),
    ]) {
      expect(() => loadApiStartupConfig(invalid)).toThrow();
    }
  });

  it("requires HTTPS for production and rejects invalid ports", () => {
    expect(() => loadApiStartupConfig(env({ NODE_ENV: "production" }))).toThrow(
      /HTTPS/,
    );
    expect(
      loadApiStartupConfig(
        env({
          NODE_ENV: "production",
          APP_ORIGIN: "https://counterball.example",
        }),
      ).mode,
    ).toBe("production");
    for (const port of ["0", "65536", "3x", "1.2"]) {
      expect(() => loadApiStartupConfig(env({ PORT: port }))).toThrow(/PORT/);
    }
  });
});
