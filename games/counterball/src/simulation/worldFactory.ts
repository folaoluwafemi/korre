import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent.js";
import {
  HavokPlugin,
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeBox,
  PhysicsShapeCylinder,
} from "@babylonjs/core/Physics/v2/index.js";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape.js";
import "@babylonjs/core/Physics/v2/physicsEngineComponent.js";
import { Scene } from "@babylonjs/core/scene.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import {
  COUNTERBALL_CONFIG_V1,
  type BodyState,
  type EntityId,
  type MatchState,
} from "@korre/game-protocol";
import { disposeCounterballWorld } from "./dispose.js";
import type { HavokRuntime } from "./havokRuntime.js";

const expectedEntityIds = new Set<EntityId>([
  "button",
  "home-0",
  "home-1",
  "home-2",
  "home-3",
  "home-4",
  "home-5",
  "home-6",
  "away-0",
  "away-1",
  "away-2",
  "away-3",
  "away-4",
  "away-5",
  "away-6",
]);

export type CounterballWorld = {
  /** Caller-owned renderer/context. The world only owns its Scene. */
  engine: AbstractEngine;
  scene: Scene;
  plugin: HavokPlugin;
  /** The fifteen stable protocol IDs map only to the corresponding dynamic bodies. */
  bodies: ReadonlyMap<EntityId, PhysicsBody>;
  /** Static support and goal-frame colliders, kept separate from match entities. */
  staticBodies: readonly PhysicsBody[];
  dispose(): void;
};

export type CreateCounterballWorldOptions = {
  engine: AbstractEngine;
  havok: HavokRuntime;
  state: MatchState;
  /** Gravity is explicit until a measured value is frozen in protocol config. */
  gravity: Vector3;
};

function finiteVector(value: { x: number; y: number; z: number }): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

function assertFiniteBody(body: BodyState): void {
  if (
    !finiteVector(body.position) ||
    !finiteVector(body.linearVelocity) ||
    !finiteVector(body.angularVelocity) ||
    !Number.isFinite(body.rotation.x) ||
    !Number.isFinite(body.rotation.y) ||
    !Number.isFinite(body.rotation.z) ||
    !Number.isFinite(body.rotation.w)
  ) {
    throw new TypeError(`Body ${body.id} contains a non-finite transform.`);
  }
}

/** Babylon cannot dispose an instance whose constructor never returned. */
function createOwnedPlugin(havok: HavokRuntime): HavokPlugin {
  const worlds: ReturnType<HavokRuntime["HP_World_Create"]>[1][] = [];
  const collectors: ReturnType<HavokRuntime["HP_QueryCollector_Create"]>[1][] =
    [];
  let constructing = true;
  // Keep the shared initialized runtime unchanged. This proxy tracks only the
  // synchronous constructor; later allocations belong exclusively to Babylon.
  const runtime = new Proxy(havok, {
    get(target, property): unknown {
      if (property === "HP_World_Create") {
        return (...args: Parameters<HavokRuntime["HP_World_Create"]>) => {
          const result = target.HP_World_Create(...args);
          if (constructing && result[0] === target.Result.RESULT_OK) {
            worlds.push(result[1]);
          }
          return result;
        };
      }
      if (property === "HP_QueryCollector_Create") {
        return (
          ...args: Parameters<HavokRuntime["HP_QueryCollector_Create"]>
        ) => {
          const result = target.HP_QueryCollector_Create(...args);
          if (constructing && result[0] === target.Result.RESULT_OK) {
            collectors.push(result[1]);
          }
          return result;
        };
      }
      return Reflect.get(target, property);
    },
  });

  try {
    const plugin = new HavokPlugin(false, runtime);
    // Transfer ownership once. Normal plugin disposal must not double-release.
    collectors.length = 0;
    worlds.length = 0;
    return plugin;
  } catch (error) {
    for (const collector of collectors.reverse()) {
      try {
        havok.HP_QueryCollector_Release(collector);
      } catch {
        // Continue releasing every allocation and preserve the original error.
      }
    }
    for (const world of worlds.reverse()) {
      try {
        havok.HP_World_Release(world);
      } catch {
        // Scene cleanup is still attempted by the outer construction handler.
      }
    }
    throw error;
  } finally {
    constructing = false;
  }
}

/**
 * Construct a new Physics V2 scene and Havok world for a canonical match state.
 * The supplied Engine is shared/caller-owned; all scene and physics resources
 * created here are isolated and released by the returned dispose method.
 */
