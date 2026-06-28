import { randomUUID } from "crypto";
import { Country, GameState, Player } from "../game/models";
import { MAP_DATA, START_COUNTRIES } from "../game/mapData";

export const sessions = new Map<string, GameState>();

// Create a new game session. Returns { gameId, playerId }.
export function createSession(creatorName: string): {
  gameId: string;
  playerId: string;
} {
  const gameId = randomUUID();
  const playerId = randomUUID();

  const startCountry = START_COUNTRIES[0];

  const countries: Record<string, Country> = Object.fromEntries(
    Object.entries(MAP_DATA).map(([name, data]) => [
      name,
      { name, owner_id: null, ...data },
    ]),
  );
  countries[startCountry].owner_id = playerId;

  const player: Player = {
    player_id: playerId,
    name: creatorName,
    empire: [startCountry],
    resources: [],
    army_strength: 100,
    has_acted_this_turn: false,
  };

  const state: GameState = {
    game_id: gameId,
    creator_id: playerId,
    players: [player],
    countries,
    current_turn_player_id: playerId,
    turn_number: 1,
    story_log: [],
    status: "pending",
    winner_id: null,
  };

  sessions.set(gameId, state);
  return { gameId, playerId };
}
// Add a player to a pending session. Returns new player_id, or null if the
// game is full / not in pending state.
export function addPlayer(gameId: string, playerName: string): string | null {
  const state = sessions.get(gameId) as GameState | undefined;
  if (!state || state.status !== "pending") {
    return null; // game not found or not pending
  }

  if (state.players.length >= START_COUNTRIES.length) {
    return null; // lobby full
  }

  const playerId = randomUUID();
  const startCountry = START_COUNTRIES[state.players.length];
  state.countries[startCountry].owner_id = playerId;

  const player: Player = {
    player_id: playerId,
    name: playerName,
    empire: [startCountry],
    resources: [],
    army_strength: 0,
    has_acted_this_turn: false,
  };
  state.players.push(player);
  return playerId;
}
export function getSession(gameId: string): GameState | undefined {
  return sessions.get(gameId) as GameState | undefined;
}
export function updateState(gameId: string, state: GameState): void {
  sessions.set(gameId, state);
}
