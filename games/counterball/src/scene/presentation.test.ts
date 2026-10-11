import {
  MeshBuilder,
  NullEngine,
  PickingInfo,
  Ray,
  Vector3,
  type Scene,
} from "@babylonjs/core";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  type BodyState,
  type PlaybackTransform,
} from "@korre/game-protocol";
import fixtureJson from "../../../../tests/fixtures/counterball-v1.json";
import { describe, expect, it } from "vitest";
import { createCounterballScene } from "./createScene.js";
import {
  createCounterballPresentation,
  pickCounterballEntity,
  updateCounterballPresentation,
} from "./presentation.js";
import type { CounterballPieceRegistry } from "./presentation.js";

type CounterballFixture = {
  states: { initial: { bodies: BodyState[] } };
};

const fixture = fixtureJson as CounterballFixture;

function withScene(run: (scene: Scene) => void): void {
  const engine = new NullEngine();
  const scene = createCounterballScene(engine);
  try {
    run(scene);
  } finally {
    scene.dispose();
    engine.dispose();
  }
}

function pick(
  mesh: PickingInfo["pickedMesh"],
  hit = mesh !== null,
): PickingInfo {
  const info = new PickingInfo();
  info.hit = hit;
  info.pickedMesh = mesh;
  return info;
}

function snapshotRoots(
  registry: CounterballPieceRegistry,
): Record<string, { position: number[]; rotation: number[] | null }> {
  return Object.fromEntries(
    [...registry].map(([id, piece]) => [
      id,
      {
        position: piece.root.position.asArray(),
        rotation: piece.root.rotationQuaternion?.asArray() ?? null,
      },
    ]),
  );
}

function playbackTransforms(bodies: readonly BodyState[]): PlaybackTransform[] {
  return bodies.map((body, index) => ({
    id: body.id,
    position: {
      x: body.position.x + index + 0.125,
      y: body.position.y - 0.25,
      z: body.position.z + index + 0.375,
    },
    rotation: { x: 0.5, y: 0.5, z: 0.5, w: 0.5 },
  }));
}

