# T02-L01-EXECUTOR-1 implementation report

## Scope and source

I added the browser-only `runLoftCoarseMatrix({ engine, signal, sink, onProgress })` runner at `games/counterball/src/simulation/loftCoarseRunner.ts`. It requires a Babylon `Engine`, verifies the fixture payload/file, canonical config hash, and the fetched Havok WASM bytes before runtime initialization, and passes the same verified WASM buffer to `initializeHavokRuntime`.

For each canonical tuple, the runner regenerates the selected-cap, button, obstacle, and filler setup; hashes the initial state; creates a fresh world through `createCounterballWorld`; replaces only the support shape with the guard-sized slab; reads and validates native material, filter, shape, mass, COM, inertia, and transform facts before the one COM-applied planar impulse; and streams body, contact, sweep, settling, and eligibility evidence through `writeLoftCoarseMatrix`. It checks the configured energy, per-body drop, support/apron, point-sweep, rotation, call, batch, cancellation, and wall-time bounds. Cleanup restores the original support shape and disposes the replacement/world on all paths. Progress and the returned summary contain only compact counters, hashes, and timings.

## Checks actually run

- `node scripts/check-completion-plan.mjs --packet T02-L01-EXECUTOR-1` — exit 0; checker reported structural `PASS`, 99 packets and 21 remaining parents. It showed `initialReady: []` and this packet as `ready: false` because `execution_state/tasks.json` already recorded it as `RUNNING`; readiness was true when the card was materialized. T01 remains `ACCEPTED`, so the original parent gate is satisfied. This is expected checker behavior, not a dependency mismatch. The named markdown packet was absent; I used the extracted `LOCAL_PACKETS.json#T02-L01-EXECUTOR-1` record.
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts` — exit 0, no output. The runner was untracked when run, so Git's ordinary diff check did not inspect its contents; this is not effective whitespace verification for that new file.

## Limits and required follow-up

No local application typecheck, lint, formatter, unit test, browser test, build, or physics run was performed. The real 24-case Chromium/Havok trial is **NOT RUN**. No runtime result, eligible-candidate result, deployed Havok proof, or gameplay claim is made.

The artifact's `metadata.wallTimeMs` is frozen before `writeLoftCoarseMatrix` serializes the case, and the envelope sums those pre-serialization per-case values. The runner separately enforces the actual per-case deadline after the writer finishes serializing the case and the whole-matrix deadline around the complete writer call. It also measures the actual whole-matrix duration in the compact returned summary. Whether the accepted artifact requires its recorded case/envelope time totals themselves to include sink serialization remains under coordinator review: CONTRACT_WORK.md explicitly includes serialization in the hard ceilings and requires exact time totals in the envelope, but does not explicitly define the serialized per-case `wallTimeMs` field as sink-inclusive. Do not accept this card until that interpretation is resolved and the independent source review passes.

The checker status is not a blocker; independent source review and exact-head hosted verification remain pending.
