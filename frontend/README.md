# World Domination — Frontend

React + TypeScript frontend for the World Domination turn-based strategy game.
Built with Vite, axios, and react-router-dom. Real-time state sync via WebSocket.

## Requirements

- Node.js 18+
- Backend running at `http://localhost:8000` (see `../backend/README.md`)

## Setup

```bash
cp .env.example .env   # copy environment config
npm install
npm run dev            # → http://localhost:5173
```

## Environment variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend REST base URL |
| `VITE_WS_URL` | `ws://localhost:8000` | Backend WebSocket base URL |

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript-check + production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` | ESLint |

## Source structure

```
src/
├── types/game.ts              # Shared TypeScript interfaces (mirrors backend models)
├── services/api.ts            # Axios wrappers for all REST endpoints
├── hooks/useWebSocket.ts      # WebSocket hook with auto-reconnect
├── data/
│   ├── placeholderMapData.ts  # 33-country grid layout (replace with real SVG paths post-MVP)
│   └── colors.ts              # Player palette & highlight colours
├── components/
│   ├── Lobby/
│   │   ├── CreateGame.tsx     # Create a new session, display shareable Game ID
│   │   └── JoinGame.tsx       # Join an existing session by Game ID
│   ├── Map/
│   │   └── EuropeMap.tsx      # SVG map — highlights adjacent countries, hover tooltips
│   └── GamePanel/
│       ├── ActionPanel.tsx    # War / Diplomatic action + item selection
│       ├── ResearchPanel.tsx  # Research action + resource selection
│       ├── ResourcePanel.tsx  # Player inventory and scoreboard sidebar
│       └── StoryPanel.tsx     # Auto-scrolling AI story log
├── pages/
│   ├── LobbyPage.tsx          # Create / Join tabs
│   └── GamePage.tsx           # Main game view: map + sidebars + turn control
├── App.tsx                    # React Router setup (/ and /game/:gameId)
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## Replacing the placeholder map

The current map renders countries as a labelled rectangle grid for MVP purposes.
To swap in a real SVG Europe map:

1. Add real `<path>` data to `src/data/placeholderMapData.ts` (or create a new data file).
2. Update `EuropeMap.tsx` to render `<path>` elements instead of `<rect>` elements.
3. No other files need to change — country IDs and adjacency logic live in the backend.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
