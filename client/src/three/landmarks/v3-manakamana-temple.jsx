// Manakamana Temple, Kafakdada ridge, Gorkha: a free-standing two-roof gilded pagoda in a paved hilltop court.
// Units: 1 unit is about 1.9 m (lower roof span 6.4 = ~12 m). Front faces +z. Himalaya lies to the north (-z).
export default function make(K) {
  const { useM, Box, Frame, THREE, useMemo } = K;

  /* ------------ merged-geometry toolkit (vertex coloured) ------------ */
  const _e = new THREE.Euler(); const _q = new THREE.Quaternion(); const _p = new THREE.Vector3(); const _s = new THREE.Vector3();
  const _mx = new THREE.Matrix4(); const _my = new THREE.Matrix4(); const _v = new THREE.Vector3(); const _o = new THREE.Vector3();
  let YAW = 0; let OFF = [0, 0, 0];
  const newBag = () => ({ m: [], gold: [], glow: [] });
  const paint = (g, hex) => {
    const c = new THREE.Color(hex); const n = g.attributes.position.count; const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  };
  function put(bag, key, g, c) {
    if (YAW) { _my.makeRotationY(YAW); g.applyMatrix4(_my); }
    if (OFF[0] || OFF[1] || OFF[2]) g.translate(OFF[0], OFF[1], OFF[2]);
    paint(g, c); bag[key].push(g.index ? g.toNonIndexed() : g);
  }
  function T(bag, key, geo, x, y, z, c, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); _mx.compose(_p, _q, _s);
    geo.applyMatrix4(_mx); put(bag, key, geo, c);
  }
  const B = (bag, key, w, h, d, x, y, z, c, ry = 0, rx = 0, rz = 0) => T(bag, key, new THREE.BoxGeometry(w, h, d), x, y, z, c, 1, 1, 1, rx, ry, rz);
  const C = (bag, key, rt, rb, h, x, y, z, c, seg = 8, rx = 0, rz = 0) => T(bag, key, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, c, 1, 1, 1, rx, 0, rz);
  /** Thin box from a to b (width w across, thickness t). */
  function seg(bag, key, a, b, w, t, c) {
    _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _v.length(); if (len < 1e-4) return;
    _v.normalize(); _o.set(0, 0, 0);
    _my.lookAt(_o, _v, Math.abs(_v.y) > 0.98 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0));
    _q.setFromRotationMatrix(_my); _p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); _s.set(1, 1, 1);
    _mx.compose(_p, _q, _s); const g = new THREE.BoxGeometry(w, t, len); g.applyMatrix4(_mx); put(bag, key, g, c);
  }
  /** Quad from four points (any order of facing: flipped to face the `out` direction). */
  function quad(bag, key, p4, out, c) {
    const [a, b, cc, d] = p4;
    const n = [(b[1] - a[1]) * (cc[2] - a[2]) - (b[2] - a[2]) * (cc[1] - a[1]), (b[2] - a[2]) * (cc[0] - a[0]) - (b[0] - a[0]) * (cc[2] - a[2]), (b[0] - a[0]) * (cc[1] - a[1]) - (b[1] - a[1]) * (cc[0] - a[0])];
    const flip = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0;
    const t = flip ? [a, cc, b, a, d, cc] : [a, b, cc, a, cc, d];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(t.flat(), 3)); g.computeVertexNormals(); put(bag, key, g, c);
  }
  function merge(list) {
    if (!list.length) return null;
    let n = 0; list.forEach((g) => { n += g.attributes.position.count; });
    const P = new Float32Array(n * 3); const N = new Float32Array(n * 3); const Cc = new Float32Array(n * 3); let o = 0;
    list.forEach((g) => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    return g;
  }
  function BagMesh({ bag }) {
    const M = useM();
    const geos = useMemo(() => ({ m: merge(bag.m), gold: merge(bag.gold), glow: merge(bag.glow) }), [bag]);
    const mats = { m: M.plain('#ffffff', { vertexColors: true, roughness: 0.9 }), gold: M.plain('#ffffff', { vertexColors: true, roughness: 0.35, metalness: 0.45 }), glow: M.plain('#ffffff', { vertexColors: true, emissive: '#ff9a3a', emissiveIntensity: 1.5, roughness: 0.6 }) };
    return (
      <group>
        {geos.m && <mesh geometry={geos.m} material={mats.m} castShadow receiveShadow />}
        {geos.gold && <mesh geometry={geos.gold} material={mats.gold} castShadow receiveShadow />}
        {geos.glow && <mesh geometry={geos.glow} material={mats.glow} />}
      </group>
    );
  }
  /** Repeat fn four times, turned to each face of the square plan (local +z is the face). */
  function faces(fn) { const keep = YAW; for (let k = 0; k < 4; k += 1) { YAW = keep + (k * Math.PI) / 2; fn(k); } YAW = keep; }
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  /** Hipped roof with eave rect W x D at height y, flat top tw x td, rise h. Ribbed gold with a bright strip on each face. */
  function hipRoof(bag, key, W, D, tw, td, h, y, base, rib, step = 0.42, strip = true, stripC = '#f6d460') {
    const hw = W / 2; const hd = D / 2; const a = tw / 2; const b = td / 2;
    const E = [[-hw, y, hd], [hw, y, hd], [hw, y, -hd], [-hw, y, -hd]];
    const Tt = [[-a, y + h, b], [a, y + h, b], [a, y + h, -b], [-a, y + h, -b]];
    const outs = [[0, 0.6, 1], [1, 0.6, 0], [0, 0.6, -1], [-1, 0.6, 0]];
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4; const P = E[i]; const Q = E[j]; const R = Tt[j]; const S = Tt[i];
      quad(bag, key, [P, Q, R, S], outs[i], base);
      if (rib) {
        const len = Math.hypot(Q[0] - P[0], Q[2] - P[2]); const n = Math.max(1, Math.round(len / step));
        const nx = outs[i][0] * 0.03; const nz = outs[i][2] * 0.03; const nyy = 0.03;
        for (let k = 0; k < n; k += 1) {
          const t = (k + 0.5) / n;
          const p1 = [P[0] + (Q[0] - P[0]) * t + nx, y + nyy, P[2] + (Q[2] - P[2]) * t + nz];
          const p2 = [S[0] + (R[0] - S[0]) * t + nx, y + h + nyy, S[2] + (R[2] - S[2]) * t + nz];
          seg(bag, key, p1, p2, 0.065, 0.035, rib);
        }
      }
      if (strip) {
        const p1 = [(P[0] + Q[0]) / 2 + outs[i][0] * 0.04, y + 0.04, (P[2] + Q[2]) / 2 + outs[i][2] * 0.04];
        const p2 = [(S[0] + R[0]) / 2 + outs[i][0] * 0.04, y + h + 0.04, (S[2] + R[2]) / 2 + outs[i][2] * 0.04];
        seg(bag, key, p1, p2, 0.2, 0.05, stripC);
      }
      seg(bag, key, [P[0] + outs[i][0] * 0.02, P[1] + 0.03, P[2] + outs[i][2] * 0.02], [S[0] + outs[i][0] * 0.02, S[1] + 0.03, S[2] + outs[i][2] * 0.02], 0.1, 0.05, rib || base);
    }
    quad(bag, key, Tt, [0, 1, 0], base);
  }

  /* ---------------- temple ---------------- */
  const GOLD = '#efc03a'; const GOLDB = '#ffe070'; const DARK = '#4f382c'; const DARK2 = '#5a4132'; const RED = '#b3241c'; const ORANGE = '#e0561f';
  const ROOF_Y = 2.55; const ROOF_H = 1.15; const W1 = 6.4; const W2 = 4.0; const UP_H = 1.2;
  const YB = ROOF_Y + ROOF_H; const UP_Y = YB + 1.9; const DROP = 0.47;

  function buildTemple() {
    const bag = newBag();
    // dark timber ground storey (low), verandah posts, front gold door
    B(bag, 'm', 4.6, 1.4, 4.6, 0, 0.28 + 0.7, 0, DARK);
    B(bag, 'gold', 1.0, 1.05, 0.07, 0, 0.84, 2.33, GOLD);
    B(bag, 'm', 1.25, 1.25, 0.06, 0, 0.9, 2.31, DARK2);
    B(bag, 'gold', 1.05, 0.12, 0.09, 0, 1.45, 2.36, GOLDB);
    B(bag, 'gold', 0.08, 1.0, 0.05, 0, 0.84, 2.375, GOLDB);
    faces(() => {
      for (let i = 0; i < 7; i += 1) {
        const x = -2.65 + i * (5.3 / 6);
        B(bag, 'm', 0.2, 1.2, 0.2, x, 0.88, 2.65, DARK);
        B(bag, 'm', 0.3, 0.12, 0.3, x, 1.5, 2.65, DARK2);
        B(bag, 'm', 0.28, 0.14, 0.28, x, 0.36, 2.65, DARK2);
        B(bag, 'm', 0.12, 0.12, 0.04, x, 1.08, 2.76, '#7a5a40');
        B(bag, 'm', 0.12, 0.12, 0.04, x, 0.66, 2.76, '#7a5a40');
      }
      B(bag, 'm', 5.5, 0.1, 0.12, 0, 0.7, 2.65, '#2a1d16');
      [-1.95, -1.2, 1.2, 1.95].forEach((x) => {
        B(bag, 'm', 0.62, 0.86, 0.05, x, 0.98, 2.32, '#1a110c');
        B(bag, 'm', 0.5, 0.74, 0.03, x, 0.98, 2.35, '#2c1d14');
        for (let q = -1; q <= 1; q += 1) B(bag, 'm', 0.03, 0.7, 0.04, x + q * 0.17, 0.98, 2.37, '#6a4a34');
        B(bag, 'm', 0.7, 0.1, 0.07, x, 1.5, 2.33, '#8a6446');
      });
      [-1.575, 1.575].forEach((x) => { B(bag, 'm', 0.2, 0.95, 0.05, x, 0.98, 2.32, '#8a6446'); B(bag, 'm', 0.1, 0.6, 0.06, x, 0.98, 2.35, '#5a4030'); });
      // carved timber band under the valance
      B(bag, 'm', 5.7, 0.34, 0.14, 0, 1.64, 2.7, '#3a2a20');
      for (let i = 0; i < 19; i += 1) B(bag, 'm', 0.16, 0.2, 0.05, -2.7 + i * 0.3, 1.64, 2.79, '#8a6446');
    });
    OFF = [0, -DROP, 0];
    B(bag, 'm', 5.9, 0.4, 5.9, 0, 2.3, 0, DARK2); // eave ledger beam
    B(bag, 'm', 5.55, 0.1, 5.55, 0, 2.08, 0, '#5a4030');
    faces(() => {
      // tongue brackets (vermilion) and carved struts under the lower eave
      for (let i = 0; i < 11; i += 1) {
        const x = -2.75 + i * 0.55;
        B(bag, 'm', 0.2, 0.2, 0.06, x, 2.42, 2.98, ORANGE, 0, 0, Math.PI / 4);
        B(bag, 'm', 0.09, 0.09, 0.06, x, 2.42, 3.0, '#f08a50', 0, 0, Math.PI / 4);
      }
      for (let i = 0; i < 8; i += 1) {
        const x = -2.6 + i * 0.74;
        seg(bag, 'm', [x, 1.98, 2.6], [x + 0.2, 2.58, 2.98], 0.17, 0.17, '#33231a');
        B(bag, 'm', 0.12, 0.34, 0.1, x + 0.2, 2.4, 3.02, ORANGE);
        B(bag, 'm', 0.2, 0.08, 0.1, x + 0.12, 2.2, 2.85, '#6a4a34');
      }
      B(bag, 'm', 6.1, 0.24, 0.03, 0, 2.38, 3.07, RED);
      for (let i = 0; i < 24; i += 1) B(bag, 'm', 0.12, 0.1, 0.03, -3.0 + i * 0.26, 2.2, 3.07, '#8e1b14');
    });
    // lower roof: gold, ribbed, bright strips
    hipRoof(bag, 'gold', W1, W1, 3.5, 3.5, ROOF_H, ROOF_Y, GOLD, '#ffd55a');
    B(bag, 'm', W1 - 0.1, 0.1, W1 - 0.1, 0, ROOF_Y - 0.06, 0, DARK);
    faces(() => {
      B(bag, 'gold', W1 + 0.04, 0.11, 0.07, 0, ROOF_Y + 0.05, W1 / 2 + 0.02, GOLDB);
      for (let i = 0; i < 24; i += 1) B(bag, 'gold', 0.1, 0.14, 0.04, -3.0 + i * 0.26, ROOF_Y - 0.09, W1 / 2 + 0.02, GOLDB);
      [-1.6, 0, 1.6].forEach((x) => C(bag, 'gold', 0, 0.08, 0.28, x, ROOF_Y + 0.17, W1 / 2 + 0.03, GOLDB, 6));
    });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      C(bag, 'gold', 0, 0.1, 0.42, sx * (W1 / 2 + 0.02), ROOF_Y + 0.24, sz * (W1 / 2 + 0.02), GOLDB, 6);
      C(bag, 'gold', 0, 0.08, 0.32, sx * (W2 / 2 + 0.02), UP_Y + 0.22, sz * (W2 / 2 + 0.02), GOLDB, 6);
    });
    // upper storey: dark base band, (brick wall is textured, see Main), dark top band, struts, valance
    const yb = YB;
    B(bag, 'm', 3.4, 0.2, 3.4, 0, yb + 0.1, 0, DARK);
    B(bag, 'm', 3.3, 0.2, 3.3, 0, UP_Y - 0.15, 0, DARK2);
    faces(() => {
        [-0.95, 0, 0.95].forEach((x) => {
        // recessed carved-lattice window in a dark frame (inset)
        B(bag, 'm', 0.62, 0.58, 0.03, x, yb + 0.9, 1.51, '#4a3324');
        B(bag, 'm', 0.44, 0.42, 0.05, x, yb + 0.9, 1.47, '#3a281c');
        B(bag, 'm', 0.44, 0.4, 0.04, x, yb + 0.9, 1.5, '#7a5a40');
        for (let k = -1; k <= 1; k += 1) B(bag, 'm', 0.04, 0.4, 0.06, x + k * 0.12, yb + 0.9, 1.54, '#3a281c');
        for (let k = -1; k <= 1; k += 1) B(bag, 'm', 0.44, 0.04, 0.06, x, yb + 0.9 + k * 0.12, 1.54, '#3a281c');
        B(bag, 'm', 0.7, 0.07, 0.14, x, yb + 1.24, 1.52, '#2c1f17');
        B(bag, 'm', 0.7, 0.07, 0.14, x, yb + 0.56, 1.52, '#2c1f17');
      });
      for (let i = 0; i < 4; i += 1) {
        const x = -1.2 + i * 0.8;
        seg(bag, 'm', [x, UP_Y - 0.28, 1.55], [x + 0.2, UP_Y + 0.02, 2.0], 0.2, 0.18, '#33231a');
        seg(bag, 'm', [x + 0.4, UP_Y - 0.5, 1.52], [x + 0.2, UP_Y - 0.1, 1.9], 0.1, 0.1, '#4a3324');
      }
      for (let i = 0; i < 7; i += 1) B(bag, 'm', 0.14, 0.14, 0.05, -1.5 + i * 0.5, UP_Y, 2.05, ORANGE, 0, 0, Math.PI / 4);
      B(bag, 'm', 4.0, 0.14, 0.03, 0, UP_Y - 0.12, 2.06, '#a02a20');
      for (let i = 0; i < 16; i += 1) B(bag, 'm', 0.12, 0.1, 0.03, -1.9 + i * 0.255, UP_Y - 0.25, 2.06, '#8a2a20');
    });
    B(bag, 'm', 3.3, 0.12, 3.3, 0, UP_Y - 0.06, 0, '#2a1d16');
    // upper roof
    hipRoof(bag, 'gold', W2, W2, 0.9, 0.9, UP_H, UP_Y, GOLD, '#ffd55a', 0.4);
    B(bag, 'm', W2 - 0.1, 0.1, W2 - 0.1, 0, UP_Y - 0.06, 0, DARK);
    faces(() => {
      B(bag, 'gold', W2 + 0.04, 0.11, 0.07, 0, UP_Y + 0.05, W2 / 2 + 0.02, GOLDB);
      for (let i = 0; i < 15; i += 1) B(bag, 'gold', 0.1, 0.14, 0.04, -1.82 + i * 0.26, UP_Y - 0.09, W2 / 2 + 0.02, GOLDB);
      C(bag, 'gold', 0, 0.08, 0.26, 0, UP_Y + 0.15, W2 / 2 + 0.03, GOLDB, 6);
    });
    // pinnacle (gajur)
    const ty = UP_Y + UP_H;
    C(bag, 'gold', 0.3, 0.38, 0.14, 0, ty + 0.07, 0, GOLDB, 12);
    C(bag, 'gold', 0.16, 0.2, 0.3, 0, ty + 0.28, 0, GOLD, 10);
    T(bag, 'gold', new THREE.SphereGeometry(0.3, 12, 8), 0, ty + 0.62, 0, GOLDB, 1, 0.9, 1);
    C(bag, 'gold', 0.28, 0.28, 0.05, 0, ty + 0.92, 0, GOLDB, 12);
    C(bag, 'gold', 0.22, 0.22, 0.05, 0, ty + 1.02, 0, GOLD, 12);
    C(bag, 'gold', 0.16, 0.16, 0.05, 0, ty + 1.12, 0, GOLDB, 12);
    C(bag, 'gold', 0, 0.07, 0.55, 0, ty + 1.42, 0, GOLDB, 8);
    OFF = [0, 0, 0];
    // diya glow on plinth front
    for (let i = 0; i < 9; i += 1) {
      const x = -2.9 + i * 0.725;
      C(bag, 'm', 0.06, 0.04, 0.05, x, 0.3, 3.35, '#a5502a', 8);
      C(bag, 'glow', 0, 0.035, 0.1, x, 0.38, 3.35, '#ffc040', 6);
    }
    return bag;
  }

  /** Black metal railing around the temple base with a gap at the entrance. */
  function buildRailing() {
    const bag = newBag(); const h = 4.25; const top = 0.55;
    const run = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az); const n = Math.round(len / 0.45);
      for (let i = 0; i <= n; i += 1) { const t = i / n; B(bag, 'm', 0.035, top, 0.035, ax + (bx - ax) * t, top / 2, az + (bz - az) * t, '#16161a'); }
      seg(bag, 'm', [ax, top, az], [bx, top, bz], 0.05, 0.05, '#16161a');
      seg(bag, 'm', [ax, 0.28, az], [bx, 0.28, bz], 0.04, 0.04, '#16161a');
    };
    run(-h, -h, h, -h); run(-h, -h, -h, h); run(h, -h, h, h);
    run(-h, h, -1.1, h); run(1.1, h, h, h);
    return bag;
  }

  /** Bell in a carved dark wooden frame, and the oil lamp bed. */
  function buildBell() {
    const bag = newBag();
    B(bag, 'm', 1.7, 0.22, 1.1, 0, 0.11, 0, '#8d8378');
    [-0.55, 0.55].forEach((x) => {
      B(bag, 'm', 0.2, 1.6, 0.2, x, 1.02, 0, DARK);
      B(bag, 'm', 0.3, 0.14, 0.3, x, 0.3, 0, DARK2);
      B(bag, 'm', 0.3, 0.2, 0.3, x, 1.0, 0, DARK2);
      B(bag, 'm', 0.3, 0.14, 0.3, x, 1.7, 0, DARK2);
      B(bag, 'm', 0.13, 0.13, 0.04, x, 0.8, 0.12, '#7a5a40');
      B(bag, 'm', 0.13, 0.13, 0.04, x, 1.35, 0.12, '#7a5a40');
    });
    B(bag, 'm', 1.55, 0.2, 0.26, 0, 1.82, 0, DARK2);
    B(bag, 'm', 1.7, 0.08, 0.3, 0, 1.94, 0, DARK);
    C(bag, 'm', 0.012, 0.012, 0.35, 0, 1.6, 0, '#222', 4);
    C(bag, 'm', 0.1, 0.1, 0.1, 0, 1.38, 0, '#9a5a3c', 10);
    T(bag, 'm', new THREE.CylinderGeometry(0.12, 0.34, 0.6, 14, 1, true), 0, 1.03, 0, '#a05a40');
    T(bag, 'm', new THREE.TorusGeometry(0.34, 0.025, 6, 14), 0, 0.73, 0, '#8a4a34', 1, 1, 1, Math.PI / 2, 0, 0);
    return bag;
  }
  function buildLamps() {
    const bag = newBag(); const R = rng(55);
    // low irregular earthen bed, soot-black, with clay lamps and real flames
    for (let i = 0; i < 9; i += 1) {
      const x = -1.3 + i * 0.33 + (R() - 0.5) * 0.15; const z = (R() - 0.5) * 0.7;
      B(bag, 'm', 0.7 + R() * 0.4, 0.14 + R() * 0.14, 0.7 + R() * 0.5, x, 0.1, z, ['#463d34', '#3a322b', '#50453a'][i % 3], R() * 1.2);
    }
    B(bag, 'm', 2.8, 0.1, 1.2, 0, 0.04, 0, '#5a5048');
    for (let r = 0; r < 3; r += 1) {
      for (let i = 0; i < 8; i += 1) {
        const x = -1.25 + i * 0.36 + (r % 2) * 0.12 + (R() - 0.5) * 0.1; const z = -0.4 + r * 0.4 + (R() - 0.5) * 0.12;
        C(bag, 'm', 0.1, 0.07, 0.08, x, 0.27, z, '#a5502a', 8);
        C(bag, 'glow', 0, 0.1, 0.28 + R() * 0.2, x, 0.46, z, i % 2 ? '#ffb030' : '#ffd060', 6);
        C(bag, 'glow', 0, 0.05, 0.16 + R() * 0.12, x + 0.05, 0.4, z + 0.04, '#ff7a20', 5);
      }
    }
    return bag;
  }

  const WIDE = typeof window !== 'undefined' && /wide=1/.test(window.location.search);
  function ManakamanaMain() {
    const M = useM();
    const temple = useMemo(buildTemple, []);
    const rail = useMemo(buildRailing, []);
    const bell = useMemo(buildBell, []);
    const lamps = useMemo(buildLamps, []);
    const yb = YB;
    const brick = M.plain('#c9603f', { roughness: 0.95, emissive: '#7a2a18', emissiveIntensity: 0.22 });
    return (
      <group>
        {/* two low plinth steps */}
        <Box s={[7.5, 0.14, 7.5]} p={[0, 0.07, 0]} m={M.plain('#a39a8f', { roughness: 1 })} />
        <Box s={[6.9, 0.14, 6.9]} p={[0, 0.21, 0]} m={M.plain('#b3aa9f', { roughness: 1 })} />
        {/* red brick upper storey */}
        <Box s={[3.0, 1.45, 3.0]} p={[0, yb + 0.925 - DROP, 0]} m={brick} />
        <BagMesh bag={temple} />
        <BagMesh bag={rail} />
        <group position={[5.2, 0, 3.4]} rotation={[0, -0.5, 0]}><BagMesh bag={bell} /></group>
        <group position={[-5.4, 0, 3.6]} rotation={[0, 0.3, 0]}>
          <BagMesh bag={lamps} />
          <pointLight position={[0, 1, 0]} color="#ff8a2a" intensity={2.2} distance={7} />
        </group>
        <pointLight position={[0, 1.6, 4.6]} color="#ffb766" intensity={1.2} distance={9} />
        <Frame s={WIDE ? [40, 20, 40] : [11, 7.8, 10]} p={WIDE ? [0, -4, 0] : [0, 3.9, 0.5]} />
      </group>
    );
  }

  /* ---------------- environment ---------------- */
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const HALF = 17;
  const SZ = 5; // z centre of the stairs
  function hgt(x, z) {
    const dd = Math.max(Math.abs(x), Math.abs(z)) - HALF; const r = Math.hypot(x, z);
    let h = dd <= 0 ? -0.34 : -0.34 - 40 * (1 - Math.exp(-dd / 11));
    if (dd > 0) h += (Math.sin(x * 0.13 + 1.3) * Math.cos(z * 0.1) * 2.2 + Math.sin(x * 0.29 + z * 0.23) * 0.9) * Math.min(dd / 20, 1);
    h += Math.min(0, 0 * r);
    if (x > HALF - 1) {
      const w = 1 - sstep(2.5, 6.5, Math.abs(z - SZ)); const ramp = -0.34 - 0.34 * (x - HALF);
      if (ramp > h) h += (ramp - h) * w;
    }
    return h;
  }
  const hazeCol = new THREE.Color('#a9bccb');
  function buildTerrain() {
    const g = new THREE.PlaneGeometry(330, 330, 110, 110); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
    const c1 = new THREE.Color('#2f5c2b'); const c2 = new THREE.Color('#5d8a3c'); const c3 = new THREE.Color('#7b6a4a'); const t = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i); const z = pos.getZ(i); pos.setY(i, hgt(x, z));
      const n = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.cos(z * 0.27 + 1) ;
      t.copy(c1).lerp(c2, n);
      const dd = Math.max(Math.abs(x), Math.abs(z)) - HALF;
      if (dd < 3) t.lerp(c3, 1 - dd / 3);
      const rr = Math.hypot(x, z);
      t.lerp(new THREE.Color('#6f8f78'), sstep(22, 60, rr) * 0.45); // first haze layer
      t.lerp(hazeCol, sstep(60, 150, rr) * 0.85); // second haze layer
      col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    return g;
  }

  function buildTrees() {
    const bag = newBag(); const R = rng(77);
    for (let n = 0; n < 420; n += 1) {
      const x = (R() - 0.5) * 150; const z = (R() - 0.5) * 150;
      const dd = Math.max(Math.abs(x), Math.abs(z)) - HALF;
      if (dd < 1.5 || (x > 8 && Math.abs(z - SZ) < 6.5)) continue;
      const y = hgt(x, z); const s = 0.9 + R() * 1.4;
      const haze = sstep(50, 120, Math.hypot(x, z));
      const mix = (hex) => `#${new THREE.Color(hex).lerp(hazeCol, haze * 0.8).getHexString()}`;
      if (R() < 0.55) {
        C(bag, 'm', 0.06, 0.09, 0.5 * s, x, y + 0.2 * s, z, mix('#4a3a2a'), 5);
        T(bag, 'm', new THREE.ConeGeometry(0.55 * s, 1.5 * s, 6), x, y + 1.0 * s, z, mix('#2c5a2e'));
        T(bag, 'm', new THREE.ConeGeometry(0.4 * s, 1.1 * s, 6), x, y + 1.7 * s, z, mix('#35683a'));
      } else {
        C(bag, 'm', 0.07, 0.1, 0.7 * s, x, y + 0.3 * s, z, mix('#5a4632'), 5);
        T(bag, 'm', new THREE.IcosahedronGeometry(0.75 * s, 0), x, y + 1.15 * s, z, mix(R() < 0.5 ? '#4a7a36' : '#3d6a30'), 1, 0.85, 1);
      }
    }
    return bag;
  }

  /** Concrete lodge: local +z is the face looking at the court. */
  function lodge(bag, cx, cz, w, d, n, wall, face, o = {}) {
    OFF = [cx, 0, cz]; YAW = face;
    const sh = 1.35; const h = n * sh;
    B(bag, 'm', w, h, d, 0, h / 2, 0, wall);
    B(bag, 'm', w + 0.15, 0.18, d + 0.15, 0, h + 0.09, 0, '#d8cfc2');
    const cols = Math.max(2, Math.floor(w / 1.25));
    for (let s = 0; s < n; s += 1) {
      const y = s * sh + (s === 0 ? 0.7 : 0.85);
      if (s > 0) B(bag, 'm', w + 0.1, 0.07, 0.35, 0, s * sh, d / 2 + 0.1, '#e8dccd');
      for (let c = 0; c < cols; c += 1) {
        const x = -w / 2 + (c + 0.5) * (w / cols);
        if (s === 0 && o.shops) {
          B(bag, 'm', (w / cols) * 0.7, 1.0, 0.06, x, 0.55, d / 2 + 0.02, ['#2f6e8a', '#9a3a2a', '#3f7a46', '#c89a2a'][c % 4]);
        } else {
          B(bag, 'm', 0.55, 0.62, 0.05, x, y + 0.1, d / 2 + 0.02, '#2b3846');
          B(bag, 'm', 0.65, 0.06, 0.12, x, y - 0.25, d / 2 + 0.05, '#efe6d8');
        }
      }
    }
    if (o.tankBlue) { C(bag, 'm', 0.3, 0.3, 0.6, w * 0.25, h + 0.5, 0, '#3f7fb0', 10); B(bag, 'm', 0.08, 0.3, 0.08, w * 0.25, h + 0.3, 0, '#777'); }
    if (o.balc) for (let s = 1; s < n; s += 1) { B(bag, 'm', w * 0.8, 0.07, 0.5, 0, s * sh, d / 2 + 0.28, '#d8cfc2'); B(bag, 'm', w * 0.8, 0.3, 0.04, 0, s * sh + 0.2, d / 2 + 0.52, '#2a2a30'); }
    if (o.shut) for (let s = 0; s < n; s += 1) for (let c = 0; c < cols; c += 1) { const x = -w / 2 + (c + 0.5) * (w / cols); B(bag, 'm', 0.2, 0.64, 0.04, x - 0.4, (s === 0 ? 0.7 : s * sh + 0.85) + 0.1, d / 2 + 0.03, o.shut); B(bag, 'm', 0.2, 0.64, 0.04, x + 0.4, (s === 0 ? 0.7 : s * sh + 0.85) + 0.1, d / 2 + 0.03, o.shut); }
    if (o.pitch) hipRoof(bag, 'm', w + 0.4, d + 0.4, w * 0.5, d * 0.4, 0.9, h + 0.18, o.pitch, o.pitch, 0.5, false);
    OFF = [0, 0, 0]; YAW = 0;
  }

  function buildLodges() {
    const bag = newBag(); const P = Math.PI;
    // north (back) edge: only three buildings, varied height; the west side is left open to the forested slope
    lodge(bag, -10.5, -15, 7.2, 3.4, 5, '#e8742f', 0, { balc: true, shut: '#2f5a3a' });
    lodge(bag, -2.2, -15.4, 5.4, 3.0, 2, '#e9e4da', 0, { shops: true, pitch: '#5a6f86' });
    lodge(bag, 5.8, -15, 6.4, 3.2, 3, '#b7b9b6', 0, { tankBlue: true, balc: true });
    lodge(bag, 14.2, -14.4, 3.6, 2.8, 2, '#ec9a7c', 0, { shut: '#6a3a2a', pitch: '#8a4a3a' });
    // east side (behind the stairs)
    lodge(bag, 15.4, -7.5, 6.4, 3.2, 3, '#e0602d', P / 2, { balc: true, tankBlue: true });
    lodge(bag, 15.6, -1.6, 3.2, 2.6, 2, '#d9d4c8', P / 2, { shops: true, pitch: '#4a6a8a' });
    // low shops on the south edge (kept low, nothing tall near the camera)
    lodge(bag, -8, 15, 6.5, 2.2, 1, '#e3a080', P, { shops: true, pitch: '#2f6e8a' });
    lodge(bag, 7, 15.4, 7, 2.2, 1, '#efe3d2', P, { shops: true, pitch: '#9a3a2a' });
    lodge(bag, 14.4, 11, 3.6, 2.4, 2, '#c9c4bc', P / 2, { shops: true, shut: '#3f7a46' });
    // cable car station, west-south corner
    OFF = [-13.5, 0, 11.5]; YAW = 0;
    B(bag, 'm', 4.4, 2.6, 3.0, 0, 1.3, 0, '#c9c4bc');
    hipRoof(bag, 'm', 4.9, 3.5, 2.6, 1.2, 0.9, 2.6, '#9a3a2a', '#9a3a2a', 0.5, false);
    B(bag, 'm', 1.3, 1.2, 0.05, 0, 0.9, 1.52, '#2b3846');
    B(bag, 'm', 4.0, 0.3, 0.06, 0, 1.85, 1.53, '#b5322a');
    B(bag, 'm', 0.3, 1.3, 0.3, 0, 3.9, 0, '#555'); B(bag, 'm', 1.6, 0.14, 0.14, 0, 4.5, 0, '#555');
    OFF = [0, 0, 0];
    // low court wall (parapet) with a gap at the stairs
    const wallC = '#a79d92';
    B(bag, 'm', 34, 0.5, 0.35, 0, 0.25, -HALF + 0.17, wallC);
    B(bag, 'm', 0.35, 0.5, 34, -HALF + 0.17, 0.25, 0, wallC);
    B(bag, 'm', 13, 0.5, 0.35, -10.5, 0.25, HALF - 0.17, wallC);
    B(bag, 'm', 13.5, 0.5, 0.35, 10.25, 0.25, HALF - 0.17, wallC);
    for (let i = 0; i <= 14; i += 1) B(bag, 'm', 0.04, 0.55, 0.04, -4 + i * 0.5, 0.45, HALF - 0.1, '#16161a');
    seg(bag, 'm', [-4, 0.72, HALF - 0.1], [3.5, 0.72, HALF - 0.1], 0.05, 0.05, '#16161a');
    for (let i = 0; i < 6; i += 1) B(bag, 'm', 0.5 + (i % 3) * 0.2, 0.18, 0.4, -4.8 + i * 1.7 + 0.2, 0.09, HALF + 0.35, '#8f857a'); // broken stones at the lip
    B(bag, 'm', 0.35, 0.5, SZ - 2.5 + HALF, HALF - 0.17, 0.25, (-HALF + SZ - 2.5) / 2, wallC);
    B(bag, 'm', 0.35, 0.5, HALF - (SZ + 2.5), HALF - 0.17, 0.25, (HALF + SZ + 2.5) / 2, wallC);
    // stone stairs down the east side
    const N = 28;
    for (let i = 0; i < N; i += 1) {
      const top = -0.3 - 0.306 * i; const x = HALF + 0.45 + 0.9 * i;
      B(bag, 'm', 0.9, 1.0, 4.6, x, top - 0.5, SZ, i % 2 ? '#aaa095' : '#9d9388');
      B(bag, 'm', 0.9, 0.4, 0.2, x, top + 0.2, SZ - 2.4, '#8a8176');
      B(bag, 'm', 0.9, 0.4, 0.2, x, top + 0.2, SZ + 2.4, '#8a8176');
      if (i % 3 === 0) { B(bag, 'm', 0.04, 0.8, 0.04, x, top + 0.4, SZ - 2.2, '#16161a'); B(bag, 'm', 0.04, 0.8, 0.04, x, top + 0.4, SZ + 2.2, '#16161a'); }
    }
    const x1 = HALF + 0.2; const x2 = HALF + 0.9 * N; const y1 = 0.45; const y2 = -0.3 - 0.306 * N + 0.45;
    seg(bag, 'm', [x1, y1 + 0.2, SZ - 2.2], [x2, y2 + 0.2, SZ - 2.2], 0.05, 0.05, '#16161a');
    seg(bag, 'm', [x1, y1 + 0.2, SZ + 2.2], [x2, y2 + 0.2, SZ + 2.2], 0.05, 0.05, '#16161a');
    // sacrificial pillar near the entrance
    B(bag, 'm', 0.4, 0.18, 0.4, -3.4, 0.09, 9.2, '#9b9186');
    B(bag, 'm', 0.24, 1.7, 0.24, -3.4, 1.0, 9.2, '#b3a99d');
    B(bag, 'm', 0.34, 0.14, 0.34, -3.4, 1.9, 9.2, '#9b9186');
    // poles and wires
    const poles = [[-13.2, -1.5], [12.5, -3.5], [-12.6, -10.5], [11.5, -11.5]];
    poles.forEach(([x, z]) => { C(bag, 'm', 0.07, 0.09, 6.2, x, 3.1, z, '#5a5a5a', 6); B(bag, 'm', 1.1, 0.07, 0.07, x, 5.9, z, '#4a3a2a'); });
    const wire = (a, b, sag) => { const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2]; seg(bag, 'm', a, mid, 0.025, 0.025, '#111'); seg(bag, 'm', mid, b, 0.025, 0.025, '#111'); };
    
    wire([-13.2, 5.9, -1.5], [-13.5, 3.9, 11.5], 0.4); wire([12.5, 5.9, -3.5], [11.5, 5.9, -11.5], 0.3); wire([-13.2, 5.9, -1.5], [-12.6, 5.9, -10.5], 0.3);
    return bag;
  }

  /** Cable-car lines from the station running down towards the lowlands (south-west). */
  /** Paving slabs with grout lines, tonal variation, and stone steps at the south lip. */
  function buildPaving() {
    const bag = newBag(); const R = rng(404); const n = 20; const sz = 34 / n;
    const tones = ['#b09a94', '#a8928c', '#b8a49c', '#a08c88', '#b4a098', '#aa9690'];
    for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) {
      const x = -17 + (i + 0.5) * sz; const z = -17 + (j + 0.5) * sz;
      if (Math.abs(x) < 3.9 && Math.abs(z) < 3.9) continue;
      B(bag, 'm', sz - 0.1, 0.02, sz - 0.1, x, 0.012, z, tones[Math.floor(R() * tones.length)]);
    }
    for (let i = 0; i < 3; i += 1) B(bag, 'm', 7.6, 1.0, 0.55, -0.25, -0.1 - 0.3 * i - 0.5, HALF + 0.3 + 0.55 * i, i % 2 ? '#9d9388' : '#aaa095');
    return bag;
  }
  function MistRings() {
    const mk = (y, op, col) => <mesh key={y} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-5}><ringGeometry args={[27, 150, 48, 1]} /><meshBasicMaterial color={col} transparent opacity={op} depthWrite={false} fog={false} /></mesh>;
    return <group>{mk(-9, 0.28, '#c2d1dc')}{mk(-18, 0.38, '#b8c9d8')}{mk(-28, 0.45, '#b0c3d4')}</group>;
  }

  function buildCables() {
    const bag = newBag();
    const a = [-13.5, 4.5, 11.5]; const b = [-70, -34, 62];
    seg(bag, 'm', a, b, 0.04, 0.04, '#222'); seg(bag, 'm', [a[0] + 0.5, a[1], a[2] + 0.2], [b[0] + 0.5, b[1], b[2] + 0.2], 0.04, 0.04, '#222');
    [0.18, 0.4].forEach((t, i) => {
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      B(bag, 'm', 0.1, 0.5, 0.1, p[0], p[1] - 0.25, p[2], '#333'); B(bag, 'm', 1.1, 0.8, 1.0, p[0], p[1] - 0.9, p[2], i ? '#b5322a' : '#d9a62a');
    });
    return bag;
  }

  function buildCrowd() {
    const bag = newBag(); const R = rng(321);
    const cl = ['#9a5a52', '#b08462', '#94607e', '#566f8a', '#cfc8b8', '#5f7f66', '#a8935a', '#7a5a86', '#454c56'];
    const skin = ['#d9a27a', '#c48a60', '#e0b08a', '#a9714a'];
    const pick = (a) => a[Math.floor(R() * a.length)];
    const person = (x, z, y = 0, s0 = 1, seated = false) => {
      const s = s0;
      if (seated) {
        C(bag, 'm', 0.15 * s, 0.17 * s, 0.14 * s, x, y + 0.07 * s, z, pick(cl), 7);
        C(bag, 'm', 0.1 * s, 0.13 * s, 0.34 * s, x, y + 0.3 * s, z, pick(cl), 7);
        T(bag, 'm', new THREE.SphereGeometry(0.12 * s, 8, 6), x, y + 0.57 * s, z, pick(skin));
        C(bag, 'm', 0.12 * s, 0.12 * s, 0.05 * s, x, y + 0.67 * s, z, '#1b1b1b', 7);
        return;
      }
      C(bag, 'm', 0.11 * s, 0.15 * s, 0.55 * s, x, y + 0.3 * s, z, pick(cl), 7);
      C(bag, 'm', 0.1 * s, 0.1 * s, 0.22 * s, x, y + 0.67 * s, z, pick(cl), 7);
      T(bag, 'm', new THREE.SphereGeometry(0.13 * s, 8, 6), x, y + 0.88 * s, z, pick(skin));
      C(bag, 'm', 0.13 * s, 0.13 * s, 0.05 * s, x, y + 0.99 * s, z, '#1b1b1b', 7);
    };
    const free = (x, z) => !(Math.abs(x) < 5.3 && Math.abs(z) < 5.3) && Math.hypot(x - 5.2, z - 3.4) > 1.5 && Math.hypot(x + 5.4, z - 3.6) > 2.2 && !(z > 14.5 || z < -9 || Math.abs(x) > 15);
    const clusters = [[-7.5, 6.6, 7], [-2.8, 8.2, 5], [3.5, 7.6, 6], [8.6, 6.4, 4], [-9.8, -1.2, 5], [9.2, -2.4, 4], [-6.2, -7.0, 4], [6.8, -7.4, 3], [0.8, 11.6, 5], [-11.8, 10.2, 3], [12, 11.2, 3]];
    clusters.forEach(([cx, cz, n]) => {
      for (let i = 0; i < n; i += 1) {
        const a = R() * Math.PI * 2; const r = Math.sqrt(R()) * (0.5 + n * 0.12);
        const x = cx + Math.cos(a) * r; const z = cz + Math.sin(a) * r;
        if (!free(x, z)) continue;
        person(x, z, 0, 0.82 + R() * 0.3 - (R() < 0.12 ? 0.3 : 0), R() < 0.22);
      }
    });
    for (let i = 0; i < 6; i += 1) { const x = -5.4 + (R() - 0.5) * 3.4; const z = 5.0 + R() * 1.3; person(x, z, 0, 0.85 + R() * 0.25, R() < 0.25); }
    for (let i = 0; i < 3; i += 1) person(5.2 + (R() - 0.5) * 2.6, 5.0 + R() * 1.1, 0, 0.85 + R() * 0.25);
    for (let i = 0; i < 8; i += 1) { const sx = 3 + Math.floor(R() * 8); person(HALF + 0.45 + 0.9 * sx, SZ + (R() - 0.5) * 3.4, -0.3 - 0.306 * sx, 0.85 + R() * 0.25); }
    // tarpaulin stalls
    const tarp = (x, z, c, ry) => {
      OFF = [x, 0, z]; YAW = ry;
      [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]].forEach(([px, pz]) => B(bag, 'm', 0.06, 1.7, 0.06, px, 0.85, pz, '#6a5a48'));
      quad(bag, 'm', [[-1.6, 1.85, -1.1], [1.6, 1.85, -1.1], [1.6, 1.55, 1.2], [-1.6, 1.55, 1.2]], [0, 1, 0], c);
      quad(bag, 'm', [[-1.6, 1.85, -1.1], [1.6, 1.85, -1.1], [1.6, 1.55, 1.2], [-1.6, 1.55, 1.2]], [0, -1, 0], '#8a5a20');
      OFF = [0, 0, 0]; YAW = 0;
    };
    tarp(-9.5, 8.6, '#d9822b', 0.2); tarp(9.4, 9.6, '#3f7f9c', -0.3);
    for (let i = 0; i < 4; i += 1) person(-9.5 + (R() - 0.5) * 2.4, 8.6 + (R() - 0.5) * 1.4, 0, 0.85 + R() * 0.2, i % 2 === 0);
    return bag;
  }

  const SKYH = '#d9e5ee';
  /** Snow range: ridged, jittered cones in 3 hazy layers (tops are absolute heights above the court). */
  function buildPeaks() {
    const bag = newBag(); const R = rng(9);
    const rock = new THREE.Color('#8a9bb8'); const snow = new THREE.Color('#fbfdff'); const sky = new THREE.Color(SKYH); const t = new THREE.Color();
    const layers = [[150, 24, 36, 0.58, 11, 0.0], [139, 17, 26, 0.66, 12, 0.5], [129, 10, 17, 0.74, 14, 0.25]];
    layers.forEach(([r, h0, h1, haze, n, off], li) => {
      for (let k = 0; k < n; k += 1) {
        const a = -2.0 + ((k + off) / (n - 1)) * 4.0; const top = h0 + (h1 - h0) * (0.5 + 0.5 * Math.sin(k * 1.9 + li * 2.3)) + R() * 3;
        const H = top + 36; const rad = H * 0.62;
        const SEG = 20; const RN = 36; const pa = []; const ix = [];
        for (let ri = 0; ri <= RN; ri += 1) {
          const f0 = ri / RN; const rr = ri === RN ? 0 : rad * Math.pow(1 - f0, 0.9);
          for (let si = 0; si < SEG; si += 1) {
            const ang = (si / SEG) * Math.PI * 2; const d = 1 + 0.06 * Math.sin(ang * 3 + k * 2.1) + 0.04 * Math.sin(ang * 5 + k) * (1 - f0);
            pa.push(Math.cos(ang) * rr * d, -H / 2 + f0 * H, Math.sin(ang) * rr * d);
          }
        }
        for (let ri = 0; ri < RN; ri += 1) for (let si = 0; si < SEG; si += 1) {
          const s2 = (si + 1) % SEG; const a0 = ri * SEG + si; const a1 = ri * SEG + s2; const b0 = (ri + 1) * SEG + si; const b1 = (ri + 1) * SEG + s2;
          ix.push(a0, b0, a1, a1, b0, b1);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); g.setIndex(ix); const p = g.attributes.position;
        g.computeVertexNormals(); const nn = g.attributes.normal; const col = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i += 1) {
          const abs = p.getY(i) + H / 2 - 36; const f = Math.max(0, Math.min(1, (abs + 4) / (top + 4)));
          t.copy(rock).lerp(snow, sstep(0.7, 0.85, f) * (li === 2 ? 0.7 : 1));
          t.lerp(sky, haze + (1 - f) * 0.15);
          const sh = 0.78 + 0.22 * Math.max(0, nn.getX(i) * 0.5 + nn.getY(i) * 0.5 + nn.getZ(i) * 0.7); col[i * 3] = t.r * sh; col[i * 3 + 1] = t.g * sh; col[i * 3 + 2] = Math.min(1, t.b * (sh + 0.06));
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        g.translate(Math.sin(a) * r, -36 + H / 2, -Math.cos(a) * r);
        bag.m.push(g.toNonIndexed());
      }
    });
    return bag;
  }

  /** Four progressively paler forested ridge bands wrapping the valley (full circle, low to the south). */
  function buildRidges() {
    const bag = newBag(); const R = rng(31); const sky = new THREE.Color(SKYH); const t = new THREE.Color();
    const bands = [[58, -9, 0.35], [82, -2, 0.5], [106, 4, 0.64], [124, 9, 0.76]];
    const N = 120;
    bands.forEach(([r, base, haze], bi) => {
      const ys = [];
      for (let i = 0; i <= N; i += 1) {
        const a = (i / N) * Math.PI * 2; const north = Math.max(0, -Math.cos(a));
        ys.push(base - 3 + north * (3 + bi * 1.5) + 2.6 * Math.sin(a * 5 + bi * 1.7) + 1.8 * Math.sin(a * 13 + bi) + R() * 1.1 - (1 - north) * 2);
      }
      for (let i = 0; i < N; i += 1) {
        const a0 = (i / N) * Math.PI * 2; const a1 = ((i + 1) / N) * Math.PI * 2;
        const p0 = [Math.sin(a0) * r, 0, -Math.cos(a0) * r]; const p1 = [Math.sin(a1) * r, 0, -Math.cos(a1) * r];
        t.set(['#35633a', '#3f6e41', '#4d7a4c', '#5d8658'][bi]).offsetHSL(0, 0, (R() - 0.5) * 0.04).lerp(sky, haze);
        const c = `#${t.getHexString()}`;
        quad(bag, 'm', [[p0[0], -45, p0[2]], [p1[0], -45, p1[2]], [p1[0], ys[i + 1], p1[2]], [p0[0], ys[i], p0[2]]], [-Math.sin(a0), 0, Math.cos(a0)], c);
      }
    });
    return bag;
  }

  /** Haze-proof mesh: not fogged (the scene fog is beige), dimmed at dusk. */
  function HazeMesh({ bag, lit = true, dim = "#8d7fae", flat = true, basic = false }) {
    const geo = useMemo(() => merge(bag.m), [bag]);
    const mat = useMemo(() => (basic ? new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }) : lit ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: flat, fog: false, emissive: flat ? '#000000' : '#8fa2bc', emissiveIntensity: flat ? 0 : 0.55 }) : new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.BackSide, depthWrite: false })), [lit, basic]);
    const tune = (renderer, scene) => { const dusk = scene.fog && scene.fog.color.r < 0.3; mat.color.set(dusk ? dim : '#ffffff'); };
    return <mesh geometry={geo} material={mat} onBeforeRender={tune} renderOrder={lit ? 0 : -10} frustumCulled={false} />;
  }

  function buildSky() {
    const bag = newBag(); const g = new THREE.SphereGeometry(230, 28, 14); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
    const hz = new THREE.Color(SKYH); const mid = new THREE.Color('#a8c8e6'); const zen = new THREE.Color('#5b95d2'); const t = new THREE.Color();
    for (let i = 0; i < p.count; i += 1) {
      const y = Math.max(0, p.getY(i) / 230);
      t.copy(hz).lerp(mid, sstep(0, 0.22, y)).lerp(zen, sstep(0.2, 0.85, y));
      if (p.getY(i) < 0) t.copy(hz);
      col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('normal', g.attributes.normal);
    bag.m.push(g.toNonIndexed());
    return bag;
  }

  function ManakamanaEnv() {
    const M = useM();
    const terrain = useMemo(buildTerrain, []);
    const trees = useMemo(buildTrees, []);
    const lodges = useMemo(buildLodges, []);
    const cables = useMemo(buildCables, []);
    const crowd = useMemo(buildCrowd, []);
    const peaks = useMemo(buildPeaks, []);
    const ridges = useMemo(buildRidges, []);
    const sky = useMemo(buildSky, []);
    const paving = useMemo(buildPaving, []);
    return (
      <group>
        <mesh geometry={terrain} material={M.plain('#ffffff', { vertexColors: true, roughness: 1 })} receiveShadow />
        <Box s={[34, 0.34, 34]} p={[0, -0.17, 0]} m={M.plain('#9a8c82', { roughness: 1 })} cast={false} />
        <BagMesh bag={paving} />
        <BagMesh bag={trees} />
        <MistRings />
        <BagMesh bag={lodges} />
        <BagMesh bag={cables} />
        <BagMesh bag={crowd} />
        <HazeMesh bag={sky} lit={false} dim="#6a5a92" />
        <HazeMesh bag={peaks} flat={false} basic />
        <HazeMesh bag={ridges} />
      </group>
    );
  }

  return { 'manakamana-temple': { Main: ManakamanaMain, Env: ManakamanaEnv } };
}
