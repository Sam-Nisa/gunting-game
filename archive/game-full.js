// ═══════════════════════════════════════════════════
//  AUDIO ENGINE (Web Audio API procedural sounds)
// ═══════════════════════════════════════════════════
const AC = new (window.AudioContext || window.webkitAudioContext)();
// NEW: Master sound control
const masterGain = AC.createGain();
masterGain.connect(AC.destination);
let soundOn = true;
// MODIFIED: musicOn is removed, replaced by universal soundOn
let musicGain,
  musicNodes = [];

// NEW: Function to toggle ALL sound
function toggleSound(forceState) {
  soundOn = forceState !== undefined ? forceState : !soundOn;
  masterGain.gain.setValueAtTime(soundOn ? 1 : 0, AC.currentTime);
  const icon = soundOn ? "🔊" : "🔇";
  const btn1 = document.getElementById("soundToggleBtn");
  if (btn1) btn1.innerHTML = `${icon} SOUND`;
  const btn2 = document.getElementById("inGameSoundToggle");
  if (btn2) btn2.textContent = icon;

  if (soundOn && gameRunning) {
    startMusic();
  } else {
    stopMusic();
  }
}

function playSound(type) {
  if (AC.state === "suspended") AC.resume();
  const g = AC.createGain();
  g.connect(masterGain); // MODIFIED: Connect to masterGain instead of destination
  const now = AC.currentTime;

  if (type === "shoot") {
    const o = AC.createOscillator(),
      n = AC.createOscillator();
    const ng = AC.createGain();
    o.frequency.setValueAtTime(800, now);
    o.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    n.type = "sawtooth";
    n.frequency.value = 120;
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.connect(g);
    n.connect(ng);
    ng.connect(g);
    o.start(now);
    o.stop(now + 0.1);
    n.start(now);
    n.stop(now + 0.1);
  } else if (type === "shotgun") {
    for (let i = 0; i < 3; i++) {
      const o = AC.createOscillator(),
        gn = AC.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(400 + i * 200, now);
      o.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      gn.gain.setValueAtTime(0.2, now);
      gn.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.connect(gn);
      gn.connect(g);
      o.start(now + i * 0.02);
      o.stop(now + 0.2);
    }
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  } else if (type === "rocket") {
    const o = AC.createOscillator(),
      lfo = AC.createOscillator(),
      lfog = AC.createGain();
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(60, now + 0.4);
    lfo.frequency.value = 30;
    lfog.gain.value = 40;
    lfo.connect(lfog);
    lfog.connect(o.frequency);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    o.connect(g);
    o.start(now);
    o.stop(now + 0.5);
    lfo.start(now);
    lfo.stop(now + 0.5);
  } else if (type === "explode") {
    const buf = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5);
    const s = AC.createBufferSource(),
      f = AC.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 600;
    s.buffer = buf;
    s.connect(f);
    f.connect(g);
    g.gain.setValueAtTime(0.7, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    s.start(now);
    s.stop(now + 0.6);
  } else if (type === "jump") {
    const o = AC.createOscillator();
    o.frequency.setValueAtTime(200, now);
    o.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g);
    o.start(now);
    o.stop(now + 0.15);
  } else if (type === "pickup") {
    [600, 800, 1000].forEach((f, i) => {
      const o = AC.createOscillator(),
        gg = AC.createGain();
      o.frequency.value = f;
      o.type = "sine";
      gg.gain.setValueAtTime(0.12, now + i * 0.06);
      gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
      o.connect(gg);
      gg.connect(g);
      o.start(now + i * 0.06);
      o.stop(now + i * 0.06 + 0.12);
    });
  } else if (type === "hurt") {
    const o = AC.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(300, now);
    o.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o.connect(g);
    o.start(now);
    o.stop(now + 0.2);
  } else if (type === "die") {
    [300, 250, 200, 150].forEach((f, i) => {
      const o = AC.createOscillator(),
        gg = AC.createGain();
      o.frequency.value = f;
      o.type = "sawtooth";
      gg.gain.setValueAtTime(0.18, now + i * 0.1);
      gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
      o.connect(gg);
      gg.connect(g);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.18);
    });
  } else if (type === "boss_roar") {
    const o = AC.createOscillator(),
      lfo = AC.createOscillator(),
      lfog = AC.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(60, now);
    o.frequency.exponentialRampToValueAtTime(30, now + 1);
    lfo.frequency.value = 8;
    lfog.gain.value = 20;
    lfo.connect(lfog);
    lfog.connect(o.frequency);
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1);
    o.connect(g);
    o.start(now);
    o.stop(now + 1);
    lfo.start(now);
    lfo.stop(now + 1);
  }
}

