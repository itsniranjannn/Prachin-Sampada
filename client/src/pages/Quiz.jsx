import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Check, X as XIcon, ArrowRight, RotateCcw, Timer, Repeat, Award, TrendingUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePrefs, useT } from '../lib/prefs.jsx';
import { useToast, announceBadges } from '../lib/toast.jsx';
import { play, buzz } from '../lib/sound.js';
import { Loader } from '../components/Shell.jsx';
import { Epigraph } from '../components/Shloka.jsx';

const GUEST = 'sampada-guest-quiz';
const LEVELS = [
  { key: 'naya', label: 'New Explorer', np: 'नयाँ अन्वेषक', min: 0 },
  { key: 'sikaru', label: 'Curious Sikaru', np: 'जिज्ञासु सिकारु', min: 960 },
  { key: 'yatri', label: 'Valley Yatri', np: 'उपत्यका यात्री', min: 1080 },
  { key: 'pandit', label: 'Heritage Pandit', np: 'सम्पदा पण्डित', min: 1200 },
  { key: 'guru', label: 'Sampada Guru', np: 'सम्पदा गुरु', min: 1350 },
];
const ROUND = 10;
const loadGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST)) || { rating: 1000, answered: 0 }; } catch { return { rating: 1000, answered: 0 }; } };

