// Singing-bowl and bell tones synthesised with the Web Audio API (no audio files to download).
let ctx = null;
const ac = () => {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freqs, { dur = 1.6, gain = 0.18, attack = 0.01 } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(gain, t + attack);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(a.destination);
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
  });
}

export const sounds = {
  bowl: () => tone([[528, 1], [792, 0.45], [1188, 0.2]], { dur: 2.2, gain: 0.16 }), // correct answer, stamp
  bell: () => tone([[880, 1], [1320, 0.35], [2093, 0.15]], { dur: 1.1, gain: 0.12, attack: 0.004 }), // badge
  soft: () => tone([[220, 1], [330, 0.3]], { dur: 0.45, gain: 0.08 }), // wrong answer: gentle, never harsh
  tick: () => tone([[1200, 1]], { dur: 0.08, gain: 0.05, attack: 0.002 }),
};

export function play(name, enabled) {
  if (!enabled) return;
  try { sounds[name]?.(); } catch { /* audio unavailable */ }
}

export const buzz = (ms = 15) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };
