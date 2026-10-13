# T02-L01-BROWSER-1-SUCCESSOR-1 hosted verification — run 38427239299

- Exact commit: `829e160e1cd8264bd406959301b8ffe63c68dc1e`
- Run: [GitHub Actions 38427239299](https://github.com/folaoluwafemi/korre/actions/runs/38427239299)
- Overall result: **FAIL** in Verify at `@typescript-eslint/preserve-caught-error`, `apps/web/src/CounterballDirectProbe.tsx:320`: the new AggregateError's `cause` is incorrect. The caught error at that nested catch is `cleanupError`; the original setup error remains in the `errors` iterable. This exact lint failure invalidated the source assumption and requires a separately reviewed successor.
- Job step counts: 26 success, 1 failure, 13 skipped. All four TypeScript projects return exit code 0. Verify reaches lint and stops before the full test/build stages.
- Production exclusion/package, integration, preview, diagnostic browser build and diagnostic browser test gates were skipped. There is no browser test result, real flick, or OPFS runtime evidence in this run. The three T03 PNGs in the browser evidence artifact are carried screenshots.
- Independent evidence review: PASS. Exact SHA, failing line, step counts, all four TypeScript statuses, gate skips, API artifacts and all 22 extracted file hashes/sizes were checked. Total extracted size: 48,595,685 bytes. See `execution_state/reports/T02-L01-BROWSER-1-SUCCESSOR-1-run-38427239299-independent-review.md` and `...-artifact-inventory.json`.
- Full log: `execution_state/reports/T02-L01-BROWSER-1-SUCCESSOR-1-run-38427239299-github.log`; exact job snapshot: `execution_state/reports/T02-L01-BROWSER-1-SUCCESSOR-1-run-38427239299-job-snapshot.json`.

This run does not accept the source card and does not prove a browser flick, OPFS flow, production exclusion, deployed Havok, or playable match. No local application command or Cloudflare command ran.
