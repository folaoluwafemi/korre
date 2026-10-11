# T02-L01-GUARD-SCHEMA-1 repair 1 review

**Verdict: CHANGES_REQUIRED.** The repair addresses boolean path collection and mutation, but the two explicit path assertions use the wrong matcher for array values. They are evaluated before the changed-field loop and are expected to fail, so this test does not currently provide the required hash-sensitivity evidence. Tests/build/runtime were **NOT RUN**.

## Scope checked

- Read the original finding in `execution_state/reports/T02-L01-guard-schema-review-1.md`, repair report `execution_state/reports/T02-L01-guard-schema-repair-1-implementation.md`, and accepted field inventory in `knowledge_base/execution/CONTRACTS.md` and `knowledge_base/execution/completion/CONTRACT_WORK.md`.
- Reviewed only the scoped diff for `packages/game-protocol/src/protocol.test.ts`. The repair report identifies that file as the only source write for this repair; it names no other changed source path.
- No tests, builds, browser, physics, Havok or deployment commands were run.

## Findings

The original omission is repaired at the helper level. `getPrimitivePaths()` now collects string, number and boolean leaves (`protocol.test.ts:76-96`), and `changePrimitiveAtPath()` toggles booleans (`:100-114`). The test spells out the two accepted boolean paths, `setup.capsIdentityRotation` and `setup.allDynamicVelocitiesZero` (`:524-525`). For every collected path, the subsequent loop submits a changed guard to `safeParse` and compares its canonical hash with the baseline (`:526-541`). Those are the right checks for the contract’s requirement that every strict literal field, including both booleans, affects the hash.

However, both membership assertions call `toContain` with newly created arrays (`:524-525`). Array values compare by identity with `toContain`; the arrays returned by `getPrimitivePaths()` are not the same objects as the two inline expected arrays. These assertions therefore do not prove path membership and are expected to fail before the loop runs. Replace them with deep-equality membership assertions, such as `toContainEqual`, or an equivalent `arrayContaining` assertion. Then the strict-rejection and changed-hash loop can execute over and verify those boolean leaves.

No other defect was found in the reviewed boolean mutation or per-path verification code. The source change is bounded to the assigned protocol test according to the repair report and the scoped diff. This review does not claim that the test passes; the corrected matcher still needs hosted test verification.
