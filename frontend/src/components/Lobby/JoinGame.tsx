import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinGame } from "../../services/api";
import type { SessionCredentials } from "../../types/game";

interface Props {
    onSession: (creds: SessionCredentials) => void;
}

export default function JoinGame({ onSession }: Props) {
    const [name, setName] = useState("");
    const [gameId, setGameId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleJoin() {
        if (!name.trim() || !gameId.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const { playerId } = await joinGame(gameId.trim(), name.trim());
            const creds: SessionCredentials = {
                gameId: gameId.trim(),
                playerId,
                playerName: name.trim(),
            };
            onSession(creds);
            navigate(`/game/${gameId.trim()}`);
        } catch {
            setError("Could not join. Check the Game ID or the backend.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="lobby-card">
            <h2>Join Game</h2>
            <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
            />
            <input
                type="text"
                placeholder="Game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button onClick={handleJoin} disabled={loading || !name.trim() || !gameId.trim()}>
                {loading ? "Joining…" : "Join Game"}
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
}
