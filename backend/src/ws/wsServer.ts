import type { IncomingMessage, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getSession } from "../game/stateManager";
import type { GameState } from "../game/models";

type WsMessageType = "game_started" | "state_update" | "game_over" | "error";

interface WsMessage {
  type: WsMessageType;
  state?: GameState;
  winnerId?: string | null;
  message?: string;
}

// gameId -> set of live sockets subscribed to that game.
const rooms = new Map<string, Set<WebSocket>>();

// Attach a WebSocket server to the existing HTTP server. Clients connect to
// ws://host/ws/<gameId>/<playerId> and receive game-state broadcasts.
export function attachWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url ?? "", "http://localhost");
    const match = pathname.match(/^\/ws\/([^/]+)\/([^/]+)\/?$/);
    if (!match) {
      socket.destroy();
      return;
    }
    const [, gameId, playerId] = match;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, gameId, playerId);
    });
  });

  wss.on(
    "connection",
    (ws: WebSocket, _req: IncomingMessage, gameId: string, playerId: string) => {
      const state = getSession(gameId);
      if (!state) {
        send(ws, { type: "error", message: "Game not found." });
        ws.close();
        return;
      }
      if (!state.players.some((p) => p.playerId === playerId)) {
        send(ws, { type: "error", message: "Player not in this game." });
        ws.close();
        return;
      }

      let room = rooms.get(gameId);
      if (!room) {
        room = new Set();
        rooms.set(gameId, room);
      }
      room.add(ws);

      // Send the current snapshot immediately so a late joiner is in sync.
      send(ws, { type: "state_update", state });

      ws.on("close", () => {
        const r = rooms.get(gameId);
        if (!r) return;
        r.delete(ws);
        if (r.size === 0) rooms.delete(gameId);
      });

      ws.on("error", () => ws.close());
    },
  );
}

function send(ws: WebSocket, msg: WsMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(gameId: string, msg: WsMessage): void {
  const room = rooms.get(gameId);
  if (!room) return;
  for (const ws of room) send(ws, msg);
}

// Push the current game state to every subscriber of a game.
export function broadcastState(gameId: string): void {
  const state = getSession(gameId);
  if (!state) return;
  broadcast(gameId, { type: "state_update", state });
}

export function broadcastGameStarted(gameId: string): void {
  const state = getSession(gameId);
  if (!state) return;
  broadcast(gameId, { type: "game_started", state });
}

export function broadcastGameOver(gameId: string): void {
  const state = getSession(gameId);
  if (!state) return;
  broadcast(gameId, { type: "game_over", state, winnerId: state.winnerId });
}
