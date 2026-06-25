import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# connections: game_id -> list of (player_id, WebSocket)
_connections: dict[str, list[tuple[str, WebSocket]]] = {}


@router.websocket("/ws/{game_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, player_id: str) -> None:
    await websocket.accept()

    if game_id not in _connections:
        _connections[game_id] = []

    # Replace any stale connection for the same player (reconnect)
    _connections[game_id] = [
        (pid, ws) for pid, ws in _connections[game_id] if pid != player_id
    ]
    _connections[game_id].append((player_id, websocket))

    try:
        while True:
            # Keep connection open; clients may send heartbeat pings as plain text.
            await websocket.receive_text()
    except WebSocketDisconnect:
        _connections[game_id] = [
            (pid, ws) for pid, ws in _connections.get(game_id, []) if pid != player_id
        ]


async def broadcast(game_id: str, message: dict) -> None:
    """Send a JSON message to every connected player in the given game session."""
    if game_id not in _connections:
        return

    payload = json.dumps(message, default=str)
    dead: list[tuple[str, WebSocket]] = []

    for player_id, ws in list(_connections[game_id]):
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append((player_id, ws))

    if dead:
        _connections[game_id] = [
            entry for entry in _connections[game_id] if entry not in dead
        ]
