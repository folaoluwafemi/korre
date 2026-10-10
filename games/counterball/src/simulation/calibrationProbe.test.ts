import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import {
  PhysicsEngineV2,
  PhysicsMaterialCombineMode,
  type IPhysicsCollisionEvent,
  type PhysicsMaterial,
} from "@babylonjs/core/Physics/v2/index.js";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import {
  COUNTERBALL_CONFIG_V1,
  parseMatchState,
  type MatchState,
} from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import { initializeHavokRuntime, type HavokRuntime } from "./havokRuntime.js";
import {
  createCounterballWorld,
  type CounterballWorld,
} from "./worldFactory.js";

type Fixture = { states: { initial: unknown } };
type ProbeKind = "direct-cap" | "restart-button";
type ContactObservation = {
  pair: string[];
  type: string;
  observations: number;
  firstStep: number;
  lastStep: number;
  firstPoint: { x: number; y: number; z: number } | null;
};
type TrialObservation = {
  kind: ProbeKind;
  friction: number;
  restitution: number;
  impulse: number;
  tiltDegrees: number | null;
  azimuthRadians: number | null;
  selectedCapTravelledDistance: number;
  selectedCapFinalDistance: number;
  selectedCapPeakRise: number;
  selectedCapMaximumSpeed: number;
  selectedCapFinalSpeed: number;
  buttonTravelledDistance: number;
  buttonFinalSpeed: number;
  buttonCapContact: boolean;
  settledAtSeconds: number | null;
  simulatedSeconds: number;
  contacts: ContactObservation[];
};

const require = createRequire(import.meta.url);
const selectedCapId = "home-0" as const;
const candidateImpulses = [0.25, 0.5, 0.75, 1, 1.5] as const;
const candidateFrictions = [0.15, 0.35, 0.55, 0.75] as const;
const candidateRestitutions = [0, 0.1, 0.2, 0.35] as const;
const candidateTiltDegrees = [0, 15, 30, 45, 60] as const;
const restartAzimuthRadians = 0; // Canonical yaw zero points along +z.
const maximumProbeSeconds =
  COUNTERBALL_CONFIG_V1.simulation.maxShotDurationSeconds;
const fixedStepSeconds = COUNTERBALL_CONFIG_V1.simulation.fixedStepSeconds;
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

