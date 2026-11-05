// Live multiplayer heritage hunt (Socket.io).
// A host opens a room and gets a 6-character code; friends join by code with just a name (no account needed).
// Every round shows the same photo + clue to everyone; players drop a pin on the map; the server scores
// guesses (distance + speed), broadcasts a live leaderboard, and reveals the answer when the round ends.
// Players are keyed by a stable playerId (not the socket), so a refresh or a dropped connection rejoins with its score.
import crypto from 'node:crypto';
import { getCatalog, card } from './catalog.js';
import { query } from './db.js';
import { scoreGuess, rankPlayers, pickRounds, inValley, imageVariants, pickVariant } from './algorithms/game.js';
import { readToken } from './middleware/auth.js';
import { checkBadges } from './badges.js';

const rooms = new Map(); // code -> room
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
const clean = (s, n = 24) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

const COLORS = ['#9E3B26', '#1F4E79', '#2E6B3F', '#8A5A00', '#6B3FA0', '#B3261E', '#0F766E', '#3B2416', '#A3366F', '#4A5D23', '#2B4C9B', '#7A4A12'];
const REACTIONS = ['🙏', '🔥', '👏', '😮', '🎉'];
const COUNTDOWN_MS = 3300; // the 3-2-1 before round one
const GRACE_MS = 8000; // how long a dropped player (or host) keeps their place before it is given up
const EMPTY_MS = 90_000; // a room nobody is connected to is dropped after this

const players = (room) => [...room.players.values()];
const live = (room) => players(room).filter((p) => p.connected);

function rankedList(room) {
  return rankPlayers(players(room).map((p) => ({ id: p.id, name: p.name, points: p.points, timeMs: p.timeMs, joinedAt: p.joinedAt, answered: p.answered, connected: p.connected, color: p.color, host: p.id === room.hostId, prevRank: p.prevRank ?? null, gain: p.gain ?? 0, userId: p.userId })));
}

function publicRoom(room) {
  return {
    code: room.code, hostId: room.hostId, status: room.status, roundIndex: room.roundIndex,
    totalRounds: room.rounds.length, roundSeconds: room.roundSeconds, startsAt: room.startsAt || null, serverNow: Date.now(),
    players: rankedList(room).map(({ userId, ...p }) => p),
  };
}

function roundPayload(room) {
  const r = room.rounds[room.roundIndex];
  return { index: room.roundIndex, clueId: r.clueId, clue: r.clue, clue_np: r.clue_np, image: r.image, credit: r.credit, endsAt: room.roundStarted + room.roundSeconds * 1000, serverNow: Date.now() };
}

async function buildRounds(room, n) {
  const cat = await getCatalog();
  const pool = cat.monuments.filter((m) => m.image_url && cat.clues.some((c) => c.monument_id === m.id) && inValley(m));
  const fresh = pool.filter((m) => !room.used.has(m.id));
  const source = fresh.length >= n ? fresh : pool; // play again prefers sites the group has not just seen
  const seed = crypto.randomInt(1, 2 ** 31);
  return pickRounds(source, n, seed).map((m) => {
    const clues = cat.clues.filter((c) => c.monument_id === m.id);
    const { clue, image } = pickVariant(clues, imageVariants(m), { seenClues: room.seenClues, seenImages: room.seenImages });
    room.used.add(m.id);
    if (clue?.id) room.seenClues.push(clue.id);
    if (image?.url) room.seenImages.push(String(image.url));
    return { monumentId: m.id, clueId: clue?.id || null, clue: clue?.clue || m.short_text, clue_np: clue?.clue_np || null, image: image?.url || m.image_url, credit: image?.credit ?? m.image_credit };
  });
}

