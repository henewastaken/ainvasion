// Prompt templates used when calling the LLM.

import { Country, Resource } from "../game/models";

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
        "favoriteResource": "<resource name>",
        "hatedResource": "<resource name>"
    },
    ...
    }
  `.trim();
};

export const resolveAttackPrompt = (
  attackerEmpire: string[],
  attackerArmyStrength: number,
  attackerMorale: number,
  targetCountry: Country,
  itemsUsed: Resource[],
  storyContext: string,
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

    Attacker empire (all countries they control): ${attackerEmpire.join(", ")}
    Attacker army strength: ${attackerArmyStrength}
    Attacker morale: ${attackerMorale}
    Target country: ${targetCountry.name}
    Target army strength: ${targetCountry.armyStrength}
    Target morale: ${targetCountry.morale}
    Items used by attacker: ${JSON.stringify(itemsUsed)}
    Recent history: ${storyContext}

    Guidelines for determining success:
    - Higher attacker army strength and lower target morale favour the attacker.
    - Items used by the attacker can tip the balance. Take into account the effects of each item used.
    - On success, newDefenderArmyStrength must be 0.

    Respond ONLY in valid JSON, NOT a single word, and nothing else. The JSON format is:
    {
      "success": true or false,
      "newAttackerArmyStrength": <attacker remaining strength as integer>,
      "newDefenderArmyStrength": <defender remaining strength as integer, 0 on success>,
      "story": "<short narrative of the event>",
      "items": [
        {"itemName": "<name>", "itemEffect": "<short mechanical effect>", "quantity": 1}
      ]
    }

    The items array should be empty [] if nothing was found. Include at most two found items.
  `.trim();
};

export const resolveDiplomacyPrompt = (
  playerEmpireContrieNames: string[],
  targetCountry: Country,
  resourcesUsed: Resource[],
) => {
  return `
    You are assisting in a world domination game. A player is attempting to form a diplomatic alliance with another country.
    Player's countries: ${playerEmpireContrieNames.join(", ")}
    Target country: ${targetCountry.name}
    Resources used to influence diplomacy: ${JSON.stringify(resourcesUsed)}
    Target country loved resource: ${targetCountry.favoriteResource} 
    Target country hated resource: ${targetCountry.hatedResource} 
    The player can give items and resources to the target country to try to influence their decision, but the outcome is ultimately up to you. 
    But if the player is trying to give a resource to the target country that the target country hates, it will decrease the chance of success. If the player is trying to give a resource that the target country loves, it will increase the chance of success.
    Provide a short narrative of the event, and if any items were found in the target country or during the battle, include them in the response.
    The story can be as random or weird as you like.
    You must respond ONLY in valid JSON and nothing else. Not single word, only JSON
    The outcome can be as random or weird as you like, the following factors are only guidelines, not rules:
    - The target country may accept or reject the alliance.
    - The outcome can be as random or weird as you like, the following factors are only guidelines, not rules:
    - The target country's current morale and army strength may influence their decision.
    - Player can try to affect the target country's decision by using resources, but the outcome is ultimately up to you.
    - If resources are used, they are consumed only if the outcome is fail.
    - Each country has favouriteResource and hatedResource, which may influence their decision. If the player uses the target country's favouriteResource, it increases the chance of success. If the player uses the target country's hatedResource, it decreases the chance of success. But in the end you decide the outcome.

    Respond ONLY in valid JSON, NOT a single word, and nothing else. The JSON format is:
    {
      "success": true or false,
      "story": "<short narrative of the event>",
      "items": [
        {"itemName": "<name>", "itemEffect": "<short mechanical effect>", "quantity": 1}
      ]
    }
  `.trim();
};

export const resolveResearchPrompt = (
  playerName: string,
  item: string,
  resourcesUsed: Resource[],
) => {
  return `
    You are assisting in a world domination game. A player is researching a new item or technology.

    Player: ${playerName}
    Research target: ${item}
    Resources used to aid research: ${JSON.stringify(resourcesUsed)}

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
      "researchedItem":
        {"itemName": "<name>", "itemEffect": "<short mechanical effect>", "quantity": 1}
      , or empty object {} if research failed,
    }
  `.trim();
};
