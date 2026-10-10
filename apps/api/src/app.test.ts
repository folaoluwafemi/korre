import { describe, expect, it, vi } from "vitest";
import { createApiApp } from "./app.js";
import type { IdentityApplication } from "./features/identity/application/identityService.js";

const origin = "https://counterball.example";
const serviceSecret = "s".repeat(32);
const trustedClientAddress = "198.51.100.42";
const issued = {
  player: { id: "00000000-0000-4000-8000-000000000001", username: "PlayerOne" },
  csrfToken: "csrf-test-value",
  sessionToken: "a".repeat(43),
  expiresAt: new Date(Date.now() + 60_000),
};

function makeApp() {
  const service = {
    claim: vi.fn<IdentityApplication["claim"]>().mockResolvedValue(issued),
    restore: vi.fn<IdentityApplication["restore"]>().mockResolvedValue({
      player: issued.player,
      csrfToken: issued.csrfToken,
    }),
    recover: vi.fn<IdentityApplication["recover"]>().mockResolvedValue({
      ...issued,
      recoveryCode: "b".repeat(43),
    }),
    logout: vi.fn<IdentityApplication["logout"]>().mockResolvedValue(undefined),
  } satisfies IdentityApplication;

  return {
    service,
    app: createApiApp(
      {
        service,
        allowedOrigin: origin,
        mode: "production",
        getClientAddress: (context) =>
          context.req.header("CF-Connecting-IP") ?? "",
      },
      serviceSecret,
    ),
  };
}

describe("API composition", () => {
  it("keeps a live JSON health route and returns 404 for unknown routes", async () => {
    const { app } = makeApp();
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(
      /^application\/json(?:;|$)/,
    );
    expect(await response.text()).toBe('{"status":"ok","service":"api"}');
    expect((await app.request("/not-found")).status).toBe(404);
  });

  it("mounts identity routes under the API prefix", async () => {
    const { app, service } = makeApp();
    const response = await app.request("/api/v1/players", {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceSecret}`,
        "CF-Connecting-IP": trustedClientAddress,
      },
      body: JSON.stringify({ username: "PlayerOne" }),
    });

    expect(response.status).toBe(201);
    expect(service.claim).toHaveBeenCalledWith(
      { username: "PlayerOne", issueRecoveryCode: false },
      trustedClientAddress,
    );
    expect(await response.json()).toEqual({
      player: issued.player,
      csrfToken: issued.csrfToken,
    });
  });

  it("rejects caller-supplied proxy metadata without the edge credential", async () => {
    const { app, service } = makeApp();
    const response = await app.request("/api/v1/players", {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "CF-Connecting-IP": trustedClientAddress,
      },
      body: JSON.stringify({ username: "PlayerOne" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: "serviceUnauthorized",
    });
    expect(service.claim).not.toHaveBeenCalled();
  });

  it.each([undefined, "spoofed, 198.51.100.42"])(
    "rejects missing or invalid trusted client metadata (%s)",
    async (clientAddress) => {
      const { app, service } = makeApp();
      const response = await app.request("/api/v1/players", {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceSecret}`,
          ...(clientAddress === undefined
            ? {}
            : { "CF-Connecting-IP": clientAddress }),
        },
        body: JSON.stringify({ username: "PlayerOne" }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: "trustedClientAddressRequired",
      });
      expect(service.claim).not.toHaveBeenCalled();
    },
  );
});
