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

const MONUMENT_FIELDS = ['slug', 'name', 'name_np', 'city', 'province', 'district', 'zone_slug', 'lat', 'lng', 'type', 'religion', 'deity', 'built_year', 'built_text', 'dynasty',
  'architecture', 'unesco', 'short_text', 'story', 'legend', 'open_time', 'close_time', 'fee_foreigner', 'fee_saarc', 'fee_nepali', 'visit_minutes',
  'quake_2015', 'image_url', 'image_page', 'image_credit', 'tags'];
const TYPES = ['pagoda', 'stupa', 'shikhara', 'palace', 'square', 'courtyard', 'pond', 'tower', 'statue', 'museum', 'bahal', 'gate', 'window', 'temple', 'cave'];

r.get('/stats', ah(async (_req, res) => {
  const [[u], [t], [q], [g], [h], [v], perDay, topStamped, hardest, byType] = await Promise.all([
    query("SELECT COUNT(*) AS n FROM users WHERE role = 'explorer'"),
    query('SELECT COUNT(*) AS n FROM tours'),
    query('SELECT COUNT(*) AS n, COALESCE(AVG(correct),0) AS acc FROM quiz_attempts'),
    query("SELECT COUNT(*) AS n, COALESCE(AVG(points),0) AS avg FROM game_scores WHERE mode = 'solo'"),
    query('SELECT COUNT(*) AS n, COALESCE(SUM(players),0) AS players FROM hunts WHERE finished_at IS NOT NULL'),
    query('SELECT COUNT(*) AS n FROM visits'),
    query(`SELECT DATE(created_at) AS d, COUNT(*) AS n FROM quiz_attempts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) GROUP BY DATE(created_at) ORDER BY d`),
    query(`SELECT m.name, COUNT(*) AS n FROM visits v JOIN monuments m ON m.id = v.monument_id GROUP BY m.id, m.name ORDER BY n DESC LIMIT 6`),
    query(`SELECT q.id, LEFT(q.question, 90) AS question, q.rating, q.times_asked, q.times_correct FROM questions q WHERE q.times_asked > 0 ORDER BY q.rating DESC LIMIT 6`),
    query('SELECT type, COUNT(*) AS n FROM monuments GROUP BY type ORDER BY n DESC'),
  ]);
  res.json({
    explorers: u.n, tours: t.n, quizAnswers: q.n, quizAccuracy: Math.round(Number(q.acc) * 100), games: g.n, avgGame: Math.round(Number(g.avg)),
    hunts: h.n, huntPlayers: Number(h.players), stamps: v.n, perDay, topStamped, hardest, byType,
  });
}));

r.get('/monuments', ah(async (_req, res) => {
  const cat = await getCatalog();
  res.json({ results: cat.monuments.map((m) => ({ ...m, questions: cat.questions.filter((q) => q.monument_id === m.id).length })) });
}));

function cleanMonument(body) {
  const out = {};
  for (const f of MONUMENT_FIELDS) if (body[f] !== undefined) out[f] = body[f] === '' ? null : body[f];
  if (out.slug != null && !/^[a-z0-9-]{3,80}$/.test(out.slug)) throw Object.assign(new Error('Slug: 3-80 lowercase letters, digits or dashes'), { status: 400 });
  if (out.type != null && !TYPES.includes(out.type)) throw Object.assign(new Error('Unknown monument type'), { status: 400 });
  for (const k of ['lat', 'lng']) if (out[k] != null && !Number.isFinite(Number(out[k]))) throw Object.assign(new Error(`${k} must be a number`), { status: 400 });
  if (out.lat != null && (out.lat < 26.3 || out.lat > 30.5)) throw Object.assign(new Error('Latitude must be inside Nepal (26.3 to 30.5)'), { status: 400 });
  if (out.lng != null && (out.lng < 80 || out.lng > 88.3)) throw Object.assign(new Error('Longitude must be inside Nepal (80 to 88.3)'), { status: 400 });
  if (out.province != null && !['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'].includes(out.province)) throw Object.assign(new Error('Province must be one of the seven provinces'), { status: 400 });
  if (out.unesco != null) out.unesco = out.unesco ? 1 : 0;
  return out;
}

