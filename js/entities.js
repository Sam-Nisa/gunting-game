//  ENTITIES
// ═══════════════════════════════════════════════════
let bullets = [],
  enemyBullets = [],
  enemies = [],
  particles = [],
  pickups = [],
  grenades = [],
  explosions = [],
  muzzleFlashes = [];
let boss = null;

// ═══════════════════════════════════════════════════
//  WAVE SPAWNING
// ═══════════════════════════════════════════════════
function announceWave(w) {
  const el = document.getElementById("waveAnnounce");
  const prefix = w % 5 === 0 ? `\u{26A0}\u{FE0F} BOSS LEVEL ${w}!` : `\u{26A1} LEVEL ${w}`; // ⚠️ and ⚡
  const bgName = getBackgroundNameForWave(w);
  el.innerHTML = `${prefix}<br><span style="font-size: 0.6em; color: #ffcc00; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">\u{1F4CD} ${bgName}</span>`; // 📍
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0"), 3000);
}

function spawnWave(w) {
  announceWave(w);
  setBackgroundForWave(w);
  const isBossWave = w % 5 === 0;
  if (isBossWave) {
    spawnBoss(w);
    return;
  }
  // MODIFIED: Enemy count grows slower after level 6
  const baseCount = 4 + Math.min(w, 6) * 2 + Math.max(0, w - 6) * 1;
  const count = Math.floor(
    baseCount * DIFFICULTY_SETTINGS[difficulty].countMult,
  );
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const spawnX = side === 1 ? camX + W + 60 + i * 80 : camX - 80 - i * 80;
    const types = ["grunt", "heavy", "drone"];
    let type = "grunt";
    if (w >= 3 && Math.random() < 0.3) type = "heavy";
    if (w >= 2 && Math.random() < 0.25) type = "drone";
    enemies.push(createEnemy(spawnX, type, w));
  }
}

function createEnemy(ex, type, w) {
  // MODIFIED: HP adjusted by difficulty
  const baseHp =
    (type === "heavy" ? 8 : type === "drone" ? 4 : 3) + Math.floor(w / 2);
  const hp = Math.ceil(baseHp * DIFFICULTY_SETTINGS[difficulty].hpMult);
  let weapon = "gun";
  if (type !== "drone") {
    if (type === "heavy") {
      weapon = "gun";
    } else {
      weapon =
        Math.random() < DIFFICULTY_SETTINGS[difficulty].gunChance
          ? "gun"
          : "knife";
    }
  }
  return {
    x: ex,
    y: type === "drone" ? 80 + Math.random() * 150 : 380,
    vx: 0,
    vy: 0,
    w: type === "heavy" ? 34 : 28,
    h: type === "heavy" ? 44 : type === "drone" ? 28 : 38,
    hp,
    maxHp: hp,
    onGround: false,
    facing: ex > 0 ? -1 : 1,
    shootCd: 50 + Math.random() * 80,
    meleeCd: 0,
    patrolDir: Math.random() < 0.5 ? -1 : 1,
    type,
    weapon,
    frame: 0,
    frameTimer: 0,
    sinOffset: Math.random() * Math.PI * 2, // for drone hover
    dead: false,
  };
}

function spawnBoss(w) {
  playSound("boss_roar");
  const level = Math.floor(w / 5);
  // MODIFIED: Boss HP adjusted by difficulty. Level 5 = 200, Level 10 = 400.
  const baseHp = 200 * level;
  const hp = Math.ceil(baseHp * DIFFICULTY_SETTINGS[difficulty].hpMult);
  boss = {
    x: camX + W - 120,
    y: 300,
    vx: 0,
    vy: 0,
    w: 80,
    h: 90,
    hp: hp,
    maxHp: hp,
    onGround: false,
    facing: -1,
    phase: 0,
    shootCd: 40,
    moveCd: 60,
    level,
    frame: 0,
    frameTimer: 0,
    rage: false,
  };
  spawnBossSupportItems();

}

// Creates an enemy forced to hold a knife (used for boss-level bodyguards).
function createKnifeEnemy(ex, type, w) {
  const baseHp = (type === "heavy" ? 7 : 3) + Math.floor(w / 2);
  const hp = Math.ceil(baseHp * DIFFICULTY_SETTINGS[difficulty].hpMult);
  return {
    x: ex,
    y: 380,
    vx: 0,
    vy: 0,
    w: type === "heavy" ? 34 : 28,
    h: type === "heavy" ? 44 : 38,
    hp,
    maxHp: hp,
    onGround: false,
    facing: ex > camX + W / 2 ? -1 : 1,
    shootCd: 999,  // never shoots
    meleeCd: 0,
    patrolDir: 1,
    type,
    weapon: "knife",  // ALWAYS knife — visual + AI
    frame: 0,
    frameTimer: 0,
    sinOffset: 0,
    dead: false,
  };
}

