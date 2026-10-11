# T02-GC02 protocol/config guard — independent source review

Date: 2026-10-11

## Verdict

**SOURCE: PASS. RUNTIME: NOT RUN; exact-head GitHub verification is pending.** The implementation matches the accepted GC01 contract across the five assigned files. It adds the strict, literal diagnostic guard to the version-2 canonical config and hash while retaining protocol version 1, guard schema version 1, `PhysicsCalibration.schemaVersion: 1`, and `physicsCalibration: null`. The fixture changes are limited to the eight config hashes. No guard consumer or gameplay fallback was added.

## Findings

- `node scripts/check-completion-plan.mjs --packet T02-GC02` returns the exact card as ready and plan-consistent. This is not an application/runtime result.
- `types.ts` represents each fixed GC01 identity, numeric limit, nested tunnelling value, and workload limit as a literal. Only the outer `CounterballConfig` version fields advance to schema 2 / `counterball-config-2`; `PhysicsCalibration.schemaVersion` and the nested guard `schemaVersion` remain 1. `index.ts` already wildcard-exports `types.ts` and `schemas.ts`, so the new public type/schema need no sixth path or barrel change.
- `schemas.ts` mirrors the type with strict objects at the guard and nested-object levels and literals for every accepted value. The outer config schema requires the version-2 values and the non-null fixed `diagnosticGuard`; it continues to use the unchanged nullable `physicsCalibrationSchema` and existing calibration geometry checks. Altered identity/limits and unknown keys cannot parse.
- `config.ts` includes the exact GC01 guard, advances only the outer config version, preserves the `COUNTERBALL_CONFIG_V1` export for compatibility, and keeps `physicsCalibration: null`. The existing `deepFreeze` and `hashCounterballConfig` paths cover the new nested value. `PROTOCOL_VERSION` remains 1.
- The new protocol test checks parse of the fixed guard; outer/nested/protocol version split; frozen config; mutation rejection for scope, fixture, match, cap, impulse, application point, energy/drop/apron, tunnelling and workload values; unknown keys at the guard and nested-object level; rejection of a null guard; continued null calibration; and hash change when a hashed guard value changes. The existing calibration-validity test remains and still rejects invalid calibration values. The strict schema also requires omitted fields, although the added mutation list does not contain a separate missing-key example.
- I independently imported the config module with Node's native TypeScript stripping and called the existing canonical hash helper as a read-only calculation. It returned `e40b5583fa7952e61838cf23bcbbdcbb517ac9a1ab4fc439576813c9e7218948`; all eight fixture version stamps match. The fixture diff changes only those eight hash strings; the fixture still has no serialized `diagnosticGuard` or `physicsCalibration` fields. The fixture's own `schemaVersion: 1` and protocol version stamps correctly remain unchanged.
- `git diff HEAD --name-only` for the reviewed scope lists exactly the five packet-owned paths. The config-surface audit confirms the source boundary before this card; these changes add no runner, world-factory, browser, AI, online, or deployed consumer. The retained null calibration and absence of consumer changes prevent this config field from becoming a gameplay fallback in this card.

## Evidence limits

The read-only hash calculation and source inspection do not prove that the typechecks, protocol tests, full verification, integration, or Chromium suites pass. No package install, app test, typecheck, build, browser, physics, or deployment command was run for this review. Fresh exact-SHA GitHub checks and their independent run review remain required.

The guard is present in protocol config as diagnostic data; this card does not enforce apron/drop/substep bounds, inspect runtime Havok properties, or prove support, energy, traversal, settling, calibration, a playable flick, or deployed physics. `worldFactory.ts` and all runtime consumers are outside the five changed paths and remain unchanged.