export function attachHunts(io) {
  io.on('connection', (socket) => {
    const user = readToken(socket.handshake.auth?.token);
    let joined = null; // { room, playerId }

    const emitRoom = (room) => io.to(room.code).emit('room', publicRoom(room));
    const me = () => (joined ? joined.room.players.get(joined.playerId) : null);
    const isMine = (room, p) => p && p.socketId === socket.id && rooms.get(room.code) === room;

    socket.on('host', async ({ rounds = 5, roundSeconds = 45, seenClues = [], seenImages = [] } = {}, ack = () => {}) => {
      try {
        let code = newCode();
        while (rooms.has(code)) code = newCode();
        const n = Math.max(3, Math.min(10, Number(rounds) || 5));
        const room = {
          code, hostId: null, creatorSocket: socket.id, status: 'lobby', roundIndex: -1, roundSeconds: Math.max(20, Math.min(90, Number(roundSeconds) || 45)),
          rounds: [], players: new Map(), created: Date.now(), timer: null, roundStarted: 0, startsAt: null, lastReveal: null, final: null, n,
          used: new Set(), seenClues: Array.isArray(seenClues) ? seenClues.slice(-600) : [], seenImages: Array.isArray(seenImages) ? seenImages.slice(-600).map(String) : [],
          starting: false, lastReactionAt: new Map(),
        };
        room.rounds = await buildRounds(room, n);
        rooms.set(code, room);
        room.emptyTimer = setTimeout(() => dropRoom(room), EMPTY_MS); // cancelled when the host joins
        ack({ ok: true, code });
      } catch (e) { console.error('[hunt] host', e.message); ack({ ok: false, error: 'Could not create the hunt' }); }
    });

    socket.on('join', ({ code, name, playerId } = {}, ack = () => {}) => {
      const room = rooms.get(clean(code, 6).toUpperCase());
      if (!room) return ack({ ok: false, error: 'No hunt with that code' });
      const wanted = clean(user?.name || name);
      const playerName = wanted || 'Explorer';
      // the same player coming back: by stable id first, then by name if that seat is currently empty
      let existing = playerId ? room.players.get(String(playerId)) : null;
      if (!existing) existing = players(room).find((p) => !p.connected && sameName(p.name, playerName));
      if (!existing) {
        if (room.status === 'finished') return ack({ ok: false, error: 'This hunt has finished' });
        if (room.players.size >= 30) return ack({ ok: false, error: 'This hunt is full (30 players)' });
        if (players(room).some((p) => sameName(p.name, playerName))) return ack({ ok: false, error: 'That name is taken in this hunt. Pick another.' });
      }
      const p = existing || { id: crypto.randomUUID(), name: playerName, userId: user?.id || null, points: 0, timeMs: 0, joinedAt: Date.now(), answered: false, guesses: [], color: COLORS.find((c) => !players(room).some((x) => x.color === c)) || COLORS[room.players.size % COLORS.length] };
      if (existing && existing.socketId && existing.socketId !== socket.id) {
        const old = io.sockets.sockets.get(existing.socketId); // same player opened it somewhere else: the newest tab wins
        if (old) { old.leave(room.code); old.emit('replaced'); }
      }
      clearTimeout(p.dropTimer); clearTimeout(room.emptyTimer);
      p.socketId = socket.id; p.connected = true;
      room.players.set(p.id, p);
      if (!room.hostId) {
        const creatorGone = !io.sockets.sockets.has(room.creatorSocket);
        if (room.creatorSocket === socket.id || creatorGone) room.hostId = p.id;
      }
      socket.join(room.code);
      joined = { room, playerId: p.id };
      const g = p.guesses[room.roundIndex];
      ack({
        ok: true, playerId: p.id, room: publicRoom(room),
        round: room.status === 'playing' || room.status === 'reveal' ? roundPayload(room) : null,
        mine: room.status === 'playing' && p.answered && g ? { points: g.points, metres: g.metres, lat: g.lat, lng: g.lng } : null,
        reveal: room.status === 'reveal' ? room.lastReveal : null, final: room.status === 'finished' ? room.final : null,
        rejoined: !!existing,
      });
      emitRoom(room);
    });

    socket.on('start', (_ = {}, ack = () => {}) => {
      const room = joined?.room;
      if (!room || rooms.get(room.code) !== room) return ack({ ok: false, error: 'Not in a hunt' });
      if (room.hostId !== joined.playerId) return ack({ ok: false, error: 'Only the host can start' });
      if (room.status !== 'lobby' || room.starting) return ack({ ok: false, error: 'Already started' });
      room.starting = true;
      room.status = 'countdown'; room.startsAt = Date.now() + COUNTDOWN_MS;
      ack({ ok: true });
      io.to(room.code).emit('countdown', { startsAt: room.startsAt, serverNow: Date.now() });
      emitRoom(room);
      clearTimeout(room.timer);
      room.timer = setTimeout(() => { room.status = 'playing'; room.startsAt = null; nextRound(io, room); }, COUNTDOWN_MS);
    });

    socket.on('guess', async ({ lat, lng } = {}, ack = () => {}) => {
      const room = joined?.room;
      if (!room || rooms.get(room.code) !== room || room.status !== 'playing') return ack({ ok: false, error: 'No round running' });
      const p = me();
      if (!p || p.answered) return ack({ ok: false, error: 'Already answered' });
      if (lat === null || lat === '' || lng === null || lng === '' || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return ack({ ok: false, error: 'Drop a pin first' });
      const idx = room.roundIndex;
      const timeMs = Date.now() - room.roundStarted;
      if (timeMs > room.roundSeconds * 1000 + 400) return ack({ ok: false, error: 'Time is up' });
      p.answered = true; // claimed before any await so a double tap cannot score twice
      try {
        const cat = await getCatalog();
        const m = cat.byId.get(room.rounds[idx].monumentId);
        const s = scoreGuess({ lat: Number(lat), lng: Number(lng) }, m, { timeMs, limitMs: room.roundSeconds * 1000 });
        if (room.roundIndex !== idx || room.status !== 'playing') { p.answered = false; return ack({ ok: false, error: 'Time is up' }); }
        p.points += s.points; p.timeMs += Math.min(timeMs, room.roundSeconds * 1000);
        p.guesses[idx] = { lat: Number(lat), lng: Number(lng), ...s };
        ack({ ok: true, points: s.points, metres: s.metres }); // the answer location is only revealed at round end
        emitRoom(room);
        if (live(room).every((x) => x.answered)) endRound(io, room);
      } catch (e) { p.answered = false; ack({ ok: false, error: 'Could not score that guess' }); }
    });

    socket.on('next', async (_ = {}, ack = () => {}) => {
      const room = joined?.room;
      if (!room || rooms.get(room.code) !== room || room.hostId !== joined.playerId || room.status !== 'reveal') return ack({ ok: false });
      ack({ ok: true });
      if (room.roundIndex + 1 >= room.rounds.length) await finish(io, room);
      else { room.status = 'playing'; await nextRound(io, room); }
    });

    // host starts another game with the same people: new code, fresh photos, scores reset
    socket.on('again', async (_ = {}, ack = () => {}) => {
      const room = joined?.room;
      if (!room || rooms.get(room.code) !== room || room.hostId !== joined.playerId || room.status !== 'finished' || room.starting === 'again') return ack({ ok: false });
      room.starting = 'again';
      try {
        const rounds = await buildRounds(room, room.n);
        let code = newCode();
        while (rooms.has(code)) code = newCode();
        rooms.delete(room.code);
        const old = room.code;
        room.code = code; room.rounds = rounds; room.status = 'lobby'; room.roundIndex = -1; room.lastReveal = null; room.final = null; room.starting = false; room.created = Date.now();
        for (const [id, p] of room.players) {
          if (!p.connected) { room.players.delete(id); continue; }
          Object.assign(p, { points: 0, timeMs: 0, answered: false, guesses: [], prevRank: null, gain: 0 });
        }
        rooms.set(code, room);
        io.in(old).socketsJoin(code); io.in(old).socketsLeave(old);
        ack({ ok: true, code });
        emitRoom(room);
      } catch (e) { room.starting = false; ack({ ok: false, error: 'Could not start another hunt' }); }
    });

    socket.on('reaction', ({ emoji } = {}) => {
      const room = joined?.room;
      const p = me();
      if (!room || !p || !REACTIONS.includes(emoji)) return;
      const last = room.lastReactionAt.get(p.id) || 0;
      if (Date.now() - last < 250) return; // no spam
      room.lastReactionAt.set(p.id, Date.now());
      io.to(room.code).emit('reaction', { name: p.name, emoji, color: p.color });
    });

    socket.on('leave', () => leave(true));
    socket.on('disconnect', () => leave(false));

    // explicit: gone for good. Otherwise (tab closed, refresh, network drop) the seat is held for a few seconds.
    function leave(explicit) {
      const room = joined?.room;
      const p = me();
      joined = null;
      if (!room || !p) return;
      socket.leave(room.code);
      if (p.socketId !== socket.id) return; // a newer tab has already taken this seat
      p.connected = false; p.socketId = null;
      const giveUp = () => {
        if (p.connected) return;
        if (room.status === 'lobby') room.players.delete(p.id);
        if (room.hostId === p.id) handOverHost(room);
        afterDrop(room);
      };
      clearTimeout(p.dropTimer);
      if (explicit) giveUp(); else p.dropTimer = setTimeout(giveUp, GRACE_MS);
      afterDrop(room, true);
    }

    function handOverHost(room) {
      const next = players(room).filter((x) => x.connected).sort((a, b) => a.joinedAt - b.joinedAt)[0];
      room.hostId = next ? next.id : null;
    }

    function afterDrop(room, soft) {
      if (rooms.get(room.code) !== room) return;
      if (!live(room).length) {
        clearTimeout(room.emptyTimer);
        room.emptyTimer = setTimeout(() => dropRoom(room), EMPTY_MS);
        return;
      }
      if (!soft && !room.hostId) handOverHost(room);
      emitRoom(room);
      if (room.status === 'playing' && live(room).every((x) => x.answered)) endRound(io, room);
    }
  });

  // drop abandoned rooms after 2 hours
  setInterval(() => { for (const r of [...rooms.values()]) if (Date.now() - r.created > 2 * 3600_000) dropRoom(r); }, 10 * 60_000).unref();

  function dropRoom(room) {
    clearTimeout(room.timer); clearTimeout(room.emptyTimer);
    for (const p of room.players.values()) clearTimeout(p.dropTimer);
    if (rooms.get(room.code) === room) rooms.delete(room.code);
  }
}

async function nextRound(io, room) {
  const cat = await getCatalog();
  if (room.status !== 'playing') return;
  if (room.roundIndex >= 0) for (const p of rankedList(room)) { const q = room.players.get(p.id); if (q) q.prevRank = p.rank; }
  room.roundIndex += 1;
  if (!room.rounds[room.roundIndex] || !cat.byId.get(room.rounds[room.roundIndex].monumentId)) return finish(io, room);
  for (const p of room.players.values()) { p.answered = false; p.gain = 0; }
  room.roundStarted = Date.now();
  io.to(room.code).emit('round', roundPayload(room));
  io.to(room.code).emit('room', publicRoom(room));
  clearTimeout(room.timer);
  room.timer = setTimeout(() => endRound(io, room), room.roundSeconds * 1000 + 300);
}

async function endRound(io, room) {
  if (room.status !== 'playing') return;
  room.status = 'reveal'; // claimed up front so the timer and "everyone answered" cannot both fire
  clearTimeout(room.timer);
  const cat = await getCatalog();
  const idx = room.roundIndex;
  const m = cat.byId.get(room.rounds[idx].monumentId);
  for (const p of room.players.values()) {
    if (!p.answered || !p.guesses[idx]) { p.answered = true; p.timeMs += room.roundSeconds * 1000; p.guesses[idx] = null; }
    p.gain = p.guesses[idx]?.points || 0;
  }
  room.lastReveal = {
    index: idx, last: idx + 1 >= room.rounds.length, monument: card(m), story: m.short_text,
    guesses: players(room).map((p) => ({ id: p.id, name: p.name, color: p.color, guess: p.guesses[idx] })),
  };
  io.to(room.code).emit('reveal', room.lastReveal);
  io.to(room.code).emit('room', publicRoom(room));
}

async function finish(io, room) {
  if (room.status === 'finished') return;
  room.status = 'finished';
  const ranked = rankedList(room);
  room.final = { ranking: ranked.map(({ userId, ...p }) => p) };
  io.to(room.code).emit('finished', room.final);
  io.to(room.code).emit('room', publicRoom(room));
  const save = (code) => query('INSERT INTO hunts (code, host_name, rounds, round_seconds, players, winner_name, results_json, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [code, room.players.get(room.hostId)?.name || ranked[0]?.name || 'Host', room.rounds.length, room.roundSeconds, ranked.length, ranked[0]?.name || null, JSON.stringify(ranked.map(({ name, points, rank }) => ({ name, points, rank })))]);
  try {
    let code = room.code;
    try { await save(code); } catch (e) { if (e.code !== 'ER_DUP_ENTRY') throw e; code = newCode(); await save(code); } // code reused from an older hunt
    for (const p of ranked) {
      await query("INSERT INTO game_scores (user_id, player_name, mode, points, rounds, hunt_code) VALUES (?, ?, 'hunt', ?, ?, ?)", [p.userId, p.name, p.points, room.rounds.length, code]);
      if (p.userId) await checkBadges(p.userId);
    }
  } catch (e) { console.error('[hunt] could not save results', e.message); }
}
