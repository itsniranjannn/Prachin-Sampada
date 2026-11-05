// Audio guide using the browser's built-in speech synthesis (free, works offline on most devices).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';

const store = {
  get(k, d) { try { const v = window.localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

const norm = (l) => String(l || '').toLowerCase().replace('_', '-');
const NATURAL = /natural|online|neural/i;
const KNOWN = /neerja|prabhat|swara|madhur|hemkala|sagar|google|heera|ravi/i;

// Language preference per UI language: Nepali first, Hindi can read Devanagari too; English accents most familiar here first.
const LANG_RANK = {
  ne: [['ne-np', 100], ['ne', 95], ['hi-in', 60], ['hi', 55]],
  en: [['en-in', 50], ['en-gb', 46], ['en-us', 42], ['en', 30]],
};

function langScore(v, lang) {
  const l = norm(v.lang);
  for (const [p, s] of LANG_RANK[lang]) if (l === p || l.startsWith(`${p}-`) || (p.length === 2 && l.startsWith(p))) return s;
  return 0;
}

/** Voices that can read `lang`, best first: language match, then natural/neural names, then local ones. */
export function voicesFor(all, lang) {
  return all
    .map((v) => ({ v, s: langScore(v, lang) }))
    .filter((x) => x.s > 0)
    .map((x) => ({ v: x.v, s: x.s + (NATURAL.test(x.v.name) ? 40 : 0) + (KNOWN.test(x.v.name) ? 20 : 0) + (x.v.localService ? 3 : 0) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v);
}

// Voices load asynchronously (Chrome lists none at first, Safari fires no event), so listen and poll for a short while.
function watchVoices(cb) {
  if (!supported()) return () => {};
  const synth = window.speechSynthesis;
  let n = 0;
  const read = () => { const v = synth.getVoices(); if (v.length) cb(v); return v.length; };
  read();
  const poll = setInterval(() => { n += 1; if (read() || n > 20) clearInterval(poll); }, 250);
  const on = () => read();
  synth.addEventListener?.('voiceschanged', on);
  return () => { clearInterval(poll); synth.removeEventListener?.('voiceschanged', on); };
}

// Chrome stops long utterances after about 15 seconds, so speak one sentence-sized chunk at a time.
function chunks(text) {
  const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?।]+[.!?।]*\s*/g) || [String(text)];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > 170 && cur) { out.push(cur); cur = p; } else cur += p;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

export const SAMPLE = {
  en: 'This is how the audio guide will sound. Welcome to Nepal.',
  ne: 'अडियो गाइडको आवाज यस्तो सुनिन्छ। नेपालमा स्वागत छ।',
};

/**
 * useNarrator(chapters, lang): chapters = [{ title, text }], lang = 'en' | 'ne'
 * returns { supported, ready, noVoice, hindiFallback, voices, voice, setVoiceURI, speaking, playing, paused, chapter, progress,
 *           play(i), pause(), resume(), stop(), test(), testing, rate, setRate }
 */
export function useNarrator(chapters, lang = 'en') {
  const [state, setState] = useState({ playing: false, paused: false, chapter: 0, progress: 0, speaking: false, testing: false, failed: false });
  const [rate, setRateState] = useState(() => { const r = parseFloat(store.get('sampada-voice-rate', '0.95')); return r >= 0.7 && r <= 1.3 ? r : 0.95; });
  const [all, setAll] = useState([]);
  const [pref, setPref] = useState(() => store.get(`sampada-voice-${lang}`, ''));
  const token = useRef(0);
  const rateRef = useRef(rate);
  const keep = useRef(null); // Chrome may garbage-collect a live utterance and never fire its events, so hold on to it
  const redo = useRef(null); // restarts the chunk being spoken (used when a pause/resume stalls)
  const guard = useRef(0);
  rateRef.current = rate;

  useEffect(() => watchVoices(setAll), []);
  useEffect(() => { setPref(store.get(`sampada-voice-${lang}`, '')); }, [lang]);

  const voices = useMemo(() => voicesFor(all, lang), [all, lang]);
  const voice = useMemo(() => voices.find((v) => v.voiceURI === pref) || voices[0] || null, [voices, pref]);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const ready = all.length > 0;
  const noVoice = ready && !voice;
  const hindiFallback = !!voice && lang === 'ne' && !norm(voice.lang).startsWith('ne');

  const setRate = useCallback((r) => { setRateState(r); store.set('sampada-voice-rate', String(r)); }, []);
  const setVoiceURI = useCallback((uri) => { setPref(uri); store.set(`sampada-voice-${lang}`, uri); }, [lang]);

  const halt = useCallback(() => {
    token.current += 1;
    clearTimeout(guard.current);
    keep.current = null; redo.current = null;
    if (supported()) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    if (!supported()) return;
    halt();
    setState((s) => ({ ...s, playing: false, paused: false, speaking: false, testing: false, progress: 0 }));
  }, [halt]);

  // Speak one piece of text. Retries once if the engine never starts (a known Chrome stall after cancel()).
  const say = useCallback((text, my, { onStart, onEnd, onBoundary, onFail }) => {
    const synth = window.speechSynthesis;
    let retried = false;
    const go = () => {
      if (token.current !== my) return;
      const u = new window.SpeechSynthesisUtterance(text);
      const v = voiceRef.current;
      if (v) { try { u.voice = v; } catch { /* keep the default voice */ } }
      u.lang = v?.lang || (lang === 'ne' ? 'ne-NP' : 'en-IN');
      u.rate = rateRef.current;
      u.volume = 1;
      let started = false;
      u.onstart = () => { started = true; clearTimeout(guard.current); if (token.current === my) onStart?.(); };
      u.onboundary = (e) => { if (token.current === my) onBoundary?.(e); };
      u.onend = () => { clearTimeout(guard.current); if (token.current === my) onEnd?.(); };
      u.onerror = (e) => {
        clearTimeout(guard.current);
        if (e.error === 'interrupted' || e.error === 'canceled' || token.current !== my) return;
        onFail?.(e.error);
      };
      keep.current = u;
      redo.current = go;
      try { synth.speak(u); } catch { onFail?.('speak-failed'); return; }
      clearTimeout(guard.current);
      guard.current = setTimeout(() => {
        if (started || token.current !== my) return;
        if (!retried) { retried = true; synth.cancel(); setTimeout(go, 80); } else onFail?.('not-started');
      }, 4500);
    };
    go();
  }, [lang]);

  const play = useCallback((i = 0) => {
    if (!supported() || !chapters[i]) return;
    halt();
    const my = token.current;
    if (!voiceRef.current) { setState((s) => ({ ...s, playing: false, paused: false, speaking: false })); return; }
    const text = chapters[i].text;
    const parts = chunks(text);
    let done = 0;
    setState({ playing: true, paused: false, chapter: i, progress: 0, speaking: false, testing: false, failed: false });
    const next = (k) => {
      if (token.current !== my) return;
      if (k >= parts.length) {
        if (i + 1 < chapters.length) play(i + 1);
        else setState({ playing: false, paused: false, chapter: i, progress: 1, speaking: false, testing: false, failed: false });
        return;
      }
      say(parts[k], my, {
        onStart: () => setState((s) => ({ ...s, speaking: true })),
        onBoundary: (e) => setState((s) => ({ ...s, progress: Math.min(1, (done + e.charIndex) / text.length) })),
        onEnd: () => { done += parts[k].length; setState((s) => ({ ...s, speaking: false, progress: Math.min(1, done / text.length) })); next(k + 1); },
        onFail: () => setState((s) => ({ ...s, playing: false, paused: false, speaking: false, failed: true })),
      });
    };
    next(0);
  }, [chapters, halt, say]);

  const test = useCallback(() => {
    if (!supported() || !voiceRef.current) return;
    halt();
    const my = token.current;
    setState((s) => ({ ...s, playing: false, paused: false, speaking: false, testing: true, failed: false }));
    const fin = () => setState((s) => ({ ...s, speaking: false, testing: false }));
    say(SAMPLE[lang], my, {
      onStart: () => setState((s) => ({ ...s, speaking: true })),
      onEnd: fin,
      onFail: () => setState((s) => ({ ...s, speaking: false, testing: false, failed: true })),
    });
  }, [halt, say, lang]);

  const pause = useCallback(() => {
    if (!supported()) return;
    window.speechSynthesis.pause();
    setState((s) => ({ ...s, paused: true, speaking: false }));
  }, []);

  const resume = useCallback(() => {
    if (!supported()) return;
    const synth = window.speechSynthesis;
    synth.resume();
    setState((s) => ({ ...s, paused: false, speaking: true }));
    // some engines never recover from pause(): if nothing is speaking shortly after, restart the current sentence
    const my = token.current;
    setTimeout(() => { if (token.current === my && !synth.speaking && !synth.pending) redo.current?.(); }, 600);
  }, []);

  // a changed language or chapter list means whatever is being read is now stale
  useEffect(() => { if (supported()) { halt(); setState((s) => (s.playing || s.testing ? { ...s, playing: false, paused: false, speaking: false, testing: false, progress: 0 } : s)); } }, [lang, halt]);
  useEffect(() => () => { if (supported()) halt(); }, [halt]);

  return { supported: supported(), ready, noVoice, hindiFallback, voices, voice, setVoiceURI, ...state, play, pause, resume, stop, test, rate, setRate };
}
