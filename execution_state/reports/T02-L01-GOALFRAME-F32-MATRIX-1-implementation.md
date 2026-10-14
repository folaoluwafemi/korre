# T02-L01-GOALFRAME-F32-MATRIX-1 implementation

**Source result: implemented within the two assigned paths. Hosted matrix/runtime verification: NOT RUN; no matrix acceptance is claimed.**

The saved pre-dispatch extraction at execution_state/reports/T02-L01-GOALFRAME-F32-MATRIX-1-pre-dispatch-extraction.txt records PASS, `ready:true`, and this packet as the sole initial-ready card. Its independent packet review is PASS at execution_state/reports/T02-L01-GOALFRAME-F32-MATRIX-1-packet-review.md. The current checker snapshot is plan-consistent and reports `ready:false` because the packet is already RUNNING. The accepted contract acceptance is execution_state/reports/T02-L01-GOALFRAME-F32-contract-acceptance-1.md; the corrected proposal review is PASS.

In games/counterball/src/simulation/loftCoarseRunner.ts, only the existing goal-frame X/Y/Z strict comparisons now call `matchesExactFloat32Projection(expectedAxis, observedAxis)`. Expected upright/crossbar formulas and the CYLINDER check are unchanged. Expected values are projected from configured spans; observed dimensions are never rounded. Existing failure JSON, raw native readback, apron and all other guards remain unchanged.

In games/counterball/src/simulation/loftCoarseProbe.test.ts, a focused test derives upright and crossbar dimensions from the canonical geometry config, asserts the expected tuples, and checks every axis. It accepts only `Math.fround(configured)`, rejects the original configured double, and rejects both immediate Float32 neighbors. It changes no public API or runner behavior.

Validation actually run:

- `node scripts/check-completion-plan.mjs --packet T02-L01-GOALFRAME-F32-MATRIX-1` — plan consistency PASS; this active RUNNING card correctly reports `ready:false`. The saved pre-dispatch extraction is the readiness evidence.
- `git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts games/counterball/src/simulation/loftCoarseProbe.test.ts` — exit code 0.
- No local app install/build/typecheck/lint/test/browser/physics command ran. All application verification remains for GitHub.

Source SHA-256 values:

- `games/counterball/src/simulation/loftCoarseRunner.ts`: `30CBB8D4C29A61063685198EAC8E6FC1F82D0E1A91A0D524F436D1A7BD89FDC6`
- `games/counterball/src/simulation/loftCoarseProbe.test.ts`: `31625E4DD89A79C6DBDB758945490DC0D6539988D9E1C59ACAE5AC3126509406`

Bounded source diff:

~~~diff
--- runner: goal-frame comparison only
       if (
-        dimensions.x !== expected.x ||
-        dimensions.y !== expected.y ||
-        dimensions.z !== expected.z
+        !matchesExactFloat32Projection(expected.x, dimensions.x) ||
+        !matchesExactFloat32Projection(expected.y, dimensions.y) ||
+        !matchesExactFloat32Projection(expected.z, dimensions.z)
       ) {

--- test: new goal-frame projection case
+  it("matches only exact Float32 projections for goal-frame spans", () => {
+    const geometry = COUNTERBALL_CONFIG_V1.geometry;
+    const frameDimensions = [
+      {
+        kind: "upright",
+        dimensions: {
+          x: geometry.goalFrameRadius * 2,
+          y: geometry.goalHeight,
+          z: geometry.goalFrameRadius * 2,
+        },
+      },
+      {
+        kind: "crossbar",
+        dimensions: {
+          x: geometry.goalWidth,
+          y: geometry.goalFrameRadius * 2,
+          z: geometry.goalFrameRadius * 2,
+        },
+      },
+    ] as const;
+
+    expect(frameDimensions.map(({ dimensions }) => dimensions)).toEqual([
+      { x: 0.12, y: 0.8, z: 0.12 },
+      { x: 2.4, y: 0.12, z: 0.12 },
+    ]);
+    for (const { dimensions } of frameDimensions) {
+      for (const axis of ["x", "y", "z"] as const) {
+        const configured = dimensions[axis];
+        const projected = Math.fround(configured);
+        const view = new DataView(
+          new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT),
+        );
+        view.setFloat32(0, projected);
+        const projectedBits = view.getUint32(0);
+        const adjacentValues = [-1, 1].map((offset) => {
+          const adjacentView = new DataView(
+            new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT),
+          );
+          adjacentView.setUint32(0, projectedBits + offset);
+          return adjacentView.getFloat32(0);
+        });
+
+        expect(projected).not.toBe(configured);
+        expect(matchesExactFloat32Projection(configured, projected)).toBe(
+          true,
+        );
+        expect(matchesExactFloat32Projection(configured, configured)).toBe(
+          false,
+        );
+        for (const adjacent of adjacentValues) {
+          expect(adjacent).not.toBe(projected);
+          expect(Math.fround(adjacent)).toBe(adjacent);
+          expect(matchesExactFloat32Projection(configured, adjacent)).toBe(
+            false,
+          );
+        }
+      }
+    }
+  });
~~~
