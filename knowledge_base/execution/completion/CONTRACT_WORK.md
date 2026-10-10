# Coordinator contract work before implementation

These are planned amendments, not types that already exist. Implement them through C00 and later calibration/config packets. The existing `packages/game-protocol/src/types.ts`, runtime schemas, and parent CONTRACTS remain authoritative until that reviewed change lands. Workers must not invent private alternatives.

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

Freeze exact TypeScript fields and corresponding runtime schema together in C00. Use a single exported calibration type for diagnostics and the production adapter. Null remains allowed for historical scaffold fixtures but cannot silently fall back to probe constants. C02 publishes measured values; C03 updates all fixture version/hash tags and freezes the accepted config before gameplay consumers start.

Do not select production coefficients from the 480/40-row observations alone. All-15-body settling and actual whole-button obstacle traversal remain required. The normal/restart policy must use identical config and code for browser, Node tests and deployed physics.

## 3. Open pitch versus endlessly falling bodies

The current physical support slab ends at the painted boundary. Exited bodies can keep falling, preventing the required all-15 quiet window. Resolve this explicitly before the runner is accepted.

Preferred proposed engineering treatment: open horizontal pavement continues beyond the painted lines. Give the physical support a config-hashed apron whose extent is derived conservatively from the accepted impulse/energy bound and maximum simulated duration. It has no enclosing wall, no bounce-back permission and no change to rule crossing planes. Test side/end exits and settling on it. If an object exceeds the proven supported bounds, fail safely and restore the checkpoint; never report it as settled.

If measured energy/coverage cannot make that bounded treatment reliable, present a separate reviewed exit-body policy to the coordinator. Do not quietly freeze, teleport, delete or respawn a body during simulation. Cap returns happen through explicit pure resolution/placement after facts are recorded, preserving every unrelated cap.

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
