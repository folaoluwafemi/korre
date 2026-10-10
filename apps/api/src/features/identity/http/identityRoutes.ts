import { Hono } from "hono";
import type { ReadableStreamDefaultReader } from "node:stream/web";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { IdentityServiceError } from "../application/identityService.js";
import type {
  IdentityApplication,
  IssuedIdentity,
} from "../application/identityService.js";

export type IdentityRouteConfig = {
  service: IdentityApplication;
  allowedOrigin: string;
  mode: "production" | "development";
  getClientAddress: (context: Context) => string;
};

class InvalidIdentityRequest extends Error {
  constructor(
    readonly status: 400 | 403 | 413 | 415,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function boundedJson(context: Context): Promise<Record<string, unknown>> {
  if (
    context.req
      .header("Content-Type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  )
    throw new InvalidIdentityRequest(
      415,
      "jsonRequired",
      "Send an application/json request.",
    );
  const body = context.req.raw.body;
  if (body === null)
    throw new InvalidIdentityRequest(
      400,
      "invalidRequest",
      "A JSON object is required.",
    );
  const reader = body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const buffer = new Uint8Array(4_096);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > buffer.byteLength) {
        await reader.cancel();
        throw new InvalidIdentityRequest(
          413,
          "requestTooLarge",
          "Requests must be no larger than 4 KiB.",
        );
      }
      buffer.set(value, length);
      length += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        buffer.subarray(0, length),
      ),
    );
  } catch {
    throw new InvalidIdentityRequest(
      400,
      "invalidRequest",
      "Send a valid JSON object.",
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    throw new InvalidIdentityRequest(
      400,
      "invalidRequest",
      "A JSON object is required.",
    );
  return parsed as Record<string, unknown>;
}

function exactKeys(
  input: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
): void {
  if (
    required.some((key) => !Object.hasOwn(input, key)) ||
    Object.keys(input).some((key) => ![...required, ...optional].includes(key))
  )
    throw new InvalidIdentityRequest(
      400,
      "invalidRequest",
      "Request fields are invalid.",
    );
}

export function createIdentityRoutes(config: IdentityRouteConfig): Hono {
  if (config.mode !== "production" && config.mode !== "development")
    throw new TypeError("Select an explicit identity cookie mode.");
  const origin = new URL(config.allowedOrigin);
  if (
    origin.origin !== config.allowedOrigin ||
    origin.username ||
    origin.password
  )
    throw new TypeError(
      "Configure one exact client origin without paths or credentials.",
    );
  if (config.mode === "production" && origin.protocol !== "https:")
    throw new TypeError("Production identity requires an HTTPS origin.");
  if (
    config.mode === "development" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
  )
    throw new TypeError("Development identity cookies are loopback-only.");
  if (origin.protocol !== "http:" && origin.protocol !== "https:")
    throw new TypeError("Identity requires an HTTP or HTTPS client origin.");
  const cookieName =
    config.mode === "production" ? "__Host-korre_session" : "korre_dev_session";
  const secure = config.mode === "production";
  const app = new Hono();
  app.use("/api/v1/*", async (context, next) => {
    context.header("Cache-Control", "no-store");
    context.header("Vary", "Origin, Cookie");
    const receivedOrigin = context.req.header("Origin");
    if (receivedOrigin !== undefined && receivedOrigin !== config.allowedOrigin)
      return context.json(
        {
          code: "forbiddenOrigin",
          message: "This request origin is not allowed.",
        },
        403,
      );
    if (context.req.method !== "GET" && receivedOrigin !== config.allowedOrigin)
      return context.json(
        {
          code: "forbiddenOrigin",
          message: "This request origin is not allowed.",
        },
        403,
      );
    if (
      context.req.method === "GET" &&
      context.req.header("Sec-Fetch-Site") === "cross-site"
    )
      return context.json(
        {
          code: "forbiddenOrigin",
          message: "This request origin is not allowed.",
        },
        403,
      );
    await next();
  });
  app.onError((error, context) => {
    if (
      error instanceof InvalidIdentityRequest ||
      error instanceof IdentityServiceError
    )
      return context.json(
        { code: error.code, message: error.message },
        error.status,
      );
    return context.json(
      {
        code: "serviceUnavailable",
        message: "Account service is unavailable. Try again later.",
      },
      503,
    );
  });

  const issueCookie = (context: Context, issued: IssuedIdentity): void => {
    setCookie(context, cookieName, issued.sessionToken, {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
      expires: issued.expiresAt,
    });
  };
  const address = (context: Context): string => {
    const value = config.getClientAddress(context);
    if (!value || value.length > 256)
      throw new Error("Trusted client address is unavailable.");
    return value;
  };

  app.post("/api/v1/players", async (context) => {
    const input = await boundedJson(context);
    exactKeys(input, ["username"], ["issueRecoveryCode"]);
    if (
      typeof input["username"] !== "string" ||
      input["username"].length > 24 ||
      (input["issueRecoveryCode"] !== undefined &&
        typeof input["issueRecoveryCode"] !== "boolean")
    )
      throw new InvalidIdentityRequest(
        400,
        "invalidRequest",
        "Request fields are invalid.",
      );
    const issued = await config.service.claim(
      {
        username: input["username"],
        issueRecoveryCode: input["issueRecoveryCode"] === true,
      },
      address(context),
    );
    issueCookie(context, issued);
    return context.json(
      {
        player: issued.player,
        csrfToken: issued.csrfToken,
        ...(issued.recoveryCode === undefined
          ? {}
          : { recoveryCode: issued.recoveryCode }),
      },
      201,
    );
  });

  app.get("/api/v1/session", async (context) => {
    const token = getCookie(context, cookieName);
    const identity =
      token === undefined ? null : await config.service.restore(token);
    if (identity === null)
      return context.json(
        { code: "notAuthenticated", message: "No active account session." },
        401,
      );
    return context.json(identity);
  });

  app.delete("/api/v1/session", async (context) => {
    exactKeys(await boundedJson(context), []);
    await config.service.logout(
      getCookie(context, cookieName) ?? "",
      context.req.header("X-CSRF-Token") ?? "",
    );
    setCookie(context, cookieName, "", {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    });
    return context.body(null, 204);
  });

  app.post("/api/v1/recovery", async (context) => {
    const input = await boundedJson(context);
    exactKeys(input, ["username", "code"]);
    if (
      typeof input["username"] !== "string" ||
      typeof input["code"] !== "string"
    )
      throw new InvalidIdentityRequest(
        400,
        "invalidRequest",
        "Request fields are invalid.",
      );
    const issued = await config.service.recover(
      { username: input["username"], code: input["code"] },
      address(context),
    );
    issueCookie(context, issued);
    return context.json({
      player: issued.player,
      csrfToken: issued.csrfToken,
      recoveryCode: issued.recoveryCode,
    });
  });
  return app;
}
