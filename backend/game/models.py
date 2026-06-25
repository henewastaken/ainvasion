from pydantic import BaseModel
from typing import Literal


class Resource(BaseModel):
    item_name: str
    item_effect: str
    quantity: int = 1


class Country(BaseModel):
    name: str
    owner_id: str | None = None
    army_strength: int
    morale: int
    adjacency: list[str]
    favorite_resource: str | None = None
    hated_resource: str | None = None


class Player(BaseModel):
    player_id: str
    name: str
    empire: list[str]
    resources: list[Resource] = []
    army_strength: int = 100
    has_acted_this_turn: bool = False


class GameState(BaseModel):
    game_id: str
    creator_id: str
    players: list[Player]
    countries: dict[str, Country]
    current_turn_player_id: str
    turn_number: int = 1
    story_log: list[str] = []
    status: Literal["pending", "active", "finished"] = "pending"
    winner_id: str | None = None


class ItemUsed(BaseModel):
    item_name: str
    item_effect: str


class ActionRequest(BaseModel):
    player_id: str
    attack: str
    attack_type: Literal["war", "diplomatic"]
    items_used: list[ItemUsed] = []


class ResearchRequest(BaseModel):
    player_id: str
    item: str
    resources_used: list[str] = []


class ActionResponse(BaseModel):
    success: bool
    new_army_strength: int
    enemy_army_strength: int
    story: str
    items: list[Resource] = []

class DiplomacyResponse(BaseModel):
    success: bool
    story: str
    
    
class ResearchResponse(BaseModel):
    success: bool
    story: str
    researched_item: Resource | dict  # Empty object if research failed
