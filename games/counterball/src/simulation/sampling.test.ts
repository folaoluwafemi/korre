import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  type BodyState,
  type CounterballConfig,
  type EntityId,
} from "@korre/game-protocol";
import { describe, expect, it } from "vitest";
import {
  createPlaybackSampler,
  PlaybackSamplingError,
  type PlaybackSamplingErrorCode,
} from "./sampling.js";

function createBodies(): BodyState[] {
  return ENTITY_IDS.map((id, index) => ({
    id,
    position: { x: index / 10, y: 0.2, z: -index / 5 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    linearVelocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
  }));
}

function configWithSimulation(
  overrides: Partial<CounterballConfig["simulation"]>,
): Readonly<CounterballConfig> {
  return {
    ...COUNTERBALL_CONFIG_V1,
    simulation: {
      ...COUNTERBALL_CONFIG_V1.simulation,
      ...overrides,
    },
  };
}

function expectSamplingError(
  operation: () => void,
  code: PlaybackSamplingErrorCode,
): void {
  let caught: unknown;
  try {
    operation();
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(PlaybackSamplingError);
  expect(caught).toMatchObject({ code });
}

function createBody(id: EntityId): BodyState {
  const body = createBodies().find((candidate) => candidate.id === id);
  if (body === undefined) {
    throw new Error(`Test body ${id} was not created.`);
  }
  return body;
}

describe("pure playback sampler", () => {
  it("records t=0 and every fourth tick in canonical order with pose-only bodies", () => {
    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    const input = createBodies().reverse();

    for (let step = 0; step <= 8; step += 1) {
      sampler.record(step, input);
    }

    const frames = sampler.finish();
    expect(frames.map(({ timeMs }) => timeMs)).toEqual([
      0,
      4 * (1 / 120) * 1_000,
      8 * (1 / 120) * 1_000,
    ]);
    expect(frames[0]?.bodies.map(({ id }) => id)).toEqual(ENTITY_IDS);
    expect(frames[0]?.bodies[0]).toEqual({
      id: "button",
      position: { x: 0, y: 0.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    expect(Object.keys(frames[0]?.bodies[0] ?? {}).sort()).toEqual([
      "id",
      "position",
      "rotation",
    ]);
  });

  it("copies captured poses so later world mutation cannot change playback", () => {
    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    const bodies = createBodies();
    const button = bodies.find(({ id }) => id === "button");
    if (button === undefined) {
      throw new Error("Test button was not created.");
    }

    sampler.record(0, bodies);
    button.position.x = 123;
    button.rotation.w = 0;
    const frames = sampler.finish();

    expect(frames[0]?.bodies[0]?.position.x).toBe(0);
    expect(frames[0]?.bodies[0]?.rotation.w).toBe(1);
  });

  it("appends the exact non-periodic endpoint once", () => {
    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    sampler.record(0, createBodies());
    const endpoint = createBodies();
    endpoint[0]!.position.x = 7.25;
    sampler.record(1, endpoint);

    const frames = sampler.finish();
    expect(frames).toHaveLength(2);
    expect(frames[1]?.timeMs).toBe(1 * (1 / 120) * 1_000);
    expect(frames[1]?.bodies[0]?.position.x).toBe(7.25);
  });

  it("does not duplicate an endpoint on the regular sample interval", () => {
    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    for (let step = 0; step <= 4; step += 1) {
      sampler.record(step, createBodies());
    }

    const frames = sampler.finish();
    expect(frames).toHaveLength(2);
    expect(frames.map(({ timeMs }) => timeMs)).toEqual([
      0,
      4 * (1 / 120) * 1_000,
    ]);
  });

  it("uses finite step-derived fractional times for a valid alternate tick rate", () => {
    const fixedStepSeconds = 1 / 90;
    const sampler = createPlaybackSampler(
      configWithSimulation({ fixedStepSeconds, playbackSamplesPerSecond: 30 }),
    );
    sampler.record(0, createBodies());
    sampler.record(1, createBodies());

    const timeMs = sampler.finish()[1]?.timeMs;
    expect(timeMs).toBe(1 * fixedStepSeconds * 1_000);
    expect(Number.isFinite(timeMs)).toBe(true);
    expect(timeMs).not.toBe(Math.round(timeMs ?? 0));
  });

  it("rejects invalid playback rates and non-integral tick ratios", () => {
    expect(() =>
      createPlaybackSampler(
        configWithSimulation({ playbackSamplesPerSecond: 0 }),
      ),
    ).toThrow(PlaybackSamplingError);
    expect(() =>
      createPlaybackSampler(
        configWithSimulation({ playbackSamplesPerSecond: 30.5 }),
      ),
    ).toThrow(PlaybackSamplingError);
    expectSamplingError(
      () =>
        createPlaybackSampler(
          configWithSimulation({ playbackSamplesPerSecond: 25 }),
        ),
      "invalidInput",
    );
  });

  it("rejects missing, duplicate, and unknown body IDs", () => {
    const missing = createBodies().slice(1);
    const missingSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(
      () => missingSampler.record(0, missing),
      "invalidBody",
    );

    const duplicate = createBodies();
    duplicate[duplicate.length - 1] = createBody("button");
    const duplicateSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(
      () => duplicateSampler.record(0, duplicate),
      "invalidBody",
    );

    const unknown = createBodies();
    unknown[0] = { ...unknown[0]!, id: "spectator-piece" as EntityId };
    const unknownSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(
      () => unknownSampler.record(0, unknown),
      "invalidBody",
    );
  });

  it("rejects non-finite positions and invalid quaternions", () => {
    const nonFinitePosition = createBodies();
    nonFinitePosition[0]!.position.y = Number.NaN;
    const positionSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(
      () => positionSampler.record(0, nonFinitePosition),
      "invalidBody",
    );

    const nonFiniteQuaternion = createBodies();
    nonFiniteQuaternion[0]!.rotation.x = Number.POSITIVE_INFINITY;
    const nonFiniteRotationSampler = createPlaybackSampler(
      COUNTERBALL_CONFIG_V1,
    );
    expectSamplingError(
      () => nonFiniteRotationSampler.record(0, nonFiniteQuaternion),
      "invalidBody",
    );

    const nonNormalizedQuaternion = createBodies();
    nonNormalizedQuaternion[0]!.rotation.w = 0.5;
    const normalizedRotationSampler = createPlaybackSampler(
      COUNTERBALL_CONFIG_V1,
    );
    expectSamplingError(
      () => normalizedRotationSampler.record(0, nonNormalizedQuaternion),
      "invalidBody",
    );
  });

  it("rejects negative, non-sequential, and skipped steps", () => {
    const negativeSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(
      () => negativeSampler.record(-1, createBodies()),
      "invalidInput",
    );

    const firstStepSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(
      () => firstStepSampler.record(1, createBodies()),
      "invalidInput",
    );

    const skippedSampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    skippedSampler.record(0, createBodies());
    expectSamplingError(
      () => skippedSampler.record(2, createBodies()),
      "invalidInput",
    );
  });

  it("enforces its one-shot finish lifecycle", () => {
    const emptySampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    expectSamplingError(() => emptySampler.finish(), "invalidInput");
    expectSamplingError(
      () => emptySampler.record(0, createBodies()),
      "invalidInput",
    );

    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    sampler.record(0, createBodies());
    sampler.finish();
    expectSamplingError(() => sampler.finish(), "invalidInput");
    expectSamplingError(
      () => sampler.record(1, createBodies()),
      "invalidInput",
    );
  });

  it("returns exactly 451 frames through the 15-second endpoint", () => {
    const sampler = createPlaybackSampler(COUNTERBALL_CONFIG_V1);
    const bodies = createBodies();
    for (let step = 0; step <= 1_800; step += 1) {
      sampler.record(step, bodies);
    }

    const frames = sampler.finish();
    expect(frames).toHaveLength(451);
    expect(frames[0]?.timeMs).toBe(0);
    expect(frames.at(-1)?.timeMs).toBe(15_000);
  });

  it("rejects time beyond the configured duration and never truncates frame overflow", () => {
    const shortDurationSampler = createPlaybackSampler(
      configWithSimulation({ maxShotDurationSeconds: 0.04 }),
    );
    for (let step = 0; step <= 4; step += 1) {
      shortDurationSampler.record(step, createBodies());
    }
    expectSamplingError(
      () => shortDurationSampler.record(5, createBodies()),
      "resourceLimit",
    );

    const denseSampler = createPlaybackSampler(
      configWithSimulation({ playbackSamplesPerSecond: 120 }),
    );
    const bodies = createBodies();
    for (let step = 0; step < 451; step += 1) {
      denseSampler.record(step, bodies);
    }
    expectSamplingError(
      () => denseSampler.record(451, bodies),
      "resourceLimit",
    );
  });
});
