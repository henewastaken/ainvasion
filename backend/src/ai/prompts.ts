// Prompt templates used when calling the LLM.

export const generateResourcesPrompt = (countries: string[]) => {
  return `
    You are generating resources for a world domination strategy game set in Europe.
    For each country, assign one favorite resource (that strengthens them) and one hated
    resource (that weakens them). Be creative and historically/culturally inspired. 
    From time to time, include very unusual or bizarre resources.
    Also avoid using the same resource for multiple countries. Resources should be unique for each country.
    Your answer should contain only a JSON and NOTHING ELSE, not even a single word. 
    Which means that first character of your response should be a { and the last character should be a }.
    These are the countries to generate resources for:
    Countries: ${countries.join(", ")}

    Respond ONLY in valid JSON and nothing else. Not single word, only JSON of this format:
    {
    "CountryName": {
        "favorite_resource": "<resource name>",
        "hated_resource": "<resource name>"
    },
    ...
    }
  `.trim();
};

export const resolveAttackPrompt = (
  attacker_name: string,
  attacker_army: number,
  target_country: string,
  target_army: number,
  target_morale: number,
  items_used: string[],
  story_context: string,
) => {
  return `
    You are narrating a turn-based world domination game set in Europe.
    A player is attacking a country. 
    Provide a short narrative of the event, and if any items were found in the target country or during the battle, include them in the response.
    The story can be as random or weird as you like.
    Every response doesn't need to include items, but if you do, include at most two items.
    You can give the items to the defending country, or to the attacker, or both.
    Items can have whatever effect you want.
    Items are consumed when used by default, but you decide to give back the items if you wish.
    You must respond ONLY in valid JSON and nothing else. Not single word, only JSON
    You are to determine the outcome of the attack based on the following information:
    The outcome can be either a success or failure for the attacker.
    The outcome can be as random or weird as you like, the following factors are only guidelines, not rules:

    Attacker: ${attacker_name}
    Attacker army strength: ${attacker_army}
    Target country: ${target_country}
    Target army strength: ${target_army}
    Target morale: ${target_morale}
    Items used by attacker: ${items_used}
    Recent history: ${story_context}

    Guidelines for determining success:
    - Higher attacker army strength and lower target morale favour the attacker.
    - Items used by the attacker can tip the balance. Take into account the effects of each item used.
    - On success, new_defender_army_strength must be 0.

    Respond ONLY in valid JSON, NOT a single word, and nothing else. The JSON format is:
    {
      "success": true or false,
      "new_attacker_army_strength": <attacker remaining strength as integer>,
      "new_defender_army_strength": <defender remaining strength as integer, 0 on success>,
      "story": "<short narrative of the event>",
      "items": [
        {"item_name": "<name>", "item_effect": "<short mechanical effect>", "quantity": 1}
      ]
    }

    The items array should be empty [] if nothing was found. Include at most two found items.
  `.trim();
};

export const resolveDiplomacyPrompt = (
  player_name: string,
  target_country: string,
) => {
  return `
    You are assisting in a world domination game. A player is attempting to form a diplomatic alliance with another country.
    Player: ${player_name}
    Target country: ${target_country}
    Provide a short narrative of the event, and if any items were found in the target country or during the battle, include them in the response.
    The story can be as random or weird as you like.
    You must respond ONLY in valid JSON and nothing else. Not single word, only JSON
    The outcome can be as random or weird as you like, the following factors are only guidelines, not rules:
    - The target country may accept or reject the alliance.
    - The outcome can be as random or weird as you like, the following factors are only guidelines, not rules:
    - The target country's current morale and army strength may influence their decision.
    - Player can try to affect the target country's decision by using resources, but the outcome is ultimately up to you.
    - If resources are used, they are consumed only if the outcome is fail.
    - Each country has favourite_resource and hated_resource, which may influence their decision. If the player uses the target country's favourite_resource, it increases the chance of success. If the player uses the target country's hated_resource, it decreases the chance of success. But in the end you decide the outcome.

    Respond ONLY in valid JSON, NOT a single word, and nothing else. The JSON format is:
    {
      "success": true or false,
      "story": "<short narrative of the event>",
      "items": [
        {"item_name": "<name>", "item_effect": "<short mechanical effect>", "quantity": 1}
      ]
    }
  `.trim();
};

export const resolveResearchPrompt = (
  player_name: string,
  item: string,
  resources_used: string[],
) => {
  return `
    You are assisting in a world domination game. A player is researching a new item or technology.

    Player: ${player_name}
    Research target: ${item}
    Resources used to aid research: ${resources_used.join(", ")}

    Describe what was researched and give it effects.
    You determine the outcome of the research.
    The outcome can be as random or weird as you like, the following factors are only guidelines, not rules:
    - The resources used may influence the outcome, but the outcome is ultimately up to you.
    - No items like "beer that when you drink it you become invincible" or "magic wand that grants eternal life" are allowed. The item must be reasonable and thematic for a world domination game but can be bery weird and have strange and funny effects, or be serious, agai you decide.
    - Research can be new item, new resource or new technology. You may slightly modify the item name to make it more thematic but if you change the name include the reason for change in the story, i.e. make up a story why the name was changed.
    - The researches should mostly be succesful, but you can make some fail if you wish. .

    # TODO: add separate handling for technology, resource, and item research, outcomes.

    Respond ONLY in valid JSON, NOT a single word, and nothing else. The JSON format is:
    {
      "success": true or false,
      "story": "<short narrative of the research>",
      "researched_item":
        {"item_name": "<name>", "item_effect": "<short mechanical effect>", "quantity": 1}
      , or empty object {} if research failed,
    }
  `.trim();
};
