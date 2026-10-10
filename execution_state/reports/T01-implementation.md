# T01 implementation report — canonical protocol, config, SDK, and fixtures

Date: 2026-10-10  
Owner: coordinator  
Status: ACCEPTED after independent PASS and final coordinator integration checks

## Delivered

- Added canonical Counterball protocol types and strict Zod v4 schemas for match state, commands, control messages, simulation facts/results, server events, room commands/views/responses, and config. Parsing rejects unknown keys, non-finite or undefined values, cycles, non-plain objects, sparse/custom arrays, accessors, invalid quaternions, and missing or duplicate match entities. Parse failures expose bounded issue paths, codes, and messages.
- Added a deeply frozen config from the numeric values in `knowledge_base/execution/DECISIONS.md`, canonical key-sorted JSON, SHA-256 config hashing, version-stamp creation, team helpers, and a documented quaternion tolerance of 0.01. Physics calibration remains `null` for T02; no friction, restitution, damping, impulse, or lift coefficients are claimed here.
- Added the Counterball two-player manifest, game mount/dispose contract with idempotent disposal, and typed transport interface. Separate test adapters for local AI and network use that same interface. Identity and room membership remain outside `MatchState`.
- Added the version-tagged initial 15-body fixture and foul/out/goal/penalty/blocked rule cases. The fixture explicitly states it is not a physics measurement or deployed Havok result. D20–D25 references remain labelled provisional where applicable; the confirmed foul case references D06. No case grants an extra shot.
- After independent review found two defects, changed canonicalization to preserve own `__proto__` JSON keys with a null-prototype accumulator and added the protocol-v1 limits documented in `knowledge_base/execution/CONTRACTS.md`. The strict parsers now bound arrays, simulation facts, playback frames/chunks/bytes and snapshots, enforce `chunkIndex < chunkCount`, enforce snapshot chunk consistency, and cap room participants/waiting players. Negative tests cover each reported risk. No simulation or Havok result is claimed.
- Updated the old workspace smoke to check the real protocol/SDK exports, added DOM declarations to the test typecheck for the public `HTMLElement` mount contract, and corrected the protocol/SDK test scripts so package-level commands resolve the shared Vitest config.

## Changed paths

- `packages/game-protocol/package.json`
- `packages/game-protocol/src/config.ts`
- `packages/game-protocol/src/index.ts`
- `packages/game-protocol/src/protocol.test.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/types.ts`
- `packages/game-protocol/src/workspace.test.ts` (removed obsolete scaffold test)
- `packages/game-sdk/package.json`
- `packages/game-sdk/src/index.ts`
- `packages/game-sdk/src/lifecycle.ts`
- `packages/game-sdk/src/manifest.ts`
- `packages/game-sdk/src/sdk.test.ts`
- `packages/game-sdk/src/transport.ts`
- `packages/game-sdk/src/workspace.test.ts` (removed obsolete scaffold test)
- `tests/fixtures/counterball-v1.json`
- `tests/tsconfig.json`
- `tests/unit/workspace.test.ts`
- `knowledge_base/execution/CONTRACTS.md`
- Coordinator records: `execution_state/packets/T01.md`, `execution_state/OWNERSHIP.md`, and `execution_state/DECISIONS.md`.

## Initial implementation checks (before independent review)

Working directory for every command: `C:\Users\USER\StudioProjects\korre`.

| Command | Exit | Result |
|---|---:|---|
| `pnpm.cmd install --frozen-lockfile` | 0 | All 9 workspace projects; lockfile current; no dependency changes. |
| `pnpm.cmd --filter @korre/game-protocol test` | 0 | 1 file, 8 tests passed. |
| `pnpm.cmd --filter @korre/game-sdk test` | 0 | 1 file, 3 tests passed. |
| `pnpm.cmd --filter @korre/game-protocol typecheck` | 0 | Passed with Worker/WebCrypto libraries and no Node or DOM globals. |
| `pnpm.cmd --filter @korre/game-sdk typecheck` | 0 | Passed. |
| `pnpm.cmd typecheck` | 0 | Workspace package and test typechecks passed. |
| `pnpm.cmd lint` | 0 | ESLint and Prettier checks passed. |
| `pnpm.cmd verify` | 0 | Typecheck, lint, 9 test files/21 tests, package builds, web build, and Wrangler dry-run passed. |
| `pnpm.cmd test:integration` | 0 | 1 file, 1 test passed. |
| `pnpm.cmd test:e2e` | 0 | Chromium home-shell smoke passed. |

