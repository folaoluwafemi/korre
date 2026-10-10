import type { GameTransport } from "./transport.js";
import type { GameManifest } from "./manifest.js";

export type GameSession = {
  playerId: string;
  username: string;
  role: "player" | "spectator";
  team?: "home" | "away";
};

export type GamePreferenceValue = string | number | boolean | null;
export type GamePreferences = Readonly<Record<string, GamePreferenceValue>>;

export type GameMountContext = {
  container: HTMLElement;
  session: GameSession;
  transport: GameTransport;
  preferences: GamePreferences;
};

export interface MountedGame {
  dispose(): Promise<void>;
}

export interface GameModule {
  readonly manifest: GameManifest;
  mount(context: GameMountContext): Promise<MountedGame>;
}

/**
 * Ensures an unmount race cannot dispose scene/listener resources twice.
 * Transport disposal remains the platform's responsibility.
 */
export function idempotentGameInstance(instance: MountedGame): MountedGame {
  let disposePromise: Promise<void> | undefined;
  return {
    dispose(): Promise<void> {
      if (disposePromise === undefined) {
        disposePromise = Promise.resolve().then(() => instance.dispose());
      }
      return disposePromise;
    },
  };
}

export async function mountGame(
  module: GameModule,
  context: GameMountContext,
): Promise<MountedGame> {
  return idempotentGameInstance(await module.mount(context));
}
