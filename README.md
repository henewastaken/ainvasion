# World Domination

A turn-based strategy game played on an interactive map of Europe, where the
outcomes of your battles, alliances, and research are narrated and decided by a
local AI. Conquer the continent by war or diplomacy — every action produces a
little piece of story.

> ⚠️ Early-stage hobby project. Things are rough and change often.

## What it is

Each player starts by owning a single country. On your turn you take **one**
action against a country bordering your empire, or spend the turn researching.
An LLM resolves what happens and writes the narrative, so no two games play out
the same way.

### Actions

- **War** — attack an adjacent country. You can spend **items** to swing the
  fight. The AI weighs army strength, morale, and whatever you brought to battle,
  then decides whether you take the country and how your armies fare. Winning
  battles can also turn up new items.
- **Diplomacy** — try to bring an adjacent country into your empire peacefully.
  You spend **resources** to sway them; a country's favourite/hated resources
  affect your chances. Resources are only consumed if the alliance is *rejected*.
- **Research** — instead of attacking, spend a turn (optionally burning items and
  resources) to have the AI invent a brand-new item for your arsenal, which you
  can later bring into battle.

### Resources & items

- Every country has an AI-generated **favourite** and **hated** resource,
  seeded when the game starts.
- Players begin with the native (favourite) resource of the countries they own.
- **Resources** fuel diplomacy and research; **items** are used in war and
  research. Both are consumed as you spend them.

### Winning

You win by either owning every country, or being the last player with any
territory left (in multiplayer).

## How it works

The game is a TypeScript backend + React frontend. Game state lives in memory on
the server (no database), and updates are pushed to all connected clients over
WebSockets in real time.

```
frontend (React + Vite)  ──HTTP──▶  backend (Express)
        ▲                             │
        └──────── WebSocket ──────────┘   (live state broadcasts)
                                          │
                                     Ollama (local LLM)
```

- **Backend** (`backend/`) — Express REST API for the lobby and game actions, a
  WebSocket server for live state broadcasts, and an AI layer that talks to a
  local [Ollama](https://ollama.com) model to resolve actions and generate
  content. Zod schemas define the game model.
- **Frontend** (`frontend/`) — React + Vite single-page app with an interactive
  D3-rendered map of Europe, a lobby for creating/joining games, and panels for
  actions, research, resources, items, and the running story log.

### Key backend pieces

| Path | Responsibility |
|------|----------------|
| `src/index.ts` | Express app + HTTP/WebSocket server bootstrap |
| `src/routes/lobby.ts` | Create / join / start a game |
| `src/routes/game.ts` | Perform actions (war, diplomacy) and research |
| `src/game/gameEngine.ts` | Adjacency, applying outcomes, turns, victory checks |
| `src/game/stateManager.ts` | In-memory game sessions |
| `src/game/mapData.ts` | Europe map: countries, stats, adjacency, start positions |
| `src/ai/llmClient.ts` | Ollama calls + JSON parsing |
| `src/ai/prompts.ts` | Prompt templates for each AI task |
| `src/ws/wsServer.ts` | WebSocket rooms and broadcasts |

## Running it

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Ollama](https://ollama.com) running locally with the model the backend uses
  (currently `smollm2`, configured in `backend/src/ai/llmClient.ts`):

  ```bash
  ollama pull smollm2
  # Ollama serves on http://localhost:11434 by default
  ```

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # optional — defaults are fine for local dev
npm run dev            # starts on http://localhost:8000
```

Environment variables (all optional):

- `PORT` — backend port (default `8000`)
- `CORS_ORIGINS` — comma-separated allowed origins (default
  `http://localhost:5173`)

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

Then open http://localhost:5173. The frontend talks to the backend at
`http://localhost:8000` by default; override with `VITE_API_URL` if needed.

### 3. Play

1. Create a game from the lobby — you're given a game ID.
2. Share the game ID so others can join (or open a second browser tab to play
   both sides locally).
3. The creator starts the game once everyone has joined. Starting triggers the
   AI to seed each country's resources, so it may take a moment.
4. Take turns attacking, allying, or researching until someone dominates Europe.

## Notes

- Game state is held in memory, so restarting the backend clears all games.
- Actions are resolved by a local LLM; response quality and speed depend on the
  model you run. Small local models can be flaky with JSON, so the AI layer
  sanitizes and re-parses responses defensively.
- The number of players is currently limited by the available start countries in
  `startCountries` (`backend/src/game/mapData.ts`) — expand that list to allow
  more players.
