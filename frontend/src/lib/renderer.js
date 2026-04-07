// ═══ ISOMETRIC CONSTANTS ═══
export const ISO_W = 64;
export const ISO_H = 32;
export const ISO_D = 18;

// ═══ PROJECTION ═══
export function toScreen(wx, wy, camX, camY) {
  return {
    x: (wx - wy) * ISO_W / 2 - camX,
    y: (wx + wy) * ISO_H / 2 - camY,
  };
}

// ═══ COLORS (Elden Ring dark palette) ═══
const GRASS_TOP = ['#1e3512', '#223a14', '#1a3010', '#264018', '#1e3816'];
const GRASS_LEFT = '#0e1a08';
const GRASS_RIGHT = '#142a0c';
const PATH_TOP = ['#4a4038', '#524a40', '#464038'];
const PATH_LEFT = '#2a241e';
const PATH_RIGHT = '#3a342c';
const CLIFF_TOP = '#2a2a2e';
const CLIFF_LEFT = '#141418';
const CLIFF_RIGHT = '#1e1e22';
const CLIFF_D = 40;
const BLDG_TOP = '#3a342c';
const BLDG_LEFT = '#4a4238';
const BLDG_RIGHT = '#5a524a';
const BLDG_D = 36;
const WATER_TOP = '#0a2040';
const RUINS_TOP = '#4a4a40';
const MUD_TOP = '#2e2218';
const FLOWER_TOP = GRASS_TOP;

function v(wx, wy) { return (wx * 7 + wy * 13) % 5; }

// ═══ ISO TILE ═══
function diamond(ctx, sx, sy, hw, hh) {
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
}

export function drawIsoTile(ctx, wx, wy, type, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  const hw = ISO_W / 2, hh = ISO_H / 2;
  let depth = ISO_D, topC, leftC, rightC;

  switch (type) {
    case 0: case 8: // grass / flowers
      topC = GRASS_TOP[v(wx, wy)]; leftC = GRASS_LEFT; rightC = GRASS_RIGHT; break;
    case 1: // path
      topC = PATH_TOP[v(wx, wy) % 3]; leftC = PATH_LEFT; rightC = PATH_RIGHT; break;
    case 4: // cliff
      topC = CLIFF_TOP; leftC = CLIFF_LEFT; rightC = CLIFF_RIGHT; depth = CLIFF_D; break;
    case 5: // building
      topC = BLDG_TOP; leftC = BLDG_LEFT; rightC = BLDG_RIGHT; depth = BLDG_D; break;
    case 6: // water
      topC = WATER_TOP; leftC = '#061828'; rightC = '#0a2030'; break;
    case 7: // mud
      topC = MUD_TOP; leftC = '#1a1408'; rightC = '#221a0e'; break;
    case 9: // ruins
      topC = RUINS_TOP; leftC = '#2a2a24'; rightC = '#3a3a34'; depth = 24; break;
    default:
      topC = GRASS_TOP[0]; leftC = GRASS_LEFT; rightC = GRASS_RIGHT;
  }

  // Top face
  ctx.fillStyle = topC;
  ctx.beginPath(); diamond(ctx, sx, sy, hw, hh); ctx.fill();

  // Left face
  ctx.fillStyle = leftC;
  ctx.beginPath();
  ctx.moveTo(sx - hw, sy); ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx, sy + hh + depth); ctx.lineTo(sx - hw, sy + depth);
  ctx.closePath(); ctx.fill();

  // Right face
  ctx.fillStyle = rightC;
  ctx.beginPath();
  ctx.moveTo(sx + hw, sy); ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx, sy + hh + depth); ctx.lineTo(sx + hw, sy + depth);
  ctx.closePath(); ctx.fill();

  // Top face details
  if (type === 0 || type === 8) {
    // Grass tufts
    if (v(wx, wy) < 3) {
      ctx.fillStyle = '#2a4c1a';
      ctx.fillRect(sx - 8, sy - 4, 2, 4);
      ctx.fillRect(sx + 6, sy + 2, 2, 3);
    }
    if (type === 8) {
      const fc = ['#c08090', '#d0a040', '#80a0d0'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = fc[i];
        ctx.fillRect(sx - 10 + i * 9, sy - 4 + (i * 7) % 6, 3, 3);
      }
    }
  } else if (type === 1) {
    // Path cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(sx + 4, sy + 3);
    ctx.stroke();
    // Moss
    if (v(wx, wy) === 0) {
      ctx.fillStyle = '#2a4020';
      ctx.fillRect(sx + 10, sy - 1, 4, 3);
    }
  } else if (type === 5) {
    // Window glow
    ctx.fillStyle = 'rgba(197,160,89,0.6)';
    ctx.fillRect(sx - 4, sy - 3, 4, 5);
    ctx.fillRect(sx + 2, sy - 2, 4, 4);
  } else if (type === 6) {
    // Water shimmer
    const wt = Date.now() / 800;
    ctx.fillStyle = 'rgba(60,120,180,0.15)';
    ctx.fillRect(sx - 10 + Math.sin(wt + wx) * 5, sy - 2, 12, 2);
    ctx.fillRect(sx + 2 + Math.cos(wt + wy) * 4, sy + 4, 10, 2);
  } else if (type === 9) {
    // Ruin cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 12, sy); ctx.lineTo(sx + 8, sy + 5);
    ctx.moveTo(sx + 5, sy - 6); ctx.lineTo(sx - 3, sy + 8);
    ctx.stroke();
    // Pillar stub
    ctx.fillStyle = '#5a5a50';
    ctx.fillRect(sx - 3, sy - 14, 6, 12);
    ctx.fillStyle = '#4a4a40';
    ctx.fillRect(sx - 4, sy - 16, 8, 3);
  }

  // Building window glow on side faces
  if (type === 5) {
    ctx.fillStyle = 'rgba(197,160,89,0.5)';
    ctx.fillRect(sx + 10, sy + 6, 6, 8);
    ctx.fillRect(sx - 18, sy + 4, 5, 7);
  }
}

