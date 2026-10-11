# T02-L01-GUARD-SCHEMA-1 implementation report

Date: 2026-10-11
Owner: coordinator
Status: IMPLEMENTED; independent source review pending
Base commit: `88c8302c8ce4b0d0217de33419efcb8145c11188`

## Scope

Implemented the strict, hashed L01 diagnostic guard on the packet's exact five source paths. The outer Counterball config/schema version and config version are now 3; wire protocol remains v1. The existing direct-shot diagnostic guard, nested schema versions, physics adapter identity and `physicsCalibration: null` are retained. No runner, factory, gameplay, AI or online consumer was added.

The Zod object and every nested object are strict. All accepted tuple axes, setup facts, diagnostic material/energy/sweep/workload bounds, and artifact ceilings use exact literals. Protocol tests enumerate every primitive guard leaf, verify a one-leaf mutation is rejected and changes canonical SHA-256, verify recursive freezing, and reject null and nested extra keys.

## Exact source paths

- `packages/game-protocol/src/config.ts`
- `packages/game-protocol/src/types.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/protocol.test.ts`
- `tests/fixtures/counterball-v1.json`

The fixture diff changes only its eight `configHash` values.

## Hashes

- Canonical Counterball config SHA-256: `bdf08f51dab22c90ba796bccaf6afb849f9c46695d07b2b62330bc52246af808` (3,916 UTF-8 canonical bytes). Calculated from the source config literal using sorted-key compact JSON and SHA-256; this is a hash calculation, not an application test or physics run.
- Guard-bound configHash-independent fixture payload SHA-256: `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d`.
- Pinned Havok WASM SHA-256 recorded in the guard: `026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11`.
- Updated fixture byte size: 20,276 bytes.
- Updated fixture file-byte SHA-256: `e4ede68e3ab82e801fbcd42b03196ded4f0ad81683290e40af7634d914364c35`.

## Checks actually run

- `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-SCHEMA-1` — PASS. The exact schema card is the sole ready packet after accepted T01, contract and packet amendment prerequisites. This is plan consistency only.
- `git diff --check -- packages/game-protocol/src/config.ts packages/game-protocol/src/types.ts packages/game-protocol/src/schemas.ts packages/game-protocol/src/protocol.test.ts tests/fixtures/counterball-v1.json` — PASS. Git emitted only configured LF-to-CRLF working-copy notices.
- Canonical config hash and fixture byte hash calculations completed successfully; exactly eight fixture configHash leaves were replaced and parsed back as the new value.

No application install, build, test, browser automation, Havok/physics trial, deployment, Wrangler or external-service command ran locally or remotely for this implementation. Hosted focused protocol tests and `pnpm verify` are pending source review and publication of the exact reviewed head.

## Review handoff

The exact five source paths are released for independent review at `execution_state/reports/T02-L01-guard-schema-review-1.md`. No schema/runtime/physics or gameplay acceptance is claimed by this report.
