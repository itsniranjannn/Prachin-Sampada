// Live multiplayer heritage hunt over Socket.io.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import { Users, Copy, Play, Crown, Check, MapPin, ArrowRight, Trophy, LogOut, Wifi, WifiOff } from 'lucide-react';
import MapView from '../components/MapView.jsx';
import { api, getToken, fmtM } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast } from '../lib/toast.jsx';
import { play, buzz } from '../lib/sound.js';

const NAME_KEY = 'sampada-hunt-name';
const EMOJIS = ['🙏', '🔥', '👏', '😮', '🎉'];

export default function Hunt() {
  const t = useT();
  const { code: urlCode } = useParams();
  const { user } = useAuth();
  const { sound } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const sock = useRef(null);
  const map = useRef(null);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState(() => user?.name || localStorage.getItem(NAME_KEY) || '');
  const [joinCode, setJoinCode] = useState(urlCode || '');
  const [rounds, setRounds] = useState(5);
  const [secs, setSecs] = useState(45);
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [round, setRound] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [final, setFinal] = useState(null);
  const [pin, setPin] = useState(null);
  const [mine, setMine] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [floats, setFloats] = useState([]);
  const [err, setErr] = useState('');
  const [qr, setQr] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => { if (user?.name && !name) setName(user.name); }, [user, name]);

  useEffect(() => {
    const s = io({ auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    sock.current = s;
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('room', (r) => setRoom(r));
    s.on('round', (r) => { setRound(r); setReveal(null); setPin(null); setMine(null); map.current?.reset(); play('tick', sound); });
    s.on('reveal', (r) => {
      setReveal(r);
      const pts = [[r.monument.lng, r.monument.lat], ...r.guesses.filter((g) => g.guess).map((g) => [g.guess.lng, g.guess.lat])];
      setTimeout(() => map.current?.fit(pts, 90), 100);
    });
    s.on('finished', (f) => { setFinal(f); play('bell', sound); });
    s.on('reaction', (r) => {
      const id = Math.random();
      setFloats((l) => [...l.slice(-8), { ...r, id, x: 10 + Math.random() * 80 }]);
      setTimeout(() => setFloats((l) => l.filter((x) => x.id !== id)), 2600);
    });
    return () => { s.emit('leave'); s.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);

  const doJoin = (code) => new Promise((resolve) => {
    if (!name.trim()) { setErr('Enter your name first'); return resolve(false); }
    localStorage.setItem(NAME_KEY, name.trim());
    sock.current.emit('join', { code, name: name.trim() }, (ack) => {
      if (!ack.ok) { setErr(ack.error); return resolve(false); }
      setErr(''); setMe(ack.playerId); setRoom(ack.room); if (ack.round) setRound(ack.round);
      nav(`/hunt/${ack.room.code}`, { replace: true });
      resolve(true);
    });
  });
  const host = () => {
    if (!name.trim()) return setErr('Enter your name first');
    sock.current.emit('host', { name: name.trim(), rounds, roundSeconds: secs }, async (ack) => { if (!ack.ok) return setErr(ack.error); await doJoin(ack.code); });
  };
  const start = () => sock.current.emit('start', {}, (ack) => { if (!ack.ok) toast(ack.error, 'err'); });
  const lock = () => {
    if (!pin) return;
    sock.current.emit('guess', pin, (ack) => {
      if (!ack.ok) return toast(ack.error, 'err');
      setMine(ack); play(ack.points >= 600 ? 'bowl' : 'soft', sound); buzz(20);
    });
  };
  const leave = () => { sock.current.emit('leave'); setRoom(null); setRound(null); setReveal(null); setFinal(null); setMe(null); nav('/hunt'); };
  const react = (emoji) => sock.current.emit('reaction', { emoji });

  const isHost = room && sock.current && room.hostId === sock.current.id;
  const remaining = round ? Math.max(0, Math.ceil((round.endsAt - now) / 1000)) : 0;
  const link = shareLink || (room ? `${location.origin}/hunt/${room.code}` : '');

  // invite QR: on localhost, point phones at this computer's Wi-Fi address instead
  useEffect(() => {
    if (!room?.code) return undefined;
    let alive = true;
    (async () => {
      let origin = location.origin;
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        try { const { ips } = await api('/net'); if (ips?.[0]) origin = `${location.protocol}//${ips[0]}:${location.port}`; } catch { /* keep localhost */ }
      }
      const url = `${origin}/hunt/${room.code}`;
      const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#381932', light: '#FFF3E6' } });
      if (alive) { setShareLink(url); setQr(svg); }
    })();
    return () => { alive = false; };
  }, [room?.code]);
  const players = room?.players || [];

  const extra = useMemo(() => {
    if (reveal) return reveal.guesses.filter((g) => g.guess).map((g) => ({ lat: g.guess.lat, lng: g.guess.lng, color: g.color, label: g.name }));
    return pin ? [{ ...pin, color: players.find((p) => p.id === me)?.color || '#27187E' }] : [];
  }, [reveal, pin, players, me]);
  const markers = useMemo(() => (reveal ? [{ ...reveal.monument, pulse: true }] : []), [reveal]);
  const lines = useMemo(() => (reveal ? reveal.guesses.filter((g) => g.guess).map((g) => ({ from: [g.guess.lng, g.guess.lat], to: [reveal.monument.lng, reveal.monument.lat], color: g.color })) : []), [reveal]);

  // ---------- not in a room: host or join ----------
  if (!room) {
    return (
      <div className="page hunt-entry">
        <div className="wrap">
          <div className="hunt-hero">
            <div className="flags" aria-hidden="true">{Array.from({ length: 15 }).map((_, i) => <i key={i} />)}</div>
            <div className="eyebrow" style={{ marginTop: '1rem' }}>Live heritage hunt · लाइभ सम्पदा खेल</div>
            <h1 style={{ fontSize: 'var(--fs-h2)' }}>{t('Race your friends across the valley', 'साथीहरूसँग उपत्यकाभरि दौड')}</h1>
            <p className="lead">Everyone sees the same photo and riddle. Drop your pin, beat the clock, watch the leaderboard move. Great for classes, school trips and Saturday hangouts. No account needed to join.</p>
          </div>
          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="card pad-l">
              <h4><Users size={18} /> {t('Join with a code', 'कोडबाट सामेल हुनुहोस्')}</h4>
              <div className="field"><label htmlFor="hn">Your name</label><input id="hn" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarati" disabled={!!user} /></div>
              <div className="field" style={{ marginTop: '0.7rem' }}><label htmlFor="hc">Room code</label><input id="hc" className="input code-input" value={joinCode} maxLength={6} onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC234" /></div>
              <button className="btn lg" style={{ marginTop: '1rem', width: '100%' }} disabled={!connected || joinCode.length !== 6} onClick={() => doJoin(joinCode)}>{t('Join the hunt', 'खेलमा सामेल हुनुहोस्')} <ArrowRight size={17} /></button>
            </div>
            <div className="card pad-l lattice-soft">
              <h4><Crown size={18} /> {t('Host a new hunt', 'नयाँ खेल चलाउनुहोस्')}</h4>
              <div className="field"><label>Rounds</label><div className="seg">{[3, 5, 7, 10].map((n) => <button key={n} className={rounds === n ? 'on' : ''} onClick={() => setRounds(n)}>{n}</button>)}</div></div>
              <div className="field" style={{ marginTop: '0.6rem' }}><label>Seconds per round</label><div className="seg">{[30, 45, 60, 90].map((n) => <button key={n} className={secs === n ? 'on' : ''} onClick={() => setSecs(n)}>{n}s</button>)}</div></div>
              <button className="btn lg gold diyo" style={{ marginTop: '1rem', width: '100%' }} disabled={!connected} onClick={host}><Play size={17} /> {t('Create the room', 'कोठा बनाउनुहोस्')}</button>
            </div>
          </div>
          {err && <p className="error-text" style={{ marginTop: '1rem' }}>{err}</p>}
          <p className="cap row" style={{ marginTop: '1rem' }}>{connected ? <><Wifi size={14} /> Connected to the game server</> : <><WifiOff size={14} /> Connecting to the game server…</>}</p>
        </div>
      </div>
    );
  }

  // ---------- lobby ----------
  if (room.status === 'lobby') {
    return (
      <div className="page hunt-entry">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="card pad-l" style={{ textAlign: 'center' }}>
            <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
            <div className="eyebrow" style={{ justifyContent: 'center', display: 'flex', marginTop: '1rem' }}>Room code</div>
            <div className="lobby-join">
              <div>
                <div className="room-code num">{room.code}</div>
                <p className="cap" style={{ margin: 0 }}>Friends open <b>{shareLink ? new URL(shareLink).host : location.host}/hunt</b> and type this code,<br />or scan the QR with a phone on the same Wi-Fi.</p>
              </div>
              {qr && <div className="qr" aria-label="QR code to join this hunt" role="img" dangerouslySetInnerHTML={{ __html: qr }} />}
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn ghost sm" onClick={async () => { try { await navigator.clipboard.writeText(link); toast('Invite link copied', 'ok'); } catch { toast(link); } }}><Copy size={15} /> Copy invite link</button>
              <span className="cap">{room.totalRounds} rounds · {room.roundSeconds}s each</span>
            </div>
            <div className="lobby-players">
              <AnimatePresence>
                {players.map((p) => (
                  <motion.div key={p.id} className="lobby-p" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <span className="dot" style={{ background: p.color }}>{p.name.slice(0, 1).toUpperCase()}</span>
                    <b>{p.name}</b>{p.id === me && <span className="cap">(you)</span>}
                    {p.host && <Crown size={14} color="#AE7FFF" aria-label="Host" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <p className="muted small">{players.length} explorer{players.length === 1 ? '' : 's'} in the room{isHost ? '. Start when everyone is in.' : '. Waiting for the host to start…'}</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              {isHost && <button className="btn lg diyo" onClick={start}><Play size={17} /> {t('Start the hunt', 'खेल सुरु गर्नुहोस्')}</button>}
              <button className="btn ghost lg" onClick={leave}><LogOut size={17} /> Leave</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- playing / reveal / finished ----------
  const myRow = players.find((p) => p.id === me);
  return (
    <div className="hunt-play">
      <div className="explore-map">
        <MapView ref={map} markers={markers} extra={extra} lines={lines} onMapClick={round && !reveal && !mine && !final ? (p) => { setPin(p); play('tick', sound); } : undefined} pitch={35} popup={false} show3d={false} />
      </div>
      <div className="floats" aria-hidden="true">{floats.map((f) => <span key={f.id} style={{ left: `${f.x}%` }}>{f.emoji}<small style={{ color: f.color }}>{f.name}</small></span>)}</div>

      {!final && round && (
        <div className="find-panel card">
          <div className="row between" style={{ padding: '0.9rem 1rem 0' }}>
            <span className="tag">Round {round.index + 1} / {room.totalRounds}</span>
            {!reveal ? <span className={`hunt-clock num ${remaining <= 10 ? 'low' : ''}`}>{remaining}s</span> : <span className="tag gold">Answer</span>}
          </div>
          <div className="find-photo"><img src={round.image} alt="Mystery monument" /><span className="cap find-credit">{round.credit}</span></div>
          <div style={{ padding: '0.9rem 1rem 1rem' }}>
            <div className="clue">“{round.clue}”</div>
            {!reveal && !mine && (
              <>
                <p className="cap" style={{ margin: '0.7rem 0' }}>{pin ? 'Pin placed. Lock it before the clock runs out.' : 'Tap the map to place your pin.'}</p>
                <button className="btn" disabled={!pin} onClick={lock}><MapPin size={16} /> Lock my guess</button>
              </>
            )}
            {!reveal && mine && <p className="ok-text" style={{ marginTop: '0.7rem' }}><Check size={16} /> Locked in: +{mine.points} ({fmtM(mine.metres)} away). Waiting for the others…</p>}
            {reveal && (
              <div style={{ marginTop: '0.6rem' }}>
                <p style={{ margin: 0 }}>It was <Link to={`/m/${reveal.monument.slug}`} target="_blank"><b>{reveal.monument.name}</b></Link> <span lang="ne" className="np muted">{reveal.monument.name_np}</span></p>
                <p className="cap" style={{ margin: '0.3rem 0 0.8rem' }}>{reveal.story}</p>
                {isHost ? <button className="btn" onClick={() => sock.current.emit('next')}>{reveal.last ? 'Show final results' : 'Next round'} <ArrowRight size={16} /></button> : <span className="cap">Waiting for the host…</span>}
              </div>
            )}
            <div className="reactions">{EMOJIS.map((e) => <button key={e} onClick={() => react(e)} aria-label={`React ${e}`}>{e}</button>)}</div>
          </div>
        </div>
      )}

      {!final && (
        <div className="hunt-board card">
          <div className="row between"><h5 style={{ margin: 0 }}>Leaderboard</h5><span className="cap">{room.code}</span></div>
          <ol>
            <AnimatePresence>
              {players.map((p) => (
                <motion.li layout key={p.id} className={p.id === me ? 'me' : ''} transition={{ type: 'spring', stiffness: 400, damping: 32 }}>
                  <span className="rank num">{p.rank}</span>
                  <span className="dot" style={{ background: p.color }} />
                  <span className="pname">{p.name}{!p.connected && <span className="cap"> (away)</span>}</span>
                  {room.status === 'playing' && (p.answered ? <Check size={15} color="var(--ok)" /> : <span className="thinking">…</span>)}
                  <b className="num">{p.points}</b>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          <button className="link-btn small" onClick={leave}>Leave hunt</button>
        </div>
      )}

      <AnimatePresence>
        {final && (
          <motion.div className="find-intro card pad-l mithila" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
            <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
            <h2 style={{ marginTop: '1rem' }}>Hunt complete</h2>
            <div className="podium">
              {[1, 0, 2].map((k) => final.ranking[k] && (
                <div key={k} className={`pod p${k + 1}`}>
                  <span className="dot" style={{ background: final.ranking[k].color }}>{final.ranking[k].name.slice(0, 1)}</span>
                  <b>{final.ranking[k].name}</b>
                  <span className="num">{final.ranking[k].points}</span>
                  <div className="pod-step stamp-font">{final.ranking[k].rank}</div>
                </div>
              ))}
            </div>
            {final.ranking.length > 3 && <ol className="rest">{final.ranking.slice(3).map((p) => <li key={p.id}><span>{p.rank}. {p.name}</span><b className="num">{p.points}</b></li>)}</ol>}
            {myRow && <p className="muted">You finished <b>#{final.ranking.find((p) => p.id === me)?.rank}</b> with {myRow.points} points.</p>}
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn lg diyo" onClick={leave}><Trophy size={17} /> New hunt</button>
              <Link className="btn ghost lg" to="/explore">Explore the winners’ map</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
