// ── Mirrors backend Pydantic models exactly ──────────────────────────────────

export interface Item {
  itemName: string;
  itemEffect: string;
  quantity: number;
}
export interface Resource {
  resourceName: string;
  resourceEffect: string;
  quantity: number;
}

export interface Country {
  name: string;
  ownerId: string | null;
  armyStrength: number;
  morale: number;
  adjacency: string[];
  favoriteResource: string | null;
  hatedResource: string | null;
}

export interface Player {
  playerId: string;
  name: string;
  empire: string[];
  resources: Resource[];
  items: Item[];
  armyStrength: number;
  morale: number;
  hasActedThisTurn: boolean;
}

export type GameStatus = "pending" | "active" | "finished";

export interface GameState {
  gameId: string;
  creatorId: string;
  players: Player[];
  countries: Record<string, Country>;
  currentTurnPlayerId: string;
  turnNumber: number;
  storyLog: string[];
  status: GameStatus;
  winnerId: string | null;
}

// ── Request / response shapes ─────────────────────────────────────────────────

export type AttackType = "war" | "diplomatic";

export interface ItemUsed {
  itemName: string;
  itemEffect: string;
}

export interface ActionRequest {
  playerId: string;
  target: string;
  attackType: AttackType;
  itemsUsed: ItemUsed[];
}

export interface ResearchRequest {
  playerId: string;
  item: string;
  resourcesUsed: string[];
}

export interface ActionResponse {
  success: boolean;
  newArmyStrength: number;
  enemyArmyStrength: number;
  story: string;
  itemsFound: Item[];
}

export interface DiplomacyResponse {
  success: boolean;
  story: string;
  itemsUsed: Item[];
  resourcesUsed: Resource[];
}

export interface ResearchResponse {
  success: boolean;
  story: string;
  itemsUsed: Item[];
  resourcesUsed: Resource[];
  researchedItem: Item | null;
}

// ── WebSocket message types ───────────────────────────────────────────────────

export type WsMessageType =
  | "game_started"
  | "state_update"
  | "game_over"
  | "error";

export interface WsMessage {
  type: WsMessageType;
  state?: GameState;
  winnerId?: string;
  message?: string;
}

// ── Local session credentials (stored in sessionStorage) ─────────────────────

/** One player controlled from this device in a local ("pass & play") game. */
export interface LocalPlayer {
  playerId: string;
  playerName: string;
}

export interface SessionCredentials {
  gameId: string;
  playerId: string;
  playerName: string;
  /**
   * Present only for local ("pass & play") games: every player sharing this
   * device, including the host. When set, GamePage acts as whichever of these
   * players' turn it currently is. Absent for online games.
   */
  localPlayers?: LocalPlayer[];
}