function startMusic() {
  stopMusic();
  if (!soundOn) return; // MODIFIED: Check global soundOn
  if (AC.state === "suspended") AC.resume();
  const mg = AC.createGain();
  mg.gain.value = 0.12;
  mg.connect(masterGain); // MODIFIED: Connect to masterGain
  musicGain = mg;
  // Drum pattern
  const bpm = 140,
    beat = 60 / bpm;
  function scheduleDrums() {
    const t = AC.currentTime;
    for (let i = 0; i < 16; i++) {
      const bt = t + i * beat;
      // kick
      if (i % 4 === 0) {
        const o = AC.createOscillator(),
          g2 = AC.createGain();
        o.frequency.setValueAtTime(150, bt);
        o.frequency.exponentialRampToValueAtTime(40, bt + 0.15);
        g2.gain.setValueAtTime(1, bt);
        g2.gain.exponentialRampToValueAtTime(0.001, bt + 0.2);
        o.connect(g2);
        g2.connect(mg);
        o.start(bt);
        o.stop(bt + 0.2);
      }
      // snare
      if (i % 4 === 2) {
        const buf = AC.createBuffer(1, AC.sampleRate * 0.15, AC.sampleRate);
        const d2 = buf.getChannelData(0);
        for (let j = 0; j < d2.length; j++)
          d2[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / d2.length, 2);
        const s = AC.createBufferSource(),
          gn = AC.createGain();
        s.buffer = buf;
        gn.gain.setValueAtTime(0.5, bt);
        gn.gain.exponentialRampToValueAtTime(0.001, bt + 0.15);
        s.connect(gn);
        gn.connect(mg);
        s.start(bt);
        s.stop(bt + 0.15);
      }
      // hi-hat
      const hbuf = AC.createBuffer(1, AC.sampleRate * 0.05, AC.sampleRate);
      const hd = hbuf.getChannelData(0);
      for (let j = 0; j < hd.length; j++)
        hd[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / hd.length, 3);
      const hs = AC.createBufferSource(),
        hg = AC.createGain(),
        hf = AC.createBiquadFilter();
      hf.type = "highpass";
      hf.frequency.value = 8000;
      hs.buffer = hbuf;
      hs.connect(hf);
      hf.connect(hg);
      hg.connect(mg);
      hg.gain.setValueAtTime(0.3, bt);
      hg.gain.exponentialRampToValueAtTime(0.001, bt + 0.05);
      hs.start(bt);
      hs.stop(bt + 0.05);
    }
    // Bass melody
    const bassNotes = [40, 40, 47, 45, 43, 43, 50, 48];
    bassNotes.forEach((note, i) => {
      const freq = 55 * Math.pow(2, (note - 33) / 12);
      const o = AC.createOscillator(),
        gn = AC.createGain();
      o.type = "sawtooth";
      o.frequency.value = freq;
      const bt2 = t + i * beat * 2;
      gn.gain.setValueAtTime(0.4, bt2);
      gn.gain.exponentialRampToValueAtTime(0.001, bt2 + beat * 1.8);
      o.connect(gn);
      gn.connect(mg);
      o.start(bt2);
      o.stop(bt2 + beat * 2);
    });
  }
  scheduleDrums();
  const id = setInterval(scheduleDrums, beat * 16 * 1000);
  musicNodes = [id];
}

function stopMusic() {
  if (musicNodes.length) {
    musicNodes.forEach((id) => clearInterval(id));
    musicNodes = [];
  }
  if (musicGain) {
    musicGain.disconnect();
    musicGain = null;
  } // MODIFIED: Properly disconnect
}

