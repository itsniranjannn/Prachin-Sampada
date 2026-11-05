// HTML emails in the site's palette: milk page, plum header, wine buttons, sand code tiles.
// Table layout with inline styles so Gmail, Outlook and phone clients all draw them the same way.
const C = { plum: '#381932', plum9: '#261024', wine: '#81021f', sand: '#f6ebcf', sandLine: '#c9b27a', milk: '#fff3e6', card: '#fffaf4', ink: '#261024', muted: '#6b5566', lilac: '#d2b8ff' };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Arial, Helvetica, sans-serif";
const NP = "'Noto Sans Devanagari', 'Mangal', 'Nirmala UI', Arial, sans-serif";

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = (name) => esc(String(name || 'friend').trim().split(/\s+/)[0]);

function codeTiles(code) {
  const cells = String(code).split('').map((d) => `<td width="46" height="58" align="center" style="width:46px;height:58px;background:${C.sand};border:1px solid ${C.sandLine};border-radius:10px;font:700 30px/58px ${SERIF};color:${C.wine}">${esc(d)}</td>`);
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 8px"><tr>${cells.join('<td width="8" style="width:8px">&nbsp;</td>')}</tr></table>`;
}

const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 6px"><tr><td align="center" bgcolor="${C.wine}" style="background:${C.wine};border-radius:999px"><a href="${esc(href)}" style="display:inline-block;padding:15px 34px;font:700 15px ${SANS};color:${C.milk};text-decoration:none;letter-spacing:.3px">${esc(label)}</a></td></tr></table>`;

