# Coordinator contract work before implementation

These are planned amendments, not types that already exist. Implement them through C00 and later calibration/config packets. The existing `packages/game-protocol/src/types.ts`, runtime schemas, and parent CONTRACTS remain authoritative until that reviewed change lands. Workers must not invent private alternatives.

## C00-B implementation clarification

C00-B freezes the type shape and validation bounds below while keeping the initial config and historical fixtures at `physicsCalibration: null`. Those bounds are schema limits, not selected coefficients. The full `CounterballConfigSchema` validates the calibration in geometry context, including the application offset and smallest collider thickness. A playable calibrated runner rejects null; diagnostics may use candidate values only when explicitly labelled.

The pinned API check used Babylon core tag 9.30.0 source at `packages/dev/core/src/Physics/v2/Plugins/havokPlugin.ts` and the exact `@babylonjs/havok` 1.3.14 npm tarball (`sha512-+j2FDwLtkh5Gb//KizE8Ks3GIB/3vH8Yx9cQsMvZQpsKkH5gn089wIlJ9Yt8dJxbwBmWKGpMTIXxZE7YdOHUnQ==`, as pinned in `pnpm-lock.yaml`). Babylon's `executeStep` performs one `HP_World_Step` call. Havok's `HP_World_SetIdealStepTime` adjusts solver parameters; it does not create internal substeps. The runner therefore owns an explicit bounded substep loop. Its energy envelope includes the maximum normal/restart impulse work and application-point rotation plus the maximum gravitational potential drop allowed by geometry and shot duration. For each body derive `vBound = sqrt(2*Emax/mass)`, `omegaBound = sqrt(2*Emax/Imin)` using minimum principal inertia, and `rMax` to the farthest collider point from centre of mass. For configured tick duration `dt`, use `Nrequired = max(1, ceil(max_i((vBound_i + omegaBound_i*rMax_i)*dt/maxTranslationPerSubstep)), ceil(max_i(omegaBound_i*dt/maxRotationPerSubstep)))` explicit steps of `dt/Nrequired`. Probes and runner record actual durations/count/contacts and share this calculation. The support apron must reach at least `max_i(vHorizontalBound_i*maxShotDurationSeconds + rMax_i)` beyond every painted edge. If an energy/reach bound cannot be established, or `Nrequired > maxSubsteps`, fail with `resourceLimit`; no unsupported candidate is accepted.

T02-R01 error mapping remains canonical: simulated-duration exhaustion without settlement is `timeout`; wall-clock/workload, batch/fact/frame, or displacement-budget exhaustion is `resourceLimit`; cancellation is `cancelled`. These outcomes never return partial success.

The open-pavement treatment extends only the invisible physical support slab beyond the painted pitch by the calibrated apron margin. It has no side/end wall and does not change painted rule crossing planes. C02 must derive a conservative apron from the accepted impulse/energy envelope, gravity and maximum shot duration, then test side and end exits and all-15-body settling. Going beyond proven coverage is `resourceLimit`; no entity is frozen, teleported, deleted or respawned during simulation.

The exact later producer signatures are frozen in the C00-B section of canonical `CONTRACTS.md`: `resolveShot` in the referee domain module; `validateGameCommand` and `createLocalMatchController` in the match application module, with the controller implementing `GameTransport`; and create/update/pick functions in the scene presentation module. The C00-B source inventory distinguishes those future contracts from current exports. Do not dispatch T02-P01, T06-R01 or T09-R01 consumers against private alternatives.

## 1. Cancellation outside the wire

Current `SimulationRunner.simulate(input)` has no cancellation argument. Add an optional second argument with a portable structural signal:

```ts
type SimulationRunOptions = {
  signal?: { readonly aborted: boolean };
};
interface SimulationRunner {
  simulate(input: SimulationInput, options?: SimulationRunOptions): Promise<ShotSimulation>;
}
```

A native AbortSignal can satisfy that shape; the protocol package needs no DOM dependency. Never serialize the options, signal, world, callback or engine. Add a distinct `cancelled` error code and update every error schema/consumer, including `game.shot.aborted`; never call cancellation timeout/resourceLimit. Preserve pre-shot state upstream. Adapter scheduling/yield hooks remain private construction options.

This is a prelaunch protocol extension: record it in CONTRACTS, test all accepted/rejected variants, verify no active incompatible deployment, and update version stamps if the coordinator finds any already-deployed consumer. Do not silently mix versions in rooms. Other existing event names and envelope fields stay canonical.

