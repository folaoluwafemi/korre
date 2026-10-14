# T02-L01-DIAGNOSTIC-APRON-F32-1 packet review

**Verdict: PASS — dispatch-ready.**  
**Scope: packet/document review only; no source or runtime checks were performed.**

## Extracted record and dependencies

`node scripts/check-completion-plan.mjs --packet T02-L01-DIAGNOSTIC-APRON-F32-1` returned plan `PASS`, `ready:true`, and identified this packet as the only initially ready card. The record remains under parent `T02`; `required_parent_acceptance` retains `T01`.

Compared with the original `T02-L01-MATRIX-1` record, the packet preserves every original dependency: `C00-B`, `C01`, `T02-B0`, `T02-C0`, `T02-C2`, `C00`, `T02-L01-GUARD-CONTRACT-1`, `T02-L01-GUARD-SCHEMA-1`, `T02-L01-PACKET-SPLIT-1`, `T02-L01-TRANSPORT-1`, `T02-L01-SUPPORT-PREFLIGHT-1`, and `T02-L01-SUPPORT-F32-1`. It adds the accepted `T02-L01-GEOMETRY-READBACK-1` prerequisite. It supersedes the failed geometry-projection successor rather than treating that failed card as accepted.

The exact write scope is the two intended files: `games/counterball/src/simulation/loftCoarseRunner.ts` and `games/counterball/src/simulation/loftCoarseProbe.test.ts`. The packet does not assign workflow, schema, configuration, contract, catalogue, task-state, or E2E test edits.

## Contract and acceptance fit

The implementation request matches the accepted apron clause in `CONTRACT_WORK.md` §170 and its acceptance record: only the temporary diagnostic `support-apron` Y readback may use exact `Math.fround(0.2)` equality. The packet retains exact `BOX` type and x/z dimensions 662 and 670, raw observed dimensions, unchanged configured/constructed geometry, and all other static checks. It explicitly preserves the accepted dynamic-cylinder checks, canonical surface and goal frames, hashes, schema, and physics behavior. No epsilon, neighboring Float32 value, alternate dimensions, or static/product geometry relaxation is permitted.

The apron Y value is not directly observed in run 38613508970. The cited support-slab observation in run 38466161040 is only the basis for the inference; the accepted amendment and packet both keep that fact bounded and require the real browser matrix to confirm or falsify it. The packet does not treat a passing preflight as matrix acceptance.

The hosted sequence is actionable: exact-SHA CI must pass `pnpm verify`, `pnpm test:integration`, the ordinary built-preview Chromium gate (`COUNTERBALL_PREBUILT_PREVIEW=1 pnpm test:e2e --workers=1`), and the diagnostic Chromium suite selected by the existing `.github/workflows/ci.yml`. The workflow's dynamic selection and command are named as authoritative, so the worker cannot substitute a reduced suite. Acceptance requires the actual full 24-case pinned-Havok artifact to download and pass all existing tuple, schema, provenance, count, hash, workload, and byte checks with zero skips, retries, or flaky tests. It also requires separate independent exact-source and exact-run/artifact reviews. Local application install/build/test/browser/physics commands are forbidden; the only local check is the scoped `git diff --check`.

The focused unit assertion should exercise the exact finite matcher and confirm the fixed apron X/Z values remain exact; it must not be presented as evidence that the runner's private static-body branch executed. The packet's required independent source review and full hosted matrix cover that integration, so this test-boundary note does not block dispatch.

## Limits

This review does not accept source, apron runtime behavior, the 24-case matrix, calibration, deployed Cloudflare Havok, T02, or playability. Any apron mismatch, other static/dynamic preflight failure, missing matrix result, skipped/retried case, or incomplete artifact remains a failed attempt and must stop under the packet's bounded escalation rules.