function asPlainVector(vector: Vector3): { x: number; y: number; z: number } {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function asPlainQuaternion(quaternion: Quaternion): {
  x: number;
  y: number;
  z: number;
  w: number;
} {
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

function buttonRestartPose(tiltRadians: number): {
  position: Vector3;
  rotation: Quaternion;
} {
  const { geometry } = COUNTERBALL_CONFIG_V1;
  const radial = new Vector3(
    Math.sin(restartAzimuthRadians),
    0,
    Math.cos(restartAzimuthRadians),
  );
  // Tilt the button's local up axis toward the cap. The support distance is
  // computed from the configured cylindrical radius and half-thickness.
  const tangent = new Vector3(-radial.z, 0, radial.x);
  const rotation = Quaternion.RotationAxis(tangent, tiltRadians);
  const horizontalButtonSupport =
    geometry.buttonRadius * Math.cos(tiltRadians) +
    (geometry.buttonThickness / 2) * Math.sin(tiltRadians);
  const verticalButtonSupport =
    geometry.buttonRadius * Math.sin(tiltRadians) +
    (geometry.buttonThickness / 2) * Math.cos(tiltRadians);

  return {
    position: new Vector3(
      radial.x * (geometry.capRadius + horizontalButtonSupport),
      geometry.surfaceY + verticalButtonSupport,
      radial.z * (geometry.capRadius + horizontalButtonSupport),
    ),
    rotation,
  };
}

function createControlledState(
  initial: MatchState,
  kind: ProbeKind,
  tiltRadians: number | null,
): MatchState {
  const state = structuredClone(initial);
  const { geometry } = COUNTERBALL_CONFIG_V1;
  const capCenter = new Vector3(
    0,
    geometry.surfaceY + geometry.capHeight / 2,
    0,
  );
  const buttonCenter =
    kind === "restart-button" && tiltRadians !== null
      ? buttonRestartPose(tiltRadians)
      : {
          position: new Vector3(
            0,
            geometry.surfaceY + geometry.buttonThickness / 2,
            -8,
          ),
          rotation: Quaternion.Identity(),
        };
  const fillerSlots: Vector3[] = [];
  for (const x of [-5, -4, -3, 3, 4, 5]) {
    for (const z of [-8, -6, -4, -2, 0, 2, 4, 6, 8]) {
      fillerSlots.push(
        new Vector3(x, geometry.surfaceY + geometry.capHeight / 2, z),
      );
    }
  }
  const safeFillerSlots = fillerSlots.filter(
    (slot) =>
      Vector3.Distance(slot, capCenter) > geometry.capRadius * 3 &&
      Vector3.Distance(slot, buttonCenter.position) >
        geometry.capRadius + geometry.buttonRadius + 0.25,
  );
  let fillerIndex = 0;

  for (const body of state.bodies) {
    let position: Vector3;
    let rotation = Quaternion.Identity();
    if (body.id === selectedCapId) {
      position = capCenter;
    } else if (body.id === "button") {
      position = buttonCenter.position;
      rotation = buttonCenter.rotation;
    } else {
      const filler = safeFillerSlots[fillerIndex];
      if (filler === undefined) {
        throw new Error("Probe fixture did not have enough safe cap slots.");
      }
      position = filler;
      fillerIndex += 1;
    }

    body.position = asPlainVector(position);
    body.rotation = asPlainQuaternion(rotation);
    body.linearVelocity = { x: 0, y: 0, z: 0 };
    body.angularVelocity = { x: 0, y: 0, z: 0 };
  }

  return state;
}

function applyProbeMaterial(
  body: PhysicsBody,
  friction: number,
  restitution: number,
): void {
  const shape = body.shape;
  if (shape == null) {
    throw new Error(`Probe body ${body.transformNode.name} has no shape.`);
  }
  const material: PhysicsMaterial = {
    friction,
    staticFriction: friction,
    restitution,
    frictionCombine: PhysicsMaterialCombineMode.MINIMUM,
    restitutionCombine: PhysicsMaterialCombineMode.MAXIMUM,
  };
  shape.material = material;
  const observed = shape.material;
  if (
    observed.friction !== friction ||
    observed.staticFriction !== friction ||
    observed.restitution !== restitution
  ) {
    throw new Error(
      `Havok material read-back failed for ${body.transformNode.name}.`,
    );
  }
}

function speed(body: PhysicsBody): number {
  return body.getLinearVelocity().length();
}

function isFiniteVector(value: Vector3): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

function runTrial(
  havok: HavokRuntime,
  initial: MatchState,
  kind: ProbeKind,
  friction: number,
  restitution: number,
  impulseMagnitude: number,
  tiltDegrees: number | null,
): TrialObservation {
  const engine = new NullEngine();
  let world: CounterballWorld | undefined;
  try {
    const tiltRadians =
      tiltDegrees === null ? null : (tiltDegrees * Math.PI) / 180;
    world = createCounterballWorld({
      engine,
      havok,
      state: createControlledState(initial, kind, tiltRadians),
      gravity: new Vector3(
        COUNTERBALL_CONFIG_V1.simulation.gravity.x,
        COUNTERBALL_CONFIG_V1.simulation.gravity.y,
        COUNTERBALL_CONFIG_V1.simulation.gravity.z,
      ),
    });
    const physicsEngine = world.scene.getPhysicsEngine();
    if (!(physicsEngine instanceof PhysicsEngineV2)) {
      throw new Error("Probe world has no concrete Physics V2 engine.");
    }
    if (physicsEngine.getTimeStep() !== fixedStepSeconds) {
      throw new Error("Probe world did not use the canonical fixed step.");
    }

    const selectedCap = world.bodies.get(selectedCapId);
    const button = world.bodies.get("button");
    const surface = world.staticBodies[0];
    if (
      selectedCap === undefined ||
      button === undefined ||
      surface === undefined
    ) {
      throw new Error("Probe world is missing a selected body or surface.");
    }
    applyProbeMaterial(surface, friction, restitution);
    applyProbeMaterial(selectedCap, friction, restitution);
    if (kind === "restart-button") {
      applyProbeMaterial(button, friction, restitution);
    }

    const selectedStart = selectedCap.transformNode.position.clone();
    const buttonStart = button.transformNode.position.clone();
    const observedContacts = new Map<string, ContactObservation>();
    const seenContactSteps = new Set<string>();
    let stepIndex = 0;
    const observeContact = (event: IPhysicsCollisionEvent): void => {
      const pair = [
        event.collider.transformNode.name,
        event.collidedAgainst.transformNode.name,
      ].sort();
      const type = String(event.type);
      const key = `${pair.join("|")}|${type}`;
      const stepKey = `${stepIndex}|${key}`;
      if (seenContactSteps.has(stepKey)) {
        return;
      }
      seenContactSteps.add(stepKey);
      const point = event.point;
      const firstPoint =
        point !== null && isFiniteVector(point)
          ? { x: point.x, y: point.y, z: point.z }
          : null;
      const existing = observedContacts.get(key);
      if (existing === undefined) {
        observedContacts.set(key, {
          pair,
          type,
          observations: 1,
          firstStep: stepIndex,
          lastStep: stepIndex,
          firstPoint,
        });
      } else {
        existing.observations += 1;
        existing.lastStep = stepIndex;
      }
    };
    const capCollisions = selectedCap.getCollisionObservable();
    const buttonCollisions = button.getCollisionObservable();
    selectedCap.setCollisionCallbackEnabled(true);
    button.setCollisionCallbackEnabled(true);
    const capObserver = capCollisions.add(observeContact);
    const buttonObserver = buttonCollisions.add(observeContact);

    try {
      const launchDirection =
        kind === "direct-cap"
          ? new Vector3(0, 0, 1)
          : new Vector3(
              -Math.sin(restartAzimuthRadians),
              0,
              -Math.cos(restartAzimuthRadians),
            );
      const launchBody = kind === "direct-cap" ? selectedCap : button;
      launchBody.applyImpulse(
        launchDirection.scale(impulseMagnitude),
        launchBody.transformNode.position.clone(),
      );

      let selectedCapTravelledDistance = 0;
      let buttonTravelledDistance = 0;
      let selectedCapPeakY = selectedStart.y;
      let selectedCapMaximumSpeed = 0;
      let settleWindow = 0;
      let settledAtSeconds: number | null = null;
      let simulatedSeconds = 0;
      let priorSelectedPosition = selectedStart.clone();
      let priorButtonPosition = buttonStart.clone();
      const activeBodies =
        kind === "direct-cap" ? [selectedCap] : [selectedCap, button];

      for (let step = 1; step <= maximumSteps; step += 1) {
        stepIndex = step;
        world.plugin.executeStep(fixedStepSeconds, physicsEngine.getBodies());
        simulatedSeconds = step * fixedStepSeconds;

        const selectedPosition = selectedCap.transformNode.position;
        const buttonPosition = button.transformNode.position;
        const selectedVelocity = selectedCap.getLinearVelocity();
        const buttonVelocity = button.getLinearVelocity();
        const selectedAngularVelocity = selectedCap.getAngularVelocity();
        const buttonAngularVelocity = button.getAngularVelocity();
        if (
          !isFiniteVector(selectedPosition) ||
          !isFiniteVector(buttonPosition) ||
          !isFiniteVector(selectedVelocity) ||
          !isFiniteVector(buttonVelocity) ||
          !isFiniteVector(selectedAngularVelocity) ||
          !isFiniteVector(buttonAngularVelocity)
        ) {
          throw new Error("Havok produced a non-finite probe observation.");
        }

        selectedCapTravelledDistance += Vector3.Distance(
          selectedPosition,
          priorSelectedPosition,
        );
        buttonTravelledDistance += Vector3.Distance(
          buttonPosition,
          priorButtonPosition,
        );
        selectedCapPeakY = Math.max(selectedCapPeakY, selectedPosition.y);
        selectedCapMaximumSpeed = Math.max(
          selectedCapMaximumSpeed,
          selectedVelocity.length(),
        );

        const belowThreshold = activeBodies.every(
          (body) =>
            body.getLinearVelocity().length() <=
              COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold &&
            body.getAngularVelocity().length() <=
              COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
        );
        settleWindow = belowThreshold ? settleWindow + 1 : 0;
        if (settleWindow >= settleWindowSteps) {
          settledAtSeconds = simulatedSeconds;
          break;
        }

        priorSelectedPosition = selectedPosition.clone();
        priorButtonPosition = buttonPosition.clone();
      }

      const buttonCapPair = [
        "counterball-button",
        `counterball-${selectedCapId}`,
      ].sort();
      const buttonCapContact = [...observedContacts.values()].some(
        (contact) =>
          contact.pair[0] === buttonCapPair[0] &&
          contact.pair[1] === buttonCapPair[1],
      );
      return {
        kind,
        friction,
        restitution,
        impulse: impulseMagnitude,
        tiltDegrees,
        azimuthRadians:
          kind === "restart-button" ? restartAzimuthRadians : null,
        selectedCapTravelledDistance,
        selectedCapFinalDistance: Vector3.Distance(
          selectedCap.transformNode.position,
          selectedStart,
        ),
        selectedCapPeakRise: selectedCapPeakY - selectedStart.y,
        selectedCapMaximumSpeed,
        selectedCapFinalSpeed: speed(selectedCap),
        buttonTravelledDistance,
        buttonFinalSpeed: speed(button),
        buttonCapContact,
        settledAtSeconds,
        simulatedSeconds,
        contacts: [...observedContacts.values()],
      };
    } finally {
      capCollisions.remove(capObserver);
      buttonCollisions.remove(buttonObserver);
    }
  } finally {
    world?.dispose();
    engine.dispose();
  }
}

describe("real Havok calibration probe", () => {
  it("records the full provisional coefficient, impulse, and restart-tilt matrix", async () => {
    expect(COUNTERBALL_CONFIG_V1.bodies.capMass).toBe(1);
    const maximumTiltDegrees =
      (COUNTERBALL_CONFIG_V1.restart.maxButtonTiltRadians * 180) / Math.PI;
    expect(candidateTiltDegrees[4]).toBeLessThanOrEqual(
      maximumTiltDegrees + 1e-9,
    );

    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const initial = await readInitialState();
    const observations: TrialObservation[] = [];

    for (const friction of candidateFrictions) {
      for (const restitution of candidateRestitutions) {
        for (const impulse of candidateImpulses) {
          observations.push(
            runTrial(
              havok,
              initial,
              "direct-cap",
              friction,
              restitution,
              impulse,
              null,
            ),
          );
        }
        for (const tiltDegrees of candidateTiltDegrees) {
          for (const impulse of candidateImpulses) {
            observations.push(
              runTrial(
                havok,
                initial,
                "restart-button",
                friction,
                restitution,
                impulse,
                tiltDegrees,
              ),
            );
          }
        }
      }
    }

    expect(observations).toHaveLength(480);
    expect(
      observations.filter(({ kind }) => kind === "direct-cap"),
    ).toHaveLength(80);
    expect(
      observations.filter(({ kind }) => kind === "restart-button"),
    ).toHaveLength(400);
    for (const observation of observations) {
      for (const value of [
        observation.friction,
        observation.restitution,
        observation.impulse,
        observation.selectedCapTravelledDistance,
        observation.selectedCapFinalDistance,
        observation.selectedCapPeakRise,
        observation.selectedCapMaximumSpeed,
        observation.selectedCapFinalSpeed,
        observation.buttonTravelledDistance,
        observation.buttonFinalSpeed,
        observation.simulatedSeconds,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(
        observation.settledAtSeconds === null ||
          Number.isFinite(observation.settledAtSeconds),
      ).toBe(true);
      expect(
        observation.contacts.every(
          ({ observations: count, firstStep, lastStep, firstPoint }) =>
            Number.isFinite(count) &&
            Number.isFinite(firstStep) &&
            Number.isFinite(lastStep) &&
            (firstPoint === null ||
              [firstPoint.x, firstPoint.y, firstPoint.z].every(
                Number.isFinite,
              )),
        ),
      ).toBe(true);
    }
    expect(
      observations.some(
        ({ kind, selectedCapTravelledDistance }) =>
          kind === "direct-cap" && selectedCapTravelledDistance > 0.001,
      ),
    ).toBe(true);
    expect(
      observations.some(
        ({ kind, buttonCapContact }) =>
          kind === "restart-button" && buttonCapContact,
      ),
    ).toBe(true);

    console.info(
      `COUNTERBALL_CALIBRATION_PROBE ${JSON.stringify({
        babylonCore: "9.30.0",
        havokPackage: "1.3.14",
        wasm: "@babylonjs/havok/lib/esm/HavokPhysics.wasm",
        fixedStepSeconds,
        maximumProbeSeconds,
        settleWindowSeconds:
          COUNTERBALL_CONFIG_V1.simulation.settleWindowSeconds,
        linearSettleThreshold:
          COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold,
        angularSettleThreshold:
          COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold,
        candidateFrictions,
        candidateRestitutions,
        candidateImpulses,
        candidateTiltDegrees,
        restartAzimuthRadians,
        observedTrials: observations.length,
        observations,
      })}`,
    );
  }, 600_000);
});
