# T02-L01-ARTIFACT-1 repair 1 implementation

**Source checks:** implementation only; no application tests, typecheck, lint, formatter, build, browser, or physics command was run. The required independent review and exact-head GitHub verification remain pending.

I changed only the two packet source files and this report:

- `games/counterball/src/simulation/loftCoarseProbe.ts`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`
- `execution_state/reports/T02-L01-ARTIFACT-1-repair-1-implementation.md`

The writer now rejects unknown or missing fields in matrix/case metadata and in the dynamic/static body, material, mass-projection, final-state, settling, eligibility, body-row, contact-row, and sweep-row records. It checks canonical config/guard identity and config hash; all 15 dynamic IDs and seven labeled static IDs; all 22 shape material records; mass-projection facts; canonical tuples and row ordering; finite values; actual call/batch totals; and sweep extrema against the accepted per-call guard. Contact and clearance pairs must identify the canonical button/obstacle pair. Compact settling data retains both measured speeds for all 15 bodies on all 60 ticks, with a bit mask checked against the thresholds. Tests now reject incomplete and malformed records, unknown fields, incorrect static/obstacle identities, and invalid endpoint/sweep relationships.

The row model records tick zero plus one body sample per executed nominal endpoint. Thus 1,801 body samples contain 1,800 nominal intervals and 1,800 corresponding sweep rows; the config's 1,801 sweep-row cap is a conservative upper cap, while a 1,801-row input has no matching endpoint interval and is rejected. The maximum-case test reaches 27,015 body rows, 8,192 contact rows, 1,800 reachable sweep rows, 86,400 execute-step calls, 720 batches, and 30,000 ms per case. A streaming discard sink reaches exact 24-case body/contact/workload aggregates without retaining the matrix. Limit-plus-one tests cover per-case body/contact/sweep and workload limits. Byte-inaccessible case/matrix maxima remain constrained by the stricter accepted row/count ceilings described in the original review.

`JsonChunkWriter.flush` now races a pending sink write against abort, removes its abort listener, and lets the existing failure path call `sink.abort` before rejecting. The new deferred-write test aborts while the first sink write is unresolved and checks that the writer rejects as cancelled and aborts the sink before the write is released. The streaming encoder, awaited backpressure, bounded 256-KiB chunks, exact UTF-8 accounting, and one-case-at-a-time behavior remain in place.

The only command run was the required document check:

```text
node scripts/check-completion-plan.mjs --packet T02-L01-ARTIFACT-1
exit 0
verdict PASS (plan consistency only); 96 packets; 21 remaining parents; initialReady []; card ready:false
```

The checker explicitly says it is not an implementation/runtime check. `git diff --check` was not rerun because these files are untracked in the current checkout and the earlier plain diff check could not inspect them; coordinator staging and scoped cached-diff hygiene remain pending. No tests are reported as passing. The pure Node tests are ready for the exact reviewed GitHub `pnpm verify`; this packet itself provides no Havok or browser-physics evidence.
