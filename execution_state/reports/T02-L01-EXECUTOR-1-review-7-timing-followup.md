# T02-L01-EXECUTOR-1 review 7 timing follow-up

**Verdict: CHANGES_REQUIRED (review text only)**  
**Runtime: NOT RUN**

`CONTRACT_WORK.md:180` explicitly resolves the timing question that review 7 calls ambiguous at line 28. It defines case `wallTimeMs` as elapsed from per-case setup start through world/apron cleanup, sampled before serialization; envelope `wallTimeMs` as the exact sum of the 24 case values in canonical tuple order; and separate serialization-inclusive case and matrix stop clocks. It also defines `measuredMatrixWallTimeMs` from runner entry through writer/sink flush. Thus review 7's assertion that the accepted text leaves the artifact interval undefined is incorrect and should be corrected.

The inspected implementation matches those definitions: `runCase` starts its metadata clock at `loftCoarseRunner.ts:990`, then assigns `result.metadata.wallTimeMs` after cleanup at `:1537-1539`. `makeCases` yields cases in the canonical tuple list and checks the independent per-case and matrix clocks after case serialization at `:1552-1568`. The writer accumulates each case's `wallTimeMs` into the envelope at `loftCoarseProbe.ts:1846-1851` and flushes before returning at `:1880-1885`; the runner samples `measuredMatrixWallTimeMs` after that return at `loftCoarseRunner.ts:1644-1652`. These are source observations only; no runtime or app checks were run.

No implementation change is indicated by this timing comparison. The prior independent report's ambiguity statement is the specific discrepancy.
