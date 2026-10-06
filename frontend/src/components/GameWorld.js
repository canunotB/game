import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  MAPS, BATTLE_ARENA, SOLID_TILES, TILES,
  PLAYER_SPEED, KAIREN_SPEED, KAIREN_ATTACKS, KAIREN_PHASES, MAX_STAMINA, MAX_MANA,
  ATTACK_STAMINA, DASH_STAMINA, STAMINA_REGEN, MANA_REGEN,
  NPC_DIALOGUE_OPTIONS, DIALOGUE_TONES, NPC_SCRIPTS, KAIREN_TAUNTS, ARENA_INTRO_LINE,
  ALL_SKILLS, ALL_EQUIPMENT, DEFAULT_EQUIPMENT, DEFAULT_KEYBINDS,
  SKILL_UNLOCK_CONDITIONS, SKILL_UNLOCK_ORDER, DEFAULT_COMBAT_STATS,
  ENEMY_SPECIES, ARENA_ENEMIES,
} from '../lib/gameData';
import {
  toScreen, drawIsoTile, drawIsoTree, drawIsoPlayer, drawIsoKairen, drawIsoNPC,
  drawIsoBattleObj, drawIsoRain, drawFog, drawVignette, drawProjectile,
  drawDamageNumber, drawKairenAttack, drawFadeOverlay,
  drawFallingPlayer, drawSkillEffect,
  drawKairenSwingTelegraph, drawKairenSwingArc, drawEmpoweredAura, drawQTETelegraph,
  drawEnemy, drawEnemyNameTag, drawExitMarker,
} from '../lib/renderer';
import {
  PlayerHUD, BossBar, DialogueBox, QTEOverlay,
  InventoryDisplay, ControlsHelp, DamageFlash, SkillBar, GameMenu, RecoveryPrompt,
  SkillUnlockNotification, ZoneBanner,
} from './GameOverlays';

const GENERIC_OPTIONS = [
  { tone: 'kind', text: "Thank you for helping me." },
  { tone: 'neutral', text: "Where am I? What happened?" },
  { tone: 'aggressive', text: "Where is Kairen?" },
  { tone: 'cunning', text: "What do you want from me?" },
];

function makeExploreEnemies(list) {
  return list.map(e => {
    const spec = ENEMY_SPECIES[e.species];
    return {
      ...e, hp: spec.hp, maxHp: spec.hp, name: spec.name,
      dir: 'down', frame: 0, state: 'patrol',
      patrolTimer: Math.random() * 3, patrolDir: Math.random() * Math.PI * 2,
      aggroRange: 4, alive: true, deathTimer: 0, hitFlash: 0, attackCd: 0,
    };
  });
}

