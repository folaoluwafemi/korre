# T02-BR01 attempt 4 implementation report

## Bounded repairs

This pass addresses only the three findings in `T02-BR01-source-review-3.md`.

- Added `createDiagnosticSweepGuard`, which combines the frozen outer diagnostic energy, drop, and apron values with its tunnelling point-sweep, rotation, and call-count values. The runtime sweep-plan call uses this same assembled guard. A focused test asserts all six selected values exactly.
- Corrected the apron boundary regression so the conservative COM-drop check remains inside its limit. Added a separate swept interval regression that crosses the per-body drop bound while its apron and slab clearances remain safe.
- Added typed error normalization. Guard helper failures are converted to `resourceLimit`, valid existing `SimulationError` codes pass through unchanged, and untyped errors caught by the runner become `initialization`. Cleanup aggregation retains the selected typed code. Focused tests cover these paths.

The changes preserve the attempt-3 shifted-energy check, cleanup ordering, canonical browser Havok/WASM and world-factory path, exact D01 `home-6` impulse tuple, and selected hashed limits. No protocol/config/contract, fixture, production runner, gameplay, or browser export change was made in this repair.

## Checks and limits

- `node scripts/check-completion-plan.mjs --packet T02-BR01` — **exit 0**, plan consistency only (`verdict: PASS`, 83 packets); this does not check implementation or runtime behavior.
- Scoped source `git diff --check` — **tracked `browser.ts` exit 0**. The three assigned new/untracked files each returned exit 1 from `git diff --no-index --check -- /dev/null <path>` because they differ from `/dev/null`; none emitted whitespace diagnostics. Git reported only LF-to-CRLF working-copy warnings. The combined hygiene-check command exited 0 after accepting those expected no-index statuses.
- Local install, application tests, typecheck, lint, build, browser, Havok simulation, and deployment — **NOT RUN**, as required.
- Required hosted checks: `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`.

No browser movement or physics measurement, playable result, calibration acceptance, deployed Havok proof, or T02 acceptance is claimed.
