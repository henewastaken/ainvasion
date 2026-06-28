import { randomUUID } from "crypto";
import { Country, GameState, Player } from "../game/models";
import { mapData, startCountries } from "../game/mapData";

export const sessions = new Map<string, GameState>();

// Create a new game session. Returns { gameId, playerId }.
export function createSession(creatorName: string): {
  gameId: string;
  playerId: string;
} {
  const gameId = randomUUID();
  const playerId = randomUUID();

  const startCountry = startCountries[0];

  const countries: Record<string, Country> = Object.fromEntries(
    Object.entries(mapData).map(([name, data]) => [
      name,
      { name, ownerId: null, ...data },
    ]),
  );
  countries[startCountry].ownerId = playerId;

  const player: Player = {
    playerId: playerId,
    name: creatorName,
    empire: [startCountry],
    resources: [],
    armyStrength: 100,
    hasActedThisTurn: false,
  };

  const state: GameState = {
    gameId: gameId,
    creatorId: playerId,
    players: [player],
    countries,
    currentTurnPlayerId: playerId,
    turnNumber: 1,
    storyLog: [],
    status: "pending",
    winnerId: null,
  };

  sessions.set(gameId, state);
  return { gameId, playerId };
}
// Add a player to a pending session. Returns new playerId, or null if the
// game is full / not in pending state.
export function addPlayer(gameId: string, playerName: string): string | null {
  const state = sessions.get(gameId) as GameState | undefined;
  if (!state || state.status !== "pending") {
    return null; // game not found or not pending
  }

  if (state.players.length >= startCountries.length) {
    return null; // lobby full
  }

  const playerId = randomUUID();
  const startCountry = startCountries[state.players.length];
  state.countries[startCountry].ownerId = playerId;

  const player: Player = {
    playerId: playerId,
    name: playerName,
    empire: [startCountry],
    resources: [],
    armyStrength: 0,
    hasActedThisTurn: false,
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