// ═══ TREE ═══
export function drawIsoTree(ctx, wx, wy, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 10, 18, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Roots
  ctx.fillStyle = '#2a1e0e';
  ctx.fillRect(sx - 8, sy - 6, 4, 10);
  ctx.fillRect(sx + 4, sy - 4, 3, 8);

  // Trunk (gnarled)
  ctx.fillStyle = '#3a2810';
  ctx.fillRect(sx - 5, sy - 50, 10, 48);
  ctx.fillStyle = '#2e1e0a';
  ctx.fillRect(sx - 5, sy - 50, 3, 48);
  // Bark texture
  ctx.fillStyle = '#4a3818';
  ctx.fillRect(sx - 2, sy - 40, 3, 4);
  ctx.fillRect(sx + 1, sy - 28, 2, 5);
  ctx.fillRect(sx - 3, sy - 18, 2, 3);

  // Branches
  ctx.strokeStyle = '#3a2810';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 40); ctx.lineTo(sx - 18, sy - 55);
  ctx.moveTo(sx + 2, sy - 35); ctx.lineTo(sx + 20, sy - 48);
  ctx.moveTo(sx - 1, sy - 45); ctx.lineTo(sx - 10, sy - 62);
  ctx.stroke();

  // Foliage clusters (dark, sparse - Elden Ring style)
  const drawCluster = (cx, cy, r) => {
    ctx.fillStyle = '#0e2208';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a3410';
    ctx.beginPath(); ctx.arc(cx - 2, cy - 2, r * 0.7, 0, Math.PI * 2); ctx.fill();
  };
  drawCluster(sx - 16, sy - 56, 12);
  drawCluster(sx + 16, sy - 50, 10);
  drawCluster(sx - 8, sy - 64, 14);
  drawCluster(sx + 6, sy - 60, 11);
  drawCluster(sx, sy - 52, 13);
}

