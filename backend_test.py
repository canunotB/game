#!/usr/bin/env python3
"""
Backend API Testing for Odyssey's Wrath RPG Game
Tests NPC chat, battle AI, and game save/load functionality
"""

import requests
import sys
import json
from datetime import datetime

class RPGAPITester:
    def __init__(self, base_url="https://ai-npc-battles.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            else:
                print(f"❌ Unsupported method: {method}")
                return False, {}

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {"raw_response": response.text}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:500]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_npc_chat_elder_theron(self):
        """Test NPC chat with Elder Theron"""
        data = {
            "npc_id": "elder_theron",
            "player_message": "Hello, Elder. What do you know about my fate?",
            "context": {"mode": "explore", "player_hp": 50}
        }
        return self.run_test("NPC Chat - Elder Theron", "POST", "npc/chat", 200, data)

    def test_npc_chat_lyra(self):
        """Test NPC chat with Lyra"""
        data = {
            "npc_id": "lyra",
            "player_message": "Have you seen the warrior?",
            "context": {"mode": "explore", "player_hp": 50}
        }
        return self.run_test("NPC Chat - Lyra", "POST", "npc/chat", 200, data)

    def test_npc_chat_kairen(self):
        """Test NPC chat with Kairen (battle context)"""
        data = {
            "npc_id": "kairen",
            "player_message": "Why do you hunt me?",
            "context": {"mode": "battle", "player_hp": 30}
        }
        return self.run_test("NPC Chat - Kairen", "POST", "npc/chat", 200, data)

    def test_battle_enemy_action(self):
        """Test battle AI enemy action endpoint"""
        data = {
            "player_action": "attacking",
            "player_position": {"x": 5.0, "y": 8.0},
            "enemy_hp": 85,
            "player_hp": 40,
            "environment": {
                "rain": True,
                "objects_near_player": ["rock_small", "tree"]
            }
        }
        return self.run_test("Battle Enemy Action", "POST", "battle/enemy-action", 200, data)

    def test_game_save(self):
        """Test game save functionality"""
        player_id = f"test_player_{datetime.now().strftime('%H%M%S')}"
        data = {
            "player_id": player_id,
            "game_state": {
                "level": 1,
                "position": {"x": 10, "y": 15},
                "hp": 45,
                "inventory": ["rock", "rock"],
                "npcs_talked": ["elder_theron"],
                "battle_progress": {"kairen_hp": 75}
            }
        }
        success, response = self.run_test("Game Save", "POST", "game/save", 200, data)
        if success:
            return success, {"player_id": player_id, **response}
        return success, response

    def test_game_load(self, player_id):
        """Test game load functionality"""
        return self.run_test("Game Load", "GET", f"game/load/{player_id}", 200)

    def test_invalid_npc_chat(self):
        """Test NPC chat with invalid NPC ID"""
        data = {
            "npc_id": "invalid_npc",
            "player_message": "Hello",
            "context": {"mode": "explore", "player_hp": 50}
        }
        return self.run_test("Invalid NPC Chat", "POST", "npc/chat", 200, data)

    def test_malformed_battle_request(self):
        """Test battle endpoint with malformed data"""
        data = {
            "player_action": "invalid_action",
            "player_position": {"x": "invalid", "y": 5.0},
            "enemy_hp": "not_a_number",
            "player_hp": 40
        }
        # This should return 422 for validation error or 200 with fallback
        success, response = self.run_test("Malformed Battle Request", "POST", "battle/enemy-action", 422, data)
        if not success:
            # Try again expecting 200 (if API handles gracefully)
            success, response = self.run_test("Malformed Battle Request (Fallback)", "POST", "battle/enemy-action", 200, data)
        return success, response

def main():
    print("🎮 Starting Odyssey's Wrath Backend API Tests")
    print("=" * 60)
    
    tester = RPGAPITester()
    
    # Test basic connectivity
    print("\n📡 Testing Basic Connectivity...")
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ Cannot connect to backend API. Stopping tests.")
        return 1

    # Test NPC Chat System
    print("\n🗣️ Testing NPC Chat System...")
    tester.test_npc_chat_elder_theron()
    tester.test_npc_chat_lyra()
    tester.test_npc_chat_kairen()
    tester.test_invalid_npc_chat()

    # Test Battle AI System
    print("\n⚔️ Testing Battle AI System...")
    tester.test_battle_enemy_action()
    tester.test_malformed_battle_request()

    # Test Game Save/Load System
    print("\n💾 Testing Game Save/Load System...")
    save_success, save_response = tester.test_game_save()
    if save_success and "player_id" in save_response:
        tester.test_game_load(save_response["player_id"])
    else:
        print("⚠️ Skipping load test due to save failure")

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   • {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"     Error: {failure['error']}")
            elif 'actual' in failure:
                print(f"     Expected: {failure['expected']}, Got: {failure['actual']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())