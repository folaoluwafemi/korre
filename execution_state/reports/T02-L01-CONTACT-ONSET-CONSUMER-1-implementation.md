# T02-L01-CONTACT-ONSET-CONSUMER-1 implementation

Status: IMPLEMENTED for independent source review. No runtime acceptance.

## Changes

- `games/counterball/src/simulation/loftCoarseRunner.ts`: use the accepted native AABB origin-radius and start-separation helpers; preserve COM cylinder radius and support datum. Explicitly order 15 dynamic and seven static bodies, subscribe observers, set and read back Started-only masks before the impulse, retain every delivered row, reject other event types, and record the actual subscription. Update the raw fixture pin to `b0d2987128b2bb486ae27a62255b16e899ebdd6419b9e8d9140351defb31e9a0`.
- `games/counterball/src/simulation/loftCoarseProbe.ts`: strict subscription shape, positive single-bit uint32 mask, exact canonical body order and matching requested/observed masks; strict Started event validation while retaining the byte limit.
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: fixtures, malformed masks/order/IDs/event cases, duplicate and ordered callbacks. No physics limits or tuple counts changed.

Source SHA-256:

- runner `3b6b6669e3e7d5f64112e50ba7a37340d2f14a21b1cf712f000fd1679090e648`
- writer `3dcdbbc24c75a1ab38058e43b570a88630cb28e73a0036de88c60b1125fc32ce`
- tests `afce0e1bce39af5b4c096173ef234cfe1763d42cedcfd11f226871489f7491ff`

## Sources and checks

Read the live packet, accepted helpers, source, native interface and independent contract review. The pinned Babylon/Havok public API details and event mapping are documented in `T02-L01-CONTACT-ONSET-contract-proposal-1-review.md`; the pinned plugin maps the actual native Started enum to `COLLISION_STARTED`.

- `node scripts/check-completion-plan.mjs --packet T02-L01-CONTACT-ONSET-CONSUMER-1`: exit 0, plan PASS and ready true. This is a document check only.
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/loftCoarseProbe.ts games/counterball/src/simulation/loftCoarseProbe.test.ts`: exit 0.
- Application typecheck, formatter, tests, build and browser automation: NOT RUN locally per user instruction. Run on GitHub after independent review and integration.
- Full real native 24-case matrix, artifact, host validation and independent runtime review: NOT RUN. No T02, calibration, game or deployed physics claim.

Next: independent exact-source review, followed by integrated hosted wave. Source ownership released.

## Formatting repair

Independent review requested multiline wrapping of the test metadata object. Applied that change only. Scoped `git diff --check` passed. No tests or builds ran. Updated test SHA-256: `050fe6a59acabc9d3b24cb9663ef4a2ff94890aa8b85882e4ec8a74b87a26bdd`. Source ownership released.
