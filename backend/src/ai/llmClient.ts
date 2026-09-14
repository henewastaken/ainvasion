import { v4 as uuidv4 } from "uuid";
import ollama from "ollama";
import {
  generateResourcesPrompt,
  resolveAttackPrompt,
  resolveDiplomacyPrompt,
  resolveResearchPrompt,
} from "./prompts";
import { logger } from "../logging/logger";
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
  // Correlate the request log with its response log.
  const requestId = uuidv4();
  const startedAt = Date.now();

  logger.debug("llm request", {
    requestId,
    model: MODEL,
    systemPrompt,
    userPrompt,
  });

  try {
    const response = await ollama.chat({
      model: MODEL,
      // Constrain decoding to valid JSON at the grammar level so the model can't
      // emit prose or malformed JSON (e.g. trailing commas). Stronger still would
      // be passing a JSON schema here for structured outputs.
      format: "json",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.message.content;
    logger.info("llm response", {
      requestId,
      model: MODEL,
      durationMs: Date.now() - startedAt,
      response: content,
    });
    return content;
  } catch (err) {
    logger.error("llm request failed", {
      requestId,
      model: MODEL,
      durationMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

function parseJson<T>(raw: string): T {
  // `format: "json"` should already guarantee clean JSON, but small local models
  // are unreliable — salvage the most likely JSON payload before giving up.
  const sanitize = (text: string): string => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const span = start !== -1 && end > start ? text.slice(start, end + 1) : text;
    // Drop trailing commas before a closing } or ] — the most common defect.
    return span.replace(/,(\s*[}\]])/g, "$1");
  };

  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      const parsed = JSON.parse(sanitize(raw)) as T;
      logger.warn("llm response needed sanitizing before it parsed", { raw });
      return parsed;
    } catch {
      logger.error("llm response is not valid JSON", { raw });
      throw new Error("LLM response is not valid JSON");
    }
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
  logger.info("generating country resources", {
    countries: Object.keys(countries),
  });

  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Generate resources for each country.",
    generateResourcesPrompt(Object.keys(countries)),
  );

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
  logger.info("resolving attack", {
    attackerEmpire,
    targetCountry: targetCountry.name,
  });

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

  const outcome = parseJson<Record<string, unknown>>(raw);

  return {
    success: Boolean(outcome.success),
    playerArmyStrength: Number(
      outcome.newAttackerArmyStrength ?? attackerArmyStrength,
    ),
    enemyArmyStrength: Number(
      outcome.newDefenderArmyStrength ?? targetCountry.armyStrength,
    ),
    story: String(outcome.story ?? ""),
    itemsFound: (outcome.foundItems as Item[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Diplomacy outcome
// ---------------------------------------------------------------------------

export async function resolveDiplomacy(
  playerEmpireCountryNames: string[],
  targetCountry: Country,
  resourcesUsed: Resource[],
): Promise<DiplomacyResponse> {
  logger.info("resolving diplomacy", {
    playerEmpire: playerEmpireCountryNames,
    targetCountry: targetCountry.name,
  });

  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of a diplomatic alliance.",
    resolveDiplomacyPrompt(
      playerEmpireCountryNames,
      targetCountry,
      resourcesUsed,
    ),
  );

  const outcome = parseJson<Record<string, unknown>>(raw);
  return {
    success: Boolean(outcome.success),
    story: String(outcome.story ?? ""),
  };
}

// ---------------------------------------------------------------------------
// Research outcome
// ---------------------------------------------------------------------------

export async function resolveResearch(
  playerName: string,
  item: string,
  itemsUsed: Item[],
  resourcesUsed: Resource[],
): Promise<ResearchResponse> {
  logger.info("resolving research", { playerName, item });

  const raw = await llmRequest(
    "You are a world domination strategy game assistant. Determine outcome of a research.",
    resolveResearchPrompt(playerName, item, itemsUsed, resourcesUsed),
  );

  const outcome = parseJson<Record<string, unknown>>(raw);

  const researchedItem = outcome.researchedItem as
    | Item
    | Record<string, never>
    | undefined;

  return {
    success: Boolean(outcome.success),
    story: String(outcome.story ?? ""),
    // Echo back what the player spent so the client can report it.
    itemsUsed,
    resourcesUsed,
    researchedItem:
      researchedItem && Object.keys(researchedItem).length > 0
        ? (researchedItem as Item)
        : null,
  };
}
