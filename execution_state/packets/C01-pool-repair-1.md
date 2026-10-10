# C01 Worker-pool repair 1 — align test runtime with the unchanged Worker date

Parent packet: C01. Status: IMPLEMENTING after exact-head GitHub run 38082875529 failed before collecting tests. Preserve C01's original dependencies and acceptance; this small repair does not accept C01.

## Inputs and exact ownership

Read `execution_state/packets/C01.md`, `execution_state/reports/C01-review.md`, `execution_state/reports/C01-runtime-run-38082875529.md`, and the exact failed `workers.log`. Consult current official Cloudflare Workers Vitest guidance and published package metadata for the version being selected.

Coordinator owns exactly:

- `package.json`
- `pnpm-lock.yaml`
- `execution_state/packets/C01-pool-repair-1.md`
- `execution_state/reports/C01-pool-repair-1-implementation.md`
- `execution_state/packets/C01.md`
- `execution_state/reports/C01-implementation.md`
- coordinator task/ledger/ownership records

After source is saved, `/root/foundation_review` independently reviews package compatibility and may write only `execution_state/reports/C01-pool-repair-1-review.md`.

Do not change `apps/realtime/wrangler.toml` compatibility date, test assertions, test discovery, or runtime claims. Do not install packages, build, or run tests locally. Use lockfile-only resolution if required; all application checks run on GitHub.

## Evidence and intended change

Run 38082875529 at SHA `c8ae1eee9990ba792d491bceee18361d6ff1be35` failed to start Miniflare before test collection. The pinned plugin 1.0.0 resolved `miniflare@5.20260820.0-alpha` / an August workerd binary. Its server supported compatibility dates only through 2026-08-27, while the accepted Wrangler config remains 2026-10-10. The suite reported no collected tests and one runtime error. The complete evidence is in the linked runtime report.

Update the pinned `@cloudflare/vitest-plugin` to the current published compatible release 1.4.0 and regenerate the lockfile without downloading/installing packages. Registry metadata states that 1.4.0 depends on `miniflare@5.20261006.1-alpha` and `wrangler@4.149.0`, and supports Vitest `^4.1.0 || ^5.0.0`; this matches pinned Vitest 4.1.2 and Wrangler 4.149.0. Preserve the existing Worker date. This is a reviewed runtime-alignment fix, not a test workaround.

## Required verification

1. Independent review must pass for the exact package/lock change and dependency metadata.
2. On GitHub, run `pnpm test:workers`; require exactly the named Workerd smoke test to pass, no runtime startup error, no empty collection, and no skips.
3. On the same exact source SHA, run C01's focused protocol check, root `pnpm verify`, migrations twice, integration, Chromium E2E, and artifact inventory steps. Preserve full logs, test counts, source SHA/run/attempt, and inspect every produced artifact/hash.
4. If the Worker runtime still rejects the unchanged compatibility date, keep C01 in CHANGES_REQUIRED and follow the two-attempt stop rule in `knowledge_base/execution/SWARM.md`. Do not lower the date to obtain green.
