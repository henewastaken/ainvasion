import { useState } from "react";
import type { GameState, AttackType, ItemUsed, Resource } from "../../types/game";
import { performAction } from "../../services/api";

interface Props {
    gameState: GameState;
    playerId: string;
    selectedCountry: string;
    onClose: () => void;
    onResult: (story: string, newItems: Resource[]) => void;
}

export default function ActionPanel({
    gameState,
    playerId,
    selectedCountry,
    onClose,
    onResult,
}: Props) {
    const me = gameState.players.find((p) => p.player_id === playerId)!;
    const target = gameState.countries[selectedCountry];

    const [attackType, setAttackType] = useState<AttackType>("war");
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function toggleItem(itemName: string) {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            next.has(itemName) ? next.delete(itemName) : next.add(itemName);
            return next;
        });
    }

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        try {
            const items: ItemUsed[] = me.resources
                .filter((r) => selectedItems.has(r.item_name))
                .map((r) => ({ item_name: r.item_name, item_effect: r.item_effect }));

            const res = await performAction(gameState.game_id, {
                player_id: playerId,
                attack: selectedCountry,
                attack_type: attackType,
                items_used: items,
            });

            onResult(res.story, res.items);
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Action failed.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="panel action-panel">
            <button className="close-btn" onClick={onClose}>✕</button>
            <h3>Target: {selectedCountry}</h3>
            <p>
                Army: <strong>{target?.army_strength ?? "?"}</strong> &nbsp;|&nbsp;
                Morale: <strong>{target?.morale ?? "?"}</strong>
            </p>
            {target?.favorite_resource && (
                <p>
                    Favourite resource: <em>{target.favorite_resource}</em> &nbsp;|&nbsp;
                    Hated: <em>{target.hated_resource}</em>
                </p>
            )}

            <div className="attack-type">
                <label>
                    <input
                        type="radio"
                        value="war"
                        checked={attackType === "war"}
                        onChange={() => setAttackType("war")}
                    />
                    &nbsp;War
                </label>
                <label>
                    <input
                        type="radio"
                        value="diplomatic"
                        checked={attackType === "diplomatic"}
                        onChange={() => setAttackType("diplomatic")}
                    />
                    &nbsp;Diplomatic
                </label>
            </div>

            {me.resources.length > 0 && (
                <div className="item-picker">
                    <p>Use items (optional):</p>
                    {me.resources.map((r) => (
                        <label key={r.item_name} className="item-row">
                            <input
                                type="checkbox"
                                checked={selectedItems.has(r.item_name)}
                                onChange={() => toggleItem(r.item_name)}
                            />
                            &nbsp;<strong>{r.item_name}</strong>
                            <span className="item-effect"> — {r.item_effect}</span>
                            <span className="item-qty"> ×{r.quantity}</span>
                        </label>
                    ))}
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Resolving…" : `${attackType === "war" ? "⚔ Attack" : "🤝 Negotiate"}`}
            </button>
        </div>
    );
}