// ═══ PLAYER CHARACTER ═══
export function drawIsoPlayer(ctx, wx, wy, dir, frame, camX, camY, isAttacking, attackAngle, isDashing, dashTrail, jumpHeight = 0, comboCount = 1, isInvisible = false) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  const jh = jumpHeight || 0;

  // Dash afterimages
  if (dashTrail) {
    for (const t of dashTrail) {
      const { x: tx, y: ty } = toScreen(t.x, t.y, camX, camY);
      ctx.save(); ctx.globalAlpha = t.alpha * 0.3;
      drawPlayerBody(ctx, tx, ty, dir, 0);
      ctx.restore();
    }
  }

  // Shadow (shrinks when jumping)
  const shadowScale = Math.max(0.3, 1 - jh / 60);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 6, 10 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();

  // Invisible = semi-transparent
  if (isInvisible) { ctx.save(); ctx.globalAlpha = 0.25; }

  drawPlayerBody(ctx, sx, sy - jh, dir, frame);

  if (isInvisible) ctx.restore();

  // Attack slash (combo-aware)
  if (isAttacking && attackAngle !== undefined) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    const combo = comboCount || 1;
    if (combo === 1) {
      // Quick horizontal slash
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#C5A059'; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy - 10 - jh, 28, attackAngle - 0.6, attackAngle + 0.6);
      ctx.stroke();
    } else if (combo === 2) {
      // Upward diagonal
      ctx.strokeStyle = '#e0a030';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#e0a030'; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sx, sy - 14 - jh, 32, attackAngle - 0.8, attackAngle + 0.8);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - 14 - jh, 30, attackAngle - 0.5, attackAngle + 0.5);
      ctx.stroke();
    } else {
      // Spinning slash (full arc)
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(sx, sy - 12 - jh, 36, attackAngle - 1.2, attackAngle + 1.2);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - 12 - jh, 33, attackAngle - 0.9, attackAngle + 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Jump plunge indicator
  if (jh > 20) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#C5A059';
    ctx.beginPath();
    ctx.arc(sx, sy + 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPlayerBody(ctx, sx, sy, dir, frame) {
  const bob = frame % 2 === 0 ? 0 : -1;
  const legOff = frame % 2 === 0 ? 2 : -2;

  // Boots
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(sx - 5, sy - 2 + bob + legOff, 4, 4);
  ctx.fillRect(sx + 1, sy - 2 + bob - legOff, 4, 4);
  // Legs
  ctx.fillStyle = '#4a3828';
  ctx.fillRect(sx - 4, sy - 8 + bob, 3, 7 + legOff);
  ctx.fillRect(sx + 1, sy - 8 + bob, 3, 7 - legOff);
  // Body
  ctx.fillStyle = '#c8b89c';
  ctx.fillRect(sx - 6, sy - 18 + bob, 12, 11);
  ctx.fillStyle = '#a89878';
  ctx.fillRect(sx - 6, sy - 18 + bob, 2, 11);
  // Belt
  ctx.fillStyle = '#6a4a20';
  ctx.fillRect(sx - 6, sy - 9 + bob, 12, 2);
  ctx.fillStyle = '#c5a059';
  ctx.fillRect(sx - 1, sy - 9 + bob, 2, 2);
  // Arms
  ctx.fillStyle = '#d4b08c';
  ctx.fillRect(sx - 8, sy - 16 + bob, 3, 8);
  ctx.fillRect(sx + 5, sy - 16 + bob, 3, 8);
  // Head
  ctx.fillStyle = '#e0c0a0';
  ctx.fillRect(sx - 5, sy - 28 + bob, 10, 9);
  // Hair
  ctx.fillStyle = '#5a3618';
  ctx.fillRect(sx - 6, sy - 30 + bob, 12, 5);
  ctx.fillRect(sx - 6, sy - 28 + bob, 2, 6);
  ctx.fillRect(sx + 4, sy - 28 + bob, 2, 5);
  ctx.fillStyle = '#7a5028';
  ctx.fillRect(sx - 3, sy - 30 + bob, 3, 2);
  // Eyes
  if (dir !== 'up') {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(sx - 3, sy - 25 + bob, 2, 2);
    ctx.fillRect(sx + 1, sy - 25 + bob, 2, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 3, sy - 25 + bob, 1, 1);
    ctx.fillRect(sx + 1, sy - 25 + bob, 1, 1);
  }
}

// ═══ KAIREN ═══
export function drawIsoKairen(ctx, wx, wy, dir, frame, state, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  const bob = state === 'stunned' ? 3 : frame % 2 === 0 ? 0 : -1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 10, 16, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Telegraph glow
  if (state === 'telegraph') {
    ctx.save(); ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 80) * 0.1;
    ctx.fillStyle = '#D92D20';
    ctx.beginPath(); ctx.arc(sx, sy - 10, 50, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const legOff = frame % 2 === 0 ? 2 : -2;
  // Greaves
  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(sx - 7, sy - 4 + bob + legOff, 6, 8);
  ctx.fillRect(sx + 1, sy - 4 + bob - legOff, 6, 8);
  // Boots
  ctx.fillStyle = '#16161e';
  ctx.fillRect(sx - 8, sy + 3 + bob + legOff, 7, 5);
  ctx.fillRect(sx + 1, sy + 3 + bob - legOff, 7, 5);

  // Cape
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(sx - 10, sy - 32 + bob, 20, 30);
  ctx.fillStyle = '#2a1010';
  ctx.fillRect(sx - 8, sy - 30 + bob, 16, 26);

  // Armor torso
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 10, sy - 30 + bob, 20, 22);
  // Chest plate
  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(sx - 8, sy - 26 + bob, 16, 6);
  // Gold trim
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 10, sy - 30 + bob, 20, 2);
  ctx.fillRect(sx - 1, sy - 28 + bob, 2, 18);

  // Pauldrons
  ctx.fillStyle = '#2e2e3a';
  ctx.fillRect(sx - 14, sy - 30 + bob, 6, 8);
  ctx.fillRect(sx + 8, sy - 30 + bob, 6, 8);
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 14, sy - 32 + bob, 6, 3);
  ctx.fillRect(sx + 8, sy - 32 + bob, 6, 3);

  // Gauntlets
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 14, sy - 22 + bob, 5, 10);
  ctx.fillRect(sx + 9, sy - 22 + bob, 5, 10);

  // Helmet
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 8, sy - 44 + bob, 16, 15);
  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(sx - 6, sy - 42 + bob, 12, 4);
  // Visor glow
  ctx.fillStyle = '#D92D20';
  ctx.shadowColor = '#D92D20';
  ctx.shadowBlur = 8;
  ctx.fillRect(sx - 5, sy - 38 + bob, 10, 3);
  ctx.shadowBlur = 0;
  // Helm crest
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(sx - 1, sy - 48 + bob, 2, 6);

  // Shield (left)
  if (state !== 'stunned') {
    ctx.fillStyle = '#3a3a48';
    ctx.fillRect(sx - 20, sy - 24 + bob, 8, 16);
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(sx - 18, sy - 20 + bob, 4, 8);
  }

  // Sword (right)
  if (state === 'telegraph') {
    ctx.fillStyle = '#b0b0b8';
    ctx.fillRect(sx + 14, sy - 60 + bob, 4, 36);
    ctx.fillStyle = 'rgba(197,160,89,0.5)';
    ctx.fillRect(sx + 12, sy - 62 + bob, 8, 40);
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(sx + 12, sy - 24 + bob, 8, 4);
  } else {
    ctx.fillStyle = '#a0a0a8';
    ctx.fillRect(sx + 14, sy - 26 + bob, 3, 24);
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(sx + 12, sy - 26 + bob, 7, 3);
  }

  // Stun stars
  if (state === 'stunned') {
    ctx.fillStyle = '#fbbf24';
    const t = Date.now() / 200;
    for (let i = 0; i < 3; i++) {
      const a = t + (i * Math.PI * 2) / 3;
      ctx.fillRect(sx + Math.cos(a) * 18, sy - 50 + Math.sin(a) * 8, 4, 4);
    }
  }
}

