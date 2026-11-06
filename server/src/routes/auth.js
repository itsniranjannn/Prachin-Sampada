import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db.js';
import { signToken, requireAuth, ah } from '../middleware/auth.js';
import { levelFor } from '../algorithms/adaptive.js';
import crypto from 'node:crypto';
import { sendMail, clientOrigin, mailMode } from '../mail.js';
import { verifyEmail, welcomeEmail, resetEmail, passwordChangedEmail } from '../mail-templates.js';

const r = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const INTERESTS = ['hindu', 'buddhist', 'pagoda', 'stupa', 'shikhara', 'palace', 'courtyard', 'water', 'art', 'festival', 'legend', 'unesco', 'malla', 'licchavi'];
const cleanInterests = (list) => (Array.isArray(list) ? list : String(list || '').split(','))
  .map((s) => String(s).trim().toLowerCase()).filter((s) => INTERESTS.includes(s)).slice(0, 6).join(',');

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hashCode = (email, purpose, code) => crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-only').update(`${email}|${purpose}|${code}`).digest('hex');

/** Make a fresh 6-digit code for an address, replacing any unused one. Returns {code}, or {wait} seconds. */
async function issueCode(email, purpose) {
  const [last] = await query('SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age FROM email_codes WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1', [email, purpose]);
  if (last && last.age < RESEND_SECONDS) return { wait: RESEND_SECONDS - last.age };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await query('UPDATE email_codes SET consumed_at = NOW() WHERE email = ? AND purpose = ? AND consumed_at IS NULL', [email, purpose]);
  await query('INSERT INTO email_codes (email, purpose, code_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))', [email, purpose, hashCode(email, purpose, code), CODE_MINUTES]);
  return { code };
}

/** 'ok' | 'wrong' | 'expired' | 'locked'. A good code is used up; five wrong guesses lock the code. */
async function checkCode(email, purpose, code) {
  const [row] = await query('SELECT * FROM email_codes WHERE email = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1', [email, purpose]);
  if (!row) return 'expired';
  if (row.attempts >= MAX_ATTEMPTS) return 'locked';
  await query('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?', [row.id]);
  const given = Buffer.from(hashCode(email, purpose, String(code || '').replace(/\D/g, '')));
  const want = Buffer.from(row.code_hash);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return 'wrong';
  await query('UPDATE email_codes SET consumed_at = NOW() WHERE id = ?', [row.id]);
  return 'ok';
}
const CODE_ERRORS = { wrong: 'That code is not right. Check the email and try again.', expired: 'That code has expired. Ask for a new one.', locked: 'Too many wrong tries. Ask for a new code.' };

// Slow down password guessing: ten wrong passwords for one address from one client pause sign-in for five minutes.
// A right password clears the count. Kept in memory, which is enough for a single server.
const LOGIN_FAILS = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const loginMisses = new Map();
const loginKey = (req, email) => `${req.ip}|${email}`;
function loginWait(key) {
  const hit = loginMisses.get(key);
  if (!hit) return 0;
  if (Date.now() - hit.first > LOGIN_WINDOW_MS) { loginMisses.delete(key); return 0; }
  return hit.n >= LOGIN_FAILS ? Math.ceil((hit.first + LOGIN_WINDOW_MS - Date.now()) / 1000) : 0;
}
function loginMiss(key) {
  const hit = loginMisses.get(key);
  if (!hit || Date.now() - hit.first > LOGIN_WINDOW_MS) loginMisses.set(key, { n: 1, first: Date.now() });
  else hit.n += 1;
  if (loginMisses.size > 5000) for (const [k, v] of loginMisses) if (Date.now() - v.first > LOGIN_WINDOW_MS) loginMisses.delete(k);
}

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, emailVerified: !!u.email_verified,
  interests: u.interests ? u.interests.split(',') : [], rating: u.rating, answered: u.answered,
  level: levelFor(u.rating), createdAt: u.created_at,
});

r.get('/interests', (_req, res) => res.json({ interests: INTERESTS }));

r.post('/register', ah(async (req, res) => {
  const { name, email, password, interests } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'Please enter your name' });
  if (!EMAIL_RE.test(String(email || '').trim())) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const exists = await query('SELECT id FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
  if (exists.length) return res.status(409).json({ error: 'An account with this email already exists' });
  const hash = await bcrypt.hash(String(password), 10);
  let out;
  try {
    out = await query('INSERT INTO users (name, email, password_hash, interests) VALUES (?, ?, ?, ?)',
      [String(name).trim(), String(email).trim().toLowerCase(), hash, cleanInterests(interests)]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists' });
    throw e;
  }
  const [user] = await query('SELECT * FROM users WHERE id = ?', [out.insertId]);
  const issued = await issueCode(user.email, 'verify');
  const mail = issued.code ? await sendMail(user.email, verifyEmail({ name: user.name, code: issued.code, origin: clientOrigin(), minutes: CODE_MINUTES })) : { ok: false };
  res.status(201).json({ token: signToken(user), user: publicUser(user), mail: { sent: !!mail.ok, mode: mail.mode } });
}));

