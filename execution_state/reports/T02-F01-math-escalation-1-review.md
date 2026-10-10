# T02-F01 math escalation 1 independent review

Verdict: PASS

The sole expression/notation issue is resolved by the author's report-only correction. The rotational-support proof and hidden-clearance counterexample independently reproduce, including the current false certificate. This is design analysis only; it neither accepts F01/T02 nor authorizes a source repair.

## Exact inspected inputs and method

I read only `execution_state/packets/T02-F01-math-escalation-1.md`, its design report, and the referenced current regions of `games/counterball/src/simulation/facts.ts`: symmetry-axis/support formulas at lines 312–346; interpolation at 422–472; current angular/support bound at 475–520; midpoint pruning at 575–587. Read-only file commands exited 0.

I independently derived the equations below and evaluated scalar/quaternion arithmetic in the tool's JavaScript isolate. I did not import/execute application modules or run application commands, tests, builds, typechecks, lint, formatters, browsers, physics or services. Only this assigned review report was written.

## Original finding — resolved

In the author's “pi/4 small-circle comparison” section, the fixture defines

`delta(t) = 2 asin(sin(beta) sin(theta*abs(t-epsilon)/2))`.

It then writes the current bound as `rho*delta(1)*1.013052... = 0.00101092709`. That expression is inconsistent with the preceding definition. `delta(1)` measures separation from the alignment pose at `t=epsilon`, whereas the current source computes separation between the two endpoint axes.

The corrected expression, now present in the author report, is:

`DeltaEndpoints = 2 asin(sin(beta) sin(theta/2))`

`Lcurrent = rho * DeltaEndpoints * (4 tan(theta/4)/theta)`.

With the report's fixture values, this is **0.0010109270906502868**, matching its reported numerical value. The historical expression using `delta(1)` referred to a different angle. The corrected report explicitly distinguishes endpoint-to-endpoint `deltaEndpoint` from the alignment-relative `delta(t)`. The conclusion remains unchanged.

On scoped re-review, I independently reevaluated the corrected expression from the parameter definitions, without relying on the historical optional `rho*delta(1)` estimate. I obtained `deltaEndpoint=0.0076535597668816015`, `L=0.0010109270906502868`, `f(.5)=0.0005065487523203243`, and `f(.5)-L/2=1.0852069951809316e-6`. The hidden clearance remains `f(epsilon)=-1e-7`. All agree with the corrected report's rounding. The midpoint false certificate therefore still holds. No additional mathematical blocker was found.

## Independently checked derivation

- The active Hamilton `{x,y,z,w}` convention matches `verticalAxis`: it is `R(q)e_y`, the world-space local y axis. Shortest-arc sign selection matches the actual interpolation's negative-dot flip. `q1' * conjugate(q0)` is the world relative rotation; its Rodrigues orbit gives symmetry-axis speed `s*abs(psi')` with `s=|u cross v0|`. At a pi tie, the selected sign determines the path but does not invalidate the bound.
- SLERP gives constant physical rate `theta` and axis path length `theta*s*(b-a)` on `[a,b]`. The endpoint axis separation is generally shorter than this small-circle path; treating it as path length is unsound.
- For normalized lerp, with `alpha=theta/2`, differentiating `atan2(t sin(alpha),1-t+t cos(alpha))` gives `sin(alpha)/(1-2t(1-t)(1-cos(alpha)))`. The minimum denominator is `cos²(alpha/2)`, so maximum physical rate is `4 tan(theta/4)`. Multiplication by `s` bounds the parameterized axis speed. This matches the actual near-identical branch at dot >0.9995; it does not assume constant NLERP speed.
- The centered finite-cylinder support is `r sqrt(1-mu²)+cH abs(mu)`. Rotating one axis to another maps the axisymmetric cylinder onto the other and moves each point by at most `rho*delta`, where `rho=hypot(r,cH)`. The Hausdorff/support inequality therefore bounds support change without differentiating at alignment/tie points. The sharper coefficient `max(r,cH)` also follows from the piecewise derivative and bounded one-sided slopes. Both cover the nonsmooth parallel/perpendicular cases.
- Adding absolute linear centre-coordinate travel to the support-motion bound yields a Lipschitz constant in the normalized interpolation parameter. Midpoint minus `L*intervalWidth/2` is then a valid lower certificate when L is genuinely conservative. Zero-angle handling, near-zero outward rounding/fallback and explicit rejection of uncertain/nonfinite bounds remain necessary implementation obligations. The report does not claim a floating-point implementation proof for those future branches.

## Independent numerical reproduction

For theta=pi/4 and beta=.01:

| Quantity | Independent value |
|---|---:|
| SLERP axis path `theta*sin(beta)` | 0.00785385073493508 |
| Endpoint axis angle | 0.0076535597668816015 |
| NLERP-rate multiplier | 1.0130523683386767 |
| Endpoint angle times multiplier | 0.007753456848061017 |

The multiplier still understates actual axis path. The author's default-aspect-ratio caveat is accurate: its limiting combined factors reproduce as 1.0018920423749025 for the default button and 1.00441831999121 for the default cap. This accidental margin is not a general path-length proof.

For the test-only r=.13, half-height=.01, epsilon=.0005 and eta=1e-7 fixture:

| t | `H(t)-H(epsilon)-eta` |
|---:|---:|
| 0 | 4.105002173870499e-7 |
| .0005 | -1e-7 |
| .5 | 0.0005065487523203243 |
| 1 | 0.0009940888006346367 |

Using the corrected endpoint expression gives `f(.5)-Lcurrent/2 = +1.0852069951809316e-6`. Thus the current midpoint branch declares the whole interval clear despite the negative hidden clearance. The sharper support-safe bound `r*theta*sin(beta) = 0.0010210005955415605` gives a negative lower bound, -3.951545450455937e-6, requiring further search.

I also constructed the two Hamilton quaternions from `Rot(u,-theta*epsilon)*Rz(-pi/2)` and `Rot(u,theta*(1-epsilon))*Rz(-pi/2)`, applied the actual source's sign/SLERP/normalization and support formulas as independent arithmetic, and obtained endpoint axis angle 0.0076535597668163525, current L=0.0010109270906416682 and midpoint lower bound +1.0852069966799495e-6. At alignment the clearance remains -1e-7. This independently confirms the frame conventions and false certificate rather than relying only on the scalar construction.

## Disposition and limits

The scoped correction resolves the only required change; the design report passes independent review. The proof supports a separately authorized implementation packet using parameterized axis speed, conservative numeric handling and adversarial regressions. This report does not certify root-isolation completeness, ordinary-motion performance, real continuous Havok travel, enforcement of all substep guards, or a production calibration. Those require later source review and exact-head hosted/runtime evidence. No application check result is claimed.
