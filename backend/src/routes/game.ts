import { Router, Request, Response } from "express";
import { getSession, updateState } from "../game/stateManager";
import {
  isAdjacent,
  applyActionResult,
  applyDiplomacyResult,
  applyResearchResult,
  advanceTurn,
  checkVictory,
} from "../game/gameEngine";
import {
  ActionRequest,
  Country,
  GameState,
  Item,
  ItemOrResourceUsed,
  Player,
  ResearchRequest,
  Resource,
} from "../game/models";
import { startCountries } from "../game/mapData";
import {
  resolveAttack,
  resolveDiplomacy,
  resolveResearch,
} from "../ai/llmClient";
import { broadcastState, broadcastGameOver } from "../ws/wsServer";

export const gameRoutes = Router();

const validateState = (
  state: GameState | undefined,
  body: { playerId: string },
  res: Response,
): state is GameState => {
  if (!state) {
    res.status(404).json({ error: "Game not found." });
    return false;
  }

  if (state.status !== "active") {
    res.status(400).json({ error: "Game is not active." });
    return false;
  }

  if (state.currentTurnPlayerId !== body.playerId) {
    res.status(403).json({ error: "It is not your turn." });
    return false;
  }

  return true;
};

export const getMap = async (req: Request, res: Response) => {
  res.json(startCountries);
};

export const getState = async (req: Request, res: Response) => {
  const gameId = req.params.gameId;
  const state = getSession(gameId);

  if (!state) {
    res.status(404).json({ error: "Game not found." });
    return;
  }
  res.json(state);
};

// Handle player action (attack or diplomacy)
export const performAction = async (req: Request, res: Response) => {
  const gameId = req.params.gameId;
  const body: ActionRequest = req.body;
  const state = getSession(gameId);
  console.log(body);

  if (!validateState(state, body, res)) {
    return;
  }

  const player: Player | undefined = state.players.find(
    (player: Player) => player.playerId === body.playerId,
  );

  // Validate the action request
  if (!player) {
    res.status(404).json({ error: "Player not found." });
    return;
  }

  if (player.hasActedThisTurn) {
    res.status(400).json({ error: "You have already acted this turn." });
    return;
  }

  if (!isAdjacent(state, body.playerId, body.target)) {
    res.status(400).json({
      error: `'${body.target}' is not adjacent to your empire.`,
    });
    return;
  }

  // War is fought with items; diplomacy is swayed with resources. Validate the
  // things the player claims to spend against the matching inventory.
  const missingItems = body.itemsOrResourceUsed
    .map((usedItem: ItemOrResourceUsed) => {
      const owned =
        body.attackType === "war"
          ? player.items.some(
              (item: Item) => item.itemName === usedItem.itemOrResourceName && item.quantity > 0,
            )
          : player.resources.some(
              (resource: Resource) =>
                resource.resourceName === usedItem.itemOrResourceName && resource.quantity > 0,
            );
      return owned ? null : usedItem.itemOrResourceName;
    })
    .filter(Boolean);

  if (missingItems.length > 0) {
    res.status(400).json({
      error: `${body.attackType === "war" ? "Item" : "Resource"} not in inventory: ${missingItems[0]}`,
    });
    return;
  }

  // Get the target country story history, resources, and prepare for action resolution
  const target: Country = state.countries[body.target];
  const storyContext = state.storyLog.slice(-3).join(" ");
  const mappedResources: Resource[] = body.itemsOrResourceUsed.map(
    (usedItem: ItemOrResourceUsed) => ({
      resourceName: usedItem.itemOrResourceName,
      resourceEffect: usedItem.itemOrResourceEffect,
      quantity: 1,
    }),
  );

  player.hasActedThisTurn = true;

  // Resolve the action based on the attackType (war or diplomatic)
  const handlers = {
    // TODO: resoleDiplomacy takes a Country as parameter. Now Player has no Country
    // Should whole Player schema be redesign, or should all data come from body?
    // Also should Player have country that is one big country where all new countries gets merged into
    diplomatic: async () => {
      const outcome = await resolveDiplomacy(
        player.empire,
        target,
        mappedResources,
      );

      return {
        response: outcome,
        newState: applyDiplomacyResult(
          state,
          outcome,
          body.playerId,
          body.target,
          body.itemsOrResourceUsed.map(
            (usedItem: ItemOrResourceUsed) => usedItem.itemOrResourceName,
          ),
        ),
      };
    },
    // Resolve Attack
    war: async () => {
      const outcome = await resolveAttack(
        player.empire,
        player.armyStrength,
        player.morale,
        target,
        mappedResources,
        storyContext,
      );

      return {
        response: outcome,
        newState: applyActionResult(
          state,
          outcome,
          body.playerId,
          body.target,
          body.itemsOrResourceUsed,
        ),
      };
    },
  };

  const { response, newState } = await handlers[body.attackType]();

  const winner = checkVictory(newState);
  if (winner) {
    newState.status = "finished";
    newState.winnerId = winner;
  } else {
    advanceTurn(newState);
  }

  updateState(gameId, newState);
  if (winner) {
    broadcastGameOver(gameId);
  } else {
    broadcastState(gameId);
  }
  res.json(response);
};

