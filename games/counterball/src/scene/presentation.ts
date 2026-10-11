import { type PickingInfo, type Scene } from "@babylonjs/core";
import {
  ENTITY_IDS,
  type BodyState,
  type CounterballConfig,
  type EntityId,
  type PlaybackTransform,
} from "@korre/game-protocol";
import { createPieces, type PieceAssembly } from "./pieces.js";

export type CounterballPieceRegistry = ReadonlyMap<EntityId, PieceAssembly>;

const canonicalEntityIds = new Set<string>(ENTITY_IDS);

type PoseTarget = {
  root: PieceAssembly["root"];
  rotation: NonNullable<PieceAssembly["root"]["rotationQuaternion"]>;
  transform: PlaybackTransform;
};

function isEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && canonicalEntityIds.has(value);
}

function hasFiniteComponents(
  value: unknown,
  keys: readonly string[],
): boolean {
  if (typeof value !== "object" || value === null) return false;
  const components = value as Record<string, unknown>;
  return keys.every(
    (key) =>
      typeof components[key] === "number" &&
      Number.isFinite(components[key]),
  );
}

function validateSnapshots(
  bodies: readonly PlaybackTransform[],
): ReadonlyMap<EntityId, PlaybackTransform> {
  if (!Array.isArray(bodies) || bodies.length !== ENTITY_IDS.length) {
    throw new TypeError(
      "Presentation updates require exactly one transform for each canonical entity ID.",
    );
  }

  const transforms = new Map<EntityId, PlaybackTransform>();
  for (const body of bodies) {
    if (typeof body !== "object" || body === null || !isEntityId(body.id)) {
      throw new TypeError("Presentation update contains an unknown entity ID.");
    }
    if (transforms.has(body.id)) {
      throw new TypeError("Presentation update contains a duplicate entity ID.");
    }
    if (
      !hasFiniteComponents(body.position, ["x", "y", "z"]) ||
      !hasFiniteComponents(body.rotation, ["x", "y", "z", "w"])
    ) {
      throw new TypeError("Presentation transforms must contain finite values.");
    }
    transforms.set(body.id, body);
  }

  if (ENTITY_IDS.some((id) => !transforms.has(id))) {
    throw new TypeError("Presentation update is missing a canonical entity ID.");
  }

  return transforms;
}

/** Creates the stable render registry for one canonical 15-body snapshot. */
export function createCounterballPresentation(
  scene: Scene,
  bodies: readonly BodyState[],
  config?: Readonly<CounterballConfig>,
): CounterballPieceRegistry {
  const pieces = createPieces(scene, bodies, config);
  const registry = new Map<EntityId, PieceAssembly>();

  for (const piece of pieces) {
    piece.bodyMesh.isPickable = true;
    for (const detailMesh of piece.detailMeshes) {
      detailMesh.isPickable = false;
    }
    registry.set(piece.id, piece);
  }

  return registry;
}

/** Copies a complete authoritative playback pose into the presentation roots. */
export function updateCounterballPresentation(
  registry: CounterballPieceRegistry,
  bodies: readonly PlaybackTransform[],
): void {
  const transforms = validateSnapshots(bodies);
  if (registry.size !== ENTITY_IDS.length) {
    throw new TypeError("Presentation registry must contain all 15 entities.");
  }

  const targets: PoseTarget[] = [];
  for (const id of ENTITY_IDS) {
    const piece = registry.get(id);
    if (
      !piece ||
      piece.id !== id ||
      !piece.root ||
      typeof piece.root.position?.set !== "function" ||
      !piece.root.rotationQuaternion ||
      typeof piece.root.rotationQuaternion.set !== "function"
    ) {
      throw new TypeError(
        `Presentation registry entry for ${id} is invalid or incomplete.`,
      );
    }
    const transform = transforms.get(id);
    if (!transform) {
      throw new TypeError(`Presentation update is missing ${id}.`);
    }
    targets.push({
      root: piece.root,
      rotation: piece.root.rotationQuaternion,
      transform,
    });
  }

  // All IDs, values, and targets are checked before the first scene mutation.
  for (const target of targets) {
    target.root.position.set(
      target.transform.position.x,
      target.transform.position.y,
      target.transform.position.z,
    );
    target.rotation.set(
      target.transform.rotation.x,
      target.transform.rotation.y,
      target.transform.rotation.z,
      target.transform.rotation.w,
    );
  }
}

/** Resolves only exact registered body-mesh hits to stable protocol IDs. */
export function pickCounterballEntity(
  registry: CounterballPieceRegistry,
  pickInfo: PickingInfo,
): EntityId | null {
  if (!pickInfo?.hit || !pickInfo.pickedMesh) return null;

  for (const id of ENTITY_IDS) {
    const piece = registry.get(id);
    if (
      piece?.id === id &&
      piece.bodyMesh.isPickable &&
      piece.bodyMesh === pickInfo.pickedMesh
    ) {
      return id;
    }
  }

  return null;
}
