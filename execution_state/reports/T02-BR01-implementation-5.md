# T02-BR01 attempt 5 implementation report

## Hosted failure addressed

Exact-head run `38112815977` failed during Counterball typecheck on the prior head `e0560b5e9fa8a953b5598cb1ac260633ff7966ef`. Its saved Verify log reported optional `centerOfMass`, `inertia`, `inertiaOrientation`, and `mass` reads, plus a direct `AggregateError` to `SimulationError` cast. Verify did not complete; no package test result or downstream build/browser/physics result exists for that head.

This repair adds explicit absence checks for all four native mass-property values before dereferencing them. An absent value now fails with typed `resourceLimit`; validated locals are used for subsequent finite, positivity, and configured-mass checks. Cleanup errors are combined with `Object.assign` to construct an `AggregateError` that already has the selected `SimulationErrorCode`, without an unsafe cast; the prior code-preservation behavior remains.

The uploaded formatting patch (`188A65F4701DA182459BE75F056FA56DF0A6FE57EEB116C1019588E8E261D50C`) was applied only to its two listed paths, `browserDirectProbe.ts` and `browserDirectProbe.test.ts`. It contains formatting changes only. The repair preserves the accepted D01 tuple and the attempt-4 guard assembly, shifted-energy checks, and cleanup order. No browser export, shared contract/config, fixture, CI, or unrelated path was changed.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-BR01` — **exit 0**, plan consistency only (`verdict: PASS`, 83 packets); no implementation/runtime validation.
- Scoped `git diff --check` — **exit 0** for the three assigned source paths. The new report returned expected `git diff --no-index --check -- /dev/null <path>` exit 1 because it differs from `/dev/null`, with no whitespace diagnostics. Combined hygiene check exit 0; Git emitted only an LF-to-CRLF warning for the report.
- Local install, application tests, typecheck, lint, build, browser, Havok simulation, and deployment — **NOT RUN**, as required.
- Required hosted checks on a new exact head: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`.

No runtime result, playable match, calibration acceptance, deployed Havok proof, or T02 acceptance is claimed.
