// Chapters 4 (System Design), 5 (Implementation and Testing) and 6 (Conclusion and Future Work).
// Facts come from the repository (server/src, client/src, server/db, server/test); measured numbers are from runs on
// the development computer and are labeled as such. Test results are read from documentation/test-results.json when present.
import fs from 'node:fs';

// Reference numbers [1]-[8] below are local to this module; renumber if the report merges lists.
export const refs = [
  'A. E. Elo, The Rating of Chessplayers, Past and Present. New York, NY, USA: Arco Publishing, 1978.',
  'P. A. Woźniak, "Optimization of learning," M.S. thesis, Univ. of Technology, Poznań, Poland, 1990 (section 3.2, the SM-2 algorithm).',
  'P. Vansteenwegen, W. Souffriau, and D. Van Oudheusden, "The orienteering problem: A survey," Eur. J. Oper. Res., vol. 209, no. 1, pp. 1–10, 2011, doi: 10.1016/j.ejor.2010.03.045.',
  'G. A. Croes, "A method for solving traveling-salesman problems," Oper. Res., vol. 6, no. 6, pp. 791–812, Dec. 1958, doi: 10.1287/opre.6.6.791.',
  'R. W. Sinnott, "Virtues of the haversine," Sky & Telescope, vol. 68, no. 2, p. 159, 1984.',
  'J. Carbonell and J. Goldstein, "The use of MMR, diversity-based reranking for reordering documents and producing summaries," in Proc. 21st Annu. Int. ACM SIGIR Conf. Res. Develop. Inf. Retrieval, Melbourne, Australia, 1998, pp. 335–336, doi: 10.1145/290941.291025.',
  'M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," IETF, RFC 7519, May 2015.',
  'N. Provos and D. Mazières, "A future-adaptable password scheme," in Proc. USENIX Annu. Tech. Conf., Monterey, CA, USA, 1999, pp. 81–92.',
];

// ---- optional test results written by the test-running step -------------------------------------------------------
const RES = (() => {
  try { return JSON.parse(fs.readFileSync(new URL('../test-results.json', import.meta.url), 'utf8')); } catch { return null; }
})();
const pick = (o, ...keys) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k]; return undefined; };
const verdict = (v) => {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 'Pass' : 'Fail';
  const s = String(v); return /^(pass|passed|ok|true)$/i.test(s) ? 'Pass' : /^(fail|failed|false)$/i.test(s) ? 'Fail' : s;
};
const summaryOf = (o) => {
  if (!o) return null;
  if (typeof o === 'string') return o;
  const pass = pick(o, 'passed', 'pass'); const total = pick(o, 'total', 'tests', 'count');
  if (typeof pass === 'number' && typeof total === 'number') return `${pass} of ${total} passed`;
  const s = pick(o, 'summary'); return typeof s === 'string' ? s : null;
};
const arrOf = (o) => (Array.isArray(o) ? o : Array.isArray(pick(o, 'cases', 'results', 'tests', 'items', 'flows')) ? pick(o, 'cases', 'results', 'tests', 'items', 'flows') : null);
const caseResult = (list, id) => {
  const hit = list && list.find((c) => String(pick(c, 'id', 'case', 'name') || '').startsWith(id));
  return hit ? verdict(pick(hit, 'result', 'status', 'passed', 'ok')) : null;
};

// The results file written by the test runner has one list, `cases`: browser flows plus three entries for the
// server suites (unit, API, hunt simulation). Older shapes with separate keys are also accepted.
const casesAll = RES && Array.isArray(RES.cases) ? RES.cases : null;
const suiteCase = (re) => casesAll && casesAll.find((c) => re.test(String(pick(c, 'name', 'title') || '')));
const isSuite = (c) => /server unit|server api|live hunt simulation/i.test(String(pick(c, 'name', 'title') || ''));
const passOf = (c) => verdict(pick(c, 'result', 'status', 'pass', 'passed', 'ok'));

