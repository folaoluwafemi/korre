import type { Vec3 } from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import { nativeCylinderComRadius } from "./nativeCylinderRadius.js";

function nativeBounds(minimum: Vec3, maximum: Vec3) {
  return {
    minimum,
    maximum,
    dimensions: {
      x: maximum.x - minimum.x,
      y: maximum.y - minimum.y,
      z: maximum.z - minimum.z,
    },
  };
}

describe("native Y-cylinder COM radius", () => {
  it("excludes the impossible square corners of a centered AABB", () => {
    const bounds = nativeBounds(
      { x: -2, y: -1, z: -2 },
      { x: 2, y: 1, z: 2 },
    );

    const radius = nativeCylinderComRadius(bounds, { x: 0, y: 0, z: 0 });
    expect(radius).toBe(Math.hypot(2, 1));
    expect(radius).toBeLessThan(3);
  });

  it("uses the translated bounds center and a diagonal COM offset", () => {
    const bounds = nativeBounds(
      { x: 10, y: -4, z: 7 },
      { x: 14, y: -2, z: 11 },
    );

    expect(nativeCylinderComRadius(bounds, { x: 13, y: -1, z: 10 })).toBe(
      Math.hypot(2 + Math.hypot(1, 1), 3),
    );
  });

  it("accounts for vertical COM offset and contains sampled endcap rims", () => {
    const bounds = nativeBounds(
      { x: -2, y: -1, z: -2 },
      { x: 2, y: 1, z: 2 },
    );
    expect(nativeCylinderComRadius(bounds, { x: 0, y: 5, z: 0 })).toBe(
      Math.hypot(2, 6),
    );

    const centeredRadius = nativeCylinderComRadius(bounds, {
      x: 0,
      y: 0,
      z: 0,
    });
    const endcapRimSamples: readonly Vec3[] = [
      { x: 2, y: -1, z: 0 },
      { x: 0, y: -1, z: 2 },
      { x: -2, y: -1, z: 0 },
      { x: 0, y: -1, z: -2 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 1, z: 2 },
      { x: -2, y: 1, z: 0 },
      { x: 0, y: 1, z: -2 },
    ];
    for (const point of endcapRimSamples) {
      expect(Math.hypot(point.x, point.y, point.z)).toBeLessThanOrEqual(
        centeredRadius,
      );
    }
  });

  it("rejects non-finite, reversed, zero, inconsistent, and overflowing inputs", () => {
    const valid = nativeBounds(
      { x: -1, y: -1, z: -1 },
      { x: 1, y: 1, z: 1 },
    );
    const centeredCom = { x: 0, y: 0, z: 0 };
    const invalidInputs: readonly [ReturnType<typeof nativeBounds>, Vec3][] = [
      [
        nativeBounds({ x: Number.NaN, y: -1, z: -1 }, valid.maximum),
        centeredCom,
      ],
      [valid, { x: 0, y: 0, z: Number.POSITIVE_INFINITY }],
      [nativeBounds({ x: 2, y: -1, z: -1 }, valid.maximum), centeredCom],
      [nativeBounds({ x: -1, y: 1, z: -1 }, valid.maximum), centeredCom],
      [{ ...valid, dimensions: { x: 0, y: 2, z: 2 } }, centeredCom],
      [
        nativeBounds(
          { x: -Number.MAX_VALUE, y: -1, z: -1 },
          { x: Number.MAX_VALUE, y: 1, z: 1 },
        ),
        centeredCom,
      ],
      [valid, { x: 1.3e308, y: 1.3e308, z: 0 }],
    ];

    for (const [bounds, centerOfMassLocal] of invalidInputs) {
      expect(() =>
        nativeCylinderComRadius(bounds, centerOfMassLocal),
      ).toThrow(RangeError);
    }
  });
});