## 2. Calibration schema before calibrated values

Change `physicsCalibration: null` to `PhysicsCalibration | null`. C00 freezes the shape below; diagnostic data informs C02 values later. No playable runner accepts null calibration.

```ts
type PhysicsMaterialCalibration = { friction: number; restitution: number };
type PhysicsDampingCalibration = { linear: number; angular: number };
type PhysicsCalibration = {
  schemaVersion: 1;
  havokVersion: '1.3.14';
  adapterVersion: 'adapter-2';
  materials: {
    surface: PhysicsMaterialCalibration;
    cap: PhysicsMaterialCalibration;
    button: PhysicsMaterialCalibration;
  };
  damping: { cap: PhysicsDampingCalibration; button: PhysicsDampingCalibration };
  impulse: {
    normalMax: number;
    restartMax: number;
    applicationHeightOffset: number;
  };
  restartLift: { mode: 'contact-only' };
  support: { apronMargin: number };
  workload: { maxBatchSteps: number; maxWallTimeMs: number };
  tunnelling: {
    maxTranslationPerSubstep: number;
    maxRotationPerSubstep: number;
    maxSubsteps: number;
  };
};
```

Initial planned schema bounds: friction 0..2; restitution and damping 0..1; normalMax/restartMax finite >0 and <=20 arbitrary impulse units; applicationHeightOffset within half cap height; apronMargin finite >0 and <=10,000 world units; maxBatchSteps integer 1..120; maxWallTimeMs integer 100..30,000. These engineering validation bounds are proposals, not measured tuning. C00 must check pinned APIs and candidate energy bounds; incompatible bounds get a reviewed amendment before any experiment or consumer uses them. No plan value certifies Cloudflare's account resource allowance.

Normalized cap impulse is `power * normalMax` for a normal shot, `power * restartMax` for a restart. Horizontal direction is `(sin(yaw), 0, cos(yaw))`. Apply at the cap's centre plus the accepted vertical applicationHeightOffset; do not inject vertical button impulse. Physical cap/button contact supplies initial loft. Any assisted mode needs a separate explicit schema/policy/version amendment and remeasurement; it cannot be represented by secretly changing applicationHeightOffset or body pose.

C00-B also freezes a config-hashed tunnelling guard. Bound translational and angular sweep per actual physics substep using body extents, thickness and measured velocity/impulse limits; verify the pinned Havok substep API before relying on it. `maxTranslationPerSubstep` is positive and less than the smallest collider thickness, `maxRotationPerSubstep` is positive and at most pi/4 radians, and `maxSubsteps` is an integer in 1..120. These are schema bounds, not selected settings. Every experiment records actual substep size/count and contact evidence. If the needed count exceeds its reviewed budget or the engine cannot enforce it, return resourceLimit rather than infer continuous safety from 120 Hz endpoints. Whole-button traversal requires overlap of horizontal extents, clearance of the full rotated button throughout crossing and no actual obstacle contact; a positive apex alone fails. C02 selects only measured settings and carries them into the shared runner and deployed tests.

The fields cover:

- Pinned Havok version, adapter version and calibration schema version.
- Surface/cap/button friction and restitution.
- Cap/button linear and angular damping.
- Horizontal cap impulse mapping from normalized power and the application point offset.
- Restart impulse policy: initial `contact-only`. Any assisted lift is an explicit different versioned mode with reviewed formula and evidence, never a hidden kick.
- Physics support coverage outside the painted pitch and workload limits, if added under the geometry/simulation section instead.

Freeze exact TypeScript fields and corresponding runtime schema together in C00. `PhysicsCalibration` remains the shared type for candidate calibration diagnostics and the production adapter. The separately reviewed `DiagnosticPhysicsGuard` applies only to the bounded D01 browser direct-shot diagnostic; it contains no calibration coefficients and is never a fallback for a calibrated runner. Null remains allowed for historical scaffold fixtures but cannot silently fall back to probe constants. C02 publishes measured values; C03 updates all fixture version/hash tags and freezes the accepted config before gameplay consumers start.

Do not select production coefficients from the 480/40-row observations alone. All-15-body settling and actual whole-button obstacle traversal remain required. The normal/restart policy must use identical config and code for browser, Node tests and deployed physics.

## 3. Open pitch versus endlessly falling bodies

The current physical support slab ends at the painted boundary. Exited bodies can keep falling, preventing the required all-15 quiet window. Resolve this explicitly before the runner is accepted.

