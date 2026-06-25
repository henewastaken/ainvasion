import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import lobby, game, ws

load_dotenv()

app = FastAPI(
    title="World Domination API",
    description="Turn-based networked multiplayer world domination game backend.",
    version="0.1.0",
)

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lobby.router)
app.include_router(game.router)
app.include_router(ws.router)


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}
