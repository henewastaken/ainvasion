import type { GameState, Player } from "../../types/game";
import {
    PLAYER_COLORS,
    NEUTRAL_COLOR,
    ADJACENT_HIGHLIGHT,
} from "../../data/colors";
import {
    PLACEHOLDER_COUNTRIES,
} from "../../data/placeholderMapData";

interface Props {
    gameState: GameState;
    playerId: string;
    onCountryClick: (countryName: string) => void;
}

/** Return the player index (for color lookup) given an owner_id. */
function playerIndex(state: GameState, ownerId: string | null): number {
    if (!ownerId) return -1;
    return state.players.findIndex((p) => p.player_id === ownerId);
}

/** All countries adjacent to any country in the player's empire that are not owned by them. */
function adjacentCountries(state: GameState, player: Player): Set<string> {
    const adj = new Set<string>();
    for (const owned of player.empire) {
        const country = state.countries[owned];
        if (!country) continue;
        for (const neighbor of country.adjacency) {
            if (state.countries[neighbor]?.owner_id !== player.player_id) {
                adj.add(neighbor);
            }
        }
    }
    return adj;
}

export default function EuropeMap({ gameState, playerId, onCountryClick }: Props) {
    const me = gameState.players.find((p) => p.player_id === playerId);
    const isMyTurn =
        gameState.current_turn_player_id === playerId &&
        gameState.status === "active" &&
        me != null &&
        !me.has_acted_this_turn;

    const adjacent = me ? adjacentCountries(gameState, me) : new Set<string>();

    return (
        <svg
            viewBox="0 0 470 440"
            width="100%"
            style={{ maxWidth: 700, display: "block", margin: "0 auto" }}
        >
            {PLACEHOLDER_COUNTRIES.map((pc) => {
                const backendCountry = gameState.countries[pc.id];
                const ownerId = backendCountry?.owner_id ?? null;
                const ownerIdx = playerIndex(gameState, ownerId);
                const isAdjacent = adjacent.has(pc.id);
                const clickable = isMyTurn && isAdjacent;

                let fill = ownerIdx >= 0 ? PLAYER_COLORS[ownerIdx % PLAYER_COLORS.length] : NEUTRAL_COLOR;
                if (isAdjacent && !ownerId) fill = ADJACENT_HIGHLIGHT;

                return (
                    <CountryRect
                        key={pc.id}
                        pc={pc}
                        fill={fill}
                        clickable={clickable}
                        ownerName={
                            ownerId
                                ? (gameState.players.find((p) => p.player_id === ownerId)?.name ?? "?")
                                : null
                        }
                        armyStrength={backendCountry?.army_strength ?? 0}
                        onClick={() => clickable && onCountryClick(pc.id)}
                    />
                );
            })}
        </svg>
    );
}

// ── Individual country rectangle ──────────────────────────────────────────────

import { useState } from "react";
import type { PlaceholderCountry } from "../../data/placeholderMapData";

interface RectProps {
    pc: PlaceholderCountry;
    fill: string;
    clickable: boolean;
    ownerName: string | null;
    armyStrength: number;
    onClick: () => void;
}

function CountryRect({ pc, fill, clickable, ownerName, armyStrength, onClick }: RectProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <g
            style={{ cursor: clickable ? "pointer" : "default" }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <rect
                x={pc.x}
                y={pc.y}
                width={pc.w}
                height={pc.h}
                rx={4}
                fill={fill}
                stroke={hovered && clickable ? "#ffffff" : "#2c2c2c"}
                strokeWidth={hovered && clickable ? 2.5 : 1}
                opacity={clickable || !hovered ? 1 : 0.85}
            />
            {/* Country code */}
            <text
                x={pc.x + pc.w / 2}
                y={pc.y + pc.h / 2 - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight="bold"
                fill="#fff"
                style={{ pointerEvents: "none", userSelect: "none" }}
            >
                {pc.label}
            </text>
            {/* Army strength */}
            <text
                x={pc.x + pc.w / 2}
                y={pc.y + pc.h / 2 + 9}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="#ffffffcc"
                style={{ pointerEvents: "none", userSelect: "none" }}
            >
                ⚔ {armyStrength}
            </text>
            {/* Tooltip on hover */}
            {hovered && (
                <foreignObject x={pc.x} y={pc.y - 36} width={120} height={32}>
                    <div
                        style={{
                            background: "#111",
                            color: "#fff",
                            fontSize: 11,
                            padding: "3px 6px",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {pc.id} {ownerName ? `(${ownerName})` : "(neutral)"}
                    </div>
                </foreignObject>
            )}
        </g>
    );
}
