# T02-L01-GEOMETRY-READBACK-1 implementation

Implemented the assigned diagnostic-detail change in `games/counterball/src/simulation/loftCoarseRunner.ts` only.

The dynamic-body dimension preflight now takes one AABB snapshot through `shapeBoundsAndDimensions`. It copies the raw local minimum and maximum and computes dimensions from those copies. The same returned object supplies the strict dimension comparison and, on mismatch, the error details: body ID, native shape type, configured radius/height, expected dimensions, raw minimum/maximum, and observed dimensions. The canonical cylinder shape-type check, exact equality conditions, native material checks, `resourceLimit` failure path, and pre-impulse ordering are unchanged. Other `shapeDimensions` callers keep their prior behavior through the wrapper around the same helper.

Exact source diff:

```diff
diff --git a/games/counterball/src/simulation/loftCoarseRunner.ts b/games/counterball/src/simulation/loftCoarseRunner.ts
index fb69848..163fcab 100644
--- a/games/counterball/src/simulation/loftCoarseRunner.ts
+++ b/games/counterball/src/simulation/loftCoarseRunner.ts
@@ -426,12 +426,26 @@ function setAndReadMaterial(
   return { setter, readback };
 }

-function shapeDimensions(shape: PhysicsShape): Vec3 {
+function shapeBoundsAndDimensions(shape: PhysicsShape): {
+  minimum: Vec3;
+  maximum: Vec3;
+  dimensions: Vec3;
+} {
   const bounds = shape.getBoundingBox();
+  const minimum = {
+    x: bounds.minimum.x,
+    y: bounds.minimum.y,
+    z: bounds.minimum.z,
+  };
+  const maximum = {
+    x: bounds.maximum.x,
+    y: bounds.maximum.y,
+    z: bounds.maximum.z,
+  };
   const dimensions = {
-    x: bounds.maximum.x - bounds.minimum.x,
-    y: bounds.maximum.y - bounds.minimum.y,
-    z: bounds.maximum.z - bounds.minimum.z,
+    x: maximum.x - minimum.x,
+    y: maximum.y - minimum.y,
+    z: maximum.z - minimum.z,
   };
   if (
     !finiteVector(dimensions) ||
@@ -441,7 +455,11 @@ function shapeDimensions(shape: PhysicsShape): Vec3 {
   ) {
     throw resourceFailure("A native collider has unsupported dimensions.");
   }
-  return dimensions;
+  return { minimum, maximum, dimensions };
+}
+
+function shapeDimensions(shape: PhysicsShape): Vec3 {
+  return shapeBoundsAndDimensions(shape).dimensions;
 }

 function radiiFromBounds(
@@ -945,7 +963,8 @@ function readNativeBodies(world: CounterballWorld): {
         `Dynamic body ${id} has invalid native collision filters.`,
       );
     }
-    const dimensions = shapeDimensions(shape);
+    const nativeBounds = shapeBoundsAndDimensions(shape);
+    const dimensions = nativeBounds.dimensions;
     const isButton = id === "button";
     const configuredRadius = isButton
       ? geometry.buttonRadius
@@ -953,15 +972,33 @@ function readNativeBodies(world: CounterballWorld): {
     const configuredHeight = isButton
       ? geometry.buttonThickness
       : geometry.capHeight;
+    const expectedDimensions = {
+      x: configuredRadius * 2,
+      y: configuredHeight,
+      z: configuredRadius * 2,
+    };
     const radius = Math.max(dimensions.x, dimensions.z) / 2;
     const height = dimensions.y;
     if (
-      dimensions.x !== configuredRadius * 2 ||
-      dimensions.z !== configuredRadius * 2 ||
-      height !== configuredHeight
+      dimensions.x !== expectedDimensions.x ||
+      dimensions.z !== expectedDimensions.z ||
+      height !== expectedDimensions.y
     ) {
       throw resourceFailure(
-        `Dynamic body ${id} native dimensions differ from canonical cylinder geometry.`,
+        `Dynamic body ${id} native dimensions differ from canonical cylinder geometry. ${JSON.stringify(
+          {
+            bodyId: id,
+            nativeShapeType: shape.type,
+            configuredRadius,
+            configuredHeight,
+            expectedDimensions,
+            nativeLocalAabb: {
+              minimum: nativeBounds.minimum,
+              maximum: nativeBounds.maximum,
+            },
+            observedDimensions: dimensions,
+          },
+        )}`,
       );
     }
     const properties = body.getMassProperties();
```

The exact source SHA-256 before editing was `f7eb6b3b03a8ee46aec53d37a404a30847f4e5fbf52a0e612902bbdfb6197b52`; after editing it is `ac28c7d847da1a622a832af340a5103f94e511c07714503f0b29667d1c363b54`.

The only local source check allowed by the packet was run:

```text
git diff --check -- games/counterball/src/simulation/loftCoarseRunner.ts
PASS, exit 0
```

No install, build, typecheck, lint, test, browser, physics or hosted command was run. This report does not claim runtime acceptance, MATRIX-1 acceptance, T02 acceptance or playability. The implementation is stopped for independent `/root/executor_type_review`.
