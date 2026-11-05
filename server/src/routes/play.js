// Adaptive quiz trail and the "Find the Monument" solo game.
import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { getCatalog, card } from '../catalog.js';
import { optionalAuth, ah } from '../middleware/auth.js';
import { pickNext, updateElo, sm2, levelFor, BASE_PLAYER } from '../algorithms/adaptive.js';
import { scoreGuess, tierFor, pickRounds, inValley, imageVariants, pickVariant } from '../algorithms/game.js';
import { checkBadges } from '../badges.js';

const r = Router();
const QUIZ_LIMIT_MS = 25000;
const QUIZ_GRACE_MS = 3000; // network lag allowed before an answer counts as a time-out

// Options are shuffled per run: the order depends on the run's seed and the question id, so the server can
// rebuild it when the answer arrives and the stored order (which favors the second slot) never leaks.
const hash32 = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const permFor = (seed, qid) => {
  let a = hash32(`${seed}:${qid}`);
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const p = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return p; // p[shownIndex] = storedIndex
};
const cleanSeed = (v) => String(v ?? '').replace(/[^\w-]/g, '').slice(0, 40);
const served = new Map(); // `${seed}:${questionId}` -> time the question was sent
const QUIZ_TTL = 60 * 60_000;
const sweepServed = () => { const now = Date.now(); for (const [k, t] of served) if (now - t > QUIZ_TTL) served.delete(k); };

/** Next question: guests send their rating and seen ids; signed-in explorers use the stored rating and SM-2 queue. */
r.get('/quiz/next', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const seen = new Set(String(req.query.seen || '').split(',').map(Number).filter(Boolean));
  const monumentId = Number(req.query.monument) || null;
  let rating = Math.max(600, Math.min(1800, Number(req.query.rating) || BASE_PLAYER));
  let due = [];
  if (req.user) {
    const [u] = await query('SELECT rating FROM users WHERE id = ?', [req.user.id]);
    rating = u?.rating ?? rating;
    due = (await query('SELECT question_id FROM review_cards WHERE user_id = ? AND due_at <= NOW()', [req.user.id])).map((d) => d.question_id);
  }
  const pool = cat.questions.filter((q) => !monumentId || q.monument_id === monumentId).map((q) => ({ id: q.id, rating: q.rating, monumentId: q.monument_id }));
  const recent = String(req.query.recent || '').split(',').map(Number).filter(Boolean);
  const pick = pickNext(rating, pool, { seen, due, recentMonuments: recent });
  if (!pick) return res.json({ done: true, rating, level: levelFor(rating) });
  const q = cat.questions.find((x) => x.id === pick.id);
  const m = cat.byId.get(q.monument_id);
  const seed = cleanSeed(req.query.seed);
  const perm = seed ? permFor(seed, q.id) : [0, 1, 2, 3];
  if (seed) { sweepServed(); served.set(`${seed}:${q.id}`, Date.now()); }
  res.json({
    question: { id: q.id, text: q.question, text_np: q.question_np || null, options: perm.map((i) => q.options[i]), options_np: q.options_np ? perm.map((i) => q.options_np[i]) : null, difficulty: q.difficulty, review: due.includes(q.id), limitMs: QUIZ_LIMIT_MS },
    monument: card(m), rating, level: levelFor(rating),
  });
}));

