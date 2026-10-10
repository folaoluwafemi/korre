import type { CounterballConfig, Quat, Vec3 } from "@korre/game-protocol";

export type RestartButtonPose = {
  position: Vec3;
  rotation: Quat;
};

function isFiniteVector(value: Vec3): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

/**
 * Derive the tangent support pose of a tilted button around an already-placed
 * cap. This is geometry only; callers still validate ownership, anchors, and
 * overlaps.
 */
export function deriveRestartButtonPose(
  capPosition: Vec3,
  buttonAzimuth: number,
  buttonTilt: number,
  config: Readonly<CounterballConfig>,
): RestartButtonPose {
  const { geometry, restart } = config;
  if (
    !isFiniteVector(capPosition) ||
    !Number.isFinite(buttonAzimuth) ||
    !Number.isFinite(buttonTilt) ||
    !Number.isFinite(geometry.surfaceY) ||
    !Number.isFinite(geometry.capRadius) ||
    geometry.capRadius <= 0 ||
    !Number.isFinite(geometry.buttonRadius) ||
    geometry.buttonRadius <= 0 ||
    !Number.isFinite(geometry.buttonThickness) ||
    geometry.buttonThickness <= 0 ||
    !Number.isFinite(restart.maxButtonTiltRadians) ||
    restart.maxButtonTiltRadians < 0 ||
    buttonTilt < 0 ||
    buttonTilt > restart.maxButtonTiltRadians
  ) {
    throw new TypeError("Invalid restart button pose input.");
  }

  const radialX = Math.sin(buttonAzimuth);
  const radialZ = Math.cos(buttonAzimuth);
  const horizontalSupport =
    geometry.buttonRadius * Math.cos(buttonTilt) +
    (geometry.buttonThickness / 2) * Math.sin(buttonTilt);
  const verticalSupport =
    geometry.buttonRadius * Math.sin(buttonTilt) +
    (geometry.buttonThickness / 2) * Math.cos(buttonTilt);

  // Rotating the button's local up axis toward the selected cap lets the
  // tangent placement formula account for the actual cylindrical support.
  const halfTilt = buttonTilt / 2;
  const halfTiltSin = Math.sin(halfTilt);
  const halfTiltCos = Math.cos(halfTilt);
  const tangentX = -radialZ;
  const tangentZ = radialX;

  const pose = {
    position: {
      x: capPosition.x + radialX * (geometry.capRadius + horizontalSupport),
      y: geometry.surfaceY + verticalSupport,
      z: capPosition.z + radialZ * (geometry.capRadius + horizontalSupport),
    },
    rotation: {
      x: tangentX * halfTiltSin,
      y: 0,
      z: tangentZ * halfTiltSin,
      w: halfTiltCos,
    },
  };
  if (
    !isFiniteVector(pose.position) ||
    !Number.isFinite(pose.rotation.x) ||
    !Number.isFinite(pose.rotation.y) ||
    !Number.isFinite(pose.rotation.z) ||
    !Number.isFinite(pose.rotation.w)
  ) {
    throw new TypeError("Invalid restart button pose input.");
  }
  return pose;
}