describe("Counterball presentation registry", () => {
  it("registers all IDs and makes only its own piece bodies pickable", () => {
    withScene((scene) => {
      const unrelatedMesh = MeshBuilder.CreateBox(
        "unrelated-scene-owner-mesh",
        { size: 0.1 },
        scene,
      );
      unrelatedMesh.isPickable = true;
      const existingMeshes = [...scene.meshes];
      const existingPickability = new Map(
        existingMeshes.map((mesh) => [mesh, mesh.isPickable] as const),
      );
      const registry = createCounterballPresentation(
        scene,
        fixture.states.initial.bodies,
      );

      expect(registry.size).toBe(15);
      expect([...registry.keys()].sort()).toEqual([...ENTITY_IDS].sort());
      for (const id of ENTITY_IDS) {
        const piece = registry.get(id);
        expect(piece?.id).toBe(id);
        expect(piece?.bodyMesh.isPickable).toBe(true);
        for (const detailMesh of piece?.detailMeshes ?? []) {
          expect(detailMesh.isPickable).toBe(false);
        }
      }

      for (const mesh of existingMeshes) {
        expect(mesh.isPickable).toBe(existingPickability.get(mesh));
      }
      expect(unrelatedMesh.isPickable).toBe(true);
      expect(
        scene.getMeshByName("counterball-open-concrete-apron")?.isPickable,
      ).toBe(false);
    });
  });

  it("resolves every exact body-mesh hit and rejects details, holes, pitch, and misses", () => {
    withScene((scene) => {
      const registry = createCounterballPresentation(
        scene,
        fixture.states.initial.bodies,
      );

      for (const [id, piece] of registry) {
        expect(pickCounterballEntity(registry, pick(piece.bodyMesh))).toBe(id);
      }

      const button = registry.get("button");
      expect(button?.kind).toBe("button");
      if (button?.kind !== "button") return;
      expect(button.holes).toHaveLength(4);
      for (const holeDetail of button.detailMeshes) {
        expect(pickCounterballEntity(registry, pick(holeDetail))).toBeNull();
      }

      const firstHole = button.holes[0];
      if (!firstHole) throw new Error("The button must retain its four holes.");
      button.root.computeWorldMatrix(true);
      const worldMatrix = button.root.getWorldMatrix();
      const worldCenter = Vector3.TransformCoordinates(
        new Vector3(firstHole.x, 0, firstHole.z),
        worldMatrix,
      );
      const worldUp = Vector3.TransformNormal(
        Vector3.Up(),
        worldMatrix,
      ).normalize();
      const holeRay = new Ray(
        worldCenter.add(
          worldUp.scale(COUNTERBALL_CONFIG_V1.geometry.buttonThickness),
        ),
        worldUp.scale(-1),
        COUNTERBALL_CONFIG_V1.geometry.buttonThickness * 3,
      );
      const holePick = scene.pickWithRay(holeRay);
      expect(holePick?.hit ?? false).toBe(false);
      expect(
        holePick ? pickCounterballEntity(registry, holePick) : null,
      ).toBeNull();

      const cap = registry.get("home-0");
      expect(cap).toBeDefined();
      for (const detail of cap?.detailMeshes ?? []) {
        expect(pickCounterballEntity(registry, pick(detail))).toBeNull();
      }

      const pitch = scene.getMeshByName("counterball-open-concrete-apron");
      expect(pitch).not.toBeNull();
      expect(pickCounterballEntity(registry, pick(pitch))).toBeNull();
      expect(pickCounterballEntity(registry, pick(null, false))).toBeNull();
      expect(pickCounterballEntity(registry, pick(null, true))).toBeNull();
    });
  });

  it("copies every finite pose exactly without changing protocol snapshots", () => {
    withScene((scene) => {
      const bodies = fixture.states.initial.bodies.map((body) => ({
        ...body,
        position: { ...body.position },
        rotation: { ...body.rotation },
        linearVelocity: { ...body.linearVelocity },
        angularVelocity: { ...body.angularVelocity },
      }));
      const originalBodies = structuredClone(bodies);
      const transforms = playbackTransforms(bodies);
      const registry = createCounterballPresentation(scene, bodies);

      updateCounterballPresentation(registry, transforms);

      for (const transform of transforms) {
        const piece = registry.get(transform.id);
        expect(piece?.root.position.asArray()).toEqual([
          transform.position.x,
          transform.position.y,
          transform.position.z,
        ]);
        expect(piece?.root.rotationQuaternion?.asArray()).toEqual([
          transform.rotation.x,
          transform.rotation.y,
          transform.rotation.z,
          transform.rotation.w,
        ]);
      }
      expect(bodies).toEqual(originalBodies);
    });
  });

  it("rejects missing, duplicate, extra, unknown, and non-finite snapshots atomically", () => {
    withScene((scene) => {
      const registry = createCounterballPresentation(
        scene,
        fixture.states.initial.bodies,
      );
      const transforms = playbackTransforms(fixture.states.initial.bodies);
      const first = transforms[0];
      if (!first) throw new Error("The fixture must contain a body transform.");

      const duplicate = [...transforms];
      duplicate[duplicate.length - 1] = first;
      const extra = [...transforms, first];
      const unknown = [
        ...transforms.slice(0, -1),
        { ...first, id: "away-7" } as unknown as PlaybackTransform,
      ];
      const nonFinite = transforms.map((transform) =>
        transform.id === first.id
          ? { ...transform, position: { ...transform.position, x: Infinity } }
          : transform,
      );
      const invalidSnapshots: PlaybackTransform[][] = [
        transforms.slice(1),
        duplicate,
        extra,
        unknown,
        nonFinite,
      ];

      for (const invalid of invalidSnapshots) {
        const before = snapshotRoots(registry);
        expect(() => updateCounterballPresentation(registry, invalid)).toThrow(
          TypeError,
        );
        expect(snapshotRoots(registry)).toEqual(before);
      }
    });
  });

  it("leaves scene resource disposal with the scene owner", () => {
    const engine = new NullEngine();
    const scene = createCounterballScene(engine);
    try {
      createCounterballPresentation(scene, fixture.states.initial.bodies);

      scene.dispose();

      expect(scene.isDisposed).toBe(true);
      expect(scene.meshes).toHaveLength(0);
      expect(scene.transformNodes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
