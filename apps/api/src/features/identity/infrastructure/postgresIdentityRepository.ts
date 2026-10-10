import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { parseUsername } from "../domain/username.js";
import type { Username } from "../domain/username.js";

export type PublicPlayer = { id: string; username: string };
export type IdentityCreation = {
  username: Username;
  tokenHash: string;
  expiresAt: Date;
  recoveryHash?: string;
};
export type RecoveryRedemption = {
  expectedUsername: Username;
  codeHash: string;
  newTokenHash: string;
  expiresAt: Date;
  newRecoveryHash?: string;
};

export type RateLimitBucket = {
  scope: "registration-ip" | "recovery-ip" | "recovery-account";
  bucketHash: string;
};

export class UsernameTakenError extends Error {
  readonly code = "usernameTaken";
  constructor() {
    super("That username is already taken.");
    this.name = "UsernameTakenError";
  }
}

function assertHash(hash: string): void {
  if (hash.length !== 64 || !/^[0-9a-f]{64}$/.test(hash))
    throw new TypeError("Expected a SHA-256 credential digest.");
}

function assertExpiry(expiresAt: Date): void {
  if (
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() <= Date.now()
  ) {
    throw new TypeError("Session expiry must be a future date.");
  }
}

function isUsernameConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    error.constraint === "players_username_key_key"
  );
}

/** Credentials are digests only. SQL always returns the public projection. */
export class PostgresIdentityRepository {
  constructor(private readonly pool: Pool) {}

  async consumeRateLimits(
    buckets: readonly RateLimitBucket[],
  ): Promise<boolean> {
    if (buckets.length < 1 || buckets.length > 2)
      throw new TypeError("Expected one or two rate-limit buckets.");
    for (const bucket of buckets) assertHash(bucket.bucketHash);
    const sorted = [...buckets].sort((left, right) =>
      `${left.scope}:${left.bucketHash}`.localeCompare(
        `${right.scope}:${right.bucketHash}`,
      ),
    );
    if (
      new Set(sorted.map((bucket) => `${bucket.scope}:${bucket.bucketHash}`))
        .size !== sorted.length
    )
      throw new TypeError("Duplicate rate-limit bucket.");
    // SKIP LOCKED permits bounded cleanup without waiting on active buckets.
    await this.pool.query(
      "WITH expired AS (SELECT scope, bucket_hash FROM identity_rate_limits WHERE expires_at <= now() ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED) DELETE FROM identity_rate_limits r USING expired e WHERE r.scope = e.scope AND r.bucket_hash = e.bucket_hash",
    );
    return this.transaction(async (client) => {
      let allowed = true;
      for (const bucket of sorted) {
        const result = await client.query<{ attempts: number }>(
          "INSERT INTO identity_rate_limits (scope, bucket_hash, window_started_at, attempts, expires_at) VALUES ($1, $2, now(), 1, now() + interval '1 hour') ON CONFLICT (scope, bucket_hash) DO UPDATE SET attempts = CASE WHEN identity_rate_limits.expires_at <= now() THEN 1 ELSE LEAST(identity_rate_limits.attempts + 1, 6) END, window_started_at = CASE WHEN identity_rate_limits.expires_at <= now() THEN now() ELSE identity_rate_limits.window_started_at END, expires_at = CASE WHEN identity_rate_limits.expires_at <= now() THEN now() + interval '1 hour' ELSE identity_rate_limits.expires_at END RETURNING attempts",
          [bucket.scope, bucket.bucketHash],
        );
        if (!result.rows[0] || result.rows[0].attempts > 5) allowed = false;
      }
      return allowed;
    });
  }

