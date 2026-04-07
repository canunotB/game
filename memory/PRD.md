# Odyssey's Wrath - PRD

## Original Problem Statement
Build an indie RPG demo with Elden Ring-style dark isometric aesthetic, fun fight mechanics, environmental strategy, and AI-powered NPCs. Story inspired by The Odyssey where an 8-year-old protagonist is fated to be killed by boss Kairen. Features: fast-paced Sonic Forces-style combat, combo attacks, dashing with tight i-frames, jumping attacks, skills earned through combat mastery, equipment system, customizable keybinds, QTE dodge with post-dodge recovery + pushback, and a scripted loss cutscene.

## Architecture
- **Frontend**: React + HTML5 Canvas (Isometric 2.5D rendering with depth sorting)
- **Backend**: FastAPI with OpenAI GPT-5.2 via Emergent LLM Key
- **Database**: MongoDB (NPC memory, reputation, game saves)
- **Game Engine**: Custom Canvas2D isometric engine with combo system, skill tree, equipment, QTE + recovery

## Core Design Principles
- **Kairen is UNBEATABLE** — HP floors at 15, regens slowly. Battle always ends with scripted loss.
- **Skills earned, not given** — All 7 skills start locked. Unlock through combat mastery (dashing, hitting, blocking, perfect counters, surviving damage).
- **Kairen attacks = massive visual spectacle** — Blue-white crystalline energy bursts inspired by pixel art reference.
- **Player attacks = subtle** — Thin gold slash lines, understated.
- **QTE dodges push you** — After each dodge, player slides in the direction of the last QTE arrow.

## What's Been Implemented

### Phase 1 (Initial Build)
- Title Screen with rain + story intro
- Isometric village (30x20 tile map) with AI NPCs (Elder Theron, Lyra)
- GPT-5.2 powered NPC dialogue with tone choices + reputation
- Battle arena with environmental objects (rocks, trees, mud, hazards)
- Boss Kairen with 3 attack types, telegraph, QTE system
- Weather, fog, vignette effects
- Ending cutscene (ravine fall)

### Phase 2 (Combat Systems)
- 3-hit M1 combo system
- Jump (Space) with plunge attack
- Dash (Shift) with afterimages
- Stamina/Mana bars
- Menu system (Tab): Equipment + Keybinds

### Phase 3 (Current - Combat Mastery Overhaul)
- **Kairen unbeatable**: HP floors at 15, regens at 1.5/s, player damage reduced
- **QTE fix**: Perfect = 0 dmg + counter stun, Good = 0 dmg (block), Late = 50% dmg, Miss = full dmg
- **QTE pushback**: Player pushed in direction of last QTE arrow after every dodge
- **Skill tree**: 7 skills unlocked through combat mastery conditions:
  - Flame Dash (Dash 4x), Wind Slash (Hit 8x), Earth Shield (Block 2x)
  - Lightning (2 full combos), Shadow Step (2 perfect counters)
  - Divine Wrath (5 perfect counters), Heal (Survive 40 damage)
- **Skill unlock notifications**: "SKILL AWAKENED" popup with animation
- **Dash i-frames**: Very tight 0.08s window
- **Kairen visuals**: Massive blue-white crystalline energy arcs, shards, shockwaves
- **Player visuals**: Subtle thin gold slash lines
- **Post-QTE recovery**: "CATCH!" directional prompt (speed boost on success, stagger on fail)
- **Movement fix**: Window blur clears stuck keys

## Key API Endpoints
- `POST /api/npc/chat` — AI NPC dialogue
- `POST /api/battle/enemy-action` — AI battle decisions
- `POST /api/reputation/update` — Update reputation
- `GET /api/reputation/{player_id}` — Get reputation
- `POST /api/game/save` / `GET /api/game/load/{player_id}`

## Prioritized Backlog
### P1 (High)
- More environmental hazards across battlefield
- Sound effects and music
- Expanded village with more NPCs

### P2 (Medium)
- Multiple battle arenas
- Player leveling/XP system
- Additional story chapters
- NPC schedules/routines

### P3 (Low)
- Mobile touch controls
- Save/load UI
- Sprite sheet animations
- Achievement system
