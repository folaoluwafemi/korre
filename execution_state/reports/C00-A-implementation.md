# C00-A implementation report

**Status: IMPLEMENTED; source review PASS; hosted verification pending.**

## Change

The protocol now accepts an optional structural cancellation signal as a local second argument to `SimulationRunner.simulate`. `SimulationInput` and the JSON command/event payload shapes remain unchanged. Cancellation has a distinct `cancelled` error code and `game.shot.aborted.reason` value. The canonical contract says cancellation is observed by the runner between bounded yields and restores the pre-shot checkpoint; it is not a timeout or partial success. The runtime decision record documents the prelaunch compatibility check and protocol-version escalation if a strict deployed consumer exists.

## Paths

- `packages/game-protocol/src/types.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/protocol.test.ts`
- `knowledge_base/execution/CONTRACTS.md`
- `execution_state/DECISIONS.md`

## Checks

- `node scripts/check-completion-plan.mjs --packet C00-A` — PASS; card ready before dispatch because original parent T01 is ACCEPTED.
- `pnpm exec vitest run packages/game-protocol/src/protocol.test.ts` — NOT RUN locally; execute as part of the hosted verification wave.
- `pnpm verify` — NOT RUN locally; execute on GitHub for the exact reviewed source revision.
- Independent source review — PASS; see `execution_state/reports/C00-A-review.md`.
- Runtime verification — NOT RUN; see the required GitHub commands above.

No application install, build, unit test, browser run, migration, or deployment ran locally. Existing remote baseline run 38057543954 is unrelated to these changes.

## Compatibility and limits

No live deployed Counterball gameplay consumer is recorded in current integration/deployment state. The additive event reason must still be checked against any staging/version deployed before release. This packet only freezes the interface; no runner currently proves cancellation timing or cleanup. T02 remains RUNNING and no gameplay gate is accepted by this change.

Next: commit/push this source-reviewed revision, run the focused protocol test and full verification on GitHub, then update this report and packet checks with exact run evidence.