export default function (b, F, S) {
  // ================================================================ CHAPTER 4
  b.chapter('System Design');
  b.p('This chapter turns the analysis of Chapter 3 (System Analysis) into a design: architecture, database, algorithms, the 3D model pipeline, the interface, the API and security. Every parameter quoted is taken from the source code.');

  b.h2('4.1 Architecture Design');
  b.p('Hamro Prachin Sampada is a three-tier web application with a live-play channel. The presentation tier is a React 18 single page application built with Vite. The application tier is one Node.js process running an Express 4 REST API and a Socket.io 4 server on the same port (5050). The data tier is MySQL 8.4, used through a `mysql2` pool of at most ten connections. The browser uses JSON over HTTP, and a WebSocket (long polling as fallback) for hunts.');
  b.fig(F('architecture'), 'System architecture of Hamro Prachin Sampada', 5.2);
  b.p('Three decisions shape the system. First, the catalog (116 sites, 1,160 questions, 696 clues) is cached in memory by `catalog.js` and refreshed after 60 seconds or an administrator edit, so a catalog read or quiz question needs no query. Second, everything secret during play, such as the true location of a round, stays on the server. Third, the algorithms are pure functions in `server/src/algorithms` (`geo`, `tour`, `adaptive`, `game`, `recommend`) that touch neither database nor network, so the twelve unit tests run in about 200 ms.');
  b.p('The system is demonstrated on one Windows computer: MySQL (portable copy, port 3307), the API (5050) and the Vite server (5174), which proxies `/api`, `/uploads` and `/socket.io` and is reachable from phones on the same Wi-Fi so a hunt can be played in a classroom. A public release needs static client files and one Node.js process with one MySQL database (Section 5.6 explains why one process).');

  // ---------------------------------------------------------------- 4.2
  b.h2('4.2 Database Design');
  b.p('The schema has 14 tables (MySQL 8, InnoDB, utf8mb4 for Nepali text). Descriptive fields always read with their site are JSON columns (facts, festivals, gallery, sources, 3D `model`), avoiding many join tables; data queried by user has its own table (Figure 4.2, Table 4.1).');
  b.fig(F('erd'), 'Entity relationship diagram', 5.2);
  b.table('Tables of the database', ['Table', 'Purpose and main columns'], [
    ['users', 'Accounts: email (unique), password_hash, role, interests, Elo rating (default 1000), is_active, email_verified'],
    ['email_codes', 'Verify and reset codes: code_hash (HMAC), attempts, expires_at'],
    ['monuments', 'One row per site: slug, English and Nepali text, lat, lng, type, district, UNESCO flag, hours, fees, facts, gallery, model (JSON)'],
    ['questions', '10 per site: four options (JSON), answer_index, difficulty 1–5, Elo rating, explanation, Nepali text'],
    ['clues', 'Riddles for map games: clue, clue_np'],
    ['quiz_attempts', 'Each signed-in answer: correct, time_ms, rating before and after'],
    ['review_cards', 'SM-2 schedule: ease, interval_days, reps, due_at'],
    ['visits', 'Passport stamps: method (gps, manual, game)'],
    ['favorites', 'Saved sites per user'],
    ['ratings', 'One star rating (1–5) and comment per user and site'],
    ['tours', 'Saved walks: input_json, plan_json, unique share_code'],
    ['game_scores', 'Finished solo and hunt games: points, rounds (user null for guests)'],
    ['hunts', 'Archive of finished hunts: code, players, winner, results_json'],
    ['badges', 'Badges earned: user_id and badge_key'],
  ], [1.4, 7.2]);
  b.p('Child tables reference their parent with `ON DELETE CASCADE`. Unique keys prevent duplicates (email, slug, one rating and one stamp per user and site, one hunt code), and rating and stamp writes use `INSERT ... ON DUPLICATE KEY UPDATE`, so a repeated request updates instead of failing. Passwords are stored only as bcrypt hashes and email codes only as HMAC digests.');

  // ---------------------------------------------------------------- 4.3
  b.h2('4.3 Algorithm Design');
  b.p('The algorithms are written without libraries in `server/src/algorithms` and `server/src/hunt.js`.');

  b.h3('4.3.1 Distance and Travel Model');
  b.p('Distances use the haversine formula [5] with R = 6,371,000 m:');
  b.code('a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)\nd = 2 · R · asin(√a)');
  b.p('Walking distance is the straight distance times 1.35. A leg is walked if it is at most 2,500 m, at 4.2 km/h. A longer leg is a taxi: distance times 1.45, 16 km/h, 8 minutes of waiting, and a fare of Rs 150 plus Rs 60 per km rounded to Rs 10. These are named constants in `geo.js`, and `legMatrix` computes every leg once per request.');

  b.h3('4.3.2 Yatra Planner');
  b.p('Choosing which sites to visit, and in what order, so that total interest is highest and the day fits the opening hours, is the Orienteering Problem with Time Windows [3]. It is NP-hard, so the planner uses a heuristic that always returns a feasible plan (Figure 4.3).');
  b.fig(F('flow-yatra'), 'Flow of the yatra planner', 5.2);
  b.p('**Value and feasibility.** Inputs are a start point, start and end time (default 09:00–17:00), and optional chosen sites and interests. Each site has a visit time (`visit_minutes`, 30 if missing), hours, and a value of 1 + 3 × cosine(interests, tags) + 0.5 for UNESCO + 4 if chosen; chosen sites are must-see, and with none chosen the candidates are the sites within 25 km. `simulate(order)` adds each leg time, waits if a site is not yet open, and rejects a route if a visit would run past closing or the finish passes the end time. It costs O(n) and every step calls it, so no step can break a window.');
  b.p('**Search.** `greedyInsert` tries every unvisited site at every position, keeps the feasible insertions and takes the highest value per extra minute (the increase of the finish time, at least one). The route is then improved by 2-opt [4]: a segment is reversed if the route stays feasible and finishes earlier, for up to 50 passes. The freed minutes are spent by a second insertion and a second 2-opt pass. Sites left out are reported with a reason (closed in the window, too far, or did not fit with higher-value stops).');
  b.p('**Complexity.** The leg matrix is O(n²), one insertion round O(n³) and at most n rounds are needed, so the worst case is O(n⁴); one 2-opt pass is O(n³). Real routes have 5 to 20 stops (measured in Section 5.5). `bruteForce` enumerates all subsets and orders for up to eight sites and is the exact baseline in tests.');

  b.h3('4.3.3 Adaptive Quiz');
  b.p('Each player has a skill rating and each question a difficulty rating, following the Elo model [1]. The chance that a player of rating Rp answers a question of rating Rq correctly is:');
  b.code('E = 1 / (1 + 10 ^ ((Rq − Rp) / 400))');
  b.p('A player starts at 1,000 and a question at 800 + (d − 1) × 150 for difficulty d = 1 to 5. After an answer the player rating changes by K × speed × (S − E), with S = 1 for correct and 0 for wrong. K is 40 for the first ten answers, 28 up to thirty and 18 after, and speed = 1 + 0.15 × max(0, 1 − t/25 s) rewards fast answers. The question rating moves by half the player change in the opposite direction; both stay between 600 and 1,800 (Figure 4.4).');
  b.fig(F('flow-quiz'), 'Flow of the adaptive quiz and spaced repetition', 5.2);
  b.p('**Choosing and reviewing.** `pickNext` selects the unseen question whose predicted success is closest to 0.7, which keeps the quiz challenging but not discouraging; a question from the same site as a recent one is penalized by 0.08, and if any review is due only those are considered. A question a signed-in player misses enters an SM-2 schedule [2]: quality is 5 for a correct answer faster than a third of the time limit, 4 for a slower correct one and 1 for a wrong one. Quality below 3 resets repetitions and the interval to one day; otherwise the interval is 1 day, 6 days, then the previous interval times the ease factor. Ease starts at 2.5, changes by 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02) and never goes below 1.3. The rating maps to levels from New Explorer (below 960) to Sampada Guru (from 1,350). Guests keep their rating in the browser; only signed-in players have a stored rating and review queue.');

  b.h3('4.3.4 Find the Monument and Live Hunts');
  b.p('The player sees a photo and a riddle, drops a pin on a map, and scores for closeness and speed:');
  b.code('distance = 800                          if d ≤ perfect\n         = round(800 · exp(−(d − perfect)/scale))   otherwise\nspeed    = round(200 · (1 − t/limit) · distance/800)\npoints   = max(0, min(1000, distance + speed − 100 · hints))');
  b.p('The curve falls smoothly, so a near miss still scores, and speed is scaled by the distance part, so a fast wrong pin earns nothing extra. A hint costs 100 points and reveals a second clue, the city and the type. In the Valley scope a pin within 40 m is perfect and the scale is 1,200 m (a 500 m miss scores about 545 distance points, a 5 km miss about 13); in the Nepal scope the radius is 1,000 m and the scale 40,000 m (a 5 km miss scores about 724). A round lasts 60 seconds; no pin scores zero.');
  b.fig(F('seq-find'), 'Sequence of one Find the Monument game', 5.2);
  b.p('The answer stays on the server until a guess is scored (Figure 4.5). `POST /api/play/game/start` picks rounds with a seeded shuffle, prefers clues and photos the player has not seen, and returns only photo, clue and credit. The client calls `/game/ready` when a round appears, which starts the server clock, and a pin is accepted up to five seconds after the limit to allow for network delay.');
  b.p('**Live hunts.** A hunt lets a group play the same rounds on their phones. A room has a six-character code from 32 symbols without 0, O, 1 and I, 3 to 10 rounds (default 5) of 20 to 90 seconds (default 45), up to 30 players, and photos from the Kathmandu Valley. The host creates a room, players join by code, and the host starts and advances rounds; a guess is one pin per round, with a reply of points but never the answer, and the answer arrives only in the reveal with every guess. The server ends a round with a timer at the limit plus 300 ms, or earlier when everyone has answered, refuses guesses later than the limit plus 400 ms, and sends its clock (`serverNow`) so a countdown is right even if a phone clock is wrong.');
  b.p('**Robustness.** The answered flag is set before any asynchronous work, so a double tap cannot score twice. Players are identified by a stable id, not the socket, so a refresh rejoins the same seat; a dropped player keeps the seat for 8 seconds, and if the host leaves the oldest connected player becomes host. Players are ranked by points, then total time (less is better), then join time; equal points and time share a rank. At the end one row goes to `hunts` and one per player to `game_scores`, and badges are checked.');

  b.h3('4.3.5 Recommender');
  b.p('The recommender scores every site and shows the top six with reasons. The score is a weighted sum of interest (cosine similarity of binary tag vectors, |A ∩ B| / √(|A| · |B|)), rating (Bayesian average (n · avg + 5 · mean) / (n + 5)), novelty (1 if not yet stamped) and nearness (1 / (1 + km / 2) when a position is known). With interests the weights are 0.45, 0.25, 0.15 and 0.15; without interests 0, 0.55, 0.20 and 0.25; without a position the nearness weight moves to rating. The Bayesian average stops one five-star review from outranking a hundred reviews of 4.8. The list is re-ranked for diversity in the spirit of maximal marginal relevance [6]: an item from a city already in the list loses 12 percent of its score for each earlier pick from that city. Each result carries reasons such as “matches your interests” or “450 m away”.');

  // ---------------------------------------------------------------- 4.4
  b.h2('4.4 3D Model Design');
  b.p('Each of the 116 sites has an interactive 3D model with day and dusk-aarti lighting, drawn in code from a short specification and not loaded from a modeling program (Figure 4.6).');
  b.fig(F('pipeline-3d'), 'Pipeline from research notes to a 3D scene', 5.2);
  b.p('**Specification and toolkit.** The `model` column holds a JSON specification: the kind (pagoda, stupa, shikhara, palace, square, pond, gate, fort, cave and others), roof tiers, plinth steps, footprint in meters, materials, features (guardian pairs, Garuda pillar, prayer wheels) and surroundings (plaza, Newar houses, river). A generic composer, `Monument`, builds any site from it. For faithful models, one file per site, `v3-<slug>.jsx`, receives a toolkit of about 70 shared parts (materials, roofs, sculptures, houses, water, trees) and returns the building and its surroundings, so all sites share one visual language and a fix in a shared part improves every site.');
  b.p('**Lazy loading and lighting.** The 116 site files hold about 68,600 lines and 2.3 MB of JavaScript (808 KB gzip). Vite splits each file into its own chunk and the viewer fetches only the opened site (median 19.6 KB, largest 35.5 KB for Pashupatinath); an error boundary falls back to the generic model if a file throws. By day the sun is warm white at intensity 3; at dusk the key light is orange at 1.8 with a violet fill, oil lamps (diyo) are lit and sparks drift.');
  b.p('**Why procedural low-poly.** Scanned models of 116 sites are not freely available, and scans of tens of megabytes suit neither mobile data nor a solo project. A specification lets a curator correct a roof count or a wall color without a 3D artist,. Surfaces use ten CC0 textures (7 MB).');

  // ---------------------------------------------------------------- 4.5
  b.h2('4.5 User Interface Design');
  b.p('**Palette and themes.** The design uses four color pairs: Plum (#381932) text and deep surface, Milk (#FFF3E6) page, Wine Red (#81021F) main action, Persian (#27187E) links, and Lilac on dark surfaces. Colors are CSS custom properties in `tokens.css` with semantic names (`--bg`, `--text`, `--primary`). Recorded contrast ratios include plum on milk 15.6:1 and wine on milk 10.6:1; Lilac on milk is only 2.6:1 and is never body text. There are three themes applied through `data-theme`: Light, Ratri (dark, chosen first if the system is dark) and Dhoop (white background, black text, stronger borders and larger text for strong sunlight at a site).');
  b.p('**Bilingual design.** Every public page works in English and Nepali. The data has Nepali fields for names, stories, facts, questions, options and clues, and `i18n.js` translates the interface live from a dictionary: with the Nepali toggle on it swaps every known text node, placeholder, title, aria-label and image alt (including text React draws later) and restores English exactly.');
  b.p('**Navigation and accessibility.** The client has 16 pages: Home, Explore, site page (`/m/:slug`), Walk (and shared walk), Quiz, Find, Hunt, Leaderboard, About, Credits, account pages, Passport and Admin. Public pages need no login, because a visitor at a temple should not need an account to read about it; stamps, saved walks, ratings and favorites need an account, and `/admin` the administrator role. Accessibility measures include visible focus rings, a photo viewer that traps focus and closes with Escape, a `prefers-reduced-motion` check, translated alt texts, an audio guide through browser speech synthesis, and the Dhoop theme. They have not been audited with screen reader users (Section 5.6).');

  // ---------------------------------------------------------------- 4.6
  b.h2('4.6 API Design');
  b.p('The REST API has 53 endpoints in six routers under `/api`, plus a health check and a LAN-address helper for the hunt QR code (Table 4.2). Bodies are JSON; a failure returns `{ "error": message }` with 400, 401, 403, 404, 409 (conflict), 415 (bad upload type), 422 (GPS stamp too far), 429 (too many attempts) or 503; a server error returns only “Something went wrong” and the details go to the log. `optionalAuth` attaches the user when a valid token is present without blocking, `requireAuth` guards personal data, and the whole admin router sits behind `requireAdmin`. Live hunts use Socket.io events (`host`, `join`, `start`, `guess`, `reaction`, `next`, `again` from the client; `room`, `round`, `countdown`, `reveal`, `finished` from the server) instead of REST.');
  b.table('REST endpoints by router', ['Router', 'Count', 'Main endpoints'], [
    ['/api/auth', '10', 'register, verify-email, resend-code, forgot, reset, login; GET and PUT /me; interests'],
    ['/api/monuments', '6', 'search and filters; /meta, /recommend, /:slug; favorite, rate'],
    ['/api/tours', '5', 'POST /plan (no login); save, list, shared/:code, delete'],
    ['/api/play', '7', 'quiz/next, quiz/answer; game/start, ready, hint, guess; leaderboard'],
    ['/api/passport', '4', 'summary; add and remove stamp; GPS check'],
    ['/api/admin', '21', 'stats; monuments, questions, clues (CRUD); users, reviews, stamps, games, hunts; uploads'],
  ], [1.5, 0.7, 6.4], { center: [1] });

  // ---------------------------------------------------------------- 4.7
  b.h2('4.7 Security Design');
  b.table('Threats and measures', ['Threat', 'Measure in the system'], [
    ['Stolen database', 'bcrypt hashes with cost 10 [8]; email codes stored only as HMAC-SHA-256 digests keyed with the server secret.'],
    ['Forged or stale session', 'JSON Web Token [7] signed with `JWT_SECRET`, valid 7 days; an `is_active` flag cached for 30 s means a deactivated account loses access within 30 seconds.'],
    ['Guessing', 'Ten wrong passwords for one email from one address pause login for five minutes (429); a six-digit code expires in 10 minutes, locks after 5 tries, is compared in constant time, and “forgot password” answers the same whether or not the account exists.'],
    ['Cheating in games', 'The server holds true locations, enforces round order, one answer per round and the clock. Quiz options are shuffled per run by a seed, so the stored order is never sent.'],
    ['Injection and upload', 'Bound SQL parameters; whitelisted admin columns; JSON bodies limited to 200 KB. Photo upload (6 MB) detects JPEG, PNG or WebP from the first bytes, names the file by SHA-256 and serves it with `nosniff`.'],
    ['Cross-origin and privilege misuse', 'CORS admits only the configured client origin and private LAN addresses. Admin routes need the admin role re-read from the database; ratings, favorites and stamps always use the id from the token.'],
    ['Secret leakage', 'Secrets are read from `server/.env`, which is not committed; only `.env.example` is.'],
  ], [1.7, 6.9]);
  b.p('Known weaknesses are in Section 5.6: no general per-address rate limit, a development fallback secret if `JWT_SECRET` is unset, and a token in local storage.');

  // ================================================================ CHAPTER 5
  b.chapter('Implementation and Testing');
  b.p('This chapter describes the tools, the main modules, the screens and the testing. Measurements were taken on the development computer (Windows 11, Node.js 24.18, MySQL 8.4 on the same machine) and describe that setup only.');

  b.h2('5.1 Tools and Technologies');
  b.table('Tools and libraries (exact versions from package.json)', ['Layer', 'Tool', 'Version', 'Use'], [
    ['Runtime', 'Node.js; MySQL', '24.18; 8.4 LTS', 'Server; storage (portable, port 3307)'],
    ['Server', 'express; socket.io; mysql2', '4.21.2; 4.8.1; 3.11.5', 'REST API; live hunts; pooled queries'],
    ['Server', 'bcryptjs; jsonwebtoken; nodemailer', '2.4.3; 9.0.2; 6.9.16', 'Hashes; tokens; email codes'],
    ['Client', 'react, react-dom; react-router-dom; vite', '18.3.1; 6.28.0; 5.4.11', 'Interface; routing; build'],
    ['Client', 'three; @react-three/fiber; drei', '0.169.0; 8.17.10; 9.117.3', '3D models'],
    ['Client', 'maplibre-gl; framer-motion; socket.io-client', '4.7.1; 11.11.17; 4.8.1', 'Map on OpenFreeMap tiles; animation; hunts'],
    ['Testing', 'node:test, fetch, socket.io-client', 'built in; 4.8.1', 'Unit, API and hunt tests'],
    ['Data', 'Wikidata, OpenStreetMap, Wikimedia Commons, Poly Haven', 'CC-licensed or CC0', 'Coordinates, photos, textures'],
  ], [0.8, 3.2, 2.2, 2.4]);
  b.p('The project has about 2,300 lines of server code, 5,500 lines of client pages, components and libraries, 1,900 lines of style sheets, about 68,600 lines in the per-site 3D files, and eight JSON files of researched site data.');

  b.h2('5.2 Module Implementation');
  b.p('`npm run db:init` creates the database, runs `schema.sql` and loads eight JSON files, one per region. Each record has coordinates, story, facts, hours, fees, Nepali text, photo credits, a 3D specification, ten questions and about six clues, giving 116 sites, 1,160 questions and 696 clues, plus a demo explorer and administrator. The algorithms of Chapter 4 are direct translations of Section 4.3. The core of `greedyInsert` in `tour.js`, abridged, is:');
  b.code('for (const i of left) for (let p = 0; p <= route.length; p++) {\n  const s = simulate(insertAt(route, p, i), ...);\n  if (!s) continue;                      // breaks a time window\n  const ratio = sites[i].value / Math.max(1, s.finish - cur.finish);\n  if (!best || ratio > best.ratio) best = { i, p, ratio };\n}\nroute.splice(best.p, 0, best.i);       // insert the best, repeat');
  b.p('The quiz answer endpoint keeps the answer secret by shuffling the four options with a seeded generator of the run seed and question id, so the server can rebuild the order, and by remembering when each question was sent:');
  b.code('const sentAt = served.get(seed + ":" + q.id);\nif (!sentAt) return res.status(409).json({ error: "Already answered." });\nserved.delete(key);                  // one answer per question per run\nconst elapsed = Date.now() - sentAt; // server clock, not the client\'s\nif (elapsed > QUIZ_LIMIT_MS + QUIZ_GRACE_MS) choice = -1; // time-out');
  b.p('The hunt guess handler follows the same rule: the player is marked answered before any await, the time is the server\'s, and the reply carries points but no location.');

  b.h2('5.3 Screens');
  b.p('The figures are screenshots of the running system at desktop width; further screens are in the appendix.');
  b.fig(S('home'), 'Home page with the hero model and the seven provinces', 3.4);
  b.fig(S('explore'), 'Explore: the Nepal map with province filters and the site list', 3.4);
  b.fig(S('model3d'), '3D model of a site in the dusk-aarti setting', 3.4);
  b.fig(S('walk'), 'Yatra planner with the timed plan and its walk and taxi legs', 3.4);
  b.fig(S('hunt'), 'Live hunt with the room code and the leaderboard', 3.4);

  // ---------------------------------------------------------------- 5.4
  b.h2('5.4 Testing');
  b.p('Testing follows the risk. The algorithms are pure functions with rules that fail silently, so they get unit tests; the API holds validation, permissions and answer secrecy, so it gets end-to-end tests against a real database; the hunt is a time-driven multi-user protocol, so a script plays a whole hunt with three clients; and the interface is driven in a real browser.');
  const uc = suiteCase(/server unit/i); const ac = suiteCase(/server api/i); const hc = suiteCase(/live hunt/i);
  const unit = RES && (uc ? { summary: `${passOf(uc)}: ${pick(uc, 'actual') || ''}` } : pick(RES, 'unit', 'unitTests', 'unit_tests'));
  const api = RES && (ac ? { summary: `${passOf(ac)}: ${pick(ac, 'actual') || ''}` } : pick(RES, 'api', 'apiTests', 'api_tests'));
  const hunt = RES && (hc ? { summary: `${passOf(hc)}: ${pick(hc, 'actual') || ''}` } : pick(RES, 'hunt', 'huntSim', 'hunt_sim', 'huntSimulation'));
  const browserList = casesAll ? casesAll.filter((c) => !isSuite(c)) : arrOf(RES && pick(RES, 'browser', 'browserTests', 'browser_flows', 'e2e', 'flows'));
  const huntSummary = summaryOf(hunt);

  b.h3('5.4.1 Unit Tests');
  b.p(`The twelve unit tests (\`algorithms.test.js\`, \`npm test\`) check each rule with known numbers. ${summaryOf(unit) ? 'Recorded result: ' + summaryOf(unit) + '.' : 'All twelve pass in about 200 ms.'}`);
  const unitDef = uc ? (passOf(uc) === 'Pass' ? 'Pass' : 'See note') : 'Pass';
  b.table('Unit test cases', ['ID', 'What is tested', 'Expected result', 'Result'], [
    ['UT-01', 'Haversine', 'Kathmandu to Patan Durbar Square 3.6–4.2 km', unitDef],
    ['UT-02', 'Walk or taxi leg', 'About 140 m walked at no cost; Kathmandu to Bhaktapur is a taxi leg over Rs 500', unitDef],
    ['UT-03', 'Planner hours', 'Every stop within site hours and the end time', unitDef],
    ['UT-04', 'Closed site', 'A site open 15:00–16:00 in a 09:00–12:00 day is skipped with a reason', unitDef],
    ['UT-05', 'Planner vs brute force', 'Same total value as the exact optimum on a 5-site instance', unitDef],
    ['UT-06', 'Elo', '50% for equal ratings; a win raises player and lowers question', unitDef],
    ['UT-07', 'Adaptive picker', 'Closest to 70% success; due review first; null when all seen', unitDef],
    ['UT-08', 'SM-2', 'Intervals 1, 6, then growing; a lapse resets; ease at least 1.3', unitDef],
    ['UT-09', 'Find scoring', '1,000 for an exact pin at time 0; 2 hints cost 200', unitDef],
    ['UT-10', 'Hunt ranking', 'Points, then time; ties share a rank; same seed, same rounds', unitDef],
    ['UT-11', 'Recommender', 'Interest match ranks first with its reason', unitDef],
    ['UT-12', 'Scoring scope', '5 km miss under 40 (Valley), over 600 (Nepal)', unitDef],
  ], [0.7, 1.9, 5.1, 0.9], { center: [0, 3] });

  b.h3('5.4.2 API Tests and Hunt Simulation');
  b.p(`The eighteen API tests (\`api-flow.test.js\`, \`npm run test:api\`) run in sequence against the live server and a freshly seeded database.${summaryOf(api) ? ' Recorded result: ' + summaryOf(api) + '.' : ''}`);
  const apiList = arrOf(api);
  const apiDef = ac ? (passOf(ac) === 'Pass' ? 'Pass' : 'See note') : 'To be filled';
  const A = (id) => caseResult(apiList, id) || apiDef;
  b.table('API test cases', ['ID', 'What is tested', 'Expected result', 'Result'], [
    ['AT-01', 'Health check', 'HTTP 200', A('AT-01')],
    ['AT-02', 'Catalog metadata', '100+ sites, 7+ UNESCO zones, 500+ questions, all provinces; Karnali filter returns only Karnali', A('AT-02')],
    ['AT-03', 'Search and filters', '“nyatapola” finds Nyatapola Temple; filters return only matches', A('AT-03')],
    ['AT-04', 'Monument detail', 'Nearby sites included; unknown slug 404', A('AT-04')],
    ['AT-05', 'Recommendations', 'Three or more cities, each with reasons', A('AT-05')],
    ['AT-06', 'Planner on real data', '09:00–13:00 walk has 3+ stops and respects hours', A('AT-06')],
    ['AT-07', 'Planner bad input', 'No start, or end before start: 400', A('AT-07')],
    ['AT-08', 'Registration', 'Weak password, bad or duplicate email rejected; valid returns a token', A('AT-08')],
    ['AT-09', 'Login, protected routes', 'Wrong password 401; no token 401', A('AT-09')],
    ['AT-10', 'Adaptive quiz', 'No answer in the question; rating moves; a miss enters review', A('AT-10')],
    ['AT-11', 'GPS stamp', 'Far 422; on site accepted; first-stamp badge', A('AT-11')],
    ['AT-12', 'Favorites and reviews', 'One review per explorer; favorite toggles', A('AT-12')],
    ['AT-13', 'Walks', 'Yatri badge on save; share code opens without login; other user 403', A('AT-13')],
    ['AT-14', 'Find the Monument', 'No coordinates in rounds; replaying round 0 gives 409', A('AT-14')],
    ['AT-15', 'Explorer on admin route', 'HTTP 403', A('AT-15')],
    ['AT-16', 'Admin management', 'Latitude 40 and 2-option question refused; valid ones added; delete then 404', A('AT-16')],
    ['AT-17', 'Deactivation', 'Login 403; old token 401 at once', A('AT-17')],
    ['AT-18', 'Passport summary', 'Two stamps, 7 UNESCO zones, badge earned', A('AT-18')],
  ], [0.7, 1.7, 5.3, 0.9], { center: [0, 3] });
  b.p('`server/test/hunt-sim.mjs` opens three Socket.io clients (host, “Aarati”, “Bikash”) and plays a three-round hunt of 20 seconds. It checks that a duplicate name in another case is refused, that a non-host cannot start, that no round payload contains the monument id or coordinates, and that a second guess in a round is refused, then prints the ranking.' + (huntSummary ? ` Recorded result: ${huntSummary}.` : ''));

  b.h3('5.4.3 Browser Flow Tests');
  b.p('Unit and API tests cannot show that a page renders or a button works, so scripted flows drive the real pages in a browser at desktop width and at 375 px.');
  const bl = browserList;
  if (bl && bl.length) {
    const failed = bl.filter((c) => passOf(c) !== 'Pass');
    b.p(`The flows were run by a script on one computer against the development server: ${bl.length} flows, ${bl.length - failed.length} passed and ${failed.length} failed.` + (failed.length ? ' The failed flows are listed with what the script observed; each is a test or interface problem still to be checked and is not hidden.' : ''));
    if (failed.length) b.bullets(failed.map((c) => `**${pick(c, 'id')} ${pick(c, 'name', 'title')}.** ${String(pick(c, 'actual') || 'No detail recorded.').replace(/\s+/g, ' ').slice(0, 200)}`));
  } else {
    b.p('The browser flow results are to be filled from test-results.json.');
  }
  const notes = RES && pick(RES, 'notes', 'browserNotes');
  if (typeof notes === 'string') b.p(notes);

  // ---------------------------------------------------------------- 5.5
  b.h2('5.5 Results and Discussion');
  b.p('The system meets the objectives of Chapter 1: a bilingual catalog of 116 sites in all seven provinces (9 UNESCO zones); a 3D model for every site; a yatra planner; an adaptive quiz of 1,160 questions; two map games; live hunts for up to 30 players; and a passport with 11 badges. Everything works for guests except features that must remember a person.');
  b.h3('5.5.1 Planner Quality and Speed');
  b.p('Speed was measured by calling `planTour` 20 times per size with real sites near Kathmandu Durbar Square, random values and a 09:00–17:00 day.');
  b.table('Planner running time (measured, 20 runs)', ['Candidate sites', 'Median (ms)', 'Largest (ms)', 'Stops in plan'], [
    ['5', '0.15', '1.9', '5'],
    ['20', '2.0', '5.6', '16'],
    ['40', '5.6', '7.9', '18'],
    ['53 (every site within 25 km)', '10.5', '16.1', '21'],
  ], [3.2, 1.8, 1.8, 1.8], { center: [1, 2, 3] });
  b.p('The largest realistic request takes about 10 ms, so the O(n⁴) bound is not a practical problem. For quality, the heuristic was compared with `bruteForce` on 40 random instances of seven sites within 8 km, a 09:00–14:00 window and random values. It found the optimal value in 27 of 40 (68 percent); in the other 13 the value was lower by 0.8 to 10.1 percent, 4.4 percent on average (1.4 percent over all 40). The plan is always valid, usually the best, and sometimes one modest stop short.');
  b.h3('5.5.2 API Response Time and Client Size');
  b.p('A script sent 60 sequential requests to each endpoint on the same computer (the first includes warm-up).');
  b.table('API response time (60 sequential requests)', ['Endpoint', 'First (ms)', 'Median (ms)', '95th pct (ms)'], [
    ['GET /api/monuments (116 sites, 176 KB)', '18', '14.0', '18.0'],
    ['GET /api/play/quiz/next', '16', '14.8', '16.1'],
    ['POST /api/tours/plan (6 chosen sites)', '16', '15.1', '16.2'],
    ['POST /api/tours/plan (automatic, 53 candidates)', '25', '15.0', '26.6'],
  ], [4.4, 1.2, 1.4, 1.6], { center: [1, 2, 3] });
  b.p('Medians are about 15 ms for every endpoint (eight measured, four shown). This floor comes from the measuring setup (sequential requests from a Node.js client on Windows), not the endpoints: the planner needs 0.2 to 10 ms and a catalog read a fraction of a millisecond. The honest conclusion is limited: on one computer no endpoint exceeded about 30 ms at the 95th percentile, and the table cannot rank endpoints. It says nothing about a real network, where the 176 KB catalog list matters more because the server installs no compression.');
  b.table('Files fetched on the first visit (production build)', ['Chunk', 'Raw size', 'Gzip size'], [
    ['index (shell and shared code)', '462 KB', '121 KB'],
    ['react, react-dom, react-router', '165 KB', '54 KB'],
    ['framer-motion', '122 KB', '41 KB'],
    ['three, react-three-fiber, drei', '905 KB', '249 KB'],
    ['Style sheet of the shell', '160 KB', '29 KB'],
    ['Total', '1.8 MB', '494 KB'],
  ], [4.8, 1.8, 1.8], { center: [1, 2] });
  b.p('Page chunks load on demand (Home 17 KB, Quiz 23 KB, Monument 68 KB, Hunt 102 KB, Admin 49 KB), and the map library (802 KB, 218 KB gzip) loads only on map pages. The build has 179 JavaScript files of 5.7 MB (1.8 MB gzip). A visitor fetches one site model at a time, plus eight group files (547 KB, 170 KB gzip) that load together on the first 3D view. The ten textures take 7.0 MB.');
  b.p('Keeping answers and time on the server holds up under the tests. The system has been run by its author and tested with scripts, not evaluated with real visitors or teachers, so no claim is made about learning benefit.');

  // ---------------------------------------------------------------- 5.6
  b.h2('5.6 Limitations Found');
  b.bullets([
    '**One server process.** Hunts, running games, served quiz questions and the login throttle live in server memory; a restart ends all hunts, and two processes would not see each other’s rooms. A public service needs a shared store such as Redis and the Socket.io Redis adapter.',
    '**No general rate limit, compression or security headers.** Only login and email codes are limited. If `JWT_SECRET` is unset the server warns and uses a fixed development secret. The token is kept in local storage, so a cross-site scripting flaw would expose it; an `HttpOnly` cookie would be safer.',
    '**GPS stamps can be spoofed.** The server checks the coordinates are within about 60 m of the site (or the reported accuracy, up to 150 m) but cannot know they come from the sensor.',
    '**The travel model is an estimate.** Walking time is a straight line times 1.35 at a fixed speed, taxi time and fare are constants, and each site has one pair of opening hours with no festival closures. The heuristic matched the optimum in 27 of 40 small random cases and has no guarantee on larger ones.',
    '**Content is unreviewed.** The Nepali text comes from dictionaries and prepared text no professional translator has checked, and a new English sentence stays English until a dictionary entry is added. Stories, dates and answers come from listed public sources but no archaeologist or heritage official has reviewed them.',
    '**The first 3D view is heavy.** It fetches the 905 KB three.js chunk and the eight group model files (170 KB gzip) even though a site file replaces the group model for every site that has one.',
    '**Accessibility and coverage.** There was no test with screen reader users, and the map and 3D viewer were not checked for keyboard operation. The API tests need a running server and a seeded database, so they are not part of `npm test`; browser flows ran on one computer and one browser.',
  ]);

  // ================================================================ CHAPTER 6
  b.chapter('Conclusion and Future Work');
  b.h2('6.1 Conclusion');
  b.p('This project set out to let a visitor explore the heritage of Nepal the way they already use their phone: by looking, playing and walking. The result, Hamro Prachin Sampada, is a working web system with a React client and a Node.js server. It covers 116 sites in all seven provinces with story, facts and photos in English and Nepali, a 3D model of every site, an interactive map, an audio guide, a passport with GPS stamps and badges, a yatra planner, an adaptive quiz, a photo-and-riddle map game and live multiplayer hunts.');
  b.p('The technical core is a set of algorithms written from scratch, tested and measured: a planner that solves a small orienteering problem with opening hours in about 10 ms for the largest request, with the optimal value in 27 of 40 random cases; an Elo quiz that targets about 70 percent success, with SM-2 reviews; an exponential-distance map game; a hunt engine that keeps time and answers on the server; and a recommender mixing interest, Bayesian rating, novelty and nearness.');
  b.p('The evidence of quality is 12 unit tests, 18 API tests, a three-player hunt simulation and scripted browser flows, with measured sizes and timings. The limits are in Section 5.6: a single server process, content not reviewed by curators or Nepali language experts, and no trial with real visitors. The system is a working, tested prototype and not yet a public service.');

  b.h2('6.2 Lessons Learned');
  b.bullets([
    '**Keep rules in pure functions** so they are testable in milliseconds and comparable with a brute-force solver, which turned “the plan looks good” into “optimal in 68 percent of small cases”.',
    '**Decide who owns the clock and the answer.** Almost every way of cheating comes from trusting the client for time or answer; the rule is cheap at the start and costly later.',
    '**Measure honestly.** The latency table exposed a limit of the measuring setup, and the size table exposed a real problem, the group model files that load together.',
    '**Data is most of the work.** Collecting, checking and translating 116 sites, 1,160 questions and 696 clues took more effort than any algorithm.',
  ]);

  b.h2('6.3 Future Work');
  b.numbered([
    '**Native review of Nepali** by a language teacher, with a button for users to propose better sentences.',
    '**More sites, curator and teacher review.** Grow the catalog toward the full Department of Archaeology list, add seasonal and festival hours, have archaeologists check content, and run a study with a class to measure learning.',
    '**Offline progressive web app** that caches catalog, photos and models so passport, audio guide, quiz and planner work on weak data.',
    '**Augmented reality and a mobile app** for overlaying reconstructions of lost structures such as Kasthamandap, background GPS and festival notifications.',
    '**Production hardening.** Move live state to a shared store, add rate limiting, compression and security headers, use an `HttpOnly` cookie, use a routing service for walking times, and run all tests automatically on every change.',
  ], 'num2');
}