// ═══════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = 900,
  H = 480;
let keys = {},
  mouseX = 0,
  mouseY = 0;
let score = 0,
  kills = 0,
  wave = 1,
  gameRunning = false;
let screenShake = 0;
let highScores = JSON.parse(localStorage.getItem("mf_scores") || "[]");

// NEW: Global speed modifier. 1.0 is normal speed. 0.6 is 60% speed (slower).
const gameSpeed = 0.4;

// WORLD SIZE (wider for scrolling)
const WORLD_W = 2400;
let camX = 0;

// NEW: Difficulty Settings
let difficulty = "normal";
const DIFFICULTY_SETTINGS = {
  easy: {
    hpMult: 0.7,
    damageMult: 0.8,
    countMult: 0.65,
    playerDamageMult: 1.2,
  },
  normal: {
    hpMult: 1.0,
    damageMult: 1.0,
    countMult: 1.0,
    playerDamageMult: 1.0,
  },
  hard: {
    hpMult: 1.5,
    damageMult: 1.3,
    countMult: 1.45,
    playerDamageMult: 0.9,
  },
};

function setDifficulty(level) {
  difficulty = level;
  document
    .querySelectorAll(".diffBtn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .getElementById(`diff${level.charAt(0).toUpperCase() + level.slice(1)}`)
    .classList.add("active");
}

// ═══════════════════════════════════════════════════
//  PLATFORMS (world-space)
// ═══════════════════════════════════════════════════
const platforms = [
  // Ground sections
  { x: 0, y: 440, w: 600, h: 40 },
  { x: 620, y: 440, w: 600, h: 40 },
  { x: 1240, y: 440, w: 600, h: 40 },
  { x: 1860, y: 440, w: 600, h: 40 },
  // Mid platforms
  { x: 80, y: 340, w: 160, h: 18 },
  { x: 350, y: 280, w: 140, h: 18 },
  { x: 560, y: 340, w: 160, h: 18 },
  { x: 800, y: 280, w: 140, h: 18 },
  { x: 1000, y: 340, w: 160, h: 18 },
  { x: 1200, y: 260, w: 120, h: 18 },
  { x: 1380, y: 330, w: 160, h: 18 },
  { x: 1580, y: 280, w: 140, h: 18 },
  { x: 1780, y: 340, w: 160, h: 18 },
  { x: 1980, y: 270, w: 140, h: 18 },
  { x: 2150, y: 340, w: 150, h: 18 },
  { x: 2320, y: 280, w: 120, h: 18 },
  // High platforms
  { x: 150, y: 210, w: 120, h: 18 },
  { x: 440, y: 190, w: 100, h: 18 },
  { x: 700, y: 200, w: 120, h: 18 },
  { x: 920, y: 180, w: 100, h: 18 },
  { x: 1100, y: 190, w: 120, h: 18 },
  { x: 1450, y: 195, w: 100, h: 18 },
  { x: 1660, y: 180, w: 120, h: 18 },
  { x: 1900, y: 195, w: 100, h: 18 },
  { x: 2100, y: 185, w: 120, h: 18 },
];

// Trees (world-space)
const treeData = [];
for (let i = 0; i < 20; i++)
  treeData.push({
    x: 80 + i * 115,
    y: 90 + Math.sin(i) * 30,
    s: 0.8 + Math.random() * 0.6,
  });

// ═══════════════════════════════════════════════════
//  WEAPONS
// ═══════════════════════════════════════════════════
const WEAPONS = {
  rifle: {
    name: "RIFLE",
    icon: "🔫",
    ammo: -1,
    damage: 1,
    rate: 8,
    speed: 16,
    spread: 0,
    bullets: 1,
    sound: "shoot",
  },
  shotgun: {
    name: "SHOTGUN",
    icon: "💥",
    ammo: 20,
    damage: 2,
    rate: 25,
    speed: 13,
    spread: 0.25,
    bullets: 6,
    sound: "shotgun",
  },
  rocket: {
    name: "ROCKET",
    icon: "🚀",
    ammo: 6,
    damage: 10,
    rate: 45,
    speed: 10,
    spread: 0,
    bullets: 1,
    sound: "rocket",
    rocket: true,
  },
};

// ═══════════════════════════════════════════════════
//  PLAYER
// ═══════════════════════════════════════════════════
let player = {};
function resetPlayer() {
  player = {
    x: 80,
    y: 380,
    vx: 0,
    vy: 0,
    w: 28,
    h: 40,
    hp: 100,
    maxHp: 100,
    lives: 3,
    onGround: false,
    facing: 1,
    dashCd: 0,
    invincible: 0,
    shootCd: 0,
    frame: 0,
    frameTimer: 0,
    shootAnim: 0,
    weapon: "rifle",
    grenades: 3,
    jumpPressed: false,
    grenadeCD: 0,
  };
}

function respawnPlayer() {
  player.x = 80;
  player.y = 380;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.dashCd = 0;
  player.invincible = 0;
  player.shootCd = 0;
  player.frame = 0;
  player.frameTimer = 0;
  player.shootAnim = 0;
  player.weapon = "rifle";
  player.grenades = 3;
  player.jumpPressed = false;
  player.grenadeCD = 0;
  player.hp = player.maxHp;
  updateWeaponUI();
  document.getElementById("grenadeDisplay2").textContent = player.grenades;
}

// ═══════════════════════════════════════════════════
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
  el.textContent = w % 5 === 0 ? `⚠️ BOSS WAVE ${w}!` : `⚡ WAVE ${w}`;
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0"), 2000);
}

