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
export type {
  ButtonAssembly,
  ButtonHole,
  CapAssembly,
  PieceAssembly,
} from "./scene/pieces.js";

export const scaffoldPackage = "@korre/counterball/browser";
