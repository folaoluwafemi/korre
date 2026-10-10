import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiApp } from "../../app.js";
import {
  hashIdentitySecret,
  IdentityService,
} from "./application/identityService.js";
import { PostgresIdentityRepository } from "./infrastructure/postgresIdentityRepository.js";

type IdentityReply = {
  player: { id: string; username: string };
  csrfToken: string;
  recoveryCode: string;
};

const databaseUrl = process.env["IDENTITY_TEST_DATABASE_URL"];
const enabled =
  databaseUrl !== undefined &&
  process.env["IDENTITY_TEST_DATABASE_ALLOW"] === "1";
if (process.env["CI"] && !enabled) {
  throw new Error(
    "CI identity acceptance requires the opted-in test database.",
  );
}
if (enabled) {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("The identity test database URL is invalid.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/[A-Za-z0-9_]+_test$/.test(url.pathname) ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("Use an opted-in loopback _test database without options.");
  }
}
const schemaName = `cb_http_test_${randomUUID().replaceAll("-", "")}`;
const origin = "https://counterball.example";
const serviceSecret = randomBytes(32).toString("base64url");
let admin: Pool | undefined;
let pool: Pool | undefined;
let app: ReturnType<typeof createApiApp>;

function request(
  path: string,
  method: "GET" | "POST" | "DELETE",
  input?: Record<string, unknown>,
  cookie?: string,
  csrfToken?: string,
  address = "198.51.100.21",
): Promise<Response> {
  return Promise.resolve(
    app.request(path, {
      method,
      headers: {
        Origin: origin,
        Authorization: `Bearer ${serviceSecret}`,
        "CF-Connecting-IP": address,
        ...(input === undefined ? {} : { "Content-Type": "application/json" }),
        ...(cookie === undefined ? {} : { Cookie: cookie }),
        ...(csrfToken === undefined ? {} : { "X-CSRF-Token": csrfToken }),
      },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    }),
  );
}

function sessionCookie(response: Response): { cookie: string; token: string } {
  const header = response.headers.get("Set-Cookie") ?? "";
  const token = /^__Host-korre_session=([A-Za-z0-9_-]{43})(?:;|$)/.exec(
    header,
  )?.[1];
  if (token === undefined)
    throw new Error("Expected an opaque session cookie.");
  for (const attribute of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) {
    expect(header.includes(attribute)).toBe(true);
  }
  expect(header.includes("Domain=")).toBe(false);
  return { cookie: `__Host-korre_session=${token}`, token };
}

async function issuedReply(
  response: Response,
  token: string,
): Promise<IdentityReply> {
  const text = await response.text();
  expect(text.includes(token)).toBe(false);
  const reply = JSON.parse(text) as IdentityReply;
  expect(typeof reply.csrfToken).toBe("string");
  expect(typeof reply.recoveryCode).toBe("string");
  expect(reply.recoveryCode.length).toBe(43);
  return reply;
}

