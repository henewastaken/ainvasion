import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState, WsMessage } from "../types/game";

const WS_BASE = (import.meta.env.VITE_WS_URL ?? "ws://localhost:8000") as string;
const RECONNECT_DELAY_MS = 3000;

interface UseWebSocketReturn {
  gameState: GameState | null;
  connected: boolean;
  lastMessage: WsMessage | null;
}

export function useWebSocket(
  gameId: string | null,
  playerId: string | null,
  onMessage?: (msg: WsMessage) => void
): UseWebSocketReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (!gameId || !playerId) return;

    const url = `${WS_BASE}/ws/${gameId}/${playerId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        setLastMessage(msg);
        if (msg.state) {
          setGameState(msg.state);
        }
        onMessage?.(msg);
      } catch {
        // malformed message — ignore
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (shouldReconnect.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [gameId, playerId, onMessage]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { gameState, connected, lastMessage };
}