## Repair 1 checks (after the first independent review)

Working directory for every command: `C:\Users\USER\StudioProjects\korre`.

| Command | Exit | Result |
|---|---:|---|
| `pnpm.cmd install --frozen-lockfile` | 0 | Lockfile was current; all 9 workspace projects were already installed. |
| `pnpm.cmd --filter @korre/game-protocol test` | 0 | 1 file, 9 tests passed, including canonical `__proto__`, chunk size/index, frame/fact caps, snapshot shot/index/aggregate bounds, and waiting-list limits. |
| `pnpm.cmd --filter @korre/game-sdk test` | 0 | 1 file, 3 tests passed. |
| `pnpm.cmd verify` | 0 | All workspace typechecks, lint/format, 9 files/22 tests, package/app builds, and Wrangler dry-run passed. The Worker step remained a local dry-run with no bindings. |
| `pnpm.cmd test:integration` | 0 | 1 file, 1 test passed. |
| `pnpm.cmd test:e2e` | 0 | Chromium home-shell smoke passed. |

The first repair check run caught formatting only in `protocol.test.ts` and `schemas.ts`; Prettier fixed those files. The checks above were rerun after that formatting repair and after the final chunk-byte measurement was narrowed to the canonical chunk fields. After the final independent review passed, the coordinator reran `pnpm.cmd install --frozen-lockfile` (exit 0; 9 workspace projects, lockfile current).

## Failed attempts and repairs

- The first package test commands failed because `../../vitest.config.ts` was resolved outside the workspace root. The two package test scripts now pass `vitest.config.ts` relative to the selected root.
- The first protocol test run had two incorrect assertions: it expected a different match phase alone to invalidate a snapshot, and used the empty-input hash instead of the hash of the canonical JSON string `""`. The test now checks a real version mismatch and a known SHA-256 vector.
- The first protocol package typecheck attempted a Node filesystem import and referenced a private event schema. The test now imports the JSON fixture using TypeScript JSON-module support and validates events through the exported parser; the protocol package remains Worker-only.
- The first workspace typecheck after T01 found the old smoke importing removed scaffold exports and the root test project missing DOM types for the SDK mount contract. The smoke and test tsconfig were updated under coordinator-owned paths; workspace typecheck now passes.
- The first full lint run found unsafe prototype access and async test methods without awaits. Prototype checks now use `Reflect.getPrototypeOf`, and test adapters return explicit promises. Lint and the final full verification pass.
- Independent review reproduced that `canonicalJson(JSON.parse('{"__proto__":{"a":1}}'))` collided with `{}` and that a 606,802-byte chunk with `chunkIndex=2, chunkCount=1` parsed. Repair 1 preserves the key and rejects invalid bounds. The final independent re-review in `execution_state/reports/T01-review.md` passed; coordinator integration checks and the fresh frozen install also pass.

## Checks not run and limits

- No real Havok world, shot simulation, Cloudflare deployment, or deployed WASM execution was run in T01; those belong to T02/T04. The successful Wrangler step in `pnpm verify` is only a local dry-run of the health Worker with no bindings. It is not evidence for the deployed physics gate.
- No manual gameplay test applies because T01 publishes contracts and fixtures only; the current browser page remains a non-playable scaffold.

## Dependency enabled

Coordinator acceptance follows the final independent PASS and fresh frozen install. T01 unblocks T02 (headless Havok runner), T03 (procedural scene), and T11 (identity service). The next priority remains one real browser flick and an early actual Cloudflare Havok proof; no later online task may claim readiness from this protocol fixture alone.
