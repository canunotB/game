import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  VILLAGE_MAP, VILLAGE_NPCS, BATTLE_TRIGGER, BATTLE_ARENA, SOLID_TILES, TILES,
  PLAYER_SPEED, KAIREN_SPEED, KAIREN_ATTACKS, MAX_STAMINA, MAX_MANA,
  ATTACK_STAMINA, DASH_STAMINA, STAMINA_REGEN, MANA_REGEN,
  NPC_DIALOGUE_OPTIONS, DIALOGUE_TONES,
  ALL_SKILLS, ALL_EQUIPMENT, DEFAULT_EQUIPMENT, DEFAULT_KEYBINDS,
  SKILL_UNLOCK_CONDITIONS, SKILL_UNLOCK_ORDER, DEFAULT_COMBAT_STATS,
} from '../lib/gameData';
import {
  toScreen, drawIsoTile, drawIsoTree, drawIsoPlayer, drawIsoKairen, drawIsoNPC,
  drawIsoBattleObj, drawIsoRain, drawFog, drawVignette, drawProjectile,
  drawDamageNumber, drawInteractIndicator, drawKairenAttack, drawFadeOverlay,
  drawFallingPlayer, drawSkillEffect,
} from '../lib/renderer';
import {
  PlayerHUD, BossBar, DialogueBox, QTEOverlay,
  InventoryDisplay, ControlsHelp, DamageFlash, SkillBar, GameMenu, RecoveryPrompt,
  SkillUnlockNotification,
} from './GameOverlays';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GameWorld({ onEnding }) {
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
    const game = {
      mode: 'explore',
      player: {
        x: 5, y: 10, dir: 'down', frame: 0, hp: 50, maxHp: 50,
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
      npcs: VILLAGE_NPCS.map(n => ({ ...n })),
      battle: {
        kairen: {
          x: BATTLE_ARENA.kairenSpawn.x, y: BATTLE_ARENA.kairenSpawn.y,
          hp: 100, maxHp: 100, dir: 'down', frame: 0, state: 'idle',
          attackTimer: 0, recoverTimer: 0, telegraphTimer: 0,
          currentAttack: null, aiCooldown: 2, stunTimer: 0, qteSequence: null,
          attackProgress: 0,
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
    };
    gameRef.current = game;
    for (let i = 0; i < 120; i++) {
      game.rain.particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 350 + Math.random() * 250, length: 10 + Math.random() * 14 });
    }
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ─── KEYBOARD (blur clears stuck keys) ───────────────────
  useEffect(() => {
    const normalize = k => k.length === 1 ? k.toLowerCase() : k.toLowerCase();
    const down = e => {
      const k = normalize(e.key);
      keysRef.current[k] = true;
      if (e.key === ' ' || e.key === 'Tab') e.preventDefault();
      if (k === (keybindsRef.current.menu || 'tab')) {
        e.preventDefault();
        setMenuOpen(prev => {
          const next = !prev;
          if (gameRef.current) gameRef.current.menuOpen = next;
          return next;
        });
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

  // ─── DIALOGUE ────────────────────────────────────────────
  const handleDialogue = useCallback(async (npcId, npcName) => {
    const game = gameRef.current;
    if (game.dialogueActive) return;
    game.dialogueActive = true;
    setDialogue({ speaker: npcName, text: '...', typing: true });
    try {
      const res = await axios.post(`${API}/npc/chat`, { npc_id: npcId, player_message: 'Hello', tone: 'neutral', reputation: game.reputation });
      setDialogue({ speaker: npcName, text: res.data.response, typing: false });
      const options = NPC_DIALOGUE_OPTIONS[npcId];
      if (options) setDialogueChoices(options);
    } catch {
      const npc = VILLAGE_NPCS.find(n => n.id === npcId);
      setDialogue({ speaker: npcName, text: npc?.dialogue?.[0] || '...', typing: false });
      const options = NPC_DIALOGUE_OPTIONS[npcId];
      if (options) setDialogueChoices(options);
    }
  }, []);

  const handleDialogueChoice = useCallback(async (choice) => {
    const game = gameRef.current;
    const npcId = dialogue?.speaker === 'Elder Theron' ? 'elder_theron' : 'lyra';
    setDialogueChoices(null);
    setDialogue(prev => ({ ...prev, text: '...', typing: true }));
    const repChange = DIALOGUE_TONES[choice.tone]?.repChange || 0;
    game.reputation += repChange;
    setReputation(game.reputation);
    try {
      const res = await axios.post(`${API}/npc/chat`, { npc_id: npcId, player_message: choice.text, tone: choice.tone, reputation: game.reputation });
      setDialogue(prev => ({ ...prev, text: res.data.response, typing: false }));
    } catch {
      setDialogue(prev => ({ ...prev, text: 'The words hang in the air...', typing: false }));
    }
  }, [dialogue]);

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

  // ─── SKILL UNLOCK CHECK ──────────────────────────────────
  const checkSkillUnlocks = useCallback((stats, currentUnlocked) => {
    const newUnlocks = [];
    for (const skillId of SKILL_UNLOCK_ORDER) {
      if (currentUnlocked.includes(skillId)) continue;
      const cond = SKILL_UNLOCK_CONDITIONS[skillId];
      if (cond && stats[cond.stat] >= cond.threshold) {
        newUnlocks.push(skillId);
      }
    }
    return newUnlocks;
  }, []);

  const triggerSkillUnlock = useCallback((skillId) => {
    const skill = ALL_SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    setSkillNotification({ skill });
    setTimeout(() => setSkillNotification(null), 2500);
    setUnlockedSkills(prev => {
      const next = [...prev, skillId];
      if (gameRef.current) gameRef.current.unlockedSkills = next;
      return next;
    });
    setEquippedSkills(prev => {
      if (prev.length < 5) {
        const next = [...prev, skillId];
        if (gameRef.current) gameRef.current.player.equippedSkills = next;
        return next;
      }
      return prev;
    });
  }, []);

  // ─── QTE COMPLETE → PUSHBACK + RECOVERY ──────────────────
  const handleQTEComplete = useCallback((result) => {
    const game = gameRef.current;
    if (!game) return;
    game.qteActive = false; setQte(null);
    const k = game.battle.kairen;
    const p = game.player;
    const atk = KAIREN_ATTACKS[k.currentAttack] || KAIREN_ATTACKS.heavy_slash;

    // ── FIXED DAMAGE: perfect/good = 0 damage ──
    if (result === 'perfect') {
      k.state = 'stunned'; k.stunTimer = 2.5;
      const dmg = 12;
      k.hp = Math.max(15, k.hp - dmg); setBossHp(k.hp);
      game.battle.damageNumbers.push({ dmg, x: k.x, y: k.y, age: 0 });
      game.combatStats.perfectDodges++;
    } else if (result === 'good') {
      // Block — NO damage to player
      game.combatStats.goodBlocks++;
    } else if (result === 'late') {
      const dmg = Math.floor(atk.damage * 0.5);
      if (p.hasShield) { p.hasShield = false; }
      else { p.hp = Math.max(0, p.hp - dmg); game.combatStats.damageTaken += dmg; setPlayerHp(p.hp); triggerDmg(); }
    } else {
      if (p.hasShield) { p.hasShield = false; }
      else { p.hp = Math.max(0, p.hp - atk.damage); game.combatStats.damageTaken += atk.damage; setPlayerHp(p.hp); triggerDmg(); }
    }
    game.combatStats.dodgesTotal++;

    // ── PUSHBACK in direction of last QTE arrow ──
    const seq = game.lastQteSequence;
    if (seq && seq.length > 0) {
      const lastDir = seq[seq.length - 1];
      const pushMap = { up: { dx: -1, dy: -1 }, down: { dx: 1, dy: 1 }, left: { dx: -1, dy: 1 }, right: { dx: 1, dy: -1 } };
      const push = pushMap[lastDir] || { dx: 0, dy: 0 };
      const pushForce = 4.0;
      p.pushVx = push.dx * pushForce;
      p.pushVy = push.dy * pushForce;
      p.pushTimer = 0.35;
    }

    k.currentAttack = null;
    k.attackProgress = 0;
    k.state = k.state === 'stunned' ? 'stunned' : 'recovering';
    k.recoverTimer = k.state === 'stunned' ? 0 : atk.recovery;

    // Recovery prompt
    const dirs = ['up', 'down', 'left', 'right'];
    const recDir = dirs[Math.floor(Math.random() * 4)];
    game.recovery = { active: true, direction: recDir, timer: 1.0 };
    setRecoveryState({ direction: recDir, timer: 1.0 });

    // Check skill unlocks
    const newUnlocks = checkSkillUnlocks(game.combatStats, game.unlockedSkills);
    for (const sid of newUnlocks) { triggerSkillUnlock(sid); }
    setCombatStats({ ...game.combatStats });
  }, [checkSkillUnlocks, triggerSkillUnlock]);

  const triggerDmg = useCallback(() => {
    setDamageFlash(true); setScreenShake(true);
    setTimeout(() => setDamageFlash(false), 300);
    setTimeout(() => setScreenShake(false), 200);
  }, []);

  const requestEnemyAction = useCallback(async (game) => {
    try {
      const res = await axios.post(`${API}/battle/enemy-action`, {
        player_action: game.player.isAttacking ? 'attacking' : 'moving',
        player_position: { x: game.player.x, y: game.player.y },
        enemy_hp: game.battle.kairen.hp, player_hp: game.player.hp,
        environment: { rain: true, hazards: true },
      });
      return res.data;
    } catch { return null; }
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
      const game = gameRef.current;
      const canvas = canvasRef.current;
      if (!game || !canvas) { animFrameRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      game.time += dt; game.frameCount++;

      if (!game.menuOpen) {
        if (game.cutscene.active) {
          updateCutscene(game, dt);
        } else if (!game.dialogueActive && !game.qteActive) {
          if (game.recovery.active) {
            updateRecovery(game, dt);
          } else {
            updatePlayer(game, dt);
            if (game.mode === 'explore') updateExplore(game);
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

      setSkillCooldowns({ ...game.player.skillCooldowns });
      setMana(Math.floor(game.player.mana));
      setComboDisplay(game.player.comboCount);

      mouseRef.current.clicked = false;
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [handleDialogue, handleQTEComplete, requestEnemyAction, onEnding, triggerDmg, triggerSkillUnlock, checkSkillUnlocks]);

  // ─── RECOVERY UPDATE ─────────────────────────────────────
  function updateRecovery(game, dt) {
    const rec = game.recovery;
    const keys = keysRef.current;
    const kb = keybindsRef.current;
    rec.timer -= dt;
    const dirMap = { up: kb.moveUp, down: kb.moveDown, left: kb.moveLeft, right: kb.moveRight };
    const needed = dirMap[rec.direction];
    if (keys[needed]) {
      rec.active = false; setRecoveryState(null);
      game.player.speed = PLAYER_SPEED * 1.4;
      setTimeout(() => { if (gameRef.current) gameRef.current.player.speed = PLAYER_SPEED + getEquipStats(game.player.equipment).speedBonus; }, 600);
      return;
    }
    if (rec.timer <= 0) {
      rec.active = false; setRecoveryState(null);
      game.player.staggerTimer = 0.5;
    }
  }

  // ─── PLAYER UPDATE ──────────────────────────────────────
  function updatePlayer(game, dt) {
    const p = game.player, keys = keysRef.current, mouse = mouseRef.current;
    const kb = keybindsRef.current;
    const stats = getEquipStats(p.equipment);

    if (p.staggerTimer > 0) { p.staggerTimer -= dt; return; }
    if (p.isInvisible) { p.invisibleTimer -= dt; if (p.invisibleTimer <= 0) p.isInvisible = false; }

    // Pushback from QTE dodge
    if (p.pushTimer > 0) {
      p.pushTimer -= dt;
      const decay = Math.max(0, p.pushTimer / 0.35);
      p.x = Math.max(0.5, Math.min(BATTLE_ARENA.width - 0.5, p.x + p.pushVx * decay * dt));
      p.y = Math.max(0.5, Math.min(BATTLE_ARENA.height - 0.5, p.y + p.pushVy * decay * dt));
    }

    // Movement
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

    // Dash (very short i-frames)
    if (keys[kb.dash] && !p.isDashing && p.stamina >= DASH_STAMINA && (dx !== 0 || dy !== 0)) {
      p.isDashing = true; p.dashTimer = 0.1; p.stamina -= DASH_STAMINA;
      p.invincible = 0.08;
      p.dashTrail = [{ x: p.x, y: p.y, alpha: 0.5 }];
      keys[kb.dash] = false;
      if (game.mode === 'battle') {
        game.combatStats.dashCount++;
        const newUnlocks = checkSkillUnlocks(game.combatStats, game.unlockedSkills);
        for (const sid of newUnlocks) triggerSkillUnlock(sid);
        setCombatStats({ ...game.combatStats });
      }
    }
    if (p.isDashing) {
      p.dashTimer -= dt; speed *= 4.0;
      p.dashTrail.push({ x: p.x, y: p.y, alpha: p.dashTimer / 0.1 * 0.4 });
      if (p.dashTrail.length > 4) p.dashTrail.shift();
      if (p.dashTimer <= 0) { p.isDashing = false; p.dashTrail = []; }
    }
    if (p.invincible > 0) p.invincible -= dt;

    // Jump
    if (keys[kb.jump] && !p.isJumping && game.mode === 'battle') {
      p.isJumping = true; p.jumpPhase = 'rising'; p.jumpTimer = 0;
      keys[kb.jump] = false;
    }
    if (p.isJumping) {
      p.jumpTimer += dt;
      if (p.jumpPhase === 'rising') {
        p.jumpHeight = Math.min(44, p.jumpTimer * 180);
        if (p.jumpTimer > 0.24) { p.jumpPhase = 'falling'; p.jumpTimer = 0; }
      } else {
        p.jumpHeight = Math.max(0, 44 - p.jumpTimer * 180);
        if (p.jumpHeight <= 0) { p.isJumping = false; p.jumpPhase = 'none'; p.jumpHeight = 0; }
      }
      speed *= 1.2;
    }

    const nx = p.x + dx * speed * dt;
    const ny = p.y + dy * speed * dt;
    if (game.mode === 'explore') {
      const tx = Math.floor(nx), ty = Math.floor(ny);
      if (tx >= 0 && tx < 30 && ty >= 0 && ty < 20 && !SOLID_TILES.includes(VILLAGE_MAP[ty]?.[tx])) { p.x = nx; p.y = ny; }
    } else {
      if (nx > 0.5 && nx < BATTLE_ARENA.width - 0.5) p.x = nx;
      if (ny > 0.5 && ny < BATTLE_ARENA.height - 0.5) p.y = ny;
    }

    // ─── COMBO ATTACKS (M1 click) ─────────────────────────
    if (mouse.clicked && !p.isAttacking && p.stamina >= ATTACK_STAMINA * stats.weaponSpeed && game.mode === 'battle') {
      const timeSinceLast = game.time - p.lastAttackTime;
      if (timeSinceLast < 0.45 && p.comboCount < 3) {
        p.comboCount++;
      } else {
        p.comboCount = 1;
      }
      p.lastAttackTime = game.time;
      p.isAttacking = true;
      p.attackTimer = Math.max(0.06, 0.12 * stats.weaponSpeed - (p.comboCount - 1) * 0.015);
      p.stamina -= ATTACK_STAMINA * stats.weaponSpeed * (1 - (p.comboCount - 1) * 0.08);

      const ps = toScreen(p.x, p.y, game.camera.x, game.camera.y);
      p.attackAngle = Math.atan2(mouse.y - ps.y + 10, mouse.x - ps.x);

      const k = game.battle.kairen;
      const dist = Math.hypot(p.x - k.x, p.y - k.y);
      const hitRange = p.isJumping ? 3.0 : 2.5;
      if (dist < hitRange) {
        // Reduced damage — Kairen is unbeatable
        let dmg = k.state === 'stunned' ? Math.floor(stats.weaponDmg * 1.5) : Math.max(2, Math.floor(stats.weaponDmg * 0.5));
        dmg = Math.floor(dmg * (1 + (p.comboCount - 1) * 0.2));
        if (p.isJumping) dmg = Math.floor(dmg * 1.3);
        k.hp = Math.max(15, k.hp - dmg); setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg, x: k.x + (Math.random() - 0.5), y: k.y + (Math.random() - 0.5), age: 0 });
        if (p.isJumping && p.jumpPhase === 'rising') { p.jumpPhase = 'falling'; p.jumpTimer = 0.1; }

        game.combatStats.hitsLanded++;
        if (p.comboCount === 3) game.combatStats.fullCombos++;
        const newUnlocks = checkSkillUnlocks(game.combatStats, game.unlockedSkills);
        for (const sid of newUnlocks) triggerSkillUnlock(sid);
        setCombatStats({ ...game.combatStats });
      }
    }
    if (p.isAttacking) { p.attackTimer -= dt; if (p.attackTimer <= 0) p.isAttacking = false; }
    if (game.time - p.lastAttackTime > 0.6) p.comboCount = 0;

    // ─── SKILLS (1-5 keys, only unlocked) ─────────────────
    if (game.mode === 'battle') {
      for (let i = 0; i < 5; i++) {
        const sk = kb[`skill${i + 1}`];
        if (keys[sk]) {
          keys[sk] = false;
          const skillId = p.equippedSkills[i];
          if (!skillId) continue;
          if (!game.unlockedSkills.includes(skillId)) continue;
          const skill = ALL_SKILLS.find(s => s.id === skillId);
          if (!skill) continue;
          if ((p.skillCooldowns[skillId] || 0) > 0) continue;
          if (p.mana < skill.manaCost) continue;
          p.mana -= skill.manaCost;
          p.skillCooldowns[skillId] = skill.cooldown;
          applySkill(game, skill, mouse);
        }
      }
      for (const id in p.skillCooldowns) {
        if (p.skillCooldowns[id] > 0) p.skillCooldowns[id] = Math.max(0, p.skillCooldowns[id] - dt);
      }
    }

    if (!p.isAttacking && !p.isDashing) p.stamina = Math.min(MAX_STAMINA, p.stamina + STAMINA_REGEN * dt);
    setStamina(Math.floor(p.stamina));
    if (game.mode === 'battle') p.mana = Math.min(MAX_MANA + (getEquipStats(p.equipment).manaBonus || 0), p.mana + MANA_REGEN * dt);
    if (dx !== 0 || dy !== 0) { if (game.frameCount % 6 === 0) p.frame = (p.frame + 1) % 4; }
  }

  // ─── APPLY SKILL ─────────────────────────────────────────
  function applySkill(game, skill, mouse) {
    const p = game.player, k = game.battle.kairen;
    const ps = toScreen(p.x, p.y, game.camera.x, game.camera.y);
    const angle = Math.atan2(mouse.y - ps.y, mouse.x - ps.x);
    switch (skill.id) {
      case 'flame_dash': {
        p.isDashing = true; p.dashTimer = 0.2; p.invincible = 0.25;
        const dist = Math.hypot(p.x - k.x, p.y - k.y);
        if (dist < 3) { k.hp = Math.max(15, k.hp - skill.damage); setBossHp(k.hp); game.battle.damageNumbers.push({ dmg: skill.damage, x: k.x, y: k.y, age: 0 }); }
        game.battle.skillEffects.push({ type: 'flame_trail', x: p.x, y: p.y, timer: 0.5, duration: 0.5, color: skill.color });
        break;
      }
      case 'lightning_strike': {
        k.hp = Math.max(15, k.hp - skill.damage); setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg: skill.damage, x: k.x, y: k.y, age: 0 });
        game.battle.skillEffects.push({ type: 'lightning', x: k.x, y: k.y, timer: 0.6, duration: 0.6, color: skill.color });
        break;
      }
      case 'wind_slash': {
        game.battle.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 14, vy: Math.sin(angle) * 14, life: 1.0, damage: skill.damage, isSkill: true, color: skill.color });
        break;
      }
      case 'shadow_step': {
        p.isInvisible = true; p.invisibleTimer = 1.2; p.invincible = 1.2;
        game.battle.skillEffects.push({ type: 'shadow', x: p.x, y: p.y, timer: 0.4, duration: 0.4, color: skill.color });
        break;
      }
      case 'earth_shield': {
        p.hasShield = true;
        game.battle.skillEffects.push({ type: 'shield', x: p.x, y: p.y, timer: 0.6, duration: 0.6, color: skill.color });
        break;
      }
      case 'divine_wrath': {
        const dist = Math.hypot(p.x - k.x, p.y - k.y);
        if (dist < 4) { k.hp = Math.max(15, k.hp - skill.damage); setBossHp(k.hp); game.battle.damageNumbers.push({ dmg: skill.damage, x: k.x, y: k.y, age: 0 }); }
        game.battle.skillEffects.push({ type: 'explosion', x: p.x, y: p.y, timer: 0.8, duration: 0.8, color: skill.color, radius: 3 });
        break;
      }
      case 'healing_light': {
        p.hp = Math.min(p.maxHp, p.hp + (skill.healAmount || 15));
        setPlayerHp(Math.ceil(p.hp));
        game.battle.skillEffects.push({ type: 'heal', x: p.x, y: p.y, timer: 0.6, duration: 0.6, color: skill.color });
        break;
      }
      default: break;
    }
  }

  // ─── EXPLORE UPDATE ─────────────────────────────────────
  function updateExplore(game) {
    const p = game.player, keys = keysRef.current;
    const kb = keybindsRef.current;
    let nearNPC = null;
    for (const npc of game.npcs) { if (Math.hypot(p.x - npc.x, p.y - npc.y) < 2) { nearNPC = npc; break; } }
    if (nearNPC && keys[kb.interact]) {
      keys[kb.interact] = false;
      handleDialogue(nearNPC.id, nearNPC.name);
    }
    if (p.x >= BATTLE_TRIGGER.minX && p.x <= BATTLE_TRIGGER.maxX && p.y >= BATTLE_TRIGGER.minY && p.y <= BATTLE_TRIGGER.maxY) {
      game.mode = 'battle'; p.x = BATTLE_ARENA.playerSpawn.x; p.y = BATTLE_ARENA.playerSpawn.y;
      p.hp = p.maxHp; p.stamina = MAX_STAMINA; p.mana = MAX_MANA;
      // Reset combat stats and skills for this run
      game.combatStats = { ...DEFAULT_COMBAT_STATS };
      game.unlockedSkills = [];
      setUnlockedSkills([]); setEquippedSkills([]);
      setCombatStats({ ...DEFAULT_COMBAT_STATS });
      setMode('battle'); setPlayerHp(p.maxHp); setBossHp(100);
      setBattleDialogue({ speaker: 'Kairen', text: 'So... the prophecy child dares to face me.' });
      setTimeout(() => setBattleDialogue(null), 3500);
    }
  }

  // ─── BATTLE UPDATE ──────────────────────────────────────
  function updateBattle(game, dt) {
    const p = game.player, k = game.battle.kairen, keys = keysRef.current;
    const kb = keybindsRef.current;
    game.battle.timer += dt;

    // Kairen HP regen — he is UNBEATABLE
    k.hp = Math.min(k.maxHp, k.hp + 1.5 * dt);
    k.hp = Math.max(15, k.hp);
    setBossHp(Math.ceil(k.hp));

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

    // ─── KAIREN AI ──────────────────────────────
    if (k.state === 'stunned') {
      k.stunTimer -= dt; if (k.stunTimer <= 0) k.state = 'idle';
    } else if (k.state === 'recovering') {
      k.recoverTimer -= dt; if (k.recoverTimer <= 0) k.state = 'idle';
    } else if (k.state === 'telegraph') {
      k.telegraphTimer -= dt;
      if (k.telegraphTimer <= 0) {
        const atk = KAIREN_ATTACKS[k.currentAttack] || KAIREN_ATTACKS.heavy_slash;
        if (Math.hypot(p.x - k.x, p.y - k.y) < atk.range + 1.5 && !p.isInvisible) {
          game.qteActive = true;
          const dirs = ['up', 'down', 'left', 'right'];
          const seq = k.qteSequence || Array.from({ length: atk.qteLength }, () => dirs[Math.floor(Math.random() * 4)]);
          game.lastQteSequence = seq;
          setQte({ sequence: seq }); k.state = 'attacking'; k.attackProgress = 0;
        } else { k.state = 'idle'; k.currentAttack = null; }
      }
    } else if (k.state === 'attacking') {
      k.attackProgress += dt * 2;
      if (k.attackProgress > 1 && !game.qteActive) { k.state = 'recovering'; k.recoverTimer = 1; k.attackProgress = 0; }
    } else {
      const dist = Math.hypot(p.x - k.x, p.y - k.y);
      let hidden = false;
      if (p.isInvisible) hidden = true;
      for (const obj of game.battle.objects) {
        if (obj.type === 'tree' && Math.hypot(obj.x - p.x, obj.y - p.y) < 1.5 && Math.hypot(obj.x - k.x, obj.y - k.y) < dist) { hidden = true; break; }
      }
      if (hidden) {
        k.x += (Math.random() - 0.5) * KAIREN_SPEED * dt;
        k.y += (Math.random() - 0.5) * KAIREN_SPEED * dt;
      } else if (dist > 2.5) {
        const a = Math.atan2(p.y - k.y, p.x - k.x);
        let sp = KAIREN_SPEED;
        for (const obj of game.battle.objects) {
          if (obj.type === 'mud' && Math.hypot(k.x - obj.x, k.y - obj.y) < (obj.radius || 1.5)) { sp *= 0.4; break; }
        }
        k.x += Math.cos(a) * sp * dt; k.y += Math.sin(a) * sp * dt;
        k.state = 'chasing';
        k.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up');
      } else {
        k.aiCooldown -= dt;
        if (k.aiCooldown <= 0) {
          k.aiCooldown = 1.0 + Math.random() * 1.0;
          const attacks = Object.keys(KAIREN_ATTACKS);
          const chosen = attacks[Math.floor(Math.random() * attacks.length)];
          k.currentAttack = chosen; k.state = 'telegraph';
          k.telegraphTimer = KAIREN_ATTACKS[chosen].telegraph; k.qteSequence = null;
          requestEnemyAction(game).then(r => {
            if (r?.dialogue) { setBattleDialogue({ speaker: 'Kairen', text: r.dialogue }); setTimeout(() => setBattleDialogue(null), 2000); }
            if (r?.qte_sequence?.length) k.qteSequence = r.qte_sequence;
          });
        }
      }
      k.x = Math.max(1, Math.min(BATTLE_ARENA.width - 1, k.x));
      k.y = Math.max(1, Math.min(BATTLE_ARENA.height - 1, k.y));
    }
    if (game.frameCount % 8 === 0) k.frame = (k.frame + 1) % 4;

    // ─── ENDING TRIGGER (Kairen always wins) ────
    if (!game.battle.finishTriggered && (game.battle.timer > 50 || p.hp <= 6)) {
      game.battle.finishTriggered = true;
      game.cutscene.active = true; game.cutscene.phase = 0; game.cutscene.timer = 0;
      setCutsceneText('Enough.');
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
    } else if (cs.phase === 1) {
      if (cs.timer > 2) { cs.phase = 2; cs.timer = 0; setCutsceneText('Remember this mercy.'); }
    } else if (cs.phase === 2) {
      const edgeX = BATTLE_ARENA.width - 1, edgeY = BATTLE_ARENA.height / 2;
      const a = Math.atan2(edgeY - p.y, edgeX - p.x);
      p.x += Math.cos(a) * 2 * dt; p.y += Math.sin(a) * 2 * dt;
      k.x += Math.cos(a) * 2 * dt; k.y += Math.sin(a) * 2 * dt;
      if (p.x > BATTLE_ARENA.width - 2 || cs.timer > 3) { cs.phase = 3; cs.timer = 0; setCutsceneText(null); }
    } else if (cs.phase === 3) {
      cs.fadeAlpha = Math.min(0.3, cs.timer * 0.3);
      if (cs.timer > 0.8) { cs.phase = 4; cs.timer = 0; cs.fallY = 0; cs.fallScale = 1; }
    } else if (cs.phase === 4) {
      cs.fallY += dt * 200;
      cs.fallScale = Math.max(0, 1 - cs.timer * 0.8);
      cs.fadeAlpha = Math.min(1, cs.timer * 0.6);
      if (cs.timer > 2.5) { cs.phase = 5; cs.timer = 0; }
    } else if (cs.phase === 5) {
      cs.fadeAlpha = 1;
      if (cs.timer > 1.5) onEnding();
    }
  }

  function renderCutscene(ctx, game, W, H) {
    const cs = game.cutscene;
    if (cs.phase >= 3) drawFadeOverlay(ctx, W, H, cs.fadeAlpha);
    if (cs.phase === 4) {
      const px = W / 2, py = H / 2 + cs.fallY;
      drawFallingPlayer(ctx, px, py, cs.fallScale, 1 - cs.fadeAlpha);
    }
  }

  function updateRain(game, dt, W, H) {
    for (const r of game.rain.particles) {
      r.y += r.speed * dt; r.x -= r.speed * 0.15 * dt;
      if (r.y > H) { r.y = -r.length; r.x = Math.random() * (W + 200); }
      if (r.x < -20) r.x = W + 20;
    }
  }

  function updateCamera(game, W, H) {
    const s = toScreen(game.player.x, game.player.y, 0, 0);
    const tx = s.x - W / 2, ty = s.y - H / 2;
    game.camera.x += (tx - game.camera.x) * 0.08;
    game.camera.y += (ty - game.camera.y) * 0.08;
  }

  function renderExplore(ctx, game, W, H) {
    const cx = game.camera.x, cy = game.camera.y;
    for (let d = 0; d <= 48; d++) {
      for (let x = Math.max(0, d - 19); x <= Math.min(d, 29); x++) {
        const y = d - x;
        if (y >= 0 && y < 20) {
          const tile = VILLAGE_MAP[y]?.[x] ?? 0;
          if (tile === TILES.TREE) drawIsoTile(ctx, x, y, TILES.GRASS, cx, cy);
          else drawIsoTile(ctx, x, y, tile, cx, cy);
        }
      }
    }
    const ents = [];
    for (let y = 0; y < 20; y++) for (let x = 0; x < 30; x++) if (VILLAGE_MAP[y]?.[x] === TILES.TREE) ents.push({ t: 'tree', x, y, d: x + y + 0.5 });
    ents.push({ t: 'player', d: game.player.x + game.player.y });
    for (const npc of game.npcs) ents.push({ t: 'npc', data: npc, d: npc.x + npc.y });
    ents.sort((a, b) => a.d - b.d);
    for (const e of ents) {
      if (e.t === 'tree') drawIsoTree(ctx, e.x, e.y, cx, cy);
      else if (e.t === 'player') {
        const p = game.player;
        drawIsoPlayer(ctx, p.x, p.y, p.dir, p.frame, cx, cy, p.isAttacking, p.attackAngle, p.isDashing, p.dashTrail, 0, p.comboCount, false);
      }
      else if (e.t === 'npc') drawIsoNPC(ctx, e.data, cx, cy, game.frameCount);
    }
  }

  function renderBattle(ctx, game, W, H) {
    const cx = game.camera.x, cy = game.camera.y;
    const aw = BATTLE_ARENA.width, ah = BATTLE_ARENA.height;
    for (let d = 0; d <= aw + ah; d++) {
      for (let x = Math.max(0, d - ah + 1); x <= Math.min(d, aw - 1); x++) {
        const y = d - x;
        if (y >= 0 && y < ah) drawIsoTile(ctx, x, y, TILES.GRASS, cx, cy);
      }
    }
    for (const obj of game.battle.objects) {
      if (obj.type === 'mud' || obj.type === 'hazard') drawIsoBattleObj(ctx, obj, cx, cy);
    }
    for (const ef of game.battle.skillEffects) drawSkillEffect(ctx, ef, cx, cy);
    const ents = [];
    ents.push({ t: 'player', d: game.player.x + game.player.y });
    ents.push({ t: 'kairen', d: game.battle.kairen.x + game.battle.kairen.y });
    for (const obj of game.battle.objects) {
      if (obj.type !== 'mud' && obj.type !== 'hazard') {
        if (obj.type === 'tree') ents.push({ t: 'tree', x: obj.x, y: obj.y, d: obj.x + obj.y + 0.5 });
        else ents.push({ t: 'obj', data: obj, d: obj.x + obj.y });
      }
    }
    for (const proj of game.battle.projectiles) ents.push({ t: 'proj', data: proj, d: proj.x + proj.y });
    ents.sort((a, b) => a.d - b.d);
    for (const e of ents) {
      if (e.t === 'player') {
        const p = game.player;
        drawIsoPlayer(ctx, p.x, p.y, p.dir, p.frame, cx, cy, p.isAttacking, p.attackAngle, p.isDashing, p.dashTrail, p.jumpHeight, p.comboCount, p.isInvisible);
      }
      else if (e.t === 'kairen') {
        const k = game.battle.kairen;
        drawIsoKairen(ctx, k.x, k.y, k.dir, k.frame, k.state, cx, cy);
        if (k.state === 'attacking' && k.currentAttack) drawKairenAttack(ctx, k.x, k.y, k.currentAttack, k.attackProgress, cx, cy);
      }
      else if (e.t === 'tree') drawIsoTree(ctx, e.x, e.y, cx, cy);
      else if (e.t === 'obj') drawIsoBattleObj(ctx, e.data, cx, cy);
      else if (e.t === 'proj') drawProjectile(ctx, e.data, cx, cy);
    }
    for (const d of game.battle.damageNumbers) drawDamageNumber(ctx, d.dmg, d.x, d.y, d.age, cx, cy);
  }

  return (
    <div className={`game-container ${screenShake ? 'screen-shake' : ''}`} data-testid="game-world">
      <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />
      <PlayerHUD hp={playerHp} maxHp={50} stamina={stamina} maxStamina={MAX_STAMINA} mana={mana} maxMana={MAX_MANA + (getEquipStats(equipment).manaBonus || 0)} reputation={reputation} />
      {mode === 'battle' && <BossBar hp={bossHp} maxHp={100} name="KAIREN" />}
      {mode === 'battle' && (
        <SkillBar
          equippedSkills={equippedSkills}
          unlockedSkills={unlockedSkills}
          cooldowns={skillCooldowns}
          mana={mana}
          keybinds={keybinds}
        />
      )}
      {comboDisplay >= 2 && mode === 'battle' && <div className="combo-indicator" data-testid="combo-indicator">COMBO x{comboDisplay}</div>}
      <InventoryDisplay items={inventory} />
      <ControlsHelp mode={mode} keybinds={keybinds} />
      <AnimatePresence>
        {dialogue && <DialogueBox speaker={dialogue.speaker} text={dialogue.text} isTyping={dialogue.typing} choices={dialogueChoices} onChoose={handleDialogueChoice} />}
      </AnimatePresence>
      <AnimatePresence>
        {battleDialogue && !dialogue && <DialogueBox speaker={battleDialogue.speaker} text={battleDialogue.text} isTyping={false} />}
      </AnimatePresence>
      {qte && <QTEOverlay sequence={qte.sequence} onComplete={handleQTEComplete} />}
      <AnimatePresence>{damageFlash && <DamageFlash />}</AnimatePresence>
      {recoveryState && <RecoveryPrompt direction={recoveryState.direction} />}
      <AnimatePresence>
        {skillNotification && <SkillUnlockNotification skill={skillNotification.skill} />}
      </AnimatePresence>
      {cutsceneText && <div className="cutscene-text" data-testid="cutscene-text">{cutsceneText}</div>}
      {menuOpen && (
        <GameMenu
          equippedSkills={equippedSkills}
          setEquippedSkills={setEquippedSkills}
          unlockedSkills={unlockedSkills}
          combatStats={combatStats}
          equipment={equipment}
          setEquipment={setEquipment}
          keybinds={keybinds}
          setKeybinds={setKeybinds}
          onClose={() => { setMenuOpen(false); if (gameRef.current) gameRef.current.menuOpen = false; }}
        />
      )}
    </div>
  );
}
