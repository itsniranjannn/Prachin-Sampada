import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Pause, Square, Heart, Stamp, MapPin, Brain, Route, Star, ExternalLink, ArrowRight, Info, TriangleAlert, Images, ChevronRight } from 'lucide-react';
import { api, npr, fmtM } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast, announceBadges } from '../lib/toast.jsx';
import { useNarrator } from '../lib/speech.js';
import { play, buzz } from '../lib/sound.js';
import { MonumentCard, TYPE_LABEL } from '../components/MonumentCard.jsx';
import { PageLoader } from '../components/Shell.jsx';
import MapView from '../components/MapView.jsx';
import { Gallery } from '../components/Gallery.jsx';
import { ScanFrame, ScanDetails } from '../components/ScanViewer.jsx';
import { SCANS } from '../data/scans.js';
import { ShrineVerse } from '../components/Shloka.jsx';

const SiteViewer = lazy(() => import('../three/site.jsx').then((x) => ({ default: x.SiteViewer })));

export default function Monument() {
  const t = useT();
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const { theme, sound, nepali } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const [lightbox, setLightbox] = useState(false);
  const [view, setView] = useState(() => (new URLSearchParams(window.location.search).get('view') === 'model' ? 'model' : 'scan'));
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, 160]);
  const heroScale = useTransform(scrollY, [0, 700], [1.06, 1.16]);

  const load = () => api(`/monuments/${slug}`).then((d) => {
    setData(d);
    setStars(d.me?.rating?.stars || 0);
    setComment(d.me?.rating?.comment || '');
  }).catch((e) => setErr(e.status === 404 ? 'We could not find this monument.' : e.message));
  useEffect(() => { setData(null); setErr(''); load(); /* eslint-disable-next-line */ }, [slug]);

  const m = data?.monument;
  const pick = (np, en) => (nepali && np ? np : en);
  const chapters = useMemo(() => (m ? [
    { title: nepali ? 'कथा' : 'Story', text: pick(m.story_np, m.story) },
    ...(m.legend ? [{ title: nepali ? 'किंवदन्ती' : 'Legend', text: pick(m.legend_np, m.legend) }] : []),
    ...(m.facts?.length ? [{ title: nepali ? 'के तपाईंलाई थाहा छ?' : 'Did you know', text: (nepali && m.facts_np?.length ? m.facts_np : m.facts).join(' ') }] : []),
  ] : []), [m, nepali]);
  const narrator = useNarrator(chapters, nepali ? 'ne' : 'en');

  if (err) return <div className="page wrap"><div className="empty brick-wall"><h3>{err}</h3><Link to="/explore" className="btn">Back to the map</Link></div></div>;
  if (!data) return <PageLoader />;

  const needLogin = () => nav(`/login?next=/m/${slug}`);
  const stamp = (withGps) => {
    if (!user) return needLogin();
    const send = (position) => {
      setBusy('stamp');
      api(`/passport/stamp/${slug}`, { method: 'POST', body: position ? { position } : {} })
        .then((r) => { play('bowl', sound); buzz(30); toast(r.method === 'gps' ? 'Stamped on site with GPS. शाबास!' : 'Stamped in your passport.', 'ok'); announceBadges(toast, r.badges); load(); })
        .catch((e) => toast(e.message, 'err', 6000))
        .finally(() => setBusy(''));
    };
    if (!withGps) return send(null);
    if (!navigator.geolocation) return toast('This device cannot share its location. Use "I am here" instead.', 'err');
    setBusy('stamp');
    navigator.geolocation.getCurrentPosition(
      (p) => send({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => { setBusy(''); toast(e.code === 1 ? 'Location permission is blocked. Allow it in the browser address bar, or stamp with "I am here".' : 'Could not get a GPS fix. Move to open sky and retry, or stamp with "I am here".', 'err', 6000); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  const fav = () => {
    if (!user) return needLogin();
    api(`/monuments/${slug}/favorite`, { method: 'POST' }).then((r) => { toast(r.favorite ? 'Saved to your favorites' : 'Removed from favorites', 'ok'); load(); });
  };
  const rate = (e) => {
    e.preventDefault();
    if (!user) return needLogin();
    if (!stars) return toast('Choose 1 to 5 stars', 'err');
    api(`/monuments/${slug}/rate`, { method: 'POST', body: { stars, comment } }).then(() => { toast('Thank you for your review', 'ok'); load(); }).catch((x) => toast(x.message, 'err'));
  };

  const facts = [
    { k: 'Where', v: [m.city, m.district && m.district !== m.city ? `${m.district} district` : null, `${m.province} Province`].filter(Boolean).join(', ') },
    m.built && { k: 'Built', v: m.built },
    m.dynasty && m.dynasty !== 'unknown' && { k: 'Era', v: `${m.dynasty} period` },
    m.deity && { k: 'Dedicated to', v: m.deity },
    { k: 'Style', v: m.architecture || TYPE_LABEL[m.type] },
    (m.open || m.close) && { k: 'Open', v: `${m.open || '—'} – ${m.close || '—'}` },
    { k: t('Typical visit', 'सामान्यतया लाग्ने समय'), v: t(`${m.visitMinutes} minutes`, `${t.n(m.visitMinutes)} मिनेट`) },
  ].filter(Boolean);
  const photos = [
    m.image && { url: m.image, caption: m.name, author: m.imageCredit, license: '' },
    ...(m.gallery || []).map((g) => ({ url: g.url, caption: g.caption, author: g.author, license: g.license })),
  ].filter(Boolean);
  const spec = m.model;
  const scans = SCANS[m.slug] || [];
  const siteScan = scans.find((x) => x.kind === 'site');
  const detailScans = scans.filter((x) => x !== siteScan);
  const showScan = siteScan && view === 'scan';
  const hasFees = m.fees && [m.fees.foreigner, m.fees.saarc, m.fees.nepali].some((x) => x != null);

  return (
    <div className="page monument">
      <section className="mon-hero">
        <motion.div className="mon-hero-img" style={{ y: heroY, scale: heroScale }}>{m.image ? <img src={m.image} alt={m.name} /> : <div className="jaali" style={{ height: '100%' }} />}</motion.div>
        <div className="wrap mon-hero-text">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 0.9, 0.24, 1] }}>
            <nav className="mon-crumbs" aria-label="Breadcrumb">
              <Link to="/explore">Explore</Link><ChevronRight size={13} />
              <Link to={`/explore?province=${m.province}`}>{t(`${m.province} Province`, `${t.prov(m.province)} प्रदेश`)}</Link><ChevronRight size={13} />
              <span>{m.city}</span>
            </nav>
            <div className="row" style={{ gap: '0.4rem', marginBottom: '0.8rem' }}>
              {m.unesco && <span className="tag gold">UNESCO World Heritage</span>}
              <span className="tag">{TYPE_LABEL[m.type] || m.type}</span>
              <span className="tag light">{m.religion}</span>
            </div>
            <h1 style={{ marginBottom: '0.1em' }}>{m.name}</h1>
            <div className="mon-np" lang="ne">{m.name_np}</div>
            <p className="lead" style={{ maxWidth: 640 }} lang={nepali && m.short_np ? 'ne' : undefined}>{pick(m.short_np, m.short)}</p>
            {data.parent && <p className="small">Part of <Link to={`/m/${data.parent.slug}`}>{data.parent.name}</Link></p>}
            <div className="mon-hero-tools">
              {photos.length > 1 && <button className="btn light-ghost" onClick={() => setLightbox(true)}><Images size={16} /> {t(`${photos.length} photos`, `${t.n(photos.length)} फोटो`)}</button>}
              <a className="btn light-ghost" href="#model">3D model</a>
              <a className="btn light-ghost" href="#story">Read the story</a>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="wrap mon-grid">
        <div className="mon-main">
          {/* audio guide */}
          <div className="card pad-l audio-card">
            <div className="row between">
              <div className="row"><div><h4 style={{ margin: 0 }}>{t('Audio guide', 'अडियो गाइड')}</h4><span className="cap">{t(`${chapters.length} short chapters · read aloud by your device`, `${t.n(chapters.length)} छोटा भाग · तपाईंको फोनले पढेर सुनाउँछ`)}</span></div></div>
              {narrator.supported ? (
                <div className="row">
                  {narrator.playing && !narrator.paused ? <button className="btn sm" onClick={narrator.pause}><Pause size={15} /> Pause</button>
                    : <button className="btn sm diyo" onClick={() => (narrator.paused ? narrator.resume() : narrator.play(narrator.progress >= 1 ? 0 : narrator.chapter || 0))}><Play size={15} /> {narrator.paused ? t('Resume', 'जारी राख्नुहोस्') : t('Listen', 'सुन्नुहोस्')}</button>}
                  {narrator.playing && <button className="icon-btn" onClick={narrator.stop} aria-label="Stop"><Square size={14} /></button>}
                </div>
              ) : <span className="cap">Your browser has no speech voice; read the story below.</span>}
            </div>
            <div className="chapters">
              {chapters.map((c, i) => (
                <button key={c.title} className={`chapter ${narrator.playing && narrator.chapter === i ? 'on' : ''}`} onClick={() => narrator.play(i)} disabled={!narrator.supported}>
                  <span>{c.title}</span>
                  <i style={{ width: narrator.chapter === i ? `${Math.round((narrator.progress || 0) * 100)}%` : narrator.chapter > i && narrator.playing ? '100%' : 0 }} />
                </button>
              ))}
            </div>
            {narrator.noVoice && <p className="cap error-text" style={{ marginTop: '0.6rem' }}>This device has no Nepali voice installed, so it cannot read Nepali aloud. Switch to English, or add a Nepali or Hindi voice in your system speech settings.</p>}
            {narrator.supported && (
              <label className="cap row" style={{ marginTop: '0.6rem' }}>Speed
                <input type="range" min="0.7" max="1.3" step="0.05" value={narrator.rate} onChange={(e) => narrator.setRate(Number(e.target.value))} aria-label="Reading speed" />
                {narrator.rate.toFixed(2)}×
              </label>
            )}
          </div>

          <article className="story" id="story">
            <h2>{t('The story', 'कथा')}</h2>
            <p className="dropcap" lang={nepali && m.story_np ? 'ne' : undefined}>{pick(m.story_np, m.story)}</p>
            {m.legend && (
              <div className="legend-box mithila">
                <div className="eyebrow">Legend · किंवदन्ती</div>
                <p style={{ margin: 0 }} lang={nepali && m.legend_np ? 'ne' : undefined}>{pick(m.legend_np, m.legend)}</p>
              </div>
            )}
            {m.facts?.length > 0 && (
              <>
                <h3>{t('Did you know', 'के तपाईंलाई थाहा छ?')}</h3>
                <ul className="facts" lang={nepali && m.facts_np?.length ? 'ne' : undefined}>{(nepali && m.facts_np?.length === m.facts.length ? m.facts_np : m.facts).map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            )}
            <ShrineVerse faith={m.faith} seed={m.id} />
            {m.quake2015 && <div className="quake"><TriangleAlert size={18} /><div><b>{t('2015 earthquake.', '२०७२ सालको भूकम्प।')}</b> {pick(m.quake_np, m.quake2015)}</div></div>}
          </article>

          {photos.length > 1 && (
            <section className="gallery">
              <div className="sec-head" style={{ marginBottom: '1rem' }}><div><div className="eyebrow">{t('Photographs', 'फोटोहरू')}</div><h3 style={{ margin: 0 }}>{t(`Every side of ${m.name}`, `${m.name_np || m.name}का सबै कोणबाट`)}</h3></div><span className="cap">Free-licensed photos from Wikimedia Commons</span></div>
              <Gallery photos={photos} open={lightbox} setOpen={setLightbox} />
            </section>
          )}

          <div className="card model-card" id="model">
            <div className="model-head">
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>{t('Turn it in 3D', '३D मा घुमाउनुहोस्')}</div>
                <h3 style={{ margin: 0 }}>{t(`${m.name} and its surroundings`, `${m.name_np || m.name} र वरिपरिको ठाउँ`)}</h3>
                <span className="cap">{showScan ? 'A 3D scan of the real monument. Press play, then drag to orbit and scroll to zoom.' : `${spec?.notes || `A ${TYPE_LABEL[m.type]?.toLowerCase() || 'temple'} built from its architecture.`} Drag to orbit, scroll to zoom.`}</span>
              </div>
              {siteScan && (
                <div className="seg" role="tablist" aria-label="3D view">
                  <button role="tab" aria-selected={view === 'scan'} className={view === 'scan' ? 'on' : ''} onClick={() => setView('scan')}>Real scan</button>
                  <button role="tab" aria-selected={view === 'model'} className={view === 'model' ? 'on' : ''} onClick={() => setView('model')}>Reconstruction</button>
                </div>
              )}
            </div>
            {showScan
              ? <div style={{ padding: '0 1rem 1rem' }}><ScanFrame scan={siteScan} /></div>
              : <Suspense fallback={<div className="skeleton" style={{ height: 440, margin: '1rem' }} />}><SiteViewer spec={spec} type={m.type} slug={m.slug} initialDusk={theme === 'dark'} /></Suspense>}
            {!showScan && spec && (
              <div className="model-specs">
                {spec.tiers > 1 && <span className="tag">{spec.tiers} {['pagoda', 'gumba', 'lake-shrine'].includes(spec.kind) ? 'roofs' : 'storeys'}</span>}
                {spec.plinth_steps > 0 && <span className="tag">{t(`${spec.plinth_steps} plinth levels`, `${t.n(spec.plinth_steps)} तहको चौकी`)}</span>}
                {(spec.features || []).slice(0, 6).map((x) => <span key={x} className="tag">{x.replace(/-/g, ' ')}</span>)}
              </div>
            )}
          </div>

          {detailScans.length > 0 && (
            <section className="scan-section">
              <div className="eyebrow">{t('Scanned at the site', 'ठाउँमै गएर स्क्यान गरिएको')}</div>
              <h3 style={{ marginTop: 0 }}>{t(`Shrines and sculptures of ${m.name} in 3D`, `${m.name_np || m.name}का मन्दिर र मूर्ति ३D मा`)}</h3>
              <ScanDetails scans={detailScans} />
            </section>
          )}

          {data.inside.length > 0 && (
            <section style={{ marginTop: '2.5rem' }}>
              <h3>{t('Inside this heritage zone', 'यस सम्पदा क्षेत्रभित्र')}</h3>
              <div className="grid-3">{data.inside.map((x, i) => <MonumentCard key={x.id} m={x} index={i} />)}</div>
            </section>
          )}

          <section style={{ marginTop: '2.5rem' }} id="reviews">
            <h3>{t('Explorer reviews', 'घुमन्तेका समीक्षा')}</h3>
            <form className="card review-form" onSubmit={rate}>
              <div className="row between">
                <div className="stars" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)} className={n <= stars ? 'on' : ''}><Star size={24} fill={n <= stars ? 'currentColor' : 'none'} /></button>
                  ))}
                </div>
                <span className="cap">{user ? (data.me?.rating ? 'Update your review' : 'Share your visit') : 'Sign in to review'}</span>
              </div>
              <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} placeholder="What should the next visitor know? (optional)" />
              <button className="btn sm" type="submit">{data.me?.rating ? 'Update review' : 'Post review'}</button>
            </form>
            {data.reviews.length === 0 ? <p className="muted small" style={{ marginTop: '1rem' }}>No reviews yet. Be the first.</p> : (
              <div className="reviews">
                {data.reviews.map((r) => (
                  <div key={r.id} className="review">
                    <div className="row between"><b>{r.name}</b><span className="stars-static" aria-label={`${r.stars} stars`}>{'★'.repeat(r.stars)}<span>{'★'.repeat(5 - r.stars)}</span></span></div>
                    {r.comment && <p className="small" style={{ margin: '0.3rem 0 0' }}>{r.comment}</p>}
                    <span className="cap">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="mon-side">
          <div className="card side-card">
            <div className="stamp-box">
              {data.me?.stamped ? (
                <div className="stamped-big"><span className="stamp-mark" style={{ width: 70, height: 70, fontSize: '0.85rem' }}>छाप<br />✓</span><div><b>In your passport</b><div className="cap">{data.me.stamped.method === 'gps' ? 'Verified on site by GPS' : 'Stamped manually'}</div></div></div>
              ) : (
                <>
                  <b>{t('Visiting today?', 'आज घुम्न आउनुभएको हो?')}</b>
                  <p className="cap" style={{ margin: '0.2rem 0 0.7rem' }}>Stamp your heritage passport. GPS stamps need you within about 60 m.</p>
                  <div className="row">
                    <button className="btn sm" onClick={() => stamp(true)} disabled={busy === 'stamp'}><Stamp size={15} /> {busy === 'stamp' ? t('Checking…', 'जाँच्दै…') : t('Stamp with GPS', 'GPS ले छाप लगाउनुहोस्')}</button>
                    <button className="btn ghost sm" onClick={() => stamp(false)} disabled={busy === 'stamp'}>{t('I am here', 'म यहाँ छु')}</button>
                  </div>
                </>
              )}
            </div>
            <div className="divider" />
            <dl className="facts-dl">
              {facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}
            </dl>
            {hasFees && (
              <>
                <div className="divider" />
                <div className="fees">
                  <b style={{ display: 'block', marginBottom: '0.4rem' }}>{t('Entry fees', 'प्रवेश शुल्क')}</b>
                  <div className="fee-row"><span>Foreigners</span><b className="num">{m.fees.foreigner ? npr(m.fees.foreigner) : 'Free'}</b></div>
                  <div className="fee-row"><span>SAARC nationals</span><b className="num">{m.fees.saarc ? npr(m.fees.saarc) : 'Free'}</b></div>
                  <div className="fee-row"><span>Nepali citizens</span><b className="num">{m.fees.nepali ? npr(m.fees.nepali) : 'Free'}</b></div>
                  <div className="cap" style={{ marginTop: '0.3rem' }}>Fees change; check at the gate.</div>
                </div>
              </>
            )}
            {m.festivals?.length > 0 && (
              <>
                <div className="divider" />
                <b>{t('Festivals here', 'यहाँका चाडपर्व')}</b>
                <div className="fest-list">
                  {m.festivals.map((x) => <div key={x.name} className="fest-item"><span className="fest-month" lang="ne">{x.month}{x.name_np ? ` · ${x.name_np}` : ''}</span><b>{t.nepali && x.name_np ? x.name_np : x.name}</b>{x.note && <span className="cap">{t.nepali && x.note_np ? x.note_np : x.note}</span>}</div>)}
                </div>
              </>
            )}
            <div className="divider" />
            <div className="grid" style={{ gap: '0.5rem' }}>
              <Link className="btn" to={`/quiz?monument=${m.id}`}><Brain size={16} /> {t(`Quiz on this place (${m.questionCount})`, `यो ठाउँबारे क्विज (${t.n(m.questionCount)})`)}</Link>
              <Link className="btn ghost" to={`/walk?add=${m.id}`}><Route size={16} /> Add to a yatra</Link>
              <button className="btn ghost" onClick={fav}><Heart size={16} fill={data.me?.favorite ? 'currentColor' : 'none'} /> {data.me?.favorite ? 'Saved' : 'Save'}</button>
              <a className="btn ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&travelmode=walking`} target="_blank" rel="noreferrer"><MapPin size={16} /> Directions</a>
            </div>
          </div>
          <div className="card mini-map" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 230 }}><MapView markers={useMemoOne(m)} initial={{ center: [m.lng, m.lat], zoom: 15.6 }} pitch={58} popup={false} /></div>
          </div>
          {data.nearby.length > 0 && (
            <div className="card side-card">
              <h5 style={{ marginBottom: '0.6rem' }}>{t('Nearby', 'नजिकै')}</h5>
              {data.nearby.map((n) => (
                <Link key={n.id} to={`/m/${n.slug}`} className="near">
                  {n.image && <img src={n.image} alt="" loading="lazy" />}
                  <span><b>{n.name}</b><span className="cap">{t(`${fmtM(n.metres)} away`, `${t.n(fmtM(n.metres))} टाढा`)}</span></span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          )}
          <div className="credit cap">
            <Info size={13} /> Photo: {m.imageCredit || 'Wikimedia Commons'} {m.imagePage && <a href={m.imagePage} target="_blank" rel="noreferrer">(source <ExternalLink size={11} />)</a>}
            {m.sources?.length > 0 && <div style={{ marginTop: '0.3rem' }}>Sources: {m.sources.slice(0, 3).map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}] </a>)}</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}

// stable marker array for the mini map
const memo = new WeakMap();
function useMemoOne(m) {
  if (!memo.has(m)) memo.set(m, [{ ...m }]);
  return memo.get(m);
}
