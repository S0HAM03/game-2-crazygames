import { useGameStore } from '../store';

let ctx = null;
let masterGain = null;
let musicGain = null;
let isMusicPlaying = false;
let chordTimer = null;
let harmonyTimer = null;
let melodyTimer = null;
let currentChordIndex = 0;

let windGainNode = null;
let windNoise = null;
let windFilter = null;

let broomGainNode = null;
let broomNoise = null;
let broomFilter = null;

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

// Beautiful chord progression for relaxing and engaging background music
const CHORD_PROGRESSION = [
  // Cmaj9
  {
    bass: 65.41, // C2
    harmony: [130.81, 196.00, 261.63, 329.63, 392.00, 493.88], // C3, G3, C4, E4, G4, B4
    melody: [523.25, 587.33, 659.25, 783.99, 880.00, 987.77] // C5, D5, E5, G5, A5, B5
  },
  // Fmaj9
  {
    bass: 87.31, // F2
    harmony: [130.81, 174.61, 261.63, 349.23, 392.00, 440.00], // C3, F3, C4, F4, G4, A4
    melody: [523.25, 587.33, 698.46, 783.99, 880.00, 987.77] // C5, D5, F5, G5, A5, B5
  },
  // Am9
  {
    bass: 55.00, // A1
    harmony: [110.00, 196.00, 220.00, 261.63, 329.63, 392.00], // A2, G3, A3, C4, E4, G4
    melody: [440.00, 523.25, 587.33, 659.25, 783.99, 880.00] // A4, C5, D5, E5, G5, A5
  },
  // G6/9
  {
    bass: 73.42, // D2
    harmony: [98.00, 146.83, 196.00, 246.94, 293.66, 392.00], // G2, D3, G3, B3, D4, G4
    melody: [493.88, 587.33, 659.25, 783.99, 880.00, 987.77] // B4, D5, E5, G5, A5, B5
  }
];

// ── Relaxing & Engaging Background Music ────────
export function startBackgroundMusic() {
  if (isMusicPlaying) return;
  isMusicPlaying = true;
  const c = getCtx();
  
  currentChordIndex = 0;

  // Start background wind loop
  startWindSound();

  // Chord Progression Loop (Every 6 seconds, change chord and play bass)
  const nextChord = () => {
    if (!isMusicPlaying) return;
    const chord = CHORD_PROGRESSION[currentChordIndex];
    
    // Play warm bass note (C2, F2, A1, D2) with a very slow decay
    playTone(chord.bass, 'sine', c.currentTime, 5.8, 0.25, 0, musicGain);
    
    currentChordIndex = (currentChordIndex + 1) % CHORD_PROGRESSION.length;
    chordTimer = setTimeout(nextChord, 6000);
  };

  // Harmony/Arpeggio Loop (Every 0.8 seconds, play a soft chord note)
  const playHarmony = () => {
    if (!isMusicPlaying) return;
    const chord = CHORD_PROGRESSION[currentChordIndex];
    
    // Random harmony note
    const freq = chord.harmony[Math.floor(Math.random() * chord.harmony.length)];
    
    // Soft pad note, sine wave, long decay
    playTone(freq, 'sine', c.currentTime, 3.2, 0.08, 0, musicGain);
    
    harmonyTimer = setTimeout(playHarmony, 800 + Math.random() * 400);
  };

  // Melody Loop (Every 1.6 seconds, 65% chance to play a melody note)
  const playMelody = () => {
    if (!isMusicPlaying) return;
    if (Math.random() < 0.65) {
      const chord = CHORD_PROGRESSION[currentChordIndex];
      const freq = chord.melody[Math.floor(Math.random() * chord.melody.length)];
      
      // Melody note: slightly brighter triangle wave, low volume, moderate decay
      playTone(freq, 'triangle', c.currentTime, 1.8, 0.065, 0, musicGain);
    }
    melodyTimer = setTimeout(playMelody, 1500 + Math.random() * 800);
  };

  nextChord();
  playHarmony();
  playMelody();
}