  private async transaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    let discardClient = false;
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        discardClient = true;
      }
      throw error;
    } finally {
      client.release(discardClient);
    }
  }

  private async insertPlayer(
    client: PoolClient,
    username: Username,
  ): Promise<PublicPlayer> {
    const validated = parseUsername(username.display);
    if (validated.key !== username.key)
      throw new TypeError("Username key does not match display spelling.");
    try {
      const result = await client.query<PublicPlayer>(
        "INSERT INTO players (id, username_display, username_key) VALUES ($1, $2, $3) RETURNING id, username_display AS username",
        [randomUUID(), validated.display, validated.key],
      );
      if (!result.rows[0])
        throw new Error("Player creation returned no player.");
      return result.rows[0];
    } catch (error) {
      if (isUsernameConflict(error)) throw new UsernameTakenError();
      throw error;
    }
  }

  createPlayer(username: Username): Promise<PublicPlayer> {
    return this.transaction((client) => this.insertPlayer(client, username));
  }

  createIdentity(input: IdentityCreation): Promise<PublicPlayer> {
    assertHash(input.tokenHash);
    assertExpiry(input.expiresAt);
    if (input.recoveryHash !== undefined) assertHash(input.recoveryHash);
    return this.transaction(async (client) => {
      const player = await this.insertPlayer(client, input.username);
      await client.query(
        "INSERT INTO sessions (token_hash, player_id, expires_at) VALUES ($1, $2, $3)",
        [input.tokenHash, player.id, input.expiresAt],
      );
      if (input.recoveryHash !== undefined) {
        await client.query(
          "INSERT INTO recovery_codes (code_hash, player_id) VALUES ($1, $2)",
          [input.recoveryHash, player.id],
        );
      }
      return player;
    });
  }

  async findPlayerByUsername(username: Username): Promise<PublicPlayer | null> {
    const validated = parseUsername(username.display);
    const result = await this.pool.query<PublicPlayer>(
      "SELECT id, username_display AS username FROM players WHERE username_key = $1",
      [validated.key],
    );
    return result.rows[0] ?? null;
  }

  async findPlayerById(playerId: string): Promise<PublicPlayer | null> {
    const result = await this.pool.query<PublicPlayer>(
      "SELECT id, username_display AS username FROM players WHERE id = $1",
      [playerId],
    );
    return result.rows[0] ?? null;
  }

  async createSession(
    playerId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    assertHash(tokenHash);
    assertExpiry(expiresAt);
    await this.pool.query(
      "INSERT INTO sessions (token_hash, player_id, expires_at) VALUES ($1, $2, $3)",
      [tokenHash, playerId, expiresAt],
    );
  }

  async validateSession(tokenHash: string): Promise<PublicPlayer | null> {
    assertHash(tokenHash);
    const result = await this.pool.query<PublicPlayer>(
      "SELECT p.id, p.username_display AS username FROM sessions s JOIN players p ON p.id = s.player_id WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()",
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    assertHash(tokenHash);
    await this.pool.query(
      "UPDATE sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE token_hash = $1",
      [tokenHash],
    );
  }

  async replaceRecoveryCode(playerId: string, codeHash: string): Promise<void> {
    assertHash(codeHash);
    await this.transaction(async (client) => {
      const player = await client.query(
        "SELECT id FROM players WHERE id = $1 FOR UPDATE",
        [playerId],
      );
      if (player.rowCount !== 1) throw new Error("Player does not exist.");
      await client.query(
        "UPDATE recovery_codes SET consumed_at = now() WHERE player_id = $1 AND consumed_at IS NULL",
        [playerId],
      );
      await client.query(
        "INSERT INTO recovery_codes (code_hash, player_id) VALUES ($1, $2)",
        [codeHash, playerId],
      );
    });
  }

  redeemRecoveryCode(input: RecoveryRedemption): Promise<PublicPlayer | null> {
    const username = parseUsername(input.expectedUsername.display);
    if (username.key !== input.expectedUsername.key)
      throw new TypeError("Expected username key mismatch.");
    assertHash(input.codeHash);
    assertHash(input.newTokenHash);
    assertExpiry(input.expiresAt);
    if (input.newRecoveryHash !== undefined) {
      assertHash(input.newRecoveryHash);
      if (input.newRecoveryHash === input.codeHash)
        throw new TypeError("Recovery must issue a fresh digest.");
    }
    return this.transaction(async (client) => {
      // All recovery mutation paths lock the player first, then the code row.
      const result = await client.query<PublicPlayer>(
        "SELECT p.id, p.username_display AS username FROM players p JOIN recovery_codes r ON r.player_id = p.id WHERE r.code_hash = $1 AND p.username_key = $2 FOR UPDATE OF p",
        [input.codeHash, username.key],
      );
      const player = result.rows[0];
      if (!player) return null;
      const consumed = await client.query(
        "UPDATE recovery_codes SET consumed_at = now() WHERE code_hash = $1 AND consumed_at IS NULL RETURNING player_id",
        [input.codeHash],
      );
      if (consumed.rowCount !== 1) return null;
      await client.query(
        "UPDATE sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE player_id = $1",
        [player.id],
      );
      await client.query(
        "INSERT INTO sessions (token_hash, player_id, expires_at) VALUES ($1, $2, $3)",
        [input.newTokenHash, player.id, input.expiresAt],
      );
      if (input.newRecoveryHash !== undefined) {
        await client.query(
          "INSERT INTO recovery_codes (code_hash, player_id) VALUES ($1, $2)",
          [input.newRecoveryHash, player.id],
        );
      }
      return player;
    });
  }
}