Preferred proposed engineering treatment: open horizontal pavement continues beyond the painted lines. Give the physical support a config-hashed apron whose extent is derived conservatively from the accepted impulse/energy bound and maximum simulated duration. It has no enclosing wall, no bounce-back permission and no change to rule crossing planes. Test side/end exits and settling on it. If an object exceeds the proven supported bounds, fail safely and restore the checkpoint; never report it as settled.

If measured energy/coverage cannot make that bounded treatment reliable, present a separate reviewed exit-body policy to the coordinator. Do not quietly freeze, teleport, delete or respawn a body during simulation. Cap returns happen through explicit pure resolution/placement after facts are recorded, preserving every unrelated cap.

T02-GC01 selects a separate diagnostic fallback for only the accepted D01 raw centre impulse. It hashes a 325-unit open apron and bounds each body's centre-of-mass drop below its initial rest height to 0.01125 over the whole trial. The probe must use conservative full-collider sweep bounds before every actual Havok substep, include the possible gravitational work in its energy envelope, and stop before a step that could exceed the bound. This does not require continuous contact with the pavement; loft remains possible. If the sweep, energy, mass, or actual material properties cannot be established, the trial fails with `resourceLimit`. It does not calibrate or unlock the ordinary runner. `maxBatchSteps` is explicitly actual `executeStep` calls between yields, not nominal 120-Hz ticks.

## 4. Internal interfaces to freeze before multiple consumers

Use canonical `MatchState`, `GameCommand`, `ShotSimulation`, `BodyState`, `PlaybackFrame`, `DomainEvent`, envelopes and SDK `GameTransport`. Add missing shared definitions once through coordinator review. Before dispatching producer/consumer packets, freeze their precise module exports in CONTRACTS or an accepted packet report:

| Boundary | Required semantics |
|---|---|
| `Resolution` / `resolveShot(before, command, simulation, config)` | Immutable pure resolution, settled state, ordered events, restart/outcome and explicit cap-return operations. No network revisions, wall-clock calls or engine imports. |
| Normal command validation | Player ownership/phase/status/power/version checks; application authenticated actor is separate from physics input. Invalid input changes no authority. |
| Restart placement | Reuse `deriveRestartButtonPose`. Validate selected owned cap/anchor/overlap and derive button pose. Only cap and button setup transforms change. Invalid individual placement differs from bounded-search placementBlocked. |
| Presentation update | `createScene` currently returns pieces but lacks an accepted authoritative update API. Add stable-ID pose updates and mesh-to-ID picking without copying rules. |
| Local controller / transport | One action pipeline with checkpoint, simulate, resolve, playback, phase release and abort. Local AI and online presentation use the accepted SDK interface. |
| AI execution host | Bounded candidate evaluation over isolated same runner, abort/generation handling, and serializable worker messages. Native engine objects stay inside the host. |
| Online journals/outbox | Private persisted reservation generation; monotone revisions, committed-result reuse, exactly-once action effect, idempotent DB acknowledgement. Use canonical server events. |

Do not claim these signatures exist just because this table names them. Coordinator checks real source after each producer is accepted and supplies concrete exports in the next dispatch.

## 5. Numerical and cultural distinctions

Keep D10/D11/D19/D24/D25/D31/D32/D33 labelled as provisional where specified. Seven caps, visible clothing-button holes, any owned cap relocation, fixed other caps and open green concrete remain requirements. No automatic two-shot foul reward.

D38 is a vertical diagnostic margin. A future horizontal exit-anchor inset/placement tolerance gets a separately named config field and tests. No global epsilon reused for unrelated geometry. Whole-button goal/exit tests account for orientation; frame downsampling never supplies rule facts.

## T02-L01 strict restart-loft diagnostic guard

Add a separate, diagnostic-only `restartLoftDiagnosticGuard`; keep the accepted `browser-direct-impulse-v1` guard unchanged and leave `physicsCalibration: null`. The outer config advances to `schemaVersion: 3` and `configVersion: "counterball-config-3"`. Protocol wire version remains 1 because no message shape changes. T02-L01 remains blocked until this coordinator contract/schema card is accepted.

### Hashed identity and strict schema

