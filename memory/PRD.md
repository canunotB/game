# Odyssey's Wrath - PRD

## Original Problem Statement
Build an indie RPG with fun fight mechanics and AI as town NPCs + battle NPC reasoning and speech. Monster battles with quick fights using environmental-based strategy. Environment affects battles: rocks to pick up, trees for cover, rain that slows movement. Inspired by Pokemon Black & White art style with 3D-like feel.

## Architecture
- **Frontend**: React + HTML5 Canvas (2D pixel art rendering with depth sorting)
- **Backend**: FastAPI with OpenAI GPT-5.2 via Emergent LLM Key
- **Database**: MongoDB (NPC memory, game saves)
- **Game Engine**: Custom Canvas2D engine with game loop, entity system, weather, QTE

## User Personas
- Indie RPG fans who enjoy strategic environmental combat
- Players who enjoy AI-driven NPC interactions
- Story-driven gamers (Odyssey-inspired narrative)

## Core Requirements
- Explorable village with AI NPCs (dialogue + memory)
- Environmental combat arena (rocks, trees, mud, rain)
- QTE battle mechanics with telegraphed attacks
- Boss fight with Kairen (stoic knight-guardian)
- Odyssey-inspired story (prophecy, young protagonist)

## What's Been Implemented (Feb 2026)
- **Title Screen**: Cinematic "ODYSSEY'S WRATH" with rain animation
- **Story Intro**: Typewriter-effect narrative (11 lines, Odyssey-themed)
- **Village Exploration**: 30x20 tile map with paths, trees, buildings, cliffs
- **AI NPCs**: Elder Theron + Lyra with LLM-powered dialogue (GPT-5.2)
- **NPC Memory**: MongoDB-backed conversation history
- **Battle Arena**: Open field with rocks (pickable), trees (cover), mud (slow)
- **Boss Fight**: Kairen with 3 attack types, telegraph system, QTE combat
- **QTE System**: Arrow key sequences with Perfect/Good/Miss grading
- **Environmental Strategy**: Pick up & throw rocks, hide behind trees, mud slowdown
- **Weather**: Rain particle system across all scenes
- **HUD**: Player vitality bar, boss HP bar, inventory, controls help
- **Ending**: Scripted loss → ravine fall → "To Be Continued" narrative
- **Backend**: NPC chat API, battle AI API, save/load system

## Prioritized Backlog
### P0 (Critical)
- All core features implemented ✓

### P1 (High)
- More monster encounters beyond Kairen
- Expanded village with more NPCs and quests
- Sound effects and music
- Player leveling/stats system

### P2 (Medium)
- More battle arenas with different environments
- Inventory system (weapons, potions)
- NPC schedules/routines
- Multiplayer elements

### P3 (Low)
- Mobile touch controls
- Save/load UI
- Achievement system
- Sprite sheet animations (replace procedural art)

## Next Tasks
1. Add more monster encounters with varied AI behaviors
2. Expand the village map with more areas to explore
3. Implement sound/music system
4. Add player progression (XP, levels, abilities)
5. Create additional story chapters beyond the demo
