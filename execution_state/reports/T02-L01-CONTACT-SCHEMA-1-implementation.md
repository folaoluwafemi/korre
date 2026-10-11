# T02-L01-CONTACT-SCHEMA-1 implementation report

**Status: IMPLEMENTED; independent source review pending.** This change makes diagnostic contact rows represent the existing seven static participants while preserving the dynamic IDs and all accepted artifact limits.

## Changed paths

- `games/counterball/src/simulation/loftCoarseProbe.ts`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`

## Implementation

The probe now exports distinct `LoftCoarseStaticBodyId` and `LoftCoarseContactBodyId` types. Its canonical contact order is the unchanged 15 dynamic IDs followed by `goal-frame-0` through `goal-frame-5`, then `support-apron`. The exported `canonicalizeLoftCoarseContactPair` validates both participants, rejects unknown or identical endpoints, and returns either input orientation in that order.

Contact-row validation now accepts only known distinct participants whose encoded pair is already in canonical order. It rejects malformed, unknown, self, and reversed encoded pairs. Serialization order and contact accumulation were not changed, so callback rows remain in occurrence order and duplicate/symmetric notifications remain separate rows. Static aliases remain artifact-only; this change does not alter protocol/gameplay IDs, fixture/config/hash/version, geometry, physics, caps, or the matrix envelope.

Focused tests cover dynamic-pair compatibility, all seven static IDs, both dynamic/static input orientations, static/static order, duplicate/symmetric callback retention and order, and malformed, unknown, identical, and reverse-ordered pairs.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-L01-CONTACT-SCHEMA-1` — **PASS**, exit 0; exact record reports ready with T01 accepted. This is a plan/document check only.
- `git diff --check -- games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts` — **PASS**, exit 0.
- Unit tests, typecheck, lint, formatting, build, browser, physics/Havok, and deployment checks — **NOT RUN**, as required by the packet. Hosted `pnpm verify` and independent source review remain pending.

This packet makes no runtime, physics, playable-match, calibration, or deployed-Havok claim. Release the two source paths for independent review; the coordinator owns exact-head hosted verification.
