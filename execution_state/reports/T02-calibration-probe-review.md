# T02-B0 repair 2 independent source review

Source-only verdict: **PASS for the bounded export/narrowing repair**. This is not a compiled/runtime pass or acceptance of the calibration probe, T02, or T04. All measurements and runtime/validation checks remain **NOT RUN**, pending GitHub CI.

Inspected `calibrationProbe.test.ts`, the updated implementation report, T02-B0 packet, and the actual pinned Babylon 9.30.0 v2 barrel/class declarations. No local build, test, lint, typecheck, probe, or server command was run.

## Finding resolved

`games/counterball/src/simulation/calibrationProbe.test.ts:6` now imports the real `PhysicsEngineV2` named export from `@babylonjs/core/Physics/v2/index.js`. The installed `index.d.ts:1` declares exactly:

```ts
export { PhysicsEngine as PhysicsEngineV2 } from "./physicsEngine.js";
```

The previously invalid `PhysicsEngine as PhysicsEngineV2` barrel import is removed. The throwing `instanceof PhysicsEngineV2` guard at probe lines 261–264 rejects null/non-V2 engines and narrows the scene accessor's generic engine to the pinned concrete class. That class exposes `getBodies(): Array<PhysicsBody>` at `Physics/v2/physicsEngine.d.ts:108`. The retained call at probe line 354 therefore uses the actual body's registered engine list with an appropriate class narrowing, without a cast or invented substitute. This directly addresses run #1's generic-engine `getBodies` error in source; only hosted typecheck can establish compiler success for the full package.

## Trial semantics and evidence limits

Repair 2 changes the export name, not the trial behavior. The V2 guard, fixed-step call, canonical inputs, material/impulse application, contact observations, settlement logic, 80 direct-cap trials and 400 restart-button trials remain as previously inspected. No hidden lift, candidate coefficient, production calibration, fixture or force semantics were changed. The updated implementation report records both repair steps and correctly says compilation has not been confirmed.

The three packet validation commands (counterball typecheck, counterball tests/probe, root lint) remain **NOT RUN for this repair**. Actual WASM initialization, finite trial results, movement, contacts, settlement, peak rise and all 480 measurements remain **NOT RUN/unmeasured** in current probe evidence. Next GitHub CI must validate compilation, execute the real probe and supply the complete observation record before coefficient selection or broader acceptance. No local rerun is requested under the laptop restriction; no physics/deployment proof is inferred from this source PASS.
