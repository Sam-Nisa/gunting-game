function drawPlatforms() {
  ctx.save();
  ctx.translate(-camX, 0);
  for (const p of platforms) {
    if (p.x + p.w < camX || p.x > camX + W) continue;
    const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    g.addColorStop(0, "#5a7a5a");
    g.addColorStop(0.3, "#3a5a3a");
    g.addColorStop(1, "#1a3a1a");
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#7aaa6a";
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.strokeStyle = "#2a4a2a";
    ctx.lineWidth = 1;
    for (let tx = p.x; tx < p.x + p.w; tx += 32)
      ctx.strokeRect(tx, p.y, 32, p.h);
    ctx.fillStyle = "#1a3020";
    ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
  }
  ctx.restore();
}

function drawPlayer(p) {
  const sx = p.x - camX;
  ctx.save();
  ctx.translate(sx + p.w / 2, p.y + p.h / 2);
  ctx.scale(p.facing, 1);
  if (p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0)
    ctx.globalAlpha = 0.4;

  const crouch = p.crouching;
  const legY = crouch ? 14 : 18;
  const legSwing = Math.sin(p.frame * 0.5) * (crouch ? 2 : 4);
  const pantHeight = crouch ? 8 : 12;
  const bodyTop = crouch ? -6 : -10;
  const bodyHeight = crouch ? 14 : 20;
  const headTop = crouch ? -16 : -23;
  const hairHeight = crouch ? 4 : 6;
  const eyeY = headTop + 7;
  const gunY = crouch ? -3 : -5;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, p.h / 2 + 2, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const isImageSkin = p.skin && p.skin.startsWith("player") && typeof playerImages !== 'undefined' && playerImages[p.skin] && playerImages[p.skin].complete;

  if (isImageSkin) {
    ctx.drawImage(playerImages[p.skin], -p.w/2 - 10, -p.h/2 - 10 + (crouch?8:0), p.w + 20, p.h + 10);
  } else {
    // Boots
    ctx.fillStyle = "#4a2a10";
    ctx.fillRect(-9, legY + legSwing, 10, 6);
    ctx.fillRect(1, legY - legSwing, 10, 6);
    // Pants
    ctx.fillStyle = "#1a3a6a";
    ctx.fillRect(-9, 8, 9, pantHeight);
    ctx.fillRect(1, 8, 9, pantHeight);
    // Body
    let bodyCol = "#3a7bd5"; // default blue
    if (p.skin && p.skin !== "default") {
      if (p.skin === "steel") bodyCol = "#888888";
      else if (p.skin === "neon") bodyCol = "#00ffcc";
      else if (p.skin === "gold") bodyCol = "#ffaa00";
      else if (p.skin === "cyborg") bodyCol = "#7722ff";
    } else if (p.weapon === "rocket") {
      bodyCol = "#cc4400";
    } else if (p.weapon === "shotgun") {
      bodyCol = "#226633";
    }
    ctx.fillStyle = bodyCol;
    ctx.fillRect(-11, bodyTop, 22, bodyHeight);
    // Belt
    ctx.fillStyle = "#884400";
    ctx.fillRect(-11, 8, 22, 4);
    // Head
    ctx.fillStyle = "#f5c78e";
    ctx.fillRect(-7, headTop, 14, 14);
    // Hair
    ctx.fillStyle = "#b87020";
    ctx.fillRect(-7, headTop, 14, hairHeight);
    // Eye
    ctx.fillStyle = "#222";
    ctx.fillRect(2, eyeY, 3, 3);
    // Shoulder pad
    ctx.fillStyle = "#2255aa";
    ctx.fillRect(-13, Math.max(-10, bodyTop), 6, 8);
  }
  // Gun visual
  const wep = WEAPONS[p.weapon];
  const shotProgress = p.shootAnim / 14;
  const recoil = p.shootAnim > 0 ? Math.sin(shotProgress * Math.PI) * 5 : 0;
  ctx.fillStyle = "#333";
  if (p.weapon === "rifle") {
    ctx.fillRect(9 + recoil, gunY, 22, 7);
    ctx.fillStyle = "#666";
    ctx.fillRect(27 + recoil, gunY + 1, 9, 5);
  } else if (p.weapon === "shotgun") {
    ctx.fillRect(9 + recoil, gunY - 2, 18, 10);
    ctx.fillStyle = "#555";
    ctx.fillRect(24 + recoil, gunY - 1, 10, 6);
    ctx.fillRect(24 + recoil, gunY + 4, 10, 6);
  } else {
    ctx.fillStyle = "#cc3300";
    ctx.fillRect(9 + recoil, gunY - 2, 26, 12);
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(31 + recoil, gunY - 1, 8, 10);
  }
  ctx.restore();
}

