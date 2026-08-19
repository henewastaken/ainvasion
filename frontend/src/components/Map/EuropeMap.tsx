import { useState, useRef, useEffect } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { geoAzimuthalEqualArea, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import type { GameState, Player } from "../../types/game";
import { PLAYER_COLORS, NEUTRAL_COLOR, ADJACENT_HIGHLIGHT } from "../../data/colors";
import europeGeo from "../../data/europe.geo.json";

// ── Projection & static geometry ─────────────────────────────────────────────
// The GeoJSON (real Natural Earth shapes) is projected ONCE at module load with
// d3-geo, since the geometry never changes. Only the game-driven fill/hover state
// is recomputed on render.

interface CountryProps {
    id: string; // canonical id, matches the backend country name (e.g. "Bosnia")
    name: string; // full display name
    iso2: string; // two-letter code for the on-map label
}

const COUNTRIES = europeGeo as FeatureCollection<Geometry, CountryProps>;

const WIDTH = 800;
const HEIGHT = 680;
const PADDING = 14;

// Fit the frame to Europe EXCLUDING Russia's huge Asian span, so the view stays
// centred on Europe. Russia is still drawn, but clipped at the frame edge by
// clipExtent below — that clip falls around the Urals, which is the intent.
const fitTarget: FeatureCollection<Geometry, CountryProps> = {
    type: "FeatureCollection",
    features: COUNTRIES.features.filter((f) => f.properties.id !== "Russia"),
};

// geoAzimuthalEqualArea centred on (10°E, 52°N) is the EU-standard ETRS-LAEA
// layout — the most familiar, least-distorted look for a Europe map.
const projection = geoAzimuthalEqualArea()
    .rotate([-10, -52])
    .fitExtent(
        [
            [PADDING, PADDING],
            [WIDTH - PADDING, HEIGHT - PADDING],
        ],
        fitTarget,
    );
// Clip drawn output to the viewport rectangle → Russia is cut cleanly at the edge.
projection.clipExtent([
    [0, 0],
    [WIDTH, HEIGHT],
]);

const pathGen = geoPath(projection);

interface Shape {
    id: string;
    name: string;
    iso2: string;
    d: string; // projected SVG path
    cx: number; // projected centroid x (label anchor)
    cy: number; // projected centroid y
    labelled: boolean; // large enough on screen to carry a label without clutter
}

// Minimum projected area (px²) for a country to get an on-map text label.
const LABEL_AREA_THRESHOLD = 130;

const SHAPES: Shape[] = COUNTRIES.features
    .map((f): Shape | null => {
        const d = pathGen(f);
        if (!d) return null;
        const [cx, cy] = pathGen.centroid(f);
        const area = pathGen.area(f);
        return {
            id: f.properties.id,
            name: f.properties.name,
            iso2: f.properties.iso2,
            d,
            cx,
            cy,
            labelled:
                area > LABEL_AREA_THRESHOLD &&
                Number.isFinite(cx) &&
                Number.isFinite(cy),
        };
    })
    .filter((s): s is Shape => s !== null);

// ── Colours ──────────────────────────────────────────────────────────────────
const BORDER = "#2c2c2c";
const HOVER_STROKE = "#ffffff";
const OCEAN = "#cddae6";

// ── Pan / zoom ────────────────────────────────────────────────────────────────
// Pan/zoom is driven by the SVG viewBox: shrinking it zooms in, moving it pans.
// Keeping strokes and hit-testing crisp at any zoom (a CSS transform would blur
// borders and break pointer maths).

const MAX_ZOOM = 8; // deepest zoom-in (pretty close)
const MIN_VIEW_W = WIDTH / MAX_ZOOM; // smallest visible width = most zoomed in
const ASPECT = HEIGHT / WIDTH; // viewBox always keeps the frame's aspect ratio

interface ViewBox {
    x: number;
    y: number;
    w: number;
    h: number;
}
const FULL_VIEW: ViewBox = { x: 0, y: 0, w: WIDTH, h: HEIGHT };

// Clamp the visible box inside the map frame so you can never pan/zoom out into
// blank space — at max zoom-out it's exactly the frame, so it always fills the area.
function clampView(x: number, y: number, w: number, h: number): ViewBox {
    return {
        x: Math.min(Math.max(x, 0), WIDTH - w),
        y: Math.min(Math.max(y, 0), HEIGHT - h),
        w,
        h,
    };
}

// Zoom by `factor` about a point (ux, uy) given in viewBox/user coordinates,
// keeping that point stationary on screen.
function zoomAbout(v: ViewBox, factor: number, ux: number, uy: number): ViewBox {
    const w = Math.min(Math.max(v.w * factor, MIN_VIEW_W), WIDTH);
    const s = w / v.w; // actual applied scale (may differ from `factor` at the limits)
    const h = w * ASPECT;
    const x = ux - (ux - v.x) * s;
    const y = uy - (uy - v.y) * s;
    return clampView(x, y, w, h);
}

const controlBarStyle: CSSProperties = {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
};
const zoomBtnStyle: CSSProperties = {
    width: 30,
    height: 30,
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 700,
    color: "#1b1b1b",
    background: "rgba(255,255,255,0.9)",
    border: "1px solid #9aa7b3",
    borderRadius: 6,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
    padding: 0,
};

// ── Game helpers ──────────────

/** Player index (for colour lookup) given an owner id, or -1 if unowned. */
function playerIndex(state: GameState, ownerId: string | null): number {
    if (!ownerId) return -1;
    return state.players.findIndex((player) => player.playerId === ownerId);
}

/** Countries adjacent to the player's empire that they don't already own. */
function adjacentCountries(state: GameState, player: Player): Set<string> {
    const adj = new Set<string>();
    for (const owned of player.empire) {
        const country = state.countries[owned];
        if (!country) continue;
        for (const neighbor of country.adjacency) {
            if (state.countries[neighbor]?.ownerId !== player.playerId) {
                adj.add(neighbor);
            }
        }
    }
    return adj;
}

interface Props {
    gameState: GameState;
    playerId: string;
    onCountryClick: (countryName: string) => void;
}

export default function EuropeMap({ gameState, playerId, onCountryClick }: Props) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [view, setView] = useState<ViewBox>(FULL_VIEW);

    const svgRef = useRef<SVGSVGElement | null>(null);
    // ppuX/ppuY = user (viewBox) units per screen pixel, captured at drag start.
    // The SVG's own CTM handles viewBox scale AND any letterboxing from the
    // container's aspect ratio, so the maths stays correct however the map is sized.
    const panRef = useRef({ active: false, sx: 0, sy: 0, vx: 0, vy: 0, ppuX: 1, ppuY: 1 });
    const movedRef = useRef(false); // true once a pointer-drag has moved — suppresses the click

    // Wheel zoom, centred on the cursor. Registered manually as a non-passive
    // listener so preventDefault() can stop the page from scrolling.
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const u = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
            const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1; // wheel down = zoom out
            setView((v) => zoomAbout(v, factor, u.x, u.y));
        };
        svg.addEventListener("wheel", onWheel, { passive: false });
        return () => svg.removeEventListener("wheel", onWheel);
    }, []);

    const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
        if (e.button !== 0) return; // left button only
        const ctm = svgRef.current?.getScreenCTM();
        panRef.current = {
            active: true,
            sx: e.clientX,
            sy: e.clientY,
            vx: view.x,
            vy: view.y,
            // 1/ctm.a and 1/ctm.d convert a screen-pixel delta into viewBox units;
            // these stay constant while panning (only the viewBox origin moves).
            ppuX: ctm ? 1 / ctm.a : view.w,
            ppuY: ctm ? 1 / ctm.d : view.h,
        };
        movedRef.current = false;
        svgRef.current?.setPointerCapture(e.pointerId);
        if (svgRef.current) svgRef.current.style.cursor = "grabbing";
    };
    const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
        const pan = panRef.current;
        if (!pan.active) return;
        if (Math.hypot(e.clientX - pan.sx, e.clientY - pan.sy) > 4) movedRef.current = true;
        // Convert the pixel drag into viewBox units and move opposite to the drag.
        const dx = (e.clientX - pan.sx) * pan.ppuX;
        const dy = (e.clientY - pan.sy) * pan.ppuY;
        setView(clampView(pan.vx - dx, pan.vy - dy, view.w, view.h));
    };
    const endPan = (e: ReactPointerEvent<SVGSVGElement>) => {
        panRef.current.active = false;
        svgRef.current?.releasePointerCapture(e.pointerId);
        if (svgRef.current) svgRef.current.style.cursor = "grab";
    };

    // Zoom the buttons perform, centred on the middle of the current view.
    const zoomAtCentre = (factor: number) =>
        setView((v) => zoomAbout(v, factor, v.x + v.w / 2, v.y + v.h / 2));

    const me = gameState.players.find((player) => player.playerId === playerId);
    const isMyTurn =
        gameState.currentTurnPlayerId === playerId &&
        gameState.status === "active" &&
        me != null &&
        !me.hasActedThisTurn;

    const adjacent = me ? adjacentCountries(gameState, me) : new Set<string>();

    const fillFor = (id: string): string => {
        const country = gameState.countries[id];
        const ownerIdx = country ? playerIndex(gameState, country.ownerId) : -1;
        if (ownerIdx >= 0) return PLAYER_COLORS[ownerIdx % PLAYER_COLORS.length];
        if (adjacent.has(id)) return ADJACENT_HIGHLIGHT; // unowned, targetable
        return NEUTRAL_COLOR;
    };

    const titleFor = (shape: Shape): string => {
        const country = gameState.countries[shape.id];
        if (!country) return shape.name; // in the map but not (yet) in play
        if (!country.ownerId) return `${shape.name} — neutral (⚔ ${country.armyStrength})`;
        const owner = gameState.players.find((p) => p.playerId === country.ownerId);
        return `${shape.name} — ${owner?.name ?? "?"} (⚔ ${country.armyStrength})`;
    };

    const hovered = hoveredId
        ? (SHAPES.find((s) => s.id === hoveredId) ?? null)
        : null;

    return (
        <div
            style={{
                position: "relative",
                flex: 1, // grow to fill the flex-column map area
                alignSelf: "stretch", // and take its full width
                minHeight: 0,
                minWidth: 0,
            }}
        >
            <svg
                ref={svgRef}
                viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    background: OCEAN,
                    cursor: "grab",
                    touchAction: "none", // let touch drags pan instead of scrolling the page
                }}
                role="img"
                aria-label="Map of Europe"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPan}
                onPointerLeave={endPan}
            >
            {/* Country shapes */}
            {SHAPES.map((shape) => {
                const clickable = isMyTurn && adjacent.has(shape.id);
                const isHovered = hoveredId === shape.id;
                return (
                    <path
                        key={shape.id}
                        d={shape.d}
                        fill={fillFor(shape.id)}
                        stroke={isHovered ? HOVER_STROKE : BORDER}
                        strokeWidth={isHovered ? 2 : 0.6}
                        strokeLinejoin="round"
                        opacity={hoveredId && !isHovered ? 0.9 : 1}
                        style={{
                            cursor: clickable ? "pointer" : "default",
                            transition: "fill 200ms ease, opacity 200ms ease",
                        }}
                        onMouseEnter={() => setHoveredId(shape.id)}
                        onMouseLeave={() =>
                            setHoveredId((cur) => (cur === shape.id ? null : cur))
                        }
                        onClick={() => {
                            if (movedRef.current) return; // was a drag-pan, not a click
                            if (clickable) onCountryClick(shape.id);
                        }}
                    >
                        <title>{titleFor(shape)}</title>
                    </path>
                );
            })}

            {/* Re-draw the hovered outline on top so neighbouring fills never cover it */}
            {hovered && (
                <path
                    d={hovered.d}
                    fill="none"
                    stroke={HOVER_STROKE}
                    strokeWidth={2.4}
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                />
            )}

            {/* Labels: country code, plus army strength for countries currently in play */}
            {SHAPES.filter((s) => s.labelled).map((shape) => {
                const country = gameState.countries[shape.id];
                return (
                    <g key={`label-${shape.id}`} style={{ pointerEvents: "none" }}>
                        <text
                            x={shape.cx}
                            y={country ? shape.cy - 3 : shape.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={9}
                            fontWeight={700}
                            fill="#ffffff"
                            stroke="rgba(0,0,0,0.55)"
                            strokeWidth={2}
                            paintOrder="stroke"
                            style={{ userSelect: "none" }}
                        >
                            {shape.iso2 || shape.id.slice(0, 2).toUpperCase()}
                        </text>
                        {country && (
                            <text
                                x={shape.cx}
                                y={shape.cy + 8}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={7.5}
                                fill="#ffffff"
                                stroke="rgba(0,0,0,0.55)"
                                strokeWidth={1.6}
                                paintOrder="stroke"
                                style={{ userSelect: "none" }}
                            >
                                ⚔ {country.armyStrength}
                            </text>
                        )}
                    </g>
                );
            })}
            </svg>

            {/* Zoom controls (for trackpad / touch, in addition to wheel + drag) */}
            <div style={controlBarStyle}>
                <button
                    type="button"
                    aria-label="Zoom in"
                    style={zoomBtnStyle}
                    onClick={() => zoomAtCentre(1 / 1.3)}
                >
                    +
                </button>
                <button
                    type="button"
                    aria-label="Zoom out"
                    style={zoomBtnStyle}
                    onClick={() => zoomAtCentre(1.3)}
                >
                    −
                </button>
                <button
                    type="button"
                    aria-label="Reset view"
                    style={zoomBtnStyle}
                    onClick={() => setView(FULL_VIEW)}
                >
                    ⤢
                </button>
            </div>
        </div>
    );
}
