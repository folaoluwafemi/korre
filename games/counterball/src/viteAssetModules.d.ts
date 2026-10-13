/**
 * Narrow Vite asset-query declarations used by the browser diagnostic runner.
 * Keep these package-owned so Counterball typechecks without depending on the
 * web app's installed files or adding Vite as a runtime dependency.
 */
declare module "*HavokPhysics.wasm?url" {
  const url: string;
  export default url;
}

declare module "*counterball-v1.json?raw" {
  const text: string;
  export default text;
}
