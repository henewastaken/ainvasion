import {
  ActionResponse,
  ResearchResponse,
  Resource,
  ItemUsed,
  GameState,
  DiplomacyResponse,
  Player,
  Country,
} from "../game/models";

// Returns all countries bordering the player's empire that they don't already own.
export const getEmpireBorders = (
  state: GameState,
  player: Player,
): string[] => {
  const owned = new Set(player.empire);

  return [
    ...new Set(
      player.empire
        .flatMap((name) => state.countries[name]?.adjacency ?? [])
        .filter((name) => !owned.has(name)),
    ),
  ];
};

// Return true if targetCountry is reachable from the player's empire and not already owned by them.
export const isAdjacent = (
  state: GameState,
  playerId: string,
  targetCountry: string,
): boolean => {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player) return false;

  return getEmpireBorders(state, player).includes(targetCountry);
};

// Apply the resolved attack outcome to the game state.
export const applyActionResult = (
  state: GameState,
  actionResponse: ActionResponse,
  playerId: string,
  targetCountry: string,
  itemsUsed: ItemUsed[],
): GameState => {
  const player: Player | undefined = state.players.find(
    (player) => player.playerId === playerId,
  );

  const target: Country = state.countries[targetCountry];
  if (!player || !target) {
    return state;
  }

  const prevOwnerId = target.ownerId; // capture before any mutation

  // Update army strengths
  player.armyStrength = actionResponse.playerArmyStrength;
  target.armyStrength = actionResponse.enemyArmyStrength;

  if (actionResponse.success) {
    target.ownerId = playerId;
    player.empire.push(targetCountry);

    // Remove from previous owner's empire
    if (prevOwnerId && prevOwnerId !== playerId) {
      const prevOwner = state.players.find(
        (player) => player.playerId === prevOwnerId,
      );

      if (prevOwner) {
        prevOwner.empire = prevOwner.empire.filter(
          (country) => country !== targetCountry,
        );
      }
    }
  }

  // Count how many times each item was used this turn (itemsUsed may contain duplicates)
  const usageCounts = itemsUsed.reduce<Record<string, number>>(
    (acc, used) => ({
      ...acc,
      [used.itemName]: (acc[used.itemName] ?? 0) + 1,
    }),
    {},
  );
  // Deduct used quantities and drop fully-consumed items
  player.items = player.items
    .map((item) => ({
      ...item,
      quantity: item.quantity - (usageCounts[item.itemName] ?? 0),
    }))
    .filter((item) => item.quantity > 0);

  // Merge items found from the action result into the player's inventory.
  player.items = actionResponse.itemsFound.reduce(
    (inventory, found) => {
      // Check if the player already has this item type
      const alreadyOwned = inventory.some(
        (item) => item.itemName === found.itemName,
      );

      if (alreadyOwned) {
        // Item exists: add the found quantity to the existing stack
        return inventory.map((item) =>
          item.itemName === found.itemName
            ? { ...item, quantity: item.quantity + found.quantity }
            : item,
        );
      }
      // Item is new: append it to the inventory
      return [...inventory, { ...found }];
    },

    player.items, // start from the current inventory, not an empty array
  );
  state.storyLog.push(actionResponse.story);

  return state;
};

export const applyDiplomacyResult = (
  state: GameState,
  diplomacyResponse: DiplomacyResponse,
  playerId: string,
  targetCountry: string,
  itemsUsed: ItemUsed[],
): GameState => {
  const player: Player | undefined = state.players.find(
    (p) => p.playerId === playerId,
  );

  const target: Country = state.countries[targetCountry];
  if (!player || !target) {
    return state;
  }

  if (diplomacyResponse.success) {
    const prevOwnerId = target.ownerId;
    target.ownerId = playerId;
    player.empire.push(targetCountry);

    if (prevOwnerId && prevOwnerId !== playerId) {
      const prevOwner = state.players.find((p) => p.playerId === prevOwnerId);

      if (prevOwner) {
        prevOwner.empire = prevOwner.empire.filter((c) => c !== targetCountry);
      }
    }
  } else {
    const usageCounts = itemsUsed.reduce<Record<string, number>>(
      (acc, used) => ({
        ...acc,
        [used.itemName]: (acc[used.itemName] ?? 0) + 1,
      }),
      {},
    );

    player.resources = player.resources
      .map((r) => ({
        ...r,
        quantity: r.quantity - (usageCounts[r.resourceName] ?? 0),
      }))
      .filter((r) => r.quantity > 0);
  }

  state.storyLog.push(diplomacyResponse.story);
  return state;
};

