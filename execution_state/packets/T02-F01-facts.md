# T02-F01: pure simulation facts

Parent: T02 (RUNNING)
Status: IMPLEMENTING
Author: `/root/toolchain_audit`
Independent reviewer: `/root/swarm_review`

## Accepted inputs and dependencies

- `parent:T01` (ACCEPTED)
- `T02-C0` (ACCEPTED): pure restart pose helper and canonical geometry inputs.
- `T02-C2` (ACCEPTED): complete fixed-step playback sampling behavior. Playback frames are context only and are never rule inputs.
- `C00-A` and `C00` (ACCEPTED): canonical protocol facts and reviewed producer boundary.
- Read `knowledge_base/execution/CONTRACTS.md`, `knowledge_base/execution/GAMEPLAY.md`, `games/counterball/src/simulation/sampling.ts`, `games/counterball/src/simulation/worldFactory.ts`, and `packages/game-protocol/src/types.ts`.

## Exact producer API

In `games/counterball/src/simulation/facts.ts`, export these engine-free inputs and function. The observation history contains the initial pose at `step: 0, timeMs: 0`, followed by every actual bounded Havok substep endpoint; several observations may share one fixed 1/120-second rule step. Each record contains exactly one finite pose for every canonical entity. `contactStarts` contains only contact starts from that physical interval, already mapped to canonical IDs and a representative finite world point. Step numbers are nondecreasing, timestamps strictly increase after the initial record, and neither poses nor contact inputs may be mutated.

```ts
export type PhysicsContactStart = {
  a: EntityId;
  b: EntityId;
  point: Vec3;
};

export type PhysicsStepObservation = {
  step: number;
  timeMs: number;
  bodies: readonly PlaybackTransform[];
  contactStarts: readonly PhysicsContactStart[];
};

export function deriveSimulationFacts(
  observations: readonly PhysicsStepObservation[],
  config: Readonly<CounterballConfig>,
): SimulationFact[];
```

Use protocol `SimulationFact`, `EntityId`, `PlaybackTransform`, `Vec3`, and `CounterballConfig` from `@korre/game-protocol`; do not create a serialized replacement. Output contains only plain finite protocol data. Sort deterministically by rule `step`, with contact before crossing when they share a step for attribution only, then by time and stable entity-ID tie-breaks. Contact time is the supplied observation time for its interval. Crossing time and point are interpolated from adjacent complete physical poses, never from 30-Hz playback.

For every entity, detect a transition from wholly inside the painted pitch to a whole-body boundary crossing using the configured cap/button dimensions and interpolated orientation. Button goal classification checks the complete oriented button against both posts and the crossbar; a partial, tangent, high, or outside-mouth passage is `out`. Cap crossings use the same canonical crossing type and can only be `out`. Side and end-line exits use the appropriate whole-body support extent. Keep geometry/fact derivation pure; role rules, foul adjudication, scoring, and restart awards belong elsewhere.

If the whole-body crossing cannot be derived from these observations without inventing unsupplied physics data, stop and report the concrete missing input. Do not downgrade to center-only crossing, endpoint-only tunnelling claims, playback interpolation, scene names, or mutable physics state.

## Exact write paths

- `games/counterball/src/simulation/facts.ts`
- `games/counterball/src/simulation/facts.test.ts`
- `execution_state/reports/T02-F01-implementation.md`

No shared config, contract, package export, workflow, application, status, or other worker paths are assigned. The coordinator owns all task/ledger/ownership records and any shared contract/config changes.

## Required tests

Cover every canonical ID and contact normalization; immutable inputs; stable deterministic ties/order; same-rule-step contact-before-crossing attribution; exact ties; high-speed swept crossings between recorded endpoints; quaternion orientation effects on whole-button support; inside/outside goal mouth and crossbar height including tangency; left/right and both end exits; and cap exits. Assert every output is serializable, finite, bounded, uses canonical IDs, and has no engine or browser objects.

## Checks and acceptance

Run only on GitHub: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`. Retain the exact commit SHA, full log, discovered/passed/skipped test counts, and actual artifacts. Do not accept a test/build that was skipped or a suite that collected no tests. `/root/swarm_review` independently reviews the exact source against CONTRACTS/GAMEPLAY and this packet after the implementation report is saved. Acceptance requires both hosted checks and review PASS.

This card accepts only the pure fact producer. It does not accept a `SimulationRunner`, physical calibration, deployed Havok, referee behavior, or playable flick. Parent T02 stays RUNNING.
