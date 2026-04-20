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
  gameRunning = false,
  gamePaused = false,
  shopOpen = false;
window.coins = 0;

window.savedSkin = "player1";
window.selectedSkin = window.savedSkin;

window.savedOwned = ["player1"];
window.ownedSkins = [...window.savedOwned];

const playerImages = {};
for (let i = 1; i <= 6; i++) {
  playerImages[`player${i}`] = new Image();
  playerImages[`player${i}`].src = `./img/player${i}.png`;
}
let screenShake = 0;
window.highScores = [];

// NEW: Global speed modifier. 1.0 is normal speed. 0.5 is slower than current.
let gameSpeed = 0.4;
window.baseGameSpeed = 0.4;
window.timeScale = 1;

// Background image support
const BG_IMAGE_COUNT = 10;
let bgImage = new Image();
let prevBgImage = new Image();
let bgImageLoaded = false;
let prevBgImageLoaded = false;
let bgTransitionAlpha = 1.0;

function setupImage(img, isMain) {
  img.onload = () => { if (isMain) bgImageLoaded = true; else prevBgImageLoaded = true; };
  img.onerror = () => { if (isMain) bgImageLoaded = false; else prevBgImageLoaded = false; };
}
setupImage(bgImage, true);
setupImage(prevBgImage, false);

const BG_NAMES = [
  "Angkor Wat temple",
  "Bayon temple",
  "Baphuon Temple",
  "Beng Mealea",
  "Neak Poan Temple",
  "Song Saa Island",
  "Koh Rong Samloem",
  "Koh Rong",
  "Kampong Chhnang sunset",
  "Kampot sunset"
];

function getBackgroundNameForWave(w) {
  const index = ((w - 1) % BG_IMAGE_COUNT);
  return BG_NAMES[index];
}

function getBackgroundForWave(w) {
  const index = ((w - 1) % BG_IMAGE_COUNT) + 1;
  return `./img/image${index}.png`;
}

function setBackgroundForWave(w) {
  const nextSrc = getBackgroundForWave(w);
  if (bgImage.src && bgImage.src.endsWith(nextSrc.replace('./', ''))) return;

  if (bgImageLoaded) {
    let tempImg = prevBgImage;
    prevBgImage = bgImage;
    bgImage = tempImg;
    
    prevBgImageLoaded = bgImageLoaded;
    bgImageLoaded = false;
    
    setupImage(bgImage, true);
    setupImage(prevBgImage, false);
    
    bgTransitionAlpha = 0.0;
  }
  
  bgImageLoaded = false;
  bgImage.src = nextSrc;
}

setBackgroundForWave(1);
bgTransitionAlpha = 1.0;

// WORLD SIZE (wider for scrolling)
const WORLD_W = 2400;
let camX = 0;

// NEW: Difficulty Settings
let difficulty = "normal";
const DIFFICULTY_SETTINGS = {
  easy: {
    hpMult: 0.7,
    damageMult: 0.8,
    countMult: 0.9,
    gunChance: 0.2,
    playerDamageMult: 1.2,
  },
  normal: {
    hpMult: 1.0,
    damageMult: 1.0,
    countMult: 1.4,
    gunChance: 0.35,
    playerDamageMult: 1.0,
  },
  hard: {
    hpMult: 1.5,
    damageMult: 1.3,
    countMult: 1.9,
    gunChance: 0.45,
    playerDamageMult: 0.9,
  },
};

function setDifficulty(level) {
  difficulty = level;
  const buttons = document.querySelectorAll(".diffBtn");
  buttons.forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(
    `diff${level.charAt(0).toUpperCase() + level.slice(1)}`,
  );
  if (activeBtn) activeBtn.classList.add("active");
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
    icon: "\u{1F52B}", // 🔫
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
    icon: "\u{1F4A5}", // 💥
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
    icon: "\u{1F680}", // 🚀
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
    hp: 500,
    maxHp: 500,
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
    skin: window.selectedSkin || "player1",
    jumpPressed: false,
    grenadeCD: 0,
    crouching: false,
    shields: 0,          // number of shield charges stored
    shieldActive: false, // true while shield is protecting
    shieldTimer: 0,      // frames remaining on active shield (600 = 10 sec at 60fps)
    shieldKey: false,    // debounce
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
  player.skin = window.selectedSkin || "player1";
  player.jumpPressed = false;
  player.grenadeCD = 0;
  player.crouching = false;
  player.hp = player.maxHp;
  // Keep shields on respawn
  if (!player.shields) player.shields = 0;
  if (!player.shieldTimer) player.shieldTimer = 0;
  player.shieldActive = false;
  player.shieldKey = false;
  updateWeaponUI();
  if (typeof updateShieldUI === "function") updateShieldUI();
  document.getElementById("grenadeDisplay2").textContent = player.grenades;
}

// ═══════════════════════════════════════════════════
