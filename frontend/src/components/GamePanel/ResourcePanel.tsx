import type { GameState } from "../../types/game";
import { PLAYER_COLORS } from "../../data/colors";

interface Props {
    gameState: GameState;
    playerId: string;
}

export default function ResourcePanel({ gameState, playerId }: Props) {
    const me = gameState.players.find((p) => p.player_id === playerId);
    if (!me) return null;

    return (
        <div className="panel resource-panel">
            <h3>Your Resources</h3>
            {me.resources.length === 0 ? (
                <p className="muted">No items yet. Win battles or research to gain them.</p>
            ) : (
                <ul>
                    {me.resources.map((r) => (
                        <li key={r.item_name}>
                            <strong>{r.item_name}</strong>
                            <span className="item-qty"> ×{r.quantity}</span>
                            <br />
                            <span className="item-effect">{r.item_effect}</span>
                        </li>
                    ))}
                </ul>
            )}

            <hr />
            <h3>Players</h3>
            <ul>
                {gameState.players.map((p, idx) => (
                    <li key={p.player_id} style={{ color: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}>
                        <strong>{p.name}</strong>
                        {p.player_id === playerId && " (you)"}
                        {gameState.current_turn_player_id === p.player_id && " ◀ turn"}
                        <br />
                        <span className="muted">
                            Army: {p.army_strength} | Territories: {p.empire.length}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
