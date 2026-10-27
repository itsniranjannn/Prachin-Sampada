// Simulates a 3-player live hunt against the running server (host + 2 guests), all rounds, and checks results.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { io } = require('../../client/node_modules/socket.io-client');
const URL = process.env.URL || 'http://localhost:5050';
const mk = () => io(URL, { transports: ['websocket'], forceNew: true });
const emit = (s, ev, data) => new Promise((r) => s.emit(ev, data, r));
const host = mk(), a = mk(), b = mk();
const log = [];
const { code } = await emit(host, 'host', { name: 'Host', rounds: 3, roundSeconds: 20 });
log.push(`room ${code}`);
for (const [s, n] of [[host, 'Host'], [a, 'Aarati'], [b, 'Bikash']]) { const r = await emit(s, 'join', { code, name: n }); if (!r.ok) throw new Error(r.error); }
const dup = await emit(mk(), 'join', { code, name: 'aarati' });
log.push(`duplicate name refused: ${!dup.ok} (${dup.error})`);
const notHost = await emit(a, 'start', {});
log.push(`non-host start refused: ${!notHost.ok}`);
let reveals = 0;
const finished = new Promise((res) => host.on('finished', res));
host.on('reveal', async (r) => { reveals++; log.push(`reveal ${r.index + 1}: ${r.monument.name}, guesses ${r.guesses.filter((g) => g.guess).length}`); setTimeout(() => host.emit('next', {}, () => {}), 200); });
const play = (s, near) => s.on('round', async (r) => {
  // the answer is not sent with the round
  if ('monumentId' in r || 'lat' in r) log.push('LEAK: round payload contains the answer');
  await new Promise((x) => setTimeout(x, 300));
  const g = near ? { lat: 27.7046, lng: 85.3074 } : { lat: 27.60, lng: 85.20 };
  const ack = await emit(s, 'guess', g);
  const again = await emit(s, 'guess', g);
  if (again.ok) log.push('BUG: second guess accepted');
  if (near) log.push(`  ${s === host ? 'Host' : 'Aarati'} +${ack.points}`);
});
play(host, true); play(a, true); play(b, false);
const t0 = Date.now();
await emit(host, 'start', {});
const fin = await Promise.race([finished, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 60000))]);
log.push(`finished in ${((Date.now() - t0) / 1000).toFixed(1)} s after ${reveals} reveals`);
log.push('ranking: ' + fin.ranking.map((p) => `${p.rank}.${p.name} ${p.points}`).join(', '));
console.log(log.join('\n'));
for (const s of [host, a, b]) s.disconnect();
process.exit(0);
