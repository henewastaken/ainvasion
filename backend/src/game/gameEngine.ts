import {
  ActionResponse,
  ResearchResponse,
  Resource,
  ItemUsed,
  GameState,
  DiplomacyResponse,
} from "../game/models";

// Return True if targetCountry is reachable from the player's empire and not already owned by them.
export const isAdjacent = (
  state: GameState,
  playerId: string,
  targetCountry: string,
): boolean => {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player || !state.countries[targetCountry]) {
    return false;
  }

  if (state.countries[targetCountry].ownerId === playerId) {
    return false; // already owned
  }

  for (const ownedName of player.empire) {
    const owned = state.countries[ownedName];
    if (owned && owned.adjacency.includes(targetCountry)) {
      return true;
    }
  }
  return false;
};

// Apply the resolved attack outcome to the game state.
export const applyActionResponse = (
  state: GameState,
  actionResponse: ActionResponse,
  playerId: string,
  targetCountry: string,
  itemsUsed: ItemUsed[],
): GameState => {
  const player = state.players.find((p) => p.playerId === playerId);
  const target = state.countries[targetCountry];
  if (!player || !target) {
    return state;
  }

  const prevOwnerId = target.ownerId; // capture before any mutation

  // Update army strengths
  player.armyStrength = actionResponse.newArmyStrength;
  target.armyStrength = actionResponse.enemyArmyStrength;

  if (actionResponse.success) {
    target.ownerId = playerId;
    player.empire.push(targetCountry);

    // Remove from previous owner's empire
    if (prevOwnerId && prevOwnerId !== playerId) {
      const prevOwner = state.players.find((p) => p.playerId === prevOwnerId);
      if (prevOwner) {
        const index = prevOwner.empire.indexOf(targetCountry);
        if (index !== -1) {
          prevOwner.empire.splice(index, 1);
        }
      }
    }
  }

  // Consume used items from player inventory
  for (const used of itemsUsed) {
    for (const r of player.resources) {
      if (r.itemName === used.itemName && r.quantity > 0) {
        r.quantity -= 1;
        break;
      }
    }
  }
  player.resources = player.resources.filter((r) => r.quantity > 0);

  // Add items found during the event
  for (const found of actionResponse.items) {
    const existing = player.resources.find(
      (r) => r.itemName === found.itemName,
    );
    if (existing) {
      existing.quantity += found.quantity;
    } else {
      player.resources.push({ ...found });
    }
  }

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
  const player = state.players.find((p) => p.playerId === playerId);
  const target = state.countries[targetCountry];
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
        const index = prevOwner.empire.indexOf(targetCountry);
        if (index !== -1) prevOwner.empire.splice(index, 1);
      }
    }
  } else {
    // Resources consumed only on failure
    for (const used of itemsUsed) {
      for (const r of player.resources) {
        if (r.itemName === used.itemName && r.quantity > 0) {
          r.quantity -= 1;
          break;
        }
      }
    }
    player.resources = player.resources.filter((r) => r.quantity > 0);
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
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player) {
    return state;
  }

  // Consume used resources
  for (const resourceName of resourcesUsed) {
    for (const r of player.resources) {
      if (r.itemName === resourceName && r.quantity > 0) {
        r.quantity -= 1;
        break;
      }
    }
  }
  player.resources = player.resources.filter((r) => r.quantity > 0);

  // Add researched item
  const newResource = {
    itemName: researchResponse.researchedItem?.itemName,
    itemEffect: researchResponse.researchedItem?.itemEffect,
    quantity: researchResponse.researchedItem?.quantity,
  };
  const existing = player.resources.find(
    (r) => r.itemName === newResource.itemName,
  );
  if (existing) {
    existing.quantity += 1;
  } else {
    player.resources.push(newResource as Resource);
  }

  state.storyLog.push(
    `${player.name} researched '${researchResponse.researchedItem?.itemName}' with effect '${researchResponse.researchedItem?.itemEffect}'`,
  );
  return state;
};

// Advance to the next active player; increment turnNumber after all players have gone.
export const advanceTurn = (state: GameState): GameState => {
  // Reset acted flag for outgoing player
  for (const p of state.players) {
    if (p.playerId === state.currentTurnPlayerId) {
      p.hasActedThisTurn = false;
      break;
    }
  }

  const activeIds = state.players
    .filter((p) => p.empire)
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
  const activePlayers = state.players.filter((p) => p.empire);
  if (activePlayers.length === 1) {
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
