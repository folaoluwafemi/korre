import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  Scene,
  Vector3,
  type AbstractEngine,
} from "@babylonjs/core";
import type { BodyState } from "@korre/game-protocol";
import { createPitch } from "./pitch.js";
import { createPieces } from "./pieces.js";

/**
 * Creates the browser presentation scene. The caller owns the engine and must
 * dispose the returned scene; this factory starts no render loop and registers
 * no DOM listeners.
 */
export function createCounterballScene(
  engine: AbstractEngine,
  bodies?: readonly BodyState[],
): Scene {
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new Color4(0.035, 0.075, 0.08, 1);

  const camera = new ArcRotateCamera(
    "counterball-camera",
    -Math.PI / 2,
    0.95,
    28,
    Vector3.Zero(),
    scene,
  );
  camera.lowerRadiusLimit = 18;
  camera.upperRadiusLimit = 42;
  camera.minZ = 0.1;
  camera.maxZ = 200;
  scene.activeCamera = camera;

  const ambient = new HemisphericLight(
    "counterball-warm-ambient",
    new Vector3(0.15, 1, -0.2),
    scene,
  );
  ambient.intensity = 0.82;
  ambient.diffuse = new Color3(1, 0.94, 0.82);
  ambient.groundColor = new Color3(0.28, 0.38, 0.3);

  const key = new DirectionalLight(
    "counterball-warm-key",
    new Vector3(-0.35, -1, 0.25),
    scene,
  );
  key.intensity = 0.38;
  key.diffuse = new Color3(1, 0.86, 0.67);

  createPitch(scene);
  if (bodies) {
    createPieces(scene, bodies);
  }
  return scene;
}
