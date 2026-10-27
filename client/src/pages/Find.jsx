// Find the Monument: a photo and a riddle; drop a pin on the map of the valley or of all Nepal.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Lightbulb, ArrowRight, RotateCcw, Trophy, MapPin, Target } from 'lucide-react';
import MapView, { NEPAL, VALLEY } from '../components/MapView.jsx';
import { api, fmtM } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast, announceBadges } from '../lib/toast.jsx';
import { play, buzz } from '../lib/sound.js';
import { Loader } from '../components/Shell.jsx';

export default function Find() {
  const t = useT();
  const [game, setGame] = useState(null);
  const [i, setI] = useState(0);
  const [pin, setPin] = useState(null);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(1);
  const [scope, setScope] = useState('valley');
  const t0 = useRef(0);
  const map = useRef(null);
  const { user } = useAuth();
  const { sound } = usePrefs();
  const toast = useToast();

  const start = async () => {
    setBusy(true);
    try {
      const g = await api('/play/game/start', { method: 'POST', body: { rounds: 5, scope } });
      setGame(g); setI(0); setResults([]); setPin(null); setResult(null); setHint(false);
      t0.current = performance.now();
      map.current?.reset();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  useEffect(() => {
    if (!game || result) return undefined;
    const id = setInterval(() => setLeft(Math.max(0, 1 - (performance.now() - t0.current) / game.limitMs)), 200);
    return () => clearInterval(id);
  }, [game, result, i]);

  const guess = async () => {
    if (!pin || busy) return;
    setBusy(true);
    try {
      const r = await api('/play/game/guess', { method: 'POST', body: { gameId: game.gameId, round: i, lat: pin.lat, lng: pin.lng, timeMs: Math.round(performance.now() - t0.current), hint } });
      setResult(r); setResults((l) => [...l, r]);
      play(r.points >= 600 ? 'bowl' : 'soft', sound); buzz(r.points >= 600 ? 20 : 40);
      map.current?.fit([[pin.lng, pin.lat], [r.monument.lng, r.monument.lat]], 140);
      announceBadges(toast, r.badges);
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const next = () => {
    setI(i + 1); setPin(null); setResult(null); setHint(false); t0.current = performance.now(); setLeft(1);
    map.current?.reset();
  };

  const round = game?.rounds[i];
  const done = game && results.length === game.rounds.length && result;
  const total = results.reduce((s, r) => s + r.points, 0);
  const extra = useMemo(() => (pin ? [{ ...pin, color: '#27187E', label: 'Your guess' }] : []), [pin]);
  const markers = useMemo(() => (result ? [{ ...result.monument, pulse: true }] : []), [result]);
  const lines = useMemo(() => (result && pin ? [{ from: [pin.lng, pin.lat], to: [result.monument.lng, result.monument.lat], color: '#81021F' }] : []), [result, pin]);

  return (
    <div className="find">
      <div className="explore-map">
        <MapView key={scope} initial={scope === 'nepal' ? NEPAL : VALLEY} ref={map} markers={markers} extra={extra} lines={lines} onMapClick={!result && game ? (p) => { setPin(p); play('tick', sound); } : undefined} pitch={35} popup={false} show3d={false} />
      </div>

      <AnimatePresence mode="wait">
        {!game && (
          <motion.div key="intro" className="find-intro card pad-l" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="eyebrow">Find the monument · सम्पदा खोज</div>
            <h2>{t('A photo, a riddle, and the whole valley', 'एउटा तस्बिर, एउटा गाउँखाने कथा र पूरा उपत्यका')}</h2>
            <p className="muted">Five rounds. Look at the photo, read the clue, then drop your pin where you think it stands. Closer and faster scores more, up to 1,000 a round.</p>
            <div className="seg" role="radiogroup" aria-label="Where to play">
              <button role="radio" aria-checked={scope === 'valley'} className={scope === 'valley' ? 'on' : ''} onClick={() => setScope('valley')}>Kathmandu Valley</button>
              <button role="radio" aria-checked={scope === 'nepal'} className={scope === 'nepal' ? 'on' : ''} onClick={() => setScope('nepal')}>All Nepal</button>
            </div>
            <ul className="rules">
              <li><Target size={16} /> {scope === 'valley' ? 'Within 40 m counts as perfect.' : 'Within 1 km counts as perfect.'}</li>
              <li><Lightbulb size={16} /> A hint shows the city and type, for 100 points.</li>
              <li><Trophy size={16} /> 4,000+ earns the <b>Sampada Shikari</b> badge.</li>
            </ul>
            <button className="btn lg diyo" onClick={start} disabled={busy}><Crosshair size={18} /> {busy ? t('Setting up…', 'तयार हुँदै…') : t('Start the game', 'खेल सुरु गर्नुहोस्')}</button>
            <p className="cap" style={{ marginTop: '0.8rem' }}>Want to play together? <Link to="/hunt">Open a live hunt</Link>.</p>
          </motion.div>
        )}

        {game && round && !done && (
          <motion.div key={`r${i}`} className="find-panel card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="row between" style={{ padding: '0.9rem 1rem 0' }}>
              <span className="tag">Round {i + 1} / {game.rounds.length}</span>
              <span className="num small"><b>{total}</b> pts</span>
            </div>
            {!result && <div className="timer-bar" style={{ margin: '0.6rem 1rem' }}><span style={{ width: `${left * 100}%` }} /></div>}
            <div className="find-photo">
              <img src={round.image} alt="Mystery monument" />
              <span className="cap find-credit">{round.credit}</span>
            </div>
            <div style={{ padding: '0.9rem 1rem 1rem' }}>
              <div className="clue">“{round.clue}”</div>
              {!result ? (
                <>
                  {hint && <div className="tag sky" style={{ marginTop: '0.6rem' }}>Hint used: −100</div>}
                  <p className="cap" style={{ margin: '0.7rem 0' }}>{pin ? `Pin dropped at ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}. Tap again to move it.` : 'Tap the map to drop your pin.'}</p>
                  <div className="row">
                    <button className="btn" onClick={guess} disabled={!pin || busy}><MapPin size={16} /> {t('Lock my guess', 'मेरो अनुमान पक्का')}</button>
                    {!hint && <button className="btn ghost" onClick={() => setHint(true)}><Lightbulb size={16} /> {t('Hint', 'सङ्केत')}</button>}
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="find-result">
                  <div className="row between">
                    <b className="stamp-font" style={{ fontSize: '1.4rem', color: result.points >= 600 ? 'var(--ok)' : 'var(--warn)' }}>{result.perfect ? 'पुग्यो! Perfect' : result.points >= 600 ? 'शाबास!' : 'Close enough?'}</b>
                    <span className="delta up num">+{result.points}</span>
                  </div>
                  <p style={{ margin: '0.3rem 0' }}>It was <Link to={`/m/${result.monument.slug}`}><b>{result.monument.name}</b></Link> <span lang="ne" className="np muted">{result.monument.name_np}</span>. You were {fmtM(result.metres)} away.</p>
                  <div className="cap">Distance {result.distPart} · speed {result.speedPart}{result.penalty ? ` · hint −${result.penalty}` : ''}</div>
                  <button className="btn" style={{ marginTop: '0.8rem' }} onClick={next}>{i + 1 < game.rounds.length ? 'Next round' : 'See results'} <ArrowRight size={16} /></button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {done && (
          <motion.div key="done" className="find-intro card pad-l mithila" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
            <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, k) => <i key={k} />)}</div>
            <h2 style={{ marginTop: '1rem' }}><span className="num">{total.toLocaleString()}</span> points</h2>
            <p className="muted">{total >= 4000 ? 'You know this valley like a local guide.' : total >= 2500 ? 'A seasoned explorer.' : 'Every walk makes the map clearer.'}</p>
            <div className="find-sum">
              {results.map((r, k) => (
                <Link key={k} to={`/m/${r.monument.slug}`} className="find-sum-row">
                  <img src={r.monument.image} alt="" /><span><b>{r.monument.name}</b><span className="cap">{fmtM(r.metres)} away</span></span><b className="num">{r.points}</b>
                </Link>
              ))}
            </div>
            <div className="row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn lg diyo" onClick={start}><RotateCcw size={17} /> {t('Play again', 'फेरि खेल्नुहोस्')}</button>
              <Link to="/leaderboard" className="btn ghost lg"><Trophy size={17} /> Leaderboard</Link>
            </div>
            {!user && <p className="cap" style={{ marginTop: '0.8rem' }}>Sign in to put your name on the leaderboard and earn badges.</p>}
          </motion.div>
        )}
      </AnimatePresence>
      {game && !round && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Loader /></div>}
    </div>
  );
}
