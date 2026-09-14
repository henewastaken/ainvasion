import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGame, joinGame } from "../../services/api";
import type { LocalPlayer, SessionCredentials } from "../../types/game";

interface Props {
    onSession: (creds: SessionCredentials) => void;
}

type Mode = "online" | "local";

// Soft cap for the local player list. The backend limits players to the number
// of available start countries and will reject extras with a clear error, so
// this is only here to keep the form from growing unbounded.
const MAX_LOCAL_PLAYERS = 8;

export default function CreateGame({ onSession }: Props) {
    const [mode, setMode] = useState<Mode>("online");

    // Online mode
    const [name, setName] = useState("");
    const [gameId, setGameId] = useState<string | null>(null);

    // Local ("pass & play") mode: one name per player, first is the host.
    const [localNames, setLocalNames] = useState<string[]>(["", ""]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleCreate() {
        if (!name.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const { gameId, playerId } = await createGame(name.trim());
            const creds: SessionCredentials = { gameId, playerId, playerName: name.trim() };
            onSession(creds);
            setGameId(gameId);
        } catch {
            setError("Failed to create game. Is the backend running?");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateLocal() {
        const names = localNames.map((name) => name.trim()).filter(Boolean);
        if (names.length < 2) {
            setError("Add at least two players for a local game.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Host creates the game, everyone else joins it — same APIs the
            // online lobby uses, just driven from a single device.
            const { gameId, playerId } = await createGame(names[0]);
            const localPlayers: LocalPlayer[] = [{ playerId, playerName: names[0] }];

            for (const playerName of names.slice(1)) {
                const { playerId: joinedId } = await joinGame(gameId, playerName);
                localPlayers.push({ playerId: joinedId, playerName });
            }

            const creds: SessionCredentials = {
                gameId,
                playerId,
                playerName: names[0],
                localPlayers,
            };
            onSession(creds);
            navigate(`/game/${gameId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create local game.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    function updateLocalName(index: number, value: string) {
        setLocalNames((prev) => prev.map((name, i) => (i === index ? value : name)));
    }

    function addLocalPlayer() {
        setLocalNames((prev) =>
            prev.length >= MAX_LOCAL_PLAYERS ? prev : [...prev, ""],
        );
    }

    function removeLocalPlayer(index: number) {
        setLocalNames((prev) =>
            prev.length <= 2 ? prev : prev.filter((_, i) => i !== index),
        );
    }

    // ── Online: created confirmation screen ──────────────────────────────────
    if (gameId) {
        return (
            <div className="lobby-card">
                <h2>Game created!</h2>
                <p>Share this Game ID with other players:</p>
                <code className="game-id">{gameId}</code>
                <button onClick={() => navigate(`/game/${gameId}`)}>Enter Lobby</button>
            </div>
        );
    }

    return (
        <div className="lobby-card">
            <h2>Create New Game</h2>

            <div className="mode-choice">
                <label>
                    <input
                        type="radio"
                        name="mode"
                        checked={mode === "online"}
                        onChange={() => { setMode("online"); setError(null); }}
                    />
                    &nbsp;Online multiplayer
                </label>
                <label>
                    <input
                        type="radio"
                        name="mode"
                        checked={mode === "local"}
                        onChange={() => { setMode("local"); setError(null); }}
                    />
                    &nbsp;Local (pass &amp; play)
                </label>
            </div>

            {mode === "online" ? (
                <>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        maxLength={32}
                    />
                    <button onClick={handleCreate} disabled={loading || !name.trim()}>
                        {loading ? "Creating…" : "Create Game"}
                    </button>
                </>
            ) : (
                <>
                    <p className="muted">
                        Everyone plays on this device, taking turns. Add each player below.
                    </p>
                    {localNames.map((playerName, i) => (
                        <div key={i} className="local-player-row">
                            <input
                                type="text"
                                placeholder={i === 0 ? "Player 1 (host)" : `Player ${i + 1}`}
                                value={playerName}
                                onChange={(e) => updateLocalName(i, e.target.value)}
                                maxLength={32}
                            />
                            {localNames.length > 2 && (
                                <button
                                    type="button"
                                    className="remove-player-btn"
                                    aria-label={`Remove player ${i + 1}`}
                                    onClick={() => removeLocalPlayer(i)}
                                >
                                    X
                                </button>
                            )}
                        </div>
                    ))}
                    {localNames.length < MAX_LOCAL_PLAYERS && (
                        <button
                            type="button"
                            className="add-player-btn"
                            onClick={addLocalPlayer}
                        >
                            Add player
                        </button>
                    )}
                    <button
                        onClick={handleCreateLocal}
                        disabled={
                            loading ||
                            localNames.map((name) => name.trim()).filter(Boolean).length < 2
                        }
                    >
                        {loading ? "Creating…" : "Start Local Game"}
                    </button>
                </>
            )}

            {error && <p className="error">{error}</p>}
        </div>
    );
}
