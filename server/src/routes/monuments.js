import { Router } from 'express';
import { query } from '../db.js';
import { getCatalog, invalidateCatalog, card, faithOf } from '../catalog.js';
import { optionalAuth, requireAuth, ah } from '../middleware/auth.js';
import { haversine } from '../algorithms/geo.js';
import { recommend } from '../algorithms/recommend.js';

const r = Router();
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

// List with search and filters: ?q=&type=&religion=&city=&unesco=1
r.get('/', ah(async (req, res) => {
  const cat = await getCatalog();
  const q = String(req.query.q || '').trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  let list = cat.monuments;
  if (req.query.type) list = list.filter((m) => m.type === req.query.type);
  if (req.query.religion) list = list.filter((m) => m.religion === req.query.religion || m.religion === 'Both');
  if (req.query.city) list = list.filter((m) => m.city === req.query.city);
  if (req.query.unesco === '1') list = list.filter((m) => m.unesco);
  if (req.query.province) list = list.filter((m) => m.province === req.query.province);
  if (req.query.faith) list = list.filter((m) => faithOf(m) === req.query.faith);
  if (terms.length) {
    list = list
      .map((m) => {
        const hay = `${m.name} ${m.name_np} ${m.deity || ''} ${m.tags} ${m.city} ${m.type} ${m.dynasty} ${m.short_text}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (m.name.toLowerCase().includes(t) ? 3 : 0) + (hay.includes(t) ? 1 : 0), 0);
        return { m, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.m);
  }
  res.json({ results: list.map(card), total: list.length });
}));

r.get('/meta', ah(async (_req, res) => {
  const cat = await getCatalog();
  const count = (k) => Object.entries(cat.monuments.reduce((a, m) => ({ ...a, [m[k]]: (a[m[k]] || 0) + 1 }), {})).map(([key, n]) => ({ key, n }));
  res.json({
    monuments: cat.monuments.length,
    questions: cat.questions.length,
    clues: cat.clues.length,
    unescoZones: cat.monuments.filter((m) => m.unesco && !m.zone_slug).length,
    types: count('type'), religions: count('religion'), cities: count('city'),
    provinces: PROVINCES.map((name) => {
      const sites = cat.monuments.filter((m) => m.province === name);
      const best = sites.find((m) => m.unesco && m.image_url) || sites.find((m) => m.image_url);
      return { name, count: sites.length, image: best?.image_url || null, slug: best?.slug || null };
    }),
    faiths: cat.monuments.reduce((a, m) => { const f = faithOf(m); a[f] = (a[f] || 0) + 1; return a; }, {}),
    festivals: cat.monuments.flatMap((m) => (m.festivals || []).map((f) => ({ ...f, site: m.name, slug: m.slug }))),
    names: [...cat.monuments].sort((a, b) => (b.unesco - a.unesco) || (b.gallery.length - a.gallery.length)).slice(0, 24).map((m) => m.name),
  });
}));

r.get('/recommend', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  let interests = String(req.query.interests || '').split(',').filter(Boolean);
  let visited = new Set();
  if (req.user) {
    const [u] = await query('SELECT interests FROM users WHERE id = ?', [req.user.id]);
    if (!interests.length && u?.interests) interests = u.interests.split(',');
    visited = new Set((await query('SELECT monument_id FROM visits WHERE user_id = ?', [req.user.id])).map((v) => v.monument_id));
  }
  const near = req.query.lat && req.query.lng ? { lat: Number(req.query.lat), lng: Number(req.query.lng) } : null;
  const recs = recommend(cat.monuments.map((m) => ({ id: m.id, city: m.city, tags: m.tags, avgRating: m.avgRating, ratingCount: m.ratingCount, lat: m.lat, lng: m.lng, unesco: m.unesco, isZone: m.type === 'square' || (m.unesco && !m.zone_slug) })),
    { interests, visited, near }, Number(req.query.limit) || 6);
  res.json({ results: recs.map((x) => ({ ...card(cat.byId.get(x.id)), score: x.score, reasons: x.reasons })) });
}));

r.get('/:slug', optionalAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const m = cat.bySlug.get(req.params.slug);
  if (!m) return res.status(404).json({ error: 'Monument not found' });
  const inside = cat.monuments.filter((x) => x.zone_slug === m.slug).map(card);
  const parent = m.zone_slug ? cat.bySlug.get(m.zone_slug) : null;
  const nearby = cat.monuments
    .filter((x) => x.id !== m.id && x.zone_slug !== m.slug)
    .map((x) => ({ ...card(x), metres: Math.round(haversine(m, x)) }))
    .sort((a, b) => a.metres - b.metres)
    .slice(0, 4);
  const reviews = await query(
    `SELECT r.id, r.stars, r.comment, r.created_at, u.name FROM ratings r JOIN users u ON u.id = r.user_id
      WHERE r.monument_id = ? ORDER BY r.created_at DESC LIMIT 20`, [m.id]);
  let me = null;
  if (req.user) {
    const [[visit], [fav], [mine]] = await Promise.all([
      query('SELECT method, created_at FROM visits WHERE user_id = ? AND monument_id = ?', [req.user.id, m.id]),
      query('SELECT 1 AS f FROM favorites WHERE user_id = ? AND monument_id = ?', [req.user.id, m.id]),
      query('SELECT stars, comment FROM ratings WHERE user_id = ? AND monument_id = ?', [req.user.id, m.id]),
    ]);
    me = { stamped: visit || null, favorite: !!fav, rating: mine || null };
  }
  res.json({
    monument: {
      ...card(m), story: m.story, legend: m.legend, facts: m.facts, architecture: m.architecture,
      fees: { foreigner: m.fee_foreigner, saarc: m.fee_saarc, nepali: m.fee_nepali },
      quake2015: m.quake_2015, imagePage: m.image_page, sources: m.sources,
      festivals: m.festivals, gallery: m.gallery, model: m.model, faith: faithOf(m),
      questionCount: cat.questions.filter((q) => q.monument_id === m.id).length,
    },
    parent: parent ? card(parent) : null, inside, nearby, reviews, me,
  });
}));

r.post('/:slug/favorite', requireAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const m = cat.bySlug.get(req.params.slug);
  if (!m) return res.status(404).json({ error: 'Monument not found' });
  const [have] = await query('SELECT 1 AS f FROM favorites WHERE user_id = ? AND monument_id = ?', [req.user.id, m.id]);
  if (have) await query('DELETE FROM favorites WHERE user_id = ? AND monument_id = ?', [req.user.id, m.id]);
  else await query('INSERT INTO favorites (user_id, monument_id) VALUES (?, ?)', [req.user.id, m.id]);
  res.json({ favorite: !have });
}));

r.post('/:slug/rate', requireAuth, ah(async (req, res) => {
  const cat = await getCatalog();
  const m = cat.bySlug.get(req.params.slug);
  if (!m) return res.status(404).json({ error: 'Monument not found' });
  const stars = Number(req.body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'Choose 1 to 5 stars' });
  const comment = req.body?.comment ? String(req.body.comment).slice(0, 600) : null;
  await query(`INSERT INTO ratings (user_id, monument_id, stars, comment) VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE stars = VALUES(stars), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
  [req.user.id, m.id, stars, comment]);
  invalidateCatalog();
  res.status(201).json({ ok: true });
}));

export default r;
