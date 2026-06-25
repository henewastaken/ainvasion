import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { getGameState, startGame } from "../services/api";
import EuropeMap from "../components/Map/EuropeMap";
import ActionPanel from "../components/GamePanel/ActionPanel";
import ResearchPanel from "../components/GamePanel/ResearchPanel";
import ResourcePanel from "../components/GamePanel/ResourcePanel";
import StoryPanel from "../components/GamePanel/StoryPanel";
import type { GameState, Resource, SessionCredentials, WsMessage } from "../types/game";

interface Props {
    session: SessionCredentials | null;
}

type ActivePanel = "action" | "research" | null;

export default function GamePage({ session }: Props) {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [statusMsg, setStatusMsg] = useState<string>("");
    const [starting, setStarting] = useState(false);

    // Redirect to lobby if no session credentials
    useEffect(() => {
        if (!session) navigate("/");
    }, [session, navigate]);

    // Initial state load
    useEffect(() => {
        if (!gameId) return;
        getGameState(gameId)
            .then(setGameState)
            .catch(() => setStatusMsg("Could not load game state."));
    }, [gameId]);

    const handleWsMessage = useCallback((msg: WsMessage) => {
        if (msg.state) setGameState(msg.state);
        if (msg.type === "game_over") {
            const winner = msg.state?.players.find((p) => p.player_id === msg.winner_id);
            setStatusMsg(`🏆 Game over! ${winner?.name ?? "Someone"} has conquered Europe!`);
        }
    }, []);

    const { connected } = useWebSocket(
        gameId ?? null,
        session?.player_id ?? null,
        handleWsMessage
    );

    function handleCountryClick(countryName: string) {
        setSelectedCountry(countryName);
        setActivePanel("action");
    }

    function handleActionResult(story: string, newItems: Resource[]) {
        setStatusMsg(story);
        if (newItems.length > 0) {
            setStatusMsg((prev) => prev + ` (Found: ${newItems.map((i) => i.item_name).join(", ")})`);
        }
        setSelectedCountry(null);
        setActivePanel(null);
    }

    function handleResearchResult(story: string) {
        setStatusMsg(story);
        setActivePanel(null);
    }

    async function handleStartGame() {
        if (!gameId || !session) return;
        setStarting(true);
        try {
            await startGame(gameId, session.player_id);
        } catch {
            setStatusMsg("Failed to start game.");
        } finally {
            setStarting(false);
        }
    }

    if (!session || !gameState) {
        return <div className="loading">Loading game…</div>;
    }

    const me = gameState.players.find((p) => p.player_id === session.player_id);
    const isMyTurn =
        gameState.current_turn_player_id === session.player_id &&
        gameState.status === "active" &&
        me != null &&
        !me.has_acted_this_turn;
    const isCreator = gameState.creator_id === session.player_id;

    const currentPlayerName =
        gameState.players.find((p) => p.player_id === gameState.current_turn_player_id)?.name ?? "?";

    return (
        <div className="game-page">
            {/* ── Header bar ── */}
            <header className="game-header">
                <span>🌍 World Domination</span>
                <span>
                    Turn {gameState.turn_number} &nbsp;|&nbsp;
                    {isMyTurn ? "⚡ Your turn" : `Waiting for ${currentPlayerName}…`}
                </span>
                <span className={`ws-status ${connected ? "connected" : "disconnected"}`}>
                    {connected ? "● Live" : "○ Reconnecting…"}
                </span>
            </header>

            <div className="game-layout">
                {/* ── Left sidebar ── */}
                <aside className="sidebar left">
                    <ResourcePanel gameState={gameState} playerId={session.player_id} />

                    {gameState.status === "pending" && isCreator && (
                        <button
                            className="start-btn"
                            onClick={handleStartGame}
                            disabled={starting}
                        >
                            {starting ? "Starting…" : "▶ Start Game"}
                        </button>
                    )}

                    {gameState.status === "pending" && !isCreator && (
                        <p className="muted">Waiting for the host to start the game…</p>
                    )}

                    {isMyTurn && activePanel === null && (
                        <div className="action-choice">
                            <p>Choose your action:</p>
                            <p className="muted">Click an adjacent country on the map to attack/negotiate,</p>
                            <button onClick={() => setActivePanel("research")}>🔬 Research</button>
                        </div>
                    )}

                    {activePanel === "research" && (
                        <ResearchPanel
                            gameState={gameState}
                            playerId={session.player_id}
                            onClose={() => setActivePanel(null)}
                            onResult={handleResearchResult}
                        />
                    )}

                    {activePanel === "action" && selectedCountry && (
                        <ActionPanel
                            gameState={gameState}
                            playerId={session.player_id}
                            selectedCountry={selectedCountry}
                            onClose={() => { setActivePanel(null); setSelectedCountry(null); }}
                            onResult={handleActionResult}
                        />
                    )}
                </aside>

                {/* ── Map ── */}
                <main className="map-area">
                    {statusMsg && <div className="status-banner">{statusMsg}</div>}
                    <div className="game-id-display">Game ID: <code>{gameId}</code></div>
                    <EuropeMap
                        gameState={gameState}
                        playerId={session.player_id}
                        onCountryClick={handleCountryClick}
                    />
                </main>

                {/* ── Right sidebar ── */}
                <aside className="sidebar right">
                    <StoryPanel log={gameState.story_log} />
                </aside>
            </div>
        </div>
    );
}
