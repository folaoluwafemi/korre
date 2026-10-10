# T02-C2 — bounded fixed-step playback sampling

## Purpose and dependencies

Implement the pure playback sampler needed by the T02 runner. Accepted prerequisites are T01 and T02-A. This packet is independent of T02-C0 and T02-B2: it consumes canonical body snapshots and config, not restart placement or physics. It does not accept T02.

Read `knowledge_base/execution/CONTRACTS.md`'s simulation/playback boundary, `knowledge_base/execution/TASKS.md` T02, `knowledge_base/execution/DECISIONS.md`'s fixed-step/sample-rate/bounds, and `execution_state/reports/T02-runner-design-audit-1.md`.

## Exact write paths

Worker `/root/toolchain_audit` may edit only:

- `games/counterball/src/simulation/sampling.ts`
- `games/counterball/src/simulation/sampling.test.ts`
- `execution_state/reports/T02-C2-sampling-implementation.md`

Do not change protocol/config types, schemas, fixtures/hash, world factory, CI, manifests, lockfile, shared tasks/ledger, or any unlisted file. Do not spawn agents. Do not run local build, test, typecheck, lint, formatter, or server commands; hosted CI is the verification path.

## Canonical API

Export `createPlaybackSampler(config: Readonly<CounterballConfig>)`, returning a one-shot sampler with:

```ts
record(step: number, bodies: readonly BodyState[]): void;
finish(): PlaybackFrame[];
```

The caller invokes `record` once for every fixed physics tick, beginning at step 0 and increasing by exactly one. The sampler records step 0, then every configured playback interval in ticks. Derive that interval from `simulation.fixedStepSeconds` and `simulation.playbackSamplesPerSecond`; reject invalid rates or a non-integral tick ratio instead of silently drifting. Use the exact step-derived time `step * fixedStepSeconds * 1000` as a finite number.

Each emitted frame contains only `{timeMs, bodies}` and each body only `{id, position, rotation}`. Bodies use canonical `ENTITY_IDS` order (`button`, then home caps 0–6, then away caps 0–6), regardless of input order. Require exactly fifteen unique canonical IDs. Reject non-finite positions/quaternions and quaternions outside `QUATERNION_NORM_TOLERANCE` using deterministic input errors; the runner will map invalid body errors to the canonical typed simulation error. Copy all emitted values so later world mutation cannot alter playback.

`finish()` appends the exact latest recorded fixed-step pose when the last step was not a regular sample, without duplicating a regular endpoint. It requires at least step 0, may be called only once, and no later record is allowed. Enforce the configured maximum simulated duration and `COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot` (451). Fail explicitly on an over-limit/malformed input; never truncate or emit partial success. Keep this code engine-free.

## Required tests and acceptance

Tests use synthetic protocol `BodyState` values only. Prove: t=0; every fourth tick for canonical 1/120 and 30 Hz config; stable all-15 ID order; pose-only output; deep-copy independence; exact non-periodic endpoint; no duplicate periodic endpoint; finite fractional step-derived times; invalid/non-integral rate; missing/duplicate/unknown bodies; non-finite poses and non-normalized quaternion rejection; non-sequential/negative steps; one-shot lifecycle; and exactly 451 frames at the 15-second endpoint without exceeding bounds.

Save implementation evidence without claiming unrun checks. The independent reviewer is `/root/foundation_review` and may write only `execution_state/reports/T02-C2-sampling-review.md`; the reviewer must not run local commands. Coordinator acceptance requires reviewer PASS and hosted GitHub `pnpm verify`, integration, and one-worker Chromium E2E. Stop after the packet; the coordinator owns integration and task status.
