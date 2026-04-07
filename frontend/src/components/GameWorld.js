import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  VILLAGE_MAP, VILLAGE_NPCS, BATTLE_TRIGGER, BATTLE_ARENA, SOLID_TILES,
  TILE_SIZE, PLAYER_SPEED, KAIREN_SPEED, KAIREN_ATTACKS, ENDING_LINES, QTE_KEYS,
} from '../lib/gameData';
import {
  drawTile, drawTreeBase, drawTreeTop, drawPlayer, drawKairen, drawNPC,
  drawBattleObject, drawBattleObjectTop, drawRain, drawBattleGround,
  drawInteractIndicator, drawProjectile, drawDamageNumber, drawAtmosphere,
} from '../lib/renderer';
import {
  PlayerHUD, BossBar, DialogueBox, QTEOverlay, EnvPrompt,
  InventoryDisplay, ControlsHelp, DamageFlash,
} from './GameOverlays';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GameWorld({ onEnding }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  // UI state (updated selectively from game loop)
  const [playerHp, setPlayerHp] = useState(50);
  const [bossHp, setBossHp] = useState(100);
  const [dialogue, setDialogue] = useState(null);
  const [qte, setQte] = useState(null);
  const [envPrompt, setEnvPrompt] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [mode, setMode] = useState('explore');
  const [damageFlash, setDamageFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [battleDialogue, setBattleDialogue] = useState(null);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = {
      mode: 'explore',
      player: { x: 5, y: 10, dir: 'down', frame: 0, hp: 50, maxHp: 50, speed: PLAYER_SPEED, inventory: [], isAttacking: false, attackTimer: 0, isDodging: false, dodgeTimer: 0, invincible: 0 },
      camera: { x: 0, y: 0 },
      npcs: VILLAGE_NPCS.map((n) => ({ ...n })),
      battle: {
        kairen: { x: BATTLE_ARENA.kairenSpawn.x, y: BATTLE_ARENA.kairenSpawn.y, hp: 100, maxHp: 100, dir: 'down', frame: 0, state: 'idle', attackTimer: 0, recoverTimer: 0, telegraphTimer: 0, currentAttack: null, aiCooldown: 0, stunTimer: 0 },
        objects: BATTLE_ARENA.objects.map((o) => ({ ...o, pickedUp: false })),
        projectiles: [],
        damageNumbers: [],
        timer: 0,
        finishTriggered: false,
      },
      rain: { particles: [], intensity: 0.6 },
      dialogueActive: false,
      qteActive: false,
      frameCount: 0,
      time: 0,
    };

    gameRef.current = game;

    // Initialize rain
    for (let i = 0; i < 150; i++) {
      game.rain.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 400 + Math.random() * 300,
        length: 10 + Math.random() * 15,
      });
    }

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ') e.preventDefault();
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Dialogue handler
  const handleDialogue = useCallback(async (npcId, npcName) => {
    const game = gameRef.current;
    if (game.dialogueActive) return;
    game.dialogueActive = true;

    setDialogue({ speaker: npcName, text: '...', typing: true });

    try {
      const res = await axios.post(`${API}/npc/chat`, {
        npc_id: npcId,
        player_message: 'Hello',
        context: { mode: game.mode, player_hp: game.player.hp },
      });
      setDialogue({ speaker: npcName, text: res.data.response, typing: false });
    } catch {
      const npc = VILLAGE_NPCS.find((n) => n.id === npcId);
      const fallback = npc?.dialogue?.[Math.floor(Math.random() * npc.dialogue.length)] || '...';
      setDialogue({ speaker: npcName, text: fallback, typing: false });
    }
  }, []);

  // Close dialogue on Enter
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' && dialogue && !dialogue.typing) {
        setDialogue(null);
        if (gameRef.current) gameRef.current.dialogueActive = false;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialogue]);

  // QTE complete handler
  const handleQTEComplete = useCallback((result) => {
    const game = gameRef.current;
    if (!game) return;
    game.qteActive = false;
    setQte(null);

    const k = game.battle.kairen;
    const p = game.player;
    const atk = KAIREN_ATTACKS[k.currentAttack] || KAIREN_ATTACKS.heavy_slash;

    if (result === 'perfect') {
      // Counter - stun Kairen, deal damage
      k.state = 'stunned';
      k.stunTimer = 2;
      k.hp = Math.max(0, k.hp - 12);
      setBossHp(k.hp);
      game.battle.damageNumbers.push({ dmg: 12, x: k.x, y: k.y, age: 0 });
    } else if (result === 'good') {
      // Block - minimal damage
      p.hp = Math.max(0, p.hp - 3);
      setPlayerHp(p.hp);
    } else if (result === 'late') {
      // Grazed
      p.hp = Math.max(0, p.hp - Math.floor(atk.damage * 0.6));
      setPlayerHp(p.hp);
      triggerDamage();
    } else {
      // Miss - full damage
      p.hp = Math.max(0, p.hp - atk.damage);
      setPlayerHp(p.hp);
      triggerDamage();
    }

    k.currentAttack = null;
    k.state = k.state === 'stunned' ? 'stunned' : 'recovering';
    k.recoverTimer = k.state === 'stunned' ? 0 : atk.recovery;
  }, []);

  const triggerDamage = useCallback(() => {
    setDamageFlash(true);
    setScreenShake(true);
    setTimeout(() => setDamageFlash(false), 300);
    setTimeout(() => setScreenShake(false), 200);
  }, []);

  // Request enemy action from AI
  const requestEnemyAction = useCallback(async (game) => {
    try {
      const res = await axios.post(`${API}/battle/enemy-action`, {
        player_action: game.player.isAttacking ? 'attacking' : 'moving',
        player_position: { x: game.player.x, y: game.player.y },
        enemy_hp: game.battle.kairen.hp,
        player_hp: game.player.hp,
        environment: {
          rain: true,
          objects_near_player: game.battle.objects.filter(
            (o) => !o.pickedUp && Math.hypot(o.x - game.player.x, o.y - game.player.y) < 3
          ).map((o) => o.type),
        },
      });
      return res.data;
    } catch {
      return null;
    }
  }, []);

  // ─── GAME LOOP ─────────────────────────────────────────
  useEffect(() => {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const game = gameRef.current;
      const canvas = canvasRef.current;
      if (!game || !canvas) { animFrameRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      const keys = keysRef.current;
      const W = canvas.width;
      const H = canvas.height;

      game.time += dt;
      game.frameCount++;

      // ─── UPDATE ─────────────────────────────────────
      if (!game.dialogueActive && !game.qteActive) {
        updatePlayer(game, keys, dt);
      }

      if (game.mode === 'explore') {
        updateExplore(game, keys);
      } else if (game.mode === 'battle') {
        updateBattle(game, keys, dt);
      }

      updateRain(game, dt, W, H);
      updateCamera(game, W, H);

      // ─── RENDER ─────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#07090F';
      ctx.fillRect(0, 0, W, H);

      if (game.mode === 'explore') {
        renderExplore(ctx, game, W, H);
      } else {
        renderBattle(ctx, game, W, H);
      }

      drawRain(ctx, game.rain.particles, W, H);
      drawAtmosphere(ctx, W, H);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [handleDialogue, handleQTEComplete, requestEnemyAction, onEnding, triggerDamage]);

  // ─── Player Update ──────────────────────────────────────
  function updatePlayer(game, keys, dt) {
    const p = game.player;
    let dx = 0, dy = 0;
    if (keys['w'] || keys['W'] || keys['ArrowUp']) { dy = -1; p.dir = 'up'; }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) { dy = 1; p.dir = 'down'; }
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) { dx = -1; p.dir = 'left'; }
    if (keys['d'] || keys['D'] || keys['ArrowRight']) { dx = 1; p.dir = 'right'; }

    // Normalize diagonal
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    let speed = p.speed;

    // Mud slowdown (battle mode)
    if (game.mode === 'battle') {
      for (const obj of game.battle.objects) {
        if (obj.type === 'mud') {
          const dist = Math.hypot(p.x - obj.x, p.y - obj.y);
          if (dist < (obj.radius || 1.5)) { speed *= 0.5; break; }
        }
      }
    }

    // Dodge
    if (p.isDodging) {
      p.dodgeTimer -= dt;
      speed *= 2.5;
      if (p.dodgeTimer <= 0) { p.isDodging = false; p.invincible = 0; }
    }

    const newX = p.x + dx * speed * dt;
    const newY = p.y + dy * speed * dt;

    // Collision
    if (game.mode === 'explore') {
      const tileX = Math.floor(newX);
      const tileY = Math.floor(newY);
      if (tileX >= 0 && tileX < 30 && tileY >= 0 && tileY < 20) {
        const tile = VILLAGE_MAP[tileY]?.[tileX];
        if (!SOLID_TILES.includes(tile)) {
          p.x = newX;
          p.y = newY;
        }
      }
    } else {
      // Battle arena bounds
      if (newX > 0.5 && newX < BATTLE_ARENA.width - 0.5) p.x = newX;
      if (newY > 0.5 && newY < BATTLE_ARENA.height - 0.5) p.y = newY;
    }

    // Attack
    if (p.isAttacking) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) p.isAttacking = false;
    }

    // Animation frame
    if (dx || dy) {
      if (game.frameCount % 10 === 0) p.frame = (p.frame + 1) % 4;
    }
  }

  // ─── Explore Update ─────────────────────────────────────
  function updateExplore(game, keys) {
    const p = game.player;

    // Check NPC interaction
    let nearNPC = null;
    for (const npc of game.npcs) {
      const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (dist < 2) { nearNPC = npc; break; }
    }

    if (nearNPC) {
      setEnvPrompt({ text: `[E] Talk to ${nearNPC.name}`, x: nearNPC.x, y: nearNPC.y });
      if (keys['e'] || keys['E']) {
        keys['e'] = false;
        keys['E'] = false;
        handleDialogue(nearNPC.id, nearNPC.name);
      }
    } else {
      setEnvPrompt(null);
    }

    // Check battle trigger
    if (p.x >= BATTLE_TRIGGER.minX && p.x <= BATTLE_TRIGGER.maxX &&
        p.y >= BATTLE_TRIGGER.minY && p.y <= BATTLE_TRIGGER.maxY) {
      game.mode = 'battle';
      game.player.x = BATTLE_ARENA.playerSpawn.x;
      game.player.y = BATTLE_ARENA.playerSpawn.y;
      game.player.hp = game.player.maxHp;
      setMode('battle');
      setPlayerHp(game.player.maxHp);
      setBossHp(100);
      setEnvPrompt(null);
      setBattleDialogue({ speaker: 'Kairen', text: 'So... the prophecy child stands before me. How disappointing.' });
      setTimeout(() => setBattleDialogue(null), 4000);
    }
  }

  // ─── Battle Update ──────────────────────────────────────
  function updateBattle(game, keys, dt) {
    const p = game.player;
    const k = game.battle.kairen;

    game.battle.timer += dt;

    // Player actions
    if (!game.qteActive && !game.dialogueActive) {
      // Attack
      if ((keys[' '] || keys['Space']) && !p.isAttacking) {
        keys[' '] = false;
        p.isAttacking = true;
        p.attackTimer = 0.3;

        // Check hit on Kairen
        const dist = Math.hypot(p.x - k.x, p.y - k.y);
        if (dist < 2 && k.state !== 'stunned') {
          const dmg = 5;
          k.hp = Math.max(0, k.hp - dmg);
          setBossHp(k.hp);
          game.battle.damageNumbers.push({ dmg, x: k.x, y: k.y, age: 0 });
        } else if (dist < 2 && k.state === 'stunned') {
          const dmg = 15; // Critical on stunned
          k.hp = Math.max(0, k.hp - dmg);
          setBossHp(k.hp);
          game.battle.damageNumbers.push({ dmg, x: k.x, y: k.y, age: 0 });
        }
      }

      // Pick up rock
      if (keys['e'] || keys['E']) {
        keys['e'] = false;
        keys['E'] = false;
        for (const obj of game.battle.objects) {
          if (obj.type === 'rock_small' && !obj.pickedUp) {
            const dist = Math.hypot(p.x - obj.x, p.y - obj.y);
            if (dist < 1.5) {
              obj.pickedUp = true;
              p.inventory.push('rock');
              setInventory([...p.inventory]);
              break;
            }
          }
        }
      }

      // Throw rock
      if ((keys['q'] || keys['Q']) && p.inventory.includes('rock')) {
        keys['q'] = false;
        keys['Q'] = false;
        p.inventory.splice(p.inventory.indexOf('rock'), 1);
        setInventory([...p.inventory]);
        const angle = Math.atan2(k.y - p.y, k.x - p.x);
        game.battle.projectiles.push({
          x: p.x, y: p.y,
          vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8,
          life: 1.5,
        });
      }

      // Dodge
      if ((keys['Shift']) && !p.isDodging && p.dodgeTimer <= 0) {
        p.isDodging = true;
        p.dodgeTimer = 0.3;
        p.invincible = 0.3;
      }
    }

    // Update projectiles
    game.battle.projectiles = game.battle.projectiles.filter((proj) => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      // Hit Kairen
      const dist = Math.hypot(proj.x - k.x, proj.y - k.y);
      if (dist < 1.5) {
        const dmg = 8;
        k.hp = Math.max(0, k.hp - dmg);
        setBossHp(k.hp);
        game.battle.damageNumbers.push({ dmg, x: k.x, y: k.y, age: 0 });
        return false;
      }
      return proj.life > 0;
    });

    // Update damage numbers
    game.battle.damageNumbers = game.battle.damageNumbers.filter((d) => {
      d.age += dt;
      return d.age < 1;
    });

    // Invincibility timer
    if (p.invincible > 0) p.invincible -= dt;

    // ─── Kairen AI ──────────────────────────────────
    if (k.state === 'stunned') {
      k.stunTimer -= dt;
      if (k.stunTimer <= 0) {
        k.state = 'idle';
        k.stunTimer = 0;
      }
    } else if (k.state === 'recovering') {
      k.recoverTimer -= dt;
      if (k.recoverTimer <= 0) k.state = 'idle';
    } else if (k.state === 'telegraph') {
      k.telegraphTimer -= dt;
      if (k.telegraphTimer <= 0) {
        // Trigger QTE
        const atk = KAIREN_ATTACKS[k.currentAttack] || KAIREN_ATTACKS.heavy_slash;
        const dist = Math.hypot(p.x - k.x, p.y - k.y);
        if (dist < atk.range + 1) {
          game.qteActive = true;
          const dirs = ['up', 'down', 'left', 'right'];
          const seq = k.qteSequence || Array.from({ length: atk.qteLength }, () => dirs[Math.floor(Math.random() * 4)]);
          setQte({ sequence: seq });
          k.state = 'attacking';
        } else {
          k.state = 'idle';
          k.currentAttack = null;
        }
      }
    } else if (k.state === 'idle' || k.state === 'chasing') {
      const dist = Math.hypot(p.x - k.x, p.y - k.y);

      // Check if player is hidden behind a tree
      let playerHidden = false;
      for (const obj of game.battle.objects) {
        if (obj.type === 'tree') {
          const treeDist = Math.hypot(obj.x - p.x, obj.y - p.y);
          const treeToKairen = Math.hypot(obj.x - k.x, obj.y - k.y);
          if (treeDist < 1.5 && treeToKairen < dist) {
            playerHidden = true;
            break;
          }
        }
      }

      if (playerHidden) {
        // Wander
        k.x += (Math.random() - 0.5) * KAIREN_SPEED * dt;
        k.y += (Math.random() - 0.5) * KAIREN_SPEED * dt;
      } else if (dist > 2.5) {
        // Chase
        const angle = Math.atan2(p.y - k.y, p.x - k.x);
        let kSpeed = KAIREN_SPEED;
        // Mud slowdown
        for (const obj of game.battle.objects) {
          if (obj.type === 'mud') {
            const mudDist = Math.hypot(k.x - obj.x, k.y - obj.y);
            if (mudDist < (obj.radius || 1.5)) { kSpeed *= 0.4; break; }
          }
        }
        k.x += Math.cos(angle) * kSpeed * dt;
        k.y += Math.sin(angle) * kSpeed * dt;
        k.state = 'chasing';
        k.dir = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))
          ? (Math.cos(angle) > 0 ? 'right' : 'left')
          : (Math.sin(angle) > 0 ? 'down' : 'up');
      } else {
        // In range - decide attack
        k.aiCooldown -= dt;
        if (k.aiCooldown <= 0) {
          k.aiCooldown = 2 + Math.random() * 2;
          // Pick attack
          const attacks = Object.keys(KAIREN_ATTACKS);
          const chosen = attacks[Math.floor(Math.random() * attacks.length)];
          const atk = KAIREN_ATTACKS[chosen];
          k.currentAttack = chosen;
          k.state = 'telegraph';
          k.telegraphTimer = atk.telegraph;
          k.qteSequence = null;

          // Fire-and-forget AI request for dialogue
          requestEnemyAction(game).then((aiResult) => {
            if (aiResult?.dialogue) {
              setBattleDialogue({ speaker: 'Kairen', text: aiResult.dialogue });
              setTimeout(() => setBattleDialogue(null), 2500);
            }
            if (aiResult?.qte_sequence?.length > 0) {
              k.qteSequence = aiResult.qte_sequence;
            }
          });
        }
      }

      // Keep Kairen in bounds
      k.x = Math.max(1, Math.min(BATTLE_ARENA.width - 1, k.x));
      k.y = Math.max(1, Math.min(BATTLE_ARENA.height - 1, k.y));
    }

    // Kairen animation frame
    if (game.frameCount % 12 === 0) k.frame = (k.frame + 1) % 4;

    // ─── Scripted ending (after 45s or low HP) ──────
    if (!game.battle.finishTriggered && (game.battle.timer > 45 || p.hp <= 8)) {
      game.battle.finishTriggered = true;
      setBattleDialogue({ speaker: 'Kairen', text: 'This ends now, child.' });
      setTimeout(() => {
        p.hp = 0;
        setPlayerHp(0);
        triggerDamage();
        setTimeout(() => onEnding(), 2000);
      }, 2500);
    }

    // Env prompt for nearby rocks
    let nearObj = null;
    for (const obj of game.battle.objects) {
      if (obj.type === 'rock_small' && !obj.pickedUp) {
        const dist = Math.hypot(p.x - obj.x, p.y - obj.y);
        if (dist < 1.5) { nearObj = obj; break; }
      }
    }
    if (nearObj && !game.qteActive) {
      setEnvPrompt({ text: '[E] Pick up rock', x: nearObj.x, y: nearObj.y });
    } else if (mode === 'battle') {
      setEnvPrompt(null);
    }
  }

  // ─── Rain Update ────────────────────────────────────────
  function updateRain(game, dt, W, H) {
    for (const p of game.rain.particles) {
      p.y += p.speed * dt;
      p.x -= p.speed * 0.15 * dt;
      if (p.y > H) { p.y = -p.length; p.x = Math.random() * (W + 200); }
      if (p.x < -20) p.x = W + 20;
    }
  }

  // ─── Camera Update ──────────────────────────────────────
  function updateCamera(game, W, H) {
    const targetX = game.player.x * TILE_SIZE - W / 2;
    const targetY = game.player.y * TILE_SIZE - H / 2;
    game.camera.x += (targetX - game.camera.x) * 0.08;
    game.camera.y += (targetY - game.camera.y) * 0.08;
  }

  // ─── Render Explore ─────────────────────────────────────
  function renderExplore(ctx, game, W, H) {
    const camX = game.camera.x;
    const camY = game.camera.y;

    // Tiles
    const startTileX = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const startTileY = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const endTileX = Math.min(30, Math.ceil((camX + W) / TILE_SIZE) + 1);
    const endTileY = Math.min(20, Math.ceil((camY + H) / TILE_SIZE) + 1);

    // Ground pass
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = VILLAGE_MAP[y]?.[x] ?? 0;
        if (tile !== VILLAGE_MAP[y]?.[x] && tile === undefined) continue;
        drawTile(ctx, tile, x, y, camX, camY);
      }
    }

    // Tree bases
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        if (VILLAGE_MAP[y]?.[x] === 2) drawTreeBase(ctx, x, y, camX, camY);
      }
    }

    // Entities (depth sorted)
    const entities = [];
    entities.push({ type: 'player', y: game.player.y });
    for (const npc of game.npcs) entities.push({ type: 'npc', data: npc, y: npc.y });
    // Trees tops
    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = startTileX; tx < endTileX; tx++) {
        if (VILLAGE_MAP[ty]?.[tx] === 2) entities.push({ type: 'treetop', x: tx, y: ty });
      }
    }

    entities.sort((a, b) => a.y - b.y);

    for (const ent of entities) {
      if (ent.type === 'player') {
        drawPlayer(ctx, game.player.x, game.player.y, game.player.dir, game.player.frame, camX, camY, game.player.isAttacking);
      } else if (ent.type === 'npc') {
        drawNPC(ctx, ent.data, camX, camY, game.frameCount);
      } else if (ent.type === 'treetop') {
        drawTreeTop(ctx, ent.x, ent.y, camX, camY);
      }
    }

    // Interact indicator
    if (envPrompt) {
      drawInteractIndicator(ctx, envPrompt.x, envPrompt.y, camX, camY, envPrompt.text);
    }
  }

  // ─── Render Battle ──────────────────────────────────────
  function renderBattle(ctx, game, W, H) {
    const camX = game.camera.x;
    const camY = game.camera.y;

    drawBattleGround(ctx, W, H, camX, camY, BATTLE_ARENA.width, BATTLE_ARENA.height);

    // Objects (ground layer: mud first)
    for (const obj of game.battle.objects) {
      if (obj.type === 'mud') drawBattleObject(ctx, obj, camX, camY);
    }

    // Depth sort everything
    const entities = [];
    entities.push({ type: 'player', y: game.player.y });
    entities.push({ type: 'kairen', y: game.battle.kairen.y });
    for (const obj of game.battle.objects) {
      if (obj.type !== 'mud') {
        entities.push({ type: 'object', data: obj, y: obj.y });
        if (obj.type === 'tree') entities.push({ type: 'treetop', data: obj, y: obj.y - 0.5 });
      }
    }
    for (const proj of game.battle.projectiles) {
      entities.push({ type: 'projectile', data: proj, y: proj.y });
    }

    entities.sort((a, b) => a.y - b.y);

    for (const ent of entities) {
      if (ent.type === 'player') {
        drawPlayer(ctx, game.player.x, game.player.y, game.player.dir, game.player.frame, camX, camY, game.player.isAttacking);
      } else if (ent.type === 'kairen') {
        const k = game.battle.kairen;
        drawKairen(ctx, k.x, k.y, k.dir, k.frame, k.state, camX, camY, k.hp, k.maxHp);
      } else if (ent.type === 'object') {
        drawBattleObject(ctx, ent.data, camX, camY);
      } else if (ent.type === 'treetop') {
        drawBattleObjectTop(ctx, ent.data, camX, camY);
      } else if (ent.type === 'projectile') {
        drawProjectile(ctx, ent.data, camX, camY);
      }
    }

    // Damage numbers
    for (const d of game.battle.damageNumbers) {
      drawDamageNumber(ctx, d.dmg, d.x, d.y, d.age, camX, camY);
    }
  }

  return (
    <div className={`game-container ${screenShake ? 'screen-shake' : ''}`} data-testid="game-world">
      <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />

      {/* HUD */}
      <PlayerHUD hp={playerHp} maxHp={50} />
      {mode === 'battle' && <BossBar hp={bossHp} maxHp={100} name="KAIREN" />}
      <InventoryDisplay items={inventory} />
      <ControlsHelp mode={mode} />

      {/* Dialogue */}
      <AnimatePresence>
        {dialogue && (
          <DialogueBox
            speaker={dialogue.speaker}
            text={dialogue.text}
            isTyping={dialogue.typing}
          />
        )}
      </AnimatePresence>

      {/* Battle Dialogue (Kairen taunts) */}
      <AnimatePresence>
        {battleDialogue && !dialogue && (
          <DialogueBox
            speaker={battleDialogue.speaker}
            text={battleDialogue.text}
            isTyping={false}
          />
        )}
      </AnimatePresence>

      {/* QTE */}
      {qte && <QTEOverlay sequence={qte.sequence} onComplete={handleQTEComplete} />}

      {/* Damage Flash */}
      <AnimatePresence>
        {damageFlash && <DamageFlash />}
      </AnimatePresence>
    </div>
  );
}
