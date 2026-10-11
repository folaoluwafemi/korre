# T02-GC02 config surface audit

Date: 2026-10-11
Scope: read-only inventory for a future config/schema implementation. This report does not authorize source changes; confirm T02-GC01 is `ACCEPTED` before issuing that work.

## Current protocol source surface

The audited source does not yet implement the diagnostic guard described by the coordinator's T02-GC01 contract amendment.

- `packages/game-protocol/src/types.ts` directly exports `PhysicsCalibration`, `CounterballConfig`, and branded `ConfigHash`. `CounterballConfig` currently fixes outer `schemaVersion: 1` and `configVersion: "counterball-config-1"`; its only physics-related field is `physicsCalibration: PhysicsCalibration | null`. There is no `DiagnosticPhysicsGuard` type or `diagnosticGuard` field. `PhysicsCalibration` separately has `schemaVersion: 1` and the measured material, damping, impulse, restart, support, workload, and tunnelling fields.
- `packages/game-protocol/src/schemas.ts` exports `CounterballConfigSchema` and `ConfigHashSchema`. The config schema is strict, fixes the outer version literals to 1/`counterball-config-1`, and validates `physicsCalibration` through a strict nullable schema. Its cross-field checks apply only to non-null calibration. There is no diagnostic guard schema.
- `packages/game-protocol/src/config.ts` exports the frozen `COUNTERBALL_CONFIG_V1`, protocol limits/version constants, `canonicalJson`, `hashCanonicalJson`, `hashCounterballConfig`, and `createVersionStamp`. The frozen config uses outer schema/config version 1, contains `physicsCalibration: null`, and has no diagnostic field. `hashCounterballConfig()` hashes the full frozen config through `hashCanonicalJson`; `createVersionStamp()` calls `hashCounterballConfig()` to fill `configHash`.
- `packages/game-protocol/src/protocol.test.ts` creates a `PhysicsCalibration` with its own schema version 1, validates outer config/null and calibration cases, and checks that `hashCounterballConfig()` matches the fixture hash. Its canonical-hash test also verifies that adding calibration changes the hash. These are distinct version layers: the T02-GC01 change advances outer config versioning, not `PhysicsCalibration.schemaVersion`.

The protocol test imports runtime symbols from `./index.js` and types directly from `./types.js`. The package barrel itself was outside this audit's permitted read set; verify whether it re-exports all types before freezing implementation paths.

## Hash and fixture inventory

Within the audited files, the hash path is:

1. `hashCanonicalJson(value)` canonicalizes the supplied object and computes SHA-256.
2. `hashCounterballConfig()` supplies `COUNTERBALL_CONFIG_V1` to that function.
3. `createVersionStamp()` calls `hashCounterballConfig()`.
4. `protocol.test.ts` compares the computed current config hash with `fixture.versions.configHash`, and compares canonical hashes for the uncalibrated and calibration-populated config objects.

`tests/fixtures/counterball-v1.json` contains **8** `configHash` properties. All 8 carry the same current value, `71ee7d40ec42b0f2c4094e7be7c27b8beda2732c10e5217d21e0c20ebc2c5bdb`. The fixture contains **0** `physicsCalibration` properties and **0** `diagnosticGuard` properties. It is a fixture of protocol states/versions, not a serialized `CounterballConfig`; changing the config object should update those 8 version hashes without inserting the guard into match-state messages.

## Contract target and smallest candidate packet

The T02-GC01 text in `knowledge_base/execution/CONTRACTS.md` defines a strict `CounterballConfig.diagnosticGuard` for only the accepted D01 browser direct impulse. The documented shape carries fixed identity and input fields (`schemaVersion`, scope, fixture/match/cap IDs, exact impulse and application point) plus fixed energy, drop, support, tunnelling, and workload bounds. It is hashed as part of config, used only by the explicit diagnostic entry, leaves `physicsCalibration` null, does not change protocol messages, and requires outer config schema/version 2. The coordinator implementation report records these as a proposed source amendment, but this audit did not inspect task status; coordinator must confirm the contract task is accepted before implementation.

Assuming the existing `index.ts` barrel already re-exports `types.ts` and `schemas.ts`, the smallest atomic implementation packet is these five exact paths:

1. `packages/game-protocol/src/types.ts` — add the strict `DiagnosticPhysicsGuard` type and `diagnosticGuard` property; advance outer config literal types while retaining nullable calibration.
2. `packages/game-protocol/src/schemas.ts` — add strict fixed-value guard validation and outer config version-2 validation, preserving strict unknown-key rejection and calibration cross-checks.
3. `packages/game-protocol/src/config.ts` — add the canonical guard data, set outer schema/config versions to 2, keep `physicsCalibration: null`, and retain the existing hash path so the new field is automatically hashed.
4. `packages/game-protocol/src/protocol.test.ts` — test the accepted exact guard, reject changed identity/values and unknown fields, check outer version and null calibration, and continue verifying config hash agreement and calibration separation.
5. `tests/fixtures/counterball-v1.json` — replace all 8 old config hashes with the recomputed hash; do not add the config guard to protocol state fixtures.

These paths are coupled: types, schema, config, tests, and fixture hash must land and be reviewed together. If inspection of the package barrel finds explicit exports that omit the new type or schema, add `packages/game-protocol/src/index.ts` as a sixth path. Do not broaden to consumers or wire schemas unless an actual versioned consumer requirement is found.

## Versioning and separation risks

- The contract says the protocol version stays 1 because no wire shape changes, while outer config `schemaVersion` and `configVersion` advance to 2. Keep these separate from `PhysicsCalibration.schemaVersion: 1`; a broad replacement of every `schemaVersion: 1` would be incorrect.
- The existing constant name `COUNTERBALL_CONFIG_V1` becomes semantically stale when its payload moves to outer config version 2. Renaming it may fan out through consumers outside this bounded surface. Preserve the export for the smallest packet unless the coordinator separately inventories and assigns a safe rename.
- Keep `physicsCalibration` null in the shared config. The diagnostic guard is not a partial calibration and must not supply fallback material, damping, or gameplay impulse settings.
- Strictly validate the guard's exact diagnostic identity and allowed values. Do not accept arbitrary caller-provided scope, fixture, cap, impulse, application point, energy/drop, apron, tunnelling, or workload values as a generic physics policy.
- Hashing the guard does not itself enforce diagnostic-only access. The runtime must consume this field only from the explicit diagnostic entry; calibrated local, AI, online, and deployed runners still reject null `physicsCalibration` and must never use the guard as fallback.
- The fixture name `counterball-v1.json` is historical protocol-fixture naming. The contract keeps protocol version 1; updating config hashes does not by itself require renaming the fixture or changing protocol message versions.

## Evidence limits

This was a file inventory only. No local application command, install, test, typecheck, build, browser, physics, or deployment check ran. This report does not establish that T02-GC01 is accepted, that any guard exists at runtime, or that diagnostic access is isolated in executable code. The source barrel and hash consumers outside the explicitly allowed file set remain uninspected.
