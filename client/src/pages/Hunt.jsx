// Live multiplayer heritage hunt over Socket.io.
// Flow: entry (host or join) -> lobby -> 3-2-1 countdown -> rounds (pin, lock, reveal) -> podium -> play again.
// A player is identified by a stable id kept in sessionStorage, so a refresh or a dropped connection rejoins with the score.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { io } from 'socket.io-client';
import maplibregl from 'maplibre-gl';
import QRCode from 'qrcode';
import { Users, Copy, Play, Crown, Check, MapPin, ArrowRight, Trophy, LogOut, Wifi, WifiOff, Share2, ChevronUp, ChevronDown, Minus, RotateCcw, Keyboard } from 'lucide-react';
import MapView from '../components/MapView.jsx';
import { api, getToken, fmtM } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast } from '../lib/toast.jsx';
import { play, buzz } from '../lib/sound.js';
import { markSeen, seenForServer } from '../lib/seen.js';
import { Epigraph } from '../components/Shloka.jsx';
import '../styles/hunt.css';

const NAME_KEY = 'sampada-hunt-name';
const SESSION_KEY = 'sampada-hunt-session';
const EMOJIS = ['🙏', '🔥', '👏', '😮', '🎉'];
const REACT_NP = { '🙏': 'नमस्ते', '🔥': 'ज्वाला', '👏': 'ताली', '😮': 'अचम्म', '🎉': 'उत्सव' };
const ERR_NP = {
  'No hunt with that code': 'त्यो कोडको कुनै खेल भेटिएन।',
  'That name is taken in this hunt. Pick another.': 'यो नाम यहाँ अरूले लिइसके। अर्को नाम राख्नुहोस्।',
  'This hunt has finished': 'यो खेल सकिइसक्यो।',
  'This hunt is full (30 players)': 'यो खेलमा ३० जना पुगिसके।',
  'Time is up': 'समय सकियो।',
  'Only the host can start': 'होस्टले मात्र खेल सुरु गर्न सक्छ।',
  'Could not create the hunt': 'खेल बनाउन सकिएन। फेरि प्रयास गर्नुहोस्।',
};

const readSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const writeSession = (s) => { try { if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ } };
const initials = (n) => (Array.from(String(n).trim())[0] || '?').toUpperCase();

/** Number that counts up/down to its target. */
function CountUp({ value, from, ms = 700 }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(from ?? value);
  const last = useRef(from ?? value);
  useEffect(() => {
    if (reduce || last.current === value) { last.current = value; setShown(value); return undefined; }
    const a = last.current, t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3;
      last.current = Math.round(a + (value - a) * e);
      setShown(last.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduce]);
  return <>{shown}</>;
}

/** Circular round timer. Runs its own interval so the page does not re-render ten times a second. */
function Clock({ endsAt, skew, total, label, t }) {
  const [left, setLeft] = useState(() => Math.max(0, endsAt - (Date.now() + skew)));
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, endsAt - (Date.now() + skew)));
    tick();
    const id = setInterval(tick, 150);
    return () => clearInterval(id);
  }, [endsAt, skew]);
  const secs = Math.ceil(left / 1000);
  const frac = Math.min(1, left / (total * 1000));
  const R = 22, C = 2 * Math.PI * R;
  return (
    <div className={`hp-clock ${secs <= 10 ? 'low' : ''}`} role="timer" aria-label={label(secs)}>
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle className="trk" cx="26" cy="26" r={R} />
        <circle className="bar" cx="26" cy="26" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
      </svg>
      <b className="num">{t.n(secs)}</b>
    </div>
  );
}

/** Big 3-2-1 before the first round. */
function Countdown({ startsAt, skew, t, players, me, sound }) {
  const [n, setN] = useState(() => Math.max(0, Math.ceil((startsAt - (Date.now() + skew)) / 1000)));
  const prev = useRef(null);
  useEffect(() => {
    const tick = () => setN(Math.max(0, Math.ceil((startsAt - (Date.now() + skew)) / 1000)));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startsAt, skew]);
  useEffect(() => { if (prev.current !== n && n > 0) play('tick', sound); prev.current = n; }, [n, sound]);
  return (
    <div className="hp-countdown" role="status" aria-live="assertive">
      <div className="eyebrow on-dark">{t('Get ready', 'तयार हुनुहोस्')}</div>
      <AnimatePresence mode="wait">
        <motion.div key={n} className="hp-count-num" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}>
          {n > 0 ? t.n(Math.min(n, 3)) : t('Go', 'सुरु')}
        </motion.div>
      </AnimatePresence>
      <div className="hp-count-players">
        {players.map((p) => <span key={p.id} className={`dot ${p.id === me ? 'you' : ''}`} style={{ background: p.color }} title={p.name}>{initials(p.name)}</span>)}
      </div>
    </div>
  );
}

