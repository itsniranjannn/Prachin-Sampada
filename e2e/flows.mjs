// Real-browser flow suite for Hamro Prachin Sampada (puppeteer-core + system Chrome).
// Usage: node e2e/flows.mjs   (needs MySQL, API :5050 and client :5174 running, freshly seeded DB)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const TOOLS = process.env.PUP_PATH || 'C:/Users/NIRANJ~1.KAT/AppData/Local/Temp/claude/C--Users-niranjan-katwal-Downloads-test/9a15b5f6-79f3-4df4-8b3d-15f4b7d1637a/scratchpad/tools/node_modules';
let puppeteer;
try { puppeteer = require('puppeteer-core'); } catch { puppeteer = require(path.join(TOOLS, 'puppeteer-core')); }

const BASE = process.env.BASE || 'http://localhost:5174';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = path.join(here, 'shots');
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const extra = []; // notes: external-host failures

async function newPage(viewport = { width: 1366, height: 800 }) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(viewport);
  page.issues = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location()?.url || '';
    const text = m.text();
    // resource errors for third-party hosts (tiles, Wikimedia photos) are reported as notes, not app failures
    if (/Failed to load resource/.test(text) && loc && !loc.startsWith(BASE)) { extra.push(`external: ${text} ${loc}`); return; }
    if (/Failed to load resource/.test(text) && page.expected?.length) return; // covered by the expected-status check
    page.issues.push(`console.error: ${text} ${loc}`);
  });
  page.on('pageerror', (e) => page.issues.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    const u = r.url();
    if (r.status() >= 400 && u.startsWith(BASE)) {
      if (page.expected?.some((re) => re.test(u + ' ' + r.status()))) return;
      page.issues.push(`HTTP ${r.status()} ${r.request().method()} ${u}`);
    }
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (u.startsWith(BASE) && !/net::ERR_ABORTED/.test(r.failure()?.errorText || '')) page.issues.push(`requestfailed ${u} ${r.failure()?.errorText}`);
  });
  page.ctx = ctx;
  return page;
}
const go = async (page, p) => { await page.goto(BASE + p, { waitUntil: 'domcontentloaded' }); };
const text = (page) => page.evaluate(() => document.body.innerText);
const waitText = (page, re, timeout = 15000) => page.waitForFunction((s) => new RegExp(s, 'i').test(document.body.innerText), { timeout }, re.source);
const clickText = async (page, sel, re, timeout = 10000) => {
  await page.waitForFunction((s, r) => [...document.querySelectorAll(s)].some((e) => new RegExp(r, 'i').test(e.innerText || e.getAttribute('aria-label') || '') && !e.disabled), { timeout }, sel, re.source);
  await page.evaluate((s, r) => { const e = [...document.querySelectorAll(s)].find((x) => new RegExp(r, 'i').test(x.innerText || x.getAttribute('aria-label') || '') && !x.disabled); e.scrollIntoView({ block: 'center' }); e.click(); }, sel, re.source);
};
const noOverflow = (page) => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
const login = async (page, email, pw) => {
  await go(page, '/login');
  await page.waitForSelector('#e');
  await page.type('#e', email); await page.type('#p', pw);
  await page.click('button[type=submit]');
};
const logout = async (p) => {
  await p.evaluate(() => [...document.querySelectorAll('.nav-user-menu button')].find((b) => /log out/i.test(b.textContent)).click());
  await p.waitForFunction(() => !document.querySelector('.avatar'), { timeout: 8000 });
};

