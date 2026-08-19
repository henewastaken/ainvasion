import { Router } from "express";
import { Request, Response } from "express";
import {
  createSession,
  getSession,
  addPlayer,
  updateState,
} from "../game/stateManager";
import { generateCountryResources } from "../ai/llmClient";

export const lobbyRoutes = Router();

type CreateGameRequest = {
  playerName: string;
};

type JoinGameRequest = {
  playerName: string;
};

type StartGameRequest = {
  playerId: string;
};

export const createGame = async (req: Request, res: Response) => {
  const body: CreateGameRequest = req.body;
  const { gameId, playerId } = createSession(body.playerName);
  res.json({ gameId: gameId, playerId: playerId });
};

export const joinGame = async (req: Request, res: Response) => {
  const gameId = req.params.gameId;
  const body: JoinGameRequest = req.body;

  const playerId = addPlayer(gameId, body.playerName);
  if (!playerId) {
    res.status(400).json({
      error: "Cannot join: game not found, already started, or lobby is full.",
    });
    return;
  }

  res.json({ playerId: playerId });
};

export const startGame = async (req: Request, res: Response) => {
  const gameId = req.params.gameId;
  const body: StartGameRequest = req.body;

  const state = getSession(gameId);
  if (!state) {
    res.status(404).json({ error: "Game not found." });
    return;
  }
  if (state.creatorId !== body.playerId) {
    res.status(403).json({ error: "Only the creator can start the game." });
    return;
  }
  if (state.status !== "pending") {
    res.status(400).json({ error: "Game has already started." });
    return;
  }

  // Generate resources for all countries via AI
  const resources = await generateCountryResources(
    Object.fromEntries(Object.keys(state.countries).map((name) => [name, {}])),
  );

  Object.entries(resources).map(([countryName, res]) => {
    if (state.countries[countryName]) {
      state.countries[countryName].favoriteResource = res.favoriteResource;
      state.countries[countryName].hatedResource = res.hatedResource;
    }
  });

  state.status = "active";
  updateState(gameId, state);
  res.json({ status: "started" });
};

lobbyRoutes.post("/game/create", createGame);
lobbyRoutes.post("/game/:gameId/join", joinGame);
lobbyRoutes.post("/game/:gameId/start", startGame);
