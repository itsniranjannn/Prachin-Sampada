import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Check, X as XIcon, ArrowRight, RotateCcw, Timer, Repeat, Award, TrendingUp, Zap, Clock, Target, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast, announceBadges } from '../lib/toast.jsx';
import { play, buzz } from '../lib/sound.js';
import { Loader } from '../components/Shell.jsx';
import { Epigraph } from '../components/Shloka.jsx';
import '../styles/quiz.css';

const GUEST = 'sampada-guest-quiz';
const RUN = 'sampada-quiz-run';
const LEVELS = [
  { key: 'naya', label: 'New Explorer', np: 'नयाँ अन्वेषक', min: 0 },
  { key: 'sikaru', label: 'Curious Sikaru', np: 'जिज्ञासु सिकारु', min: 960 },
  { key: 'yatri', label: 'Valley Yatri', np: 'उपत्यका यात्री', min: 1080 },
  { key: 'pandit', label: 'Heritage Pandit', np: 'सम्पदा पण्डित', min: 1200 },
  { key: 'guru', label: 'Sampada Guru', np: 'सम्पदा गुरु', min: 1350 },
];
const ROUND = 10;
const LIMIT_S = 25;
const levelOf = (r) => LEVELS.filter((l) => r >= l.min).at(-1);
const loadGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST)) || { rating: 1000, answered: 0 }; } catch { return { rating: 1000, answered: 0 }; } };
const saveGuest = (g) => { try { localStorage.setItem(GUEST, JSON.stringify(g)); } catch { /* storage blocked */ } };
const readRun = () => { try { return JSON.parse(sessionStorage.getItem(RUN)); } catch { return null; } };
const writeRun = (r) => { try { if (r) sessionStorage.setItem(RUN, JSON.stringify(r)); else sessionStorage.removeItem(RUN); } catch { /* storage blocked */ } };
const newSeed = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Counts a number from `from` to `to` over a short time, so a rating change is felt rather than just shown. */
function useCountUp(to, from = 0, ms = 700) {
  const [v, setV] = useState(reduced() ? to : from);
  useEffect(() => {
    if (reduced() || from === to) { setV(to); return undefined; }
    let raf; const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(Math.round(from + (to - from) * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, from, ms]);
  return v;
}

export function Tiers({ rating, size = 1 }) {
  const lvl = LEVELS.filter((l) => rating >= l.min).length;
  return (
    <div className="tiers" aria-label={`Level ${lvl} of 5`} style={{ transform: `scale(${size})` }}>
      {LEVELS.map((l, i) => <i key={l.key} className={i < lvl ? 'on' : ''} style={{ width: 70 - i * 12 }} />)}
    </div>
  );
}

function Delta({ value }) {
  const t = useT();
  const n = useCountUp(Math.abs(value), 0, 600);
  return <span className={`delta num ${value >= 0 ? 'up' : 'down'}`}>{value >= 0 ? '+' : '−'}{t.n(n)}</span>;
}

/** Progress from the current level's floor to the next one's. */
function LevelBar({ rating }) {
  const t = useT();
  const lvl = levelOf(rating);
  const nxt = LEVELS.find((l) => l.min > rating);
  const pct = nxt ? Math.max(0, Math.min(100, ((rating - lvl.min) / (nxt.min - lvl.min)) * 100)) : 100;
  return (
    <div className="lvl-bar">
      <div className="lvl-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}><span style={{ width: `${pct}%` }} /></div>
      <div className="cap num">{nxt ? `${t.n(nxt.min - rating)} ${t('rating points to', 'रेटिङ अङ्क बाँकी')} ${t.nepali ? nxt.np : nxt.label}` : t('Top level reached', 'उच्चतम तह पुगियो')}</div>
    </div>
  );
}

export default function Quiz() {
  const t = useT();
  const [params] = useSearchParams();
  const monumentId = params.get('monument');
  const { user, refresh } = useAuth();
  const { sound, nepali } = usePrefs();
  const toast = useToast();
  const [phase, setPhase] = useState('intro'); // intro | q | done
  const [cur, setCur] = useState(null);
  const [res, setRes] = useState(null);
  const [choice, setChoice] = useState(null);
  const [rating, setRating] = useState(user?.rating ?? loadGuest().rating);
  const [startRating, setStartRating] = useState(rating);
  const [log, setLog] = useState([]);
  const [left, setLeft] = useState(1);
  const [shake, setShake] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [resume, setResume] = useState(null);
  const seen = useRef([]);
  const recent = useRef([]);
  const logRef = useRef([]);
  const seed = useRef(newSeed());
  const t0 = useRef(0);
  const timer = useRef(null);
  const busy = useRef(false);
  const loading = useRef(false);
  const curRef = useRef(null);
  const reqId = useRef(0);
  const answerRef = useRef(null);
  const ratingRef = useRef(rating);
  ratingRef.current = rating;
  curRef.current = cur;

  useEffect(() => { if (user && phase === 'intro') setRating(user.rating); }, [user, phase]);

  // a run left half way (refresh, back button, closed tab) can be picked up again for this browser session
  useEffect(() => {
    const r = readRun();
    if (r && r.uid === (user?.id ?? null) && (r.monumentId || null) === (monumentId || null) && r.log?.length > 0 && r.log.length < ROUND) setResume(r); else setResume(null);
  }, [user, monumentId]);

  const persist = () => writeRun({ uid: user?.id ?? null, monumentId: monumentId || null, seed: seed.current, seen: seen.current, recent: recent.current, log: logRef.current, startRating });

  const next = useCallback(async () => {
    if (loading.current) return; // Enter pressed twice, or Next tapped while the question is on its way
    const mine = ++reqId.current;
    loading.current = true; busy.current = true; // the finished question stays on screen (and its clock stopped) until the new one arrives
    if (logRef.current.length >= ROUND) { loading.current = false; setPhase('done'); return; }
    const g = loadGuest();
    const qs = new URLSearchParams({ seen: seen.current.join(','), recent: recent.current.join(','), seed: seed.current });
    if (!user) qs.set('rating', String(g.rating));
    if (monumentId) qs.set('monument', monumentId);
    try {
      const d = await api(`/play/quiz/next?${qs}`);
      if (mine !== reqId.current) return; // the page was left or restarted meanwhile
      loading.current = false;
      if (d.done) { setPhase('done'); writeRun(null); return; }
      setRes(null); setChoice(null); setFailed(false); busy.current = false;
      setCur(d); setRating(d.rating); setPhase('q'); t0.current = performance.now(); setLeft(1); setTick((x) => x + 1);
    } catch (e) {
      if (mine !== reqId.current) return;
      loading.current = false; toast(e.message, 'err');
      if (!curRef.current) setPhase('intro'); else busy.current = false; // keep the answered question on screen so Next can be tried again
    }
  }, [user, monumentId, toast]);

  const answer = async (i) => {
    if (busy.current || res || !cur) return;
    busy.current = true;
    clearInterval(timer.current);
    setChoice(i); setFailed(false);
    const timeMs = Math.round(performance.now() - t0.current);
    const g = loadGuest();
    const from = ratingRef.current;
    try {
      const r = await api('/play/quiz/answer', { method: 'POST', body: { questionId: cur.question.id, choice: i, timeMs, seed: seed.current, rating: g.rating, answered: g.answered } });
      setRes(r); setRating(r.rating);
      seen.current.push(cur.question.id);
      recent.current = [cur.monument.id, ...recent.current].slice(0, 2);
      const q = cur.question;
      const entry = {
        correct: r.correct, delta: r.delta, timeMs, from, to: r.rating, timedOut: i === -1,
        q: q.text, q_np: q.text_np, monument: cur.monument.name, monument_np: cur.monument.name_np, slug: cur.monument.slug,
        answer: q.options[r.answerIndex], answer_np: q.options_np?.[r.answerIndex] || null, explanation: r.explanation, explanation_np: r.explanation_np,
      };
      logRef.current = [...logRef.current, entry];
      setLog(logRef.current);
      persist();
      if (!user) saveGuest({ rating: r.rating, answered: g.answered + 1 });
      if (r.correct) { play('bowl', sound); buzz(15); } else { play('soft', sound); buzz(40); setShake(true); setTimeout(() => setShake(false), 400); }
      announceBadges(toast, r.badges);
    } catch (e) {
      if (e.status === 409) { busy.current = false; next(); return; } // already answered (another tab or a double send): just move on
      setChoice(null); setFailed(true); busy.current = false;
      toast(e.message, 'err');
    }
  };
  answerRef.current = answer;

  // countdown: the bar is only a display; the server keeps the real clock
  useEffect(() => {
    if (phase !== 'q' || res || failed || !cur) return undefined;
    const limit = cur.question.limitMs || LIMIT_S * 1000;
    timer.current = setInterval(() => {
      const f = 1 - (performance.now() - t0.current) / limit;
      setLeft(Math.max(0, f));
      if (f <= 0) { clearInterval(timer.current); answerRef.current?.(-1); }
    }, 100);
    return () => clearInterval(timer.current);
  }, [phase, res, cur, failed, tick]);

  // keyboard: 1-4 to answer, Enter for next
  useEffect(() => {
    const on = (e) => {
      if (phase !== 'q' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target?.closest?.('input, textarea, select, [contenteditable]')) return;
      if (!res && ['1', '2', '3', '4'].includes(e.key)) answerRef.current?.(Number(e.key) - 1);
      if (res && e.key === 'Enter' && !e.target?.closest?.('button, a')) next();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [phase, res, next]);

  useEffect(() => () => { clearInterval(timer.current); reqId.current += 1; loading.current = false; }, []);

  const begin = () => {
    seen.current = []; recent.current = []; logRef.current = []; seed.current = newSeed();
    setLog([]); setStartRating(rating); setResume(null); setCur(null); curRef.current = null; writeRun(null);
    loading.current = false; next();
  };
  const carryOn = () => {
    const r = resume;
    seen.current = r.seen || []; recent.current = r.recent || []; logRef.current = r.log || []; seed.current = r.seed || newSeed();
    setLog(logRef.current); setStartRating(r.startRating ?? rating); setResume(null); setCur(null); curRef.current = null;
    loading.current = false; next();
  };
  useEffect(() => { if (phase === 'done') { writeRun(null); if (user) refresh(); } }, [phase, user, refresh]);

  const level = levelOf(rating);
  const nextLevel = LEVELS.find((l) => l.min > rating);
  const animRating = useCountUp(rating, res ? res.rating - res.delta : rating, 700);
  const streak = useMemo(() => { let s = 0; for (let i = log.length - 1; i >= 0 && log[i].correct; i--) s++; return s; }, [log]);
  const bestStreak = useMemo(() => { let b = 0; let s = 0; for (const l of log) { s = l.correct ? s + 1 : 0; b = Math.max(b, s); } return b; }, [log]);
  const right = log.filter((l) => l.correct).length;
  const missed = log.filter((l) => !l.correct);
  const avgS = log.length ? Math.round(log.reduce((a, l) => a + l.timeMs, 0) / log.length / 100) / 10 : 0;
  const leveledUp = LEVELS.indexOf(levelOf(rating)) - LEVELS.indexOf(levelOf(startRating));
  const secs = Math.ceil(left * LIMIT_S);
  const answeredNow = log.length;
  const qNo = Math.min(ROUND, answeredNow + (res ? 0 : 1));
  const pick = (en, np) => (nepali && np ? np : en);
  const subShown = cur && !nepali ? cur.monument.name_np : null; // English mode also shows the Nepali name; Nepali mode already leads with it

  return (
    <div className="page quiz-page">
      <div className="wrap quiz-wrap">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" className="quiz-intro card pad-l lattice-soft" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="eyebrow">{t('Adaptive quiz trail', 'प्रश्नोत्तर यात्रा')}</div>
              <h1 style={{ fontSize: 'var(--fs-h2)' }}>{t('How well do you know your heritage?', 'आफ्नो सम्पदालाई कत्तिको चिन्नुहुन्छ?')}</h1>
              <Epigraph index={15} />
              <p className="lead">{t(`${ROUND} questions that adapt to you. Get one right and the next is a little harder; miss one and it comes back later to help you remember.`, `तपाईंसँग मिल्दा ${t.n(ROUND)} प्रश्न। एउटा सही गर्दा अर्को अलि गाह्रो हुन्छ; एउटा छुट्यो भने सम्झन सजिलो होस् भनी पछि फर्किन्छ।`)}</p>
              <ul className="rules">
                <li><Timer size={17} />{t(`${ROUND} questions, ${LIMIT_S} seconds each. Press 1 to 4 or tap an answer. If the time runs out, it counts as a miss.`, `${t.n(ROUND)} वटा प्रश्न, प्रत्येकमा ${t.n(LIMIT_S)} सेकेन्ड। १ देखि ४ थिच्नुहोस् वा जवाफमा छुनुहोस्। समय सकियो भने गलत मानिन्छ।`)}</li>
                <li><TrendingUp size={17} />{t('Your rating moves with every answer. A hard question you get right earns more; an easy one you miss costs more. A quick correct answer earns up to 15% extra.', 'हरेक जवाफसँगै तपाईंको रेटिङ बदलिन्छ। गाह्रो प्रश्न सही गर्दा धेरै अङ्क आउँछ; सजिलो प्रश्न छुट्दा धेरै घट्छ। छिटो सही जवाफ दिँदा १५% सम्म बढी आउँछ।')}</li>
                <li><Repeat size={17} />{t('Questions you miss come back later so you remember them. The rating stays between 600 and 1800.', 'छुटेका प्रश्न पछि फेरि आउँछन्, ताकि सम्झन सजिलो होस्। रेटिङ ६०० देखि १८०० बीचमा रहन्छ।')}</li>
              </ul>
              <div className="level-row">
                <Tiers rating={rating} />
                <div>
                  <div className="cap">{t('Your level', 'तपाईंको तह')}</div>
                  <h3 style={{ margin: 0 }}>{pick(level.label, level.np)}</h3>
                  <div className="cap num">{t('Rating', 'रेटिङ')} {t.n(rating)}{nextLevel ? ` · ${t.n(nextLevel.min - rating)} ${t('to', 'बाँकी')} ${t.nepali ? nextLevel.np : nextLevel.label}` : t(' · top level', ' · उच्चतम तह')}</div>
                </div>
              </div>
              {monumentId && <p className="tag sky" style={{ marginTop: '1rem' }}>{t('Questions on one monument only', 'एउटै स्मारकका प्रश्न मात्र')}</p>}
              <div className="row" style={{ marginTop: '1.4rem' }}>
                {resume && <button className="btn lg diyo" onClick={carryOn}><ArrowRight size={18} /> {t(`Continue (${resume.log.length} of ${ROUND} done)`, `जारी राख्नुहोस् (${t.n(resume.log.length)}/${t.n(ROUND)} सकियो)`)}</button>}
                <button className={`btn lg ${resume ? 'ghost' : 'diyo'}`} onClick={begin}><Brain size={18} /> {resume ? t('Start over', 'फेरि सुरु गर्नुहोस्') : t('Start the trail', 'यात्रा सुरु गर्नुहोस्')}</button>
                {monumentId && <Link className="btn ghost lg" to="/quiz">{t('Whole valley instead', 'पूरै उपत्यकाको प्रश्न')}</Link>}
              </div>
              {!user && <p className="cap" style={{ marginTop: '1rem' }}>{t('Playing as a guest: your rating is kept on this device.', 'तपाईं अतिथिका रूपमा खेल्दै हुनुहुन्छ: रेटिङ यही डिभाइसमा रहन्छ।')} <Link to="/register">{t('Make a passport', 'पासपोर्ट बनाउनुहोस्')}</Link> {t('to keep it everywhere and get review reminders.', 'र जहाँबाट पनि रेटिङ पाउनुहोस्, छुटेका प्रश्नको सम्झना पनि आउँछ।')}</p>}
            </motion.div>
          )}

          {phase === 'q' && cur && (
            <motion.div key={cur.question.id} className={`quiz-card card ${shake ? 'shake' : ''}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <div className="q-dots" role="img" aria-label={t(`Question ${qNo} of ${ROUND}`, `प्रश्न ${t.n(qNo)} / ${t.n(ROUND)}`)}>
                {Array.from({ length: ROUND }).map((_, i) => <i key={i} className={log[i] ? (log[i].correct ? 'ok' : 'no') : i === answeredNow ? 'cur' : ''} />)}
              </div>
              <div className="quiz-top">
                <div className="row">
                  <span className="tag">{t(`Question ${qNo} / ${ROUND}`, `प्रश्न ${t.n(qNo)} / ${t.n(ROUND)}`)}</span>
                  {cur.question.review && <span className="tag sky"><Repeat size={12} /> {t('Review', 'दोहोर्याउने')}</span>}
                  <span className="diff" role="img" aria-label={t(`Difficulty ${cur.question.difficulty} of 5`, `कठिनाइ ${t.n(cur.question.difficulty)} / ५`)}>{[1, 2, 3, 4, 5].map((d) => <i key={d} className={d <= cur.question.difficulty ? 'on' : ''} />)}</span>
                  {streak >= 2 && <span className="tag streak"><Zap size={12} /> {t(`${streak} in a row`, `लगातार ${t.n(streak)} सही`)}</span>}
                </div>
                <div className="row cap num rating-chip" title={t('Your rating', 'तपाईंको रेटिङ')}><TrendingUp size={14} /> {t.n(animRating)}</div>
              </div>
              <div className={`timer-bar ${left < 0.25 && !res ? 'low' : ''}`} role="progressbar" aria-label={t('Time left', 'बाँकी समय')} aria-valuemin={0} aria-valuemax={LIMIT_S} aria-valuenow={res ? undefined : secs}>
                <span style={{ width: `${left * 100}%`, background: left < 0.25 ? 'var(--err)' : undefined }} />
              </div>
              <div className="quiz-meta">
                <Link to={`/m/${cur.monument.slug}`} className="quiz-mon">
                  {cur.monument.image && <img src={cur.monument.image} alt="" />}
                  <span><b>{pick(cur.monument.name, cur.monument.name_np)}</b>{subShown && <span className="cap" lang={nepali ? undefined : 'ne'}>{subShown}</span>}</span>
                </Link>
                {!res && <span className={`secs num ${left < 0.25 ? 'low' : ''}`} aria-live="off"><Clock size={14} /> {t.n(secs)}{t('s', ' से.')}</span>}
              </div>
              <h2 className="quiz-q" lang={nepali && cur.question.text_np ? 'ne' : undefined}>{pick(cur.question.text, cur.question.text_np)}</h2>
              <div className="options" role="group" aria-label={t('Answers', 'जवाफहरू')}>
                {cur.question.options.map((o, i) => {
                  const state = res ? (i === res.answerIndex ? 'right' : i === choice ? 'wrong' : 'dim') : (choice === i ? 'picked' : '');
                  return (
                    <button key={i} className={`option ${state}`} onClick={() => answer(i)} disabled={!!res || choice !== null} aria-keyshortcuts={String(i + 1)}>
                      <span className="opt-key">{res && i === res.answerIndex ? <Check size={16} /> : res && i === choice ? <XIcon size={16} /> : t.n(i + 1)}</span>
                      <span>{nepali && cur.question.options_np?.[i] ? cur.question.options_np[i] : o}</span>
                    </button>
                  );
                })}
              </div>
              {failed && (
                <div className="q-fail" role="alert">
                  <span>{t('Your answer did not reach the server. Check your connection and pick again.', 'तपाईंको जवाफ सर्भरमा पुगेन। इन्टरनेट हेरेर फेरि छान्नुहोस्।')}</span>
                  <button className="btn ghost" onClick={() => { setFailed(false); setTick((x) => x + 1); }}><RefreshCw size={14} /> {t('Try again', 'फेरि प्रयास गर्नुहोस्')}</button>
                </div>
              )}
              <AnimatePresence>
                {res && (
                  <motion.div className={`explain ${res.correct ? 'ok' : 'no'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
                    <div className="row between">
                      <b className="stamp-font" style={{ fontSize: '1.3rem' }}>{res.correct ? t('शाबास! Correct', 'शाबास! सही') : choice === -1 ? t('Time is up', 'समय सकियो') : t('Not quite', 'ठ्याक्कै होइन')}</b>
                      <Delta value={res.delta} />
                    </div>
                    {res.explanation && <p style={{ margin: '0.4rem 0 0' }}>{pick(res.explanation, res.explanation_np)}</p>}
                    <div className="row between" style={{ marginTop: '0.9rem' }}>
                      <span className="cap">{t(`You had a ${res.expected}% predicted chance on this one.`, `यसमा तपाईंको सफलताको अनुमानित सम्भावना ${t.n(res.expected)}% थियो।`)}</span>
                      <button className="btn" autoFocus onClick={next}>{answeredNow >= ROUND ? t('See results', 'नतिजा हेर्नुहोस्') : t('Next', 'अर्को')} <ArrowRight size={16} /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!res && <div className="cap" style={{ marginTop: '0.8rem' }}><Timer size={12} /> {t('Faster correct answers move your rating a little more. Keys 1–4 answer.', 'छिटो सही जवाफले रेटिङ अलि बढी बढाउँछ। १–४ थिचेर जवाफ दिन सकिन्छ।')}</div>}
            </motion.div>
          )}

          {phase === 'q' && !cur && <Loader />}

          {phase === 'done' && (
            <motion.div key="done" className="card pad-l certificate mithila" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
              <div className="eyebrow" style={{ justifyContent: 'center', display: 'flex', marginTop: '1rem' }}>{t('Trail complete', 'यात्रा पूरा भयो')}</div>
              <h2>{t(`${right} of ${log.length} correct`, `${t.n(log.length)} मध्ये ${t.n(right)} सही`)}</h2>
              <div className="q-dots done" aria-hidden="true">{log.map((l, i) => <i key={i} className={l.correct ? 'ok' : 'no'} style={{ animationDelay: `${i * 60}ms` }} />)}</div>
              <div className="cert-level">
                <Tiers rating={rating} size={1.2} />
                <div>
                  <h3 style={{ margin: 0 }}>{pick(level.label, level.np)}</h3>
                  <div className="num">{t('Rating', 'रेटिङ')} {t.n(startRating)} → <b>{t.n(rating)}</b> (<Delta value={rating - startRating} />)</div>
                  {leveledUp > 0 && <div className="lvl-up">{t('You moved up a level.', 'तपाईं एक तह माथि पुग्नुभयो।')}</div>}
                </div>
              </div>
              <LevelBar rating={rating} />
              <div className="q-stats">
                <div><Target size={16} /><b className="num">{t.n(log.length ? Math.round((right / log.length) * 100) : 0)}%</b><span className="cap">{t('accuracy', 'शुद्धता')}</span></div>
                <div><Clock size={16} /><b className="num">{t.n(avgS)}{t('s', ' से.')}</b><span className="cap">{t('average time', 'औसत समय')}</span></div>
                <div><Zap size={16} /><b className="num">{t.n(bestStreak)}</b><span className="cap">{t('best streak', 'लामो लहर')}</span></div>
              </div>
              <ul className="log">
                {log.map((l, i) => (
                  <li key={i} className={l.correct ? 'ok' : 'no'}>
                    {l.correct ? <Check size={15} /> : <XIcon size={15} />}
                    <span><b>{pick(l.monument, l.monument_np)}:</b> {pick(l.q, l.q_np)}</span>
                    <span className="num">{l.delta >= 0 ? '+' : '−'}{t.n(Math.abs(l.delta))}</span>
                  </li>
                ))}
              </ul>
              {missed.length > 0 && (
                <div className="review-box">
                  <h3><Repeat size={16} /> {t('To remember', 'सम्झनुपर्ने कुरा')}</h3>
                  <p className="cap">{user ? t('These will come back in your review queue.', 'यी प्रश्न पछि फेरि सम्झाउन आउँछन्।') : t('Sign up and these come back later as reviews.', 'दर्ता गर्नुभयो भने यी प्रश्न पछि फेरि सम्झाउन आउँछन्।')}</p>
                  <ul>
                    {missed.map((l, i) => (
                      <li key={i}>
                        <b>{pick(l.q, l.q_np)}</b>
                        <span className="right-ans"><Check size={14} /> {pick(l.answer, l.answer_np)}</span>
                        {l.explanation && <span className="cap">{pick(l.explanation, l.explanation_np)}</span>}
                        <Link className="cap" to={`/m/${l.slug}`}>{t('Visit', 'हेर्नुहोस्')} {pick(l.monument, l.monument_np)}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="row" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
                <button className="btn lg diyo" onClick={begin}><RotateCcw size={17} /> {t('Another trail', 'अर्को यात्रा')}</button>
                <Link className="btn ghost lg" to="/leaderboard"><Award size={17} /> {t('Leaderboard', 'लिडरबोर्ड')}</Link>
              </div>
              {!user && <p className="cap" style={{ marginTop: '1rem' }}>{t('Sign up to keep your rating, earn the', 'दर्ता गर्नुभयो भने रेटिङ सुरक्षित रहन्छ,')} <b>{t('Gyani', 'ज्ञानी')}</b> {t('badge and get missed questions back as reviews.', 'ब्याज पाइन्छ र छुटेका प्रश्न फेरि आउँछन्।')}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
