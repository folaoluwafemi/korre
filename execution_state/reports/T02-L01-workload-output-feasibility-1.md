# T02-L01 workload and artifact feasibility 1

## Conclusion

The 24-case matrix can be given finite fail-closed call, time, contact, transform, and byte limits, but the current 20-minute CI job is **not yet shown to fit** the matrix alongside `pnpm verify`. The current hashed diagnostic workload is for one direct shot: 86,400 calls and 30,000 ms. Reusing its per-case wall cap for 24 cases allows 12 minutes of matrix runtime and leaves only 8 minutes for the rest of the single CI job. No inspected source or packet provides a benchmark for 2,073,600 pinned-Havok calls or a baseline duration for the full job. A smaller candidate matrix cap below is a concrete policy proposal, not a demonstrated runtime.

The existing L01 record also leaves contact retention unbounded, while `sampling.ts` deliberately downsamples playback to 30 Hz. A complete, reviewable result therefore needs a separate bounded summary schema; it must not store every 15-body transform at every Havok call or substitute 451 playback frames for 120 Hz sweep checks.

## Verified source facts

- The T02-L01 catalogue entry fixes 24 tuples in gap/tilt/impulse/azimuth order, requires 15 seconds at fixed `1/120`-second nominal ticks, at most 48 checked Havok calls per tick under the proposed guard, per-tick contacts, whole-button swept clearance, initial/final extent crossing, cap travel, finite/settled state, and one complete artifact. It says the artifact is written only after all matrix assertions pass and forbids dropping tuples or changing the matrix. Its stop condition requires a frozen guard before trials.
- The accepted config has a 15-second maximum duration and `fixedStepSeconds: 1/120`; its existing `diagnosticGuard` is explicitly `browser-direct-impulse-v1`, with `maxSubstepsPerTick: 48`, `maxTotalSubsteps: 86,400`, `maxBatchSubsteps: 120`, and `maxWallTimeMs: 30,000`. Those call and wall limits cover one D01 direct-shot run, not an L01 matrix.
- `intendedShotProbe.test.ts` computes `maximumSteps = ceil(15 / (1/120)) = 1,800`, loops once per fixed tick, and caps a 40-trial test at 600,000 ms. Its current maximum is 40 × 1,800 = 72,000 explicit calls if every trial reaches the duration limit. That timeout is a ceiling, not a runtime measurement. It is 28.8 times fewer calls than the proposed L01 worst case.
- `worldFactory.ts` builds 15 dynamic match bodies and seven static bodies (the support slab plus four posts and two crossbars). The current intended-shot observer deduplicates contacts by nominal step, pair, and event type, but `contacts` has no count cap. Its event type is stringified, so a strict artifact bound also needs a verified or enforced string-length limit.
- `intendedShotProbe.test.ts` can collect up to 1,800 `clearanceMeasurements` per trial, one for each simulated step, and writes pretty JSON with `JSON.stringify(result, null, 2)`. It does not currently cap contact count, each observation's serialized bytes, or whole-artifact bytes. Its observation schema has fixed numeric/vector/material fields plus the unbounded `contacts` array and bounded-by-loop clearance array.
- The canonical playback sampler returns at most 451 frames at 30 Hz for a 15-second shot. It validates 15 body transforms per recorded input state, but its output is deliberately downsampled. It is not sufficient evidence for L01's 120 Hz interval checks.
- `.github/workflows/ci.yml` gives the single `verify` job 20 minutes. In that same job, setup/install, Playwright browser install, disposable migrations, `pnpm verify`, production/Worker packaging, integration/preview and diagnostic browser checks, and artifact upload all consume the job deadline.

## Workload arithmetic

At the worst-case duration, each case has 1,800 nominal ticks. With 48 actual substeps per tick:

| Budget | Per case | 24 cases |
|---|---:|---:|
| Nominal ticks | 1,800 | 43,200 |
| Havok calls | 86,400 | 2,073,600 |
| Batches of at most 120 calls | 720 | 17,280 |
| Simulated duration | 15 s | 360 simulated s |

If a 30-second wall cap is copied from D01 for each case, the summed case ceiling is 720 seconds (12 minutes), before matrix setup, cleanup, serialization, and all other steps in the CI job. Only 480 seconds remain in the 20-minute job. Even a proposed 9-minute matrix cap would require a minimum average of 3,840 calls/second across the entire matrix, with 4,320 calls/second while using the full 20-second per-case cap. Those rates are not measured here.

If the full 15-body guard and finiteness checks read every dynamic body at every call, the worst case is 1,296,000 body-state checks per case and 31,104,000 across the matrix. This multiplication is conditional on the eventual guard implementation checking all 15 bodies each substep; the current L01 source does not implement that runner. The number underscores why call throughput cannot be inferred from the existing 72,000-call test ceiling.

