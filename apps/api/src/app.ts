import { Hono } from "hono";
import { isIP } from "node:net";
import { timingSafeEqual } from "node:crypto";
import { createIdentityRoutes } from "./features/identity/http/identityRoutes.js";
import type { IdentityRouteConfig } from "./features/identity/http/identityRoutes.js";

/** Build the API only after real identity dependencies and edge trust are configured. */
export function createApiApp(
  identity: IdentityRouteConfig,
  identityServiceSecret: string,
): Hono {
  const expectedAuthorization = Buffer.from(
    `Bearer ${identityServiceSecret}`,
    "utf8",
  );
  if (Buffer.byteLength(identityServiceSecret, "utf8") < 32) {
    throw new TypeError("The identity service secret must contain 32 bytes.");
  }

  const app = new Hono();

  app.get("/health", (context) =>
    context.json({ status: "ok", service: "api" }),
  );
  app.use("/api/v1/*", async (context, next) => {
    const suppliedAuthorization = Buffer.from(
      context.req.header("Authorization") ?? "",
      "utf8",
    );
    const authenticated =
      suppliedAuthorization.length === expectedAuthorization.length &&
      timingSafeEqual(suppliedAuthorization, expectedAuthorization);
    if (!authenticated) {
      return context.json(
        {
          code: "serviceUnauthorized",
          message: "Service authentication required.",
        },
        401,
      );
    }

    const clientAddress = context.req.header("CF-Connecting-IP") ?? "";
    if (isIP(clientAddress) === 0) {
      return context.json(
        {
          code: "trustedClientAddressRequired",
          message: "A valid proxy client address is required.",
        },
        400,
      );
    }

    await next();
  });
  app.route("/", createIdentityRoutes(identity));

  return app;
}
