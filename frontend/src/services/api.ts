import type {
  ActionRequest,
  ActionResponse,
  ResearchRequest,
  ResearchResponse,
  GameState,
  Country,
} from "../types/game";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * Thin fetch wrapper: prefixes the base URL, sends/receives JSON, and — unlike
 * fetch's default — throws on non-2xx responses, surfacing the backend's
 * `{ error }` message so callers can show it via `e.message`.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body — fall back to the HTTP status text.
    }
    throw new Error(message);
  }

  // Handle empty bodies (e.g. 204 No Content from startGame).
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const get = <T>(path: string): Promise<T> => request<T>(path);
const post = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

// ── Lobby ─────────────────────────────────────────────────────────────────────

export async function createGame(
  playerName: string,
): Promise<{ gameId: string; playerId: string }> {
  return post("/game/create", { playerName });
}

export async function joinGame(
  gameId: string,
  playerName: string,
): Promise<{ playerId: string }> {
  return post(`/game/${gameId}/join`, { playerName });
}

export async function startGame(
  gameId: string,
  playerId: string,
): Promise<void> {
  await post(`/game/${gameId}/start`, { playerId });
}

// ── Game ──────────────────────────────────────────────────────────────────────

export async function getGameState(gameId: string): Promise<GameState> {
  return get(`/game/${gameId}/state`);
}

export async function getMap(): Promise<Record<string, Country>> {
  return get("/game/map");
}

export async function performAction(
  gameId: string,
  body: ActionRequest,
): Promise<ActionResponse> {
  return post(`/game/${gameId}/action`, body);
}

export async function performResearch(
  gameId: string,
  body: ResearchRequest,
): Promise<ResearchResponse> {
  return post(`/game/${gameId}/research`, body);
}
