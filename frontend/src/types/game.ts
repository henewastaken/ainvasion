// ── Mirrors backend Pydantic models exactly ──────────────────────────────────

export interface Resource {
  item_name: string;
  item_effect: string;
  quantity: number;
}

export interface Country {
  name: string;
  owner_id: string | null;
  army_strength: number;
  morale: number;
  adjacency: string[];
  favorite_resource: string | null;
  hated_resource: string | null;
}

export interface Player {
  player_id: string;
  name: string;
  empire: string[];
  resources: Resource[];
  army_strength: number;
  has_acted_this_turn: boolean;
}

export type GameStatus = "pending" | "active" | "finished";

export interface GameState {
  game_id: string;
  creator_id: string;
  players: Player[];
  countries: Record<string, Country>;
  current_turn_player_id: string;
  turn_number: number;
  story_log: string[];
  status: GameStatus;
  winner_id: string | null;
}

// ── Request / response shapes ─────────────────────────────────────────────────

export type AttackType = "war" | "diplomatic";

export interface ItemUsed {
  item_name: string;
  item_effect: string;
}

export interface ActionRequest {
  player_id: string;
  attack: string;
  attack_type: AttackType;
  items_used: ItemUsed[];
}

export interface ResearchRequest {
  player_id: string;
  item: string;
  resources_used: string[];
}

export interface ActionResponse {
  success: boolean;
  new_army_strength: number;
  enemy_army_strength: number;
  story: string;
  items: Resource[];
}

export interface ResearchResponse {
  researched_item: string;
  effects: string;
}

// ── WebSocket message types ───────────────────────────────────────────────────

export type WsMessageType = "game_started" | "state_update" | "game_over" | "error";

export interface WsMessage {
  type: WsMessageType;
  state?: GameState;
  winner_id?: string;
  message?: string;
}

// ── Local session credentials (stored in sessionStorage) ─────────────────────

export interface SessionCredentials {
  game_id: string;
  player_id: string;
  player_name: string;
}
