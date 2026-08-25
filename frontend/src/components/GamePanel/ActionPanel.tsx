import { useState } from "react";
import type { GameState, AttackType, Item, ItemUsed } from "../../types/game";
import { performAction } from "../../services/api";

interface Props {
    gameState: GameState;
    playerId: string;
    selectedCountry: string;
    onClose: () => void;
    onResult: (story: string, newItems: Item[]) => void;
}

export default function ActionPanel({
    gameState,
    playerId,
    selectedCountry,
    onClose,
    onResult,
}: Props) {
    const me = gameState.players.find((player) => player.playerId === playerId)!;
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
            const items: ItemUsed[] = me.items
                .filter((item) => selectedItems.has(item.itemName))
                .map((item) => ({ itemName: item.itemName, itemEffect: item.itemEffect }));

            const res = await performAction(gameState.gameId, {
                playerId: playerId,
                target: selectedCountry,
                attackType: attackType,
                itemsUsed: items,
            });

            onResult(res.story, res.itemsFound);
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Action failed.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="panel action-panel">
            <button className="close-btn" onClick={onClose}>X</button>
            <h3>Target: {selectedCountry}</h3>
            <p>
                Army: <strong>{target?.armyStrength ?? "?"}</strong> &nbsp;|&nbsp;
                Morale: <strong>{target?.morale ?? "?"}</strong>
            </p>
            {target?.favoriteResource && (
                <p>
                    Favourite resource: <em>{target.favoriteResource}</em> &nbsp;|&nbsp;
                    Hated: <em>{target.hatedResource}</em>
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

            {me.items.length > 0 && (
                <div className="item-picker">
                    <p>Use items (optional):</p>
                    {me.items.map((item) => (
                        <label key={item.itemName} className="item-row">
                            <input
                                type="checkbox"
                                checked={selectedItems.has(item.itemName)}
                                onChange={() => toggleItem(item.itemName)}
                            />
                            &nbsp;<strong>{item.itemName}</strong>
                            <span className="item-effect"> {item.itemEffect}</span>
                            <span className="item-qty"> ×{item.quantity}</span>
                        </label>
                    ))}
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Resolving…" : `${attackType === "war" ? "Attack" : "Negotiate"}`}
            </button>
        </div>
    );
}