export function createCounterballWorld({
  engine,
  havok,
  state,
  gravity,
}: CreateCounterballWorldOptions): CounterballWorld {
  if (state.bodies.length !== expectedEntityIds.size) {
    throw new TypeError(
      `Expected ${expectedEntityIds.size} match bodies; received ${state.bodies.length}.`,
    );
  }

  const scene = new Scene(engine);
  const resources = {
    scene,
    bodies: [] as PhysicsBody[],
    shapes: [] as PhysicsShape[],
  };
  const dynamicBodies = new Map<EntityId, PhysicsBody>();
  const staticBodies: PhysicsBody[] = [];
  let plugin: HavokPlugin | undefined;
  let pluginAttached = false;
  let disposed = false;

  try {
    plugin = createOwnedPlugin(havok);
    if (!scene.enablePhysics(gravity, plugin)) {
      throw new Error("Babylon could not enable the Havok Physics V2 world.");
    }
    pluginAttached = true;

    const physicsEngine = scene.getPhysicsEngine();
    if (physicsEngine === null || physicsEngine.getPluginVersion() !== 2) {
      throw new Error("Babylon did not create a Physics V2 engine.");
    }
    physicsEngine.setTimeStep(
      COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds,
    );

    const { geometry, bodies: bodyConfig } = COUNTERBALL_CONFIG_V1;
    const addBody = (
      name: string,
      position: Vector3,
      motionType: PhysicsMotionType,
      createShape: (forScene: Scene) => PhysicsShape,
      mass?: number,
    ): PhysicsBody => {
      const node = new TransformNode(name, scene);
      node.position.copyFrom(position);
      const body = new PhysicsBody(node, motionType, false, scene);
      resources.bodies.push(body);

      const shape = createShape(scene);
      resources.shapes.push(shape);
      body.shape = shape;
      if (mass !== undefined) {
        body.setMassProperties({ mass });
      }
      return body;
    };

    // This solid slab has its top exactly at surfaceY. There are no perimeter walls.
    const surfaceBody = addBody(
      "counterball-surface",
      new Vector3(0, geometry.surfaceY - geometry.surfaceThickness / 2, 0),
      PhysicsMotionType.STATIC,
      (forScene) =>
        new PhysicsShapeBox(
          Vector3.Zero(),
          Quaternion.Identity(),
          new Vector3(
            geometry.pitchWidth,
            geometry.surfaceThickness,
            geometry.pitchLength,
          ),
          forScene,
        ),
    );
    staticBodies.push(surfaceBody);

    // Each end has two posts and one crossbar; the frame remains open.
    for (const endSign of [-1, 1] as const) {
      const goalZ = (endSign * geometry.pitchLength) / 2;
      for (const sideSign of [-1, 1] as const) {
        const post = addBody(
          `counterball-goal-post-${endSign}-${sideSign}`,
          new Vector3(
            (sideSign * geometry.goalWidth) / 2,
            geometry.surfaceY + geometry.goalHeight / 2,
            goalZ,
          ),
          PhysicsMotionType.STATIC,
          (forScene) =>
            new PhysicsShapeCylinder(
              new Vector3(0, -geometry.goalHeight / 2, 0),
              new Vector3(0, geometry.goalHeight / 2, 0),
              geometry.goalFrameRadius,
              forScene,
            ),
        );
        staticBodies.push(post);
      }

      const crossbar = addBody(
        `counterball-goal-crossbar-${endSign}`,
        new Vector3(0, geometry.surfaceY + geometry.goalHeight, goalZ),
        PhysicsMotionType.STATIC,
        (forScene) =>
          new PhysicsShapeCylinder(
            new Vector3(-geometry.goalWidth / 2, 0, 0),
            new Vector3(geometry.goalWidth / 2, 0, 0),
            geometry.goalFrameRadius,
            forScene,
          ),
      );
      staticBodies.push(crossbar);
    }

    for (const bodyState of state.bodies) {
      if (!expectedEntityIds.has(bodyState.id)) {
        throw new TypeError(
          `Unexpected match body id: ${String(bodyState.id)}.`,
        );
      }
      if (dynamicBodies.has(bodyState.id)) {
        throw new TypeError(`Duplicate match body id: ${bodyState.id}.`);
      }
      assertFiniteBody(bodyState);

      const isButton = bodyState.id === "button";
      const height = isButton ? geometry.buttonThickness : geometry.capHeight;
      const radius = isButton ? geometry.buttonRadius : geometry.capRadius;
      const mass = isButton ? bodyConfig.buttonMass : bodyConfig.capMass;
      const node = new TransformNode(`counterball-${bodyState.id}`, scene);
      node.position.copyFromFloats(
        bodyState.position.x,
        bodyState.position.y,
        bodyState.position.z,
      );
      node.rotationQuaternion = new Quaternion(
        bodyState.rotation.x,
        bodyState.rotation.y,
        bodyState.rotation.z,
        bodyState.rotation.w,
      );

      const body = new PhysicsBody(
        node,
        PhysicsMotionType.DYNAMIC,
        false,
        scene,
      );
      resources.bodies.push(body);
      const shape = new PhysicsShapeCylinder(
        new Vector3(0, -height / 2, 0),
        new Vector3(0, height / 2, 0),
        radius,
        scene,
      );
      resources.shapes.push(shape);
      body.shape = shape;
      body.setMassProperties({ mass });
      body.setLinearVelocity(
        new Vector3(
          bodyState.linearVelocity.x,
          bodyState.linearVelocity.y,
          bodyState.linearVelocity.z,
        ),
      );
      body.setAngularVelocity(
        new Vector3(
          bodyState.angularVelocity.x,
          bodyState.angularVelocity.y,
          bodyState.angularVelocity.z,
        ),
      );
      dynamicBodies.set(bodyState.id, body);
    }

    if (dynamicBodies.size !== expectedEntityIds.size) {
      throw new TypeError(
        "Match state does not contain the canonical fifteen body IDs.",
      );
    }

    const dispose = (): void => {
      if (disposed) {
        return;
      }
      disposed = true;
      disposeCounterballWorld(resources);
    };

    return {
      engine,
      scene,
      plugin,
      bodies: dynamicBodies,
      staticBodies,
      dispose,
    };
  } catch (error) {
    // If Babylon rejected the plugin before attaching it, Scene.dispose() cannot
    // release it, so dispose that just-created plugin explicitly.
    if (plugin !== undefined && !pluginAttached) {
      try {
        plugin.dispose();
      } catch {
        // Preserve the construction error after attempting cleanup.
      }
    }
    try {
      disposeCounterballWorld(resources);
    } catch {
      // Preserve the construction error after attempting every owned release.
    }
    throw error;
  }
}

export { type EntityId };
