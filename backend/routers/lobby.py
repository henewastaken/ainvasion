from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from game.state_manager import create_session, get_session, add_player, update_state
from ai.llm_client import generate_country_resources
from routers.ws import broadcast

router = APIRouter(prefix="/game", tags=["lobby"])


class CreateGameRequest(BaseModel):
    player_name: str


class JoinGameRequest(BaseModel):
    player_name: str


class StartGameRequest(BaseModel):
    player_id: str


@router.post("/create")
async def create_game(body: CreateGameRequest):
    """Create a new game session. Returns game_id and the creator's player_id."""
    game_id, player_id = create_session(body.player_name)
    return {"game_id": game_id, "player_id": player_id}


@router.post("/join/{game_id}")
async def join_game(game_id: str, body: JoinGameRequest):
    """Join an existing pending session. Returns the new player's player_id."""
    player_id = add_player(game_id, body.player_name)
    if not player_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot join: game not found, already started, or lobby is full.",
        )
    return {"player_id": player_id}


@router.post("/start/{game_id}")
async def start_game(game_id: str, body: StartGameRequest):
    print("start_game", game_id, body)
    """
    Start the game. Only the creator can call this.
    Triggers AI resource generation for all countries, then broadcasts game_started.

    NOTE: Requires at least 1 player (creator). For real multiplayer require >= 2.
    """
    state = get_session(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found.")
    if state.creator_id != body.player_id:
        raise HTTPException(status_code=403, detail="Only the creator can start the game.")
    if state.status != "pending":
        raise HTTPException(status_code=400, detail="Game has already started.")

    # Generate resources for all countries via AI
    resources = await generate_country_resources({name: {} for name in state.countries})
    for country_name, res in resources.items():
        if country_name in state.countries:
            state.countries[country_name].favorite_resource = res["favorite_resource"]
            state.countries[country_name].hated_resource = res["hated_resource"]

    state.status = "active"
    update_state(game_id, state)

    await broadcast(game_id, {"type": "game_started", "state": state.model_dump(mode="json")})
    return {"status": "started"}