function spawnBossSupportItems() {
  const supportTypes = ["health", "grenade", "rocket", "health"];
  const startX = camX + 160;
  const y = 240;

  supportTypes.forEach((type, i) => {
    const x = Math.min(WORLD_W - 80, startX + i * 120);
    pickups.push({ x, y, type });
  });
}
//... rest of the script from this point is identical to the original until line 1335
// I will paste the rest of the script, but I'll add the new modifications.
// The code from `applyPhysics` to `playerShoot` is unchanged.

// ═══════════════════════════════════════════════════
//  PHYSICS
// ═══════════════════════════════════════════════════
function applyPhysics(obj, worldBound = true) {
  if (obj.type === "drone") {
    // Drone hovers, no gravity
    obj.x += obj.vx * gameSpeed; // MODIFIED
    obj.y += obj.vy * gameSpeed; // MODIFIED
    if (obj.y < 40) obj.y = 40;
    if (obj.y > 350) obj.y = 350;
    if (obj.x < 0) obj.x = 0;
    if (obj.x + obj.w > WORLD_W) obj.x = WORLD_W - obj.w;
    return;
  }
  obj.vy += 0.55 * gameSpeed; // MODIFIED (gravity is scaled)
  obj.x += obj.vx * gameSpeed; // MODIFIED
  obj.y += obj.vy * gameSpeed; // MODIFIED
  obj.onGround = false;
  for (const p of platforms) {
    if (
      obj.x + obj.w > p.x &&
      obj.x < p.x + p.w &&
      obj.y + obj.h > p.y &&
      obj.y + obj.h < p.y + p.h + Math.abs(obj.vy * gameSpeed) + 2 &&
      obj.vy >= 0
    ) {
      // MODIFIED
      obj.y = p.y - obj.h;
      obj.vy = 0;
      obj.onGround = true;
    }
  }
  if (worldBound) {
    if (obj.x < 0) {
      obj.x = 0;
      obj.vx = 0;
    }
    if (obj.x + obj.w > WORLD_W) {
      obj.x = WORLD_W - obj.w;
      obj.vx = 0;
    }
  }
  if (obj.y > H + 120) {
    obj.y = 380;
    obj.vy = 0;
  }
}

// ═══════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════
function spawnParticles(x, y, color, count = 8, speed = 4) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2,
      sp = 1 + Math.random() * speed;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      size: 2 + Math.random() * 4,
      color,
    });
  }
}
function spawnMuzzleFlash(x, y) {
  muzzleFlashes.push({
    x,
    y,
    life: 16,
    maxLife: 16,
    size: 12 + Math.random() * 8,
  });
  for (let i = 0; i < 4; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 0.9,
      size: 4 + Math.random() * 4,
      color: `hsl(${30 + Math.random() * 30},100%,70%)`,
    });
  }
}
function spawnExplosion(x, y, r = 60) {
  explosions.push({ x, y, r, maxR: r, life: 1 });
  spawnParticles(x, y, "#ff4400", 20, 8);
  spawnParticles(x, y, "#ffcc44", 12, 5);
  spawnParticles(x, y, "#ff8800", 10, 6);
  screenShake = 12;
  playSound("explode");
}

// ═══════════════════════════════════════════════════
//  SHOOTING
// ═══════════════════════════════════════════════════
function playerShoot() {
  if (player.shootCd > 0) return;
  const wep = WEAPONS[player.weapon];
  if (wep.ammo > 0) {
    wep.ammo--;
    if (wep.ammo === 0) {
      player.weapon = "rifle";
      updateWeaponUI();
    }
  } else if (wep.ammo === 0) return;

  const bx = player.x + (player.facing > 0 ? player.w + 5 : -5);
  const by = player.y + player.h * 0.35;

  // Aim assist toward nearest enemy (world-space)
  let tx = bx + player.facing * 300,
    ty = by,
    minDist = Infinity;
  for (const e of enemies) {
    const ex = e.x + e.w / 2,
      ey = e.y + e.h / 2;
    const dx2 = ex - bx,
      dy2 = ey - by;
    const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (dist < minDist && Math.sign(dx2) === player.facing) {
      minDist = dist;
      tx = ex;
      ty = ey;
    }
  }
  if (boss) {
    const bx2 = boss.x + boss.w / 2,
      by2 = boss.y + boss.h / 2;
    const dx2 = bx2 - bx,
      dy2 = by2 - by;
    const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (dist < minDist && Math.sign(dx2) === player.facing) {
      minDist = dist;
      tx = bx2;
      ty = by2;
    }
  }

  const dx = tx - bx,
    dy = ty - by;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  if (wep.rocket) {
    bullets.push({
      x: bx,
      y: by,
      vx: (dx / len) * wep.speed,
      vy: (dy / len) * wep.speed,
      life: 80,
      damage: wep.damage,
      rocket: true,
      trail: [],
    });
  } else {
    for (let i = 0; i < wep.bullets; i++) {
      const spread = (Math.random() - 0.5) * wep.spread;
      const ang = Math.atan2(dy, dx) + spread;
      bullets.push({
        x: bx,
        y: by,
        vx: Math.cos(ang) * wep.speed,
        vy: Math.sin(ang) * wep.speed,
        life: 50,
        damage: wep.damage,
        rocket: false,
      });
    }
  }

  spawnMuzzleFlash(bx, by);
  player.shootCd = wep.rate;
  player.shootAnim = 14;
  playSound(wep.sound);
}
//... code from `throwGrenade` to `update` is unchanged. I'll paste it.

