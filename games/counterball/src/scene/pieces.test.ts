import { NullEngine, Ray, Scene, Vector3 } from "@babylonjs/core";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  type BodyState,
} from "@korre/game-protocol";
import fixtureJson from "../../../../tests/fixtures/counterball-v1.json";
import { describe, expect, it } from "vitest";
import { createPieces, type ButtonAssembly } from "./pieces.js";

type CounterballFixture = {
  states: { initial: { bodies: BodyState[] } };
};

const fixture = fixtureJson as CounterballFixture;

function withPieces(run: (scene: Scene) => void): void {
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

function bounds(mesh: ButtonAssembly["bodyMesh"]) {
  mesh.computeWorldMatrix(true);
  return mesh.getBoundingInfo().boundingBox;
}

describe("Counterball piece presentation", () => {
  it("renders all 15 stable entities at the fixture transforms and scales", () => {
    withPieces((scene) => {
      const bodies = fixture.states.initial.bodies;
      const pieces = createPieces(scene, bodies);
      const piecesById = new Map(pieces.map((piece) => [piece.id, piece]));

      expect([...piecesById.keys()].sort()).toEqual([...ENTITY_IDS].sort());
      expect(pieces).toHaveLength(15);

      for (const body of bodies) {
        const piece = piecesById.get(body.id);
        expect(piece).toBeDefined();
        expect(piece?.root.position.asArray()).toEqual([
          body.position.x,
          body.position.y,
          body.position.z,
        ]);
        expect(piece?.root.rotationQuaternion?.asArray()).toEqual([
          body.rotation.x,
          body.rotation.y,
          body.rotation.z,
          body.rotation.w,
        ]);
      }

      const homeCaps = pieces.filter(
        (piece) => piece.kind === "cap" && piece.team === "home",
      );
      const awayCaps = pieces.filter(
        (piece) => piece.kind === "cap" && piece.team === "away",
      );
      expect(homeCaps).toHaveLength(COUNTERBALL_CONFIG_V1.bodies.capsPerTeam);
      expect(awayCaps).toHaveLength(COUNTERBALL_CONFIG_V1.bodies.capsPerTeam);

      for (const cap of [...homeCaps, ...awayCaps]) {
        const capBounds = bounds(cap.bodyMesh);
        expect(capBounds.maximumWorld.x - capBounds.minimumWorld.x).toBeCloseTo(
          COUNTERBALL_CONFIG_V1.geometry.capRadius * 2,
        );
        expect(capBounds.maximumWorld.y - capBounds.minimumWorld.y).toBeCloseTo(
          COUNTERBALL_CONFIG_V1.geometry.capHeight,
        );
      }
    });
  });

  it("gives teams different non-colour cap patterns", () => {
    withPieces((scene) => {
      const pieces = createPieces(scene, fixture.states.initial.bodies);
      const homeCaps = pieces.filter(
        (piece) => piece.kind === "cap" && piece.team === "home",
      );
      const awayCaps = pieces.filter(
        (piece) => piece.kind === "cap" && piece.team === "away",
      );

      for (const cap of homeCaps) {
        expect(cap.kind).toBe("cap");
        if (cap.kind !== "cap") continue;
        expect(cap.teamCue).toBe("three-stripe");
        expect(
          cap.detailMeshes.filter((mesh) => mesh.name.includes("-rib-")),
        ).toHaveLength(3);
      }

      for (const cap of awayCaps) {
        expect(cap.kind).toBe("cap");
        if (cap.kind !== "cap") continue;
        expect(cap.teamCue).toBe("rosette");
        expect(
          cap.detailMeshes.filter((mesh) =>
            mesh.name.includes("-rosette-dot-"),
          ),
        ).toHaveLength(4);
      }
    });
  });

  it("has four real through-holes in the plastic button", () => {
    withPieces((scene) => {
      const pieces = createPieces(scene, fixture.states.initial.bodies);
      const button = pieces.find((piece) => piece.kind === "button");
      expect(button?.kind).toBe("button");
      if (button?.kind !== "button") return;

      expect(button.holes).toHaveLength(4);
      expect(button.bodyMesh.name).toBe("counterball-button-perforated-body");
      expect(button.bodyMesh.material?.name).toBe("counterball-button-plastic");
      const buttonBounds = bounds(button.bodyMesh);
      expect(buttonBounds.maximumWorld.x - buttonBounds.minimumWorld.x).toBeCloseTo(
        COUNTERBALL_CONFIG_V1.geometry.buttonRadius * 2,
      );
      expect(buttonBounds.maximumWorld.y - buttonBounds.minimumWorld.y).toBeCloseTo(
        COUNTERBALL_CONFIG_V1.geometry.buttonThickness,
      );

      button.root.computeWorldMatrix(true);
      button.bodyMesh.computeWorldMatrix(true);
      for (const hole of button.holes) {
        const worldCenter = Vector3.TransformCoordinates(
          new Vector3(hole.x, 0, hole.z),
          button.root.getWorldMatrix(),
        );
        const ray = new Ray(
          new Vector3(
            worldCenter.x,
            button.root.position.y +
              COUNTERBALL_CONFIG_V1.geometry.buttonThickness,
            worldCenter.z,
          ),
          new Vector3(0, -1, 0),
          COUNTERBALL_CONFIG_V1.geometry.buttonThickness * 3,
        );
        expect(ray.intersectsMesh(button.bodyMesh, true).hit).toBe(false);
        for (const detailMesh of button.detailMeshes) {
          detailMesh.computeWorldMatrix(true);
          expect(
            ray.intersectsMesh(detailMesh, true).hit,
            `hole ray must miss ${detailMesh.name}`,
          ).toBe(false);
        }
      }
    });
  });

  it("rejects incomplete or duplicated body snapshots", () => {
    withPieces((scene) => {
      const bodies = fixture.states.initial.bodies;
      const duplicateBody = bodies[0];
      if (!duplicateBody) {
        throw new Error("The initial fixture must contain a body.");
      }
      expect(() => createPieces(scene, bodies.slice(1))).toThrow(
        /15 canonical entity IDs/,
      );
      expect(() => createPieces(scene, [...bodies, duplicateBody])).toThrow(
        /15 canonical entity IDs/,
      );
    });
  });
});