export default function GameWorld({ onEnding, chapter = 'village' }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const mouseRef = useRef({ x: 0, y: 0, clicked: false });
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const keybindsRef = useRef(DEFAULT_KEYBINDS);

  const [playerHp, setPlayerHp] = useState(50);
  const [stamina, setStamina] = useState(MAX_STAMINA);
  const [mana, setMana] = useState(MAX_MANA);
  const [bossHp, setBossHp] = useState(100);
  const [dialogue, setDialogue] = useState(null);
  const [dialogueChoices, setDialogueChoices] = useState(null);
  const [qte, setQte] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [mode, setMode] = useState('explore');
  const [damageFlash, setDamageFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [battleDialogue, setBattleDialogue] = useState(null);
  const [reputation, setReputation] = useState(0);
  const [cutsceneText, setCutsceneText] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState([]);
  const [equippedSkills, setEquippedSkills] = useState([]);
  const [equipment, setEquipment] = useState(() => {
    try { const s = localStorage.getItem('odyssey_equipment'); return s ? JSON.parse(s) : { ...DEFAULT_EQUIPMENT }; } catch { return { ...DEFAULT_EQUIPMENT }; }
  });
  const [keybinds, setKeybinds] = useState(() => {
    try { const s = localStorage.getItem('odyssey_keybinds'); return s ? JSON.parse(s) : { ...DEFAULT_KEYBINDS }; } catch { return { ...DEFAULT_KEYBINDS }; }
  });
  const [skillCooldowns, setSkillCooldowns] = useState({});
  const [recoveryState, setRecoveryState] = useState(null);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [skillNotification, setSkillNotification] = useState(null);
  const [combatStats, setCombatStats] = useState({ ...DEFAULT_COMBAT_STATS });
  const [zoneBanner, setZoneBanner] = useState(null);

  const showZone = useCallback((map) => {
    setZoneBanner({ name: map.name, hint: map.exit.label });
    setTimeout(() => setZoneBanner(null), 3500);
  }, []);

  useEffect(() => { keybindsRef.current = keybinds; }, [keybinds]);
  useEffect(() => { localStorage.setItem('odyssey_equipment', JSON.stringify(equipment)); }, [equipment]);
  useEffect(() => { localStorage.setItem('odyssey_keybinds', JSON.stringify(keybinds)); }, [keybinds]);
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.player.equippedSkills = equippedSkills;
      gameRef.current.player.equipment = equipment;
    }
  }, [equippedSkills, equipment]);

  // ─── CANVAS INIT ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const map = MAPS[chapter];
    const game = {
      mode: 'explore',
      map, activeNpcId: null, transitionTimer: 0,
      player: {
        x: map.spawn.x, y: map.spawn.y, dir: 'down', frame: 0, hp: 50, maxHp: 50,
        speed: PLAYER_SPEED, inventory: [], isAttacking: false, attackTimer: 0,
        attackAngle: 0, isDashing: false, dashTimer: 0, invincible: 0,
        stamina: MAX_STAMINA, mana: MAX_MANA, dashTrail: [],
        comboCount: 0, lastAttackTime: 0,
        isJumping: false, jumpTimer: 0, jumpHeight: 0, jumpPhase: 'none',
        isInvisible: false, invisibleTimer: 0,
        hasShield: false, staggerTimer: 0,
        skillCooldowns: {}, equippedSkills: [],
        equipment: { ...DEFAULT_EQUIPMENT },
        pushVx: 0, pushVy: 0, pushTimer: 0,
      },
      camera: { x: 0, y: 0 },
      npcs: map.npcs.map(n => ({ ...n })),
      battle: {
        kairen: {
          x: BATTLE_ARENA.kairenSpawn.x, y: BATTLE_ARENA.kairenSpawn.y,
          hp: 100, maxHp: 100, dir: 'down', frame: 0, state: 'idle',
          attackTimer: 0, recoverTimer: 0, telegraphTimer: 0,
          currentAttack: null, aiCooldown: 2, stunTimer: 0, qteSequence: null,
          attackProgress: 0,
          // New: real-time swing
          swingAngle: 0, swingTimer: 0,
          // New: empowered state (from failed parries)
          empowered: false, empoweredTimer: 0,
          // New: phase tracking
          phaseUnlocked: 1, lowestHp: 100,
        },
        objects: BATTLE_ARENA.objects.map(o => ({ ...o, pickedUp: false })),
        projectiles: [], damageNumbers: [], skillEffects: [],
        timer: 0, finishTriggered: false,
      },
      rain: { particles: [] },
      cutscene: { active: false, phase: 0, timer: 0, fadeAlpha: 0, fallY: 0, fallScale: 1 },
      recovery: { active: false, direction: null, timer: 0 },
      combatStats: { ...DEFAULT_COMBAT_STATS },
      unlockedSkills: [],
      lastQteSequence: null,
      dialogueActive: false, qteActive: false, frameCount: 0, time: 0, reputation: 0,
      menuOpen: false,
      // Enemies in the current explore map
      villageEnemies: makeExploreEnemies(map.enemies),
      arenaEnemies: [],
    };
    gameRef.current = game;
    window.__odyssey = game;
    showZone(map);
    for (let i = 0; i < 120; i++) {
      game.rain.particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 350 + Math.random() * 250, length: 10 + Math.random() * 14 });
    }
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animFrameRef.current); };
  }, [chapter, showZone]);

  // ─── KEYBOARD ────────────────────────────────────────────
  useEffect(() => {
    const normalize = k => k.length === 1 ? k.toLowerCase() : k.toLowerCase();
    const down = e => {
      const k = normalize(e.key);
      keysRef.current[k] = true;
      if (e.key === ' ' || e.key === 'Tab') e.preventDefault();
      if (k === (keybindsRef.current.menu || 'tab')) {
        e.preventDefault();
        setMenuOpen(prev => { const next = !prev; if (gameRef.current) gameRef.current.menuOpen = next; return next; });
      }
    };
    const up = e => { keysRef.current[normalize(e.key)] = false; };
    const blur = () => { keysRef.current = {}; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  // ─── MOUSE ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = e => { const r = canvas.getBoundingClientRect(); mouseRef.current.x = e.clientX - r.left; mouseRef.current.y = e.clientY - r.top; };
    const down = e => { if (e.button === 0) mouseRef.current.clicked = true; };
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mousedown', down);
    return () => { canvas.removeEventListener('mousemove', move); canvas.removeEventListener('mousedown', down); };
  }, []);

  // ─── DIALOGUE (scripted) ─────────────────────────────────
  const handleDialogue = useCallback((npcId, npcName) => {
    const game = gameRef.current; if (game.dialogueActive) return;
    game.dialogueActive = true; game.activeNpcId = npcId;
    const script = NPC_SCRIPTS[npcId];
    const rep = game.reputation;
    const tier = rep <= -2 ? 'low' : rep >= 2 ? 'high' : 'mid';
    setDialogue({ speaker: npcName, text: script?.greeting?.[tier] || '...', typing: false });
    setDialogueChoices(NPC_DIALOGUE_OPTIONS[npcId] || GENERIC_OPTIONS);
  }, []);
  const handleDialogueChoice = useCallback((choice) => {
    const game = gameRef.current;
    const script = NPC_SCRIPTS[game.activeNpcId];
    setDialogueChoices(null);
    const repChange = DIALOGUE_TONES[choice.tone]?.repChange || 0;
    game.reputation += repChange; setReputation(game.reputation);
    setDialogue(prev => ({ ...prev, text: script?.responses?.[choice.tone] || 'The words hang in the air...', typing: false }));
  }, []);
  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Enter' && dialogue && !dialogue.typing && !dialogueChoices) {
        setDialogue(null); setDialogueChoices(null);
        if (gameRef.current) gameRef.current.dialogueActive = false;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialogue, dialogueChoices]);

  // ─── SKILL UNLOCK ────────────────────────────────────────
  const checkSkillUnlocks = useCallback((stats, currentUnlocked) => {
    const newUnlocks = [];
    for (const skillId of SKILL_UNLOCK_ORDER) {
      if (currentUnlocked.includes(skillId)) continue;
      const cond = SKILL_UNLOCK_CONDITIONS[skillId];
      if (cond && stats[cond.stat] >= cond.threshold) newUnlocks.push(skillId);
    }
    return newUnlocks;
  }, []);
  const triggerSkillUnlock = useCallback((skillId) => {
    const skill = ALL_SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    setSkillNotification({ skill });
    setTimeout(() => setSkillNotification(null), 2500);
    setUnlockedSkills(prev => { const next = [...prev, skillId]; if (gameRef.current) gameRef.current.unlockedSkills = next; return next; });
    setEquippedSkills(prev => { if (prev.length < 5) { const next = [...prev, skillId]; if (gameRef.current) gameRef.current.player.equippedSkills = next; return next; } return prev; });
  }, []);

  const doUnlockCheck = useCallback((game) => {
    const newUnlocks = checkSkillUnlocks(game.combatStats, game.unlockedSkills);
    for (const sid of newUnlocks) triggerSkillUnlock(sid);
    setCombatStats({ ...game.combatStats });
  }, [checkSkillUnlocks, triggerSkillUnlock]);

  // ─── QTE COMPLETE (PARRY / DODGE / BARRAGE) ──────────────
  const handleQTEComplete = useCallback((result, missedCount) => {
    const game = gameRef.current; if (!game) return;
    game.qteActive = false; setQte(null);
    const k = game.battle.kairen, p = game.player;
    const atk = KAIREN_ATTACKS[k.currentAttack] || KAIREN_ATTACKS.heavy_slash;

    if (atk.type === 'parry') {
      // ── PARRY: 1 arrow ──
      game.combatStats.parryAttempts++;
      if (result === 'perfect') {
        // Perfect parry -> counter stun + damage to Kairen
        k.state = 'stunned'; k.stunTimer = 2.5;
        k.hp = Math.max(15, k.hp - 15); setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg: 15, x: k.x, y: k.y, age: 0 });
        game.combatStats.perfectDodges++; game.combatStats.parrySuccess++; game.combatStats.damageDealt += 15;
      } else if (result === 'good') {
        // Good parry -> brief stun, no damage to either
        k.state = 'stunned'; k.stunTimer = 1.0;
        game.combatStats.goodBlocks++; game.combatStats.parrySuccess++;
      } else {
        // FAILED PARRY -> Kairen gets EMPOWERED (advantage)
        k.empowered = true; k.empoweredTimer = 4.0;
        const dmg = Math.floor(atk.damage * 0.4);
        if (p.hasShield) { p.hasShield = false; }
        else { p.hp = Math.max(0, p.hp - dmg); game.combatStats.damageTaken += dmg; setPlayerHp(p.hp); triggerDmg(); }
        setBattleDialogue({ speaker: 'Kairen', text: 'Too slow.' });
        setTimeout(() => setBattleDialogue(null), 1500);
      }
    } else if (atk.type === 'dodge') {
      // ── DODGE: 2-3 arrows ──
      game.combatStats.dodgeAttempts++;
      if (result === 'perfect') {
        // Perfect dodge -> brief Kairen stun
        k.state = 'stunned'; k.stunTimer = 1.5;
        k.hp = Math.max(15, k.hp - 8); setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg: 8, x: k.x, y: k.y, age: 0 });
        game.combatStats.perfectDodges++; game.combatStats.dodgeSuccess++; game.combatStats.damageDealt += 8;
      } else if (result === 'good') {
        // Good dodge -> no damage
        game.combatStats.goodBlocks++; game.combatStats.dodgeSuccess++;
      } else {
        // FAILED DODGE -> take FULL damage
        if (p.hasShield) { p.hasShield = false; }
        else { p.hp = Math.max(0, p.hp - atk.damage); game.combatStats.damageTaken += atk.damage; setPlayerHp(p.hp); triggerDmg(); }
      }
    } else if (atk.type === 'barrage') {
      // ── BARRAGE: 8-12 arrows, damage proportional to misses ──
      game.combatStats.barrageAttempts++;
      const totalArrows = atk.qteLength;
      const missed = missedCount || 0;
      game.combatStats.barrageArrowsHit += (totalArrows - missed);
      if (missed === 0) {
        // Perfect barrage survive -> massive stun
        k.state = 'stunned'; k.stunTimer = 3.0;
        k.hp = Math.max(15, k.hp - 20); setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg: 20, x: k.x, y: k.y, age: 0 });
        game.combatStats.perfectDodges++; game.combatStats.dodgeSuccess++; game.combatStats.damageDealt += 20;
      } else {
        // Partial: damage = baseDamage * (missed / total)
        const dmg = Math.max(1, Math.floor(atk.damage * (missed / totalArrows)));
        if (p.hasShield && missed <= 2) { p.hasShield = false; }
        else { p.hp = Math.max(0, p.hp - dmg); game.combatStats.damageTaken += dmg; setPlayerHp(p.hp); triggerDmg(); }
        if (missed <= 2) { game.combatStats.goodBlocks++; game.combatStats.dodgeSuccess++; }
      }
    }

    // Pushback in direction of last QTE arrow
    const seq = game.lastQteSequence;
    if (seq && seq.length > 0) {
      const lastDir = seq[seq.length - 1];
      const pushMap = { up: { dx: -1, dy: -1 }, down: { dx: 1, dy: 1 }, left: { dx: -1, dy: 1 }, right: { dx: 1, dy: -1 } };
      const push = pushMap[lastDir] || { dx: 0, dy: 0 };
      p.pushVx = push.dx * 4.0; p.pushVy = push.dy * 4.0; p.pushTimer = 0.35;
    }

    k.currentAttack = null; k.attackProgress = 0;
    k.state = k.state === 'stunned' ? 'stunned' : 'recovering';
    k.recoverTimer = k.state === 'stunned' ? 0 : atk.recovery;

    // Recovery prompt
    const dirs = ['up', 'down', 'left', 'right'];
    game.recovery = { active: true, direction: dirs[Math.floor(Math.random() * 4)], timer: 1.0 };
    setRecoveryState({ direction: game.recovery.direction });

    doUnlockCheck(game);
  }, [doUnlockCheck]);

  const triggerDmg = useCallback(() => {
    setDamageFlash(true); setScreenShake(true);
    setTimeout(() => setDamageFlash(false), 300);
    setTimeout(() => setScreenShake(false), 200);
  }, []);

  const kairenTaunt = useCallback(() => {
    if (Math.random() > 0.35) return;
    const line = KAIREN_TAUNTS[Math.floor(Math.random() * KAIREN_TAUNTS.length)];
    setBattleDialogue({ speaker: 'Kairen', text: line });
    setTimeout(() => setBattleDialogue(null), 2000);
  }, []);

  function getEquipStats(equip) {
    const w = ALL_EQUIPMENT.weapons.find(i => i.id === equip.weapon) || ALL_EQUIPMENT.weapons[0];
    const a = ALL_EQUIPMENT.armor.find(i => i.id === equip.armor) || ALL_EQUIPMENT.armor[0];
    const acc = ALL_EQUIPMENT.accessories.find(i => i.id === equip.accessory) || ALL_EQUIPMENT.accessories[0];
    return { weaponDmg: w.damage, weaponSpeed: w.speed, defense: a.defense, speedBonus: acc.speedBonus || 0, manaBonus: acc.manaBonus || 0 };
  }

  // ─── GAME LOOP ──────────────────────────────────────────
  useEffect(() => {
    const loop = (ts) => {
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = ts;
      const game = gameRef.current, canvas = canvasRef.current;
      if (!game || !canvas) { animFrameRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      game.time += dt; game.frameCount++;

      if (!game.menuOpen) {
        if (game.cutscene.active) updateCutscene(game, dt);
        else if (game.transitionTimer > 0) updateTransition(game, dt);
        else if (!game.dialogueActive && !game.qteActive) {
          if (game.recovery.active) updateRecovery(game, dt);
          else {
            updatePlayer(game, dt);
            if (game.mode === 'explore') updateExplore(game, dt);
            else updateBattle(game, dt);
          }
        }
      }
      updateRain(game, dt, W, H);
      updateCamera(game, W, H);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#07090F'; ctx.fillRect(0, 0, W, H);
      if (game.mode === 'explore') renderExplore(ctx, game, W, H);
      else renderBattle(ctx, game, W, H);
      drawIsoRain(ctx, game.rain.particles, W, H);
      drawFog(ctx, W, H, game.time);
      drawVignette(ctx, W, H);
      if (game.cutscene.active) renderCutscene(ctx, game, W, H);
      if (game.transitionTimer > 0) drawFadeOverlay(ctx, W, H, Math.min(1, Math.sin((1 - game.transitionTimer / 1.6) * Math.PI) * 1.4));

      setSkillCooldowns({ ...game.player.skillCooldowns });
      setMana(Math.floor(game.player.mana));
      setComboDisplay(game.player.comboCount);
      mouseRef.current.clicked = false;
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [handleDialogue, handleQTEComplete, kairenTaunt, onEnding, triggerDmg, doUnlockCheck, showZone]);

  // ─── MAP TRANSITION ──────────────────────────────────────
  function loadMap(game, mapId) {
    const map = MAPS[mapId];
    game.map = map;
    game.npcs = map.npcs.map(n => ({ ...n }));
    game.villageEnemies = makeExploreEnemies(map.enemies);
    game.player.x = map.spawn.x; game.player.y = map.spawn.y;
    game.player.hp = game.player.maxHp; setPlayerHp(game.player.maxHp);
    game.battle.damageNumbers = [];
    showZone(map);
  }
  function updateTransition(game, dt) {
    game.transitionTimer -= dt;
    if (game.pendingMap && game.transitionTimer < 0.8) { loadMap(game, game.pendingMap); game.pendingMap = null; }
    if (game.transitionTimer <= 0) { game.transitionTimer = 0; setCutsceneText(null); }
  }

  // ─── RECOVERY ────────────────────────────────────────────
  function updateRecovery(game, dt) {
    const rec = game.recovery, keys = keysRef.current, kb = keybindsRef.current;
    rec.timer -= dt;
    const dirMap = { up: kb.moveUp, down: kb.moveDown, left: kb.moveLeft, right: kb.moveRight };
    if (keys[dirMap[rec.direction]]) {
      rec.active = false; setRecoveryState(null);
      game.player.speed = PLAYER_SPEED * 1.4;
      setTimeout(() => { if (gameRef.current) gameRef.current.player.speed = PLAYER_SPEED + getEquipStats(game.player.equipment).speedBonus; }, 600);
      return;
    }
    if (rec.timer <= 0) { rec.active = false; setRecoveryState(null); game.player.staggerTimer = 0.5; }
  }

  // ─── PLAYER UPDATE ──────────────────────────────────────
  function updatePlayer(game, dt) {
    const p = game.player, keys = keysRef.current, mouse = mouseRef.current, kb = keybindsRef.current;
    const stats = getEquipStats(p.equipment);
    if (p.staggerTimer > 0) { p.staggerTimer -= dt; return; }
    if (p.isInvisible) { p.invisibleTimer -= dt; if (p.invisibleTimer <= 0) p.isInvisible = false; }

    // Pushback
    if (p.pushTimer > 0) {
      p.pushTimer -= dt;
      const decay = Math.max(0, p.pushTimer / 0.35);
      p.x = Math.max(0.5, Math.min(BATTLE_ARENA.width - 0.5, p.x + p.pushVx * decay * dt));
      p.y = Math.max(0.5, Math.min(BATTLE_ARENA.height - 0.5, p.y + p.pushVy * decay * dt));
    }

    let dx = 0, dy = 0;
    if (keys[kb.moveUp]) { dx -= 1; dy -= 1; }
    if (keys[kb.moveDown]) { dx += 1; dy += 1; }
    if (keys[kb.moveLeft]) { dx -= 1; dy += 1; }
    if (keys[kb.moveRight]) { dx += 1; dy -= 1; }
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }
    if (dx !== 0 || dy !== 0) {
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
      else p.dir = dy > 0 ? 'down' : 'up';
    }

    let speed = p.speed + stats.speedBonus;
    if (game.mode === 'battle') {
      for (const obj of game.battle.objects) {
        if (obj.type === 'mud' && Math.hypot(p.x - obj.x, p.y - obj.y) < (obj.radius || 1.5)) { speed *= 0.45; break; }
        if (obj.type === 'hazard' && Math.hypot(p.x - obj.x, p.y - obj.y) < (obj.radius || 1)) {
          if (p.invincible <= 0 && !p.hasShield) { p.hp = Math.max(0, p.hp - 3 * dt); setPlayerHp(Math.ceil(p.hp)); }
        }
      }
    }

    // Dash
    if (keys[kb.dash] && !p.isDashing && p.stamina >= DASH_STAMINA && (dx !== 0 || dy !== 0)) {
      p.isDashing = true; p.dashTimer = 0.1; p.stamina -= DASH_STAMINA;
      p.invincible = 0.08;
      p.dashTrail = [{ x: p.x, y: p.y, alpha: 0.5 }];
      keys[kb.dash] = false;
      if (game.mode === 'battle') { game.combatStats.dashCount++; doUnlockCheck(game); }
    }
    if (p.isDashing) {
      p.dashTimer -= dt; speed *= 4.0;
      p.dashTrail.push({ x: p.x, y: p.y, alpha: p.dashTimer / 0.1 * 0.4 });
      if (p.dashTrail.length > 4) p.dashTrail.shift();
      if (p.dashTimer <= 0) { p.isDashing = false; p.dashTrail = []; }
    }
    if (p.invincible > 0) p.invincible -= dt;

    // Jump
    if (keys[kb.jump] && !p.isJumping) {
      p.isJumping = true; p.jumpPhase = 'rising'; p.jumpTimer = 0; keys[kb.jump] = false;
    }
    if (p.isJumping) {
      p.jumpTimer += dt;
      if (p.jumpPhase === 'rising') { p.jumpHeight = Math.min(44, p.jumpTimer * 180); if (p.jumpTimer > 0.24) { p.jumpPhase = 'falling'; p.jumpTimer = 0; } }
      else { p.jumpHeight = Math.max(0, 44 - p.jumpTimer * 180); if (p.jumpHeight <= 0) { p.isJumping = false; p.jumpPhase = 'none'; p.jumpHeight = 0; } }
      speed *= 1.2;
    }

    const nx = p.x + dx * speed * dt, ny = p.y + dy * speed * dt;
    if (game.mode === 'explore') {
      const walkable = (wx, wy) => {
        const tx = Math.floor(wx), ty = Math.floor(wy), m = game.map;
        return tx >= 0 && tx < m.width && ty >= 0 && ty < m.height && !SOLID_TILES.includes(m.tiles[ty]?.[tx]);
      };
      // Per-axis collision so the player slides along walls instead of sticking
      if (walkable(nx, p.y)) p.x = nx;
      if (walkable(p.x, ny)) p.y = ny;
    } else {
      if (nx > 0.5 && nx < BATTLE_ARENA.width - 0.5) p.x = nx;
      if (ny > 0.5 && ny < BATTLE_ARENA.height - 0.5) p.y = ny;
    }

    // Combo attacks (work in both explore and battle)
    if (mouse.clicked && !p.isAttacking && p.stamina >= ATTACK_STAMINA * stats.weaponSpeed) {
      const timeSinceLast = game.time - p.lastAttackTime;
      p.comboCount = (timeSinceLast < 0.45 && p.comboCount < 3) ? p.comboCount + 1 : 1;
      p.lastAttackTime = game.time;
      p.isAttacking = true;
      p.attackTimer = Math.max(0.06, 0.12 * stats.weaponSpeed - (p.comboCount - 1) * 0.015);
      p.stamina -= ATTACK_STAMINA * stats.weaponSpeed * (1 - (p.comboCount - 1) * 0.08);
      const ps = toScreen(p.x, p.y, game.camera.x, game.camera.y);
      p.attackAngle = Math.atan2(mouse.y - ps.y + 10, mouse.x - ps.x);
      let comboDmg = Math.floor(stats.weaponDmg * (1 + (p.comboCount - 1) * 0.2));
      if (p.isJumping) comboDmg = Math.floor(comboDmg * 1.3);
      if (game.mode === 'battle') {
        const k = game.battle.kairen, dist = Math.hypot(p.x - k.x, p.y - k.y);
        if (dist < (p.isJumping ? 3.0 : 2.5)) {
          let dmg = k.state === 'stunned' ? Math.floor(stats.weaponDmg * 1.5) : Math.max(2, Math.floor(stats.weaponDmg * 0.5));
          dmg = Math.floor(dmg * (1 + (p.comboCount - 1) * 0.2));
          if (p.isJumping) dmg = Math.floor(dmg * 1.3);
          k.hp = Math.max(15, k.hp - dmg); setBossHp(k.hp);
          game.battle.damageNumbers.push({ dmg, x: k.x + (Math.random() - 0.5), y: k.y + (Math.random() - 0.5), age: 0 });
          if (p.isJumping && p.jumpPhase === 'rising') { p.jumpPhase = 'falling'; p.jumpTimer = 0.1; }
          game.combatStats.hitsLanded++; game.combatStats.damageDealt += dmg;
          if (p.comboCount === 3) game.combatStats.fullCombos++;
          doUnlockCheck(game);
        }
        hitEnemies(game, game.arenaEnemies, comboDmg);
      } else {
        hitEnemies(game, game.villageEnemies, comboDmg);
      }
    }
    if (p.isAttacking) { p.attackTimer -= dt; if (p.attackTimer <= 0) p.isAttacking = false; }
    if (game.time - p.lastAttackTime > 0.6) p.comboCount = 0;

    // Skills
    if (game.mode === 'battle') {
      for (let i = 0; i < 5; i++) {
        const sk = kb[`skill${i + 1}`];
        if (keys[sk]) {
          keys[sk] = false;
          const skillId = p.equippedSkills[i];
          if (!skillId || !game.unlockedSkills.includes(skillId)) continue;
          const skill = ALL_SKILLS.find(s => s.id === skillId);
          if (!skill || (p.skillCooldowns[skillId] || 0) > 0 || p.mana < skill.manaCost) continue;
          p.mana -= skill.manaCost; p.skillCooldowns[skillId] = skill.cooldown;
          applySkill(game, skill, mouse);
        }
      }
      for (const id in p.skillCooldowns) { if (p.skillCooldowns[id] > 0) p.skillCooldowns[id] = Math.max(0, p.skillCooldowns[id] - dt); }
    }

    if (!p.isAttacking && !p.isDashing) p.stamina = Math.min(MAX_STAMINA, p.stamina + STAMINA_REGEN * dt);
    setStamina(Math.floor(p.stamina));
    if (game.mode === 'battle') p.mana = Math.min(MAX_MANA + (getEquipStats(p.equipment).manaBonus || 0), p.mana + MANA_REGEN * dt);
    if (dx !== 0 || dy !== 0) { if (game.frameCount % 6 === 0) p.frame = (p.frame + 1) % 4; }
  }

  function applySkill(game, skill, mouse) {
    const p = game.player, k = game.battle.kairen;
    const angle = Math.atan2(mouse.y - toScreen(p.x, p.y, game.camera.x, game.camera.y).y, mouse.x - toScreen(p.x, p.y, game.camera.x, game.camera.y).x);
    switch (skill.id) {
      case 'flame_dash': { p.isDashing = true; p.dashTimer = 0.2; p.invincible = 0.25; const d = Math.hypot(p.x - k.x, p.y - k.y); if (d < 3) { k.hp = Math.max(15, k.hp - skill.damage); setBossHp(k.hp); game.battle.damageNumbers.push({ dmg: skill.damage, x: k.x, y: k.y, age: 0 }); } game.battle.skillEffects.push({ type: 'flame_trail', x: p.x, y: p.y, timer: 0.5, duration: 0.5, color: skill.color }); break; }
      case 'lightning_strike': { k.hp = Math.max(15, k.hp - skill.damage); setBossHp(k.hp); game.battle.damageNumbers.push({ dmg: skill.damage, x: k.x, y: k.y, age: 0 }); game.battle.skillEffects.push({ type: 'lightning', x: k.x, y: k.y, timer: 0.6, duration: 0.6, color: skill.color }); break; }
      case 'wind_slash': { game.battle.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 14, vy: Math.sin(angle) * 14, life: 1.0, damage: skill.damage, isSkill: true, color: skill.color }); break; }
      case 'shadow_step': { p.isInvisible = true; p.invisibleTimer = 1.2; p.invincible = 1.2; game.battle.skillEffects.push({ type: 'shadow', x: p.x, y: p.y, timer: 0.4, duration: 0.4, color: skill.color }); break; }
      case 'earth_shield': { p.hasShield = true; game.battle.skillEffects.push({ type: 'shield', x: p.x, y: p.y, timer: 0.6, duration: 0.6, color: skill.color }); break; }
      case 'divine_wrath': { const d = Math.hypot(p.x - k.x, p.y - k.y); if (d < 4) { k.hp = Math.max(15, k.hp - skill.damage); setBossHp(k.hp); game.battle.damageNumbers.push({ dmg: skill.damage, x: k.x, y: k.y, age: 0 }); } game.battle.skillEffects.push({ type: 'explosion', x: p.x, y: p.y, timer: 0.8, duration: 0.8, color: skill.color, radius: 3 }); break; }
      case 'healing_light': { p.hp = Math.min(p.maxHp, p.hp + (skill.healAmount || 15)); setPlayerHp(Math.ceil(p.hp)); game.battle.skillEffects.push({ type: 'heal', x: p.x, y: p.y, timer: 0.6, duration: 0.6, color: skill.color }); break; }
      default: break;
    }
  }

  function hitEnemies(game, list, dmg) {
    const p = game.player;
    for (const e of list) {
      if (!e.alive) continue;
      if (Math.hypot(p.x - e.x, p.y - e.y) > 2.4) continue;
      e.hp -= dmg; e.hitFlash = 0.15;
      game.battle.damageNumbers.push({ dmg, x: e.x + (Math.random() - 0.5) * 0.5, y: e.y, age: 0 });
      // Knock the enemy back slightly
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      e.x += Math.cos(a) * 0.6; e.y += Math.sin(a) * 0.6;
      if (e.hp <= 0) { e.alive = false; e.deathTimer = 1; }
    }
  }

  function updateExplore(game, dt) {
    const p = game.player, keys = keysRef.current, kb = keybindsRef.current, exit = game.map.exit;
    let nearNPC = null;
    for (const npc of game.npcs) { if (Math.hypot(p.x - npc.x, p.y - npc.y) < 2) { nearNPC = npc; break; } }
    if (nearNPC && keys[kb.interact]) { keys[kb.interact] = false; handleDialogue(nearNPC.id, nearNPC.name); }
    game.battle.damageNumbers = game.battle.damageNumbers.filter(d => { d.age += dt; return d.age < 1; });

    // Collapsed in explore -> wake up at the map's spawn point
    if (p.hp <= 0) {
      p.x = game.map.spawn.x; p.y = game.map.spawn.y;
      p.hp = p.maxHp; setPlayerHp(p.maxHp); p.invincible = 1.5;
      for (const e of game.villageEnemies) { if (e.alive) e.state = 'patrol'; }
      setCutsceneText('You collapsed... and woke where you started.');
      setTimeout(() => setCutsceneText(null), 2500);
    }

    if (p.x >= exit.minX && p.x <= exit.maxX && p.y >= exit.minY && p.y <= exit.maxY) {
      if (exit.type === 'battle') startBattle(game);
      else if (exit.type === 'map') {
        game.transitionTimer = 1.6; game.pendingMap = exit.next;
        setCutsceneText(exit.label);
      } else if (exit.type === 'ending') {
        game.transitionTimer = 99;
        onEnding(null);
      }
    }
    updateVillageEnemies(game, dt);
  }

  function startBattle(game) {
    const p = game.player;
    game.mode = 'battle'; p.x = BATTLE_ARENA.playerSpawn.x; p.y = BATTLE_ARENA.playerSpawn.y;
    p.hp = p.maxHp; p.stamina = MAX_STAMINA; p.mana = MAX_MANA;
    game.combatStats = { ...DEFAULT_COMBAT_STATS }; game.unlockedSkills = [];
    setUnlockedSkills([]); setEquippedSkills([]); setCombatStats({ ...DEFAULT_COMBAT_STATS });
    const k = game.battle.kairen; k.hp = 100; k.phaseUnlocked = 1; k.lowestHp = 100; k.empowered = false;
    game.battle.damageNumbers = [];
    // Spawn arena enemies
    game.arenaEnemies = ARENA_ENEMIES.map(e => {
      const spec = ENEMY_SPECIES[e.species];
      return { ...e, hp: spec.hp, maxHp: spec.hp, name: spec.name, dir: 'down', frame: 0, state: 'idle', alive: false, spawnCountdown: e.spawnTimer, deathTimer: 0, hitFlash: 0, attackCd: 0 };
    });
    setMode('battle'); setPlayerHp(p.maxHp); setBossHp(100);
    setBattleDialogue({ speaker: 'Kairen', text: ARENA_INTRO_LINE });
    setTimeout(() => setBattleDialogue(null), 3500);
  }

  // ─── BATTLE UPDATE (with real-time swings + phases) ──────
  function updateBattle(game, dt) {
    const p = game.player, k = game.battle.kairen, keys = keysRef.current, kb = keybindsRef.current;
    game.battle.timer += dt;

    // Kairen HP regen + floor (UNBEATABLE)
    k.hp = Math.min(k.maxHp, k.hp + 1.5 * dt);
    k.hp = Math.max(15, k.hp); setBossHp(Math.ceil(k.hp));

    // Track lowest HP for phase unlocks
    k.lowestHp = Math.min(k.lowestHp, k.hp);
    k.phaseUnlocked = Math.max(k.phaseUnlocked, k.hp <= 30 ? 3 : k.hp <= 50 ? 2 : 1);
    const phase = KAIREN_PHASES[k.phaseUnlocked];
    const kSpeed = KAIREN_SPEED * phase.speedMult * (k.empowered ? 1.3 : 1);

    // Empowered timer
    if (k.empowered) { k.empoweredTimer -= dt; if (k.empoweredTimer <= 0) k.empowered = false; }

    // Pick up / throw rocks
    if (keys[kb.interact]) {
      keys[kb.interact] = false;
      for (const obj of game.battle.objects) {
        if (obj.type === 'rock_small' && !obj.pickedUp && Math.hypot(p.x - obj.x, p.y - obj.y) < 1.5) {
          obj.pickedUp = true; p.inventory.push('rock'); setInventory([...p.inventory]); break;
        }
      }
    }
    if (keys[kb.throw] && p.inventory.includes('rock')) {
      keys[kb.throw] = false;
      p.inventory.splice(p.inventory.indexOf('rock'), 1); setInventory([...p.inventory]);
      const a = Math.atan2(k.y - p.y, k.x - p.x);
      game.battle.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, life: 1.5 });
    }

    // Projectiles
    game.battle.projectiles = game.battle.projectiles.filter(proj => {
      proj.x += proj.vx * dt; proj.y += proj.vy * dt; proj.life -= dt;
      if (Math.hypot(proj.x - k.x, proj.y - k.y) < 1.5) {
        const dmg = proj.damage || 5;
        k.hp = Math.max(15, k.hp - dmg); setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg, x: k.x, y: k.y, age: 0 }); return false;
      }
      return proj.life > 0;
    });
    game.battle.damageNumbers = game.battle.damageNumbers.filter(d => { d.age += dt; return d.age < 1; });
    game.battle.skillEffects = game.battle.skillEffects.filter(e => { e.timer -= dt; return e.timer > 0; });

    // ─── KAIREN AI STATE MACHINE ────────────────
    const dist = Math.hypot(p.x - k.x, p.y - k.y);

    if (k.state === 'stunned') {
      k.stunTimer -= dt; if (k.stunTimer <= 0) k.state = 'idle';
    } else if (k.state === 'recovering') {
      k.recoverTimer -= dt; if (k.recoverTimer <= 0) k.state = 'idle';
    } else if (k.state === 'swing_telegraph') {
      // Real-time swing wind-up (danger zone on ground)
      k.swingTimer -= dt;
      if (k.swingTimer <= 0) { k.state = 'swinging'; k.swingTimer = 0.15; }
    } else if (k.state === 'swinging') {
      // Real-time swing — check if player is in the arc
      k.swingTimer -= dt;
      const pa = Math.atan2(p.y - k.y, p.x - k.x);
      let angleDiff = Math.abs(pa - k.swingAngle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      if (dist < 3 && angleDiff < Math.PI / 3 && p.invincible <= 0 && !p.hasShield && !p.isJumping) {
        const swingDmg = k.empowered ? 8 : 5;
        p.hp = Math.max(0, p.hp - swingDmg);
        game.combatStats.damageTaken += swingDmg;
        setPlayerHp(Math.ceil(p.hp));
        triggerDmg();
      }
      if (k.swingTimer <= 0) { k.state = 'recovering'; k.recoverTimer = 0.35; }
    } else if (k.state === 'telegraph') {
      // QTE attack telegraph
      k.telegraphTimer -= dt;
      if (k.telegraphTimer <= 0) {
        const atk = KAIREN_ATTACKS[k.currentAttack] || KAIREN_ATTACKS.heavy_slash;
        if (dist < atk.range + 1.5 && !p.isInvisible) {
          game.qteActive = true;
          const dirs = ['up', 'down', 'left', 'right'];
          const seq = k.qteSequence || Array.from({ length: atk.qteLength }, () => dirs[Math.floor(Math.random() * 4)]);
          game.lastQteSequence = seq;
          setQte({ sequence: seq, type: atk.type });
          k.state = 'attacking'; k.attackProgress = 0;
        } else { k.state = 'idle'; k.currentAttack = null; }
      }
    } else if (k.state === 'attacking') {
      k.attackProgress += dt * 2;
      if (k.attackProgress > 1 && !game.qteActive) { k.state = 'recovering'; k.recoverTimer = 1; k.attackProgress = 0; }
    } else {
      // IDLE / CHASING — decide next action
      let hidden = p.isInvisible;
      for (const obj of game.battle.objects) {
        if (obj.type === 'tree' && Math.hypot(obj.x - p.x, obj.y - p.y) < 1.5 && Math.hypot(obj.x - k.x, obj.y - k.y) < dist) { hidden = true; break; }
      }

      if (hidden) {
        k.x += (Math.random() - 0.5) * kSpeed * dt;
        k.y += (Math.random() - 0.5) * kSpeed * dt;
      } else if (dist > 2.5) {
        // Chase
        const a = Math.atan2(p.y - k.y, p.x - k.x);
        let sp = kSpeed;
        for (const obj of game.battle.objects) { if (obj.type === 'mud' && Math.hypot(k.x - obj.x, k.y - obj.y) < (obj.radius || 1.5)) { sp *= 0.4; break; } }
        k.x += Math.cos(a) * sp * dt; k.y += Math.sin(a) * sp * dt;
        k.state = 'chasing';
        k.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up');
      } else {
        // Close range — choose real-time swing OR QTE attack
        k.aiCooldown -= dt;
        if (k.aiCooldown <= 0) {
          const swingChance = phase.swingRate;
          if (Math.random() < swingChance) {
            // Real-time swing
            k.state = 'swing_telegraph';
            k.swingTimer = 0.3;
            k.swingAngle = Math.atan2(p.y - k.y, p.x - k.x);
          } else {
            // QTE attack from phase's attack pool
            const available = phase.attacks;
            const chosen = available[Math.floor(Math.random() * available.length)];
            k.currentAttack = chosen; k.state = 'telegraph';
            k.telegraphTimer = KAIREN_ATTACKS[chosen].telegraph; k.qteSequence = null;
            kairenTaunt();
          }
          k.aiCooldown = k.empowered ? 0.6 + Math.random() * 0.5 : 1.0 + Math.random() * 0.8;
        }
      }
      k.x = Math.max(1, Math.min(BATTLE_ARENA.width - 1, k.x));
      k.y = Math.max(1, Math.min(BATTLE_ARENA.height - 1, k.y));
    }
    if (game.frameCount % 8 === 0) k.frame = (k.frame + 1) % 4;

    // Ending trigger
    if (!game.battle.finishTriggered && (game.battle.timer > 55 || p.hp <= 6)) {
      game.battle.finishTriggered = true;
      game.cutscene.active = true; game.cutscene.phase = 0; game.cutscene.timer = 0;
      setCutsceneText('Enough.');
    }
    // Update arena sub-enemies
    updateArenaEnemies(game, dt);
  }

  // ─── EXPLORE ENEMIES ──────────────────────────────────────
  function updateVillageEnemies(game, dt) {
    const p = game.player, m = game.map;
    for (const e of game.villageEnemies) {
      if (!e.alive) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      const spec = ENEMY_SPECIES[e.species];
      const dist = Math.hypot(p.x - e.x, p.y - e.y);

      if (dist < e.aggroRange) {
        // Chase player
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        const sp = spec.speed * 0.4; // Slower in explore
        if (dist > 0.9) { e.x += Math.cos(a) * sp * dt; e.y += Math.sin(a) * sp * dt; }
        e.state = 'chase';
        // Contact damage (discrete hits with cooldown)
        if (e.attackCd > 0) e.attackCd -= dt;
        if (dist < 1.2 && p.invincible <= 0 && !p.hasShield && e.attackCd <= 0) {
          p.hp = Math.max(0, p.hp - Math.ceil(spec.damage * 0.5));
          p.invincible = 0.5; e.attackCd = 1.1;
          setPlayerHp(Math.ceil(p.hp)); triggerDmg();
        }
      } else {
        // Patrol
        e.state = 'patrol';
        e.patrolTimer -= dt;
        if (e.patrolTimer <= 0) {
          e.patrolDir = Math.random() * Math.PI * 2;
          e.patrolTimer = 2 + Math.random() * 3;
        }
        if (e.patrol) {
          const nx = e.x + Math.cos(e.patrolDir) * spec.speed * 0.2 * dt;
          const ny = e.y + Math.sin(e.patrolDir) * spec.speed * 0.2 * dt;
          const tx = Math.floor(nx), ty = Math.floor(ny);
          if (tx >= 1 && tx < m.width - 1 && ty >= 1 && ty < m.height - 1 && !SOLID_TILES.includes(m.tiles[ty]?.[tx])) {
            e.x = nx; e.y = ny;
          } else { e.patrolDir += Math.PI; }
        }
      }
      // Clamp to map
      e.x = Math.max(1, Math.min(m.width - 2, e.x));
      e.y = Math.max(1, Math.min(m.height - 2, e.y));
      if (game.frameCount % 8 === 0) e.frame = (e.frame + 1) % 4;
    }
  }

  function updateArenaEnemies(game, dt) {
    const p = game.player;
    for (const e of game.arenaEnemies) {
      if (!e.alive) {
        // Spawn countdown
        if (e.spawnCountdown > 0) {
          e.spawnCountdown -= dt;
          if (e.spawnCountdown <= 0) {
            e.alive = true;
            const spec = ENEMY_SPECIES[e.species];
            e.hp = spec.hp; e.maxHp = spec.hp;
          }
        }
        continue;
      }
      if (e.hitFlash > 0) e.hitFlash -= dt;
      const spec = ENEMY_SPECIES[e.species];
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      // Chase
      if (dist > 1.5) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * spec.speed * 0.5 * dt;
        e.y += Math.sin(a) * spec.speed * 0.5 * dt;
      }
      // Contact damage (discrete hits with cooldown)
      if (e.attackCd > 0) e.attackCd -= dt;
      if (dist < 1.5 && p.invincible <= 0 && !p.hasShield && e.attackCd <= 0) {
        const dmg = Math.ceil(spec.damage * 0.5);
        p.hp = Math.max(0, p.hp - dmg); p.invincible = 0.5; e.attackCd = 1.3;
        game.combatStats.damageTaken += dmg;
        setPlayerHp(Math.ceil(p.hp)); triggerDmg();
      }
      e.x = Math.max(1, Math.min(BATTLE_ARENA.width - 1, e.x));
      e.y = Math.max(1, Math.min(BATTLE_ARENA.height - 1, e.y));
      if (game.frameCount % 8 === 0) e.frame = (e.frame + 1) % 4;
    }
  }

  // ─── CUTSCENE ───────────────────────────────────────────
  function updateCutscene(game, dt) {
    const cs = game.cutscene, k = game.battle.kairen, p = game.player;
    cs.timer += dt;
    if (cs.phase === 0) {
      const a = Math.atan2(p.y - k.y, p.x - k.x);
      k.x += Math.cos(a) * 3 * dt; k.y += Math.sin(a) * 3 * dt;
      if (Math.hypot(p.x - k.x, p.y - k.y) < 1.5 || cs.timer > 3) { cs.phase = 1; cs.timer = 0; setCutsceneText('The gods demand your silence, child.'); }
    } else if (cs.phase === 1) { if (cs.timer > 2) { cs.phase = 2; cs.timer = 0; setCutsceneText('Remember this mercy.'); }
    } else if (cs.phase === 2) {
      const edgeX = BATTLE_ARENA.width - 1, edgeY = BATTLE_ARENA.height / 2;
      const a = Math.atan2(edgeY - p.y, edgeX - p.x);
      p.x += Math.cos(a) * 2 * dt; p.y += Math.sin(a) * 2 * dt;
      k.x += Math.cos(a) * 2 * dt; k.y += Math.sin(a) * 2 * dt;
      if (p.x > BATTLE_ARENA.width - 2 || cs.timer > 3) { cs.phase = 3; cs.timer = 0; setCutsceneText(null); }
    } else if (cs.phase === 3) { cs.fadeAlpha = Math.min(0.3, cs.timer * 0.3); if (cs.timer > 0.8) { cs.phase = 4; cs.timer = 0; cs.fallY = 0; cs.fallScale = 1; }
    } else if (cs.phase === 4) { cs.fallY += dt * 200; cs.fallScale = Math.max(0, 1 - cs.timer * 0.8); cs.fadeAlpha = Math.min(1, cs.timer * 0.6); if (cs.timer > 2.5) { cs.phase = 5; cs.timer = 0; }
    } else if (cs.phase === 5) { cs.fadeAlpha = 1; if (cs.timer > 1.5) onEnding({
      ...game.combatStats,
      unlockedSkills: game.unlockedSkills,
      bossHpRemaining: game.battle.kairen.hp,
      finalPlayerHp: game.player.hp,
      battleTime: Math.floor(game.battle.timer),
    }); }
  }
  function renderCutscene(ctx, game, W, H) {
    const cs = game.cutscene;
    if (cs.phase >= 3) drawFadeOverlay(ctx, W, H, cs.fadeAlpha);
    if (cs.phase === 4) drawFallingPlayer(ctx, W / 2, H / 2 + cs.fallY, cs.fallScale, 1 - cs.fadeAlpha);
  }
  function updateRain(game, dt, W, H) {
    for (const r of game.rain.particles) { r.y += r.speed * dt; r.x -= r.speed * 0.15 * dt; if (r.y > H) { r.y = -r.length; r.x = Math.random() * (W + 200); } if (r.x < -20) r.x = W + 20; }
  }
  function updateCamera(game, W, H) {
    const s = toScreen(game.player.x, game.player.y, 0, 0);
    game.camera.x += (s.x - W / 2 - game.camera.x) * 0.08;
    game.camera.y += (s.y - H / 2 - game.camera.y) * 0.08;
  }

  // ─── RENDER ─────────────────────────────────────────────
  function renderExplore(ctx, game) {
    const cx = game.camera.x, cy = game.camera.y, m = game.map, tiles = m.tiles, mw = m.width, mh = m.height;
    for (let d = 0; d <= mw + mh - 2; d++) for (let x = Math.max(0, d - mh + 1); x <= Math.min(d, mw - 1); x++) { const y = d - x; if (y >= 0 && y < mh) { const t = tiles[y]?.[x] ?? 0; drawIsoTile(ctx, x, y, t === TILES.TREE ? TILES.GRASS : t, cx, cy); } }
    drawExitMarker(ctx, m.exit.marker.x, m.exit.marker.y, cx, cy, m.exit.label);
    const ents = [];
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) if (tiles[y]?.[x] === TILES.TREE) ents.push({ t: 'tree', x, y, d: x + y + 0.5 });
    ents.push({ t: 'player', d: game.player.x + game.player.y });
    for (const npc of game.npcs) ents.push({ t: 'npc', data: npc, d: npc.x + npc.y });
    for (const e of game.villageEnemies) { if (e.alive) ents.push({ t: 'enemy', data: e, d: e.x + e.y }); }
    ents.sort((a, b) => a.d - b.d);
    for (const e of ents) {
      if (e.t === 'tree') drawIsoTree(ctx, e.x, e.y, cx, cy);
      else if (e.t === 'player') { const p = game.player; drawIsoPlayer(ctx, p.x, p.y, p.dir, p.frame, cx, cy, p.isAttacking, p.attackAngle, p.isDashing, p.dashTrail, p.jumpHeight, p.comboCount, false); }
      else if (e.t === 'npc') drawIsoNPC(ctx, e.data, cx, cy, game.frameCount);
      else if (e.t === 'enemy') { drawEnemy(ctx, e.data, cx, cy, game.frameCount); drawEnemyNameTag(ctx, e.data, cx, cy); }
    }
    for (const d of game.battle.damageNumbers) drawDamageNumber(ctx, d.dmg, d.x, d.y, d.age, cx, cy);
  }

  function renderBattle(ctx, game) {
    const cx = game.camera.x, cy = game.camera.y;
    const aw = BATTLE_ARENA.width, ah = BATTLE_ARENA.height;
    for (let d = 0; d <= aw + ah; d++) for (let x = Math.max(0, d - ah + 1); x <= Math.min(d, aw - 1); x++) { const y = d - x; if (y >= 0 && y < ah) drawIsoTile(ctx, x, y, TILES.GRASS, cx, cy); }
    for (const obj of game.battle.objects) { if (obj.type === 'mud' || obj.type === 'hazard') drawIsoBattleObj(ctx, obj, cx, cy); }
    for (const ef of game.battle.skillEffects) drawSkillEffect(ctx, ef, cx, cy);

    const k = game.battle.kairen, p = game.player;

    // Draw telegraphs/danger zones BEFORE entities
    if (k.state === 'swing_telegraph') drawKairenSwingTelegraph(ctx, k.x, k.y, k.swingAngle, cx, cy);
    if (k.state === 'swinging') drawKairenSwingArc(ctx, k.x, k.y, k.swingAngle, 1 - k.swingTimer / 0.15, cx, cy);
    if (k.state === 'telegraph' && k.currentAttack) {
      const atk = KAIREN_ATTACKS[k.currentAttack];
      drawQTETelegraph(ctx, k.x, k.y, p.x, p.y, atk, 1 - k.telegraphTimer / atk.telegraph, cx, cy);
    }

    const ents = [];
    ents.push({ t: 'player', d: p.x + p.y });
    ents.push({ t: 'kairen', d: k.x + k.y });
    for (const obj of game.battle.objects) {
      if (obj.type !== 'mud' && obj.type !== 'hazard') {
        if (obj.type === 'tree') ents.push({ t: 'tree', x: obj.x, y: obj.y, d: obj.x + obj.y + 0.5 });
        else ents.push({ t: 'obj', data: obj, d: obj.x + obj.y });
      }
    }
    for (const proj of game.battle.projectiles) ents.push({ t: 'proj', data: proj, d: proj.x + proj.y });
    for (const e of game.arenaEnemies) { if (e.alive) ents.push({ t: 'enemy', data: e, d: e.x + e.y }); }
    ents.sort((a, b) => a.d - b.d);
    for (const e of ents) {
      if (e.t === 'player') drawIsoPlayer(ctx, p.x, p.y, p.dir, p.frame, cx, cy, p.isAttacking, p.attackAngle, p.isDashing, p.dashTrail, p.jumpHeight, p.comboCount, p.isInvisible);
      else if (e.t === 'kairen') {
        drawIsoKairen(ctx, k.x, k.y, k.dir, k.frame, k.state, cx, cy);
        if (k.empowered) drawEmpoweredAura(ctx, k.x, k.y, cx, cy, game.time);
        if (k.state === 'attacking' && k.currentAttack) drawKairenAttack(ctx, k.x, k.y, k.currentAttack, k.attackProgress, cx, cy);
      }
      else if (e.t === 'tree') drawIsoTree(ctx, e.x, e.y, cx, cy);
      else if (e.t === 'obj') drawIsoBattleObj(ctx, e.data, cx, cy);
      else if (e.t === 'proj') drawProjectile(ctx, e.data, cx, cy);
      else if (e.t === 'enemy') { drawEnemy(ctx, e.data, cx, cy, game.frameCount); drawEnemyNameTag(ctx, e.data, cx, cy); }
    }
    for (const d of game.battle.damageNumbers) drawDamageNumber(ctx, d.dmg, d.x, d.y, d.age, cx, cy);
  }

  return (
    <div className={`game-container ${screenShake ? 'screen-shake' : ''}`} data-testid="game-world">
      <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />
      <PlayerHUD hp={playerHp} maxHp={50} stamina={stamina} maxStamina={MAX_STAMINA} mana={mana} maxMana={MAX_MANA + (getEquipStats(equipment).manaBonus || 0)} reputation={reputation} />
      {mode === 'battle' && <BossBar hp={bossHp} maxHp={100} name="KAIREN" />}
      {mode === 'battle' && <SkillBar equippedSkills={equippedSkills} unlockedSkills={unlockedSkills} cooldowns={skillCooldowns} mana={mana} keybinds={keybinds} />}
      {comboDisplay >= 2 && mode === 'battle' && <div className="combo-indicator" data-testid="combo-indicator">COMBO x{comboDisplay}</div>}
      <InventoryDisplay items={inventory} />
      <ControlsHelp mode={mode} keybinds={keybinds} />
      <AnimatePresence>{dialogue && <DialogueBox speaker={dialogue.speaker} text={dialogue.text} isTyping={dialogue.typing} choices={dialogueChoices} onChoose={handleDialogueChoice} />}</AnimatePresence>
      <AnimatePresence>{battleDialogue && !dialogue && <DialogueBox speaker={battleDialogue.speaker} text={battleDialogue.text} isTyping={false} />}</AnimatePresence>
      {qte && <QTEOverlay sequence={qte.sequence} attackType={qte.type} onComplete={handleQTEComplete} />}
      <AnimatePresence>{damageFlash && <DamageFlash />}</AnimatePresence>
      {recoveryState && <RecoveryPrompt direction={recoveryState.direction} />}
      <AnimatePresence>{skillNotification && <SkillUnlockNotification skill={skillNotification.skill} />}</AnimatePresence>
      <AnimatePresence>{zoneBanner && <ZoneBanner name={zoneBanner.name} hint={zoneBanner.hint} />}</AnimatePresence>
      {cutsceneText && <div className="cutscene-text" data-testid="cutscene-text">{cutsceneText}</div>}
      {menuOpen && <GameMenu equippedSkills={equippedSkills} setEquippedSkills={setEquippedSkills} unlockedSkills={unlockedSkills} combatStats={combatStats} equipment={equipment} setEquipment={setEquipment} keybinds={keybinds} setKeybinds={setKeybinds} onClose={() => { setMenuOpen(false); if (gameRef.current) gameRef.current.menuOpen = false; }} />}
    </div>
  );
}
