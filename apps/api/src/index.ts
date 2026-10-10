import { serve } from "@hono/node-server";
import { Pool } from "pg";
import { createApiApp } from "./app.js";
import { loadApiStartupConfig } from "./config.js";
import { IdentityService } from "./features/identity/application/identityService.js";
import { PostgresIdentityRepository } from "./features/identity/infrastructure/postgresIdentityRepository.js";

async function startApi(): Promise<void> {
  const config = loadApiStartupConfig(process.env);
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    application_name: "korre-identity-api",
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", () => {
    process.stderr.write("The identity database connection failed.\n");
  });

  try {
    const readiness = await pool.query<{ ready: boolean }>(
      "SELECT to_regclass('public.players') IS NOT NULL AND to_regclass('public.sessions') IS NOT NULL AND to_regclass('public.recovery_codes') IS NOT NULL AND to_regclass('public.identity_rate_limits') IS NOT NULL AS ready",
    );
    if (readiness.rows[0]?.ready !== true)
      throw new Error("The required identity schema is not installed.");
  } catch {
    await pool.end();
    throw new Error(
      "Identity API startup failed: database is unavailable or the identity migrations are not applied.",
    );
  }

  const service = new IdentityService(new PostgresIdentityRepository(pool), {
    csrfSecret: config.csrfSecret,
    rateLimitSecret: config.rateLimitSecret,
  });
  const app = createApiApp(
    {
      service,
      allowedOrigin: config.appOrigin,
      mode: config.mode,
      getClientAddress: (context) =>
        context.req.header("CF-Connecting-IP") ?? "",
    },
    config.identityServiceSecret,
  );
  const server = serve({ fetch: app.fetch, port: config.port });
  let stopping = false;
  const stop = (): void => {
    if (stopping) return;
    stopping = true;
    server.close((error) => {
      if (error) process.exitCode = 1;
      void pool.end().catch(() => {
        process.exitCode = 1;
      });
    });
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

await startApi();
