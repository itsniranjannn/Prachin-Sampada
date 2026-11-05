// Defense slides (10) for Hamro Prachin Sampada. Output: ../Sampada_Defense_Slides.pptx
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const DOC = path.join(here, '..');
const F = (n) => path.join(DOC, 'figures', `${n}.png`); const S = (n) => path.join(DOC, 'screens', `${n}.png`);
let T = { total: 0, pass: 0, fail: 0, cases: 0 };
try { const j = JSON.parse(fs.readFileSync(path.join(DOC, 'test-results.json'), 'utf8')); const arr = Array.isArray(j) ? j : j.cases || j.results || []; T.cases = arr.length; T.pass = arr.filter((c) => c.pass === true || c.pass === 'PASS').length; T.fail = T.cases - T.pass; } catch { /* optional */ }

const C = { plum: '4A1D4F', wine: '8C1C3B', persian: '1C6B72', lilac: 'B9A5D6', milk: 'FAF6EF', ink: '2B2330', soft: 'EDE6F4' };
const HEAD = 'Georgia', BODY = 'Calibri';
const p = new pptxgen(); p.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
p.author = 'Niranjan Katwal'; p.title = 'Hamro Prachin Sampada - Project defense';

function base(title, n) {
  const s = p.addSlide(); s.background = { color: C.milk };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.14, fill: { color: C.plum }, line: { color: C.plum } });
  s.addText(title, { x: 0.6, y: 0.35, w: 12, h: 0.8, fontFace: HEAD, fontSize: 30, bold: true, color: C.plum, margin: 0 });
  s.addShape(p.ShapeType.line, { x: 0.6, y: 1.2, w: 1.4, h: 0, line: { color: C.wine, width: 3 } });
  s.addText(`Hamro Prachin Sampada  |  Niranjan Katwal  |  ${n}`, { x: 0.6, y: 7.05, w: 12, h: 0.3, fontFace: BODY, fontSize: 10, color: '6B5F73', margin: 0 });
  return s;
}
const bullets = (s, items, o = {}) => s.addText(items.map((t) => ({ text: t, options: { bullet: { indent: 18 }, breakLine: true, paraSpaceAfter: 8 } })), { x: o.x ?? 0.6, y: o.y ?? 1.5, w: o.w ?? 6, h: o.h ?? 5, fontFace: BODY, fontSize: o.size ?? 18, color: C.ink, valign: 'top', margin: 0 });
const img = (s, file, x, y, w, h) => { if (fs.existsSync(file)) s.addImage({ path: file, x, y, sizing: { type: 'contain', w, h } }); else s.addText('[image pending]', { x, y, w, h, fontSize: 14, color: C.wine, align: 'center' }); };
const note = (s, t) => s.addNotes(t);

