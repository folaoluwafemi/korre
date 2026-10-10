import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { initializeHavokRuntime } from "./havokRuntime.js";

const require = createRequire(import.meta.url);

async function readPinnedHavokWasm(): Promise<ArrayBuffer> {
  const wasmPath =
    require.resolve("@babylonjs/havok/lib/esm/HavokPhysics.wasm");
  // Copy the bytes into a standalone ArrayBuffer accepted by Emscripten.
  return new Uint8Array(await readFile(wasmPath)).buffer;
}

describe("Havok runtime", () => {
  it("initializes the real pinned WASM and creates/releases a Havok world", async () => {
    const havok = await initializeHavokRuntime({
      wasmBinary: await readPinnedHavokWasm(),
    });

    expect(typeof havok.HP_World_Create).toBe("function");
    expect(typeof havok.HP_World_Release).toBe("function");

    const [createResult, worldId] = havok.HP_World_Create();
    // Emscripten exposes enum values as objects with a numeric `value` field.
    expect((createResult as unknown as { value: number }).value).toBe(0);
    expect(typeof worldId[0]).toBe("bigint");
    expect(
      (havok.HP_World_Release(worldId) as unknown as { value: number }).value,
    ).toBe(0);
  });
});
