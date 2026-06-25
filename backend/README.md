# World Domination — Backend

Python / FastAPI backend for the World Domination turn-based strategy game.
Handles game sessions, turn enforcement, game-engine logic, and AI outcome resolution.
Real-time state sync is delivered to all connected players via WebSocket.

## Requirements

- Python 3.11+
- pip / virtualenv

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload   # → http://localhost:8000
```

Interactive API docs are available at **http://localhost:8000/docs** once the server is running.

## Environment variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed frontend origins |

## Source structure

```
backend/
├── main.py                  # FastAPI app entry point — CORS, router registration
├── requirements.txt
├── .env.example
├── game/
│   ├── models.py            # Pydantic models for all request/response/state types
│   ├── map_data.py          # 33 European countries with army stats and adjacency graph
│   ├── state_manager.py     # In-memory session store (game_id → GameState)
│   └── game_engine.py       # Pure game logic: adjacency check, apply results, advance turn, victory
├── ai/
│   ├── prompts.py           # LLM prompt templates (ready to fill and send)
│   └── llm_client.py        # AI placeholder functions — swap TODO blocks for real LLM calls
└── routers/
    ├── lobby.py             # POST /game/create, /join/{id}, /start/{id}
    ├── game.py              # POST /game/{id}/action, /research  |  GET /game/map, /{id}/state
    └── ws.py                # WS /ws/{game_id}/{player_id} + broadcast() helper
```

## API reference

### Lobby

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/game/create` | `{ player_name }` | Create a new session. Returns `{ game_id, player_id }`. |
| `POST` | `/game/join/{game_id}` | `{ player_name }` | Join a pending session. Returns `{ player_id }`. |
| `POST` | `/game/start/{game_id}` | `{ player_id }` | Start the game (creator only). Triggers AI resource generation and broadcasts `game_started`. |

### Game

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/game/map` | — | Returns static map data (all countries, adjacency, default stats). |
| `GET` | `/game/{game_id}/state` | — | Returns current `GameState`. |
| `POST` | `/game/{game_id}/action` | `ActionRequest` | Attack or diplomacy action. Advances the turn. |
| `POST` | `/game/{game_id}/research` | `ResearchRequest` | Research action. Advances the turn. |

### WebSocket

```
WS /ws/{game_id}/{player_id}
```

Messages pushed from server → client:

| `type` | Payload | When |
|---|---|---|
| `game_started` | `{ state }` | Game starts after `POST /game/start` |
| `state_update` | `{ state }` | After any action or research |
| `game_over` | `{ state, winner_id }` | A player has conquered all countries |

## Integrating a real LLM

All AI calls are isolated in `ai/llm_client.py`. Each function is marked `# TODO` and returns mock data. To connect a real model:

1. Choose a provider (HuggingFace Inference API, Ollama, OpenAI-compatible endpoint, etc.).
2. Fill in the three `async` functions in `llm_client.py`:
   - `generate_country_resources(countries)` — called once at game start
   - `resolve_attack(...)` — called on every attack/diplomacy action
   - `resolve_research(...)` — called on every research action
3. The prompt strings in `ai/prompts.py` are ready to use — just `str.format(**kwargs)` them before sending.
4. Parse the model's JSON response and return the typed dataclass shown in each function's signature.

## Game rules implemented

- **One action per turn**: a player may attack/negotiate **or** research — not both. Both advance the turn.
- **Adjacency enforcement**: players can only target countries bordering their current empire.
- **Item inventory**: items are validated before use and consumed on success. Loot may be found after victorious battles.
- **Victory condition**: last player with an active empire, or single player owning all countries.
- **Networked multiplayer**: up to 10 players; each joins from their own device. Turn order is the join order.
