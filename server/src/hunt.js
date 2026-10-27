// Live multiplayer heritage hunt (Socket.io).
// A host opens a room and gets a 6-character code; friends join by code with just a name (no account needed).
// Every round shows the same photo + clue to everyone; players drop a pin on the map; the server scores
// guesses (distance + speed), broadcasts a live leaderboard, and reveals the answer when the round ends.
import crypto from 'node:crypto';
import { getCatalog, card } from './catalog.js';
import { query } from './db.js';
import { scoreGuess, rankPlayers, pickRounds, inValley } from './algorithms/game.js';
import { readToken } from './middleware/auth.js';
import { checkBadges } from './badges.js';

const rooms = new Map(); // code -> room
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
const clean = (s, n = 24) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

function publicRoom(room) {
  return {
    code: room.code, hostId: room.hostId, status: room.status, roundIndex: room.roundIndex,
    totalRounds: room.rounds.length, roundSeconds: room.roundSeconds,
    players: rankPlayers([...room.players.values()].map((p) => ({ id: p.id, name: p.name, points: p.points, timeMs: p.timeMs, joinedAt: p.joinedAt, answered: p.answered, connected: p.connected, color: p.color, host: p.socketId === room.hostId }))),
  };
}

const COLORS = ['#9E3B26', '#1F4E79', '#2E6B3F', '#8A5A00', '#6B3FA0', '#B3261E', '#0F766E', '#3B2416'];

export function attachHunts(io) {
  io.on('connection', (socket) => {
    const user = readToken(socket.handshake.auth?.token);
    let joined = null; // { code, playerId }

    const emitRoom = (room) => io.to(room.code).emit('room', publicRoom(room));

    socket.on('host', async ({ name, rounds = 5, roundSeconds = 45 } = {}, ack = () => {}) => {
      try {
        const cat = await getCatalog();
        const pool = cat.monuments.filter((m) => m.image_url && cat.clues.some((c) => c.monument_id === m.id) && inValley(m));
        let code = newCode();
        while (rooms.has(code)) code = newCode();
        const n = Math.max(3, Math.min(10, Number(rounds) || 5));
        const seed = crypto.randomInt(1, 2 ** 31);
        const room = {
          code, hostId: socket.id, status: 'lobby', roundIndex: -1, roundSeconds: Math.max(20, Math.min(90, Number(roundSeconds) || 45)),
          rounds: pickRounds(pool, n, seed).map((m, i) => {
            const clues = cat.clues.filter((c) => c.monument_id === m.id);
            return { monumentId: m.id, clue: clues[(seed + i) % clues.length].clue, clue_np: clues[(seed + i) % clues.length].clue_np || null };
          }),
          players: new Map(), created: Date.now(), timer: null, roundStarted: 0,
        };
        rooms.set(code, room);
        ack({ ok: true, code });
      } catch (e) { ack({ ok: false, error: 'Could not create the hunt' }); }
    });

    socket.on('join', ({ code, name } = {}, ack = () => {}) => {
      const room = rooms.get(clean(code, 6).toUpperCase());
      if (!room) return ack({ ok: false, error: 'No hunt with that code' });
      const playerName = clean(user?.name || name) || 'Explorer';
      // rejoin after a dropped connection keeps the score
      const existing = [...room.players.values()].find((p) => p.name === playerName && !p.connected);
      if (!existing && room.status !== 'lobby') return ack({ ok: false, error: 'This hunt has already started' });
      if (!existing && room.players.size >= 30) return ack({ ok: false, error: 'This hunt is full (30 players)' });
      if (!existing && [...room.players.values()].some((p) => p.name.toLowerCase() === playerName.toLowerCase())) return ack({ ok: false, error: 'That name is taken in this hunt' });
      const p = existing || { id: crypto.randomUUID(), name: playerName, userId: user?.id || null, points: 0, timeMs: 0, joinedAt: Date.now(), answered: false, guesses: [], color: COLORS[room.players.size % COLORS.length] };
      if (existing) room.players.delete(existing.socketId);
      p.socketId = socket.id; p.connected = true;
      room.players.set(socket.id, p);
      if (room.hostId === socket.id || (!room.hostSet && room.players.size === 1)) { room.hostId = socket.id; room.hostSet = true; }
      socket.join(room.code);
      joined = { code: room.code, playerId: p.id };
      ack({ ok: true, playerId: p.id, room: publicRoom(room), round: room.status === 'playing' ? roundPayload(room) : null });
      emitRoom(room);
    });

    socket.on('start', async (_ = {}, ack = () => {}) => {
      const room = joined && rooms.get(joined.code);
      if (!room) return ack({ ok: false, error: 'Not in a hunt' });
      if (room.hostId !== socket.id) return ack({ ok: false, error: 'Only the host can start' });
      if (room.status !== 'lobby') return ack({ ok: false, error: 'Already started' });
      room.status = 'playing';
      ack({ ok: true });
      await nextRound(io, room);
    });

    socket.on('guess', async ({ lat, lng } = {}, ack = () => {}) => {
      const room = joined && rooms.get(joined.code);
      if (!room || room.status !== 'playing') return ack({ ok: false, error: 'No round running' });
      const p = room.players.get(socket.id);
      if (!p || p.answered) return ack({ ok: false, error: 'Already answered' });
      if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return ack({ ok: false, error: 'Drop a pin first' });
      const cat = await getCatalog();
      const m = cat.byId.get(room.rounds[room.roundIndex].monumentId);
      const timeMs = Date.now() - room.roundStarted;
      const s = scoreGuess({ lat: Number(lat), lng: Number(lng) }, m, { timeMs, limitMs: room.roundSeconds * 1000 });
      p.answered = true; p.points += s.points; p.timeMs += timeMs;
      p.guesses[room.roundIndex] = { lat: Number(lat), lng: Number(lng), ...s };
      ack({ ok: true, points: s.points, metres: s.metres }); // the answer location is only revealed at round end
      emitRoom(room);
      const live = [...room.players.values()].filter((x) => x.connected);
      if (live.every((x) => x.answered)) endRound(io, room);
    });

    socket.on('next', async (_ = {}, ack = () => {}) => {
      const room = joined && rooms.get(joined.code);
      if (!room || room.hostId !== socket.id || room.status !== 'reveal') return ack({ ok: false });
      ack({ ok: true });
      if (room.roundIndex + 1 >= room.rounds.length) await finish(io, room);
      else { room.status = 'playing'; await nextRound(io, room); }
    });

    socket.on('reaction', ({ emoji } = {}) => {
      const room = joined && rooms.get(joined.code);
      const p = room?.players.get(socket.id);
      if (!room || !p || !['🙏', '🔥', '👏', '😮', '🎉'].includes(emoji)) return;
      io.to(room.code).emit('reaction', { name: p.name, emoji, color: p.color });
    });

    socket.on('leave', () => leave());
    socket.on('disconnect', () => leave());

    function leave() {
      const room = joined && rooms.get(joined.code);
      if (!room) return;
      const p = room.players.get(socket.id);
      if (p) {
        p.connected = false;
        if (room.status === 'lobby') room.players.delete(socket.id);
      }
      socket.leave(room.code);
      // hand the host role to the next connected player
      if (room.hostId === socket.id) {
        const next = [...room.players.values()].find((x) => x.connected);
        room.hostId = next ? next.socketId : null;
      }
      joined = null;
      if (![...room.players.values()].some((x) => x.connected)) { clearTimeout(room.timer); rooms.delete(room.code); return; }
      emitRoom(room);
      if (room.status === 'playing' && [...room.players.values()].filter((x) => x.connected).every((x) => x.answered)) endRound(io, room);
    }
  });

  // drop abandoned rooms after 2 hours
  setInterval(() => { for (const [k, r] of rooms) if (Date.now() - r.created > 2 * 3600_000) { clearTimeout(r.timer); rooms.delete(k); } }, 10 * 60_000).unref();
}

