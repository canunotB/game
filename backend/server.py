from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class ReputationUpdate(BaseModel):
    player_id: str
    change: int
    reason: str

class GameSaveRequest(BaseModel):
    player_id: str
    game_state: Dict[str, Any]


@api_router.get("/")
async def root():
    return {"message": "Odyssey's Wrath - Game API"}

@api_router.post("/reputation/update")
async def update_reputation(req: ReputationUpdate):
    await db.reputation.update_one(
        {"player_id": req.player_id},
        {"$inc": {"reputation": req.change}, "$push": {"history": {"change": req.change, "reason": req.reason, "ts": datetime.now(timezone.utc).isoformat()}}},
        upsert=True
    )
    doc = await db.reputation.find_one({"player_id": req.player_id}, {"_id": 0})
    return {"reputation": doc.get("reputation", 0) if doc else 0}

@api_router.get("/reputation/{player_id}")
async def get_reputation(player_id: str):
    doc = await db.reputation.find_one({"player_id": player_id}, {"_id": 0})
    return {"reputation": doc.get("reputation", 0) if doc else 0}

@api_router.post("/game/save")
async def save_game(req: GameSaveRequest):
    doc = {"player_id": req.player_id, "game_state": req.game_state, "saved_at": datetime.now(timezone.utc).isoformat()}
    await db.game_saves.update_one({"player_id": req.player_id}, {"$set": doc}, upsert=True)
    return {"status": "saved"}

@api_router.get("/game/load/{player_id}")
async def load_game(player_id: str):
    save = await db.game_saves.find_one({"player_id": player_id}, {"_id": 0})
    return save if save else {"status": "no_save_found"}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
