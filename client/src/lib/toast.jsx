import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { usePrefs } from './prefs.jsx';
import { play } from './sound.js';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const { sound } = usePrefs();
  const push = useCallback((msg, kind = 'info', ms = 3800) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-3), { id, msg, kind }]);
    if (kind === 'badge') play('bell', sound);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), ms);
  }, [sound]);
  const Icon = { ok: CheckCircle2, err: TriangleAlert, badge: Award, info: Info };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => {
            const I = Icon[t.kind] || Info;
            return (
              <motion.div key={t.id} className={`toast ${t.kind}`} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}>
                <I size={20} style={{ flex: 'none', marginTop: 2, color: t.kind === 'badge' ? '#C8962E' : undefined }} />
                <div>{t.msg}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/** Announce any badges returned by the API. */
export function announceBadges(push, badges) {
  for (const b of badges || []) push(<span>Badge earned: <b>{b.name}</b> <span lang="ne">{b.np}</span></span>, 'badge', 5200);
}
