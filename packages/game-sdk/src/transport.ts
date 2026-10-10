import type {
  ActionEnvelope,
  ControlEnvelope,
  MatchState,
  ServerEvent,
} from "@korre/game-protocol";

export type Unsubscribe = () => void;
export type GameEventListener = (event: ServerEvent) => void;

/**
 * The local AI adapter and the authenticated network adapter implement this
 * same interface. Identity is carried by the transport/session, never by a
 * client-supplied team field in a game action.
 */
export interface GameTransport {
  connect(): Promise<void>;
  sendAction(action: ActionEnvelope): Promise<void>;
  sendControl(control: ControlEnvelope): Promise<void>;
  getSnapshot(): Promise<MatchState>;
  subscribe(listener: GameEventListener): Unsubscribe;
  dispose(): Promise<void>;
}