r.post('/quiz/answer', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const q = cat.questions.find((x) => x.id === Number(req.body?.questionId));
  if (!q) return res.status(404).json({ error: 'Question not found' });
  const seed = cleanSeed(req.body?.seed);
  const perm = seed ? permFor(seed, q.id) : [0, 1, 2, 3];
  let choice = Number(req.body?.choice);
  let timeMs = Math.max(0, Math.min(QUIZ_LIMIT_MS, Number.isFinite(Number(req.body?.timeMs)) ? Number(req.body.timeMs) : QUIZ_LIMIT_MS));
  if (seed) {
    // each question can be answered once per run, and the clock is the server's, so a client cannot claim a faster answer
    const key = `${seed}:${q.id}`;
    const sentAt = served.get(key);
    if (!sentAt) return res.status(409).json({ error: 'This question was already answered. Ask for the next one.' });
    served.delete(key);
    const elapsed = Date.now() - sentAt;
    if (elapsed > QUIZ_LIMIT_MS + QUIZ_GRACE_MS) choice = -1; // too late: counts as a time-out
    timeMs = Math.max(0, Math.min(QUIZ_LIMIT_MS, elapsed));
  }
  const shown = Number.isInteger(choice) && choice >= 0 && choice <= 3 ? choice : -1;
  const correct = shown >= 0 && perm[shown] === q.answer_index;
  const answerIndex = perm.indexOf(q.answer_index);
  let rating = Math.max(600, Math.min(1800, Number(req.body?.rating) || BASE_PLAYER));
  let answered = Number(req.body?.answered) || 0;
  if (req.user) {
    const [u] = await query('SELECT rating, answered FROM users WHERE id = ?', [req.user.id]);
    rating = u.rating; answered = u.answered;
  }
  const upd = updateElo(rating, q.rating, correct, answered, timeMs, QUIZ_LIMIT_MS);
  await query('UPDATE questions SET rating = ?, times_asked = times_asked + 1, times_correct = times_correct + ? WHERE id = ?', [upd.question, correct ? 1 : 0, q.id]);
  q.rating = upd.question; // keep the cache in step
  let badges = [];
  if (req.user) {
    await query('UPDATE users SET rating = ?, answered = answered + 1 WHERE id = ?', [upd.player, req.user.id]);
    await query('INSERT INTO quiz_attempts (user_id, question_id, correct, time_ms, rating_before, rating_after) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, q.id, correct ? 1 : 0, timeMs, rating, upd.player]);
    // SM-2: quality from correctness and speed; missed questions enter the review queue
    const [card0] = await query('SELECT ease, interval_days AS `interval`, reps FROM review_cards WHERE user_id = ? AND question_id = ?', [req.user.id, q.id]);
    const quality = correct ? (timeMs < QUIZ_LIMIT_MS / 3 ? 5 : 4) : 1;
    if (card0 || !correct) {
      const next = sm2(card0 ? { ease: Number(card0.ease), interval: card0.interval, reps: card0.reps } : undefined, quality);
      await query(`INSERT INTO review_cards (user_id, question_id, ease, interval_days, reps, due_at) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))
                   ON DUPLICATE KEY UPDATE ease = VALUES(ease), interval_days = VALUES(interval_days), reps = VALUES(reps), due_at = VALUES(due_at)`,
      [req.user.id, q.id, next.ease, next.interval, next.reps, correct ? next.interval : 0]);
    }
    badges = await checkBadges(req.user.id);
  }
  res.json({
    correct, answerIndex, explanation: q.explanation, explanation_np: q.explanation_np || null,
    rating: upd.player, delta: upd.delta, expected: Math.round(upd.expected * 100), level: levelFor(upd.player), badges,
  });
}));

/** Find the Monument: a game of N rounds. The server keeps the answers; the client only gets photo + clue. */
const games = new Map(); // id -> { rounds, created }
const GAME_LIMIT_MS = 60000;
const GAME_TTL = 30 * 60_000;
const cleanup = () => { const now = Date.now(); for (const [k, g] of games) if (now - g.created > GAME_TTL) games.delete(k); };

r.post('/game/start', ah(async (req, res) => {
  cleanup();
  const cat = await getCatalog();
  const n = Math.max(3, Math.min(10, Number(req.body?.rounds) || 5));
  const scope = req.body?.scope === 'nepal' ? 'nepal' : 'valley';
  const pool = cat.monuments.filter((m) => m.image_url && cat.clues.some((c) => c.monument_id === m.id) && (scope === 'nepal' || inValley(m)));
  const seed = crypto.randomInt(1, 2 ** 31);
  const picks = pickRounds(pool, n, seed);
  const id = crypto.randomBytes(9).toString('base64url');
  const seen = { seenClues: Array.isArray(req.body?.seenClues) ? req.body.seenClues.slice(-600) : [], seenImages: Array.isArray(req.body?.seenImages) ? req.body.seenImages.slice(-600).map(String) : [] };
  const rounds = picks.map((m) => {
    const clues = cat.clues.filter((c) => c.monument_id === m.id);
    const { clue, image } = pickVariant(clues, imageVariants(m), seen);
    // a hint is a second, different clue plus where the place is
    const spare = clues.filter((c) => c !== clue);
    const extra = spare.length ? spare[Math.floor(Math.random() * spare.length)] : null;
    return { monumentId: m.id, clueId: clue?.id || null, clue: clue?.clue || m.short_text, clue_np: clue?.clue_np || null, hint: { text: extra?.clue || null, text_np: extra?.clue_np || null, where: `${m.city} · ${m.type}` }, image: image?.url || m.image_url, credit: image?.credit ?? m.image_credit, answered: false };
  });
  games.set(id, { rounds, created: Date.now(), total: 0, scope });
  rounds[0].openedAt = Date.now();
  res.json({ gameId: id, scope, rounds: rounds.map((x, i) => ({ index: i, clueId: x.clueId, clue: x.clue, clue_np: x.clue_np, image: x.image, credit: x.credit })), limitMs: GAME_LIMIT_MS });
}));

