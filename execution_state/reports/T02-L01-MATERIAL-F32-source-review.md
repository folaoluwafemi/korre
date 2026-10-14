# T02-L01-MATERIAL-F32-1 source review

**Source verdict: PASS. Runtime/hosted verification: NOT RUN.** This review does not accept the implementation card, MATRIX-1, or T02.

The exact packet extraction passed plan consistency. Its listed source scope is exactly the three reviewed paths. Independently recomputed SHA-256 digests match the implementation report:

| File | SHA-256 |
| --- | --- |
| `games/counterball/src/simulation/loftCoarseRunner.ts` | `f7eb6b3b03a8ee46aec53d37a404a30847f4e5fbf52a0e612902bbdfb6197b52` |
| `games/counterball/src/simulation/loftCoarseProbe.ts` | `d9c903e1640f94f7894f8543e5697950bda124ad8cb58a1baebe0fa94fb68913` |
| `games/counterball/src/simulation/loftCoarseProbe.test.ts` | `79a6760297bb0a9af56b592531e8aceebdd9c6639224457300f147740e0c5f9b` |

The current diffs in these paths are limited to the requested material comparison, metadata validation, and fixture/writer-test changes. In `loftCoarseRunner.ts:389–397`, the configured decimal values are still assigned directly and the native getter is read as before. At lines 398–412, each numeric readback uses `matchesExactFloat32Projection(setter[key], readback[key])`; the helper is the strict finite `Math.fround` projection check. Any mismatch still throws through `resourceFailure` before returning the facts. `materialValues` retains its finite/range and supported-mode checks. Lines 413–426 keep both combine strings on strict equality and return the original setter/readback objects, without replacing either with projected numbers.

The full native preflight remains before impulse: `readNativeBodies` collects materials at lines 939 and 1069; its result is obtained at line 1464; the impulse occurs later at line 1673. Thus the new exact representation policy fails closed before an impulse. The runner’s native readback facts remain raw: `materialRow` copies `value.setter` and `value.readback` at lines 729–739, and static facts use `material.readback` at lines 1123–1134.

In `loftCoarseProbe.ts:591–615`, material records still require the exact existing keys, finite numeric values, and nonempty combine names. `assertConfiguredMaterial` at lines 617–627 keeps all setter numbers and both strings strictly equal to the frozen guard values. `assertNativeMaterialReadback` at lines 629–647 requires each numeric field to equal the exact projection of its corresponding setter and both combine strings to equal the frozen names. Case validation applies those checks separately to setter and raw readback at lines 846–869. For every static body, lines 907–929 find its `shapeIndex: 0` record, validate the body material against that record’s setter, and then compare all five body fields exactly to the matching raw readback. The validator does not mutate or project stored metadata.

The writer fixture now keeps configured setters and uses projected numeric raw readbacks at `loftCoarseProbe.test.ts:115–125` and 161–179. The positive writer case at lines 528–578 parses serialized output and checks that the configured setter remains unchanged, all three projected numeric readbacks survive JSON, the combine mode remains present, and the support body material equals its matching raw readback. The negative case at lines 580–609 constructs the adjacent Float32 value by incrementing the positive projection’s bit pattern and requires the writer to reject it with `code: "invalid"`. No test was run for this review.

The independent revised packet review at `execution_state/reports/T02-L01-MATERIAL-F32-packet-review-2.md` is PASS. The current lightweight checker reports overall plan consistency PASS and this packet `ready:false`. In `execution_state/tasks.json`, `T01` is `ACCEPTED` and this packet is `IMPLEMENTED`; the inherited `required_parent_acceptance: [T01]` is not an unmet dependency. The checker’s `initialReady: []` is expected for a card already implemented, not evidence that T01 is outstanding. The implementation report’s `ready:true` records its earlier pre-dispatch snapshot. Also, `CONTRACT_WORK.md` still labels the material amendment “proposed” and “pending independent review,” despite the saved independent PASS report. Reconcile that shared contract status before coordinator acceptance. This documentation discrepancy does not change the source verdict.

No install, typecheck, lint, unit test, build, browser, or physics command ran during this review. Runtime and hosted checks remain NOT RUN.
