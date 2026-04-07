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
  const variant = v(wx, wy);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 10, 18, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Roots (more detail)
  ctx.fillStyle = '#2a1e0e';
  ctx.fillRect(sx - 8, sy - 6, 4, 10);
  ctx.fillRect(sx + 4, sy - 4, 3, 8);
  ctx.fillStyle = '#201608';
  ctx.fillRect(sx - 10, sy - 3, 3, 6);
  ctx.fillRect(sx + 6, sy - 2, 3, 5);
  // Root texture
  ctx.fillStyle = '#3a2a14';
  ctx.fillRect(sx - 7, sy - 4, 2, 2);

  // Trunk (gnarled, more textured)
  ctx.fillStyle = '#3a2810';
  ctx.fillRect(sx - 5, sy - 50, 10, 48);
  // Bark left shadow
  ctx.fillStyle = '#2e1e0a';
  ctx.fillRect(sx - 5, sy - 50, 3, 48);
  // Bark right highlight
  ctx.fillStyle = '#4a3818';
  ctx.fillRect(sx + 3, sy - 46, 2, 36);
  // Bark knots and texture
  ctx.fillStyle = '#4a3818';
  ctx.fillRect(sx - 2, sy - 40, 3, 4);
  ctx.fillRect(sx + 1, sy - 28, 2, 5);
  ctx.fillRect(sx - 3, sy - 18, 2, 3);
  // Moss on trunk
  if (variant < 2) {
    ctx.fillStyle = '#1a3a0c';
    ctx.fillRect(sx - 5, sy - 20, 4, 6);
    ctx.fillStyle = '#2a4a1c';
    ctx.fillRect(sx - 4, sy - 18, 2, 3);
  }
  // Hollow/scar
  ctx.fillStyle = '#1a100a';
  ctx.fillRect(sx - 1, sy - 34, 3, 4);

  // Branches (more of them)
  ctx.strokeStyle = '#3a2810';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 40); ctx.lineTo(sx - 18, sy - 55);
  ctx.moveTo(sx + 2, sy - 35); ctx.lineTo(sx + 20, sy - 48);
  ctx.moveTo(sx - 1, sy - 45); ctx.lineTo(sx - 10, sy - 62);
  ctx.stroke();
  // Thinner branches
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx - 16, sy - 54); ctx.lineTo(sx - 24, sy - 62);
  ctx.moveTo(sx + 18, sy - 47); ctx.lineTo(sx + 24, sy - 56);
  ctx.moveTo(sx - 8, sy - 60); ctx.lineTo(sx - 15, sy - 70);
  ctx.moveTo(sx + 4, sy - 56); ctx.lineTo(sx + 12, sy - 68);
  ctx.stroke();

  // Foliage clusters (dark, sparse - Elden Ring style — more layers)
  const drawCluster = (cx, cy, r, shade) => {
    ctx.fillStyle = shade === 0 ? '#0a1a06' : shade === 1 ? '#0e2208' : '#142e0e';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade === 0 ? '#0e2a0a' : shade === 1 ? '#1a3410' : '#1e3a14';
    ctx.beginPath(); ctx.arc(cx - 2, cy - 2, r * 0.7, 0, Math.PI * 2); ctx.fill();
    // Leafy texture pixels
    ctx.fillStyle = '#2a4a18';
    for (let i = 0; i < 3; i++) {
      const lx = cx - r * 0.5 + Math.sin(cx + i * 3) * r * 0.4;
      const ly = cy - r * 0.3 + Math.cos(cy + i * 2) * r * 0.3;
      ctx.fillRect(lx, ly, 2, 2);
    }
  };
  drawCluster(sx - 16, sy - 56, 12, 0);
  drawCluster(sx + 16, sy - 50, 10, 1);
  drawCluster(sx - 8, sy - 64, 14, 2);
  drawCluster(sx + 6, sy - 60, 11, 0);
  drawCluster(sx, sy - 52, 13, 1);
  drawCluster(sx + 12, sy - 62, 9, 2);
  drawCluster(sx - 20, sy - 48, 8, 0);
  // Top highlight cluster
  drawCluster(sx - 2, sy - 68, 10, 2);
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

  // Attack slash — subtle thin lines
  if (isAttacking && attackAngle !== undefined) {
    ctx.save();
    const combo = comboCount || 1;
    if (combo === 1) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy - 10 - jh, 22, attackAngle - 0.4, attackAngle + 0.4);
      ctx.stroke();
    } else if (combo === 2) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#d4b060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - 12 - jh, 26, attackAngle - 0.5, attackAngle + 0.5);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#e0c070';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - 12 - jh, 28, attackAngle - 0.7, attackAngle + 0.7);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(sx, sy - 12 - jh, 26, attackAngle - 0.4, attackAngle + 0.4);
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
  // Boot sole
  ctx.fillStyle = '#2a1e10';
  ctx.fillRect(sx - 5, sy + 1 + bob + legOff, 4, 1);
  ctx.fillRect(sx + 1, sy + 1 + bob - legOff, 4, 1);
  // Legs
  ctx.fillStyle = '#4a3828';
  ctx.fillRect(sx - 4, sy - 8 + bob, 3, 7 + legOff);
  ctx.fillRect(sx + 1, sy - 8 + bob, 3, 7 - legOff);
  // Leg shading
  ctx.fillStyle = '#3e2e1e';
  ctx.fillRect(sx - 4, sy - 8 + bob, 1, 7 + legOff);
  // Body
  ctx.fillStyle = '#c8b89c';
  ctx.fillRect(sx - 6, sy - 18 + bob, 12, 11);
  // Body shading (left edge darker)
  ctx.fillStyle = '#a89878';
  ctx.fillRect(sx - 6, sy - 18 + bob, 2, 11);
  // Body highlight (right side lighter)
  ctx.fillStyle = '#d4c8a8';
  ctx.fillRect(sx + 3, sy - 16 + bob, 2, 6);
  // Collar detail
  ctx.fillStyle = '#b0a080';
  ctx.fillRect(sx - 4, sy - 18 + bob, 8, 2);
  // Belt
  ctx.fillStyle = '#6a4a20';
  ctx.fillRect(sx - 6, sy - 9 + bob, 12, 2);
  ctx.fillStyle = '#c5a059';
  ctx.fillRect(sx - 1, sy - 9 + bob, 2, 2);
  // Belt pouch
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(sx + 3, sy - 9 + bob, 3, 3);
  // Arms
  ctx.fillStyle = '#d4b08c';
  ctx.fillRect(sx - 8, sy - 16 + bob, 3, 8);
  ctx.fillRect(sx + 5, sy - 16 + bob, 3, 8);
  // Arm shading
  ctx.fillStyle = '#c0a078';
  ctx.fillRect(sx - 8, sy - 16 + bob, 1, 8);
  // Hands
  ctx.fillStyle = '#e0c8a8';
  ctx.fillRect(sx - 7, sy - 9 + bob, 2, 2);
  ctx.fillRect(sx + 6, sy - 9 + bob, 2, 2);
  // Head
  ctx.fillStyle = '#e0c0a0';
  ctx.fillRect(sx - 5, sy - 28 + bob, 10, 9);
  // Face shading
  ctx.fillStyle = '#d4b494';
  ctx.fillRect(sx - 5, sy - 28 + bob, 2, 9);
  // Chin
  ctx.fillStyle = '#d4b08c';
  ctx.fillRect(sx - 3, sy - 20 + bob, 6, 1);
  // Hair
  ctx.fillStyle = '#5a3618';
  ctx.fillRect(sx - 6, sy - 30 + bob, 12, 5);
  ctx.fillRect(sx - 6, sy - 28 + bob, 2, 6);
  ctx.fillRect(sx + 4, sy - 28 + bob, 2, 5);
  // Hair highlight
  ctx.fillStyle = '#7a5028';
  ctx.fillRect(sx - 3, sy - 30 + bob, 3, 2);
  ctx.fillStyle = '#8a6030';
  ctx.fillRect(sx + 1, sy - 29 + bob, 2, 1);
  // Eyes
  if (dir !== 'up') {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(sx - 3, sy - 25 + bob, 2, 2);
    ctx.fillRect(sx + 1, sy - 25 + bob, 2, 2);
    // Pupils (white highlight)
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 3, sy - 25 + bob, 1, 1);
    ctx.fillRect(sx + 1, sy - 25 + bob, 1, 1);
    // Mouth
    ctx.fillStyle = '#a08060';
    ctx.fillRect(sx - 1, sy - 22 + bob, 2, 1);
  }
  // Ear
  ctx.fillStyle = '#d4b08c';
  ctx.fillRect(sx - 6, sy - 26 + bob, 1, 3);
}

