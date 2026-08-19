import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

import { lobbyRoutes } from "./routes/lobby";
import { gameRoutes } from "./routes/game";

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.use(lobbyRoutes);
app.use(gameRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
