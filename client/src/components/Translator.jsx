import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrefs } from '../lib/prefs.jsx';
import { startTranslating, stopTranslating } from '../lib/i18n.js';

/** Mounted once: swaps the interface text for Nepali while the toggle is on, and sets the page language. */
export function Translator() {
  const { nepali } = usePrefs();
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.lang = nepali ? 'ne' : 'en';
    if (nepali) startTranslating(); else stopTranslating();
    return () => stopTranslating();
  }, [nepali]);
  // a new page renders its own text: translate it once React has committed
  useEffect(() => { if (nepali) { startTranslating(); } }, [pathname, nepali]);
  return null;
}
