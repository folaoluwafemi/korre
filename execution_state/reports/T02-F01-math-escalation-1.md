# T02-F01 math escalation 1

Status: design analysis only. No source, test, contract, config, or status file was changed. No local application command or runtime check was run. This report does not accept F01 or T02 and does not authorize another repair attempt.

## Rotation conventions and actual interpolation

F01 normalizes every accepted endpoint quaternion. Use the active Hamilton convention represented by `{x,y,z,w}`: `R(q)` maps a local vector into world coordinates, and the button/cap symmetry axis is `v(q) = R(q)(0,1,0)`, as implemented by `verticalAxis`.

For normalized endpoints `q0,q1`, F01 selects the shortest quaternion representative: if `dot(q0,q1) < 0`, it replaces `q1` with `-q1`. Then `d = dot(q0,q1) >= 0`, `alpha = acos(d)`, and the physical shortest rotation angle is `theta = 2 alpha`, in `[0,pi]`. At exactly `d=0`, the implementation does not flip; either sign represents a shortest pi rotation, and the selected sign fixes the interpolated path. The path bound below is invariant to reversing that relative axis.

Let `q1'` be the selected endpoint and `Delta = q1' * conjugate(q0)`. This is the relative world rotation. For `theta > 0`, write `Delta = (u sin(theta/2), cos(theta/2))` with unit world axis `u`. Let `v0 = R(q0)e_y`, `c = u dot v0`, and `s = sqrt(1-c^2) = |u cross v0| = sin(beta)`. Rodrigues' formula gives

`v(t) = c u + cos(psi(t)) p + sin(psi(t)) (u cross p)`,

where `p = v0 - c u`, `|p|=s`, and `psi(t)` is the physical relative angle traversed at interpolation parameter `t in [0,1]`. Thus the directed symmetry axis follows a small circle of radius `s` about `u`, not generally a great circle. Its path speed is `|v'(t)| = s |psi'(t)|` radians per unit normalized interval parameter.

For ordinary SLERP, `psi(t)=theta*t`, so every subinterval `[a,b]` has exact axis path length `theta*s*(b-a)`. Over the whole interval it is `theta*s`.

For F01's normalized-linear branch, set `q1' = cos(alpha) q0 + sin(alpha) p4`, where `p4` is a unit quaternion-space vector orthogonal to `q0`. Before normalization the lerp is

`r(t) = A(t)q0 + B(t)p4`, `A(t)=1-t+t cos(alpha)`, `B(t)=t sin(alpha)`.

After normalization it is `q(t)=cos(phi(t))q0+sin(phi(t))p4`, with `phi(t)=atan2(B(t),A(t))`. Differentiation gives

`phi'(t) = sin(alpha) / (A(t)^2+B(t)^2)`,

and `A^2+B^2 = 1 - 2t(1-t)(1-cos(alpha))`. Its minimum is `cos^2(alpha/2)` at `t=1/2`. Therefore the maximum physical angular speed is

`max |psi'(t)| = 2 max phi'(t) = 4 tan(alpha/2) = 4 tan(theta/4)`.

The normalized-linear path traces the same axis small circle and has the same total axis arc `theta*s`; its parameterized speed is not constant. For any `[a,b]`, its axis path is exactly `2s(phi(b)-phi(a))` and is bounded by `4 tan(theta/4)*s*(b-a)`. F01 selects this branch when the post-sign-selection quaternion dot is greater than `0.9995`; otherwise it uses SLERP. This bound follows the implemented branch threshold rather than assuming every interval is SLERP.

## Finite-cylinder support bound

For a unit support direction `n`, cylinder radius `r`, half-height `cH=h/2`, and unit symmetry axis `v`, the centered finite cylinder's support extent is

`H(v,n) = r sqrt(1-(v dot n)^2) + cH |v dot n|`.

Let `rho = sqrt(r^2+cH^2)`, the distance from the centre to the furthest point of the finite cylinder. If two directed axes differ by angle `delta`, choose the minimum rotation taking one axis to the other. Axisymmetry makes that rotation map one cylinder exactly onto the other; any point moves at most `2 rho sin(delta/2) <= rho*delta`. Their Hausdorff distance is therefore at most `rho*delta`, and support extents in every unit direction differ by no more than the Hausdorff distance. This argument does not differentiate `H`; it remains valid at `v dot n = 0`, at `|v dot n| = 1`, and at support ties.

A sharper angular coefficient is `R=max(r,cH)`. Away from the nonsmooth points, put `mu=v dot n`; because `v'` is tangent to the unit sphere, `|mu'| <= sqrt(1-mu^2)|v'|`. For `mu >= 0`,

