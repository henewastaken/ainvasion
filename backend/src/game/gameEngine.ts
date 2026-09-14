import {
  ActionResponse,
  ResearchResponse,
  ItemOrResourceUsed,
  GameState,
  DiplomacyResponse,
  Player,
  Country,
  Item,
  Resource,
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
        .flatMap((countryName: string) => state.countries[countryName]?.adjacency ?? [])
        .filter((countryName: string) => !owned.has(countryName)),
    ),
  ];
};

// Return true if targetCountry is reachable from the player's empire and not already owned by them.
export const isAdjacent = (
  state: GameState,
  playerId: string,
  targetCountry: string,
): boolean => {
  const player = state.players.find((player: Player) => player.playerId === playerId);
  if (!player) return false;

  return getEmpireBorders(state, player).includes(targetCountry);
};

// Apply the resolved attack outcome to the game state.
export const applyActionResult = (
  state: GameState,
  actionResponse: ActionResponse,
  playerId: string,
  targetCountry: string,
  itemsUsed: ItemOrResourceUsed[],
): GameState => {
  const player: Player | undefined = state.players.find(
    (player: Player) => player.playerId === playerId,
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
        (player: Player) => player.playerId === prevOwnerId,
      );

      if (prevOwner) {
        prevOwner.empire = prevOwner.empire.filter(
          (country: string) => country !== targetCountry,
        );
      }
    }
  }

  // Count how many times each item was used this turn (itemsUsed may contain duplicates)
  const usageCounts = itemsUsed.reduce<Record<string, number>>(
    (accumulator: Record<string, number>, usedItem: ItemOrResourceUsed) => ({
      ...accumulator,
      [usedItem.itemOrResourceName]: (accumulator[usedItem.itemOrResourceName] ?? 0) + 1,
    }),
    {},
  );
  // Deduct used quantities and drop fully-consumed items
  player.items = player.items
    .map((item: Item) => ({
      ...item,
      quantity: item.quantity - (usageCounts[item.itemName] ?? 0),
    }))
    .filter((item: Item) => item.quantity > 0);

  // Merge items found from the action result into the player's inventory.
  player.items = actionResponse.itemsFound.reduce(
    (inventory: Item[], found: Item) => {
      // Check if the player already has this item type
      const alreadyOwned = inventory.some(
        (item: Item) => item.itemName === found.itemName,
      );

      if (alreadyOwned) {
        // Item exists: add the found quantity to the existing stack
        return inventory.map((item: Item) =>
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
  resourcesUsed: string[],
): GameState => {
  const player: Player | undefined = state.players.find(
    (player: Player) => player.playerId === playerId,
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
      const prevOwner = state.players.find((player: Player) => player.playerId === prevOwnerId);

      if (prevOwner) {
        prevOwner.empire = prevOwner.empire.filter((country: string) => country !== targetCountry);
      }
    }
  } else {
    // Resources offered are consumed only when the alliance is rejected.
    const usageCounts = resourcesUsed.reduce<Record<string, number>>(
      (accumulator: Record<string, number>, resourceName: string) => ({
        ...accumulator,
        [resourceName]: (accumulator[resourceName] ?? 0) + 1,
      }),
      {},
    );

    player.resources = player.resources
      .map((resource: Resource) => ({
        ...resource,
        quantity: resource.quantity - (usageCounts[resource.resourceName] ?? 0),
      }))
      .filter((resource: Resource) => resource.quantity > 0);
  }

  state.storyLog.push(diplomacyResponse.story);
  return state;
};

// Apply the resolved research outcome: add item to inventory, consume resources.
export const applyResearchResult = (
  state: GameState,
  researchResponse: ResearchResponse,
  playerId: string,
  itemsUsed: string[],
  resourcesUsed: string[],
): GameState => {
  const player: Player | undefined = state.players.find(
    (player: Player) => player.playerId === playerId,
  );

  if (!player) {
    return state;
  }

  // Count spends by name (either list may contain duplicates).
  const countByName = (names: string[]): Record<string, number> =>
    names.reduce<Record<string, number>>(
      (accumulator: Record<string, number>, name: string) => ({
        ...accumulator,
        [name]: (accumulator[name] ?? 0) + 1,
      }),
      {},
    );

  // Both items and resources may be spent to aid research; consume each from its
  // own inventory.
  const itemCounts = countByName(itemsUsed);
  player.items = player.items
    .map((item: Item) => ({
      ...item,
      quantity: item.quantity - (itemCounts[item.itemName] ?? 0),
    }))
    .filter((item: Item) => item.quantity > 0);

  const resourceCounts = countByName(resourcesUsed);
  player.resources = player.resources
    .map((resource: Resource) => ({
      ...resource,
      quantity: resource.quantity - (resourceCounts[resource.resourceName] ?? 0),
    }))
    .filter((resource: Resource) => resource.quantity > 0);

  // Research yields an item (used later in battles), not a resource.
  const researched = researchResponse.researchedItem;
  if (!researched || !researched.itemName) {
    state.storyLog.push(researchResponse.story);
    return state;
  }

  const existing = player.items.find((item: Item) => item.itemName === researched.itemName);
  if (existing) {
    existing.quantity += researched.quantity || 1;
  } else {
    player.items.push({
      itemName: researched.itemName,
      itemEffect: researched.itemEffect || "",
      quantity: researched.quantity || 1,
    });
  }

  state.storyLog.push(
    `${player.name} researched '${researched.itemName}' with effect '${researched.itemEffect}'`,
  );

  return state;
};

// Advance to the next active player; increment turnNumber after all players have gone.
export const advanceTurn = (state: GameState): GameState => {
  // Reset acted flag for outgoing player
  const current = state.players.find(
    (player: Player) => player.playerId === state.currentTurnPlayerId,
  );

  if (current) current.hasActedThisTurn = false;

  const activeIds = state.players
    .filter((player: Player) => player.empire.length > 0)
    .map((player: Player) => player.playerId);

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
  const activePlayers = state.players.filter((player: Player) => player.empire.length > 0);

  // "Last player standing" only applies in multiplayer — in solo play, win by owning all countries
  if (state.players.length > 1 && activePlayers.length === 1) {
    return activePlayers[0].playerId;
  }

  const owners = new Set(
    Object.values(state.countries)
      .map((country: Country) => country.ownerId)
      .filter((ownerId: string | null) => ownerId !== null),
  );

  const neutral = Object.values(state.countries).filter(
    (country: Country) => country.ownerId === null,
  );

  if (neutral.length === 0 && owners.size === 1) {
    return Array.from(owners)[0];
  }

  return null;
};