export const performResearch = async (req: Request, res: Response) => {
  const gameId = req.params.gameId;
  const body: ResearchRequest = req.body;

  const state = getSession(gameId);
  if (!validateState(state, body, res)) {
    return;
  }

  const player = state.players.find((player: Player) => player.playerId === body.playerId);
  if (!player) {
    res.status(404).json({ error: "Player not found." });
    return;
  }
  if (player.hasActedThisTurn) {
    res.status(400).json({ error: "You have already acted this turn." });
    return;
  }

  // Validate the spent items and resources against the matching inventories.
  const missingItem = body.itemsUsed.find(
    (itemName: string) =>
      !player.items.some(
        (item: Item) => item.itemName === itemName && item.quantity > 0,
      ),
  );
  if (missingItem) {
    res.status(400).json({ error: `Item not in inventory: ${missingItem}` });
    return;
  }

  const missingResource = body.resourcesUsed.find(
    (resourceName: string) =>
      !player.resources.some(
        (resource: Resource) =>
          resource.resourceName === resourceName && resource.quantity > 0,
      ),
  );
  if (missingResource) {
    res
      .status(400)
      .json({ error: `Resource not in inventory: ${missingResource}` });
    return;
  }

  // Resolve the spent names to their full inventory entries for the LLM.
  const itemsUsed = body.itemsUsed.map((itemName: string) => {
    const item = player.items.find((item: Item) => item.itemName === itemName);
    return {
      itemName: item?.itemName ?? itemName,
      itemEffect: item?.itemEffect ?? "",
      quantity: 1,
    };
  });

  const resourcesUsed = body.resourcesUsed.map((resourceName: string) => {
    const resource = player.resources.find(
      (resource: Resource) => resource.resourceName === resourceName,
    );
    return {
      resourceName: resource?.resourceName ?? resourceName,
      resourceEffect: resource?.resourceEffect ?? "",
      quantity: 1,
    };
  });

  const researchResponse = await resolveResearch(
    player.name,
    body.item,
    itemsUsed,
    resourcesUsed,
  );

  player.hasActedThisTurn = true;
  const newState = applyResearchResult(
    state,
    researchResponse,
    body.playerId,
    body.itemsUsed,
    body.resourcesUsed,
  );

  advanceTurn(newState);
  updateState(gameId, newState);
  broadcastState(gameId);
  res.json(researchResponse);
};

gameRoutes.get("/game/map", getMap);
gameRoutes.get("/game/:gameId/state", getState);
gameRoutes.post("/game/:gameId/action", performAction);
gameRoutes.post("/game/:gameId/research", performResearch);