`|dH/dt| <= |cH sqrt(1-mu^2) - r mu| |v'| <= max(r,cH)|v'|`.

For `mu < 0`, symmetry gives the same bound. At `mu=0` and `|mu|=1`, the one-sided limits are bounded by `cH` and `r`, respectively. The `rho` Hausdorff bound is simpler and universally safe; `R` is useful if the implementation and tests preserve the piecewise/nonsmooth proof.

Consequently, with the simpler coefficient, the rotational support Lipschitz constant per unit `t` is:

- SLERP: `rho * theta * s`.
- NLerp: `rho * 4 tan(theta/4) * s`.

For a boundary clearance, add absolute centre displacement on that boundary's coordinate: `L = |x1-x0| + rho*axisSpeed` (or the corresponding z coordinate). For goal-post, crossbar, and floor clearances, use `|x1-x0| + rho*axisSpeed` or `|y1-y0| + rho*axisSpeed` for the fixed horizontal/vertical directions. On a recursive interval `[a,b]`, midpoint clearance minus `L*(b-a)/2` remains a conservative lower bound. A nonfinite input, uncertain quaternion/axis bound, or interval whose clearance cannot be proved within the existing limits must throw/fail closed; it must not be skipped.

## The pi/4 small-circle comparison

Take `theta=pi/4` and `beta=0.01` radians. The axis path for SLERP is `theta sin(beta) = 0.007853850735` radians. The endpoint-to-endpoint symmetry-axis angle used by the current code is `deltaEndpoint`,

`deltaEndpoint = 2 asin(sin(beta) sin(theta/2)) = 0.007653559767` radians.

The repair-2 multiplier is `4 tan(theta/4)/theta = 1.013052368339`, giving `deltaEndpoint*multiplier = 0.007753456848`, still below the actual SLERP path by `0.000100393887` radians (about 1.28% of the path). With `rho=sqrt(.13^2+.01^2)=0.130384048104`, the current clearance bound is `L = rho * deltaEndpoint * 1.013052368339 = 0.001010927091`. The ratio of the endpoint angle to the actual path tends to `2 sin(theta/2)/theta = 0.9744953584` as beta tends to zero. The NLerp rate multiplier does not correct this small-circle endpoint-versus-path gap. Thus the repair-2 claim that endpoint axis angle is the path length is false.

The current clearance use adds an extra `rho` factor, so the axis-angle counterexample alone does not establish a false clearance certificate for the default aspect ratios. At theta pi/4, the combined current factor relative to the sharper `r*theta*sin(beta)` support bound tends, as beta tends to zero, to

`(rho/r) * (sin(pi/16)/(pi/16))^2`.

It is approximately `1.00189` for the default button (`r=.13, h=.045`) and `1.00442` for the default cap (`r=.32, h=.12`), narrowly above one. That accidental margin depends on geometry and maximum angle: the runtime schema allows other positive button/cap dimensions, and the interpolation helper itself permits shortest angles up to pi. It is not a general proof for every valid config or every accepted input. Keep the distinction clear: the endpoint-axis path claim fails; whether the current *combined* clearance bound is conservative depends on the frozen shape ratio and enforced angle range.

An analytic false-certificate fixture exists within the current geometry schema and the pi/4 substep limit. Use a test-only button thickness `0.02` (so `r=.13`, `cH=.01`; this is not a production-default change), `theta=pi/4`, `beta=.01`, `epsilon=.0005`, and `eta=1e-7`. Let the world relative rotation axis be `u=(cos(beta),0,sin(beta))`; let `qTilt=Rz(-pi/2)`, which maps the local y axis to `n=ex`; and define `q0=Rot(u,-theta*epsilon) qTilt`, `q1=Rot(u,theta*(1-epsilon)) qTilt`. The selected shortest-arc interpolation is `q(t)=Rot(u,theta*(t-epsilon))qTilt`, so its symmetry axis passes through `n` at `t=epsilon`. Define `delta(t)=2 asin(sin(beta)*sin(theta*abs(t-epsilon)/2))`, `H(t)=r sin(delta(t))+cH cos(delta(t))`, and right trailing clearance `f(t)=H(t)-H(epsilon)-eta`. Put the button centre at `x=6+H(epsilon)+eta` with `pitchWidth=12`.

