import { NullEngine, Scene, type AbstractMesh } from "@babylonjs/core";
import { COUNTERBALL_CONFIG_V1 } from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import { createPitch } from "./pitch.js";

function withPitch(run: (scene: Scene) => void): void {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;

  try {
    run(scene);
  } finally {
    scene.dispose();
    engine.dispose();
  }
}

function bounds(mesh: AbstractMesh) {
  mesh.computeWorldMatrix(true);
  return mesh.getBoundingInfo().boundingBox;
}

describe("procedural Counterball pitch", () => {
  it("uses the canonical rectangle on an open concrete apron", () => {
    withPitch((scene) => {
      const pitch = createPitch(scene);
      const geometry = COUNTERBALL_CONFIG_V1.geometry;
      const halfWidth = geometry.pitchWidth / 2;
      const halfLength = geometry.pitchLength / 2;
      const apron = Math.max(geometry.pitchWidth, geometry.pitchLength) * 0.1;
      const groundBounds = bounds(pitch.ground);

      expect(groundBounds.minimumWorld.x).toBeCloseTo(-halfWidth - apron);
      expect(groundBounds.maximumWorld.x).toBeCloseTo(halfWidth + apron);
      expect(groundBounds.minimumWorld.z).toBeCloseTo(-halfLength - apron);
      expect(groundBounds.maximumWorld.z).toBeCloseTo(halfLength + apron);
      expect(groundBounds.maximumWorld.y).toBeCloseTo(geometry.surfaceY);
      expect(groundBounds.minimumWorld.y).toBeCloseTo(
        geometry.surfaceY - geometry.surfaceThickness,
      );
      expect(pitch.sideLines[0].position.x).toBeCloseTo(-halfWidth);
      expect(pitch.sideLines[1].position.x).toBeCloseTo(halfWidth);
      expect(pitch.endLineSegments).toHaveLength(4);

      for (const segment of pitch.endLineSegments) {
        const segmentBounds = bounds(segment);
        const isLeft = segment.position.x < 0;
        if (isLeft) {
          expect(segmentBounds.maximumWorld.x).toBeLessThanOrEqual(
            -geometry.goalWidth / 2 + 0.0001,
          );
        } else {
          expect(segmentBounds.minimumWorld.x).toBeGreaterThanOrEqual(
            geometry.goalWidth / 2 - 0.0001,
          );
        }
      }

      expect(pitch.ground.material?.name).toBe("counterball-concrete");
      expect(
        (pitch.ground.material as { diffuseTexture?: unknown }).diffuseTexture,
      ).toBeTruthy();
    });
  });

  it("builds two open goal frames with the configured clear opening", () => {
    withPitch((scene) => {
      const pitch = createPitch(scene);
      const geometry = COUNTERBALL_CONFIG_V1.geometry;

      expect(pitch.goals).toHaveLength(2);
      expect(pitch.goals.map((goal) => goal.team)).toEqual(["home", "away"]);

      for (const goal of pitch.goals) {
        const left = bounds(goal.leftPost);
        const right = bounds(goal.rightPost);
        const crossbar = bounds(goal.crossbar);
        expect(right.minimumWorld.x - left.maximumWorld.x).toBeCloseTo(
          geometry.goalWidth,
        );
        expect(
          goal.leftPost.getBoundingInfo().boundingBox.maximumWorld.x -
            goal.leftPost.getBoundingInfo().boundingBox.minimumWorld.x,
        ).toBeCloseTo(geometry.goalFrameRadius * 2);
        expect(crossbar.minimumWorld.y).toBeCloseTo(
          geometry.surfaceY + geometry.goalHeight,
        );
        expect(goal.leftPost.position.z).toBeCloseTo(
          goal.team === "home"
            ? -geometry.pitchLength / 2
            : geometry.pitchLength / 2,
        );
      }

      const goalParts = scene.meshes.filter((mesh) =>
        mesh.name.startsWith("counterball-goal-"),
      );
      expect(goalParts).toHaveLength(6);
      expect(
        goalParts.every(
          (mesh) =>
            mesh.name.includes("post") || mesh.name.includes("crossbar"),
        ),
      ).toBe(true);
    });
  });

  it("marks mirrored penalty boxes from the shared config", () => {
    withPitch((scene) => {
      const pitch = createPitch(scene);
      const geometry = COUNTERBALL_CONFIG_V1.geometry;
      expect(pitch.penaltyBoxes).toHaveLength(2);

      for (const box of pitch.penaltyBoxes) {
        expect(box.sideLines).toHaveLength(2);
        expect(box.innerZ).toBeCloseTo(
          box.team === "home"
            ? -geometry.pitchLength / 2 + geometry.penaltyBoxDepth
            : geometry.pitchLength / 2 - geometry.penaltyBoxDepth,
        );
        expect(
          box.sideLines.map((line) => Math.abs(line.position.x)).sort(),
        ).toEqual([geometry.penaltyBoxWidth / 2, geometry.penaltyBoxWidth / 2]);

        const innerBounds = bounds(box.innerLine);
        expect(innerBounds.minimumWorld.x).toBeCloseTo(
          -geometry.penaltyBoxWidth / 2,
        );
        expect(innerBounds.maximumWorld.x).toBeCloseTo(
          geometry.penaltyBoxWidth / 2,
        );
        expect(box.innerLine.position.z).toBeCloseTo(box.innerZ);
      }
    });
  });

  it("has no enclosing walls around the playable rectangle", () => {
    withPitch((scene) => {
      createPitch(scene);
      const geometry = COUNTERBALL_CONFIG_V1.geometry;
      const tallMeshes = scene.meshes.filter((mesh) => {
        const meshBounds = bounds(mesh);
        return (
          meshBounds.maximumWorld.y - meshBounds.minimumWorld.y >
          geometry.goalHeight / 2
        );
      });

      expect(tallMeshes).toHaveLength(4);
      expect(tallMeshes.every((mesh) => mesh.name.endsWith("-post"))).toBe(
        true,
      );
      expect(scene.getMeshByName("counterball-wall-left")).toBeNull();
      expect(scene.getMeshByName("counterball-wall-right")).toBeNull();
    });
  });
});
