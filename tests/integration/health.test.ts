import { describe, expect, it } from "vitest";
import { createApiApp } from "../../apps/api/src/app.js";
import type { IdentityApplication } from "../../apps/api/src/features/identity/application/identityService.js";

const identity: IdentityApplication = {
  claim: () =>
    Promise.reject(new Error("This health smoke does not issue identities.")),
  restore: () => Promise.resolve(null),
  recover: () =>
    Promise.reject(new Error("This health smoke does not recover identities.")),
  logout: () => Promise.resolve(),
};

const app = createApiApp(
  {
    service: identity,
    allowedOrigin: "http://localhost:5173",
    mode: "development",
    getClientAddress: (context) => context.req.header("CF-Connecting-IP") ?? "",
  },
  "s".repeat(32),
);

describe("API application boundary smoke", () => {
  it("serves health while identity routes are mounted on the same app", async () => {
    const response = await app.request("http://localhost:3001/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "api" });
    expect(
      (await app.request("http://localhost:3001/api/v1/session")).status,
    ).toBe(401);
  });
});
