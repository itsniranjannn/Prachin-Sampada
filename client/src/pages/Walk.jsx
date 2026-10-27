import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Footprints, Car, Clock, MapPin, Plus, X, Sparkles, Save, Share2, Navigation, Locate, TriangleAlert, Coffee } from 'lucide-react';
import MapView from '../components/MapView.jsx';
import { TYPE_LABEL } from '../components/MonumentCard.jsx';
import { api, npr, fmtM } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast, announceBadges } from '../lib/toast.jsx';
import { useT } from '../lib/prefs.jsx';
import { Loader } from '../components/Shell.jsx';
import { Epigraph } from '../components/Shloka.jsx';

const STARTS = [
  { key: 'kds', name: 'Basantapur (Kathmandu Durbar Sq.)', lat: 27.7041, lng: 85.3069 },
  { key: 'thamel', name: 'Thamel Chowk', lat: 27.7154, lng: 85.3123 },
  { key: 'patan', name: 'Mangal Bazaar, Patan', lat: 27.6735, lng: 85.3251 },
  { key: 'bkt', name: 'Bhaktapur bus park', lat: 27.6735, lng: 85.4252 },
  { key: 'boudha', name: 'Boudha gate', lat: 27.7202, lng: 85.3617 },
  { key: 'pokhara', name: 'Lakeside, Pokhara', lat: 28.2096, lng: 83.9597 },
  { key: 'lumbini', name: 'Lumbini Sacred Garden gate', lat: 27.484, lng: 83.276 },
  { key: 'janakpur', name: 'Janaki Chowk, Janakpur', lat: 26.7306, lng: 85.9246 },
  { key: 'gorkha', name: 'Gorkha Bazaar', lat: 28.0, lng: 84.629 },
  { key: 'tansen', name: 'Tansen Bazaar, Palpa', lat: 27.8676, lng: 83.5462 },
  { key: 'dharan', name: 'Clock Tower, Dharan', lat: 26.8125, lng: 87.283 },
];
const INTERESTS = [
  ['hindu', 'Hindu temples'], ['buddhist', 'Buddhist sites'], ['pagoda', 'Pagodas'], ['stupa', 'Stupas'], ['palace', 'Royal palaces'],
  ['courtyard', 'Courtyards'], ['art', 'Art & carving'], ['legend', 'Legends'], ['water', 'Water heritage'], ['malla', 'Malla era'], ['licchavi', 'Licchavi era'],
];

