import { useState } from "react";
import type { GameState, Resource } from "../../types/game";
import { performResearch } from "../../services/api";

interface Props {
    gameState: GameState;
    playerId: string;
    onClose: () => void;
    onResult: (story: string) => void;
}

export default function ResearchPanel({ gameState, playerId, onClose, onResult }: Props) {
    const me = gameState.players.find((p) => p.player_id === playerId)!;

    const [item, setItem] = useState("");
    const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function toggleResource(name: string) {
        setSelectedResources((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    async function handleSubmit() {
        if (!item.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await performResearch(gameState.game_id, {
                player_id: playerId,
                item: item.trim(),
                resources_used: Array.from(selectedResources),
            });
            onResult(`Researched: ${res.researched_item} — ${res.effects}`);
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Research failed.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="panel research-panel">
            <button className="close-btn" onClick={onClose}>✕</button>
            <h3>Research</h3>
            <input
                type="text"
                placeholder="What do you want to research?"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                maxLength={80}
            />

            {me.resources.length > 0 && (
                <div className="item-picker">
                    <p>Aid with resources (optional):</p>
                    {me.resources.map((r: Resource) => (
                        <label key={r.item_name} className="item-row">
                            <input
                                type="checkbox"
                                checked={selectedResources.has(r.item_name)}
                                onChange={() => toggleResource(r.item_name)}
                            />
                            &nbsp;<strong>{r.item_name}</strong>
                            <span className="item-qty"> ×{r.quantity}</span>
                        </label>
                    ))}
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <button onClick={handleSubmit} disabled={loading || !item.trim()}>
                {loading ? "Researching…" : "🔬 Research"}
            </button>
        </div>
    );
}