// ═══ KAIREN ═══
export function drawIsoKairen(ctx, wx, wy, dir, frame, state, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  const bob = state === 'stunned' ? 3 : frame % 2 === 0 ? 0 : -1;
  const t = Date.now() / 1000;

  // Shadow (menacing, elongated)
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 10, 18, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Dark ground stain
  ctx.fillStyle = 'rgba(20,10,10,0.15)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 8, 26, 12, 0, 0, Math.PI * 2); ctx.fill();

  // Telegraph glow
  if (state === 'telegraph') {
    ctx.save(); ctx.globalAlpha = 0.2 + Math.sin(t * 8) * 0.1;
    ctx.fillStyle = '#D92D20';
    ctx.beginPath(); ctx.arc(sx, sy - 10, 50, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const legOff = frame % 2 === 0 ? 2 : -2;
  // Greaves (armored with rivets)
  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(sx - 7, sy - 4 + bob + legOff, 6, 8);
  ctx.fillRect(sx + 1, sy - 4 + bob - legOff, 6, 8);
  ctx.fillStyle = '#28283a';
  ctx.fillRect(sx - 5, sy - 2 + bob + legOff, 2, 4);
  ctx.fillRect(sx + 3, sy - 2 + bob - legOff, 2, 4);
  // Knee guards
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 6, sy - 4 + bob + legOff, 4, 2);
  ctx.fillRect(sx + 2, sy - 4 + bob - legOff, 4, 2);
  // Boots
  ctx.fillStyle = '#16161e';
  ctx.fillRect(sx - 8, sy + 3 + bob + legOff, 7, 5);
  ctx.fillRect(sx + 1, sy + 3 + bob - legOff, 7, 5);
  // Boot spurs
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 9, sy + 5 + bob + legOff, 2, 2);
  ctx.fillRect(sx + 7, sy + 5 + bob - legOff, 2, 2);

  // Cape (flowing, animated)
  const capeFlutter = Math.sin(t * 2) * 2;
  ctx.fillStyle = '#1a0a0a';
  ctx.beginPath();
  ctx.moveTo(sx - 10, sy - 32 + bob);
  ctx.lineTo(sx + 10, sy - 32 + bob);
  ctx.lineTo(sx + 12 + capeFlutter, sy + 2 + bob);
  ctx.lineTo(sx - 12 - capeFlutter, sy + 2 + bob);
  ctx.closePath(); ctx.fill();
  // Cape inner lining
  ctx.fillStyle = '#2a0808';
  ctx.beginPath();
  ctx.moveTo(sx - 7, sy - 30 + bob);
  ctx.lineTo(sx + 7, sy - 30 + bob);
  ctx.lineTo(sx + 9 + capeFlutter, sy - 2 + bob);
  ctx.lineTo(sx - 9 - capeFlutter, sy - 2 + bob);
  ctx.closePath(); ctx.fill();
  // Cape rune
  ctx.fillStyle = '#5a2020';
  ctx.fillRect(sx - 2, sy - 14 + bob, 4, 6);
  ctx.fillRect(sx - 4, sy - 12 + bob, 8, 2);

  // Armor torso
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 10, sy - 30 + bob, 20, 22);
  // Chest plate
  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(sx - 8, sy - 26 + bob, 16, 6);
  // Chest plate highlight
  ctx.fillStyle = '#4a4a58';
  ctx.fillRect(sx - 6, sy - 24 + bob, 5, 3);
  // Gold trim
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 10, sy - 30 + bob, 20, 2);
  ctx.fillRect(sx - 1, sy - 28 + bob, 2, 18);
  // Side trim
  ctx.fillRect(sx - 10, sy - 18 + bob, 2, 8);
  ctx.fillRect(sx + 8, sy - 18 + bob, 2, 8);
  // Belly plate
  ctx.fillStyle = '#32323e';
  ctx.fillRect(sx - 6, sy - 18 + bob, 12, 6);
  // Rivets
  ctx.fillStyle = '#9a8040';
  ctx.fillRect(sx - 7, sy - 26 + bob, 1, 1);
  ctx.fillRect(sx + 6, sy - 26 + bob, 1, 1);
  ctx.fillRect(sx - 7, sy - 20 + bob, 1, 1);
  ctx.fillRect(sx + 6, sy - 20 + bob, 1, 1);

  // Pauldrons (ornate)
  ctx.fillStyle = '#2e2e3a';
  ctx.fillRect(sx - 14, sy - 30 + bob, 6, 8);
  ctx.fillRect(sx + 8, sy - 30 + bob, 6, 8);
  // Pauldron spikes
  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(sx - 16, sy - 34 + bob, 3, 5);
  ctx.fillRect(sx + 13, sy - 34 + bob, 3, 5);
  ctx.fillStyle = '#8a7030';
  ctx.fillRect(sx - 14, sy - 32 + bob, 6, 3);
  ctx.fillRect(sx + 8, sy - 32 + bob, 6, 3);
  // Pauldron skulls
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(sx - 12, sy - 28 + bob, 3, 3);
  ctx.fillRect(sx + 10, sy - 28 + bob, 3, 3);

  // Gauntlets
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 14, sy - 22 + bob, 5, 10);
  ctx.fillRect(sx + 9, sy - 22 + bob, 5, 10);
  // Gauntlet claws
  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(sx - 14, sy - 14 + bob, 2, 4);
  ctx.fillRect(sx + 12, sy - 14 + bob, 2, 4);

  // Helmet (imposing)
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(sx - 8, sy - 44 + bob, 16, 15);
  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(sx - 6, sy - 42 + bob, 12, 4);
  // Cheek guards
  ctx.fillStyle = '#28283a';
  ctx.fillRect(sx - 9, sy - 38 + bob, 3, 8);
  ctx.fillRect(sx + 6, sy - 38 + bob, 3, 8);
  // Visor glow (menacing red slit)
  ctx.fillStyle = '#D92D20';
  ctx.shadowColor = '#D92D20';
  ctx.shadowBlur = 10;
  ctx.fillRect(sx - 5, sy - 38 + bob, 10, 3);
  ctx.shadowBlur = 4;
  ctx.fillRect(sx - 6, sy - 37 + bob, 12, 1);
  ctx.shadowBlur = 0;
  // Helm crest (taller, more ornate)
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(sx - 1, sy - 52 + bob, 2, 10);
  ctx.fillStyle = '#2a1010';
  ctx.fillRect(sx - 2, sy - 50 + bob, 4, 3);
  // Helm horns
  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(sx - 10, sy - 46 + bob, 2, 6);
  ctx.fillRect(sx + 8, sy - 46 + bob, 2, 6);

  // Shield (left) — more ornate
  if (state !== 'stunned') {
    ctx.fillStyle = '#3a3a48';
    ctx.fillRect(sx - 22, sy - 26 + bob, 10, 18);
    ctx.fillStyle = '#2a2a35';
    ctx.fillRect(sx - 20, sy - 24 + bob, 6, 14);
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(sx - 18, sy - 20 + bob, 4, 8);
    // Shield emblem
    ctx.fillStyle = '#D92D20';
    ctx.fillRect(sx - 17, sy - 18 + bob, 2, 4);
    // Shield rim
    ctx.fillStyle = '#9a8040';
    ctx.fillRect(sx - 22, sy - 26 + bob, 10, 1);
    ctx.fillRect(sx - 22, sy - 9 + bob, 10, 1);
  }

  // Sword (right) — more detail
  if (state === 'telegraph') {
    ctx.fillStyle = '#c0c0c8';
    ctx.fillRect(sx + 14, sy - 62 + bob, 4, 38);
    ctx.fillStyle = '#e0e0e8';
    ctx.fillRect(sx + 15, sy - 58 + bob, 2, 30);
    ctx.fillStyle = 'rgba(217,45,32,0.3)';
    ctx.shadowColor = '#D92D20'; ctx.shadowBlur = 12;
    ctx.fillRect(sx + 12, sy - 64 + bob, 8, 42);
    ctx.shadowBlur = 0;
    // Crossguard
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(sx + 10, sy - 24 + bob, 12, 4);
    ctx.fillStyle = '#9a8040';
    ctx.fillRect(sx + 11, sy - 22 + bob, 10, 2);
  } else {
    ctx.fillStyle = '#a0a0a8';
    ctx.fillRect(sx + 14, sy - 26 + bob, 3, 24);
    ctx.fillStyle = '#b0b0b8';
    ctx.fillRect(sx + 15, sy - 24 + bob, 1, 18);
    // Crossguard
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(sx + 12, sy - 26 + bob, 7, 3);
  }

  // Ambient dark energy
  if (state === 'idle' || state === 'patrol') {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#1a0a0a';
    for (let i = 0; i < 3; i++) {
      const a = t * 1.5 + i * 2.1;
      const px = sx + Math.cos(a) * 24;
      const py = sy - 20 + Math.sin(a) * 12 + bob;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Stun stars
  if (state === 'stunned') {
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + (i * Math.PI * 2) / 3;
      ctx.fillRect(sx + Math.cos(a) * 18, sy - 50 + Math.sin(a) * 8, 4, 4);
    }
  }
}

