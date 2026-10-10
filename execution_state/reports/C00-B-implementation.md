# C00-B implementation report

Status: source implemented and independent source review passed; the first hosted attempt failed only on formatting, and repair 1 is awaiting independent review plus a fresh hosted run.

## Changes

- Added the canonical exported `PhysicsCalibration` type with named material, damping, impulse, restart-lift, support, workload and tunnelling fields.
- Changed the config type and strict runtime schema to accept either the full pinned shape or `null`. The initial config remains `null`; no coefficient, apron distance or measured setting was selected.
- Added finite/range checks and config-context checks for application offset (within half cap height) and translation per substep (strictly below the smallest configured collider thickness).
- Added positive and negative protocol cases for historical null, valid calibration hashing, numeric bounds, schema/engine/adapter versions, restart mode, geometry cross-checks and unknown fields.
- Recorded the open invisible support apron, no-wall/no-rule-plane policy, explicit bounded substep behavior, and precise future producer signatures in `CONTRACTS.md` and `CONTRACT_WORK.md`.
- Recorded the current export inventory separately from the future signatures. `resolveShot`, command validation, scene pose-update/picking and the local controller remain future code; this report does not claim those implementations exist.

## Pinned API evidence

The project lockfile pins `@babylonjs/core` 9.30.0 and `@babylonjs/havok` 1.3.14. I inspected the Babylon 9.30.0 `havokPlugin.ts` source and downloaded the exact 1.3.14 npm tarball to a temporary directory for read-only declaration inspection; no package was installed into the workspace. Babylon's public `HavokPlugin.executeStep(delta, bodies)` calls one `HP_World_Step(world, delta)` for each world. `HP_World_SetIdealStepTime` configures solver parameters and is not an internal substep request. The future runner must divide time into explicit bounded calls and fail `resourceLimit` when its required count exceeds `maxSubsteps`.

The calibration apron remains unselected. C02 must derive its sufficient size from the accepted impulse/energy envelope, gravity and maximum shot duration, and prove side/end exits plus finite all-15-body settling. Out-of-bounds simulation must fail; it may not freeze, teleport, delete or respawn bodies.

The frozen guard uses a conservative energy bound and per-body `vBound`, `omegaBound`, and maximum collider radius. For each 1/120-second tick, the required subdivisions are the maximum of the translation and rotation ceilings across all bodies; each substep duration is the tick divided by that count. The support apron must cover the maximum horizontal speed bound times maximum simulated duration, plus the farthest collider radius. The same calculation and recorded actual substep/contact data are required in probes and the production runner.

## Checks

- `node scripts/check-completion-plan.mjs --packet C00-B`: PASS; exact record remains ready with original `parent:T01` and `C00-A` dependencies.
- `node scripts/check-completion-plan.mjs`: PASS; 71 packets and 21 remaining parents. This checks plan consistency only.
- `execution_state/tasks.json` JSON parse: PASS.
- `git diff --check`: PASS.
- Independent source review: PASS at `execution_state/reports/C00-B-review.md`. The review confirms the schema/contract scope and explicitly leaves calibrated-runner behavior, candidate diagnostic labels, runtime substeps, and physical settling unverified for their implementation packets.
- No application tests, install, build, browser automation, deployment, or physics run was performed locally. The required focused protocol suite and `pnpm verify` remain pending on GitHub.

## Scope limits

The simulation runner is not implemented yet. Therefore this packet has no runtime evidence that a calibrated runner rejects null, executes bounded substeps, or settles entities on the apron. Those are requirements for the runner and T02 parent gates; C00-B does not accept T02 or claim a playable game. All tuning remains provisional, and `physicsCalibration` remains null in the shipping fixture until measured values and a new config hash are accepted.

The reviewer also confirmed that the pinned Babylon API issues one Havok world step per call. Hosted tests must still verify the changed protocol source and all workspace consumers on the exact pushed commit. No parent or runtime gate is accepted by this source review.

The first hosted attempt was run 38080345526 on `ba59e5a40a6b2877b8be452936db73f9a64a3168`. The focused protocol suite passed 11/11 with no skips; typechecks passed; Prettier failed on `protocol.test.ts` and `schemas.ts`, so unit tests/build and later integration/browser steps did not run. Independent run review is CHANGES_REQUIRED. The formatter's exact two-file patch was applied under repair 1; see `C00-B-format-repair-1-implementation.md`. Fresh hosted checks are pending.