// Apply the resolved research outcome: add item to inventory, consume resources.
export const applyResearchResult = (
  state: GameState,
  researchResponse: ResearchResponse,
  playerId: string,
  resourcesUsed: string[],
): GameState => {
  const player: Player | undefined = state.players.find(
    (player) => player.playerId === playerId,
  );

  if (!player) {
    return state;
  }

  // Consume used resources
  const usageCounts = resourcesUsed.reduce<Record<string, number>>(
    (acc, name) => ({ ...acc, [name]: (acc[name] ?? 0) + 1 }),
    {},
  );

  player.resources = player.resources
    .map((r) => ({
      ...r,
      quantity: r.quantity - (usageCounts[r.resourceName] ?? 0),
    }))
    .filter((r) => r.quantity > 0);

  // Add researched item
  const newResource: Resource = {
    resourceName: researchResponse.researchedItem?.resourceName || "",
    resourceEffect: researchResponse.researchedItem?.resourceEffect || "",
    quantity: researchResponse.researchedItem?.quantity || 0,
  };

  const existing = player.resources.find(
    (r) => r.resourceName === newResource.resourceName,
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    player.resources.push(newResource as Resource);
  }

  state.storyLog.push(
    `${player.name} researched '${researchResponse.researchedItem?.resourceName}' with effect '${researchResponse.researchedItem?.resourceEffect}'`,
  );

  return state;
};

// Advance to the next active player; increment turnNumber after all players have gone.
export const advanceTurn = (state: GameState): GameState => {
  // Reset acted flag for outgoing player
  const current = state.players.find(
    (p) => p.playerId === state.currentTurnPlayerId,
  );

  if (current) current.hasActedThisTurn = false;

  const activeIds = state.players
    .filter((p) => p.empire.length > 0)
    .map((p) => p.playerId);

  if (activeIds.length === 0) {
    return state;
  }

  if (!activeIds.includes(state.currentTurnPlayerId)) {
    // Current player was eliminated mid-round; hand off to first active player
    state.currentTurnPlayerId = activeIds[0];
    return state;
  }

  const currentIdx = activeIds.indexOf(state.currentTurnPlayerId);
  const nextIdx = (currentIdx + 1) % activeIds.length;
  state.currentTurnPlayerId = activeIds[nextIdx];

  // Completed one full round when we wrap back to the first player
  if (nextIdx === 0) {
    state.turnNumber += 1;
  }

  return state;
};

// Check for victory conditions
export const checkVictory = (state: GameState): string | null => {
  /**
   * Return the winning playerId if a victory condition is met, otherwise null.
   * Conditions (either):
   *   1. All countries are owned by a single player.
   *   2. Only one player still has an empire.
   */
  const activePlayers = state.players.filter((p) => p.empire.length > 0);

  // "Last player standing" only applies in multiplayer — in solo play, win by owning all countries
  if (state.players.length > 1 && activePlayers.length === 1) {
    return activePlayers[0].playerId;
  }

  const owners = new Set(
    Object.values(state.countries)
      .map((c) => c.ownerId)
      .filter((id) => id !== null),
  );

  const neutral = Object.values(state.countries).filter(
    (c) => c.ownerId === null,
  );

  if (neutral.length === 0 && owners.size === 1) {
    return Array.from(owners)[0];
  }

  return null;
};
