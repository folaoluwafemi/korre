# Coordinator improvements before user testing

Source is prepared; hosted verification and independent review are pending. No local install, build, application tests, physics run, migration or server has been run for this packet.

Changes:
- Canonical D38 adds positive finite `restart.clearanceEpsilon=0.005` arbitrary game units to config/types/schema and rejects invalid margins. The fixture config hash is recomputed as `71ee7d40ec42b0f2c4094e7be7c27b8beda2732c10e5217d21e0c20ebc2c5bdb`. Calibration remains null; this margin does not prove loft or change cultural rules.
- CI provisions temporary PostgreSQL 17 at loopback `korre_test`, opts in to database acceptance, applies migrations twice, runs verification/integration, and tests production-built browser files. It uploads the built preview, screenshots/traces and diagnostic observations. Formatting failures can supply a remotely generated patch; the coordinator must inspect/apply/retest it before acceptance.
- `scripts/serve-preview.mjs` serves already-built assets only, binds loopback, limits methods/routes and confines paths to the artifact root. It does not install, transpile or start API/Worker/database services. Playwright can use it for testing the build artifact; normal local development remains available.
- Export the real ArcRotateCamera type for the browser consumer. Update the homepage, root README and outdated documentation-only instructions to match the actual static preview and partial implementation.
- Pin SQL checkout line endings in `.gitattributes`; do not alter migration 001 content. Runtime next actions no longer require a human epsilon choice or Railway to run isolated CI database checks. Regenerate the readable task catalogue from authoritative JSON; preserve all historic run evidence.

Executed lightweight checks: source/diff inspection, `git diff --check` (exit 0 before workers finished), read-only process inventory, and an in-memory Node hash/fixture update (exit 0). These are not application or physics tests. Relevant guidance retrieved: Modern Web Guidance `efficient-background-processing`, [React effect cleanup](https://react.dev/reference/react/useEffect), and [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

Required hosted checks are defined in `execution_state/packets/current-review.md`. Preview is static; T02 canonical runner, T04 deployed physics, T05 flick, full matches, AI, online, identity UI and real-phone evidence remain unimplemented/unverified. The existing `/health` is liveness, not runtime database readiness. No Cloudflare/Railway deployment, production publication or paid-plan change occurs in this review.

## Hosted repair 1
Run 38047177729 on commit21f3a44 applied the actual migration twice successfully, then stopped at API typecheck: Hono app.request returns Response or Promise<Response>, while the test helper promised only Promise<Response>. No unit/build/integration/E2E pass is claimed for that run. Coordinator wraps the result with Promise.resolve, preserving both sync/async behavior. The run's remote Prettier suggestion was downloaded, inspected (five source/test files, formatting only), and applied; no local formatter or build ran. Re-review and fresh GitHub checks pending.

## Browser lifecycle repair 1
Independent browser review identified a restore/dispose race in pinned Babylon: the raw restored event allowed retry before Babylon's queued asynchronous resource rebuild completed. Coordinator sets the supported doNotHandleContextLost engine option. This preview's own lost/restored handlers stop rendering and enable manual reconstruction of the entire scene/engine; no old Babylon rebuild is queued. Pinned abstractEngine.pure.d.ts declares the option and thinEngine.pure.js omits automatic lost/restored listeners when enabled. No runtime pass is inferred from source. Fresh built-browser checks and independent re-review required.

## Hosted repair 2
Run38047344796 on af887af passed all workspace and root-test typechecks, then ESLint found two unsafe explicit throws inside test cleanup finally blocks. No unit/build/integration/E2E result is claimed. Coordinator replaced these cleanup blocks with sequential best-effort cleanup, retains verified schema/path guards, collects failures, and raises AggregateError after cleanup. Invalid targets are never dropped/deleted. Tests/checks remain required; no lint rule is disabled. This integrates the independent browser lifecycle repair described above and needs fresh hosted checks.
