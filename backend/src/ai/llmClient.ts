import ollama from "ollama";
import {
  generateResourcesPrompt,
  resolveAttackPrompt,
  resolveDiplomacyPrompt,
  resolveResearchPrompt,
} from "./prompts";
import {
  ActionResponse,
  Country,
  DiplomacyResponse,
  Item,
  ResearchResponse,
  Resource,
} from "../game/models";

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
  Record<string, { favoriteResource: string; hatedResource: string }>
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
  attackerEmpire: string[],
  attackerArmyStrength: number,
  attackerMorale: number,
  targetCountry: Country,
  itemsUsed: Resource[],
  storyContext: string,
): Promise<ActionResponse> {
  console.log(
    "determining attack outcome for empire",
    attackerEmpire,
    "and",
    targetCountry.name,
    "...",
  );
  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of an attack.",
    resolveAttackPrompt(
      attackerEmpire,
      attackerArmyStrength,
      attackerMorale,
      targetCountry,
      itemsUsed,
      storyContext,
    ),
  );
  console.log("llm generated attack outcome", raw);
  const outcome = parseJson<Record<string, unknown>>(raw);
  return {
    success: Boolean(outcome.success),
    playerArmyStrength: Number(outcome.newAttackerArmyStrength ?? attackerArmyStrength),
    enemyArmyStrength: Number(outcome.newDefenderArmyStrength ?? targetCountry.armyStrength),
    story: String(outcome.story ?? ""),
    items: (outcome.foundItems as Resource[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Diplomacy outcome
// ---------------------------------------------------------------------------

export async function resolveDiplomacy(
  playerEmpireContrieNames: string[],
  targetCountry: Country,
  resourcesUsed: Resource[],
): Promise<DiplomacyResponse> {
  console.log(
    "determining diplomatic alliance outcome for",
    playerEmpireContrieNames.join(", "),
    "and",
    targetCountry.name,
    "...",
  );
  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of a diplomatic alliance.",
    resolveDiplomacyPrompt(
      playerEmpireContrieNames,
      targetCountry,
      resourcesUsed,
    ),
  );
  console.log("llm generated diplomatic alliance outcome", raw);
  const outcome = parseJson<Record<string, unknown>>(raw);
  return {
    success: Boolean(outcome.success),
    story: String(outcome.story ?? ""),
    itemsUsed: (outcome.items as Item[]) ?? [],
    resourceUsed: (outcome.resourceUsed as Resource[]) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Research outcome
// ---------------------------------------------------------------------------

export async function resolveResearch(
  playerName: string,
  item: string,
  resourcesUsed: Resource[],
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
  const researchedItem = outcome.researchedItem as
    | Resource
    | Record<string, never>
    | undefined;
  return {
    success: Boolean(outcome.success),
    story: String(outcome.story ?? ""),
    itemsUsed: (outcome.items as Item[]) ?? [],
    resourceUsed: (outcome.resourceUsed as Resource[]) ?? null,
    researchedItem:
      researchedItem && Object.keys(researchedItem).length > 0
        ? (researchedItem as Resource)
        : null,
  };
}
