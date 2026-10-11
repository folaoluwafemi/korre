# T02-BR02-MASS-READBACK-1 amended scope review

**Verdict: SOURCE PASS for the amended first-failing-body scope.** The unchanged two-file diff formats the first mass rejection with body ID, configured mass, native readback, absolute difference, and existing tolerance. It does not change the guard. The amendment explicitly defers and disclaims cap outcomes.

**Runtime: NOT RUN.** No app checks, build, browser, physics, or deployment checks were run. The formatter test was inspected but not executed.

## Findings

The amendment resolves the prior review’s finding at the scope level. The original CHANGES_REQUIRED report correctly observed that readBodyMetrics traverses ENTITY_IDS and immediately throws at the first mass mismatch, so a button rejection prevents later cap reads. The amended packet now limits this card to the first failing body, identifies the current button-first order, and expressly says cap masses are unmeasured and cannot be inferred; a separate evidence step is required for any cap claim or repair. The amended negative case also forbids inferring or accepting a cap mass result.

That ordering is supported by packages/game-protocol/src/schemas.ts:100–116, where ENTITY_IDS is ["button", ...CAP_IDS], and by games/counterball/src/simulation/browserDirectProbe.ts:640–642 and 733–736, where fail throws and readBodyMetrics iterates ENTITY_IDS. Therefore the first mass mismatch in the present diagnostic order is the button, assuming earlier non-mass validation does not already abort.

The scoped diff changes only games/counterball/src/simulation/browserDirectProbe.ts and games/counterball/src/simulation/browserDirectProbe.test.ts. In browserDirectProbe.ts:811–824, the pre-existing tolerance expression remains Number.EPSILON * Math.max(1, definition.expectedMass) * 64 and the guard remains Math.abs(nativeMass - definition.expectedMass) > expectedMassTolerance. The failure still uses resourceLimit. The new formatter at lines 51–59 only formats the body ID, expected/configured mass, native mass, computed absolute difference, and the same tolerance passed by the rejection branch. String(number) preserves shortest round-trip numeric text for these finite values. It does not normalize, round, or feed a replacement value into the guard.

The focused test at browserDirectProbe.test.ts:22–34 asserts the exact message for body button and supplied values 0.15, 0.15000000000000002, and 1.4210854715202004e-14; it checks the resulting absolute difference 2.7755575615628914e-17. These are formatter test inputs only, not observed Havok values. The implementation report likewise makes no runtime readback claim.

The scope amendment and packet defer cap outcomes explicitly, and this code makes no cap assertion. One evidence criterion remains for the later hosted run: the amended packet requires the browser artifact to explicitly state that later cap checks were unmeasured. The formatter’s current message reports only the failing body and numeric values; it does not itself include that caveat. No runtime artifact was produced or inspected in this source review, so that separate artifact criterion remains unverified. The coordinator’s exact-run report must preserve the cap limitation to meet it.

The exact packet extraction returned plan-consistency PASS with initialReady empty; execution_state/tasks.json records this packet as REVIEWING, so the checker does not offer it as ready for a new dispatch. This is status output only, not implementation or runtime evidence.
