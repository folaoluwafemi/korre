import { describe, expect, it } from "vitest";
import fixtureJson from "../../../tests/fixtures/counterball-v1.json";
import { parseMatchState, parseServerEvent } from "@korre/game-protocol";
import type {
  ActionEnvelope,
  ControlEnvelope,
  MatchState,
  ServerEvent,
} from "@korre/game-protocol";
import { COUNTERBALL_GAME_MANIFEST, mountGame } from "./index.js";
import type { GameModule, GameTransport, Unsubscribe } from "./index.js";

const snapshot = parseMatchState(
  (fixtureJson as { states: { initial: unknown } }).states.initial,
);

class TestTransport implements GameTransport {
  readonly sentActions: ActionEnvelope[] = [];
  readonly sentControls: ControlEnvelope[] = [];
  disconnectCount = 0;
  private readonly listeners = new Set<(event: ServerEvent) => void>();

  constructor(private readonly state: MatchState) {}

  connect(): Promise<void> {
    return Promise.resolve();
  }

  sendAction(action: ActionEnvelope): Promise<void> {
    this.sentActions.push(action);
    return Promise.resolve();
  }

  sendControl(control: ControlEnvelope): Promise<void> {
    this.sentControls.push(control);
    return Promise.resolve();
  }

  getSnapshot(): Promise<MatchState> {
    return Promise.resolve(this.state);
  }

  subscribe(listener: (event: ServerEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: ServerEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  dispose(): Promise<void> {
    this.disconnectCount += 1;
    this.listeners.clear();
    return Promise.resolve();
  }
}

class LocalAITransport extends TestTransport implements GameTransport {}

class NetworkTransport extends TestTransport implements GameTransport {}

describe("Counterball game SDK", () => {
  it("publishes a two-player manifest with AI, online, and spectator support", () => {
    expect(COUNTERBALL_GAME_MANIFEST).toMatchObject({
      id: "counterball",
      name: "Counterball",
      minPlayers: 2,
      maxPlayers: 2,
      supportsSpectators: true,
      modes: ["ai", "online"],
    });
    expect(Object.isFrozen(COUNTERBALL_GAME_MANIFEST)).toBe(true);
    expect(Object.isFrozen(COUNTERBALL_GAME_MANIFEST.modes)).toBe(true);
  });

  it("uses the same transport contract for local and network adapters", async () => {
    const localAI = new LocalAITransport(snapshot);
    const network = new NetworkTransport(snapshot);
    const transports: GameTransport[] = [localAI, network];
    const action: ActionEnvelope = {
      type: "game.action",
      protocolVersion: 1,
      matchId: snapshot.matchId,
      actionId: "00000000-0000-4000-8000-000000000021",
      expectedStateVersion: snapshot.stateVersion,
      command: { type: "shot", capId: "home-0", yaw: 0, power: 0.4 },
    };
    const control: ControlEnvelope = {
      type: "match.snapshot.request",
      protocolVersion: 1,
      matchId: snapshot.matchId,
      requestId: "00000000-0000-4000-8000-000000000022",
    };
    const event = parseServerEvent({
      type: "game.action.rejected",
      protocolVersion: 1,
      matchId: snapshot.matchId,
      eventSeq: 1,
      serverTimeMs: 10,
      actionId: action.actionId,
      code: "staleState",
      currentStateVersion: snapshot.stateVersion,
    });

    for (const transport of transports) {
      await transport.connect();
      await transport.sendAction(action);
      await transport.sendControl(control);
      expect(await transport.getSnapshot()).toBe(snapshot);
      const received: ServerEvent[] = [];
      const unsubscribe = transport.subscribe((message) =>
        received.push(message),
      );
      if (transport instanceof TestTransport) transport.emit(event);
      expect(received).toEqual([event]);
      unsubscribe();
      await transport.dispose();
    }

    expect(localAI.sentActions).toEqual([action]);
    expect(network.sentActions).toEqual([action]);
    expect(localAI.sentControls).toEqual([control]);
    expect(network.sentControls).toEqual([control]);
    expect(localAI.disconnectCount).toBe(1);
    expect(network.disconnectCount).toBe(1);
    expect(JSON.stringify(action)).not.toContain("team");
    expect(JSON.stringify(action)).not.toContain("actor");
  });

  it("mounts a game module and disposes its mounted resources exactly once", async () => {
    let disposeCount = 0;
    const module: GameModule = {
      manifest: COUNTERBALL_GAME_MANIFEST,
      mount() {
        return Promise.resolve({
          dispose() {
            disposeCount += 1;
            return Promise.resolve();
          },
        });
      },
    };
    const context = {
      container: {} as HTMLElement,
      session: {
        playerId: "00000000-0000-4000-8000-000000000031",
        username: "player-one",
        role: "player" as const,
        team: "home" as const,
      },
      transport: new LocalAITransport(snapshot),
      preferences: Object.freeze({ camera: "near" }),
    };

    const mounted = await mountGame(module, context);
    const firstDisposal = mounted.dispose();
    const secondDisposal = mounted.dispose();
    expect(firstDisposal).toBe(secondDisposal);
    await Promise.all([firstDisposal, secondDisposal]);
    expect(disposeCount).toBe(1);
  });
});
