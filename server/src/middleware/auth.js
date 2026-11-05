import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'sampada-dev-only-secret';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '7d' });
}

export function readToken(raw) {
  if (!raw) return null;
  try {
    return jwt.verify(raw, SECRET);
  } catch {
    return null;
  }
}

const fromHeader = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? readToken(h.slice(7)) : null;
};

/** Attaches req.user when a valid token is present; never blocks (guests can explore everything). */
export function optionalAuth(req, _res, next) {
  req.user = fromHeader(req);
  next();
}

// A deactivated account must lose access at once, not when its 7-day token expires.
// The active flag is cached for 30 s per user so this costs at most one small query per user per 30 s.
const activeCache = new Map();
async function isActive(id) {
  const hit = activeCache.get(id);
  if (hit && Date.now() - hit.at < 30_000) return hit.ok;
  const { query } = await import('../db.js');
  const [u] = await query('SELECT is_active FROM users WHERE id = ?', [id]);
  const ok = !!u?.is_active;
  activeCache.set(id, { ok, at: Date.now() });
  return ok;
}
export const forgetActive = (id) => activeCache.delete(Number(id));

export function requireAuth(req, res, next) {
  req.user = fromHeader(req);
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue' });
  isActive(req.user.id)
    .then((ok) => (ok ? next() : res.status(401).json({ error: 'This account has been deactivated' })))
    .catch(next);
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    next();
  });
}

/** Wraps async handlers so thrown errors reach the error middleware. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const httpError = (status, message) => Object.assign(new Error(message), { status });
