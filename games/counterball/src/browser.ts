export { Engine } from "@babylonjs/core";
export { createCounterballScene } from "./scene/createScene.js";
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
