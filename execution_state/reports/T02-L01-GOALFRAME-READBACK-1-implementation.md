# T02-L01-GOALFRAME-READBACK-1 implementation

**Source result: implemented within packet scope.**
**Hosted/runtime verification: pending; no matrix or playability acceptance.**

The saved pre-dispatch extraction is execution_state/reports/T02-L01-GOALFRAME-READBACK-1-pre-dispatch-extraction.txt and records verdict PASS, the packet as the sole initialReady item, and ready:true. The independent packet review at execution_state/reports/T02-L01-GOALFRAME-READBACK-1-packet-review.md is PASS. The current packet checker snapshot is plan-consistent; its ready:false is expected because the card is already RUNNING.

In games/counterball/src/simulation/loftCoarseRunner.ts, the static-body loop now calls shapeBoundsAndDimensions(shape) once and uses that returned dimensions for its existing branches and strict checks. Only the existing goal-frame dimension mismatch text is extended with JSON containing the body id, shape.type, configured goal width/height/frame radius, the existing expected dimensions, native local AABB minimum and maximum, and observed dimensions from that same read.

The goal-frame cylinder-type check, exact X/Y/Z equality predicate, support-apron checks, native filter/density guards, error code, and failure order are unchanged. The readback failure remains in readNativeBodies, before the runner can apply an impulse or call executeStep. No tolerance, projection, geometry, physics, protocol, or artifact-schema change was made. This is diagnostic disclosure only; the matrix remains unaccepted.

Validation actually run:

- node scripts/check-completion-plan.mjs --packet T02-L01-GOALFRAME-READBACK-1 — plan consistency PASS; current RUNNING state reports ready:false. The saved pre-dispatch extraction remains the readiness evidence.
- git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts — exit code 0.
- No local app install/build/typecheck/lint/test/browser/physics command was run. Hosted verification and independent source/run review remain pending.

Current runner SHA-256: 5EF42B9F2441B8DD2CAE967DEC028BC2862D02D61C25625D8983AE1202040BB6.

Bounded source diff:

~~~diff
@@ static-body loop
-    const dimensions = shapeDimensions(shape);
+    const nativeBounds = shapeBoundsAndDimensions(shape);
+    const dimensions = nativeBounds.dimensions;
@@ existing goal-frame mismatch
-          `Goal frame collider ${id} dimensions differ from canonical geometry.`,
+          `Goal frame collider ${id} dimensions differ from canonical geometry. ${JSON.stringify(
+            {
+              id,
+              shapeType: shape.type,
+              configured: {
+                goalWidth: geometry.goalWidth,
+                goalHeight: geometry.goalHeight,
+                goalFrameRadius: geometry.goalFrameRadius,
+              },
+              expectedDimensions: expected,
+              nativeLocalAabb: {
+                minimum: nativeBounds.minimum,
+                maximum: nativeBounds.maximum,
+              },
+              observedDimensions: dimensions,
+            },
+          )}`,
         );
~~~
