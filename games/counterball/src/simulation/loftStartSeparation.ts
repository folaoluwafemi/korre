import type { Vec3 } from "@korre/game-protocol";

/** Returns the greatest distance from the origin to any native AABB corner. */
export function nativeAabbOriginRadius(
  bounds: Readonly<{ minimum: Vec3; maximum: Vec3 }>,
): number {
  const coordinates = [
    bounds.minimum.x,
    bounds.minimum.y,
    bounds.minimum.z,
    bounds.maximum.x,
    bounds.maximum.y,
    bounds.maximum.z,
  ];
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    throw new RangeError("Native AABB bounds must be finite.");
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
    spanZ <= 0
  ) {
    throw new RangeError("Native AABB bounds must have finite positive spans.");
  }

  let farthestOriginRadius = 0;
  for (const x of [bounds.minimum.x, bounds.maximum.x]) {
    for (const y of [bounds.minimum.y, bounds.maximum.y]) {
      for (const z of [bounds.minimum.z, bounds.maximum.z]) {
        farthestOriginRadius = Math.max(
          farthestOriginRadius,
          Math.hypot(x, y, z),
        );
      }
    }
  }
  if (!Number.isFinite(farthestOriginRadius) || farthestOriginRadius <= 0) {
    throw new RangeError(
      "Native AABB origin radius must be finite and positive.",
    );
  }
  return farthestOriginRadius;
}

/** Tests the existing strict whole-button-before-obstacle start condition. */
export function isLoftStartSeparated(
  buttonPositionZ: number,
  buttonOriginRadius: number,
  obstaclePositionZ: number,
  obstacleOriginRadius: number,
): boolean {
  if (
    !Number.isFinite(buttonPositionZ) ||
    !Number.isFinite(buttonOriginRadius) ||
    buttonOriginRadius <= 0 ||
    !Number.isFinite(obstaclePositionZ) ||
    !Number.isFinite(obstacleOriginRadius) ||
    obstacleOriginRadius <= 0
  ) {
    throw new RangeError(
      "Loft start positions and radii must be finite and valid.",
    );
  }

  const buttonFrontZ = buttonPositionZ + buttonOriginRadius;
  const obstacleBackZ = obstaclePositionZ - obstacleOriginRadius;
  if (!Number.isFinite(buttonFrontZ) || !Number.isFinite(obstacleBackZ)) {
    throw new RangeError("Loft start endpoint arithmetic must remain finite.");
  }
  return buttonFrontZ < obstacleBackZ;
}
