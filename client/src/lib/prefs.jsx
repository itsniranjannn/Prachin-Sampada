// User preferences kept in localStorage: theme (light / dark / dhoop outdoor), sound, Nepali-first labels.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PrefCtx = createContext(null);
const KEY = 'sampada-prefs';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export function PrefsProvider({ children }) {
  const saved = load();
  const [theme, setTheme] = useState(saved.theme || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [sound, setSound] = useState(saved.sound ?? false); // muted until the user turns it on
  const [nepali, setNepali] = useState(saved.nepali ?? false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#17110D' : '#3B2416');
    try { localStorage.setItem(KEY, JSON.stringify({ theme, sound, nepali })); } catch { /* ignore */ }
  }, [theme, sound, nepali]);

  const value = useMemo(() => ({ theme, setTheme, sound, setSound, nepali, setNepali }), [theme, sound, nepali]);
  return <PrefCtx.Provider value={value}>{children}</PrefCtx.Provider>;
}

export const usePrefs = () => useContext(PrefCtx);

/** Bilingual label helper: shows Nepali first when the Nepali toggle is on. */
export function useT() {
  const { nepali } = usePrefs();
  return (en, np) => (nepali && np ? np : en);
}