function drawEnemy(e) {
  const sx = e.x - camX;
  if (sx + e.w < -20 || sx > W + 20) return;
  ctx.save();
  ctx.translate(sx + e.w / 2, e.y + e.h / 2);
  ctx.scale(e.facing, 1);

  if (e.type === "drone") {
    // Drone body
    const hov = Math.sin(Date.now() / 200 + e.sinOffset) * 4;
    ctx.translate(0, hov);
    ctx.fillStyle = "#cc2200";
    ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = "#ff4400";
    ctx.fillRect(-8, -14, 16, 6);
    // Rotors
    const rot = Date.now() / 100;
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    [-18, 18].forEach((rx) => {
      ctx.save();
      ctx.translate(rx, -10);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.restore();
    });
    // Eye
    ctx.fillStyle = "#ff0";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f00";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    // Gun
    ctx.fillStyle = "#444";
    ctx.fillRect(12, -3, 14, 6);
  } else {
    const isH = e.type === "heavy";
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, e.h / 2 + 2, isH ? 17 : 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Boots
    ctx.fillStyle = "#3a1a08";
    ctx.fillRect(-10, 18 + Math.sin(e.frame * 0.5) * 4, 11, 6);
    ctx.fillRect(1, 18 - Math.sin(e.frame * 0.5) * 4, 11, 6);
    // Pants
    ctx.fillStyle = "#2a1010";
    ctx.fillRect(-10, 8, 10, 12 + Math.sin(e.frame * 0.5) * 4);
    ctx.fillRect(2, 8, 10, 12 - Math.sin(e.frame * 0.5) * 4);
    // Body
    ctx.fillStyle = isH ? "#7a1010" : "#aa2020";
    ctx.fillRect(-13, -12, isH ? 28 : 24, isH ? 24 : 22);
    // Helmet
    ctx.fillStyle = "#cc1111";
    ctx.fillRect(-10, -26, 20, 14);
    ctx.fillStyle = "rgba(255,200,0,0.6)";
    ctx.fillRect(-6, -22, 12, 5);
    // Face
    ctx.fillStyle = "#c06040";
    ctx.fillRect(-7, -24, 14, 12);
    // Eye
    ctx.fillStyle = "#ff0";
    ctx.fillRect(2, -20, 4, 4);
    // Weapon
    if (e.weapon === "knife") {
      ctx.fillStyle = "#444";
      ctx.fillRect(12, -4, 4, 18);
      ctx.fillStyle = "#aaa";
      ctx.fillRect(14, 2, 12, 3);
      ctx.fillRect(14, -6, 3, 4);
    } else {
      ctx.fillStyle = "#222";
      if (isH) {
        ctx.fillRect(12, -4, 20, 8);
        ctx.fillStyle = "#444";
        ctx.fillRect(28, -5, 10, 6);
      } else {
        ctx.fillRect(11, -3, 18, 6);
        ctx.fillStyle = "#444";
        ctx.fillRect(25, -2, 8, 4);
      }
    }
    if (isH) {
      // Armor plate
      ctx.fillStyle = "rgba(180,30,30,0.6)";
      ctx.fillRect(-14, -13, 6, 24);
    }
  }

  // HP bar (always facing right)
  ctx.scale(1 / e.facing, 1);
  const bw = e.w + 10;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-bw / 2, -e.h / 2 - 12, bw, 6);
  ctx.fillStyle = "#f00";
  ctx.fillRect(-bw / 2, -e.h / 2 - 12, (e.hp / e.maxHp) * bw, 6);
  ctx.strokeStyle = "#500";
  ctx.lineWidth = 1;
  ctx.strokeRect(-bw / 2, -e.h / 2 - 12, bw, 6);
  ctx.restore();
}