The exact strict `CounterballConfig` object hashed by `hashCounterballConfig()` will contain both the outer schema/version and this complete nested L01 guard. The guard has literal fields for `schemaVersion: 1`, `scope: "restart-loft-coarse-matrix-v1"`, `matrixId: "counterball-l01-grid-v1"`, `algorithmVersion: "loft-coarse-probe-v1"`, `protocolVersion: 1`, `configSchemaVersion: 3`, `physicsVersion: "havok-1.3.14/adapter-1"`, fixture id `counterball-protocol-fixtures-v1`, configHash-independent fixture payload SHA-256 `6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d`, match id `00000000-0000-4000-8000-000000000001`, and expected loaded Havok WASM SHA-256 `026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11`. These identity values are actual strict nested config fields, not metadata assembled beside the config hash. The fixture file contains eight embedded `configHash` leaves, so hashing those raw bytes into the config would create a circular hash. The guard therefore binds the config-independent fixture payload digest: parse the fixture JSON, recursively omit every property named exactly `configHash`, preserve array order and pass the remaining plain JSON value to the existing `hashCanonicalJson()` (which sorts object keys and hashes compact canonical UTF-8 JSON). The artifact also records the exact post-update fixture file byte SHA-256 separately; it is provenance, not a value fed back into the config hash. Before constructing a trial or applying any impulse, verify the guard-bound canonical payload digest and the pinned WASM digest. Also compute the exact fixture-file byte SHA-256 and require equality with the independently reviewed expected fixture-byte digest frozen in the implementation card after the config-hash fixture update; this separate source-byte pin is deliberately not nested in the config, avoiding a cycle. Reject any mismatch. Do not update a digest without a reviewed identity/version update.

The guard is exactly the following JSON-shaped field inventory; all listed constants are literal hashed values (the fixture digest is the canonical payload digest defined above):

```json
{
  "schemaVersion": 1,
  "scope": "restart-loft-coarse-matrix-v1",
  "matrixId": "counterball-l01-grid-v1",
  "algorithmVersion": "loft-coarse-probe-v1",
  "protocolVersion": 1,
  "configSchemaVersion": 3,
  "physicsVersion": "havok-1.3.14/adapter-1",
  "fixture": { "id": "counterball-protocol-fixtures-v1", "payloadSha256": "6ce26e4203017e446687dfd8ad95106ba582f09420f8c623129c7d1bbe6b625d" },
  "matchId": "00000000-0000-4000-8000-000000000001",
  "wasmSha256": "026917766f534c156286f07975850978dabf17c42e742bbfaaebbcb2215e4e11",
  "matrix": { "gapOffsets": [0.75, 1.0], "tiltDegrees": [45, 60], "impulseMagnitudes": [6, 8], "azimuthDegrees": [-15, 0, 15], "nestedAxisOrder": ["gap", "tilt", "impulse", "azimuth"] },
  "setup": { "selectedCapId": "home-0", "obstacleCapId": "home-1", "buttonId": "button", "selectedCapXZ": [0, -5], "capRestHeight": "surfaceY+capHeight/2", "buttonPoseFunction": "deriveRestartButtonPose", "obstacleGapAxis": "world-positive-Z", "fillerOrder": "canonical-entity-order", "fillerX": [-4.5, 4.5], "fillerZ": [-8, -5, -2, 1, 4, 7], "initialStateHashAlgorithm": "hashCanonicalJson-v1", "capsIdentityRotation": true, "allDynamicVelocitiesZero": true, "impulseDirection": [0, 0, 1], "impulseApplicationPoint": "actual-native-world-COM", "supportApronMargin": 325 },
  "materials": { "shapeCount": 22, "friction": 0.15, "staticFriction": 0.15, "restitution": 0, "frictionCombine": "MINIMUM", "restitutionCombine": "MAXIMUM", "readbackPolicy": "exact-setter-value" },
  "energy": { "formulaVersion": "shifted-mechanical-energy-v1", "gravityMagnitude": 9.81, "maximum": 34, "maximumRestComDrop": 0.01125, "nativeMassProjection": "Math.fround(configuredMass)", "nativeMassToleranceMultiplier": 64, "restReference": "tuple-initial-native-COM-y" },
  "sweep": { "maximumPointSweepPerCall": 0.01125, "maximumRotationPerCall": 0.39269908169872414, "maximumCallsPerNominalTick": 48, "verticalClearanceMargin": 0.005 },
  "workload": { "maximumNominalTicksPerCase": 1800, "maximumExecuteStepCallsPerCase": 86400, "maximumExecuteStepCallsMatrix": 2073600, "maximumBatchesPerCase": 720, "maximumBatchesMatrix": 17280, "maximumCallsPerBatch": 120, "maximumWallTimePerCaseMs": 30000, "maximumWallTimeMatrixMs": 720000 },
  "artifact": { "sampleRateHz": 120, "maximumBodyRowsPerCase": 27015, "maximumBodyRowsMatrix": 648360, "maximumContactsPerCase": 8192, "maximumContactsMatrix": 196608, "maximumSweepRowsPerCase": 1801, "maximumBodyOrContactRowBytes": 512, "maximumSweepRowBytes": 1024, "maximumCaseBytes": 20971520, "maximumMatrixBytes": 504365056, "maximumCaseMetadataBytes": 65536, "maximumMatrixMetadataBytes": 65536, "maximumEventTypeBytes": 64 }
}
```

