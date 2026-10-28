import express, { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { query } from '../db.js';
import { getCatalog, invalidateCatalog } from '../catalog.js';
import { requireAdmin, ah, forgetActive } from '../middleware/auth.js';
import { difficultyToRating } from '../algorithms/adaptive.js';

const r = Router();
r.use(requireAdmin);

export const UPLOAD_DIR = new URL('../../uploads/', import.meta.url);

// ---- validation helpers -------------------------------------------------------------------------------------------
const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const num = (v) => (v === '' || v == null ? null : Number(v));
const toId = (v) => { const n = Number(v); if (!Number.isInteger(n) || n < 1) throw bad('Invalid id'); return n; };
/** A duplicate unique key (slug) is the caller's mistake, not a server fault. */
const dup = (e, message) => { throw e?.code === 'ER_DUP_ENTRY' ? bad(message, 409) : e; };

// An admin whose role or account changed must lose access at once, not when the 7-day token expires.
r.use(ah(async (req, res, next) => {
  const [u] = await query('SELECT role, is_active FROM users WHERE id = ?', [req.user.id]);
  if (!u || !u.is_active || u.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}));

// Photo upload (raw body, max 6 MB). The type is decided from the file's first bytes (magic numbers),
// never from its name or Content-Type, so a renamed script cannot be stored as an image.
function sniffImage(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

r.post('/uploads', express.raw({ type: () => true, limit: '6mb' }), ah(async (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'No file received' });
  const ext = sniffImage(buf);
  if (!ext) return res.status(415).json({ error: 'Only JPEG, PNG or WebP images are allowed' });
  const name = `${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 20)}.${ext}`; // same photo stored once
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(new URL(name, UPLOAD_DIR), buf);
  res.status(201).json({ url: `/uploads/${name}`, bytes: buf.length });
}));

/** text columns: [maxLength, nullable]. NOT NULL columns store '' instead of NULL when left blank. */
const TEXT = {
  slug: [80, false], name: [120, false], name_np: [120, false], city: [60, false], district: [40, true], zone_slug: [80, true],
  deity: [120, true], built_text: [300, false], dynasty: [80, false], architecture: [400, false], short_text: [200, false],
  quake_2015: [400, true], image_url: [500, false], image_page: [500, false], image_credit: [255, false], tags: [255, false],
  short_np: [500, true], quake_np: [900, true], story: [60000, false], legend: [60000, true], story_np: [60000, true], legend_np: [60000, true],
};
const MONUMENT_FIELDS = [...Object.keys(TEXT), 'province', 'lat', 'lng', 'type', 'religion', 'built_year', 'open_time', 'close_time',
  'fee_foreigner', 'fee_saarc', 'fee_nepali', 'visit_minutes', 'unesco'];
const TYPES = ['pagoda', 'stupa', 'shikhara', 'palace', 'square', 'courtyard', 'pond', 'tower', 'statue', 'sculpture', 'museum', 'bahal', 'gate', 'gateway',
  'window', 'temple', 'cave', 'monastery', 'fort', 'pillar', 'ghat', 'lake-shrine', 'dome-temple', 'garden', 'archaeological-site'];
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
const RELIGIONS = ['Hindu', 'Buddhist', 'Both', 'Secular', 'Other'];
const LABEL = {
  slug: 'Slug', name: 'Name', name_np: 'Name in Nepali', city: 'City', lat: 'Latitude', lng: 'Longitude', type: 'Type', story: 'Story',
  short_text: 'Tagline', short_np: 'Nepali tagline', story_np: 'Nepali story', legend_np: 'Nepali legend', quake_np: 'Nepali earthquake note',
};
const REQUIRED = ['slug', 'name', 'city', 'lat', 'lng', 'type', 'story'];

function cleanList(v, label) {
  if (v == null) return null;
  if (!Array.isArray(v)) throw bad(`${label} must be a list`);
  const out = v.map((x) => String(x).trim()).filter(Boolean);
  if (out.length > 8) throw bad(`${label}: at most 8 entries`);
  if (out.some((x) => x.length > 500)) throw bad(`${label}: each entry must be 500 characters or fewer`);
  return out;
}

function cleanMonument(body, { partial }) {
  const out = {};
  for (const f of MONUMENT_FIELDS) if (body[f] !== undefined) out[f] = body[f];
  for (const [k, [max, nullable]] of Object.entries(TEXT)) {
    if (!(k in out)) continue;
    if (out[k] != null && typeof out[k] !== 'string') throw bad(`${LABEL[k] || k} must be text`);
    const v = (out[k] ?? '').trim();
    if (v.length > max) throw bad(`${LABEL[k] || k} is too long (max ${max} characters)`);
    out[k] = v === '' ? (nullable ? null : '') : v;
  }
  if (out.slug && !/^[a-z0-9-]{3,80}$/.test(out.slug)) throw bad('Slug: 3-80 lowercase letters, digits or dashes');
  if (out.zone_slug && !/^[a-z0-9-]{3,80}$/.test(out.zone_slug)) throw bad('Zone slug: lowercase letters, digits or dashes only');
  if (out.image_url && !/^(https?:\/\/|\/uploads\/)/.test(out.image_url)) throw bad('Photo link must start with https:// or be an uploaded photo');
  if (out.image_page && !/^https?:\/\//.test(out.image_page)) throw bad('Photo source page must be an http(s) link');
  if (out.type !== undefined && !TYPES.includes(out.type)) throw bad('Unknown monument type');
  if (out.religion !== undefined && !RELIGIONS.includes(out.religion)) throw bad('Religion must be Hindu, Buddhist, Both, Secular or Other');
  if (out.province !== undefined && !PROVINCES.includes(out.province)) throw bad('Province must be one of the seven provinces');
  for (const k of ['lat', 'lng']) {
    if (out[k] === undefined) continue;
    const n = num(out[k]);
    if (n == null || !Number.isFinite(n)) throw bad(`${LABEL[k]} must be a number`);
    out[k] = n;
  }
  if (out.lat !== undefined && (out.lat < 26.3 || out.lat > 30.5)) throw bad('Latitude must be inside Nepal (26.3 to 30.5)');
  if (out.lng !== undefined && (out.lng < 80 || out.lng > 88.3)) throw bad('Longitude must be inside Nepal (80 to 88.3)');
  if (out.built_year !== undefined) {
    const n = num(out.built_year);
    if (n != null && (!Number.isInteger(n) || n < -3000 || n > 2100)) throw bad('Built year must be a whole year between -3000 and 2100');
    out.built_year = n;
  }
  for (const k of ['fee_foreigner', 'fee_saarc', 'fee_nepali']) {
    if (out[k] === undefined) continue;
    const n = num(out[k]);
    if (n != null && (!Number.isInteger(n) || n < 0 || n > 1_000_000)) throw bad('Fees must be whole rupee amounts, zero or more');
    out[k] = n;
  }
  if (out.visit_minutes !== undefined) {
    const n = num(out.visit_minutes) ?? 30;
    if (!Number.isInteger(n) || n < 1 || n > 1440) throw bad('Typical visit must be between 1 and 1440 minutes');
    out.visit_minutes = n;
  }
  for (const k of ['open_time', 'close_time']) {
    if (out[k] === undefined) continue;
    if (out[k] === '' || out[k] == null) { out[k] = null; continue; }
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(out[k])) throw bad('Opening and closing times use HH:MM (24-hour)');
  }
  if (out.unesco !== undefined) out.unesco = out.unesco ? 1 : 0;
  for (const k of REQUIRED) {
    if (partial ? k in out && (out[k] == null || out[k] === '') : out[k] == null || out[k] === '') throw bad(`${LABEL[k]} is required`);
  }
  if (body.facts !== undefined) out.facts = JSON.stringify(cleanList(body.facts, 'Facts') ?? []);
  if (body.facts_np !== undefined) out.facts_np = body.facts_np == null ? null : JSON.stringify(cleanList(body.facts_np, 'Nepali facts'));
  return out;
}

// ---- overview -----------------------------------------------------------------------------------------------------
r.get('/stats', ah(async (_req, res) => {
  const [[u], [t], [q], [g], [h], [v], [rv], [qc], [mc], perDay, topStamped, hardest, byType] = await Promise.all([
    query("SELECT COUNT(*) AS n FROM users WHERE role = 'explorer'"),
    query('SELECT COUNT(*) AS n FROM tours'),
    query('SELECT COUNT(*) AS n, COALESCE(AVG(correct),0) AS acc FROM quiz_attempts'),
    query("SELECT COUNT(*) AS n, COALESCE(AVG(points),0) AS avg FROM game_scores WHERE mode = 'solo'"),
    query('SELECT COUNT(*) AS n, COALESCE(SUM(players),0) AS players FROM hunts WHERE finished_at IS NOT NULL'),
    query('SELECT COUNT(*) AS n FROM visits'),
    query('SELECT COUNT(*) AS n FROM ratings'),
    query('SELECT COUNT(*) AS n FROM questions'),
    query('SELECT COUNT(*) AS n FROM monuments'),
    query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS n FROM quiz_attempts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) GROUP BY d ORDER BY d`),
    query(`SELECT m.name, COUNT(*) AS n FROM visits v JOIN monuments m ON m.id = v.monument_id GROUP BY m.id, m.name ORDER BY n DESC LIMIT 6`),
    query(`SELECT q.id, LEFT(q.question, 90) AS question, q.rating, q.times_asked, q.times_correct FROM questions q WHERE q.times_asked > 0 ORDER BY q.rating DESC LIMIT 6`),
    query('SELECT type, COUNT(*) AS n FROM monuments GROUP BY type ORDER BY n DESC'),
  ]);
  // one bar for each of the last 14 days, including quiet days
  const byDay = new Map(perDay.map((d) => [d.d, Number(d.n)]));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ d: key, n: byDay.get(key) || 0 });
  }
  res.json({
    explorers: u.n, tours: t.n, quizAnswers: q.n, quizAccuracy: Math.round(Number(q.acc) * 100), games: g.n, avgGame: Math.round(Number(g.avg)),
    hunts: h.n, huntPlayers: Number(h.players), stamps: v.n, reviews: rv.n, questions: qc.n, monuments: mc.n, perDay: days, topStamped, hardest, byType,
  });
}));

// ---- monuments ----------------------------------------------------------------------------------------------------
r.get('/monuments', ah(async (_req, res) => {
  const cat = await getCatalog();
  res.json({
    results: cat.monuments.map((m) => ({
      ...m, questions: cat.questions.filter((q) => q.monument_id === m.id).length, clues: cat.clues.filter((c) => c.monument_id === m.id).length,
    })),
  });
}));

r.post('/monuments', ah(async (req, res) => {
  const m = cleanMonument(req.body || {}, { partial: false });
  if (m.facts === undefined) m.facts = '[]';
  const keys = Object.keys(m);
  const out = await query(`INSERT INTO monuments (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`, keys.map((k) => m[k]))
    .catch((e) => dup(e, 'A monument with this slug already exists. Choose another slug.'));
  invalidateCatalog();
  res.status(201).json({ id: out.insertId });
}));

r.put('/monuments/:id', ah(async (req, res) => {
  const id = toId(req.params.id);
  const m = cleanMonument(req.body || {}, { partial: true });
  const keys = Object.keys(m);
  if (!keys.length) throw bad('Nothing to update');
  const out = await query(`UPDATE monuments SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => m[k]), id])
    .catch((e) => dup(e, 'Another monument already uses this slug. Choose another slug.'));
  if (!out.affectedRows) throw bad('Monument not found', 404);
  invalidateCatalog();
  res.json({ ok: true });
}));

