import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvalidUsernameError, parseUsername } from "./domain/username.js";
import {
  PostgresIdentityRepository,
  UsernameTakenError,
} from "./infrastructure/postgresIdentityRepository.js";

const digest = (): string =>
  createHash("sha256").update(randomUUID()).digest("hex");
const futureExpiry = (): Date => new Date(Date.now() + 3_600_000);

describe("launch username policy default", () => {
  it("retains display spelling and normalizes case", () => {
    expect(parseUsername("Player_One")).toEqual({
      display: "Player_One",
      key: "player_one",
    });
    expect(Object.isFrozen(parseUsername("Player_One"))).toBe(true);
  });
  it("rejects unsupported characters and SQL-looking input", () => {
    for (const value of [
      "ab",
      "x".repeat(25),
      "two words",
      "ValidName\n",
      "a'b",
      "a;DROP TABLE players",
      "éclair",
      null,
      123,
    ]) {
      expect(() => parseUsername(value)).toThrow(InvalidUsernameError);
    }
  });
});

// Explicit opt-in, loopback host and test-named database protect real services.
const databaseUrl = process.env["IDENTITY_TEST_DATABASE_URL"];
const enabled =
  databaseUrl !== undefined &&
  process.env["IDENTITY_TEST_DATABASE_ALLOW"] === "1";
const schemaName = `cb_identity_test_${randomUUID().replaceAll("-", "")}`;
let admin: Pool | undefined;
let pool: Pool;
let repository: PostgresIdentityRepository;

describe.skipIf(!enabled)(
  "identity repository — REAL PostgreSQL (NOT RUN without local test DB)",
  () => {
    beforeAll(async () => {
      const url = new URL(databaseUrl!);
      if (
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
        !/^\/[A-Za-z0-9_]+_test$/.test(url.pathname) ||
        !/^[a-z0-9_]+$/.test(schemaName)
      ) {
        throw new Error(
          "Identity tests require an explicitly authorized loopback database ending in _test.",
        );
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
      const migration = await readFile(
        new URL(
          "../../../../../infrastructure/database/migrations/001_identity.sql",
          import.meta.url,
        ),
        "utf8",
      );
      await pool.query(migration);
      repository = new PostgresIdentityRepository(pool);
    });

    afterAll(async () => {
      if (pool !== undefined) await pool.end();
      if (admin !== undefined) {
        // This random schema is created solely by this suite in an opt-in test DB.
        if (!/^cb_identity_test_[a-f0-9]{32}$/.test(schemaName))
          throw new Error("Unsafe test schema.");
        try {
          await admin.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
        } finally {
          await admin.end();
        }
      }
    });

    it("lets one concurrent case-insensitive username claim win", async () => {
      const results = await Promise.allSettled([
        repository.createPlayer(parseUsername("Concurrent")),
        repository.createPlayer(parseUsername("CONCURRENT")),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const failure = results.find((result) => result.status === "rejected");
      expect(
        failure?.status === "rejected" &&
          failure.reason instanceof UsernameTakenError,
      ).toBe(true);
      const player = await repository.findPlayerByUsername(
        parseUsername("concurrent"),
      );
      expect(player).not.toBeNull();
      expect(Object.keys(player!)).toEqual(["id", "username"]);
    });

    it("uses parameterized lookup and cannot authenticate with a username", async () => {
      expect(
        await repository.findPlayerById("00000000-0000-4000-8000-000000000000"),
      ).toBeNull();
      await expect(
        repository.findPlayerById("' OR '1'='1"),
      ).rejects.toMatchObject({ code: "22P02" });
      await expect(repository.validateSession("Concurrent")).rejects.toThrow(
        /digest/,
      );
      const count = await pool.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM players",
      );
      expect(count.rows[0]?.count).toBe(1);
    });

    it("validates expiry and revocation and never exposes credentials", async () => {
      const tokenHash = digest();
      const player = await repository.createIdentity({
        username: parseUsername("SessionUser"),
        tokenHash,
        expiresAt: futureExpiry(),
      });
      expect(await repository.validateSession(tokenHash)).toEqual(player);
      await pool.query(
        "UPDATE sessions SET created_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' WHERE token_hash = $1",
        [tokenHash],
      );
      expect(await repository.validateSession(tokenHash)).toBeNull();
      const freshHash = digest();
      await repository.createSession(player.id, freshHash, futureExpiry());
      await repository.revokeSession(freshHash);
      expect(await repository.validateSession(freshHash)).toBeNull();
    });

    it("consumes recovery once, rotates credentials, and revokes old sessions", async () => {
      const oldToken = digest();
      const codeHash = digest();
      const player = await repository.createIdentity({
        username: parseUsername("RecoveryUser"),
        tokenHash: oldToken,
        expiresAt: futureExpiry(),
        recoveryHash: codeHash,
      });
      const newToken = digest();
      const newRecovery = digest();
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash,
          newTokenHash: newToken,
          expiresAt: futureExpiry(),
          newRecoveryHash: newRecovery,
        }),
      ).toEqual(player);
      expect(await repository.validateSession(newToken)).toEqual(player);
      const results = await Promise.all([
        repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash: newRecovery,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
        repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash: newRecovery,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ]);
      expect(results.filter((result) => result !== null)).toHaveLength(1);
      expect(await repository.validateSession(oldToken)).toBeNull();
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ).toBeNull();
      expect(await repository.findPlayerById(player.id)).toEqual(player);
    });

    it("rolls back recovery consumption if session replacement fails", async () => {
      const tokenHash = digest();
      const codeHash = digest();
      const player = await repository.createIdentity({
        username: parseUsername("RollbackUser"),
        tokenHash,
        expiresAt: futureExpiry(),
        recoveryHash: codeHash,
      });
      await expect(
        repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash,
          newTokenHash: tokenHash,
          expiresAt: futureExpiry(),
        }),
      ).rejects.toMatchObject({ code: "23505" });
      expect(await repository.validateSession(tokenHash)).toEqual(player);
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ).toEqual(player);
    });

    it("replaces recovery hashes without leaving multiple active codes", async () => {
      const player = await repository.createPlayer(
        parseUsername("ReplaceUser"),
      );
      const oldCode = digest();
      const newCode = digest();
      await repository.replaceRecoveryCode(player.id, oldCode);
      await repository.replaceRecoveryCode(player.id, newCode);
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash: oldCode,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ).toBeNull();
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername(player.username),
          codeHash: newCode,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ).toEqual(player);
    });

    it("does not consume a recovery code for the wrong normalized username", async () => {
      const codeHash = digest();
      const player = await repository.createIdentity({
        username: parseUsername("ExpectedUser"),
        tokenHash: digest(),
        expiresAt: futureExpiry(),
        recoveryHash: codeHash,
      });
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername("WrongUser"),
          codeHash,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ).toBeNull();
      expect(
        await repository.redeemRecoveryCode({
          expectedUsername: parseUsername("EXPECTEDUSER"),
          codeHash,
          newTokenHash: digest(),
          expiresAt: futureExpiry(),
        }),
      ).toEqual(player);
    });

    it("persists atomic rate limits across repository instances and expires buckets", async () => {
      const bucket = {
        scope: "registration-ip" as const,
        bucketHash: digest(),
      };
      const results = await Promise.all(
        Array.from({ length: 6 }, () => repository.consumeRateLimits([bucket])),
      );
      expect(results.filter(Boolean)).toHaveLength(5);
      expect(
        await new PostgresIdentityRepository(pool).consumeRateLimits([bucket]),
      ).toBe(false);
      await pool.query(
        "UPDATE identity_rate_limits SET window_started_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' WHERE scope = $1 AND bucket_hash = $2",
        [bucket.scope, bucket.bucketHash],
      );
      expect(await repository.consumeRateLimits([bucket])).toBe(true);
      const recoveryBuckets = [
        { scope: "recovery-account" as const, bucketHash: digest() },
        { scope: "recovery-ip" as const, bucketHash: digest() },
      ];
      for (let index = 0; index < 5; index += 1)
        expect(await repository.consumeRateLimits(recoveryBuckets)).toBe(true);
      expect(
        await repository.consumeRateLimits([...recoveryBuckets].reverse()),
      ).toBe(false);
      const rows = await pool.query<{ attempts: number }>(
        "SELECT attempts FROM identity_rate_limits WHERE bucket_hash = ANY($1::text[])",
        [recoveryBuckets.map((item) => item.bucketHash)],
      );
      expect(rows.rows.map((row) => row.attempts)).toEqual([6, 6]);
    });
  },
);
