# Coordinator changes — independent source review

**Initial verdict: CHANGES_REQUIRED for the restart-clearance contract before it is consumed by legal placement.** The finding below records that original review. A scoped follow-up review is appended: the current wording resolves that conflict. This remains source-only; no tests, builds, formatter, preview server, migration, or database were run.

## Finding

**P2 — D38's diagnostic-only margin conflicts with the planned throw-placement inset.** D38 and `knowledge_base/execution/CONTRACTS.md:124` define `restart.clearanceEpsilon` as a *vertical diagnostic* margin and explicitly say it is not placement permission. But `knowledge_base/execution/GAMEPLAY.md:232-234` defines the horizontal inward throw inset as button support radius **plus clearance epsilon**. Using the same config value for both makes a change intended only for measuring vertical loft also change the legal horizontal restart boundary. The contract currently says both things.

Before T07/placement logic consumes this field, either give horizontal boundary inset its own explicitly named canonical geometry setting, or revise D38/CONTRACTS to deliberately specify both uses and their shared tuning effect. Keep units, schema, fixtures, hash, and tests consistent with the chosen contract. No current placement implementation was changed or tested under this review.

## Coordinator changes reviewed

- D38 is represented in config, type, schema, protocol validation, and the fixture's version stamps. The positive-finite schema rejects zero, negative, NaN, and infinity. The new hash `71ee7d40ec42b0f2c4094e7be7c27b8beda2732c10e5217d21e0c20ebc2c5bdb` appears consistently in the fixture; no old hash remains in the inspected source. `physicsCalibration` remains null, so the change does not claim a calibrated runner.
- CI's PostgreSQL 17 service targets the explicit disposable `korre_test` database, applies migrations twice, enables the opted-in repository tests, and leaves the real Railway database untouched. The prebuilt browser server is used for E2E after the build. The formatting suggestion now diffs only `apps games packages tests`, matching the paths Prettier checks and avoiding screenshot/report binaries. Hosted verification is still pending.
- `scripts/serve-preview.mjs` serves existing files only, binds to `127.0.0.1`, permits GET/HEAD, maps the `/preview` route to the built index, and checks resolved paths against the artifact root. The README command downloads the named built artifact and starts this server without installing or compiling the app.
- The homepage and README say the scene preview is ready but the game is not playable. Runtime records still show T02 and T11 as RUNNING, with T03's original static preview ACCEPTED; they do not mark the new repairs or physics work accepted.

The browser worker was still changing the shared preview files during this review, and `tests/e2e/counterball-preview.spec.ts` was absent from the working tree at that moment. I therefore make no final review or acceptance claim for that in-progress browser packet. Its hosted browser checks remain pending.

## Scoped follow-up: horizontal throw inset correction

**Current scoped source verdict: PASS.** The current `knowledge_base/execution/GAMEPLAY.md:232-234` defines the horizontal throw inset as the oriented button support radius plus a separately named horizontal placement margin, says that margin will be chosen and added to canonical config in T07, and explicitly forbids reusing `restart.clearanceEpsilon`. `knowledge_base/execution/CONTRACTS.md:124` continues to reserve that epsilon for vertical physics diagnostics and says it is not placement permission. Thus the original coupling finding is corrected in current source, with no invented pre-T07 default. The original finding above is retained as the historical first-pass observation.

This verdict covers only the corrected contract wording. T07 still needs to define the canonical horizontal margin and keep its units/schema/hash/fixtures consistent when it is introduced. All implementation and hosted tests remain pending; this scoped review does not accept T07 or any parent task.
