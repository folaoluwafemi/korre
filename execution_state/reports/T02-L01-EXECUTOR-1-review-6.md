# T02-L01-EXECUTOR-1 independent source review 6

**Verdict: CHANGES_REQUIRED**  
**Runtime and hosted checks: NOT RUN**

## Scope

Reviewed the current `games/counterball/src/simulation/loftCoarseRunner.ts` repair against the 18 TypeScript diagnostics recorded in `execution_state/reports/T02-L01-EXECUTOR-1-run-38400680491/github.log`, the accepted `T02-L01-EXECUTOR-1` packet in `knowledge_base/execution/completion/LOCAL_PACKETS.json`, and the L01 contract in `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`. No source, config, contract, status, ledger, or ownership files were changed. No build, typecheck, test, browser, or physics command was run.

## Diagnostic repair audit

The current source has a corresponding repair for every reported diagnostic:

- The two `?url` / `?raw` module declaration errors are covered by the triple-slash Vite client reference at line 1.
- Both combine-mode argument errors are covered by `materialName(PhysicsMaterialCombineMode | undefined)` and its explicit missing/unsupported-mode failure (around lines 306-323).
- The optional friction, static-friction, and restitution diagnostics are addressed by reading the values once, checking their runtime number type before use, and retaining finite/domain checks (around lines 327-359).
- The two `CounterballWorld | undefined` errors are addressed by using the non-optional `activeWorld` local for setup and simulation after assigning it to the outer optional `world` cleanup reference (around lines 1007-1094).
- The two apron-property errors are addressed at the swept-envelope call site by reading `apronClearance` and `surfaceClearance`, the returned names (around line 1308); later post-step checks correctly use the distinct `supportClearances` result fields `apron` and `slab`.
- Both contact-row cast errors are addressed by `isButtonObstaclePair`, which uses the declared pair tuple and accepts either endpoint order (around lines 761-769, 1416, and 1472).
- The missing `caseBeginCalls` name is addressed by capturing the counter at `runCase` entry (line 993), so the final delta assertion (line 1542) covers setup through the end of that case.

These are source-level mappings, not proof that TypeScript now passes. Exact-head hosted verification remains required.

## Required portability change

The Vite reference is tied to `apps/web/node_modules/vite/client.d.ts` by a relative path from the game package. `vite` is declared only in `apps/web/package.json`; `games/counterball/package.json` has no Vite dependency or package-owned query-module declaration. The path should resolve in a full workspace install, but it couples the game package typecheck to an install artifact belonging to its consumer app. It fails when the package is typechecked from a filtered install that omits `@korre/web`, and can break if the web app's dependency layout or location changes. This crosses the monorepo's controlled package-to-app dependency boundary.

Replace the reference with package-owned declarations for the exact Vite query imports, or have the coordinator establish a properly declared, pinned type dependency that `@korre/counterball` itself can resolve. Keep manifest and lockfile edits coordinator-owned. Then rerun exact-head hosted `pnpm verify`; no local typecheck is recommended under the packet's host-only verification rule.

## Contract-preservation checks

- **Byte and hash provenance:** The import identities and data flow are unchanged. The runner still encodes the raw fixture text and hashes those bytes, separately hashes the fixture payload with `configHash` omitted, checks both fixture config-hash copies against the canonical config hash, fetches the imported WASM URL, and hashes the fetched `ArrayBuffer` against the guard identity (lines 1618-1635). The new declaration reference changes typing only.
- **Failure handling:** Missing or unsupported native material data fails as `resourceLimit`; existing typed cancellation/resource failures remain normalized. The sink-abort failure path continues to use `errorWithCleanup`, retaining the primary diagnostic code and the abort failure. The changed code does not convert a failed trial into success.
- **Call and timing accounting:** Each public `executeStep` call remains preceded by the sweep/workload checks and increments both case and matrix counts only after the call. The per-case count-delta assertion remains present. The case deadline includes serialization, the matrix deadline includes writer flush, and the compact `measuredMatrixWallTimeMs` is sampled after `writeLoftCoarseMatrix` returns (lines 1542, 1561-1570, 1646-1663). No cap is relaxed.
- **Contact semantics:** A missing native contact point remains `null`; a present non-finite point fails with `resourceLimit` (around lines 734-738). The helper preserves the button-versus-`home-1` obstacle pair test in both endpoint orders, including the per-tick contact classification.
- **Native materials:** Required values are checked before serialization. Existing finite, nonnegative friction checks, restitution range check, and accepted combine-mode comparisons remain in place.
- **World cleanup:** `activeWorld` is also stored in the outer `world` reference used by cleanup. The cleanup path removes observers, restores the original support shape when the replacement was attached, disposes the replacement and world in the accepted order, and carries cleanup errors with the primary error (around lines 1523-1538). The type-narrowing change does not bypass cleanup.

No matrix result, physics validity, browser execution, or artifact acceptance is claimed. The package-local Vite type resolution finding must be addressed before this source review can pass; hosted verification and the later real-browser matrix remain separate gates.
