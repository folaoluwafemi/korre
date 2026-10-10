import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { parseUsername, InvalidUsernameError } from "../domain/username.js";
import { UsernameTakenError } from "../infrastructure/postgresIdentityRepository.js";
import type {
  PostgresIdentityRepository,
  PublicPlayer,
  RateLimitBucket,
} from "../infrastructure/postgresIdentityRepository.js";

export type IdentityRepository = Pick<
  PostgresIdentityRepository,
  | "createIdentity"
  | "validateSession"
  | "revokeSession"
  | "redeemRecoveryCode"
  | "consumeRateLimits"
>;
export type PublicIdentity = { player: PublicPlayer; csrfToken: string };
export type IssuedIdentity = PublicIdentity & {
  sessionToken: string;
  expiresAt: Date;
  recoveryCode?: string;
};
export type ClaimIdentityInput = {
  username: string;
  issueRecoveryCode: boolean;
};
export type RecoverIdentityInput = { username: string; code: string };
export type IdentityApplication = Pick<
  IdentityService,
  "claim" | "restore" | "recover" | "logout"
>;
export type IdentityServiceConfig = {
  csrfSecret: string;
  rateLimitSecret: string;
  sessionLifetimeMs?: number;
};
export type IdentityErrorCode =
  | "invalidUsername"
  | "usernameTaken"
  | "recoveryFailed"
  | "rateLimited"
  | "notAuthenticated"
  | "invalidCsrf";

export class IdentityServiceError extends Error {
  constructor(
    readonly code: IdentityErrorCode,
    readonly status: 400 | 401 | 403 | 409 | 429,
    message: string,
  ) {
    super(message);
    this.name = "IdentityServiceError";
  }
}

const secret = (): string => randomBytes(32).toString("base64url");
export const hashIdentitySecret = (value: string): string =>
  createHash("sha256").update(value).digest("hex");
const validSecret = (value: string): boolean =>
  value.length === 43 && /^[A-Za-z0-9_-]+$/.test(value);

export class IdentityService {
  private readonly lifetimeMs: number;
  private readonly config: Readonly<IdentityServiceConfig>;

  constructor(
    private readonly repository: IdentityRepository,
    config: IdentityServiceConfig,
  ) {
    if (
      Buffer.byteLength(config.csrfSecret, "utf8") < 32 ||
      Buffer.byteLength(config.rateLimitSecret, "utf8") < 32
    )
      throw new TypeError("Identity HMAC secrets require at least 32 bytes.");
    this.lifetimeMs = config.sessionLifetimeMs ?? 30 * 24 * 60 * 60 * 1_000;
    if (
      !Number.isSafeInteger(this.lifetimeMs) ||
      this.lifetimeMs <= 0 ||
      this.lifetimeMs > 30 * 24 * 60 * 60 * 1_000
    )
      throw new TypeError(
        "Identity session lifetime must be positive and at most 30 days.",
      );
    this.config = Object.freeze({ ...config });
  }

  private csrf(sessionToken: string): string {
    return createHmac("sha256", this.config.csrfSecret)
      .update(`csrf-v1:${sessionToken}`)
      .digest("base64url");
  }

  private bucket(
    scope: RateLimitBucket["scope"],
    value: string,
  ): RateLimitBucket {
    return {
      scope,
      bucketHash: createHmac("sha256", this.config.rateLimitSecret)
        .update(`${scope}:${value}`)
        .digest("hex"),
    };
  }

  private async limit(buckets: RateLimitBucket[]): Promise<void> {
    if (!(await this.repository.consumeRateLimits(buckets)))
      throw new IdentityServiceError(
        "rateLimited",
        429,
        "Too many attempts. Try again later.",
      );
  }

  async claim(
    input: ClaimIdentityInput,
    address: string,
  ): Promise<IssuedIdentity> {
    await this.limit([this.bucket("registration-ip", address)]);
    const sessionToken = secret();
    const recoveryCode = input.issueRecoveryCode ? secret() : undefined;
    const expiresAt = new Date(Date.now() + this.lifetimeMs);
    try {
      const player = await this.repository.createIdentity({
        username: parseUsername(input.username),
        tokenHash: hashIdentitySecret(sessionToken),
        expiresAt,
        ...(recoveryCode === undefined
          ? {}
          : { recoveryHash: hashIdentitySecret(recoveryCode) }),
      });
      return {
        player,
        sessionToken,
        csrfToken: this.csrf(sessionToken),
        expiresAt,
        ...(recoveryCode === undefined ? {} : { recoveryCode }),
      };
    } catch (error) {
      if (error instanceof InvalidUsernameError)
        throw new IdentityServiceError("invalidUsername", 400, error.message);
      if (error instanceof UsernameTakenError)
        throw new IdentityServiceError("usernameTaken", 409, error.message);
      throw error;
    }
  }

  async restore(sessionToken: string): Promise<PublicIdentity | null> {
    if (!validSecret(sessionToken)) return null;
    const player = await this.repository.validateSession(
      hashIdentitySecret(sessionToken),
    );
    return player === null
      ? null
      : { player, csrfToken: this.csrf(sessionToken) };
  }

  async recover(
    input: RecoverIdentityInput,
    address: string,
  ): Promise<IssuedIdentity> {
    await this.limit([
      this.bucket("recovery-ip", address),
      this.bucket("recovery-account", input.username.toLowerCase()),
    ]);
    const failure = (): IdentityServiceError =>
      new IdentityServiceError(
        "recoveryFailed",
        400,
        "The username or recovery code is invalid.",
      );
    let username;
    try {
      username = parseUsername(input.username);
    } catch (error) {
      if (error instanceof InvalidUsernameError) throw failure();
      throw error;
    }
    if (!validSecret(input.code)) throw failure();
    const sessionToken = secret();
    const recoveryCode = secret();
    const expiresAt = new Date(Date.now() + this.lifetimeMs);
    const player = await this.repository.redeemRecoveryCode({
      expectedUsername: username,
      codeHash: hashIdentitySecret(input.code),
      newTokenHash: hashIdentitySecret(sessionToken),
      expiresAt,
      newRecoveryHash: hashIdentitySecret(recoveryCode),
    });
    if (player === null) throw failure();
    return {
      player,
      sessionToken,
      csrfToken: this.csrf(sessionToken),
      expiresAt,
      recoveryCode,
    };
  }

  async logout(sessionToken: string, csrfToken: string): Promise<void> {
    const restored = await this.restore(sessionToken);
    if (restored === null)
      throw new IdentityServiceError(
        "notAuthenticated",
        401,
        "Your session has expired. Choose a username or recover your account.",
      );
    const expected = Buffer.from(restored.csrfToken);
    const received = Buffer.from(csrfToken);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    )
      throw new IdentityServiceError(
        "invalidCsrf",
        403,
        "Request verification failed.",
      );
    await this.repository.revokeSession(hashIdentitySecret(sessionToken));
  }
}
