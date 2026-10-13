# T02-L01-BROWSER-1-SUCCESSOR-3 — exact hosted run 38430577910

**Run evidence: PASS.** The exact hosted run passes the required CI gates and proves a real browser flick. The prior source review at `execution_state/reports/T02-L01-BROWSER-1-review.md` records SOURCE PASS for the OPFS writer/download/cleanup design and RUNTIME NOT RUN; this run does not exercise that export flow. The full-cap Chromium file-transfer proof belongs to the separate `T02-L01-TRANSPORT-1` gate and remains pending. This report does not claim that transport gate or a playable match.

## Provenance and workflow

- Run: [38430577910](https://github.com/folaoluwafemi/korre/actions/runs/38430577910), attempt 1, branch `codex/remote-ci-bootstrap`, exact head SHA `af5f499a06df4a3cf472ecf0d3991ee330a70bd8`.
- Job: `verify`, job ID `115411377261`, completed successfully.
- Saved job snapshot: 35 successful, 0 failed, 5 skipped of 40 steps. Steps 14–16 are failure-only TypeScript diagnostics; steps 34–35 are failure-only formatting-repair steps. Each was skipped because Verify succeeded. No required gate was skipped.
- `pnpm verify` completed typecheck, lint/Prettier, tests, and build. Typecheck included the Counterball headless Worker bundle-boundary probe. The Vitest summary reports 30 test files and 179 tests passed. The build completed successfully.
- The disposable Worker smoke test (1/1) and focused protocol tests (13/13) passed. Production diagnostic-exclusion check, dry-run Worker package, production browser package, integration tests, built-preview test run, diagnostic bundle/package, and diagnostic browser suite all executed successfully.

## Browser evidence

The built-preview Playwright results report 4 expected, 4 passed, 0 skipped, 0 unexpected, and 0 flaky tests. The diagnostic Playwright results report 2 expected, 2 passed, 0 skipped, 0 unexpected, and 0 flaky tests. Its test manifest names only `tests/e2e/counterball-direct-probe.spec.ts`.

The diagnostic results include the passing test “a real pointer flick runs browser Havok and changes rendered WebGL pixels.” Its saved trace records scope `browser-direct-impulse-v1`, fixture `counterball-protocol-fixtures-v1`, settled termination, 15 settled bodies (seven caps per side and the button), four visible button holes, the open green-concrete scene with no enclosing walls, cap movement `5.826547096074273`, button movement `2.3875367620379495`, and 328 changed WebGL pixels at 1102×490. The trace has 696 contact-pair samples, including three button/home-6 pairs. The browser lifecycle returns to zero engines/listeners/resize observers after teardown.

The second diagnostic test blocked one real WASM request, recorded the visible failure with zero remaining engines/listeners/observers, retried, completed a real shot, and returned to the zero-resource baseline. These are browser-Havok flick and retry-cleanup results. They are not evidence of a playable match, continuous traversal, deployed Cloudflare Havok, or online play.

**OPFS remains unproven in this run.** The diagnostic test manifest lists one spec file, and its result JSON contains only the two direct-shot/WASM retry tests above. Neither result tests bounded OPFS writes, finalized-file download, host-side incremental hashing/acknowledgement, or cleanup of that export path. There is no OPFS-specific result or attachment. The three `T03-*.png` files carried in `counterball-browser-evidence` are unrelated prior evidence and were not used to establish the flick. The direct-flick result and trace attachment are the evidence for the flick itself.

## Artifacts and integrity

GitHub's artifact API listed 9 non-expired artifacts for this exact run and SHA. The downloaded, extracted artifact set contains 1,152 files totaling 59,213,267 bytes. `T02-L01-BROWSER-1-SUCCESSOR-3-run-38430577910-artifact-inventory.json` records every extracted member's path, byte size, and recomputed SHA-256, plus each API artifact ID/name/archive size/reported digest. API archive digests are recorded as GitHub-reported values; the archives themselves were not locally retained for digest recomputation. It also records local size/SHA for the full log, job snapshot, and API response.

The full downloaded GitHub log is 288,028 bytes, SHA-256 `7ec261e8683af6ec15d4fc9b7e7226542650227263629f9145475569e061c700`. Inline Playwright trace and teardown attachments were decoded into `T02-L01-BROWSER-1-SUCCESSOR-3-run-38430577910-browser-attachments/`; their byte sizes and SHA-256 values are listed separately in the inventory. In particular, `trace.json` is 46,299 bytes with SHA-256 `e75ce3a9c0d89f6a8953610247f4781a56c0797bc52e3170db3c88630b82dfad`.

The uploaded `counterball-realtime-prebuilt-*` artifact is a dry-run package, not a deployed Worker. This run changes no deployment or production-service status.

## Disposition

The hosted run, required build/browser pipeline, and actual browser pointer flick all passed. The result is **PASS for exact-run evidence**. OPFS runtime and full-cap file transport were not run here and remain a separate `T02-L01-TRANSPORT-1` proof obligation; no OPFS-runtime, deployed-Havok, or playable-match claim is made.