// ═══ NPC ═══
export function drawIsoNPC(ctx, npc, camX, camY, frame) {
  const { x: sx, y: sy } = toScreen(npc.x, npc.y, camX, camY);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

  if (npc.sprite === 'elder') {
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(sx - 7, sy - 22, 14, 22);
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(sx - 7, sy - 22, 3, 22);
    ctx.fillStyle = '#e0c8a0'; ctx.fillRect(sx - 5, sy - 30, 10, 9);
    ctx.fillStyle = '#b0b0b0'; ctx.fillRect(sx - 4, sy - 22, 8, 7);
    ctx.fillStyle = '#5a5a4a'; ctx.fillRect(sx - 8, sy - 28, 16, 4);
    ctx.fillStyle = '#6a5030'; ctx.fillRect(sx + 9, sy - 38, 3, 34);
    ctx.fillStyle = '#C5A059'; ctx.fillRect(sx + 8, sy - 40, 5, 5);
  } else {
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(sx - 6, sy - 18, 12, 18);
    ctx.fillStyle = '#2a4a7a'; ctx.fillRect(sx - 6, sy - 18, 3, 18);
    ctx.fillStyle = '#e0c0a0'; ctx.fillRect(sx - 5, sy - 28, 10, 10);
    ctx.fillStyle = '#c49030'; ctx.fillRect(sx - 6, sy - 30, 12, 5);
    ctx.fillRect(sx - 6, sy - 26, 2, 10); ctx.fillRect(sx + 4, sy - 26, 2, 10);
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(sx - 2, sy - 23, 2, 2); ctx.fillRect(sx + 1, sy - 23, 2, 2);
  }

  // Name tag
  ctx.font = '10px "JetBrains Mono"';
  ctx.textAlign = 'center';
  const w = ctx.measureText(npc.name).width;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - w / 2 - 3, sy - 44, w + 6, 14);
  ctx.fillStyle = '#C5A059';
  ctx.fillText(npc.name, sx, sy - 34);
}