// ═══ NPC ═══
export function drawIsoNPC(ctx, npc, camX, camY, frame) {
  const { x: sx, y: sy } = toScreen(npc.x, npc.y, camX, camY);
  const bob = frame % 60 < 30 ? 0 : -1;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

  if (npc.sprite === 'elder') {
    // Elder Theron — robed sage with staff
    // Robe
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(sx - 7, sy - 22 + bob, 14, 22);
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(sx - 7, sy - 22 + bob, 3, 22);
    ctx.fillStyle = '#6a6a7a'; ctx.fillRect(sx + 1, sy - 18 + bob, 4, 12);
    // Sash
    ctx.fillStyle = '#8a6030'; ctx.fillRect(sx - 7, sy - 10 + bob, 14, 2);
    ctx.fillStyle = '#C5A059'; ctx.fillRect(sx - 1, sy - 10 + bob, 2, 2);
    // Arms
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(sx - 9, sy - 18 + bob, 3, 8);
    ctx.fillRect(sx + 6, sy - 18 + bob, 3, 8);
    // Hands
    ctx.fillStyle = '#d4b08c'; ctx.fillRect(sx - 8, sy - 11 + bob, 2, 2);
    ctx.fillRect(sx + 7, sy - 11 + bob, 2, 2);
    // Head
    ctx.fillStyle = '#e0c8a0'; ctx.fillRect(sx - 5, sy - 32 + bob, 10, 10);
    ctx.fillStyle = '#d4b494'; ctx.fillRect(sx - 5, sy - 32 + bob, 2, 10);
    // Beard
    ctx.fillStyle = '#b0b0b0'; ctx.fillRect(sx - 4, sy - 22 + bob, 8, 7);
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(sx - 2, sy - 22 + bob, 4, 5);
    // Hood
    ctx.fillStyle = '#5a5a4a'; ctx.fillRect(sx - 6, sy - 34 + bob, 12, 5);
    ctx.fillStyle = '#4a4a3a'; ctx.fillRect(sx - 7, sy - 33 + bob, 2, 6);
    ctx.fillRect(sx + 5, sy - 33 + bob, 2, 6);
    // Eyes
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(sx - 3, sy - 28 + bob, 2, 1);
    ctx.fillRect(sx + 1, sy - 28 + bob, 2, 1);
    // Staff
    ctx.fillStyle = '#6a5030'; ctx.fillRect(sx + 9, sy - 40 + bob, 3, 38);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(sx + 10, sy - 38 + bob, 1, 34);
    // Staff orb
    ctx.fillStyle = '#C5A059';
    ctx.shadowColor = '#C5A059'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(sx + 10, sy - 42 + bob, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Feet
    ctx.fillStyle = '#3a3a2a'; ctx.fillRect(sx - 5, sy + bob, 4, 3);
    ctx.fillRect(sx + 1, sy + bob, 4, 3);
  } else {
    // Lyra — huntress with bow
    // Legs
    ctx.fillStyle = '#3a4a28'; ctx.fillRect(sx - 4, sy - 4 + bob, 3, 6);
    ctx.fillRect(sx + 1, sy - 4 + bob, 3, 6);
    // Boots
    ctx.fillStyle = '#2a3a1a'; ctx.fillRect(sx - 5, sy + 1 + bob, 4, 3);
    ctx.fillRect(sx + 1, sy + 1 + bob, 4, 3);
    // Tunic
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(sx - 6, sy - 18 + bob, 12, 14);
    ctx.fillStyle = '#2a4a7a'; ctx.fillRect(sx - 6, sy - 18 + bob, 3, 14);
    // Belt
    ctx.fillStyle = '#5a4020'; ctx.fillRect(sx - 6, sy - 6 + bob, 12, 2);
    ctx.fillStyle = '#8a7030'; ctx.fillRect(sx - 1, sy - 6 + bob, 2, 2);
    // Quiver strap
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(sx + 3, sy - 18 + bob, 2, 12);
    // Arms
    ctx.fillStyle = '#d4b08c'; ctx.fillRect(sx - 8, sy - 16 + bob, 3, 8);
    ctx.fillRect(sx + 5, sy - 16 + bob, 3, 8);
    // Head
    ctx.fillStyle = '#e0c0a0'; ctx.fillRect(sx - 5, sy - 28 + bob, 10, 10);
    ctx.fillStyle = '#d4b08c'; ctx.fillRect(sx - 5, sy - 28 + bob, 2, 10);
    // Hair
    ctx.fillStyle = '#c49030'; ctx.fillRect(sx - 6, sy - 30 + bob, 12, 5);
    ctx.fillRect(sx - 6, sy - 26 + bob, 2, 10); ctx.fillRect(sx + 4, sy - 26 + bob, 2, 10);
    ctx.fillStyle = '#d4a040'; ctx.fillRect(sx - 3, sy - 30 + bob, 4, 2);
    // Eyes
    ctx.fillStyle = '#1a3a5a';
    ctx.fillRect(sx - 3, sy - 24 + bob, 2, 2); ctx.fillRect(sx + 1, sy - 24 + bob, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 3, sy - 24 + bob, 1, 1); ctx.fillRect(sx + 1, sy - 24 + bob, 1, 1);
    // Mouth
    ctx.fillStyle = '#c08060'; ctx.fillRect(sx - 1, sy - 21 + bob, 2, 1);
    // Quiver on back
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(sx + 4, sy - 18 + bob, 4, 12);
    ctx.fillStyle = '#8a6a30'; ctx.fillRect(sx + 5, sy - 20 + bob, 2, 3);
    // Arrow tips in quiver
    ctx.fillStyle = '#a0a0a8'; ctx.fillRect(sx + 5, sy - 22 + bob, 1, 3);
    ctx.fillRect(sx + 7, sy - 21 + bob, 1, 2);
  }

  // Name tag
  ctx.font = '10px "JetBrains Mono"';
  ctx.textAlign = 'center';
  const w = ctx.measureText(npc.name).width;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - w / 2 - 3, sy - 46, w + 6, 14);
  ctx.fillStyle = '#C5A059';
  ctx.fillText(npc.name, sx, sy - 36);
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

// ═══ KAIREN ATTACK — Massive blue-white crystalline energy ═══
export function drawKairenAttack(ctx, kx, ky, attackType, progress, camX, camY) {
  const { x: sx, y: sy } = toScreen(kx, ky, camX, camY);
  ctx.save();
  const fade = Math.max(0, 1 - progress * 0.8);

  // Screen-wide glow under all attacks
  ctx.globalAlpha = 0.08 * fade;
  ctx.fillStyle = '#4080ff';
  ctx.fillRect(sx - 300, sy - 300, 600, 600);

  if (attackType === 'quick_slash') {
    // ── Quick slash — fast single arc ──
    const r = 40 + progress * 30;
    ctx.globalAlpha = 0.7 * fade;
    ctx.strokeStyle = '#4080ff';
    ctx.lineWidth = 7;
    ctx.shadowColor = '#5090ff'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(sx, sy - 10, r, -Math.PI * 0.6, Math.PI * 0.2); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy - 10, r - 4, -Math.PI * 0.55, Math.PI * 0.15); ctx.stroke();
    // Sparks
    ctx.shadowBlur = 0;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * 0.6 + (i / 6) * Math.PI * 0.8;
      const px2 = sx + Math.cos(a) * (r + 5 + progress * 10);
      const py2 = sy - 10 + Math.sin(a) * (r + 5 + progress * 10);
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#90c0ff';
      ctx.fillRect(px2 - 1.5, py2 - 1.5, 3, 3);
    }

  } else if (attackType === 'heavy_slash') {
    // ── Massive crystalline energy arc ──
    const r = 55 + progress * 50;
    // Outer deep blue edge
    ctx.globalAlpha = 0.7 * fade;
    ctx.strokeStyle = '#2050c0';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#3060ff'; ctx.shadowBlur = 35;
    ctx.beginPath(); ctx.arc(sx, sy - 10, r, -Math.PI * 0.95, Math.PI * 0.5); ctx.stroke();
    // Mid cyan layer
    ctx.strokeStyle = '#70b0ff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#80c0ff'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(sx, sy - 10, r - 6, -Math.PI * 0.9, Math.PI * 0.45); ctx.stroke();
    // Core white
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(sx, sy - 10, r - 11, -Math.PI * 0.85, Math.PI * 0.4); ctx.stroke();
    // Crystalline shards radiating outward
    ctx.shadowBlur = 0;
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI * 0.95 + (i / 16) * Math.PI * 1.45 + progress * 0.4;
      const pr = r + 5 + progress * 35 + Math.random() * 12;
      const px = sx + Math.cos(a) * pr;
      const py = sy - 10 + Math.sin(a) * pr;
      const sz = 2 + Math.random() * 6;
      ctx.globalAlpha = (0.6 + Math.random() * 0.4) * fade;
      ctx.fillStyle = i % 4 === 0 ? '#ffffff' : i % 4 === 1 ? '#a0d8ff' : i % 4 === 2 ? '#5090ff' : '#2060c0';
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    // Ground impact burst
    ctx.globalAlpha = 0.2 * fade;
    ctx.fillStyle = '#4080ff';
    ctx.beginPath(); ctx.ellipse(sx, sy + 4, 50 + progress * 25, 20 + progress * 10, 0, 0, Math.PI * 2); ctx.fill();

  } else if (attackType === 'thrust') {
    // ── Energy lance / beam ──
    const len = 50 + progress * 80;
    // Outer glow
    ctx.globalAlpha = 0.5 * fade;
    ctx.strokeStyle = '#2050c0';
    ctx.lineWidth = 14;
    ctx.shadowColor = '#3060ff'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx + len, sy - 10); ctx.stroke();
    // Mid beam
    ctx.strokeStyle = '#70b0ff';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#80c0ff'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(sx + 5, sy - 10); ctx.lineTo(sx + len - 2, sy - 10); ctx.stroke();
    // Core white
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(sx + 10, sy - 10); ctx.lineTo(sx + len - 5, sy - 10); ctx.stroke();
    // Tip shatter particles
    ctx.shadowBlur = 0;
    for (let i = 0; i < 10; i++) {
      const ox = len + Math.random() * 20 * progress;
      const oy = (Math.random() - 0.5) * 30 * progress;
      const sz = 2 + Math.random() * 4;
      ctx.globalAlpha = (0.5 + Math.random() * 0.5) * fade;
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#a0d8ff' : '#4080ff';
      ctx.fillRect(sx + ox - sz / 2, sy - 10 + oy - sz / 2, sz, sz);
    }

  } else if (attackType === 'shield_bash') {
    // ── Expanding shockwave ring ──
    const r = 20 + progress * 60;
    // Outer ring
    ctx.globalAlpha = 0.6 * fade;
    ctx.strokeStyle = '#2050c0';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#4080ff'; ctx.shadowBlur = 25;
    ctx.beginPath(); ctx.arc(sx - 10, sy, r, 0, Math.PI * 2); ctx.stroke();
    // Mid ring
    ctx.strokeStyle = '#80c0ff';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(sx - 10, sy, r - 5, 0, Math.PI * 2); ctx.stroke();
    // Inner white flash
    ctx.globalAlpha = 0.4 * fade * (1 - progress);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(sx - 10, sy, r * 0.4, 0, Math.PI * 2); ctx.fill();
    // Flying fragments
    ctx.shadowBlur = 0;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = sx - 10 + Math.cos(a) * (r + 10);
      const py = sy + Math.sin(a) * (r + 10) * 0.6;
      const sz = 2 + Math.random() * 3;
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#70b0ff';
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }

  } else if (attackType === 'barrage' || attackType === 'enraged_combo') {
    // ── Multi-hit barrage — concentric rapid strikes ──
    const isEnraged = attackType === 'enraged_combo';
    const waves = isEnraged ? 4 : 3;
    const baseColor = isEnraged ? '#6020c0' : '#2050c0';
    const midColor = isEnraged ? '#b070ff' : '#70b0ff';
    const coreColor = '#ffffff';

    for (let w = 0; w < waves; w++) {
      const wavePhase = (progress * 3 + w * 0.3) % 1;
      const r = 25 + wavePhase * 80;
      ctx.globalAlpha = 0.5 * fade * (1 - wavePhase);
      ctx.strokeStyle = w % 2 === 0 ? baseColor : midColor;
      ctx.lineWidth = 6 - w;
      ctx.shadowColor = baseColor; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(sx, sy - 10, r, 0, Math.PI * 2); ctx.stroke();
    }

    // Core energy buildup
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3 * fade * (1 - progress * 0.5);
    ctx.fillStyle = baseColor;
    ctx.beginPath(); ctx.arc(sx, sy - 10, 30 * (0.5 + progress * 0.5), 0, Math.PI * 2); ctx.fill();

    // Flying crystalline shards
    const shardCount = isEnraged ? 20 : 14;
    for (let i = 0; i < shardCount; i++) {
      const a = (i / shardCount) * Math.PI * 2 + progress * 4;
      const r2 = 30 + progress * 60 + Math.sin(progress * 8 + i) * 15;
      const px = sx + Math.cos(a) * r2;
      const py = sy - 10 + Math.sin(a) * r2 * 0.6;
      const sz = 2 + Math.random() * 5;
      ctx.globalAlpha = (0.5 + Math.random() * 0.5) * fade;
      ctx.fillStyle = i % 4 === 0 ? coreColor : i % 4 === 1 ? midColor : i % 4 === 2 ? baseColor : '#4060a0';
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
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

// ═══ KAIREN REAL-TIME SWING TELEGRAPH ═══
// Red/orange danger zone on the ground before a melee swing
export function drawKairenSwingTelegraph(ctx, wx, wy, swingAngle, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  ctx.save();
  const t = Date.now() / 100;
  const pulse = 0.6 + Math.sin(t) * 0.2;

  // Danger cone on ground
  ctx.globalAlpha = 0.25 * pulse;
  ctx.fillStyle = '#D92D20';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 10);
  ctx.arc(sx, sy - 10, 90, swingAngle - Math.PI / 3, swingAngle + Math.PI / 3);
  ctx.closePath();
  ctx.fill();

  // Edge glow
  ctx.globalAlpha = 0.5 * pulse;
  ctx.strokeStyle = '#ff4040';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(sx, sy - 10, 88, swingAngle - Math.PI / 3, swingAngle + Math.PI / 3);
  ctx.stroke();

  // Warning indicator dots along the arc
  ctx.shadowBlur = 0;
  for (let i = 0; i < 5; i++) {
    const a = swingAngle - Math.PI / 3 + (i / 4) * (Math.PI * 2 / 3);
    const px = sx + Math.cos(a) * 82;
    const py = sy - 10 + Math.sin(a) * 82;
    ctx.globalAlpha = 0.7 * pulse;
    ctx.fillStyle = '#ff6040';
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ═══ KAIREN SWING ARC (the actual strike) ═══
export function drawKairenSwingArc(ctx, wx, wy, swingAngle, progress, camX, camY) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  ctx.save();
  const fade = 1 - progress * 0.6;

  // Sweeping blue-white arc
  const r = 70 + progress * 30;
  const spread = Math.PI / 3;
  const sweepStart = swingAngle - spread * (1 - progress);
  const sweepEnd = swingAngle + spread * progress;

  // Outer deep blue
  ctx.globalAlpha = 0.8 * fade;
  ctx.strokeStyle = '#2050c0';
  ctx.lineWidth = 12;
  ctx.shadowColor = '#3060ff'; ctx.shadowBlur = 28;
  ctx.beginPath(); ctx.arc(sx, sy - 10, r, sweepStart, sweepEnd); ctx.stroke();

  // Mid cyan
  ctx.strokeStyle = '#70b0ff';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#80c0ff'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(sx, sy - 10, r - 5, sweepStart, sweepEnd); ctx.stroke();

  // Core white
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(sx, sy - 10, r - 9, sweepStart, sweepEnd); ctx.stroke();

  // Impact sparks at the leading edge
  ctx.shadowBlur = 0;
  const tipAngle = sweepEnd;
  for (let i = 0; i < 6; i++) {
    const ox = (Math.random() - 0.5) * 18;
    const oy = (Math.random() - 0.5) * 18;
    const sz = 2 + Math.random() * 4;
    ctx.globalAlpha = (0.6 + Math.random() * 0.4) * fade;
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#a0d8ff' : '#4080ff';
    const px = sx + Math.cos(tipAngle) * r + ox;
    const py = sy - 10 + Math.sin(tipAngle) * r + oy;
    ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
  }
  ctx.restore();
}

// ═══ EMPOWERED AURA (after player fails a parry) ═══
export function drawEmpoweredAura(ctx, wx, wy, camX, camY, time) {
  const { x: sx, y: sy } = toScreen(wx, wy, camX, camY);
  ctx.save();
  const pulse = 0.6 + Math.sin(time * 4) * 0.3;

  // Inner crimson glow
  ctx.globalAlpha = 0.15 * pulse;
  ctx.fillStyle = '#D92D20';
  ctx.beginPath(); ctx.arc(sx, sy - 16, 40, 0, Math.PI * 2); ctx.fill();

  // Outer ring
  ctx.globalAlpha = 0.4 * pulse;
  ctx.strokeStyle = '#ff2020';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ff4040'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(sx, sy - 16, 36, 0, Math.PI * 2); ctx.stroke();

  // Orbiting embers
  ctx.shadowBlur = 0;
  for (let i = 0; i < 6; i++) {
    const a = time * 2.5 + (i / 6) * Math.PI * 2;
    const r = 30 + Math.sin(time * 3 + i) * 6;
    const px = sx + Math.cos(a) * r;
    const py = sy - 16 + Math.sin(a) * r * 0.5;
    ctx.globalAlpha = 0.6 + Math.sin(time * 5 + i) * 0.3;
    ctx.fillStyle = i % 2 === 0 ? '#ff4040' : '#ff8040';
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ═══ QTE TELEGRAPH (line/area from Kairen to player) ═══
export function drawQTETelegraph(ctx, kx, ky, px, py, atk, progress, camX, camY) {
  const ks = toScreen(kx, ky, camX, camY);
  const ps = toScreen(px, py, camX, camY);
  ctx.save();
  const pulse = 0.5 + Math.sin(Date.now() / 60) * 0.3;

  if (atk.type === 'parry') {
    // Single flash indicator at player
    ctx.globalAlpha = 0.3 * pulse * progress;
    ctx.fillStyle = '#ffa020';
    ctx.shadowColor = '#ff8000'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(ps.x, ps.y - 10, 30 + progress * 20, 0, Math.PI * 2); ctx.fill();
    // Warning line from Kairen
    ctx.globalAlpha = 0.4 * progress;
    ctx.strokeStyle = '#ff6020';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(ks.x, ks.y - 10); ctx.lineTo(ps.x, ps.y - 10); ctx.stroke();
    ctx.setLineDash([]);
  } else if (atk.type === 'dodge') {
    // Directional danger streak
    ctx.globalAlpha = 0.2 * pulse * progress;
    ctx.fillStyle = '#D92D20';
    ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 18;
    const dx = ps.x - ks.x, dy = ps.y - ks.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * 22, ny = dx / len * 22;
    ctx.beginPath();
    ctx.moveTo(ks.x + nx, ks.y - 10 + ny);
    ctx.lineTo(ps.x + nx * 0.5, ps.y - 10 + ny * 0.5);
    ctx.lineTo(ps.x - nx * 0.5, ps.y - 10 - ny * 0.5);
    ctx.lineTo(ks.x - nx, ks.y - 10 - ny);
    ctx.closePath(); ctx.fill();
    // Crosshair on player
    ctx.globalAlpha = 0.5 * progress;
    ctx.strokeStyle = '#ff4040';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    const cr = 18;
    ctx.beginPath();
    ctx.moveTo(ps.x - cr, ps.y - 10); ctx.lineTo(ps.x + cr, ps.y - 10);
    ctx.moveTo(ps.x, ps.y - 10 - cr); ctx.lineTo(ps.x, ps.y - 10 + cr);
    ctx.stroke();
  } else if (atk.type === 'barrage') {
    // Multi-hit zone — pulsing area
    ctx.globalAlpha = 0.12 * pulse * progress;
    ctx.fillStyle = '#6020c0';
    ctx.shadowColor = '#8040ff'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(ks.x, ks.y - 10, 80 * progress, 0, Math.PI * 2); ctx.fill();
    // Spinning indicator lines
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3 * progress;
    ctx.strokeStyle = '#a060ff';
    ctx.lineWidth = 2;
    const t = Date.now() / 150;
    for (let i = 0; i < 8; i++) {
      const a = t + (i / 8) * Math.PI * 2;
      const r1 = 25 * progress, r2 = 70 * progress;
      ctx.beginPath();
      ctx.moveTo(ks.x + Math.cos(a) * r1, ks.y - 10 + Math.sin(a) * r1 * 0.5);
      ctx.lineTo(ks.x + Math.cos(a) * r2, ks.y - 10 + Math.sin(a) * r2 * 0.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}


// ═══ ENEMY SPECIES RENDERER ═══
export function drawEnemy(ctx, enemy, camX, camY, frameCount) {
  const { x: sx, y: sy } = toScreen(enemy.x, enemy.y, camX, camY);
  const species = enemy.species;
  const frame = Math.floor(frameCount / 8) % 4;
  const bob = frame % 2 === 0 ? 0 : -1;
  const time = Date.now() / 1000;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 6, 12, 5, 0, 0, Math.PI * 2); ctx.fill();

  switch (species) {
    case 'stone_warden': drawStoneWarden(ctx, sx, sy, bob, time); break;
    case 'cliff_raptor': drawCliffRaptor(ctx, sx, sy, bob, frame, time); break;
    case 'spineback_lurker': drawSpinebackLurker(ctx, sx, sy, bob, time); break;
    case 'fungal_brute': drawFungalBrute(ctx, sx, sy, bob, time); break;
    case 'glider_imp': drawGliderImp(ctx, sx, sy, frame, time); break;
    case 'ravine_gnasher': drawRavineGnasher(ctx, sx, sy, bob, time); break;
    case 'wraithshade': drawWraithshade(ctx, sx, sy, time); break;
    case 'stone_drake': drawStoneDrake(ctx, sx, sy, bob, time); break;
    default: break;
  }

  // HP bar above enemy
  if (enemy.hp !== undefined && enemy.maxHp) {
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
    const barW = 24;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(sx - barW / 2, sy - 48, barW, 3);
    ctx.fillStyle = hpPct > 0.5 ? '#D92D20' : '#ff4040';
    ctx.fillRect(sx - barW / 2, sy - 48, barW * hpPct, 3);
  }
}

// ── Stone Warden: Hulking gargoyle, massive and slow ──
function drawStoneWarden(ctx, sx, sy, bob, time) {
  // Legs (thick stone pillars)
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(sx - 8, sy - 6 + bob, 7, 10);
  ctx.fillRect(sx + 1, sy - 6 + bob, 7, 10);
  ctx.fillStyle = '#3a3a42';
  ctx.fillRect(sx - 8, sy - 6 + bob, 2, 10);
  // Massive body
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(sx - 12, sy - 28 + bob, 24, 22);
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(sx - 12, sy - 28 + bob, 4, 22);
  // Stone plate texture
  ctx.fillStyle = '#6a6a72';
  ctx.fillRect(sx - 6, sy - 24 + bob, 8, 4);
  ctx.fillRect(sx + 2, sy - 18 + bob, 6, 3);
  // Arms (stone clubs)
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(sx - 16, sy - 24 + bob, 5, 14);
  ctx.fillRect(sx + 11, sy - 24 + bob, 5, 14);
  // Club (right hand)
  ctx.fillStyle = '#3a3a40';
  ctx.fillRect(sx + 12, sy - 38 + bob, 4, 20);
  ctx.fillStyle = '#4a4a50';
  ctx.fillRect(sx + 11, sy - 42 + bob, 6, 6);
  // Head (angular stone)
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(sx - 7, sy - 40 + bob, 14, 12);
  ctx.fillStyle = '#6a6a72';
  ctx.fillRect(sx - 5, sy - 38 + bob, 10, 3);
  // Glowing eyes
  ctx.fillStyle = '#e0a040';
  ctx.shadowColor = '#e0a040'; ctx.shadowBlur = 6;
  ctx.fillRect(sx - 4, sy - 35 + bob, 3, 2);
  ctx.fillRect(sx + 2, sy - 35 + bob, 3, 2);
  ctx.shadowBlur = 0;
  // Horn stumps
  ctx.fillStyle = '#4a4a50';
  ctx.fillRect(sx - 8, sy - 42 + bob, 3, 4);
  ctx.fillRect(sx + 5, sy - 42 + bob, 3, 4);
  // Cracks in stone
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx - 2, sy - 26 + bob); ctx.lineTo(sx + 4, sy - 18 + bob);
  ctx.moveTo(sx + 6, sy - 24 + bob); ctx.lineTo(sx + 2, sy - 14 + bob);
  ctx.stroke();
}

// ── Cliff Raptor: Fast avian with sharp feathers ──
function drawCliffRaptor(ctx, sx, sy, bob, frame, time) {
  const wingFlap = Math.sin(time * 8) * 6;
  // Tail feathers
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(sx - 2, sy - 2 + bob, 4, 8);
  ctx.fillStyle = '#c09050';
  ctx.fillRect(sx - 1, sy + 2 + bob, 2, 6);
  // Body (sleek)
  ctx.fillStyle = '#6a4a30';
  ctx.fillRect(sx - 5, sy - 16 + bob, 10, 14);
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(sx - 3, sy - 14 + bob, 6, 8);
  // Breast feathers
  ctx.fillStyle = '#c09050';
  ctx.fillRect(sx - 3, sy - 10 + bob, 6, 5);
  // Wings
  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.moveTo(sx - 5, sy - 14 + bob);
  ctx.lineTo(sx - 18, sy - 16 + bob + wingFlap);
  ctx.lineTo(sx - 14, sy - 10 + bob + wingFlap);
  ctx.lineTo(sx - 5, sy - 8 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + 5, sy - 14 + bob);
  ctx.lineTo(sx + 18, sy - 16 + bob - wingFlap);
  ctx.lineTo(sx + 14, sy - 10 + bob - wingFlap);
  ctx.lineTo(sx + 5, sy - 8 + bob);
  ctx.fill();
  // Wing accent
  ctx.fillStyle = '#c09050';
  ctx.fillRect(sx - 16, sy - 14 + bob + wingFlap, 8, 2);
  ctx.fillRect(sx + 9, sy - 14 + bob - wingFlap, 8, 2);
  // Head
  ctx.fillStyle = '#6a4a30';
  ctx.fillRect(sx - 4, sy - 24 + bob, 8, 8);
  // Crest
  ctx.fillStyle = '#c09050';
  ctx.fillRect(sx - 1, sy - 28 + bob, 3, 5);
  ctx.fillStyle = '#e0c080';
  ctx.fillRect(sx, sy - 27 + bob, 1, 3);
  // Eye
  ctx.fillStyle = '#ff6030';
  ctx.shadowColor = '#ff6030'; ctx.shadowBlur = 4;
  ctx.fillRect(sx - 2, sy - 21 + bob, 2, 2);
  ctx.fillRect(sx + 2, sy - 21 + bob, 2, 2);
  ctx.shadowBlur = 0;
  // Beak
  ctx.fillStyle = '#e0a040';
  ctx.fillRect(sx - 1, sy - 18 + bob, 3, 3);
  ctx.fillStyle = '#c08030';
  ctx.fillRect(sx, sy - 16 + bob, 1, 2);
  // Talons
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx - 4, sy + bob, 3, 3);
  ctx.fillRect(sx + 2, sy + bob, 3, 3);
}

// ── Spineback Lurker: Barbed spine-throwing ambusher ──
function drawSpinebackLurker(ctx, sx, sy, bob, time) {
  // Low body
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(sx - 8, sy - 10 + bob, 16, 10);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(sx - 8, sy - 10 + bob, 3, 10);
  // Belly
  ctx.fillStyle = '#6a5a40';
  ctx.fillRect(sx - 5, sy - 4 + bob, 10, 4);
  // Legs (6 small)
  ctx.fillStyle = '#3a2a1a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(sx - 7 + i * 5, sy + bob, 2, 4);
    ctx.fillRect(sx - 5 + i * 5, sy + 1 + bob, 2, 3);
  }
  // Spines on back (key feature)
  ctx.fillStyle = '#8a6040';
  for (let i = 0; i < 5; i++) {
    const bx = sx - 6 + i * 3;
    const spikeH = 6 + Math.sin(time * 2 + i) * 2;
    ctx.fillRect(bx, sy - 10 - spikeH + bob, 2, spikeH);
    ctx.fillStyle = '#c08050';
    ctx.fillRect(bx, sy - 10 - spikeH + bob, 1, 2);
    ctx.fillStyle = '#8a6040';
  }
  // Head (low, predatory)
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(sx - 4, sy - 16 + bob, 8, 7);
  // Eyes (pairs)
  ctx.fillStyle = '#40c080';
  ctx.shadowColor = '#40c080'; ctx.shadowBlur = 4;
  ctx.fillRect(sx - 3, sy - 14 + bob, 2, 1);
  ctx.fillRect(sx + 1, sy - 14 + bob, 2, 1);
  ctx.fillRect(sx - 2, sy - 12 + bob, 1, 1);
  ctx.fillRect(sx + 1, sy - 12 + bob, 1, 1);
  ctx.shadowBlur = 0;
  // Mandibles
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(sx - 3, sy - 9 + bob, 2, 3);
  ctx.fillRect(sx + 1, sy - 9 + bob, 2, 3);
}

// ── Fungal Brute: Mushroom beast with toxic spores ──
function drawFungalBrute(ctx, sx, sy, bob, time) {
  // Trunk body
  ctx.fillStyle = '#3a5030';
  ctx.fillRect(sx - 8, sy - 20 + bob, 16, 20);
  ctx.fillStyle = '#2a4020';
  ctx.fillRect(sx - 8, sy - 20 + bob, 3, 20);
  // Mossy texture
  ctx.fillStyle = '#4a6840';
  ctx.fillRect(sx - 4, sy - 16 + bob, 4, 3);
  ctx.fillRect(sx + 2, sy - 12 + bob, 5, 2);
  // Mushroom cap (head)
  ctx.fillStyle = '#6a9050';
  ctx.beginPath();
  ctx.ellipse(sx, sy - 28 + bob, 14, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#5a8040';
  ctx.beginPath();
  ctx.ellipse(sx - 2, sy - 28 + bob, 10, 6, 0, Math.PI, 0);
  ctx.fill();
  // Cap spots
  ctx.fillStyle = '#90c060';
  ctx.beginPath(); ctx.arc(sx - 5, sy - 32 + bob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 4, sy - 30 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx, sy - 34 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  // Stem/face area
  ctx.fillStyle = '#4a6a38';
  ctx.fillRect(sx - 5, sy - 22 + bob, 10, 5);
  // Eyes (dim)
  ctx.fillStyle = '#c0e060';
  ctx.shadowColor = '#c0e060'; ctx.shadowBlur = 4;
  ctx.fillRect(sx - 3, sy - 20 + bob, 2, 2);
  ctx.fillRect(sx + 2, sy - 20 + bob, 2, 2);
  ctx.shadowBlur = 0;
  // Arms (root-like)
  ctx.fillStyle = '#3a5030';
  ctx.fillRect(sx - 12, sy - 16 + bob, 5, 10);
  ctx.fillRect(sx + 7, sy - 16 + bob, 5, 10);
  // Club (left hand)
  ctx.fillStyle = '#2a3a1a';
  ctx.fillRect(sx - 14, sy - 22 + bob, 4, 14);
  // Feet (rooty)
  ctx.fillStyle = '#2a4020';
  ctx.fillRect(sx - 7, sy + bob, 5, 4);
  ctx.fillRect(sx + 2, sy + bob, 5, 4);
  // Spore particles
  const sporeAlpha = 0.3 + Math.sin(time * 2) * 0.15;
  ctx.globalAlpha = sporeAlpha;
  ctx.fillStyle = '#90c060';
  for (let i = 0; i < 4; i++) {
    const px = sx + Math.sin(time * 1.5 + i * 2) * 18;
    const py = sy - 30 + Math.cos(time + i) * 10 + bob;
    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Glider Imp: Small, winged trickster ──
function drawGliderImp(ctx, sx, sy, frame, time) {
  const hover = Math.sin(time * 4) * 4;
  const oy = hover;
  // Wings (bat-like)
  ctx.fillStyle = '#5a3060';
  ctx.beginPath();
  ctx.moveTo(sx - 3, sy - 14 + oy);
  ctx.lineTo(sx - 22, sy - 20 + oy + Math.sin(time * 6) * 5);
  ctx.lineTo(sx - 18, sy - 8 + oy);
  ctx.lineTo(sx - 3, sy - 8 + oy);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + 3, sy - 14 + oy);
  ctx.lineTo(sx + 22, sy - 20 + oy - Math.sin(time * 6) * 5);
  ctx.lineTo(sx + 18, sy - 8 + oy);
  ctx.lineTo(sx + 3, sy - 8 + oy);
  ctx.fill();
  // Wing membrane highlights
  ctx.fillStyle = '#7a4080';
  ctx.fillRect(sx - 16, sy - 16 + oy, 6, 2);
  ctx.fillRect(sx + 10, sy - 16 + oy, 6, 2);
  // Body (small)
  ctx.fillStyle = '#5a3060';
  ctx.fillRect(sx - 4, sy - 16 + oy, 8, 12);
  ctx.fillStyle = '#9060a0';
  ctx.fillRect(sx - 2, sy - 12 + oy, 4, 5);
  // Head
  ctx.fillStyle = '#6a3870';
  ctx.fillRect(sx - 4, sy - 22 + oy, 8, 7);
  // Horns
  ctx.fillStyle = '#4a2050';
  ctx.fillRect(sx - 5, sy - 26 + oy, 2, 5);
  ctx.fillRect(sx + 3, sy - 26 + oy, 2, 5);
  // Eyes (mischievous)
  ctx.fillStyle = '#c080e0';
  ctx.shadowColor = '#c080e0'; ctx.shadowBlur = 5;
  ctx.fillRect(sx - 3, sy - 19 + oy, 2, 2);
  ctx.fillRect(sx + 1, sy - 19 + oy, 2, 2);
  ctx.shadowBlur = 0;
  // Grin
  ctx.fillStyle = '#3a1840';
  ctx.fillRect(sx - 2, sy - 16 + oy, 4, 1);
  // Daggers in hands
  ctx.fillStyle = '#a0a0a8';
  ctx.fillRect(sx - 6, sy - 8 + oy, 1, 6);
  ctx.fillRect(sx + 5, sy - 8 + oy, 1, 6);
  // Legs (dangling)
  ctx.fillStyle = '#4a2850';
  ctx.fillRect(sx - 3, sy - 4 + oy, 2, 5);
  ctx.fillRect(sx + 1, sy - 4 + oy, 2, 5);
}

// ── Ravine Gnasher: Reptilian pack hunter ──
function drawRavineGnasher(ctx, sx, sy, bob, time) {
  // Tail
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(sx + 4, sy - 6 + bob, 10, 4);
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx + 10, sy - 5 + bob, 6, 2);
  // Body (horizontal, quadruped)
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(sx - 8, sy - 14 + bob, 16, 10);
  ctx.fillStyle = '#6a5040';
  ctx.fillRect(sx - 6, sy - 12 + bob, 12, 4);
  // Belly
  ctx.fillStyle = '#8a7050';
  ctx.fillRect(sx - 4, sy - 6 + bob, 8, 3);
  // Legs (four)
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx - 7, sy - 4 + bob, 3, 6);
  ctx.fillRect(sx - 2, sy - 4 + bob, 3, 6);
  ctx.fillRect(sx + 3, sy - 4 + bob, 3, 5);
  ctx.fillRect(sx + 6, sy - 3 + bob, 2, 4);
  // Head (large jaw)
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(sx - 12, sy - 18 + bob, 8, 10);
  // Upper jaw
  ctx.fillStyle = '#6a5040';
  ctx.fillRect(sx - 16, sy - 16 + bob, 6, 4);
  // Lower jaw (open)
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(sx - 15, sy - 11 + bob, 5, 3);
  // Teeth
  ctx.fillStyle = '#e0d8c0';
  ctx.fillRect(sx - 14, sy - 12 + bob, 1, 2);
  ctx.fillRect(sx - 12, sy - 12 + bob, 1, 2);
  ctx.fillRect(sx - 14, sy - 11 + bob, 1, 2);
  // Eye
  ctx.fillStyle = '#ff4020';
  ctx.shadowColor = '#ff4020'; ctx.shadowBlur = 3;
  ctx.fillRect(sx - 10, sy - 16 + bob, 2, 2);
  ctx.shadowBlur = 0;
  // Scales
  ctx.fillStyle = '#6a5a40';
  ctx.fillRect(sx - 4, sy - 14 + bob, 2, 2);
  ctx.fillRect(sx + 1, sy - 13 + bob, 2, 2);
  ctx.fillRect(sx + 5, sy - 12 + bob, 2, 2);
  // Back ridge
  ctx.fillStyle = '#4a3020';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(sx - 6 + i * 4, sy - 15 + bob, 2, 3);
  }
}

// ── Wraithshade: Spectral shade, ethereal ──
function drawWraithshade(ctx, sx, sy, time) {
  const drift = Math.sin(time * 1.5) * 3;
  const flicker = 0.5 + Math.sin(time * 4) * 0.2;
  ctx.save();
  ctx.globalAlpha = flicker;
  // Cloak (flowing)
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 36 + drift);
  ctx.lineTo(sx - 12, sy + 4 + drift);
  ctx.quadraticCurveTo(sx, sy + 8 + drift, sx + 12, sy + 4 + drift);
  ctx.closePath();
  ctx.fill();
  // Inner cloak
  ctx.fillStyle = '#2a2a3e';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 32 + drift);
  ctx.lineTo(sx - 8, sy + 2 + drift);
  ctx.quadraticCurveTo(sx, sy + 4 + drift, sx + 8, sy + 2 + drift);
  ctx.closePath();
  ctx.fill();
  // Hood
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(sx - 6, sy - 36 + drift, 12, 10);
  ctx.fillStyle = '#141428';
  ctx.fillRect(sx - 4, sy - 32 + drift, 8, 5);
  // Eyes (ghostly)
  ctx.fillStyle = '#6060a0';
  ctx.shadowColor = '#6060a0'; ctx.shadowBlur = 10;
  ctx.fillRect(sx - 3, sy - 30 + drift, 2, 2);
  ctx.fillRect(sx + 1, sy - 30 + drift, 2, 2);
  ctx.shadowBlur = 0;
  // Spectral blade
  ctx.fillStyle = 'rgba(96,96,160,0.5)';
  ctx.fillRect(sx + 8, sy - 28 + drift, 2, 18);
  ctx.fillStyle = 'rgba(160,160,220,0.4)';
  ctx.fillRect(sx + 7, sy - 30 + drift, 4, 3);
  // Wisp trails
  ctx.globalAlpha = flicker * 0.3;
  ctx.fillStyle = '#4040a0';
  for (let i = 0; i < 3; i++) {
    const wx = sx + Math.sin(time * 2 + i * 2) * 14;
    const wy = sy - 10 + Math.cos(time * 1.5 + i) * 10 + drift;
    ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ── Stone Drake: Winged drake with stone breath ──
function drawStoneDrake(ctx, sx, sy, bob, time) {
  const wingFlap = Math.sin(time * 3) * 8;
  // Tail
  ctx.fillStyle = '#4a4a3a';
  ctx.fillRect(sx + 6, sy - 8 + bob, 14, 4);
  ctx.fillStyle = '#3a3a2a';
  ctx.fillRect(sx + 16, sy - 7 + bob, 6, 2);
  // Wings
  ctx.fillStyle = '#5a5a4a';
  ctx.beginPath();
  ctx.moveTo(sx - 6, sy - 20 + bob);
  ctx.lineTo(sx - 26, sy - 28 + bob + wingFlap);
  ctx.lineTo(sx - 20, sy - 14 + bob + wingFlap);
  ctx.lineTo(sx - 6, sy - 12 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + 6, sy - 20 + bob);
  ctx.lineTo(sx + 26, sy - 28 + bob - wingFlap);
  ctx.lineTo(sx + 20, sy - 14 + bob - wingFlap);
  ctx.lineTo(sx + 6, sy - 12 + bob);
  ctx.fill();
  // Wing bone ridges
  ctx.strokeStyle = '#6a6a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - 6, sy - 18 + bob);
  ctx.lineTo(sx - 22, sy - 24 + bob + wingFlap);
  ctx.moveTo(sx + 6, sy - 18 + bob);
  ctx.lineTo(sx + 22, sy - 24 + bob - wingFlap);
  ctx.stroke();
  // Body (bulky)
  ctx.fillStyle = '#4a4a3a';
  ctx.fillRect(sx - 10, sy - 22 + bob, 20, 18);
  ctx.fillStyle = '#5a5a48';
  ctx.fillRect(sx - 7, sy - 18 + bob, 14, 10);
  // Underbelly
  ctx.fillStyle = '#6a6a5a';
  ctx.fillRect(sx - 5, sy - 8 + bob, 10, 5);
  // Neck
  ctx.fillStyle = '#4a4a3a';
  ctx.fillRect(sx - 5, sy - 30 + bob, 10, 10);
  // Head
  ctx.fillStyle = '#5a5a48';
  ctx.fillRect(sx - 7, sy - 38 + bob, 14, 10);
  // Snout
  ctx.fillStyle = '#4a4a3a';
  ctx.fillRect(sx - 3, sy - 34 + bob, 10, 4);
  // Horns
  ctx.fillStyle = '#6a6a5a';
  ctx.fillRect(sx - 8, sy - 42 + bob, 3, 6);
  ctx.fillRect(sx + 5, sy - 42 + bob, 3, 6);
  // Eyes
  ctx.fillStyle = '#a0a080';
  ctx.shadowColor = '#a0a080'; ctx.shadowBlur = 5;
  ctx.fillRect(sx - 5, sy - 35 + bob, 3, 2);
  ctx.fillRect(sx + 3, sy - 35 + bob, 3, 2);
  ctx.shadowBlur = 0;
  // Nostrils (glowing)
  ctx.fillStyle = '#c0a060';
  ctx.fillRect(sx + 3, sy - 32 + bob, 1, 1);
  ctx.fillRect(sx + 5, sy - 32 + bob, 1, 1);
  // Legs
  ctx.fillStyle = '#3a3a2a';
  ctx.fillRect(sx - 9, sy - 4 + bob, 4, 7);
  ctx.fillRect(sx + 5, sy - 4 + bob, 4, 7);
  // Claws
  ctx.fillStyle = '#2a2a1a';
  ctx.fillRect(sx - 10, sy + 2 + bob, 5, 2);
  ctx.fillRect(sx + 5, sy + 2 + bob, 5, 2);
  // Stone scale texture
  ctx.fillStyle = '#5a5a4a';
  ctx.fillRect(sx - 6, sy - 20 + bob, 3, 3);
  ctx.fillRect(sx + 3, sy - 16 + bob, 3, 3);
}

// ═══ ENEMY NAME TAG ═══
export function drawEnemyNameTag(ctx, enemy, camX, camY) {
  const { x: sx, y: sy } = toScreen(enemy.x, enemy.y, camX, camY);
  const name = enemy.name || enemy.species;
  ctx.font = '9px "JetBrains Mono"';
  ctx.textAlign = 'center';
  const w = ctx.measureText(name).width;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(sx - w / 2 - 2, sy - 52, w + 4, 12);
  ctx.fillStyle = '#D92D20';
  ctx.fillText(name, sx, sy - 43);
}