// confirm the address with the code from the email
r.post('/verify-email', requireAuth, ah(async (req, res) => {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  if (user.email_verified) return res.json({ user: publicUser(user) });
  const result = await checkCode(user.email, 'verify', req.body?.code);
  if (result !== 'ok') return res.status(400).json({ error: CODE_ERRORS[result] });
  await query('UPDATE users SET email_verified = 1 WHERE id = ?', [user.id]);
  await sendMail(user.email, welcomeEmail({ name: user.name, origin: clientOrigin() }));
  const [fresh] = await query('SELECT * FROM users WHERE id = ?', [user.id]);
  res.json({ user: publicUser(fresh) });
}));

r.post('/resend-code', requireAuth, ah(async (req, res) => {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  if (user.email_verified) return res.status(400).json({ error: 'Your email is already verified' });
  const issued = await issueCode(user.email, 'verify');
  if (issued.wait) return res.status(429).json({ error: `Please wait ${issued.wait} seconds before asking for another code`, wait: issued.wait });
  const mail = await sendMail(user.email, verifyEmail({ name: user.name, code: issued.code, origin: clientOrigin(), minutes: CODE_MINUTES }));
  if (!mail.ok) return res.status(502).json({ error: 'We could not send the email. Please try again in a moment.' });
  res.json({ sent: true, mode: mail.mode, resendIn: RESEND_SECONDS });
}));

// forgotten password: always answers the same way, so nobody can test which emails have accounts
r.post('/forgot', ah(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
  const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);
  if (user && user.is_active) {
    const issued = await issueCode(user.email, 'reset');
    if (issued.code) await sendMail(user.email, resetEmail({ name: user.name, code: issued.code, origin: clientOrigin(), minutes: CODE_MINUTES }));
  }
  res.json({ ok: true, message: 'If that address has a passport, a code is on its way.', resendIn: RESEND_SECONDS });
}));

r.post('/reset', ah(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const { code, password } = req.body || {};
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);
  const result = user && user.is_active ? await checkCode(email, 'reset', code) : 'expired';
  if (result !== 'ok') return res.status(400).json({ error: CODE_ERRORS[result] });
  await query('UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?', [await bcrypt.hash(String(password), 10), user.id]);
  await sendMail(user.email, passwordChangedEmail({ name: user.name, origin: clientOrigin(), when: new Date().toUTCString().replace(' GMT', ' UTC') }));
  res.json({ ok: true });
}));

r.get('/mail-mode', (_req, res) => res.json({ mode: mailMode() }));

// Google Sign-In verification endpoint
r.post('/google', ah(async (req, res) => {
  const { credential, email: bodyEmail, name: bodyName, email_verified: bodyVerified } = req.body || {};

  let email = bodyEmail;
  let name = bodyName;
  let email_verified = bodyVerified;

  // If a raw credential/id_token was supplied, verify it with Google
  if (credential) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      email_verified = payload.email_verified;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid Google token: ' + err.message });
    }
  }

  if (!email) return res.status(400).json({ error: 'Google account does not provide an email' });
  const addr = email.trim().toLowerCase();

  let [user] = await query('SELECT * FROM users WHERE email = ?', [addr]);


  let isFirstTime = false;
  if (!user) {
    // Generate secure random fallback password for OAuth-created users
    const randPass = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(randPass, 10);
    const [result] = await query(
      'INSERT INTO users (name, email, password_hash, role, email_verified, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name || 'Explorer', addr, hash, 'explorer', email_verified ? 1 : 0, 1]
    );
    [user] = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    isFirstTime = true;
  } else {
    if (!user.is_active) return res.status(403).json({ error: 'This account has been deactivated' });
    if (!user.email_verified && email_verified) {
      await query('UPDATE users SET email_verified = 1 WHERE id = ?', [user.id]);
      user.email_verified = 1;
    }
  }

  // Send a welcome email when user joins via Google for the first time
  if (isFirstTime) {
    sendMail(addr, welcomeEmail({ name: user.name, origin: clientOrigin(), provider: 'google' })).catch(() => {});
  }


  res.json({ token: signToken(user), user: publicUser(user) });
}));

r.post('/login', ah(async (req, res) => {

  const { email, password } = req.body || {};
  const addr = String(email || '').trim().toLowerCase();
  const key = loginKey(req, addr);
  const wait = loginWait(key);
  if (wait) return res.status(429).json({ error: `Too many tries. Please wait ${Math.ceil(wait / 60)} minute${wait > 60 ? 's' : ''} and try again.`, wait });
  const [user] = await query('SELECT * FROM users WHERE email = ?', [addr]);
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) { loginMiss(key); return res.status(401).json({ error: 'Email or password is incorrect' }); }
  if (!user.is_active) return res.status(403).json({ error: 'This account has been deactivated' });
  loginMisses.delete(key);
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
