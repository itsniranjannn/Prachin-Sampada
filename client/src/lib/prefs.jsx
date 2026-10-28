// User preferences kept in localStorage: theme (light / dark / dhoop outdoor), sound, Nepali-first labels.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PrefCtx = createContext(null);
const KEY = 'sampada-prefs';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export function PrefsProvider({ children }) {
  const saved = load();
  const [theme, setTheme] = useState(saved.theme || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [sound, setSound] = useState(true); // sound effects are always on (no toggle); the narrator only speaks when asked
  const [nepali, setNepali] = useState(saved.nepali ?? false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.lang = nepali ? 'ne' : 'en';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#17110D' : '#3B2416');
    try { localStorage.setItem(KEY, JSON.stringify({ theme, sound, nepali })); } catch { /* ignore */ }
  }, [theme, sound, nepali]);

  const value = useMemo(() => ({ theme, setTheme, sound, setSound, nepali, setNepali }), [theme, sound, nepali]);
  return <PrefCtx.Provider value={value}>{children}</PrefCtx.Provider>;
}

export const usePrefs = () => useContext(PrefCtx);

export const PROV_NP = { Koshi: 'कोशी', Madhesh: 'मधेश', Bagmati: 'बागमती', Gandaki: 'गण्डकी', Lumbini: 'लुम्बिनी', Karnali: 'कर्णाली', Sudurpashchim: 'सुदूरपश्चिम' };
const DIGITS = '०१२३४५६७८९';

/** Bilingual helper. t(en, np) picks the text for the current language; t.nepali, t.n(number) (Devanagari digits)
 *  and t.prov(province) help with generated sentences. */
export function useT() {
  const { nepali } = usePrefs();
  const t = (en, np) => (nepali && np ? np : en);
  t.nepali = nepali;
  t.n = (x) => (nepali ? String(x).replace(/\d/g, (d) => DIGITS[d]) : x);
  t.prov = (p) => (nepali ? PROV_NP[p] || p : p);
  return t;
}
