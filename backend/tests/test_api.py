"""
Backend API Tests for Odyssey's Wrath RPG Game
Tests: NPC Chat, Battle AI, Reputation, Game Save/Load
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-npc-battles.preview.emergentagent.com').rstrip('/')


class TestHealthAndRoot:
    """Basic API connectivity tests"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Odyssey" in data["message"]
        print(f"SUCCESS: Root endpoint returned: {data['message']}")


class TestNPCChat:
    """NPC Chat endpoint tests with AI integration"""
    
    def test_elder_theron_chat_neutral(self):
        """Test Elder Theron NPC chat with neutral tone"""
        payload = {
            "npc_id": "elder_theron",
            "player_message": "Hello, Elder",
            "tone": "neutral",
            "reputation": 0
        }
        response = requests.post(f"{BASE_URL}/api/npc/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "npc_id" in data
        assert data["npc_id"] == "elder_theron"
        assert "response" in data
        assert len(data["response"]) > 0
        assert "emotion" in data
        print(f"SUCCESS: Elder Theron responded: {data['response'][:80]}...")
    
    def test_lyra_chat_kind(self):
        """Test Lyra NPC chat with kind tone"""
        payload = {
            "npc_id": "lyra",
            "player_message": "Don't worry, I'll protect you",
            "tone": "kind",
            "reputation": 2
        }
        response = requests.post(f"{BASE_URL}/api/npc/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["npc_id"] == "lyra"
        assert "response" in data
        assert len(data["response"]) > 0
        # Kind tone should give +1 reputation change
        assert data.get("reputation_change") == 1
        print(f"SUCCESS: Lyra responded: {data['response'][:80]}...")
    
    def test_npc_chat_aggressive_tone(self):
        """Test NPC chat with aggressive tone affects reputation"""
        payload = {
            "npc_id": "elder_theron",
            "player_message": "Tell me where Kairen is. Now!",
            "tone": "aggressive",
            "reputation": 0
        }
        response = requests.post(f"{BASE_URL}/api/npc/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Aggressive tone should give -1 reputation change
        assert data.get("reputation_change") == -1
        print(f"SUCCESS: Aggressive tone reputation change: {data['reputation_change']}")
    
    def test_npc_chat_cunning_tone(self):
        """Test NPC chat with cunning tone"""
        payload = {
            "npc_id": "lyra",
            "player_message": "You know more than you're letting on",
            "tone": "cunning",
            "reputation": 0
        }
        response = requests.post(f"{BASE_URL}/api/npc/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Cunning tone should give 0 reputation change
        assert data.get("reputation_change") == 0
        print(f"SUCCESS: Cunning tone response received")


class TestBattleAI:
    """Battle AI enemy action endpoint tests"""
    
    def test_battle_enemy_action_basic(self):
        """Test basic battle enemy action request"""
        payload = {
            "player_action": "moving",
            "player_position": {"x": 5.0, "y": 10.0},
            "enemy_hp": 80,
            "player_hp": 40,
            "environment": {"rain": True, "hazards": True}
        }
        response = requests.post(f"{BASE_URL}/api/battle/enemy-action", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        valid_actions = ["heavy_slash", "thrust", "shield_bash", "dodge", "taunt"]
        assert data["action"] in valid_actions
        print(f"SUCCESS: Battle AI chose action: {data['action']}")
    
    def test_battle_enemy_action_with_qte(self):
        """Test battle action returns QTE sequence for attacks"""
        payload = {
            "player_action": "attacking",
            "player_position": {"x": 8.0, "y": 8.0},
            "enemy_hp": 60,
            "player_hp": 30,
            "environment": {"rain": True, "hazards": False}
        }
        response = requests.post(f"{BASE_URL}/api/battle/enemy-action", json=payload)
        assert response.status_code == 200
        data = response.json()
        # If action is an attack, should have QTE sequence
        if data["action"] in ["heavy_slash", "thrust", "shield_bash"]:
            assert "qte_sequence" in data
            if data["qte_sequence"]:
                valid_dirs = ["up", "down", "left", "right"]
                for dir in data["qte_sequence"]:
                    assert dir in valid_dirs
                print(f"SUCCESS: QTE sequence: {data['qte_sequence']}")
        print(f"SUCCESS: Battle action with dialogue: {data.get('dialogue', 'N/A')[:50]}")
    
    def test_battle_enemy_action_low_hp(self):
        """Test battle AI behavior when enemy HP is low"""
        payload = {
            "player_action": "attacking",
            "player_position": {"x": 10.0, "y": 10.0},
            "enemy_hp": 15,
            "player_hp": 45,
            "environment": {"rain": True, "hazards": True}
        }
        response = requests.post(f"{BASE_URL}/api/battle/enemy-action", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        print(f"SUCCESS: Low HP battle action: {data['action']}")


class TestReputation:
    """Reputation system endpoint tests"""
    
    def test_update_reputation_positive(self):
        """Test updating reputation with positive change"""
        test_player_id = f"test_player_{int(time.time())}"
        payload = {
            "player_id": test_player_id,
            "change": 3,
            "reason": "Helped Elder Theron"
        }
        response = requests.post(f"{BASE_URL}/api/reputation/update", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "reputation" in data
        assert data["reputation"] == 3
        print(f"SUCCESS: Reputation updated to: {data['reputation']}")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/reputation/{test_player_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["reputation"] == 3
        print(f"SUCCESS: GET reputation verified: {get_data['reputation']}")
    
    def test_update_reputation_negative(self):
        """Test updating reputation with negative change"""
        test_player_id = f"test_player_neg_{int(time.time())}"
        payload = {
            "player_id": test_player_id,
            "change": -2,
            "reason": "Threatened Lyra"
        }
        response = requests.post(f"{BASE_URL}/api/reputation/update", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["reputation"] == -2
        print(f"SUCCESS: Negative reputation: {data['reputation']}")
    
    def test_get_reputation_nonexistent(self):
        """Test getting reputation for non-existent player"""
        response = requests.get(f"{BASE_URL}/api/reputation/nonexistent_player_xyz")
        assert response.status_code == 200
        data = response.json()
        assert data["reputation"] == 0
        print(f"SUCCESS: Non-existent player reputation defaults to 0")


class TestGameSaveLoad:
    """Game save/load endpoint tests"""
    
    def test_save_game(self):
        """Test saving game state"""
        test_player_id = f"test_save_{int(time.time())}"
        game_state = {
            "player_hp": 45,
            "player_position": {"x": 10, "y": 12},
            "inventory": ["rock"],
            "equipped_skills": ["flame_dash", "lightning_strike"],
            "equipment": {"weapon": "bronze_blade", "armor": "leather_armor", "accessory": "swift_boots"},
            "reputation": 5,
            "mode": "explore"
        }
        payload = {
            "player_id": test_player_id,
            "game_state": game_state
        }
        response = requests.post(f"{BASE_URL}/api/game/save", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "saved"
        print(f"SUCCESS: Game saved for player: {test_player_id}")
        
        # Verify with load
        load_response = requests.get(f"{BASE_URL}/api/game/load/{test_player_id}")
        assert load_response.status_code == 200
        load_data = load_response.json()
        assert "game_state" in load_data
        assert load_data["game_state"]["player_hp"] == 45
        assert load_data["game_state"]["equipment"]["weapon"] == "bronze_blade"
        print(f"SUCCESS: Game loaded and verified")
    
    def test_load_nonexistent_save(self):
        """Test loading non-existent save returns appropriate response"""
        response = requests.get(f"{BASE_URL}/api/game/load/nonexistent_save_xyz")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "no_save_found"
        print(f"SUCCESS: Non-existent save returns 'no_save_found'")


class TestEdgeCases:
    """Edge case and validation tests"""
    
    def test_npc_chat_missing_fields(self):
        """Test NPC chat with minimal required fields"""
        payload = {
            "npc_id": "elder_theron",
            "player_message": "Hello"
        }
        response = requests.post(f"{BASE_URL}/api/npc/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"SUCCESS: Minimal fields accepted")
    
    def test_battle_action_invalid_position(self):
        """Test battle action with edge position values"""
        payload = {
            "player_action": "moving",
            "player_position": {"x": 0.0, "y": 0.0},
            "enemy_hp": 100,
            "player_hp": 50,
            "environment": {}
        }
        response = requests.post(f"{BASE_URL}/api/battle/enemy-action", json=payload)
        assert response.status_code == 200
        print(f"SUCCESS: Edge position values handled")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