describe.skipIf(!enabled)("identity HTTP with REAL PostgreSQL", () => {
  beforeAll(async () => {
    if (!/^cb_http_test_[a-f0-9]{32}$/.test(schemaName)) {
      throw new Error("Unsafe identity test schema.");
    }
    admin = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 2_000,
    });
    await admin.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({
      connectionString: databaseUrl,
      options: `-c search_path=${schemaName}`,
      connectionTimeoutMillis: 2_000,
    });
    const sql = await readFile(
      new URL(
        "../../../../../infrastructure/database/migrations/001_identity.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await pool.query(sql);
    app = createApiApp(
      {
        service: new IdentityService(new PostgresIdentityRepository(pool), {
          csrfSecret: randomBytes(32).toString("base64url"),
          rateLimitSecret: randomBytes(32).toString("base64url"),
        }),
        allowedOrigin: origin,
        mode: "production",
        getClientAddress: (context) =>
          context.req.header("CF-Connecting-IP") ?? "",
      },
      serviceSecret,
    );
  });

  afterAll(async () => {
    const cleanupErrors: unknown[] = [];
    try {
      await pool?.end();
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (admin !== undefined) {
      if (!/^cb_http_test_[a-f0-9]{32}$/.test(schemaName)) {
        cleanupErrors.push(new Error("Unsafe test schema cleanup."));
      } else {
        try {
          await admin.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
      try {
        await admin.end();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, "Identity test cleanup failed.");
    }
  });

  it("claims, restores, recovers once, rotates, and verifies CSRF/logout", async () => {
    const claimed = await request("/api/v1/players", "POST", {
      username: "HttpPlayer",
      issueRecoveryCode: true,
    });
    expect(claimed.status).toBe(201);
    const first = sessionCookie(claimed);
    const identity = await issuedReply(claimed, first.token);
    const conflicting = await request("/api/v1/players", "POST", {
      username: "HTTPPLAYER",
    });
    expect(conflicting.status).toBe(409);
    expect(conflicting.headers.has("Set-Cookie")).toBe(false);
    expect(await conflicting.json()).toMatchObject({ code: "usernameTaken" });

    const restored = await request(
      "/api/v1/session",
      "GET",
      undefined,
      first.cookie,
    );
    expect(restored.status).toBe(200);
    const publicIdentity = (await restored.json()) as IdentityReply;
    expect(publicIdentity.player).toEqual(identity.player);
    expect(Object.hasOwn(publicIdentity, "sessionToken")).toBe(false);
    expect(Object.hasOwn(publicIdentity, "recoveryCode")).toBe(false);
    expect(
      (
        await request(
          "/api/v1/session",
          "GET",
          undefined,
          "__Host-korre_session=HttpPlayer",
        )
      ).status,
    ).toBe(401);
    expect(
      (await request("/api/v1/session", "DELETE", {}, first.cookie, "forged"))
        .status,
    ).toBe(403);
    expect(
      (await request("/api/v1/session", "GET", undefined, first.cookie)).status,
    ).toBe(200);

    const wrongName = await request("/api/v1/recovery", "POST", {
      username: "OtherPlayer",
      code: identity.recoveryCode,
    });
    expect(wrongName.status).toBe(400);
    expect(await wrongName.json()).toMatchObject({ code: "recoveryFailed" });
    const recovered = await request("/api/v1/recovery", "POST", {
      username: "HTTPPLAYER",
      code: identity.recoveryCode,
    });
    expect(recovered.status).toBe(200);
    const second = sessionCookie(recovered);
    const rotated = await issuedReply(recovered, second.token);
    expect(second.token === first.token).toBe(false);
    expect(rotated.recoveryCode === identity.recoveryCode).toBe(false);
    expect(rotated.player).toEqual(identity.player);
    expect(
      (await request("/api/v1/session", "GET", undefined, first.cookie)).status,
    ).toBe(401);
    expect(
      (await request("/api/v1/session", "GET", undefined, second.cookie))
        .status,
    ).toBe(200);
    const replay = await request("/api/v1/recovery", "POST", {
      username: "HttpPlayer",
      code: identity.recoveryCode,
    });
    expect(replay.status).toBe(400);
    expect(replay.headers.has("Set-Cookie")).toBe(false);
    expect(await replay.json()).toMatchObject({ code: "recoveryFailed" });

    if (pool === undefined)
      throw new Error("Test database was not initialized.");
    const stored = await pool.query<{ token_hash: string }>(
      "SELECT token_hash FROM sessions WHERE player_id = $1",
      [identity.player.id],
    );
    expect(stored.rows.length).toBe(2);
    expect(
      stored.rows.some(
        ({ token_hash }) => token_hash === hashIdentitySecret(first.token),
      ),
    ).toBe(true);
    expect(
      stored.rows.some(
        ({ token_hash }) => token_hash === hashIdentitySecret(second.token),
      ),
    ).toBe(true);
    expect(JSON.stringify(stored.rows).includes(first.token)).toBe(false);
    expect(JSON.stringify(stored.rows).includes(second.token)).toBe(false);

    const logout = await request(
      "/api/v1/session",
      "DELETE",
      {},
      second.cookie,
      rotated.csrfToken,
    );
    expect(logout.status).toBe(204);
    expect((logout.headers.get("Set-Cookie") ?? "").includes("Max-Age=0")).toBe(
      true,
    );
    expect(
      (await request("/api/v1/session", "GET", undefined, second.cookie))
        .status,
    ).toBe(401);
  });

  it("lets exactly one concurrent case-insensitive HTTP claim win", async () => {
    const responses = await Promise.all([
      request(
        "/api/v1/players",
        "POST",
        { username: "HttpConcurrent" },
        undefined,
        undefined,
        "198.51.100.22",
      ),
      request(
        "/api/v1/players",
        "POST",
        { username: "HTTPCONCURRENT" },
        undefined,
        undefined,
        "198.51.100.23",
      ),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    if (pool === undefined)
      throw new Error("Test database was not initialized.");
    const count = await pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM players WHERE username_key = $1",
      ["httpconcurrent"],
    );
    expect(count.rows[0]?.count).toBe(1);
  });
});