function roundPayload(room) {
  return { index: room.roundIndex, clue: room.rounds[room.roundIndex].clue, clue_np: room.rounds[room.roundIndex].clue_np, image: room.rounds[room.roundIndex].image, credit: room.rounds[room.roundIndex].credit, endsAt: room.roundStarted + room.roundSeconds * 1000 };
}

async function nextRound(io, room) {
  const cat = await getCatalog();
  room.roundIndex += 1;
  const r = room.rounds[room.roundIndex];
  const m = cat.byId.get(r.monumentId);
  r.image = m.image_url; r.credit = m.image_credit;
  for (const p of room.players.values()) p.answered = false;
  room.roundStarted = Date.now();
  io.to(room.code).emit('round', roundPayload(room));
  io.to(room.code).emit('room', publicRoom(room));
  clearTimeout(room.timer);
  room.timer = setTimeout(() => endRound(io, room), room.roundSeconds * 1000 + 300);
}

async function endRound(io, room) {
  if (room.status !== 'playing') return;
  clearTimeout(room.timer);
  const cat = await getCatalog();
  const m = cat.byId.get(room.rounds[room.roundIndex].monumentId);
  for (const p of room.players.values()) if (!p.answered) { p.timeMs += room.roundSeconds * 1000; p.guesses[room.roundIndex] = null; }
  room.status = 'reveal';
  io.to(room.code).emit('reveal', {
    index: room.roundIndex, last: room.roundIndex + 1 >= room.rounds.length, monument: card(m), story: m.short_text,
    guesses: [...room.players.values()].map((p) => ({ name: p.name, color: p.color, guess: p.guesses[room.roundIndex] })),
  });
  io.to(room.code).emit('room', publicRoom(room));
}

async function finish(io, room) {
  room.status = 'finished';
  const ranked = rankPlayers([...room.players.values()].map((p) => ({ id: p.id, name: p.name, points: p.points, timeMs: p.timeMs, joinedAt: p.joinedAt, userId: p.userId, color: p.color })));
  io.to(room.code).emit('finished', { ranking: ranked });
  io.to(room.code).emit('room', publicRoom(room));
  try {
    await query('INSERT INTO hunts (code, host_name, rounds, round_seconds, players, winner_name, results_json, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [room.code, ranked[0]?.name || 'Host', room.rounds.length, room.roundSeconds, ranked.length, ranked[0]?.name || null, JSON.stringify(ranked.map(({ name, points, rank }) => ({ name, points, rank })))]);
    for (const p of ranked) {
      await query("INSERT INTO game_scores (user_id, player_name, mode, points, rounds, hunt_code) VALUES (?, ?, 'hunt', ?, ?, ?)", [p.userId, p.name, p.points, room.rounds.length, room.code]);
      if (p.userId) await checkBadges(p.userId);
    }
  } catch (e) { console.error('[hunt] could not save results', e.message); }
}
