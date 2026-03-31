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
  document.getElementById("soundToggleBtn").textContent = icon;
  document.getElementById("inGameSoundToggle").textContent = icon;

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
