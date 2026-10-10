import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Vector3, type Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import {
  PhysicsEngineV2,
  PhysicsMaterialCombineMode,
  type IPhysicsCollisionEvent,
  type PhysicsMaterial,
} from "@babylonjs/core/Physics/v2/index.js";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  parseMatchState,
  type MatchState,
  type Vec3,
} from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import { deriveRestartButtonPose } from "../features/restarts/domain/placementPose.js";
import { initializeHavokRuntime, type HavokRuntime } from "./havokRuntime.js";
import {
  createCounterballWorld,
  type CounterballWorld,
} from "./worldFactory.js";

type Fixture = { states: { initial: unknown } };
type ContactObservation = {
  step: number;
  pair: [string, string];
  type: string;
  point: Vec3 | null;
};
type ClearanceMeasurement = {
  step: number;
  buttonBottomY: number;
  obstacleTopY: number;
  signedVerticalClearance: number;
};
type TrialObservation = {
  key: string;
  friction: number;
  restitution: number;
  impulse: number;
  tiltDegrees: number;
  buttonAzimuthRadians: number;
  obstacleGap: number;
  capTravelledDistance: number;
  capFinalDistance: number;
  capPeakHeight: number;
  capMaximumSpeed: number;
  capImmediateVelocity: Vec3;
  capFinalSpeed: number;
  buttonTravelledDistance: number;
  buttonFinalDistance: number;
  buttonPeakHeight: number;
  buttonMaximumSpeed: number;
  buttonImmediateVelocity: Vec3;
  buttonFinalSpeed: number;
  capButtonContact: boolean;
  obstacleStartPosition: Vec3;
  obstacleFinalPosition: Vec3;
  enteredObstacleCombinedHorizontalRadius: boolean;
  clearanceEpsilon: number;
  clearanceEpsilonSource: string;
  peakExceedsConfiguredEpsilon: boolean | null;
  sampledClearanceAlwaysAboveEpsilon: boolean | null;
  minSampledClearance: number | null;
  maximumSignedClearanceWithinCombinedRadius: number | null;
  continuousTraversalProven: false;
  buttonObstacleContact: boolean;
  clearanceMeasurements: ClearanceMeasurement[];
  allBodiesSettledAtSeconds: number | null;
  simulatedSeconds: number;
  contacts: ContactObservation[];
  materialReadback: {
    surface: { friction: number; staticFriction: number; restitution: number };
    selectedCap: {
      friction: number;
      staticFriction: number;
      restitution: number;
    };
    button: { friction: number; staticFriction: number; restitution: number };
    obstacle: { friction: number; staticFriction: number; restitution: number };
  };
};

const require = createRequire(import.meta.url);
const selectedCapId = "home-0" as const;
const obstacleCapId = "home-1" as const;
const friction = 0.15;
const restitution = 0;
const buttonAzimuthRadians = 0;
const obstacleGap = 0.75;
const candidateImpulses = [0.5, 1, 1.5, 2, 3, 4, 6, 8] as const;
const candidateTiltDegrees = [0, 15, 30, 45, 60] as const;
const measurementMotionFloor = 0.001;
const clearanceEpsilon = COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon;
const clearanceEpsilonSource = "COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon";
const fixedStepSeconds = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds;
const maximumProbeSeconds =
  COUNTERBALL_CONFIG_V1.simulation.maxShotDurationSeconds;
const maximumSteps = Math.ceil(maximumProbeSeconds / fixedStepSeconds);
const settleWindowSteps = Math.ceil(
  COUNTERBALL_CONFIG_V1.simulation.settleWindowSeconds / fixedStepSeconds,
);

async function readPinnedHavokWasm(): Promise<ArrayBuffer> {
  const wasmPath =
    require.resolve("@babylonjs/havok/lib/esm/HavokPhysics.wasm");
  return new Uint8Array(await readFile(wasmPath)).buffer;
}

