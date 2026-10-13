/**
 * Package-owned Vite asset-query declarations used by the browser diagnostic runner.
 * Keep these package-owned so Counterball typechecks without depending on the
 * web app's installed files or adding Vite as a runtime dependency.
 */
declare module "*?url" {
  const src: string;
  export default src;
}

declare module "*?raw" {
  const src: string;
  export default src;
}
