import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Builder, assemble, save, Paragraph, TextRun, AlignmentType, runs, FONT } from './doclib.mjs';
import * as m13 from './ch1_3.mjs'; import * as m46 from './ch4_6.mjs';
let REFS_ALL = [];
const MAP46 = { 1: 9, 2: 30, 3: 16, 4: 18, 5: 19, 6: 31, 7: 32, 8: 33 };
const renum = (t) => t.replace(/(?<![\w`\]\)])\[(\d{1,2}(?:\s*[,–-]\s*\d{1,2})*)\]/g, (m, inner) => '[' + inner.replace(/\d+/g, (n) => MAP46[+n] ?? n) + ']');

const here = path.dirname(fileURLToPath(import.meta.url)); const DOC = path.join(here, '..');
const F = (n) => path.join(DOC, 'figures', `${n}.png`); const S = (n) => path.join(DOC, 'screens', `${n}.png`);
const OUT = path.join(DOC, 'Sampada_Project_Report.docx');
const PAGES = path.join(here, 'pages.json');
const pages = fs.existsSync(PAGES) ? JSON.parse(fs.readFileSync(PAGES, 'utf8')) : {};

const title = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 276, before: o.before ?? 0, after: o.after ?? 120 }, children: runs(t, { size: o.size ?? 24, bold: o.bold }) });

// ---------------------------------------------------------------- title page (section 1, no number)
const titleSection = [
  title('TRIBHUVAN UNIVERSITY', { size: 32, bold: true, before: 120 }),
  title('Faculty of Humanities and Social Sciences', { size: 26, bold: true }),
  title('Pashupati Multiple Campus', { size: 26, bold: true, after: 360 }),
  title('A Project Report on', { size: 26, before: 240, after: 160 }),
  title('HAMRO PRACHIN SAMPADA: A 3D HERITAGE EXPLORER AND QUIZ GAME FOR NEPAL', { size: 36, bold: true, after: 300 }),
  title('Submitted to', { size: 24, before: 120 }),
  title('Department of Computer Application', { size: 26, bold: true }),
  title('Pashupati Multiple Campus', { size: 24, after: 240 }),
  title('In partial fulfillment of the requirements for the degree of', { size: 24 }),
  title('Bachelor of Computer Applications (BCA)', { size: 26, bold: true }),
  title('Project III (CACS452), Eighth Semester', { size: 24, after: 480 }),
  title('Submitted by', { size: 24, bold: true }),
  title('Niranjan Katwal', { size: 28, bold: true }),
  title('TU Symbol No.: 27802063', { size: 24 }),
  title('TU Registration No.: 6-2-278-18-2022', { size: 24, after: 360 }),
  title('Project Supervisor', { size: 24, bold: true }),
  title('[[Name and designation of the supervisor]]', { size: 24, after: 360 }),
  title('[[Month and year of submission]]', { size: 24 }),
];


function frontPages(b, probe) {

b.unnumbered('Supervisor\'s Recommendation', { front: true, pageBreak: false });
b.p('I hereby recommend that this project report, prepared under my supervision by **Niranjan Katwal** (TU Symbol No. 27802063, Registration No. 6-2-278-18-2022) and entitled "**Hamro Prachin Sampada: A 3D Heritage Explorer and Quiz Game for Nepal**", be accepted as partial fulfillment of the requirements for the degree of Bachelor of Computer Applications. In my opinion, this report is satisfactory for submission to the evaluation committee.');
b.blank(3);
b.p('[[Signature]]');
b.p('[[Name of the supervisor]]');
b.p('[[Designation]]');
b.p('Pashupati Multiple Campus');
b.p('Date: [[dd/mm/yyyy]]');

b.unnumbered('Certificate of Approval', { front: true });
b.p('This is to certify that the project report entitled "**Hamro Prachin Sampada: A 3D Heritage Explorer and Quiz Game for Nepal**" submitted by **Niranjan Katwal** in partial fulfillment of the requirements for the degree of Bachelor of Computer Applications has been examined and approved by the evaluation committee.');
b.blank(1);
['Supervisor', 'Internal Examiner', 'External Examiner', 'Head of Department / Program Coordinator', 'Campus Chief'].forEach((r) => {
  b.p(`[[Signature]]  ${r}: [[Name]]`);
});
b.p('Date: [[dd/mm/yyyy]]');

b.unnumbered('Acknowledgement', { front: true });
b.p('I would like to express my sincere gratitude to my project supervisor, [[name of the supervisor]], for the guidance, patient review and constructive suggestions that shaped this project. I am thankful to the Head of Department and all the teachers of the Department of Computer Application at Pashupati Multiple Campus for the knowledge they shared during the four years of the BCA program.');
b.p('I thank Tribhuvan University for the project framework that gave this work a clear direction. I am grateful to the Wikimedia Commons contributors, the OpenStreetMap and OpenFreeMap communities and the Poly Haven artists, whose freely licensed photographs, maps and textures made a heritage project possible for a student. I also thank my classmates and friends who tested early versions and gave honest feedback, and my family for their constant support.');
b.p('Any remaining mistakes are my own, and I welcome suggestions for improvement.');
b.blank(1);
b.p('Niranjan Katwal');

b.unnumbered('Abstract', { front: true });
b.p('Nepal holds a large and well documented heritage, yet most young people meet it only through textbooks and scattered photographs. Existing websites show a few famous sites, rarely let the visitor walk through one, and do not turn learning into something to play. This project presents **Hamro Prachin Sampada** ("Our Ancient Heritage"), a free bilingual web application that lets a visitor explore 116 heritage sites across all seven provinces of Nepal.');
b.p('The client is built with React and Vite, and the server with Express, Socket.io and MySQL. Every site has a story in English and Nepali, photographs from Wikimedia Commons, a map position, and its own hand-built low-poly 3D model that runs in the browser with three.js and has day and dusk lighting. A yatra planner chooses a walking or taxi route through chosen sites within a time budget using greedy insertion and 2-opt improvement. An adaptive quiz of 1,160 questions adjusts difficulty with an Elo rating and schedules missed questions with SM-2 spaced repetition. Find the Monument scores a guess on a map with the Haversine distance, and live multiplayer hunts run in Socket.io rooms with server-side timing. A recommender, a heritage passport with GPS stamps and badges, a leaderboard, and email notifications complete the product.');
b.p('The system was checked with 12 unit tests, 18 API flow tests, a multiplayer hunt simulation and a browser flow suite that drives the real pages on desktop and mobile widths. The 3D models are approximations drawn from photographs and fact sheets, and the Nepali text and quiz content were drafted with AI assistance and still need review by a native speaker and a heritage expert before public release.');
b.p('**Keywords:** digital heritage, Nepal, three.js, WebGL, gamification, orienteering problem, Elo rating, spaced repetition, Socket.io, React, MySQL');


  b.unnumbered('Table of Contents', { front: true });
  b.list([...FRONT_HEADS.map((t) => [t, 1]), ...probe.headings.filter((h) => h.level <= 2).map((h) => [h.text, h.level])]);
  const abbr = [
  ['2D / 3D', 'Two / Three Dimensional'], ['API', 'Application Programming Interface'], ['BCA', 'Bachelor of Computer Applications'], ['CC', 'Creative Commons'], ['CORS', 'Cross-Origin Resource Sharing'],
  ['CRUD', 'Create, Read, Update, Delete'], ['DFD', 'Data Flow Diagram'], ['ER', 'Entity Relationship'], ['GPS', 'Global Positioning System'], ['HTML', 'HyperText Markup Language'],
  ['HTTP', 'HyperText Transfer Protocol'], ['JSON', 'JavaScript Object Notation'], ['JWT', 'JSON Web Token'], ['OSM', 'OpenStreetMap'], ['REST', 'Representational State Transfer'],
  ['SM-2', 'SuperMemo 2 spaced repetition algorithm'], ['SMTP', 'Simple Mail Transfer Protocol'], ['SQL', 'Structured Query Language'], ['TU', 'Tribhuvan University'],
  ['UI', 'User Interface'], ['UML', 'Unified Modeling Language'], ['UNESCO', 'United Nations Educational, Scientific and Cultural Organization'], ['WebGL', 'Web Graphics Library'],
];

  b.unnumbered('List of Abbreviations', { front: true });
  abbr.forEach(([a, f]) => b.push(new Paragraph({ spacing: { line: 300, after: 40 }, children: [new TextRun({ text: a, font: FONT, bold: true, size: 24 }), new TextRun({ text: '	' + f, font: FONT, size: 24 })], tabStops: [{ type: 'left', position: 1600 }] })));
  b.unnumbered('List of Figures', { front: true });
  probe.figures.forEach((l) => b.push(b.tocEntry(l, 2)));
  b.unnumbered('List of Tables', { front: true });
  probe.tables.forEach((l) => b.push(b.tocEntry(l, 2)));
}
const FRONT_HEADS = ["SUPERVISOR'S RECOMMENDATION", 'CERTIFICATE OF APPROVAL', 'ACKNOWLEDGEMENT', 'ABSTRACT', 'TABLE OF CONTENTS', 'LIST OF ABBREVIATIONS', 'LIST OF FIGURES', 'LIST OF TABLES'];

function buildBody(bb) {
  bb.startMain();
  m13.default(bb, F, S); const r13 = [...m13.refs]; globalThis.__cite = renum; m46.default(bb, F, S); globalThis.__cite = null;
  REFS_ALL = [...r13, ...m46.refs.filter((_, i) => ![0, 2, 3, 4].includes(i))];
  // ---- references
  bb.unnumbered('References');
  const refs = [...REFS_ALL];
  refs.forEach((r, i) => bb.push(new Paragraph({ spacing: { line: 360, after: 100 }, alignment: AlignmentType.JUSTIFIED, indent: { left: 540, hanging: 540 }, children: runs(`[${i + 1}]\t${r}`) })));

  // ---- appendices
  bb.ch = 'A';
  bb.unnumbered('Appendix A: Running the System');
  bb.numbered([
    'Install Node.js 20 or later. Extract MySQL Community Server 8.4 into `.mysql` and run `setup-mysql.cmd` once, then `start-mysql.cmd` (port 3307).',
    'In `server`, copy `.env.example` to `.env` and set `JWT_SECRET`; optionally set `SMTP_USER` and `SMTP_PASS` for Gmail.',
    'Run `npm install` and `npm run db:init` in `server` to create and seed the database (116 sites, 1,160 questions, 696 clues).',
    'Start the API with `npm run dev` in `server` (port 5050) and the client with `npm install` then `npm run dev` in `client` (port 5174).',
    'Sign in with the demo explorer or administrator account listed in the README.',
  ], 'num3');
  bb.p('The complete source code is available in the public repository https://github.com/itsniranjannn/Prachin-Sampada.');
}


const probe = new Builder(pages); buildBody(probe);
const b = new Builder(pages); frontPages(b, probe); buildBody(b);
const doc = assemble(b, { titleSection });
await save(doc, OUT);
fs.writeFileSync(path.join(here, 'headings.json'), JSON.stringify({ headings: probe.headings, figures: probe.figures, tables: probe.tables, front: FRONT_HEADS }, null, 1));
console.log('written', OUT, 'headings', probe.headings.length, 'figures', probe.figures.length, 'tables', probe.tables.length);