// 1 title
{
  const s = p.addSlide(); s.background = { color: C.plum };
  s.addShape(p.ShapeType.rect, { x: 0, y: 6.6, w: 13.33, h: 0.9, fill: { color: C.wine }, line: { color: C.wine } });
  s.addText('हाम्रो प्राचीन सम्पदा', { x: 0.8, y: 1.0, w: 11.5, h: 0.8, fontFace: HEAD, fontSize: 28, color: C.lilac, margin: 0 });
  s.addText('Hamro Prachin Sampada', { x: 0.8, y: 1.8, w: 11.5, h: 1.2, fontFace: HEAD, fontSize: 54, bold: true, color: 'FFFFFF', margin: 0 });
  s.addText('A 3D heritage explorer and quiz game for Nepal', { x: 0.8, y: 3.1, w: 11.5, h: 0.6, fontFace: BODY, fontSize: 24, color: C.soft, margin: 0 });
  s.addText('BCA Project III (CACS452)  |  Tribhuvan University  |  Pashupati Multiple Campus', { x: 0.8, y: 4.6, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 16, color: C.lilac, margin: 0 });
  s.addText('Niranjan Katwal  |  Symbol No. 27802063  |  Reg. No. 6-2-278-18-2022', { x: 0.8, y: 5.1, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 16, color: 'FFFFFF', margin: 0 });
  s.addText('Supervisor: ______________________', { x: 0.8, y: 6.8, w: 8, h: 0.4, fontFace: BODY, fontSize: 14, color: 'FFFFFF', margin: 0 });
  note(s, 'Introduce yourself and the project: a free bilingual web app for exploring Nepal\'s heritage, with a 3D model for every site and games on top.');
}
// 2 problem and objectives
{
  const s = base('Problem and objectives', 2);
  s.addText('The problem', { x: 0.6, y: 1.45, w: 5.8, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: C.wine, margin: 0 });
  bullets(s, ['Heritage information is scattered across books, photo pages and tourism sites', 'Few sites can be seen in 3D, and none are playable', 'Young learners get no feedback, no goals and no way to play together', 'Little of it is bilingual or free of cost'], { y: 1.95, w: 5.8, h: 4.5, size: 17 });
  s.addText('Objectives', { x: 7.0, y: 1.45, w: 5.7, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: C.persian, margin: 0 });
  bullets(s, ['Cover 116 verified sites in all 7 provinces', 'Give every site a 3D model, a story and photographs', 'Plan a yatra route inside a time budget', 'Teach with an adaptive quiz, photo game and live hunts', 'Run in a normal browser at zero cost'], { x: 7.0, y: 1.95, w: 5.7, h: 4.5, size: 17 });
  note(s, 'State the gap in one breath, then map each objective to a feature shown later.');
}
// 3 features
{
  const s = base('What the system does', 3);
  const cards = [['Explore', 'MapLibre map, provinces, search, bilingual stories, photo gallery'], ['3D models', 'One hand-built low-poly model per site, day and dusk lighting'], ['Yatra planner', 'Best route through chosen sites within your time, walk or taxi'], ['Adaptive quiz', '1,160 questions, Elo difficulty, spaced repetition for misses'], ['Find the Monument', 'Guess on the map; score by distance and speed'], ['Live hunts', 'Multiplayer rooms, server-timed rounds, leaderboard']];
  cards.forEach(([h, d], i) => {
    const x = 0.6 + (i % 3) * 4.1, y = 1.6 + Math.floor(i / 3) * 2.6;
    s.addShape(p.ShapeType.roundRect, { x, y, w: 3.9, h: 2.35, fill: { color: i % 2 ? C.soft : 'FFFFFF' }, line: { color: C.lilac, width: 1 }, rectRadius: 0.12 });
    s.addText(h, { x: x + 0.25, y: y + 0.2, w: 3.4, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: i % 2 ? C.wine : C.plum, margin: 0 });
    s.addText(d, { x: x + 0.25, y: y + 0.85, w: 3.4, h: 1.3, fontFace: BODY, fontSize: 15, color: C.ink, valign: 'top', margin: 0 });
  });
  note(s, 'Also: recommender, heritage passport with GPS stamps and badges, leaderboard, email.');
}
// 4 architecture
{
  const s = base('Architecture and technology', 4);
  img(s, F('architecture'), 0.5, 1.45, 7.6, 5.4);
  bullets(s, ['Client: React 18, Vite, React Router, Framer Motion', '3D: three.js, React Three Fiber, per-site files loaded on demand', 'Server: Express 4 REST API, Socket.io for live hunts', 'Data: MySQL 8.4, 116 sites, 1,160 questions, 696 clues', 'Security: JWT, bcrypt, server-held quiz answers'], { x: 8.4, y: 1.6, w: 4.5, h: 5, size: 16 });
  note(s, 'Three tiers. Answers to quiz and find rounds never leave the server until a round is scored.');
}
// 5 algorithms
{
  const s = base('Algorithms behind the games', 5);
  const rows = [['Yatra planner', 'Orienteering problem with time windows: greedy value-per-minute insertion, 2-opt, re-insertion'], ['Adaptive quiz', 'Elo rating for player and question, next question near 70% predicted success; SM-2 for misses'], ['Find the Monument', 'Haversine distance, exponential distance score plus speed bonus'], ['Live hunt', 'Socket.io rooms, 6-letter codes, server-timed rounds, points then time'], ['Recommender', 'Tag cosine, Bayesian rating, novelty, nearness, city diversity re-ranking']];
  rows.forEach(([h, d], i) => {
    const y = 1.55 + i * 1.05;
    s.addShape(p.ShapeType.rect, { x: 0.6, y, w: 0.12, h: 0.85, fill: { color: [C.wine, C.persian, C.plum, C.wine, C.persian][i] }, line: { color: C.milk } });
    s.addText(h, { x: 0.9, y, w: 3.0, h: 0.85, fontFace: HEAD, fontSize: 19, bold: true, color: C.plum, valign: 'middle', margin: 0 });
    s.addText(d, { x: 4.0, y, w: 8.7, h: 0.85, fontFace: BODY, fontSize: 16, color: C.ink, valign: 'middle', margin: 0 });
  });
  note(s, 'Verified against a brute-force planner in the unit tests.');
}
// 6 3D
{
  const s = base('3D models for every site', 6);
  img(s, S('model3d'), 0.5, 1.45, 7.4, 4.9);
  bullets(s, ['116 per-site models built from photographs and fact sheets', 'Landmark-specific: Pashupatinath terraces and Bagmati, Kathmandu Durbar Square vs Hanuman Dhoka, Kal Bhairav niche', 'Lazy loaded: only the opened site\'s file is fetched', 'Day and dusk (aarti) lighting'], { x: 8.2, y: 1.6, w: 4.7, h: 4.2, size: 16 });
  s.addText('Honest limit: stylized approximations, not scans.', { x: 8.2, y: 5.9, w: 4.7, h: 0.6, fontFace: BODY, fontSize: 14, italic: true, color: C.wine, margin: 0 });
  note(s, 'Explain why procedural: no licensed scans for most sites, small download, works offline of any 3D vendor.');
}
// 7 design
{
  const s = base('Data model and flows', 7);
  img(s, F('erd'), 0.5, 1.45, 6.5, 5.4);
  img(s, F('dfd1'), 7.1, 1.45, 5.8, 5.4);
  note(s, 'ER diagram on the left, level-1 data flow on the right.');
}
// 8 demo screens
{
  const s = base('The product', 8);
  [['explore', 0.5], ['quiz', 4.75], ['walk', 9.0]].forEach(([n, x]) => img(s, S(n), x, 1.5, 4.0, 2.6));
  [['hunt', 0.5], ['passport', 4.75], ['mobile', 9.0]].forEach(([n, x]) => img(s, S(n), x, 4.3, 4.0, 2.6));
  note(s, 'Live demo here: explore map, open Pashupatinath in 3D, run one quiz question, show a hunt lobby.');
}
// 9 testing
{
  const s = base('Testing and results', 9);
  const stat = (x, big, small, col) => { s.addText(big, { x, y: 1.6, w: 3.0, h: 1.0, fontFace: HEAD, fontSize: 48, bold: true, color: col, margin: 0 }); s.addText(small, { x, y: 2.6, w: 3.0, h: 0.6, fontFace: BODY, fontSize: 15, color: C.ink, margin: 0 }); };
  stat(0.6, '12', 'unit tests (algorithms)', C.plum); stat(3.8, '18', 'API flow tests', C.wine); stat(7.0, T.cases ? String(T.cases) : '--', 'browser flow cases', C.persian); stat(10.2, '116', 'models render, 0 console errors', C.plum);
  bullets(s, ['Planner checked against brute force; Elo, SM-2 and scoring have unit tests', 'Hunt simulation: 3 players over Socket.io', 'Browser suite drives the real pages at desktop and 375 px', T.cases ? `Result: ${T.pass} of ${T.cases} browser cases pass` : 'Result: see test chapter'], { y: 3.7, w: 12, h: 3, size: 18 });
  note(s, 'Bugs found and fixed during the flow test are listed in the report, chapter 5.');
}
// 10 conclusion
{
  const s = base('Limits, future work, conclusion', 10);
  s.addText('Limits', { x: 0.6, y: 1.45, w: 4, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: C.wine, margin: 0 });
  bullets(s, ['3D models are approximations', 'Nepali text and quiz content are AI-drafted and need expert review', 'Hosted demo depends on free tiers'], { y: 1.95, w: 5.8, h: 3, size: 16 });
  s.addText('Next', { x: 7.0, y: 1.45, w: 4, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: C.persian, margin: 0 });
  bullets(s, ['Native-speaker and curator review', 'Offline PWA, AR on site', 'More sites and schools\' classroom mode'], { x: 7.0, y: 1.95, w: 5.7, h: 3, size: 16 });
  s.addShape(p.ShapeType.rect, { x: 0.6, y: 5.3, w: 12.1, h: 1.3, fill: { color: C.plum }, line: { color: C.plum } });
  s.addText('A free, playable, bilingual window into Nepal\'s heritage. Thank you. Questions?', { x: 0.9, y: 5.3, w: 11.5, h: 1.3, fontFace: HEAD, fontSize: 24, color: 'FFFFFF', valign: 'middle', margin: 0 });
  note(s, 'Close with the repository link: github.com/itsniranjannn/Prachin-Sampada');
}
await p.writeFile({ fileName: path.join(DOC, 'Sampada_Defense_Slides.pptx') });
console.log('slides written; browser cases', T.cases);
