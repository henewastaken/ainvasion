import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGame } from "../../services/api";
import type { SessionCredentials } from "../../types/game";

interface Props {
    onSession: (creds: SessionCredentials) => void;
}

export default function CreateGame({ onSession }: Props) {
    const [name, setName] = useState("");
    const [gameId, setGameId] = useState<string | null>(null);
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
            {error && <p className="error">{error}</p>}
        </div>
    );
}
