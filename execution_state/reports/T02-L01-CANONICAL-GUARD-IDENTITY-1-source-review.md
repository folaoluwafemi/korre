# T02-L01-CANONICAL-GUARD-IDENTITY-1 source review

**Source verdict: PASS. Runtime on the repaired source: NOT RUN.** The two-line producer fix now validates against the accepted canonical guard version without widening the accepted range or changing any artifact, physics, or datum semantics.

## Scope and packet

The exact packet extraction returned plan-consistency PASS for 124 packets. Its current `ready:false` reflects the card's post-dispatch state; the saved pre-dispatch extraction lists it as ready. The packet retains the original 15 direct L01 dependencies, the accepted support-datum contract dependency, and inherited T01 acceptance. Only the two assigned files changed:

- `games/counterball/src/simulation/loftCoarseProbe.ts` — SHA-256 `721ca0c3d7a5c5847f390a0d184c5c55a3dd63733a24acc588ed8ff8194d70ef`.
- `games/counterball/src/simulation/loftCoarseProbe.test.ts` — SHA-256 `72e9468b19663afe32e16642b32d720b7e89cf00e2f344c73d842933ddd5849b`.

These match the implementation report. The source diff changes exactly the two lower/upper integer bounds in `validateMatrixMetadata` from literal `1` to `guard.schemaVersion`. That existing `guard` is read from `COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard`, so the accepted config currently supplies schema version 2. The later equality check against `guard.schemaVersion` remains unchanged. This is exact current-version validation, not an expanded range, and adds no interface or duplicate version literal.

The new focused test rejects the previous version, next version, fractional value, NaN, and positive infinity. For each it checks an `invalid` error, zero sink chunks, and exactly one abort. Existing positive cases and the other 12 failures from the pre-fix hosted run are unchanged in this two-file diff. No schema, metadata shape, serialized bytes, numerical physics guard, support-datum calculation, or matrix behavior was changed.

## Prior hosted evidence and limits

The supplied run `38635348850` is pre-fix evidence only. Its failures originate at the hard-coded 1-through-1 range, before the remaining writer behavior can be exercised; it does not verify this correction. The full Verify, build, integration, production browser, and current diagnostic browser gates must run against the repaired exact source. The pending raw-fixture-pin failure remains expected and must fail closed; this source review does not accept the producer consumer, matrix, native motion, or T02.

Manual source-format inspection found the new test layout consistent with surrounding tests. I ran only the exact packet extraction and read-only source/report inspection; no local formatter, application tests, typecheck, lint, build, browser, or physics command ran. Runtime remains NOT RUN.
