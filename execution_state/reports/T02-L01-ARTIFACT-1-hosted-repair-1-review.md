# T02-L01-ARTIFACT-1 hosted typecheck repair 1 — independent review

**Fresh exact-head hosted verification remains required.** No local app checks, compiler, tests, build, browser, or physics were run for this review.

I inspected the saved `verify.log` from GitHub run 38164789395 on SHA `2808997b30388129c171a997bbb0ec2ed78e5d9c`, the original implementation and CHANGES_REQUIRED review, the accepted source repair review, the hosted-repair implementation report, and the current diff for the two assigned source files. The archived diagnostics independently count to 160: TS4111 131, TS2322 9, TS2532 7, TS2345 6, TS18046 6, and TS2304 1. That run failed at typecheck before the repair; it is diagnostic context, not verification of the repair.

## Review findings

- **TS4111 / TS18046:** The source adds explicit local types for records previously accessed through `Record<string, unknown>` or `unknown`. Each conversion follows the existing `assertExactKeys` check (`games/counterball/src/simulation/loftCoarseProbe.ts:416`; representative typed views at `:478-496`, `:546-560`, `:789-817`, and `:834-915`). Those runtime checks still validate exact keys, finite values, identifiers, ordering, thresholds, and the frozen guard after narrowing. JSON object keys remain sorted; switching to `for...of` avoids unchecked indexed access without changing canonical ordering (`:1033-1055`).
- **TS2532 / TS2345 / related TS2322:** `requiredAt` rejects an absent indexed value through the same typed invalid-input path, and is used for canonical tuple/entity lookups (`:1085-1089`, `:1381-1390`). Test-only `requiredItem` similarly fails a malformed fixture instead of relying on unchecked indexing. The diagnostic sources for potentially undefined array elements now use guarded reads or `map` updates. The invalid-mass case remains intentionally invalid, and the NaN test still submits a complete row before asserting rejection.
- **Remaining TS2322 callback cases:** Sink test callbacks now use block bodies and return `void`, preserving the same chunk copies and abort recording. The mass-projection fixture update uses `map` and changes only the first body's intentionally invalid `withinTolerance`; no expected rejection was removed or relaxed.
- **TS2304:** The byte comparison now constructs `new TextEncoder()` at its use site. This is equivalent to the existing encoder use and removes the unresolved lower-case identifier.

The current diff against the failed-run SHA contains only strict-type handling and test-fixture access changes in the two packet source files. It does not remove an exact-key validator, finite/domain check, guard assertion, expected rejection, tuple/cap assertion, or test case. `JsonChunkWriter.flush` still races pending sink writes against the abort signal and cleans up its listener (`loftCoarseProbe.ts:1140-1175`); the deferred-write cancellation regression remains and checks rejection and `sink.abort` before releasing the write (`loftCoarseProbe.test.ts:699-730`). The strict metadata/row checks and exact-boundary tests added by the separately reviewed source repair remain present.

## Limits

The typed local views make the strict code inspectable to TypeScript; they do not by themselves establish that diagnostics are gone. The repair report states no compiler or tests were run after these edits. A fresh `pnpm verify` on the exact reviewed source SHA is therefore still required before acceptance. No runtime, physics, or browser result is claimed.
