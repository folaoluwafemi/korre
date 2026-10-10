import HavokPhysics from "@babylonjs/havok";

/** The initialized API provided by the pinned @babylonjs/havok package. */
export type HavokRuntime = Awaited<ReturnType<typeof HavokPhysics>>;

/** Module overrides are forwarded to Emscripten's package loader unchanged. */
export type HavokRuntimeOptions = Parameters<typeof HavokPhysics>[0];

/**
 * Initialize the real pinned Havok WASM package.
 *
 * Browser callers can use the package defaults. Hosts that cannot fetch the
 * package's adjacent `.wasm` file (such as Node or a Worker bundle) must supply
 * the corresponding Emscripten loader override, for example `wasmBinary` or
 * `instantiateWasm`.
 */
export function initializeHavokRuntime(
  options?: HavokRuntimeOptions,
): Promise<HavokRuntime> {
  return HavokPhysics(options);
}