export function Tiers({ rating, size = 1 }) {
  const lvl = LEVELS.filter((l) => rating >= l.min).length;
  return (
    <div className="tiers" aria-label={`Level ${lvl} of 5`} style={{ transform: `scale(${size})` }}>
      {LEVELS.map((l, i) => <i key={l.key} className={i < lvl ? 'on' : ''} style={{ width: 70 - i * 12 }} />)}
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
  const seen = useRef([]);
  const recent = useRef([]);
  const t0 = useRef(0);
  const timer = useRef(null);

  useEffect(() => { if (user) setRating(user.rating); }, [user]);

  const next = useCallback(async () => {
    setRes(null); setChoice(null);
    const g = loadGuest();
    const qs = new URLSearchParams({ seen: seen.current.join(','), recent: recent.current.join(','), rating: String(user ? '' : g.rating) });
    if (monumentId) qs.set('monument', monumentId);
    try {
      const d = await api(`/play/quiz/next?${qs}`);
      if (d.done || log.length >= ROUND) { setPhase('done'); return; }
      setCur(d); setRating(d.rating); setPhase('q'); t0.current = performance.now(); setLeft(1);
    } catch (e) { toast(e.message, 'err'); }
  }, [user, monumentId, log.length, toast]);

  // countdown
  useEffect(() => {
    if (phase !== 'q' || res) return undefined;
    const limit = cur?.question.limitMs || 25000;
    timer.current = setInterval(() => {
      const f = 1 - (performance.now() - t0.current) / limit;
      setLeft(Math.max(0, f));
      if (f <= 0) { clearInterval(timer.current); answer(-1); }
    }, 100);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, res, cur]);

  const answer = async (i) => {
    if (res || !cur) return;
    clearInterval(timer.current);
    setChoice(i);
    const timeMs = Math.round(performance.now() - t0.current);
    const g = loadGuest();
    try {
      const r = await api('/play/quiz/answer', { method: 'POST', body: { questionId: cur.question.id, choice: i, timeMs, rating: g.rating, answered: g.answered } });
      setRes(r); setRating(r.rating);
      seen.current.push(cur.question.id);
      recent.current = [cur.monument.id, ...recent.current].slice(0, 2);
      setLog((l) => [...l, { correct: r.correct, delta: r.delta, q: cur.question.text, monument: cur.monument.name }]);
      if (!user) localStorage.setItem(GUEST, JSON.stringify({ rating: r.rating, answered: g.answered + 1 }));
      if (r.correct) { play('bowl', sound); buzz(15); } else { play('soft', sound); buzz(40); setShake(true); setTimeout(() => setShake(false), 400); }
      announceBadges(toast, r.badges);
    } catch (e) { toast(e.message, 'err'); }
  };

  // keyboard: 1-4 to answer, Enter for next
  useEffect(() => {
    const on = (e) => {
      if (phase !== 'q') return;
      if (!res && ['1', '2', '3', '4'].includes(e.key)) answer(Number(e.key) - 1);
      if (res && e.key === 'Enter') (log.length >= ROUND ? setPhase('done') : next());
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const begin = () => { seen.current = []; recent.current = []; setLog([]); setStartRating(rating); next(); };
  useEffect(() => { if (phase === 'done' && user) refresh(); }, [phase, user, refresh]);
  const level = LEVELS.filter((l) => rating >= l.min).at(-1);
  const nextLevel = LEVELS.find((l) => l.min > rating);

  return (
    <div className="page quiz-page">
      <div className="wrap quiz-wrap">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" className="quiz-intro card pad-l lattice-soft" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="eyebrow">Adaptive quiz trail · प्रश्नोत्तर यात्रा</div>
              <h1 style={{ fontSize: 'var(--fs-h2)' }}>{t('How well do you know your heritage?', 'आफ्नो सम्पदालाई कत्तिको चिन्नुहुन्छ?')}</h1>
            <Epigraph index={15} />
              <p className="lead">{t(`${ROUND} questions that adapt to you. Get one right and the next is a little harder; miss one and it comes back later to help you remember.`, `तपाईंसँग मिल्दा ${t.n(ROUND)} प्रश्न। एउटा सही गर्दा अर्को अलि गाह्रो हुन्छ; एउटा छुट्यो भने सम्झन सजिलो होस् भनी पछि फर्किन्छ।`)}</p>
              <ul className="rules">
                <li>{t(`You get ${ROUND} questions, 25 seconds each. Press 1 to 4 or tap an answer.`, `${t.n(ROUND)} वटा प्रश्न, प्रत्येकमा २५ सेकेन्ड। १ देखि ४ थिच्नुहोस् वा जवाफमा छुनुहोस्।`)}</li>
                <li>{t('Your rating moves with every answer: a hard question you get right earns more, an easy one you miss costs more, and a quick answer earns a little extra.', 'हरेक जवाफसँगै तपाईंको रेटिङ बदलिन्छ: गाह्रो प्रश्न सही गर्दा धेरै अङ्क, सजिलो प्रश्न छुट्दा धेरै घट्छ, र छिटो जवाफ दिँदा अलिकति बढी।')}</li>
                <li>{t('Questions you miss come back later so you remember them.', 'छुटेका प्रश्न पछि फेरि आउँछन्, ताकि सम्झन सजिलो होस्।')}</li>
              </ul>
              <div className="level-row">
                <Tiers rating={rating} />
                <div>
                  <div className="cap">Your level</div>
                  <h3 style={{ margin: 0 }}>{level.label}</h3>
                  <div className="np muted" lang="ne">{level.np}</div>
                  <div className="cap num">{t('Rating', 'रेटिङ')} {t.n(rating)}{nextLevel ? ` · ${t.n(nextLevel.min - rating)} ${t('to', 'बाँकी')} ${t.nepali && nextLevel.np ? nextLevel.np : nextLevel.label}` : t(' · top level', ' · उच्चतम तह')}</div>
                </div>
              </div>
              {monumentId && <p className="tag sky" style={{ marginTop: '1rem' }}>Questions on one monument only</p>}
              <div className="row" style={{ marginTop: '1.4rem' }}>
                <button className="btn lg diyo" onClick={begin}><Brain size={18} /> {t('Start the trail', 'यात्रा सुरु गर्नुहोस्')}</button>
                {monumentId && <Link className="btn ghost lg" to="/quiz">Whole valley instead</Link>}
              </div>
              {!user && <p className="cap" style={{ marginTop: '1rem' }}>Playing as a guest: your rating is kept on this device. <Link to="/register">Make a passport</Link> to keep it everywhere and get review reminders.</p>}
            </motion.div>
          )}

          {phase === 'q' && cur && (
            <motion.div key={cur.question.id} className={`quiz-card card ${shake ? 'shake' : ''}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <div className="quiz-top">
                <div className="row">
                  <span className="tag">Question {log.length + (res ? 0 : 1)} / {ROUND}</span>
                  {cur.question.review && <span className="tag sky"><Repeat size={12} /> Review</span>}
                  <span className="diff" aria-label={`Difficulty ${cur.question.difficulty} of 5`}>{[1, 2, 3, 4, 5].map((d) => <i key={d} className={d <= cur.question.difficulty ? 'on' : ''} />)}</span>
                </div>
                <div className="row cap num"><TrendingUp size={14} /> {rating}</div>
              </div>
              <div className="timer-bar" aria-hidden="true"><span style={{ width: `${left * 100}%`, background: left < 0.25 ? 'var(--err)' : undefined }} /></div>
              <Link to={`/m/${cur.monument.slug}`} className="quiz-mon">
                {cur.monument.image && <img src={cur.monument.image} alt="" />}
                <span><b>{cur.monument.name}</b><span className="np cap" lang="ne">{cur.monument.name_np}</span></span>
              </Link>
              <h2 className="quiz-q" lang={nepali && cur.question.text_np ? 'ne' : undefined}>{nepali && cur.question.text_np ? cur.question.text_np : cur.question.text}</h2>
              <div className="options">
                {cur.question.options.map((o, i) => {
                  const state = res ? (i === res.answerIndex ? 'right' : i === choice ? 'wrong' : 'dim') : '';
                  return (
                    <button key={i} className={`option ${state}`} onClick={() => answer(i)} disabled={!!res}>
                      <span className="opt-key">{res && i === res.answerIndex ? <Check size={16} /> : res && i === choice ? <XIcon size={16} /> : i + 1}</span>
                      <span>{nepali && cur.question.options_np?.[i] ? cur.question.options_np[i] : o}</span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {res && (
                  <motion.div className={`explain ${res.correct ? 'ok' : 'no'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="row between">
                      <b className="stamp-font" style={{ fontSize: '1.3rem' }}>{res.correct ? t('शाबास! Correct', 'शाबास! सही') : choice === -1 ? t('Time is up', 'समय सकियो') : t('Not quite', 'ठ्याक्कै होइन')}</b>
                      <span className={`delta num ${res.delta >= 0 ? 'up' : 'down'}`}>{res.delta >= 0 ? '+' : ''}{res.delta}</span>
                    </div>
                    {res.explanation && <p style={{ margin: '0.4rem 0 0' }}>{nepali && res.explanation_np ? res.explanation_np : res.explanation}</p>}
                    <div className="row between" style={{ marginTop: '0.9rem' }}>
                      <span className="cap">{t(`You had a ${res.expected}% predicted chance on this one.`, `यसमा तपाईंको सफलताको अनुमानित सम्भावना ${t.n(res.expected)}% थियो।`)}</span>
                      <button className="btn" onClick={() => (log.length >= ROUND ? setPhase('done') : next())}>{log.length >= ROUND ? t('See results', 'नतिजा हेर्नुहोस्') : t('Next', 'अर्को')} <ArrowRight size={16} /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!res && <div className="cap" style={{ marginTop: '0.8rem' }}><Timer size={12} /> Faster correct answers move your rating a little more. Keys 1–4 answer.</div>}
            </motion.div>
          )}

          {phase === 'q' && !cur && <Loader />}

          {phase === 'done' && (
            <motion.div key="done" className="card pad-l certificate mithila" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flags" style={{ justifyContent: 'center' }} aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
              <div className="eyebrow" style={{ justifyContent: 'center', display: 'flex', marginTop: '1rem' }}>Trail complete</div>
              <h2>{log.filter((l) => l.correct).length} of {log.length} correct</h2>
              <div className="cert-level">
                <Tiers rating={rating} size={1.2} />
                <div>
                  <h3 style={{ margin: 0 }}>{level.label}</h3>
                  <div className="np" lang="ne">{level.np}</div>
                  <div className="num">{t('Rating', 'रेटिङ')} {t.n(startRating)} → <b>{t.n(rating)}</b> ({rating - startRating >= 0 ? '+' : ''}{t.n(rating - startRating)})</div>
                </div>
              </div>
              <ul className="log">
                {log.map((l, i) => <li key={i} className={l.correct ? 'ok' : 'no'}>{l.correct ? <Check size={15} /> : <XIcon size={15} />}<span><b>{l.monument}:</b> {l.q}</span><span className="num">{l.delta >= 0 ? '+' : ''}{l.delta}</span></li>)}
              </ul>
              <div className="row" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
                <button className="btn lg diyo" onClick={begin}><RotateCcw size={17} /> {t('Another trail', 'अर्को यात्रा')}</button>
                <Link className="btn ghost lg" to="/leaderboard"><Award size={17} /> Leaderboard</Link>
              </div>
              {!user && <p className="cap" style={{ marginTop: '1rem' }}>Sign up to keep your rating, earn the <b>Gyani</b> badge and get missed questions back as reviews.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