export default function Walk() {
  const t = useT();
  const [params] = useSearchParams();
  const [all, setAll] = useState([]);
  const [start, setStart] = useState(STARTS[0]);
  const [mode, setMode] = useState(params.get('add') ? 'places' : 'interests');
  const [picked, setPicked] = useState(params.get('add') ? [Number(params.get('add'))] : []);
  const [interests, setInterests] = useState(['pagoda', 'hindu']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('15:00');
  const [ret, setRet] = useState(false);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pickOnMap, setPickOnMap] = useState(false);
  const [q, setQ] = useState('');
  const map = useRef(null);
  // follow the chosen start across Nepal
  useEffect(() => { if (start.key !== 'map') map.current?.flyTo(start.lng, start.lat, 13.2, { pitch: 45, bearing: -12 }); }, [start]);
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => { api('/monuments').then((d) => setAll(d.results)).catch(() => {}); }, []);

  const run = async () => {
    setBusy(true); setErr('');
    try {
      const body = { start: { lat: start.lat, lng: start.lng }, startTime, endTime, returnToStart: ret, ...(mode === 'places' ? { monumentIds: picked } : { interests }) };
      const { plan: p } = await api('/tours/plan', { method: 'POST', body });
      setPlan(p);
      if (!p.stops.length) setErr('Nothing fits this time window. Try a longer window or a different start.');
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!user) return nav('/login?next=/walk');
    const title = window.prompt('Name this walk', `${start.name.split(' (')[0]} heritage walk`);
    if (!title) return;
    try {
      const r = await api('/tours', { method: 'POST', body: { title, start: { lat: start.lat, lng: start.lng }, startTime, endTime, returnToStart: ret, ...(mode === 'places' ? { monumentIds: picked } : { interests }) } });
      const link = `${location.origin}/w/${r.shareCode}`;
      try { await navigator.clipboard.writeText(link); } catch { /* clipboard blocked */ }
      toast(<span>Walk saved. Share link copied: <b>{link}</b></span>, 'ok', 6000);
      announceBadges(toast, r.badges);
    } catch (e) { toast(e.message, 'err'); }
  };

  const markers = useMemo(() => (plan ? plan.stops.map((s) => ({ ...s.monument })) : []), [plan]);
  const route = useMemo(() => (plan ? [[start.lng, start.lat], ...plan.stops.map((s) => [s.monument.lng, s.monument.lat]), ...(ret ? [[start.lng, start.lat]] : [])] : null), [plan, start, ret]);
  const startMarker = useMemo(() => ({ lat: start.lat, lng: start.lng }), [start]);
  useEffect(() => { if (plan?.stops.length) setTimeout(() => map.current?.fit([[start.lng, start.lat], ...plan.stops.map((s) => [s.monument.lng, s.monument.lat])], 90), 150); }, [plan, start]);

  const gmaps = plan?.stops.length ? `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${plan.stops.at(-1).monument.lat},${plan.stops.at(-1).monument.lng}&waypoints=${plan.stops.slice(0, -1).map((s) => `${s.monument.lat},${s.monument.lng}`).join('|')}&travelmode=walking` : '#';
  const filtered = all.filter((m) => !picked.includes(m.id) && (!q || `${m.name} ${m.name_np} ${m.city}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 6);

  const locate = () => navigator.geolocation?.getCurrentPosition((p) => { setStart({ key: 'me', name: 'My location', lat: p.coords.latitude, lng: p.coords.longitude }); setPlan(null); }, () => toast('Location was not shared', 'err'), { enableHighAccuracy: true, timeout: 9000 });

  return (
    <div className="page walk">
      <div className="wrap">
        <div className="page-head">
          <div className="eyebrow">Heritage yatra planner · यात्रा योजना</div>
          <h1 style={{ fontSize: 'var(--fs-h2)' }}>{t('Plan the best yatra for the hours you have', 'तपाईंसँग भएको समयमा उत्तम यात्रा')}</h1>
            <Epigraph index={3} />
          <p className="lead" style={{ maxWidth: 720 }}>Start in any heritage town in Nepal, then pick places or just your interests. The planner chooses what fits, orders it for the shortest walk, waits for opening times and tells you when a taxi beats walking.</p>
        </div>
        <div className="walk-grid">
          <div className="card pad-l walk-form">
            <h5>1 · Where do you start?</h5>
            <div className="chips-row">
              {STARTS.map((s) => <button key={s.key} className={`chip ${start.key === s.key ? 'on' : ''}`} onClick={() => { setStart(s); setPlan(null); }}>{s.name.split(' (')[0]}</button>)}
              <button className={`chip ${start.key === 'me' ? 'on' : ''}`} onClick={locate}><Locate size={13} /> My location</button>
              <button className={`chip ${pickOnMap ? 'on' : ''}`} onClick={() => setPickOnMap(!pickOnMap)}><MapPin size={13} /> Tap the map</button>
            </div>
            {pickOnMap && <p className="cap" style={{ marginTop: '0.4rem' }}>Tap anywhere on the map to set your start.</p>}
            <p className="cap" style={{ marginTop: '0.4rem' }}>Start: <b>{start.name}</b></p>

            <h5 style={{ marginTop: '1.2rem' }}>2 · Your time window</h5>
            <div className="row">
              <label className="field" style={{ flex: 1 }}><span className="cap">From</span><input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
              <label className="field" style={{ flex: 1 }}><span className="cap">Until</span><input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label>
            </div>
            <label className="row cap" style={{ marginTop: '0.6rem' }}><input type="checkbox" checked={ret} onChange={(e) => setRet(e.target.checked)} /> Come back to the start at the end</label>

            <h5 style={{ marginTop: '1.2rem' }}>3 · What to see</h5>
            <div className="seg">
              <button className={mode === 'interests' ? 'on' : ''} onClick={() => setMode('interests')}><Sparkles size={15} /> By interest</button>
              <button className={mode === 'places' ? 'on' : ''} onClick={() => setMode('places')}><MapPin size={15} /> Choose places</button>
            </div>
            {mode === 'interests' ? (
              <div className="chips-row">
                {INTERESTS.map(([k, label]) => <button key={k} className={`chip ${interests.includes(k) ? 'on' : ''}`} onClick={() => setInterests(interests.includes(k) ? interests.filter((x) => x !== k) : [...interests, k])}>{label}</button>)}
              </div>
            ) : (
              <div style={{ marginTop: '0.6rem' }}>
                {picked.map((id) => { const m = all.find((x) => x.id === id); return m && (
                  <div key={id} className="picked"><span><b>{m.name}</b> <span className="cap">{m.city}</span></span><button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setPicked(picked.filter((x) => x !== id))} aria-label={`Remove ${m.name}`}><X size={14} /></button></div>
                ); })}
                <label className="search" style={{ marginTop: '0.5rem' }}><Plus size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a monument…" aria-label="Add a monument" /></label>
                {(q || picked.length < 2) && <div className="add-list">{filtered.map((m) => <button key={m.id} onClick={() => { setPicked([...picked, m.id]); setQ(''); }}><Plus size={14} /> {m.name} <span className="cap">{m.city}</span></button>)}</div>}
              </div>
            )}
            {err && <p className="error-text" style={{ marginTop: '0.8rem' }}>{err}</p>}
            <button className="btn lg diyo" style={{ width: '100%', marginTop: '1.2rem' }} onClick={run} disabled={busy || (mode === 'places' ? !picked.length : !interests.length)}>
              {busy ? 'Planning…' : <><Route size={18} /> {t('Plan my walk', 'मेरो यात्रा बनाउनुहोस्')}</>}
            </button>
          </div>

          <div className="walk-right">
            <div className="walk-map card">
              <MapView ref={map} markers={markers} numbered route={route} start={startMarker} onMapClick={pickOnMap ? (p) => { setStart({ key: 'map', name: `Map point (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`, ...p }); setPickOnMap(false); setPlan(null); } : undefined} initial={{ center: [start.lng, start.lat], zoom: 13.2 }} pitch={45} popup={false} />
            </div>
            <AnimatePresence mode="wait">
              {busy && <motion.div key="busy" className="card" style={{ display: 'grid', placeItems: 'center', padding: '2rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader label="Finding the shortest heritage walk…" /></motion.div>}
              {!busy && plan && plan.stops.length > 0 && (
                <motion.div key="plan" className="card pad-l" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="walk-summary">
                    <div><b className="num">{plan.stops.length}</b><span>stops</span></div>
                    <div><b className="num">{plan.startTime}–{plan.finish}</b><span>your day</span></div>
                    <div><b className="num">{fmtM(plan.walkMetres)}</b><span>on foot</span></div>
                    <div><b className="num">{plan.rideCostNpr ? npr(plan.rideCostNpr) : 'Rs 0'}</b><span>taxi fares</span></div>
                  </div>
                  <ol className="timeline">
                    <li className="tl-start"><span className="tl-dot" /><div><b>{start.name}</b><span className="cap">Start · {plan.startTime}</span></div></li>
                    {plan.stops.map((s, i) => (
                      <li key={s.id}>
                        <div className="tl-leg">
                          {s.leg.mode === 'walk' ? <Footprints size={14} /> : <Car size={14} />}
                          {s.leg.mode === 'walk' ? `Walk ${fmtM(s.leg.metres)} · ${s.leg.minutes} min` : `Taxi ${fmtM(s.leg.metres)} · ~${s.leg.minutes} min · ${npr(s.leg.costNpr)}`}
                          {s.waitMinutes > 0 && <span className="tl-wait"><Coffee size={13} /> wait {s.waitMinutes} min for opening</span>}
                        </div>
                        <span className="tl-dot num">{i + 1}</span>
                        <Link to={`/m/${s.monument.slug}`} className="tl-stop">
                          {s.monument.image && <img src={s.monument.image} alt="" loading="lazy" />}
                          <div><b>{s.monument.name}</b><span className="np cap" lang="ne">{s.monument.name_np}</span><span className="cap"><Clock size={12} /> {s.start}–{s.end} · {TYPE_LABEL[s.monument.type]}</span></div>
                        </Link>
                      </li>
                    ))}
                  </ol>
                  {plan.skipped.length > 0 && (
                    <div className="quake" style={{ marginTop: '1rem' }}><TriangleAlert size={18} /><div><b>Left out:</b> {plan.skipped.map((s) => `${s.monument.name} (${s.reason})`).join('; ')}.</div></div>
                  )}
                  <div className="row" style={{ marginTop: '1.2rem' }}>
                    <a className="btn" href={gmaps} target="_blank" rel="noreferrer"><Navigation size={16} /> Open in Google Maps</a>
                    <button className="btn ghost" onClick={save}><Save size={16} /> Save &amp; share</button>
                  </div>
                </motion.div>
              )}
              {!busy && !plan && (
                <motion.div key="intro" className="card pad-l walk-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Share2 size={22} color="var(--primary)" />
                  <div><b>How the planner decides</b><p className="small muted" style={{ margin: '0.3rem 0 0' }}>Each place gets a value from your interests (UNESCO zones get a small bonus). The planner adds the best value per extra minute, keeps every visit inside opening hours, shortens the order with 2-opt, then fills any freed time. Old-town lanes are walked; long hops become a taxi with an estimated fare.</p></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
