# T02 calibration observations — independent data review

Verdict: **PASS for artifact integrity and complete-matrix review, with physical limitations below.** These data do not justify freezing a complete playable calibration yet. Coordinator owns coefficient decisions and status changes; this report accepts neither T02 nor T04.

## Provenance and validation

Direct GitHub queries confirm [run #8](https://github.com/folaoluwafemi/korre/actions/runs/38038728521) succeeded on `7d5469d377e1923410068fcdca61cb146419987d`; its Verify, artifact upload, integration and one-worker E2E steps succeeded. Artifact API metadata confirms ID `11664084850`, name `counterball-calibration-observations`, that run/commit, and ZIP digest `4bd44c5e058d7063491e6d3c08b69feab5c9d0bddf5ffb539e8c345ac1fab8ac`.

Independently fetched the 104,314-byte ZIP into memory, verified that digest, decompressed its sole `counterball-calibration-observations.json` entry into memory, and compared it byte-for-byte with the preserved input file. They match. Extracted SHA-256 is `B81E5D190E7D81E540E6657F1D39BA805F177545C93075B604B7DD6818D59013`. No downloaded file was written. Current probe source has no diff against the run commit.

Read the full JSON using read-only analysis, plus the probe, DECISIONS, CONTRACTS, TASKS and relevant GAMEPLAY requirements. Independently generated the expected matrix from the packet's fixed candidate arrays rather than treating the artifact's count as proof:

- `observedTrials = array length = unique tuple count = 480`: exactly 80 direct-cap and 400 restart-button records, no duplicates, missing or unexpected tuples. Exact recorded loop order matches friction → restitution → direct impulses, then tilt → restart impulses.
- Candidates match friction `[0.15,0.35,0.55,0.75]`, restitution `[0,0.1,0.2,0.35]`, impulses `[0.25,0.5,0.75,1,1.5]`, and tilts `[0,15,30,45,60]`. Direct tilt/azimuth are null; restart azimuth is 0 and tilt is the expected candidate. Babylon/Havok tags and 1/120-second, 15-second, 0.5-second window metadata match the source.
- Required scalar measurements and contact count/step/point values are finite. Fields are consistently present. Durations lie on the fixed-step grid; contact intervals/counts fit their recorded durations; cap path lengths are no shorter than final displacement. Contact flags agree with the logged button/home-0 pair. No structural/numeric anomaly was found.
- Read-only data/provenance analyses completed successfully. One exploratory analysis command mistakenly tried to parse a TypeScript configuration file as JSON and exited 1; it produced no result or file change. The corrected JSON-only analysis exited 0. No local build, test, typecheck, lint, formatter, physics execution or server ran.

## Quantitative observations

All 80 direct-cap trials settled in 0.558–1.492 seconds, ending at zero cap speed, with no selected-cap rise or cap/button contact. At each friction/impulse tuple, the four restitution choices give identical direct-cap results; this flat sliding experiment therefore does not identify a useful restitution preference. Distance rises monotonically with impulse and falls with friction in this grid.

Final direct-cap displacement, game units:

| Friction | Impulse 0.25 | Impulse 0.75 | Impulse 1.5 |
| --- | ---: | ---: | ---: |
| 0.15 | 0.02215 | 0.19526 | 0.77260 |
| 0.35 | 0.01021 | 0.08672 | 0.33818 |
| 0.55 | 0.00661 | 0.05652 | 0.21808 |
| 0.75 | 0.00471 | 0.04229 | 0.16250 |

The longest direct displacement is only about 1.21 cap diameters on the 20-unit-long pitch. This is a tuning concern for reach, not evidence about human preference or real pavement. Tiny stationary-button path drift (0.000012885 units in every direct trial) is present; no material instability is inferred from that small drift.

All 400 restart-button trials record actual cap/button contact. 399 settle in 0.558–6.717 seconds; one reaches the 15-second limit without settling. Selected-cap path ranges 0.002325–1.065653 units; button path ranges 0.003109–10.556288. High tilt often gives less cap transfer and much longer button motion rather than reliable additional cap lift. Restart restitution 0.35 has the largest maximum button path, longest settled case and the sole timeout; this grid alone does not establish causality or a universal monotone response.

| Tilt | Maximum recorded cap rise | Maximum button path | Timeouts / trials |
| --- | ---: | ---: | ---: |
| 0° | 0.001117 | 1.0680 | 0 / 80 |
| 15° | 0.000339 | 1.1097 | 0 / 80 |
| 30° | 0.002318 | 1.8891 | 0 / 80 |
| 45° | 0.008267 | 8.2139 | 0 / 80 |
| 60° | 0.012429 | 10.5563 | 1 / 80 |

**Preserve the timeout explicitly:** `(restart-button, friction 0.35, restitution 0.35, impulse 0.5, tilt 60°, azimuth 0)` has `settledAtSeconds: null`, `simulatedSeconds: 15`, button final speed 0.509772, and button path 10.556288. The cap is stopped. It also records repeated button/surface contacts through step 1800. This is a genuine unsettled observation, not a settled success; the eventual runner must apply the typed timeout/restore contract. No impossible value was found, but the long motion deserves a focused diagnostic rather than concealment in averages.

## Interpretation and recommendation

**Do not freeze the complete shot/loft calibration from this artifact.** The probe measures isolated flat cap sliding and a button impulse into a placed cap. It does not execute the preferred gameplay cap-impulse restart, record button peak height/clearance, place an intervening cap to prove over-cap travel, test goals/exits, or validate the production all-movable-body settling rule. Its settling check uses only the selected cap for direct shots and selected cap plus button for restarts. Other match bodies and their ending angular velocities are not represented in the output.

The largest measured cap rise is 0.012429 units (friction 0.75, restitution 0, impulse 1.5, 60°), about one tenth of cap height. That is a small recorded cap response; it proves neither meaningful cap clearance nor the required **button** loft. Initial placement is already tangent, so the 400/400 contact flags do not by themselves isolate powered-contact effects from initial contact. Motion measurements still demonstrate actual force transfer. Only one azimuth/fixture and one observation per tuple were used: no confidence intervals, repeated-run determinism, cultural accuracy, pavement calibration or deployed Cloudflare compatibility follow.

A bounded **next-experiment baseline**, if useful, is friction 0.15/restitution 0, retaining the measured 0.25–1.5 impulse range solely for reproduction. This is an inference: it gives the longest tested direct travel, all of its 25 restart cases settle, and avoids the higher-restitution timeout case. At impulse 1.5, its flat restart gives cap displacement 0.58939, cap rise 0.000529, button path 0.57440 and settling 1.36667 seconds; its 60° case instead gives button path 5.56867 and settling 3.19167 seconds. Those differences show why a promising baseline is not a finalized feel/loft mapping. Data do not justify selecting a production maximum impulse, damping, speed bound or assisted lift.

Before a full coefficient freeze, obtain an authorized hosted diagnostic for the intended gameplay impulse direction, actual button height/obstacle clearance and the timeout tuple; measure adequate pitch travel and all fifteen bodies' settlement. Any subsequent provisional coefficients/approximation must be recorded once in canonical config, versioned through `configHash`, labelled provisional per D37 and GAMEPLAY, and validated identically in local/authoritative adapters. No configuration or task record was changed by this review.
