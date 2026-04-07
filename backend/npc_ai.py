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
            "Keep responses to 1-2 short sentences. Be mysterious, poetic, and sad. "
            "Never break character. Always respond as JSON: {\"response\": \"your dialogue\", \"emotion\": \"sad|cryptic|warning|calm\", \"action\": null}"
        )
    },
    "lyra": {
        "name": "Lyra",
        "system_prompt": (
            "You are Lyra, a scared 10-year-old village girl in a mythical Greek world. "
            "You saw the warrior Kairen arrive—he's terrifying, in dark armor with a glowing sword. "
            "You're worried about the young child (the player, age 8) who the gods want dead. "
            "Speak simply, nervously. Stutter sometimes. Keep responses to 1-2 sentences. "
            "Never break character. Always respond as JSON: {\"response\": \"your dialogue\", \"emotion\": \"scared|worried|hopeful|sad\", \"action\": null}"
        )
    },
    "kairen": {
        "name": "Kairen",
        "system_prompt": (
            "You are Kairen, a ruthless knight-guardian serving the gods in a world inspired by The Odyssey. "
            "You are tasked with killing a child prophesied to challenge the gods. "
            "You are stoic, cold, and speak with grim authority. You see this as sacred duty, not cruelty. "
            "In battle, you taunt the child but respect their spirit. "
            "Keep responses to 1 short sentence. Be menacing but not cartoonish. "
            "Never break character. Always respond as JSON: {\"response\": \"your dialogue\", \"emotion\": \"cold|menacing|respectful|furious\", \"action\": null}"
        )
    }
}

BATTLE_SYSTEM_PROMPT = (
    "You are the combat AI for Kairen, a fearsome warrior fighting an 8-year-old child in a battle arena. "
    "The arena has rocks, trees, and mud patches. It is raining. "
    "Choose tactical actions based on the situation. You are much stronger than the child. "
    "Available actions: heavy_slash (slow, powerful, wide swing), thrust (fast lunge forward), "
    "shield_bash (push enemy back), dodge (evade), taunt (psychological warfare). "
    "If the player hides behind trees, try to flank. If on mud, be cautious. "
    "If player throws rocks, dodge or block. "
    "Always respond as JSON: {\"action\": \"action_name\", \"dialogue\": \"short battle cry\", "
    "\"telegraph\": \"brief visual description\", \"qte_sequence\": [\"up\",\"down\",\"left\",\"right\"]}"
    "\nQTE sequences should be 2-4 arrows for attacks, empty for dodge/taunt."
)


class NPCBrain:
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        self.chats = {}

    def _get_chat(self, npc_id, session_suffix=""):
        key = f"{npc_id}_{session_suffix}"
        if key not in self.chats:
            npc = NPC_PERSONALITIES.get(npc_id, NPC_PERSONALITIES["elder_theron"])
            system = npc["system_prompt"] if npc_id != "battle_ai" else BATTLE_SYSTEM_PROMPT
            chat = LlmChat(
                api_key=self.api_key,
                session_id=key,
                system_message=system
            ).with_model("openai", "gpt-5.2")
            self.chats[key] = chat
        return self.chats[key]

    def _parse_json(self, text):
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)

    async def chat(self, npc_id, player_message, context=None, memory=None):
        chat = self._get_chat(npc_id, "dialogue")
        context_str = ""
        if memory and "interactions" in memory:
            recent = memory["interactions"][-3:]
            context_str = f"Recent conversation history: {json.dumps(recent)}\n"

        prompt = f"{context_str}The child says: \"{player_message}\""

        try:
            msg = UserMessage(text=prompt)
            result = await chat.send_message(msg)
            data = self._parse_json(result)
            return data
        except Exception as e:
            logger.error(f"NPC chat error for {npc_id}: {e}")
            return {
                "response": self._fallback_dialogue(npc_id),
                "emotion": "neutral",
                "action": None
            }

    async def battle_decision(self, player_action, player_position, enemy_hp, player_hp, environment):
        chat = self._get_chat("battle_ai", "battle")
        prompt = (
            f"Situation: Player did '{player_action}' at position {player_position}. "
            f"Your HP: {enemy_hp}/100. Player HP: {player_hp}/50. "
            f"Environment: {json.dumps(environment)}. "
            f"Choose your next action."
        )
        try:
            msg = UserMessage(text=prompt)
            result = await chat.send_message(msg)
            data = self._parse_json(result)
            valid = ["heavy_slash", "thrust", "shield_bash", "dodge", "taunt"]
            if data.get("action") not in valid:
                data["action"] = "heavy_slash"
            if data["action"] in ["heavy_slash", "thrust", "shield_bash"]:
                if not data.get("qte_sequence"):
                    data["qte_sequence"] = ["up", "right"]
            else:
                data["qte_sequence"] = []
            return data
        except Exception as e:
            logger.error(f"Battle AI error: {e}")
            return {
                "action": "heavy_slash",
                "dialogue": "The gods demand your end!",
                "telegraph": "Kairen raises his blade with both hands",
                "qte_sequence": ["up", "down", "left"]
            }

    def _fallback_dialogue(self, npc_id):
        fallbacks = {
            "elder_theron": "The threads of fate are tangled, child... tread carefully.",
            "lyra": "P-please... be careful out there...",
            "kairen": "You cannot escape what the gods have ordained.",
        }
        return fallbacks.get(npc_id, "...")
