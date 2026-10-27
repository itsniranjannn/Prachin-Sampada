// Audio guide using the browser's built-in speech synthesis (free, works offline on most devices).
import { useCallback, useEffect, useRef, useState } from 'react';

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  const prefs = lang === 'ne' ? ['ne-NP', 'hi-IN', 'ne', 'hi'] : ['en-IN', 'en-GB', 'en-US', 'en'];
  for (const p of prefs) {
    const v = voices.find((x) => x.lang?.toLowerCase().startsWith(p.toLowerCase()));
    if (v) return v;
  }
  return voices[0] || null;
}

/**
 * useNarrator(chapters): chapters = [{ title, text }]
 * returns { supported, playing, paused, chapter, progress, play(i), pause(), resume(), stop(), rate, setRate }
 */
export function useNarrator(chapters, lang = 'en') {
  const [state, setState] = useState({ playing: false, paused: false, chapter: 0, progress: 0 });
  const [rate, setRate] = useState(0.95);
  const cur = useRef(null);

  const stop = useCallback(() => {
    if (!supported()) return;
    window.speechSynthesis.cancel();
    cur.current = null;
    setState((s) => ({ ...s, playing: false, paused: false, progress: 0 }));
  }, []);

  const play = useCallback((i = 0) => {
    if (!supported() || !chapters[i]) return;
    window.speechSynthesis.cancel();
    const text = chapters[i].text;
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.lang = v?.lang || (lang === 'ne' ? 'ne-NP' : 'en-IN');
    u.rate = rate;
    u.pitch = 1;
    u.onboundary = (e) => setState((s) => ({ ...s, progress: Math.min(1, e.charIndex / text.length) }));
    u.onend = () => {
      if (cur.current !== u) return;
      if (i + 1 < chapters.length) play(i + 1);
      else setState({ playing: false, paused: false, chapter: i, progress: 1 });
    };
    cur.current = u;
    setState({ playing: true, paused: false, chapter: i, progress: 0 });
    window.speechSynthesis.speak(u);
  }, [chapters, lang, rate]);

  const pause = useCallback(() => { if (supported()) { window.speechSynthesis.pause(); setState((s) => ({ ...s, paused: true })); } }, []);
  const resume = useCallback(() => { if (supported()) { window.speechSynthesis.resume(); setState((s) => ({ ...s, paused: false })); } }, []);

  useEffect(() => () => { if (supported()) window.speechSynthesis.cancel(); }, []);
  useEffect(() => { if (supported()) window.speechSynthesis.getVoices(); }, []);

  return { supported: supported(), ...state, play, pause, resume, stop, rate, setRate };
}