// Questions, clues, stamps, favorites and reviews of the monument go with it (ON DELETE CASCADE).
r.delete('/monuments/:id', ah(async (req, res) => {
  const out = await query('DELETE FROM monuments WHERE id = ?', [toId(req.params.id)]);
  if (!out.affectedRows) throw bad('Monument not found', 404);
  invalidateCatalog();
  res.json({ ok: true });
}));

// ---- quiz questions -----------------------------------------------------------------------------------------------
const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
async function monumentExists(id) {
  const [m] = await query('SELECT id FROM monuments WHERE id = ?', [id]);
  if (!m) throw bad('Monument not found', 404);
}

r.get('/monuments/:id/questions', ah(async (req, res) => {
  const rows = await query('SELECT * FROM questions WHERE monument_id = ? ORDER BY difficulty, id', [toId(req.params.id)]);
  res.json({ results: rows.map((q) => ({ ...q, options: parseJson(q.options), options_np: q.options_np ? parseJson(q.options_np) : null })) });
}));

function cleanQuestion(b) {
  const question = String(b.question ?? '').trim();
  if (question.length < 8) throw bad('Write the question (at least 8 characters)');
  if (question.length > 400) throw bad('The question is too long (max 400 characters)');
  const options = Array.isArray(b.options) ? b.options.map((o) => String(o ?? '').trim()) : [];
  if (options.length !== 4 || options.some((o) => !o)) throw bad('Give exactly four options and fill in every one');
  if (new Set(options.map((o) => o.toLowerCase())).size !== 4) throw bad('The four options must all be different');
  if (options.some((o) => o.length > 200)) throw bad('Each option must be 200 characters or fewer');
  const answer = Number(b.answer_index);
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) throw bad('Mark the correct option');
  const difficulty = Number(b.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) throw bad('Difficulty must be a whole number from 1 to 5');
  const explanation = String(b.explanation ?? '').trim();
  if (explanation.length > 400) throw bad('The explanation is too long (max 400 characters)');
  const question_np = String(b.question_np ?? '').trim() || null;
  const explanation_np = String(b.explanation_np ?? '').trim() || null;
  if ((question_np && question_np.length > 800) || (explanation_np && explanation_np.length > 800)) throw bad('Nepali text is too long (max 800 characters)');
  const npOpts = Array.isArray(b.options_np) ? b.options_np.map((o) => String(o ?? '').trim()) : [];
  if (npOpts.some(Boolean) && (npOpts.length !== 4 || npOpts.some((o) => !o))) throw bad('Fill in all four Nepali options, or leave them all empty');
  return {
    question, options: JSON.stringify(options), answer_index: answer, difficulty, explanation, question_np, explanation_np,
    options_np: npOpts.some(Boolean) ? JSON.stringify(npOpts) : null,
  };
}

