"""
AI client — placeholder implementations.

Every function here is marked TODO. To integrate a real LLM (e.g. HuggingFace
Inference API, a local Ollama endpoint, or OpenAI-compatible API):
  1. Load the relevant prompt from ai/prompts.py.
  2. Call the model API (async HTTP with httpx is recommended).
  3. Parse the JSON response the model returns.
  4. Replace the mock return value below with the parsed result.

The function signatures and return types must stay the same.
"""

import json
import random
from game.models import ActionResponse, DiplomacyResponse, ResearchResponse, Resource
from ollama import chat
from ai.prompts import GENERATE_RESOURCES_PROMPT, RESOLVE_ATTACK_PROMPT,RESOLVE_DIPLOMACY_PROMPT, RESOLVE_RESEARCH_PROMPT





#TODO: Remove when done testing
from game.map_data import COUNTRIES
print('determining research outcome for Testland...')
# Define a system prompt
system_prompt = "You are a world domination strategy game assistant. Determine outcome of a item or technology research."
# Chat with a system prompt
# # TODO: add separate handling for technology, resource, and item research, outcomes.
response = chat('smollm2', 
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': RESOLVE_RESEARCH_PROMPT.format(player_name="Test", item="zweihander", resources_used=['iron'])}
                ])

result = response.message.content
print('llm generated research outcome', result)











# ---------------------------------------------------------------------------
# Resource generation
# ---------------------------------------------------------------------------

async def generate_country_resources(countries: dict) -> dict[str, dict]:
    print('generating resources for', countries, '...')
    # Define a system prompt
    system_prompt = "You are a world domination strategy game assistant. Generate resources for each country."
    # Chat with a system prompt
    response = chat('smollm2', 
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': GENERATE_RESOURCES_PROMPT.format(countries=countries)}
                    ])
    
    result = response.message.content
    print('llm generated resources', result)
    try:
        return json.loads(result)
    except json.JSONDecodeError as e:
        raise ValueError("LLM response is not valid JSON")


# ---------------------------------------------------------------------------
# Attack event outcome determination
# ---------------------------------------------------------------------------

async def resolve_attack(
    attacker_name: str,
    attacker_army: int,
    target_country: str,
    target_army: int,
    target_morale: int,
    attack_type: str,
    items_used: list[dict],
    story_context: str,
) -> ActionResponse:
    
    print('determining attack outcome for', attacker_name, 'and', target_country, '...')
    # Define a system prompt
    system_prompt = "You are a world domination strategy game assistant. Determine outcome of an attack."
    # Chat with a system prompt
    response = chat('smollm2', 
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': RESOLVE_ATTACK_PROMPT.format(attacker_name=attacker_name, attacker_army=attacker_army, target_country=target_country, target_army=target_army, target_morale=target_morale, attack_type=attack_type, items_used=items_used, story_context=story_context)}
                    ])

    result = response.message.content
    print('llm generated attack outcome', result)
    try:
        outcome = json.loads(result)
        action_response = ActionResponse(
            success = outcome.get("success", False),
            new_attacker_army = outcome.get("new_attacker_army_strength", attacker_army),
            new_enemy_army = outcome.get("new_defender_army_strength", target_army),
            story = outcome.get("story", ""),
            found_items = [Resource(**item) for item in outcome.get("items", [])
            ]
        )
    except json.JSONDecodeError as e:
        raise ValueError("LLM response is not valid JSON")
    
    return action_response
    

# ---------------------------------------------------------------------------
# Diplomatic alliance outcome determination
# ---------------------------------------------------------------------------

async def resolve_diplomacy(
    player_name: str,
    target_country: str,
    alliance_type: str,
    resources_used: list[dict],
    story_context: str,
) -> DiplomacyResponse:
    
    print('determining diplomatic alliance outcome for', player_name, 'and', target_country, '...')
    # Define a system prompt
    system_prompt = "You are a world domination strategy game assistant. Determine outcome of a diplomatic alliance."
    # Chat with a system prompt
    response = chat('smollm2', 
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': RESOLVE_DIPLOMACY_PROMPT.format(player_name=player_name, target_country=target_country, alliance_type=alliance_type, resources_used=resources_used, story_context=story_context)}
                    ])

    result = response.message.content
    print('llm generated diplomatic alliance outcome', result)
    try:
        outcome = json.loads(result)
        diplomacy_response = DiplomacyResponse(
            success = outcome.get("success", False),
            story = outcome.get("story", ""),
            items = [Resource(**item) for item in outcome.get("items", [])
            ]
        )
    except json.JSONDecodeError as e:
        raise ValueError("LLM response is not valid JSON")
    
    return diplomacy_response



# ---------------------------------------------------------------------------
# Research resolution
# ---------------------------------------------------------------------------

async def resolve_research(
    player_name: str,
    item: str,
    resources_used: list[str],
) -> ResearchResponse:
    print('determining research outcome for', player_name, 'and', item, '...')
    # Define a system prompt
    system_prompt = "You are a world domination strategy game assistant. Determine outcome of a research."
    # Chat with a system prompt
    response = chat('smollm2', 
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': RESOLVE_RESEARCH_PROMPT.format(player_name=player_name, item=item, resources_used=resources_used)}
                    ])

    result = response.message.content
    print('llm generated research outcome', result)
    try:
        outcome = json.loads(result)
        research_response = ResearchResponse(
            success = outcome.get("success", False),
            story = outcome.get("story", ""),
            researched_item = Resource(**outcome.get("researched_item", {})) if outcome.get("researched_item") else {}
        )
    except json.JSONDecodeError as e:
        raise ValueError("LLM response is not valid JSON")
    
    return research_response

