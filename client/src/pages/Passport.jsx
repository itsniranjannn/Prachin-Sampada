import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stamp, Repeat, Trash2, Share2, Heart, Brain } from 'lucide-react';
import { Mandala } from '../components/Ornaments.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/toast.jsx';
import { PageLoader } from '../components/Shell.jsx';
import { MonumentCard } from '../components/MonumentCard.jsx';
import { useT } from '../lib/prefs.jsx';
import { Tiers } from './Quiz.jsx';

const INTERESTS = ['hindu', 'buddhist', 'pagoda', 'stupa', 'shikhara', 'palace', 'courtyard', 'water', 'art', 'festival', 'legend', 'unesco', 'malla', 'licchavi'];

function Spark({ data }) {
  if (data.length < 2) return <p className="cap">Answer quiz questions on a few days to see your rating curve.</p>;
  const w = 320, h = 90, pad = 6;
  const ys = data.map((d) => d.rating);
  const lo = Math.min(...ys) - 10, hi = Math.max(...ys) + 10;
  const pts = data.map((d, i) => [pad + (i / (data.length - 1)) * (w - 2 * pad), h - pad - ((d.rating - lo) / (hi - lo)) * (h - 2 * pad)]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`Rating from ${ys[0]} to ${ys.at(-1)}`}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#AE7FFF" stopOpacity=".35" /><stop offset="1" stopColor="#AE7FFF" stopOpacity="0" /></linearGradient></defs>
      <path d={`${path} L${pts.at(-1)[0]},${h} L${pts[0][0]},${h} Z`} fill="url(#sg)" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--primary)" />)}
    </svg>
  );
}

