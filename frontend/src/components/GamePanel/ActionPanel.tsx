import { useState } from "react";
import type { GameState, AttackType, Item, ItemOrResourceUsed } from "../../types/game";
import { performAction } from "../../services/api";

// War spends items; diplomacy spends resources. Both are sent to the backend as
// the generic `itemsUsed` list (name + effect), so we normalise to that shape.
type Spendable = { name: string; effect: string; quantity: number };

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

    // The things the player can spend depend on the action: items for war,
    // resources for diplomacy.
    const spendable: Spendable[] =
        attackType === "war"
            ? me.items.map((i) => ({ name: i.itemName, effect: i.itemEffect, quantity: i.quantity }))
            : me.resources.map((r) => ({ name: r.resourceName, effect: r.resourceEffect, quantity: r.quantity }));

    function toggleItem(name: string) {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    function selectAttackType(type: AttackType) {
        setAttackType(type);
        setSelectedItems(new Set()); // item and resource pools don't overlap
    }

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        try {
            const itemOrResource: ItemOrResourceUsed[] = spendable
                .filter((s) => selectedItems.has(s.name))
                .map((s) => ({ itemOrResourceName: s.name, itemOrResourceEffect: s.effect }));

            const res = await performAction(gameState.gameId, {
                playerId: playerId,
                target: selectedCountry,
                attackType: attackType,
                itemsOrResourceUsed: itemOrResource,
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
                        onChange={() => selectAttackType("war")}
                    />
                    &nbsp;War
                </label>
                <label>
                    <input
                        type="radio"
                        value="diplomatic"
                        checked={attackType === "diplomatic"}
                        onChange={() => selectAttackType("diplomatic")}
                    />
                    &nbsp;Diplomatic
                </label>
            </div>

            {spendable.length > 0 && (
                <div className="item-picker">
                    <p>{attackType === "war" ? "Use items:" : "Offer resources:"}</p>
                    {spendable.map((s) => (
                        <label key={s.name} className="item-row">
                            <input
                                type="checkbox"
                                checked={selectedItems.has(s.name)}
                                onChange={() => toggleItem(s.name)}
                            />
                            &nbsp;<strong>{s.name}</strong>
                            <span className="item-effect"> {s.effect}</span>
                            <span className="item-qty"> ×{s.quantity}</span>
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
