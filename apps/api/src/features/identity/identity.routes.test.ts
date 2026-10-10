import { describe, expect, it, vi } from "vitest";
import { createIdentityRoutes } from "./http/identityRoutes.js";
import { IdentityServiceError } from "./application/identityService.js";
import type { IdentityApplication } from "./application/identityService.js";

const origin = "https://korre.example";
const token = "a".repeat(43);
const issued = {
  player: { id: "00000000-0000-4000-8000-000000000001", username: "PlayerOne" },
  csrfToken: "csrf-test-value",
  sessionToken: token,
  expiresAt: new Date(Date.now() + 60_000),
  recoveryCode: "b".repeat(43),
};

// HTTP/service doubles verify request handling, not SQL or deployed cookies.
function setup(mode: "production" | "development" = "production") {
  const service = {
    claim: vi.fn<IdentityApplication["claim"]>().mockResolvedValue(issued),
    restore: vi.fn<IdentityApplication["restore"]>().mockResolvedValue({
      player: issued.player,
      csrfToken: issued.csrfToken,
    }),
    recover: vi.fn<IdentityApplication["recover"]>().mockResolvedValue(issued),
    logout: vi.fn<IdentityApplication["logout"]>().mockResolvedValue(undefined),
  } satisfies IdentityApplication;
  const configuredOrigin =
    mode === "production" ? origin : "http://localhost:5173";
  const app = createIdentityRoutes({
    service,
    allowedOrigin: configuredOrigin,
    mode,
    getClientAddress: () => "127.0.0.1",
  });
  return { service, app, configuredOrigin };
}

