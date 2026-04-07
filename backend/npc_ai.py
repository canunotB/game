import os
import json
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

NPC_PERSONALITIES = {
    "elder_theron": {
        "name": "Elder Theron",
        "system_prompt": (
            "You are Elder Theron, a cryptic ancient oracle in a world inspired by The Odyssey. "
            "You speak in riddles and metaphors about fate, prophecy, and the gods. "
            "A child stands before you—fated to die by divine decree. You pity them but cannot defy the gods. "
            "You react to the player's TONE: if kind, be gentle and sad. If aggressive, be stern and warning. "
            "If cunning, be impressed but cautious. If neutral, be cryptic. "
            "Consider the player's REPUTATION when responding. "
            "Keep responses to 1-2 short sentences. Never break character. "
            "Always respond as JSON: {\"response\": \"...\", \"emotion\": \"sad|cryptic|warning|calm|impressed\"}"
        )
    },
    "lyra": {
        "name": "Lyra",
        "system_prompt": (
            "You are Lyra, a scared 10-year-old village girl in a mythical Greek world. "
            "You saw the warrior Kairen arrive in dark armor with a glowing sword. "
            "React to the player's TONE: if kind, feel relieved. If aggressive, cry and flinch. "
            "If cunning, be confused. If neutral, be nervous. "
            "Consider REPUTATION: if feared, be terrified. If respected, be hopeful. "
            "Keep responses to 1-2 sentences. Stutter sometimes when scared. "
            "Always respond as JSON: {\"response\": \"...\", \"emotion\": \"scared|worried|hopeful|sad|crying\"}"
        )
    },
    "kairen": {
        "name": "Kairen",
        "system_prompt": (
            "You are Kairen, a ruthless knight-guardian serving the gods in The Odyssey world. "
            "Tasked with killing a prophesied child. Stoic, cold, speaks with grim authority. "
            "Keep to 1 sentence. Menacing but not cartoonish. "
            "Always respond as JSON: {\"response\": \"...\", \"emotion\": \"cold|menacing|respectful|furious\"}"
        )
    }
}

BATTLE_SYSTEM_PROMPT = (
    "You are combat AI for Kairen, a fearsome warrior fighting an 8-year-old child in a battle arena. "
    "Arena has rocks, trees, mud, thorny hazards. It is raining. The battlefield is treacherous. "
    "Choose tactical actions. You are MUCH stronger. Be aggressive but occasionally dodge. "
    "Available: heavy_slash, thrust, shield_bash, dodge, taunt. "
    "For attacks, provide a QTE sequence of 2-4 arrows: up/down/left/right. "
    "Keep dialogue to ONE short battle cry. "
    "Respond ONLY as JSON: {\"action\": \"...\", \"dialogue\": \"...\", "
    "\"telegraph\": \"...\", \"qte_sequence\": [...]}"
)


class NPCBrain:
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        self.chats = {}

    def _get_chat(self, npc_id, session_suffix=""):
        key = f"{npc_id}_{session_suffix}"
        if key not in self.chats:
            npc = NPC_PERSONALITIES.get(npc_id)
            system = npc["system_prompt"] if npc else BATTLE_SYSTEM_PROMPT
            if npc_id == "battle_ai":
                system = BATTLE_SYSTEM_PROMPT
            chat = LlmChat(api_key=self.api_key, session_id=key, system_message=system).with_model("openai", "gpt-5.2")
            self.chats[key] = chat
        return self.chats[key]

    def _parse(self, text):
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)

    async def chat(self, npc_id, player_message, tone="neutral", reputation=0, context=None, memory=None):
        chat = self._get_chat(npc_id, "dialogue")
        ctx = ""
        if memory and "interactions" in memory:
            recent = memory["interactions"][-3:]
            ctx = f"Recent history: {json.dumps(recent)}\n"
        prompt = f"{ctx}Player reputation: {reputation}. Player tone: {tone}. Player says: \"{player_message}\""
        try:
            result = await chat.send_message(UserMessage(text=prompt))
            return self._parse(result)
        except Exception as e:
            logger.error(f"NPC chat error: {e}")
            return {"response": self._fallback(npc_id), "emotion": "neutral"}

    async def battle_decision(self, player_action, player_position, enemy_hp, player_hp, environment):
        chat = self._get_chat("battle_ai", "battle")
        prompt = (
            f"Player did '{player_action}' at {player_position}. "
            f"Your HP: {enemy_hp}/100. Player HP: {player_hp}/50. "
            f"Environment: {json.dumps(environment)}."
        )
        try:
            result = await chat.send_message(UserMessage(text=prompt))
            data = self._parse(result)
            valid = ["heavy_slash", "thrust", "shield_bash", "dodge", "taunt"]
            if data.get("action") not in valid:
                data["action"] = "heavy_slash"
            if data["action"] in ["heavy_slash", "thrust", "shield_bash"] and not data.get("qte_sequence"):
                data["qte_sequence"] = ["up", "right"]
            elif data["action"] in ["dodge", "taunt"]:
                data["qte_sequence"] = []
            return data
        except Exception as e:
            logger.error(f"Battle AI error: {e}")
            return {"action": "heavy_slash", "dialogue": "The gods demand your end!", "telegraph": "Kairen raises his blade", "qte_sequence": ["up", "down", "left"]}

    def _fallback(self, npc_id):
        return {"elder_theron": "The threads of fate are tangled, child...", "lyra": "P-please... be careful...", "kairen": "You cannot escape the gods."}.get(npc_id, "...")
