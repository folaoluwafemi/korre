# T02-BR01 guard-correction design review

**Verdict: PASS for the proposed correction design, with implementation prerequisites below.** The shifted-energy reference preserves the accepted 34-unit kinetic-energy envelope and therefore the hashed 48-substep and 325-unit apron bounds. The correction can stay within BR01's three source paths and does not require changing production config or shared contracts. The route analysis itself still contains the signed-energy check and unsafe cleanup ordering identified by its review; those must be replaced before implementation proceeds.

## Energy invariant and retained limits

Use each body's initial fixture rest COM height `restY_i` and the selected per-body maximum drop `d = 0.01125`:

```text
Eshift = sum_i(K_i) + sum_i(m_i * g * (COM_y_i - (restY_i - d)))
```

The separate guard must reject any `COM_y_i < restY_i - d`. Within that admitted region every shifted potential term is nonnegative. Thus `Eshift <= 34` implies `sum(K_i) <= 34`, which is the premise used to derive the speed and angular-speed bounds. The shift is only a constant choice of gravitational-potential zero at the allowed lower COM boundary; it does not change forces, impulses, geometry, or the selected energy ceiling.

At the at-rest fixture, the shifted potential is `14.15 * 9.81 * 0.01125 = 1.561629375`. After the accepted center impulse, kinetic energy is 32, so `Eshift = 33.561629375`, below the 34 ceiling by `0.438370625`. During the allowed drop, the shifted potential decreases only to zero; kinetic energy remains bounded by 34 if the stated passive-energy model holds. If a body rises, the shifted potential increases and the check becomes more conservative. Continue to fail closed on non-finite state, invalid mass/inertia/material properties, or any guard violation; the invariant is conditional on the accepted nonnegative-friction, restitution-at-most-one, no-extra-work model and is not a Havok API guarantee.

With `Emax=34`, the already accepted arithmetic is unchanged: the button needs at most 48 explicit calls per 1/120-second tick; its conservative per-call point sweep is approximately `0.01105381`, below `0.01125`; and its 15-second reach plus farthest-point radius is approximately `319.50632`, below the 325-unit margin. The cap requires 19 calls. The 86,400-call, 120-call batch, and 30,000 ms limits are unaffected. By contrast, checking conventional signed potential against 34 can allow kinetic energy `35.561629375`; the accepted audit recomputes that case as 49 calls and approximately `326.75846` units of reach, exceeding both the substep and apron limits. Do not retain that weaker check or increase the frozen limits silently.

This remains a diagnostic-only interpretation of the existing hashed `diagnosticGuard`. It leaves `physicsCalibration: null`, `configHash`, version stamps, production config, and wire contracts unchanged. Keep the shifted-potential reference and lower-height guard named and explicit in code/tests so future changes cannot silently switch energy conventions.

## Shape-restoration failure cleanup

The pinned Babylon 9.30.0 `PhysicsBody.shape` setter assigns its JavaScript `_shape` before calling the plugin's `setShape`. If restoring the original shape throws, the JavaScript reference alone cannot prove that native Havok detached the replacement. Do not dispose the replacement at that point.

Use this order:

1. Stop stepping and preserve the original simulation/guard error.
2. Attempt to restore the original shape. If this returns successfully, dispose the diagnostic replacement, then dispose the isolated world through its normal body-before-shapes teardown.
3. If restoration throws, first dispose the owning surface body (which removes/disposes it through the physics plugin). Then dispose the isolated world/scene/plugin so no native body can continue referencing the replacement. Only after those body/world teardown attempts, dispose the untracked replacement shape. Continue independent cleanup attempts and aggregate cleanup errors with the primary error; never dispose the caller-owned Engine.
4. If body/world teardown cannot be confirmed, do not release the replacement shape while it may still be referenced. Report cleanup failure rather than publishing a successful diagnostic result.

The current `disposeCounterballWorld` implementation processes owned bodies before tracked shapes and the scene and attempts remaining releases after an error. The diagnostic replacement is not in its tracked shape list, so BR01 must explicitly release it at the ordering point above. Tests should force shape-restore failure and verify the replacement is disposed only after body/world teardown; no successful result may escape that path.

## Scope and evidence boundary

The energy check and shape ownership live in `games/counterball/src/simulation/browserDirectProbe.ts`; focused tests fit `games/counterball/src/simulation/browserDirectProbe.test.ts`; the export remains in `games/counterball/src/browser.ts`. No change to `worldFactory.ts`, config, contracts, production geometry, or gameplay is required. Replacing the isolated diagnostic surface with the accepted 662 × 0.2 × 670 support box remains within those BR01 paths if its material, filters, transform, and disposal are validated.

This is a source/document design review only. No application install, test, build, browser, physics, deployment, or server command was run. The proposal does not establish solver passivity, continuous Havok trajectories, a runtime guard pass, flick traversal, playability, or T02 acceptance.
