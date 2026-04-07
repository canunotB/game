import { TILES, TILE_SIZE, COLORS } from './gameData';

// ─── Tile Rendering ─────────────────────────────────────
export function drawTile(ctx, type, worldX, worldY, camX, camY) {
  const sx = worldX * TILE_SIZE - camX;
  const sy = worldY * TILE_SIZE - camY;
  const s = TILE_SIZE;

  switch (type) {
    case TILES.GRASS: {
      const ci = (worldX * 7 + worldY * 13) % COLORS.grass.length;
      ctx.fillStyle = COLORS.grass[ci];
      ctx.fillRect(sx, sy, s, s);
      // grass tufts
      if ((worldX + worldY) % 3 === 0) {
        ctx.fillStyle = '#3a6b20';
        ctx.fillRect(sx + 10, sy + 20, 2, 6);
        ctx.fillRect(sx + 30, sy + 12, 2, 5);
      }
      break;
    }
    case TILES.PATH: {
      const ci = (worldX + worldY) % COLORS.path.length;
      ctx.fillStyle = COLORS.path[ci];
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(sx + 8, sy + 15, 3, 3);
      ctx.fillRect(sx + 28, sy + 32, 4, 2);
      break;
    }
    case TILES.CLIFF:
      ctx.fillStyle = COLORS.cliff;
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(sx, sy, s, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(sx, sy + s - 4, s, 4);
      break;
    case TILES.WATER:
      ctx.fillStyle = COLORS.water;
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      const waveOff = Math.sin(Date.now() / 600 + worldX) * 3;
      ctx.fillRect(sx + 5, sy + 12 + waveOff, 20, 2);
      ctx.fillRect(sx + 18, sy + 28 - waveOff, 16, 2);
      break;
    case TILES.BUILDING:
      ctx.fillStyle = COLORS.building;
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(sx, sy, s, 4);
      ctx.fillStyle = 'rgba(197,160,89,0.3)';
      ctx.fillRect(sx + 16, sy + 18, 14, 14);
      break;
    case TILES.MUD:
      ctx.fillStyle = COLORS.grass[0];
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = COLORS.mud;
      ctx.beginPath();
      ctx.ellipse(sx + s / 2, sy + s / 2, s / 2.2, s / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case TILES.FLOWERS: {
      const ci2 = (worldX * 7 + worldY * 13) % COLORS.grass.length;
      ctx.fillStyle = COLORS.grass[ci2];
      ctx.fillRect(sx, sy, s, s);
      const flowerColors = ['#e8a0bf', '#f0c040', '#a0d0ff'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = flowerColors[i % 3];
        const fx = sx + 6 + ((i * 11) % 30);
        const fy = sy + 8 + ((i * 17) % 28);
        ctx.fillRect(fx, fy, 4, 4);
      }
      break;
    }
    default: {
      const ci3 = (worldX * 7 + worldY * 13) % COLORS.grass.length;
      ctx.fillStyle = COLORS.grass[ci3];
      ctx.fillRect(sx, sy, s, s);
    }
  }
}

// ─── Tree (drawn as separate entity for depth sorting) ──
export function drawTreeBase(ctx, x, y, camX, camY) {
  const sx = x * TILE_SIZE - camX;
  const sy = y * TILE_SIZE - camY;
  // trunk
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(sx + 18, sy + 20, 12, 28);
  ctx.fillStyle = '#4a2e16';
  ctx.fillRect(sx + 18, sy + 20, 3, 28);
}

export function drawTreeTop(ctx, x, y, camX, camY) {
  const sx = x * TILE_SIZE - camX;
  const sy = y * TILE_SIZE - camY;
  // foliage layers
  ctx.fillStyle = '#1a5c10';
  ctx.beginPath();
  ctx.moveTo(sx + 24, sy - 20);
  ctx.lineTo(sx + 4, sy + 16);
  ctx.lineTo(sx + 44, sy + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#22701a';
  ctx.beginPath();
  ctx.moveTo(sx + 24, sy - 10);
  ctx.lineTo(sx + 8, sy + 22);
  ctx.lineTo(sx + 40, sy + 22);
  ctx.closePath();
  ctx.fill();
}

// ─── Characters ─────────────────────────────────────────
export function drawPlayer(ctx, x, y, dir, frame, camX, camY, isAttacking) {
  const sx = x * TILE_SIZE - camX;
  const sy = y * TILE_SIZE - camY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 8, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const bobY = frame % 2 === 0 ? 0 : -2;

  // Body
  ctx.fillStyle = '#e8dcc8'; // tunic
  ctx.fillRect(sx - 8, sy - 16 + bobY, 16, 18);

  // Belt
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(sx - 8, sy - 2 + bobY, 16, 3);

  // Head
  ctx.fillStyle = '#f0d0a0'; // skin
  ctx.fillRect(sx - 7, sy - 28 + bobY, 14, 13);

  // Hair
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(sx - 8, sy - 30 + bobY, 16, 7);
  if (dir === 'left') ctx.fillRect(sx - 9, sy - 28 + bobY, 3, 10);
  if (dir === 'right') ctx.fillRect(sx + 6, sy - 28 + bobY, 3, 10);

  // Eyes
  if (dir !== 'up') {
    ctx.fillStyle = '#1a1a2e';
    const eyeOff = dir === 'left' ? -3 : dir === 'right' ? 1 : -1;
    ctx.fillRect(sx + eyeOff - 1, sy - 22 + bobY, 2, 3);
    ctx.fillRect(sx + eyeOff + 4, sy - 22 + bobY, 2, 3);
  }

  // Legs
  ctx.fillStyle = '#6b4423';
  const legAnim = frame % 2 === 0 ? 2 : -2;
  ctx.fillRect(sx - 5, sy + 2 + bobY, 5, 10 + legAnim);
  ctx.fillRect(sx + 1, sy + 2 + bobY, 5, 10 - legAnim);

  // Attack slash effect
  if (isAttacking) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 3;
    const slashAngle = dir === 'right' ? 0 : dir === 'left' ? Math.PI : dir === 'up' ? -Math.PI / 2 : Math.PI / 2;
    ctx.beginPath();
    ctx.arc(sx, sy - 10, 30, slashAngle - 0.8, slashAngle + 0.8);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawKairen(ctx, x, y, dir, frame, state, camX, camY, hp, maxHp) {
  const sx = x * TILE_SIZE - camX;
  const sy = y * TILE_SIZE - camY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 10, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const bobY = state === 'stunned' ? 3 : frame % 2 === 0 ? 0 : -1;

  // Armor body
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 12, sy - 24 + bobY, 24, 26);

  // Shoulder pads
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(sx - 15, sy - 22 + bobY, 6, 8);
  ctx.fillRect(sx + 9, sy - 22 + bobY, 6, 8);

  // Chest plate detail
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(sx - 6, sy - 18 + bobY, 12, 4);

  // Head / Helmet
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(sx - 9, sy - 38 + bobY, 18, 15);
  // Visor
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(sx - 5, sy - 30 + bobY, 10, 3);

  // Sword (right side)
  if (state === 'telegraph') {
    // Raised sword - glowing
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(sx + 14, sy - 50 + bobY, 4, 30);
    ctx.fillStyle = 'rgba(197,160,89,0.5)';
    ctx.fillRect(sx + 12, sy - 52 + bobY, 8, 34);
  } else {
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(sx + 14, sy - 20 + bobY, 3, 24);
    // Hilt
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(sx + 12, sy - 20 + bobY, 7, 4);
  }

  // Shield (left side)
  if (state !== 'stunned') {
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(sx - 18, sy - 18 + bobY, 8, 16);
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(sx - 16, sy - 14 + bobY, 4, 8);
  }

  // Legs
  ctx.fillStyle = '#2a2a35';
  const lAnim = frame % 2 === 0 ? 2 : -2;
  ctx.fillRect(sx - 8, sy + 2 + bobY, 7, 14 + lAnim);
  ctx.fillRect(sx + 1, sy + 2 + bobY, 7, 14 - lAnim);

  // Boots
  ctx.fillStyle = '#1a1a25';
  ctx.fillRect(sx - 9, sy + 14 + bobY + lAnim, 8, 4);
  ctx.fillRect(sx + 1, sy + 14 + bobY - lAnim, 8, 4);

  // Stun stars
  if (state === 'stunned') {
    ctx.fillStyle = '#fbbf24';
    const t = Date.now() / 200;
    for (let i = 0; i < 3; i++) {
      const a = t + (i * Math.PI * 2) / 3;
      ctx.fillRect(sx + Math.cos(a) * 16, sy - 42 + Math.sin(a) * 8, 4, 4);
    }
  }

  // Telegraph glow
  if (state === 'telegraph') {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 100) * 0.1;
    ctx.fillStyle = '#D92D20';
    ctx.beginPath();
    ctx.arc(sx, sy - 10, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawNPC(ctx, npc, camX, camY, frame) {
  const sx = npc.x * TILE_SIZE - camX;
  const sy = npc.y * TILE_SIZE - camY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 6, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (npc.sprite === 'elder') {
    // Robe
    ctx.fillStyle = '#6b6b7b';
    ctx.fillRect(sx - 8, sy - 18, 16, 22);
    // Head
    ctx.fillStyle = '#e0c8a0';
    ctx.fillRect(sx - 6, sy - 28, 12, 11);
    // Beard
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(sx - 4, sy - 19, 8, 6);
    // Staff
    ctx.fillStyle = '#7a5a30';
    ctx.fillRect(sx + 10, sy - 34, 3, 40);
    ctx.fillStyle = '#C5A059';
    ctx.fillRect(sx + 9, sy - 36, 5, 5);
  } else {
    // Lyra - blue dress
    ctx.fillStyle = '#4a6a9a';
    ctx.fillRect(sx - 7, sy - 14, 14, 18);
    // Head
    ctx.fillStyle = '#f0d0a0';
    ctx.fillRect(sx - 6, sy - 24, 12, 11);
    // Blonde hair
    ctx.fillStyle = '#d4a030';
    ctx.fillRect(sx - 7, sy - 26, 14, 6);
    ctx.fillRect(sx - 7, sy - 22, 3, 10);
    ctx.fillRect(sx + 4, sy - 22, 3, 10);
    // Eyes
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(sx - 3, sy - 19, 2, 2);
    ctx.fillRect(sx + 2, sy - 19, 2, 2);
  }

  // Name tag
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = '10px "JetBrains Mono"';
  ctx.textAlign = 'center';
  const nameW = ctx.measureText(npc.name).width;
  ctx.fillRect(sx - nameW / 2 - 3, sy - 42, nameW + 6, 14);
  ctx.fillStyle = '#C5A059';
  ctx.fillText(npc.name, sx, sy - 32);
}

// ─── Battle Objects ─────────────────────────────────────
export function drawBattleObject(ctx, obj, camX, camY) {
  const sx = obj.x * TILE_SIZE - camX;
  const sy = obj.y * TILE_SIZE - camY;

  switch (obj.type) {
    case 'rock_small':
      if (obj.pickedUp) return;
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(sx - 3, sy - 4, 4, 3);
      break;
    case 'rock_large':
      ctx.fillStyle = '#5a5a5a';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(sx - 8, sy - 10, 12, 8);
      break;
    case 'tree':
      drawTreeBase(ctx, obj.x, obj.y, camX, camY);
      break;
    case 'mud':
      ctx.fillStyle = COLORS.mud;
      ctx.beginPath();
      ctx.ellipse(sx, sy, (obj.radius || 1.5) * TILE_SIZE, (obj.radius || 1.5) * TILE_SIZE * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ripples
      ctx.strokeStyle = 'rgba(74, 60, 49, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx + 10, sy - 5, 8, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    default:
      break;
  }
}

export function drawBattleObjectTop(ctx, obj, camX, camY) {
  if (obj.type === 'tree') {
    drawTreeTop(ctx, obj.x, obj.y, camX, camY);
  }
}

// ─── Weather ────────────────────────────────────────────
export function drawRain(ctx, particles, width, height) {
  ctx.strokeStyle = COLORS.rain;
  ctx.lineWidth = 1;
  for (const p of particles) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - 2, p.y + p.length);
    ctx.stroke();
  }
}

// ─── Battle Ground (perspective) ────────────────────────
export function drawBattleGround(ctx, width, height, camX, camY, arenaW, arenaH) {
  // Ground with subtle gradient
  for (let y = 0; y < arenaH; y++) {
    for (let x = 0; x < arenaW; x++) {
      const sx = x * TILE_SIZE - camX;
      const sy = y * TILE_SIZE - camY;
      const ci = (x * 7 + y * 13) % COLORS.grass.length;
      ctx.fillStyle = COLORS.grass[ci];
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    }
  }

  // Arena border / cliff edges
  ctx.strokeStyle = 'rgba(197, 160, 89, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-camX, -camY, arenaW * TILE_SIZE, arenaH * TILE_SIZE);
}

// ─── Interaction indicator ──────────────────────────────
export function drawInteractIndicator(ctx, x, y, camX, camY, text) {
  const sx = x * TILE_SIZE - camX;
  const sy = y * TILE_SIZE - camY - 50;
  const bounce = Math.sin(Date.now() / 300) * 3;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = '11px "JetBrains Mono"';
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width;
  ctx.fillRect(sx - w / 2 - 6, sy + bounce - 8, w + 12, 18);
  ctx.fillStyle = '#C5A059';
  ctx.fillText(text, sx, sy + bounce + 4);
}

// ─── Thrown rock projectile ─────────────────────────────
export function drawProjectile(ctx, proj, camX, camY) {
  const sx = proj.x * TILE_SIZE - camX;
  const sy = proj.y * TILE_SIZE - camY;
  ctx.fillStyle = '#8a8a8a';
  ctx.beginPath();
  ctx.arc(sx, sy, 5, 0, Math.PI * 2);
  ctx.fill();
  // Trail
  ctx.fillStyle = 'rgba(138,138,138,0.3)';
  ctx.beginPath();
  ctx.arc(sx - proj.vx * 8, sy - proj.vy * 8, 3, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Damage number popup ────────────────────────────────
export function drawDamageNumber(ctx, dmg, x, y, age, camX, camY) {
  const sx = x * TILE_SIZE - camX;
  const sy = y * TILE_SIZE - camY - 20 - age * 30;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age);
  ctx.font = 'bold 16px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#D92D20';
  ctx.fillText(`-${dmg}`, sx, sy);
  ctx.restore();
}

// ─── Fog / Atmosphere ───────────────────────────────────
export function drawAtmosphere(ctx, width, height) {
  // Vignette
  const grad = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
