import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Users, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { MonumentCard } from '../components/MonumentCard.jsx';
import { Mandala, Toran, OrnDivider } from '../components/Ornaments.jsx';
import { ShlokaRotator } from '../components/Shloka.jsx';

const HeroSite = lazy(() => import('../three/site.jsx').then((m) => ({ default: m.HeroSite })));
const EASE = [0.22, 0.9, 0.24, 1];

export const PROVINCES = [
  { key: 'Koshi', np: 'कोशी', text: 'Pathibhara on its ridge, Halesi’s cave of Shiva and the Barahachhetra confluence.' },
  { key: 'Madhesh', np: 'मधेश', text: 'Janakpur, city of Sita, with its marble Janaki Mandir and sacred ponds.' },
  { key: 'Bagmati', np: 'बागमती', text: 'Pashupatinath, Swayambhu, three Durbar Squares and the Nuwakot palace.' },
  { key: 'Gandaki', np: 'गण्डकी', text: 'Muktinath above the clouds, Gorkha’s hilltop palace and lake temples.' },
  { key: 'Lumbini', np: 'लुम्बिनी', text: 'The birthplace of the Buddha, Tilaurakot and the palaces of Palpa.' },
  { key: 'Karnali', np: 'कर्णाली', text: 'Chandannath in Jumla, Kakrebihar’s stone temple and the Sinja valley.' },
  { key: 'Sudurpashchim', np: 'सुदूरपश्चिम', text: 'Shaileshwori, Ugratara and the high meadows of Khaptad.' },
];

const NP_MONTHS = ['Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
/** Nepali month that a Gregorian date mostly falls in (Baishakh starts mid-April). */
export function currentNpMonth(d = new Date()) {
  const idx = (d.getMonth() + 12 - 3 - (d.getDate() < 15 ? 1 : 0)) % 12;
  return NP_MONTHS[idx];
}

function SplitWords({ text, delay = 0, className }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="split-line" style={{ display: 'inline-block', marginRight: '0.24em' }}>
          <motion.span style={{ display: 'inline-block' }} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: delay + i * 0.06, ease: EASE }}>{w}</motion.span>
        </span>
      ))}
    </span>
  );
}