These names and values must be implemented as the strict `restartLoftDiagnosticGuard` type/schema. No unknown key, missing field, null guard or unrecognized enum is accepted. Schema tests prove strict rejection, deep freezing and canonical hash sensitivity to each field. `physicsCalibration` remains null; no local match, AI, online or deployed runner may read this diagnostic guard or fall back to it.

### Exact matrix and setup

The axes and units are fixed: gap game-units `[0.75, 1.0]` outermost, tilt degrees `[45, 60]`, centered cap impulse magnitudes `[6, 8]`, and button azimuth degrees `[-15, 0, 15]` innermost. Generate all 24 unique tuples in this exact nested order. Do not normalize, round, reorder or omit a tuple.

For each case, parse the pinned fixture and construct the same 15 dynamic entities in canonical `ENTITY_IDS` order. The selected cap is `home-0`, the obstacle is `home-1`, and the button is `button`. Set selected-cap position to `(0, surfaceY + capHeight/2, -5)` with identity rotation. Derive the button position and rotation only with `deriveRestartButtonPose(capPosition, azimuthRadians, tiltRadians, canonicalConfig)`. Set the obstacle position to `(0, surfaceY + capHeight/2, buttonPose.z + buttonRadius + capRadius + gap)` with identity rotation; gap is an offset along world +Z, not a radial distance. Assign the remaining twelve caps in canonical body iteration order to the Cartesian slots `x ∈ [-4.5, 4.5]`, then `z ∈ [-8, -5, -2, 1, 4, 7]`, with identity rotation. Every dynamic body has exactly zero linear and angular velocity. Hash the complete regenerated initial state per tuple with the existing `hashCanonicalJson()` before constructing its trial world.

Use `createCounterballWorld` and the real pinned Havok WASM. The only world-geometry replacement is the existing open support slab: preserve top at `surfaceY`, thickness `0.2`, material, filters and trigger flag; change width to `pitchWidth + 2×325 = 662` and length to `pitchLength + 2×325 = 670`. Do not add perimeter walls, move painted crossing planes, or change any of the six canonical goal-frame colliders; the seventh static body is the separate support slab.

Before a trial and before any impulse, read all 15 dynamic bodies' actual native mass, COM offset, inertia, inertia orientation, shape dimensions, collision filter and zero velocities, plus all seven static bodies' collision/material facts. Require all quantities finite, all masses and principal inertias positive, supported dimensions/filters, and valid normalized orientations. For native mass only, apply the exact accepted D01 float-projection check: `abs(nativeMass − Math.fround(configuredMass)) <= 64×Number.EPSILON×max(1, configuredMass)`; use the observed raw mass in every sum and fail before impulse when the readback is outside that bound. For each of all 22 shapes, set and read back exactly friction `0.15`, static friction `0.15`, restitution `0`, friction combine `MINIMUM`, and restitution combine `MAXIMUM`. Use no unreviewed tolerance for material properties; any mismatch, missing, unsupported, non-finite or out-of-domain property fails closed before impulse. Use raw actual native masses, COMs, inertias, orientations, filters and dimensions (not configured substitutions) in every energy, sweep and setup calculation. These material numbers are provisional diagnostic conditions, not product tuning.

**Accepted coordinator amendment for T02-L01-SUPPORT-F32-1 (2026-10-13):** Run 38466161040 on pinned Chromium/Havok read configured support thickness `0.2` back as exactly `0.20000000298023224`, which equals `Math.fround(0.2)`, while support transform and x/z dimensions matched exactly. Preserve the configured/constructed slab at exactly `12 × 0.2 × 20`; change only the existing pre-impulse support-AABB Y comparison to exact equality with `Math.fround(config.geometry.surfaceThickness)`. No epsilon or alternative value is accepted; keep x/z and every other guard exact, report configured/projected/observed values, reject non-finite values, and continue to use raw native readbacks for calculations. This single-value representation check does not change geometry, protocol/config hashes, materials, filters, impulses, steps, or any matrix acceptance requirement. Independent contract/packet review PASS is recorded at `execution_state/reports/T02-L01-SUPPORT-F32-packet-review.md`; the exact implementation remains separately reviewable and must pass hosted checks. See `execution_state/reports/T02-L01-SUPPORT-F32-contract-proposal.md`.

