// Adaptive quiz trail and the "Find the Monument" solo game.
import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { getCatalog, card } from '../catalog.js';
import { optionalAuth, ah } from '../middleware/auth.js';
import { pickNext, updateElo, sm2, levelFor, BASE_PLAYER } from '../algorithms/adaptive.js';
import { scoreGuess, pickRounds, inValley } from '../algorithms/game.js';
import { checkBadges } from '../badges.js';

const r = Router();
const QUIZ_LIMIT_MS = 25000;

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
  res.json({
    question: { id: q.id, text: q.question, options: q.options, difficulty: q.difficulty, review: due.includes(q.id), limitMs: QUIZ_LIMIT_MS },
    monument: card(m), rating, level: levelFor(rating),
  });
}));

r.post('/quiz/answer', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const q = cat.questions.find((x) => x.id === Number(req.body?.questionId));
  if (!q) return res.status(404).json({ error: 'Question not found' });
  const choice = Number(req.body?.choice);
  const timeMs = Math.max(0, Math.min(QUIZ_LIMIT_MS, Number(req.body?.timeMs) || QUIZ_LIMIT_MS));
  const correct = choice === q.answer_index;
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
    correct, answerIndex: q.answer_index, explanation: q.explanation,
    rating: upd.player, delta: upd.delta, expected: Math.round(upd.expected * 100), level: levelFor(upd.player), badges,
  });
}));

/** Find the Monument: a game of N rounds. The server keeps the answers; the client only gets photo + clue. */
const games = new Map(); // id -> { rounds, created }
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
  const rounds = picks.map((m) => {
    const clues = cat.clues.filter((c) => c.monument_id === m.id);
    return { monumentId: m.id, clue: clues[seed % clues.length]?.clue || m.short_text, hint: `${m.city} · ${m.type}`, image: m.image_url, credit: m.image_credit, answered: false };
  });
  games.set(id, { rounds, created: Date.now(), total: 0, scope });
  res.json({ gameId: id, scope, rounds: rounds.map((x, i) => ({ index: i, clue: x.clue, image: x.image, credit: x.credit })), limitMs: 60000 });
}));

r.post('/game/guess', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const g = games.get(String(req.body?.gameId || ''));
  if (!g) return res.status(404).json({ error: 'Game expired, start a new one' });
  const i = Number(req.body?.round);
  const round = g.rounds[i];
  if (!round) return res.status(400).json({ error: 'No such round' });
  if (round.answered) return res.status(409).json({ error: 'Round already answered' });
  const lat = Number(req.body?.lat); const lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'Place your guess on the map' });
  const m = cat.byId.get(round.monumentId);
  const s = scoreGuess({ lat, lng }, m, { timeMs: Number(req.body?.timeMs) || 60000, limitMs: 60000, hints: req.body?.hint ? 1 : 0, scope: g.scope });
  round.answered = true;
  g.total += s.points;
  const last = g.rounds.every((x) => x.answered);
  let badges = [];
  if (last) {
    const name = req.user?.name || String(req.body?.name || 'Guest').slice(0, 60);
    await query("INSERT INTO game_scores (user_id, player_name, mode, points, rounds) VALUES (?, ?, 'solo', ?, ?)", [req.user?.id || null, name, g.total, g.rounds.length]);
    if (req.user) badges = await checkBadges(req.user.id);
  }
  res.json({ ...s, monument: card(m), total: g.total, finished: last, badges });
}));

r.get('/leaderboard', ah(async (_req, res) => {
  const [quiz, game] = await Promise.all([
    query("SELECT name, rating, answered FROM users WHERE answered > 0 AND role = 'explorer' ORDER BY rating DESC LIMIT 10"),
    query("SELECT player_name AS name, MAX(points) AS points FROM game_scores WHERE mode = 'solo' GROUP BY player_name, user_id ORDER BY points DESC LIMIT 10"),
  ]);
  res.json({ quiz: quiz.map((u) => ({ ...u, level: levelFor(u.rating) })), game });
}));

export default r;