function throwGrenade() {
  if (player.grenades <= 0 || player.grenadeCD > 0) return;
  player.grenades--;
  player.grenadeCD = 30;
  const dx = mouseX + camX - player.x,
    dy = mouseY - 80 - player.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  grenades.push({
    x: player.x + player.w / 2,
    y: player.y,
    vx: (dx / len) * 12,
    vy: -8,
    life: 120,
    bounces: 3,
  });
  document.getElementById("grenadeDisplay2").textContent = player.grenades;
}

function updateWeaponUI() {
  const wep = WEAPONS[player.weapon || "rifle"];
  if (!wep) return;
  document.getElementById("weaponIcon").textContent = wep.icon;
  document.getElementById("weaponName").textContent = wep.name;
  document.getElementById("ammoDisplay").textContent =
    wep.ammo < 0 ? "∞" : wep.ammo;
  const skinLabel = document.getElementById("skinDisplay");
  if (skinLabel) skinLabel.textContent = (player.skin || window.selectedSkin || "default").toUpperCase();
}

// ═══════════════════════════════════════════════════
//  DRAWING
// ═══════════════════════════════════════════════════
function worldToScreen(wx, wy) {
  return { x: wx - camX, y: wy };
}

function drawBackground() {
  if (bgTransitionAlpha < 1.0 && bgImageLoaded) {
    bgTransitionAlpha += 0.015 * (typeof timeScale !== 'undefined' ? timeScale : 1);
    if (bgTransitionAlpha >= 1.0) {
      bgTransitionAlpha = 1.0;
      prevBgImageLoaded = false;
    }
  }

  const drawImg = (img) => {
    ctx.drawImage(img, 0, 0, W, H);
  };

  let drewPrev = false;
  if (prevBgImageLoaded) {
    drawImg(prevBgImage);
    drewPrev = true;
  }

  if (bgImageLoaded) {
    if (drewPrev && bgTransitionAlpha < 1.0) {
      ctx.save();
      ctx.globalAlpha = bgTransitionAlpha;
      drawImg(bgImage);
      ctx.restore();
    } else {
      drawImg(bgImage);
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (drewPrev) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Parallax layers
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#050f05");
  sky.addColorStop(0.5, "#0a1f0a");
  sky.addColorStop(1, "#123012");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars (parallax 0.1)
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  const starSeed = [
    [50, 20],
    [150, 40],
    [280, 15],
    [400, 30],
    [550, 25],
    [700, 10],
    [820, 35],
    [900, 50],
    [130, 60],
    [350, 55],
    [630, 45],
    [750, 65],
    [40, 90],
    [470, 85],
    [1000, 30],
    [1200, 50],
    [1500, 20],
    [1800, 40],
  ];
  for (const [sx, sy] of starSeed) {
    const sx2 = (((sx - camX * 0.1) % W) + W) % W;
    ctx.fillRect(sx2, sy, 1.5, 1.5);
  }

  // Far background trees (parallax 0.3)
  ctx.save();
  ctx.translate(-camX * 0.3, 0);
  for (const t of treeData) drawTree(t.x, t.y, t.s, 0.25);
  ctx.restore();

  // Mid trees (parallax 0.6)
  ctx.save();
  ctx.translate(-camX * 0.6, 0);
  const midTrees = [
    { x: 200, y: 120, s: 1 },
    { x: 500, y: 100, s: 1.1 },
    { x: 900, y: 110, s: 0.9 },
    { x: 1300, y: 115, s: 1.2 },
    { x: 1700, y: 105, s: 1 },
    { x: 2100, y: 118, s: 0.95 },
  ];
  for (const t of midTrees) drawTree(t.x, t.y, t.s, 0.45);
  ctx.restore();
}

function drawTree(x, y, scale = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#2a1508";
  ctx.fillRect(-7, 60, 14, 120);
  ctx.fillStyle = "#0f3a0f";
  ctx.beginPath();
  ctx.ellipse(0, 40, 48, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#125512";
  ctx.beginPath();
  ctx.ellipse(0, 8, 36, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#187a1a";
  ctx.beginPath();
  ctx.ellipse(0, -16, 24, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
