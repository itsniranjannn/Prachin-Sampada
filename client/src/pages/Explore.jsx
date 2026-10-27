import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Play, Square, ChevronLeft, ChevronRight, X, ArrowRight, Clapperboard, List, Map as MapIcon, Locate } from 'lucide-react';
import MapView, { NEPAL } from '../components/MapView.jsx';
import { TYPE_LABEL } from '../components/MonumentCard.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useNarrator } from '../lib/speech.js';
import { useT } from '../lib/prefs.jsx';

// Nepal story: west to east along the great pilgrim sites; any stop missing from the data is skipped
const STORY_ORDER = [/maya devi|lumbini/i, /^muktinath/i, /^gorkha durbar/i, /^swayambhu/i, /^pashupati/i, /^boudha/i, /^patan durbar/i, /^bhaktapur durbar/i, /^janaki/i, /^tengboche/i, /^pathibhara/i];
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

/** Great-circle distance in metres (Haversine), same formula as the server. */
function metresBetween(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h))));
}
const showM = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState(null);
  const [q, setQ] = useState(params.get('q') || '');
  const [type, setType] = useState(params.get('type') || '');
  const [religion, setReligion] = useState(params.get('religion') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [unesco, setUnesco] = useState(params.get('unesco') === '1');
  const [province, setProvince] = useState(params.get('province') || '');
  const [faith, setFaith] = useState(params.get('faith') || '');
  const [faithIds, setFaithIds] = useState(null);
  const [sel, setSel] = useState(null);
  const [stamps, setStamps] = useState(new Set());
  const [story, setStory] = useState(-1);
  const [panel, setPanel] = useState(true);
  const map = useRef(null);
  const { user } = useAuth();
  const t = useT();

  useEffect(() => { api('/monuments').then((d) => setAll(d.results)).catch(() => setAll([])); }, []);
  useEffect(() => { if (!faith) { setFaithIds(null); return; } api(`/monuments?faith=${faith}`).then((d) => setFaithIds(new Set(d.results.map((m) => m.id)))).catch(() => setFaithIds(null)); }, [faith]);
  useEffect(() => { if (user) api('/passport').then((d) => setStamps(new Set(d.stamps.map((s) => s.id)))).catch(() => {}); }, [user]);
  useEffect(() => {
    const p = {};
    if (q) p.q = q; if (type) p.type = type; if (religion) p.religion = religion; if (city) p.city = city; if (unesco) p.unesco = '1'; if (province) p.province = province; if (faith) p.faith = faith;
    setParams(p, { replace: true });
  }, [q, type, religion, city, unesco, province, faith, setParams]);

  const [me, setMe] = useState(null); // {lat, lng, accuracy} after "Near me"
  const [locMsg, setLocMsg] = useState('');
  const [wide, setWide] = useState(() => window.innerWidth > 760);
  useEffect(() => { const on = () => setWide(window.innerWidth > 760); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);

  const list = useMemo(() => {
    if (!all) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = all.filter((m) => (!type || m.type === type) && (!religion || m.religion === religion || m.religion === 'Both') && (!city || m.city === city) && (!unesco || m.unesco) && (!province || m.province === province) && (!faithIds || faithIds.has(m.id))
      && terms.every((w) => `${m.name} ${m.name_np} ${m.deity || ''} ${m.tags} ${m.short}`.toLowerCase().includes(w)));
    if (!me) return out;
    return out.map((m) => ({ ...m, metres: metresBetween(me, m) })).sort((a, b) => a.metres - b.metres);
  }, [all, q, type, religion, city, unesco, province, faithIds, me]);

  // on site: anything within 150 m (or the GPS accuracy) pulses like a butter lamp
  const markers = useMemo(() => list.map((m) => ({ ...m, stamped: stamps.has(m.id), pulse: sel?.id === m.id || (m.metres != null && m.metres <= Math.max(150, me?.accuracy || 0)) })), [list, stamps, sel, me]);
  const meDot = useMemo(() => (me ? [{ lat: me.lat, lng: me.lng, color: '#27187E', label: 'You are here' }] : []), [me]);
  const padding = useMemo(() => (panel && wide ? { left: 400, top: 0, right: 0, bottom: 0 } : { left: 0, top: 0, right: 0, bottom: 0 }), [panel, wide]);
  const types = useMemo(() => [...new Set((all || []).map((m) => m.type))], [all]);
  const provCount = useMemo(() => (all || []).reduce((a, m) => ({ ...a, [m.province]: (a[m.province] || 0) + 1 }), {}), [all]);
  // fly to the chosen province
  useEffect(() => { if (province && list.length) map.current?.fit(list.map((m) => [m.lng, m.lat]), wide ? { top: 90, bottom: 60, left: 430, right: 60 } : 60); /* eslint-disable-next-line */ }, [province]);

  // valley story: cinematic tour of the UNESCO zones
  const storyStops = useMemo(() => STORY_ORDER.map((re) => all?.find((m) => re.test(m.name))).filter(Boolean), [all]);
  const chapters = useMemo(() => storyStops.map((m) => ({ title: m.name, text: `${m.name}. ${m.short}` })), [storyStops]);
  const narrator = useNarrator(chapters);
  const go = (i) => {
    const m = storyStops[i];
    if (!m) return;
    setStory(i); setSel(m);
    map.current?.flyTo(m.lng, m.lat, 16.2, { pitch: 64, bearing: -20 + i * 35 });
    narrator.play(i);
  };
  const endStory = () => { setStory(-1); narrator.stop(); map.current?.reset(); };
  // follow the narrator when it moves to the next chapter on its own
  useEffect(() => {
    if (story >= 0 && narrator.playing && narrator.chapter !== story) {
      const m = storyStops[narrator.chapter];
      if (m) { setStory(narrator.chapter); setSel(m); map.current?.flyTo(m.lng, m.lat, 16.6, { pitch: 64, bearing: -20 + narrator.chapter * 35 }); }
    }
  }, [narrator.chapter, narrator.playing, story, storyStops]);

  const select = (m) => { setSel(m); map.current?.flyTo(m.lng, m.lat, 17, { pitch: 60 }); };
  const locate = () => {
    if (!navigator.geolocation) { setLocMsg('This device cannot share its location.'); return; }
    setLocMsg('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) };
        setMe(pos);
        const inNepal = pos.lat > 26.3 && pos.lat < 30.5 && pos.lng > 80 && pos.lng < 88.3;
        setLocMsg(inNepal ? 'Sorted by distance from you. Places that pulse are within a short walk.' : 'You seem to be outside Nepal, so the list is sorted by distance anyway.');
        map.current?.flyTo(pos.lng, pos.lat, inNepal ? 14 : 7, { pitch: 50 });
      },
      () => setLocMsg('Location was not shared. You can still explore the whole map.'),
      { enableHighAccuracy: true, timeout: 9000 },
    );
  };

  return (
    <div className="explore">
      <div className="explore-map">
        <MapView ref={map} markers={markers} extra={meDot} padding={padding} onSelect={select} initial={NEPAL} cluster />
      </div>

      <AnimatePresence>
        {panel && (
          <motion.aside className="explore-panel" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="explore-panel-head">
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.3rem' }}>{t('Story map', 'कथा नक्सा')}</div>
                <h2>{t('Explore Nepal', 'नेपाल अन्वेषण')}</h2>
              </div>
              <button className="icon-btn" onClick={() => setPanel(false)} aria-label="Hide list"><X size={17} /></button>
            </div>
            <label className="search">
              <Search size={17} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search temples, deities, cities…" aria-label="Search monuments" />
            </label>
            <div className="chips-row">
              <button className={`chip ${unesco ? 'on' : ''}`} onClick={() => setUnesco(!unesco)}>UNESCO</button>
              {['Hindu', 'Buddhist'].map((r) => <button key={r} className={`chip ${religion === r ? 'on' : ''}`} onClick={() => setReligion(religion === r ? '' : r)}>{r}</button>)}
              {city && <button className="chip on" onClick={() => setCity('')}>{city} ×</button>}
              {faith && <button className="chip on" onClick={() => setFaith('')}>{faith[0].toUpperCase() + faith.slice(1)} ×</button>}
            </div>
            <div className="chips-row">
              {PROVINCES.map((p) => <button key={p} className={`chip ${province === p ? 'on' : ''}`} onClick={() => setProvince(province === p ? '' : p)} disabled={!provCount[p]}>{p} <span className="muted">{provCount[p] || 0}</span></button>)}
            </div>
            <details className="more-filters" open={!!type}>
              <summary>Type of place{type ? `: ${TYPE_LABEL[type] || type}` : ''}</summary>
              <div className="chips-row">
              {types.map((ty) => <button key={ty} className={`chip ${type === ty ? 'on' : ''}`} onClick={() => setType(type === ty ? '' : ty)}>{TYPE_LABEL[ty] || ty}</button>)}
              </div>
            </details>
            <div className="row between small muted" style={{ margin: '0.6rem 0 0.4rem' }}>
              <span>{all ? `${list.length} of ${all.length} places` : 'Loading…'}</span>
              {(q || type || religion || city || unesco || province || faith) && <button className="link-btn" onClick={() => { setQ(''); setType(''); setReligion(''); setCity(''); setUnesco(false); setProvince(''); setFaith(''); map.current?.reset(); }}>Clear filters</button>}
            </div>
            {locMsg && <p className="loc-msg cap">{locMsg}{me && <> <button className="link-btn" onClick={() => { setMe(null); setLocMsg(''); }}>Stop</button></>}</p>}
            <div className="explore-list">
              {!all && Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 76, marginBottom: 8 }} />)}
              {all && !list.length && <div className="empty small"><p>No monument matches. Try another word or clear the filters.</p></div>}
              {list.map((m) => (
                <button key={m.id} className={`row-item ${sel?.id === m.id ? 'on' : ''}`} onClick={() => select(m)}>
                  {m.image ? <img src={m.image} alt="" loading="lazy" /> : <span className="row-ph jaali" />}
                  <span className="row-text">
                    <b>{m.name}</b>
                    <span lang="ne" className="np small muted">{m.name_np}</span>
                    <span className="cap">{m.metres != null ? <b className="dist">{showM(m.metres)}</b> : null}{TYPE_LABEL[m.type] || m.type} · {m.city}{m.province !== 'Bagmati' ? `, ${m.province}` : ''}{stamps.has(m.id) ? ' · stamped ✓' : ''}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="explore-tools">
        {!panel && <button className="btn dark sm" onClick={() => setPanel(true)}><List size={16} /> List</button>}
        {story < 0
          ? <button className="btn gold sm" onClick={() => go(0)} disabled={!storyStops.length}><Clapperboard size={16} /> Nepal story</button>
          : <button className="btn dark sm" onClick={endStory}><Square size={14} /> End story</button>}
        <button className="btn ghost sm glass" onClick={() => map.current?.reset()}><MapIcon size={16} /> All Nepal</button>
        <button className="btn ghost sm glass" onClick={locate}><Locate size={16} /> Near me</button>
      </div>

      <AnimatePresence>
        {sel && (
          <motion.div key={sel.id} className="explore-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
            {sel.image && <div className="toran-img"><img src={sel.image} alt={sel.name} /></div>}
            <div className="explore-card-body">
              <button className="icon-btn close" onClick={() => { setSel(null); if (story >= 0) endStory(); }} aria-label="Close"><X size={16} /></button>
              {story >= 0 && <div className="eyebrow" style={{ marginBottom: '0.2rem' }}>Nepal story · {story + 1} of {storyStops.length}</div>}
              <h3 style={{ margin: 0 }}>{sel.name}</h3>
              <div className="np muted" lang="ne">{sel.name_np}</div>
              <p className="small" style={{ margin: '0.5rem 0 0.8rem' }}>{sel.short}</p>
              <div className="row">
                <Link className="btn sm" to={`/m/${sel.slug}`}>Open the story <ArrowRight size={15} /></Link>
                {story >= 0 && (
                  <>
                    <button className="icon-btn" onClick={() => go(Math.max(0, story - 1))} aria-label="Previous stop" disabled={story === 0}><ChevronLeft size={17} /></button>
                    <button className="icon-btn" onClick={() => (story + 1 < storyStops.length ? go(story + 1) : endStory())} aria-label="Next stop"><ChevronRight size={17} /></button>
                    {narrator.supported && (narrator.playing && !narrator.paused
                      ? <button className="btn ghost sm" onClick={narrator.pause}>Pause voice</button>
                      : <button className="btn ghost sm" onClick={() => (narrator.paused ? narrator.resume() : narrator.play(story))}><Play size={14} /> Voice</button>)}
                  </>
                )}
              </div>
              {story >= 0 && <div className="story-bar"><span style={{ width: `${((story + (narrator.progress || 0)) / storyStops.length) * 100}%` }} /></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
