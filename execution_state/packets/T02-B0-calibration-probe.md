# T02-B0 — real Havok coefficient and loft probe

Coordinator: `/root`. Worker: `/root/toolchain_audit`. Dependency: T01 is `ACCEPTED`. This is an experimental subpacket inside T02; it does not accept T02 or unblock T04/T05.

## Frozen inputs and purpose

- Read `knowledge_base/execution/CONTRACTS.md` simulation input/result semantics, `knowledge_base/execution/DECISIONS.md` D02–D11/D35/D37 and numeric table, `knowledge_base/execution/GAMEPLAY.md` physical fixtures, and current T02-A runtime/world-factory source.
- Use only the pinned installed `@babylonjs/core@9.30.0` and `@babylonjs/havok@1.3.14` APIs and the actual shipped Havok WASM bytes. Gravity, masses, geometry, and fixed step come from the current canonical config/fixture. Never mock Havok. A local `NullEngine` may host the actual physics plugin for this local measurement only.
- Characterize candidate material coefficients, direct normal-shot impulse scale, and the real contact effect of the five allowed restart button tilts. These candidate values are probe inputs only; do not select, silently add, or commit production calibration values. The coordinator freezes shared configuration after inspecting actual measurements. This local Node probe does not satisfy the Cloudflare deployed gate.

## Exact write paths

- `games/counterball/src/simulation/calibrationProbe.test.ts`
- `execution_state/reports/T02-calibration-probe.md`

No edits to runtime/world factory, configuration, config hash, fixture, contracts, manifests, lockfile, task records, or any other file. Do not spawn agents.

## Probe matrix and observations

Use fresh isolated worlds for each trial, set controlled non-overlapping poses, and run the canonical 1/120-second step. Measure finite settled time, traveled distance/velocity, observed body contacts, and displacement or peak height after contact. Record the actual APIs that set and inspect shape material and apply impulses.

- Direct selected-cap impulse candidates (mass 1): `0.25`, `0.5`, `0.75`, `1.0`, `1.5` game-unit·mass/s.
- Friction candidates, swept on the relevant contacting shapes: `0.15`, `0.35`, `0.55`, `0.75`.
- Restitution candidates: `0`, `0.1`, `0.2`, `0.35`.
- Restart geometry: place the button against the selected cap using its configured radii; rotate it with canonical azimuth, and test tilt `0°`, `15°`, `30°`, `45°`, `60°`. Sweep button launch impulse `0.25`, `0.5`, `0.75`, `1.0`, `1.5`; record actual cap/button contact and the selected cap's vertical response/peak rise. Do not add a vertical force or hidden lift.

If the pinned API cannot set a requested material or perform a physical contact using the current world factory, record the exact API limitation and minimal reproduction instead of substituting an engine or altering shared runtime code.

## Commands and acceptance

Run sequentially from the workspace root:

1. `pnpm.cmd --filter @korre/counterball typecheck`
2. `pnpm.cmd --filter @korre/counterball test`
3. `pnpm.cmd lint`

The focused test must load the installed WASM bytes, instantiate real Babylon Physics V2/Havok worlds, prove each candidate trial generated finite observations, and prove at least one direct impulse moves a cap and at least one configured button trial produces an actual button-cap contact. Report the entire candidate matrix with measured values and limitations. Do not claim traditional accuracy, human play feel, determinism across runtimes, or deployed Cloudflare compatibility. Stop with the measurements for coordinator coefficient selection and the later independent T02 review.
