// Heritage passport: stamps (visits), favorites, badges and the explorer's progress summary.
import { Router } from 'express';
import { query } from '../db.js';
import { getCatalog, card } from '../catalog.js';
import { requireAuth, ah } from '../middleware/auth.js';
import { isAtSite } from '../algorithms/game.js';
import { haversine } from '../algorithms/geo.js';
import { levelFor } from '../algorithms/adaptive.js';
import { BADGES, UNESCO_ZONES, checkBadges } from '../badges.js';

const r = Router();

/**
 * Stamp a monument. With GPS ({lat,lng,accuracy}) the stamp is verified on site (within 60 m, or the
 * GPS accuracy if larger); without GPS the explorer can still self-stamp, recorded as 'manual'.
 */
r.post('/stamp/:slug', requireAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const m = cat.bySlug.get(req.params.slug);
  if (!m) return res.status(404).json({ error: 'Monument not found' });
  const pos = req.body?.position;
  let method = 'manual';
  if (pos && Number.isFinite(Number(pos.lat)) && Number.isFinite(Number(pos.lng))) {
    const p = { lat: Number(pos.lat), lng: Number(pos.lng), accuracy: Math.min(150, Number(pos.accuracy) || 0) };
    if (!isAtSite(p, m)) {
      return res.status(422).json({ error: `You are about ${Math.round(haversine(p, m))} m away. Get closer to stamp with GPS, or stamp manually.`, metres: Math.round(haversine(p, m)) });
    }
    method = 'gps';
  }
  await query(`INSERT INTO visits (user_id, monument_id, method) VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE method = IF(VALUES(method) = 'gps', 'gps', method)`, [req.user.id, m.id, method]);
  const badges = await checkBadges(req.user.id);
  res.status(201).json({ stamped: true, method, badges });
}));

r.delete('/stamp/:slug', requireAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const m = cat.bySlug.get(req.params.slug);
  if (!m) return res.status(404).json({ error: 'Monument not found' });
  await query('DELETE FROM visits WHERE user_id = ? AND monument_id = ?', [req.user.id, m.id]);
  res.json({ stamped: false });
}));

r.get('/', requireAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const [[user], visits, favs, earned, attempts, best, tours, review] = await Promise.all([
    query('SELECT id, name, email, role, interests, rating, answered, created_at FROM users WHERE id = ?', [req.user.id]),
    query('SELECT monument_id, method, created_at FROM visits WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]),
    query('SELECT monument_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]),
    query('SELECT badge_key, earned_at FROM badges WHERE user_id = ?', [req.user.id]),
    query('SELECT COUNT(*) AS n, COALESCE(SUM(correct),0) AS ok FROM quiz_attempts WHERE user_id = ?', [req.user.id]),
    query("SELECT COALESCE(MAX(points),0) AS p FROM game_scores WHERE user_id = ? AND mode = 'solo'", [req.user.id]),
    query('SELECT COUNT(*) AS n FROM tours WHERE user_id = ?', [req.user.id]),
    query('SELECT COUNT(*) AS n FROM review_cards WHERE user_id = ? AND due_at <= NOW()', [req.user.id]),
  ]);
  const history = await query(
    `SELECT DATE(created_at) AS d, rating_after AS r FROM quiz_attempts WHERE user_id = ? AND id IN
       (SELECT MAX(id) FROM quiz_attempts WHERE user_id = ? GROUP BY DATE(created_at)) ORDER BY d LIMIT 60`, [req.user.id, req.user.id]);
  const earnedMap = new Map(earned.map((b) => [b.badge_key, b.earned_at]));
  const zones = new Set();
  for (const v of visits) { const m = cat.byId.get(v.monument_id); if (m) { zones.add(m.slug); if (m.zone_slug) zones.add(m.zone_slug); } }
  res.json({
    user: { ...user, interests: user.interests ? user.interests.split(',') : [], level: levelFor(user.rating) },
    stamps: visits.map((v) => ({ ...card(cat.byId.get(v.monument_id)), method: v.method, stampedAt: v.created_at })).filter((s) => s.id),
    favorites: favs.map((f) => card(cat.byId.get(f.monument_id))).filter(Boolean),
    badges: BADGES.map((b) => ({ ...b, earned: earnedMap.has(b.key), earnedAt: earnedMap.get(b.key) || null })),
    unesco: UNESCO_ZONES.map((slug) => ({ slug, name: cat.bySlug.get(slug)?.name || slug, done: zones.has(slug) })),
    stats: {
      stamps: visits.length, total: cat.monuments.length, quizAnswered: attempts[0].n, quizCorrect: Number(attempts[0].ok),
      bestGame: best[0].p, tours: tours[0].n, reviewsDue: review[0].n,
    },
    ratingHistory: history.map((h) => ({ date: h.d, rating: h.r })),
  });
}));

r.post('/check', requireAuth, ah(async (req, res) => {
  res.json({ badges: await checkBadges(req.user.id) });
}));

export default r;
