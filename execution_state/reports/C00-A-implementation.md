# C00-A implementation report

**Status: IMPLEMENTED; format repair 1 is independently reviewed; fresh hosted verification pending.**

## Change

The protocol now accepts an optional structural cancellation signal as a local second argument to `SimulationRunner.simulate`. `SimulationInput` and the JSON command/event payload shapes remain unchanged. Cancellation has a distinct `cancelled` error code and `game.shot.aborted.reason` value. The canonical contract says cancellation is observed by the runner between bounded yields and restores the pre-shot checkpoint; it is not a timeout or partial success. The runtime decision record documents the prelaunch compatibility check and protocol-version escalation if a strict deployed consumer exists.

## Paths

- `packages/game-protocol/src/types.ts`
- `packages/game-protocol/src/schemas.ts`
- `packages/game-protocol/src/protocol.test.ts`
- `knowledge_base/execution/CONTRACTS.md`
- `execution_state/DECISIONS.md`

The packet's standalone focused Vitest command was absent from the pre-existing hosted workflow. Coordinator added that exact command as a named step in `.github/workflows/ci.yml`, a shared CI configuration path the coordinator owns, so the next GitHub run can satisfy the packet's distinct focused-test check before full verification. This coordinator-only CI support change does not add a private test helper or alter the C00-A source packet contract.

## Checks

- `node scripts/check-completion-plan.mjs --packet C00-A` — PASS; card ready before dispatch because original parent T01 is ACCEPTED.
- GitHub Actions run 38078311528 on `324550eded86381597e82c4cb184d8620dcb51d4` — CHANGES_REQUIRED. Disposable PostgreSQL migrations and all package/root typechecks passed. Prettier stopped `pnpm verify` on `packages/game-protocol/src/protocol.test.ts` and `packages/game-protocol/src/types.ts`; unit tests/build did not run, and integration/browser checks were skipped. Full verify log: `execution_state/reports/C00-A-run-38078311528-verify/verify.log`.
- `pnpm exec vitest run packages/game-protocol/src/protocol.test.ts` — NOT RUN in the failed hosted attempt; zero protocol cases ran. The standalone command remains required if it can be made available on GitHub without changing the packet's owned paths.
- GitHub formatter artifact `execution_state/reports/C00-A-run-38078311528-formatting/formatting-repair.patch` — `git apply --check` PASS; applied only to the two protocol files owned by C00-A.
- Independent source review — PASS; see `execution_state/reports/C00-A-review.md`.
- Independent format re-review — PASS; see `execution_state/reports/C00-A-format-repair-review.md`.
- Independent runtime review — CHANGES_REQUIRED; see `execution_state/reports/C00-A-runtime-review.md`.
- Coordinator CI support change — `.github/workflows/ci.yml` now runs the packet's exact focused protocol command before `pnpm verify`; independent configuration review PASS is at `execution_state/reports/C00-A-ci-review.md`.
- Fresh exact-head runtime verification — NOT RUN; required after pushing the reviewed repair.

No application install, build, unit test, browser run, migration, or deployment ran locally. Existing remote baseline run 38057543954 is unrelated to these changes.

## Compatibility and limits

No live deployed Counterball gameplay consumer is recorded in current integration/deployment state. The additive event reason must still be checked against any staging/version deployed before release. This packet only freezes the interface; no runner currently proves cancellation timing or cleanup. T02 remains RUNNING and no gameplay gate is accepted by this change.

Next: push the independently reviewed source/config repair, then run the exact focused command and full verification on GitHub. Record all commands and test counts before acceptance.
