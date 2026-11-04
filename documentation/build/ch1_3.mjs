// Chapters 1-3 of the Hamro Prachin Sampada final report (one module).
// Citation numbers are assigned in order of first use while the module runs; `refs` is filled in that order
// (call the default export first, then read `refs`).

const R = {
  unesco121: 'UNESCO World Heritage Centre, “Kathmandu Valley,” World Heritage List, ref. 121. [Online]. Available: https://whc.unesco.org/en/list/121',
  unesco666: 'UNESCO World Heritage Centre, “Lumbini, the Birthplace of the Lord Buddha,” World Heritage List, ref. 666. [Online]. Available: https://whc.unesco.org/en/list/666',
  kpost: '“Govt begins restoring important heritage sites,” The Kathmandu Post, Oct. 6, 2016. [Online]. Available: https://kathmandupost.com/national/2016/10/06/govt-begins-restoring-important-heritage-sites',
  larman: 'C. Larman and V. R. Basili, “Iterative and incremental developments: A brief history,” Computer, vol. 36, no. 6, pp. 47–56, Jun. 2003, doi: 10.1109/MC.2003.1204375.',
  anderson: 'E. F. Anderson, L. McLoughlin, F. Liarokapis, C. Peters, P. Petridis, and S. de Freitas, “Developing serious games for cultural heritage: A state-of-the-art review,” Virtual Reality, vol. 14, no. 4, pp. 255–275, 2010, doi: 10.1007/s10055-010-0177-3.',
  deterding: 'S. Deterding, D. Dixon, R. Khaled, and L. Nacke, “From game design elements to gamefulness: Defining ‘gamification’,” in Proc. 15th Int. Academic MindTrek Conf., Tampere, Finland, 2011, pp. 9–15, doi: 10.1145/2181037.2181040.',
  hamari: 'J. Hamari, J. Koivisto, and H. Sarsa, “Does gamification work? A literature review of empirical studies on gamification,” in Proc. 47th Hawaii Int. Conf. System Sciences (HICSS), 2014, pp. 3025–3034, doi: 10.1109/HICSS.2014.377.',
  sailer: 'M. Sailer and L. Homner, “The gamification of learning: A meta-analysis,” Educ. Psychol. Rev., vol. 32, no. 1, pp. 77–112, 2020, doi: 10.1007/s10648-019-09498-w.',
  elo: 'A. E. Elo, The Rating of Chessplayers, Past and Present. New York, NY, USA: Arco, 1978.',
  klinkenberg: 'S. Klinkenberg, M. Straatemeier, and H. L. J. van der Maas, “Computer adaptive practice of Maths ability using a new item response model for on the fly ability and difficulty estimation,” Comput. Educ., vol. 57, no. 2, pp. 1813–1824, 2011.',
  pelanek: 'R. Pelánek, “Applications of the Elo rating system in adaptive educational systems,” Comput. Educ., vol. 98, pp. 169–179, 2016, doi: 10.1016/j.compedu.2016.03.017.',
  wozniak: 'P. A. Wozniak and E. J. Gorzelanczyk, “Optimization of repetition spacing in the practice of learning,” Acta Neurobiol. Exp., vol. 54, pp. 59–62, 1994, doi: 10.55782/ane-1994-1003.',
  roediger: 'H. L. Roediger III and J. D. Karpicke, “Test-enhanced learning: Taking memory tests improves long-term retention,” Psychol. Sci., vol. 17, no. 3, pp. 249–255, 2006, doi: 10.1111/j.1467-9280.2006.01693.x.',
  tabibian: 'B. Tabibian, U. Upadhyay, A. De, A. Zarezade, B. Schölkopf, and M. Gomez-Rodriguez, “Enhancing human learning via spaced repetition optimization,” Proc. Natl. Acad. Sci. U.S.A., vol. 116, no. 10, pp. 3988–3993, 2019, doi: 10.1073/pnas.1815156116.',
  golden: 'B. L. Golden, L. Levy, and R. Vohra, “The orienteering problem,” Naval Res. Logist., vol. 34, no. 3, pp. 307–318, Jun. 1987.',
  vansteenwegen: 'P. Vansteenwegen, W. Souffriau, and D. Van Oudheusden, “The orienteering problem: A survey,” Eur. J. Oper. Res., vol. 209, no. 1, pp. 1–10, 2011, doi: 10.1016/j.ejor.2010.03.045.',
  gavalas: 'D. Gavalas, C. Konstantopoulos, K. Mastakas, and G. Pantziou, “A survey on algorithmic approaches for solving tourist trip design problems,” J. Heuristics, vol. 20, no. 3, pp. 291–328, 2014, doi: 10.1007/s10732-014-9242-5.',
  croes: 'G. A. Croes, “A method for solving traveling-salesman problems,” Oper. Res., vol. 6, no. 6, pp. 791–812, 1958, doi: 10.1287/opre.6.6.791.',
  sinnott: 'R. W. Sinnott, “Virtues of the haversine,” Sky and Telescope, vol. 68, no. 2, p. 159, 1984.',
  webgl: 'Khronos Group, “WebGL Specification, Version 1.0.” [Online]. Available: https://registry.khronos.org/webgl/specs/1.0/',
  threejs: 'three.js authors, “three.js: JavaScript 3D library.” [Online]. Available: https://threejs.org',
  parish: 'Y. I. H. Parish and P. Müller, “Procedural modeling of cities,” in Proc. 28th Annu. Conf. Computer Graphics and Interactive Techniques (SIGGRAPH), 2001, pp. 301–308.',
  muller: 'P. Müller, P. Wonka, S. Haegler, A. Ulmer, and L. Van Gool, “Procedural modeling of buildings,” ACM Trans. Graph., vol. 25, no. 3, pp. 614–623, 2006, doi: 10.1145/1141911.1141931.',
  rfc6455: 'I. Fette and A. Melnikov, “The WebSocket Protocol,” IETF, RFC 6455, Dec. 2011. [Online]. Available: https://www.rfc-editor.org/info/rfc6455',
  gac: 'Google, “Google Arts & Culture.” [Online]. Available: https://artsandculture.google.com',
  doa: '“List of monuments in Nepal,” Wikipedia. [Online]. Available: https://en.wikipedia.org/wiki/List_of_monuments_in_Nepal',
  sketchfab: 'Sketchfab, “Kathmandu – 3D views before and after the earthquake,” Sketchfab Community Blog. [Online]. Available: https://sketchfab.com/blogs/community/kathmandu-3d-views-before-and-after-the-earthquake/',
  wikidata: 'D. Vrandečić and M. Krötzsch, “Wikidata: A free collaborative knowledgebase,” Commun. ACM, vol. 57, no. 10, pp. 78–85, 2014, doi: 10.1145/2629489.',
  osm: 'M. Haklay and P. Weber, “OpenStreetMap: User-generated street maps,” IEEE Pervasive Comput., vol. 7, no. 4, pp. 12–18, Oct.–Dec. 2008, doi: 10.1109/MPRV.2008.80.',
};