// ═══ BATTLE OBJECTS ═══
export function drawIsoBattleObj(ctx, obj, camX, camY) {
  const { x: sx, y: sy } = toScreen(obj.x, obj.y, camX, camY);
  if (obj.type === 'rock_small' && !obj.pickedUp) {
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath(); ctx.ellipse(sx, sy, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(sx - 2, sy - 3, 3, 2);
  } else if (obj.type === 'rock_large') {
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.ellipse(sx, sy - 6, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(sx - 6, sy - 14, 8, 6);
  } else if (obj.type === 'mud') {
    ctx.fillStyle = 'rgba(46,34,24,0.6)';
    const r = (obj.radius || 1.5) * 30;
    ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(46,34,24,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(sx + 6, sy - 3, 6, 4, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (obj.type === 'hazard') {
    // Thorns / hazard zone
    ctx.fillStyle = 'rgba(100,20,20,0.25)';
    const r2 = (obj.radius || 1) * 30;
    ctx.beginPath(); ctx.ellipse(sx, sy, r2, r2 * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6a2020'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Date.now() / 2000;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * r2 * 0.3, sy + Math.sin(a) * r2 * 0.2);
      ctx.lineTo(sx + Math.cos(a) * r2 * 0.8, sy + Math.sin(a) * r2 * 0.5);
      ctx.stroke();
    }
  }
}

// ═══ RAIN ═══
export function drawIsoRain(ctx, particles, W, H) {
  ctx.strokeStyle = 'rgba(80,130,200,0.25)';
  ctx.lineWidth = 1;
  for (const p of particles) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - 3, p.y + p.length);
    ctx.stroke();
  }
}

// ═══ FOG / ATMOSPHERE ═══
export function drawFog(ctx, W, H, time) {
  // Bottom fog
  const grad = ctx.createLinearGradient(0, H * 0.6, 0, H);
  grad.addColorStop(0, 'rgba(20,24,36,0)');
  grad.addColorStop(1, 'rgba(20,24,36,0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  // Fog wisps
  ctx.save(); ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#8090a0';
  for (let i = 0; i < 4; i++) {
    const fx = (time * 20 + i * 300) % (W + 400) - 200;
    const fy = H * 0.5 + Math.sin(time * 0.3 + i) * 60;
    ctx.beginPath(); ctx.ellipse(fx, fy, 200, 30, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawVignette(ctx, W, H) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ═══ EFFECTS ═══
export function drawProjectile(ctx, proj, camX, camY) {
  const { x: sx, y: sy } = toScreen(proj.x, proj.y, camX, camY);
  const color = proj.color || '#8a8a8a';
  const r = proj.isSkill ? 8 : 5;
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = proj.isSkill ? 12 : 0;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = proj.isSkill ? `${color}60` : 'rgba(138,138,138,0.3)';
  ctx.beginPath(); ctx.arc(sx - (proj.vx || 0) * 3, sy - (proj.vy || 0) * 3, r * 0.6, 0, Math.PI * 2); ctx.fill();
}

export function drawDamageNumber(ctx, dmg, wx, wy, age, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age);
  ctx.font = 'bold 18px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#D92D20';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillText(`-${dmg}`, sx, sy - 26 - age * 40);
  ctx.restore();
}

export function drawInteractIndicator(ctx, wx, wy, camX, camY, text) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  const bounce = Math.sin(Date.now() / 300) * 3;
  ctx.font = '11px "JetBrains Mono"';
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(sx - w / 2 - 6, sy - 58 + bounce, w + 12, 18);
  ctx.fillStyle = '#C5A059';
  ctx.fillText(text, sx, sy - 44 + bounce);
}

// ═══ KAIREN ATTACK EFFECT (big slash) ═══
export function drawKairenAttack(ctx, kx, ky, attackType, progress, camX, camY) {
  const { x: sx, y: sy } = toScreen(kx, ky, camX, camY);
  ctx.save();
  ctx.globalAlpha = 0.6 * (1 - progress);

  if (attackType === 'heavy_slash') {
    ctx.strokeStyle = '#D92D20';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#D92D20'; ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(sx, sy - 10, 60, -Math.PI * 0.8, Math.PI * 0.3);
    ctx.stroke();
    ctx.strokeStyle = '#ff6040';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy - 10, 56, -Math.PI * 0.7, Math.PI * 0.2);
    ctx.stroke();
  } else if (attackType === 'thrust') {
    ctx.strokeStyle = '#D92D20';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#D92D20'; ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 10);
    ctx.lineTo(sx + 70, sy - 10);
    ctx.stroke();
  } else if (attackType === 'shield_bash') {
    ctx.fillStyle = 'rgba(217,45,32,0.3)';
    ctx.beginPath();
    ctx.arc(sx - 20, sy, 35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ═══ CUTSCENE HELPERS ═══
export function drawFadeOverlay(ctx, W, H, alpha) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawFallingPlayer(ctx, sx, sy, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);
  drawPlayerBody(ctx, 0, 0, 'down', 0);
  ctx.restore();
}

// ─── SKILL EFFECTS ───────────────────────────────────────
export function drawSkillEffect(ctx, effect, camX, camY) {
  const { x: sx, y: sy } = toScreen(effect.x, effect.y, camX, camY);
  const progress = 1 - (effect.timer / effect.duration);
  ctx.save();

  switch (effect.type) {
    case 'flame_trail': {
      ctx.globalAlpha = 0.6 * (1 - progress);
      for (let i = 0; i < 8; i++) {
        const ox = (Math.random() - 0.5) * 40;
        const oy = (Math.random() - 0.5) * 20;
        const r = 4 + Math.random() * 8;
        ctx.fillStyle = i % 2 === 0 ? '#ff6030' : '#ffa040';
        ctx.beginPath(); ctx.arc(sx + ox, sy + oy, r * (1 - progress), 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'lightning': {
      ctx.globalAlpha = 0.8 * (1 - progress);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
      // Main bolt
      ctx.beginPath();
      ctx.moveTo(sx, sy - 120);
      let bx = sx, by = sy - 120;
      for (let i = 0; i < 8; i++) {
        bx += (Math.random() - 0.5) * 24;
        by += 15;
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      // Ground flash
      ctx.fillStyle = 'rgba(255,215,0,0.3)';
      ctx.beginPath(); ctx.arc(sx, sy, 30 * (1 + progress), 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'explosion': {
      const r = (effect.radius || 3) * 30;
      ctx.globalAlpha = 0.5 * (1 - progress);
      ctx.fillStyle = effect.color || '#c0a0ff';
      ctx.beginPath(); ctx.arc(sx, sy, r * (0.3 + progress * 0.7), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3 * (1 - progress);
      ctx.beginPath(); ctx.arc(sx, sy, r * progress, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'shield': {
      ctx.globalAlpha = 0.4 * (1 - progress);
      ctx.strokeStyle = effect.color || '#8a7030';
      ctx.lineWidth = 3;
      ctx.shadowColor = effect.color || '#8a7030'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(sx, sy - 10, 24, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'heal': {
      ctx.globalAlpha = 0.6 * (1 - progress);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + progress * 3;
        const pr = 16 + progress * 20;
        ctx.fillStyle = '#4ade80';
        ctx.beginPath(); ctx.arc(sx + Math.cos(a) * pr, sy - 10 - progress * 30 + Math.sin(a) * pr * 0.5, 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'shadow': {
      ctx.globalAlpha = 0.4 * (1 - progress);
      ctx.fillStyle = '#8040c0';
      ctx.beginPath(); ctx.arc(sx, sy, 20 * (1 + progress), 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: break;
  }
  ctx.restore();
}
