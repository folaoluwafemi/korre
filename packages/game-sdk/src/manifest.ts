export type GameMode = "ai" | "online";

export type GameManifest = {
  id: string;
  version: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  supportsSpectators: boolean;
  modes: readonly GameMode[];
};

export const COUNTERBALL_GAME_MANIFEST: GameManifest = Object.freeze({
  id: "counterball",
  version: "0.1.0",
  name: "Counterball",
  minPlayers: 2,
  maxPlayers: 2,
  supportsSpectators: true,
  modes: Object.freeze(["ai", "online"] as const),
});
