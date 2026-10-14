import type { Vec3 } from "@korre/game-protocol";

/** Returns the farthest-point radius for an already validated local Y cylinder. */
export function nativeCylinderComRadius(
  bounds: Readonly<{
    minimum: Vec3;
    maximum: Vec3;
    dimensions: Vec3;
  }>,
  centerOfMassLocal: Vec3,
): number {
  const values = [
    bounds.minimum.x,
    bounds.minimum.y,
    bounds.minimum.z,
    bounds.maximum.x,
    bounds.maximum.y,
    bounds.maximum.z,
    bounds.dimensions.x,
    bounds.dimensions.y,
    bounds.dimensions.z,
    centerOfMassLocal.x,
    centerOfMassLocal.y,
    centerOfMassLocal.z,
  ];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("Native cylinder bounds and COM must be finite.");
  }

  const spanX = bounds.maximum.x - bounds.minimum.x;
  const spanY = bounds.maximum.y - bounds.minimum.y;
  const spanZ = bounds.maximum.z - bounds.minimum.z;
  if (
    !Number.isFinite(spanX) ||
    !Number.isFinite(spanY) ||
    !Number.isFinite(spanZ) ||
    spanX <= 0 ||
    spanY <= 0 ||
    spanZ <= 0 ||
    spanX !== bounds.dimensions.x ||
    spanY !== bounds.dimensions.y ||
    spanZ !== bounds.dimensions.z
  ) {
    throw new RangeError(
      "Native cylinder bounds have invalid or inconsistent dimensions.",
    );
  }

  const centerX = bounds.minimum.x + spanX / 2;
  const centerY = bounds.minimum.y + spanY / 2;
  const centerZ = bounds.minimum.z + spanZ / 2;
  const offsetX = centerOfMassLocal.x - centerX;
  const offsetY = centerOfMassLocal.y - centerY;
  const offsetZ = centerOfMassLocal.z - centerZ;
  const radius = Math.max(spanX, spanZ) / 2;
  const radialReach = radius + Math.hypot(offsetX, offsetZ);
  const verticalReach = spanY / 2 + Math.abs(offsetY);
  const farthestPointRadius = Math.hypot(radialReach, verticalReach);
  if (
    !Number.isFinite(centerX) ||
    !Number.isFinite(centerY) ||
    !Number.isFinite(centerZ) ||
    !Number.isFinite(offsetX) ||
    !Number.isFinite(offsetY) ||
    !Number.isFinite(offsetZ) ||
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(radialReach) ||
    !Number.isFinite(verticalReach) ||
    !Number.isFinite(farthestPointRadius) ||
    farthestPointRadius <= 0
  ) {
    throw new RangeError(
      "Native cylinder COM radius calculation is non-finite or nonpositive.",
    );
  }
  return farthestPointRadius;
}
