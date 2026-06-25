from game.models import (
    GameState,
    ActionResponse,
    ResearchResponse,
    Resource,
    ItemUsed,
)


def is_adjacent(state: GameState, player_id: str, target_country: str) -> bool:
    """Return True if target_country is reachable from the player's empire and not already owned by them."""
    player = next((p for p in state.players if p.player_id == player_id), None)
    if not player or target_country not in state.countries:
        return False

    if state.countries[target_country].owner_id == player_id:
        return False  # already owned

    for owned_name in player.empire:
        owned = state.countries.get(owned_name)
        if owned and target_country in owned.adjacency:
            return True
    return False


def apply_action_result(
    state: GameState,
    action_response: ActionResponse,
    player_id: str,
    target_country: str,
    items_used: list[ItemUsed],
) -> GameState:
    """Apply the resolved attack/diplomacy outcome to the game state."""
    player = next((p for p in state.players if p.player_id == player_id), None)
    target = state.countries.get(target_country)
    if not player or not target:
        return state

    prev_owner_id = target.owner_id  # capture before any mutation

    # Update army strengths
    player.army_strength = action_response.new_army_strength
    target.army_strength = action_response.enemy_army_strength

    if action_response.success:
        target.owner_id = player_id
        player.empire.append(target_country)

        # Remove from previous owner's empire
        if prev_owner_id and prev_owner_id != player_id:
            prev_owner = next((p for p in state.players if p.player_id == prev_owner_id), None)
            if prev_owner and target_country in prev_owner.empire:
                prev_owner.empire.remove(target_country)

    # Consume used items from player inventory
    for used in items_used:
        for r in player.resources:
            if r.item_name == used.item_name and r.quantity > 0:
                r.quantity -= 1
                break
    player.resources = [r for r in player.resources if r.quantity > 0]

    # Add items found during the event
    for found in action_response.items:
        existing = next((r for r in player.resources if r.item_name == found.item_name), None)
        if existing:
            existing.quantity += found.quantity
        else:
            player.resources.append(Resource(**found.model_dump()))

    state.story_log.append(action_response.story)
    return state


def apply_research_result(
    state: GameState,
    research_response: ResearchResponse,
    player_id: str,
    resources_used: list[str],
) -> GameState:
    """Apply the resolved research outcome: add item to inventory, consume resources."""
    player = next((p for p in state.players if p.player_id == player_id), None)
    if not player:
        return state

    # Consume used resources
    for resource_name in resources_used:
        for r in player.resources:
            if r.item_name == resource_name and r.quantity > 0:
                r.quantity -= 1
                break
    player.resources = [r for r in player.resources if r.quantity > 0]

    # Add researched item
    new_resource = Resource(
        item_name=research_response.researched_item,
        item_effect=research_response.effects,
    )
    existing = next((r for r in player.resources if r.item_name == new_resource.item_name), None)
    if existing:
        existing.quantity += 1
    else:
        player.resources.append(new_resource)

    state.story_log.append(
        f"{player.name} researched '{research_response.researched_item}': {research_response.effects}"
    )
    return state


def advance_turn(state: GameState) -> GameState:
    """Advance to the next active player; increment turn_number after all players have gone."""
    # Reset acted flag for outgoing player
    for p in state.players:
        if p.player_id == state.current_turn_player_id:
            p.has_acted_this_turn = False
            break

    active_ids = [p.player_id for p in state.players if p.empire]
    if not active_ids:
        return state

    if state.current_turn_player_id not in active_ids:
        # Current player was eliminated mid-round; hand off to first active player
        state.current_turn_player_id = active_ids[0]
        return state

    current_idx = active_ids.index(state.current_turn_player_id)
    next_idx = (current_idx + 1) % len(active_ids)
    state.current_turn_player_id = active_ids[next_idx]

    # Completed one full round when we wrap back to the first player
    if next_idx == 0:
        state.turn_number += 1

    return state


def check_victory(state: GameState) -> str | None:
    """
    Return the winning player_id if a victory condition is met, otherwise None.
    Conditions (either):
      1. All countries are owned by a single player.
      2. Only one player still has an empire.
    """
    active_players = [p for p in state.players if p.empire]
    if len(active_players) == 1:
        return active_players[0].player_id

    owners = {c.owner_id for c in state.countries.values() if c.owner_id is not None}
    neutral = [c for c in state.countries.values() if c.owner_id is None]
    if not neutral and len(owners) == 1:
        return owners.pop()

    return None
