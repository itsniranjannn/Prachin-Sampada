# Hamro Prachin Sampada (हाम्रो प्राचीन सम्पदा)

Nepal heritage explorer: 116 sites, 3D model per site, story map, yatra planner, adaptive quiz, Find the Monument,
live multiplayer hunts and a heritage passport. React + Vite client, Express + Socket.io + MySQL server.

## Requirements
- Node.js 20 or newer
- MySQL 8.x running on this computer (default port 3306, user `root`)

## Setup (5 steps)

1. **Database.** Open a terminal in this folder and import the ready-made schema + data (creates database `sampada`):
   ```
   mysql -u root -p < database/sampada.sql
   ```
   (If your root user has no password, drop `-p`. MySQL Workbench works too: Server > Data Import > Import from Self-Contained File.)
   *Alternative:* skip the import and run `npm run db:init` in step 3; it creates and seeds the same database from `server/db/schema.sql` and `server/db/data`.

2. **Settings.** `server/.env` is already provided. Edit it only if your MySQL differs:
   `DB_PORT` (3306), `DB_USER` (root), `DB_PASSWORD` (put your MySQL root password here if you have one).
   Leave `SMTP_USER` / `SMTP_PASS` empty to run without real email: emails are saved to `server/mail-outbox/` and codes are printed in the server console.

3. **Server** (API + live hunts on http://localhost:5050):
   ```
   cd server
   npm install
   npm run dev
   ```

4. **Client** (second terminal, http://localhost:5174):
   ```
   cd client
   npm install
   npm run dev
   ```

5. Open **http://localhost:5174**.

Demo accounts: explorer `demo@sampada.np` / `explorer123`, admin `admin@sampada.np` / `admin123`.

## Tests
- `cd server && npm test` : 12 unit tests (algorithms)
- `cd server && npm run test:api` : 18 API flow tests (server must be running; run `npm run db:init` first for a clean database)

## Notes
- The database already holds 116 sites, 1,160 quiz questions and 696 clues. `npm run db:init` drops and recreates it.
- Map tiles, photos and fonts load from the internet (OpenFreeMap, Wikimedia Commons, Google Fonts), so an internet connection is needed for them.
- Credits: OpenStreetMap / OpenFreeMap, Wikimedia Commons (CC), Poly Haven textures (CC0), Google Fonts.
