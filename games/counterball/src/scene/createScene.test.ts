import { NullEngine } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { createCounterballScene } from "./createScene.js";

describe("Counterball browser scene factory", () => {
  it("creates a right-handed pitch scene without starting external listeners", () => {
    const engine = new NullEngine();
    const scene = createCounterballScene(engine);

    try {
      expect(scene.useRightHandedSystem).toBe(true);
      expect(scene.activeCamera?.name).toBe("counterball-camera");
      expect(scene.lights.map((light) => light.name)).toEqual([
        "counterball-warm-ambient",
        "counterball-warm-key",
      ]);
      expect(
        scene.getMeshByName("counterball-open-concrete-apron"),
      ).not.toBeNull();
      expect(
        scene.getMeshByName("counterball-goal-home-left-post"),
      ).not.toBeNull();
      expect(
        scene.getMeshByName("counterball-goal-away-right-post"),
      ).not.toBeNull();
      expect(scene.meshes.some((mesh) => mesh.name.includes("-wall-"))).toBe(
        false,
      );
    } finally {
      scene.dispose();
      expect(scene.isDisposed).toBe(true);
      engine.dispose();
    }
  });
});
