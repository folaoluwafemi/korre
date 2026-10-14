import type { Vec3 } from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import {
  isLoftStartSeparated,
  nativeAabbOriginRadius,
} from "./loftStartSeparation.js";

function bounds(minimum: Vec3, maximum: Vec3) {
  return { minimum, maximum };
}

describe("native AABB origin radius", () => {
  it("uses the greatest of the eight corner distances", () => {
    expect(
      nativeAabbOriginRadius(
        bounds({ x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 }),
      ),
    ).toBe(Math.hypot(1, 1, 1));
  });

  it("handles asymmetric bounds whose farthest corner has mixed signs", () => {
    expect(
      nativeAabbOriginRadius(
        bounds({ x: -4, y: -7, z: -2 }, { x: 2, y: 1, z: 5 }),
      ),
    ).toBe(Math.hypot(-4, -7, 5));
  });

  it("rejects non-finite, zero-span, reversed, and overflowing bounds", () => {
    const invalidBounds = [
      bounds({ x: Number.NaN, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }),
      bounds({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }),
      bounds({ x: 2, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }),
      bounds(
        { x: -Number.MAX_VALUE, y: -1, z: -1 },
        { x: Number.MAX_VALUE, y: 1, z: 1 },
      ),
      bounds(
        { x: Number.MAX_VALUE / 2, y: Number.MAX_VALUE / 2, z: 0 },
        { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: 1 },
      ),
    ];

    for (const invalid of invalidBounds) {
      expect(() => nativeAabbOriginRadius(invalid)).toThrow(RangeError);
    }
  });
});

describe("loft start separation", () => {
  it("accepts a strictly separated start", () => {
    expect(isLoftStartSeparated(0, 0.5, 2, 0.5)).toBe(true);
  });

  it("rejects touching and overlapping starts at the strict boundary", () => {
    expect(isLoftStartSeparated(0, 1, 2, 1)).toBe(false);
    expect(isLoftStartSeparated(0, 1, 1.5, 1)).toBe(false);
  });

  it("rejects invalid values and overflowing endpoints", () => {
    const invalidInputs: readonly [number, number, number, number][] = [
      [Number.NaN, 1, 3, 1],
      [0, 0, 3, 1],
      [0, -1, 3, 1],
      [0, 1, Number.POSITIVE_INFINITY, 1],
      [Number.MAX_VALUE, Number.MAX_VALUE, 0, 1],
      [0, 1, -Number.MAX_VALUE, Number.MAX_VALUE],
    ];

    for (const input of invalidInputs) {
      expect(() => isLoftStartSeparated(...input)).toThrow(RangeError);
    }
  });
});
