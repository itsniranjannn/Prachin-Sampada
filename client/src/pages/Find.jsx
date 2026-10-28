// Find the Monument: a photo and a riddle; drop a pin on the map of the valley or of all Nepal.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Crosshair, Lightbulb, ArrowRight, RotateCcw, Trophy, MapPin, Target, Maximize2, X, Share2, Zap, Clock, Navigation, Compass } from 'lucide-react';
import FindMap from '../components/FindMap.jsx';
import { api, fmtM } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast, announceBadges } from '../lib/toast.jsx';
import { play, buzz } from '../lib/sound.js';
import { seenForServer, markSeen } from '../lib/seen.js';
import { Loader } from '../components/Shell.jsx';
import '../styles/find.css';

const ROUNDS = 5;
const bestKey = (scope) => `sampada-find-best-${scope}`;
const readBest = (scope) => { try { return Number(localStorage.getItem(bestKey(scope))) || 0; } catch { return 0; } };
const writeBest = (scope, v) => { try { localStorage.setItem(bestKey(scope), String(v)); } catch { /* storage blocked */ } };

const useReducedMotion = () => {
  const [r, setR] = useState(() => (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false));
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined;
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(q.matches);
    q.addEventListener?.('change', f);
    return () => q.removeEventListener?.('change', f);
  }, []);
  return r;
};

/** A number that counts up to its value (or just shows it when motion is reduced). */
function CountUp({ value, ms = 800, reduce, prefix = '' }) {
  const t = useT();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setShown(value); from.current = value; return undefined; }
    const a = from.current; const t0 = performance.now(); let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const v = Math.round(a + (value - a) * (1 - (1 - k) ** 3));
      setShown(v); from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduce]);
  return <span className="num">{prefix}{t.n(shown.toLocaleString())}</span>;
}

function Lightbox({ src, credit, alt, onClose, closeLabel }) {
  const btn = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    btn.current?.focus();
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } else if (e.key === 'Tab') e.preventDefault(); };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="fm-lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button ref={btn} className="btn light-ghost close" onClick={onClose} aria-label={closeLabel}><X size={18} /></button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} />
        {credit && <figcaption>{credit}</figcaption>}
      </figure>
    </div>
  );
}

