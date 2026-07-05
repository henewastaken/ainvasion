import type { GameState, Resource } from "../../types/game";
import { PLAYER_COLORS } from "../../data/colors";

interface Props {
    gameState: GameState;
    playerId: string;
}

export default function ResourcePanel({ gameState, playerId }: Props) {
    const me = gameState.players.find((player) => player.playerId === playerId);
    if (!me) return null;

    return (
        <div className="panel resource-panel">
            <h3>Your Resources</h3>
            {me.resources.length === 0 ? (
                <p className="muted">No items yet. Win battles or research to gain them.</p>
            ) : (
                <ul>
                    {me.resources.map((resource: Resource) => (
                        <li key={resource.resourceName} className="item-row">
                            <strong>{resource.resourceName}</strong>
                            <span className="item-qty"> ×{resource.quantity}</span>
                            <br />
                            <span className="item-effect">{resource.resourceEffect}</span>
                        </li>
                    ))}
                </ul>
            )}

            <hr />
            <h3>Players</h3>
            <ul>
                {gameState.players.map((player, idx) => (
                    <li key={player.playerId} style={{ color: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}>
                        <strong>{player.name}</strong>
                        {player.playerId === playerId && " (you)"}
                        {gameState.currentTurnPlayerId === player.playerId && " ◀ turn"}
                        <br />
                        <span className="muted">
                            Army: {player.armyStrength} | Territories: {player.empire.length}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
