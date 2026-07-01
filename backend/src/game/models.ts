import { z } from "zod";

export const ResourceSchema = z.object({
  resourceName: z.string(),
  resourceEffect: z.string(),
  quantity: z.number().default(1),
});

export type Resource = z.infer<typeof ResourceSchema>;

const ItemSchema = z.object({
  itemName: z.string(),
  itemEffect: z.string(),
  quantity: z.number().default(1),
});

export type Item = z.infer<typeof ItemSchema>;

export const CountrySchema = z.object({
  name: z.string(),
  ownerId: z.string().nullable(),
  armyStrength: z.number(),
  morale: z.number(),
  adjacency: z.array(z.string()),
  favoriteResource: z.string().nullable(),
  hatedResource: z.string().nullable(),
});

export type Country = z.infer<typeof CountrySchema>;

export const PlayerSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  empire: z.array(z.string()),
  resources: z.array(ResourceSchema).default([]),
  armyStrength: z.number().default(100),
  morale: z.number().default(100),
  hasActedThisTurn: z.boolean().default(false),
});

export type Player = z.infer<typeof PlayerSchema>;

export const GameStateSchema = z.object({
  gameId: z.string(),
  creatorId: z.string(),
  players: z.array(PlayerSchema),
  countries: z.record(CountrySchema),
  currentTurnPlayerId: z.string(),
  turnNumber: z.number().default(1),
  storyLog: z.array(z.string()).default([]),
  status: z.enum(["pending", "active", "finished"]).default("pending"),
  winnerId: z.string().nullable(),
});

export type GameState = z.infer<typeof GameStateSchema>;

export const ItemUsedSchema = z.object({
  itemName: z.string(),
  itemEffect: z.string(),
});

export type ItemUsed = z.infer<typeof ItemUsedSchema>;

export const ActionRequestSchema = z.object({
  playerId: z.string(),
  target: z.string(),
  attackType: z.enum(["war", "diplomatic"]),
  itemsUsed: z.array(ItemUsedSchema).default([]),
});

export type ActionRequest = z.infer<typeof ActionRequestSchema>;

export const ResearchRequestSchema = z.object({
  playerId: z.string(),
  item: z.string(),
  resourcesUsed: z.array(z.string()).default([]),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const ActionResponseSchema = z.object({
  success: z.boolean(),
  playerArmyStrength: z.number(),
  enemyArmyStrength: z.number(),
  story: z.string(),
  items: z.array(ResourceSchema).default([]),
});

export type ActionResponse = z.infer<typeof ActionResponseSchema>;

export const DiplomacyResponseSchema = z.object({
  success: z.boolean(),
  story: z.string(),
  itemsUsed: z.array(ItemSchema).default([]),
  resourceUsed: z.array(ResourceSchema).nullable(),
});

export type DiplomacyResponse = z.infer<typeof DiplomacyResponseSchema>;

export const ResearchResponseSchema = z.object({
  success: z.boolean(),
  story: z.string(),
  itemsUsed: z.array(ItemSchema).default([]),
  resourceUsed: z.array(ResourceSchema).nullable(),
  researchedItem: ResourceSchema.nullable(),
});

export type ResearchResponse = z.infer<typeof ResearchResponseSchema>;
