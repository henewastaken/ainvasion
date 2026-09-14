import type { GameState, Item } from "../../types/game";

interface Props {
    gameState: GameState;
    playerId: string;
}

// Items are earned in battle or through research and are spent when waging war.
// Starting resources live in the separate ResourcePanel.
export default function ItemPanel({ gameState, playerId }: Props) {
    const me = gameState.players.find((player) => player.playerId === playerId);
    if (!me) return null;

    return (
        <div className="panel item-panel">
            <h3>Your Items</h3>
            {me.items.length === 0 ? (
                <p className="muted">No items yet. Win battles or research to gain them.</p>
            ) : (
                <ul>
                    {me.items.map((item: Item) => (
                        <li key={item.itemName} className="item-row">
                            <strong>{item.itemName}</strong>
                            <span className="item-qty"> ×{item.quantity}</span>
                            <br />
                            <span className="item-effect">{item.itemEffect}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