async function readInitialState(): Promise<MatchState> {
  const fixtureUrl = new URL(
    "../../../../tests/fixtures/counterball-v1.json",
    import.meta.url,
  );
  const fixture = JSON.parse(await readFile(fixtureUrl, "utf8")) as Fixture;
  return parseMatchState(fixture.states.initial);
}

function asPlainVector(vector: Vector3): Vec3 {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function createControlledState(
  initial: MatchState,
  tiltRadians: number,
): { state: MatchState; obstacleStartPosition: Vec3 } {
  const state = structuredClone(initial);
  const { geometry } = COUNTERBALL_CONFIG_V1;
  const capPosition: Vec3 = {
    x: 0,
    y: geometry.surfaceY + geometry.capHeight / 2,
    z: -5,
  };
  const buttonPose = deriveRestartButtonPose(
    capPosition,
    buttonAzimuthRadians,
    tiltRadians,
    COUNTERBALL_CONFIG_V1,
  );
  const obstaclePosition: Vec3 = {
    x: capPosition.x,
    y: geometry.surfaceY + geometry.capHeight / 2,
    z:
      buttonPose.position.z +
      geometry.buttonRadius +
      geometry.capRadius +
      obstacleGap,
  };
  const fillerSlots: Vec3[] = [-4.5, 4.5].flatMap((x) =>
    [-8, -5, -2, 1, 4, 7].map((z) => ({
      x,
      y: geometry.surfaceY + geometry.capHeight / 2,
      z,
    })),
  );
  let fillerIndex = 0;

  for (const body of state.bodies) {
    if (body.id === selectedCapId) {
      body.position = capPosition;
      body.rotation = { x: 0, y: 0, z: 0, w: 1 };
    } else if (body.id === "button") {
      body.position = buttonPose.position;
      body.rotation = buttonPose.rotation;
    } else if (body.id === obstacleCapId) {
      body.position = obstaclePosition;
      body.rotation = { x: 0, y: 0, z: 0, w: 1 };
    } else {
      const filler = fillerSlots[fillerIndex];
      if (filler === undefined) {
        throw new Error("Probe fixture did not have enough safe cap slots.");
      }
      body.position = filler;
      body.rotation = { x: 0, y: 0, z: 0, w: 1 };
      fillerIndex += 1;
    }
    body.linearVelocity = { x: 0, y: 0, z: 0 };
    body.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  return { state, obstacleStartPosition: obstaclePosition };
}

function applyProbeMaterial(
  body: PhysicsBody,
  frictionValue: number,
  restitutionValue: number,
): { friction: number; staticFriction: number; restitution: number } {
  const shape = body.shape;
  if (shape == null) {
    throw new Error(`Probe body ${body.transformNode.name} has no shape.`);
  }
  const material: PhysicsMaterial = {
    friction: frictionValue,
    staticFriction: frictionValue,
    restitution: restitutionValue,
    frictionCombine: PhysicsMaterialCombineMode.MINIMUM,
    restitutionCombine: PhysicsMaterialCombineMode.MAXIMUM,
  };
  shape.material = material;
  const observed = shape.material;
  if (
    observed.friction !== frictionValue ||
    observed.staticFriction !== frictionValue ||
    observed.restitution !== restitutionValue
  ) {
    throw new Error(
      `Havok material read-back failed for ${body.transformNode.name}.`,
    );
  }
  return {
    friction: observed.friction,
    staticFriction: observed.staticFriction,
    restitution: observed.restitution,
  };
}

function isFiniteVector(vector: Vector3): boolean {
  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}

function isFiniteQuaternion(quaternion: Quaternion): boolean {
  return (
    Number.isFinite(quaternion.x) &&
    Number.isFinite(quaternion.y) &&
    Number.isFinite(quaternion.z) &&
    Number.isFinite(quaternion.w)
  );
}

function cylinderVerticalSupport(
  radius: number,
  height: number,
  rotation: Quaternion,
): number {
  const verticalAxisProjection = Math.min(
    1,
    Math.abs(1 - 2 * (rotation.x * rotation.x + rotation.z * rotation.z)),
  );
  return (
    (height / 2) * verticalAxisProjection +
    radius * Math.sqrt(1 - verticalAxisProjection * verticalAxisProjection)
  );
}

function bodySpeed(body: PhysicsBody): number {
  return body.getLinearVelocity().length();
}

function assertFiniteWorldBodies(world: CounterballWorld, step: number): void {
  for (const id of ENTITY_IDS) {
    const body = world.bodies.get(id);
    if (body === undefined) {
      throw new Error(`Missing dynamic body ${id} at step ${step}.`);
    }
    const rotation = body.transformNode.rotationQuaternion;
    const linearVelocity = body.getLinearVelocity();
    const angularVelocity = body.getAngularVelocity();
    if (
      !isFiniteVector(body.transformNode.position) ||
      rotation === null ||
      !isFiniteQuaternion(rotation) ||
      !isFiniteVector(linearVelocity) ||
      !isFiniteVector(angularVelocity) ||
      !Number.isFinite(linearVelocity.length()) ||
      !Number.isFinite(angularVelocity.length())
    ) {
      throw new Error(
        `Havok produced a non-finite body at step ${step}: ${id}.`,
      );
    }
  }
}

function runTrial(
  havok: HavokRuntime,
  initial: MatchState,
  impulseMagnitude: number,
  tiltDegrees: number,
): TrialObservation {
  const engine = new NullEngine();
  let world: CounterballWorld | undefined;
  const removeObservers: Array<() => void> = [];
  let trialFailed = false;
  let trialError: unknown;
  let result: TrialObservation | undefined;

  try {
    const tiltRadians = (tiltDegrees * Math.PI) / 180;
    const controlled = createControlledState(initial, tiltRadians);
    world = createCounterballWorld({
      engine,
      havok,
      state: controlled.state,
      gravity: new Vector3(
        COUNTERBALL_CONFIG_V1.simulation.gravity.x,
        COUNTERBALL_CONFIG_V1.simulation.gravity.y,
        COUNTERBALL_CONFIG_V1.simulation.gravity.z,
      ),
    });
    const trialWorld = world;
    if (trialWorld === undefined) {
      throw new Error("Probe world construction returned no world.");
    }

    const physicsEngine = trialWorld.scene.getPhysicsEngine();
    if (!(physicsEngine instanceof PhysicsEngineV2)) {
      throw new Error("Probe world has no concrete Physics V2 engine.");
    }
    if (physicsEngine.getTimeStep() !== fixedStepSeconds) {
      throw new Error("Probe world did not use the canonical fixed step.");
    }
    if (
      !trialWorld.plugin.isSupported() ||
      trialWorld.bodies.size !== ENTITY_IDS.length
    ) {
      throw new Error("Probe did not create a supported 15-body Havok world.");
    }

    const selectedCap = trialWorld.bodies.get(selectedCapId);
    const button = trialWorld.bodies.get("button");
    const obstacle = trialWorld.bodies.get(obstacleCapId);
    const surface = trialWorld.staticBodies[0];
    if (
      selectedCap === undefined ||
      button === undefined ||
      obstacle === undefined ||
      surface === undefined
    ) {
      throw new Error("Probe world is missing a required body or surface.");
    }

    const materialReadback = {
      surface: applyProbeMaterial(surface, friction, restitution),
      selectedCap: applyProbeMaterial(selectedCap, friction, restitution),
      button: applyProbeMaterial(button, friction, restitution),
      obstacle: applyProbeMaterial(obstacle, friction, restitution),
    };
    const selectedStart = selectedCap.transformNode.position.clone();
    const buttonStart = button.transformNode.position.clone();
    const obstacleStart = obstacle.transformNode.position.clone();
    const bodyNames = new Map<string, string>();
    for (const [id, body] of trialWorld.bodies) {
      bodyNames.set(body.transformNode.name, id);
    }
    for (const body of trialWorld.staticBodies) {
      bodyNames.set(
        body.transformNode.name,
        `static:${body.transformNode.name}`,
      );
    }

    const contacts: ContactObservation[] = [];
    const seenContacts = new Set<string>();
    let currentStep = 0;
    const observeContact = (event: IPhysicsCollisionEvent): void => {
      const first =
        bodyNames.get(event.collider.transformNode.name) ??
        event.collider.transformNode.name;
      const second =
        bodyNames.get(event.collidedAgainst.transformNode.name) ??
        event.collidedAgainst.transformNode.name;
      if (first === second) {
        return;
      }
      const pair: [string, string] =
        first.localeCompare(second) <= 0 ? [first, second] : [second, first];
      const eventType = String(event.type);
      const key = `${currentStep}|${pair[0]}|${pair[1]}|${eventType}`;
      if (seenContacts.has(key)) {
        return;
      }
      seenContacts.add(key);
      const point =
        event.point !== null &&
        event.point !== undefined &&
        isFiniteVector(event.point)
          ? asPlainVector(event.point)
          : null;
      contacts.push({ step: currentStep, pair, type: eventType, point });
    };

    for (const body of trialWorld.bodies.values()) {
      body.setCollisionCallbackEnabled(true);
      const observable = body.getCollisionObservable();
      const observer = observable.add(observeContact);
      removeObservers.push(() => observable.remove(observer));
    }

    const zeroVelocityBeforeImpulse = [...trialWorld.bodies.values()].every(
      (body) =>
        body.getLinearVelocity().length() === 0 &&
        body.getAngularVelocity().length() === 0,
    );
    if (!zeroVelocityBeforeImpulse) {
      throw new Error("Probe world did not start with zero body velocities.");
    }

    selectedCap.applyImpulse(
      new Vector3(0, 0, impulseMagnitude),
      selectedStart.clone(),
    );
    const capImmediateVelocity = asPlainVector(selectedCap.getLinearVelocity());
    const buttonImmediateVelocity = asPlainVector(button.getLinearVelocity());
    if (
      capImmediateVelocity.z <= 0 ||
      capImmediateVelocity.x !== 0 ||
      capImmediateVelocity.y !== 0 ||
      buttonImmediateVelocity.x !== 0 ||
      buttonImmediateVelocity.y !== 0 ||
      buttonImmediateVelocity.z !== 0
    ) {
      throw new Error(
        "Probe impulse was not applied only to the selected cap.",
      );
    }

    let capTravelledDistance = 0;
    let buttonTravelledDistance = 0;
    let capPeakHeight = selectedStart.y;
    let buttonPeakHeight = buttonStart.y;
    let capMaximumSpeed = Math.hypot(
      capImmediateVelocity.x,
      capImmediateVelocity.y,
      capImmediateVelocity.z,
    );
    let buttonMaximumSpeed = Math.hypot(
      buttonImmediateVelocity.x,
      buttonImmediateVelocity.y,
      buttonImmediateVelocity.z,
    );
    let previousCapPosition = selectedStart.clone();
    let previousButtonPosition = buttonStart.clone();
    let allBodiesSettledAtSeconds: number | null = null;
    let simulatedSeconds = 0;
    let quietWindowCount = 0;
    let enteredObstacleCombinedHorizontalRadius = false;
    let maximumSignedClearanceWithinCombinedRadius: number | null = null;
    const clearanceMeasurements: ClearanceMeasurement[] = [];
    const combinedHorizontalRadius =
      COUNTERBALL_CONFIG_V1.geometry.buttonRadius +
      COUNTERBALL_CONFIG_V1.geometry.capRadius;

    const measureSteps = (): void => {
      for (let step = 1; step <= maximumSteps; step += 1) {
        currentStep = step;
        trialWorld.plugin.executeStep(
          fixedStepSeconds,
          physicsEngine.getBodies(),
        );
        simulatedSeconds = step * fixedStepSeconds;
        assertFiniteWorldBodies(trialWorld, step);

        const capPosition = selectedCap.transformNode.position;
        const buttonPosition = button.transformNode.position;
        const obstaclePosition = obstacle.transformNode.position;
        const buttonRotation = button.transformNode.rotationQuaternion;
        const obstacleRotation = obstacle.transformNode.rotationQuaternion;
        if (buttonRotation === null || obstacleRotation === null) {
          throw new Error(`Missing rotation quaternion at step ${step}.`);
        }

        capTravelledDistance += Vector3.Distance(
          capPosition,
          previousCapPosition,
        );
        buttonTravelledDistance += Vector3.Distance(
          buttonPosition,
          previousButtonPosition,
        );
        capPeakHeight = Math.max(capPeakHeight, capPosition.y);
        buttonPeakHeight = Math.max(buttonPeakHeight, buttonPosition.y);
        const capSpeed = bodySpeed(selectedCap);
        const buttonSpeed = bodySpeed(button);
        capMaximumSpeed = Math.max(capMaximumSpeed, capSpeed);
        buttonMaximumSpeed = Math.max(buttonMaximumSpeed, buttonSpeed);

        const horizontalDistance = Math.hypot(
          buttonPosition.x - obstaclePosition.x,
          buttonPosition.z - obstaclePosition.z,
        );
        if (horizontalDistance <= combinedHorizontalRadius) {
          enteredObstacleCombinedHorizontalRadius = true;
          const buttonBottomY =
            buttonPosition.y -
            cylinderVerticalSupport(
              COUNTERBALL_CONFIG_V1.geometry.buttonRadius,
              COUNTERBALL_CONFIG_V1.geometry.buttonThickness,
              buttonRotation,
            );
          const obstacleTopY =
            obstaclePosition.y +
            cylinderVerticalSupport(
              COUNTERBALL_CONFIG_V1.geometry.capRadius,
              COUNTERBALL_CONFIG_V1.geometry.capHeight,
              obstacleRotation,
            );
          const signedVerticalClearance = buttonBottomY - obstacleTopY;
          if (
            !Number.isFinite(buttonBottomY) ||
            !Number.isFinite(obstacleTopY) ||
            !Number.isFinite(signedVerticalClearance)
          ) {
            throw new Error(
              `Non-finite obstacle clearance measurement at step ${step}.`,
            );
          }
          clearanceMeasurements.push({
            step,
            buttonBottomY,
            obstacleTopY,
            signedVerticalClearance,
          });
          maximumSignedClearanceWithinCombinedRadius =
            maximumSignedClearanceWithinCombinedRadius === null
              ? signedVerticalClearance
              : Math.max(
                  maximumSignedClearanceWithinCombinedRadius,
                  signedVerticalClearance,
                );
        }

        const allBodiesQuiet = [...trialWorld.bodies.values()].every(
          (body) =>
            body.getLinearVelocity().length() <=
              COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold &&
            body.getAngularVelocity().length() <=
              COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
        );
        quietWindowCount = allBodiesQuiet ? quietWindowCount + 1 : 0;
        if (quietWindowCount >= settleWindowSteps) {
          allBodiesSettledAtSeconds = simulatedSeconds;
          break;
        }

        previousCapPosition = capPosition.clone();
        previousButtonPosition = buttonPosition.clone();
      }
    };
    measureSteps();

    contacts.sort(
      (left, right) =>
        left.step - right.step ||
        left.pair[0].localeCompare(right.pair[0]) ||
        left.pair[1].localeCompare(right.pair[1]) ||
        left.type.localeCompare(right.type),
    );
    const capButtonContact = contacts.some(
      ({ pair }) => pair.includes(selectedCapId) && pair.includes("button"),
    );
    const buttonObstacleContact = contacts.some(
      ({ pair }) => pair.includes("button") && pair.includes(obstacleCapId),
    );
    const minSampledClearance =
      clearanceMeasurements.length === 0
        ? null
        : Math.min(
            ...clearanceMeasurements.map(
              ({ signedVerticalClearance }) => signedVerticalClearance,
            ),
          );
    const peakExceedsConfiguredEpsilon =
      maximumSignedClearanceWithinCombinedRadius === null
        ? null
        : maximumSignedClearanceWithinCombinedRadius >= clearanceEpsilon;
    const sampledClearanceAlwaysAboveEpsilon =
      minSampledClearance === null
        ? null
        : minSampledClearance >= clearanceEpsilon;

    result = {
      key: `tilt=${tiltDegrees}|impulse=${impulseMagnitude}`,
      friction,
      restitution,
      impulse: impulseMagnitude,
      tiltDegrees,
      buttonAzimuthRadians,
      obstacleGap,
      capTravelledDistance,
      capFinalDistance: Vector3.Distance(
        selectedCap.transformNode.position,
        selectedStart,
      ),
      capPeakHeight,
      capMaximumSpeed,
      capImmediateVelocity,
      capFinalSpeed: bodySpeed(selectedCap),
      buttonTravelledDistance,
      buttonFinalDistance: Vector3.Distance(
        button.transformNode.position,
        buttonStart,
      ),
      buttonPeakHeight,
      buttonMaximumSpeed,
      buttonImmediateVelocity,
      buttonFinalSpeed: bodySpeed(button),
      capButtonContact,
      obstacleStartPosition: asPlainVector(obstacleStart),
      obstacleFinalPosition: asPlainVector(obstacle.transformNode.position),
      enteredObstacleCombinedHorizontalRadius,
      clearanceEpsilon,
      clearanceEpsilonSource,
      peakExceedsConfiguredEpsilon,
      sampledClearanceAlwaysAboveEpsilon,
      minSampledClearance,
      maximumSignedClearanceWithinCombinedRadius,
      // This probe does not persist a swept horizontal path, so sampled extrema
      // cannot prove a complete, collision-free transit over the obstacle.
      continuousTraversalProven: false,
      buttonObstacleContact,
      clearanceMeasurements,
      allBodiesSettledAtSeconds,
      simulatedSeconds,
      contacts,
      materialReadback,
    };
  } catch (error) {
    trialFailed = true;
    trialError = error;
  }

  const cleanupErrors: unknown[] = [];
  for (const removeObserver of removeObservers.splice(0).reverse()) {
    try {
      removeObserver();
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  try {
    world?.dispose();
  } catch (error) {
    cleanupErrors.push(error);
  }
  try {
    engine.dispose();
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (trialFailed) {
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [trialError, ...cleanupErrors],
        "Intended-shot probe failed and cleanup also reported errors.",
      );
    }
    throw trialError;
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      "Intended-shot probe cleanup failed.",
    );
  }
  if (result === undefined) {
    throw new Error("Intended-shot probe completed without an observation.");
  }
  return result;
}

function candidateKey(tiltDegrees: number, impulse: number): string {
  return `tilt=${tiltDegrees}|impulse=${impulse}`;
}

describe("real Havok intended cap-into-button probe", () => {
  it("records the complete 40-trial diagnostic matrix without assuming loft", async () => {
    const maximumTiltDegrees =
      (COUNTERBALL_CONFIG_V1.restart.maxButtonTiltRadians * 180) / Math.PI;
    expect(
      candidateTiltDegrees.every((tilt) => tilt <= maximumTiltDegrees + 1e-9),
    ).toBe(true);

    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const initial = await readInitialState();
    const observations: TrialObservation[] = [];

    for (const tiltDegrees of candidateTiltDegrees) {
      for (const impulse of candidateImpulses) {
        observations.push(runTrial(havok, initial, impulse, tiltDegrees));
      }
    }

    const expectedKeys = candidateTiltDegrees.flatMap((tiltDegrees) =>
      candidateImpulses.map((impulse) => candidateKey(tiltDegrees, impulse)),
    );
    const observedKeys = observations.map(({ key }) => key);
    expect(observations).toHaveLength(40);
    expect(observedKeys).toEqual(expectedKeys);
    expect(new Set(observedKeys).size).toBe(40);
    expect(
      observations.every(({ friction: value }) => value === friction),
    ).toBe(true);
    expect(
      observations.every(({ restitution: value }) => value === restitution),
    ).toBe(true);
    expect(
      observations.every(
        ({ capImmediateVelocity, buttonImmediateVelocity }) =>
          capImmediateVelocity.z > 0 &&
          capImmediateVelocity.x === 0 &&
          capImmediateVelocity.y === 0 &&
          buttonImmediateVelocity.x === 0 &&
          buttonImmediateVelocity.y === 0 &&
          buttonImmediateVelocity.z === 0,
      ),
    ).toBe(true);
    expect(
      observations.some(
        ({ capButtonContact, capTravelledDistance, buttonTravelledDistance }) =>
          capButtonContact &&
          capTravelledDistance > measurementMotionFloor &&
          buttonTravelledDistance > measurementMotionFloor,
      ),
    ).toBe(true);

    for (const observation of observations) {
      for (const value of [
        observation.friction,
        observation.restitution,
        observation.impulse,
        observation.tiltDegrees,
        observation.buttonAzimuthRadians,
        observation.obstacleGap,
        observation.capTravelledDistance,
        observation.capFinalDistance,
        observation.capPeakHeight,
        observation.capMaximumSpeed,
        observation.capFinalSpeed,
        observation.buttonTravelledDistance,
        observation.buttonFinalDistance,
        observation.buttonPeakHeight,
        observation.buttonMaximumSpeed,
        observation.buttonFinalSpeed,
        observation.simulatedSeconds,
        observation.obstacleStartPosition.x,
        observation.obstacleStartPosition.y,
        observation.obstacleStartPosition.z,
        observation.obstacleFinalPosition.x,
        observation.obstacleFinalPosition.y,
        observation.obstacleFinalPosition.z,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(
        observation.allBodiesSettledAtSeconds === null ||
          Number.isFinite(observation.allBodiesSettledAtSeconds),
      ).toBe(true);
      if (observation.allBodiesSettledAtSeconds === null) {
        expect(observation.simulatedSeconds).toBe(maximumProbeSeconds);
      }
      expect(observation.clearanceEpsilon).toBe(
        COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon,
      );
      expect(Number.isFinite(observation.clearanceEpsilon)).toBe(true);
      expect(observation.clearanceEpsilonSource).toBe(
        "COUNTERBALL_CONFIG_V1.restart.clearanceEpsilon",
      );
      expect(
        observation.minSampledClearance === null ||
          Number.isFinite(observation.minSampledClearance),
      ).toBe(true);
      expect(
        observation.maximumSignedClearanceWithinCombinedRadius === null ||
          Number.isFinite(
            observation.maximumSignedClearanceWithinCombinedRadius,
          ),
      ).toBe(true);
      expect(observation.continuousTraversalProven).toBe(false);
      expect(typeof observation.buttonObstacleContact).toBe("boolean");
      if (observation.clearanceMeasurements.length === 0) {
        expect(observation.peakExceedsConfiguredEpsilon).toBeNull();
        expect(observation.sampledClearanceAlwaysAboveEpsilon).toBeNull();
        expect(observation.minSampledClearance).toBeNull();
        expect(
          observation.maximumSignedClearanceWithinCombinedRadius,
        ).toBeNull();
      } else {
        const sampleValues = observation.clearanceMeasurements.map(
          ({ signedVerticalClearance }) => signedVerticalClearance,
        );
        const minimum = Math.min(...sampleValues);
        const maximum = Math.max(...sampleValues);
        expect(observation.minSampledClearance).toBe(minimum);
        expect(observation.maximumSignedClearanceWithinCombinedRadius).toBe(
          maximum,
        );
        expect(observation.peakExceedsConfiguredEpsilon).toBe(
          maximum >= observation.clearanceEpsilon,
        );
        expect(observation.sampledClearanceAlwaysAboveEpsilon).toBe(
          minimum >= observation.clearanceEpsilon,
        );
      }
      expect(
        observation.allBodiesSettledAtSeconds === null ||
          observation.allBodiesSettledAtSeconds >=
            COUNTERBALL_CONFIG_V1.simulation.settleWindowSeconds,
      ).toBe(true);
      expect(
        observation.allBodiesSettledAtSeconds === null ||
          observation.allBodiesSettledAtSeconds <= observation.simulatedSeconds,
      ).toBe(true);
      expect(
        observation.clearanceMeasurements.every((measurement) =>
          [
            measurement.buttonBottomY,
            measurement.obstacleTopY,
            measurement.signedVerticalClearance,
          ].every(Number.isFinite),
        ),
      ).toBe(true);
      expect(
        observation.contacts.every(
          ({ step, pair, type, point }) =>
            Number.isSafeInteger(step) &&
            pair.length === 2 &&
            pair[0] !== pair[1] &&
            type.length > 0 &&
            (point === null ||
              [point.x, point.y, point.z].every(Number.isFinite)),
        ),
      ).toBe(true);
      expect(
        observation.contacts.every(
          ({ step, point }) =>
            Number.isSafeInteger(step) &&
            (point === null ||
              [point.x, point.y, point.z].every(Number.isFinite)),
        ),
      ).toBe(true);
      expect(
        Object.values(observation.materialReadback).every(
          ({
            friction: observedFriction,
            staticFriction,
            restitution: observedRestitution,
          }) =>
            observedFriction === friction &&
            staticFriction === friction &&
            observedRestitution === restitution,
        ),
      ).toBe(true);
    }

    const result = {
      babylonCore: "9.30.0",
      havokPackage: "1.3.14",
      wasm: "@babylonjs/havok/lib/esm/HavokPhysics.wasm",
      diagnosticOnly: true,
      setup:
        "selected cap receives one planar +z center impulse into tangent placed button; one movable cap lies ahead",
      fixedStepSeconds,
      maximumProbeSeconds,
      settleWindowSeconds: COUNTERBALL_CONFIG_V1.simulation.settleWindowSeconds,
      linearSettleThreshold:
        COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold,
      angularSettleThreshold:
        COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
      friction,
      restitution,
      candidateImpulses,
      candidateTiltDegrees,
      buttonAzimuthRadians,
      obstacleGap,
      measurementMotionFloor,
      clearanceEpsilon,
      clearanceEpsilonSource,
      continuousTraversalProven: false,
      clearanceClassificationNote:
        "Peak and sampled-clearance comparisons are diagnostic only; the probe does not prove a complete swept obstacle traversal.",
      potentialNoContactCandidates: observations
        .filter(
          (observation) =>
            observation.capButtonContact &&
            observation.enteredObstacleCombinedHorizontalRadius &&
            !observation.buttonObstacleContact,
        )
        .map(({ key }) => key),
      observedTrials: observations.length,
      observations,
    };

    const artifactPath = process.env["COUNTERBALL_INTENDED_SHOT_OUTPUT"];
    if (artifactPath !== undefined && artifactPath.trim().length > 0) {
      const absoluteArtifactPath = resolve(artifactPath);
      await mkdir(dirname(absoluteArtifactPath), { recursive: true });
      await writeFile(
        absoluteArtifactPath,
        `${JSON.stringify(result, null, 2)}\n`,
        "utf8",
      );
    }
  }, 600_000);
});
