// Kagbeni and Kag Chode Monastery (Mustang, 2,804 m). 1 unit ~ 3 m.
// Old wing: tall plain flat-roofed red-ochre rammed-earth block with battered (inward-leaning) walls, almost windowless.
// New temple beside it (to its right from the front): red/white banded, white window frames, small gold canopy roof.
// They stand on an eroded cliff-edge spur above a braided grey river; behind rises a huge bare layered brown mountain wall.
// Village of flat-roofed mud/stone houses with firewood, the ruined Kag Khar tower, chortens, kheni gate, terraced fields.
// Orientation and dimensions are estimates (no source gives a plan).
export default function make(K) {
  const { useM, THREE, useMemo, Frame, Roof, PrayerFlags } = K;

  /* ---------- noise ---------- */
  const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi); const b = hash2(xi + 1, yi); const c = hash2(xi, yi + 1); const d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1 + 5.2, y * 2.1 + 1.3) * 0.3 + vn(x * 4.3 + 9.1, y * 4.3 + 3.7) * 0.15;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const FLAG = ['#2f6db5', '#f4f1e8', '#c0392b', '#2e8b57', '#e2b33c'];

  /* ---------- terrain height field (shared by Env and by house placement) ---------- */
  const RIVER_BED = -2.75;
  const channelMask = (z) => Math.max(smooth(6.2, 6.9, z) * (1 - smooth(9.0, 9.7, z)), smooth(11.2, 11.9, z) * (1 - smooth(13.9, 14.6, z)), smooth(16.0, 16.6, z) * (1 - smooth(17.8, 18.4, z)));
  const mtnTop = (x) => {
    const peak = 26 * Math.exp(-(((x - 17) / 13) ** 2));
    const wall = 17 + 6 * fbm(x * 0.07, 3.3);
    return (wall + peak) * mix(0.42, 1, smooth(-62, -22, x));
  };
  function terrainH(x, z) {
    const ax = Math.abs(x);
    const cz = ax < 9 ? 3.0 : 3.0 + smooth(9, 14, ax) * (0.5 + 0.9 * fbm(x * 0.15 + 3, 2.2));
    let low = RIVER_BED;
    if (x > 17) low = mix(RIVER_BED, -1.4, smooth(15, 19, x) * (1 - smooth(10.5, 12, z)));
    const drop = smooth(cz - 0.25, cz + 1.9, z);
    let h = mix(0, low, drop);
    if (z > cz + 0.8 && low === RIVER_BED) {
      h += (fbm(x * 0.13, z * 0.22) - 0.5) * 0.7 * smooth(cz + 0.8, cz + 4, z);
      h -= 0.55 * channelMask(z) * (0.7 + 0.3 * fbm(x * 0.1, z));
    } else if (z > cz + 0.8) {
      h += (fbm(x * 0.13, z * 0.22) - 0.5) * 0.2;
    }
    // far bank, rising to the valley side
    h += smooth(27, 46, z) * (4.5 + 9 * fbm(x * 0.05 + 9, z * 0.05));
    // the mountain wall behind the village
    const t = Math.max(0, -z - 9);
    if (t > 0) {
      const H = mtnTop(x);
      let m = H * (1 - Math.exp(-t / 11.5));
      const ridged = 1 - Math.abs(2 * fbm(x * 0.2, z * 0.12) - 1);
      m -= ridged ** 3 * 1.5 * smooth(0, 9, t);
      m += 12 * Math.exp(-Math.hypot((x - 20) / 5, (z + 30) / 7));
      m += (fbm(x * 0.09, z * 0.09) - 0.5) * 5 * smooth(0, 14, t);
      m += 0.2 * Math.sin(m * 1.25 + x * 0.12) * smooth(2, 12, t);
      h += m;
    }
    // right-hand valley side and a low left flank
    h += smooth(44, 62, x) * (12 + 8 * fbm(x * 0.06, z * 0.06 + 4)) * (1 - smooth(32, 48, z));
    h += smooth(-50, -62, x) * 4 * fbm(x * 0.1, z * 0.1);
    // let the plate sink to the flat disc at its rim
    const edge = Math.max(smooth(56, 69, Math.abs(x)), smooth(50, 61.5, Math.abs(z)));
    return mix(h, -3.1, edge);
  }

  /* ---------- merged vertex-colour builder ---------- */
  function makeBuilder(seed0 = 7) {
    const P = []; const N = []; const C = [];
    const col = new THREE.Color();
    let seed = seed0;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let T = { x: 0, y: 0, z: 0, c: 1, s: 0 };
    const setT = (x = 0, y = 0, z = 0, ry = 0) => { T = { x, y, z, c: Math.cos(ry), s: Math.sin(ry) }; };
    const tf = (x, y, z) => [T.x + x * T.c + z * T.s, T.y + y, T.z - x * T.s + z * T.c];
    const quad = (a, b, c, d, color, ctr, j = 0.07) => {
      let A = tf(...a); let B = tf(...b); let Cc = tf(...c); let D = tf(...d);
      const O = tf(...ctr);
      let ux = B[0] - A[0]; let uy = B[1] - A[1]; let uz = B[2] - A[2];
      const vx = Cc[0] - A[0]; const vy = Cc[1] - A[1]; const vz = Cc[2] - A[2];
      let nx = uy * vz - uz * vy; let ny = uz * vx - ux * vz; let nz = ux * vy - uy * vx;
      const cx = (A[0] + B[0] + Cc[0] + D[0]) / 4 - O[0]; const cy = (A[1] + B[1] + Cc[1] + D[1]) / 4 - O[1]; const cz = (A[2] + B[2] + Cc[2] + D[2]) / 4 - O[2];
      if (nx * cx + ny * cy + nz * cz < 0) { const t = B; B = D; D = t; nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      col.set(color);
      const f = 1 + (rnd() - 0.5) * 2 * j;
      for (const q of [A, B, Cc, A, Cc, D]) { P.push(q[0], q[1], q[2]); N.push(nx, ny, nz); C.push(Math.min(1, col.r * f), Math.min(1, col.g * f), Math.min(1, col.b * f)); }
    };
    const FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const hex = (k, color, j = 0.07) => {
      const ctr = [0, 1, 2].map((i) => k.reduce((s, q) => s + q[i], 0) / 8);
      for (const f of FACES) quad(k[f[0]], k[f[1]], k[f[2]], k[f[3]], color, ctr, j);
    };
    /** box: centre x,z, base y, full sizes */
    const box = (x, y, z, sx, sy, sz, color, ry = 0, j = 0.07) => {
      const c = Math.cos(ry); const s = Math.sin(ry);
      const pt = (dx, dz, yy) => [x + dx * c + dz * s, yy, z - dx * s + dz * c];
      const hx = sx / 2; const hz = sz / 2;
      hex([pt(-hx, -hz, y), pt(hx, -hz, y), pt(hx, hz, y), pt(-hx, hz, y), pt(-hx, -hz, y + sy), pt(hx, -hz, y + sy), pt(hx, hz, y + sy), pt(-hx, hz, y + sy)], color, j);
    };
    /** frustum: bottom full sizes bw,bd to top tw,td */
    const frustum = (x, y, z, bw, bd, tw, td, h, color, ry = 0, j = 0.07) => {
      const c = Math.cos(ry); const s = Math.sin(ry);
      const pt = (dx, dz, yy) => [x + dx * c + dz * s, yy, z - dx * s + dz * c];
      hex([pt(-bw / 2, -bd / 2, y), pt(bw / 2, -bd / 2, y), pt(bw / 2, bd / 2, y), pt(-bw / 2, bd / 2, y), pt(-tw / 2, -td / 2, y + h), pt(tw / 2, -td / 2, y + h), pt(tw / 2, td / 2, y + h), pt(-tw / 2, td / 2, y + h)], color, j);
    };
    /** n-sided prism / cone frustum, radii rb (bottom) and rt (top) */
    const prism = (x, y, z, rb, rt, h, n, color, j = 0.06, ry = 0) => {
      for (let i = 0; i < n; i += 1) {
        const a0 = ry + (i / n) * Math.PI * 2; const a1 = ry + ((i + 1) / n) * Math.PI * 2;
        const b0 = [x + Math.cos(a0) * rb, y, z + Math.sin(a0) * rb]; const b1 = [x + Math.cos(a1) * rb, y, z + Math.sin(a1) * rb];
        const t0 = [x + Math.cos(a0) * rt, y + h, z + Math.sin(a0) * rt]; const t1 = [x + Math.cos(a1) * rt, y + h, z + Math.sin(a1) * rt];
        quad(b0, b1, t1, t0, color, [x, y + h / 2, z], j);
        if (rt > 0.001) {
          const o = tf(x, y + h, z); const A = tf(...t0); const B = tf(...t1);
          col.set(color); const f = 1 + (rnd() - 0.5) * 2 * j;
          for (const q of [o, B, A]) { P.push(q[0], q[1], q[2]); N.push(0, 1, 0); C.push(col.r * f, col.g * f, col.b * f); }
        }
      }
    };
    const geo = () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeBoundingSphere();
      return g;
    };
    return { quad, box, frustum, prism, hex, geo, setT, rnd };
  }

  const Merged = ({ geo, emissive, shadow = true }) => (
    <mesh geometry={geo} castShadow={shadow} receiveShadow>
      {emissive
        ? <meshStandardMaterial vertexColors color="#ffffff" emissive="#ffb347" emissiveIntensity={0.85} roughness={0.6} />
        : <meshStandardMaterial vertexColors roughness={0.95} />}
    </mesh>
  );

  /* ---------- palette ---------- */
  const OCHRE = '#a4472a';
  const OCHRE_DK = '#9a3f26';
  const NEWRED = '#a2442b';
  const WHITE = '#ece6d6';
  const DARK = '#2a211b';
  const TIMBER = '#5a3a22';
  const STONE_G = '#8f877a';

  /* ---------- old wing geometry (battered walls) ---------- */
  const WING = { x: -2.6, z: -0.2, hwB: 2.0, hdB: 2.0, hwT: 1.5, hdT: 1.5, H: 5.4 };
  const wingHW = (y) => WING.hwB - (WING.hwB - WING.hwT) * (y / WING.H);
  const wingHD = (y) => WING.hdB - (WING.hdB - WING.hdT) * (y / WING.H);
  const wingFrontZ = (y) => WING.z + wingHD(y);

  /* =========================== MAIN =========================== */
  function KagMain() {
    const M = useM();
    const body = useMemo(() => {
      const B = makeBuilder(11); const G = makeBuilder(23);
      const W = WING;
      for (let i = 0; i < 14; i += 1) {
        const bx0 = -10 + i * 1.5 + B.rnd() * 0.8; const bz0 = 3.3 + B.rnd() * 1.8; const r = 0.18 + B.rnd() * 0.3;
        B.prism(bx0, terrainH(bx0, bz0) - 0.05, bz0, r, r * 0.65, r * 1.0, 6, ['#8c8576', '#7a6f60', '#9a9183'][i % 3], 0.12, i);
      }

      /* ----- OLD WING: tall battered red-ochre rammed-earth block ----- */
      B.frustum(W.x, 0, W.z, W.hwB * 2, W.hdB * 2, W.hwT * 2, W.hdT * 2, W.H, OCHRE, 0, 0.06);
      /* dark band under the roofline (follows the batter) */
      const yb0 = W.H - 0.4; const yb1 = W.H - 0.08;
      B.frustum(W.x, yb0, W.z, (wingHW(yb0) + 0.025) * 2, (wingHD(yb0) + 0.025) * 2, (wingHW(yb1) + 0.025) * 2, (wingHD(yb1) + 0.025) * 2, yb1 - yb0, '#4a3126', 0, 0.04);
      /* flat roof: mud surface and low parapet */
      B.box(W.x, W.H - 0.02, W.z, W.hwT * 2 - 0.02, 0.06, W.hdT * 2 - 0.02, '#7a5e46', 0, 0.06);
      const pw = W.hwT - 0.04; const pd = W.hdT - 0.04;
      B.box(W.x, W.H, W.z + pd, pw * 2, 0.2, 0.1, OCHRE_DK, 0, 0.04);
      B.box(W.x, W.H, W.z - pd, pw * 2, 0.2, 0.1, OCHRE_DK, 0, 0.04);
      B.box(W.x + pw, W.H, W.z, 0.1, 0.2, pd * 2, OCHRE_DK, 0, 0.04);
      B.box(W.x - pw, W.H, W.z, 0.1, 0.2, pd * 2, OCHRE_DK, 0, 0.04);
      B.box(W.x - 0.5, W.H, W.z - 0.5, 0.7, 0.32, 0.6, OCHRE_DK, 0, 0.04); /* small roof hut */
      /* weathering streaks on the front face */
      const fz = (y, e) => wingFrontZ(y) + e;
      const fq = (cx, y0, y1, wb, wt, color, e) => B.quad([cx - wb / 2, y0, fz(y0, e)], [cx + wb / 2, y0, fz(y0, e)], [cx + wt / 2, y1, fz(y1, e)], [cx - wt / 2, y1, fz(y1, e)], color, [cx, (y0 + y1) / 2, W.z - 0.8], 0.02);
      for (let i = 0; i < 8; i += 1) {
        const px = W.x - 1.3 + (i / 7) * 2.6 + (B.rnd() - 0.5) * 0.3; const top = W.H - 0.5 - B.rnd() * 0.5; const ph = 0.9 + B.rnd() * 1.6; const pw = 0.1 + B.rnd() * 0.1;
        fq(px, top - ph, top, pw, pw * 0.7, ['#96402a', '#b04d2f', '#9d4228', '#a94a2d'][i % 4], 0.006 + (i % 3) * 0.001);
      }
      /* the few openings: one big black trapezoid window with white frame, a dark lintel, and small slits */
      const dy = 1.3;
      fq(W.x + 0.25, 2.46 + dy, 3.28 + dy, 0.52, 0.44, '#ece6d6', 0.012);
      fq(W.x + 0.25, 2.54 + dy, 3.2 + dy, 0.36, 0.28, '#0c0907', 0.02);
      B.box(W.x + 0.25, 3.28 + dy, fz(3.28 + dy, 0) + 0.04, 0.6, 0.07, 0.1, TIMBER, 0);
      B.box(W.x + 0.25, 2.4 + dy, fz(2.4 + dy, 0) + 0.04, 0.58, 0.06, 0.1, '#d8d0c0', 0);
      /* wooden balcony under the main window */
      B.box(W.x + 0.25, 2.14 + dy, fz(2.2 + dy, 0) + 0.2, 1.1, 0.06, 0.42, TIMBER, 0);
      B.box(W.x + 0.25, 2.4 + dy, fz(2.2 + dy, 0) + 0.4, 1.1, 0.04, 0.04, TIMBER, 0);
      for (let i = 0; i <= 5; i += 1) B.box(W.x - 0.3 + i * 0.22, 2.17 + dy, fz(2.2 + dy, 0) + 0.4, 0.04, 0.25, 0.04, TIMBER, 0);
      [[-1.1, 4.3], [1.0, 3.7], [-0.9, 1.5], [1.0, 1.9]].forEach(([dx, y]) => { fq(W.x + dx, y, y + 0.26, 0.2, 0.18, '#e4dccb', 0.012); fq(W.x + dx, y + 0.03, y + 0.23, 0.13, 0.11, '#0c0907', 0.02); });
      [[-0.62, 4.2, 4.5, 0.16], [0.9, 3.1, 3.35, 0.16], [-0.3, 2.3, 2.52, 0.14], [0.2, 1.1, 1.3, 0.14]].forEach(([dx, y0, y1, w]) => {
        fq(W.x + dx, y0 - 0.04, y1 + 0.04, w + 0.08, w + 0.06, '#e4dccb', 0.012);
        fq(W.x + dx, y0, y1, w, w * 0.85, '#0c0907', 0.02);
      });
      /* low prayer-wheel house along the base of the front wall */
      const sz0 = fz(0, 0); const sd = 0.46;
      for (let i = 0; i < 6; i += 1) B.box(W.x - 1.95 + i * 0.62, 0, sz0 + sd - 0.04, 0.07, 0.62, 0.07, TIMBER, 0, 0.05);
      B.box(W.x - 0.4, 0.6, sz0 + sd / 2, 3.45, 0.07, sd + 0.1, '#6a4330', 0, 0.05); /* sloping eave slab (low) */
      B.box(W.x - 0.4, 0.0, sz0 + sd / 2 - 0.02, 3.4, 0.1, sd, '#6f655a', 0, 0.05);
      for (let i = 0; i < 13; i += 1) {
        const x = W.x - 2.1 + i * 0.253;
        if (Math.abs(x - (W.x - 0.4)) < 0.27) continue;
        B.prism(x, 0.12, sz0 + 0.17, 0.065, 0.065, 0.32, 8, i % 2 ? '#b5832f' : '#a56a2a', 0.08);
        B.prism(x, 0.44, sz0 + 0.17, 0.075, 0.03, 0.07, 8, '#7a2a20', 0.05);
      }
      /* wall door in the middle of the shed */
      B.box(W.x - 0.4, 0.1, sz0 + 0.06, 0.62, 0.78, 0.09, '#e4dccb', 0);
      B.box(W.x - 0.4, 0.1, sz0 + 0.1, 0.46, 0.7, 0.1, '#2a1a10', 0);
      B.box(W.x - 0.4, 0.8, sz0 + 0.1, 0.62, 0.07, 0.12, TIMBER, 0);
      /* small door at the base, right of the prayer-wheel shed */
      B.box(W.x + 1.55, 0, sz0 + 0.03, 0.5, 0.82, 0.07, '#d9d0bd', 0);
      B.box(W.x + 1.55, 0, sz0 + 0.06, 0.38, 0.74, 0.07, '#2a1a10', 0);
      B.box(W.x + 1.55, 0.78, sz0 + 0.08, 0.56, 0.06, 0.1, TIMBER, 0);

      /* ----- NEW TEMPLE: 3 storeys, red/white banded all the way up, rows of white-framed windows ----- */
      const tx = 2.5; const tz = 0.1; const hw = 1.5; const hd = 1.5;
      B.box(tx, 0, tz, hw * 2 + 0.12, 0.15, hd * 2 + 0.12, '#8a8176', 0, 0.05);
      B.box(tx, 0.15, tz, hw * 2, 0.9, hd * 2, NEWRED, 0, 0.03);
      B.box(tx, 1.05, tz, hw * 2 + 0.06, 0.09, hd * 2 + 0.06, WHITE, 0, 0.03);
      B.box(tx, 1.14, tz, hw * 2, 0.92, hd * 2, NEWRED, 0, 0.03);
      B.box(tx, 2.06, tz, hw * 2 + 0.06, 0.09, hd * 2 + 0.06, WHITE, 0, 0.03);
      B.box(tx, 2.15, tz, hw * 2 - 0.08, 0.85, hd * 2 - 0.08, NEWRED, 0, 0.03);
      B.box(tx, 3.0, tz, hw * 2 + 0.04, 0.1, hd * 2 + 0.04, WHITE, 0, 0.02);
      B.box(tx, 3.1, tz, hw * 2 + 0.04, 0.1, hd * 2 + 0.04, '#8e2f22', 0, 0.02);
      B.box(tx, 3.2, tz, hw * 2 + 0.04, 0.1, hd * 2 + 0.04, WHITE, 0, 0.02);
      B.box(tx, 3.3, tz, hw * 2 + 0.04, 0.1, hd * 2 + 0.04, '#8e2f22', 0, 0.02);
      B.box(tx, 3.4, tz, hw * 2 + 0.14, 0.12, hd * 2 + 0.14, '#4a2a20', 0, 0.04);
      B.box(tx, 3.52, tz, hw * 2 + 0.04, 0.06, hd * 2 + 0.04, '#6a5a48', 0, 0.04);
      B.box(tx, 3.58, tz + hd, hw * 2 + 0.04, 0.2, 0.07, WHITE, 0, 0.03);
      B.box(tx, 3.58, tz - hd, hw * 2 + 0.04, 0.2, 0.07, WHITE, 0, 0.03);
      B.box(tx + hw, 3.58, tz, 0.07, 0.2, hd * 2 + 0.04, WHITE, 0, 0.03);
      B.box(tx - hw, 3.58, tz, 0.07, 0.2, hd * 2 + 0.04, WHITE, 0, 0.03);
      /* penthouse carrying the gold canopy */
      B.box(tx, 3.58, tz, 1.8, 0.45, 1.8, NEWRED, 0, 0.03);
      B.box(tx, 3.98, tz, 1.88, 0.1, 1.88, WHITE, 0, 0.03);
      B.box(tx, 4.08, tz, 1.8, 0.07, 1.8, '#4a2a20', 0, 0.04);
      B.box(tx, 3.66, tz + 0.91, 0.55, 0.32, 0.06, '#e8e0d0', 0);
      B.box(tx, 3.7, tz + 0.93, 0.4, 0.25, 0.06, DARK, 0);
      const win = (cx, y, w, h, zf, litChance = 0.5) => {
        B.box(cx, y - 0.07, zf + 0.02, w + 0.16, h + 0.14, 0.06, WHITE, 0, 0.02);
        const lit = B.rnd() < litChance;
        (lit ? G : B).box(cx, y, zf + 0.045, w, h, 0.06, lit ? '#ffcf7a' : DARK, 0, 0);
        B.box(cx, y + h + 0.07, zf + 0.05, w + 0.2, 0.05, 0.1, '#7c2c20', 0);
      };
      const frontZ = tz + hd;
      [-1.1, -0.72, 0.72, 1.1].forEach((dx) => win(tx + dx, 0.5, 0.24, 0.32, frontZ, 0.5));
      [-1.15, -0.58, 0, 0.58, 1.15].forEach((dx) => win(tx + dx, 1.52, 0.28, 0.38, frontZ, 0.5));
      [-1.15, -0.58, 0, 0.58, 1.15].forEach((dx) => win(tx + dx, 2.45, 0.26, 0.3, frontZ + 0.015, 0.5));
      B.box(tx, 0.15, frontZ + 0.02, 0.8, 0.82, 0.07, WHITE, 0);
      B.box(tx, 0.15, frontZ + 0.05, 0.6, 0.72, 0.07, '#3a2216', 0);
      B.box(tx, 0.9, frontZ + 0.14, 1.0, 0.07, 0.34, '#4a2a20', 0);
      B.box(tx - 0.46, 0.15, frontZ + 0.28, 0.06, 0.74, 0.06, TIMBER, 0);
      B.box(tx + 0.46, 0.15, frontZ + 0.28, 0.06, 0.74, 0.06, TIMBER, 0);
      [[-1, 1.52], [1, 1.52], [-1, 0.5], [1, 0.5], [-1, 2.45], [1, 2.45]].forEach(([sgn, y]) => [-0.9, 0, 0.9].forEach((dz) => {
        B.box(tx + sgn * (hw + 0.02), y - 0.06, tz + dz, 0.06, 0.4, 0.34, WHITE, 0, 0.02);
        B.box(tx + sgn * (hw + 0.045), y, tz + dz, 0.06, 0.28, 0.22, DARK, 0, 0);
      }));
      /* gold finial: vase, bulb, spike, corner ornaments of the lower canopy */
      B.prism(tx, 5.05, tz, 0.15, 0.1, 0.16, 8, '#e6b13a', 0.02);
      B.prism(tx, 5.21, tz, 0.1, 0.2, 0.12, 8, '#e6b13a', 0.02);
      B.prism(tx, 5.33, tz, 0.2, 0.06, 0.14, 8, '#e6b13a', 0.02);
      B.prism(tx, 5.47, tz, 0.04, 0.0, 0.36, 6, '#e6b13a', 0.02);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B.prism(tx + a * 1.12, 4.58, tz + b * 1.12, 0.07, 0.0, 0.24, 6, '#e6b13a', 0.02));

      /* ----- small white chorten beside the new temple (to its right) ----- */
      const cx = 5.2; const cz = 1.9;
      B.box(cx, 0, cz, 0.78, 0.16, 0.78, '#e8e1d2', 0, 0.03);
      B.box(cx, 0.16, cz, 0.62, 0.14, 0.62, '#f1ece0', 0, 0.03);
      B.box(cx, 0.3, cz, 0.64, 0.05, 0.64, '#7a2a20', 0);
      B.prism(cx, 0.35, cz, 0.27, 0.25, 0.36, 12, '#f1ece0', 0.03);
      B.box(cx, 0.71, cz, 0.3, 0.12, 0.3, '#f1ece0', 0, 0.03);
      B.box(cx, 0.83, cz, 0.3, 0.04, 0.3, '#7a2a20', 0);
      [0.2, 0.17, 0.14, 0.11].forEach((r, i) => B.prism(cx, 0.87 + i * 0.09, cz, r, r * 0.88, 0.09, 8, '#ebe4d4', 0.03));
      B.prism(cx, 1.23, cz, 0.05, 0.01, 0.2, 6, '#d9a23a', 0.02);
      /* diyas in front of it (glow at dusk) */
      [-0.2, 0, 0.2].forEach((dx) => G.box(cx + dx, 0.17, cz + 0.4, 0.07, 0.05, 0.07, '#ffb347', 0, 0));

      /* ----- flag pole on a round stone cairn base in front of the old wing ----- */
      const fx = -1.55; const fzp = 2.7;
      B.prism(fx, 0, fzp, 0.38, 0.28, 0.32, 10, '#9a9082', 0.1);
      B.prism(fx, 0.3, fzp, 0.2, 0.18, 0.1, 10, '#b8b0a2', 0.06);
      B.prism(fx, 0.38, fzp, 0.035, 0.03, 4.6, 6, '#6a4a2c', 0.03);
      B.prism(fx, 4.96, fzp, 0.045, 0.0, 0.18, 6, '#d9a23a', 0.02);
      FLAG.forEach((c, i) => {
        B.box(fx + 0.1, 4.4 - i * 0.34 + 0.0, fzp + 0.0, 0.2, 0.3, 0.012, c, 0.0, 0.02);
        B.box(fx - 0.1, 4.5 - i * 0.3, fzp + 0.0, 0.2, 0.26, 0.012, FLAG[(i + 2) % 5], 0.0, 0.02);
      });
      return { geo: B.geo(), glow: G.geo() };
    }, []);

    return (
      <group>
        <Merged geo={body.geo} />
        <Merged geo={body.glow} emissive shadow={false} />
        <group position={[2.5, 4.1, 0.1]}>
          <Roof w={2.6} d={2.6} h={0.5} y={0} m={M.gold} sag={1.25} lift={0.45} />
        </group>
        <group position={[2.5, 4.55, 0.1]}>
          <Roof w={1.45} d={1.45} h={0.5} y={0} m={M.gold} sag={1.25} lift={0.4} />
        </group>
        <PrayerFlags from={[-1.55, 4.2, 2.7]} to={[0.95, 3.4, 2.0]} n={8} />
        <PrayerFlags from={[-1.55, 4.1, 2.7]} to={[-4.2, 3.9, 1.9]} n={6} />
        <PrayerFlags from={[5.2, 1.3, 1.9]} to={[4.3, 3.0, 1.95]} n={5} />
        <Frame s={[11.2, 6.2, 8.2]} p={[0.5, 2.6, 2.0]} />
      </group>
    );
  }

  /* =========================== ENV =========================== */
  /* village houses: irregular flat-roofed stacks with firewood, timber balconies, mixed finishes */
  const HOUSE_TYPES = {
    grey: { wall: '#a09d95', top: '#8b877f', balc: '#cf6f8c', glass: '#252b33', frame: '#dcd6ca' },
    white: { wall: '#e6e0d2', top: '#d4cdbd', balc: '#6b4a2e', glass: '#2b2622', frame: '#5b3a22' },
    mud: { wall: '#a88c68', top: '#977c5b', balc: '#5b3a22', glass: '#241d18', frame: '#4d3220' },
    stone: { wall: '#8d857a', top: '#7d756a', balc: '#5b3a22', glass: '#241d18', frame: '#e1dacb' },
    pink: { wall: '#b9b2a6', top: '#a29b8f', balc: '#d26b8d', glass: '#232830', frame: '#c0412f' },
    timber: { wall: '#8f8678', top: '#7d756a', balc: '#6b4a2e', glass: '#241d18', frame: '#4d3220' },
  };
  const HOUSES = [
    [7.2, -0.4, 2.2, 2.2, 3, 'pink', -0.04],
    [-11.0, 0.8, 2.4, 2.4, 3, 'grey', 0.04], [-15.2, -0.8, 2.6, 2.2, 3, 'mud', 0.12], [-18.0, 2.0, 2.0, 2.0, 2, 'stone', -0.05],
    [-21.0, 0.2, 2.8, 2.4, 3, 'white', 0.1], [-24.4, 2.2, 2.2, 2.0, 2, 'mud', -0.15], [-27.6, -0.4, 2.6, 2.4, 3, 'grey', 0.0], [-31.2, 1.5, 2.4, 2.2, 2, 'white', 0.1],
    [-13.8, -4.8, 2.6, 2.2, 3, 'white', -0.08], [-18.2, -4.2, 2.0, 2.0, 2, 'stone', 0.15], [-22.2, -4.6, 2.4, 2.6, 3, 'mud', 0], [-26.2, -5.2, 2.6, 2.2, 2, 'white', 0.12], [-30.4, -4.2, 2.4, 2.4, 3, 'stone', -0.1],
    [-6.8, -4.6, 2.2, 2.0, 2, 'mud', 0.05], [6.2, -4.8, 2.2, 2.0, 2, 'white', 0.08], [-12.4, -9.6, 2.2, 2.0, 2, 'white', 0.1], [-23, -8.4, 2.4, 2.0, 2, 'mud', -0.1],
    [9.4, -0.3, 2.2, 2.2, 3, 'pink', -0.05], [13.6, -0.2, 2.2, 2.4, 3, 'timber', 0.08], [17.0, 1.2, 2.6, 2.2, 2, 'white', 0.1], [20.4, -0.6, 2.4, 2.4, 3, 'mud', -0.1],
    [23.8, 1.0, 2.2, 2.0, 2, 'grey', 0.05], [27.2, -1.2, 2.6, 2.4, 3, 'white', 0.1], [30.8, 0.5, 2.2, 2.2, 2, 'mud', 0.0],
    [8.6, -4.6, 2.4, 2.2, 2, 'white', 0.1], [12.4, -5.0, 2.2, 2.2, 3, 'mud', -0.1], [16.2, -4.4, 2.6, 2.2, 2, 'stone', 0.05], [20.2, -5.2, 2.2, 2.4, 3, 'white', 0.1], [24.2, -4.6, 2.6, 2.2, 2, 'mud', -0.08], [28.4, -5.0, 2.4, 2.4, 3, 'stone', 0.1],
    [6.6, -8.2, 2.2, 2.0, 2, 'mud', 0.1], [15.4, -8.8, 2.4, 2.0, 2, 'white', -0.1], [25, -8.6, 2.4, 2.0, 2, 'mud', 0.05],
  ];

  function addHouse(B, G, spec, idx) {
    const [x, z, w, d, fl, type0, ry] = spec;
    const type = type0 === 'white' ? (idx % 2 ? 'mud' : 'stone') : type0 === 'pink' ? 'timber' : type0 === 'grey' && idx % 3 ? 'stone' : type0;
    const T = HOUSE_TYPES[type];
    const yb = Math.min(terrainH(x - w / 2, z - d / 2), terrainH(x + w / 2, z - d / 2), terrainH(x - w / 2, z + d / 2), terrainH(x + w / 2, z + d / 2)) - 0.25;
    const sh = 0.78;
    B.setT(x, yb, z, ry);
    const rnd = B.rnd;
    const firewood = (cx, cy, cz, len, along) => {
      if (along === 'x') { B.box(cx, cy, cz, len, 0.2, 0.2, '#6a4b2d', 0, 0.12); B.box(cx, cy + 0.2, cz, len * 0.9, 0.1, 0.18, '#7c5a36', 0, 0.12); }
      else { B.box(cx, cy, cz, 0.2, 0.2, len, '#6a4b2d', 0, 0.12); B.box(cx, cy + 0.2, cz, 0.18, 0.1, len * 0.9, '#7c5a36', 0, 0.12); }
    };
    for (let f = 0; f < fl; f += 1) {
      const top = f === fl - 1 && fl >= 2;
      const fw = top ? w * (0.78 + rnd() * 0.12) : w * (f === 0 ? 1 : 0.94);
      const fd = top ? d * (0.55 + rnd() * 0.1) : d * (f === 0 ? 1 : 0.95);
      const ox = top ? (rnd() - 0.5) * (w - fw) : 0;
      const oz = top ? -(d - fd) / 2 : (f === 0 ? 0 : -0.04);
      const y0 = f * sh;
      B.box(ox, y0, oz, fw, sh, fd, T.wall, 0, 0.05);
      /* flat roof slab and parapet */
      B.box(ox, y0 + sh - 0.02, oz, fw + 0.06, 0.07, fd + 0.06, T.top, 0, 0.05);
      B.box(ox, y0 + sh + 0.05, oz + fd / 2, fw + 0.06, 0.1, 0.08, T.wall, 0, 0.05);
      B.box(ox, y0 + sh + 0.05, oz - fd / 2, fw + 0.06, 0.1, 0.08, T.wall, 0, 0.05);
      B.box(ox + fw / 2, y0 + sh + 0.05, oz, 0.08, 0.1, fd, T.wall, 0, 0.05);
      B.box(ox - fw / 2, y0 + sh + 0.05, oz, 0.08, 0.1, fd, T.wall, 0, 0.05);
      firewood(ox + (rnd() - 0.5) * fw * 0.2, y0 + sh + 0.05, oz - fd / 2 + 0.2, fw * 0.85, 'x');
      firewood(ox + fw / 2 - 0.18, y0 + sh + 0.05, oz, fd * 0.7, 'z');
      if (rnd() < 0.6) firewood(ox - fw / 2 + 0.18, y0 + sh + 0.05, oz, fd * 0.7, 'z');
      /* windows on the +z face */
      if (f > 0 || type === 'grey') {
        const n = Math.max(2, Math.floor(fw / 0.8));
        for (let i = 0; i < n; i += 1) {
          const wx = ox - fw / 2 + (fw * (i + 0.5)) / n;
          const wz = oz + fd / 2;
          const ww = type === 'grey' ? 0.3 : 0.24; const wh = type === 'grey' ? 0.34 : 0.3;
          B.box(wx, y0 + 0.26, wz + 0.01, ww + 0.1, wh + 0.1, 0.05, T.frame, 0, 0.03);
          if (rnd() < 0.5) G.box(wx, y0 + 0.31, wz + 0.035, ww, wh, 0.05, '#ffcf7a', 0, 0);
          else B.box(wx, y0 + 0.31, wz + 0.035, ww, wh, 0.05, T.glass, 0, 0);
        }
      } else {
        B.box(ox + (rnd() - 0.5) * fw * 0.4, y0, oz + fd / 2 + 0.01, 0.4, 0.55, 0.06, '#3a2418', 0);
        if (rnd() < 0.6) B.box(ox + fw * 0.3, y0 + 0.3, oz + fd / 2 + 0.01, 0.2, 0.2, 0.05, T.glass, 0, 0);
      }
      /* wooden / coloured balcony on the first floor */
      if (f === 1 && fl >= 2 && (type !== 'mud' || rnd() < 0.5)) {
        const bw = fw * 0.6; const bx = ox + (rnd() - 0.5) * fw * 0.25; const bz = oz + fd / 2 + 0.2;
        B.box(bx, y0 + 0.02, bz, bw, 0.05, 0.38, T.balc, 0, 0.05);
        B.box(bx, y0 + 0.3, bz + 0.18, bw, 0.04, 0.04, T.balc, 0, 0.05);
        const np = Math.max(2, Math.round(bw / 0.35));
        for (let i = 0; i <= np; i += 1) B.box(bx - bw / 2 + (bw * i) / np, y0 + 0.05, bz + 0.18, 0.04, 0.26, 0.04, T.balc, 0, 0.05);
      }
    }
    /* a prayer flag mast on some roofs */
    if (idx % 4 === 1) {
      B.prism(w * 0.3, fl * sh + 0.1, -d * 0.3, 0.025, 0.02, 0.9, 5, '#5a3e24', 0.05);
      [0, 1, 2, 3, 4].forEach((i) => B.box(w * 0.3 + 0.07, fl * sh + 0.95 - i * 0.12, -d * 0.3, 0.14, 0.1, 0.01, FLAG[i], 0, 0.02));
    }
    B.setT();
  }

  /* Kag Khar: crumbling brown adobe tower ruin, about four storeys */
  function addKagKhar(B, G) {
    const x = -7.7; const z = 0.9; const y = terrainH(x, z) - 0.2;
    B.setT(x, y, z, 0.2);
    const adobe = '#9a7a55'; const adobe2 = '#86684a'; const dust = '#b0916a';
    const hdAt = (yy) => 1.2 - 0.25 * (Math.min(yy, 4.2) / 4.2);
    B.frustum(0, 0, 0, 2.7, 2.4, 2.2, 1.9, 4.2, adobe, 0, 0.06);
    B.frustum(0, 4.2, 0, 2.1, 1.85, 1.9, 1.7, 1.0, adobe2, 0, 0.06);
    [1.05, 2.1, 3.15].forEach((yy) => B.box(0, yy, 0, 2.7 - yy * 0.11, 0.06, 2.45 - yy * 0.1, '#6e5238', 0, 0.05));
    B.box(-0.7, 5.2, -0.4, 0.7, 0.9, 0.9, adobe, 0, 0.08);
    B.box(0.55, 5.2, 0.45, 0.8, 0.5, 0.7, adobe2, 0, 0.08);
    B.box(0.5, 5.2, -0.5, 0.7, 0.2, 0.6, adobe, 0.1, 0.08);
    B.box(-0.55, 5.9, -0.45, 0.4, 0.3, 0.5, adobe2, 0.1, 0.08);
    B.box(0.1, 0.0, 1.6, 2.2, 0.35, 0.6, dust, 0.1, 0.1);
    B.box(-1.2, 0.0, 1.4, 0.9, 0.55, 0.8, dust, -0.3, 0.1);
    B.box(1.4, 0.0, 1.0, 0.8, 0.3, 0.7, dust, 0.4, 0.1);
    [[-0.55, 0.9, 0.26, 0.42], [0.5, 0.9, 0.22, 0.34], [-0.2, 2.0, 0.3, 0.46], [0.65, 2.0, 0.26, 0.4], [-0.6, 3.15, 0.24, 0.38], [0.2, 3.2, 0.3, 0.46], [-0.1, 4.5, 0.34, 0.5], [0.7, 4.5, 0.2, 0.34]].forEach(([wx, wy, ww, wh]) => {
      B.box(wx, wy, hdAt(wy) - 0.03, ww, wh, 0.1, '#150f0a', 0, 0);
    });
    B.box(-0.2, 0.02, 1.15, 0.5, 0.66, 0.1, '#150f0a', 0, 0);
    B.box(1.0, 3.6, 0.7, 0.1, 0.9, 0.45, '#150f0a', 0, 0);
    B.setT();
  }

  /* big village chorten with a four-pole timber canopy (flat roof) and small spire */
  function addCanopyChorten(B, x, z) {
    const y = terrainH(x, z) - 0.05;
    B.setT(x, y, z, 0.1);
    B.box(0, 0, 0, 1.7, 0.22, 1.7, '#bdb4a2', 0, 0.06);
    B.box(0, 0.22, 0, 1.4, 0.2, 1.4, '#cfc7b6', 0, 0.06);
    B.box(0, 0.42, 0, 1.44, 0.06, 1.44, '#8a3a2a', 0, 0.04);
    B.prism(0, 0.48, 0, 0.5, 0.48, 0.62, 14, '#efe9db', 0.04);
    B.prism(0, 1.1, 0, 0.5, 0.36, 0.1, 14, '#e5dece', 0.04);
    [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]].forEach(([px, pz]) => B.box(px, 0.48, pz, 0.07, 1.1, 0.07, '#7a4a2a', 0, 0.06));
    B.box(0, 1.58, 0, 1.6, 0.1, 1.6, '#4d3320', 0, 0.05);
    B.box(0, 1.68, 0, 1.4, 0.06, 1.4, '#6b5a48', 0, 0.05);
    B.box(0, 1.74, 0, 0.5, 0.2, 0.5, '#d9d1bf', 0, 0.04);
    [0.22, 0.17, 0.12].forEach((r, i) => B.prism(0, 1.94 + i * 0.1, 0, r, r * 0.85, 0.1, 8, i === 0 ? '#9a6a3a' : '#cfc7b6', 0.03));
    B.prism(0, 2.24, 0, 0.04, 0.0, 0.2, 5, '#6b5a48', 0.02);
    B.setT();
  }

  /* village gate: dry-laid cobble wall, dark tunnel, and the kheni guardians painted in red and white */
  function addGate(B, x, z) {
    const y = terrainH(x, z) - 0.05;
    B.setT(x, y, z, 0.0);
    const greys = ['#8c867b', '#a39d92', '#777066', '#b0aa9e', '#968f82'];
    const rows = 6; const cols = 13; const W = 3.8; const Hh = 1.5;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cx0 = -W / 2 + ((c + (r % 2) * 0.5) * W) / cols + W / cols / 2;
        if (cx0 > W / 2 - 0.05 && r % 2) continue;
        if (Math.abs(cx0) < 0.5 && r < 4) continue; /* tunnel opening */
        const rh = Hh / rows;
        B.box(cx0, r * rh, 0, W / cols + 0.03, rh + 0.03, 0.55, greys[(r * 3 + c * 7) % 5], (((r + c) % 3) - 1) * 0.04, 0.12);
      }
    }
    B.box(0, 0.0, -0.1, 1.0, 1.0, 0.5, '#120d09', 0, 0); /* dark tunnel behind */
    B.box(0, 1.0, 0, 1.3, 0.1, 0.62, '#5a3a22', 0, 0.06); /* timber lintel */
    B.box(0, 1.5, 0, W + 0.1, 0.12, 0.62, '#7d756a', 0, 0.05);
    B.box(0, 1.62, 0.15, W - 0.4, 0.2, 0.2, '#6a4b2d', 0, 0.1); /* firewood */
    /* kheni reliefs */
    [-1.3, 1.3].forEach((kx, i) => {
      B.box(kx, 0.28, 0.285, 0.46, 0.72, 0.03, '#c4552e', 0, 0.06);
      B.box(kx, 0.98, 0.285, 0.3, 0.3, 0.03, '#c4552e', 0, 0.06);
      B.box(kx + (i ? -0.18 : 0.18), 0.5, 0.3, 0.1, 0.46, 0.03, '#f1ece0', 0.25 * (i ? 1 : -1), 0.03);
      B.box(kx - 0.07, 1.04, 0.305, 0.07, 0.07, 0.02, '#f1ece0', 0, 0);
      B.box(kx + 0.07, 1.04, 0.305, 0.07, 0.07, 0.02, '#f1ece0', 0, 0);
      B.box(kx, 0.86, 0.3, 0.3, 0.08, 0.03, '#f1ece0', 0, 0.03);
    });
    B.box(-1.95, 0, 0.1, 0.12, 1.55, 0.14, '#4d3320', 0, 0.06);
    B.setT();
  }

  function addTree(B, x, y, z, s, kind) {
    const pal = kind === 'green' ? ['#6f8a3b', '#5f7a35', '#80973f'] : ['#d2b040', '#a9a53a', '#8aa03a'];
    const pick = () => pal[Math.floor(B.rnd() * 3)];
    const ry = B.rnd() * 3;
    B.prism(x, y, z, 0.05 * s, 0.04 * s, 0.5 * s, 5, '#5a4630', 0.05);
    B.prism(x, y + 0.3 * s, z, 0.2 * s, 0.32 * s, 0.4 * s, 7, pick(), 0.12, ry);
    B.prism(x + 0.04 * s, y + 0.68 * s, z, 0.32 * s, 0.4 * s, 0.4 * s, 7, pick(), 0.12, ry + 0.5);
    B.prism(x - 0.03 * s, y + 1.06 * s, z + 0.03 * s, 0.4 * s, 0.12 * s, 0.42 * s, 7, pick(), 0.12, ry + 1);
  }

  function KagEnv() {
    /* terrain: one vertex-coloured height field (plateau, cliff edge, braided river bed, mountain wall) */
    const terrain = useMemo(() => {
      const X0 = -70; const X1 = 70; const Z0 = -62; const Z1 = 62; const nx = 200; const nz = 178;
      const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
      const colr = new Float32Array((nx + 1) * (nz + 1) * 3);
      const hs = new Float32Array((nx + 1) * (nz + 1));
      for (let j = 0; j <= nz; j += 1) {
        for (let i = 0; i <= nx; i += 1) {
          const x = X0 + ((X1 - X0) * i) / nx; const z = Z0 + ((Z1 - Z0) * j) / nz; const k = j * (nx + 1) + i;
          const h = terrainH(x, z); hs[k] = h; pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
        }
      }
      const c = new THREE.Color(); const c2 = new THREE.Color();
      for (let j = 0; j <= nz; j += 1) {
        for (let i = 0; i <= nx; i += 1) {
          const k = j * (nx + 1) + i; const x = pos[k * 3]; const z = pos[k * 3 + 2]; const h = hs[k];
          const hl = hs[j * (nx + 1) + Math.max(0, i - 1)]; const hr = hs[j * (nx + 1) + Math.min(nx, i + 1)];
          const hd = hs[Math.max(0, j - 1) * (nx + 1) + i]; const hu = hs[Math.min(nz, j + 1) * (nx + 1) + i];
          const gx = (hr - hl) / ((X1 - X0) / nx * 2); const gz = (hu - hd) / ((Z1 - Z0) / nz * 2);
          const slope = Math.min(1, Math.hypot(gx, gz) / 1.4);
          const n1 = fbm(x * 0.6, z * 0.6); const n2 = fbm(x * 0.12 + 7, z * 0.12);
          const band = Math.sin((h * 0.55 + x * 0.32) * 1.5 + n2 * 0.9);
          if (z > 3.3 && h < -1.9 && slope < 0.6) {
            /* river bed: cool grey gravel and pale bars */
            c.set('#8a8b82'); c2.set(h < -3.1 ? '#5d7a7a' : '#a9a595'); c.lerp(c2, h < -3.1 ? 0.8 : n1 * 0.8); c2.set('#6e6a60'); c.lerp(c2, smooth(0.45, 0.8, fbm(x * 1.7, z * 1.7)) * 0.6);
          } else if (h < 0.5 && z < 3.4 && slope < 0.3) {
            c.set('#a58d6c'); c2.set('#8a7459'); c.lerp(c2, n1);
          } else {
            /* eroded layered sediment: crisp alternating strata, gullies, scree */
            const b2 = smooth(-0.5, 0.6, band); const b3 = smooth(0.5, 0.75, Math.sin(h * 2.3 + x * 0.2 + n2 * 3));
            c.set('#5a4636'); c2.set('#a98c68'); c.lerp(c2, b2);
            if (z < -8) { c2.set('#d2c3a4'); c.lerp(c2, smooth(14.5, 15.5, h) * (1 - smooth(19, 20.5, h)) * 0.85); }
            c2.set('#a08a6c'); c.lerp(c2, b3 * 0.25);
            c2.set('#46382e'); c.lerp(c2, Math.max(0, n1 - 0.55) * 1.0);
            c2.set('#7d7266'); c.lerp(c2, smooth(0, 0.35, 0.35 - slope) * 0.6);
            if (h > 24) { c2.set('#6f7078'); c.lerp(c2, smooth(24, 40, h) * 0.55); }
          }
          const f = (h > 0.5 ? 0.4 : z < 3.3 ? 0.6 : 0.62) * (0.92 + 0.16 * n1);
          colr[k * 3] = c.r * f; colr[k * 3 + 1] = c.g * f; colr[k * 3 + 2] = c.b * f;
        }
      }
      const idx = [];
      for (let j = 0; j < nz; j += 1) {
        for (let i = 0; i < nx; i += 1) {
          const a = j * (nx + 1) + i; const b = a + 1; const cc = a + nx + 1; const d = cc + 1;
          idx.push(a, cc, b, b, cc, d);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);

    /* sky dome (deep blue, dry air) */
    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(135, 24, 16);
      const p = g.attributes.position; const cs = [];
      const top = new THREE.Color('#2f6fb8'); const mid = new THREE.Color('#8fb6dc'); const hor = new THREE.Color('#e4dccb');
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const t = Math.max(0, p.getY(i) / 135);
        c.copy(hor).lerp(mid, smooth(0, 0.18, t)).lerp(top, smooth(0.15, 0.8, t));
        cs.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
      return g;
    }, []);

    const village = useMemo(() => {
      const B = makeBuilder(31); const G = makeBuilder(37);
      HOUSES.forEach((h, i) => addHouse(B, G, h, i));
      addKagKhar(B, G);
      addCanopyChorten(B, 8.2, 2.0);
      addGate(B, -12.9, 1.9);
      /* poplars and willows in autumn yellow among the houses */
      [[-11.1, 3.0], [-19.6, 3.0], [-5.8, -7], [14.6, 3.1], [31.5, 3.0], [3.6, -5], [10.3, -6.6]].forEach(([x, z], i) => addTree(B, x, terrainH(x, z) - 0.05, z, 0.6 + (i % 3) * 0.1, i % 4 === 3 ? 'green' : 'yellow'));
      /* the green tree line on the near and far river banks */
      for (let i = 0; i < 26; i += 1) {
        const x = -50 + i * 3.8 + (hash2(i, 3) - 0.5) * 2.4; const z = 21.5 + hash2(i, 9) * 3;
        addTree(B, x, terrainH(x, z) - 0.05, z, 0.7 + hash2(i, 5) * 0.7, hash2(i, 1) > 0.35 ? 'green' : 'yellow');
      }
      for (let i = 0; i < 7; i += 1) { const x = -26 + i * 8.5 + hash2(i, 2) * 3; const z = 6.4 + hash2(i, 8) * 1.6; addTree(B, x, terrainH(x, z) - 0.05, z, 0.7, i % 2 ? 'green' : 'yellow'); }
      /* far-bank buildings (small white and red houses) */
      [[-14, 29, 1.8, 1.6, 'white'], [-10.5, 30.4, 1.4, 1.4, 'red'], [-6, 28.4, 2.0, 1.8, 'white'], [-2.4, 29.8, 1.5, 1.4, 'red'], [4, 29, 1.8, 1.6, 'white'], [16, 30, 1.6, 1.4, 'white']].forEach(([x, z, w, d, k], i) => {
        const y = terrainH(x, z) - 0.1;
        B.box(x, y, z, w, 0.9, d, k === 'red' ? '#b24a3a' : '#e6e0d2', 0.1 * (i % 3 - 1), 0.05);
        B.box(x, y + 0.9, z, w + 0.08, 0.07, d + 0.08, '#6e5b47', 0.1 * (i % 3 - 1), 0.05);
        B.box(x, y + 0.45, z + d / 2 + 0.01, 0.5, 0.2, 0.04, '#2b2622', 0.1 * (i % 3 - 1), 0);
      });
      /* footbridge across the braided river: plank deck, cable rails, stone piers */
      const bx = -4.5;
      B.box(bx, -2.1, 11.6, 0.6, 0.07, 14.4, '#7a6040', 0, 0.08);
      [-0.3, 0.3].forEach((dx) => {
        B.box(bx + dx, -1.72, 11.6, 0.04, 0.04, 14.4, '#5a4028', 0, 0.05);
        B.box(bx + dx, -1.9, 11.6, 0.03, 0.03, 14.4, '#5a4028', 0, 0.05);
        for (let i = 0; i <= 7; i += 1) B.box(bx + dx, -2.05, 4.6 + i * 2.05, 0.05, 0.36, 0.05, '#5a4028', 0, 0.05);
      });
      [4.5, 18.7].forEach((pz) => B.box(bx, -3.0, pz, 1.1, 1.1, 1.3, '#8c867b', 0, 0.1));
      [8, 12.8, 17].forEach((pz) => B.box(bx, -3.15, pz, 0.7, 1.1, 0.5, '#7c766b', 0, 0.1));
      for (let i = 0; i < 6; i += 1) B.box(bx, -1.3 + (i % 2) * 0.15, 5 + i * 2.5, 0.014, 0.34, 0.2, FLAG[i % 5], 0, 0.02);
      /* foam bars and white water on the braids */
      for (let i = 0; i < 40; i += 1) {
        const zz = [6.6, 8.2, 11.8, 13.2, 16.4, 17.4][i % 6] + (hash2(i, 12) - 0.5) * 0.6; const xx = -30 + hash2(i, 13) * 60;
        B.box(xx, -2.94, zz, 0.8 + hash2(i, 14) * 2, 0.02, 0.07 + hash2(i, 15) * 0.07, '#eef4f4', 0, 0.04);
      }
      /* boulders on the gravel bars */
      for (let i = 0; i < 26; i += 1) {
        const x = -45 + hash2(i, 2) * 90; const z = 3.4 + hash2(i, 4) * 22; const r = 0.15 + hash2(i, 6) * 0.45;
        B.prism(x, terrainH(x, z) - 0.05, z, r, r * 0.7, r * 1.1, 6, ['#8c8576', '#6f6a60', '#a09a8e'][i % 3], 0.14, i);
      }
      /* pilgrims on the gravel (red, saffron, blue clothes) */
      [[-5.5, 5.3, '#b83a2a'], [-4.9, 5.8, '#e0912a'], [-3.8, 5.1, '#2f6db5'], [-2.6, 5.9, '#b83a2a'], [-1.4, 5.4, '#d9d2c0'], [0.2, 5.9, '#e0912a'], [1.3, 5.5, '#b83a2a'], [2.4, 5.9, '#2f6db5']].forEach(([x, z, c]) => {
        const y = terrainH(x, z);
        B.box(x, y, z, 0.12, 0.26, 0.09, c, 0, 0.05);
        B.box(x, y + 0.26, z, 0.08, 0.08, 0.08, '#c9a27e', 0, 0.02);
      });
      /* terraced barley and buckwheat fields on the lower terrace, with dry-stone retaining walls */
      const fcols = ['#9aa24f', '#b8a05a', '#86974a', '#c3a763', '#a9a653'];
      for (let r = 0; r < 5; r += 1) {
        const z0 = 4.6 + r * 1.2;
        for (let q = 0; q < 3; q += 1) {
          const x0 = 18.5 + q * 5.4 + (r % 2) * 0.9;
          B.box(x0 + 2.4, -1.43, z0 + 0.5, 4.9, 0.1, 1.0, fcols[(r * 2 + q) % 5], 0, 0.1);
          for (let s = 0; s < 12; s += 1) B.box(x0 + 0.3 + s * 0.4, -1.33, z0 + 0.5, 0.05, 0.02, 0.95, '#6f6a3a', 0, 0.2);
        }
        B.box(26.5, -1.5, z0 - 0.05, 18.5, 0.22, 0.14, '#8c867b', 0, 0.12);
      }
      return { geo: B.geo(), glow: G.geo() };
    }, []);

    return (
      <group>
        {/* sky, rim disc, terrain */}
        <mesh geometry={sky}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.13, 0]} receiveShadow>
          <circleGeometry args={[150, 48]} /><meshStandardMaterial color="#a39a8a" roughness={1} />
        </mesh>
        <mesh geometry={terrain} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
        {/* braided grey glacial river */}
        {[[7.9, 3.1, 0.012, 100], [12.8, 3.0, -0.01, 100], [17.1, 2.0, 0.01, 100]].map(([z, d, r, w], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, r]} position={[0, -2.98, z]} receiveShadow>
            <planeGeometry args={[w, d]} /><meshStandardMaterial color="#6f908c" metalness={0.15} roughness={0.3} transparent opacity={0.95} />
          </mesh>
        ))}
        <Merged geo={village.geo} />
        <Merged geo={village.glow} emissive shadow={false} />
        <FarPeaks />
        <PrayerFlags from={[-6.0, 3.0, 1.0]} to={[-4.0, 3.9, 1.9]} n={4} />
        <PrayerFlags from={[8.3, 3.3, 0.9]} to={[8.2, 2.0, 2.0]} n={5} />
        <PrayerFlags from={[-12.9, 2.2, 1.9]} to={[-17.9, 2.8, 2.5]} n={9} />
      </group>
    );
  }

  /* the snow peak (Nilgiri direction) far up the valley */
  function FarPeaks() {
    const g = useMemo(() => {
      const B = makeBuilder(53);
      const rock = '#5f6168'; const snow = '#eef2f7';
      const peak = (x, z, r, h, sx) => {
        B.prism(x, -3, z, r, r * 0.6, h * 0.32, 7, rock, 0.1, 0.3);
        B.prism(x, -3 + h * 0.32, z, r * 0.6, r * 0.36, h * 0.2, 7, '#aab0ba', 0.1, 0.3);
        B.prism(x, -3 + h * 0.52, z, r * 0.36, r * 0.2, h * 0.24, 7, snow, 0.05, 0.3);
        B.prism(x + sx, -3 + h * 0.76, z, r * 0.2, 0.0, h * 0.24, 6, snow, 0.04, 0.3);
      };
      peak(-78, 54, 15, 42, 1); peak(-112, -18, 16, 40, 0); peak(-100, -44, 13, 30, 1); peak(-122, 8, 12, 26, 1);
      return B.geo();
    }, []);
    return <mesh geometry={g}><meshStandardMaterial vertexColors roughness={0.9} fog /></mesh>;
  }

  return { 'kagbeni-kag-chode-monastery': { Main: KagMain, Env: KagEnv } };
}
