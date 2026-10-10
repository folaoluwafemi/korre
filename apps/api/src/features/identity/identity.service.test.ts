import { describe, expect, it, vi } from "vitest";
import {
  IdentityService,
  hashIdentitySecret,
} from "./application/identityService.js";
import type { IdentityRepository } from "./application/identityService.js";
import { UsernameTakenError } from "./infrastructure/postgresIdentityRepository.js";

const player = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "PlayerOne",
};
const config = { csrfSecret: "c".repeat(32), rateLimitSecret: "r".repeat(32) };

// These application-unit doubles prove no PostgreSQL behavior.
function setup() {
  const repository = {
    createIdentity: vi
      .fn<IdentityRepository["createIdentity"]>()
      .mockResolvedValue(player),
    validateSession: vi
      .fn<IdentityRepository["validateSession"]>()
      .mockResolvedValue(player),
    revokeSession: vi
      .fn<IdentityRepository["revokeSession"]>()
      .mockResolvedValue(undefined),
    redeemRecoveryCode: vi
      .fn<IdentityRepository["redeemRecoveryCode"]>()
      .mockResolvedValue(player),
    consumeRateLimits: vi
      .fn<IdentityRepository["consumeRateLimits"]>()
      .mockResolvedValue(true),
  } satisfies IdentityRepository;
  return { repository, service: new IdentityService(repository, config) };
}

describe("identity application unit behavior (not database evidence)", () => {
  it("issues random session/recovery values but stores only credential digests", async () => {
    const { service, repository } = setup();
    const first = await service.claim(
      { username: "PlayerOne", issueRecoveryCode: true },
      "127.0.0.1",
    );
    const second = await service.claim(
      { username: "PlayerTwo", issueRecoveryCode: false },
      "127.0.0.1",
    );
    expect(first.sessionToken).toHaveLength(43);
    expect(first.recoveryCode).toHaveLength(43);
    expect(first.sessionToken).not.toBe(second.sessionToken);
    expect(second).not.toHaveProperty("recoveryCode");
    const stored = repository.createIdentity.mock.calls[0]?.[0];
    expect(stored?.tokenHash).toBe(hashIdentitySecret(first.sessionToken));
    expect(stored?.recoveryHash).toBe(hashIdentitySecret(first.recoveryCode!));
    expect(JSON.stringify(stored)).not.toContain(first.sessionToken);
    expect(JSON.stringify(stored)).not.toContain(first.recoveryCode);
    expect(
      repository.consumeRateLimits.mock.calls[0]?.[0][0]?.bucketHash,
    ).toMatch(/^[0-9a-f]{64}$/);
    expect(
      JSON.stringify(repository.consumeRateLimits.mock.calls),
    ).not.toContain("127.0.0.1");
  });

  it("restores a session, rejects name-only authentication and verifies bound CSRF before logout", async () => {
    const { service, repository } = setup();
    expect(await service.restore("PlayerOne")).toBeNull();
    expect(repository.validateSession).not.toHaveBeenCalled();
    const issued = await service.claim(
      { username: "PlayerOne", issueRecoveryCode: false },
      "127.0.0.1",
    );
    expect(await service.restore(issued.sessionToken)).toEqual({
      player,
      csrfToken: issued.csrfToken,
    });
    await expect(
      service.logout(issued.sessionToken, "forged"),
    ).rejects.toMatchObject({ code: "invalidCsrf", status: 403 });
    expect(repository.revokeSession).not.toHaveBeenCalled();
    await service.logout(issued.sessionToken, issued.csrfToken);
    expect(repository.revokeSession).toHaveBeenCalledWith(
      hashIdentitySecret(issued.sessionToken),
    );
  });

  it("keeps all invalid recovery results generic and sends expected normalized username", async () => {
    const { service, repository } = setup();
    const failure = {
      code: "recoveryFailed",
      message: "The username or recovery code is invalid.",
    };
    await expect(
      service.recover(
        { username: "bad name", code: "a".repeat(43) },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject(failure);
    await expect(
      service.recover({ username: "PlayerOne", code: "bad" }, "127.0.0.1"),
    ).rejects.toMatchObject(failure);
    repository.redeemRecoveryCode.mockResolvedValueOnce(null);
    await expect(
      service.recover(
        { username: "PlayerOne", code: "a".repeat(43) },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject(failure);
    const issued = await service.recover(
      { username: "PLAYERONE", code: "a".repeat(43) },
      "127.0.0.1",
    );
    expect(
      repository.redeemRecoveryCode.mock.calls.at(-1)?.[0].expectedUsername,
    ).toEqual({ display: "PLAYERONE", key: "playerone" });
    expect(issued.recoveryCode).toHaveLength(43);
    expect(issued.sessionToken).not.toBe(issued.recoveryCode);
    const firstBuckets = repository.consumeRateLimits.mock.calls[2]?.[0];
    const secondBuckets = repository.consumeRateLimits.mock.calls[3]?.[0];
    expect(firstBuckets?.[1]).toEqual(secondBuckets?.[1]);
  });

  it("consumes both recovery buckets before rejecting over-policy strings generically", async () => {
    const { service, repository } = setup();
    const failure = {
      code: "recoveryFailed",
      message: "The username or recovery code is invalid.",
      status: 400,
    };
    for (const input of [
      { username: "x".repeat(25), code: "b".repeat(43) },
      { username: "PlayerOne", code: "b".repeat(129) },
    ]) {
      const before = repository.consumeRateLimits.mock.calls.length;
      await expect(service.recover(input, "127.0.0.1")).rejects.toMatchObject(
        failure,
      );
      expect(repository.consumeRateLimits).toHaveBeenCalledTimes(before + 1);
      const buckets = repository.consumeRateLimits.mock.calls.at(-1)?.[0];
      expect(buckets?.map((bucket) => bucket.scope)).toEqual([
        "recovery-ip",
        "recovery-account",
      ]);
      for (const bucket of buckets ?? [])
        expect(bucket.bucketHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(buckets)).not.toContain(input.username);
      expect(JSON.stringify(buckets)).not.toContain(input.code);
      expect(JSON.stringify(buckets)).not.toContain("127.0.0.1");
    }
    expect(repository.redeemRecoveryCode).not.toHaveBeenCalled();
    repository.consumeRateLimits.mockResolvedValueOnce(false);
    await expect(
      service.recover(
        { username: "x".repeat(25), code: "b".repeat(129) },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject({ code: "rateLimited", status: 429 });
    expect(repository.redeemRecoveryCode).not.toHaveBeenCalled();
  });

  it("honors repository-backed limits and reports username conflicts safely", async () => {
    const { service, repository } = setup();
    repository.consumeRateLimits.mockResolvedValueOnce(false);
    await expect(
      service.claim(
        { username: "PlayerOne", issueRecoveryCode: false },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject({ code: "rateLimited", status: 429 });
    expect(repository.createIdentity).not.toHaveBeenCalled();
    repository.createIdentity.mockRejectedValueOnce(new UsernameTakenError());
    await expect(
      service.claim(
        { username: "PlayerOne", issueRecoveryCode: false },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject({ code: "usernameTaken", status: 409 });
    expect(
      () => new IdentityService(repository, { ...config, csrfSecret: "weak" }),
    ).toThrow(/32 bytes/);
  });
});
