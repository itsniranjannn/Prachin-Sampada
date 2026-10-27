// Audio guide using the browser's built-in speech synthesis (free, works offline on most devices).
import { useCallback, useEffect, useRef, useState } from 'react';

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  const prefs = lang === 'ne' ? ['ne-NP', 'ne', 'hi-IN', 'hi'] : ['en-IN', 'en-GB', 'en-US', 'en'];
  for (const p of prefs) {
    const v = voices.find((x) => x.lang?.toLowerCase().replace('_', '-').startsWith(p.toLowerCase()));
    if (v) return v;
  }
  // an English voice cannot read Devanagari, so Nepali with no ne/hi voice reports "no voice" instead of staying silent
  return lang === 'ne' ? null : (voices[0] || null);
}

// Chrome stops long utterances after about 15 seconds, so speak one sentence-sized chunk at a time.
function chunks(text) {
  const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?।]+[.!?।]*\s*/g) || [text];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > 170 && cur) { out.push(cur); cur = p; } else cur += p;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/**
 * useNarrator(chapters): chapters = [{ title, text }]
 * returns { supported, noVoice, playing, paused, chapter, progress, play(i), pause(), resume(), stop(), rate, setRate }
 */
export function useNarrator(chapters, lang = 'en') {
  const [state, setState] = useState({ playing: false, paused: false, chapter: 0, progress: 0, noVoice: false });
  const [rate, setRate] = useState(0.95);
  const token = useRef(0);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const stop = useCallback(() => {
    if (!supported()) return;
    token.current += 1;
    window.speechSynthesis.cancel();
    setState((s) => ({ ...s, playing: false, paused: false, progress: 0 }));
  }, []);

  const play = useCallback((i = 0) => {
    if (!supported() || !chapters[i]) return;
    const synth = window.speechSynthesis;
    const my = ++token.current;
    synth.cancel();
    const start = () => {
      if (token.current !== my) return;
      const v = pickVoice(lang);
      if (!v && lang === 'ne') { setState((s) => ({ ...s, playing: false, paused: false, noVoice: true })); return; }
      const text = chapters[i].text;
      const parts = chunks(text);
      let done = 0;
      setState({ playing: true, paused: false, chapter: i, progress: 0, noVoice: false });
      const next = (k) => {
        if (token.current !== my) return;
        if (k >= parts.length) {
          if (i + 1 < chapters.length) play(i + 1); else setState({ playing: false, paused: false, chapter: i, progress: 1, noVoice: false });
          return;
        }
        const u = new SpeechSynthesisUtterance(parts[k]);
        if (v) u.voice = v;
        u.lang = v?.lang || (lang === 'ne' ? 'ne-NP' : 'en-IN');
        u.rate = rateRef.current;
        u.onboundary = (e) => setState((s) => ({ ...s, progress: Math.min(1, (done + e.charIndex) / text.length) }));
        u.onend = () => { done += parts[k].length; next(k + 1); };
        u.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; setState((s) => ({ ...s, playing: false, paused: false })); };
        synth.speak(u);
      };
      next(0);
    };
    // voices load asynchronously the first time; wait briefly for them instead of speaking with the wrong one
    if (!synth.getVoices().length) {
      const t = setTimeout(start, 700);
      synth.onvoiceschanged = () => { clearTimeout(t); synth.onvoiceschanged = null; start(); };
    } else start();
  }, [chapters, lang]);

  const pause = useCallback(() => { if (supported()) { window.speechSynthesis.pause(); setState((s) => ({ ...s, paused: true })); } }, []);
  const resume = useCallback(() => { if (supported()) { window.speechSynthesis.resume(); setState((s) => ({ ...s, paused: false })); } }, []);

  useEffect(() => () => { if (supported()) { token.current += 1; window.speechSynthesis.cancel(); } }, []);
  useEffect(() => { if (supported()) window.speechSynthesis.getVoices(); }, []);

  return { supported: supported(), ...state, play, pause, resume, stop, rate, setRate };
}
