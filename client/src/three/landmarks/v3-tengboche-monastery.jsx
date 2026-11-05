// Tengboche Monastery (Dawa Choling), Khumbu, 3,867 m: a long flat-roofed three-level stone gompa (whitewashed wings, deep
// maroon Dukhang front with black double door and lattice window box, on a dry-stone terrace reached by a broad stone stair),
// a separate painted timber gate crowned by a gilded dharma wheel and two deer, a white chorten with a golden ringed spire,
// mani-stone heaps, prayer flags, red tin-roofed monks' quarters round a stone courtyard, all on a brown knoll with the
// Ama Dablam pyramid and the Everest-Lhotse-Nuptse wall behind. (1 unit = about 2 m.)
export default function make(K) {
  const { THREE, useMemo, useEffect, useState, useM, Frame, Box, Cyl } = K;
  const TAU = Math.PI * 2;

  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- merged vertex-coloured geometry helpers ---------- */
  const _c = new THREE.Color();
  const paint = (g, col) => {
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    _c.set(col || '#ffffff');
    for (let i = 0; i < n; i += 1) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  };
  const place = (g, p, o) => {
    if (o && o.sc) g.scale(o.sc[0], o.sc[1], o.sc[2]);
    if (o && o.r) { g.rotateX(o.r[0] || 0); g.rotateY(o.r[1] || 0); g.rotateZ(o.r[2] || 0); }
    g.translate(p[0], p[1], p[2]);
  };
  const mkBox = (s, p, col, o) => { const g = new THREE.BoxGeometry(s[0], s[1], s[2]); place(g, p, o); return paint(g, col); };
  const mkCyl = (rt, rb, h, seg, p, col, o) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); place(g, p, o); return paint(g, col); };
  const mkCone = (r, h, seg, p, col, o) => { const g = new THREE.ConeGeometry(r, h, seg); place(g, p, o); return paint(g, col); };
  const mkBall = (r, p, col, o) => { const g = new THREE.SphereGeometry(r, 10, 8); place(g, p, o); return paint(g, col); };
  const mkPyr = (w, d, h, p, col) => {
    const g = new THREE.ConeGeometry(0.7071, 1, 4);
    g.rotateY(Math.PI / 4); g.scale(w, h, d); g.translate(p[0], p[1] + h / 2, p[2]);
    return paint(g, col);
  };
  const mergeG = (list) => {
    const out = new THREE.BufferGeometry();
    if (!list.length) return out;
    let nv = 0; let ni = 0;
    list.forEach((g) => { nv += g.attributes.position.count; ni += g.index.count; });
    const P = new Float32Array(nv * 3); const N = new Float32Array(nv * 3); const U = new Float32Array(nv * 2);
    const C = new Float32Array(nv * 3); const I = new Uint32Array(ni);
    let vo = 0; let io = 0;
    for (const g of list) {
      const n = g.attributes.position.count;
      P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3);
      U.set(g.attributes.uv.array, vo * 2); C.set(g.attributes.color.array, vo * 3);
      const ix = g.index.array;
      for (let i = 0; i < ix.length; i += 1) I[io + i] = ix[i] + vo;
      vo += n; io += ix.length;
      g.dispose();
    }
    out.setAttribute('position', new THREE.BufferAttribute(P, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    out.setAttribute('color', new THREE.BufferAttribute(C, 3));
    out.setIndex(new THREE.BufferAttribute(I, 1));
    return out;
  };

  /* dusk detection (the viewer has a Day / Dusk chip and a ?dusk=1 query) */
  const useDusk = () => {
    const [d, setD] = useState(() => { try { return new URLSearchParams(window.location.search).get('dusk') === '1'; } catch (e) { return false; } });
    useEffect(() => {
      const f = () => {
        try {
          const q = new URLSearchParams(window.location.search).get('dusk') === '1';
          const on = document.querySelector('.chip.on');
          setD(on ? /dusk/i.test(on.textContent || '') : q);
        } catch (e) { /* ignore */ }
      };
      f();
      const id = setInterval(f, 600);
      return () => clearInterval(id);
    }, []);
    return d;
  };

  const FLAG = ['#2d62b8', '#f4f1e8', '#c8332b', '#2f8a4d', '#e8bb2a'];
  const flagLine = (list, from, to, n, sag = 0.4, sz = 0.2) => {
    const th = Math.atan2(-(to[2] - from[2]), to[0] - from[0]);
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const g = new THREE.PlaneGeometry(sz, sz * 1.15);
      g.rotateY(th);
      g.translate(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag - 0.1, from[2] + (to[2] - from[2]) * t);
      list.push(paint(g, FLAG[i % 5]));
    }
  };

  /* ---------- windows ---------- */
  const addWin = (F, G, cx, cy, cz, face, w = 0.62, h = 0.82) => {
    const zt = face === '+z' || face === '-z';
    const sx = zt ? 1 : 0; const sgn = (face[0] === '+') ? 1 : -1;
    const S = (a, b, c) => (zt ? [a, b, c] : [c, b, a]);
    F.push(mkBox(S(w + 0.1, h + 0.1, 0.14), [cx, cy, cz], '#2a1a16'));
    F.push(mkBox(S(w + 0.08, 0.06, 0.22), [cx, cy - h / 2 - 0.04, cz], '#e9e5da'));
    const gp = zt ? [cx, cy, cz + sgn * 0.02] : [cx + sgn * 0.02, cy, cz];
    G.push(paint(new THREE.BoxGeometry(...S(w - 0.18, h - 0.18, 0.16)), '#ffffff'));
    G[G.length - 1].translate(gp[0], gp[1], gp[2]);
    return sx;
  };

  /* gabled tin roof: triangular prism, ridge along the longer side */
  const mkGable = (w, d, h, p, col) => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 3);
    g.rotateX(-Math.PI / 2);
    if (w >= d) { g.scale(d / 1.732, h / 1.5, w); g.rotateY(Math.PI / 2); } else { g.scale(w / 1.732, h / 1.5, d); }
    g.translate(p[0], p[1] + h / 3, p[2]);
    return paint(g, col);
  };

  /* knoll height: flat plateau, irregular edge, terraced fall-away; the plateau reaches out to the front (+z) towards the lodges */
  const hgt = (x, z) => {
    const a = Math.atan2(z, x);
    const n = 0.5 * Math.sin(3 * a + 1.3) + 0.3 * Math.sin(5 * a + 0.4) + 0.2 * Math.sin(9 * a + 2);
    const da = Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2));
    const R = 30 + 3.2 * n + 13 * Math.exp(-(da * da) / 0.35);
    const d = Math.hypot(x, z) - R;
    if (d <= 0) return 0;
    let y = -(0.75 * d + 0.03 * d * d) * (1 + 0.7 * Math.cos(a) * Math.cos(a));
    y = Math.max(y, -32);
    const ys = Math.round(y / 1.5) * 1.5;
    y = (y * 0.4 + ys * 0.6) * Math.min(1, d / 1.5);
    return y;
  };

  /* one long snowy ridge with unequal bumps (Nuptse, Lhotse wall) */
  const ridgeGeo = ({ len, dh, seed, bumps }) => {
    const nx = 130; const nz = 6;
    const pos = []; const col = []; const idx = [];
    const snowC = new THREE.Color('#f5f7fc'); const rockC = new THREE.Color('#6a6563'); const lowC = new THREE.Color('#7a6c5a'); const hazeC = new THREE.Color('#aebfd6'); const tmp = new THREE.Color();
    for (let i = 0; i <= nx; i += 1) {
      const u = i / nx;
      let prof = 15 + 4 * Math.sin(u * 23 + seed) + 3 * Math.sin(u * 51 + seed * 2) + 5 * Math.abs(Math.sin(u * 37 + seed)) + 3 * Math.abs(Math.sin(u * 83 + seed * 3));
      bumps.forEach(([c, hh, w]) => { prof += hh * Math.exp(-(((u - c) / w) ** 2)); });
      for (let j = 0; j <= nz; j += 1) {
        const zz = (j / nz * 2 - 1) * dh;
        const f = Math.pow(1 - Math.abs(zz) / dh, 0.9);
        const y = prof * f * (1 + 0.1 * Math.sin(u * 40 + j * 2 + seed));
        pos.push((u - 0.5) * len, y, zz);
        const t = y / 115;
        tmp.copy(t < 0.2 ? lowC : rockC).lerp(snowC, Math.min(1, Math.max(0, (t - 0.18) / 0.06))).multiplyScalar(0.92 + 0.1 * Math.sin(u * 60 + j));
        tmp.lerp(hazeC, 0.3);
        col.push(tmp.r, tmp.g, tmp.b);
      }
    }
    for (let i = 0; i < nx; i += 1) {
      for (let j = 0; j < nz; j += 1) {
        const a = i * (nz + 1) + j; const b = a + 1; const c = a + nz + 1; const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };

  /* ---------- mountains ---------- */
  function peakGeo({ r, h, seg, hs, seed, snow, lean, rough, rock, low, haze, scree }) {
    const g = new THREE.CylinderGeometry(0.0001, r, h, seg, hs, true);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const snowC = new THREE.Color('#f5f7fc'); const rockC = new THREE.Color(rock); const lowC = new THREE.Color(low);
    const tmp = new THREE.Color(); const hazeC = new THREE.Color('#aebfd6'); const screeC = new THREE.Color('#8d8a84');
    for (let i = 0; i < pos.count; i += 1) {
      let x = pos.getX(i); let y = pos.getY(i); let z = pos.getZ(i);
      const t = (y + h / 2) / h;
      const a = Math.atan2(z, x);
      const n = Math.sin(a * 3 + seed * 1.7) * 0.5 + Math.sin(a * 5 + seed * 3.1) * 0.3 + Math.sin(a * 2 - t * 3 + seed) * 0.2;
      const s = (1 + rough * n * (1 - 0.4 * t) + 0.1 * Math.sin(t * 17 + a * 4 + seed) + 0.06 * Math.sin(t * 29 + a * 9 + seed * 2)) * (1 + (1 - t) * (1 - t) * 0.55);
      x *= s; z *= s;
      x += lean[0] * h * t * t; z += lean[1] * h * t * t;
      pos.setXYZ(i, x, y + h / 2, z);
      const sl = snow + 0.07 * Math.sin(a * 7 + seed + t * 9) + 0.05 * n;
      const k = Math.min(1, Math.max(0, (t - sl) / 0.05));
      tmp.copy(t < 0.3 ? lowC : rockC).lerp(snowC, k).multiplyScalar(0.9 + 0.12 * Math.sin(a * 7 + t * 13 + seed) + 0.06 * Math.sin(a * 13 + t * 21));
      if (scree && ((t > 0.28 && t < 0.36) || (t > 0.55 && t < 0.62))) tmp.lerp(screeC, 0.7);
      if (haze) tmp.lerp(hazeC, haze);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
  function Peak({ p, r, h, seg = 9, hs = 14, seed = 1, snow = 0.5, lean = [0, 0], rough = 0.28, rock = '#776f69', low = '#8a7a62', fog = true, haze = 0, scree = false, sc = [1, 1, 1] }) {
    const g = useMemo(() => peakGeo({ r, h, seg, hs, seed, snow, lean, rough, rock, low, haze, scree }), [r, h, seg, hs, seed, snow, rough, rock, low, haze, scree]);
    return <mesh geometry={g} position={p} scale={sc}><meshStandardMaterial vertexColors flatShading roughness={1} fog={fog} side={THREE.DoubleSide} /></mesh>;
  }

  /* =====================================================================================================
     MAIN: gompa on its stone terrace, stair, gate, chorten, mani heaps, flags
     ===================================================================================================== */
  function TengbocheMain() {
    const M = useM();
    const dusk = useDusk();
    const BASE = 1.0; // terrace height
    const TOP = 5.9; // right wing roof height (two storeys)
    const TOPL = 5.4; // left wing roof height
    const DT = 6.5; // dukhang roof height (wing roofline + 0.6)
    const z0 = 1.4; // dukhang front plane

    const white = useMemo(() => M.plain('#f3f0e8', { roughness: 0.9 }), [M]);
    const maroon = useMemo(() => M.plain('#8e2f29', { roughness: 0.85 }), [M]);
    const terraceM = useMemo(() => M.mat('stone', 7, 1, { color: '#bdb8ad' }), [M]);
    const roofDark = useMemo(() => M.plain('#59544d', { roughness: 1 }), [M]);
    const vc = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), []);
    const vcSide = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), []);
    const goldM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d4a62a', metalness: 0.65, roughness: 0.35 }), []);

    const built = useMemo(() => {
      const F = []; const G = []; const GL = []; const gold = []; const stairs = []; const flags = []; const slabs = [];

      /* --- windows: two rows of 7 small dark red-brown-framed windows per wing; left wing set back --- */
      const rowsR = [3.5, 4.6]; const rowsL = [3.4, 4.4];
      let k = 0;
      const winRow = (xs, rowsArr, z, face, alongX = true) => xs.forEach((a) => rowsArr.forEach((ry) => {
        if (alongX) addWin(F, (k % 5 === 0 ? GL : G), a, ry, z, face, 0.5, 0.62); else addWin(F, (k % 5 === 0 ? GL : G), z, ry, a, face, 0.5, 0.62);
        k += 1;
      }));
      const sp7 = (c) => [0, 1, 2, 3, 4, 5, 6].map((i) => c + (i - 3) * 0.8);
      winRow(sp7(6.5), rowsR, 0.4, '+z');
      winRow(sp7(-6.5), rowsL, -1.1, '+z');
      winRow([0, 1, 2, 3, 4, 5, 6, 7].map((i) => -0.6 - i * 1.3), rowsR, 9.6, '+x', false);
      winRow([0, 1, 2, 3, 4, 5, 6, 7].map((i) => -1.7 - i * 1.15), rowsL, -9.6, '-x', false);
      [-9, -7.2, -5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4, 7.2, 9].forEach((bx) => (bx < -3.4 ? rowsL : rowsR).forEach((ry) => {
        addWin(F, (k % 4 === 0 ? GL : G), bx, ry, -11.0, '-z', 0.5, 0.62); k += 1;
      }));
      // red-brown lintel bands above each window row on the wing fronts
      [[6.5, 0.4, rowsR], [-6.5, -1.1, rowsL]].forEach(([cx, zf, rw]) => rw.forEach((ry) => {
        F.push(mkBox([5.7, 0.07, 0.1], [cx, ry + 0.43, zf + 0.05], '#7a3224'));
      }));
      // small stepped turret on the right wing roof, with a gilded finial
      F.push(mkBox([2.4, 1.3, 3.0], [7.6, TOP + 0.65, -6.4], '#f3f0e8'));
      F.push(mkBox([2.6, 0.12, 3.2], [7.6, TOP + 1.36, -6.4], '#4b2a20'));
      [7.0, 8.2].forEach((x) => addWin(F, G, x, TOP + 0.7, -4.89, '+z', 0.5, 0.62));
      gold.push(mkCyl(0.09, 0.11, 0.3, 8, [7.6, TOP + 1.57, -6.4], '#d4a62a'));
      gold.push(mkCone(0.12, 0.45, 8, [7.6, TOP + 1.95, -6.4], '#d4a62a'));
      // grey dry-stone base course (1.7 high) round all wing sides, with darker courses
      [[1, 6.5, 0.4, -5.3, 11.4], [-1, -6.5, -1.1, -6.05, 9.9]].forEach(([sd, cx, zf, cz, d]) => {
        F.push(mkBox([6.2, 1.7, 0.2], [cx, BASE + 0.85, zf + 0.05], '#8d887d'));
        F.push(mkBox([6.2, 1.7, 0.2], [cx, BASE + 0.85, -10.95], '#8d887d'));
        F.push(mkBox([0.2, 1.7, d], [sd * 9.6, BASE + 0.85, cz], '#8d887d'));
        [0.55, 1.1].forEach((cy) => {
          F.push(mkBox([6.2, 0.04, 0.22], [cx, BASE + cy, zf + 0.05], '#6f6a60'));
          F.push(mkBox([0.22, 0.04, d], [sd * 9.6, BASE + cy, cz], '#6f6a60'));
        });
      });

      /* --- wing roof parapets, cornice band --- */
      [[1, 6.5, 0.4, TOP], [-1, -6.5, -1.1, TOPL]].forEach(([sd, cx, zf, TP]) => {
        const d = zf + 11; const cz = (zf - 11) / 2;
        F.push(mkBox([6.2, 0.4, 0.18], [cx, TP + 0.2, zf - 0.09], '#f6f4ee'));
        F.push(mkBox([6.2, 0.4, 0.18], [cx, TP + 0.2, -10.91], '#f6f4ee'));
        F.push(mkBox([0.18, 0.4, d], [sd * 9.51, TP + 0.2, cz], '#f6f4ee'));
        F.push(mkBox([6.2, 0.3, 0.12], [cx, TP - 0.5, zf + 0.06], '#4b2a20'));
        F.push(mkBox([6.2, 0.07, 0.14], [cx, TP - 0.31, zf + 0.06], '#c9a227'));
        F.push(mkBox([0.12, 0.3, d], [sd * 9.66, TP - 0.5, cz], '#4b2a20'));
        [[sd * 9.4, zf - 0.1], [sd * 9.4, -10.8], [sd * 3.7, zf - 0.1]].forEach(([x, z]) => {
          gold.push(mkCyl(0.09, 0.12, 0.2, 8, [x, TP + 0.5, z], '#d4a62a'));
          gold.push(mkCone(0.11, 0.3, 8, [x, TP + 0.75, z], '#d4a62a'));
        });
      });

      /* --- dukhang roof parapet, cornice and finials --- */
      F.push(mkBox([6.9, 0.5, 0.2], [0, DT + 0.15, z0 - 0.1], '#8f2f2a'));
      F.push(mkBox([6.9, 0.12, 0.22], [0, DT + 0.0, z0 - 0.1], '#2a1814'));
      F.push(mkBox([6.9, 0.5, 0.2], [0, DT + 0.15, -10.9], '#8f2f2a'));
      F.push(mkBox([0.2, 0.5, 12.4], [-3.4, DT + 0.15, -4.8], '#8f2f2a'));
      F.push(mkBox([0.2, 0.5, 12.4], [3.4, DT + 0.15, -4.8], '#8f2f2a'));
      [[-3.4, z0 - 0.1], [3.4, z0 - 0.1], [-3.4, -10.9], [3.4, -10.9]].forEach(([x, z]) => {
        gold.push(mkCyl(0.12, 0.16, 0.3, 8, [x, DT + 0.55, z], '#d4a62a'));
        gold.push(mkCone(0.15, 0.5, 8, [x, DT + 0.95, z], '#d4a62a'));
      });
      [[6.3, 0.2, 0.46, '#4a231f'], [6.16, 0.14, 0.38, '#c9a227'], [6.02, 0.16, 0.32, '#2b5aa8'], [5.9, 0.14, 0.27, '#2f8f55'], [5.8, 0.12, 0.22, '#b3322b']].forEach(([y, h, pr, c]) => {
        F.push(mkBox([7.1, h, pr + 0.05], [0, y, z0 + pr / 2 - 0.1], c));
        F.push(mkBox([pr, h, 12.4], [-3.5 - pr / 2 + 0.12, y, -4.8], c));
        F.push(mkBox([pr, h, 12.4], [3.5 + pr / 2 - 0.12, y, -4.8], c));
      });
      for (let i = 0; i < 17; i += 1) {
        F.push(mkBox([0.16, 0.14, 0.12], [-3.2 + i * 0.4, 6.06, z0 + 0.42], i % 2 ? '#f3efe2' : '#c9a227'));
      }

      const wy = 4.75; const wz = z0 + 0.1;
      F.push(mkBox([4.2, 1.7, 0.2], [0, wy, wz], '#f6f2ea'));
      F.push(mkBox([3.9, 1.5, 0.22], [0, wy, wz + 0.01], '#17120f'));
      for (let i = 0; i < 5; i += 1) F.push(mkBox([0.09, 1.52, 0.28], [-1.95 + i * 0.975, wy, wz + 0.04], '#f6f2ea'));
      for (let j = 0; j < 4; j += 1) F.push(mkBox([3.95, 0.08, 0.28], [0, wy - 0.75 + j * 0.5, wz + 0.04], '#f6f2ea'));
      F.push(mkBox([4.4, 0.2, 0.34], [0, wy - 0.95, wz + 0.1], '#f6f2ea'));
      for (let i = 0; i < 16; i += 1) F.push(mkBox([0.12, 0.14, 0.04], [-2.0 + i * 0.267, wy - 1.1, wz + 0.26], '#f6f2ea'));
      F.push(mkBox([4.5, 0.16, 0.5], [0, wy + 0.92, wz + 0.18], '#5b1f1b'));
      F.push(mkBox([4.5, 0.1, 0.52], [0, wy + 0.8, wz + 0.19], '#2b5aa8'));
      F.push(mkBox([4.5, 0.06, 0.54], [0, wy + 1.0, wz + 0.2], '#c9a227'));
      // painted red window surrounds either side of the window box
      [-2.85, 2.85].forEach((x) => {
        F.push(mkBox([0.8, 1.1, 0.12], [x, wy, wz + 0.0], '#6e1a14'));
        F.push(mkBox([0.46, 0.8, 0.14], [x, wy, wz + 0.02], '#17120f'));
        F.push(mkBox([0.9, 0.1, 0.18], [x, wy + 0.6, wz + 0.04], '#c9a227'));
        F.push(mkBox([0.9, 0.08, 0.18], [x, wy - 0.55, wz + 0.04], '#f1eee6'));
      });

      /* --- black double door, carved lintel, gold-edged balustrades --- */
      F.push(mkBox([2.5, 2.35, 0.2], [0, BASE + 1.18, z0 + 0.1], '#4a1c18'));
      F.push(mkBox([0.9, 2.05, 0.1], [-0.46, BASE + 1.03, z0 + 0.22], '#120e0d'));
      F.push(mkBox([0.9, 2.05, 0.1], [0.46, BASE + 1.03, z0 + 0.22], '#120e0d'));
      F.push(mkBox([0.04, 2.05, 0.12], [0, BASE + 1.03, z0 + 0.23], '#c9a227'));
      [-0.18, 0.18].forEach((x) => F.push(mkBox([0.12, 0.12, 0.05], [x, BASE + 1.0, z0 + 0.3], '#f0e6c8')));
      ['#2b5aa8', '#c9a227', '#2f8f55', '#b3322b', '#2b5aa8', '#c9a227', '#2f8f55'].forEach((c, i) => {
        F.push(mkBox([0.36, 0.3, 0.26], [-1.08 + i * 0.36, BASE + 2.5, z0 + 0.12], c));
      });
      F.push(mkBox([2.7, 0.07, 0.3], [0, BASE + 2.68, z0 + 0.14], '#c9a227'));
      [-1, 1].forEach((sd) => {
        F.push(mkBox([1.2, 0.5, 0.14], [sd * 1.95, BASE + 0.25, 2.2], '#17120f'));
        F.push(mkBox([1.2, 0.06, 0.18], [sd * 1.95, BASE + 0.53, 2.2], '#c9a227'));
        F.push(mkBox([0.12, 0.7, 0.12], [sd * 1.4, BASE + 0.35, 2.2], '#c9a227'));
        // red pilasters flanking the door (painted columns)
        F.push(mkBox([0.34, 2.35, 0.24], [sd * 1.46, BASE + 1.18, z0 + 0.12], '#7a2520'));
      });

      /* --- timber bay with yellow-glazed windows, left of the dukhang (against the set-back left wing) --- */
      F.push(mkBox([1.3, 3.4, 1.6], [-4.05, BASE + 1.7, -0.3], '#6d3c25'));
      F.push(mkBox([1.5, 0.14, 1.8], [-4.05, BASE + 3.45, -0.3], '#3c2418'));
      F.push(mkBox([1.5, 0.12, 1.8], [-4.05, BASE + 3.3, -0.3], '#2f8f55'));
      F.push(mkBox([1.5, 0.12, 1.8], [-4.05, BASE + 3.18, -0.3], '#b3322b'));
      [0, 1].forEach((r) => [0, 1, 2].forEach((c) => {
        F.push(mkBox([0.3, 0.7, 0.05], [-4.5 + c * 0.45, BASE + 1.0 + r * 1.2, 0.52], '#e9c23a'));
        F.push(mkBox([0.03, 0.72, 0.07], [-4.5 + c * 0.45 + 0.17, BASE + 1.0 + r * 1.2, 0.52], '#3b2418'));
      }));

      /* --- small roof turret behind the parapet, with a gilded finial (no pyramid roof) --- */
      F.push(mkBox([1.8, 0.9, 1.8], [0, DT + 0.45, -3.4], '#8f2f2a'));
      F.push(mkBox([1.95, 0.1, 1.95], [0, DT + 0.95, -3.4], '#2a1814'));
      gold.push(mkCyl(0.08, 0.1, 0.35, 8, [0, DT + 1.2, -3.4], '#d4a62a'));
      gold.push(mkBall(0.15, [0, DT + 1.45, -3.4], '#d4a62a'));
      gold.push(mkCone(0.1, 0.45, 8, [0, DT + 1.8, -3.4], '#d4a62a'));

      /* --- stone stair: 8 rough treads with stepped cheek walls --- */
      const rnd = rng(11);
      for (let i = 0; i < 8; i += 1) {
        const topY = (i + 1) * (BASE / 8);
        const zf = 6.4 - 0.35 * i;
        const g = (v) => { const q = Math.round(176 + v * 36); return `rgb(${q},${q - 4},${q - 12})`; };
        [-1.1, 0, 1.1].forEach((cx, j) => stairs.push(mkBox([1.12, topY, zf - 3.6], [cx, topY / 2, (zf + 3.6) / 2], g(rnd()), { r: [0, 0, (rnd() - 0.5) * 0.01] })));
        [-1, 1].forEach((sd) => stairs.push(mkBox([0.55, topY + 0.32, zf - 3.6], [sd * 2.0, (topY + 0.32) / 2, (zf + 3.6) / 2], g(rnd()))));
      }

      /* --- chorten (left of the axis, clear of the gate): stepped base, tall bell, harmika, 13-ring gilded spire --- */
      const ch = [];
      [[2.6, 0.26], [2.2, 0.26], [1.8, 0.26]].forEach(([w, h], i) => ch.push(mkBox([w, h, w], [0, 0.13 + i * 0.26, 0], i % 2 ? '#e6e2d8' : '#f7f4ee')));
      ch.push(mkBox([1.62, 0.05, 1.62], [0, 0.78, 0], '#c9a227'));
      const sp = [];
      sp.push(mkBox([0.8, 0.06, 0.8], [0, 2.75, 0], '#c9a227'));
      for (let i = 0; i < 13; i += 1) sp.push(mkCyl(0.36 - i * 0.018, 0.36 - i * 0.018 + 0.012, 0.11, 12, [0, 2.86 + i * 0.13, 0], '#d4a62a'));
      sp.push(mkCyl(0.1, 0.52, 0.18, 14, [0, 4.66, 0], '#d4a62a'));
      sp.push(mkCyl(0.08, 0.1, 0.3, 8, [0, 4.9, 0], '#d4a62a'));
      sp.push(mkBall(0.12, [0, 5.1, 0], '#d4a62a'));
      sp.push(mkCone(0.09, 0.6, 8, [0, 5.45, 0], '#d4a62a'));

      /* --- mani-stone heaps and wall --- */
      const r2 = rng(5);
      const heap = (cx, cz, w, d, hMax, n) => {
        for (let i = 0; i < n; i += 1) {
          const u = r2(); const v = r2();
          const x = cx + (u - 0.5) * w; const z = cz + (v - 0.5) * d;
          const hh = hMax * (1 - Math.pow(Math.abs(u - 0.5) * 2, 2) * 0.7) * (1 - Math.abs(v - 0.5) * 1.2);
          const sh = 0.55 + r2() * 0.3;
          slabs.push(mkBox([0.28 + r2() * 0.3, 0.22 + r2() * 0.2, 0.09 + r2() * 0.08], [x, Math.max(0.12, hh * r2()) + 0.1, z], `rgb(${Math.round(sh * 190)},${Math.round(sh * 188)},${Math.round(sh * 184)})`, { r: [(r2() - 0.5) * 0.5, r2() * 3, (r2() - 0.5) * 0.6] }));
        }
      };
      heap(5.4, 7.4, 1.3, 3.6, 0.85, 62);
      heap(-11.5, 9.0, 2.0, 1.0, 0.7, 30);
      heap(-1.9, 9.3, 0.9, 0.9, 0.5, 14);

      /* --- prayer flag poles and strings --- */
      const poles = [];
      [[3.15, 5.7, 4.9], [-7.2, 5.4, 4.3]].forEach(([x, z, h]) => poles.push(mkCyl(0.035, 0.05, h, 6, [x, h / 2, z], '#c8c3b5')));
      flagLine(flags, [3.15, 4.8, 5.7], [2.0, 3.1, 15.3], 14, 0.5);
      flagLine(flags, [-7.2, 4.2, 5.4], [-6.0, 6.4, 8.0], 12, 0.4);
      // long white prayer banner on the right pole
      const ban = new THREE.PlaneGeometry(0.42, 3.2); ban.translate(3.15, 3.1, 5.7 + 0.04);
      flags.push(paint(ban, '#f4f2ec'));

      return {
        F: mergeG(F), G: mergeG(G), GL: mergeG(GL), gold: mergeG(gold), stairs: mergeG(stairs), flags: mergeG(flags),
        slabs: mergeG(slabs), ch: mergeG(ch), sp: mergeG(sp), poles: mergeG(poles),
      };
    }, []);

    // chorten bell (lathe) built once
    const bellGeo = useMemo(() => {
      const pts = [[0.001, 0.78], [0.62, 0.78], [0.7, 0.95], [0.78, 1.3], [0.74, 1.75], [0.58, 2.1], [0.44, 2.22], [0.001, 2.22]].map(([r, y]) => new THREE.Vector2(r, y));
      return new THREE.LatheGeometry(pts, 24);
    }, []);

    /* ---- gate (separate from the gompa, in front of the courtyard) ---- */
    const gate = useMemo(() => {
      const F = []; const gold = [];
      const DY = 0.55; // wheel, deer and finial sit on the upper gilded tier
      [-1, 1].forEach((sd) => {
        const cx = sd * 1.6;
        F.push(mkBox([0.85, 0.3, 0.85], [cx, 0.15, 0], '#8c877c'));
        F.push(mkBox([0.55, 1.8, 0.55], [cx, 1.2, 0], '#b3261e'));
        F.push(mkBox([0.62, 0.12, 0.62], [cx, 0.42, 0], '#2f8a4d'));
        F.push(mkBox([0.62, 0.12, 0.62], [cx, 2.04, 0], '#2b5aa8'));
        [0.78, 1.22, 1.66].forEach((y, i) => [-1, 1].forEach((fz) => {
          F.push(mkCyl(0.18, 0.18, 0.05, 14, [cx, y, fz * 0.3], i % 2 ? '#2f8a4d' : '#2b5aa8', { r: [Math.PI / 2, 0, 0] }));
          F.push(mkCyl(0.11, 0.11, 0.06, 14, [cx, y, fz * 0.31], '#eedfa6', { r: [Math.PI / 2, 0, 0] }));
          F.push(mkCyl(0.05, 0.05, 0.07, 10, [cx, y, fz * 0.315], '#b3261e', { r: [Math.PI / 2, 0, 0] }));
        }));
      });
      // deep stack of painted beam ends under the roof
      [[2.2, 0.22, 0.85, '#2b5aa8'], [2.42, 0.18, 0.92, '#c9a227'], [2.62, 0.22, 1.0, '#2f8a4d'], [2.84, 0.16, 1.12, '#b3261e'], [3.0, 0.12, 1.24, '#e8bb2a']].forEach(([y, h, d, c], i) => {
        F.push(mkBox([4.2 + i * 0.22, h, d], [0, y, 0], c));
      });
      for (let i = 0; i < 22; i += 1) {
        const x = -2.1 + i * 0.2;
        [-1, 1].forEach((fz) => F.push(mkBox([0.12, 0.12, 0.08], [x, 2.38, fz * 0.5], i % 2 ? '#f3efe2' : '#b3261e')));
      }
      [-1, 1].forEach((fz) => F.push(mkBox([4.3, 0.06, 0.04], [0, 2.14, fz * 0.44], '#c9a227')));
      [[2.56, '#2b5aa8'], [2.74, '#2f8a4d'], [2.92, '#b3261e']].forEach(([y, c], j) => {
        for (let i = 0; i < 26; i += 1) [-1, 1].forEach((fz) => F.push(mkBox([0.11, 0.1, 0.1], [-2.5 + i * 0.2, y, fz * (0.56 + j * 0.03)], i % 2 ? '#f3efe2' : c)));
      });
      F.push(mkBox([6.0, 0.1, 1.5], [0, 3.1, 0], '#3b2418'));
      F.push(mkBox([5.7, 0.07, 1.3], [0, 3.02, 0], '#c9a227'));
      // pitched gilded roof (shallow gable, ridge along x) with up-curved eave corners, over the painted beam stack
      F.push(mkBox([6.4, 0.1, 2.1], [0, 3.17, 0], '#8f2f2a'));
      gold.push(mkGable(6.4, 2.1, 0.85, [0, 3.22, 0], '#d4a62a'));
      gold.push(mkCyl(0.08, 0.08, 6.2, 8, [0, 4.06, 0], '#e0b43a', { r: [0, 0, Math.PI / 2] }));
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sz) => gold.push(mkBox([0.6, 0.08, 0.32], [sx * 3.15, 3.34, sz * 0.9], '#d4a62a', { r: [0, 0, sx * 0.5] })));
        gold.push(mkCone(0.1, 0.4, 8, [sx * 3.12, 4.25, 0], '#d4a62a'));
      });
      // dharma wheel with two kneeling deer
      F.push(mkBox([0.5, 0.18, 0.34], [0, 3.55 + DY + 0.05, 0], '#b3261e'));
      gold.push(new THREE.TorusGeometry(0.4, 0.055, 8, 24));
      gold[gold.length - 1].translate(0, 4.1 + DY + 0.05, 0); paint(gold[gold.length - 1], '#d4a62a');
      for (let i = 0; i < 4; i += 1) gold.push(mkBox([0.05, 0.8, 0.05], [0, 4.15 + DY, 0], '#d4a62a', { r: [0, 0, (i * Math.PI) / 4] }));
      gold.push(mkBall(0.12, [0, 4.15 + DY, 0], '#e6bc3a'));
      gold.push(mkCone(0.07, 0.3, 8, [0, 4.67 + DY, 0], '#d4a62a'));
      [-1, 1].forEach((sd) => {
        const x = sd * 1.05; const f = -sd; const y0 = DY + 0.2; // face the wheel
        gold.push(mkBox([0.55, 0.22, 0.2], [x, 3.7 + y0 - 0.2, 0], '#d4a62a'));
        gold.push(mkBox([0.14, 0.34, 0.14], [x + f * 0.24, 3.88 + y0 - 0.2, 0], '#d4a62a', { r: [0, 0, -f * 0.2] }));
        gold.push(mkBox([0.22, 0.13, 0.12], [x + f * 0.34, 4.06 + y0 - 0.2, 0], '#d4a62a'));
        [-1, 1].forEach((az) => gold.push(mkBox([0.04, 0.26, 0.04], [x + f * 0.3, 4.24 + y0 - 0.2, az * 0.05], '#d4a62a', { r: [az * 0.25, 0, -f * 0.3] })));
        [-1, 1].forEach((az) => gold.push(mkBox([0.14, 0.1, 0.05], [x - f * 0.1, 3.58 + y0 - 0.2, az * 0.08], '#c39622')));
      });
      // snow lions at the gate base
      [-1, 1].forEach((sd) => {
        const x = sd * 2.45; const z = 0.7;
        F.push(mkBox([0.7, 0.34, 0.7], [x, 0.17, z], '#8c877c'));
        F.push(mkBox([0.3, 0.3, 0.5], [x, 0.5, z - 0.05], '#efe9d6'));
        F.push(mkBox([0.28, 0.4, 0.2], [x, 0.7, z + 0.15], '#efe9d6'));
        F.push(mkBall(0.17, [x, 0.9, z + 0.22], '#efe9d6'));
        F.push(mkBall(0.22, [x, 0.88, z + 0.12], '#2a8f86', { sc: [1.1, 1, 0.7] }));
        F.push(mkBox([0.07, 0.2, 0.07], [x - 0.09, 0.45, z + 0.28], '#efe9d6'));
        F.push(mkBox([0.07, 0.2, 0.07], [x + 0.09, 0.45, z + 0.28], '#efe9d6'));
        F.push(mkBox([0.2, 0.2, 0.1], [x, 0.58, z - 0.34], '#2a8f86'));
      });
      return { F: mergeG(F), gold: mergeG(gold) };
    }, []);

    const lamps = useMemo(() => {
      const L = [];
      for (let i = 0; i < 7; i += 1) L.push(mkBall(0.05, [-6.0 + (i - 3) * 0.3, 0.3, 9.9], '#ffd27a'));
      for (let i = 0; i < 6; i += 1) L.push(mkBall(0.045, [-1.9 + i * 0.75, BASE + 0.12, 3.0], '#ffd27a'));
      return mergeG(L);
    }, []);

    return (
      <group>
        {/* terrace of dry-laid grey stone */}
        <mesh position={[0, BASE / 2, -4.0]} material={terraceM} castShadow receiveShadow><boxGeometry args={[20.6, BASE, 15.2]} /></mesh>
        <Box s={[20.8, 0.1, 15.4]} p={[0, BASE + 0.0, -4.0]} m={M.plain('#9b968b', { roughness: 1 })} cast={false} />
        {/* gompa: central maroon dukhang, whitewashed wings */}
        <mesh position={[0, BASE + (DT - BASE) / 2, -4.8]} material={maroon} castShadow receiveShadow><boxGeometry args={[6.8, DT - BASE, 12.4]} /></mesh>
        <mesh position={[-6.5, BASE + (TOPL - BASE) / 2, -6.05]} material={white} castShadow receiveShadow><boxGeometry args={[6.2, TOPL - BASE, 9.9]} /></mesh>
        <mesh position={[6.5, BASE + (TOP - BASE) / 2, -5.3]} material={white} castShadow receiveShadow><boxGeometry args={[6.2, TOP - BASE, 11.4]} /></mesh>
        <mesh position={[-6.5, TOPL + 0.04, -6.05]} material={roofDark}><boxGeometry args={[6.2, 0.1, 9.9]} /></mesh>
        <mesh position={[6.5, TOP + 0.04, -5.3]} material={roofDark}><boxGeometry args={[6.2, 0.1, 11.4]} /></mesh>
        <mesh position={[0, DT + 0.04, -4.7]} material={roofDark}><boxGeometry args={[6.6, 0.1, 12.2]} /></mesh>
        <mesh geometry={built.F} material={vc} castShadow receiveShadow />
        <mesh geometry={built.G} material={useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b1a22', roughness: 0.35, metalness: 0.2 }), [])} />
        <mesh geometry={built.GL}><meshStandardMaterial color="#2a2418" roughness={0.4} emissive="#ffb04a" emissiveIntensity={dusk ? 2.2 : 0.05} /></mesh>
        <mesh geometry={built.gold} material={goldM} castShadow />
        <mesh geometry={built.stairs} material={vc} castShadow receiveShadow />

        {/* chorten, just inside the gate and left of the axis */}
        <group position={[-6.0, 0, 8.0]} scale={1.4}>
          <mesh geometry={built.ch} material={vc} castShadow receiveShadow />
          <mesh geometry={bellGeo} castShadow receiveShadow><meshStandardMaterial color="#f8f6f0" roughness={0.85} side={THREE.DoubleSide} /></mesh>
          <mesh geometry={built.sp} material={goldM} castShadow />
          <Box s={[0.9, 0.5, 0.9]} p={[0, 2.47, 0]} m={M.plain('#f7f4ee', { roughness: 0.85 })} />
          {/* painted niche band on the bell */}
          <mesh position={[0, 1.3, 0.77]}><boxGeometry args={[0.36, 0.34, 0.05]} /><meshStandardMaterial color="#b3261e" roughness={0.8} /></mesh>
        </group>

        {/* mani stones, flag poles and strings */}
        <mesh geometry={built.slabs} material={vc} castShadow receiveShadow />
        <mesh geometry={built.poles} material={vc} castShadow />
        <mesh geometry={built.flags} material={vcSide} />
        <mesh geometry={lamps}><meshBasicMaterial color="#ffd27a" toneMapped={false} /></mesh>

        {/* the painted entrance gate, on the stair axis */}
        <group position={[0, 0, 15.5]} scale={0.8}>
          <mesh geometry={gate.F} material={vc} castShadow receiveShadow />
          <mesh geometry={gate.gold} material={goldM} castShadow />
        </group>

        {dusk && (
          <group>
            <pointLight position={[0, 2.6, 3.6]} intensity={9} distance={9} color="#ffb259" />
            <pointLight position={[0, 3.0, 16.4]} intensity={6} distance={8} color="#ffb259" />
            <pointLight position={[-6.0, 1.5, 10.2]} intensity={5} distance={6} color="#ffb259" />
          </group>
        )}

        <Frame s={[21, 10, 19]} p={[0, 5, 2]} />
      </group>
    );
  }

  /* =====================================================================================================
     ENV: knoll, courtyard, monks' quarters, forest, ridges and the snow peaks
     ===================================================================================================== */
  function TengbocheEnv() {
    const M = useM();
    const dusk = useDusk();
    const vc = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 }), []);
    const treeM = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }), []);

    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(170, 24, 16);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
      const top = new THREE.Color(dusk ? '#241a52' : '#1559b5'); const mid = new THREE.Color(dusk ? '#9a5a78' : '#6fa8dc'); const hor = new THREE.Color(dusk ? '#f09a6a' : '#cfe3f2');
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.max(0, pos.getY(i) / 170);
        if (t < 0.3) tmp.copy(hor).lerp(mid, t / 0.3); else tmp.copy(mid).lerp(top, Math.min(1, (t - 0.3) / 0.7));
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, [dusk]);

    const built = useMemo(() => {
      const B = []; const roofs = []; const wins = []; const winsL = []; const stoneW = []; const snow = []; const stonep = []; const paving = []; const trees = []; const shrubs = []; const gold = []; const tents = [];
      const r = rng(23);

      /* buildings: [cx, cz, w(x), d(z), h, wall, roof, floors, goldPavilion] */
      const RED = '#8b2e2a'; const TIN = '#9c3a30';
      const blds = [
        [-12.7, 2.0, 4.4, 6.0, 3.0, RED, TIN, 2, true], // two-storey quarters flanking the courtyard (left), gilded pavilion behind
        [13.0, 1.5, 4.0, 5.0, 3.0, RED, TIN, 2, false], // two-storey quarters flanking the courtyard (right)
        [-18.5, -9.5, 5.4, 6.0, 3.0, RED, TIN, 2, false], // block behind-left
        [19.5, -10, 4.8, 5.4, 1.9, RED, TIN, 1, false],
        [-24.5, 4.5, 4.6, 3.8, 1.7, '#f4f1ea', TIN, 1, false],
        [-23.5, -4.0, 4.6, 3.4, 1.7, '#f4f1ea', TIN, 1, false],
        [-15, 33, 6.0, 3.4, 2.4, '#f4f1ea', TIN, 1, false], // trekker lodges in front of the gate
        [14, 36, 5.4, 3.2, 2.2, '#f4f1ea', TIN, 1, false],
        [-24, 28, 4.6, 3.2, 2.0, '#d9d4c4', TIN, 1, false],
      ];
      blds.forEach(([cx, cz, w, d, h, wall, roof, fl, pav]) => {
        B.push(mkBox([w, h, d], [cx, h / 2, cz], wall));
        B.push(mkBox([w + 0.1, 0.16, d + 0.1], [cx, 0.08, cz], '#9b968b'));
        if (fl === 2) B.push(mkBox([w + 0.06, 0.12, d + 0.06], [cx, h * 0.5 + 0.1, cz], '#f4f1ea')); // floor band
        roofs.push(mkGable(w + 0.7, d + 0.7, 0.95, [cx, h + 0.1, cz], roof));
        // white eave stripe
        const eh = 0.16; const ew = w + 0.7; const ed = d + 0.7;
        B.push(mkBox([ew, eh, 0.1], [cx, h + 0.08, cz + ed / 2 - 0.05], '#f4f1ea'));
        B.push(mkBox([ew, eh, 0.1], [cx, h + 0.08, cz - ed / 2 + 0.05], '#f4f1ea'));
        B.push(mkBox([0.1, eh, ed], [cx + ew / 2 - 0.05, h + 0.08, cz], '#f4f1ea'));
        B.push(mkBox([0.1, eh, ed], [cx - ew / 2 + 0.05, h + 0.08, cz], '#f4f1ea'));
        if (pav) {
          // small gilded pavilion roof rising behind the front wall
          B.push(mkBox([2.0, 1.0, 2.0], [cx - 0.3, h + 1.2, cz - 1.2], '#8b2e2a'));
          B.push(mkBox([2.3, 0.14, 2.3], [cx - 0.3, h + 1.74, cz - 1.2], '#2a1814'));
          gold.push(mkPyr(2.8, 2.8, 0.9, [cx - 0.3, h + 1.8, cz - 1.2], '#d4a62a'));
          gold.push(mkCyl(0.07, 0.07, 0.35, 8, [cx - 0.3, h + 2.9, cz - 1.2], '#d4a62a'));
          gold.push(mkCone(0.1, 0.4, 8, [cx - 0.3, h + 3.25, cz - 1.2], '#d4a62a'));
        }
        const ys = fl === 2 ? [h * 0.25 + 0.2, h * 0.75 - 0.2] : [1.15];
        [['+z', cz + d / 2, 'x'], ['-z', cz - d / 2, 'x'], ['+x', cx + w / 2, 'z'], ['-x', cx - w / 2, 'z']].forEach(([face, pl, along]) => {
          const len = along === 'x' ? w : d; const n = Math.max(1, Math.floor((len - 0.6) / 1.2));
          for (let i = 0; i < n; i += 1) {
            const off = (i - (n - 1) / 2) * 1.2;
            ys.forEach((y) => {
              const lit = r() < 0.3;
              const target = lit ? winsL : wins;
              if (along === 'x') addWin(B, target, cx + off, y, pl, face, 0.5, 0.65);
              else addWin(B, target, pl, y, cz + off, face, 0.5, 0.65);
            });
          }
        });
      });
      // camp tents in front of the gate
      [[-8.5, 31, '#e0762a'], [-11, 34.5, '#2b6cb8'], [9.5, 31.5, '#e8bb2a'], [11.5, 34, '#c8332b'], [5.5, 38, '#2f8a4d']].forEach(([x, z, c], i) => {
        tents.push(mkPyr(1.6, 2.0, 1.0, [x, 0, z], c));
        if (i % 2 === 0) tents.push(mkBox([0.05, 0.4, 0.05], [x + 1.2, 0.2, z + 0.6], '#c8c3b5'));
      });

      /* grey dry-stone enclosure walls beside the gate and round the knoll edge */
      const wall = (x0, x1, z0, z1, h, th = 0.55) => {
        const len = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
        const n = Math.round(len / 0.9);
        for (let i = 0; i < n; i += 1) {
          const t = (i + 0.5) / n;
          const x = x0 + (x1 - x0) * t; const z = z0 + (z1 - z0) * t;
          const sh = 0.62 + r() * 0.2;
          stoneW.push(mkBox([Math.abs(x1 - x0) > Math.abs(z1 - z0) ? len / n + 0.04 : th, h * (0.9 + r() * 0.2), Math.abs(x1 - x0) > Math.abs(z1 - z0) ? th : len / n + 0.04], [x, h / 2, z], `rgb(${Math.round(sh * 200)},${Math.round(sh * 196)},${Math.round(sh * 188)})`));
        }
      };
      wall(2.7, 9.8, 15.5, 15.5, 1.0);
      wall(-2.7, -9.8, 15.5, 15.5, 1.0);
      wall(9.8, 9.8, 6.2, 15.5, 0.9);
      wall(-9.8, -9.8, 6.2, 15.5, 0.9);
      // long dry-stone wall along the knoll rim (three arcs)
      const arcWall = (a0, a1, rad, h) => {
        const n = Math.round(Math.abs(a1 - a0) * rad / 1.0);
        for (let i = 0; i < n; i += 1) {
          const a = a0 + (a1 - a0) * (i + 0.5) / n; const sh = 0.6 + r() * 0.2;
          stoneW.push(mkBox([1.1, h * (0.85 + r() * 0.3), 0.55], [Math.cos(a) * rad, h / 2, Math.sin(a) * rad], `rgb(${Math.round(sh * 196)},${Math.round(sh * 192)},${Math.round(sh * 184)})`, { r: [0, -a - Math.PI / 2, 0] }));
        }
      };
      arcWall(2.5, 3.8, 25.5, 0.8);
      arcWall(-0.6, 0.6, 25.5, 0.8);
      arcWall(-2.5, -0.9, 25.5, 0.8);
      // flagstone paving of the courtyard (z 3 to 15), subtle
      for (let ix = -9; ix <= 9; ix += 1) {
        for (let iz = 0; iz < 12; iz += 1) {
          const k = 158 + Math.floor(r() * 26) - (r() < 0.1 ? 16 : 0);
          paving.push(mkBox([0.95, 0.04, 0.95], [ix * 1.05, 0.04, 3.5 + iz * 1.05], `rgb(${k},${k - 4},${k - 12})`));
        }
      }

      /* snow patches */
      [[-3.5, 19.5, 1.5], [7.5, 21.0, 1.2], [-15, 15.5, 1.5], [17, 9, 1.3], [-4, -14, 2.2], [9, -15, 1.8], [-20, 20, 1.2]].forEach(([x, z, rad]) => {
        const sh = new THREE.Shape(); const nn = 11; const ph = r() * 6;
        for (let i = 0; i < nn; i += 1) {
          const a = (i / nn) * TAU; const rr = rad * (0.45 + r() * 0.75) * (1 + 0.3 * Math.sin(a * 2 + ph));
          if (i === 0) sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.7); else sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.7);
        }
        const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
        g.rotateY(r() * 6); g.translate(x, 0.03, z); snow.push(paint(g, '#eef1f5'));
      });
      // grey stone and dark scrub patches: irregular 9-12-sided blobs, low contrast
      for (let i = 0; i < 26; i += 1) {
        const a = r() * TAU; const rad = 12 + r() * 14;
        const x = Math.cos(a) * rad; const z = Math.sin(a) * rad;
        if (Math.abs(hgt(x, z)) > 0.01) continue;
        const sh = new THREE.Shape(); const nn = 9 + Math.floor(r() * 4); const rr0 = 0.7 + r() * 1.1;
        for (let j = 0; j < nn; j += 1) {
          const aa = (j / nn) * TAU; const rr = rr0 * (0.6 + r() * 0.6);
          if (j === 0) sh.moveTo(Math.cos(aa) * rr * 1.3, Math.sin(aa) * rr * 0.8); else sh.lineTo(Math.cos(aa) * rr * 1.3, Math.sin(aa) * rr * 0.8);
        }
        const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.rotateY(r() * 6);
        g.translate(x, 0.025, z); stonep.push(paint(g, i % 3 === 0 ? '#76664c' : '#8b877d'));
      }

      /* conifers (fir / juniper) and rhododendron scrub on the slopes and edges */
      const pine = (x, y, z, s) => {
        trees.push(mkCyl(0.07 * s, 0.1 * s, 0.9 * s, 6, [x, y + 0.45 * s, z], '#4a3626'));
        [0, 1, 2, 3].forEach((i) => trees.push(mkCone((0.85 - i * 0.18) * s, 1.0 * s, 7, [x, y + (0.9 + i * 0.62) * s, z], i % 2 ? '#2b4a34' : '#23402d')));
      };
      const spots = [];
      for (let i = 0; i < 150; i += 1) {
        const a = r() * TAU; const rad = 26 + r() * 24;
        const x = Math.cos(a) * rad; const z = Math.sin(a) * rad;
        const y = hgt(x, z);
        if (y > -0.5 || y < -26) continue; // only on the slopes
        if (z > 20 && Math.abs(x) < 24) continue;
        spots.push([x, z, y]);
      }
      // a tight stand of dark pine on the left of the entrance (as in the approach photograph)
      for (let i = 0; i < 7; i += 1) spots.push([-28 + r() * 3, 8 + r() * 12, 0]);
      spots.forEach(([x, z]) => pine(x, hgt(x, z), z, 0.8 + r() * 0.7));
      for (let i = 0; i < 70; i += 1) {
        const a = r() * TAU; const rad = 16 + r() * 22;
        const x = Math.cos(a) * rad; const z = Math.sin(a) * rad;
        if (Math.abs(x) < 17 && z > -12 && z < 24) continue;
        if (hgt(x, z) < -26) continue;
        shrubs.push(mkBall(0.5 + r() * 0.5, [x, hgt(x, z) + 0.3, z], r() < 0.55 ? '#5d4a35' : '#4f5a34', { sc: [1.3, 0.7, 1.1] }));
      }

      return {
        B: mergeG(B), paving: mergeG(paving), stonep: mergeG(stonep), roofs: mergeG(roofs), wins: mergeG(wins), winsL: mergeG(winsL), stoneW: mergeG(stoneW), snow: mergeG(snow), trees: mergeG(trees), shrubs: mergeG(shrubs), gold: mergeG(gold), tents: mergeG(tents),
      };
    }, []);

    const groundM = useMemo(() => M.plain('#857a58', { roughness: 1 }), [M]);
    const pathM = useMemo(() => M.plain('#8f8368', { roughness: 1 }), [M]);
    const courtM = useMemo(() => M.plain('#a39f93', { roughness: 1 }), [M]);

    const goldM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d4a62a', metalness: 0.65, roughness: 0.35 }), []);
    const vcSideE = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }), []);
    const terrain = useMemo(() => {
      const N = 120; const g = new THREE.PlaneGeometry(260, 260, N, N);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
      const tan = new THREE.Color('#857a58'); const dry = new THREE.Color('#7a6e4c'); const dark = new THREE.Color('#5d4a35'); const olive = new THREE.Color('#5f5c40'); const grey = new THREE.Color('#7d776b');
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i);
        const y = hgt(x, z); pos.setY(i, y);
        const n = Math.sin(x * 0.21 + 1.3) * Math.sin(z * 0.17 + 0.5) + 0.6 * Math.sin(x * 0.53 + z * 0.41);
        tmp.copy(tan).lerp(dry, 0.5 + 0.5 * Math.sin(x * 0.4 + z * 0.3));
        if (y < -0.2) tmp.lerp(olive, 0.45); if (y < -0.2 && Math.abs(x) > 14) tmp.lerp(dark, 0.4);
        if (n > 0.55) tmp.lerp(dark, 0.6);
        if (y < -8 && n < -0.5) tmp.lerp(grey, 0.6);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const ridge = useMemo(() => ridgeGeo({ len: 150, dh: 22, seed: 3, bumps: [[0.2, 36, 0.1], [0.4, 20, 0.06], [0.72, 34, 0.09], [0.55, 12, 0.12], [0.88, 20, 0.05], [0.07, 16, 0.05]] }), []);
    const pathM2 = useMemo(() => M.plain('#8f8368', { roughness: 1 }), [M]);

    return (
      <group>
        {/* sky */}
        <mesh geometry={sky} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>

        {/* knoll plateau with an irregular, terraced fall into the valleys */}
        <mesh geometry={terrain} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -33, 0]}><circleGeometry args={[220, 40]} /><meshStandardMaterial color="#5b5744" roughness={1} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 9.3]} material={courtM} receiveShadow><planeGeometry args={[19.6, 12.6]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 26]} material={pathM2} receiveShadow><planeGeometry args={[3.0, 30]} /></mesh>
        <mesh geometry={built.paving} material={vc} receiveShadow />
        <mesh geometry={built.stonep} material={vc} receiveShadow />
        <mesh geometry={built.snow}><meshStandardMaterial color="#f2f4f7" roughness={0.9} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} /></mesh>

        {/* buildings, walls, tents, trees */}
        <mesh geometry={built.B} material={vc} castShadow receiveShadow />
        <mesh geometry={built.roofs} material={vcSideE} castShadow receiveShadow />
        <mesh geometry={built.gold} material={goldM} castShadow />
        <mesh geometry={built.tents} material={vc} castShadow />
        <mesh geometry={built.wins}><meshStandardMaterial color="#1b1a22" roughness={0.4} /></mesh>
        <mesh geometry={built.winsL}><meshStandardMaterial color="#2a2418" roughness={0.4} emissive="#ffb04a" emissiveIntensity={dusk ? 2.0 : 0.05} /></mesh>
        <mesh geometry={built.stoneW} material={vc} castShadow receiveShadow />
        <mesh geometry={built.trees} material={treeM} castShadow />
        <mesh geometry={built.shrubs} material={treeM} />

        {/* nearer spurs: broad, rounded, dry brown grass and grey scree, no snow */}
        <Peak p={[-62, -30, -14]} r={24} h={24} seg={12} hs={12} seed={3} snow={1.5} rock="#75684f" low="#665a47" rough={0.2} fog={false} scree sc={[1.8, 1, 0.9]} />
        <Peak p={[70, -30, -26]} r={24} h={26} seg={12} hs={12} seed={7} snow={1.5} rock="#716650" low="#665a47" rough={0.2} fog={false} scree sc={[1.8, 1, 0.9]} />
        <Peak p={[-92, -30, -92]} r={26} h={34} seg={10} hs={12} seed={12} snow={1.5} rock="#6a604e" low="#5f5546" rough={0.2} fog={false} scree haze={0.14} sc={[1.8, 1, 0.9]} />
        <Peak p={[92, -30, -92]} r={26} h={34} seg={10} hs={12} seed={14} snow={1.5} rock="#6c6250" low="#625848" rough={0.2} fog={false} scree haze={0.14} sc={[1.8, 1, 0.9]} />

        {/* Ama Dablam: tall, narrow and steep, dark rock flanks, white only on the upper ridges, a hanging-glacier shoulder; tip clear above the Dukhang roof on the left */}
        <Peak p={[-24, -30, -150]} r={19} h={82} seg={5} hs={26} seed={2} snow={0.6} lean={[0.02, 0]} rough={0.1} rock="#2f2b2b" low="#4e4238" haze={0.05} fog={false} />
        <Peak p={[-14, -30, -146]} r={8} h={52} seg={5} hs={14} seed={8} snow={0.3} rough={0.1} rock="#4a4644" low="#5a4e42" haze={0.05} fog={false} />

        {/* Nuptse-Lhotse wall: one long snowy ridge with unequal bumps, left of Ama Dablam; Everest peeps out behind and lower */}
        <mesh geometry={ridge} position={[-120, -30, -195]}><meshStandardMaterial vertexColors flatShading roughness={1} fog={false} side={THREE.DoubleSide} /></mesh>
        <Peak p={[-108, -30, -236]} r={22} h={62} seg={7} hs={16} seed={4} snow={0.38} rough={0.22} rock="#3d3a3a" low="#6a5d4c" haze={0.3} fog={false} />

        {/* Thamserku and Kangtega: one broad snowy massif to the right */}
        <Peak p={[70, -30, -190]} r={32} h={68} seg={8} hs={16} seed={10} snow={0.34} rough={0.28} rock="#66615f" low="#7a6c5a" haze={0.34} sc={[1.4, 1, 0.8]} fog={false} />
        <Peak p={[120, -30, -196]} r={32} h={64} seg={8} hs={16} seed={16} snow={0.34} rough={0.28} rock="#66615f" low="#7a6c5a" haze={0.38} sc={[1.4, 1, 0.8]} fog={false} />

        {dusk && (
          <group>
            <pointLight position={[-14, 2.5, 8]} intensity={3} distance={8} color="#ffb259" />
          </group>
        )}
        <Cyl rt={0.001} h={0.001} p={[0, -60, 0]} seg={3} m={M.dark} />
      </group>
    );
  }

  return { 'tengboche-monastery': { Main: TengbocheMain, Env: TengbocheEnv } };
}
