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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isFiniteVector3(
  value: unknown,
): value is PlaybackTransform["position"] {
  if (!isRecord(value)) return false;
  const { x, y, z } = value;
  return (
    typeof x === "number" &&
    Number.isFinite(x) &&
    typeof y === "number" &&
    Number.isFinite(y) &&
    typeof z === "number" &&
    Number.isFinite(z)
  );
}

function isFiniteQuaternion(
  value: unknown,
): value is PlaybackTransform["rotation"] {
  if (!isRecord(value)) return false;
  const { x, y, z, w } = value;
  return (
    typeof x === "number" &&
    Number.isFinite(x) &&
    typeof y === "number" &&
    Number.isFinite(y) &&
    typeof z === "number" &&
    Number.isFinite(z) &&
    typeof w === "number" &&
    Number.isFinite(w)
  );
}

function isPlaybackTransform(value: unknown): value is PlaybackTransform {
  return (
    isRecord(value) &&
    isEntityId(value["id"]) &&
    isFiniteVector3(value["position"]) &&
    isFiniteQuaternion(value["rotation"])
  );
}

function validateSnapshots(
  bodies: readonly PlaybackTransform[],
): ReadonlyMap<EntityId, PlaybackTransform> {
  const untrustedBodies: unknown = bodies;
  if (
    !isUnknownArray(untrustedBodies) ||
    untrustedBodies.length !== ENTITY_IDS.length
  ) {
    throw new TypeError(
      "Presentation updates require exactly one transform for each canonical entity ID.",
    );
  }

  const snapshots = untrustedBodies;
  const transforms = new Map<EntityId, PlaybackTransform>();
  for (const snapshot of snapshots) {
    if (!isPlaybackTransform(snapshot)) {
      throw new TypeError(
        "Presentation update requires canonical IDs and finite transforms.",
      );
    }
    if (transforms.has(snapshot.id)) {
      throw new TypeError(
        "Presentation update contains a duplicate entity ID.",
      );
    }
    transforms.set(snapshot.id, snapshot);
  }

  if (ENTITY_IDS.some((id) => !transforms.has(id))) {
    throw new TypeError(
      "Presentation update is missing a canonical entity ID.",
    );
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
