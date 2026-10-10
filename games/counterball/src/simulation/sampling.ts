import {
  COUNTERBALL_PROTOCOL_LIMITS,
  ENTITY_IDS,
  QUATERNION_NORM_TOLERANCE,
  type BodyState,
  type CounterballConfig,
  type EntityId,
  type PlaybackFrame,
  type PlaybackTransform,
  type Quat,
  type Vec3,
} from "@korre/game-protocol";

export type PlaybackSamplingErrorCode =
  "invalidInput" | "invalidBody" | "resourceLimit";

/** A deterministic, engine-free error raised while building playback frames. */
export class PlaybackSamplingError extends Error {
  readonly code: PlaybackSamplingErrorCode;

  constructor(code: PlaybackSamplingErrorCode, message: string) {
    super(message);
    this.name = "PlaybackSamplingError";
    this.code = code;
  }
}

const canonicalEntityIds = new Set<string>(ENTITY_IDS);
const maximumFrames = COUNTERBALL_PROTOCOL_LIMITS.maxPlaybackFramesPerShot;

export type PlaybackSampler = {
  record(step: number, bodies: readonly BodyState[]): void;
  finish(): PlaybackFrame[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidBody(message: string): never {
  throw new PlaybackSamplingError("invalidBody", message);
}

function finiteVector3(value: unknown, bodyId: string): Vec3 {
  if (!isRecord(value)) {
    return invalidBody(`Body ${bodyId} has an invalid position.`);
  }

  const { x, y, z } = value;
  if (
    typeof x !== "number" ||
    !Number.isFinite(x) ||
    typeof y !== "number" ||
    !Number.isFinite(y) ||
    typeof z !== "number" ||
    !Number.isFinite(z)
  ) {
    return invalidBody(`Body ${bodyId} has a non-finite position.`);
  }

  return { x, y, z };
}

function finiteQuaternion(value: unknown, bodyId: string): Quat {
  if (!isRecord(value)) {
    return invalidBody(`Body ${bodyId} has an invalid rotation.`);
  }

  const { x, y, z, w } = value;
  if (
    typeof x !== "number" ||
    !Number.isFinite(x) ||
    typeof y !== "number" ||
    !Number.isFinite(y) ||
    typeof z !== "number" ||
    !Number.isFinite(z) ||
    typeof w !== "number" ||
    !Number.isFinite(w)
  ) {
    return invalidBody(`Body ${bodyId} has a non-finite rotation.`);
  }

  const norm = Math.sqrt(x * x + y * y + z * z + w * w);
  if (
    !Number.isFinite(norm) ||
    Math.abs(norm - 1) > QUATERNION_NORM_TOLERANCE
  ) {
    return invalidBody(`Body ${bodyId} has a non-normalized rotation.`);
  }

  return { x, y, z, w };
}

function copyTransforms(
  bodies: readonly PlaybackTransform[],
): PlaybackTransform[] {
  return bodies.map(({ id, position, rotation }) => ({
    id,
    position: { x: position.x, y: position.y, z: position.z },
    rotation: {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      w: rotation.w,
    },
  }));
}

function normalizeBodies(bodies: readonly BodyState[]): PlaybackTransform[] {
  if (!Array.isArray(bodies) || bodies.length !== ENTITY_IDS.length) {
    return invalidBody(
      `Expected exactly ${ENTITY_IDS.length} playback bodies.`,
    );
  }

  const byId = new Map<EntityId, PlaybackTransform>();
  for (const candidate of bodies as readonly unknown[]) {
    if (!isRecord(candidate)) {
      return invalidBody("Playback body must be an object.");
    }

    const candidateId = candidate["id"];
    if (
      typeof candidateId !== "string" ||
      !canonicalEntityIds.has(candidateId)
    ) {
      return invalidBody("Playback body has an unknown entity ID.");
    }

    const id = candidateId as EntityId;
    if (byId.has(id)) {
      return invalidBody(`Duplicate playback body ID: ${id}.`);
    }

    byId.set(id, {
      id,
      position: finiteVector3(candidate["position"], id),
      rotation: finiteQuaternion(candidate["rotation"], id),
    });
  }

  if (byId.size !== ENTITY_IDS.length) {
    return invalidBody(
      `Expected exactly ${ENTITY_IDS.length} unique playback bodies.`,
    );
  }

  return ENTITY_IDS.map((id) => {
    const body = byId.get(id);
    if (body === undefined) {
      return invalidBody(`Missing playback body ID: ${id}.`);
    }
    return body;
  });
}

function cloneFrame(frame: PlaybackFrame): PlaybackFrame {
  return { timeMs: frame.timeMs, bodies: copyTransforms(frame.bodies) };
}

/**
 * Create a one-shot fixed-step sampler for canonical, serializable playback.
 * The caller records step zero and then every fixed tick in order.
 */
export function createPlaybackSampler(
  config: Readonly<CounterballConfig>,
): PlaybackSampler {
  const { fixedStepSeconds, playbackSamplesPerSecond, maxShotDurationSeconds } =
    config.simulation;

  if (!Number.isFinite(fixedStepSeconds) || fixedStepSeconds <= 0) {
    throw new PlaybackSamplingError(
      "invalidInput",
      "Fixed-step duration must be a finite positive number.",
    );
  }
  if (
    !Number.isSafeInteger(playbackSamplesPerSecond) ||
    playbackSamplesPerSecond <= 0
  ) {
    throw new PlaybackSamplingError(
      "invalidInput",
      "Playback sample rate must be a positive integer.",
    );
  }
  if (!Number.isFinite(maxShotDurationSeconds) || maxShotDurationSeconds <= 0) {
    throw new PlaybackSamplingError(
      "invalidInput",
      "Maximum simulated duration must be a finite positive number.",
    );
  }

  const samplesPerStepInterval = fixedStepSeconds * playbackSamplesPerSecond;
  const rawSampleIntervalTicks = 1 / samplesPerStepInterval;
  const sampleIntervalTicks = Math.round(rawSampleIntervalTicks);
  const sampleRatioTolerance =
    Number.EPSILON * Math.max(1, Math.abs(rawSampleIntervalTicks)) * 8;
  if (
    !Number.isFinite(rawSampleIntervalTicks) ||
    !Number.isSafeInteger(sampleIntervalTicks) ||
    sampleIntervalTicks < 1 ||
    Math.abs(rawSampleIntervalTicks - sampleIntervalTicks) >
      sampleRatioTolerance
  ) {
    throw new PlaybackSamplingError(
      "invalidInput",
      "Playback sample rate must align to an integral number of fixed ticks.",
    );
  }

  const maximumTickRatio = maxShotDurationSeconds / fixedStepSeconds;
  const maximumTickTolerance =
    Number.EPSILON * Math.max(1, Math.abs(maximumTickRatio)) * 8;
  const maximumStep = Math.floor(maximumTickRatio + maximumTickTolerance);
  if (!Number.isSafeInteger(maximumStep) || maximumStep < 0) {
    throw new PlaybackSamplingError(
      "invalidInput",
      "Maximum simulated duration exceeds safe fixed-step bounds.",
    );
  }

  const frames: PlaybackFrame[] = [];
  let lastStep: number | undefined;
  let lastTimeMs: number | undefined;
  let lastBodies: PlaybackTransform[] | undefined;
  let finished = false;

  const appendFrame = (
    timeMs: number,
    bodies: readonly PlaybackTransform[],
  ): void => {
    if (frames.length >= maximumFrames) {
      throw new PlaybackSamplingError(
        "resourceLimit",
        `Playback would exceed ${maximumFrames} frames.`,
      );
    }
    frames.push({ timeMs, bodies: copyTransforms(bodies) });
  };

  return {
    record(step, bodies): void {
      if (finished) {
        throw new PlaybackSamplingError(
          "invalidInput",
          "Cannot record after playback sampling is finished.",
        );
      }
      if (!Number.isSafeInteger(step) || step < 0) {
        throw new PlaybackSamplingError(
          "invalidInput",
          "Playback step must be a non-negative safe integer.",
        );
      }
      const expectedStep = lastStep === undefined ? 0 : lastStep + 1;
      if (step !== expectedStep) {
        throw new PlaybackSamplingError(
          "invalidInput",
          `Expected playback step ${expectedStep}; received ${step}.`,
        );
      }
      if (step > maximumStep) {
        throw new PlaybackSamplingError(
          "resourceLimit",
          "Playback exceeds the configured maximum simulated duration.",
        );
      }

      const timeMs = step * fixedStepSeconds * 1_000;
      if (!Number.isFinite(timeMs)) {
        throw new PlaybackSamplingError(
          "resourceLimit",
          "Playback time is outside the finite numeric range.",
        );
      }

      const normalizedBodies = normalizeBodies(bodies);
      const isRegularSample = step % sampleIntervalTicks === 0;
      if (isRegularSample && frames.length >= maximumFrames) {
        throw new PlaybackSamplingError(
          "resourceLimit",
          `Playback would exceed ${maximumFrames} frames.`,
        );
      }

      // Commit sampler state only after this tick has passed all validation.
      lastStep = step;
      lastTimeMs = timeMs;
      lastBodies = normalizedBodies;
      if (isRegularSample) {
        appendFrame(timeMs, normalizedBodies);
      }
    },

    finish(): PlaybackFrame[] {
      if (finished) {
        throw new PlaybackSamplingError(
          "invalidInput",
          "Playback sampling can be finished only once.",
        );
      }
      finished = true;

      if (
        lastStep === undefined ||
        lastTimeMs === undefined ||
        lastBodies === undefined
      ) {
        throw new PlaybackSamplingError(
          "invalidInput",
          "Playback sampling requires a recorded step zero before finish.",
        );
      }

      if (lastStep % sampleIntervalTicks !== 0) {
        appendFrame(lastTimeMs, lastBodies);
      }

      return frames.map(cloneFrame);
    },
  };
}
