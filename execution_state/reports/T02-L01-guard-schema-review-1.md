# T02-L01 guard schema implementation review 1

**Verdict: CHANGES_REQUIRED.** This is a read-only source review. Builds, tests, browser, physics, Havok execution, deployment, and app checks were **NOT RUN**.

## Review and checks

- Ran `node scripts/check-completion-plan.mjs --packet T02-L01-GUARD-SCHEMA-1`: plan consistency **PASS**. The exact card lists five source paths and 13 dependencies; it reports `ready: false` and explicitly does not run implementation/runtime checks.
- Read the exact packet, implementation report, accepted `CONTRACTS.md` / `CONTRACT_WORK.md` guard inventory, and scoped diff of the five released source paths.
- Performed read-only identity calculations by importing the pure config/hash module and reading the fixture. The canonical config hash is `bdf08f51dab22c90ba796bccaf6afb849f9c46695d07b2b62330bc52246af808`; all eight fixture `configHash` leaves equal that value. The recursively configHash-omitted, sorted-key compact fixture payload digest is `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d`. The fixture is 20,276 bytes with SHA-256 `e4ede68e3ab82e801fbcd42b03196ded4f0ad81683290e40af7634d914364c35`. The pinned installed Havok WASM file has SHA-256 `026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11`. No WASM code was executed.
- The scoped diff names only the exact five released paths. The fixture diff changes eight `configHash` values and no other fixture fields.

## Findings

1. **The claimed exhaustive guard-leaf hash-sensitivity test omits both boolean fields.** `packages/game-protocol/src/protocol.test.ts:76-90` collects only string and number leaves (`return typeof value === "string" || typeof value === "number" ? [path] : []`). The accepted guard also has boolean leaves `capsIdentityRotation` and `allDynamicVelocitiesZero`, defined in `config.ts:120-121`, `types.ts:428-429`, and `schemas.ts:154-155`. The loop at `protocol.test.ts:514-529` therefore never mutates either boolean, so it does not verify the accepted contract's requirement that canonical config hashing is sensitive to each guard field. Extend the helper to collect boolean leaves and toggle them, then ensure the test rejects each changed literal and observes a changed canonical hash. No test was run to confirm the repair.

## Other reviewed requirements

- `config.ts`, `types.ts`, and `schemas.ts` carry the accepted literal inventory consistently: nested guard schema/version 1, protocol 1, config schema 3, scope/matrix/algorithm/physics identity, all tuple/setup/material/energy/sweep/workload/artifact values, and exact literal validation through nested `z.strictObject` schemas. The tuple's numeric `1` is equivalent to the contract's `1.0`.
- The outer schema/config version changes from 2 to 3. `PROTOCOL_VERSION` and wire schemas are unchanged in the scoped diff. The existing direct-shot guard fields and nested schema version remain unchanged. `physicsCalibration` remains `null`, and the source search found no runtime consumer of `restartLoftDiagnosticGuard`; its only code occurrences are config, type, schema, and protocol test.
- Recursive `deepFreeze` in `config.ts:178-188` covers nested objects and arrays; the protocol test recursively checks the new guard's frozen state. The schema rejects null and tests a nested extra key; every guard object in the implementation is declared with `z.strictObject`.
- The implementation report accurately describes the five-path scope and the above hash values. Hosted focused protocol tests and `pnpm verify` remain pending; this report makes no runtime or physics claim.

The boolean omission blocks acceptance. After a bounded test-only repair, request a new independent review; do not treat the hash calculations or plan checker as test evidence.
