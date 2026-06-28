# World Domination — Backend

Node.js backend for the World Domination turn-based strategy game.
Handles game sessions, turn enforcement, game-engine logic, and AI outcome resolution.

## Requirements

- Node.js 20+

## Setup

```bash
npm install
cp .env.example .env
npm run dev   # → http://localhost:8000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |

## Environment variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed frontend origins |
| `PORT` | `8000` | Port the server listens on |

## Source structure

```
backend/
├── src/
│   ├── index.ts              # Express app entry point — CORS, route registration
│   ├── routes/
│   │   ├── lobby.ts          # POST /game/create, /join/:id, /start/:id
│   │   └── game.ts           # POST /game/:id/action, /research  |  GET /game/map, /:id/state
│   ├── game/
│   │   ├── models.ts         # Zod schemas for all request/response/state types
│   │   ├── mapData.ts        # 33 European countries with army stats and adjacency graph
│   │   ├── stateManager.ts   # In-memory session store (gameId → GameState)
│   │   └── gameEngine.ts     # Pure game logic: adjacency check, apply results, advance turn, victory
│   └── ai/
│       ├── prompts.ts        # LLM prompt templates
│       └── llmClient.ts      # AI functions — swap TODO blocks for real LLM calls
├── package.json
├── tsconfig.json
└── .env.example
```

## API reference

### Lobby

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/game/create` | `{ player_name }` | Create a new session. Returns `{ game_id, player_id }`. |
| `POST` | `/game/join/:game_id` | `{ player_name }` | Join a pending session. Returns `{ player_id }`. |
| `POST` | `/game/start/:game_id` | `{ player_id }` | Start the game (creator only). |

### Game

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/game/map` | — | Returns static map data (all countries, adjacency, default stats). |
| `GET` | `/game/:game_id/state` | — | Returns current `GameState`. Poll this after each action. |
| `POST` | `/game/:game_id/action` | `ActionRequest` | Attack or diplomacy action. Advances the turn. |
| `POST` | `/game/:game_id/research` | `ResearchRequest` | Research action. Advances the turn. |

## Integrating a real LLM

All AI calls are isolated in `src/ai/llmClient.ts`. Each function is a stub marked `// TODO`. To connect a real model:

1. Choose a provider (Ollama, OpenAI-compatible endpoint, Anthropic, etc.).
2. Fill in the three async functions in `llmClient.ts`:
   - `generateCountryResources(countries)` — called once at game start
   - `resolveAttack(...)` — called on every attack/diplomacy action
   - `resolveResearch(...)` — called on every research action
3. The prompt strings in `ai/prompts.ts` are ready to use.
