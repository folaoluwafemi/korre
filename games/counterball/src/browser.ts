export { Engine } from "@babylonjs/core";
export { EngineStore } from "@babylonjs/core/Engines/engineStore.js";
export type { ArcRotateCamera } from "@babylonjs/core";
export { createCounterballScene } from "./scene/createScene.js";
export {
  createCounterballPresentation,
  pickCounterballEntity,
  updateCounterballPresentation,
} from "./scene/presentation.js";
export type { CounterballPieceRegistry } from "./scene/presentation.js";
export { createPieces } from "./scene/pieces.js";
export type {
  BodyState,
  CounterballConfig,
  TeamId,
} from "@korre/game-protocol";
export { COUNTERBALL_CONFIG_V1 } from "@korre/game-protocol";
export {
  runBrowserDirectProbe,
  type BrowserDirectProbeContact,
  type BrowserDirectProbeResult,
} from "./simulation/browserDirectProbe.js";
export type {
  ButtonAssembly,
  ButtonHole,
  CapAssembly,
  PieceAssembly,
} from "./scene/pieces.js";
export { runLoftCoarseMatrix } from "./simulation/loftCoarseRunner.js";
export type {
  LoftCoarseProgress,
  LoftCoarseRunOptions,
  LoftCoarseRunSummary,
} from "./simulation/loftCoarseRunner.js";
export type { LoftCoarseByteSink } from "./simulation/loftCoarseProbe.js";

export const scaffoldPackage = "@korre/counterball/browser";

export {
  runNativeContactOnsetProbe,
  type NativeContactOnsetProof,
} from "./simulation/nativeContactOnsetProbe.js";