describe("identity HTTP unit validation (not database evidence)", () => {
  it("sets a production HttpOnly host cookie while excluding session tokens from JSON", async () => {
    const { app, service } = setup();
    const response = await app.request("/api/v1/players", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ username: "PlayerOne", issueRecoveryCode: true }),
    });
    expect(response.status).toBe(201);
    expect(service.claim).toHaveBeenCalledWith(
      { username: "PlayerOne", issueRecoveryCode: true },
      "127.0.0.1",
    );
    const cookie = response.headers.get("Set-Cookie")!;
    expect(cookie).toContain(`__Host-korre_session=${token}`);
    for (const attribute of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"])
      expect(cookie).toContain(attribute);
    expect(cookie).not.toContain("Domain=");
    expect(await response.text()).not.toContain(token);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects wrong/missing origins, content type, extra keys, malformed JSON and oversized UTF-8 bodies", async () => {
    const { app, service } = setup();
    for (const attempt of [
      {
        origin: "https://other.example",
        type: "application/json",
        body: "{}",
        status: 403,
      },
      { origin: "", type: "application/json", body: "{}", status: 403 },
      { origin, type: "text/plain", body: "{}", status: 415 },
      { origin, type: "application/json", body: "{", status: 400 },
      {
        origin,
        type: "application/json",
        body: JSON.stringify({ username: "PlayerOne", team: "home" }),
        status: 400,
      },
      {
        origin,
        type: "application/json",
        body: JSON.stringify({ username: "é".repeat(2_100) }),
        status: 413,
      },
    ]) {
      const response = await app.request("/api/v1/players", {
        method: "POST",
        headers: { Origin: attempt.origin, "Content-Type": attempt.type },
        body: attempt.body,
      });
      expect(response.status).toBe(attempt.status);
    }
    expect(service.claim).not.toHaveBeenCalled();
  });

  it("restores only the configured cookie and requires CSRF through the service on logout", async () => {
    const { app, service } = setup();
    expect((await app.request("/api/v1/session")).status).toBe(401);
    expect(service.restore).not.toHaveBeenCalled();
    const headers = {
      Origin: origin,
      Cookie: `__Host-korre_session=${token}`,
      "Content-Type": "application/json",
      "X-CSRF-Token": issued.csrfToken,
    };
    expect((await app.request("/api/v1/session", { headers })).status).toBe(
      200,
    );
    service.logout.mockRejectedValueOnce(
      new IdentityServiceError(
        "invalidCsrf",
        403,
        "Request verification failed.",
      ),
    );
    expect(
      (
        await app.request("/api/v1/session", {
          method: "DELETE",
          headers,
          body: "{}",
        })
      ).status,
    ).toBe(403);
    const response = await app.request("/api/v1/session", {
      method: "DELETE",
      headers,
      body: "{}",
    });
    expect(response.status).toBe(204);
    expect(service.logout).toHaveBeenLastCalledWith(token, issued.csrfToken);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });

  it("recovers with username plus code, returns generic failure, and never exposes internal errors", async () => {
    const { app, service } = setup();
    const request = {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ username: "PlayerOne", code: "b".repeat(43) }),
    };
    expect((await app.request("/api/v1/recovery", request)).status).toBe(200);
    service.recover.mockRejectedValueOnce(
      new IdentityServiceError(
        "recoveryFailed",
        400,
        "The username or recovery code is invalid.",
      ),
    );
    expect((await app.request("/api/v1/recovery", request)).status).toBe(400);
    service.recover.mockRejectedValueOnce(
      new Error("DATABASE_URL and SQL should never escape"),
    );
    const failed = await app.request("/api/v1/recovery", request);
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain("DATABASE_URL");
    expect(
      (await app.request("/api/v1/session", { method: "POST" })).status,
    ).not.toBe(200);
  });

  it("passes over-policy recovery strings to the service and returns the same generic failure", async () => {
    const { app, service } = setup();
    const failure = {
      code: "recoveryFailed",
      message: "The username or recovery code is invalid.",
    };
    for (const input of [
      { username: "x".repeat(25), code: "b".repeat(43) },
      { username: "PlayerOne", code: "b".repeat(129) },
    ]) {
      service.recover.mockRejectedValueOnce(
        new IdentityServiceError("recoveryFailed", 400, failure.message),
      );
      const response = await app.request("/api/v1/recovery", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      expect(service.recover).toHaveBeenLastCalledWith(input, "127.0.0.1");
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(failure);
      expect(response.headers.get("Set-Cookie")).toBeNull();
    }
  });

  it("keeps recovery JSON shape and byte limits before service invocation", async () => {
    const { app, service } = setup();
    for (const input of [
      { username: 123, code: "b".repeat(43) },
      { username: "PlayerOne", code: 123 },
      { username: "PlayerOne" },
      { username: "PlayerOne", code: "b".repeat(43), extra: true },
    ]) {
      const response = await app.request("/api/v1/recovery", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "invalidRequest" });
    }
    const oversized = await app.request("/api/v1/recovery", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ username: "PlayerOne", code: "é".repeat(2_100) }),
    });
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({ code: "requestTooLarge" });
    expect(service.recover).not.toHaveBeenCalled();
  });

  it("uses a separate insecure development cookie only for configured loopback origin", async () => {
    const { app, configuredOrigin, service } = setup("development");
    const response = await app.request("/api/v1/players", {
      method: "POST",
      headers: { Origin: configuredOrigin, "Content-Type": "application/json" },
      body: JSON.stringify({ username: "PlayerOne" }),
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("Set-Cookie")).toContain("korre_dev_session=");
    expect(response.headers.get("Set-Cookie")).not.toContain("Secure");
    expect(() =>
      createIdentityRoutes({
        service,
        mode: "development",
        allowedOrigin: origin,
        getClientAddress: () => "127.0.0.1",
      }),
    ).toThrow(/loopback/);
    expect(() =>
      createIdentityRoutes({
        service,
        mode: "production",
        allowedOrigin: "http://localhost:5173",
        getClientAddress: () => "127.0.0.1",
      }),
    ).toThrow(/HTTPS/);
  });
});
