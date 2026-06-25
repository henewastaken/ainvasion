from fastapi import APIRouter, HTTPException

from game.state_manager import get_session, update_state
from game.game_engine import (
    is_adjacent,
    apply_action_result,
    apply_research_result,
    advance_turn,
    check_victory,
)
from game.models import ActionRequest, ResearchRequest
from game.map_data import COUNTRIES
from ai.llm_client import resolve_attack, resolve_research
from routers.ws import broadcast

router = APIRouter(prefix="/game", tags=["game"])


@router.get("/map")
async def get_map():
    """Return the static Europe map data (countries, adjacency, default stats)."""
    return COUNTRIES


@router.get("/{game_id}/state")
async def get_state(game_id: str):
    """Return the full current game state."""
    state = get_session(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found.")
    return state


@router.post("/{game_id}/action")
async def perform_action(game_id: str, body: ActionRequest):
    """
    Perform an attack or diplomacy action against an adjacent country.
    This is the player's only action for this turn; the turn advances afterwards.
    """
    state = get_session(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found.")
    if state.status != "active":
        raise HTTPException(status_code=400, detail="Game is not active.")
    if state.current_turn_player_id != body.player_id:
        raise HTTPException(status_code=403, detail="It is not your turn.")

    player = next((p for p in state.players if p.player_id == body.player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")
    if player.has_acted_this_turn:
        raise HTTPException(status_code=400, detail="You have already acted this turn.")

    if not is_adjacent(state, body.player_id, body.attack):
        raise HTTPException(
            status_code=400,
            detail=f"'{body.attack}' is not adjacent to your empire.",
        )

    # Validate items_used are in player's inventory
    for item in body.items_used:
        if not any(r.item_name == item.item_name and r.quantity > 0 for r in player.resources):
            raise HTTPException(
                status_code=400, detail=f"Item not in inventory: {item.item_name}"
            )

    target = state.countries[body.attack]
    story_context = " ".join(state.story_log[-3:]) if state.story_log else ""

    action_response = await resolve_attack(
        attacker_name=player.name,
        attacker_army=player.army_strength,
        target_country=body.attack,
        target_army=target.army_strength,
        target_morale=target.morale,
        attack_type=body.attack_type,
        items_used=[item.model_dump() for item in body.items_used],
        story_context=story_context,
    )

    player.has_acted_this_turn = True
    state = apply_action_result(state, action_response, body.player_id, body.attack, body.items_used)

    winner = check_victory(state)
    if winner:
        state.status = "finished"
        state.winner_id = winner
        update_state(game_id, state)
        await broadcast(
            game_id,
            {"type": "game_over", "winner_id": winner, "state": state.model_dump(mode="json")},
        )
    else:
        state = advance_turn(state)
        update_state(game_id, state)
        await broadcast(
            game_id,
            {"type": "state_update", "state": state.model_dump(mode="json")},
        )

    return action_response


@router.post("/{game_id}/research")
async def perform_research(game_id: str, body: ResearchRequest):
    """
    Research an item or technology.
    This is the player's only action for this turn; the turn advances afterwards.
    """
    state = get_session(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found.")
    if state.status != "active":
        raise HTTPException(status_code=400, detail="Game is not active.")
    if state.current_turn_player_id != body.player_id:
        raise HTTPException(status_code=403, detail="It is not your turn.")

    player = next((p for p in state.players if p.player_id == body.player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")
    if player.has_acted_this_turn:
        raise HTTPException(status_code=400, detail="You have already acted this turn.")

    # Validate resources_used are in player's inventory
    for resource_name in body.resources_used:
        if not any(r.item_name == resource_name and r.quantity > 0 for r in player.resources):
            raise HTTPException(
                status_code=400, detail=f"Resource not in inventory: {resource_name}"
            )

    research_response = await resolve_research(
        player_name=player.name,
        item=body.item,
        resources_used=body.resources_used,
    )

    player.has_acted_this_turn = True
    state = apply_research_result(state, research_response, body.player_id, body.resources_used)
    state = advance_turn(state)
    update_state(game_id, state)

    await broadcast(
        game_id,
        {"type": "state_update", "state": state.model_dump(mode="json")},
    )

    return research_response
