import {
  COUNTERBALL_CONFIG_V1,
  type Vec3,
} from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import { deriveRestartButtonPose } from "./placementPose.js";

const config = COUNTERBALL_CONFIG_V1;
const invalidInputs: Array<[Vec3, number, number]> = [
  [{ x: Number.NaN, y: 0, z: 0 }, 0, 0],
  [{ x: 0, y: 0, z: 0 }, Number.POSITIVE_INFINITY, 0],
  [{ x: 0, y: 0, z: 0 }, 0, -0.01],
  [
    { x: 0, y: 0, z: 0 },
    0,
    config.restart.maxButtonTiltRadians + 0.01,
  ],
];

describe("deriveRestartButtonPose", () => {
  it("places a flat button tangent to a cap with its support on the surface", () => {
    const cap = { x: 1.25, y: config.geometry.capHeight / 2, z: -2.5 };
    const pose = deriveRestartButtonPose(cap, 0, 0, config);

    expect(pose.position).toEqual({
      x: cap.x,
      y: config.geometry.surfaceY + config.geometry.buttonThickness / 2,
      z: cap.z + config.geometry.capRadius + config.geometry.buttonRadius,
    });
    expect(pose.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it("uses oriented cylindrical support at the maximum configured tilt", () => {
    const cap = { x: 0, y: config.geometry.capHeight / 2, z: 0 };
    const tilt = config.restart.maxButtonTiltRadians;
    const pose = deriveRestartButtonPose(cap, 0, tilt, config);
    const halfThickness = config.geometry.buttonThickness / 2;
    const horizontalSupport =
      config.geometry.buttonRadius * Math.cos(tilt) +
      halfThickness * Math.sin(tilt);
    const verticalSupport =
      config.geometry.buttonRadius * Math.sin(tilt) +
      halfThickness * Math.cos(tilt);
    const rotationLength = Math.hypot(
      pose.rotation.x,
      pose.rotation.y,
      pose.rotation.z,
      pose.rotation.w,
    );

    expect(pose.position.x).toBeCloseTo(0);
    expect(pose.position.z).toBeCloseTo(
      config.geometry.capRadius + horizontalSupport,
    );
    expect(pose.position.y).toBeCloseTo(
      config.geometry.surfaceY + verticalSupport,
    );
    expect(pose.position.y - verticalSupport).toBeCloseTo(
      config.geometry.surfaceY,
    );
    expect(rotationLength).toBeCloseTo(1);
    expect(pose.rotation.x).toBeCloseTo(-Math.sin(tilt / 2));
    expect(pose.rotation.w).toBeCloseTo(Math.cos(tilt / 2));
  });

  it.each([0, Math.PI / 2, Math.PI, -Math.PI / 2])(
    "derives a finite tangent pose at azimuth %s",
    (azimuth) => {
      const pose = deriveRestartButtonPose(
        { x: -1, y: config.geometry.capHeight / 2, z: 2 },
        azimuth,
        config.restart.maxButtonTiltRadians / 2,
        config,
      );

      expect(Object.values(pose.position).every(Number.isFinite)).toBe(true);
      expect(Object.values(pose.rotation).every(Number.isFinite)).toBe(true);
    },
  );

  it("preserves periodic azimuth and leaves input objects unchanged", () => {
    const cap = { x: 3, y: config.geometry.capHeight / 2, z: -4 };
    const before = structuredClone(cap);
    const pose0 = deriveRestartButtonPose(cap, 0, 0.4, config);
    const posePeriod = deriveRestartButtonPose(cap, Math.PI * 2, 0.4, config);

    expect(posePeriod.position.x).toBeCloseTo(pose0.position.x);
    expect(posePeriod.position.y).toBeCloseTo(pose0.position.y);
    expect(posePeriod.position.z).toBeCloseTo(pose0.position.z);
    expect(posePeriod.rotation.x).toBeCloseTo(pose0.rotation.x);
    expect(posePeriod.rotation.z).toBeCloseTo(pose0.rotation.z);
    expect(cap).toEqual(before);
    expect(pose0).not.toBe(posePeriod);
    expect(pose0.position).not.toBe(posePeriod.position);
  });

  it.each(invalidInputs)("rejects invalid pose inputs", (cap, azimuth, tilt) => {
    expect(() => deriveRestartButtonPose(cap, azimuth, tilt, config)).toThrow(
      new TypeError("Invalid restart button pose input."),
    );
  });

  it("rejects invalid collision geometry", () => {
    const invalidConfig = {
      ...config,
      geometry: { ...config.geometry, buttonRadius: 0 },
    };

    expect(() =>
      deriveRestartButtonPose(
        { x: 0, y: config.geometry.capHeight / 2, z: 0 },
        0,
        0,
        invalidConfig,
      ),
    ).toThrow(new TypeError("Invalid restart button pose input."));
  });
});