**Accepted coordinator amendment for T02-L01-MATERIAL-F32-1 (2026-10-14; independent contract/packet review PASS):** Exact run 38473828114 observed pinned native dynamic-friction setter `0.15` as `0.15000000596046448`, exactly `Math.fround(0.15)`. For only the T02-L01 diagnostic material preflight, interpret the existing `readbackPolicy: "exact-setter-value"` as exact equality in the pinned native representation: require finite numeric `friction`, `staticFriction`, and `restitution` readbacks to equal exactly `Math.fround(setterValue)` with finite setter/projection; keep both combine-mode fields strict exact string comparisons. Continue recording raw configured setter and native getter values. This is exact representation matching, not a tolerance, and does not change the configured coefficients, protocol/config shape or hash, fixture, geometry, filters, solver, impulse, matrix schema, or production defaults. The all-shape pre-impulse guard must fail closed before any impulse if even one value is missing, non-finite, out of range, projection-overflowed, or differs from the exact projection; no matrix result/artifact may be written after a failure. The `staticFriction`/`restitution` projection is an explicit bounded inference from their shared pinned adapter/native material boundary, not a claim that those values were individually observed. The exact contract review is `execution_state/reports/T02-L01-MATERIAL-F32-packet-review-2.md`; source review is separate and hosted/runtime acceptance remains pending. See `execution_state/reports/T02-L01-MATERIAL-F32-contract-proposal.md`.

**Accepted material artifact-validator clarification for T02-L01-MATERIAL-F32-1 (2026-10-14; independent contract/packet review PASS):** The configured setter record must still equal the frozen material policy with strict numeric and string equality. Validate each raw native readback separately: its finite numeric friction, static friction and restitution must equal exactly `Math.fround(the corresponding setter value)`, with no tolerance; both combine strings must equal the setter strings exactly. Require each static-body material record to match its corresponding shape's raw native readback exactly. Preserve the unmodified native values in serialized metadata. Focused writer tests accept exact projected readbacks, preserve them in the output, and reject an adjacent Float32 value. This clarification affects only validation of T02-L01 diagnostic metadata; it changes no artifact schema, configured value, protocol, hash, physics behavior or production rule. Contract semantics are accepted; the implementation packet's hosted/runtime acceptance remains pending.

Apply exactly one planar impulse `{x: 0, y: 0, z: J}` to `home-0` at its actual native world COM. There is no torque, second force, vertical assist or extra contact impulse. Button azimuth/tilt only affect the derived pose; they do not rotate the impulse direction.

### Exact shifted-energy check and physical envelope

At every checked state use the same definition, with actual native body masses and actual world-space inertia tensor `Iworld,i`:

`Eshift = Σi (0.5 mi |vi|² + 0.5 ωiᵀ Iworld,i ωi + mi g (COMy,i − (restY_i − dropLimit)))`.

Here `g = 9.81`, `dropLimit = 0.01125`, and `restY_i` is that body's own actual initial native-COM y reference for this tuple. Reject any non-finite input or intermediate. Independently require every body's current COM y to be no lower than `restY_i − 0.01125`.

