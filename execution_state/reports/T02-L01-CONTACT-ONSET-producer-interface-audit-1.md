# T02-L01 contact-onset producer readiness audit

**Status: inventory only.** The proposal remains unaccepted and this audit does not authorize or unblock implementation.

## Exact canonical producer surface

The proposed canonical config/hash update requires these five files:

1. `packages/game-protocol/src/config.ts` — canonical values and version literals. Current top-level config is schema 4 / `counterball-config-4`; the L01 guard is schema 2, configSchemaVersion 4, `loft-coarse-probe-v2`.
2. `packages/game-protocol/src/types.ts` — `CounterballConfig` and `RestartLoftDiagnosticGuard` literal types.
3. `packages/game-protocol/src/schemas.ts` — strict config and nested L01 guard schemas.
4. `packages/game-protocol/src/protocol.test.ts` — version/hash freeze, primitive-field mutation and hash-rejection coverage, and old-identity rejection.
5. `tests/fixtures/counterball-v1.json` — eight current `versions.configHash` leaves, all presently `4f4886df9a54f2367d8f5befe06252a1c86ba1cd9d0b50387338fa69482b278e`.

The proposal’s exact new canonical literals are top-level schema 5 / `counterball-config-5`; L01 guard schema 3, `configSchemaVersion: 5`, and `algorithmVersion: "loft-coarse-probe-v3"`; plus this strict hashed policy object:

```ts
contactPolicy: {
  eventType: "COLLISION_STARTED";
  nativeSubscription: "started-only";
  readback: "all-22-exact";
  callbackRetention: "all-delivered-including-symmetric";
}
```

The config object must use those same four string literals, and the Zod representation must be a strict object of exact literals. The current schema is already strict at the top level and for the L01 guard/nested objects. The current `getPrimitivePaths` test covers string, numeric, and boolean leaves; adding this object should make all four policy leaves participate in the existing changed-field rejection and canonical-hash-change loop. Add explicit old-current identity rejection cases for config 4, L01 guard schema 2, configSchemaVersion 4, and algorithm v2, while retaining earlier legacy rejection coverage. Also assert each policy literal and reject missing, wrong, and unexpected policy fields.

## Values and fixture pins to preserve

The proposal says this changes diagnostic contact-subscription evidence only. Keep protocol version 1, nullable `physicsCalibration`, D01 `diagnosticGuard`, all physical/numeric L01 values, energy/rest-reference semantics, support geometry, and the 24 tuples unchanged. In particular, preserve the current contact caps rather than filtering, deduplicating, truncating, or enlarging artifacts. Preserve the config guard’s omitted-`configHash` fixture payload digest `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d` and independently verify the raw fixture bytes after replacing its eight config hashes.

The fixture’s eight `configHash` leaves must all be regenerated from the new canonical config hash. The protocol test at `protocol.test.ts:436-439` computes `hashCounterballConfig()` and compares it with `fixture.versions.configHash`; it is a live canonical-hash assertion, not a separate hardcoded expected hash. The fixture changes its raw-byte digest, so update the existing raw pin in both `games/counterball/src/simulation/loftCoarseRunner.ts:65-66` and `tests/e2e/counterball-direct-probe.spec.ts:64-65`. Keep the omitted-hash payload digest unchanged.

## Live L01 consumers requiring a separate, later consumer update

The canonical producer change alone cannot implement the proposal. These consumers currently define or validate the serialized matrix contract:

- `games/counterball/src/simulation/loftCoarseRunner.ts`: current all-event subscriptions/callback capture; `makeMatrixMetadata`; per-case construction. A later consumer change must set and read back the started-only native mask on all 22 bodies before stepping, reject any delivered event other than `COLLISION_STARTED`, and emit the exact ordered `contactSubscription` case record `{ eventType, nativeMask, bodies: [{ bodyId, requestedMask, observedMask }] }` without changing the frozen caps or physics.
- `games/counterball/src/simulation/loftCoarseProbe.ts`: exported matrix/case types, exact metadata/case key sets, guard identity validation, and row serialization/validation. It must strictly validate the proposed case-level record and preserve all callback occurrences in order, including symmetric notifications.
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: current writer fixtures and malformed/strict-shape cases need corresponding policy-record coverage.
- `tests/e2e/counterball-direct-probe.spec.ts`: `MATRIX_IDENTITY_KEYS`, `MATRIX_CASE_METADATA_KEYS`, and `validateCaseMetadata` are explicit allowlists/validators. The host check must validate the exact 22-body policy record, body order, native masks, and event type. Its existing 8,192 per-case and 196,608 matrix contact ceilings remain.

The E2E fixture reader currently checks exactly eight config-hash leaves, the omitted-hash payload digest, and a literal raw-file SHA-256. Those checks must still prove the new fixture bytes and canonical config together. The browser component uses guard-owned byte ceilings; this proposal does not require it to parse contact rows, so no independent hardcoded schema version was found there.

## Checks performed and limits

Read the proposal and the requested config, type, schema, protocol test, and fixture files. Searched current app/game/package/test consumers for L01 version literals, guard access, identity key lists, fixture hashes, and contact validation. Confirmed eight fixture `configHash` leaves by counting the JSON keys. No application tests, typecheck, build, browser run, or physics run was performed. This is a path/contract-surface inventory only; it does not judge the native-contact premise or accept the proposal.
