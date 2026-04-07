from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

from npc_ai import NPCBrain
npc_brain = NPCBrain()


class ChatRequest(BaseModel):
    npc_id: str
    player_message: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    npc_id: str
    response: str
    emotion: str = "neutral"
    action: Optional[str] = None


class BattleActionRequest(BaseModel):
    player_action: str
    player_position: Dict[str, float]
    enemy_hp: int
    player_hp: int
    environment: Dict[str, Any]


class BattleActionResponse(BaseModel):
    action: str
    dialogue: str = ""
    telegraph: Optional[str] = None
    qte_sequence: Optional[List[str]] = None


class GameSaveRequest(BaseModel):
    player_id: str
    game_state: Dict[str, Any]


@api_router.get("/")
async def root():
    return {"message": "Odyssey's Wrath - Game API"}


@api_router.post("/npc/chat", response_model=ChatResponse)
async def npc_chat(req: ChatRequest):
    memory = await db.npc_memory.find_one(
        {"npc_id": req.npc_id}, {"_id": 0}
    )
    response = await npc_brain.chat(
        npc_id=req.npc_id,
        player_message=req.player_message,
        context=req.context,
        memory=memory
    )
    await db.npc_memory.update_one(
        {"npc_id": req.npc_id},
        {"$push": {"interactions": {
            "player": req.player_message,
            "npc": response["response"],
            "ts": datetime.now(timezone.utc).isoformat()
        }}},
        upsert=True
    )
    return ChatResponse(
        npc_id=req.npc_id,
        response=response["response"],
        emotion=response.get("emotion", "neutral"),
        action=response.get("action")
    )


@api_router.post("/battle/enemy-action", response_model=BattleActionResponse)
async def enemy_action(req: BattleActionRequest):
    result = await npc_brain.battle_decision(
        player_action=req.player_action,
        player_position=req.player_position,
        enemy_hp=req.enemy_hp,
        player_hp=req.player_hp,
        environment=req.environment
    )
    return BattleActionResponse(**result)


@api_router.post("/game/save")
async def save_game(req: GameSaveRequest):
    doc = {
        "player_id": req.player_id,
        "game_state": req.game_state,
        "saved_at": datetime.now(timezone.utc).isoformat()
    }
    await db.game_saves.update_one(
        {"player_id": req.player_id},
        {"$set": doc},
        upsert=True
    )
    return {"status": "saved"}


@api_router.get("/game/load/{player_id}")
async def load_game(player_id: str):
    save = await db.game_saves.find_one(
        {"player_id": player_id}, {"_id": 0}
    )
    if save:
        return save
    return {"status": "no_save_found"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
