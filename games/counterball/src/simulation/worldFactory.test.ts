import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { parseMatchState, type MatchState } from "@korre/game-protocol";
import type { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin.js";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody.js";
import { describe, expect, it, vi } from "vitest";
import { initializeHavokRuntime, type HavokRuntime } from "./havokRuntime.js";
import { createCounterballWorld } from "./worldFactory.js";

type Fixture = { states: { initial: unknown } };

const require = createRequire(import.meta.url);

function getNativeWorldId(plugin: HavokPlugin): bigint {
  const handle: unknown = plugin.world;
  if (!Array.isArray(handle)) {
    throw new TypeError("Havok did not expose its expected world identifier.");
  }
  const id: unknown = (handle as readonly unknown[])[0];
  if (typeof id !== "bigint") {
    throw new TypeError("Havok returned an invalid world identifier.");
  }
  return id;
}

function getNativeBodyId(body: PhysicsBody): bigint {
  const pluginData: unknown = body._pluginData;
  if (
    typeof pluginData !== "object" ||
    pluginData === null ||
    !("hpBodyId" in pluginData)
  ) {
    throw new TypeError("Havok did not expose its expected body identifier.");
  }
  const handle: unknown = pluginData.hpBodyId;
  if (!Array.isArray(handle)) {
    throw new TypeError("Havok returned an invalid body identifier.");
  }
  const id: unknown = (handle as readonly unknown[])[0];
  if (typeof id !== "bigint") {
    throw new TypeError("Havok returned an invalid body identifier.");
  }
  return id;
}

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

describe("Counterball Havok world factory", () => {
  it.each([false, true])(
    "releases a real native world after collector construction fails (release throws: %s)",
    async (releaseThrows) => {
      const engine = new NullEngine();
      const havok = await initializeHavokRuntime({
        wasmBinary: await readPinnedHavokWasm(),
      });
      const state = await readInitialState();
      const originalScenes = [...engine.scenes];
      const constructionError = new Error(
        "Injected collector creation failure",
      );
      let allocatedWorld:
        ReturnType<HavokRuntime["HP_World_Create"]>[1] | undefined;
      const nativeCreate = havok.HP_World_Create.bind(havok);
      const nativeRelease = havok.HP_World_Release.bind(havok);
      const createWorld = vi
        .spyOn(havok, "HP_World_Create")
        .mockImplementationOnce(() => {
          const result = nativeCreate();
          allocatedWorld = result[1];
          return result;
        });
      const releaseWorld = vi.spyOn(havok, "HP_World_Release");
      if (releaseThrows) {
        releaseWorld.mockImplementationOnce((world) => {
          nativeRelease(world);
          throw new Error("Injected error after genuine world release");
        });
      }
      const createCollector = vi
        .spyOn(havok, "HP_QueryCollector_Create")
        .mockImplementationOnce(() => {
          throw constructionError;
        });

      try {
        let observedError: unknown;
        try {
          createCounterballWorld({
            engine,
            havok,
            state,
            gravity: Vector3.Zero(),
          });
        } catch (error) {
          observedError = error;
        }
        expect(observedError).toBe(constructionError);
        expect(allocatedWorld).toBeDefined();
        expect(typeof allocatedWorld![0]).toBe("bigint");
        expect(releaseWorld).toHaveBeenCalledExactlyOnceWith(allocatedWorld);
        expect(engine.scenes).toEqual(originalScenes);

        const recovered = createCounterballWorld({
          engine,
          havok,
          state,
          gravity: Vector3.Zero(),
        });
        try {
          expect(typeof getNativeWorldId(recovered.plugin)).toBe("bigint");
          expect(recovered.bodies.size).toBe(15);
        } finally {
          recovered.dispose();
        }
        expect(engine.scenes).toEqual(originalScenes);
        // One failed constructor allocation and one recovered world, each once.
        expect(releaseWorld).toHaveBeenCalledTimes(2);
      } finally {
        createCollector.mockRestore();
        createWorld.mockRestore();
        releaseWorld.mockRestore();
        engine.dispose();
      }
    },
  );

  it("releases the scene when plugin construction throws and preserves the error", async () => {
    const engine = new NullEngine();
    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const state = await readInitialState();
    const originalScenes = [...engine.scenes];
    const constructionError = new Error(
      "Injected native world creation failure",
    );
    // Inject failure before a native handle exists; all later calls use real WASM.
    const createWorld = vi
      .spyOn(havok, "HP_World_Create")
      .mockImplementationOnce(() => {
        throw constructionError;
      });

    try {
      let observedError: unknown;
      try {
        createCounterballWorld({
          engine,
          havok,
          state,
          gravity: Vector3.Zero(),
        });
      } catch (error) {
        observedError = error;
      }
      expect(observedError).toBe(constructionError);
      expect(engine.scenes).toEqual(originalScenes);

      const recovered = createCounterballWorld({
        engine,
        havok,
        state,
        gravity: Vector3.Zero(),
      });
      try {
        expect(typeof getNativeWorldId(recovered.plugin)).toBe("bigint");
        expect(recovered.bodies.size).toBe(15);
      } finally {
        recovered.dispose();
      }
      expect(engine.scenes).toEqual(originalScenes);
    } finally {
      createWorld.mockRestore();
      engine.dispose();
    }
  });

  it("builds a real Physics V2 scene with all canonical bodies and open goals", async () => {
    const engine = new NullEngine();
    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const state = await readInitialState();
    const world = createCounterballWorld({
      engine,
      havok,
      state,
      // No simulation step occurs in this construction-only packet.
      gravity: Vector3.Zero(),
    });

    try {
      expect(world.plugin.isSupported()).toBe(true);
      expect(world.plugin.world).toBeDefined();
      expect(world.scene.getPhysicsEngine()?.getPluginVersion()).toBe(2);
      expect([...world.bodies.keys()].sort()).toEqual(
        state.bodies.map(({ id }) => id).sort(),
      );
      expect(world.bodies.size).toBe(15);
      expect(world.staticBodies).toHaveLength(7);
      expect(
        [...world.bodies.values(), ...world.staticBodies].every(
          (body) => typeof getNativeBodyId(body) === "bigint",
        ),
      ).toBe(true);

      for (const [id, body] of world.bodies) {
        expect(body.isDisposed, `${id} must be live`).toBe(false);
        const { position, rotationQuaternion } = body.transformNode;
        expect(
          [position.x, position.y, position.z].every(Number.isFinite),
        ).toBe(true);
        expect(rotationQuaternion).not.toBeNull();
        expect(
          [
            rotationQuaternion!.x,
            rotationQuaternion!.y,
            rotationQuaternion!.z,
            rotationQuaternion!.w,
          ].every(Number.isFinite),
        ).toBe(true);
      }
    } finally {
      world.dispose();
      expect(world.plugin.world).toBeUndefined();
      expect(world.scene.getPhysicsEngine()).toBeNull();
      expect([...world.bodies.values()].every((body) => body.isDisposed)).toBe(
        true,
      );
      world.dispose();
      engine.dispose();
    }
  });

  it("allocates isolated native worlds and body handles per match", async () => {
    const engine = new NullEngine();
    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const state = await readInitialState();
    const first = createCounterballWorld({
      engine,
      havok,
      state,
      gravity: Vector3.Zero(),
    });
    const second = createCounterballWorld({
      engine,
      havok,
      state,
      gravity: Vector3.Zero(),
    });

    try {
      expect(getNativeWorldId(first.plugin)).not.toBe(
        getNativeWorldId(second.plugin),
      );
      expect(first.bodies.get("button")).not.toBe(second.bodies.get("button"));

      const firstNativeIds = new Set(
        [...first.bodies.values()].map(getNativeBodyId),
      );
      const secondNativeIds = new Set(
        [...second.bodies.values()].map(getNativeBodyId),
      );
      expect(firstNativeIds.size).toBe(15);
      expect(secondNativeIds.size).toBe(15);
      expect([...firstNativeIds].some((id) => secondNativeIds.has(id))).toBe(
        false,
      );

      first.dispose();
      expect(
        [...second.bodies.values()].every((body) => !body.isDisposed),
      ).toBe(true);
      expect(second.plugin.world).toBeDefined();
    } finally {
      first.dispose();
      second.dispose();
      engine.dispose();
    }
  });

  it("cleans a partially built world when a later body ID is duplicated", async () => {
    const engine = new NullEngine();
    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });
    const state = await readInitialState();
    const malformed = structuredClone(state);
    malformed.bodies[1]!.id = "button";

    try {
      expect(() =>
        createCounterballWorld({
          engine,
          havok,
          state: malformed,
          gravity: Vector3.Zero(),
        }),
      ).toThrow("Duplicate match body id: button.");

      // The same real Havok runtime must remain usable after failure cleanup.
      const recovered = createCounterballWorld({
        engine,
        havok,
        state,
        gravity: Vector3.Zero(),
      });
      try {
        expect(recovered.plugin.isSupported()).toBe(true);
        expect(recovered.bodies.size).toBe(15);
      } finally {
        recovered.dispose();
      }
    } finally {
      engine.dispose();
    }
  });
});
