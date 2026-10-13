# T02-L01-MATRIX-1 repair 2 independent source review

**SOURCE: PASS. RUNTIME: NOT VERIFIED.**

The prior exact-head run report records a TypeScript `TS2345` at line 908: a validated `string` was passed to `Array.includes` on a literal-ID array. The current source fixes that boundary by constructing `MATRIX_KNOWN_BODY_IDS` as a `ReadonlySet<string>` from the existing `MATRIX_ENTITY_IDS` and `MATRIX_STATIC_IDS` arrays (lines 100–103), then checking `MATRIX_KNOWN_BODY_IDS.has(bodyId)` after the `typeof bodyId === "string"` guard (lines 908–912). `ReadonlySet<string>.has` accepts a string, and the set contains exactly the same canonical dynamic and static IDs as the former spread-array membership check. This is type-correct in principle and preserves rejection of unknown IDs without a cast or expanded allowlist.

The earlier source blockers are repaired in the current file:

- There is one matrix test declaration, at line 2065; the second identical 147-line block is gone.
- The metadata settling check visits each of the 60 rows with an indexed `for` loop (lines 1008–1026), so validation does not stop at the first unsettled sample.
- The eligibility settling check also visits all 60 rows (lines 1378–1400), validates all 15 speeds and each row against its endpoint body-state facts, and accumulates `allSettled` for the eligibility result at line 1430.
- The unused `allSettled` binding from the metadata-only pass is gone. The only current binding is consumed by eligibility.

The inspected source diff is limited to the canonical `ReadonlySet` and replacement of the membership expression. It does not weaken the allowlist or the settling assertions. The repair implementation report says only the assigned E2E source path and its report were changed, and records a scoped whitespace check; I did not run application checks.

The prior run failed during typecheck, before lint or matrix execution. This source review does not verify the repaired code with hosted typecheck, nor does it establish a Chromium/Havok matrix result, artifact, or 20-minute job fit. Exact-head hosted verification remains required.
