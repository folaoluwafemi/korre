# T02-BR01 implementation report — stopped before source changes

## Outcome

BLOCKED by the packet's explicit C00 guard/resource stop condition. No probe source, test, or browser export was created or changed. The accepted direct-impulse tuple itself is available, but it is not sufficient to implement this bounded diagnostic safely.

## Evidence and missing dependency

The exact packet record re-extracted with `node scripts/check-completion-plan.mjs --packet T02-BR01` is plan-consistent and READY; that is not implementation or runtime evidence. `execution_state/OWNERSHIP.md` assigns only the packet's three source paths plus this report.

The canonical `COUNTERBALL_CONFIG_V1.physicsCalibration` remains `null` in `packages/game-protocol/src/config.ts:60`. The C00 contract states that null has no coefficients and that the schema's numeric bounds are provisional, not selected/hashable settings (`knowledge_base/execution/CONTRACTS.md:129-135`; `knowledge_base/execution/completion/CONTRACT_WORK.md:7-11,67-72`). In particular, the available schema does not select `workload.maxBatchSteps`, `workload.maxWallTimeMs`, `tunnelling.maxTranslationPerSubstep`, `tunnelling.maxRotationPerSubstep`, `tunnelling.maxSubsteps`, or `support.apronMargin`.

C00 requires each fixed physics interval to be split into an explicit, bounded substep loop derived from the accepted energy/reach envelope. Its specified pinned `HavokPlugin.executeStep` behavior is one `HP_World_Step` call per invocation; setting the ideal step time does not create hidden internal substeps. The canonical world factory currently configures the fixed simulation timestep, but exposes no selected calibration/workload guard from which BR01 can derive and enforce that loop. The existing D01 observation uses raw fixed-tick endpoint stepping; those observations establish the permitted input tuple only and do not establish the missing guard.

The only allowed impulse input remains the D01 key `impulse=8|aim=straight-at-button`, selecting `home-6` with raw impulse `{x:0,y:0,z:8}` at `{x:0,y:0.06,z:-4}` on the unchanged canonical fixture. The prior 291 steps / 2.425 seconds are provenance only. No input was applied here, no player-facing power mapping was inferred, and no output was claimed.

## Required coordinator action

Before implementation, the coordinator must provide a selected, config-hashed calibration/workload policy and the enforceable substep contract required by C00: concrete selected batch and wall-clock budgets, support margin, translation/rotation limits and maximum substep count; an energy/reach derivation for the candidate impulse; and a runner/world boundary that actually divides and records bounded substeps, yields to the host, checks cancellation and returns `resourceLimit` when the bound cannot be enforced. Schema validation limits alone cannot supply these runtime choices. Once those accepted inputs exist, BR01 can be rematerialized without changing the D01 tuple. No private limits or alternative physics authority were added.

## Checks

- `node scripts/check-completion-plan.mjs --packet T02-BR01` — PASS, plan consistency only.
- `git diff --check` — PASS, exit code 0; this is the only local check permitted for this card.
- Application tests, typecheck, build, browser, physics, installation, and server checks — NOT RUN.
- GitHub checks remain pending and must run on the eventual implementation SHA: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`.

No T02, T05, browser-motion, physics-calibration, or deployed Havok acceptance follows from this stop report.
