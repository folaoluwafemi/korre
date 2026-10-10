# T01 independent review and repair re-review

Date: 10 October 2026
Reviewer: `/root/swarm_review`
Final verdict: **PASS for the T01 protocol/SDK acceptance gate**

The reviewer did not implement T01 or its repairs. Only this report was written.
Coordinator acceptance and runtime task status remain separate.

## First review and repairs

The initial review required changes for two reproduced defects:

1. Canonical JSON lost an own `__proto__` key and returned `{}` for distinct data.
2. The parser accepted a 606,802-byte chunk with 452 frames and chunkIndex=2/chunkCount=1.

Both defects are now closed within the assigned acceptance scope.

## Repair evidence

- `packages/game-protocol/src/config.ts:175` uses a null-prototype accumulator. Own `__proto__` keys remain ordinary JSON properties.
- `packages/game-protocol/src/protocol.test.ts:247` checks exact canonical output for `JSON.parse('{"__proto__":{"a":1}}')`. It checks distinct canonical strings and SHA-256 hashes from `{}`.
- `packages/game-protocol/src/schemas.ts:345` rejects chunkIndex >= chunkCount.
- `schemas.ts:329` measures UTF-8 JSON bytes for the exact canonical chunk fields. `schemas.ts:352` rejects values above 32,768 bytes.
- `schemas.ts:258` bounds simulation facts at 8,192. `schemas.ts:263` bounds simulation frames at 451.
- `schemas.ts:285` bounds waitingPlayerIds at 20. The general serialized-input guard also bounds JSON arrays at 8,192.
- `schemas.ts:440` requires metadata for snapshot chunks. `schemas.ts:450` checks shot ID correspondence.
- `schemas.ts:458` rejects duplicate snapshot chunk indexes. `schemas.ts:466` checks consistent chunk counts.
- `schemas.ts:475` rejects aggregate encoded snapshot playback above 1,048,576 bytes.

The current protocol regression test covers valid chunk and snapshot parsing, invalid indexes, oversized chunks, mismatched snapshot shot metadata, duplicate indexes, aggregate snapshot size, 452 frames, 8,193 facts, and 21 waiting IDs.
The aggregate-size case builds individually bounded chunks with unique indexes. It explicitly checks that total encoded bytes exceed 1 MiB.
Source inspection also confirms consistent-count validation. The limits match `CONTRACTS.md:154`.

## Other acceptance evidence

The current fixture still parses. It contains fifteen unique entities and seven caps for each team.
Version/config tags match the immutable base configuration and computed hash.
Fixture rule labels still distinguish confirmed facts and provisional defaults.
Physics calibration remains null. No fixture claims measured Havok behavior.

The SDK tests confirm two-player AI/online manifest settings and spectator support.
Local and network test adapters implement the same GameTransport interface.
Concurrent disposal calls share one promise and invoke mounted resource disposal once.
Identity and room membership remain outside MatchState.

The package test-script repairs resolve the shared test configuration.
The root smoke checks real public exports; test DOM declarations support the HTMLElement mount contract.
Those changes match recorded coordinator authorization.
No forbidden implementation-library imports were found in protocol/SDK source.

## Actual reviewer checks

Working directory: `C:\Users\USER\StudioProjects\korre`.

| Command | Exit | Result |
|---|---:|---|
| `pnpm.cmd --filter @korre/game-protocol test` | 0 | One file; nine tests passed after the final snapshot regression additions. |
| `pnpm.cmd --filter @korre/game-sdk test` | 0 | One file; three tests passed. |
| `rg` forbidden-library imports in protocol/SDK source | 1 | No Babylon, React, Hono, pg, or Cloudflare imports found. Exit 1 means no matches. |

The earlier paused re-review ran the same package suites successfully before the final snapshot test additions.
Its results do not substitute for the final reruns above.
The reviewer inspected the current implementation report and updated packet/contracts.
The coordinator report records broader verify, integration, and browser-shell E2E checks after repair.
The reviewer did not repeat those broader checks.

## Scope and limits

PASS applies to serialized contracts, fixture validation, configuration hashing, and SDK acceptance only.
No real physics, shot simulation, Cloudflare deployment, database authority, mobile gameplay, or gameplay rules implementation is marked passed.
Wrangler dry-run and browser-shell checks do not prove deployed Havok compatibility.
T02/T04 retain their real-engine and deployment gates.

No remaining repair blocker was found in this re-review scope.
