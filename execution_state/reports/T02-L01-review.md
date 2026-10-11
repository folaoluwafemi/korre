# T02-L01 stop-condition independent review

Date: 2026-10-11

## Verdict

**PASS — the stop condition is genuine and the worker correctly stopped before implementation or trial execution.** The schema defines allowable guard ranges and cross-field validation; it does not select hashable numeric guard settings. The canonical config still has `physicsCalibration: null`, and current physics source steps once per fixed tick without the explicit substep guard or instrumentation required by L01.

## Evidence

- `node scripts/check-completion-plan.mjs --packet T02-L01` returns PASS for plan consistency only. The extracted card requires the C00-frozen, config-hashed linear/angular guard at every Havok substep and explicitly instructs the worker to stop if settings are not frozen or cannot be instrumented.
- `knowledge_base/execution/completion/CONTRACT_WORK.md` says the schema bounds are not selected settings. It keeps historical/current fixtures at `physicsCalibration: null`, and requires C02 to select measured settings. Its proposed guard includes `maxTranslationPerSubstep`, `maxRotationPerSubstep`, and `maxSubsteps`, plus a calculation of required step count from an energy envelope. Those are design/schema constraints; they are not current numeric config values to hash and use in L01.
- The current canonical config confirms `physicsCalibration: null` at `packages/game-protocol/src/config.ts:60`. The runtime schema permits a non-null value and constrains guard fields (`schemas.ts:59-63`), then checks translation against collider thickness (`:781-788`). These checks validate a supplied value; they do not supply one or place guard settings in the frozen config hash.
- The accepted `worldFactory.ts` sets the physics engine timestep to `COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds` (`:185-187`). The existing `intendedShotProbe.test.ts` advances with one `plugin.executeStep(fixedStepSeconds, physicsEngine.getBodies())` per sample (`:456-459`). It does not instrument smaller substeps or record a substep count/duration against selected translation/rotation limits. The runner design audit and the contract note that Havok's `executeStep` performs one `HP_World_Step`; its ideal-step setting is not an internal-substep guarantee.
- The L01 implementation report says no diagnostic tuples ran and no probe artifact was emitted. The assigned `games/counterball/src/simulation/loftCoarseProbe.test.ts` does not exist. I found no source change that begins the 24-case probe.

## Required next step

Keep L01 stopped until the coordinator supplies selected, config-hashed guard values and a concrete enforcement plan: compute a bounded required count from those settings, explicitly subdivide each canonical tick at the public stepping boundary, record actual substep durations/counts and contacts, and fail candidates that exceed the guard or budget. Then redispatch the unchanged 24-case matrix. Schema bounds or 120-Hz endpoint samples cannot substitute for this instrumentation.

This is a source/document audit. Apart from the plan validator and read-only file inspection, no build, test, physics, browser, or application command ran. No trial, continuous-clearance, or candidate-eligibility claim is made.
