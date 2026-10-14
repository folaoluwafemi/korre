# T02-L02 reusable executor boundary audit

**Disposition: readiness inspection only; T02-L02 remains blocked.** The exact
packet extraction passes document consistency but reports `ready:false` and
`initialReady: []`. The current task snapshot keeps parent T02-L01 PLANNED and
its support-datum matrix repair in REVIEWING. This audit does not select a
candidate, unblock dependencies, or claim L01 acceptance or refined physics.

## Reusable boundary and separate artifact identity

The smallest existing physics boundary is the private `runCase` in
`games/counterball/src/simulation/loftCoarseRunner.ts:1365`. Its current inputs
are `(engine, havok, fixture, tuple, matrixIndex, identity, signal,
runStartedAt, counts, progress, completedCases)` and its output is
`Promise<LoftCoarseCase>`. It owns regenerated placement, native world/readback
guards, every Havok step, contacts and sweeps, settlement, eligibility, and
cleanup. The existing `makeCases` generator is the fixed-24 tuple driver. Reuse
this per-case implementation through a shared internal executor or a narrow
grid wrapper; do not copy its physics loop into a test.

Expose a refined-grid API only after the accepted L01 handoff is available. Its
input should be the page-owned `engine`, `AbortSignal`, a validated candidate
`{ tuple, sourceTupleIndex, score }`, and exact source identity
`{ runId, commitSha, matrixId, artifactName, artifactSha256 }`, plus the
existing compact progress callback and bounded file sink. It constructs only
the nine ordered unique tuples from the candidate and returns a compact
summary: source identity, candidate tuple/index/score, the nine tuples, counts,
timing, byte count, and digest. Each trial still calls the same shared
per-case executor with the same initialized pinned Havok, fixture, canonical
guard and cleanup. The refinement artifact must use a distinct versioned
identity and record `sourceTupleIndex` and `refinementIndex`; it must not
overwrite or impersonate the L01 `matrixId` or 24-tuple envelope.

Keep `writeLoftCoarseMatrix` unchanged: `games/counterball/src/simulation/loftCoarseProbe.ts`
validates canonical tuple order, rejects a 25th case, and requires exactly 24.
Extract only its bounded row/case encoding and common row checks for reuse by a
separate nine-case refinement writer with its own exact metadata/identity and
aggregate counts. Preserve all per-row, per-case, cancellation, backpressure,
and byte limits; nine cases do not authorize relaxing the existing L01 caps.

The no-candidate branch must run before the refined executor, WASM fetch or
world creation. It emits an explicit compact `no-candidate` result with reason
and `trialsRun: 0`; it does not serialize an empty nine-case success artifact.

## Candidate selection from the accepted artifact

The existing host validator in
`tests/e2e/counterball-direct-probe.spec.ts:2160` is already streaming at the
file level: it hashes and reads one bounded case object at a time (up to the
existing per-case cap), validates rows, then checks the final digest. It does
not load the full hundreds-of-megabytes matrix at once. Extend per-case
validation to return only a compact score alongside its validated eligibility.
For eligible cases, score the case as the minimum
`minimumWholeButtonObstacleClearance.value` across sweep rows whose
`intervalClassification` is not `no-horizontal-overlap`; discard any case with
no overlapping row or any failed existing eligibility assertion. Retain only
the current best candidate while the 24 cases stream through. Break equal
scores by lower impulse, lower tilt, lower absolute azimuth, then original
tuple index. Use the candidate only after every case validates and the complete
artifact digest and exact run/commit identity match the accepted L01 handoff.

Therefore the existing result can support deterministic selection without
retaining all rows or loading the whole artifact. The current validator returns
only aggregate eligible counts, so score extraction and compact-winner return
are still implementation work; neither candidate nor score is inferred by
this audit.

## Bounded packet split

The current L02 card has only
`games/counterball/src/simulation/loftRefinedProbe.test.ts` as a write path; that
cannot expose the executor, a distinct writer, or a browser input/output path.
Materialize the following as separate reviewed packets, each with at most five
source paths:

1. **Shared executor and refined writer:**
   `games/counterball/src/simulation/loftCoarseRunner.ts`,
   `games/counterball/src/simulation/loftCoarseProbe.ts`,
   `games/counterball/src/simulation/loftRefinedProbe.ts`,
   `games/counterball/src/simulation/loftRefinedProbe.test.ts`, and
   `games/counterball/src/browser.ts`. Keep the canonical writer's 24-case
   acceptance unchanged.
2. **Hosted artifact handoff and browser run:**
   `apps/web/src/CounterballDirectProbe.tsx`,
   `tests/e2e/counterball-direct-probe.spec.ts`, and, only if the exact
   cross-run L01 artifact cannot be supplied by existing workflow inputs,
   `.github/workflows/ci.yml`. Stream-validate the exact accepted artifact,
   return a compact candidate/no-candidate result, and prove the refined
   trials in real Chromium with the same pinned Havok. Keep the no-candidate
   branch at zero trials.

These are scope recommendations only. Coordinator review must preserve all
original dependencies and acceptance boundaries before any packet is made
ready. Candidate refinement is measurement, not production calibration,
playability, or T02 acceptance.

## Evidence limits

Read the exact `T02-L02` extraction, the current task state, the L01-to-L02
handoff and input-readiness reports, and the runner, writer, and host validator
sources cited above. The packet checker reports document consistency only.
No application tests, builds, browser runs, physics trials, or deployments ran.
