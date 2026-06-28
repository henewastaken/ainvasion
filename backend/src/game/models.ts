import { z } from "zod";

// TODO: port from game/models.py — define Zod schemas here
// Example:
// export const PlayerSchema = z.object({ ... })
// export type Player = z.infer<typeof PlayerSchema>

export const ResourceSchema = z.object({
  item_name: z.string(),
  item_effect: z.string(),
  quantity: z.number().default(1),
});

export type Resource = z.infer<typeof ResourceSchema>;

export const CountrySchema = z.object({
  name: z.string(),
  owner_id: z.string().nullable(),
  army_strength: z.number(),
  morale: z.number(),
  adjacency: z.array(z.string()),
  favorite_resource: z.string().nullable(),
  hated_resource: z.string().nullable(),
});

export type Country = z.infer<typeof CountrySchema>;

export const PlayerSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  empire: z.array(z.string()),
  resources: z.array(ResourceSchema).default([]),
  army_strength: z.number().default(100),
  has_acted_this_turn: z.boolean().default(false),
});

export type Player = z.infer<typeof PlayerSchema>;

export const GameStateSchema = z.object({
  game_id: z.string(),
  creator_id: z.string(),
  players: z.array(PlayerSchema),
  countries: z.record(CountrySchema),
  current_turn_player_id: z.string(),
  turn_number: z.number().default(1),
  story_log: z.array(z.string()).default([]),
  status: z.enum(["pending", "active", "finished"]).default("pending"),
  winner_id: z.string().nullable(),
});

export type GameState = z.infer<typeof GameStateSchema>;

export const ItemUsedSchema = z.object({
  item_name: z.string(),
  item_effect: z.string(),
});

export type ItemUsed = z.infer<typeof ItemUsedSchema>;

export const ActionRequestSchema = z.object({
  player_id: z.string(),
  attack: z.string(),
  attack_type: z.enum(["war", "diplomatic"]),
  items_used: z.array(ItemUsedSchema).default([]),
});

export type ActionRequest = z.infer<typeof ActionRequestSchema>;

export const ResearchRequestSchema = z.object({
  player_id: z.string(),
  item: z.string(),
  resources_used: z.array(z.string()).default([]),
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const ActionResponseSchema = z.object({
  success: z.boolean(),
  new_army_strength: z.number(),
  enemy_army_strength: z.number(),
  story: z.string(),
  items: z.array(ResourceSchema).default([]),
});

export type ActionResponse = z.infer<typeof ActionResponseSchema>;

export const DiplomacyResponseSchema = z.object({
  success: z.boolean(),
  story: z.string(),
});

export type DiplomacyResponse = z.infer<typeof DiplomacyResponseSchema>;

export const ResearchResponseSchema = z.object({
  success: z.boolean(),
  story: z.string(),
  researched_item: ResourceSchema.nullable(),
});

export type ResearchResponse = z.infer<typeof ResearchResponseSchema>;
