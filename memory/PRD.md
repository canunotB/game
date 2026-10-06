# Odyssey's Wrath - PRD

## Original Problem Statement
Build an indie RPG demo with Elden Ring-style dark isometric aesthetic, fun fight mechanics, environmental strategy and a basic story. Story inspired by The Odyssey: an 8-year-old protagonist is fated to be killed by boss Kairen (unbeatable, throws the child into a ravine). Features: fast-paced combat (M1 combos, dash, jump, stamina/mana), skills earned through combat mastery, equipment, keybinds, QTE parry/dodge/barrage, Death Recap, scripted loss cutscene, and story continuation (Chapter II) using the 8 enemy species / 8 towns from the user's PDFs.

**User decision (June 2026): NO AI/API features.** All NPC dialogue and Kairen taunts are scripted. Keep all mechanics and graphics.

## Architecture
- **Frontend**: React + HTML5 Canvas (isometric 2.5D, depth sorted) - `src/components/GameWorld.js` (loop), `GameOverlays.js` (HUD/QTE/menu), `lib/renderer.js`, `lib/gameData.js` (maps, enemies, scripts), `App.js` (screen flow)
- **Backend**: FastAPI + MongoDB - only `/api/`, `/api/reputation/*`, `/api/game/save|load` (unused by the game currently). LLM endpoints and `npc_ai.py` REMOVED.
- Debug/test surface: `window.__odyssey` exposes live game state (used by automated tests).

## Core Design Principles
- Kairen is UNBEATABLE (HP floors at 15, regens). Battle ends after 55s or player HP <= 6 -> scripted ravine fall.
- Skills earned through combat mastery (7 skills, unlock conditions in gameData).
- QTE: parry (1 arrow), dodge (2-3), barrage (8-12). Post-QTE pushback + "CATCH!" recovery prompt.
- Explore enemies killable with M1; contact damage is discrete hits (0.5x species dmg, ~1s cooldown, 0.5s i-frames).
- Explore death respawns at map spawn with full HP.

## Screen / Story Flow
Title -> story intro (ESC skips) -> **Hollow Village** (Theron, Lyra, 4 enemies) -> exit "The Ravine Edge" -> Kairen battle -> cutscene -> Death Recap -> Chapter II interlude -> **Ravine Floor** (Orin the Hermit, 3 enemies) -> "Climb to Cliffgate" -> **Cliffgate** (Captain Vael, 3 enemies) -> "Eastern Gate - Timbercross" -> "To Be Continued..." -> play again.

## What's Been Implemented
- Phases 1-3 (earlier sessions): village, battle arena, Kairen phases/attacks, QTE system, combos/dash/jump, skill tree, equipment, keybinds, Death Recap, 8 enemy species with pixel art, upgraded sprites.
- **June 2026 (this session)**
  - Removed all AI: scripted `NPC_SCRIPTS` (reputation-tiered greetings + 4 tone replies), `KAIREN_TAUNTS`; axios removed from the game; backend LLM endpoints deleted.
  - Fixed P0 "battle trigger unreachable": per-axis sliding collision, wider exit zones, glowing exit ring marker + label, zone banner on map load.
  - Fixed QTE bug (refs recreated per render => every press "perfect" and timer resetting per arrow). Grading now perfect <350ms, good <700ms.
  - Explore combat: M1 hits explore/arena enemies (knockback, damage numbers, death). Discrete contact damage. Explore death respawn.
  - Multi-map engine (`MAPS` with parseMap string maps), new tiles STONE(10)/boulder(3), new NPC sprites hermit/guard.
  - Chapter II: Ravine Floor + Cliffgate maps, interlude + final story screens, ESC skip on title story while typing.
  - HUD shows numeric reputation; controls help readable; Kairen lines auto-close without the ENTER hint.
  - Tested end-to-end by testing agent (iteration_5: 100% backend, ~95% frontend, no failures).

## Prioritized Backlog
### P1
- Remaining 6 towns from PDFs (Timbercross next) + crafting + magic paths
- More environmental hazards across the battlefield
- Sound effects / music
### P2
- Loot / XP from explore enemies, player leveling
- Save/load UI using existing backend endpoints
- Multiple battle arenas / second boss
### P3
- Mobile touch controls, sprite-sheet animations, achievements
- Put `window.__odyssey` behind a dev flag before shipping
