import uuid
from game.models import GameState, Player, Country
from game.map_data import COUNTRIES, START_COUNTRIES

# In-memory store: game_id -> GameState
game_sessions: dict[str, GameState] = {}


def _make_countries() -> dict[str, Country]:
    return {name: Country(name=name, **data) for name, data in COUNTRIES.items()}


def create_session(creator_name: str) -> tuple[str, str]:
    """Create a new game session. Returns (game_id, creator_player_id)."""
    game_id = str(uuid.uuid4())
    player_id = str(uuid.uuid4())

    start_country = START_COUNTRIES[0]
    countries = _make_countries()
    countries[start_country].owner_id = player_id

    player = Player(
        player_id=player_id,
        name=creator_name,
        empire=[start_country],
    )

    state = GameState(
        game_id=game_id,
        creator_id=player_id,
        players=[player],
        countries=countries,
        current_turn_player_id=player_id,
    )
    game_sessions[game_id] = state
    return game_id, player_id


def add_player(game_id: str, player_name: str) -> str | None:
    """
    Add a player to a pending session. Returns new player_id, or None if the
    game is full / not in pending state.
    """
    state = game_sessions.get(game_id)
    if not state or state.status != "pending":
        return None

    if len(state.players) >= len(START_COUNTRIES):
        return None  # lobby full

    player_id = str(uuid.uuid4())
    start_country = START_COUNTRIES[len(state.players)]
    state.countries[start_country].owner_id = player_id

    player = Player(
        player_id=player_id,
        name=player_name,
        empire=[start_country],
    )
    state.players.append(player)
    return player_id


def get_session(game_id: str) -> GameState | None:
    return game_sessions.get(game_id)


def update_state(game_id: str, state: GameState) -> None:
    game_sessions[game_id] = state
