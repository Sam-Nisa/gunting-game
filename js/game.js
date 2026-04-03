// ─────────────────────────────────────────────────────────────────────────────
//  SECURITY: HTML escape helper — use for ALL dynamic content injected via
//  innerHTML to prevent XSS. Never skip this for data from Firestore or user.
// ─────────────────────────────────────────────────────────────────────────────
function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function draw() {
  ctx.save();
  // Screen shake
  if (screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake * 0.5,
    );
  }

  ctx.clearRect(-10, -10, W + 20, H + 20);
  drawBackground();
  drawPlatforms();
  drawPickups();
  drawExplosions();
  drawMuzzleFlashes();
  drawBullets();
  drawParticles();
  for (const e of enemies) drawEnemy(e);
  drawBoss(boss);
  drawPlayer(player);

  // Vignette
  const vig = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.28,
    W / 2,
    H / 2,
    H * 0.88,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Damage flash
  if (player.invincible > 30) {
    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

let lastTime = 0;

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp || performance.now();
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (deltaTime > 250) deltaTime = 250;

  timeScale = deltaTime / (1000 / 144);
  gameSpeed = baseGameSpeed * timeScale;

  if (typeof update === "function") update();
  else console.warn("update() is not available yet");

  draw();
  requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════
//  HIGH SCORES
// ═══════════════════════════════════════════════════
function saveScore(s, k, w) {
  window.highScores.push({
    score: s,
    kills: k,
    wave: w,
    date: new Date().toLocaleDateString(),
  });
  window.highScores.sort((a, b) => b.score - a.score);
  window.highScores = window.highScores.slice(0, 8);
  if (typeof saveUserDataFirebase === "function") saveUserDataFirebase();
}

function savePersistentData() {
  if (typeof saveUserDataFirebase === "function") saveUserDataFirebase();
}

function setPlayerSkin(key) {
  window.selectedSkin = key;
  player.skin = key;
  savePersistentData();
  const skinLabel = document.getElementById("skinDisplay");
  if (skinLabel) skinLabel.textContent = key.toUpperCase();
}

function updateHudUI() {
  const coinLabel = document.getElementById("coinDisplay");
  if (coinLabel) coinLabel.textContent = window.coins;
  const skinLabel = document.getElementById("skinDisplay");
  if (skinLabel) skinLabel.textContent = (window.selectedSkin || 'player1').toUpperCase();
}

function renderLeaderboard() {
  const ul = document.getElementById("lbList");
  if (!ul) return;
  if (!window.highScores.length) {
    ul.innerHTML = "<li>— No scores yet —</li>";
    return;
  }
  // SECURITY: s.score / s.kills / s.wave come from Firestore (user-controlled).
  // escHtml() prevents XSS via stored script injection in the leaderboard.
  ul.innerHTML = window.highScores
    .map(
      (s, i) =>
        `<li>${["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8."][i] || ""} ` +
        `<span style="color:#ffcc00">${escHtml(s.score)}</span> pts — ` +
        `${escHtml(s.kills)} kills | Level ${escHtml(s.wave)}</li>`,
    )
    .join("");
}

// ═══════════════════════════════════════════════════
//  START / END
// ═══════════════════════════════════════════════════
function startGame() {
  if (AC.state === "suspended") AC.resume();
  document.getElementById("overlay").style.display = "none";
  score = 0;
  kills = 0;
  wave = 1;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  particles = [];
  pickups = [];
  grenades = [];
  explosions = [];
  boss = null;
  shopOpen = false;
  camX = 0;
  // Reset weapon ammo
  WEAPONS.shotgun.ammo = 20;
  WEAPONS.rocket.ammo = 6;
  resetPlayer();
  updateWeaponUI();
  updateHudUI();
  document.getElementById("grenadeDisplay2").textContent = "3";
  spawnWave(1);
  gameRunning = true;
  gamePaused = false;
  startMusic();
}

function endGame() {
  gameRunning = false;
  stopMusic();
  playSound("die");
  saveScore(score, kills, wave);
  const ov = document.getElementById("overlay");
  // MODIFIED: Added settings controls back to the Game Over screen
  ov.innerHTML = `
    <h1>💀 GAME OVER</h1>
    <p style="color:#ffcc00;font-size:22px;margin:8px">SCORE: ${score}</p>
    <p style="color:#aaa">Kills: ${kills} &nbsp;|&nbsp; Level: ${wave}</p>
    <div id="leaderboard" style="margin-top:14px;text-align:center">
      <h3 style="color:#ff8800;font-size:13px;letter-spacing:2px;margin-bottom:6px">🏆 HIGH SCORES</h3>
      <ul id="lbList" style="list-style:none;font-size:12px;color:#ccc"></ul>
    </div>
    <div class="settingsWrap" style="flex-direction:row;justify-content:center;margin-bottom:20px;">
      <span id="shopToggleBtnOverlay" class="topActionBtn pulse-anim" style="animation:none;" onclick="toggleShop()" title="Open Shop">🛒 SHOP</span>
      <span id="soundToggleBtn" class="topActionBtn" onclick="toggleSound()">🔊 SOUND</span>
    </div>
    <button class="btn" onclick="startGame()">▶ PLAY AGAIN</button>
  `;
  toggleSound(soundOn); // Re-apply correct sound icon
  renderLeaderboard();
  ov.style.display = "flex";
}

// ═══════════════════════════════════════════════════
//  PAUSE
// ═══════════════════════════════════════════════════
function pauseGame() {
  if (!gameRunning || gamePaused) return;
  gamePaused = true;
  stopMusic();
  const pauseEl = document.getElementById("pauseOverlay");
  if (pauseEl) pauseEl.style.display = "flex";
  const btn = document.getElementById("pauseBtn");
  if (btn) { btn.textContent = "▶"; btn.classList.add("is-paused"); }
}

function resumeGame() {
  if (!gameRunning || !gamePaused) return;
  gamePaused = false;
  startMusic();
  const pauseEl = document.getElementById("pauseOverlay");
  if (pauseEl) pauseEl.style.display = "none";
  const btn = document.getElementById("pauseBtn");
  if (btn) { btn.textContent = "⏸"; btn.classList.remove("is-paused"); }
}

function togglePause() {
  if (!gameRunning) return;
  if (gamePaused) resumeGame();
  else pauseGame();
}

const SHOP_ITEMS = [
  { key: "shotgun", title: "SHOTGUN", cost: 80, ammo: 20, type: "weapon" },
  { key: "rocket", title: "ROCKET", cost: 140, ammo: 6, type: "weapon" },
  { key: "player1", title: "PLAYER 1", cost: 30000, type: "skin" },
  { key: "player2", title: "PLAYER 2", cost: 50000, type: "skin" },
  { key: "player3", title: "PLAYER 3", cost: 650000, type: "skin" },
  { key: "player4", title: "PLAYER 4", cost: 700000, type: "skin" },
  { key: "player5", title: "PLAYER 5", cost: 850000, type: "skin" },
  { key: "player6", title: "PLAYER 6", cost: 1000000, type: "skin" },
];

function renderShop() {
  const ov = document.getElementById("shopModal");
  ov.innerHTML = `
    <h1>🛒 ARMORY</h1>
    <p class="sub">Upgrade your arsenal for the next run.</p>
    <div style="width:100%;text-align:center;margin-bottom:12px;">
      <span style="background:rgba(255,187,0,0.1);color:#ffcc00;padding:6px 12px;border-radius:12px;border:1px solid rgba(255,187,0,0.3);font-weight:700;">🪙 ${window.coins} COINS</span>
    </div>
    <div style="width:100%;display:grid;gap:12px;text-align:left;max-height:200px;overflow-y:auto;padding-right:8px;">
      ${SHOP_ITEMS.map((item, idx) => {
    const isSkin = item.type === "skin";
    const isOwned = isSkin && window.ownedSkins.includes(item.key);
    const isEquipped = isSkin && window.selectedSkin === item.key;
    const canAfford = isOwned || window.coins >= item.cost;
    let btnStyle = canAfford ? "" : "opacity:0.5; filter:grayscale(100%);";
    if (isEquipped) btnStyle = "opacity:0.6;background:#555;border-color:#444;";

    let btnText = 'BUY';
    if (isEquipped) btnText = 'EQUIPPED';
    else if (isOwned) btnText = 'EQUIP';
    else if (!canAfford) btnText = 'LOCKED';

    return `
        <div class="shop-item">
          <div>
            <div style="font-weight:700;color:#ffd660;font-size:16px;display:flex;align-items:center;">
              ${item.title}
              ${item.type === 'skin' && item.key.startsWith('player') ? `<img src="./img/${item.key}.png" style="height:32px;margin-left:12px;" alt="${item.title}">` : ''}
              ${item.type === 'skin' && item.color ? `<span style="display:inline-block;vertical-align:middle;width:14px;height:14px;border-radius:3px;background:${item.color};margin-left:6px;box-shadow:0 0 4px ${item.color}, inset 0 0 4px rgba(255,255,255,0.5);"></span>` : ''}
            </div>
            <div style="font-size:13px;color:#aaa;margin-top:4px;">🔑 Cost: <span style="color:${isOwned ? '#44ff44' : (canAfford ? '#ffcc00' : '#ff4444')}">${isOwned ? 'OWNED' : item.cost}</span></div>
          </div>
          <button class="btn" style="margin-top:0;padding:8px 20px;font-size:13px; ${btnStyle}" onclick="buyWeapon('${escHtml(item.key)}')">
            ${btnText}
          </button>
        </div>
      `}).join("")}
    </div>
    <p style="margin-top:16px;color:#888;font-size:13px;">Current skin: <span style="color:#fff">${(window.selectedSkin || 'player1').toUpperCase()}</span></p>
    <button class="btn" style="background:transparent;box-shadow:none;border:1px solid rgba(255,255,255,0.2)" onclick="toggleShop()">Close Armory</button>
  `;
  ov.style.zIndex = "999";
  ov.style.display = "flex";

  // Explicitly hide the start/game-over screen so they don't fight for clicks or z-index
  if (!gameRunning) {
    const mainOverlay = document.getElementById("overlay");
    if (mainOverlay) mainOverlay.style.display = "none";
  }
}

function closeShop() {
  const ov = document.getElementById("shopModal");
  ov.style.display = "none";
  shopOpen = false;

  // Bring back the start/game-over screen
  if (!gameRunning) {
    const mainOverlay = document.getElementById("overlay");
    if (mainOverlay) mainOverlay.style.display = "flex";
  }
}

function toggleShop() {
  shopOpen = !shopOpen;
  if (shopOpen) {
    renderShop();
  } else {
    closeShop();
  }
}

function buyWeapon(key) {
  const item = SHOP_ITEMS.find((i) => i.key === key);
  if (!item) return;

  const isSkin = item.type === "skin";
  const isOwned = isSkin && window.ownedSkins.includes(key);

  if (!isOwned) {
    if (window.coins < item.cost) {
      alert("NOT ENOUGH COINS! Defeat enemies to earn more.");
      return;
    }
    window.coins -= item.cost;
    if (isSkin) {
      window.ownedSkins.push(key);
    }
  }

  if (isSkin) {
    setPlayerSkin(item.key);
  } else {
    WEAPONS[key].ammo = Math.max(0, WEAPONS[key].ammo) + item.ammo;
    player.weapon = key;
  }

  savePersistentData();
  updateWeaponUI();
  const coinLabel = document.getElementById("coinDisplay");
  if (coinLabel) coinLabel.textContent = window.coins;
  playSound("pickup");
  renderShop(); // Keep shop open and update the UI (coin balance, locked states)
}

// ═══════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════
document.addEventListener("keydown", (e) => {
  // Escape or P — pause / resume (works any time the game is running)
  if ((e.key === "Escape" || e.key === "p" || e.key === "P") && gameRunning) {
    togglePause();
    e.preventDefault();
    return;
  }
  if (e.key === "b" || e.key === "B") {
    if (!gamePaused) toggleShop();
    e.preventDefault();
    return;
  }
  if (!gamePaused) keys[e.key] = true;
  e.preventDefault();
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0 && gameRunning) {
    keys[" "] = true;
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (e.button === 0) {
    keys[" "] = false;
  }
});
canvas.addEventListener("mouseleave", () => {
  keys[" "] = false;
});
canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouseX = e.clientX - r.left;
  mouseY = e.clientY - r.top;
  if (gameRunning)
    player.facing = mouseX + camX > player.x + player.w / 2 ? 1 : -1;
});
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (gameRunning) throwGrenade();
});

renderLeaderboard();
// NEW: Initialize UI state on load
setDifficulty("normal");
updateHudUI();
toggleSound(true);
loop();