function Reveal({ children, delay = 0, y = 26, className, style }) {
  return (
    <motion.div className={className} style={style} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function Provinces({ data }) {
  const ref = useRef(null);
  const track = useRef(null);
  const [dist, setDist] = useState(0);
  useLayoutEffect(() => {
    const measure = () => { if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth)); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [data]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const sx = useSpring(x, { stiffness: 120, damping: 30, mass: 0.4 });
  const narrow = typeof window !== 'undefined' && window.innerWidth <= 760;
  return (
    <section ref={ref} className="hscroll" style={{ height: narrow ? 'auto' : `calc(100svh + ${dist}px)` }}>
      <div className="hscroll-sticky">
        <div className="wrap sec-head" style={{ marginBottom: '1.6rem' }}>
          <div>
            <div className="eyebrow">Saat Pradesh · <span lang="ne">सात प्रदेश</span></div>
            <h2>Seven provinces, one sacred map</h2>
          </div>
          <p className="muted">From the plains of Janakpur to the snows of Muktinath. Scroll to travel east to west.</p>
        </div>
        <motion.div ref={track} className="hscroll-track" style={{ x: narrow ? 0 : sx }}>
          {PROVINCES.map((p, i) => {
            const d = data?.find((x) => x.name === p.key);
            return (
              <Link key={p.key} to={`/explore?province=${p.key}`} className="prov-card">
                <div className="prov-img">
                  {d?.image ? <img src={d.image} alt={`${p.key} Province`} loading="lazy" /> : <div className="jaali" style={{ width: '100%', height: '100%' }} />}
                  <span className="prov-no">{i + 1}</span>
                  <div className="prov-text">
                    <div className="np" lang="ne">{p.np} प्रदेश</div>
                    <h3>{p.key}</h3>
                    <div className="cap">{d ? `${d.count} heritage sites` : 'Heritage sites'}</div>
                  </div>
                </div>
                <p className="small muted" style={{ marginTop: '0.8rem', textAlign: 'center' }}>{p.text}</p>
              </Link>
            );
          })}
        </motion.div>
        <div className="wrap hscroll-progress"><motion.span style={{ scaleX: scrollYProgress }} /></div>
      </div>
    </section>
  );
}

export default function Home() {
  const t = useT();
  const [meta, setMeta] = useState(null);
  const [recs, setRecs] = useState(null);
  const { theme } = usePrefs();
  const { scrollY } = useScroll();
  const spin = useTransform(scrollY, [0, 900], [0, 60]);
  const canvasY = useTransform(scrollY, [0, 900], [0, 120]);
  useEffect(() => {
    api('/monuments/meta').then(setMeta).catch(() => {});
    api('/monuments/recommend?limit=8').then((d) => setRecs(d.results)).catch(() => setRecs([]));
  }, []);
  const month = currentNpMonth();
  const fests = (meta?.festivals || []).slice().sort((a, b) => ((NP_MONTHS.indexOf(a.month) - NP_MONTHS.indexOf(month) + 12) % 12) - ((NP_MONTHS.indexOf(b.month) - NP_MONTHS.indexOf(month) + 12) % 12)).slice(0, 8);
  const names = meta?.names?.length ? meta.names : ['Pashupatinath', 'Swayambhunath', 'Boudhanath', 'Nyatapola', 'Krishna Mandir', 'Changu Narayan'];

  return (
    <>
      <section className="hero">
        <div className="hero-bg" />
        <motion.div className="hero-mandala" style={{ rotate: spin }}><Mandala size={900} strokeWidth={0.8} className="spin-slow" /></motion.div>
        <div className="hero-grain" />
        <Toran />
        <div className="wrap hero-grid">
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="eyebrow">{t('Heritage of Nepal · all seven provinces', 'नेपालको सम्पदा · सातै प्रदेश')}</motion.div>
            <h1 className="hero-title">
              <SplitWords text="Walk where the" delay={0.1} /> <em><SplitWords text="gods still live." delay={0.3} /></em>
            </h1>
            <motion.span className="hero-np" lang="ne" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1, delay: 0.6 }}>हाम्रो प्राचीन सम्पदा</motion.span>
            <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease: EASE }}>
              Temples, stupas, palaces and pilgrim trails from Janakpur to Muktinath. Fly over them in 3D, hear their stories,
              plan a yatra that keeps every shrine open, and race your friends in live heritage hunts.
            </motion.p>
            <motion.div className="hero-cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9, ease: EASE }}>
              <Link to="/explore" className="btn lg diyo">{t('Begin the yatra', 'यात्रा सुरु गर्नुहोस्')} <ArrowRight size={18} className="arrow" /></Link>
              <Link to="/hunt" className="btn lg light-ghost"><Users size={18} /> {t('Play with friends', 'साथीसँग खेल्नुहोस्')}</Link>
            </motion.div>
            <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }}>
              <div><b className="num">{meta ? meta.monuments : '—'}</b><span>heritage sites</span></div>
              <div><b className="num">{meta ? meta.provinces?.filter((p) => p.count).length || 7 : 7}</b><span>provinces</span></div>
              <div><b className="num">{meta ? meta.questions : '—'}</b><span>quiz questions</span></div>
            </motion.div>
          </div>
          <motion.div className="hero-canvas" style={{ y: canvasY }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3, ease: EASE }}>
            <Suspense fallback={null}>
              <HeroSite />
            </Suspense>
            <motion.div className="hero-chip c1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.7 }}>
              <span><b>Nyatapola, Bhaktapur</b><br /><span style={{ opacity: 0.75 }}>Five roofs, five plinths, 1702</span></span>
            </motion.div>
            <motion.div className="hero-chip c2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.7 }}>
              <span><b>Drag to turn</b><br /><span style={{ opacity: 0.75 }}>Every site has its own 3D model</span></span>
            </motion.div>
          </motion.div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><i />Scroll</div>
      </section>

      <div className="name-band" aria-hidden="true">
        <div className="marquee">
          {[0, 1].map((k) => <span key={k}>{names.map((n) => <span key={n}>{n} <b>✺</b></span>)}</span>)}
        </div>
      </div>

      <Provinces data={meta?.provinces} />

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <Reveal>
              <div className="eyebrow">{t('Five ways in', 'पाँच बाटा')}</div>
              <h2>{t('Choose how you meet the heritage', 'सम्पदासँग कसरी भेट्ने, रोज्नुहोस्')}</h2>
            </Reveal>
            <Reveal delay={0.1}><p className="muted">Every mode is free, bilingual and works on a phone at the temple gate.</p></Reveal>
          </div>
          <div className="modes">
            {[
              { to: '/explore', cls: 'm-map', en: '3D story map', np: 'कथा नक्सा', p: 'Fly across Nepal in 3D, open any temple and hear its story read aloud, with photos from every side.', img: recs?.[0]?.image },
              { to: '/walk', cls: 'm-walk', en: 'Plan a yatra', np: 'यात्रा योजना', p: 'Pick places or interests; we build the shortest route that keeps every temple open.' },
              { to: '/quiz', cls: 'm-quiz', en: 'Quiz trail', np: 'प्रश्नोत्तर', p: 'Questions adapt to you. Climb from New Explorer to Sampada Guru.' },
              { to: '/find', cls: 'm-find', en: 'Find the monument', np: 'सम्पदा खोज', p: 'A photo and a riddle. Drop your pin on the map of Nepal.', img: recs?.[2]?.image },
              { to: '/hunt', cls: 'm-hunt', en: 'Live heritage hunt', np: 'लाइभ खेल', p: 'Open a room, share the code or QR, race your class in real time.', img: recs?.[4]?.image },
            ].map((m, i) => (
              <Reveal key={m.to} delay={i * 0.06} className={`mode-cell c-${m.cls}`}>
                <Link to={m.to} className={`mode ${m.cls}`}>
                  {m.img && <span className="mode-bg"><img src={m.img} alt="" loading="lazy" /></span>}
                  <Mandala size={320} className="mode-mandala" strokeWidth={1} rings={3} />
                  <span className="mode-go"><ArrowUpRight size={20} /></span>
                  <div className="mode-no">{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    <div className="np" lang="ne">{m.np}</div>
                    <h3>{m.en}</h3>
                    <p>{m.p}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark-band on-dark shloka-section">
        <Mandala size={820} className="mandala-bg spin-slow" strokeWidth={0.7} style={{ left: '50%', top: '50%', translate: '-50% -50%' }} />
        <div className="wrap">
          <div className="eyebrow" style={{ justifyContent: 'center', display: 'flex' }}>{t('Words carved in stone and sung at dawn', 'श्लोक')}</div>
          <ShlokaRotator />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <Reveal>
              <div className="eyebrow">{t('Picked for you', 'तपाईंका लागि')}</div>
              <h2>{t('Where to begin', 'कहाँबाट सुरु गर्ने')}</h2>
              <p className="muted">Ranked by your interests, explorer ratings and the places you have not stamped yet.</p>
            </Reveal>
            <Link to="/explore" className="btn ghost">{t('See every site', 'सबै सम्पदा हेर्नुहोस्')} <ArrowRight size={16} className="arrow" /></Link>
          </div>
          <div className="grid-3">
            {recs === null ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 420, borderRadius: '999px 999px 24px 24px' }} />)
              : recs.map((m, i) => <MonumentCard key={m.id} m={m} index={i} />)}
          </div>
        </div>
      </section>

      {fests.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="sec-head">
              <Reveal>
                <div className="eyebrow">{t('Jatra and parva', 'जात्रा र पर्व')}</div>
                <h2>Festivals coming up from {month}</h2>
              </Reveal>
              <p className="muted">Heritage is alive: chariots, lamps and fairs return to these courtyards every year.</p>
            </div>
            <div className="fests">
              {fests.map((f, i) => (
                <Reveal key={`${f.slug}-${f.name}`} delay={i * 0.05}>
                  <div className="fest">
                    <div className="fest-month" lang="ne">{f.month}{f.name_np ? ` · ${f.name_np}` : ''}</div>
                    <h5>{f.name}</h5>
                    <p className="small muted" style={{ margin: '0 0 0.5rem' }}>{f.note}</p>
                    <Link to={`/m/${f.slug}`}>{f.site} <ArrowRight size={13} /></Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section dark-band on-dark">
        <Mandala size={760} className="mandala-bg spin-rev" strokeWidth={0.8} style={{ left: -260, top: -180 }} />
        <div className="wrap how-grid">
          <Reveal>
            <div className="eyebrow">{t('Under the roof', 'भित्री कुरा')}</div>
            <h2>{t('Smart, but explained', 'स्मार्ट, तर स्पष्ट')}</h2>
            <p className="lead">Every suggestion tells you why. The algorithms are written for Nepal: its lanes, opening hours, hill roads and stories.</p>
            <Link to="/about" className="btn light-ghost" style={{ marginTop: '0.5rem' }}>How it works <ArrowRight size={16} className="arrow" /></Link>
          </Reveal>
          <div className="how-list">
            {[
              { t: 'Shortest heritage yatra', d: 'An orienteering planner with time windows picks the best places that fit your hours, orders them with 2-opt, and never sends you to a closed temple.' },
              { t: 'Questions that adapt', d: 'An Elo rating for you and every question keeps your chance near 70%. Missed facts return on a spaced-repetition schedule.' },
              { t: 'Fair scoring, any scale', d: 'Guesses score by real distance with a curve that fits the round: metres in a Durbar Square, kilometres across Nepal.' },
              { t: 'Stories you can hear', d: 'Every site has an audio-guide story read by your device, with chapters for history, legend and facts.' },
            ].map((h, i) => (
              <Reveal key={h.t} delay={i * 0.08} y={18}>
                <div className="how-item">
                  <div className="how-no">{String(i + 1).padStart(2, '0')}</div>
                  <div><h5>{h.t}</h5><p className="small">{h.d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="cta-band">
            <Mandala size={680} className="mandala-bg spin-slow" strokeWidth={0.8} />
            <OrnDivider width={220} />
            <h2>{t('Fill your heritage passport', 'आफ्नो सम्पदा राहदानी भर्नुहोस्')}</h2>
            <p>Stamp sites on location with GPS, collect every UNESCO site and all seven provinces, and earn badges like <b>Tin Durbar</b>, <b>Sapta Sampada</b> and <b>Saat Pradesh</b>.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn lg diyo"><Sparkles size={18} /> {t('Get my passport', 'मेरो राहदानी बनाउनुहोस्')}</Link>
              <Link to="/quiz" className="btn lg light-ghost">{t('Try the quiz first', 'पहिले प्रश्नोत्तर खेल्नुहोस्')}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
