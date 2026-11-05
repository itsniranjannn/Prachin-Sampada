// Heritage walk planner: an Orienteering Problem with Time Windows.
// Choose which monuments to visit and in what order so that the total "value" (interest match)
// is as high as possible, every visit happens while the site is open, and the walk fits the time budget.
//
// Heuristic: (1) greedy insertion by value per added minute, checking feasibility at every insertion point;
// (2) 2-opt on the chosen order to cut travel time; (3) re-run insertion to use the freed minutes.

import { legMatrix, fmtMin } from './geo.js';

/**
 * Simulate a route (indices into sites, start is index 0 of the matrix) and return its schedule,
 * or null if a time window or the end time is violated.
 * sites[i] = { visit, open, close } in minutes; matrix indices are site index + 1 (0 = start).
 */
export function simulate(order, sites, M, startMin, endMin, { returnToStart = false } = {}) {
  let t = startMin;
  let prev = 0;
  let travel = 0;
  let cost = 0;
  const stops = [];
  for (const i of order) {
    const l = M[prev][i + 1];
    t += l.minutes;
    travel += l.minutes;
    cost += l.costNpr;
    const s = sites[i];
    const arrive = t;
    if (s.open != null && t < s.open) t = s.open; // wait for opening
    if (s.close != null && t + s.visit > s.close) return null; // would still be inside at closing
    stops.push({ index: i, leg: l, arrive, start: t, end: t + s.visit, wait: t - arrive });
    t += s.visit;
    prev = i + 1;
  }
  if (returnToStart && order.length) {
    const l = M[prev][0];
    t += l.minutes;
    travel += l.minutes;
    cost += l.costNpr;
  }
  if (t > endMin) return null;
  return { stops, finish: t, travel, cost };
}

const valueOf = (order, sites) => order.reduce((s, i) => s + sites[i].value, 0);

/** Reverse segments while it shortens travel and stays feasible (2-opt). */
export function twoOpt(order, sites, M, startMin, endMin, opts) {
  let best = order.slice();
  let bestSim = simulate(best, sites, M, startMin, endMin, opts);
  if (!bestSim) return { order, sim: null, passes: 0 };
  let improved = true;
  let passes = 0;
  while (improved && passes < 50) {
    improved = false;
    passes++;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const cand = best.slice(0, i).concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
        const sim = simulate(cand, sites, M, startMin, endMin, opts);
        if (sim && sim.finish < bestSim.finish - 1e-9) {
          best = cand;
          bestSim = sim;
          improved = true;
        }
      }
    }
  }
  return { order: best, sim: bestSim, passes };
}

/** Greedy insertion: repeatedly add the site with the best value / extra-minutes ratio at its cheapest feasible position. */
export function greedyInsert(order, candidates, sites, M, startMin, endMin, opts) {
  const route = order.slice();
  const left = new Set(candidates.filter((i) => !route.includes(i)));
  let sim = simulate(route, sites, M, startMin, endMin, opts);
  while (left.size) {
    let best = null;
    for (const i of left) {
      for (let p = 0; p <= route.length; p++) {
        const cand = route.slice(0, p).concat([i], route.slice(p));
        const s = simulate(cand, sites, M, startMin, endMin, opts);
        if (!s) continue;
        const extra = Math.max(1, s.finish - (sim ? sim.finish : startMin));
        const ratio = sites[i].value / extra;
        if (!best || ratio > best.ratio) best = { i, p, s, ratio };
      }
    }
    if (!best) break;
    route.splice(best.p, 0, best.i);
    sim = best.s;
    left.delete(best.i);
  }
  return route;
}

/**
 * Plan a walking tour.
 * start: {lat, lng}; sites: [{id, lat, lng, value, visit (min), open "HH:MM", close "HH:MM", must?}]
 * opts: { startTime "09:00", endTime "17:00", returnToStart, walkLimit }
 */
export function planTour(start, sites, opts = {}) {
  const startMin = toMinutes(opts.startTime || '09:00');
  const endMin = toMinutes(opts.endTime || '17:00');
  const sim = { returnToStart: !!opts.returnToStart };
  const S = sites.map((s) => ({ ...s, visit: s.visit || 30, open: toMinutes(s.open), close: toMinutes(s.close), value: s.value ?? 1 }));
  const M = legMatrix([start, ...S], { walkLimit: opts.walkLimit });
  const all = S.map((_, i) => i);
  const must = all.filter((i) => S[i].must);

  let order = greedyInsert([], must, S, M, startMin, endMin, sim);
  order = greedyInsert(order, all, S, M, startMin, endMin, sim);
  let res = twoOpt(order, S, M, startMin, endMin, sim);
  order = greedyInsert(res.order, all, S, M, startMin, endMin, sim); // use minutes freed by 2-opt
  res = twoOpt(order, S, M, startMin, endMin, sim);

  const final = res.sim || simulate([], S, M, startMin, endMin, sim);
  const skipped = all.filter((i) => !res.order.includes(i)).map((i) => ({ id: S[i].id, reason: reasonSkipped(i, S, M, startMin, endMin) }));
  return {
    stops: final.stops.map((st) => ({
      id: S[st.index].id,
      arrive: fmtMin(st.arrive),
      start: fmtMin(st.start),
      end: fmtMin(st.end),
      waitMinutes: st.wait,
      leg: st.leg,
    })),
    skipped,
    totalValue: valueOf(res.order, S),
    travelMinutes: final.travel,
    rideCostNpr: final.cost,
    finish: fmtMin(final.finish),
    startTime: fmtMin(startMin),
    endTime: fmtMin(endMin),
  };
}

function reasonSkipped(i, S, M, startMin, endMin) {
  const s = S[i];
  const arrive = startMin + M[0][i + 1].minutes;
  const begin = Math.max(arrive, s.open ?? 0);
  if (s.close != null && begin + s.visit > s.close) return 'closed during your time window';
  if (s.open != null && s.open + s.visit > endMin && arrive + s.visit <= endMin) return 'closed during your time window';
  if (begin + s.visit > endMin) return 'too far for the time available';
  return 'did not fit with higher-value stops';
}

const toMinutes = (hhmm) => {
  if (hhmm == null) return null;
  if (typeof hhmm === 'number') return hhmm;
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

/** Exact optimum by enumeration of subsets and orders (for tests and benchmarks, n <= 8). */
export function bruteForce(start, sites, opts = {}) {
  const startMin = toMinutes(opts.startTime || '09:00');
  const endMin = toMinutes(opts.endTime || '17:00');
  const sim = { returnToStart: !!opts.returnToStart };
  const S = sites.map((s) => ({ ...s, visit: s.visit || 30, open: toMinutes(s.open), close: toMinutes(s.close), value: s.value ?? 1 }));
  const M = legMatrix([start, ...S], { walkLimit: opts.walkLimit });
  let best = { value: 0, finish: startMin, order: [] };
  const n = S.length;
  const used = new Array(n).fill(false);
  const order = [];
  const rec = () => {
    const s = simulate(order, S, M, startMin, endMin, sim);
    if (!s) return; // adding more stops cannot make an infeasible prefix feasible
    const v = valueOf(order, S);
    if (v > best.value || (v === best.value && s.finish < best.finish)) best = { value: v, finish: s.finish, order: order.slice() };
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      order.push(i);
      rec();
      order.pop();
      used[i] = false;
    }
  };
  rec();
  return best;
}