Before impulse, require all 15 velocities to be exactly zero, each start COM to equal its tuple's rest reference, and its actual native properties to pass the checks above. Compute the predicted post-impulse state using raw native `m_home-0`: `v' = v + (0,0,J)/m_home-0`; angular velocity is unchanged because the application point is the actual COM. Evaluate the full formula above using the predicted velocities and all 15 raw actual masses/inertias and require `Eshift_predicted <= 34`. At rest this reduces to `J²/(2m_home-0) + 9.81×0.01125×Σmi <= 34`; apply the exact `<= 34` ceiling with no comparison epsilon. Do not substitute canonical `1`, `0.15` or `14.15` when native reads differ. A failed/missing preflight exits before the impulse with typed `resourceLimit` and no success artifact.

At each actual public Havok `executeStep` call, verify finite state for all 15 bodies, `Eshift <= 34`, per-body COM drop, full-collider swept clearance/support before the call, and the call result after it. Here one public `executeStep` invocation is one budget unit; do not describe that count as a proven low-level WASM substep count. Use actual native mass, principal inertias/orientations, COM offsets and complete collider extents in the conservative sweep calculation. The strict hashed fields are `maximumPointSweepPerCall = 0.01125`, `maximumRotationPerCall = π/8`, and `maximumCallsPerNominalTick = 48`; these exact names are used in the config type, schema and runner. Derive subdivision at full precision for every tuple and stop before any call requiring more than 48. Each call advances exactly `1/(120×Nrequired)` seconds. Before each call, prove each whole collider stays within the open apron, above the slab underside, and inside its candidate-relative drop limit. After every call, re-read and revalidate all 15 bodies for finiteness, shifted energy, per-body drop and whole-collider support; any violation aborts the case and matrix without a success artifact. Unknown/unsupported geometry, native property, material, bound or sweep returns typed `resourceLimit` and aborts the matrix without a success artifact. This is bounded discrete-step evidence, not proof of unbounded continuous motion.

### Work and exact artifact envelope

Each case simulates no more than 15 seconds / 1,800 nominal 1/120-second ticks. Hard limits: 86,400 actual public `executeStep` calls per case; 2,073,600 total; 720 host-yield batches per case; 17,280 total; at most 120 actual calls per batch; 30,000 ms per case and 720,000 ms for the complete matrix including world setup/disposal, hashing and serialization. These are stop ceilings, not a measured fit guarantee. Cancellation or any limit overrun fails the entire matrix; no partial file is marked successful.

Timing fields in the streamed artifact have a separate, exact measurement interval. Case metadata `wallTimeMs` is the monotonic elapsed duration from per-case setup start until world/apron cleanup completes, sampled before that case is serialized. The matrix-envelope `wallTimeMs` is the exact sum of the 24 case metadata values in canonical tuple order; these are workload totals, not end-to-end matrix elapsed time. Independently enforce the 30,000 ms case ceiling from setup start through serialization of that case. Independently enforce the 720,000 ms matrix ceiling from runner entry through setup, hashing, all case and envelope serialization, and completion of the writer/sink flush. Report `measuredMatrixWallTimeMs` using those runner-entry and writer/sink-flush endpoints. Keep Playwright host download validation, atomic rename, and attachment within the overall test/job deadline. Do not substitute either artifact total for its corresponding independent deadline clock.

Do not use 30-Hz playback frames. For each tuple preserve all 15 bodies' serialized position, rotation, linear and angular velocity at tick zero and every executed nominal 1/120-second endpoint: at most 27,015 state rows/case, 648,360 total. Preserve all actual contact callbacks, without deduplication/truncation, up to 8,192 rows/case and 196,608 total; each row includes tuple, nominal tick, actual call index, canonical pair, bounded event type (UTF-8 ≤64 bytes) and finite contact point or null. A contact participant is either one of the 15 dynamic IDs or one of the seven diagnostic-only static IDs `goal-frame-0` through `goal-frame-5` and `support-apron`; do not change protocol `EntityId`. The total pair order is the existing canonical dynamic-ID order followed by those seven static IDs in that listed order. Canonicalize each callback's two participants by this total order, reject unknown or identical endpoints, preserve each callback in occurrence order, and retain duplicate/symmetric observer notifications as separate rows. Map the static factory node names explicitly: `counterball-goal-post--1--1` → `goal-frame-0`, `counterball-goal-post--1-1` → `goal-frame-1`, `counterball-goal-crossbar--1` → `goal-frame-2`, `counterball-goal-post-1--1` → `goal-frame-3`, `counterball-goal-post-1-1` → `goal-frame-4`, `counterball-goal-crossbar-1` → `goal-frame-5`, and `counterball-surface` → `support-apron`. These names identify diagnostic colliders only and are not gameplay entities. For every nominal interval retain one compact sweep summary (up to 1,801/case) with exact actual checked-call count and substep indices of extrema: maximum shifted energy, maximum candidate-relative COM drop and body id, minimum conservative apron margin and body id, minimum slab-underside margin and body id, maximum point sweep and body id, maximum rotation sweep and body id, minimum whole-button obstacle clearance during full horizontal overlap and interval classification, plus finite/settled facts. These summaries expose the extrema actually checked at each public call; nominal endpoint rows alone do not establish them. Require each scalar finite and assert all extrema satisfy the strict guard before append.

Every completed case's ≤64-KiB fixed metadata object must serialize, at full precision and without tuple rounding: the exact four-axis tuple and its matrix index; matrix, algorithm and initial-state-hash versions; protocol/config schema/config versions; the complete canonical config hash; fixture id, lowercase configHash-independent payload digest and exact post-update fixture-file byte SHA-256; physics and adapter versions; loaded WASM SHA-256; fixed match id; runtime/browser identity; all 15 dynamic bodies' actual native pre-impulse mass, COM offset, principal inertias, inertia orientation, collider dimensions, collision filters, and initial linear/angular velocities; each body's configured-mass float-projection result; material setter and exact native readback for each of all 22 shapes; and actual collider/material/filter facts for the seven static bodies (six goal-frame colliders plus the open support slab). It also records pre-impulse measured and predicted shifted energy, each body’s final position/rotation/linear/angular velocity, and the exact 0.5-second settling-window tick bounds, thresholds and all-15-body per-tick settling result. A completed but ineligible case records why; any preflight, guard, provenance or integrity abort produces no success artifact. Count the actual UTF-8 bytes of this complete metadata object against the 64-KiB cap; data held only in memory does not satisfy the artifact contract. The matrix envelope also records the ordered tuple list and exact row/call/batch/time totals.

All artifact-size caps are inclusive and use the exact UTF-8 byte count: body/contact rows `<=512` bytes; sweep-summary rows `<=1,024` bytes; fixed case metadata `<=65,536` bytes; each complete case `<=20,971,520` bytes (20 MiB); matrix envelope `<=65,536` bytes; whole compact JSON `<=504,365,056` bytes (481 MiB). The config fields `maximumCaseBytes` and `maximumMatrixBytes` contain those exact inclusive maxima; enforcement uses `>` to reject. Per-case worst-case row arithmetic is `(27,015+8,192)×512 + 1,801×1,024 + 65,536 = 19,935,744 bytes`, below the inclusive 20-MiB case maximum. Twenty-four complete cases at the maximum plus a 64-KiB matrix envelope are below the inclusive 481-MiB matrix maximum. Verify actual encoded bytes, not estimates. Stream deterministic compact matrix JSON to a browser download only after all 24 cases, tuple order, provenance, counts and assertions pass. The Playwright host saves the download to a temporary file under test-results/, hashes and validates it, and atomically renames it to the final evidence path only after all checks pass. Any row/count/metadata/case/aggregate byte/call/batch/time/integrity cap aborts the matrix and leaves no success artifact.

A case is eligible only if the whole button starts fully before and finishes fully beyond the obstacle, conservative full-button swept clearance exceeds the separately named vertical diagnostic margin `0.005` throughout full horizontal overlap, there is no actual button-obstacle contact, all 15 bodies remain finite and settle for the canonical 0.5-second window, and every actual call passes the hashed guard. Zero eligible candidates is valid only if all 24 trials and complete artifact assertions pass. Contact, non-crossing or non-settlement may make a completed case ineligible; guard/provenance/workload/malformed-output/integrity failure aborts the matrix.

### Bounded browser-to-host artifact transport

The physics matrix runs in the real Chromium page with Babylon Engine and pinned Havok. The page must retain only bounded per-case working data and a compact summary for display. It must never put the complete matrix JSON in DOM text or return the matrix from one page.evaluate/Playwright IPC call. On successful completion, expose the complete encoded JSON as a browser download; a failed or partial matrix exposes no successful download.

The Playwright test waits for that download and calls download.saveAs(testInfo.outputPath("counterball-l01-matrix.json.tmp")). The host verifies the saved file with a streaming reader, counts actual UTF-8 bytes, computes SHA-256 over the exact downloaded bytes, and parses the JSON incrementally without retaining the full matrix in memory. The streaming parser validates the envelope, exactly 24 cases and their canonical tuple order, each case's row/call/batch/time and byte bounds, and aggregate totals. It retains at most the current case object (which is bounded by the 20-MiB case cap) plus the 64-KiB matrix envelope. The compact browser summary and host-computed digest/counts are compared and written to the test result. Only after every byte, digest, schema, tuple, count, workload and physics assertion passes does the host atomically rename the temporary file inside test-results/ and attach that final path with `await testInfo.attach("counterball-l01-matrix.json", { path: finalPath, contentType: "application/json" })`. On any exception, cancellation, malformed output or limit failure, close the stream, remove both temporary and final paths, and do not attach a success artifact. The browser page UI/result and Playwright evaluate return remain bounded and contain no full-case rows. Keep the test and job deadlines above the 720-second matrix ceiling plus file validation/attachment overhead; if the existing hosted job cannot meet that bound, stop and obtain a separately reviewed workflow amendment before dispatch.