export function stopBackgroundMusic() {
  isMusicPlaying = false;
  if (chordTimer) clearTimeout(chordTimer);
  if (harmonyTimer) clearTimeout(harmonyTimer);
  if (melodyTimer) clearTimeout(melodyTimer);
  stopWindSound();
}

// ── Atmospheric Background Wind whoosh ─────────────────────────
export function startWindSound() {
  const c = getCtx();
  if (windGainNode) return; // Already playing

  windGainNode = c.createGain();
  windGainNode.gain.value = 0.0;
  windGainNode.connect(masterGain);

  windNoise = createNoise(3);
  windNoise.loop = true;
  
  windFilter = c.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 250; // Deep low whoosh
  
  windNoise.connect(windFilter);
  windFilter.connect(windGainNode);
  windNoise.start();

  // Modulate wind intensity slowly
  let t = 0;
  const modulateWind = () => {
    if (!windGainNode) return;
    t += 0.05;
    const vol = 0.04 + Math.sin(t * 0.3) * 0.025;
    windGainNode.gain.setValueAtTime(vol, c.currentTime);
    // Slowly drift filter frequency
    windFilter.frequency.setValueAtTime(200 + Math.sin(t * 0.2) * 80, c.currentTime);
    setTimeout(modulateWind, 100);
  };
  modulateWind();
}

export function stopWindSound() {
  if (!windGainNode) return;
  const c = getCtx();
  windGainNode.gain.linearRampToValueAtTime(0.001, c.currentTime + 0.5);
  
  const n = windNoise;
  const f = windFilter;
  const g = windGainNode;
  
  setTimeout(() => {
    try {
      if (n) n.stop();
      if (n) n.disconnect();
      if (f) f.disconnect();
      if (g) g.disconnect();
    } catch(e) {}
  }, 550);

  windGainNode = null;
  windNoise = null;
  windFilter = null;
}

// ── Broom Sweeping Whoosh Sound ────────────────────────────────
export function startBroomSound() {
  const c = getCtx();
  if (broomGainNode) return; // Already playing

  broomGainNode = c.createGain();
  broomGainNode.gain.value = 0.0;
  broomGainNode.connect(masterGain);

  // Highpass filtered noise for brushing/sweeping whoosh
  broomNoise = createNoise(1.5);
  broomNoise.loop = true;
  
  broomFilter = c.createBiquadFilter();
  broomFilter.type = 'bandpass';
  broomFilter.frequency.value = 1100;
  broomFilter.Q.value = 1.2;
  
  broomNoise.connect(broomFilter);
  broomFilter.connect(broomGainNode);
  broomNoise.start();

  // Modulate volume slightly to simulate back-and-forth brushing
  let t = 0;
  const modulate = () => {
    if (!broomGainNode) return;
    t += 0.15;
    const vol = 0.04 + Math.abs(Math.sin(t)) * 0.05;
    broomGainNode.gain.setValueAtTime(vol, c.currentTime);
    setTimeout(modulate, 50);
  };
  modulate();
}

export function stopBroomSound() {
  if (!broomGainNode) return;
  const c = getCtx();
  broomGainNode.gain.linearRampToValueAtTime(0.001, c.currentTime + 0.1);
  
  const n = broomNoise;
  const f = broomFilter;
  const g = broomGainNode;
  
  setTimeout(() => {
    try {
      if (n) n.stop();
      if (n) n.disconnect();
      if (f) f.disconnect();
      if (g) g.disconnect();
    } catch(e) {}
  }, 150);

  broomGainNode = null;
  broomNoise = null;
  broomFilter = null;
}

// ── Vacuum sound loops ─────────────────────────────────────────
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

// ── Grass Footstep Sound ──────────────────────────────────────
export function playGrassFootstep() {
  const c = getCtx();
  const now = c.currentTime;

  // Grass rustle noise burst
  const noise = createNoise(0.08);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 750 + Math.random() * 300;
  filter.Q.value = 1.4;

  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.045, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  
  noise.start(now);
  noise.stop(now + 0.08);
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