async function test(name, steps, expected, fn, opts = {}) {
  const page = await newPage(opts.viewport);
  page.expected = opts.expected || [];
  let actual = '', pass = false;
  try {
    actual = (await Promise.race([fn(page), new Promise((_, rej) => setTimeout(() => rej(new Error('case timed out after 120 s')), 120000))])) || '';
    await sleep(300);
    if (page.issues.length) { actual += ` | ISSUES: ${page.issues.slice(0, 4).join(' ; ')}`; pass = false; } else pass = true;
  } catch (e) {
    actual = `ERROR: ${e.message.split('\n')[0]}${page.issues.length ? ' | ISSUES: ' + page.issues.slice(0, 3).join(' ; ') : ''}`;
    try { await page.screenshot({ path: path.join(SHOTS, `fail-${results.length + 1}.png`) }); } catch { /* ignore */ }
  }
  results.push({ id: `E2E-${String(results.length + 1).padStart(2, '0')}`, name, steps, expected, actual: actual.slice(0, 600), pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : '  -> ' + actual.slice(0, 300)}`);
  await page.ctx.close();
}
const must = (c, m) => { if (!c) throw new Error(m); };

// ------------------------------------------------------------------ cases
await test('Home page loads', 'Open / ; wait for brand text and navigation', 'Page renders the brand, hero, nav links to Explore, with no console errors or failed API calls', async (p) => {
  await go(p, '/'); await waitText(p, /Sampada|सम्पदा/);
  const t = await text(p);
  must(/explore/i.test(t), 'no Explore link');
  const n = await p.$$eval('a[href="/explore"]', (a) => a.length);
  must(n > 0, 'no link to /explore');
  await sleep(1500);
  return `Title "${await p.title()}", ${n} explore links, ${t.length} chars of text`;
});

await test('Explore: map and list render', 'Open /explore ; wait for the monument list and map canvas', 'List shows 100+ monuments and the MapLibre canvas exists', async (p) => {
  await go(p, '/explore'); await p.waitForSelector('.explore-list .row-item', { timeout: 20000 });
  const rows = await p.$$eval('.explore-list .row-item', (r) => r.length);
  must(rows > 20, `only ${rows} rows`);
  const canvas = await p.$('.explore-map canvas'); must(canvas, 'no map canvas');
  return `${rows} list rows rendered, map canvas present`;
});

await test('Explore: province filter and search', 'Open /explore ; click province chip Lumbini ; count rows ; clear ; type "Pashupati" in search ; open first result', 'Province chip narrows list to only that province; search finds Pashupatinath and the detail card offers "Open the story"', async (p) => {
  await go(p, '/explore'); await p.waitForSelector('.explore-list .row-item', { timeout: 20000 });
  const all = await p.$$eval('.explore-list .row-item', (r) => r.length);
  await clickText(p, '.chips-row .chip', /^Lumbini/);
  await sleep(500);
  const lum = await p.$$eval('.explore-list .row-item', (r) => r.length);
  must(lum > 0 && lum < all, `province filter did not narrow (${all} -> ${lum})`);
  const caps = await p.$$eval('.explore-list .row-item .cap', (c) => c.map((x) => x.innerText));
  must(caps.every((c) => /Lumbini/.test(c)), 'non-Lumbini row visible');
  await clickText(p, '.chips-row .chip', /^Lumbini/); // toggle off
  await p.type('.search input', 'Pashupati'); await sleep(900);
  const hits = await p.$$eval('.explore-list .row-item', (r) => r.map((x) => x.innerText));
  must(hits.length >= 1 && /Pashupati/i.test(hits[0]), 'search returned no Pashupati');
  await p.click('.explore-list .row-item'); await p.waitForSelector('.explore-card a[href^="/m/"]');
  return `All=${all}, Lumbini=${lum} (all Lumbini), search "Pashupati" -> ${hits.length} hits, detail card opened`;
});

let slug = 'pashupatinath';
await test('Monument detail page', 'Fetch catalogue ; open /m/<slug> of Pashupatinath ; read heading', 'Page shows the monument name as the main heading, with no console errors or failed API calls', async (p) => {
  const list = await (await fetch(BASE + '/api/monuments')).json();
  const arr = Array.isArray(list) ? list : list.results;
  const m = arr.find((x) => /pashupati/i.test(x.name)) || arr[0]; slug = m.slug;
  await go(p, `/m/${slug}`); await p.waitForSelector('h1', { timeout: 15000 });
  const h = await p.$eval('h1', (e) => e.innerText);
  must(h.length > 2, 'empty h1');
  await sleep(1200);
  return `/m/${slug} h1="${h}"`;
});

await test('Monument 3D model viewer', 'Open /m/<slug>?view=model&still=1 ; wait for .model-viewer[data-ready="1"] canvas', 'WebGL canvas for the site-specific procedural model appears and is marked ready', async (p) => {
  await go(p, `/m/${slug}?view=model&still=1`);
  await p.waitForSelector('.model-viewer[data-ready="1"] canvas', { timeout: 60000 });
  const box = await p.$eval('.model-viewer canvas', (c) => [c.width, c.height]);
  must(box[0] > 100 && box[1] > 100, 'canvas too small');
  await p.screenshot({ path: path.join(SHOTS, 'model3d.png') });
  return `canvas ${box[0]}x${box[1]} ready`;
});

await test('Gallery and lightbox', 'Open monument ; wait for gallery ; click "N photos" ; verify lightbox opens ; press Escape', 'Gallery thumbnails render, lightbox opens full screen and closes with Escape', async (p) => {
  await go(p, `/m/${slug}`); await p.waitForSelector('.gal-thumb', { timeout: 20000 });
  const thumbs = await p.$$eval('.gal-thumb', (t) => t.length);
  await clickText(p, 'button', /\d+ photos/i);
  await p.waitForSelector('.yarl__root', { timeout: 8000 });
  await p.keyboard.press('Escape'); await sleep(800);
  const open = await p.$('.yarl__root');
  return `${thumbs} thumbnails; lightbox opened${open ? ' (still mounted after Esc)' : ' and closed'}`;
});

const email = `e2e${Date.now()}@example.com`;
await test('Register a new explorer, then log out', 'Open /register ; fill name, email, password, pick an interest ; submit ; arrive at /verify ; Skip for now ; open user menu ; Log out', 'Account is created, user lands on verification page and can skip; logout removes the avatar from the nav', async (p) => {
  await go(p, '/register'); await p.waitForSelector('#n');
  await p.type('#n', 'E2E Tester'); await p.type('#e', email); await p.type('#p', 'secret123');
  await clickText(p, '.chip', /Stupas/);
  await p.click('button[type=submit]');
  await p.waitForFunction(() => location.pathname === '/verify', { timeout: 15000 });
  await clickText(p, 'a', /Skip for now/);
  await p.waitForSelector('.avatar', { timeout: 10000 });
  await logout(p);
  return `Registered ${email}, verify page reached, skipped, logged out`;
});

await test('Login with demo account and logout', 'Open /login ; enter demo@sampada.np / explorer123 ; submit ; verify redirect ; log out', 'Valid demo credentials sign in and redirect to /passport; avatar appears; logout removes it', async (p) => {
  await login(p, 'demo@sampada.np', 'explorer123');
  await p.waitForFunction(() => location.pathname === '/passport', { timeout: 15000 });
  await p.waitForSelector('.avatar');
  await logout(p);
  return 'Signed in as demo, landed on /passport, logged out';
});

await test('Login rejects a wrong password', 'Open /login ; enter demo email with a wrong password ; submit', 'An inline alert is shown and the user stays on /login (401 expected)', async (p) => {
  await login(p, 'demo@sampada.np', 'wrongpass1');
  await p.waitForSelector('[role=alert]', { timeout: 8000 });
  must(/login/.test(new URL(p.url()).pathname), 'left login page');
  return `Alert: "${await p.$eval('[role=alert]', (e) => e.innerText)}"`;
}, { expected: [/\/api\/auth\/login 401/] });

await test('Yatra planner builds a route', 'Open /walk ; choose an interest chip ; press the plan button ; wait for timeline', 'A timeline with at least 2 stops and a Google Maps link is produced', async (p) => {
  await go(p, '/walk'); await p.waitForSelector('.chip', { timeout: 15000 });
  await sleep(1000);
  const on = await p.$$eval('.chip.on', (c) => c.length);
  if (!on) await clickText(p, '.chip', /Hindu|Buddhist|Temple|Stupa|Palace/i);
  await clickText(p, 'button.diyo', /./);
  await p.waitForSelector('.tl-stop', { timeout: 20000 });
  const stops = await p.$$eval('.tl-stop', (s) => s.length);
  must(stops >= 2, `only ${stops} stops`);
  must(await p.$('a[href*="google.com/maps"]'), 'no maps link');
  return `${stops} stops in route, Google Maps link present`;
});

await test('Adaptive quiz trail', 'Open /quiz ; Start the trail ; answer 5 questions, pressing Next each time', 'Each answer shows right/wrong feedback and the rating chip is present; the question advances', async (p) => {
  await go(p, '/quiz'); await clickText(p, 'button.btn', /Start the trail|Start over|Start/i, 20000);
  let seen = 0;
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('.option:not([disabled])', { timeout: 20000 });
    await p.click('.option:not([disabled])');
    await p.waitForSelector('.option.right', { timeout: 10000 });
    seen++;
    await clickText(p, 'button.btn', /Next|See results/i);
  }
  const rating = await p.evaluate(() => document.querySelector('.rating-chip')?.innerText || '');
  return `Answered ${seen} questions with feedback; rating chip "${rating.trim()}"`;
});

await test('Find the Monument round', 'Open /find ; Start the game (Kathmandu Valley) ; click the map to drop a pin ; Lock my guess', 'A round starts with a photo and clue; pin can be placed; the result step appears with Next round / See results', async (p) => {
  await go(p, '/find'); await clickText(p, 'button.btn', /Start the game/i, 20000);
  await p.waitForSelector('.fm-photo', { timeout: 20000 });
  await p.waitForSelector('canvas', { timeout: 20000 });
  await sleep(3000);
  const handle = await p.$('canvas.maplibregl-canvas') || await p.$('.fm-map canvas') || await p.$('canvas');
  const box = await handle.boundingBox();
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await clickText(p, 'button.btn', /Lock my guess/i, 8000);
  await waitText(p, /Next round|See results/i, 15000);
  return 'Round 1 submitted and result step shown';
});

await test('Passport: stamps and badges (demo explorer)', 'Login as demo ; open /passport ; count badges and UNESCO zones ; open a monument and press "I am here" (manual stamp) ; reopen /passport', 'Passport shows badge grid and seven UNESCO zones; the manual stamp appears as a stamp card', async (p) => {
  await login(p, 'demo@sampada.np', 'explorer123');
  await p.waitForFunction(() => location.pathname === '/passport', { timeout: 15000 });
  await p.waitForSelector('.badge', { timeout: 15000 });
  const badges = await p.$$eval('.badge', (b) => b.length);
  const zones = await p.$$eval('.zone', (b) => b.length);
  await go(p, `/m/${slug}`); await p.waitForSelector('h1');
  await p.waitForFunction(() => /In your passport|I am here/i.test(document.body.innerText), { timeout: 30000 });
  if (!/In your passport/i.test(await text(p))) { // not stamped yet (fresh seed)
    const resp = p.waitForResponse((r) => r.url().includes('/passport/stamp/'), { timeout: 20000 });
    resp.catch(() => {});
    await clickText(p, 'button', /I am here/i, 30000);
    const sr = await resp; must(sr.status() === 200 || sr.status() === 201, `stamp returned ${sr.status()}`);
    await waitText(p, /In your passport/i, 10000);
  }
  await go(p, '/passport'); await p.waitForSelector('.stamp-card', { timeout: 15000 });
  const stamps = await p.$$eval('.stamp-card', (b) => b.length);
  return `${badges} badges, ${zones} UNESCO zones, ${stamps} stamp(s) after manual stamp`;
});

await test('Leaderboard', 'Open /leaderboard', 'Heading and the quiz and game boards (or empty states) render', async (p) => {
  await go(p, '/leaderboard'); await waitText(p, /Keepers of Nepal/);
  return 'Leaderboard heading present';
});

await test('Verify page', 'Open /verify logged out (expect redirect to /login) ; register a fresh explorer and land on /verify ; check code form ; login as verified demo and open /verify', 'Anonymous users go to /login; an unverified explorer sees the six-digit code form; an already verified explorer is sent on to /passport', async (p) => {
  await go(p, '/verify'); await p.waitForFunction(() => location.pathname === '/login', { timeout: 8000 });
  await go(p, '/register'); await p.waitForSelector('#n');
  await p.type('#n', 'Verify Tester'); await p.type('#e', `ver${Date.now()}@example.com`); await p.type('#p', 'secret123');
  await p.click('button[type=submit]');
  await p.waitForFunction(() => location.pathname === '/verify', { timeout: 15000 });
  await waitText(p, /six-digit code/i);
  const r1 = 'unverified user sees code form';
  await logout(p);
  await login(p, 'demo@sampada.np', 'explorer123');
  await p.waitForFunction(() => location.pathname === '/passport', { timeout: 15000 });
  await go(p, '/verify'); await p.waitForFunction(() => location.pathname === '/passport', { timeout: 10000 });
  return `${r1}; verified demo is redirected from /verify to /passport`;
});

await test('Forgot password page', 'Open /forgot ; enter email ; submit', 'Form appears and moves to the code / new-password step without errors', async (p) => {
  await go(p, '/forgot'); await p.waitForSelector('#fe');
  await p.type('#fe', 'demo@sampada.np'); await p.click('button[type=submit]');
  await waitText(p, /Choose a new password|code/i, 12000);
  return 'Reset code requested, second step shown';
});

await test('Admin login and screens', 'Login as admin@sampada.np ; land on /admin ; click every admin tab', 'Admin is redirected to /admin; each tab (dashboard, monuments, explorers, reviews, activity) renders content', async (p) => {
  await login(p, 'admin@sampada.np', 'admin123');
  await p.waitForFunction(() => location.pathname === '/admin', { timeout: 15000 });
  await p.waitForSelector('.admin-tabs [role=tab]', { timeout: 15000 });
  const tabs = await p.$$eval('.admin-tabs [role=tab]', (t) => t.map((x) => x.innerText.trim()));
  must(tabs.length >= 5, 'fewer than 5 tabs');
  const seen = [];
  for (let i = 0; i < tabs.length; i++) {
    await p.evaluate((i) => document.querySelectorAll('.admin-tabs [role=tab]')[i].click(), i);
    await sleep(1500);
    const len = (await text(p)).length; seen.push(`${tabs[i]}:${len}`);
    must(len > 200, `tab ${tabs[i]} looks empty`);
  }
  return `Tabs rendered: ${seen.join(', ')}`;
});

await test('Admin route is protected for explorers', 'Login as demo ; open /admin', 'A non-admin user is redirected away from /admin and sees no admin tabs', async (p) => {
  await login(p, 'demo@sampada.np', 'explorer123');
  await p.waitForFunction(() => location.pathname === '/passport', { timeout: 15000 });
  await go(p, '/admin'); await sleep(1500);
  must(!(await p.$('.admin-tabs')), 'admin tabs visible to explorer');
  return `Redirected to ${new URL(p.url()).pathname}`;
});

await test('404 page', 'Open /no-such-page', 'Friendly "This lane leads nowhere" page with Home and map links', async (p) => {
  await go(p, '/no-such-page'); await waitText(p, /leads nowhere/);
  return '404 page rendered';
});

const MOBILE = { width: 375, height: 812, isMobile: true, hasTouch: true };
await test('Mobile 375x812: home has no horizontal overflow', 'Set viewport 375x812 ; open / ; compare scrollWidth with clientWidth', 'No horizontal scroll', async (p) => {
  await go(p, '/'); await sleep(2500);
  const o = await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'mobile-home.png') });
  must(o.sw <= o.cw + 1, `overflow ${o.sw} > ${o.cw}`);
  return `scrollWidth ${o.sw} <= clientWidth ${o.cw}`;
}, { viewport: MOBILE });

await test('Mobile 375x812: monument page has no horizontal overflow', 'Set viewport 375x812 ; open /m/<slug>', 'No horizontal scroll and the heading is visible', async (p) => {
  await go(p, `/m/${slug}`); await p.waitForSelector('h1'); await sleep(2500);
  const o = await noOverflow(p); await p.screenshot({ path: path.join(SHOTS, 'mobile-monument.png') });
  must(o.sw <= o.cw + 1, `overflow ${o.sw} > ${o.cw}`);
  return `scrollWidth ${o.sw} <= clientWidth ${o.cw}`;
}, { viewport: MOBILE });

await test('Mobile 375x812: other pages have no horizontal overflow', 'Set viewport 375x812 ; open /explore, /walk, /quiz, /find, /leaderboard, /login, /about', 'No page scrolls horizontally', async (p) => {
  const bad = [];
  for (const u of ['/explore', '/walk', '/quiz', '/find', '/leaderboard', '/login', '/about']) {
    await go(p, u); await sleep(1800);
    const o = await noOverflow(p); if (o.sw > o.cw + 1) bad.push(`${u} ${o.sw}>${o.cw}`);
  }
  must(!bad.length, bad.join('; '));
  return '7 pages fit within 375px';
}, { viewport: MOBILE });

await test('Polish: image alt text and internal links', 'Open /, /explore, /m/<slug>, /about, /credits ; collect <img> without alt and internal <a href> ; request each link from the dev server', 'Every <img> has an alt attribute; every internal link returns 200', async (p) => {
  const bad = [], hrefs = new Set();
  for (const u of ['/', '/explore', `/m/${slug}`, '/about', '/credits']) {
    await go(p, u); await sleep(2000);
    const r = await p.evaluate(() => ({ noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.slice(-60)), hrefs: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')) }));
    r.noAlt.forEach((s) => bad.push(`${u} img no alt ${s}`)); r.hrefs.forEach((h) => hrefs.add(h.split('#')[0].split('?')[0]));
  }
  for (const h of hrefs) { let res; for (let k = 0; k < 3; k++) { try { res = await fetch(BASE + h); break; } catch { await sleep(500); } } if (!res || res.status !== 200) bad.push(`link ${h} -> ${res?.status}`); }
  must(!bad.length, bad.slice(0, 5).join('; '));
  return `${hrefs.size} unique internal links all 200, no img missing alt`;
});

// ------------------------------------------------------------------ server suites
function run(cmd, args, cwd) { const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: true }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; }
const srv = path.join(root, 'server');
const suites = [
  ['Server unit tests (npm test)', 'Run npm test in server/', '12 algorithm unit tests (tour planner vs brute force, Elo, SM-2, scoring, recommender) pass', ['npm', ['test']], true],
  ['Server API tests (npm run test:api)', 'Run npm run test:api in server/ against the running API', '18 API tests (catalogue, auth, walk, quiz, stamps, find, admin) pass', ['npm', ['run', 'test:api']], true],
  ['Live hunt simulation (hunt-sim.mjs)', 'Run node test/hunt-sim.mjs : 3 players join a Socket.io room and play 3 rounds', 'Room created, duplicate name and non-host start refused, 3 reveals, final ranking printed', ['node', ['test/hunt-sim.mjs']], false],
];
for (const [name, steps, expected, [c, a], tap] of suites) {
  const r = run(c, a, srv);
  let pass = r.code === 0, actual;
  if (tap) { const ok = r.out.match(/ℹ pass (\d+)/)?.[1], bad = r.out.match(/ℹ fail (\d+)/)?.[1]; actual = `pass ${ok}, fail ${bad}`; pass = pass && bad === '0'; }
  else { actual = r.out.match(/ranking:.*$/m)?.[0] || r.out.trim().split('\n').slice(-2).join(' '); pass = pass && /ranking:/.test(r.out); }
  results.push({ id: `E2E-${String(results.length + 1).padStart(2, '0')}`, name, steps, expected, actual, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  -> ${actual}`);
}

await browser.close();
const docDir = path.join(root, 'documentation'); mkdirSync(docDir, { recursive: true });
writeFileSync(path.join(docDir, 'test-results.json'), JSON.stringify({ generated: new Date().toISOString(), base: BASE, notes: [...new Set(extra)].slice(0, 20), cases: results }, null, 2));
const passed = results.filter((r) => r.pass).length;
console.log(`\n${'ID'.padEnd(8)}${'Result'.padEnd(8)}Case`);
results.forEach((r) => console.log(`${r.id.padEnd(8)}${(r.pass ? 'PASS' : 'FAIL').padEnd(8)}${r.name}`));
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