function spawnWave(w) {
  announceWave(w);
  const isBossWave = w % 5 === 0;
  if (isBossWave) {
    spawnBoss(w);
    return;
  }
  // MODIFIED: Enemy count adjusted by difficulty
  const count = Math.floor(
    (4 + w * 2) * DIFFICULTY_SETTINGS[difficulty].countMult,
  );
  const startIndex = enemies.length;
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const spawnX = side === 1 ? camX + W + 60 + i * 80 : camX - 80 - i * 80;
    const types = ["grunt", "heavy", "drone"];
    let type = "grunt";
    if (w >= 3 && Math.random() < 0.3) type = "heavy";
    if (w >= 2 && Math.random() < 0.25) type = "drone";
    enemies.push(createEnemy(spawnX, type, w));
  }

  let knifeCount = 0;
  let gunCount = 0;
  for (let i = startIndex; i < enemies.length; i++) {
    if (enemies[i].weapon === "knife") knifeCount++;
    else gunCount++;
  }

  if (knifeCount <= gunCount) {
    let needed = Math.floor(count / 2) + 1;
    let toSwitch = needed - knifeCount;
    for (let i = startIndex; i < enemies.length && toSwitch > 0; i++) {
      if (enemies[i].weapon === "gun" && enemies[i].type !== "drone") {
        enemies[i].weapon = "knife";
        toSwitch--;
      }
    }
  }
}

