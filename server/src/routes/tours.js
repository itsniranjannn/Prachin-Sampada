import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { getCatalog, card } from '../catalog.js';
import { optionalAuth, requireAuth, ah, httpError } from '../middleware/auth.js';
import { planTour } from '../algorithms/tour.js';
import { cosine, tagVector } from '../algorithms/recommend.js';
import { checkBadges } from '../badges.js';

import { haversine } from '../algorithms/geo.js';

const r = Router();
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validate input and run the planner. Value of a site = base 1 + interest match + UNESCO bonus (+ must-see). */
async function runPlanner(body) {
  const cat = await getCatalog();
  const { start, monumentIds = [], interests = [], startTime = '09:00', endTime = '17:00', returnToStart = false, maxStops } = body || {};
  if (!start || !Number.isFinite(Number(start.lat)) || !Number.isFinite(Number(start.lng))) throw httpError(400, 'Choose where you start');
  if (!TIME.test(startTime) || !TIME.test(endTime) || endTime <= startTime) throw httpError(400, 'Choose a valid start and end time');
  const ids = (Array.isArray(monumentIds) ? monumentIds : []).map(Number).filter((id) => cat.byId.has(id));
  const want = tagVector((Array.isArray(interests) ? interests : []).join(','));
  // chosen places are "must"; if none were chosen, consider the whole catalog ranked by interest
  // a yatra is walked in one town: without chosen places, only sites within 25 km of the start are considered
  const here = { lat: Number(start.lat), lng: Number(start.lng) };
  const pool = ids.length ? ids.map((id) => cat.byId.get(id)) : cat.monuments.filter((m) => !(m.type === 'square' && cat.monuments.some((x) => x.zone_slug === m.slug)) && haversine(here, m) <= 25000);
  if (!pool.length) throw httpError(400, 'No heritage sites are within 25 km of this start yet. Pick places on the map or another start.');
  const sites = pool.map((m) => ({
    id: m.id, lat: m.lat, lng: m.lng, visit: m.visit_minutes || 30, open: m.open_time, close: m.close_time,
    value: Math.round((1 + 3 * cosine(want, tagVector(m.tags)) + (m.unesco ? 0.5 : 0) + (ids.includes(m.id) ? 4 : 0)) * 10) / 10,
    must: ids.includes(m.id),
  }));
  const plan = planTour({ lat: Number(start.lat), lng: Number(start.lng) }, sites, { startTime, endTime, returnToStart: !!returnToStart });
  if (maxStops && plan.stops.length > maxStops) plan.stops = plan.stops.slice(0, maxStops);
  plan.stops = plan.stops.map((s) => ({ ...s, monument: card(cat.byId.get(s.id)) }));
  plan.skipped = plan.skipped.filter((s) => ids.includes(s.id)).map((s) => ({ ...s, monument: card(cat.byId.get(s.id)) }));
  plan.walkMetres = plan.stops.reduce((t, s) => t + (s.leg.mode === 'walk' ? s.leg.metres : 0), 0);
  return { plan, input: { start, monumentIds: ids, interests, startTime, endTime, returnToStart: !!returnToStart } };
}

r.post('/plan', optionalAuth, ah(async (req, res) => {
  const { plan } = await runPlanner(req.body);
  res.json({ plan });
}));

r.post('/', requireAuth, ah(async (req, res) => {
  const title = String(req.body?.title || '').trim().slice(0, 150) || 'My heritage walk';
  const { plan, input } = await runPlanner(req.body);
  if (!plan.stops.length) return res.status(400).json({ error: 'This walk has no stops to save' });
  const code = crypto.randomBytes(8).toString('base64url').slice(0, 10);
  const out = await query('INSERT INTO tours (user_id, title, input_json, plan_json, share_code) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, JSON.stringify(input), JSON.stringify(plan), code]);
  const badges = await checkBadges(req.user.id);
  res.status(201).json({ id: out.insertId, shareCode: code, badges });
}));

r.get('/', requireAuth, ah(async (req, res) => {
  const rows = await query('SELECT id, title, plan_json, share_code, created_at FROM tours WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json({
    results: rows.map((t) => {
      const plan = typeof t.plan_json === 'string' ? JSON.parse(t.plan_json) : t.plan_json;
      return { id: t.id, title: t.title, shareCode: t.share_code, createdAt: t.created_at, stops: plan.stops.length, start: plan.startTime, finish: plan.finish, cover: plan.stops[0]?.monument?.image };
    }),
  });
}));

r.get('/shared/:code', ah(async (req, res) => {
  const [t] = await query('SELECT t.*, u.name AS owner FROM tours t JOIN users u ON u.id = t.user_id WHERE t.share_code = ?', [req.params.code]);
  if (!t) return res.status(404).json({ error: 'Walk not found' });
  res.json({ tour: { id: t.id, title: t.title, owner: t.owner, plan: typeof t.plan_json === 'string' ? JSON.parse(t.plan_json) : t.plan_json, createdAt: t.created_at } });
}));

r.delete('/:id', requireAuth, ah(async (req, res) => {
  const [t] = await query('SELECT user_id FROM tours WHERE id = ?', [req.params.id]);
  if (!t) return res.status(404).json({ error: 'Walk not found' });
  if (t.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your walk' });
  await query('DELETE FROM tours WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default r;
