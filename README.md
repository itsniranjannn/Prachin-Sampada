# Hamro Prachin Sampada · हाम्रो प्राचीन सम्पदा

A free, bilingual heritage explorer for Nepal's temples, stupas, palaces and pilgrim sites across all seven provinces:
a 3D story map, audio-guide stories, photo galleries, a 3D model of every site, a shortest heritage-yatra planner, an adaptive quiz trail, a "Find the Monument" photo game, live multiplayer heritage hunts,
and a heritage passport with GPS stamps and badges. Built with React + Vite, Express, Socket.io and MySQL.

## First time after cloning

The MySQL binaries, the database files and `.env` are not in the repository.

1. Download **MySQL Community Server 8.4 LTS, Windows ZIP Archive** from https://dev.mysql.com/downloads/mysql/ and
   extract it so that `.mysql\mysql-8.4.3-winx64\bin\mysqld.exe` exists (rename the folder if your version differs).
2. Run `setup-mysql.cmd` once. It writes `.mysql\my.ini` for this folder and creates an empty data directory.
3. Copy `server\.env.example` to `server\.env` and set `JWT_SECRET` to any long random string.

Already have MySQL running elsewhere? Skip steps 1–2 and set `DB_PORT`, `DB_USER` and `DB_PASSWORD` in `server\.env`.

## Run it (Windows)

1. **Start MySQL** (portable, inside this folder, port 3307): double-click `start-mysql.cmd` and keep the window open.
2. **Create and seed the database** (first time only):
   ```
   cd server
   npm install
   npm run db:init
   ```
3. **Start the API + live-hunt server:** `npm run dev` inside `server` (http://localhost:5050).
4. **Start the web app:** in a second terminal, `cd client`, `npm install`, `npm run dev`, then open http://localhost:5174.

Demo accounts: explorer `demo@sampada.np` / `explorer123`, admin `admin@sampada.np` / `admin123`.

## Tests

- `cd server && npm test`: 12 unit tests for the algorithms (tour planner vs brute force, Elo, SM-2, scoring in valley and Nepal scopes, recommender).
- `cd server && npm run test:api`: 18 end-to-end API tests (needs the server running on a freshly seeded database).
- `node server/test/hunt-sim.mjs`: simulates a 3-player live hunt over Socket.io.

## What is inside

| Area | How |
|---|---|
| Yatra planner | Orienteering problem with time windows: greedy value-per-minute insertion, 2-opt, re-insertion; walk vs taxi legs |
| Adaptive quiz | Elo ratings for players and questions, next question at ~70% predicted success; SM-2 spaced repetition for misses |
| Find the Monument | Haversine distance, exponential distance score + speed bonus; Valley scope (metres) or All Nepal scope (kilometres); answers kept on the server |
| Live hunts | Socket.io rooms with 6-letter codes, server-timed rounds, live leaderboard (points, then time), reconnect |
| Recommender | Tag cosine + Bayesian rating + novelty + nearness, with city-diversity re-ranking and reasons |
| 3D | A procedural builder (three.js / React Three Fiber) turns each site's researched model spec (roof tiers, plinth levels, guardian sculptures, features, surroundings) into its own scene, textured with CC0 Poly Haven materials, with day and dusk-aarti lighting |
| Photos | 4-6 extra CC-licensed Wikimedia Commons photos per site in a swipeable gallery with a full-screen lightbox |
| Map | Nepal-wide MapLibre GL map on free OpenFreeMap vector tiles: province filters, pin clustering, tilted 3D buildings |
| Data | Verified heritage sites across the seven provinces, starting from 42 in the Kathmandu Valley (coordinates from Wikidata/OSM, CC-licensed Wikimedia photos), 210 quiz questions, 84 clues; see `server/db/data` |

Design system: Plum + Milk, Wine Red + Light Sand, Persian + Ghost and Lilac + Midnight palette pairs (WCAG-checked),
Cormorant Garamond / Jost / Martel / Hind typography, temple-arch photo frames, a hanging garland toran, mandala
ornaments, verses from the Bhagavad Gita, the Panchakshara of the Shiva Purana and Om Mani Padme Hum, Lenis smooth
scrolling, light, Ratri (dark) and Dhoop (outdoor high-contrast) themes.

Credits: map tiles by OpenFreeMap (OpenStreetMap data), photos from Wikimedia Commons (credited on each page), textures
from Poly Haven (CC0), fonts from Google Fonts.
