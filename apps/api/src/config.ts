export type ApiStartupConfig = Readonly<{
  databaseUrl: string;
  appOrigin: string;
  mode: "development" | "production";
  identityServiceSecret: string;
  csrfSecret: string;
  rateLimitSecret: string;
  port: number;
}>;

export type ApiEnvironment = Readonly<Record<string, string | undefined>>;

const required = (environment: ApiEnvironment, name: string): string => {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Required API setting ${name} is missing.`);
  return value;
};

export function loadApiStartupConfig(
  environment: ApiEnvironment,
): ApiStartupConfig {
  const modeValue = environment["NODE_ENV"] ?? "development";
  if (modeValue !== "development" && modeValue !== "production")
    throw new Error("NODE_ENV must be development or production.");

  const databaseUrl = required(environment, "DATABASE_URL");
  let database: URL;
  try {
    database = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (
    !["postgres:", "postgresql:"].includes(database.protocol) ||
    !database.hostname ||
    !database.pathname ||
    database.pathname === "/"
  )
    throw new Error("DATABASE_URL must name a PostgreSQL database.");

  const appOrigin = required(environment, "APP_ORIGIN");
  let origin: URL;
  try {
    origin = new URL(appOrigin);
  } catch {
    throw new Error("APP_ORIGIN must be one exact HTTP origin.");
  }
  if (
    origin.origin !== appOrigin ||
    origin.username.length > 0 ||
    origin.password.length > 0 ||
    !["http:", "https:"].includes(origin.protocol)
  )
    throw new Error("APP_ORIGIN must be one exact HTTP origin.");
  if (modeValue === "production" && origin.protocol !== "https:")
    throw new Error("Production APP_ORIGIN must use HTTPS.");
  if (
    modeValue === "development" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
  )
    throw new Error("Development APP_ORIGIN must use a loopback host.");

  const csrfSecret = required(environment, "IDENTITY_CSRF_SECRET");
  const rateLimitSecret = required(environment, "IDENTITY_RATE_LIMIT_SECRET");
  const identityServiceSecret = required(
    environment,
    "IDENTITY_SERVICE_SECRET",
  );
  if (
    Buffer.byteLength(csrfSecret, "utf8") < 32 ||
    Buffer.byteLength(rateLimitSecret, "utf8") < 32 ||
    Buffer.byteLength(identityServiceSecret, "utf8") < 32
  )
    throw new Error("Identity secrets must each contain at least 32 bytes.");

  const portInput = environment["PORT"] ?? "3001";
  const port = Number(portInput);
  if (
    !/^\d+$/.test(portInput) ||
    !Number.isSafeInteger(port) ||
    port < 1 ||
    port > 65_535
  )
    throw new Error("PORT must be an integer from 1 to 65535.");

  return Object.freeze({
    databaseUrl,
    appOrigin,
    mode: modeValue,
    identityServiceSecret,
    csrfSecret,
    rateLimitSecret,
    port,
  });
}