/** The common frame: header with the mark, a decorative rule, the body and a footer with a verse. */
function frame({ preheader, eyebrow, title, titleNp, body, origin }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.milk}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.milk}">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.milk}" style="background:${C.milk}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;border-radius:22px;overflow:hidden;border:1px solid ${C.sandLine};background:${C.card}">
  <tr><td bgcolor="${C.plum}" style="background:${C.plum};padding:22px 28px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle" style="padding-right:14px"><img src="cid:sampada-logo" width="52" height="52" alt="" style="display:block;border:0"></td>
      <td valign="middle">
        <div style="font:400 15px/1.2 ${NP};color:${C.lilac}">हाम्रो प्राचीन</div>
        <div style="font:700 25px/1.1 ${SERIF};color:${C.milk};letter-spacing:3px;text-transform:uppercase">Sampada</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td height="4" style="height:4px;font-size:0;line-height:0;background:${C.wine};border-top:1px solid ${C.sandLine}">&nbsp;</td></tr>
  <tr><td style="padding:34px 34px 10px">
    <div style="font:700 11px ${SANS};letter-spacing:3px;text-transform:uppercase;color:${C.wine}">${esc(eyebrow)}</div>
    <h1 style="margin:10px 0 2px;font:600 30px/1.15 ${SERIF};color:${C.plum}">${title}</h1>
    <div style="font:400 17px/1.5 ${NP};color:${C.wine}">${titleNp}</div>
  </td></tr>
  <tr><td style="padding:6px 34px 30px;font:400 16px/1.65 ${SANS};color:${C.ink}">${body}</td></tr>
  <tr><td style="padding:0 34px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="1" style="height:1px;background:${C.sandLine};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
  <tr><td align="center" style="padding:22px 34px 8px;font:400 19px/1.6 ${NP};color:${C.plum}">असतो मा सद्गमय · तमसो मा ज्योतिर्गमय</td></tr>
  <tr><td align="center" style="padding:0 34px 26px;font:400 13px/1.5 ${SERIF};font-style:italic;color:${C.muted}">Lead me from darkness to light.</td></tr>
  <tr><td bgcolor="${C.plum9}" align="center" style="background:${C.plum9};padding:18px 28px;font:400 12px/1.6 ${SANS};color:#c9b5c4">
    Hamro Prachin Sampada &middot; heritage of Nepal, province by province<br>
    <a href="${esc(origin)}" style="color:${C.lilac};text-decoration:none">${esc(origin.replace(/^https?:\/\//, ''))}</a>
  </td></tr>
</table>
<div style="font:400 11px/1.6 ${SANS};color:${C.muted};padding:16px 20px;max-width:520px">This message was sent because someone used this address at Hamro Prachin Sampada. If that was not you, you can safely ignore it.</div>
</td></tr></table></body></html>`;
}

export function verifyEmail({ name, code, origin, minutes }) {
  return {
    kind: 'verify', code,
    subject: `${code} is your Sampada verification code`,
    text: `Namaste ${name},\n\nYour verification code is ${code}. It works for ${minutes} minutes.\n\nIf you did not create a Sampada passport, ignore this email.`,
    html: frame({
      origin, preheader: `Your verification code is ${code}`, eyebrow: 'Verify your email',
      title: `Namaste, ${first(name)}.`, titleNp: 'तपाईंको इमेल प्रमाणित गरौँ',
      body: `<p style="margin:12px 0 0">Welcome to your heritage passport. Enter this code on the verification page to confirm your email address.</p>
      ${codeTiles(code)}
      <p align="center" style="margin:0 0 4px;font:400 14px ${SANS};color:${C.muted}">The code works for ${minutes} minutes and only once.</p>
      <p align="center" style="margin:0;font:400 14px ${NP};color:${C.muted}">कोड ${minutes} मिनेटसम्म मात्र मान्य हुन्छ।</p>
      ${button(`${origin}/verify`, 'Open the verification page')}`,
    }),
  };
}

export function welcomeEmail({ name, origin }) {
  const tile = (n, t, d) => `<tr><td valign="top" width="46" style="padding:10px 0"><div style="width:34px;height:34px;border-radius:50%;background:${C.wine};color:${C.milk};font:700 14px/34px ${SERIF};text-align:center">${n}</div></td><td style="padding:10px 0"><div style="font:700 15px ${SANS};color:${C.plum}">${t}</div><div style="font:400 14px/1.55 ${SANS};color:${C.muted}">${d}</div></td></tr>`;
  return {
    kind: 'welcome',
    subject: 'Welcome to Hamro Prachin Sampada',
    text: `Namaste ${name},\n\nYour passport is ready. Explore: ${origin}/explore`,
    html: frame({
      origin, preheader: 'Your heritage passport is ready. Where will you stamp first?', eyebrow: 'Welcome',
      title: `Your passport is ready, ${first(name)}.`, titleNp: 'तपाईंको सम्पदा राहदानी तयार छ',
      body: `<p style="margin:12px 0 6px">Your email is confirmed. Temples, stupas, palaces and pilgrim sites in all seven provinces are waiting. A few ways to begin:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${tile('1', 'Open the story map', 'Pick any site, hear its story and turn its 3D model.')}
        ${tile('2', 'Stamp on site', 'Use GPS at the gate to fill your passport and earn badges like Tin Durbar and Saat Pradesh.')}
        ${tile('3', 'Play the quiz trail', 'Questions adapt to you, from New Explorer to Sampada Guru.')}
        ${tile('4', 'Race your friends', 'Open a live heritage hunt and share the code or QR.')}
      </table>
      ${button(`${origin}/explore`, 'Begin the yatra')}`,
    }),
  };
}

export function resetEmail({ name, code, origin, minutes }) {
  return {
    kind: 'reset', code,
    subject: `${code} is your Sampada password reset code`,
    text: `Namaste ${name},\n\nYour password reset code is ${code}. It works for ${minutes} minutes.\n\nIf you did not ask for this, ignore this email; your password stays as it is.`,
    html: frame({
      origin, preheader: `Your password reset code is ${code}`, eyebrow: 'Reset your password',
      title: 'Forgot your password?', titleNp: 'पासवर्ड बिर्सनुभयो?',
      body: `<p style="margin:12px 0 0">Namaste ${first(name)}, use this code with your new password on the reset page.</p>
      ${codeTiles(code)}
      <p align="center" style="margin:0 0 4px;font:400 14px ${SANS};color:${C.muted}">The code works for ${minutes} minutes and only once.</p>
      <p align="center" style="margin:0;font:400 14px ${NP};color:${C.muted}">यो कोड ${minutes} मिनेटसम्म मात्र मान्य हुन्छ।</p>
      ${button(`${origin}/forgot`, 'Open the reset page')}
      <p style="margin:18px 0 0;padding:14px 16px;border-radius:12px;background:${C.sand};font:400 14px/1.55 ${SANS};color:${C.plum}"><b>Did not ask for this?</b> Ignore this email. Your password stays exactly as it is.</p>`,
    }),
  };
}

export function passwordChangedEmail({ name, origin, when }) {
  return {
    kind: 'password-changed',
    subject: 'Your Sampada password was changed',
    text: `Namaste ${name},\n\nYour password was changed on ${when}. If this was not you, reset it now: ${origin}/forgot`,
    html: frame({
      origin, preheader: 'Your password was just changed.', eyebrow: 'Security notice',
      title: 'Your password was changed.', titleNp: 'तपाईंको पासवर्ड परिवर्तन भयो',
      body: `<p style="margin:12px 0 0">Namaste ${first(name)}, the password for your passport was changed on <b>${esc(when)}</b>. You can sign in with the new one right away.</p>
      <p style="margin:18px 0 0;padding:14px 16px;border-radius:12px;background:${C.sand};font:400 14px/1.55 ${SANS};color:${C.plum}"><b>Was this not you?</b> Reset your password now so nobody else can get in.</p>
      ${button(`${origin}/forgot`, 'Reset my password')}`,
    }),
  };
}
