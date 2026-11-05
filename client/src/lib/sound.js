// Singing-bowl and bell tones synthesised with the Web Audio API (no audio files to download).
// Browsers keep an AudioContext suspended until the person has touched the page, so the context is created and
// resumed on the first gesture, and nothing plays (or logs a warning) before that.
let ctx = null;
let master = null;
let unlocked = false;

function build() {
  const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!C) return null;
  ctx = new C();
  // a gentle limiter on the master bus keeps overlapping tones (a bowl over ticks) from clipping
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

function unlock() {
  if (typeof window === 'undefined') return;
  unlocked = true;
  try {
    if (!ctx && !build()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  } catch { /* audio unavailable */ }
}

if (typeof window !== 'undefined') {
  const once = () => {
    unlock();
    // keep listening until the context is really running (some browsers need a second touch)
    if (ctx && ctx.state === 'running') ['pointerdown', 'keydown', 'touchend', 'click'].forEach((e) => window.removeEventListener(e, once, true));
  };
  ['pointerdown', 'keydown', 'touchend', 'click'].forEach((e) => window.addEventListener(e, once, { capture: true, passive: true }));
}

const ac = () => {
  if (!unlocked) return null; // no gesture yet: stay silent rather than start a blocked context
  if (!ctx && !build()) return null;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

/** 'running' | 'suspended' | 'none'; used by the self-test and handy when debugging "no sound" reports. */
export const audioState = () => (ctx ? ctx.state : 'none');

function tone(freqs, { dur = 1.6, gain = 0.18, attack = 0.01 } = {}) {
  const a = ac();
  if (!a || a.state === 'closed') return;
  const t = a.currentTime + 0.01;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(gain, t + attack);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(master);
  freqs.forEach(([f, g], i) => {
    const o = a.createOscillator();
    const og = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * (1 + 0.002 * (i + 1)), t + dur); // slight beating like a real bowl
    og.gain.value = g;
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
    o.onended = () => { o.disconnect(); og.disconnect(); if (i === freqs.length - 1) out.disconnect(); };
  });
}

// Gains are tuned so each tone is clearly audible on laptop speakers (low notes need a little more level) yet never loud.
export const sounds = {
  bowl: () => tone([[528, 1], [792, 0.45], [1188, 0.2]], { dur: 2.2, gain: 0.2 }), // correct answer, stamp
  bell: () => tone([[880, 1], [1320, 0.35], [2093, 0.15]], { dur: 1.1, gain: 0.16, attack: 0.004 }), // badge
  soft: () => tone([[294, 1], [440, 0.4], [588, 0.15]], { dur: 0.5, gain: 0.14 }), // wrong answer: gentle, never harsh
  tick: () => tone([[1200, 1], [1800, 0.3]], { dur: 0.09, gain: 0.09, attack: 0.002 }),
};

export function play(name, enabled = true) {
  if (!enabled) return;
  try { sounds[name]?.(); } catch { /* audio unavailable */ }
}

export const buzz = (ms = 15) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };
