// Sends mail through Gmail SMTP (nodemailer) when SMTP_USER and SMTP_PASS are set. Without them it runs in preview mode:
// each message is saved under server/mail-outbox/ (html + json) and a short line, with the code, is printed to the console.
import fs from 'node:fs';
import nodemailer from 'nodemailer';

const OUTBOX = new URL('../mail-outbox/', import.meta.url);
const LOGO = new URL('./mail-assets/logo.png', import.meta.url);

let transport = null;
const smtpReady = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);
export const mailMode = () => (smtpReady() ? 'smtp' : 'preview');

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: String(process.env.SMTP_PASS).replace(/\s+/g, '') },
    });
  }
  return transport;
}

export const clientOrigin = () => String(process.env.CLIENT_ORIGIN || 'http://localhost:5174').replace(/\/$/, '');

/** Send one message built by a template. Returns {mode, ok, error?}. Never throws. */
export async function sendMail(to, msg) {
  const attachments = fs.existsSync(LOGO) ? [{ filename: 'sampada.png', path: LOGO, cid: 'sampada-logo' }] : [];
  if (!smtpReady()) {
    try {
      fs.mkdirSync(OUTBOX, { recursive: true });
      const stamp = `${Date.now()}-${msg.kind}-${String(to).replace(/[^a-z0-9@.]/gi, '_')}`;
      fs.writeFileSync(new URL(`${stamp}.json`, OUTBOX), JSON.stringify({ to, kind: msg.kind, subject: msg.subject, code: msg.code || null, html: msg.html }, null, 1));
      fs.writeFileSync(new URL(`${stamp}.html`, OUTBOX), msg.html.replace('cid:sampada-logo', fs.existsSync(LOGO) ? `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}` : ''));
    } catch { /* preview only */ }
    if (process.env.NODE_ENV !== 'production') console.log(`[mail preview] to ${to}: ${msg.subject}${msg.code ? ` (code ${msg.code})` : ''}`);
    return { mode: 'preview', ok: true };
  }
  try {
    await getTransport().sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'Hamro Prachin Sampada'}" <${process.env.SMTP_USER}>`,
      to, subject: msg.subject, text: msg.text, html: msg.html, attachments,
    });
    return { mode: 'smtp', ok: true };
  } catch (e) {
    console.error('[mail] send failed:', e.message);
    return { mode: 'smtp', ok: false, error: e.message };
  }
}
