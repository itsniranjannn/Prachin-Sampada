// Modern, responsive email templates designed with Nepal heritage aesthetics
// Palette: deep plum, royal gold, terracotta crimson, warm milk cream, rich dark cards
const C = {
  plum: '#2d142c',
  plumDeep: '#1d0b1d',
  gold: '#d4af37',
  goldLight: '#f3e5ab',
  goldLine: '#c59b27',
  wine: '#81021f',
  wineHover: '#a3082b',
  cream: '#fff8f0',
  card: '#ffffff',
  sand: '#fbf4ea',
  sandLine: '#ebd9c3',
  ink: '#261024',
  muted: '#685464',
  lightMuted: '#968192',
};

const SERIF = "Playfair Display, 'Noto Serif Devanagari', Georgia, serif";
const SANS = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const NP = "'Noto Sans Devanagari', 'Mukta', 'Mangal', sans-serif";

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = (name) => esc(String(name || 'मित्र').trim().split(/\s+/)[0]);

function codeTiles(code) {
  const cells = String(code).split('').map((d) => `
    <td width="48" height="60" align="center" style="width:48px;height:60px;background:#ffffff;border:2px solid ${C.goldLine};border-radius:12px;font:700 32px/60px ${SERIF};color:${C.wine};box-shadow:0 4px 12px rgba(129,2,31,0.08);letter-spacing:1px">${esc(d)}</td>
  `);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 14px">
      <tr>${cells.join('<td width="10" style="width:10px">&nbsp;</td>')}</tr>
    </table>
  `;
}

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px">
    <tr>
      <td align="center" bgcolor="${C.wine}" style="background:linear-gradient(135deg, ${C.wine} 0%, #a3082b 100%);border-radius:30px;box-shadow:0 6px 18px rgba(129,2,31,0.25)">
        <a href="${esc(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 38px;font:700 15px/1.2 ${SANS};color:#ffffff;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase">${esc(label)} &rarr;</a>
      </td>
    </tr>
  </table>
`;

/** The common responsive email frame */
function frame({ preheader, eyebrow, title, titleNp, body, origin }) {
  const webOrigin = origin || 'https://hamroprachinsampada.vercel.app';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.sand};font-family:${SANS};-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.sand}">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.sand}" style="background-color:${C.sand};padding:32px 12px">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;border-radius:24px;overflow:hidden;background-color:${C.card};box-shadow:0 12px 36px rgba(45,20,44,0.08);border:1px solid ${C.sandLine}">
          
          <!-- Header Banner -->
          <tr>
            <td bgcolor="${C.plum}" style="background:linear-gradient(135deg, ${C.plumDeep} 0%, ${C.plum} 100%);padding:28px 36px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="58" valign="middle" style="padding-right:16px">
                    <img src="cid:sampada-logo" width="54" height="54" alt="Hamro Prachin Sampada" style="display:block;border:0;border-radius:12px">
                  </td>
                  <td valign="middle">
                    <div style="font:500 14px/1.3 ${NP};color:${C.goldLight};letter-spacing:1px">हाम्रो प्राचीन सम्पदा</div>
                    <div style="font:800 24px/1.1 ${SERIF};color:#ffffff;letter-spacing:2px;text-transform:uppercase">PRACHIN SAMPADA</div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:5px 12px;background:rgba(212,175,55,0.15);border:1px solid ${C.gold};border-radius:20px;font:600 11px ${SANS};color:${C.goldLight};letter-spacing:1px;text-transform:uppercase">NEPAL HERITAGE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold Accent Bar -->
          <tr>
            <td height="5" style="height:5px;font-size:0;line-height:0;background:linear-gradient(90deg, ${C.wine} 0%, ${C.gold} 50%, ${C.wine} 100%)">&nbsp;</td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 36px 12px">
              <div style="display:inline-block;padding:4px 10px;background:${C.sand};border-radius:6px;font:700 11px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.wine}">
                ${esc(eyebrow)}
              </div>
              <h1 style="margin:16px 0 4px;font:700 28px/1.25 ${SERIF};color:${C.plum}">${title}</h1>
              <div style="font:500 17px/1.5 ${NP};color:${C.wine}">${titleNp}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 36px 34px;font:400 16px/1.7 ${SANS};color:${C.ink}">
              ${body}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td height="1" style="height:1px;background-color:${C.sandLine};font-size:0;line-height:0">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Sanskrit Benediction / Cultural Shloka -->
          <tr>
            <td align="center" style="padding:24px 36px 6px">
              <div style="font:600 17px/1.6 ${NP};color:${C.plum}">
                ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय ।
              </div>
              <div style="font:400 13px/1.5 ${SERIF};font-style:italic;color:${C.muted};margin-top:4px">
                "Lead me from darkness to light, from ignorance to truth."
              </div>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td bgcolor="${C.plumDeep}" align="center" style="background-color:${C.plumDeep};padding:22px 28px;border-top:1px solid #3c193b">
              <p style="margin:0 0 6px;font:600 13px ${SANS};color:#ffffff;letter-spacing:0.5px">
                Hamro Prachin Sampada &middot; Explore Nepal's Living Heritage
              </p>
              <p style="margin:0 0 10px;font:400 12px ${SANS};color:${C.lightMuted}">
                Preserving & Celebrating 7 Provinces &middot; Temples &middot; Stupas &middot; Durbar Squares
              </p>
              <a href="${esc(webOrigin)}" target="_blank" rel="noopener noreferrer" style="font:600 12px ${SANS};color:${C.gold};text-decoration:none;padding:4px 12px;border:1px solid rgba(212,175,55,0.4);border-radius:15px">
                ${esc(webOrigin.replace(/^https?:\/\//, ''))}
              </a>
            </td>
          </tr>

        </table>

        <!-- Unsubscribe / Disclaimer -->
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px">
          <tr>
            <td align="center" style="font:400 11px/1.6 ${SANS};color:${C.muted};padding:20px 24px 0">
              This message was sent from <b>Hamro Prachin Sampada</b> to verify or update your heritage passport. If you didn't initiate this request, you can safely ignore this email.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
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

export function welcomeEmail({ name, origin, provider = 'email' }) {
  const isGoogle = provider === 'google';
  const tile = (n, t, d) => `<tr><td valign="top" width="46" style="padding:10px 0"><div style="width:34px;height:34px;border-radius:50%;background:${C.wine};color:#ffffff;font:700 14px/34px ${SERIF};text-align:center">${n}</div></td><td style="padding:10px 0"><div style="font:700 15px ${SANS};color:${C.plum}">${t}</div><div style="font:400 14px/1.55 ${SANS};color:${C.muted}">${d}</div></td></tr>`;
  return {
    kind: 'welcome',
    subject: isGoogle ? 'Namaste! Welcome to Hamro Prachin Sampada' : 'Welcome to Hamro Prachin Sampada',
    text: `Namaste ${name},\n\nYour heritage passport is ready! Start exploring Nepal's ancient monuments: ${origin}/explore`,
    html: frame({
      origin, preheader: 'Your heritage passport is ready. Where will you stamp first?', eyebrow: isGoogle ? 'Connected with Google' : 'Welcome to Sampada',
      title: `Welcome, ${first(name)}!`, titleNp: 'तपाईंको सम्पदा यात्रा सुरु भयो',
      body: `<p style="margin:12px 0 10px;font:400 16px/1.65 ${SANS};color:${C.ink}">
        Namaste <b>${esc(name)}</b>, your heritage passport has been successfully created ${isGoogle ? 'using your Google account' : ''}.
        Temples, stupas, palaces, and sacred pilgrim sites across all seven provinces of Nepal are now at your fingertips.
      </p>
      
      <div style="background-color:${C.sand};border-left:4px solid ${C.gold};padding:14px 18px;border-radius:0 12px 12px 0;margin:18px 0 24px">
        <div style="font:700 14px ${SANS};color:${C.plum}">Your Explorer Passport is Active</div>
        <div style="font:400 13px/1.5 ${SANS};color:${C.muted}">Track your heritage stamps, unlock ancient badges, and test your knowledge.</div>
      </div>

      <div style="font:700 13px ${SANS};text-transform:uppercase;letter-spacing:1.5px;color:${C.wine};margin:20px 0 8px">Four Ways to Begin Your Journey:</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${tile('1', '3D Interactive Landmarks', 'Interact with high-detail 3D models and read rich historical narratives.')}
        ${tile('2', 'GPS Passport Stamps', 'Visit sites physically to unlock digital badges like Tin Durbar and Saat Pradesh.')}
        ${tile('3', 'Adaptive Heritage Quiz', 'Progress from New Explorer to Sampada Guru with Elo-rated trivia.')}
        ${tile('4', 'Live Scavenger Hunts', 'Host real-time multiplayer scavenger hunts with friends via room codes.')}
      </table>
      ${button(`${origin}/explore`, 'Start Exploring Nepal')}`,
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
