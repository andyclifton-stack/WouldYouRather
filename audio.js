/* ═══════════════════════════════════════════════
   AUDIO ENGINE — Web Audio API Synthesiser
   Zero external assets. All sounds procedural.
   ═══════════════════════════════════════════════ */

let ctx = null;
let isMuted = false;
let bgGainNode = null;
let bgOscillators = [];

function getCtx() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

/* ── UTILITY ── */
function noise(duration, freq = 1000) {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1;

    src.connect(filter);
    return { src, filter, duration };
}

function tone(freq, duration, type = 'sine') {
    const c = getCtx();
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    return { osc, gain, duration };
}

/* ── SOUND EFFECTS ── */

/**
 * Swoosh — filtered noise sweep. For transitions.
 */
export function swoosh() {
    if (isMuted) return;
    const c = getCtx();
    const { src, filter, duration } = noise(0.3, 2000);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    filter.frequency.setValueAtTime(800, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, c.currentTime + 0.2);
    filter.connect(gain).connect(c.destination);
    src.start(c.currentTime);
    src.stop(c.currentTime + 0.3);
}

/**
 * Tick — short sine blip. For countdown.
 */
export function tick() {
    if (isMuted) return;
    const c = getCtx();
    const { osc, gain } = tone(880, 0.08);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.08);
}

/**
 * Urgent tick — higher pitch, for last 2 seconds.
 */
export function urgentTick() {
    if (isMuted) return;
    const c = getCtx();
    const { osc, gain } = tone(1200, 0.06);
    gain.gain.setValueAtTime(0.4, c.currentTime);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.06);
}

/**
 * Lock-in — rising two-tone chord.
 */
export function lockIn() {
    if (isMuted) return;
    const c = getCtx();
    [523, 659, 784].forEach((f, i) => {
        const { osc, gain } = tone(f, 0.25, 'triangle');
        gain.gain.setValueAtTime(0, c.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.2, c.currentTime + i * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        gain.connect(c.destination);
        osc.start(c.currentTime + i * 0.06);
        osc.stop(c.currentTime + 0.35);
    });
}

/**
 * Reveal sting — dramatic chord + cymbal wash.
 */
export function revealSting() {
    if (isMuted) return;
    const c = getCtx();

    // Chord
    [261, 329, 392, 523].forEach(f => {
        const { osc, gain } = tone(f, 1.2, 'sawtooth');
        gain.gain.setValueAtTime(0.12, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 1.3);
    });

    // Cymbal (noise crash)
    const { src, filter } = noise(0.8, 6000);
    const nGain = c.createGain();
    nGain.gain.setValueAtTime(0.15, c.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
    filter.connect(nGain).connect(c.destination);
    src.start(c.currentTime);
    src.stop(c.currentTime + 0.8);
}

/**
 * Match chime — happy major arpeggio.
 */
export function matchChime() {
    if (isMuted) return;
    const c = getCtx();
    [523, 659, 784, 1047].forEach((f, i) => {
        const { osc, gain } = tone(f, 0.4, 'sine');
        gain.gain.setValueAtTime(0, c.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, c.currentTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.4);
        gain.connect(c.destination);
        osc.start(c.currentTime + i * 0.08);
        osc.stop(c.currentTime + i * 0.08 + 0.45);
    });
}

/**
 * Clash buzz — dissonant chord + noise.
 */
export function clashBuzz() {
    if (isMuted) return;
    const c = getCtx();

    [220, 233, 277].forEach(f => {
        const { osc, gain } = tone(f, 0.5, 'square');
        gain.gain.setValueAtTime(0.1, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.55);
    });

    const { src, filter } = noise(0.15, 200);
    const nGain = c.createGain();
    nGain.gain.setValueAtTime(0.12, c.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    filter.connect(nGain).connect(c.destination);
    src.start(c.currentTime);
    src.stop(c.currentTime + 0.15);
}

/**
 * Celebration — festive fanfare for finale.
 */
export function celebration() {
    if (isMuted) return;
    const c = getCtx();
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => {
        const { osc, gain } = tone(f, 0.35, 'triangle');
        gain.gain.setValueAtTime(0, c.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, c.currentTime + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.35);
        gain.connect(c.destination);
        osc.start(c.currentTime + i * 0.1);
        osc.stop(c.currentTime + i * 0.1 + 0.4);
    });
}

/* ── BACKGROUND MUSIC ── */

/**
 * Start the ambient tension loop.
 */
export function startBgMusic() {
    if (isMuted) return;
    // If oscillators exist but AudioContext is suspended, clear them so we can restart properly
    if (bgOscillators.length > 0) {
        if (ctx && ctx.state === 'running') return; // already playing
        // Context was suspended — stop the silent oscillators
        stopBgMusic();
    }
    const c = getCtx();
    // Don't start if context still won't run (no user gesture yet)
    if (c.state === 'suspended') return;

    bgGainNode = c.createGain();
    bgGainNode.gain.value = 0.06;
    bgGainNode.connect(c.destination);

    // Low drone
    const drone = c.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    drone.connect(bgGainNode);
    drone.start();
    bgOscillators.push(drone);

    // Pulsing pad
    const pad = c.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = 110;
    const padGain = c.createGain();
    padGain.gain.value = 0;
    pad.connect(padGain).connect(bgGainNode);
    pad.start();
    bgOscillators.push(pad);

    // LFO for pulse
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // slow pulse
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(padGain.gain);
    lfo.start();
    bgOscillators.push(lfo);

    // Higher shimmer
    const shimmer = c.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 220;
    const shimGain = c.createGain();
    shimGain.gain.value = 0.02;
    shimmer.connect(shimGain).connect(bgGainNode);
    shimmer.start();
    bgOscillators.push(shimmer);
}

/**
 * Stop the background music.
 */
export function stopBgMusic() {
    bgOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) { }
    });
    bgOscillators = [];
    bgGainNode = null;
}

/* ── MUTE CONTROL ── */

export function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
        stopBgMusic();
    } else {
        startBgMusic();
    }
    return isMuted;
}

export function getIsMuted() {
    return isMuted;
}

/**
 * Must be called from a user gesture to unlock AudioContext.
 * Also restarts background music if it was waiting to play.
 */
export function unlockAudio() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            // Restart bg music if it was supposed to be playing but context was suspended
            if (!isMuted && bgOscillators.length === 0) {
                startBgMusic();
            }
        });
    }
}
