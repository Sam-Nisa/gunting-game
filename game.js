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

function loop() {
  if (typeof update === "function") update();
  else console.warn("update() is not available yet");
  draw();
  requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════
//  HIGH SCORES
// ═══════════════════════════════════════════════════
function saveScore(s, k, w) {
  highScores.push({
    score: s,
    kills: k,
    wave: w,
    date: new Date().toLocaleDateString(),
  });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 8);
  localStorage.setItem("mf_scores", JSON.stringify(highScores));
}

function renderLeaderboard() {
  const ul = document.getElementById("lbList");
  if (!highScores.length) {
    ul.innerHTML = "<li>— No scores yet —</li>";
    return;
  }
  ul.innerHTML = highScores
    .map(
      (s, i) => `
    <li>${["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8."][i] || ""} <span style="color:#ffcc00">${s.score}</span> pts — ${s.kills} kills | Wave ${s.wave}</li>
  `,
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
  coins = 0;
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
  document.getElementById("grenadeDisplay2").textContent = "3";
  spawnWave(1);
  gameRunning = true;
  startMusic();
}

function endGame() {
  gameRunning = false;
  stopMusic();
  playSound("die");
  saveScore(score, kills, wave);
  renderLeaderboard();
  const ov = document.getElementById("overlay");
  // MODIFIED: Added settings controls back to the Game Over screen
  ov.innerHTML = `
    <h1>💀 GAME OVER</h1>
    <p style="color:#ffcc00;font-size:22px;margin:8px">SCORE: ${score}</p>
    <p style="color:#aaa">Kills: ${kills} &nbsp;|&nbsp; Wave: ${wave} &nbsp;|&nbsp; Difficulty: ${difficulty.toUpperCase()}</p>
    <div id="leaderboard" style="margin-top:14px;text-align:center">
      <h3 style="color:#ff8800;font-size:13px;letter-spacing:2px;margin-bottom:6px">🏆 HIGH SCORES</h3>
      <ul id="lbList" style="list-style:none;font-size:12px;color:#ccc">${highScores.map((s, i) => `<li>${["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8."][i] || ""} <span style="color:#ffcc00">${s.score}</span> pts — Wave ${s.wave}</li>`).join("")}</ul>
    </div>
    <div class="settingsWrap">
      <div class="difficultySelect">
        <span>DIFFICULTY:</span>
        <button id="diffEasy" class="diffBtn" onclick="setDifficulty('easy')">EASY</button>
        <button id="diffNormal" class="diffBtn" onclick="setDifficulty('normal')">NORMAL</button>
        <button id="diffHard" class="diffBtn" onclick="setDifficulty('hard')">HARD</button>
      </div>
      <div><span id="soundToggleBtn" class="soundToggle" onclick="toggleSound()">🔊</span></div>
    </div>
    <button class="btn" onclick="startGame()">▶ PLAY AGAIN</button>
  `;
  setDifficulty(difficulty); // Re-apply active class to current difficulty
  toggleSound(soundOn); // Re-apply correct sound icon
  ov.style.display = "flex";
}

const SHOP_ITEMS = [
  { key: "shotgun", title: "SHOTGUN", cost: 80, ammo: 20 },
  { key: "rocket", title: "ROCKET", cost: 140, ammo: 6 },
];

function renderShop() {
  const ov = document.getElementById("overlay");
  ov.innerHTML = `
    <h1>🛒 SHOP</h1>
    <p class="sub">Buy better guns using coins earned from kills.</p>
    <div style="width:100%;margin-top:16px;display:grid;gap:12px;text-align:left;">
      ${SHOP_ITEMS.map((item, idx) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid rgba(255,255,255,0.12);border-radius:14px;">
          <div>
            <div style="font-weight:700;color:#ffd660;">${idx + 1}. ${item.title}</div>
            <div style="font-size:13px;color:#ddd;">Cost: ${item.cost} coins</div>
          </div>
          <button class="btn" onclick="buyWeapon('${item.key}')">BUY</button>
        </div>
      `).join("")}
    </div>
    <p style="margin-top:18px;color:#ccc;">Coins available: ${coins}</p>
    <button class="btn" onclick="toggleShop()">Close shop</button>
  `;
  ov.style.display = "flex";
}

function closeShop() {
  const ov = document.getElementById("overlay");
  ov.style.display = "none";
  shopOpen = false;
}

function toggleShop() {
  if (!gameRunning) return;
  shopOpen = !shopOpen;
  if (shopOpen) {
    renderShop();
  } else {
    closeShop();
  }
}

function buyWeapon(key) {
  const item = SHOP_ITEMS.find((i) => i.key === key);
  if (!item || coins < item.cost) return;
  coins -= item.cost;
  WEAPONS[key].ammo = item.ammo;
  player.weapon = key;
  updateWeaponUI();
  document.getElementById("coinDisplay").textContent = coins;
  playSound("pickup");
  toggleShop();
}

// ═══════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════
document.addEventListener("keydown", (e) => {
  if (e.key === "b" || e.key === "B") {
    if (gameRunning) toggleShop();
    e.preventDefault();
    return;
  }
  keys[e.key] = true;
  e.preventDefault();
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});
canvas.addEventListener("click", () => {
  if (gameRunning) {
    keys[" "] = true;
    setTimeout(() => (keys[" "] = false), 80);
  }
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
toggleSound(true);
loop();
