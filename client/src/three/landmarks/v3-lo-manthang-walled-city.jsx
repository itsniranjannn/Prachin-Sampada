// Lo Manthang Walled City (Upper Mustang): a whole walled Tibetan-style mud town at 3,840 m.
// Scale: 1 unit = ~5 m. Plan ~235 x 150 m (approximate), earthen wall ~8 m with 14 towers, one gate (placed on the +z side, approximate),
// tall white many-cornered palace in the middle, blood-red monasteries (Thubchen, Jampa, Choede), firewood on every roof,
// ochre chortens, prayer flags; barren brown desert mountains, green barley fields, gravel river bed, distant snow peaks.
export default function make(K) {
  const { Frame, THREE, useMemo } = K;

  const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi); const b = hash2(xi + 1, yi); const c = hash2(xi, yi + 1); const d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1 + 5.2, y * 2.1 + 1.3) * 0.3 + vn(x * 4.3 + 9.1, y * 4.3 + 3.7) * 0.15;
  const prng = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;

  const FLAG = ['#2f6db5', '#f4f1e8', '#c0392b', '#2e8b57', '#e2b33c'];
  const WALL = '#cdbf9d';
  const RED = '#b5462c';
  const CREAM = '#d9c9a0';
  const DARK = '#241812';
  const BROWN = '#5e3d22';
  const FIRE = ['#4a3a2a', '#56452f', '#3f3124', '#625038'];

  /* ---------- merged-geometry builder (vertex colours; one mesh for thousands of boxes) ---------- */
  function Builder() {
    const P = []; const N = []; const C = []; const U = [];
    const col = new THREE.Color();
    const pushTri = (a, b, c, color, hint, j) => {
      let ux = b[0] - a[0]; let uy = b[1] - a[1]; let uz = b[2] - a[2];
      let vx = c[0] - a[0]; let vy = c[1] - a[1]; let vz = c[2] - a[2];
      let nx = uy * vz - uz * vy; let ny = uz * vx - ux * vz; let nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      let q = b; let r = c;
      if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { q = c; r = b; nx = -nx; ny = -ny; nz = -nz; }
      col.set(color);
      const f = 1 + (j || 0) * (hash2(a[0] * 7.3 + a[2] * 1.7, a[1] * 3.1 + b[0]) - 0.5);
      [a, q, r].forEach((p) => {
        P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(col.r * f, col.g * f, col.b * f);
        if (Math.abs(ny) > 0.6) U.push(p[0] * 0.5, p[2] * 0.5); else if (Math.abs(nx) > Math.abs(nz)) U.push(p[2] * 0.5, p[1] * 0.5); else U.push(p[0] * 0.5, p[1] * 0.5);
      });
    };
    const FACES = [
      [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
      [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
      [[1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]]],
      [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
      [[0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]]],
    ];
    const api = {
      /** box with base at y0, centred at x,z, rotated about Y by rot */
      box(x, y0, z, w, h, d, color, rot = 0, j = 0.06) {
        const cs = Math.cos(rot); const sn = Math.sin(rot);
        const rt = (lx, ly, lz) => [x + lx * cs + lz * sn, y0 + ly, z - lx * sn + lz * cs];
        FACES.forEach(([n, vs]) => {
          const w4 = vs.map(([sx, sy, sz]) => rt(sx * w / 2, h / 2 + sy * h / 2, sz * d / 2));
          const hn = [n[0] * cs + n[2] * sn, n[1], -n[0] * sn + n[2] * cs];
          pushTri(w4[0], w4[1], w4[2], color, hn, j); pushTri(w4[0], w4[2], w4[3], color, hn, j);
        });
      },
      /** frustum (cone when rt = 0) */
      cone(x, y0, z, rb, rt, h, seg, color, j = 0.08) {
        for (let i = 0; i < seg; i += 1) {
          const a0 = (i / seg) * Math.PI * 2; const a1 = ((i + 1) / seg) * Math.PI * 2; const am = (a0 + a1) / 2;
          const b0 = [x + Math.cos(a0) * rb, y0, z + Math.sin(a0) * rb]; const b1 = [x + Math.cos(a1) * rb, y0, z + Math.sin(a1) * rb];
          const t0 = [x + Math.cos(a0) * rt, y0 + h, z + Math.sin(a0) * rt]; const t1 = [x + Math.cos(a1) * rt, y0 + h, z + Math.sin(a1) * rt];
          const hint = [Math.cos(am), (rb - rt) / h * 0.5, Math.sin(am)];
          pushTri(b0, b1, t1, color, hint, j);
          if (rt > 0.002) pushTri(b0, t1, t0, color, hint, j);
          if (rt > 0.002) pushTri([x, y0 + h, z], t1, t0, color, [0, 1, 0], j);
        }
      },
      /** flat polygon (fan) at height y, facing up */
      poly(pts, y, color, j = 0.05) {
        for (let i = 1; i < pts.length - 1; i += 1) pushTri([pts[0][0], y, pts[0][1]], [pts[i][0], y, pts[i][1]], [pts[i + 1][0], y, pts[i + 1][1]], color, [0, 1, 0], j);
      },
      tri(a, b, c, color, j = 0.05) { pushTri(a, b, c, color, [0, 1, 0], j); },
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
        return g;
      },
    };
    return api;
  }

  /* mud-plaster noise texture shared by every vertex-coloured material */
  let _tex = null; let _mat = null; let _matLit = null; let _matSky = null; let _matMtn = null;
  function mudTexture() {
    if (_tex) return _tex;
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 128, 128);
    const r = prng(7);
    for (let i = 0; i < 900; i += 1) { const v = 205 + Math.floor(r() * 50); g.fillStyle = `rgba(${v},${v - 3},${v - 10},0.55)`; g.fillRect(r() * 128, r() * 128, 1 + r() * 6, 1 + r() * 4); }
    for (let i = 0; i < 70; i += 1) { g.fillStyle = 'rgba(120,105,85,0.12)'; g.fillRect(r() * 128, r() * 128, 4 + r() * 18, 2 + r() * 8); }
    _tex = new THREE.CanvasTexture(c); _tex.wrapS = THREE.RepeatWrapping; _tex.wrapT = THREE.RepeatWrapping; _tex.colorSpace = THREE.SRGBColorSpace; _tex.anisotropy = 4;
    return _tex;
  }
  const townMat = () => { if (!_mat) _mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: mudTexture(), roughness: 1, metalness: 0 }); return _mat; };
  const litMat = () => { if (!_matLit) _matLit = new THREE.MeshBasicMaterial({ color: '#b98438', toneMapped: false }); return _matLit; };

  /* ---------- plan ---------- */
  const A = [-25, 16.2]; const B = [22, 13.4]; const Cc = [24.4, -15.8]; const D = [-22.5, -13.2];
  const lerp2 = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t)];
  const TG = 0.58; // gate position along the front wall
  const GATE = lerp2(A, B, TG);
  const PAL = { x: -2, z: -2.2, w: 5.4, d: 4.6 };
  const THU = { x: -9.8, z: 2.6, w: 9.2, d: 6.0 };
  const JAM = { x: 4.6, z: 4.2, w: 6.0, d: 5.0 };
  const CHO = { x: 13, z: -19.2, w: 5.4, d: 4.2 };
  const RES = [
    [PAL.x - PAL.w / 2 - 0.7, PAL.x + PAL.w / 2 + 2.4, PAL.z - PAL.d / 2 - 0.7, PAL.z + PAL.d / 2 + 1.2],
    [JAM.x - JAM.w / 2 - 0.5, JAM.x + JAM.w / 2 + 0.5, JAM.z - JAM.d / 2 - 0.5, JAM.z + JAM.d / 2 + 0.5],
    [THU.x - THU.w / 2 - 0.5, THU.x + THU.w / 2 + 0.5, THU.z - THU.d / 2 - 0.5, THU.z + THU.d / 2 + 0.5],
    [-5.5, 9.5, 6.9, 10.8], // open square in front of the monasteries
    [-17, -15.4, 1.4, 8.6], [8.6, 10.4, 1.4, 5.4], // chorten sites beside Thubchen / Jampa
    [-17, -13.5, -8.5, -5.5], [14, 17.5, 4, 7], [-5, -2, -11, -8.5], [-19.5, -16.5, 8, 11], // open courtyards
    [GATE[0] - 0.8, GATE[0] + 0.8, 7.5, 17], // lane from the gate
  ];
  const hits = (x0, x1, z0, z1) => RES.some(([a, b, c, d]) => x1 > a && x0 < b && z1 > c && z0 < d);

  const RIVX = (z) => -53 + 3.5 * Math.sin(z * 0.07);
  const RW = 12.5; // half-width of the river trench

  /* ---------- parts ---------- */
  const onFace = (cx, cz, w, d, phi, u, k) => [cx + u * Math.cos(phi) + k * Math.sin(phi), cz - u * Math.sin(phi) + k * Math.cos(phi)];
  const FACE_PHI = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  const faceK = (w, d, phi) => (Math.abs(Math.sin(phi)) > 0.5 ? w / 2 : d / 2);

  function windowAt(b, bl, cx, cz, w, d, phi, u, y, sw, sh, lit, frameCol = BROWN) {
    const k = faceK(w, d, phi);
    const [x, z] = onFace(cx, cz, w, d, phi, u, k);
    b.box(x, y - 0.03, z, sw + 0.08, sh + 0.08, 0.05, frameCol, phi, 0.02);
    if (lit && bl) { const [x2, z2] = onFace(cx, cz, w, d, phi, u, k + 0.025); bl.box(x2, y, z2, sw * 0.8, sh * 0.8, 0.02, '#fff', phi, 0); }
    b.box(x, y, z, sw, sh, 0.07, DARK, phi, 0.02);
  }
  function chorten(b, x, y0, z, s = 1, tone = 0) {
    const belly = tone ? '#e9dfc8' : '#caa464';
    b.box(x, y0, z, 0.62 * s, 0.1 * s, 0.62 * s, '#d9ceb4');
    b.box(x, y0 + 0.1 * s, z, 0.48 * s, 0.12 * s, 0.48 * s, '#e6dcc4');
    b.cone(x, y0 + 0.22 * s, z, 0.25 * s, 0.31 * s, 0.16 * s, 8, belly);
    b.cone(x, y0 + 0.38 * s, z, 0.31 * s, 0.2 * s, 0.2 * s, 8, belly);
    b.cone(x, y0 + 0.58 * s, z, 0.2 * s, 0.13 * s, 0.1 * s, 8, '#e9dfc8');
    b.box(x, y0 + 0.68 * s, z, 0.2 * s, 0.14 * s, 0.2 * s, '#efe6d0');
    b.cone(x, y0 + 0.82 * s, z, 0.11 * s, 0.02 * s, 0.5 * s, 8, '#b98a3a');
    b.cone(x, y0 + 1.32 * s, z, 0.045 * s, 0.0, 0.12 * s, 6, '#c9a13f', 0);
  }
  function flagLine(b, p, q, n, sag = 0.25) {
    const rot = -Math.atan2(q[2] - p[2], q[0] - p[0]);
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const x = mix(p[0], q[0], t); const z = mix(p[2], q[2], t);
      const y = mix(p[1], q[1], t) - Math.sin(t * Math.PI) * sag;
      b.box(x, y - 0.2, z, 0.15, 0.2, 0.012, FLAG[i % 5], rot, 0);
    }
  }
  function flagPole(b, x, y0, z, h) {
    b.box(x, y0, z, 0.04, h, 0.04, '#4a3524', 0, 0);
    b.box(x, y0 + h - 0.02, z, 0.09, 0.05, 0.09, '#b98a3a', 0, 0);
    for (let i = 0; i < 5; i += 1) b.box(x + 0.09, y0 + h - 0.1 - i * 0.09, z, 0.14, 0.07, 0.01, FLAG[i], 0, 0);
  }
  function firewood(b, rnd, x, y0, z, len, rot, th = 0.2, hs = 1) {
    const n = Math.max(1, Math.round(len / 0.45));
    const seg = len / n;
    for (let i = 0; i < n; i += 1) {
      const u = -len / 2 + seg * (i + 0.5);
      const hgt = (0.08 + rnd() * 0.17) * hs;
      b.box(x + u * Math.cos(rot), y0, z - u * Math.sin(rot), seg * 1.02, hgt, th * (0.8 + rnd() * 0.4), FIRE[Math.floor(rnd() * 4)], rot, 0.25);
    }
  }
  /** roof surface with parapet and firewood stacks. sides: bitmask of edges that carry firewood (0:+z 1:+x 2:-z 3:-x) */
  function roofTop(b, rnd, cx, cz, w, d, h, parapetCol, sides, par = 0.1) {
    b.box(cx, h, cz, w - 0.06, 0.03, d - 0.06, '#a09074');
    b.box(cx, h, cz + d / 2 - 0.035, w, par, 0.07, parapetCol, 0, 0.04);
    b.box(cx, h, cz - d / 2 + 0.035, w, par, 0.07, parapetCol, 0, 0.04);
    b.box(cx + w / 2 - 0.035, h, cz, 0.07, par, d - 0.14, parapetCol, 0, 0.04);
    b.box(cx - w / 2 + 0.035, h, cz, 0.07, par, d - 0.14, parapetCol, 0, 0.04);
    if (sides & 1) firewood(b, rnd, cx, h + 0.03, cz + d / 2 - 0.22, w - 0.3, 0);
    if (sides & 2) firewood(b, rnd, cx + w / 2 - 0.22, h + 0.03, cz, d - 0.3, Math.PI / 2);
    if (sides & 4) firewood(b, rnd, cx, h + 0.03, cz - d / 2 + 0.22, w - 0.3, 0);
    if (sides & 8) firewood(b, rnd, cx - w / 2 + 0.22, h + 0.03, cz, d - 0.3, Math.PI / 2);
  }

  const WHITES = ['#e8e2d4', '#e4ddcb', '#ece6d8']; const GREYS = ['#b3a283', '#bba98a', '#c0af90'];
  const HOUSE_COLS = ['#e7e1d0', '#e2dac6', '#d6c9a8', '#bfa982', '#a8946f', '#c8b690', '#b49f78', '#e4dccb', '#cdbb94', '#9f8c6a'];
  function house(b, bl, rnd, roofs, cx, cz, w, d, h, opt = {}) {
    const r0 = rnd(); const c = opt.color || (r0 < 0.7 ? WHITES[Math.floor(rnd() * 3)] : GREYS[Math.floor(rnd() * 3)]);
    b.box(cx, 0, cz, w + 0.05, 0.3, d + 0.05, '#8c806b', 0, 0.2); // rubble stone footing
    b.box(cx, 0.3, cz, w, h - 0.3, d, c, 0, 0.1);
    roofTop(b, rnd, cx, cz, w, d, h, '#efe9d9', (rnd() < 0.8 ? 1 : 0) | (rnd() < 0.7 ? 2 : 0) | (rnd() < 0.35 ? 4 : 0) | (rnd() < 0.3 ? 8 : 0));
    if (rnd() < 0.3) { const hw = 0.5; b.box(cx + (rnd() - 0.5) * (w - 0.9), h + 0.03, cz - 0.2, hw, 0.38, hw, c, 0, 0.1); }
    if (rnd() < 0.22) flagPole(b, cx + (rnd() - 0.5) * (w - 0.5), h + 0.03, cz + (rnd() - 0.5) * (d - 0.5), 0.8 + rnd() * 0.5);
    if (rnd() < 0.07 && roofs) roofs.push([cx, h + 0.03, cz]);
    const storeys = Math.max(1, Math.round((h - 0.3) / 0.4));
    FACE_PHI.forEach((phi, fi) => {
      const prob = fi === 0 ? 1 : fi === 1 ? 0.85 : 0.35;
      if (rnd() > prob) return;
      const span = (Math.abs(Math.sin(phi)) > 0.5 ? d : w) - 0.5;
      if (span < 0.6) return;
      for (let s = 1; s < storeys; s += 1) {
        const n = rnd() < 0.55 ? 1 : 2;
        for (let i = 0; i < n; i += 1) {
          const u = (n === 1 ? (rnd() - 0.5) * span * 0.7 : (i - 0.5) * span * 0.6);
          windowAt(b, bl, cx, cz, w, d, phi, u, 0.3 + s * 0.4, 0.15 + rnd() * 0.05, 0.2 + rnd() * 0.05, bl && rnd() < 0.32, rnd() < 0.3 ? '#8a6a3a' : BROWN);
        }
      }
      if (fi < 2 && rnd() < 0.8) { // ground-floor door
        const k = faceK(w, d, phi); const u = (rnd() - 0.5) * span * 0.6; const [x, z] = onFace(cx, cz, w, d, phi, u, k);
        b.box(x, 0.3, z, 0.34, 0.5, 0.05, BROWN, phi, 0.02); b.box(x, 0.3, z, 0.26, 0.44, 0.07, '#2b1d13', phi, 0.02);
      }
    });
  }

  /* palace: white, boxy, many corners, 4-5 storeys (~20 m), wooden oriels, small dark windows, flag poles */
  function palace(b, bl, rnd) {
    const { x: px, z: pz } = PAL;
    const W = '#e8e2d0';
    const vols = [ // x, z, w, d, h
      [px, pz, PAL.w, PAL.d, 5.0],
      [px - 0.5, pz - 0.35, 3.7, 3.1, 7.2],
      [px + 2.95, pz + 1.0, 1.6, 2.2, 2.4],
      [px - 3.2, pz - 0.6, 1.9, 2.6, 2.8],
      [px + 3.0, pz - 1.7, 1.7, 1.8, 4.2],
      [px - 1.9, pz + 2.65, 1.5, 1.2, 1.6],
      [px + 0.6, pz - 2.9, 2.2, 1.5, 3.1],
      [px - 3.9, pz + 1.3, 1.2, 1.4, 2.2],
      [px - 2.4, pz - 2.9, 1.7, 1.6, 3.8],
    ];
    vols.forEach(([x, z, w, d, h], i) => {
      b.box(x, 0, z, w + 0.06, 0.35, d + 0.06, '#8c806b', 0, 0.2);
      b.box(x, 0.35, z, w, h - 0.35, d, i === 3 ? '#e2dac7' : W, 0, 0.05);
      roofTop(b, rnd, x, z, w, d, h, '#f3eee0', i === 1 ? 3 : 7, 0.12);
      if (i === 1 || i === 3) b.box(x, h - 0.02, z, w + 0.1, 0.1, d + 0.1, '#d9d2bd', 0, 0.04);
    });
    // small dark windows with timber frames, storeys 2..n on each face of each volume
    vols.forEach(([x, z, w, d, h], vi) => {
      const storeys = Math.floor(h / 0.78);
      FACE_PHI.forEach((phi, fi) => {
        if (vi === 1 && fi === 0) { /* upper tower front face is partly hidden by the main block below its top */ }
        const span = (Math.abs(Math.sin(phi)) > 0.5 ? d : w) - 0.5;
        const nPer = Math.max(1, Math.round(span / 0.95));
        for (let s = 1; s < storeys; s += 1) {
          const yy = 0.35 + s * 0.78 - 0.1;
          if (vi === 1 && yy + 0.3 < 5.0 && fi !== 1) continue; // hidden behind the lower body
          if ((vi === 3 || vi === 5) && fi === 0 && yy < 4.2) continue;
          if (vi === 8 && fi === 1) continue;
          for (let i = 0; i < nPer; i += 1) {
            const u = (i - (nPer - 1) / 2) * (span / nPer) * 1.0 + (hash2(vi * 3 + i, s + fi) - 0.5) * 0.15;
            if ((vi === 0 && fi === 0 && s >= 2 && u > 0.7 && u < 2.1) || (vi === 0 && fi === 1 && s >= 3 && Math.abs(u) < 0.7)) continue; // oriel positions
            windowAt(b, bl, x, z, w, d, phi, u, yy, 0.17 + (s % 2) * 0.03, 0.26, bl && hash2(vi + i, s * 7 + fi) < 0.3);
          }
        }
        if (fi < 2 && (vi < 3 || vi === 4)) { // ground floor: dark shop doors and shutters
          const nD = Math.max(1, Math.round(span / 1.5));
          for (let i = 0; i < nD; i += 1) {
            const u = (i - (nD - 1) / 2) * (span / nD); const k = faceK(w, d, phi); const [xx, zz] = onFace(x, z, w, d, phi, u, k);
            b.box(xx, 0.35, zz, 0.55, 0.55, 0.05, BROWN, phi, 0.02); b.box(xx, 0.35, zz, 0.45, 0.5, 0.07, '#26180f', phi, 0.02);
          }
        }
      });
    });
    // carved wooden oriels (upper floors)
    const oriel = (x, z, phi, y, ww0 = 1.25) => { const ww = ww0 * 1.5;
      const [ox, oz] = onFace(x, z, 0, 0, phi, 0, 0);
      const cx0 = x; const cz0 = z;
      b.box(cx0, y, cz0, ww, 0.8, 0.36, '#4a2c14', phi, 0.05);
      b.box(cx0, y + 0.8, cz0, ww + 0.14, 0.07, 0.46, '#3e2813', phi, 0.03);
      b.box(cx0, y - 0.08, cz0, ww + 0.02, 0.08, 0.4, '#a2763a', phi, 0.05);
      const k = 0.18;
      for (let i = -1; i <= 1; i += 1) {
        const [wx, wz] = onFace(cx0, cz0, 0, 0, phi, i * ww * 0.3, k);
        b.box(wx, y + 0.15, wz, 0.24, 0.5, 0.03, '#1d130c', phi, 0.02);
        b.box(wx, y + 0.12, wz, 0.3, 0.06, 0.035, '#b8893a', phi, 0.02);
      }
      return [ox, oz];
    };
    const main = vols[0];
    const fz = main[1] + main[3] / 2 + 0.18; const fx = main[0] + main[2] / 2 + 0.18;
    oriel(px - 0.5, pz - 0.35 + 1.55 + 0.18, 0, 5.4, 1.7); oriel(px - 0.5 + 1.85 + 0.18, pz - 0.35 + 0.4, Math.PI / 2, 5.6, 1.1); oriel(px + 1.4, fz, 0, 1.75); oriel(px - 1.2, fz, 0, 2.5, 1.0);
    oriel(fx, pz + 0.2, Math.PI / 2, 2.4, 1.3);
    oriel(px - 0.5 + 1.85 + 0.18, pz - 0.35 + 0.4, Math.PI / 2, 3.35, 1.0);
    b.box(px - 0.5, 5.0, pz - 0.35 + 1.56, 3.76, 0.2, 0.05, '#4a2c14', 0, 0.04);
    b.box(px - 0.5, 6.4, pz - 0.35 + 1.56, 3.76, 0.18, 0.05, '#4a2c14', 0, 0.04);
    [[-1.5, 0.5, 0.9], [0.6, 2.8, 1.5], [-0.4, 3.6, 1.1], [1.7, 1.2, 1.8], [-2.0, 3.0, 1.4]].forEach(([u, y, h]) => { b.box(px + u, y, pz + 2.32, 0.07, h, 0.012, '#a89d84', 0, 0.12); b.box(px + u + 0.12, y, pz + 2.32, 0.2, h * 0.6, 0.012, '#d2c9b0', 0, 0.1); });
    [[-1.1, 5.7, 1.2], [0.4, 5.9, 0.9], [-1.8, 6.1, 0.8]].forEach(([u, y, h]) => b.box(px - 0.5 + u, y, pz - 0.35 + 1.56, 0.06, h, 0.012, '#a89d84', 0, 0.1));
    [[-1.4, 2.6],[1.1, 3.4],[0.3, 1.5]].forEach(([u, y]) => b.box(px + u, y, pz + 2.32, 0.1, 1.3, 0.012, '#bfb8a2', 0, 0.1));
    // decorative stains and plaster patches
    [[px - 0.6, 1.2, fz + 0.01, 0.9, 0.7], [px + 0.4, 2.2, fz + 0.01, 0.7, 1.0], [px - 2.0, 0.9, fz + 0.01, 0.6, 0.5]].forEach(([x, y, z, w, h]) => b.box(x, y, z - 0.0, w, h, 0.015, '#d6cfba', 0, 0.1));
    // roof flag poles and strings
    flagPole(b, px - 1.8, 7.23, pz + 1.0, 1.5);
    flagPole(b, px + 1.2, 7.23, pz - 1.4, 1.3);
    flagPole(b, px + 3.2, 4.23, pz - 1.6, 1.1);
    flagPole(b, px + 2.9, 2.43, pz + 1.4, 1.1);
    flagPole(b, px - 3.1, 2.83, pz - 0.5, 1.0);
    flagLine(b, [px - 1.8, 8.55, pz + 1.0], [px + 1.2, 8.4, pz - 1.4], 14, 0.4);
    flagLine(b, [px + 2.9, 3.4, pz + 1.4], [px - 1.8, 8.5, pz + 1.0], 18, 0.5);
  }

  function verandah(b, bl, rnd, x, z, w, d, hv, pillars, arched) {
    // deep flat-roofed verandah along +z front: red wall behind, wooden pillars, painted beam band, dark recess
    const zf = z + d / 2;
    b.box(x, 0, z, w, hv, d, RED, 0, 0.05);
    const dark = '#2a1a14';
    b.box(x, 0.12, zf - 0.04, w - 0.5, hv - 0.2, 0.06, dark, 0, 0.0);
    // painted beam band
    const n = Math.round(w / 0.55);
    for (let i = 0; i < n; i += 1) {
      const t = -w / 2 + (i + 0.5) * (w / n);
      b.box(x + t, hv - 0.2, zf + 0.02, w / n * 0.98, 0.17, 0.08, ['#d6a52a', '#2f6db5', '#a93a2b', '#2e8b57'][i % 4], 0, 0.05);
      b.box(x + t, hv - 0.02, zf + 0.02, w / n * 0.9, 0.04, 0.12, '#e9dfc8', 0, 0.02);
    }
    for (let i = 0; i < pillars; i += 1) {
      const t = -w / 2 + 0.25 + (i * (w - 0.5)) / (pillars - 1);
      b.box(x + t, 0, zf + 0.0, 0.13, hv - 0.2, 0.13, arched ? RED : '#7a2a1c', 0, 0.06);
      if (arched && i < pillars - 1) { const mx = t + (w - 0.5) / (pillars - 1) / 2; b.box(x + mx, 0.05, zf + 0.03, (w - 0.5) / (pillars - 1) - 0.2, hv - 0.4, 0.05, '#1c120d', 0, 0); }
    }
    // central doorway
    b.box(x, 0, zf + 0.0, 0.6, 0.68, 0.1, '#d6a52a', 0, 0.03); b.box(x, 0, zf + 0.03, 0.48, 0.62, 0.1, '#18100b', 0, 0);
  }

  function monastery(b, bl, rnd, m, kind) {
    const { x, z, w, d } = m;
    const vd = kind === 'thu' ? 1.35 : 1.0; // verandah depth
    const hv = kind === 'thu' ? 1.15 : 1.05;
    const rb = 1.9; // rear block height
    const hTop = kind === 'cho' ? 2.6 : kind === 'thu' ? 2.6 : 2.8;
    const bd = d - vd;
    const bz = z - d / 2 + bd / 2;
    b.box(x, 0, bz, w, 0.35, bd, '#7d4a3a', 0, 0.1);
    b.box(x, 0.35, bz, w - 0.04, rb - 0.35, bd - 0.04, RED, 0, 0.12);
    b.box(x, 0.35, bz + bd / 2 - 0.01, w - 0.1, 0.5, 0.03, '#9e3d26', 0, 0.1);
    // pale parapet band and black beam-ends
    b.box(x, rb, bz, w + 0.08, 0.38, bd + 0.08, CREAM, 0, 0.05);
    b.box(x, rb - 0.1, bz + bd / 2 + 0.02, w - 0.1, 0.09, 0.06, '#1b130e', 0, 0.0);
    b.box(x, rb + 0.38, bz, w - 0.1, 0.03, bd - 0.1, '#a09074');
    firewood(b, rnd, x, rb + 0.41, bz + bd / 2 - 0.2, w - 0.5, 0, 0.3, 2.5);
    firewood(b, rnd, x, rb + 0.41, bz - bd / 2 + 0.2, w - 0.5, 0, 0.3, 2.5);
    // tall central upper block
    const uw = w * (kind === 'thu' ? 0.62 : 0.72); const ud = bd * 0.7;
    const uz = bz - 0.15;
    b.box(x, rb + 0.38, uz, uw, hTop - rb - 0.38, ud, RED, 0, 0.12);
    b.box(x, hTop, uz, uw + 0.1, 0.36, ud + 0.1, CREAM, 0, 0.05);
    b.box(x, hTop - 0.1, uz + ud / 2 + 0.02, uw - 0.1, 0.08, 0.06, '#1b130e', 0, 0.0);
    b.box(x, hTop + 0.36, uz, uw - 0.1, 0.03, ud - 0.1, '#a09074');
    firewood(b, rnd, x, hTop + 0.39, uz + ud / 2 - 0.2, uw - 0.5, 0, 0.26, 2.5);
    const nW = kind === 'thu' ? 4 : 2;
    for (let i = 0; i < nW; i += 1) {
      const u = (i - (nW - 1) / 2) * (uw / (nW + 0.3));
      const wy = rb + 0.62;
      b.box(x + u, wy - 0.04, uz + ud / 2 + 0.01, 0.34, 0.44, 0.04, '#efe7d3', 0, 0.02);
      b.box(x + u, wy, uz + ud / 2 + 0.02, 0.24, 0.34, 0.05, '#121212', 0, 0);
      b.box(x + u, wy + 0.34, uz + ud / 2 + 0.02, 0.28, 0.05, 0.06, '#d6a52a', 0, 0);
      if (bl && i % 2 === 0) bl.box(x + u, wy + 0.04, uz + ud / 2 + 0.04, 0.16, 0.2, 0.02, '#fff', 0, 0);
    }
    // side walls get windows too
    [-1, 1].forEach((sg) => {
      b.box(x + sg * (w / 2 + 0.005), 0.9, bz, 0.04, 0.4, 0.34, '#121212', 0, 0);
      b.box(x + sg * (uw / 2 + 0.005), rb + 0.62, uz, 0.04, 0.34, 0.24, '#121212', 0, 0);
    });
    // verandah
    verandah(b, bl, rnd, x, z + d / 2 - vd / 2, w, vd, hv, kind === 'thu' ? 10 : kind === 'jam' ? 6 : 8, kind === 'jam');
    b.box(x, hv, z + d / 2 - vd / 2, w + 0.1, 0.07, vd + 0.1, CREAM, 0, 0.04);
    b.box(x, hv + 0.07, z + d / 2 - vd / 2, w - 0.1, 0.03, vd - 0.1, '#a09074');
    firewood(b, rnd, x, hv + 0.1, z + d / 2 - vd + 0.2, w - 0.4, 0, 0.26, 2.5);
    // roof-corner chorten finials, centre pole
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => chorten(b, x + sx * (uw / 2 - 0.18), hTop + 0.39, uz + sz * (ud / 2 - 0.18), 0.55, 0));
    flagPole(b, x, hTop + 0.39, uz, 0.9);
    flagLine(b, [x - uw / 2 + 0.2, hTop + 0.95, uz + ud / 2 - 0.2], [x - w / 2 - 1.5, 1.8, z + d / 2 + 1.5], 10, 0.2);
    flagLine(b, [x + uw / 2 - 0.2, hTop + 0.95, uz + ud / 2 - 0.2], [x + w / 2 + 1.5, 1.8, z + d / 2 + 1.5], 10, 0.2);
  }

  function gateHouse(b, bl, rnd) {
    const [gx, gz] = GATE;
    const w = 2.7; const d = 1.3; const h = 2.0;
    b.box(gx, 0, gz, w + 0.05, 0.4, d + 0.05, '#8c806b', 0, 0.2);
    b.box(gx, 0.4, gz, w, h - 0.4, d, '#d8ceb4', 0, 0.07);
    b.box(gx, h, gz, w + 0.12, 0.12, d + 0.12, '#efe9d9', 0, 0.04);
    b.box(gx, h + 0.12, gz, w - 0.1, 0.03, d - 0.1, '#a09074');
    firewood(b, rnd, gx, h + 0.15, gz + d / 2 - 0.2, w - 0.3, 0, 0.2);
    firewood(b, rnd, gx, h + 0.15, gz - d / 2 + 0.2, w - 0.3, 0, 0.2);
    const zf = gz + d / 2;
    b.box(gx, 0, zf, 1.5, 1.45, 0.09, '#46301a', 0, 0.03); // timber frame
    b.box(gx, 0, zf + 0.01, 1.2, 1.3, 0.1, '#6a4425', 0, 0.06); // doors
    b.box(gx, 0, zf + 0.06, 0.02, 1.3, 0.04, '#241812', 0, 0);
    for (let i = 0; i < 6; i += 1) for (let s = -1; s <= 1; s += 2) b.box(gx + s * 0.3, 0.2 + i * 0.2, zf + 0.07, 0.05, 0.05, 0.03, '#2a2a2a', 0, 0);
    b.box(gx, 1.45, zf, 1.7, 0.1, 0.12, '#3e2813', 0, 0.03); // lintel
    windowAt(b, bl, gx, gz, w, d, 0, -0.6, 1.5, 0.22, 0.3, true);
    windowAt(b, bl, gx, gz, w, d, 0, 0.6, 1.5, 0.22, 0.3, false);
    flagPole(b, gx + 1.0, h + 0.15, gz, 1.2);
    flagLine(b, [gx + 1.0, h + 1.3, gz], [gx - 1.0, h + 0.8, gz + 0.3], 8, 0.15);
  }

  /* ---------- the walled town (one merged mesh) ---------- */
  function buildTown() {
    const b = Builder(); const bl = Builder(); const rnd = prng(41);
    const roofs = [];
    // ground inside the wall, lanes and square
    b.poly([A, B, Cc, D], 0.02, '#b8a583', 0.12);
    b.poly([[-5.8, 6.7], [9.3, 6.7], [9.3, 11.0], [-5.8, 11.0]], 0.03, '#c9b690', 0.06);
    b.poly([[GATE[0] - 0.7, 10.5], [GATE[0] + 0.7, 10.5], [GATE[0] + 0.8, 15.6], [GATE[0] - 0.8, 15.6]], 0.03, '#c9b690', 0.06);

    // wall
    const edges = [[A, B, 0], [B, Cc, 1], [Cc, D, 2], [D, A, 3]];
    const wallSeg = (p, q) => {
      const len0 = Math.hypot(q[0] - p[0], q[1] - p[1]); const n = Math.max(1, Math.ceil(len0 / 3.0));
      for (let i = 0; i < n; i += 1) {
        const p1 = lerp2(p, q, i / n); const q1 = lerp2(p, q, (i + 1) / n);
        const dx = q1[0] - p1[0]; const dz = q1[1] - p1[1]; const len = Math.hypot(dx, dz) + 0.04; const rot = -Math.atan2(dz, dx);
        const mx = (p1[0] + q1[0]) / 2; const mz = (p1[1] + q1[1]) / 2;
        const rr = hash2(mx * 1.7, mz * 2.3);
        const hf = rr < 0.07 ? 0.35 : 0.82 + 0.36 * hash2(mz, mx + 4);
        const ht = 1.6 * hf;
        b.box(mx, 0, mz, len, 0.5, 1.05, '#7f7258', rot, 0.2);
        if (ht > 0.7) {
          const lay = (ht - 0.6) / 2;
          b.box(mx, 0.5, mz, len, lay, 0.9, WALL, rot, 0.14);
          b.box(mx, 0.5 + lay, mz, len, lay, 0.78, i % 2 ? '#c6b793' : WALL, rot, 0.14);
          b.box(mx, ht - 0.1, mz, len, 0.1, 0.86, '#e1d6b8', rot, 0.06);
          b.box(mx, ht, mz, len, 0.02, 0.66, '#a09074', rot, 0);
        } else b.box(mx, 0.5, mz, len, 0.2, 0.8, '#a99a7c', rot, 0.25);
      }
    };
    const gl = (TG - 0.028); const gr = (TG + 0.028);
    wallSeg(A, lerp2(A, B, gl)); wallSeg(lerp2(A, B, gr), B);
    wallSeg(B, Cc); wallSeg(Cc, D); wallSeg(D, A);
    // 14 towers: 4 corners + 10 along the wall
    const tw = [
      ...[0, 0.26, 0.45, 0.84].map((t) => [A, B, t]),
      ...[0, 0.36, 0.7].map((t) => [B, Cc, t]),
      ...[0, 0.25, 0.5, 0.75].map((t) => [Cc, D, t]),
      ...[0, 0.4, 0.72].map((t) => [D, A, t]),
    ];
    tw.forEach(([p, q, t], i) => {
      const [x, z] = lerp2(p, q, t); const rot = -Math.atan2(q[1] - p[1], q[0] - p[0]);
      const s = 1.15 + (i % 3) * 0.1; const h = t === 0 ? 2.1 : 2.0 + (i % 2) * 0.12;
      b.box(x, 0, z, s + 0.2, 0.5, s + 0.2, '#9a8d74', rot, 0.2);
      b.box(x, 0.5, z, s, h - 0.5, s, '#d3c6a3', rot, 0.1);
      b.box(x, h, z, s + 0.14, 0.12, s + 0.14, '#e8dec3', rot, 0.05);
      b.box(x, h + 0.12, z, s - 0.1, 0.03, s - 0.1, '#a09074', rot, 0);
      firewood(b, rnd, x, h + 0.15, z, s - 0.3, rot, 0.2);
      [-0.22, 0.22].forEach((u) => b.box(x + u * Math.cos(rot) + (s / 2) * Math.sin(rot), 1.2, z - u * Math.sin(rot) + (s / 2) * Math.cos(rot), 0.1, 0.24, 0.05, DARK, rot, 0));
    });
    gateHouse(b, bl, rnd);

    // houses: tight rows with narrow lanes, varied heights, all flat-roofed
    const zFront = (x) => mix(A[1], B[1], (x - A[0]) / (B[0] - A[0]));
    const zBack = (x) => mix(D[1], Cc[1], (x - D[0]) / (Cc[0] - D[0]));
    const xL = (z) => mix(A[0], D[0], (A[1] - z) / (A[1] - D[1]));
    const xR = (z) => mix(B[0], Cc[0], (B[1] - z) / (B[1] - Cc[1]));
    let z0 = -12.6; let ri = 0;
    while (z0 < 12.8) {
      ri += 1; const rowShift = ri % 3 === 0 ? 0.4 + (ri % 2) * 0.2 : 0;
      const dep = 2.1 + rnd() * 1.1;
      const cz = z0 + dep / 2;
      let x = xL(cz) + 0.6 + rowShift;
      while (x < xR(cz) - 1.2) {
        const w = 1.7 + rnd() * 1.9;
        let x1 = x + w;
        if (x1 > xR(cz) - 0.55) break;
        const dd = dep * (0.88 + rnd() * 0.12);
        const czz = cz + (rnd() - 0.5) * 0.5;
        if (czz + dd / 2 < Math.min(zFront(x), zFront(x1)) - 0.5 && czz - dd / 2 > Math.max(zBack(x), zBack(x1)) + 0.5 && !hits(x, x1, czz - dd / 2, czz + dd / 2)) {
          const tall = rnd();
          const h = tall < 0.3 ? 1.1 : tall < 0.65 ? 1.3 : 1.5;
          house(b, bl, rnd, roofs, (x + x1) / 2, czz, w, dd, h);
          if (rnd() < 0.25 && x1 + 1.6 < xR(czz) - 0.6) {
            const wz = czz + (rnd() < 0.5 ? 0.55 : -0.55); const wd = dd * 0.7;
            if (!hits(x1, x1 + 1.3, wz - wd / 2, wz + wd / 2) && wz + wd / 2 < zFront(x1) - 0.5 && wz - wd / 2 > zBack(x1) + 0.5) { house(b, bl, rnd, roofs, x1 + 0.62, wz, 1.3, wd, h * 0.85); x1 += 1.25; }
          }
        }
        x = x1 + (rnd() < 0.7 ? 0.0 : 0.25 + rnd() * 0.5);
      }
      z0 += dep + 0.25 + rnd() * rnd() * 1.3;
    }
    palace(b, bl, rnd);
    monastery(b, bl, rnd, THU, 'thu');
    monastery(b, bl, rnd, JAM, 'jam');

    // chortens: ochre-white ones in the square beside the monasteries, and on house roofs
    [[-4.2, 7.9, 1], [-2.6, 8.3, 0.8], [-1.4, 7.6, 1.1], [0.6, 8.5, 0.9], [7.8, 7.4, 1], [8.5, 8.6, 0.8], [-5.2, 9.8, 0.9], [2.0, 9.9, 0.8]].forEach(([x, z, s], i) => chorten(b, x, 0.03, z, s * 1.4, i % 3 === 0 ? 1 : 0));
    [[-16.3, 7.4, 2.0], [-16.3, 3.2, 1.7], [9.6, 2.4, 2.0], [9.6, 4.3, 1.5]].forEach(([x, z, s], i) => chorten(b, x, 0.03, z, s, i % 2));
    roofs.slice(0, 10).forEach(([x, y, z], i) => chorten(b, x, y, z, 0.7, i % 2));
    // prayer-flag lines across the square
    flagPole(b, -5.0, 0.03, 7.3, 1.9); flagPole(b, 8.6, 0.03, 7.6, 1.9); flagPole(b, -5.0, 0.03, 10.4, 1.7); flagPole(b, 8.6, 0.03, 10.1, 1.7);
    flagLine(b, [-5.0, 1.9, 7.3], [8.6, 1.9, 7.6], 22, 0.35);
    flagLine(b, [-5.0, 1.7, 10.4], [8.6, 1.7, 10.1], 22, 0.35);
    flagLine(b, [-5.0, 1.9, 7.3], [-5.0, 1.7, 10.4], 10, 0.2);
    flagLine(b, [8.6, 1.9, 7.6], [8.6, 1.7, 10.1], 10, 0.2);
    return { geo: b.geometry(), lit: bl.geometry() };
  }

  /* Choede monastery just outside the north wall */
  function buildChoede() {
    const b = Builder(); const bl = Builder(); const rnd = prng(5);
    b.poly([[CHO.x - 3.6, CHO.z - 2.6], [CHO.x + 3.6, CHO.z - 2.6], [CHO.x + 3.6, CHO.z + 3.4], [CHO.x - 3.6, CHO.z + 3.4]], 0.02, '#c3ae88', 0.05);
    monastery(b, bl, rnd, CHO, 'cho');
    return { geo: b.geometry(), lit: bl.geometry() };
  }

  /* ---------- outside the wall: fields, poplars, houses, mani walls, river, road ---------- */
  function buildOutside() {
    const b = Builder(); const bl = Builder(); const rnd = prng(88);
    const inTown = (x, z) => Math.abs(x) < 27.8 && z > -18.2 && z < 19;
    const riverX = (z) => RIVX(z);
    // road from the gate
    const road = [];
    for (let z = 15.4; z < 62; z += 3) road.push(z);
    for (let i = 0; i < road.length - 1; i += 1) {
      const z0 = road[i]; const z1 = road[i + 1];
      const x0 = GATE[0] + (z0 - 15) * -0.04; const x1 = GATE[0] + (z1 - 15) * -0.04;
      b.poly([[x0 - 0.7, z0], [x0 + 0.7, z0], [x1 + 0.7, z1], [x1 - 0.7, z1]], 0.035, '#d3bf99', 0.08);
    }
    for (let i = 0; i < 260; i += 1) {
      const a = rnd() * Math.PI * 2; const r = 16 + rnd() * 100; const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      if (inTown(x, z) || (z > 14 && Math.abs(x - GATE[0]) < 3)) continue;
      const s = 0.07 + rnd() * 0.16; b.cone(x, 0, z, s, s * 0.5, s * 0.6, 5, ['#8f8272', '#a99b85', '#7c705f', '#c4b496'][Math.floor(rnd() * 4)], 0.2);
    }
    // terraced barley patchwork: large blocks of stone-bunded plots, clustered at the wall and on the right
    const poplar = (x, z, s) => { b.cone(x, 0, z, 0.05, 0.035, 0.45 * s, 5, '#6b5334', 0); b.cone(x, 0.35 * s, z, 0.2 * s, 0.03, 1.8 * s, 6, ['#7f9a3a', '#8aa23e', '#74903a'][Math.floor(rnd() * 3)], 0.12); };
    const GREENS = ['#587a30', '#82903a', '#948f3c', '#5a7830', '#8a8a3a', '#4a6a28'];
    const BLOCKS = [[-15, 25, 20, 8], [18, 25.5, 22, 8], [-29.5, 2, 5.5, 24], [29, -1, 5.5, 22], [-12, -20.8, 20, 5], [-18, 36, 16, 7], [16, 37, 16, 7], [40, 9, 7, 14], [-4, 33, 9, 5]];
    BLOCKS.forEach(([cx, cz, w, d], bi) => {
      const rot = (hash2(bi, 3) - 0.5) * 0.4; const cs = Math.cos(rot); const sn = Math.sin(rot);
      const nx = Math.max(2, Math.round(w / 4.2)); const nz = Math.max(2, Math.round(d / 3.4));
      b.box(cx, 0, cz, w + 0.5, 0.05, d + 0.5, '#9d8a62', rot, 0.14); // stone-wall bund
      const pw = w / nx; const pd = d / nz;
      for (let i = 0; i < nx; i += 1) for (let j = 0; j < nz; j += 1) {
        const hh = hash2(bi * 7 + i, j * 3 + 1);
        const lx = (i + 0.5) * pw - w / 2 + (hash2(i, j + bi) - 0.5) * 0.9; const lz = (j + 0.5) * pd - d / 2 + (hash2(j, i + bi) - 0.5) * 0.9;
        const colr = hh < 0.1 ? '#a88f5c' : hash2(i + bi, j * 5) < 0.25 ? '#4a6a28' : GREENS[Math.floor(hash2(i + bi * 3, j * 5 + 1) * 5)];
        const ht = 0.05 + j * 0.035 + hash2(i * 3 + bi, j) * 0.03; // terrace steps
        const r2 = rot + (hash2(i, j) - 0.5) * 0.7;
        const ww = pw - 0.1 - hash2(j, bi) * 1.0; const dd = pd - 0.1 - hash2(i, bi + 2) * 0.9;
        b.box(cx + lx * cs + lz * sn, 0, cz - lx * sn + lz * cs, ww, ht, dd, colr, r2, 0.16);
        b.box(cx + lx * cs + lz * sn, ht - 0.01, cz - lx * sn + lz * cs, ww * 0.82, 0.02, dd * 0.8, hh < 0.5 ? '#6a7f34' : '#62782f', r2, 0.2);
      }
      if (hash2(bi, 1) < 0.7) { for (let k = 0; k < 4; k += 1) poplar(cx - w / 2 + 0.6 + k * 0.9 * (w / 8), cz + d / 2 + 0.9, 0.9 + rnd() * 0.4); }
    });
    // river bed: sunken gravel trench (terrace drop ~1 unit) with braided channels, SW
    const BY = -0.9; const RWb = RW - 1.6;
    for (let z = -100; z < 100; z += 4) {
      const z1 = z + 4; const xa = RIVX(z); const xb = RIVX(z1);
      b.poly([[xa - RWb, z], [xa + RWb, z], [xb + RWb, z1], [xb - RWb, z1]], BY, '#8f8c85', 0.12);
      [[-7.5, -5.5, '#6f8f95'], [-3, -1.5, '#6f8f95'], [2, 3.4, '#6f8f95'], [6, 7.2, '#6f8f95'], [-5, -4.2, '#a9a69b'], [0, 1.2, '#a9a69b'], [4, 5, '#b3ada0']].forEach(([u0, u1, cc], k) => {
        const sh = Math.sin((z + k * 9) * 0.11) * 1.0; const sh1 = Math.sin((z1 + k * 9) * 0.11) * 1.0;
        b.poly([[xa + u0 + sh, z], [xa + u1 + sh, z], [xb + u1 + sh1, z1], [xb + u0 + sh1, z1]], BY + 0.012 + k * 0.001, cc, 0.08);
      });
      [-1, 1].forEach((sg) => { // scarp slopes from terrace edge down to the bed
        const e0 = [xa + sg * RW, 0.0, z]; const e1 = [xb + sg * RW, 0.0, z1]; const f0 = [xa + sg * RWb, BY, z]; const f1 = [xb + sg * RWb, BY, z1];
        b.tri(e0, f0, f1, '#a8946e', 0.2); b.tri(e0, f1, e1, '#a8946e', 0.2);
      });
    }
    for (let i = 0; i < 40; i += 1) { const z = -90 + rnd() * 180; const x = RIVX(z) + (rnd() - 0.5) * 2 * (RWb - 1); const s2 = 0.1 + rnd() * 0.3; b.cone(x, BY, z, s2, s2 * 0.6, s2 * 0.8, 5, '#9a958a', 0.15); }
    // a few short clusters of slim yellow-green poplars along field edges
    [[-24, 24, 4], [24, 25, 3], [33, -3, 4], [-30, -4, 3], [-5, -23, 3]].forEach(([px, pz, n]) => { for (let i = 0; i < n; i += 1) poplar(px + i * 0.9 + (rnd() - 0.5) * 0.4, pz + (rnd() - 0.5) * 1.0, 0.85 + rnd() * 0.4); });
    // outlying houses / guest lodges (flat roofs, firewood)
    [[-18, 18.9, 2.6, 2.2, 1.15], [-23.5, 20, 2.2, 2.0, 1.45], [21, 18.8, 2.8, 2.2, 1.2], [26, 19.5, 2.2, 2.0, 1.0], [35.5, 6, 2.4, 2.4, 1.2], [35.5, -2, 2.0, 2.2, 1.0], [-35, 3, 2.4, 2.2, 1.3], [-35, -6, 2.0, 2.0, 1.0], [-27, -23, 2.4, 2.0, 1.1], [24, -22.5, 2.2, 2.0, 1.0]].forEach(([x, z, w, d, h]) => house(b, null, rnd, null, x, z, w, d, h));
    // mani wall, chortens and flags by the gate road
    const mani = (x, z, len, rot) => {
      b.box(x, 0, z, len, 0.5, 0.9, '#a99c85', rot, 0.2);
      b.box(x, 0.5, z, len, 0.07, 0.95, '#d8cdb6', rot, 0.06);
      for (let i = 0; i < 6; i += 1) { const u = (i / 5 - 0.5) * (len - 0.8); b.box(x + u * Math.cos(rot), 0.57, z - u * Math.sin(rot), 0.5, 0.18, 0.5, ['#7d4a3a', '#cdbf9d', '#a89a82'][i % 3], rot, 0.2); }
    };
    mani(-9, 18.2, 7, 0.1); mani(14, 17.2, 5.5, -0.15);
    chorten(b, -12.8, 0, 18.1, 1.5, 0); chorten(b, -5.2, 0, 18.4, 1.5, 1); chorten(b, 11.0, 0, 17.0, 1.4, 0); chorten(b, 17.0, 0, 16.6, 1.4, 1);
    chorten(b, GATE[0] - 2.6, 0, 18.5, 1.8, 1); chorten(b, GATE[0] + 2.3, 0, 18.5, 1.8, 0);
    flagPole(b, GATE[0] - 2.9, 0, 20.5, 2.0); flagPole(b, GATE[0] + 2.8, 0, 20.5, 2.0);
    flagLine(b, [GATE[0] - 2.9, 2.0, 20.5], [GATE[0] + 2.8, 2.0, 20.5], 18, 0.35);
    // boulders and scree
    for (let i = 0; i < 90; i += 1) {
      const a = rnd() * Math.PI * 2; const r = 28 + rnd() * 28; const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      if (inTown(x, z) || (z > 14 && Math.abs(x) < 36)) continue;
      const s = 0.2 + rnd() * 0.55; b.cone(x, 0, z, s, s * 0.6, s * 0.8, 5, rnd() < 0.5 ? '#9a8b78' : '#8a7c6a', 0.15);
    }
    return { geo: b.geometry(), lit: bl.geometry() };
  }

  /* ---------- mountains: a back arc (north) of big smooth gullied scree fans, one snow peak to the south-west ---------- */
  function buildMountains() {
    const X0 = -150; const X1 = 150; const Z0 = -150; const Z1 = 75; const CS = 1.7;
    const NX = Math.round((X1 - X0) / CS); const NZ = Math.round((Z1 - Z0) / CS);
    const pos = []; const col = []; const idx = [];
    const c = new THREE.Color(); const c2 = new THREE.Color(); const HAZE = new THREE.Color('#d9cdb8');
    const PEAKS = [[-124, 14, 14, 44], [-112, -34, 11, 36], [-58, -108, 10, 24]];
    const hAt = (x, z) => {
      const r = Math.hypot(x, z);
      let a = Math.atan2(z, x); if (a < 0) a += Math.PI * 2;
      const arc = smooth(3.2, 3.7, a) * (1 - smooth(5.9, 6.35, a));
      const wob = vn(x * 0.012 + 3, z * 0.012);
      const ridge = 1 - Math.abs(2 * vn(x * 0.02 + 40, z * 0.02 + 11) - 1); // few, broad ridges
      const fan = 0.5 + 0.5 * Math.sin(a * 17 + wob * 9 + r * 0.02); // big radial gullies
      const massW = 0.55 + 0.9 * smooth(0.25, 0.7, vn(x * 0.009 + 7, z * 0.009 + 2.5));
      const fan2 = Math.abs(Math.sin(a * 41 + wob * 16 + r * 0.045));
      const rough = (0.6 * Math.pow(ridge, 1.6) + 0.3 * fan + 0.1) * (0.75 + 0.25 * fan2);
      const base = Math.pow(smooth(62, 134, r), 1.35) * (16 + 28 * rough) * massW * arc;
      let pk = 0;
      PEAKS.forEach(([px, pz, sc, hh]) => { const dd = Math.hypot(x - px, z - pz) / sc; pk += hh * Math.exp(-dd * dd) * (0.9 + 0.2 * ridge); });
      const rim = smooth(92, 135, r) * (1 - arc) * (5 + 9 * vn(x * 0.03, z * 0.03));
      return base * (0.66 + 0.34 * fan) + pk * smooth(70, 112, r) + rim;
    };
    for (let j = 0; j <= NZ; j += 1) {
      for (let i = 0; i <= NX; i += 1) {
        const x = X0 + i * CS; const z = Z0 + j * CS; const r = Math.hypot(x, z);
        const h = hAt(x, z);
        const trench = 1 - smooth(RW - 2, RW + 3, Math.abs(x - RIVX(z)));
        pos.push(x, h - 0.1 - 1.3 * trench, z);
        let a = Math.atan2(z, x); if (a < 0) a += Math.PI * 2;
        const fan = 0.5 + 0.5 * Math.sin(a * 17 + vn(x * 0.012 + 3, z * 0.012) * 9 + r * 0.02);
        const n1 = vn(x * 0.05, z * 0.05); const n2 = vn(x * 0.22 + 3, z * 0.22);
        const snowy = PEAKS.slice(0, 2).some(([px, pz, sc]) => Math.hypot(x - px, z - pz) < sc * 1.6);
        if (snowy && h > 27 && n1 > 0.3 - (h - 27) * 0.02) c.set('#f1f3f7').lerp(c2.set('#c9d3e2'), 0.4 * (1 - n2));
        else {
          c.set('#665747').lerp(c2.set('#85786a'), 0.5 * n1 + 0.2 * n2);
          c.lerp(c2.set('#4e4236'), (1 - fan) * 0.55 * smooth(3, 12, h));
          c.lerp(c2.set('#7c7066'), smooth(16, 36, h) * 0.4);
          if (h < 4) c.lerp(c2.set('#9d8a69'), 1 - smooth(0, 4, h));
        }
        const f = 0.92 + n2 * 0.12;
        c.lerp(HAZE, Math.pow(smooth(80, 150, r), 1.3) * 0.04);
        col.push(c.r * f, c.g * f, c.b * f);
      }
    }
    for (let j = 0; j < NZ; j += 1) for (let i = 0; i < NX; i += 1) {
      const a = j * (NX + 1) + i; const bb = a + 1; const cc = a + NX + 1; const dd = cc + 1;
      idx.push(a, cc, bb, bb, cc, dd);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function groundGeometry() {
    const sh = new THREE.Shape(); sh.absarc(0, 0, 135, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    const pts = []; for (let z = -100; z <= 100; z += 5) pts.push([RIVX(z) + RW, z]);
    for (let z = 100; z >= -100; z -= 5) pts.push([RIVX(z) - RW, z]);
    pts.forEach(([x, z], i) => { if (i === 0) hole.moveTo(x, -z); else hole.lineTo(x, -z); });
    hole.closePath(); sh.holes.push(hole);
    const g = new THREE.ShapeGeometry(sh, 48);
    const p = g.attributes.position; const cs = []; const c = new THREE.Color(); const c2 = new THREE.Color('#8a7a5c');
    for (let i = 0; i < p.count; i += 1) {
      const x = p.getX(i); const z = -p.getY(i); const r = Math.hypot(x, z);
      c.set('#a08d6c').lerp(c2, smooth(45, 125, r) * 0.85).lerp(c2.set('#b09c78'), vn(x * 0.05, z * 0.05) * 0.3);
      c2.set('#8a7a5c'); cs.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    return g;
  }
  function skyGeometry() {
    const g = new THREE.SphereGeometry(135, 28, 16);
    const p = g.attributes.position; const day = []; const dusk = []; const c = new THREE.Color();
    const sets = [[new THREE.Color('#1f56b0'), new THREE.Color('#4f8ad6'), new THREE.Color('#d4e2f0'), day], [new THREE.Color('#2a2358'), new THREE.Color('#6a4a7c'), new THREE.Color('#d08a86'), dusk]];
    for (let i = 0; i < p.count; i += 1) {
      const t = Math.max(0, p.getY(i) / 135);
      sets.forEach(([top, mid, hor, out]) => { if (t < 0.25) c.copy(hor).lerp(mid, t / 0.25); else c.copy(mid).lerp(top, Math.min(1, (t - 0.25) / 0.6)); out.push(c.r, c.g, c.b); });
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(day, 3));
    g.userData = { day, dusk, state: 0 };
    return g;
  }

  const DBGZ = null;
  const isDusk = (scene) => !!(scene && scene.background && scene.background.r < 0.35);

  /* ---------- components ---------- */
  function LoMain() {
    const town = useMemo(buildTown, []);
    const choede = useMemo(buildChoede, []);
    const lightsRef = useMemo(() => ({ list: [] }), []);
    const onLit = (r, scene) => { const d = isDusk(scene); litMat().color.set(d ? '#ffc060' : '#a97a34'); lightsRef.list.forEach((l) => { if (l) l.intensity = d ? 3.4 : 0; }); };
    return (
      <group>
        <mesh geometry={town.geo} material={townMat()} castShadow receiveShadow />
        <mesh geometry={choede.geo} material={townMat()} castShadow receiveShadow />
        <mesh geometry={town.lit} material={litMat()} onBeforeRender={onLit} />
        <mesh geometry={choede.lit} material={litMat()} />
        {[[-2, 2.2, 8.5], [5.5, 2.2, 8.8], [GATE[0], 1.6, 13], [-1, 2.0, -6]].map((p, i) => (
          <pointLight key={i} ref={(l) => { lightsRef.list[i] = l; }} position={p} intensity={0} distance={11} color="#ffb060" />
        ))}
        <Frame s={DBGZ ? DBGZ.s : [34, 7.2, 22]} p={DBGZ ? DBGZ.p : [0, 3.6, 2]} />
      </group>
    );
  }

  function LoEnv() {
    const out = useMemo(buildOutside, []);
    const mtn = useMemo(buildMountains, []);
    const sky = useMemo(skyGeometry, []);
    const gnd = useMemo(groundGeometry, []);
    const mtnMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, fog: false }), []);
    const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }), []);
    const onMtn = (r, scene) => { mtnMat.color.set(isDusk(scene) ? '#d4a8bc' : '#ffffff'); };
    const onSky = (r, scene) => {
      const d = isDusk(scene) ? 1 : 0; const ud = sky.userData;
      if (ud.state !== d) { ud.state = d; sky.setAttribute('color', new THREE.Float32BufferAttribute(d ? ud.dusk : ud.day, 3)); }
    };
    return (
      <group>
        <mesh geometry={sky} material={skyMat} onBeforeRender={onSky} renderOrder={-10} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow geometry={gnd}><meshStandardMaterial vertexColors roughness={1} /></mesh>
        <mesh geometry={mtn} material={mtnMat} onBeforeRender={onMtn} />
        <mesh geometry={out.geo} material={townMat()} receiveShadow />
      </group>
    );
  }

  return { 'lo-manthang-walled-city': { Main: LoMain, Env: LoEnv } };
}
