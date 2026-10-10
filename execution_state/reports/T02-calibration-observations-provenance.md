# T02 run 8 calibration artifact provenance

## Source

- GitHub Actions run: [38038728521](https://github.com/folaoluwafemi/korre/actions/runs/38038728521)
- Result: `success`; `pnpm verify`, artifact upload, integration, and one-worker Chromium E2E all passed.
- Tested commit: `7d5469d377e1923410068fcdca61cb146419987d` (`ci: fix calibration artifact formatting`).
- GitHub artifact: `counterball-calibration-observations`, ID `11664084850`, 104,314 bytes, not expired.
- Artifact archive SHA-256 from GitHub: `4bd44c5e058d7063491e6d3c08b69feab5c9d0bddf5ffb539e8c345ac1fab8ac`.
- Extracted JSON: `execution_state/reports/T02-calibration-observations-run-8.json`.
- Extracted JSON SHA-256: `B81E5D190E7D81E540E6657F1D39BA805F177545C93075B604B7DD6818D59013`.

The artifact reports Babylon Core 9.30.0, Havok 1.3.14 and the package's actual WASM module. It records the canonical 1/120-second step, 15-second cap, 0.5-second settling window, and the candidate axes. It is evidence from GitHub's real WASM-backed `NullEngine` probe, not a deployed Cloudflare result; T04 remains separate.

## Coordinator's lightweight structural inspection

Parsed the preserved JSON only; no local build, test, lint, typecheck, formatter, or server ran.

- `observedTrials` and array length are both 480.
- Direct-cap records: 80/80 expected parameter tuples, unique, with no duplicate tuple.
- Restart-button records: 400/400 expected parameter tuples, unique, with no duplicate tuple.
- Required numeric fields in every record were finite.
- Every restart record reported button-cap contact (400/400).
- One restart trial did not settle by the 15-second maximum: friction `0.35`, restitution `0.35`, impulse `0.5`, tilt `60°`. It moved the button 10.5563 game units; at the time limit its final speed was 0.5098. This is explicitly retained as a timeout, not recorded as a settled result.
- No direct-cap trial timed out. All 80 direct trials reported zero selected-cap final speed, zero cap rise, and the button did not move meaningfully in this separate direct-cap setup.

By direct impulse, median selected-cap travel across the 16 friction/restitution combinations rose from 0.01137 game units at impulse 0.25 to 0.33943 at 1.5. In the restart matrix, median selected-cap rise remained small; the maximum observed selected-cap peak rise was 0.01243 game units. Median button travel by tilt was 0.03474 at 0°, 0.09713 at 15°, 0.38702 at 30°, 1.20274 at 45°, and 0.95645 at 60°. These are descriptive summaries of one observation per parameter tuple. They are not repeated-sample estimates and do not alone set satisfying gameplay defaults.

## Status

The actual matrix is preserved, but independent data review and the coordinator's physics-default decision remain pending. No friction, restitution, damping, impulse mapping, or lift value is selected by this report. T02 remains unaccepted until data review, versioned provisional choices, and the separate deployed Cloudflare Havok gate are complete.