function Board({ room, me, status, t, open, setOpen }) {
  const list = room.players;
  const mine = list.find((p) => p.id === me);
  const reveal = status === 'reveal';
  return (
    <aside className={`hp-board card ${open ? 'open' : ''}`} aria-label={t('Leaderboard', 'स्कोरबोर्ड')}>
      <button className="hp-board-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="hp-board-title">{t('Leaderboard', 'स्कोरबोर्ड')}</span>
        {mine && <span className="hp-board-me num">#{t.n(mine.rank)} · {t.n(mine.points)}</span>}
        <span className="hp-board-code num">{room.code}</span>
        {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
      {open && (
        <ol>
          {list.map((p) => {
            const d = reveal && p.prevRank != null ? p.prevRank - p.rank : 0;
            return (
              <motion.li layout key={p.id} className={`${p.id === me ? 'me' : ''} ${p.connected ? '' : 'away'}`} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
                <span className="rank num">{t.n(p.rank)}</span>
                <span className="dot" style={{ background: p.color }} aria-hidden="true" />
                <span className="pname">{p.name}{p.host && <Crown size={12} aria-label={t('Host', 'होस्ट')} />}{!p.connected && <small> {t('(away)', '(बाहिर)')}</small>}</span>
                {status === 'playing' && (p.answered
                  ? <span className="hp-tick" title={t('Locked in', 'पक्का गर्यो')}><Check size={13} aria-label={t('Locked in', 'पक्का गर्यो')} /></span>
                  : <span className="hp-think" aria-label={t('Still thinking', 'सोचिरहेको')}><i /><i /><i /></span>)}
                {reveal && <span className={`hp-gain num ${p.gain ? '' : 'zero'}`}>+{t.n(p.gain)}</span>}
                {reveal && p.prevRank != null && (
                  <span className={`hp-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`} aria-label={d > 0 ? t(`Up ${d}`, `${t.n(d)} स्थान माथि`) : d < 0 ? t(`Down ${-d}`, `${t.n(-d)} स्थान तल`) : t('No change', 'उही स्थान')}>
                    {d > 0 ? <ChevronUp size={13} /> : d < 0 ? <ChevronDown size={13} /> : <Minus size={11} />}{d !== 0 && <span className="num">{t.n(Math.abs(d))}</span>}
                  </span>
                )}
                <b className="num pts"><CountUp value={p.points} /></b>
              </motion.li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

function pinElement(color, cls = '') {
  const el = document.createElement('div');
  el.className = 'hp-mk';
  el.innerHTML = `<div class="hp-pin ${cls}" style="--c:${color}"><span class="hp-pin-ripple"></span><svg viewBox="0 0 24 32" width="30" height="40" aria-hidden="true"><path d="M12 1C6 1 1.5 5.4 1.5 11c0 7.6 10.5 20 10.5 20S22.5 18.6 22.5 11C22.5 5.4 18 1 12 1z" fill="var(--c)" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11" r="4" fill="#fff"/></svg></div>`;
  return el;
}
function guessElement({ name, color, you, points, delay }) {
  const el = document.createElement('div');
  el.className = 'hp-mk';
  const wrap = document.createElement('div');
  wrap.className = `hp-guess ${you ? 'you' : ''}`;
  wrap.style.cssText = `--c:${color};--d:${delay}ms`;
  const label = document.createElement('span');
  label.className = 'hp-guess-name';
  label.textContent = points != null ? `${name} +${points}` : name;
  const dot = document.createElement('i');
  wrap.append(label, dot);
  el.append(wrap);
  return el;
}

export default function Hunt() {
  const t = useT();
  const { code: urlCode } = useParams();
  const { user } = useAuth();
  const { sound } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const sock = useRef(null);
  const map = useRef(null);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState(() => user?.name || localStorage.getItem(NAME_KEY) || '');
  const [joinCode, setJoinCode] = useState((urlCode || '').toUpperCase());
  const [rounds, setRounds] = useState(5);
  const [secs, setSecs] = useState(45);
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [round, setRound] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [final, setFinal] = useState(null);
  const [pin, setPin] = useState(null);
  const [mine, setMine] = useState(null);
  const [skew, setSkew] = useState(0);
  const [floats, setFloats] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [rejoining, setRejoining] = useState(() => { const s = readSession(); return !!(s && (!urlCode || s.code === urlCode.toUpperCase())); });
  const [qr, setQr] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState('');
  const [boardOpen, setBoardOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth > 760));
  const [sheetOpen, setSheetOpen] = useState(true);
  const [banner, setBanner] = useState(null);

  // refs so socket handlers (registered once) always see the latest values
  const soundRef = useRef(sound); soundRef.current = sound;
  const tRef = useRef(t); tRef.current = t;
  const meRef = useRef(me); meRef.current = me;
  const roomRef = useRef(room); roomRef.current = room;
  const roundRef = useRef(round); roundRef.current = round;
  const pinRef = useRef(pin); pinRef.current = pin;
  const mineRef = useRef(mine); mineRef.current = mine;
  const revealRef = useRef(reveal); revealRef.current = reveal;
  const skewRef = useRef(0);
  const lockingRef = useRef(false);
  const nameRef = useRef(name); nameRef.current = name;

  useEffect(() => { if (user?.name && !name) setName(user.name); }, [user, name]);

  const sync = (serverNow) => { if (Number.isFinite(serverNow)) { skewRef.current = serverNow - Date.now(); setSkew(skewRef.current); } };
  const errText = (e) => (t.nepali && ERR_NP[e]) || e;
  const fitReveal = (r) => {
    const pts = [[r.monument.lng, r.monument.lat], ...r.guesses.filter((g) => g.guess).map((g) => [g.guess.lng, g.guess.lat])];
    setTimeout(() => {
      const m = map.current?.get?.();
      if (!m) return;
      const wide = window.innerWidth > 760; // keep the pins clear of the panel and the leaderboard
      const b = new maplibregl.LngLatBounds();
      pts.forEach((c) => b.extend(c));
      m.fitBounds(b, { padding: wide ? { top: 110, bottom: 60, left: 450, right: 360 } : { top: 150, bottom: 300, left: 50, right: 50 }, maxZoom: 16.5, duration: 1100, pitch: 0, bearing: 0 });
    }, 150);
  };

  // take a join acknowledgement (first join or rejoin) and put the whole screen into the state it describes
  const applyAck = useCallback((ack) => {
    sync(ack.room.serverNow);
    setErr(''); setMe(ack.playerId); setRoom(ack.room);
    setRound(ack.round || null); setReveal(ack.reveal || null); setFinal(ack.final || null);
    setMine(ack.mine || null); setPin(ack.mine && ack.mine.lat != null ? { lat: ack.mine.lat, lng: ack.mine.lng } : null);
    if (ack.round) markSeen(ack.round.clueId, ack.round.image);
    if (ack.reveal) fitReveal(ack.reveal);
    writeSession({ code: ack.room.code, playerId: ack.playerId, name: nameRef.current.trim() });
    setRejoining(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = io({ auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    sock.current = s;
    // (re)join with the saved seat whenever the socket connects: covers refresh and network drops
    s.on('connect', () => {
      setConnected(true);
      const saved = readSession();
      const urlC = (location.pathname.split('/')[2] || '').toUpperCase();
      const want = roomRef.current ? { code: roomRef.current.code, playerId: meRef.current, name: nameRef.current } : saved && (!urlC || saved.code === urlC) ? saved : null;
      if (!want) { setRejoining(false); return; }
      s.emit('join', { code: want.code, name: want.name || nameRef.current, playerId: want.playerId }, (ack) => {
        if (ack?.ok) applyAck(ack);
        else { writeSession(null); setRoom(null); setRound(null); setReveal(null); setFinal(null); setMe(null); setRejoining(false); setErr(ack?.error || 'Could not rejoin'); }
      });
    });
    s.on('disconnect', () => setConnected(false));
    s.on('replaced', () => { writeSession(null); setRoom(null); setRound(null); setReveal(null); setFinal(null); setMe(null); setErr('You opened this hunt in another tab, so this one was closed.'); });
    s.on('room', (r) => {
      sync(r.serverNow);
      setRoom(r);
      if (r.status === 'lobby') { setRound(null); setReveal(null); setFinal(null); setPin(null); setMine(null); }
      const sess = readSession();
      if (sess && sess.code !== r.code) { writeSession({ ...sess, code: r.code }); window.history.replaceState(window.history.state, '', `/hunt/${r.code}`); }
    });
    s.on('round', (r) => {
      sync(r.serverNow); markSeen(r.clueId, r.image);
      lockingRef.current = false;
      setRound(r); setReveal(null); setPin(null); setMine(null); setSheetOpen(true); map.current?.reset();
      setBanner(r.index); setTimeout(() => setBanner(null), 1700);
      play('tick', soundRef.current);
    });
    s.on('reveal', (r) => { setReveal(r); if (window.innerWidth <= 760) setSheetOpen(false); fitReveal(r); play('bowl', soundRef.current); });
    s.on('finished', (f) => { setFinal(f); play('bell', soundRef.current); });
    s.on('reaction', (r) => {
      const id = Math.random();
      setFloats((l) => [...l.slice(-10), { ...r, id, x: 8 + Math.random() * 84 }]);
      setTimeout(() => setFloats((l) => l.filter((x) => x.id !== id)), 2800);
    });
    return () => { s.emit('leave'); s.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doJoin = (code) => new Promise((resolve) => {
    const nm = name.trim();
    if (!nm) { setErr(t('Enter your name first.', 'पहिले आफ्नो नाम लेख्नुहोस्।')); return resolve(false); }
    localStorage.setItem(NAME_KEY, nm);
    nameRef.current = nm;
    sock.current.emit('join', { code, name: nm }, (ack) => {
      if (!ack?.ok) { setErr(ack?.error || 'Could not join'); return resolve(false); }
      applyAck(ack);
      nav(`/hunt/${ack.room.code}`, { replace: true });
      resolve(true);
    });
  });
  const submitJoin = (e) => { e.preventDefault(); if (busy || joinCode.length !== 6) return; setBusy(true); doJoin(joinCode).finally(() => setBusy(false)); };
  const host = () => {
    if (!name.trim()) return setErr(t('Enter your name first.', 'पहिले आफ्नो नाम लेख्नुहोस्।'));
    setBusy(true); setErr('');
    sock.current.emit('host', { rounds, roundSeconds: secs, ...seenForServer() }, async (ack) => {
      if (!ack?.ok) { setBusy(false); return setErr(ack?.error || 'Could not create the hunt'); }
      await doJoin(ack.code); setBusy(false);
    });
  };
  const start = () => sock.current.emit('start', {}, (ack) => { if (!ack?.ok) toast(errText(ack?.error || 'Could not start'), 'err'); });
  const again = () => sock.current.emit('again', {}, (ack) => { if (!ack?.ok) toast(t('Could not start another hunt.', 'अर्को खेल सुरु गर्न सकिएन।'), 'err'); else play('tick', soundRef.current); });
  const next = () => sock.current.emit('next');
  const lock = useCallback(() => {
    const p = pinRef.current;
    if (!p || mineRef.current || lockingRef.current || revealRef.current) return;
    lockingRef.current = true;
    sock.current.emit('guess', p, (ack) => {
      if (!ack?.ok) { lockingRef.current = false; if (ack?.error && ack.error !== 'Time is up' && ack.error !== 'No round running') toast(errText(ack.error), 'err'); return; }
      setMine(ack); play(ack.points >= 600 ? 'bowl' : 'soft', soundRef.current); buzz(20);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leave = () => { sock.current.emit('leave'); writeSession(null); setRoom(null); setRound(null); setReveal(null); setFinal(null); setMe(null); setPin(null); setMine(null); setErr(''); nav('/hunt'); };
  const react = (emoji) => sock.current.emit('reaction', { emoji });

  const isHost = !!room && room.hostId === me;
  const players = room?.players || [];
  const myColor = players.find((p) => p.id === me)?.color || '#27187E';
  const myRow = players.find((p) => p.id === me);

  // an unlocked pin is locked for you just before the clock hits zero
  useEffect(() => {
    if (!pin || mine || reveal || !round || room?.status !== 'playing') return undefined;
    const wait = Math.max(0, round.endsAt - (Date.now() + skewRef.current) - 250);
    const id = setTimeout(lock, wait);
    return () => clearTimeout(id);
  }, [pin, mine, reveal, round, room?.status, lock]);

  // invite link + QR: on localhost, point phones at this computer's Wi-Fi address instead
  const code = room?.code;
  useEffect(() => {
    if (!code) return undefined;
    let alive = true;
    (async () => {
      let origin = location.origin;
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        try { const { ips } = await api('/net'); if (ips?.[0]) origin = `${location.protocol}//${ips[0]}:${location.port}`; } catch { /* keep localhost */ }
      }
      const url = `${origin}/hunt/${code}`;
      let svg = '';
      try { svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#381932', light: '#FFF3E6' } }); } catch { /* no QR */ }
      if (alive) { setShareLink(url); setQr(svg); }
    })();
    return () => { alive = false; };
  }, [code]);
  const link = shareLink || (code ? `${location.origin}/hunt/${code}` : '');

  const copy = async (what) => {
    const text = what === 'code' ? code : link;
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ } ta.remove();
    }
    setCopied(what); play('tick', sound); setTimeout(() => setCopied(''), 1800);
  };
  const share = async () => {
    try { await navigator.share({ title: 'Heritage Hunt', text: t(`Join my Heritage Hunt. Code ${code}`, `मेरो सम्पदा खेलमा सामेल हुनुहोस्। कोड ${code}`), url: link }); } catch { /* cancelled */ }
  };

  // ---------- map layers (own markers: pin drop, reveal names) ----------
  const pinMk = useRef(null);
  const showPin = room && room.status !== 'lobby' && !reveal && !final;
  useEffect(() => {
    const m = map.current?.get?.();
    if (!m || !pin || !showPin) return undefined;
    const el = pinElement(myColor, mine ? 'locked' : '');
    pinMk.current = el.firstChild;
    const mk = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([pin.lng, pin.lat]).addTo(m);
    return () => { mk.remove(); pinMk.current = null; };
  }, [pin, showPin, myColor, room?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { pinMk.current?.classList.toggle('locked', !!mine); }, [mine]);

  useEffect(() => {
    const m = map.current?.get?.();
    if (!m || !reveal) return undefined;
    const marks = reveal.guesses.filter((g) => g.guess).map((g, i) => {
      const el = guessElement({ name: g.name, color: g.color, you: g.id === me, points: g.guess.points, delay: reduce ? 0 : 350 + i * 140 });
      return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([g.guess.lng, g.guess.lat]).addTo(m);
    });
    return () => marks.forEach((mk) => mk.remove());
  }, [reveal, me, reduce]);

  const markers = useMemo(() => (reveal ? [{ ...reveal.monument, pulse: true }] : []), [reveal]);
  const lines = useMemo(() => (reveal ? reveal.guesses.filter((g) => g.guess).map((g) => ({ from: [g.guess.lng, g.guess.lat], to: [reveal.monument.lng, reveal.monument.lat], color: g.color })) : []), [reveal]);
  const canPin = !!round && !reveal && !mine && !final && room?.status === 'playing';
  const onMapClick = useMemo(() => (canPin ? (p) => { setPin(p); play('tick', soundRef.current); } : undefined), [canPin]);

  // keyboard pin: Enter drops at the map centre, arrows nudge, Shift for fine steps
  const nudge = (dx, dy, fine) => {
    const m = map.current?.get?.(); if (!m || !canPin) return;
    const c = pin || (({ lat, lng }) => ({ lat, lng }))(m.getCenter());
    const b = m.getBounds();
    const w = (b.getEast() - b.getWest()) / (fine ? 80 : 20), h = (b.getNorth() - b.getSouth()) / (fine ? 80 : 20);
    setPin({ lat: c.lat - dy * h, lng: c.lng + dx * w });
  };
  const onPadKey = (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (k) { e.preventDefault(); nudge(k[0], k[1], e.shiftKey); } else if ((e.key === 'Enter' || e.key === ' ') && !pin) { e.preventDefault(); nudge(0, 0); }
  };

  const reactBar = (
    <div className="hp-reactions" role="group" aria-label={t('Send a reaction', 'प्रतिक्रिया पठाउनुहोस्')}>
      {EMOJIS.map((e) => <button key={e} onClick={() => react(e)} aria-label={t('React', 'प्रतिक्रिया') + ' ' + (t.nepali ? REACT_NP[e] : e)}>{e}</button>)}
    </div>
  );
  const floatsLayer = <div className="hp-floats" aria-hidden="true">{floats.map((f) => <span key={f.id} style={{ left: `${f.x}%` }}>{f.emoji}<small style={{ background: f.color }}>{f.name}</small></span>)}</div>;
  const offline = room && !connected && <div className="hp-offline" role="status"><WifiOff size={15} /> {t('Connection lost. Reconnecting…', 'जडान टुट्यो। फेरि जोडिँदै छ…')}</div>;

  // ---------- rejoining after a refresh ----------
  if (!room && rejoining) {
    return (
      <div className="page hunt-entry hp-entry"><div className="wrap"><div className="hp-rejoin card pad-l" role="status"><span className="hp-spin" aria-hidden="true" /><p>{t('Rejoining your hunt…', 'तपाईंको खेलमा फेरि जोडिँदै…')}</p></div></div></div>
    );
  }

  // ---------- not in a room: host or join ----------
  if (!room) {
    return (
      <div className="page hunt-entry hp-entry">
        <div className="wrap">
          <div className="hunt-hero">
            <div className="flags" aria-hidden="true">{Array.from({ length: 15 }).map((_, i) => <i key={i} />)}</div>
            <div className="eyebrow" style={{ marginTop: '1rem' }}>Live heritage hunt · <span lang="ne">लाइभ सम्पदा खेल</span></div>
            <h1 style={{ fontSize: 'var(--fs-h2)' }}>{t('Race your friends across the valley', 'साथीहरूसँग उपत्यकाभरि दौडिऔं')}</h1>
            <Epigraph index={16} />
            <p className="lead">{t('Everyone sees the same photo and riddle. Drop your pin, beat the clock, watch the leaderboard move. Great for classes, school trips and Saturday hangouts. No account needed to join.', 'सबैले एउटै फोटो र सुराग देख्छन्। नक्सामा पिन राख्नुहोस्, समयभित्रै उत्तर दिनुहोस्, स्कोरबोर्ड बदलिँदै गरेको हेर्नुहोस्। कक्षा, स्कुले यात्रा र शनिबारको जमघटका लागि राम्रो। सामेल हुन खाता चाहिँदैन।')}</p>
          </div>
          <div className="grid-2 hp-entry-grid">
            <form className="card pad-l" onSubmit={submitJoin}>
              <h4><Users size={18} /> {t('Join with a code', 'कोड हालेर सामेल हुनुहोस्')}</h4>
              <div className="field"><label htmlFor="hn">{t('Your name', 'तपाईंको नाम')}</label><input id="hn" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder={t('e.g. Aarati', 'जस्तै: आरती')} disabled={!!user} autoComplete="nickname" /></div>
              <div className="field" style={{ marginTop: '0.7rem' }}><label htmlFor="hc">{t('Room code', 'कोठाको कोड')}</label><input id="hc" className="input code-input" value={joinCode} maxLength={6} onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC234" autoCapitalize="characters" autoComplete="off" spellCheck="false" inputMode="text" /></div>
              <button type="submit" className="btn lg" style={{ marginTop: '1rem', width: '100%' }} disabled={!connected || busy || joinCode.length !== 6}>{t('Join the hunt', 'खेलमा सामेल हुनुहोस्')} <ArrowRight size={17} /></button>
            </form>
            <div className="card pad-l lattice-soft">
              <h4><Crown size={18} /> {t('Host a new hunt', 'नयाँ खेल सुरु गर्नुहोस्')}</h4>
              <div className="field"><label id="rl">{t('Rounds', 'राउन्ड')}</label><div className="seg" role="radiogroup" aria-labelledby="rl">{[3, 5, 7, 10].map((n) => <button type="button" role="radio" aria-checked={rounds === n} key={n} className={rounds === n ? 'on' : ''} onClick={() => setRounds(n)}>{t.n(n)}</button>)}</div></div>
              <div className="field" style={{ marginTop: '0.6rem' }}><label id="sl">{t('Seconds per round', 'हरेक राउन्डको समय (सेकेन्ड)')}</label><div className="seg" role="radiogroup" aria-labelledby="sl">{[30, 45, 60, 90].map((n) => <button type="button" role="radio" aria-checked={secs === n} key={n} className={secs === n ? 'on' : ''} onClick={() => setSecs(n)}>{t.n(n)}{t(' s', ' से.')}</button>)}</div></div>
              <button className="btn lg gold diyo" style={{ marginTop: '1rem', width: '100%' }} disabled={!connected || busy} onClick={host}><Play size={17} /> {t('Create the room', 'कोठा बनाउनुहोस्')}</button>
            </div>
          </div>
          {err && <p className="error-text" role="alert" style={{ marginTop: '1rem' }}>{errText(err)}</p>}
          <p className="cap row" style={{ marginTop: '1rem' }}>{connected ? <><Wifi size={14} /> {t('Connected to the game server', 'खेल सर्भरसँग जोडिएको छ')}</> : <><WifiOff size={14} /> {t('Connecting to the game server…', 'खेल सर्भरसँग जोडिँदै छ…')}</>}</p>
        </div>
      </div>
    );
  }

  // ---------- lobby ----------
  if (room.status === 'lobby') {
    return (
      <div className="page hunt-entry hp-entry">
        {offline}
        <div className="wrap" style={{ maxWidth: 780 }}>
          <div className="card pad-l hp-lobby">
            <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
            <div className="eyebrow" style={{ justifyContent: 'center', display: 'flex', marginTop: '1rem' }}>{t('Room code', 'कोठाको कोड')}</div>
            <div className="lobby-join">
              <div>
                <button className="hp-code" onClick={() => copy('code')} aria-label={t(`Room code ${code.split('').join(' ')}. Tap to copy.`, `कोठाको कोड ${code.split('').join(' ')}। कपी गर्न थिच्नुहोस्।`)}>
                  {code.split('').map((c, i) => <span key={i} className="num" style={{ animationDelay: reduce ? '0ms' : `${i * 70}ms` }}>{c}</span>)}
                </button>
                <p className="cap" style={{ margin: '0.4rem 0 0' }}>{copied === 'code' ? <b className="ok-text"><Check size={13} /> {t('Code copied', 'कोड कपी भयो')}</b> : t('Tap the code to copy it', 'कपी गर्न कोडमा थिच्नुहोस्')}</p>
                <p className="cap" style={{ margin: '0.6rem 0 0' }}>{t('Friends open', 'साथीहरूले खोल्ने ठेगाना')} <b>{shareLink ? new URL(shareLink).host : location.host}/hunt</b> {t('and type this code, or scan the QR with a phone on the same Wi-Fi.', 'र यही कोड हाल्नुहोस्, वा एउटै वाइफाइमा रहेको मोबाइलले QR स्क्यान गर्नुहोस्।')}</p>
              </div>
              {qr && <div className="qr" aria-label={t('QR code to join this hunt', 'यो खेलमा सामेल हुने QR कोड')} role="img" dangerouslySetInnerHTML={{ __html: qr }} />}
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn ghost sm" onClick={() => copy('link')}>{copied === 'link' ? <Check size={15} /> : <Copy size={15} />} {copied === 'link' ? t('Link copied', 'लिंक कपी भयो') : t('Copy invite link', 'निम्तो लिंक कपी गर्नुहोस्')}</button>
              {typeof navigator !== 'undefined' && navigator.share && <button className="btn ghost sm" onClick={share}><Share2 size={15} /> {t('Share', 'सेयर गर्नुहोस्')}</button>}
              <span className="cap">{t(`${room.totalRounds} rounds · ${room.roundSeconds}s each`, `${t.n(room.totalRounds)} राउन्ड · हरेक ${t.n(room.roundSeconds)} सेकेन्ड`)}</span>
            </div>
            <ul className="lobby-players" aria-label={t('Players in the room', 'कोठामा रहेका खेलाडी')}>
              <AnimatePresence>
                {players.map((p, i) => (
                  <motion.li key={p.id} className={`lobby-p ${p.connected ? '' : 'away'}`} layout initial={reduce ? false : { opacity: 0, scale: 0.5, y: 14 }} animate={{ opacity: p.connected ? 1 : 0.5, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: 'spring', stiffness: 420, damping: 22, delay: reduce ? 0 : Math.min(i, 4) * 0.04 }}>
                    <span className="dot" style={{ background: p.color }}>{initials(p.name)}</span>
                    <b>{p.name}</b>{p.id === me && <span className="cap">{t('(you)', '(तपाईं)')}</span>}
                    {p.host && <Crown size={14} color="#AE7FFF" aria-label={t('Host', 'होस्ट')} />}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <p className="muted small" role="status">{t(`${players.length} explorer${players.length === 1 ? '' : 's'} in the room`, `कोठामा ${t.n(players.length)} जना खेलाडी छन्`)}{isHost ? t('. Start when everyone is in.', '। सबै आएपछि सुरु गर्नुहोस्।') : t('. Waiting for the host to start…', '। होस्टले सुरु गर्ने प्रतीक्षा गर्दै…')}</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              {isHost && <button className="btn lg diyo" onClick={start}><Play size={17} /> {t('Start the hunt', 'खेल सुरु गर्नुहोस्')}</button>}
              <button className="btn ghost lg" onClick={leave}><LogOut size={17} /> {t('Leave', 'बाहिर निस्कनुहोस्')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- countdown ----------
  if (room.status === 'countdown' && room.startsAt) {
    return <div className="hp-full">{offline}<Countdown startsAt={room.startsAt} skew={skew} t={t} players={players} me={me} sound={sound} /></div>;
  }

  // ---------- playing / reveal / finished ----------
  const myGuess = reveal?.guesses.find((g) => g.id === me)?.guess;
  const ranked = reveal ? reveal.guesses.filter((g) => g.guess && g.guess.metres != null).sort((a, b) => a.guess.metres - b.guess.metres) : [];
  const closest = ranked[0];
  const myFinal = final?.ranking.find((p) => p.id === me);
  return (
    <div className="hunt-play hp-play">
      <div className="explore-map">
        <MapView ref={map} markers={markers} lines={lines} onMapClick={onMapClick} pitch={reveal ? 0 : 35} popup={false} show3d={false} />
      </div>
      {floatsLayer}
      {offline}

      <AnimatePresence>
        {banner !== null && !final && round && (
          <motion.div key={banner} className="hp-banner" initial={reduce ? false : { opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
            {t(`Round ${banner + 1} of ${room.totalRounds}`, `राउन्ड ${t.n(banner + 1)} / ${t.n(room.totalRounds)}`)}
          </motion.div>
        )}
      </AnimatePresence>

      {!final && round && (
        <section className={`hp-panel card ${sheetOpen ? '' : 'min'}`} aria-label={t('Current round', 'अहिलेको राउन्ड')}>
          <div className="hp-head">
            <span className="tag">{t(`Round ${round.index + 1} / ${room.totalRounds}`, `राउन्ड ${t.n(round.index + 1)} / ${t.n(room.totalRounds)}`)}</span>
            {!reveal
              ? <Clock endsAt={round.endsAt} skew={skew} total={room.roundSeconds} t={t} label={(s) => t(`${s} seconds left`, `${t.n(s)} सेकेन्ड बाँकी`)} />
              : <span className="tag gold">{t('Answer', 'उत्तर')}</span>}
            <button className="hp-fold" onClick={() => setSheetOpen(!sheetOpen)} aria-expanded={sheetOpen} aria-label={sheetOpen ? t('Hide photo', 'फोटो लुकाउनुहोस्') : t('Show photo', 'फोटो देखाउनुहोस्')}>{sheetOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
          </div>
          {sheetOpen && (
            <div className="hp-body">
              <div className="hp-photo"><img key={round.image} src={round.image} alt={t('Photo of the mystery monument', 'रहस्यमय स्मारकको फोटो')} /><span className="cap find-credit">{round.credit}</span></div>
              <div className="clue" lang={t.nepali && round.clue_np ? 'ne' : undefined}>“{t.nepali && round.clue_np ? round.clue_np : round.clue}”</div>
            </div>
          )}
          <div className="hp-actions">
            {!reveal && !mine && (
              <>
                <p className="cap" aria-live="polite">{pin ? t('Pin placed. Tap another spot to move it, or lock it in. It locks by itself when time runs out.', 'पिन राखियो। सार्न अर्को ठाउँमा थिच्नुहोस्, वा पक्का गर्नुहोस्। समय सकिँदा आफैं पक्का हुन्छ।') : t('Tap the map to place your pin.', 'पिन राख्न नक्सामा थिच्नुहोस्।')}</p>
                <div className="row hp-lockrow">
                  <button className="btn" disabled={!pin} onClick={lock}><MapPin size={16} /> {t('Lock my guess', 'मेरो उत्तर पक्का गर्नुहोस्')}</button>
                  <button className="hp-kbd" onKeyDown={onPadKey} onClick={() => !pin && nudge(0, 0)} aria-label={t('Place the pin with the keyboard: Enter drops it at the map centre, arrow keys move it, Shift for small steps', 'किबोर्डले पिन राख्नुहोस्: Enter ले नक्साको बीचमा राख्छ, एरो कीले सार्छ, Shift ले सानो पाइला')}><Keyboard size={15} /></button>
                </div>
              </>
            )}
            {!reveal && mine && <p className="ok-text hp-locked" role="status"><Check size={16} /> {t(`Locked in: +${mine.points} (${fmtM(mine.metres)} away). Waiting for the others…`, `पक्का भयो: +${t.n(mine.points)} (${t.n(fmtM(mine.metres))} टाढा)। अरूको प्रतीक्षा गर्दै…`)}</p>}
            {reveal && (
              <div className="hp-result" role="status">
                <p className="hp-it">{t('It was', 'यो थियो')} <Link to={`/m/${reveal.monument.slug}`} target="_blank"><b>{reveal.monument.name}</b></Link> <span lang="ne" className="np muted">{reveal.monument.name_np}</span></p>
                <p className="cap">{reveal.story}</p>
                <div className="hp-score">
                  {myGuess
                    ? <><b className="num">+{t.n(myGuess.points)}</b><span>{t(`${fmtM(myGuess.metres)} away`, `${t.n(fmtM(myGuess.metres))} टाढा`)}</span></>
                    : <span>{t('No pin from you this round.', 'यो राउन्डमा तपाईंले पिन राख्नुभएन।')}</span>}
                  {closest && closest.id !== me && <span className="cap">{t(`Closest: ${closest.name} (${fmtM(closest.guess.metres)})`, `सबैभन्दा नजिक: ${closest.name} (${t.n(fmtM(closest.guess.metres))})`)}</span>}
                </div>
                {isHost
                  ? <button className="btn" onClick={next} autoFocus>{reveal.last ? t('Show final results', 'अन्तिम नतिजा हेर्नुहोस्') : t('Next round', 'अर्को राउन्ड')} <ArrowRight size={16} /></button>
                  : <span className="cap hp-wait">{t('Waiting for the host…', 'होस्टको प्रतीक्षा गर्दै…')}</span>}
              </div>
            )}
            {reactBar}
          </div>
        </section>
      )}

      {!final && <Board room={room} me={me} status={room.status} t={t} open={boardOpen} setOpen={setBoardOpen} />}
      {!final && <button className="hp-leave" onClick={leave}><LogOut size={14} /> {t('Leave hunt', 'खेल छोड्नुहोस्')}</button>}

      <AnimatePresence>
        {final && (
          <motion.div className="hp-final card pad-l mithila" initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
            <h2 style={{ marginTop: '1rem' }}>{t('Hunt complete', 'खेल सकियो')}</h2>
            <div className="hp-podium">
              {[1, 0, 2].map((k) => final.ranking[k] && (
                <div key={k} className={`hp-pod p${k + 1}`}>
                  <motion.div className="hp-pod-who" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.5 + (2 - k) * 0.45 }}>
                    {k === 0 && <Crown size={20} className="hp-crown" aria-hidden="true" />}
                    <span className="dot" style={{ background: final.ranking[k].color }}>{initials(final.ranking[k].name)}</span>
                    <b>{final.ranking[k].name}</b>
                    <span className="num"><CountUp from={0} value={final.ranking[k].points} ms={1200} /></span>
                  </motion.div>
                  <motion.div className="hp-pod-step" style={{ originY: 1 }} initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: reduce ? 0 : (2 - k) * 0.45, ease: [0.16, 1, 0.3, 1] }}><span className="stamp-font">{t.n(final.ranking[k].rank)}</span></motion.div>
                </div>
              ))}
            </div>
            {final.ranking.length > 3 && <ol className="rest" start={4}>{final.ranking.slice(3).map((p) => <li key={p.id} className={p.id === me ? 'me' : ''}><span>{t.n(p.rank)}. {p.name}</span><b className="num">{t.n(p.points)}</b></li>)}</ol>}
            {myFinal && <p className="muted" role="status">{t(`You finished #${myFinal.rank} with ${myFinal.points} points.`, `तपाईं ${t.n(myFinal.rank)} स्थानमा आउनुभयो, ${t.n(myFinal.points)} अङ्कसहित।`)}</p>}
            <div className="row" style={{ justifyContent: 'center' }}>
              {isHost
                ? <button className="btn lg diyo" onClick={again} autoFocus><RotateCcw size={17} /> {t('Play again', 'फेरि खेल्नुहोस्')}</button>
                : <span className="cap">{t('Waiting for the host to play again…', 'होस्टले फेरि सुरु गर्ने प्रतीक्षा गर्दै…')}</span>}
              <button className="btn ghost lg" onClick={leave}><Trophy size={17} /> {t('New hunt', 'नयाँ खेल')}</button>
              <Link className="btn ghost lg" to="/explore">{t('Explore the map', 'नक्सा हेर्नुहोस्')}</Link>
            </div>
            {reactBar}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