export default function Find() {
  const t = useT();
  const reduce = useReducedMotion();
  const [game, setGame] = useState(null);
  const [i, setI] = useState(0);
  const [pin, setPin] = useState(null);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [hint, setHint] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const [leftMs, setLeftMs] = useState(60000);
  const [scope, setScope] = useState('valley');
  const [final, setFinal] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [note, setNote] = useState('');
  const [best, setBest] = useState(() => ({ valley: readBest('valley'), nepal: readBest('nepal') }));
  const [newBest, setNewBest] = useState(false);
  const t0 = useRef(0);
  const lock = useRef(false);
  const lastSec = useRef(99);
  const map = useRef(null);
  const nextBtn = useRef(null);
  const { user } = useAuth();
  const { sound } = usePrefs();
  const toast = useToast();

  const pinRef = useRef(null); pinRef.current = pin;
  const phase = !game ? 'intro' : final ? 'final' : result ? 'reveal' : 'play';
  const round = game?.rounds[i];
  const total = results.reduce((s, r) => s + r.points, 0);
  const streak = (() => { let n = 0; for (let k = results.length - 1; k >= 0 && results[k].points >= 600; k--) n++; return n; })();
  const dist = (m) => (t.nepali ? (m >= 1000 ? `${t.n((m / 1000).toFixed(1))} किमी` : `${t.n(Math.round(m))} मिटर`) : fmtM(m));

  const toIntro = (msg) => { setGame(null); setFinal(false); setResult(null); setResults([]); setPin(null); setHint(null); setNote(msg || ''); };
  const handleErr = (e) => {
    if (e.status === 404) { toIntro(t('Your game expired, so we cleared it. Start a new one when you are ready.', 'तपाईंको खेल सकियो र हटाइयो। तयार हुँदा नयाँ सुरु गर्नुहोस्।')); return; }
    toast(e.message, 'err');
  };

  const start = async () => {
    if (busy) return;
    setBusy(true); setNote('');
    try {
      const g = await api('/play/game/start', { method: 'POST', body: { rounds: ROUNDS, scope, ...seenForServer() } });
      setGame(g); setI(0); setResults([]); setPin(null); setResult(null); setHint(null); setFinal(false); setNewBest(false);
      markSeen(g.rounds[0]?.clueId, g.rounds[0]?.image);
      t0.current = performance.now(); lastSec.current = 99; setLeftMs(g.limitMs);
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const submit = async (timedOut = false) => {
    if (lock.current || !game || result) return;
    const p = pinRef.current;
    if (!p && !timedOut) { toast(t('Drop a pin on the map first.', 'पहिले नक्सामा पिन राख्नुहोस्।'), 'info'); return; }
    lock.current = true; setBusy(true);
    try {
      const r = await api('/play/game/guess', { method: 'POST', body: { gameId: game.gameId, round: i, lat: p?.lat, lng: p?.lng, timedOut } });
      r.tier ??= r.missed ? 'missed' : r.perfect ? 'perfect' : r.points >= 600 ? 'close' : 'far';
      r.guess = p ? { lat: p.lat, lng: p.lng } : null; r.timedOut = timedOut;
      setResult(r); setResults((l) => [...l, r]); setLeftMs(timedOut ? 0 : leftMs);
      play(r.points >= 600 ? 'bowl' : 'soft', sound); buzz(r.points >= 600 ? 20 : 40);
      const pts = [[r.monument.lng, r.monument.lat]]; if (p) pts.unshift([p.lng, p.lat]);
      setTimeout(() => map.current?.fit(pts), 60);
      announceBadges(toast, r.badges);
    } catch (e) {
      if (e.status === 409) {
        // the server already has an answer for this round (double submit): carry on rather than strand the player
        toast(t('That round was already answered.', 'यो राउन्डको जवाफ पहिल्यै गइसकेको छ।'), 'info');
      } else handleErr(e);
    } finally { lock.current = false; setBusy(false); }
  };
  const submitRef = useRef(submit); submitRef.current = submit;

  const next = () => {
    if (i + 1 >= game.rounds.length) { finish(); return; }
    const n = game.rounds[i + 1];
    markSeen(n?.clueId, n?.image);
    setI(i + 1); setPin(null); setResult(null); setHint(null);
    t0.current = performance.now(); lastSec.current = 99; setLeftMs(game.limitMs);
    map.current?.reset();
  };

  const finish = () => {
    const sc = results.reduce((s, r) => s + r.points, 0);
    if (sc > readBest(scope)) { writeBest(scope, sc); setBest((b) => ({ ...b, [scope]: sc })); setNewBest(true); }
    setFinal(true); setPin(null);
  };

  // tell the server the round is on screen (its clock starts then), and run the countdown
  useEffect(() => {
    if (phase !== 'play') return undefined;
    api('/play/game/ready', { method: 'POST', body: { gameId: game.gameId, round: i } }).catch((e) => { if (e.status === 404) handleErr(e); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, i, phase === 'play']);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    const id = setInterval(() => {
      const l = Math.max(0, game.limitMs - (performance.now() - t0.current));
      setLeftMs(l);
      const sec = Math.ceil(l / 1000);
      if (sec !== lastSec.current && sec <= 10 && sec > 0) play('tick', sound);
      lastSec.current = sec;
      if (l <= 0) submitRef.current(true);
    }, 100);
    return () => clearInterval(id);
  }, [game, phase, i, sound]);

  const hintGo = async () => {
    if (hint || hintBusy || phase !== 'play') return;
    setHintBusy(true);
    try { const r = await api('/play/game/hint', { method: 'POST', body: { gameId: game.gameId, round: i } }); setHint(r.hint); play('soft', sound); } catch (e) { handleErr(e); } finally { setHintBusy(false); }
  };

  const onPin = useCallback((p, how) => {
    setPin({ lat: p.lat, lng: p.lng, how });
    if (how === 'click' || how === 'center') { play('tick', sound); buzz(10); }
  }, [sound]);
  const dropCenter = () => { const c = map.current?.center(); if (c) onPin(c, 'center'); };

  // keyboard shortcuts: Enter locks the guess (or moves on), H hint, P pin at map centre
  const kb = useRef(null);
  kb.current = { phase, pin, zoom, submit, next, hintGo, dropCenter };
  useEffect(() => {
    const f = (e) => {
      const k = kb.current;
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || k.zoom) return;
      const tag = e.target?.tagName;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if (e.key === 'Enter') {
        if (/^(BUTTON|A)$/.test(tag)) return; // a focused button or link handles Enter itself
        if (k.phase === 'play' && k.pin) { e.preventDefault(); k.submit(); } else if (k.phase === 'reveal') { e.preventDefault(); k.next(); }
      } else if (k.phase === 'play' && (e.key === 'h' || e.key === 'H')) k.hintGo();
      else if (k.phase === 'play' && (e.key === 'p' || e.key === 'P')) k.dropCenter();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  useEffect(() => { if (phase === 'reveal') setTimeout(() => nextBtn.current?.focus({ preventScroll: true }), 350); }, [phase, i]);

  const pairs = useMemo(() => (final ? results.map((r, k) => ({ n: k + 1, guess: r.guess, answer: { lat: r.monument.lat, lng: r.monument.lng }, name: r.monument.name })) : null), [final, results]);
  useEffect(() => {
    if (!final || !pairs) return undefined;
    const pts = pairs.flatMap((p) => [[p.answer.lng, p.answer.lat], ...(p.guess ? [[p.guess.lng, p.guess.lat]] : [])]);
    const id = setTimeout(() => map.current?.fit(pts), 300);
    return () => clearTimeout(id);
  }, [final, pairs]);

  const rank = (() => {
    const pct = total / (ROUNDS * 1000);
    if (pct >= 0.8) return t('Sampada Shikari', 'सम्पदा शिकारी');
    if (pct >= 0.6) return t('Seasoned explorer', 'अनुभवी यात्री');
    if (pct >= 0.35) return t('Wayfinder', 'बाटो चिन्ने');
    return t('Newcomer', 'नयाँ यात्री');
  })();
  const shareText = `Hamro Prachin Sampada, Find the Monument (${scope === 'nepal' ? 'All Nepal' : 'Kathmandu Valley'})\n${total.toLocaleString()} / ${(ROUNDS * 1000).toLocaleString()} · ${rank}\n${results.map((r, k) => `R${k + 1} ${r.points}`).join(' · ')}\n${location.origin}/find`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareText); } catch {
      const ta = document.createElement('textarea'); ta.value = shareText; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ } ta.remove();
    }
    toast(t('Result copied. Paste it anywhere to share.', 'नतिजा कपी भयो। जहाँ पनि पेस्ट गरेर सेयर गर्नुहोस्।'), 'ok');
  };

  const tier = result?.tier;
  const tierTitle = { perfect: t('Perfect', 'एकदम ठीक'), close: t('Close', 'नजिकै'), far: t('Far', 'टाढा'), missed: t('Time is up', 'समय सकियो') }[tier];
  const tierMsg = {
    perfect: t('You put the pin right on it.', 'तपाईंले ठ्याक्कै त्यहीँ पिन राख्नुभयो।'),
    close: t('Nicely done. You know this part of the map.', 'राम्रो भयो। तपाईंलाई यो ठाउँ राम्ररी थाहा छ।'),
    far: t('A long way off, but now you know where it stands.', 'धेरै टाढा पर्‍यो, तर अब यो कहाँ छ थाहा भयो।'),
    missed: t('No pin was placed before the clock ran out.', 'समय सकिनुअघि पिन राखिएन।'),
  }[tier];

  const camPad = typeof innerWidth === 'number' && innerWidth <= 760 ? { top: 120, bottom: Math.round(innerHeight * 0.58), left: 40, right: 40 } : { top: 110, bottom: 90, left: 470, right: 90 };
  const mapAnswer = phase === 'reveal' ? result.monument : null;
  const secs = Math.ceil(leftMs / 1000);
  const urgent = phase === 'play' && leftMs <= 10000;
  const R = 22; const C = 2 * Math.PI * R;
  const frac = game ? Math.max(0, Math.min(1, leftMs / game.limitMs)) : 1;

  return (
    <MotionConfig reducedMotion="user">
      <div className="find">
        <div className="explore-map">
          <FindMap key={scope} ref={map} scope={scope} pin={phase === 'play' || phase === 'reveal' ? pin : null} onPin={onPin} locked={phase !== 'play'}
            answer={mapAnswer} distText={result && !result.missed ? dist(result.metres) : ''} pairs={pairs} reduce={reduce} padding={camPad}
            pinLabel={t('Your guess. Use the arrow keys to move it.', 'तपाईंको अनुमान। सार्न तीर कुञ्जी थिच्नुहोस्।')} />
        </div>

        {phase === 'play' && (
          <>
            <div className="fm-maptools">
              <button className="btn ghost sm" onClick={dropCenter} style={{ background: 'var(--card)' }}><Navigation size={15} /> {t('Pin at map center', 'नक्साको बीचमा पिन')}<kbd className="fm-kbd">P</kbd></button>
              <button className="btn ghost sm" onClick={() => map.current?.reset()} style={{ background: 'var(--card)' }}><Compass size={15} /> {t('Reset view', 'नक्सा फर्काउनुहोस्')}</button>
            </div>
            {!pin && <div className="fm-hintbar" role="note">{t('Click or tap the map to drop your pin', 'पिन राख्न नक्सामा थिच्नुहोस्')}</div>}
          </>
        )}

        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" className="fm-intro card pad-l" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="eyebrow">{t('Find the monument', 'सम्पदा खोज')}</div>
              <h2>{t('A photo, a riddle, and the whole valley', 'एउटा फोटो, एउटा गाउँखाने कथा र पूरा उपत्यका')}</h2>
              <p className="muted">{t(`${ROUNDS} rounds. Look at the photo, read the clue, then drop your pin where you think it stands. Closer and faster scores more, up to 1,000 a round.`, `${t.n(ROUNDS)} राउन्ड। फोटो हेर्नुहोस्, सुराग पढ्नुहोस्, अनि जहाँ हो जस्तो लाग्छ त्यहीँ पिन राख्नुहोस्। जति नजिक र छिटो, उति धेरै पोइन्ट, एक राउन्डमा १,००० सम्म।`)}</p>
              {note && <div className="fm-note" role="status">{note}</div>}
              <div className="fm-scope" role="radiogroup" aria-label={t('Where to play', 'कहाँ खेल्ने')}>
                {[['valley', t('Kathmandu Valley', 'काठमाडौं उपत्यका'), t('Perfect within 40 m', '४० मिटरभित्र एकदम ठीक')], ['nepal', t('All Nepal', 'पूरा नेपाल'), t('Perfect within 1 km', '१ किमीभित्र एकदम ठीक')]].map(([k, name, sub]) => (
                  <button key={k} role="radio" aria-checked={scope === k} onClick={() => setScope(k)}>
                    <b>{name}</b><span>{sub}</span>
                    <span><Trophy size={12} style={{ verticalAlign: '-1px' }} /> {t('Best', 'उत्कृष्ट')}: {best[k] ? t.n(best[k].toLocaleString()) : '—'}</span>
                  </button>
                ))}
              </div>
              <div className="fm-how" aria-label={t('How scoring works', 'स्कोर कसरी हुन्छ')}>
                <div><b>800</b><small>{t('for distance. The closer your pin, the more you keep.', 'दूरीका लागि। जति नजिक, उति धेरै।')}</small></div>
                <div><b>200</b><small>{t('for speed. Answer fast, but only a close pin earns it.', 'छिटोका लागि। नजिक पिन भए मात्र पाइन्छ।')}</small></div>
                <div><b>−100</b><small>{t('for a hint: a second clue plus the town and type.', 'सङ्केतका लागि: अर्को सुराग, सहर र प्रकार।')}</small></div>
              </div>
              <ul className="rules">
                <li><Clock size={16} /> {t('You have 60 seconds a round. A pin placed when time runs out still counts.', 'एक राउन्डमा ६० सेकेन्ड छ। समय सकिँदा राखिएको पिन गनिन्छ।')}</li>
                <li><Target size={16} /> {t('The photo and clue change when a place comes up again.', 'कुनै ठाउँ फेरि आउँदा फोटो र सुराग फरक हुन्छ।')}</li>
                <li><Trophy size={16} /> {t('4,000 or more earns the Sampada Shikari badge.', '४,००० वा बढी ल्याए सम्पदा शिकारी ब्याज पाइन्छ।')}</li>
              </ul>
              <button className="btn lg diyo" onClick={start} disabled={busy}><Crosshair size={18} /> {busy ? t('Setting up…', 'तयार हुँदै…') : t('Start the game', 'खेल सुरु गर्नुहोस्')}</button>
              <p className="cap" style={{ marginTop: '0.8rem' }}>{t('Want to play together?', 'सँगै खेल्ने?')} <Link to="/hunt">{t('Open a live hunt', 'लाइभ हन्ट खोल्नुहोस्')}</Link></p>
            </motion.div>
          )}

          {(phase === 'play' || phase === 'reveal') && round && (
            <motion.section key={`r${i}`} className={`fm-panel card ${phase}`} aria-label={t(`Round ${i + 1}`, `राउन्ड ${t.n(i + 1)}`)} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="fm-head">
                <div>
                  <span className="tag">{t(`Round ${i + 1} of ${game.rounds.length}`, `राउन्ड ${t.n(i + 1)} / ${t.n(game.rounds.length)}`)}</span>
                  <div className="fm-dots" role="img" aria-label={t(`Round ${i + 1} of ${game.rounds.length}`, `राउन्ड ${t.n(i + 1)} / ${t.n(game.rounds.length)}`)} style={{ marginTop: '0.5rem' }}>
                    {game.rounds.map((_, k) => <i key={k} className={k < results.length ? results[k].tier : k === i ? 'now' : ''} />)}
                  </div>
                </div>
                {phase === 'play' ? (
                  <div className={`fm-timer ${urgent ? 'urgent' : ''}`} role="timer" aria-label={t(`${secs} seconds left`, `${t.n(secs)} सेकेन्ड बाँकी`)}>
                    <svg viewBox="0 0 52 52" aria-hidden="true"><circle className="track" cx="26" cy="26" r={R} /><circle className="arc" cx="26" cy="26" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} /></svg>
                    <b>{t.n(secs)}</b>
                  </div>
                ) : <span />}
                <div className="fm-score">
                  <small>{t('Total', 'जम्मा')}</small>
                  <b><CountUp value={total} reduce={reduce} /></b>
                  {streak >= 1 && <div className="fm-streak" title={t('Rounds in a row scoring 600 or more', 'लगातार ६०० वा बढी ल्याएका राउन्ड')}><Zap size={12} /> {t(`Streak ${streak}`, `लगातार ${t.n(streak)}`)}</div>}
                </div>
              </div>

              <div className="fm-scroll thin-scroll">
                <button className="fm-photo" onClick={() => setZoom(true)} aria-label={t('Enlarge the mystery photo', 'फोटो ठूलो बनाउनुहोस्')}>
                  <img src={round.image} alt={t('Mystery monument', 'रहस्यमय सम्पदा')} />
                  <span className="fm-zoom"><Maximize2 size={12} /> {t('Zoom', 'ठूलो')}</span>
                  {round.credit && <span className="fm-credit">{round.credit}</span>}
                </button>
                <div className="fm-clue">
                  <q lang={t.nepali && round.clue_np ? 'ne' : undefined}>{t.nepali && round.clue_np ? round.clue_np : round.clue}</q>
                </div>

                {phase === 'play' && hint && (
                  <div className="fm-hint" role="status">
                    <span className="fm-chip"><Lightbulb size={12} /> {t('Hint used', 'सङ्केत लिइयो')} · −100</span>
                    {hint.text && <p lang={t.nepali && hint.text_np ? 'ne' : undefined}>“{t.nepali && hint.text_np ? hint.text_np : hint.text}”</p>}
                    <p className="cap">{hint.where}</p>
                  </div>
                )}
                {phase === 'reveal' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="fm-result" aria-live="polite">
                    <div className={`fm-tier ${tier}`}>
                      <h3>{tierTitle}</h3>
                      <b className="num" style={{ fontSize: '1.3rem' }}>+<CountUp value={result.points} reduce={reduce} /></b>
                    </div>
                    <p className="fm-tier-msg">{tierMsg}</p>
                    {!result.missed && <div className="fm-dist-line"><Target size={16} /> {t(`You were ${dist(result.metres)} away.`, `तपाईं ${dist(result.metres)} टाढा हुनुहुन्थ्यो।`)}</div>}
                    <div className="fm-break">
                      <div><span>{t('Distance', 'दूरी')}<small>{t('up to 800', '८०० सम्म')}</small></span><b>+<CountUp value={result.distPart} reduce={reduce} /></b></div>
                      <div><span>{t('Speed', 'गति')}<small>{t('up to 200', '२०० सम्म')}</small></span><b>+<CountUp value={result.speedPart} reduce={reduce} /></b></div>
                      {result.penalty > 0 && <div className="neg"><span>{t('Hint', 'सङ्केत')}<small>{t('used on this round', 'यो राउन्डमा लिइयो')}</small></span><b>−<CountUp value={result.penalty} reduce={reduce} /></b></div>}
                      <div><span>{t('This round', 'यो राउन्ड')}</span><b><CountUp value={result.points} reduce={reduce} /></b></div>
                    </div>
                    <a className="fm-mon" href={`/m/${result.monument.slug}`} target="_blank" rel="noreferrer">
                      {result.monument.image && <img src={result.monument.image} alt="" />}
                      <span><b>{result.monument.name}</b><span lang="ne" className="np muted">{result.monument.name_np}</span><span className="cap">{result.monument.city} · {t('Read more', 'थप पढ्नुहोस्')}</span></span>
                    </a>
                  </motion.div>
                )}
              </div>

              <div className="fm-foot">
                {phase === 'play' ? (
                  <>
                    <p className="fm-status" aria-live="polite">
                      {pin ? t(`Pin set at ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}. Drag it, or tap elsewhere, to move it.`, `पिन ${t.n(pin.lat.toFixed(4))}, ${t.n(pin.lng.toFixed(4))} मा छ। सार्न तान्नुहोस् वा अर्कै ठाउँमा थिच्नुहोस्।`)
                        : t('Tap the map to drop your pin.', 'पिन राख्न नक्सामा थिच्नुहोस्।')}
                    </p>
                    <div className="fm-actions">
                      <button className="btn" onClick={() => submit()} disabled={!pin || busy}><MapPin size={16} /> {t('Lock my guess', 'मेरो अनुमान पक्का')}<kbd className="fm-kbd">Enter</kbd></button>
                      {!hint && <button className="btn ghost" onClick={hintGo} disabled={hintBusy}><Lightbulb size={16} /> {t('Hint', 'सङ्केत')} · −100<kbd className="fm-kbd">H</kbd></button>}
                    </div>
                  </>
                ) : (
                  <div className="fm-actions">
                    <button ref={nextBtn} className="btn" onClick={next}>{i + 1 < game.rounds.length ? t('Next round', 'अर्को राउन्ड') : t('See results', 'नतिजा हेर्नुहोस्')} <ArrowRight size={16} /><kbd className="fm-kbd">Enter</kbd></button>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {phase === 'final' && (
            <motion.section key="done" className="fm-panel card" aria-label={t('Final results', 'अन्तिम नतिजा')} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="fm-scroll thin-scroll" style={{ paddingTop: '1rem' }}>
                <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, k) => <i key={k} />)}</div>
                <div className="fm-final-total">
                  <div className="big"><CountUp value={total} ms={1200} reduce={reduce} /></div>
                  <div className="muted small">{t(`out of ${(ROUNDS * 1000).toLocaleString()} points`, `${t.n((ROUNDS * 1000).toLocaleString())} मध्ये`)}</div>
                  <span className="fm-rank">{rank}</span>
                  {newBest && <span className="fm-newbest">{t('New best', 'नयाँ उत्कृष्ट')}</span>}
                  <p className="cap" style={{ marginTop: '0.4rem' }}>{t('Best here', 'यहाँको उत्कृष्ट')}: {t.n(best[scope].toLocaleString())}</p>
                </div>
                <ol className="fm-list">
                  {results.map((r, k) => (
                    <li key={k}>
                      <a className="fm-row" href={`/m/${r.monument.slug}`} target="_blank" rel="noreferrer">
                        <span className="n" aria-hidden="true">{k + 1}</span>
                        {r.monument.image && <img src={r.monument.image} alt="" />}
                        <span><b>{r.monument.name}</b><span className="cap">{r.missed ? t('No pin placed', 'पिन राखिएन') : t(`${dist(r.metres)} away`, `${dist(r.metres)} टाढा`)}{r.penalty > 0 ? ` · ${t('hint', 'सङ्केत')}` : ''}</span></span>
                        <b className="num">{r.points}</b>
                      </a>
                    </li>
                  ))}
                </ol>
                <p className="cap" style={{ marginTop: 0 }}>{t('On the map, blue circles are your guesses and red squares are the real places.', 'नक्सामा नीलो गोला तपाईंका अनुमान र रातो चौकोस वास्तविक ठाउँ हुन्।')}</p>
                <div className="fm-actions">
                  <button className="btn diyo" onClick={start} disabled={busy}><RotateCcw size={16} /> {t('Play again', 'फेरि खेल्नुहोस्')}</button>
                  <button className="btn ghost" onClick={copy}><Share2 size={16} /> {t('Copy result', 'नतिजा कपी')}</button>
                </div>
                <div className="fm-actions">
                  <Link to="/leaderboard" className="btn ghost"><Trophy size={16} /> {t('Leaderboard', 'लिडरबोर्ड')}</Link>
                  <button className="btn ghost" onClick={() => toIntro('')}>{t('Change area', 'क्षेत्र बदल्नुहोस्')}</button>
                </div>
                {!user && <p className="cap" style={{ marginTop: '0.8rem' }}>{t('Sign in to put your name on the leaderboard and earn badges.', 'लिडरबोर्डमा नाम राख्न र ब्याज पाउन लगइन गर्नुहोस्।')}</p>}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {zoom && round && <Lightbox src={round.image} credit={round.credit} alt={t('Mystery monument', 'रहस्यमय सम्पदा')} onClose={() => setZoom(false)} closeLabel={t('Close photo', 'फोटो बन्द गर्नुहोस्')} />}
        {game && !round && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Loader /></div>}
      </div>
    </MotionConfig>
  );
}