export const refs = []; // IEEE entries in order of first citation (filled when the default export runs)

export default function (b, F, S) {
  refs.length = 0;
  const order = [];
  const c = (...keys) => keys.map((k) => {
    if (!R[k]) throw new Error(`unknown reference ${k}`);
    let i = order.indexOf(k);
    if (i < 0) { order.push(k); refs.push(R[k]); i = order.length - 1; }
    return `[${i + 1}]`;
  }).join(', ');

  // =====================================================================================================
  b.chapter('Introduction');

  b.h2('1.1 Background');
  b.p(`Nepal has one of the densest concentrations of living heritage in South Asia. The Kathmandu Valley alone is a UNESCO World Heritage property made of seven monument zones: the Durbar Squares of Kathmandu, Patan and Bhaktapur, the stupas of Swayambhunath and Boudhanath, Pashupatinath and Changu Narayan ${c('unesco121')}. Lumbini, the birthplace of the Buddha, is a second Nepali cultural property ${c('unesco666')}. Beyond these lie hundreds of smaller shrines, courtyards, forts, ponds and pilgrimage sites in all seven provinces, many known only locally. The 2015 Gorkha earthquake damaged many of them, and restoration began only in the following years ${c('kpost')}, which makes careful documentation more valuable.`);
  b.p('Today a visitor with a smartphone can look up most of this information, but it is spread over encyclopedia pages, news articles, travel blogs and photo archives of uneven depth, mostly in English, and none of it helps with the practical questions of a visit: which sites are open, how far apart they are, and what fits into three hours. Modern browsers can also draw 3D scenes with WebGL, read the device location, speak text aloud and keep a live connection with a server, so a heritage guide can be interactive and playful.');
  b.p('**Hamro Prachin Sampada** (हाम्रो प्राचीन सम्पदा, “our ancient heritage”) is a web application built around this opportunity. It collects 116 heritage sites across all seven provinces into one dataset and turns it into a story map, a 3D model of every site, a heritage walk planner, an adaptive quiz, a photo-based guessing game, live multiplayer hunts and a passport that records visited places. The interface is available in English and Nepali.');

  b.h2('1.2 Problem Statement');
  b.p('The project addresses the following problems.');
  b.bullets([
    '**Scattered information.** Facts about a monument are spread over many sites of different quality; no single place shows history, legend, festivals, visiting hours, fees and sources together.',
    '**Neglected smaller sites.** Small temples in the Gandaki, Karnali, Sudurpashchim, Koshi, Madhesh and Lumbini provinces have little organized, bilingual content.',
    '**Passive presentation.** Most heritage websites are read-only and do nothing to make a visitor look closely, remember or explore.',
    '**No visit planning.** Opening hours, distances and time at each site decide what a day can include, but visitors work this out by hand.',
    '**Limited 3D understanding.** High-quality 3D scans exist for few Nepali monuments and are often paid or hosted on separate platforms.',
    '**Language barrier.** Bilingual heritage material is rare, and most game-style learning tools do not cover Nepal.',
  ]);
  b.p('The problem is therefore how to bring verified heritage information, planning support and engaging learning activities for Nepal into one free web application that works on an ordinary phone or laptop.');

  b.h2('1.3 Objectives');
  b.p('The general objective is to develop a free, bilingual web application that helps people discover, understand and visit the heritage of Nepal. The specific objectives are:');
  b.numbered([
    'To build a dataset of 116 heritage sites in all seven provinces, with coordinates, history, festivals, visiting information, licensed photographs and sources.',
    'To generate an interactive 3D model of every site from a structured description.',
    'To plan a one-day heritage walk that respects opening hours and the time available.',
    'To provide an adaptive quiz, a location game and a live multiplayer hunt with server-side scoring.',
    'To keep a passport with GPS-verified stamps and badges, and an administrator console for managing content.',
    'To test the main algorithms and the API with automated tests.',
  ], 'num');

  b.h2('1.4 Scope and Limitations');
  b.h3('1.4.1 Scope');
  b.p('The system is a web application with a React client and an Express server backed by MySQL. It covers browsing and searching the dataset, the map, the 3D viewer, the audio guide, the English and Nepali interface, recommendations, the walk planner, the quiz, the Find the Monument game, live hunts, the passport and badges, leaderboards, accounts with email verification, and an administrator console. Two roles exist: explorer (registered visitor) and administrator. Guests can use almost every feature without an account.');
  b.h3('1.4.2 Limitations');
  b.bullets([
    'The dataset of 116 sites is a curated selection, not a complete inventory of Nepal’s monuments.',
    'The 3D models are procedural approximations built from a description of each site. They are not photogrammetry scans and do not claim survey accuracy.',
    'Quiz questions, clues and short descriptions were drafted with the help of an AI assistant from the collected facts. All Nepali text was produced by machine translation under a written style guide. Neither has been reviewed by a heritage expert or a native Nepali editor.',
    'Opening hours and fees come from public sources and can change. Walking times use a fixed detour factor and speed, and taxi fares are an estimate; there is no live traffic or fare data.',
    'Live hunt and game state is kept in server memory, so an unfinished game is lost on restart; a single server instance is assumed.',
    'The application was verified with automated tests and by the author’s own use. No formal usability study has been carried out.',
    'The manual “I am here” stamp can be used by someone who is not on site; it is recorded as a manual stamp, and GPS check-in depends on device accuracy.',
  ]);

  b.h2('1.5 Significance');
  b.p('For students and the public, the project gives one place where heritage facts are shown with sources in a language of choice. Teachers get a bank of 1,160 explained questions and a live hunt a class can play on phones. Visitors get a schedule that fits a day. Smaller sites outside the Kathmandu Valley receive the same presentation as famous ones. For the author, it is a complete exercise in analysis, design, algorithms, real-time systems and 3D graphics, and the code and data are open for later extension.');

  b.h2('1.6 Development Methodology');
  b.p(`The project followed an iterative and incremental process: a small working core grew in cycles of planning, building, testing and review, each delivering a usable increment ${c('larman')}. It suits this project because it is carried out by one student, the requirements became precise only after the dataset existed and could be played with, the riskiest parts (planner, real-time rooms, procedural 3D) could be tried early on small data, and each increment could be tested on its own. Table 1.1 lists the increments; the tests of earlier areas were rerun before each new increment was accepted.`);
  b.table('Iterations of the development', ['Iteration', 'Increment delivered', 'Verified by'], [
    ['1', 'Schema, seed script, first 42 Kathmandu Valley sites, REST API, story map, accounts and administrator role', 'AT-02 to AT-04, AT-08, AT-09'],
    ['2', 'Walk planner (orienteering with time windows), recommender, shareable walks', 'UT-01 to UT-05, AT-06'],
    ['3', 'Adaptive quiz (Elo, SM-2), leaderboards, Find the Monument, passport and badges', 'UT-06 to UT-09, AT-10, AT-11'],
    ['4', 'Live hunts over Socket.io; procedural 3D builder; Nepali interface; audio guide', 'hunt-sim script, visual review'],
    ['5', 'Expansion to 116 sites, source and photo verification, e-mail verification, hardening', 'AT-01 to AT-18, dataset checks'],
  ], [0.9, 5.0, 2.8], { center: [0] });

  b.h2('1.7 Report Organization');
  b.p('Chapter 1 introduces the project, its objectives, scope and method. Chapter 2 presents the theory, reviews existing systems and related research, and states the research gap. Chapter 3 analyzes the system: requirements, feasibility, use cases, data and process models, and the dataset. Chapter 4 describes the design (architecture, database, algorithms, 3D pipeline). Chapter 5 describes the implementation and testing. Chapter 6 concludes and lists future work. References and appendices follow.');

  // =====================================================================================================
  b.chapter('Background Study and Literature Review');

  b.h2('2.1 Background Theory');
  b.h3('2.1.1 Digital Heritage and UNESCO Listing');
  b.p(`Digital heritage is the use of computing to document, interpret and share cultural heritage, from databases and photographs to 3D reconstructions and serious games ${c('anderson')}. Sampada adopts the principle that play should rest on accurate content: the games sit on a sourced dataset, and every quiz answer comes with an explanation pointing back to a fact. The Kathmandu Valley property was inscribed in 1979 under criteria (iii), (iv) and (vi) ${c('unesco121')}; the dataset flags 27 of its 116 entries as UNESCO sites, including Lumbini ${c('unesco666')}. The “Sapta Sampada” badge is earned by stamping all seven valley zones.`);
  b.h3('2.1.2 Gamified Learning');
  b.p(`Gamification is the use of game design elements in non-game contexts ${c('deterding')}. Empirical reviews report mostly positive effects that depend strongly on context and users ${c('hamari')}, and a meta-analysis found small to moderate effects on cognitive, motivational and behavioral outcomes, with fiction and social interaction mattering for behavior ${c('sailer')}. Sampada uses points, levels, badges, leaderboards, the fiction of a pilgrim collecting stamps, and social play in live hunts. These choices follow the findings; they are not claimed to be proven for this application. A leaderboard alone is not enough, so explanations and site pages must carry real content.`);
  b.h3('2.1.3 Elo Rating and Adaptive Practice');
  b.p(`The Elo system gives each player a rating and predicts the chance of winning against another as 1 / (1 + 10^((R_B − R_A)/400)); after a game the rating moves by K times the difference between result and prediction ${c('elo')}. Adaptive practice treats an answer as a match between learner and question, estimating both skill and difficulty on the fly ${c('klinkenberg')}; the approach is simple, robust and effective in education, including geography facts that resemble heritage facts ${c('pelanek')}. In Sampada the next question is the one whose predicted chance of a correct answer is closest to 70%, and K falls from 40 to 28 to 18 as a player answers more questions.`);
  b.h3('2.1.4 SM-2 Spaced Repetition');
  b.p(`Memory fades unless material is reviewed at growing intervals. SM-2, the basis of SuperMemo, computes the next interval from an ease factor and the quality of the last recall ${c('wozniak')}. Retrieval practice improves retention more than re-reading ${c('roediger')}, and optimized schedules improve recall in large natural experiments ${c('tabibian')}. Sampada uses the simpler SM-2 rule, which needs no training data, only for missed questions: a card starts at ease 2.5, returns after 1 day, then 6 days, then at intervals multiplied by the ease, which never falls below 1.3.`);
  b.h3('2.1.5 Orienteering Problem and Haversine Distance');
  b.p(`In orienteering, a competitor visits control points within a time limit to collect the highest total score ${c('golden')}. The problem is NP-hard, so large instances use heuristics ${c('vansteenwegen')}; with opening hours it becomes the time-window variant, and applied to sightseeing, the tourist trip design problem ${c('gavalas')}. A heritage day plan is exactly this problem. Sampada uses greedy insertion by value per added minute followed by 2-opt, a local search that reverses route segments while they shorten the route ${c('croes')}. Travel times come from the haversine formula, d = 2R·asin(√(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2))) with R = 6,371 km, which is stable for short distances ${c('sinnott')}; it also scores guesses and checks whether a device is within 60 meters of a site.`);
  b.h3('2.1.6 WebGL, Procedural Modeling and WebSockets');
  b.p(`WebGL exposes the graphics processor to JavaScript without plugins ${c('webgl')}; three.js wraps it in a scene graph ${c('threejs')}, and React Three Fiber expresses the scene as React components. Procedural modeling generates geometry from rules, first for cities ${c('parish')} and then for buildings with shape grammars ${c('muller')}. Newar pagodas suit it well: a repeated structure of roof tiers on a stepped plinth. Sampada describes each site with a small specification and one builder turns it into a scene. A WebSocket is a full-duplex channel opened by an HTTP handshake ${c('rfc6455')}; Sampada uses Socket.io on top of it for live hunts, rooms identified by a six-character code where the server owns the clock and the scores.`);

  b.h2('2.2 Review of Existing Systems');
  b.p('The comparison below is based on public pages and is limited to features relevant to this project. It states what each system does, not its quality.');
  b.bullets([
    `**Google Arts & Culture** offers high-resolution images, virtual tours and curated stories from partner institutions ${c('gac')}. Small Nepali shrines appear thinly represented, and the author found no day planner or live local hunt.`,
    `**UNESCO World Heritage Centre** is the authoritative source for listed properties ${c('unesco121')}, but it is not interactive and gives no visiting or planning help.`,
    `**Department of Archaeology and tourism resources** hold the legal record of monuments ${c('doa')} as lists and books, not as a learning or planning tool.`,
    `**Wikipedia, Wikidata and Commons** are a large free multilingual source ${c('wikidata')} on which Sampada itself depends, but they have no common structure for Nepali sites and uneven quality.`,
    `**Sketchfab** hosts precise scans, including post-earthquake Kathmandu ${c('sketchfab')}, but for few monuments, each on a separate page, and some are sold.`,
    '**Location-based games such as Pokémon GO** bring people to real places, but their points of interest carry little verified heritage content.',
  ]);
  b.table('Comparison of Sampada with existing systems', ['System', 'Nepal-wide small sites', 'Sourced facts', 'Day planning', '3D model', 'Games', 'Nepali'], [
    ['Google Arts & Culture', 'Limited', 'Curated', 'No', 'Some', 'Generic', 'Limited'],
    ['UNESCO WHC site', 'Listed only', 'Official', 'No', 'No', 'No', 'No'],
    ['Dept. of Archaeology', 'Lists', 'Official status', 'No', 'No', 'No', 'Mixed'],
    ['Wikipedia and Commons', 'Uneven', 'Varies', 'No', 'No', 'No', 'Some'],
    ['Sketchfab', 'Few', 'Notes', 'No', 'Scanned', 'No', 'No'],
    ['Pokémon GO style', 'No', 'No', 'No', 'No', 'Yes', 'No'],
    ['**Sampada**', '116 sites, 7 provinces', '568 source links', 'Yes, with hours', 'Procedural, all 116', 'Quiz, guess, hunts', 'Machine-written, unreviewed'],
  ], [1.7, 1.2, 1.1, 1.1, 1.2, 1.1, 1.2]);
  b.p('Sampada does not replace these systems and is weaker in several respects: it can never be more authoritative than its sources (Commons, Wikipedia, Wikidata, OpenStreetMap), its 3D models cannot match a scan, its dataset is small, its Nepali text is unreviewed, and it has not been tested at large scale. What it offers instead is a combination none of them provides: a structured dataset of small and large sites across all provinces, an opening-hours-aware day planner, an adaptive quiz, a distance-scored guessing game, GPS-checked passport stamps, account-free live rooms and a uniform 3D model of every site, in one free bilingual interface.');

  b.h2('2.3 Review of Related Research');
  b.p(`Hamari et al. found gamification effects mostly positive but context dependent, with a risk of novelty effects ${c('hamari')}, which supports tying games to real content. Klinkenberg et al. built a large adaptive arithmetic system on Elo without a calibration phase ${c('klinkenberg')}, and Pelánek recommended Elo for its simplicity ${c('pelanek')}. For tour planning, surveys conclude that heuristics are the practical choice for interactive planners ${c('vansteenwegen', 'gavalas')}; Sampada’s planner is a compact member of this family, tested against exhaustive search on small instances (UT-05) but with no optimality guarantee on large ones. Procedural modeling systems were built for general urban models, not Nepali styles ${c('parish', 'muller')}, while 3D documentation of Nepali monuments relies on scanning ${c('sketchfab')}; a parameterized builder is a lower-cost route that needs no survey of each site. Wikidata and OpenStreetMap supply structured and geographic data ${c('wikidata', 'osm')} but are only as accurate as their last editor; Section 3.6 describes the cross-checks and discrepancies found.`);

  b.h2('2.4 Research Gap');
  b.numbered([
    'Scanned 3D models exist for only a few monuments; there is no low-cost uniform 3D view of many sites across the country.',
    'Heritage platforms for Nepal are not combined with planning that understands opening hours, walking and taxi legs and interests.',
    'Adaptive quiz methods well studied in mathematics and geography have not, to the author’s knowledge, been applied to Nepali heritage content.',
    'GPS-verified visits tied to verified content and a passport are not widely available, and bilingual, openly licensed content covering all seven provinces is missing.',
  ], 'num2');
  b.p('Sampada addresses these gaps at the scale of a student project. It claims no new algorithms; its contribution is the integration of established techniques over one carefully collected dataset, with an honest account of where the result is approximate.');

  // =====================================================================================================
  b.chapter('System Analysis');

  b.h2('3.1 Requirement Identification');
  b.p('The stakeholders are the guest visitor, the registered explorer (who keeps a rating, review cards, stamps, badges and saved walks), students and teachers using the quiz and hunts, the administrator who maintains the dataset, and heritage reviewers who are not yet involved (Section 1.4.2). Requirements were collected from the systems of Section 2.2, from user stories per stakeholder, and refined over the iterations of Table 1.1.');
  b.h3('3.1.1 Functional Requirements');
  b.table('Functional requirements', ['ID', 'Requirement', 'Actor'], [
    ['FR-01', 'Browse and search sites; filter by province, type, religion, city and UNESCO status', 'All'],
    ['FR-02', 'Site page with story, legend, facts, festivals, hours, fees, 2015 earthquake note, gallery and sources', 'All'],
    ['FR-03', 'Interactive 3D model of each site with day and dusk lighting', 'All'],
    ['FR-04', 'Nepal map with province filters and clustered pins', 'All'],
    ['FR-05', 'Audio guide; English and Nepali interface and content', 'All'],
    ['FR-06', 'Recommend sites with stated reasons', 'All'],
    ['FR-07', 'Register, verify e-mail by code, sign in, reset password', 'Visitor'],
    ['FR-08', 'Plan a heritage walk from start point, time window and interests; save and share by link', 'All; saving needs sign-in'],
    ['FR-09', 'Adaptive quiz choosing questions by rating, with explanations; spaced-repetition queue of missed questions', 'All; queue for Explorer'],
    ['FR-10', 'Find the Monument: guess a location from a photo and clue with hints and server-side scoring', 'All'],
    ['FR-11', 'Host and join live hunts by six-character code without an account, with live leaderboard and reconnection', 'All'],
    ['FR-12', 'Stamp a site by GPS (within 60 m) or manually; award badges; favorites, ratings and leaderboards', 'Explorer'],
    ['FR-13', 'Send verification and reset e-mail through SMTP, or save a preview when SMTP is not configured', 'System'],
    ['FR-14', 'Administrator statistics; create, edit and delete sites, questions and clues; upload photographs', 'Administrator'],
    ['FR-15', 'Deactivate users, change roles, delete reviews', 'Administrator'],
  ], [0.8, 6.0, 1.8], { center: [0] });
  b.h3('3.1.2 Non-functional Requirements');
  b.table('Non-functional requirements', ['ID', 'Quality', 'Requirement'], [
    ['NFR-01', 'Security', 'bcrypt password hashes; signed JWT valid 7 days; admin role check on every admin route; e-mail codes expire in 10 minutes, stored as HMAC hashes, lock after 5 wrong tries'],
    ['NFR-02', 'Security', 'Sign-in paused for five minutes after ten wrong passwords; image uploads only, by file signature, up to 6 MB; request bodies up to 200 KB'],
    ['NFR-03', 'Fairness', 'Answers never sent to the client before answering; option order shuffled per run; time measured by the server'],
    ['NFR-04', 'Performance', 'Catalog served from memory, refreshed every 60 seconds or on admin edit; day plan within a few seconds'],
    ['NFR-05', 'Usability', 'Responsive layout; light, dark and high-contrast themes; keyboard focus visible; English and Nepali'],
    ['NFR-06', 'Reliability', 'Live players keep their place for a grace period after a dropped connection; unused rooms are cleaned up'],
    ['NFR-07', 'Maintainability', 'Algorithms are pure modules separate from routes; 12 unit and 18 API tests; data in JSON files seeded by one script'],
    ['NFR-08', 'Legal and cost', 'Photographs only under Creative Commons or public-domain terms with credit shown; free components and tiles, no paid API keys'],
  ], [0.9, 1.3, 6.4], { center: [0] });

  b.h2('3.2 Feasibility Study');
  b.p('**Technical.** Every component is open source and runs on an ordinary laptop: Node.js, Express 4, Socket.io 4, MySQL 8.4, React 18, Vite 5, three.js with React Three Fiber, and MapLibre GL. The risky parts were prototyped in early iterations (Table 1.1), and a portable MySQL copy with a setup script removes installation difficulty. **Operational.** The system needs no training; guests can start a quiz at once and a live hunt needs only a code and a name. Operation needs one person to keep the server running and review content.');
  b.p('**Economic.** Table 3.3 gives rounded estimates by the author, excluding the author’s own time. Running cost is dominated by hosting, and the system can also run free on a college computer; the benefit is non-monetary.');
  b.table('Estimated cost of development and a first year of small deployment', ['Item', 'Estimated cost (NPR)'], [
    ['Software, libraries, map tiles, photographs, textures, fonts, Gmail SMTP', '0 (free and open source)'],
    ['Internet during about five months of development', '7,500'],
    ['Small virtual server for one year (1 vCPU, 1 to 2 GB RAM)', 'About 8,000'],
    ['Domain name for one year (optional)', 'About 1,800'],
    ['Printing and binding of the report', 'About 2,500'],
    ['**Total**', '**About 19,800**'],
  ], [5.8, 2.8]);
  b.p('**Schedule.** Work was planned as the five iterations of Table 1.1, with data collection parallel to the early increments and report writing at the end (Figure 3.1). Because every iteration produced a working increment, a delay in one area, such as the 3D models, did not block the others. The project is feasible within the eighth semester.');
  b.fig(F('gantt'), 'Project schedule (Gantt chart)', 5.2);

  b.h2('3.3 Use Case Model');
  b.p('Figure 3.2 shows the actors and use cases. A guest can explore and play; an explorer is a registered guest who also keeps progress, stamps and saved walks; the administrator maintains content and users; the mail server is a secondary actor that receives verification and reset messages.');
  b.fig(F('usecase'), 'Use case diagram of Hamro Prachin Sampada', 5.2);
  b.p('Two of the central use cases are described in Tables 3.4 and 3.5.');
  b.table('Use case description: Plan a heritage walk', ['Item', 'Description'], [
    ['Actor', 'Guest or explorer'],
    ['Main flow', '1. Choose a start point and set start and end time, interests and optional must-see sites.\n2. System computes site values, builds travel legs (walk up to 2.5 km, otherwise taxi) and runs greedy insertion and 2-opt.\n3. System shows ordered stops with arrival and leave times, waiting time and fare estimate.'],
    ['Alternative flow', 'An end time not after the start is rejected. A closed or too distant site is listed as skipped with a reason.'],
    ['Postcondition', 'A signed-in explorer may save the walk and share it by a ten-character link'],
  ], [1.8, 6.8]);
  b.table('Use case description: Answer adaptive quiz questions', ['Item', 'Description'], [
    ['Actor', 'Guest or explorer'],
    ['Main flow', '1. System picks the unseen question whose predicted success is closest to 70%, preferring questions due for review.\n2. Player answers within 25 seconds; options are shuffled.\n3. System checks the answer on the server, updates player and question ratings by Elo, and returns the answer with an explanation.\n4. A wrong answer creates or resets a review card (SM-2).'],
    ['Alternative flow', 'An answer after the limit plus a 3 second grace counts as a time-out; a question already answered in the run is refused.'],
    ['Postcondition', 'Rating, attempt and review card are saved for an explorer; a guest keeps the rating in the browser'],
  ], [1.8, 6.8]);

  b.h2('3.4 Data Modeling');
  b.p('The database has 14 tables (Figure 3.3, Table 3.6). The `monuments` table is the center: questions, clues, visits, favorites and ratings all refer to it.');
  b.fig(F('erd'), 'Entity relationship diagram', 5.2);
  b.table('Entities and their main attributes', ['Entity', 'Key attributes and relationships'], [
    ['users, email_codes', 'email (unique), password_hash, role, interests, Elo rating, is_active, email_verified; one-time code hashes with purpose, attempts, expiry'],
    ['monuments', 'slug (unique), English and Nepali names, province, lat, lng, type, story, legend, facts, hours, fees, photo and credit, sources, 3D model (JSON columns for lists)'],
    ['questions, clues', 'monument_id (FK); question, four options, answer_index, difficulty, Elo rating, explanation, Nepali counterparts; clue text'],
    ['quiz_attempts, review_cards', 'user and question (FK); correctness, time, rating before and after; SM-2 ease, interval, due date'],
    ['visits, favorites, ratings, badges', 'user and monument (composite keys); stamp method (gps, manual, game); stars 1 to 5; badge key'],
    ['tours, game_scores, hunts', 'saved walk with plan JSON and share code; solo and hunt scores (user nullable, SET NULL); finished hunt results'],
  ], [2.2, 6.4]);
  b.p('Lists read together with a site (facts, festivals, gallery, model, sources) are stored as MySQL JSON columns instead of many small tables. A zone such as a Durbar Square is a monument whose slug other monuments name in `zone_slug`. Rows belonging to a user are deleted with the user (`ON DELETE CASCADE`), but a game score keeps the score and drops the link, so leaderboards do not change when an account is removed.');

  b.h2('3.5 Process Modeling');
  b.p('At context level (DFD level 0), Sampada is a single process. The guest or explorer sends searches, answers, guesses, locations and walk requests and receives pages, questions, scores, plans and stamps; the administrator sends content and user changes and receives statistics; the system sends e-mail to the mail server and reads map tiles and photographs from external services. Figure 3.4 splits it into catalog and discovery, walk planning, adaptive quiz, games and live hunts, passport and badges, accounts and e-mail, and administration, over four data stores: catalog, users and codes, progress, and saved tours. The live hunt keeps room state in memory and writes only the final result.');
  b.fig(F('dfd1'), 'DFD level 1', 5.2);

  b.h2('3.6 Data Collection and Verification');
  b.p('The quality of Sampada depends on its dataset, so it was collected in stages, each with a checkable source. This section states what has and has not been verified.');
  b.h3('3.6.1 Selection of Sites');
  b.p('The first set was the seven UNESCO zones of the Kathmandu Valley with their principal monuments; it was then extended to the other six provinces by choosing recognized pilgrimage places, forts, archaeological sites and protected monuments that have a free licensed photograph and enough published information (Table 3.7). The imbalance toward Bagmati is deliberate for this version and is a stated limitation. By type there are 46 pagoda temples, 9 shikhara temples, 7 palaces, 7 courtyards, 6 stupas, 5 forts and others.');
  b.table('Sites in the dataset by province', ['Province', 'Sites', 'Province', 'Sites'], [
    ['Bagmati', '62', 'Lumbini', '11'],
    ['Gandaki', '15', 'Koshi', '7'],
    ['Sudurpashchim', '10', 'Madhesh', '6'],
    ['Karnali', '5', '**Total**', '**116**'],
  ], [2.2, 1.2, 2.2, 1.2], { center: [1, 3] });
  b.h3('3.6.2 Coordinates, Facts and Photographs');
  b.p(`The preferred coordinate source is the OpenStreetMap centroid ${c('osm')}, the second the Wikidata property P625 ${c('wikidata')}; where both exist they were compared and the source is noted in coord_source. They disagree often enough to matter: one Wikidata coordinate for a valley temple pointed more than 100 km away, several had only two or three decimals (about a kilometer), and one item carried the coordinates of a town in India. In such cases the OpenStreetMap point or a geotagged photograph was used and the reason noted. Two entries are marked “approximate”, and the 13 Patan entries list OpenStreetMap or Wikidata links among their sources but carry no separate coord_source note. Coordinates have been compared by source only, not surveyed in the field.`);
  b.p('Each fact sheet (description, story, legend, built year, dynasty, architecture, deity, festivals, 2015 earthquake effect) was written from published sources listed on the site page: 568 links in all, 3 to 8 per site, mostly Wikipedia (143), OpenStreetMap (81), Wikidata (76), Wikimedia Commons (69) and UNESCO (15). Opening hours are recorded for 10 sites and fees for 43; for other sites the planner assumes the site is always open, and the site page says that hours and fees change. There are 708 photographs, all from Wikimedia Commons with author and license stored and shown; the main photographs are mostly CC BY-SA 4.0 (94 of 116). Textures are CC0 from Poly Haven. Each site has a 3D model specification written from photographs and descriptions, in 15 model kinds, the largest being pagoda (49 sites).');
  b.h3('3.6.3 Quiz Questions, Clues and Nepali Text');
  b.p('Each site has exactly 10 multiple-choice questions (1,160 in all, difficulty 1 to 5, each with four options and a one-sentence explanation) and 6 clues (696 in all). The questions and clues were drafted with the help of an AI assistant from the fact sheet of the site, with the instruction that each answer must be supported by that sheet. Stored answer positions are not balanced, so the server shuffles options per run before comparing the choice. The Nepali names, descriptions, questions, clues and interface strings were produced by machine translation under a style guide asking for everyday polite Nepali; all 116 sites and 1,160 questions have a Nepali version, which has not been reviewed by a native editor and may contain unnatural wording or spelling mistakes.');
  b.h3('3.6.4 Checks Performed and Their Limits');
  b.p('Every site has coordinates, a main photograph with a stored license, a model specification, a Nepali version, at least 3 source links, and exactly 10 questions of four options with the answer index in range. MySQL enforces column types at seeding, the administrator API validates edits, and test AT-02 confirms that the catalog has more than 100 sites in all seven provinces.');
  b.p('The following have not been done. The facts have not been reviewed by a historian or the Department of Archaeology and inherit the errors of their sources. The AI-drafted questions and clues may contain mistakes that the checks cannot detect, since a check can confirm that an answer exists but not that it is true. The Nepali text has not been proofread by a native speaker. The coordinates have not been verified on the ground. Until these reviews are done, the dataset should be described as researched and cross-checked, not officially verified. The administrator can correct entries at any time (FR-14).');
}