Direct evaluation gives `f(0)=4.1050e-7`, `f(.5)=5.06548752320324e-4`, `f(1)=9.94089e-4`, but `f(epsilon)=-1e-7`. Keep the two angles distinct: `deltaEndpoint` is the angle between the interval endpoint axes and is what the current code uses in `L`; `delta(t)=2 asin(sin(beta)*sin(theta*abs(t-epsilon)/2))` is the angle from the aligned axis at the interior time `epsilon` to the axis at sample time `t`. At the first root-search midpoint, the current-bound lower bound is `f(.5)-L/2 = 1.085206995e-6 > 0`, so the current search certifies the entire interval clear and misses the earlier descending root. The exact support-safe bound `r*theta*sin(beta)=0.00102100060` instead gives a negative midpoint lower bound and forces subdivision. For a history that starts wholly in play, prepend small translational substeps to this interval; keep them below the frozen substep translation limit and with positive trailing clearance. This construction is a regression design, not an executed test or runtime claim. Set the button centre y to at least its radius above the open surface so the sideways orientation need not penetrate the floor.

## Smallest future source packet and regressions

A separately authorized source packet can replace endpoint-axis-angle travel with a parameterized axis-speed bound: compute the selected relative quaternion, `theta`, and `s=|u cross R(q0)e_y|`; choose `theta*s` for the exact SLERP branch and `4 tan(theta/4)*s` for the NLerp branch. Use a documented outward numerical margin or a safe `s=1` fallback when `theta` is too small to estimate `u` reliably. If the value cannot be made finite/conservative, fail closed. Multiply by the finite-cylinder support coefficient (`rho` is the simplest proved choice) and retain centre travel, left-first earliest-root search, existing depth/node caps, and explicit unresolved-interval errors. Apply the same angular bound to the button's post/crossbar/floor clearance proof. Do not use endpoint geodesic separation as path length.

The implementation packet should include named tests for:

1. **Pure vertical-axis yaw:** nonzero quaternion angle but `s=0`; support is invariant and the x=5.8 → 6.12 → 6.14 right-exit regression remains one earliest step-2 event.
2. **Pi/4 small-circle bound:** theta pi/4, beta .01, independently evaluate `theta*sin(beta)` and endpoint `delta`; assert the chosen bound covers the former, not merely the latter.
3. **Small-circle hidden crossing:** the test-only `.02`-thickness construction above has positive interval endpoints and midpoint but a negative clearance near `t=.0005`; assert the earliest right/out root is found rather than pruning the interval.
4. **NLerp threshold sides:** rotations immediately on either side of `dot=0.9995` use their actual branches; compare the path-speed certificate to dense analytic support samples, including a near-vertical relative axis.
5. **Zero/sign/near-degenerate and pi tie:** q and -q represent no motion after sign selection; tiny nonzero arcs use a conservative fallback; dot zero chooses a deterministic shortest path; all bounds remain finite and nonnegative.
6. **Cylinder support nonsmooth points:** axis parallel/perpendicular to each boundary normal, including exact tangency and a support tie, retain conservative clear/blocked decisions.
7. **Existing coverage:** preserve 85°→95° equal-sign, multi-root earliest, yaw, goal drift/tangency, deterministic boundary ties, contacts-before-crossings, immutability, and bounded-output tests.

The exact speed bound is tight for the directed axis path, while multiplication by `rho` is conservative for finite-cylinder support. It is more useful than full-quaternion angular travel for ordinary twists about the symmetry axis, and does not inherently resource-limit ordinary motion. Existing left-first search limits still fail closed if the bound cannot prove an interval. It certifies only F01's supplied linear-position and selected quaternion interpolation; it does not prove Havok motion between actual observations.

## Other limits and disposition

The protocol permits configured `maxRotationPerSubstep <= pi/4`; runtime calibration/runner must enforce the selected limit. The proposed formulas are valid for every selected shortest-arc angle in `[0,pi]`, so the pure fact helper need not trust an unverified external limit. Observation endpoints still must be actual bounded Havok substeps per the packet. A larger observed interval is mathematically bounded by the formulas but does not prove continuous physical motion beyond F01's interpolation model.

The coordinator reported hosted lint run `38084915701` is blocked by an unsafe `any` assignment at `games/counterball/src/simulation/facts.ts:221`. This report did not run checks or change source; any later implementation packet must include or separately own that lint cleanup. Required F01 hosted verification remains `pnpm --filter @korre/counterball test && pnpm --filter @korre/counterball typecheck && pnpm verify`, with full exact-SHA logs and counts. No hosted/runtime result is claimed here.

Because repair 2 exhausted its source-repair allowance, independent review of this math report must precede any new implementation packet. Parent T02 and F01 remain unaccepted.
