import type { Vec3 } from "@korre/game-protocol";

type NativeCylinderBounds = Readonly<{
  minimum: Vec3;
  maximum: Vec3;
  dimensions: Vec3;
}>;

/** Derive a conservative COM floor from one validated native local AABB. */
export function deriveNativeCylinderSupportDatum(
  bounds: NativeCylinderBounds,
  nativeCOM: Vec3,
  supportReferenceY: number,
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
    nativeCOM.x,
    nativeCOM.y,
    nativeCOM.z,
    supportReferenceY,
  ];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("Native support datum inputs must be finite.");
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
    spanZ !== bounds.dimensions.z ||
    bounds.minimum.x !== -bounds.maximum.x ||
    bounds.minimum.y !== -bounds.maximum.y ||
    bounds.minimum.z !== -bounds.maximum.z ||
    spanX !== spanZ
  ) {
    throw new RangeError(
      "Native cylinder bounds must be finite, centered, and dimensionally consistent.",
    );
  }

  const radius = spanX / 2;
  const halfHeight = spanY / 2;
  const centerOfMassMagnitude = Math.hypot(
    nativeCOM.x,
    nativeCOM.y,
    nativeCOM.z,
  );
  const supportExtent = Math.min(radius, halfHeight);
  const supportDatumY =
    supportReferenceY + supportExtent - centerOfMassMagnitude;
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(halfHeight) ||
    halfHeight <= 0 ||
    !Number.isFinite(centerOfMassMagnitude) ||
    !Number.isFinite(supportExtent) ||
    !Number.isFinite(supportDatumY)
  ) {
    throw new RangeError("Native support datum calculation is non-finite.");
  }
  return supportDatumY;
}
