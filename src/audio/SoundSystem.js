import { useGameStore } from '../store';

let ctx = null;
let masterGain = null;
let musicGain = null;
let isMusicPlaying = false;
let musicTimer = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = useGameStore.getState().sfxVolume;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = useGameStore.getState().musicVolume;
    musicGain.connect(masterGain);
    
    // Subscribe to volume changes
    useGameStore.subscribe(
      (state) => state.sfxVolume,
      (vol) => { if (masterGain) masterGain.gain.value = vol; }
    );
    useGameStore.subscribe(
      (state) => state.musicVolume,
      (vol) => { if (musicGain) musicGain.gain.value = vol; }
    );
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function createNoise(durationSec) {
  const c = getCtx();
  const bufferSize = c.sampleRate * durationSec;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  return source;
}

function playTone(freq, type, startTime, dur, gainVal, detune = 0, dest = null) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainVal, startTime + 0.02); // Faster attack for acoustic feel
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  osc.connect(g);
  g.connect(dest || masterGain);
  osc.start(startTime);
  osc.stop(startTime + dur);
}

// ── Relaxing Background Music ────────
export function startBackgroundMusic() {
  if (isMusicPlaying) return;
  isMusicPlaying = true;
  const c = getCtx();

  const notes = [261.63, 329.63, 392.00, 493.88]; // C Major 7 (C4, E4, G4, B4)
  
  const playNote = () => {
    if (!isMusicPlaying) return;
    
    // Pick a random note
    const freq = notes[Math.floor(Math.random() * notes.length)];
    
    // Play with a very soft attack and long release (synth pad style)
    playTone(freq, 'sine', c.currentTime, 2.5, 0.3, 0, musicGain);
    
    // Play next note between 0.5s and 1.5s
    musicTimer = setTimeout(playNote, 500 + Math.random() * 1000);
  };
  
  playNote();
}

export function stopBackgroundMusic() {
  isMusicPlaying = false;
  if (musicTimer) clearTimeout(musicTimer);
}

let vacuumNoise = null;
let vacuumHum = null;
let vacuumFilter = null;
let vacuumGainNode = null;

export function startVacuumSound() {
  const c = getCtx();
  if (vacuumGainNode) return; // Already playing

  vacuumGainNode = c.createGain();
  vacuumGainNode.gain.value = 0.0;
  vacuumGainNode.connect(masterGain);

  // Soft hum (sine wave)
  vacuumHum = c.createOscillator();
  vacuumHum.type = 'sine';
  vacuumHum.frequency.value = 85; 
  vacuumHum.connect(vacuumGainNode);
  vacuumHum.start();
  
  // Soft rushing air (lowpass filtered noise)
  vacuumNoise = createNoise(2);
  vacuumNoise.loop = true;
  vacuumFilter = c.createBiquadFilter();
  vacuumFilter.type = 'lowpass';
  vacuumFilter.frequency.value = 400; // soft whoosh
  vacuumNoise.connect(vacuumFilter);
  vacuumFilter.connect(vacuumGainNode);
  vacuumNoise.start();
  
  // Fade in smoothly
  vacuumGainNode.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.3);
}

export function stopVacuumSound() {
  if (!vacuumGainNode) return;
  const c = getCtx();
  
  // Fade out
  vacuumGainNode.gain.linearRampToValueAtTime(0.001, c.currentTime + 0.2);
  
  const h = vacuumHum;
  const n = vacuumNoise;
  const f = vacuumFilter;
  const g = vacuumGainNode;
  
  setTimeout(() => {
    try {
      if (h) h.stop();
      if (n) n.stop();
      if (h) h.disconnect();
      if (n) n.disconnect();
      if (f) f.disconnect();
      if (g) g.disconnect();
    } catch(e) {}
  }, 250);

  vacuumHum = null;
  vacuumNoise = null;
  vacuumFilter = null;
  vacuumGainNode = null;
}

// ── One-Shot Sound Effects ────────────────────────────────────────
export function playLeafPick() {
  const c = getCtx();
  const now = c.currentTime;

  const noise = createNoise(0.12);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2800 + Math.random() * 1200;
  filter.Q.value = 0.8;

  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.15, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.12);
}

// ── Bag Pickup Sound ────────────────────────────────────────────
export function playBagPickup() {
  const c = getCtx();
  const now = c.currentTime;

  playTone(120, 'sine', now, 0.3, 0.35);
  playTone(523.25, 'sine', now + 0.05, 0.5, 0.12); // C5
  playTone(659.25, 'sine', now + 0.12, 0.6, 0.12); // E5
  playTone(783.99, 'sine', now + 0.20, 0.7, 0.15); // G5
}

// ── Compost Bin Deposit Sound ──────────────────────────────────
export function playBinDeposit(leafCount) {
  const c = getCtx();
  const now = c.currentTime;

  const noise = createNoise(0.5);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(2200, now + 0.25);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
  filter.Q.value = 1.2;

  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.2, now + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.5);

  const coinFreqs = [1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1760.0];
  const count = Math.min(leafCount, 8);
  for (let i = 0; i < count; i++) {
    const t = now + 0.15 + i * 0.05;
    const f = coinFreqs[i % coinFreqs.length];
    playTone(f, 'sine', t, 0.35, 0.07);
  }
}

// ── 8-Note Flower Bell Instrument ───────────────────────────────
const FLOWER_BELL_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  698.46, // F5
  783.99, // G5
  880.00, // A5
  987.77, // B5
  1046.50 // C6
];

export function playFlowerBell(noteIndex) {
  const c = getCtx();
  const now = c.currentTime;
  const freq = FLOWER_BELL_FREQS[noteIndex % FLOWER_BELL_FREQS.length] || 523.25;

  playTone(freq, 'sine', now, 1.2, 0.35);
  playTone(freq * 2.005, 'sine', now, 0.8, 0.12);
  playTone(freq * 3.01, 'sine', now, 0.5, 0.05);

  const noise = createNoise(0.04);
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3500;
  const g = c.createGain();
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.04);
}
