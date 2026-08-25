import { useState } from "react";
import type { GameState, ResearchResponse, Resource } from "../../types/game";
import { performResearch } from "../../services/api";

interface Props {
    gameState: GameState;
    playerId: string;
    onClose: () => void;
    onResult: (story: string) => void;
}

export default function ResearchPanel({ gameState, playerId, onClose, onResult }: Props) {
    const me = gameState.players.find((player) => player.playerId === playerId)!;

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
            const res: ResearchResponse = await performResearch(gameState.gameId, {
                playerId: playerId,
                item: item.trim(),
                resourcesUsed: Array.from(selectedResources),
            });
            onResult(`Researched: ${res.researchedItem} ${res.researchedItem?.itemEffect}`);
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Research failed.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="panel research-panel">
            <button className="close-btn" onClick={onClose}>X</button>
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
                    {me.resources.map((resource: Resource) => (
                        <label key={resource.resourceName} className="item-row">
                            <input
                                type="checkbox"
                                checked={selectedResources.has(resource.resourceName)}
                                onChange={() => toggleResource(resource.resourceName)}
                            />
                            &nbsp;<strong>{resource.resourceName}</strong>
                            <span className="item-qty"> ×{resource.quantity}</span>
                        </label>
                    ))}
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <button onClick={handleSubmit} disabled={loading || !item.trim()}>
                {loading ? "Researching…" : "Research"}
            </button>
        </div>
    );
}