r.post('/monuments/:id/questions', ah(async (req, res) => {
  const mid = toId(req.params.id);
  const q = cleanQuestion(req.body || {});
  await monumentExists(mid);
  const out = await query(
    'INSERT INTO questions (monument_id, question, options, answer_index, difficulty, rating, explanation, question_np, options_np, explanation_np) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [mid, q.question, q.options, q.answer_index, q.difficulty, difficultyToRating(q.difficulty), q.explanation, q.question_np, q.options_np, q.explanation_np]);
  invalidateCatalog();
  res.status(201).json({ id: out.insertId });
}));

r.put('/questions/:id', ah(async (req, res) => {
  const id = toId(req.params.id);
  const q = cleanQuestion(req.body || {});
  const [old] = await query('SELECT difficulty, times_asked FROM questions WHERE id = ?', [id]);
  if (!old) throw bad('Question not found', 404);
  // a question nobody has answered yet follows its difficulty; one with history keeps its earned Elo rating
  const sets = ['question = ?', 'options = ?', 'answer_index = ?', 'difficulty = ?', 'explanation = ?', 'question_np = ?', 'options_np = ?', 'explanation_np = ?'];
  const vals = [q.question, q.options, q.answer_index, q.difficulty, q.explanation, q.question_np, q.options_np, q.explanation_np];
  if (!old.times_asked && old.difficulty !== q.difficulty) { sets.push('rating = ?'); vals.push(difficultyToRating(q.difficulty)); }
  await query(`UPDATE questions SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  invalidateCatalog();
  res.json({ ok: true });
}));

r.delete('/questions/:id', ah(async (req, res) => {
  const out = await query('DELETE FROM questions WHERE id = ?', [toId(req.params.id)]);
  if (!out.affectedRows) throw bad('Question not found', 404);
  invalidateCatalog();
  res.json({ ok: true });
}));

// ---- Find-the-place clues -----------------------------------------------------------------------------------------
r.get('/monuments/:id/clues', ah(async (req, res) => {
  res.json({ results: await query('SELECT id, monument_id, clue, clue_np FROM clues WHERE monument_id = ? ORDER BY id', [toId(req.params.id)]) });
}));

function cleanClue(b) {
  const clue = String(b.clue ?? '').trim();
  if (clue.length < 8) throw bad('Write the clue (at least 8 characters)');
  if (clue.length > 300) throw bad('The clue is too long (max 300 characters)');
  const clue_np = String(b.clue_np ?? '').trim() || null;
  if (clue_np && clue_np.length > 500) throw bad('The Nepali clue is too long (max 500 characters)');
  return { clue, clue_np };
}

r.post('/monuments/:id/clues', ah(async (req, res) => {
  const mid = toId(req.params.id);
  const c = cleanClue(req.body || {});
  await monumentExists(mid);
  const out = await query('INSERT INTO clues (monument_id, clue, clue_np) VALUES (?, ?, ?)', [mid, c.clue, c.clue_np]);
  invalidateCatalog();
  res.status(201).json({ id: out.insertId });
}));

r.put('/clues/:id', ah(async (req, res) => {
  const c = cleanClue(req.body || {});
  const out = await query('UPDATE clues SET clue = ?, clue_np = ? WHERE id = ?', [c.clue, c.clue_np, toId(req.params.id)]);
  if (!out.affectedRows) throw bad('Clue not found', 404);
  invalidateCatalog();
  res.json({ ok: true });
}));

r.delete('/clues/:id', ah(async (req, res) => {
  const out = await query('DELETE FROM clues WHERE id = ?', [toId(req.params.id)]);
  if (!out.affectedRows) throw bad('Clue not found', 404);
  invalidateCatalog();
  res.json({ ok: true });
}));

// ---- explorers ----------------------------------------------------------------------------------------------------
r.get('/users', ah(async (_req, res) => {
  const rows = await query(`SELECT u.id, u.name, u.email, u.role, u.rating, u.answered, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM visits v WHERE v.user_id = u.id) AS stamps FROM users u ORDER BY u.created_at DESC, u.id DESC`);
  res.json({ results: rows });
}));

r.patch('/users/:id', ah(async (req, res) => {
  const id = toId(req.params.id);
  const b = req.body || {};
  if (id === req.user.id) throw bad('You cannot change your own account here');
  const sets = []; const vals = [];
  if (b.active !== undefined) { sets.push('is_active = ?'); vals.push(b.active ? 1 : 0); }
  if (b.role !== undefined) {
    if (!['explorer', 'admin'].includes(b.role)) throw bad('Role must be explorer or admin');
    sets.push('role = ?'); vals.push(b.role);
  }
  if (!sets.length) throw bad('Nothing to update');
  const out = await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  if (!out.affectedRows) throw bad('User not found', 404);
  forgetActive(id);
  res.json({ ok: true });
}));

// ---- reviews, stamps, games, hunts --------------------------------------------------------------------------------
r.get('/reviews', ah(async (_req, res) => {
  res.json({ results: await query(`SELECT r.id, r.stars, r.comment, r.created_at, u.name AS user_name, m.name AS monument, m.slug
      FROM ratings r JOIN users u ON u.id = r.user_id JOIN monuments m ON m.id = r.monument_id ORDER BY r.created_at DESC, r.id DESC LIMIT 300`) });
}));

r.delete('/reviews/:id', ah(async (req, res) => {
  const out = await query('DELETE FROM ratings WHERE id = ?', [toId(req.params.id)]);
  if (!out.affectedRows) throw bad('Review not found', 404);
  invalidateCatalog(); // average ratings live in the catalog
  res.json({ ok: true });
}));

r.get('/stamps', ah(async (_req, res) => {
  res.json({ results: await query(`SELECT v.method, v.created_at, u.name AS user_name, m.name AS monument, m.slug
      FROM visits v JOIN users u ON u.id = v.user_id JOIN monuments m ON m.id = v.monument_id ORDER BY v.created_at DESC LIMIT 300`) });
}));

r.get('/games', ah(async (_req, res) => {
  res.json({ results: await query('SELECT id, player_name, mode, points, rounds, hunt_code, created_at FROM game_scores ORDER BY created_at DESC, id DESC LIMIT 300') });
}));

r.get('/hunts', ah(async (_req, res) => {
  res.json({ results: await query('SELECT code, host_name, rounds, players, winner_name, created_at, finished_at FROM hunts ORDER BY created_at DESC LIMIT 100') });
}));

export default r;
