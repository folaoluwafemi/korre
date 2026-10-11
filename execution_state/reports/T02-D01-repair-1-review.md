# T02-D01 repair 1 independent review

Date: 2026-10-11

## Verdict

**SOURCE: PASS. RUNTIME: NOT RUN.**

The repair requires each of the six observations to contain at least one finite, measured per-step displacement for its selected cap at or above the documented `1e-4` world-unit floor. I found no source interaction that makes that assertion vacuous for the canonical fixture. This remains source evidence only; the real pinned Havok trials and hosted verification have not run in this review.

## Evidence

- The extracted T02-D01 record passes the plan validator. The original independent review identified the missing selected-cap movement assertion; the repair implementation report records the bounded one-file change and says runtime/hosted verification remain pending.
- `minimumSelectedCapStepMovement` is set to `1e-4` at `games/counterball/src/simulation/directImpulseProbe.test.ts:141-142`, with a comment that it is a finite per-step floor above numerical noise. The canonical dimensions give the cap radius as `0.32` and height as `0.12` world units, so the threshold is `0.1 mm` (assuming the plan's metre-scale unit convention), about 1/3200 of the cap radius. This is a small but explicit tolerance; it does not alter physics parameters or the trial matrix.
- `runTrial` snapshots body positions from the initial runtime world before applying the direct impulse (`:493-501`), applies that impulse to the selected cap (`:546-550`), then calls the pinned plugin's `executeStep` with the configured fixed timestep before reading and recording current body transforms (`:581-601`). `captureTick` calculates each recorded displacement from that body's previous sampled position (`:366-430`); the previous positions are updated only after each completed physics step (`:603-641`). Thus the checked values are actual post-step transform deltas, not the immediate velocity produced by `applyImpulse`.
- `failedTrialChecks` first requires the exact six unique rows in the fixed 3×2 impulse/aim matrix and the expected selected cap per row (`:1060-1090`). It then validates the canonical 15-body order and checks per-tick array lengths and finiteness (`:1161-1189`). The new check resolves the selected cap's index, takes its three displacement components for each tick, and requires at least one finite magnitude at or above the threshold (`:1191-1211`). Missing body IDs, absent components, non-finite values, zero-step runs, or a selected-cap index of `-1` cannot satisfy it. The checks run separately on every returned row, and incomplete/error rows fail the six-row and trial-error checks.
- The direct-impulse response checks remain intact: the selected cap must have finite, nonzero immediate velocity with positive projection onto the requested impulse; unrelated bodies must still have zero immediate velocity. The canonical fixture is not changed or repositioned. In the source fixture, the selected caps begin at `y=0.06`, matching half the configured `0.12` cap height above the surface at `y=0`; this avoids a deliberately unsupported/free-fall setup that could supply the new displacement without the direct shot.

## Limits

The assertion uses total 3D displacement magnitude, so it proves the selected cap moved during at least one physics step, while the separate immediate-velocity assertion proves the requested impulse was initially applied in its aim direction. It does not by itself prove that the integrated displacement vector aligns with that aim. No runtime evidence is available here to confirm the measured response or quantify the observed noise margin. No application test, build, browser, or physics command was run; only the plan validator and read-only source inspection were performed.