function drawBoss(b) {
  if (!b) return;
  const sx = b.x - camX;
  ctx.save();
  ctx.translate(sx + b.w / 2, b.y + b.h / 2);
  ctx.scale(b.facing, 1);
  const pulse = 0.95 + Math.sin(Date.now() / 200) * 0.05;
  ctx.scale(pulse, pulse);
  const rageColor = b.rage ? "#ff0000" : "#880000";
  // Shadow
  ctx.fillStyle = "rgba(200,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(0, b.h / 2 + 4, 40, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = "#2a0808";
  ctx.fillRect(-20, 20 + Math.sin(b.frame * 0.4) * 6, 22, 28);
  ctx.fillRect(4, 20 - Math.sin(b.frame * 0.4) * 6, 22, 28);
  // Body
  const bg = ctx.createLinearGradient(-40, -20, 40, 40);
  bg.addColorStop(0, rageColor);
  bg.addColorStop(1, "#440000");
  ctx.fillStyle = bg;
  ctx.fillRect(-38, -28, 76, 52);
  // Armor plates
  ctx.fillStyle = "rgba(80,0,0,0.7)";
  ctx.fillRect(-38, -28, 12, 52);
  ctx.fillRect(26, -28, 12, 52);
  ctx.fillRect(-38, -28, 76, 12);
  // Head
  ctx.fillStyle = "#cc2020";
  ctx.fillRect(-22, -54, 44, 28);
  ctx.fillStyle = "#990000";
  ctx.fillRect(-24, -58, 48, 12);
  // Visor
  ctx.fillStyle = b.rage ? "#ff4400" : "#ffcc00";
  ctx.fillRect(-16, -52, 32, 10);
  ctx.shadowColor = b.rage ? "#ff0" : "#ff8800";
  ctx.shadowBlur = 8;
  ctx.fillRect(-12, -50, 24, 6);
  ctx.shadowBlur = 0;
  // Eyes
  ctx.fillStyle = "#ff0";
  ctx.beginPath();
  ctx.arc(-8, -46, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -46, 4, 0, Math.PI * 2);
  ctx.fill();
  // Cannon arm
  ctx.fillStyle = "#550000";
  ctx.fillRect(36, -20, 22, 18);
  ctx.fillStyle = "#333";
  ctx.fillRect(54, -18, 20, 14);
  ctx.fillStyle = "#cc2200";
  ctx.beginPath();
  ctx.arc(72, -11, 8, 0, Math.PI * 2);
  ctx.fill();
  // Shield arm
  ctx.fillStyle = "#440000";
  ctx.fillRect(-56, -22, 22, 28);
  ctx.fillStyle = "#aa1111";
  ctx.fillRect(-62, -18, 18, 22);
  // Spikes
  [
    [-10, -54],
    [-5, -58],
    [5, -58],
    [10, -54],
  ].forEach(([sx2, sy2]) => {
    ctx.fillStyle = "#660000";
    ctx.beginPath();
    ctx.moveTo(sx2, sy2);
    ctx.lineTo(sx2 - 4, sy2 - 12);
    ctx.lineTo(sx2 + 4, sy2 - 12);
    ctx.fill();
  });

  // HP bar
  ctx.scale(1 / b.facing, 1);
  const bw = 180;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(-bw / 2, -b.h / 2 - 22, bw, 14);
  const hpGrad = ctx.createLinearGradient(
    -bw / 2,
    -b.h / 2 - 22,
    bw / 2,
    -b.h / 2 - 22,
  );
  hpGrad.addColorStop(0, "#ff0000");
  hpGrad.addColorStop(1, "#ff6600");
  ctx.fillStyle = hpGrad;
  ctx.fillRect(-bw / 2, -b.h / 2 - 22, (b.hp / b.maxHp) * bw, 14);
  ctx.strokeStyle = "#ff4400";
  ctx.lineWidth = 2;
  ctx.strokeRect(-bw / 2, -b.h / 2 - 22, bw, 14);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px Courier New";
  ctx.textAlign = "center";
  ctx.fillText(`👹 BOSS  ${b.hp}/${b.maxHp}`, -0, -b.h / 2 - 12);
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.translate(-camX, 0);
  for (const b of bullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.rocket) {
      // Rocket trail
      if (b.trail)
        for (let i = 0; i < b.trail.length; i++) {
          const t = b.trail[i];
          ctx.globalAlpha = (i / b.trail.length) * 0.5;
          ctx.fillStyle = "#ff8800";
          ctx.beginPath();
          ctx.arc(
            t.x - b.x,
            t.y - b.y,
            4 * (i / b.trail.length),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      ctx.globalAlpha = 1;
      const ang = Math.atan2(b.vy, b.vx);
      ctx.rotate(ang);
      ctx.fillStyle = "#cc3300";
      ctx.fillRect(-14, -5, 28, 10);
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.arc(14, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.arc(16, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,200,50,0.3)";
      ctx.fillRect(-b.vx * 3, -2, b.vx * 3, 4);
      ctx.fillStyle = "#ffee44";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,50,0.4)";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const b of enemyBullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = "#ff3322";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,50,30,0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const g of grenades) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = "#228800";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#66cc00";
    ctx.fillRect(-2, -10, 4, 8);
    ctx.strokeStyle = "#aaff00";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawExplosions() {
  for (const ex of explosions) {
    const sx = ex.x - camX;
    ctx.save();
    ctx.globalAlpha = ex.life * 0.7;
    const g = ctx.createRadialGradient(
      sx,
      ex.y,
      0,
      sx,
      ex.y,
      ex.r * (2 - ex.life),
    );
    g.addColorStop(0, "rgba(255,255,180,0.9)");
    g.addColorStop(0.4, "rgba(255,100,0,0.7)");
    g.addColorStop(1, "rgba(255,40,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, ex.y, ex.r * (2 - ex.life), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMuzzleFlashes() {
  for (const f of muzzleFlashes) {
    const alpha = f.life / f.maxLife;
    const size = f.size * (1 + 0.8 * (1 - alpha));
    ctx.fillStyle = `rgba(255,235,170,${alpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(f.x - camX, f.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,175,80,${alpha * 0.55})`;
    ctx.beginPath();
    ctx.arc(f.x - camX, f.y, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  for (const p of particles) {
    const sx = p.x - camX;
    if (sx < -20 || sx > W + 20) continue;
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPickups() {
  ctx.save();
  ctx.translate(-camX, 0);
  for (const pu of pickups) {
    const bob = Math.sin(Date.now() / 300) * 5;
    ctx.save();
    ctx.translate(pu.x, pu.y - bob);
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 2;
    const cols = {
      health: "#ff3333",
      shotgun: "#aa4400",
      rocket: "#cc2200",
      grenade: "#226600",
      score: "#4488ff",
    };
    ctx.fillStyle = cols[pu.type] || "#4488ff";
    ctx.fillRect(-13, -13, 26, 26);
    ctx.strokeRect(-13, -13, 26, 26);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px Courier New";
    ctx.textAlign = "center";
    const icons = {
      health: "♥",
      shotgun: "💥",
      rocket: "🚀",
      grenade: "💣",
      score: "★",
    };
    ctx.fillText(icons[pu.type] || "★", 0, 6);
    ctx.restore();
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════════════
function update() {
  if (!gameRunning) return;

  // Camera follow player
  const targetCam = player.x - W / 2 + player.w / 2;
  camX += (targetCam - camX) * 0.08;
  camX = Math.max(0, Math.min(WORLD_W - W, camX));

  // Screen shake
  screenShake = Math.max(0, screenShake - 1);

  // Player input
  const standH = 40;
  const crouchH = 24;
  const crouchPressed = keys["ArrowDown"] || keys["s"] || keys["S"];
  if (crouchPressed && player.onGround) {
    if (!player.crouching) {
      player.crouching = true;
      player.y += standH - crouchH;
      player.h = crouchH;
    }
  } else if (player.crouching) {
    player.crouching = false;
    player.y -= standH - crouchH;
    player.h = standH;
  }

  const spd = player.crouching ? 3.2 : 4.5;
  player.vx = 0;
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    player.vx = -spd;
    player.facing = -1;
  }
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    player.vx = spd;
    player.facing = 1;
  }
  if (
    (keys["ArrowUp"] || keys["w"] || keys["W"]) &&
    player.onGround &&
    !player.jumpPressed
  ) {
    player.vy = -13;
    player.jumpPressed = true;
    playSound("jump");
  }
  if (!keys["ArrowUp"] && !keys["w"] && !keys["W"]) player.jumpPressed = false;
  if (keys["Shift"] && player.dashCd <= 0) {
    player.vx = player.facing * 20;
    player.dashCd = 55;
    spawnParticles(
      player.x + player.w / 2,
      player.y + player.h / 2,
      "#88aaff",
      8,
      5,
    );
    player.invincible = Math.max(player.invincible, 15);
  }
  if (keys[" "] || keys["z"] || keys["Z"]) playerShoot();
  if ((keys["g"] || keys["G"]) && !keys._gPrev) throwGrenade();
  keys._gPrev = keys["g"] || keys["G"];
  if ((keys["q"] || keys["Q"]) && !keys._qPrev) switchWeapon();
  keys._qPrev = keys["q"] || keys["Q"];
  if ((keys["m"] || keys["M"]) && !keys._mPrev) {
    toggleSound();
  }
  keys._mPrev = keys["m"] || keys["M"];

  player.shootCd = Math.max(0, player.shootCd - 1);
  player.shootAnim = Math.max(0, player.shootAnim - 1);
  player.dashCd = Math.max(0, player.dashCd - 1);
  player.invincible = Math.max(0, player.invincible - 1);
  player.grenadeCD = Math.max(0, player.grenadeCD - 1);
  if (Math.abs(player.vx) > 0.5) {
    player.frameTimer++;
    if (player.frameTimer > 5) {
      player.frame++;
      player.frameTimer = 0;
    }
  }

  for (const f of muzzleFlashes) {
    f.life -= 1;
  }
  muzzleFlashes = muzzleFlashes.filter((f) => f.life > 0);

  applyPhysics(player);

  // Rockets – update trail
  for (const b of bullets) {
    if (b.rocket) {
      if (!b.trail) b.trail = [];
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();
    }
  }

  // Enemy AI
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = player.x - e.x,
      dy = player.y - e.y;
    const dist = Math.abs(dx);
    const bossActive = boss && !boss.dead;
    e.facing = dx > 0 ? 1 : -1;

    if (e.type === "drone") {
      // Fly toward player
      e.vx = e.facing * 2.5;
      e.vy = dy > 0 ? 1.5 : -1.5;
      e.y += Math.sin(Date.now() / 400 + e.sinOffset) * 0.8; // hover wobble

      e.shootCd--;
      if (e.shootCd <= 0 && dist < 420) {
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        enemyBullets.push({
          x: e.x + e.w / 2,
          y: e.y + e.h * 0.3,
          vx: (dx / len) * 7,
          vy: (dy / len) * 7,
          life: 80,
        });
        e.shootCd = 50;
      }
    } else if (e.weapon === "knife") {
      // Knife enemies close in and only deal melee damage
      e.meleeCd = Math.max(0, e.meleeCd - 1);
      if (bossActive) {
        e.vx = 0;
        if (dist < 40 && e.meleeCd <= 0) {
          e.meleeCd = 40;
          if (player.invincible <= 0) {
            player.hp -= 10 * DIFFICULTY_SETTINGS[difficulty].damageMult;
            player.invincible = 35;
            spawnParticles(
              player.x + player.w / 2,
              player.y + player.h / 2,
              "#ff4444",
              10,
            );
            screenShake = 5;
            playSound("hurt");
          }
        }
      } else {
        const speed = e.type === "heavy" ? 1.8 : 2.4;
        if (dist > 40) {
          e.vx = e.facing * speed;
        } else {
          e.vx = 0;
          if (e.meleeCd <= 0) {
            e.meleeCd = 40;
            if (player.invincible <= 0) {
              player.hp -= 10 * DIFFICULTY_SETTINGS[difficulty].damageMult;
              player.invincible = 35;
              spawnParticles(
                player.x + player.w / 2,
                player.y + player.h / 2,
                "#ff4444",
                10,
              );
              screenShake = 5;
              playSound("hurt");
            }
          }
        }
      }
      if (player.y < e.y - 60 && e.onGround && Math.random() < 0.02) e.vy = -12;
    } else {
      if (bossActive) {
        // On boss level, gun enemies stand still and shoot
        e.vx = 0;
        e.facing = dx > 0 ? 1 : -1;
        if (player.y < e.y - 60 && e.onGround && Math.random() < 0.02)
          e.vy = -12;
      } else {
        // Gun enemies keep range and shoot from afar
        const speed = e.type === "heavy" ? 1.5 : 2.2;
        const minSafe = 180;
        const maxApproach = 320;
        if (dist < minSafe) {
          e.vx = -e.facing * speed * 1.2;
        } else if (dist > maxApproach) {
          e.vx = e.facing * speed;
        } else {
          e.vx = 0;
        }
        if (e.x <= 20) e.vx = speed;
        if (e.x + e.w >= WORLD_W - 20) e.vx = -speed;
        e.facing = dx > 0 ? 1 : -1;
        if (player.y < e.y - 60 && e.onGround && Math.random() < 0.02)
          e.vy = -12;
      }

      e.shootCd--;
      if (e.shootCd <= 0 && dist < 420) {
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = e.type === "heavy" ? 6 : 5;
        enemyBullets.push({
          x: e.x + e.w / 2,
          y: e.y + e.h * 0.3,
          vx: (dx / len) * speed,
          vy: (dy / len) * speed,
          life: 80,
        });
        e.shootCd = e.type === "heavy" ? 100 : 65;
      }
    }
    e.frameTimer++;
    if (e.frameTimer > 6) {
      e.frame++;
      e.frameTimer = 0;
    }
    applyPhysics(e);
  }

  // Boss AI
  if (boss && !boss.dead) {
    const dx = player.x - boss.x,
      dy = player.y - boss.y;
    boss.facing = dx > 0 ? 1 : -1;
    boss.rage = boss.hp < boss.maxHp * 0.4;

    // Boss stands in place and only shoots, instead of chasing the player.
    boss.vx = 0;

    boss.shootCd--;
    const rate = boss.rage ? 25 : 40;
    if (boss.shootCd <= 0) {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Spread shots when raging
      const shots = boss.rage ? 3 : 1;
      for (let i = 0; i < shots; i++) {
        const spread = (i - (shots - 1) / 2) * 0.2;
        const ang = Math.atan2(dy, dx) + spread;
        enemyBullets.push({
          x: boss.x + boss.w / 2,
          y: boss.y + boss.h * 0.3,
          vx: Math.cos(ang) * 8,
          vy: Math.sin(ang) * 8,
          life: 90,
          boss: true,
        });
      }
      boss.shootCd = rate;
    }
    boss.frameTimer++;
    if (boss.frameTimer > 8) {
      boss.frame++;
      boss.frameTimer = 0;
    }
    applyPhysics(boss);
  }

  // Move bullets
  for (const b of bullets) {
    b.x += b.vx * gameSpeed;
    b.y += b.vy * gameSpeed;
    b.life--;
  } // MODIFIED
  for (const b of enemyBullets) {
    b.x += b.vx * gameSpeed;
    b.y += b.vy * gameSpeed;
    b.life--;
  } // MODIFIED

  // Grenade physics
  for (const g of grenades) {
    g.vy += 0.5 * gameSpeed; // MODIFIED
    g.x += g.vx * gameSpeed; // MODIFIED
    g.y += g.vy * gameSpeed; // MODIFIED
    // Bounce
    for (const p of platforms) {
      if (
        g.x > p.x &&
        g.x < p.x + p.w &&
        g.y + 7 > p.y &&
        g.y + 7 < p.y + p.h + 10 &&
        g.vy > 0
      ) {
        g.y = p.y - 7;
        g.vy *= -0.5;
        g.vx *= 0.7;
        g.bounces--;
      }
    }
    if (g.y > 440) {
      g.y = 440;
      g.vy *= -0.5;
      g.vx *= 0.7;
      g.bounces--;
    }
    g.life--;
    if (g.life <= 0 || g.bounces < 0) {
      // EXPLODE
      g.life = -1;
      spawnExplosion(g.x, g.y, 80);
      // Damage enemies in radius
      for (const e of enemies) {
        const ex = e.x + e.w / 2,
          ey = e.y + e.h / 2;
        if (Math.sqrt((ex - g.x) ** 2 + (ey - g.y) ** 2) < 80) {
          e.hp -= 6;
          if (e.hp <= 0) {
            e.dead = true;
            kills++;
            score += e.type === "heavy" ? 300 : 150;
            const coinReward = Math.round(
              (e.type === "heavy" ? 18 : 10) * DIFFICULTY_SETTINGS[difficulty].countMult,
            );
            coins += coinReward;
            savePersistentData();
          }
        }
      }
      if (boss) {
        const bx = boss.x + boss.w / 2,
          by = boss.y + boss.h / 2;
        if (Math.sqrt((bx - g.x) ** 2 + (by - g.y) ** 2) < 80) {
          boss.hp -= 15;
          if (boss.hp <= 0) killBoss();
        }
      }
    }
  }
  grenades.splice(0, grenades.length, ...grenades.filter((g) => g.life > 0));

  // Bullet-platform
  for (const b of bullets) {
    if (b.life <= 0) continue;
    for (const p of platforms) {
      if (b.x > p.x && b.x < p.x + p.w && b.y > p.y && b.y < p.y + p.h) {
        if (b.rocket) {
          spawnExplosion(b.x, b.y, 60);
          b.life = 0;
        } else {
          b.life = 0;
          spawnParticles(b.x, b.y, "#ffcc44", 4);
        }
      }
    }
  }

  // Bullet-enemy
  for (const b of bullets) {
    if (b.life <= 0) continue;
    for (const e of enemies) {
      if (e.dead) continue;
      if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
        if (b.rocket) {
          spawnExplosion(b.x, b.y, 60);
          b.life = 0;
        } else {
          b.life = 0;
          spawnParticles(b.x, b.y, "#ff4400", 5);
        }
        e.hp -= b.damage * DIFFICULTY_SETTINGS[difficulty].playerDamageMult;
        if (e.hp <= 0) {
          e.dead = true;
          kills++;
          score += e.type === "heavy" ? 300 : e.type === "drone" ? 200 : 100;
          const coinReward = Math.round(
            (e.type === "heavy" ? 18 : e.type === "drone" ? 14 : 10) * DIFFICULTY_SETTINGS[difficulty].countMult,
          );
          coins += coinReward;
          savePersistentData();
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#ff2200", 14);
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#ffcc44", 6);
          if (Math.random() < 0.4) dropPickup(e.x + e.w / 2, e.y);
        }
      }
    }
  }

  // Rocket explosion damages enemies
  for (const ex of explosions) {
    if (ex.justDamaged) continue;
    ex.justDamaged = true;
    for (const e of enemies) {
      const ex2 = e.x + e.w / 2,
        ey = e.y + e.h / 2;
      if (Math.sqrt((ex2 - ex.x) ** 2 + (ey - ex.y) ** 2) < ex.r) {
        e.hp -= 8;
        if (e.hp <= 0) {
          e.dead = true;
          kills++;
          score += 200;
          const coinReward = Math.round(10 * DIFFICULTY_SETTINGS[difficulty].countMult);
          coins += coinReward;
          savePersistentData();
          spawnParticles(ex2, ey, "#ff2200", 10);
        }
      }
    }
    if (boss) {
      const bx = boss.x + boss.w / 2,
        by = boss.y + boss.h / 2;
      if (Math.sqrt((bx - ex.x) ** 2 + (by - ex.y) ** 2) < ex.r) {
        boss.hp -= 12;
        if (boss.hp <= 0) killBoss();
      }
    }
  }

  // Bullet-boss
  for (const b of bullets) {
    if (b.life <= 0 || !boss || boss.dead) continue;
    if (
      b.x > boss.x &&
      b.x < boss.x + boss.w &&
      b.y > boss.y &&
      b.y < boss.y + boss.h
    ) {
      if (b.rocket) {
        spawnExplosion(b.x, b.y, 70);
        b.life = 0;
      } else {
        b.life = 0;
        spawnParticles(b.x, b.y, "#ff8800", 6);
      }
      boss.hp -= b.damage * DIFFICULTY_SETTINGS[difficulty].playerDamageMult;
      screenShake = Math.max(screenShake, 4);
      if (boss.hp <= 0) killBoss();
    }
  }

  // Enemy bullet-player
  if (player.invincible <= 0) {
    for (const b of enemyBullets) {
      if (b.life <= 0) continue;
      if (
        b.x > player.x &&
        b.x < player.x + player.w &&
        b.y > player.y &&
        b.y < player.y + player.h
      ) {
        b.life = 0;
        const damage =
          (b.boss ? 18 : 10) * DIFFICULTY_SETTINGS[difficulty].damageMult;
        player.hp -= damage;
        player.invincible = 45;
        spawnParticles(
          player.x + player.w / 2,
          player.y + player.h / 2,
          "#ff4444",
          8,
        );
        screenShake = 6;
        playSound("hurt");
        if (player.hp <= 0) {
          player.lives = Math.max(0, player.lives - 1);
          if (player.lives > 0) {
            player.hp = player.maxHp;
            respawnPlayer();
            return;
          }
          endGame();
          return;
        }
      }
    }
  }

  // Pickups
  for (const pu of pickups) {
    if (pu.taken) continue;
    const px = player.x + player.w / 2,
      py = player.y + player.h / 2;
    if (Math.abs(px - pu.x) < 20 && Math.abs(py - pu.y) < 20) {
      pu.taken = true;
      playSound("pickup");
      if (pu.type === "health") {
        player.hp = Math.min(player.maxHp, player.hp + 35);
      } else if (pu.type === "shotgun") {
        WEAPONS.shotgun.ammo = 20;
        player.weapon = "shotgun";
      } else if (pu.type === "rocket") {
        WEAPONS.rocket.ammo = 6;
        player.weapon = "rocket";
      } else if (pu.type === "grenade") {
        player.grenades = Math.min(player.grenades + 2, 9);
      } else {
        score += 300;
      }
      updateWeaponUI();
      document.getElementById("grenadeDisplay2").textContent = player.grenades;
      spawnParticles(pu.x, pu.y, "#ffcc00", 10);
    }
  }

  // Particles & explosions
  for (const p of particles) {
    p.x += p.vx * gameSpeed;
    p.y += p.vy * gameSpeed;
    p.vy += 0.15 * gameSpeed;
    p.life -= 0.04;
    p.size *= 0.97;
  } // MODIFIED
  for (const ex of explosions) {
    ex.life -= 0.05;
  }

  // Cleanup
  bullets.splice(0, bullets.length, ...bullets.filter((b) => b.life > 0));
  enemyBullets.splice(
    0,
    enemyBullets.length,
    ...enemyBullets.filter((b) => b.life > 0),
  );
  enemies.splice(0, enemies.length, ...enemies.filter((e) => !e.dead));
  particles.splice(
    0,
    particles.length,
    ...particles.filter((p) => p.life > 0 && p.size > 0.3),
  );
  pickups.splice(0, pickups.length, ...pickups.filter((p) => !p.taken));
  explosions.splice(
    0,
    explosions.length,
    ...explosions.filter((e) => e.life > 0),
  );

  // Level complete?
  if (enemies.length === 0 && !boss) {
    wave++;
    score += 500 + wave * 100;
    spawnWave(wave);
  }

  // Update UI
  const hpPercent = Math.max(0, Math.floor((player.hp / player.maxHp) * 100));
  document.getElementById("healthFill").style.width = hpPercent + "%";
  const hpPercEl = document.getElementById("healthPerc");
  if (hpPercEl) hpPercEl.textContent = hpPercent + "%";
  document.getElementById("killsDisplay").textContent = kills;
  document.getElementById("livesDisplay").textContent = player.lives;
  document.getElementById("scoreDisplay").textContent = score;
  const coinLabel = document.getElementById("coinDisplay");
  if (coinLabel) coinLabel.textContent = coins;
  document.getElementById("waveDisplay").textContent = wave;
  document.getElementById("ammoDisplay").textContent =
    WEAPONS[player.weapon].ammo < 0 ? "∞" : WEAPONS[player.weapon].ammo;
}
function killBoss() {
  if (!boss || boss.dead) return;
  boss.dead = true;
  kills += 10;
  score += 3000 + boss.level * 1000;
  coins += 75;
  savePersistentData();
  spawnExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2, 120);
  spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ff4400", 30, 10);
  spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ffcc44", 20, 8);
  for (let i = 0; i < 4; i++) dropPickup(boss.x + i * 20, boss.y);
  setTimeout(() => {
    boss = null;
    wave++;
    spawnWave(wave);
  }, 2000);
}

function dropPickup(x, y) {
  const types = ["health", "shotgun", "rocket", "grenade", "score"];
  const w = [0.35, 0.2, 0.15, 0.15, 0.15];
  let r = Math.random(),
    t = 0;
  for (let i = 0; i < types.length; i++) {
    r -= w[i];
    if (r <= 0) {
      t = i;
      break;
    }
  }
  pickups.push({ x, y, type: types[t] });
}

function switchWeapon() {
  const ws = Object.keys(WEAPONS);
  const idx = ws.indexOf(player.weapon);
  player.weapon = ws[(idx + 1) % ws.length];
  updateWeaponUI();
}

// ═══════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════
