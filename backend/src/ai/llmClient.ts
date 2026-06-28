import ollama from "ollama";
import {
  generateResourcesPrompt,
  resolveAttackPrompt,
  resolveDiplomacyPrompt,
  resolveResearchPrompt,
} from "./prompts";

// TODO: import from ../game/models once models.ts is filled in
interface Resource {
  item_name: string;
  item_effect: string;
  quantity: number;
}

export interface ActionResponse {
  success: boolean;
  new_attacker_army: number;
  new_enemy_army: number;
  story: string;
  found_items: Resource[];
}

export interface DiplomacyResponse {
  success: boolean;
  story: string;
  items: Resource[];
}

export interface ResearchResponse {
  success: boolean;
  story: string;
  researched_item: Resource | null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MODEL = "smollm2";

async function llmRequest(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await ollama.chat({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.message.content;
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("LLM response is not valid JSON");
  }
}

// ---------------------------------------------------------------------------
// Resource generation
// ---------------------------------------------------------------------------

export async function generateCountryResources(
  countries: Record<string, unknown>,
): Promise<
  Record<string, { favorite_resource: string; hated_resource: string }>
> {
  console.log("generating resources for", Object.keys(countries), "...");
  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Generate resources for each country.",
    generateResourcesPrompt(Object.keys(countries)),
  );
  console.log("llm generated resources", raw);
  return parseJson(raw);
}

// ---------------------------------------------------------------------------
// Attack outcome
// ---------------------------------------------------------------------------

export async function resolveAttack(
  attackerName: string,
  attackerArmy: number,
  targetCountry: string,
  targetArmy: number,
  targetMorale: number,
  itemsUsed: string[],
  storyContext: string,
): Promise<ActionResponse> {
  console.log(
    "determining attack outcome for",
    attackerName,
    "and",
    targetCountry,
    "...",
  );
  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of an attack.",
    resolveAttackPrompt(
      attackerName,
      attackerArmy,
      targetCountry,
      targetArmy,
      targetMorale,
      itemsUsed,
      storyContext,
    ),
  );
  console.log("llm generated attack outcome", raw);
  const outcome = parseJson<Record<string, unknown>>(raw);
  return {
    success: Boolean(outcome.success),
    new_attacker_army: Number(
      outcome.new_attacker_army_strength ?? attackerArmy,
    ),
    new_enemy_army: Number(outcome.new_defender_army_strength ?? targetArmy),
    story: String(outcome.story ?? ""),
    found_items: (outcome.items as Resource[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Diplomacy outcome
// ---------------------------------------------------------------------------

export async function resolveDiplomacy(
  playerName: string,
  targetCountry: string,
): Promise<DiplomacyResponse> {
  console.log(
    "determining diplomatic alliance outcome for",
    playerName,
    "and",
    targetCountry,
    "...",
  );
  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of a diplomatic alliance.",
    resolveDiplomacyPrompt(playerName, targetCountry),
  );
  console.log("llm generated diplomatic alliance outcome", raw);
  const outcome = parseJson<Record<string, unknown>>(raw);
  return {
    success: Boolean(outcome.success),
    story: String(outcome.story ?? ""),
    items: (outcome.items as Resource[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Research outcome
// ---------------------------------------------------------------------------

export async function resolveResearch(
  playerName: string,
  item: string,
  resourcesUsed: string[],
): Promise<ResearchResponse> {
  console.log(
    "determining research outcome for",
    playerName,
    "and",
    item,
    "...",
  );
  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of a research.",
    resolveResearchPrompt(playerName, item, resourcesUsed),
  );
  console.log("llm generated research outcome", raw);
  const outcome = parseJson<Record<string, unknown>>(raw);
  const researchedItem = outcome.researched_item as
    | Resource
    | Record<string, never>
    | undefined;
  return {
    success: Boolean(outcome.success),
    story: String(outcome.story ?? ""),
    researched_item:
      researchedItem && Object.keys(researchedItem).length > 0
        ? (researchedItem as Resource)
        : null,
  };
}
