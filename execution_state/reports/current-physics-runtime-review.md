# Current intended-shot physics diagnostic — independent hosted review

**Verdict: PASS for the bounded T02-B2 diagnostic packet and its canonical-margin repair.** This is actual hosted real-Havok diagnostic evidence, combined with the earlier independent source PASS in `current-physics-review.md`. It does not accept parent T02 or establish successful loft, continuous traversal, calibrated gameplay, or deployed physics.

## Provenance and integrity

Independently queried [GitHub run 38047543611](https://github.com/folaoluwafemi/korre/actions/runs/38047543611), created 2026-10-10 at 11:11:42 UTC, for commit `248273daffa6a8246609f064dc4f397461a7437b`. The **Verify step** passed, as did `pnpm test:integration` (one test). The overall workflow/job failed because the later built-browser E2E step failed; the job itself must not be described as passing. The physics test log explicitly shows `intendedShotProbe.test.ts` passing its one complete 40-trial diagnostic test in 2,211 ms. The later browser failure does not invalidate the already-completed physics assertions or uploaded artifact.

Artifact `counterball-intended-shot-observations`, ID `11668496662`, belongs to that run/head and is not expired. I fetched its ZIP into memory without writing another file, independently computed its SHA-256, inspected its directory and decompressed its sole member, and compared member bytes against `.artifacts/run22-physics/counterball-intended-shot-observations.json`:

- ZIP: 815,530 bytes; SHA-256 `156aedcb832084c0c3bcc2bb358fb6beeda35da92bc281afca4aa73a77ced045`, matching both GitHub artifact metadata and the hosted upload log.
- Sole member: `counterball-intended-shot-observations.json`, 12,101,058 bytes; SHA-256 `b91d103c7925ed92377f6662da33015b350490ebd222c7fe1fbd7c35f3c5efec`.
- Decompressed member and supplied staging JSON match byte for byte. The JSON itself does not embed the commit SHA; provenance is established by its matching archive and GitHub metadata rather than inventing an embedded tag.

The current probe/config have no diff against the hosted commit. Probe initialization reads pinned real `@babylonjs/havok/lib/esm/HavokPhysics.wasm`; the artifact records Babylon 9.30.0 and Havok package 1.3.14. Its setup is one planar +z cap-center impulse into a tangent placed button, with one movable obstacle cap ahead. Fixed step is 1/120 second, maximum trial duration 15 seconds, quiet window 0.5 second, linear/angular thresholds 0.03/0.1, friction 0.15 and restitution 0. These agree with the inspected probe and its diagnostic configuration. Distances/clearance use arbitrary game units, seconds are simulation time, and trial tilt labels use degrees; they are not measured pavement dimensions or metres.

## Independent data validation

The artifact contains exactly 40 unique rows in the expected tilt-major order: five tilts `0,15,30,45,60` × eight impulses `0.5,1,1.5,2,3,4,6,8`. Every row and the top-level result record epsilon `0.005` and source `COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon`, consistent with provisional D38. Every traversal flag is false; `diagnosticOnly` is true.

Independent data-only calculations confirmed:

- All 151,277 numeric values in the JSON are finite.
- All 40 rows settled, from 0.775 to 4.883333333333333 simulated seconds; no timeout occurred. Recorded simulation end equals settlement time. This does not execute the maximum-step boundary case separately.
- All 40 rows recorded selected-cap/button contact. There are 35,858 collision records, with canonical two-ID order, valid step bounds and collision-start/continued types. IDs include the fifteen dynamic pieces and the static support surface. Collision-record count includes continuing contacts and is not a count of distinct collisions.
- Twenty-seven rows recorded button/obstacle contact. Recomputing that Boolean from actual `button`/`home-1` contact pairs matches every row; selected contact uses `button`/`home-0`.
- Twenty-six rows entered the broad combined-horizontal-radius sampling window and contributed 1,512 clearance samples. Sample steps are bounded by trial duration; each signed clearance agrees with button-bottom minus obstacle-top within 1e-12. Samples are discrete observations, not collision events or a swept trajectory.
- Fourteen rows have no clearance samples. All four dependent extrema/comparison fields are null in every such row; epsilon remains the canonical number. Every nonempty row's minimum, maximum and both `>= 0.005` classifications independently recompute correctly.
- Seven rows exceed the configured margin at their peak. None has every recorded clearance sample at or above the margin. All seven peak-positive rows also record button/obstacle contact. The recomputed potential-no-contact candidate list is empty and matches the artifact.

The seven peak-positive keys are `tilt=15|impulse=8`, `30|6`, `30|8`, `45|6`, `45|8`, `60|6`, and `60|8` (same `tilt=…|impulse=…` key syntax). The global sample range is −0.12911601309801632 to +0.33800213296016723 game units. `tilt=60|impulse=4` has a positive maximum of approximately 0.0009566658442658749, correctly below the canonical margin. Thus positive clearance alone would classify eight peaks, whereas D38 classifies seven; the margin is actually applied.

## Interpretation and acceptance boundary

The observed result supports contact transfer, finite measured motion and settlement for this controlled matrix. It provides **no demonstrated collision-free loft over the obstacle**. Peak height above the margin is insufficient: every qualifying peak row has obstacle contact, no sampled window stays entirely above the margin, and no complete swept path is persisted. The source, fields and top-level diagnostic note honestly retain this distinction instead of manufacturing lift success.

The hosted passing test also exercised the source's per-step finite checks for all fifteen bodies, material readback and cleanup assertions. The JSON does not retain every body's full trajectory, so that assertion cannot be reconstructed solely from the artifact. No timeout or cancellation scenario is represented here, and diagnostic coefficients remain provisional. Parent T02's general runner/facts, restart loft, failure/cancellation, isolation and deployed gates remain outside this packet and unfinished.

Read-only GitHub/source inspection and bounded artifact/data analysis completed successfully. No local application test, build, formatter, lint, typecheck, server or physics run was performed. No source/config/status/ledger was edited, and no agent was spawned. Browser E2E requires its separate repair/review; this report does not claim the complete CI run passed.