/** The client calls this when a round appears on screen, so the clock never runs while the player reads a result. */
r.post('/game/ready', ah(async (req, res) => {
  const g = games.get(String(req.body?.gameId || ''));
  if (!g) return res.status(404).json({ error: 'Game expired, start a new one' });
  const i = Number(req.body?.round);
  const round = g.rounds[i];
  if (!round || round.answered) return res.status(400).json({ error: 'No open round' });
  if (g.rounds.findIndex((x) => !x.answered) !== i) return res.status(409).json({ error: 'Play the rounds in order' });
  round.openedAt ??= Date.now();
  res.json({ ok: true, elapsedMs: Date.now() - round.openedAt });
}));

r.post('/game/hint', ah(async (req, res) => {
  const g = games.get(String(req.body?.gameId || ''));
  if (!g) return res.status(404).json({ error: 'Game expired, start a new one' });
  const round = g.rounds[Number(req.body?.round)];
  if (!round || round.answered) return res.status(400).json({ error: 'No open round' });
  round.hintUsed = true;
  res.json({ hint: round.hint, penalty: 100 });
}));

r.post('/game/guess', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const g = games.get(String(req.body?.gameId || ''));
  if (!g) return res.status(404).json({ error: 'Game expired, start a new one' });
  const i = Number(req.body?.round);
  const round = g.rounds[i];
  if (!round) return res.status(400).json({ error: 'No such round' });
  if (round.answered) return res.status(409).json({ error: 'Round already answered' });
  // rounds are played in order, and time is measured here so a client cannot claim a faster answer
  if (g.rounds.findIndex((x) => !x.answered) !== i) return res.status(409).json({ error: 'Play the rounds in order' });
  const timedOut = req.body?.timedOut === true;
  const hasPin = req.body?.lat != null && req.body?.lng != null && Number.isFinite(Number(req.body.lat)) && Number.isFinite(Number(req.body.lng));
  if (!hasPin && !timedOut) return res.status(400).json({ error: 'Place your guess on the map' });
  const lat = Number(req.body?.lat); const lng = Number(req.body?.lng);
  if (hasPin && (Math.abs(lat) > 90 || Math.abs(lng) > 180)) return res.status(400).json({ error: 'That spot is not on the map' });
  const m = cat.byId.get(round.monumentId);
  const elapsed = Math.max(0, Date.now() - (round.openedAt ?? Date.now()));
  const late = elapsed > GAME_LIMIT_MS + 5000; // grace for network lag; later than that the pin no longer counts
  const s = scoreGuess(hasPin && !late ? { lat, lng } : null, m, { timeMs: elapsed, limitMs: GAME_LIMIT_MS, hints: round.hintUsed ? 1 : 0, scope: g.scope });
  round.answered = true;
  g.total += s.points;
  const last = g.rounds.every((x) => x.answered);
  let badges = [];
  if (last) {
    const name = req.user?.name || String(req.body?.name || 'Guest').slice(0, 60);
    await query("INSERT INTO game_scores (user_id, player_name, mode, points, rounds) VALUES (?, ?, 'solo', ?, ?)", [req.user?.id || null, name, g.total, g.rounds.length]);
    if (req.user) badges = await checkBadges(req.user.id);
  }
  res.json({ ...s, tier: s.missed ? 'missed' : tierFor(s), hinted: !!round.hintUsed, monument: card(m), total: g.total, finished: last, badges });
}));

r.get('/leaderboard', ah(async (_req, res) => {
  const [quiz, game] = await Promise.all([
    query("SELECT name, rating, answered FROM users WHERE answered > 0 AND role = 'explorer' ORDER BY rating DESC LIMIT 10"),
    query("SELECT player_name AS name, MAX(points) AS points FROM game_scores WHERE mode = 'solo' GROUP BY player_name, user_id ORDER BY points DESC LIMIT 10"),
  ]);
  res.json({ quiz: quiz.map((u) => ({ ...u, level: levelFor(u.rating) })), game });
}));

export default r;