export default function Passport() {
  const t = useT();
  const [d, setD] = useState(null);
  const [tours, setTours] = useState([]);
  const [interests, setInterests] = useState([]);
  const [editing, setEditing] = useState(false);
  const { setUser } = useAuth();
  const toast = useToast();
  const load = () => Promise.all([api('/passport'), api('/tours')]).then(([p, t]) => { setD(p); setTours(t.results); setInterests(p.user.interests); });
  useEffect(() => { load().catch((e) => toast(e.message, 'err')); /* eslint-disable-next-line */ }, []);
  if (!d) return <PageLoader />;
  const u = d.user;
  const saveInterests = async () => {
    const r = await api('/auth/me', { method: 'PUT', body: { interests } });
    setUser(r.user); setEditing(false); toast('Interests saved. Recommendations will follow them.', 'ok');
  };
  const delTour = async (id) => { if (!confirm('Delete this walk?')) return; await api(`/tours/${id}`, { method: 'DELETE' }); setTours(tours.filter((t) => t.id !== id)); };
  const pct = Math.round((d.stats.stamps / Math.max(1, d.stats.total)) * 100);
  return (
    <div className="page passport">
      <div className="wrap">
        <motion.div className="pass-cover" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Mandala size={520} className="mandala-bg spin-slow" strokeWidth={0.8} />
          <div className="pass-emblem">
            <div className="avatar" style={{ width: 84, height: 84, fontSize: '2rem' }}>{u.name.slice(0, 1).toUpperCase()}</div>
          </div>
          <div>
            <div className="eyebrow">Heritage passport · सम्पदा राहदानी</div>
            <h1 style={{ fontSize: 'var(--fs-h2)', color: 'var(--milk)', margin: 0 }}>{u.name}</h1>
            <div className="np" lang="ne" style={{ color: 'var(--lilac-300)' }}>{u.level.np} · {u.level.label}</div>
            <div className="pass-stats">
              <span><b className="num">{t.n(d.stats.stamps)}</b>/{t.n(d.stats.total)} {t('stamps', 'छाप')}</span>
              <span><b className="num">{u.rating}</b> quiz rating</span>
              <span><b className="num">{t.n(d.stats.quizCorrect)}</b>/{t.n(d.stats.quizAnswered)} {t('correct', 'सही')}</span>
              <span><b className="num">{d.stats.bestGame}</b> best Find score</span>
            </div>
          </div>
          <div className="pass-tiers"><Tiers rating={u.rating} size={1.1} /></div>
        </motion.div>

        {!u.emailVerified && (
          <div className="verify-bar"><span><b>{t('Confirm your email.', 'आफ्नो इमेल प्रमाणित गर्नुहोस्।')}</b> {t('Enter the code we sent so you can reset your password later.', 'पछि पासवर्ड रिसेट गर्न सकिने गरी हामीले पठाएको कोड लेख्नुहोस्।')}</span><Link className="btn sm" to="/verify">{t('Enter the code', 'कोड लेख्नुहोस्')}</Link></div>
        )}

        {d.stats.reviewsDue > 0 && (
          <Link to="/quiz" className="review-due"><Repeat size={18} /> <span><b>{d.stats.reviewsDue} question{d.stats.reviewsDue > 1 ? 's' : ''} ready for review.</b> Missed facts come back on a schedule so they stick.</span><Brain size={18} /></Link>
        )}

        <section className="section" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
          <div className="sec-head"><div><div className="eyebrow">Sapta Sampada</div><h3 style={{ margin: 0 }}>{t('The seven UNESCO zones of the valley', 'उपत्यकाका सात युनेस्को सम्पदा क्षेत्र')}</h3></div><span className="cap">A stamp anywhere inside a zone counts</span></div>
          <div className="zones">
            {d.unesco.map((z, i) => (
              <Link key={z.slug} to={`/m/${z.slug}`} className={`zone ${z.done ? 'done' : ''}`}>
                <span className="zone-ring">{z.done ? <Stamp size={22} /> : <span className="num">{i + 1}</span>}</span>
                <span className="small">{z.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <div className="sec-head"><div><div className="eyebrow">Badges</div><h3 style={{ margin: 0 }}>{d.badges.filter((b) => b.earned).length} of {d.badges.length} earned</h3></div></div>
          <div className="badges">
            {d.badges.map((b, i) => {
              return (
                <motion.div key={b.key} className={`badge ${b.earned ? 'earned shine' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <span className="badge-icon" lang="ne">{b.np.slice(0, 1)}</span>
                  <b>{b.name}</b><span className="np cap" lang="ne">{b.np}</span>
                  <span className="cap">{b.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card pad-l">
            <h4>Quiz rating</h4>
            <Spark data={d.ratingHistory} />
            <div className="divider" />
            <div className="row between"><h5 style={{ margin: 0 }}>Your interests</h5>{!editing && <button className="link-btn" onClick={() => setEditing(true)}>Edit</button>}</div>
            <div className="chips-row">
              {(editing ? INTERESTS : interests).map((k) => (
                <button key={k} className={`chip ${interests.includes(k) ? 'on' : ''}`} disabled={!editing} onClick={() => setInterests(interests.includes(k) ? interests.filter((x) => x !== k) : [...interests, k].slice(0, 6))}>{k}</button>
              ))}
              {!editing && !interests.length && <span className="cap">None yet. Add some for better recommendations.</span>}
            </div>
            {editing && <div className="row" style={{ marginTop: '0.8rem' }}><button className="btn sm" onClick={saveInterests}>Save</button><button className="btn ghost sm" onClick={() => { setEditing(false); setInterests(u.interests); }}>Cancel</button></div>}
          </div>
          <div className="card pad-l">
            <h4>Saved walks</h4>
            {!tours.length ? <p className="muted small">No saved walks yet. <Link to="/walk">Plan one</Link>.</p> : tours.map((t) => (
              <div key={t.id} className="tour-row">
                {t.cover && <img src={t.cover} alt="" />}
                <span><b>{t.title}</b><span className="cap">{t.stops} stops · {t.start}–{t.finish}</span></span>
                <Link className="icon-btn" to={`/w/${t.shareCode}`} title="Open shared page"><Share2 size={15} /></Link>
                <button className="icon-btn" onClick={() => delTour(t.id)} aria-label={`Delete ${t.title}`}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <section className="section" style={{ paddingTop: '2.5rem' }}>
          <div className="sec-head"><div><div className="eyebrow">Stamp book</div><h3 style={{ margin: 0 }}>{t('Places you have stamped', 'छाप लगाइएका ठाउँ')}</h3></div><div className="pass-meter"><span style={{ width: `${pct}%` }} /></div></div>
          {!d.stamps.length ? (
            <div className="empty card"><div className="icon"><Stamp size={26} /></div><h4>Your stamp book is empty</h4><p className="muted">Open any monument and press “Stamp with GPS” when you are there, or “I am here”.</p><Link className="btn" to="/explore">Find a monument</Link></div>
          ) : (
            <div className="stampbook">
              {d.stamps.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, rotate: -6, scale: 0.9 }} animate={{ opacity: 1, rotate: (i % 3) - 1, scale: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 220, damping: 16 }}>
                  <Link to={`/m/${s.slug}`} className="stamp-card">
                    <span className="stamp-ring">{s.method === 'gps' ? 'GPS' : '✓'}</span>
                    <b>{s.name}</b>
                    <span className="np cap" lang="ne">{s.name_np}</span>
                    <span className="cap">{new Date(s.stampedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {d.favorites.length > 0 && (
          <section style={{ paddingBottom: '3rem' }}>
            <h3><Heart size={20} /> Saved places</h3>
            <div className="grid-3">{d.favorites.map((m, i) => <MonumentCard key={m.id} m={m} index={i} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
