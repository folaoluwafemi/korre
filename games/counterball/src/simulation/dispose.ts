import type { Scene } from "@babylonjs/core/scene.js";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape.js";

/** Resources owned by one Counterball scene; its Babylon Engine stays caller-owned. */
export type CounterballWorldResources = {
  scene: Scene;
  bodies: PhysicsBody[];
  shapes: PhysicsShape[];
};

/** Release every owned resource, continuing cleanup if one release throws. */
export function disposeCounterballWorld(
  resources: CounterballWorldResources,
): void {
  const errors: unknown[] = [];

  for (const body of [...resources.bodies].reverse()) {
    try {
      body.dispose();
    } catch (error) {
      errors.push(error);
    }
  }

  for (const shape of [...resources.shapes].reverse()) {
    try {
      shape.dispose();
    } catch (error) {
      errors.push(error);
    }
  }

  try {
    resources.scene.dispose();
  } catch (error) {
    errors.push(error);
  }

  resources.bodies.length = 0;
  resources.shapes.length = 0;

  if (errors.length > 0) {
    throw new AggregateError(errors, "Counterball physics cleanup failed.");
  }
}
