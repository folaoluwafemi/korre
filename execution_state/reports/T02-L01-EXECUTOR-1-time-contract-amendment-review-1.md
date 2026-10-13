# T02-L01 executor time-contract amendment review 1

**Verdict: PASS — faithful clarification.** The proposal resolves measurement intervals that the accepted L01 contract leaves open. It does not weaken or change a hard cap, physics value, or schema, provided the workload metadata fields remain distinct from the independently enforced deadline clocks.

## Contract comparison

- `CONTRACT_WORK.md` line 178 fixes the 30,000 ms per-case ceiling and 720,000 ms matrix ceiling, including setup/disposal, hashing, and serialization. Lines 182–184 require exact matrix row/call/batch/time totals and stream the encoded artifact. They do not define the interval represented by case and envelope `wallTimeMs`.
- The proposed case metadata interval—per-case setup start through cleanup, sampled before case streaming—gives that previously undefined workload field a stable meaning. The envelope’s `wallTimeMs` as the exact sum of all 24 per-case values matches “exact … time totals.” These values must be labelled workload totals, not total run elapsed.
- Keeping the actual 30,000 ms case deadline active through that case’s serialization preserves the existing cap and gives it a clear enforcement end. The separate 720,000 ms clock from runner entry through setup, hashing, matrix serialization, and final writer/sink flush also preserves the existing matrix ceiling and makes its boundary explicit.
- The separate `measuredMatrixWallTimeMs` from runner entry to writer/sink flush is consistent with that cap interval. It must remain distinct from the envelope sum. The accepted contract’s Playwright download validation, atomic rename, and attachment remain covered by the test/job deadline after the runner clock ends (CONTRACT_WORK.md lines 188–192); the proposal does not move that host-side overhead outside the overall job deadline.
- These definitions match the accepted transport design: browser output is downloaded, then the Playwright host saves, validates, and finalizes it. The accepted contract still requires no DOM or single-IPC matrix payload and no success artifact after a failed assertion.

## Exact distinction to preserve

Use separate clocks in the wording and implementation:

> Case metadata `wallTimeMs` is the monotonic elapsed duration from per-case setup start until world/apron cleanup completes, sampled before that case is serialized. Matrix-envelope `wallTimeMs` is the exact sum of the 24 case metadata values in canonical tuple order. These fields are workload totals and are not end-to-end matrix elapsed time.
>
> Independently enforce the 30,000 ms case ceiling from setup start through serialization of that case. Independently enforce the 720,000 ms matrix ceiling from runner entry through setup, hashing, all case and envelope serialization, and completion of the writer/sink flush. Report `measuredMatrixWallTimeMs` using those runner-entry and writer/sink-flush endpoints. Keep Playwright host download validation, atomic rename, and attachment within the overall test/job deadline.

If implementation substitutes either metadata total for its corresponding independent deadline clock, that would weaken the accepted cap. The proposal explicitly says to preserve both actual ceilings and the separate runner measurement, so this is a condition on faithful implementation, not a reason to reject the clarification.

The plan checker reported plan consistency only. No app checks, tests, build, browser run, Havok trial, or physics validation were performed.
