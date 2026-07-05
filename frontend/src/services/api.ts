import axios from "axios";
import type {
  ActionRequest,
  ActionResponse,
  ResearchRequest,
  ResearchResponse,
  GameState,
  Country,
} from "../types/game";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ── Lobby ─────────────────────────────────────────────────────────────────────

export async function createGame(
  playerName: string,
): Promise<{ gameId: string; playerId: string }> {
  const res = await api.post("/game/create", { playerName });
  console.log(res);

  return res.data;
}

export async function joinGame(
  gameId: string,
  playerName: string,
): Promise<{ playerId: string }> {
  const res = await api.post(`/game/${gameId}/join`, { playerName });
  return res.data;
}

export async function startGame(
  gameId: string,
  playerId: string,
): Promise<void> {
  await api.post(`/game/${gameId}/start`, { playerId });
}

// ── Game ──────────────────────────────────────────────────────────────────────

export async function getGameState(gameId: string): Promise<GameState> {
  const res = await api.get(`/game/${gameId}/state`);
  return res.data;
}

export async function getMap(): Promise<Record<string, Country>> {
  const res = await api.get("/game/map");
  return res.data;
}

export async function performAction(
  gameId: string,
  body: ActionRequest,
): Promise<ActionResponse> {
  const res = await api.post(`/game/${gameId}/action`, body);
  return res.data;
}

export async function performResearch(
  gameId: string,
  body: ResearchRequest,
): Promise<ResearchResponse> {
  const res = await api.post(`/game/${gameId}/research`, body);
  return res.data;
}
