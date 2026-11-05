import 'dotenv/config';
import http from 'node:http';
import os from 'node:os';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { query } from './db.js';
import { ah } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import monumentRoutes from './routes/monuments.js';
import tourRoutes from './routes/tours.js';
import playRoutes from './routes/play.js';
import passportRoutes from './routes/passport.js';
import adminRoutes, { UPLOAD_DIR } from './routes/admin.js';
import { fileURLToPath } from 'node:url';
import { attachHunts } from './hunt.js';

const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
if (!process.env.JWT_SECRET) console.warn('[warn] JWT_SECRET is not set; using a development secret.');

const app = express();
// the configured client, plus this machine and private LAN addresses (phones joining a hunt on the same Wi-Fi)
const LAN = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;
const allowOrigin = (o, cb) => cb(null, !o || o === ORIGIN || LAN.test(o));
app.use(cors({ origin: allowOrigin }));
app.use(express.json({ limit: '200kb' }));
// admin-uploaded photos; nosniff keeps them served strictly as images
app.use('/uploads', express.static(fileURLToPath(UPLOAD_DIR), { maxAge: '30d', immutable: true, setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));

app.get('/api/health', ah(async (_req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, name: 'Hamro Prachin Sampada' });
}));
// LAN addresses of this computer, so a hunt invite QR can point phones on the same Wi-Fi at it
app.get('/api/net', (_req, res) => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n.address);
  res.json({ ips });
});
app.use('/api/auth', authRoutes);
app.use('/api/monuments', monumentRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/play', playRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const dbDown = ['ECONNREFUSED', 'ER_BAD_DB_ERROR', 'ER_ACCESS_DENIED_ERROR'].includes(err.code);
  res.status(dbDown ? 503 : status).json({
    error: dbDown ? 'Database unavailable. Start MySQL (start-mysql.cmd) and run "npm run db:init".' : status >= 500 ? 'Something went wrong' : err.message,
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowOrigin }, pingInterval: 10000 });
attachHunts(io);

const PORT = Number(process.env.PORT || 5050);
server.listen(PORT, () => console.log(`Sampada API + live hunts on http://localhost:${PORT}`));
