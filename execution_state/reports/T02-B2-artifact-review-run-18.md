# T02-B2 run 18 — independent artifact review

**Verdict: PASS for artifact provenance and data integrity.** No inconsistency was found in the preserved ZIP or its 40 observations. This does not accept T02-B2 or T02: the configured clearance-epsilon criterion remains unresolved.

## Provenance and preserved bytes

Independently queried GitHub artifact `11665948583` and [run 18](https://github.com/folaoluwafemi/korre/actions/runs/38042497937). The live API identifies `counterball-intended-shot-observations`, run `38042497937`, and head SHA `479fd74a5017640b0e9f69c26cad8e4f384aa325`. The run and its verify, upload, integration, and one-worker Chromium steps completed successfully. The hosted log reports the intended-shot test passed (1,886 ms), integration passed, and three Chromium tests passed with one worker. The packet's 1.884-second description differs slightly from the available suite log timing; it does not affect artifact identity or results.

Read `execution_state/reports/T02-B2-intended-shot-observations-run-18.zip` directly. Independent ZIP CRC verification found no corrupt member. It contains exactly one member, `counterball-intended-shot-observations.json`.

| Evidence | Independently recomputed result |
| --- | --- |
| ZIP length | 814,424 bytes, matching GitHub metadata |
| ZIP SHA-256 | `570ba77d2213477aee6833f1d7c59edea865f0e2266018804f9b86e9728d86ea`, matching GitHub metadata and retrieval report |
| JSON length | 12,096,212 bytes |
| JSON SHA-256 | `469ee09e101e0f174cde0f7ca8686adcf09f77ab5d7c5d4493f95907838ce375`, matching retrieval report |
| Staging JSON comparison | Byte-for-byte identical to the ZIP member |

The current probe has no diff against the run's head SHA. Its metadata identifies Babylon `9.30.0`, Havok `1.3.14`, the pinned Havok WASM path, and diagnostic-only intended cap-into-button setup. Fixed step, duration, quiet window, settle thresholds, material inputs, candidate lists, azimuth, obstacle gap, and motion floor match the source and canonical inputs.

## Five required integrity findings

1. **Matrix:** exactly 40 unique tuples in canonical tilt-major, impulse-minor order. Tilts are `0,15,30,45,60`; impulses are `0.5,1,1.5,2,3,4,6,8`. Keys, row tuple fields, and top-level lists agree, without missing or duplicate rows.
2. **Finite inputs and body observations:** all numeric values recursively inspected are finite. Every row contains the same complete field set; vector fields have finite x/y/z components. Materials for surface, selected cap, button, and obstacle read back friction/static friction `0.15` and restitution `0`. Cap immediate velocity is planar +z and matches its unit-mass impulse; button immediate velocity is zero. All 35,858 contacts have valid bounded integer steps, expected body labels, nonidentical pairs, known collision types, and finite optional points; duplicate step/pair/type entries were absent.
3. **Settlement and measurement consistency:** all 40 rows report settlement, with no null timeout. Settle time equals simulated duration, lies on the 1/120-second cadence, and ranges from `0.775` to `4.883333333333333` seconds, below the 15-second cap. Final cap/button speeds meet the settle threshold. Paths are nonnegative and at least their final displacements; maximum speeds are at least final speeds. Peak heights include the calculated initial heights. Every row records actual cap/button contact and measurable movement of both. Obstacle starting positions match the derived tangent pose plus the declared gap. Contact flags agree with recorded pairs.
4. **Clearance without an invented epsilon:** 26 rows enter the combined horizontal radius and contain 1,512 ordered, bounded-step clearance samples. The other 14 rows have no samples and null maximum clearance. Sample signed clearance equals button bottom minus obstacle top; each reported maximum equals the sample maximum. Across samples, 166 are positive and 1,346 negative. Eight rows contain positive maxima: `(tilt, impulse)` = `(15,8)`, `(30,6)`, `(30,8)`, `(45,6)`, `(45,8)`, `(60,4)`, `(60,6)`, `(60,8)`. The largest raw signed clearance is `0.33800213296016723` at `(60,8)`; the smallest sample is `-0.12911601309801632`. These are raw geometric observations, not configured-threshold success classifications. Top-level and every-row `clearanceEpsilon` are null; every-row `clearsByConfiguredEpsilon` is null; classification availability is false and the missing canonical value is explicitly documented.
5. **No missing or inconsistent artifact evidence found:** all independent checks above completed without data-validation findings. No artifact or configuration was modified.

## Limits and checks performed

Read-only GitHub metadata/log retrieval, source/diff inspection, and two bounded in-memory Python ZIP/JSON analyses each exited 0. Python analysis checked archive integrity, hashes, field consistency, numerical arithmetic, and matrix/count conditions; it did not execute application tests or physics. No local build, test, lint, typecheck, formatter, or server command ran. The only written file is this report.

The artifact reports all-body settlement and the hosted source checks all 15 bodies each step, but it does not persist every body's per-step pose and velocity. Independent review can verify the reported values and source assertions, not reconstruct full trajectories or replay physics from this artifact. The combined-radius flag similarly relies on the source's sampled horizontal positions. Single runs and discrete samples do not establish continuous collision clearance, repeatability, play feel, real-phone compatibility, deployed Cloudflare physics, or final gameplay coefficients. No epsilon or production calibration is recommended or inferred here.
