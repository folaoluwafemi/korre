# C01 Worker-pool repair 1 implementation

Status: source change implemented; independent review and hosted checks are pending. This repair does not accept C01 or T02.

## Change

- Updated only the pinned `@cloudflare/vitest-plugin` version from `1.0.0` to `1.4.0` in `package.json` and the pnpm lockfile.
- Registry metadata for 1.4.0 resolves `miniflare@5.20261006.1-alpha`, `wrangler@4.149.0`, and declares Vitest peers `^4.1.0 || ^5.0.0`. The workspace still pins Vitest `4.1.2` and Wrangler `4.149.0`.
- The existing Worker compatibility date remains `2026-10-10`. No test code, collection rule, or assertion changed.
- Lockfile-only resolution also pruned stale, unreferenced package/snapshot records from the prior lockfile. It did not change any root manifest dependency version beyond the Worker plugin pin.

Current Cloudflare guidance recommends the Workers Vitest integration, documents `cloudflareTest()`, and requires Vitest 4.1 or later. The named `cloudflare:workers` smoke remains a hosted Workerd test; source/config guidance is not runtime proof.

Sources: [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/), [write your first test](https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/), and [configuration](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/). Published package metadata was queried with `pnpm.cmd view @cloudflare/vitest-plugin@1.4.0 dependencies peerDependencies --json`.

## Checks actually run

- `pnpm.cmd install --lockfile-only --ignore-scripts` — exit 0 with pnpm 10.33.0; 333 packages resolved, 0 downloaded, 0 added. This updated metadata only; no application install/build/test ran.
- `node scripts/check-completion-plan.mjs` — PASS, 71 packets/21 remaining parents; document consistency only.
- `node scripts/check-completion-plan.mjs --packet C01` — PASS; exact catalogue record extracted and readiness checked.
- `node scripts/check-completion-plan.mjs --packet T02-F01` — PASS; exact catalogue record extracted and readiness checked.
- `pnpm.cmd view @cloudflare/vitest-plugin@1.4.0 dependencies peerDependencies --json` — confirmed the dependency and peer ranges above.
- Lockfile inspection confirmed the importer pins `@cloudflare/vitest-plugin@1.4.0`, the selected Miniflare is `5.20261006.1-alpha`, and root Wrangler/Vitest remain `4.149.0`/`4.1.2`.
- `git diff --check` — PASS after the package, lockfile, packet, report, task, ledger and ownership edits.

## Not established

No Worker test, application test/build, typecheck, browser run, dry-run, deployment, or deployed Havok check ran locally. Only a fresh GitHub run on the reviewed exact source SHA can prove the updated Miniflare starts with the unchanged Worker date and executes the named test. C01 also remains incomplete until its diagnostic-browser producer and artifact evidence exist.