r.post('/monuments', ah(async (req, res) => {
  const m = cleanMonument(req.body || {});
  for (const k of ['slug', 'name', 'city', 'lat', 'lng', 'type', 'story']) if (m[k] == null) return res.status(400).json({ error: `${k} is required` });
  const facts = JSON.stringify(Array.isArray(req.body.facts) ? req.body.facts.slice(0, 8) : []);
  const keys = Object.keys(m);
  const out = await query(`INSERT INTO monuments (${keys.join(', ')}, facts) VALUES (${keys.map(() => '?').join(', ')}, ?)`, [...keys.map((k) => m[k]), facts]);
  invalidateCatalog();
  res.status(201).json({ id: out.insertId });
}));

r.put('/monuments/:id', ah(async (req, res) => {
  const m = cleanMonument(req.body || {});
  const keys = Object.keys(m);
  const sets = keys.map((k) => `${k} = ?`);
  const vals = keys.map((k) => m[k]);
  if (Array.isArray(req.body.facts)) { sets.push('facts = ?'); vals.push(JSON.stringify(req.body.facts.slice(0, 8))); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  const out = await query(`UPDATE monuments SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  if (!out.affectedRows) return res.status(404).json({ error: 'Monument not found' });
  invalidateCatalog();
  res.json({ ok: true });
}));

r.delete('/monuments/:id', ah(async (req, res) => {
  const out = await query('DELETE FROM monuments WHERE id = ?', [req.params.id]);
  if (!out.affectedRows) return res.status(404).json({ error: 'Monument not found' });
  invalidateCatalog();
  res.json({ ok: true });
}));

r.get('/monuments/:id/questions', ah(async (req, res) => {
  const rows = await query('SELECT * FROM questions WHERE monument_id = ? ORDER BY difficulty, id', [req.params.id]);
  res.json({ results: rows.map((q) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options })) });
}));

function cleanQuestion(b) {
  const options = Array.isArray(b.options) ? b.options.map((o) => String(o).trim()).filter(Boolean) : [];
  if (!b.question || String(b.question).trim().length < 8) throw Object.assign(new Error('Write the question (at least 8 characters)'), { status: 400 });
  if (options.length !== 4) throw Object.assign(new Error('Give exactly four options'), { status: 400 });
  const answer = Number(b.answer_index);
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) throw Object.assign(new Error('Mark the correct option'), { status: 400 });
  const difficulty = Math.min(5, Math.max(1, Number(b.difficulty) || 2));
  return { question: String(b.question).trim(), options: JSON.stringify(options), answer_index: answer, difficulty, explanation: String(b.explanation || '').slice(0, 400) };
}

r.post('/monuments/:id/questions', ah(async (req, res) => {
  const q = cleanQuestion(req.body || {});
  const out = await query('INSERT INTO questions (monument_id, question, options, answer_index, difficulty, rating, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.params.id, q.question, q.options, q.answer_index, q.difficulty, difficultyToRating(q.difficulty), q.explanation]);
  invalidateCatalog();
  res.status(201).json({ id: out.insertId });
}));

r.put('/questions/:id', ah(async (req, res) => {
  const q = cleanQuestion(req.body || {});
  await query('UPDATE questions SET question = ?, options = ?, answer_index = ?, difficulty = ?, explanation = ? WHERE id = ?',
    [q.question, q.options, q.answer_index, q.difficulty, q.explanation, req.params.id]);
  invalidateCatalog();
  res.json({ ok: true });
}));

r.delete('/questions/:id', ah(async (req, res) => {
  await query('DELETE FROM questions WHERE id = ?', [req.params.id]);
  invalidateCatalog();
  res.json({ ok: true });
}));

r.get('/users', ah(async (_req, res) => {
  const rows = await query(`SELECT u.id, u.name, u.email, u.role, u.rating, u.answered, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM visits v WHERE v.user_id = u.id) AS stamps FROM users u ORDER BY u.created_at DESC`);
  res.json({ results: rows });
}));

r.patch('/users/:id', ah(async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot deactivate yourself' });
  await query('UPDATE users SET is_active = ? WHERE id = ?', [req.body?.active ? 1 : 0, req.params.id]);
  forgetActive(req.params.id);
  res.json({ ok: true });
}));

r.get('/hunts', ah(async (_req, res) => {
  res.json({ results: await query('SELECT code, host_name, rounds, players, winner_name, created_at, finished_at FROM hunts ORDER BY created_at DESC LIMIT 30') });
}));

export default r;
