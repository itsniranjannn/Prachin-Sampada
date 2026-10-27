import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth, ah } from '../middleware/auth.js';
import { levelFor } from '../algorithms/adaptive.js';

const r = Router();
const INTERESTS = ['hindu', 'buddhist', 'pagoda', 'stupa', 'shikhara', 'palace', 'courtyard', 'water', 'art', 'festival', 'legend', 'unesco', 'malla', 'licchavi'];
const cleanInterests = (list) => (Array.isArray(list) ? list : String(list || '').split(','))
  .map((s) => String(s).trim().toLowerCase()).filter((s) => INTERESTS.includes(s)).slice(0, 6).join(',');

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  interests: u.interests ? u.interests.split(',') : [], rating: u.rating, answered: u.answered,
  level: levelFor(u.rating), createdAt: u.created_at,
});

r.get('/interests', (_req, res) => res.json({ interests: INTERESTS }));

r.post('/register', ah(async (req, res) => {
  const { name, email, password, interests } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'Please enter your name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const exists = await query('SELECT id FROM users WHERE email = ?', [String(email).toLowerCase()]);
  if (exists.length) return res.status(409).json({ error: 'An account with this email already exists' });
  const hash = await bcrypt.hash(String(password), 10);
  const out = await query('INSERT INTO users (name, email, password_hash, interests) VALUES (?, ?, ?, ?)',
    [String(name).trim(), String(email).toLowerCase(), hash, cleanInterests(interests)]);
  const [user] = await query('SELECT * FROM users WHERE id = ?', [out.insertId]);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

r.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  const [user] = await query('SELECT * FROM users WHERE email = ?', [String(email || '').toLowerCase()]);
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect' });
  if (!user.is_active) return res.status(403).json({ error: 'This account has been deactivated' });
  res.json({ token: signToken(user), user: publicUser(user) });
}));

r.get('/me', requireAuth, ah(async (req, res) => {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user || !user.is_active) return res.status(401).json({ error: 'Session expired' });
  res.json({ user: publicUser(user) });
}));

r.put('/me', requireAuth, ah(async (req, res) => {
  const { name, interests } = req.body || {};
  if (name != null && String(name).trim().length < 2) return res.status(400).json({ error: 'Please enter your name' });
  await query('UPDATE users SET name = COALESCE(?, name), interests = COALESCE(?, interests) WHERE id = ?',
    [name != null ? String(name).trim() : null, interests != null ? cleanInterests(interests) : null, req.user.id]);
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: publicUser(user) });
}));

export default r;
export { publicUser, INTERESTS };
