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

/**
 * Heartbeat — deep thump for countdown urgency.
 */
export function heartbeat() {
    if (isMuted) return;
    const c = getCtx();
    // Double thump like a real heartbeat
    [0, 0.12].forEach(offset => {
        const { osc, gain } = tone(55, 0.15, 'sine');
        gain.gain.setValueAtTime(0, c.currentTime + offset);
        gain.gain.linearRampToValueAtTime(0.35, c.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + 0.15);
        gain.connect(c.destination);
        osc.start(c.currentTime + offset);
        osc.stop(c.currentTime + offset + 0.2);
    });
}

/**
 * Drumroll — rapid filtered noise with rising pitch. Tension builder.
 */
export function drumroll() {
    if (isMuted) return;
    const c = getCtx();
    const { src, filter } = noise(0.6, 300);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, c.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    filter.frequency.setValueAtTime(200, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1500, c.currentTime + 0.55);
    filter.Q.value = 3;
    filter.connect(gain).connect(c.destination);
    src.start(c.currentTime);
    src.stop(c.currentTime + 0.6);
}

/**
 * Crowd cheer — layered mid-freq noise bursts. For match.
 */
export function crowdCheer() {
    if (isMuted) return;
    const c = getCtx();
    // Multiple noise bursts at different frequencies
    [800, 1200, 2000].forEach((freq, i) => {
        const { src, filter } = noise(1.0, freq);
        const gain = c.createGain();
        gain.gain.setValueAtTime(0, c.currentTime + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.08, c.currentTime + i * 0.05 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0);
        filter.Q.value = 0.5;
        filter.connect(gain).connect(c.destination);
        src.start(c.currentTime + i * 0.05);
        src.stop(c.currentTime + 1.0);
    });
}

/**
 * Crowd gasp — quick inhale noise + descending tone. For clash.
 */
export function crowdGasp() {
    if (isMuted) return;
    const c = getCtx();
    // Inhale noise
    const { src, filter } = noise(0.3, 3000);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.1, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    filter.Q.value = 0.8;
    filter.connect(gain).connect(c.destination);
    src.start(c.currentTime);
    src.stop(c.currentTime + 0.3);
    // Descending "oh no" tone
    const { osc, gain: tGain } = tone(600, 0.5, 'sine');
    tGain.gain.setValueAtTime(0.08, c.currentTime + 0.05);
    tGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    osc.frequency.setValueAtTime(600, c.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.4);
    tGain.connect(c.destination);
    osc.start(c.currentTime + 0.05);
    osc.stop(c.currentTime + 0.55);
}

/**
 * Must be called from a user gesture to unlock AudioContext.
 */
export function unlockAudio() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
}