function createEnemy(ex, type, w) {
  // MODIFIED: HP adjusted by difficulty
  const baseHp =
    (type === "heavy" ? 8 : type === "drone" ? 4 : 3) + Math.floor(w / 2);
  const hp = Math.ceil(baseHp * DIFFICULTY_SETTINGS[difficulty].hpMult);
  let weapon = "gun";
  if (type !== "drone") {
    weapon = Math.random() < 0.5 ? "knife" : "gun";
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
  // MODIFIED: Boss HP adjusted by difficulty
  const baseHp = 80 + level * 40;
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
  const wep = WEAPONS[player.weapon];
  document.getElementById("weaponIcon").textContent = wep.icon;
  document.getElementById("weaponName").textContent = wep.name;
  document.getElementById("ammoDisplay").textContent =
    wep.ammo < 0 ? "∞" : wep.ammo;
}

// ═══════════════════════════════════════════════════
//  DRAWING
// ═══════════════════════════════════════════════════
function worldToScreen(wx, wy) {
  return { x: wx - camX, y: wy };
}

function drawBackground() {
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

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, p.h / 2 + 2, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  ctx.fillStyle = "#4a2a10";
  ctx.fillRect(-9, 18 + Math.sin(p.frame * 0.5) * 4, 10, 6);
  ctx.fillRect(1, 18 - Math.sin(p.frame * 0.5) * 4, 10, 6);
  // Pants
  ctx.fillStyle = "#1a3a6a";
  ctx.fillRect(-9, 8, 9, 12 + Math.sin(p.frame * 0.5) * 4);
  ctx.fillRect(1, 8, 9, 12 - Math.sin(p.frame * 0.5) * 4);
  // Body
  const bodyCol =
    p.weapon === "rocket"
      ? "#cc4400"
      : p.weapon === "shotgun"
        ? "#226633"
        : "#3a7bd5";
  ctx.fillStyle = bodyCol;
  ctx.fillRect(-11, -10, 22, 20);
  // Belt
  ctx.fillStyle = "#884400";
  ctx.fillRect(-11, 8, 22, 4);
  // Head
  ctx.fillStyle = "#f5c78e";
  ctx.fillRect(-7, -23, 14, 14);
  // Hair
  ctx.fillStyle = "#b87020";
  ctx.fillRect(-7, -23, 14, 6);
  // Eye
  ctx.fillStyle = "#222";
  ctx.fillRect(2, -17, 3, 3);
  // Shoulder pad
  ctx.fillStyle = "#2255aa";
  ctx.fillRect(-13, -10, 6, 8);
  // Gun visual
  const wep = WEAPONS[p.weapon];
  const shotProgress = p.shootAnim / 14;
  const recoil = p.shootAnim > 0 ? Math.sin(shotProgress * Math.PI) * 5 : 0;
  ctx.fillStyle = "#333";
  if (p.weapon === "rifle") {
    ctx.fillRect(9 + recoil, -5, 22, 7);
    ctx.fillStyle = "#666";
    ctx.fillRect(27 + recoil, -4, 9, 5);
  } else if (p.weapon === "shotgun") {
    ctx.fillRect(9 + recoil, -7, 18, 10);
    ctx.fillStyle = "#555";
    ctx.fillRect(24 + recoil, -6, 10, 6);
    ctx.fillRect(24 + recoil, -1, 10, 6);
  } else {
    ctx.fillStyle = "#cc3300";
    ctx.fillRect(9 + recoil, -7, 26, 12);
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(31 + recoil, -6, 8, 10);
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
  const spd = 4.5;
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
        // Gun enemies patrol left/right instead of chasing
        const speed = e.type === "heavy" ? 1.5 : 2.2;
        e.vx = e.patrolDir * speed;
        if (e.x <= 20 || e.x + e.w >= WORLD_W - 20) e.patrolDir *= -1;
        if (Math.random() < 0.004) e.patrolDir *= -1;
        e.facing = e.patrolDir;
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
    const speed = boss.rage ? 2.2 : 1.4;
    boss.moveCd--;
    if (boss.moveCd <= 0) {
      boss.vx = boss.facing * speed;
      boss.moveCd = 40 + Math.random() * 60;
    }
    if (player.y < boss.y - 80 && boss.onGround && Math.random() < 0.015)
      boss.vy = -13;

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

  // Wave complete?
  if (enemies.length === 0 && !boss) {
    wave++;
    score += 500 + wave * 100;
    spawnWave(wave);
  }

  // Update UI
  document.getElementById("healthFill").style.width =
    (player.hp / player.maxHp) * 100 + "%";
  document.getElementById("killsDisplay").textContent = kills;
  document.getElementById("livesDisplay").textContent = player.lives;
  document.getElementById("scoreDisplay").textContent = score;
  document.getElementById("waveDisplay").textContent = wave;
  document.getElementById("ammoDisplay").textContent =
    WEAPONS[player.weapon].ammo < 0 ? "∞" : WEAPONS[player.weapon].ammo;
}
function killBoss() {
  if (!boss || boss.dead) return;
  boss.dead = true;
  kills += 10;
  score += 3000 + boss.level * 1000;
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
  update();
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

// ═══════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════
document.addEventListener("keydown", (e) => {
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
document.getElementById("coinDisplay").textContent = coins;
loop();
