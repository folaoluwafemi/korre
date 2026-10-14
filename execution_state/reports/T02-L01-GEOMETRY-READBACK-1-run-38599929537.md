# T02-L01-GEOMETRY-READBACK-1 exact hosted run

Date: 2026-10-14

## Provenance

- Commit: `929067cc4e277b0ae0ec2d747ba0dd42841c414e`
- Branch: `codex/remote-ci-bootstrap`
- GitHub run: [38599929537](https://github.com/folaoluwafemi/korre/actions/runs/38599929537)
- Run status: completed, workflow conclusion `failure`
- Full run metadata, job API response, artifact API response, complete GitHub log, and downloaded artifacts: `execution_state/reports/T02-L01-GEOMETRY-READBACK-1-run-38599929537/`
- Inventory: 1,155 extracted artifact files, 60,263,409 bytes; every file has a SHA-256 and byte count in `artifact-inventory.json`. Independent review verified all 1,155 entries against their downloaded files.

## Hosted results

- `pnpm verify`: PASS; 30/30 test files and 183/183 tests passed. The saved Vitest summary reported no skipped tests.
- Integration: PASS, 1/1 test.
- Built preview Chromium suite: PASS, 4 expected, 0 unexpected, 0 skipped, 0 flaky, 0 retries.
- Real-browser diagnostic Chromium suite: 3 expected/passed, 1 unexpected/failed, 0 skipped, 0 flaky, 0 retries. The one failure is the matrix test waiting for a successful matrix, which instead received the strict preflight error documented below. This is a failing test command, not a successful matrix run.
- A real pointer flick changed rendered WebGL pixels; retry cleanup and real-shot, and bounded synthetic transport, also passed. These remain diagnostic probes, not full match acceptance.

## Exact preflight finding

The full real-Havok matrix stopped at the button's strict dimension preflight before the first matrix impulse, physics case, matrix download, or successful artifact. The browser's retained error context and GitHub full log report:

- Body: `button`; native shape type: `2`.
- Configured radius/height: `0.13` / `0.045`.
- Decimal expected dimensions: `(0.26, 0.045, 0.26)`.
- Native local AABB minimum: `(-0.12999999523162842, -0.02250000089406967, -0.12999999523162842)`.
- Native local AABB maximum: `(0.12999999523162842, 0.02250000089406967, 0.12999999523162842)`.
- Observed dimensions: `(0.25999999046325684, 0.04500000178813934, 0.25999999046325684)`.

The observed values are exactly the Float32 projections of the decimal expected dimensions. This supports a representation mismatch diagnosis for the button only; the run does not read or establish cap dimensions. The raw AABB was preserved from one native read. The strict preflight, failure code, and fail-before-impulse ordering were unchanged in this diagnostic commit.

GitHub uploaded ten normal CI/browser/probe artifacts. None is a loft-matrix result or success download. The browser evidence says the export failed and no successful download is available. No matrix case was executed.

## Independent review and boundary

Independent exact-run evidence review: PASS, `execution_state/reports/T02-L01-GEOMETRY-READBACK-1-run-38599929537-independent-review.md` (review SHA-256 `C60ACC6C4CB125A14F563D2FB7F141A049F8C56B4AF021B9F0ADBBF99D4D3D08`). It confirms the run/commit provenance, the disclosed dimensions, the zero matrix result/download, and all artifact inventory entries.

This run accepts only the bounds-readback diagnostic, after its independent source and run reviews. It does not accept MATERIAL-F32, MATRIX-1, parent T02, deployed Havok, or playability. A separate independently reviewed geometry representation amendment is required before changing the strict dimension guard. No epsilon, geometry change, local application build/test/browser/physics command, or Cloudflare/Wrangler action occurred.
