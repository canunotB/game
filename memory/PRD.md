# Odyssey's Wrath - PRD

## Original Problem Statement
Build an indie RPG demo with Elden Ring-style dark isometric aesthetic, fun fight mechanics, environmental strategy, and AI-powered NPCs. Story inspired by The Odyssey where an 8-year-old protagonist is fated to be killed by boss Kairen. Features: fast-paced Sonic Forces-style combat with M1 combo attacks, dashing, jumping attack, stamina/mana, skills system, dialogue tones with reputation, and a scripted loss cutscene.

## Architecture
- **Frontend**: React + HTML5 Canvas (Isometric 2.5D rendering with depth sorting)
- **Backend**: FastAPI with OpenAI GPT-5.2 via Emergent LLM Key
- **Database**: MongoDB (NPC memory, reputation, game saves)
- **Game Engine**: Custom Canvas2D isometric engine with game loop, entity system, weather, QTE, skills, combo system

## Core Requirements
- Explorable isometric village with AI NPCs (dialogue with tone choices + memory)
- Environmental combat arena (rocks, trees, mud, hazards, rain)
- Fast-paced combo attack system (M1 click, 3-hit chains)
- Jump + plunge attack (Space bar)
- 5 equippable skills (1-5 keys) from pool of 7
- Equipment system (weapon/armor/accessory)
- Customizable keybinds
- QTE battle mechanics with post-QTE recovery prompt ("catch yourself")
- Boss fight with Kairen (stoic knight-guardian)
- Stamina/Mana bars with regen
- Reputation tracking from dialogue choices
- Scripted loss cutscene (ravine fall)

## What's Been Implemented

### Phase 1 (Initial Build)
- Title Screen with rain animation
- Story intro with typewriter effect
- Village exploration (30x20 isometric tile map)
- AI NPCs (Elder Theron + Lyra) with GPT-5.2 dialogue
- NPC Memory via MongoDB
- Battle arena with environmental objects
- Boss fight with Kairen (3 attack types + telegraph)
- QTE dodge system
- Weather (rain particles) + fog + vignette
- Basic HUD + ending cutscene

### Phase 2 (Combat & Systems Overhaul - Current)
- Isometric 2.5D rendering engine
- 3-hit combo attack system (M1 click chains)
- Jump mechanic (Space) with plunge attack bonus damage
- Dash (Shift) with i-frames and afterimages
- Stamina/Mana system with regen
- Skills system: 7 skills (Flame Dash, Lightning, Wind Slash, Shadow Step, Earth Shield, Divine Wrath, Heal), 5 equippable
- Skill visual effects (fire trail, lightning bolt, explosion, heal particles, shield glow, shadow)
- Equipment system: weapons (Wooden Sword / Bronze Blade), armor (Cloth Tunic / Leather Armor), accessories (Swift Boots / Mana Charm)
- Full menu system (Tab): Skills equip/unequip, Equipment cycle, Keybind rebinding
- Post-QTE recovery mechanic ("CATCH!" direction prompt)
- Combo indicator UI
- Skill bar UI (bottom-center, shows cooldowns + mana costs)
- Movement bug fix (clear keys on window blur)
- Tone-based dialogue with reputation tracking
- Configurable keybinds with localStorage persistence
- Equipment stat modifiers (weapon damage/speed, armor defense, accessory bonuses)

## Key API Endpoints
- `POST /api/npc/chat` - AI NPC dialogue with tone/reputation
- `POST /api/battle/enemy-action` - AI battle decisions
- `POST /api/reputation/update` - Update player reputation
- `GET /api/reputation/{player_id}` - Get reputation
- `POST /api/game/save` - Save game state
- `GET /api/game/load/{player_id}` - Load game state

## Prioritized Backlog
### P1 (High)
- More environmental hazards across battlefield
- Sound effects and music
- More monster encounters beyond Kairen
- Expanded village with more NPCs

### P2 (Medium)
- More battle arenas with different environments
- Player leveling/stats/XP system
- NPC schedules/routines
- Additional story chapters

### P3 (Low)
- Mobile touch controls
- Save/load UI
- Sprite sheet animations
- Achievement system