**Timing recommendation, provisional:** freeze `maxCallsPerCase=86,400`, `maxCallsMatrix=2,073,600`, `maxBatchesPerCase=720`, `maxBatchesMatrix=17,280`, `maxBatchCalls=120`, and fail immediately on any excess. Candidate wall ceilings are 20,000 ms per case and 540,000 ms for the entire matrix, including world creation, cleanup, hashing, and serialization. This gives the 24 full per-case ceilings 480,000 ms and leaves at most 60,000 ms inside the matrix cap for its overhead; 11 minutes remain for the rest of the CI job. This is only a budget allocation. The coordinator still needs an exact-host benchmark and a successful full hosted run to show the remaining job work fits. If a benchmark cannot establish that margin, split or lengthen the hosted job before running the fixed matrix; do not drop cases or silently extend the guard at runtime.

## Bounded output proposal

The current output source does not define an L01 serialized schema, so the following are explicit candidate caps for coordinator review, not accepted contract values. They preserve evidence needed by the packet without retaining raw transforms for every substep.

| Output item | Per-case cap | Matrix cap | Enforcement and purpose |
|---|---:|---:|---|
| Nominal sweep-summary rows | 1,801 | 43,224 | Initial state plus up to 1,800 tick endpoints. Each row summarizes the worst full-button swept clearance, maximum linear/point and angular sweep, crossing/overlap classification, checked-substep count and finite/settled flags. The implementation still checks all 48 substeps; it stores summaries rather than substep poses. |
| Contact records | 8,192 | 196,608 | Fail before append when the cap would be exceeded; never drop older or later contacts. This reuses the scale of the existing per-shot facts limit as a candidate diagnostic ceiling, not as an already-applicable L01 contract. Pair IDs and event type must be bounded strings, points finite or null, and records retain exact nominal tick and pair. |
| Serialized entity transforms | 19 | 456 | At most the initial and final button/obstacle transforms (four records) plus final settled transforms for all 15 dynamic bodies (15 records). Do not serialize all-body transforms per tick or per Havok substep; they are verified in memory and summarized by the sweep rows. |
| Encoded row size | 512 bytes | — | Check UTF-8 serialized bytes, including output indentation allowance, for every summary/contact/transform row. Fail the matrix if exceeded. |
| Per-case JSON | 5 MiB | — | Enforce after constructing each complete case result; do not truncate. |
| Complete JSON artifact | — | 121 MiB | Compute the exact UTF-8 byte length of the final pretty-printed matrix JSON before any file write. Fail closed if over. |

The row-count arithmetic is `(1,801 + 8,192 + 19) × 512 = 5,126,144` bytes per case. Allowing another 64 KiB for fixed case metadata gives 5,191,680 bytes, below a 5 MiB case ceiling (5,242,880 bytes). Twenty-four 5 MiB cases plus a 64 KiB matrix envelope use at most 120.0625 MiB, below the proposed 121 MiB full-artifact ceiling. These are hard bounds only if every row and fixed metadata/string cap is actually enforced and the final encoded-byte check uses the exact output format. The row-size and metadata sizes are proposed limits, not measurements of the current test's output.

The schema should store compact per-tick scalar summaries, not 86,400 transforms per case. At most 1,801 sweep summaries per case preserve the 1/120-second nominal checkpoints; per-substep guard assertions must be counted and accumulated across each tick. The initial/final transform records support whole-button extent crossing, while the exact deterministic input-state/config hashes support setup provenance. The artifact must preserve all observed contact records up to the cap. If any count, string, finite-number, row-byte, per-case-byte, total-call, batch, or wall limit is exceeded, abort the entire matrix, write no success artifact, and report the actual failing case and counters. Do not truncate arrays to fit.

## What remains unproved

1. There is no measured runtime for the L01 2,073,600-call bound, no full-workflow baseline duration, and no evidence that a 9-minute matrix cap leaves enough time for `pnpm verify` plus the rest of this 20-minute job. The current direct-guard 30-second cap would consume 12 minutes by itself.
2. The L01 packet does not freeze the exact per-case observation shape, contact cardinality policy, byte caps, or whether the required outputs need raw transforms. The proposed compact schema must be reconciled with the independent review's evidence needs before source implementation.
3. The current contact event-type domain and worst-case number of unique `(tick, pair, type)` records are not established by the inspected source. The proposed 8,192 cap is a fail-closed output bound; it is not proof that every valid physics run remains under it.
4. The proposed 512-byte row limit assumes finite numbers and fixed, bounded body/event names. Enforce those assumptions explicitly and verify the exact formatted output byte count before writing.
5. The sampled sampler limit of 451 playback frames cannot be reused to downsample sweep evidence. Any design that needs full raw per-substep transforms has a different, much larger output bound and requires a fresh analysis.

No application check, build, test, browser run, physics trial, or deployment was performed for this audit. The result is a feasibility recommendation, not an L01 policy freeze or runtime pass.
