// Tansen Durbar (Palpa Durbar), Tansen: long curved deep-red 3-storey Rana palace, white pilasters, green lattice windows,
// small central porch, taller pyramid-roofed corner towers, white courtyard with arched upper gallery, paved town square.
export default function make(K) {
  const { useM, THREE, useMemo, Frame, Tree, Box, Cyl, Roof, Ball } = K;

  const RED = '#9a3a2e', PLINTH = '#6e2a22', WHITE = '#f2f0ea', CREAM = '#e9e4d8', ROOF = '#7a3328', DARK = '#2a1c18';
  const CW = '#f5f3ee', STONE = '#a99d8c', PGREEN = '#1f5a3c';

  /* ---------- merge-by-material accumulator: thousands of boxes become a handful of meshes ---------- */
  function Acc() {
    const groups = {};
    const slot = (k) => groups[k] || (groups[k] = { pos: [], nor: [], uv: [], idx: [], n: 0 });
    const add = (k, geo, p, ry = 0, rx = 0, rz = 0) => {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1], p[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
      geo.applyMatrix4(m);
      const s = slot(k);
      const P = geo.attributes.position.array, N = geo.attributes.normal.array, U = geo.attributes.uv ? geo.attributes.uv.array : null;
      const cnt = P.length / 3;
      for (let i = 0; i < P.length; i += 1) { s.pos.push(P[i]); s.nor.push(N[i]); }
      for (let i = 0; i < cnt; i += 1) { if (U) s.uv.push(U[2 * i], U[2 * i + 1]); else s.uv.push(0, 0); }
      if (geo.index) { const I = geo.index.array; for (let i = 0; i < I.length; i += 1) s.idx.push(I[i] + s.n); } else for (let i = 0; i < cnt; i += 1) s.idx.push(s.n + i);
      s.n += cnt;
      geo.dispose();
    };
    return {
      add,
      box: (k, s, p, ry = 0, rx = 0, rz = 0) => add(k, new THREE.BoxGeometry(s[0], s[1], s[2]), p, ry, rx, rz),
      build: () => Object.entries(groups).map(([k, s]) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(s.pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(s.nor, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(s.uv, 2));
        g.setIndex(s.idx);
        return [k, g];
      }),
    };
  }
  /* local frame at (x,z) turned by a: local +z points outward (sin a, cos a) */
  function Loc(acc, x, z, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const w = (p) => [x + p[0] * c + p[2] * s, p[1], z - p[0] * s + p[2] * c];
    return {
      box: (k, sz, p, dry = 0) => acc.box(k, sz, w(p), a + dry),
      geo: (k, g, p, dry = 0) => acc.add(k, g, w(p), a + dry),
    };
  }
  const prismCache = {};
  const prismGeo = (w, h, len) => {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.lineTo(-w / 2, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); return g;
  };
  const prism = (w, h, len) => { const k = `${w}|${h}|${len}`; if (!prismCache[k]) prismCache[k] = prismGeo(w, h, len); return prismCache[k].clone(); };
  const archGeo = (w, h, d) => {
    const sh = new THREE.Shape(); const r = w / 2;
    sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, h - r); sh.absarc(0, h - r, r, 0, Math.PI, false); sh.lineTo(-r, 0);
    return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
  };

  function useLattice() {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = 32; c.height = 48;
      const g = c.getContext('2d');
      g.fillStyle = '#2E6B4A'; g.fillRect(0, 0, 32, 48);
      for (let y = 4; y < 46; y += 4) { g.fillStyle = '#1f4d35'; g.fillRect(2, y, 28, 1); g.fillStyle = '#3c8159'; g.fillRect(2, y + 1, 28, 1); }
      g.strokeStyle = '#17382a'; g.lineWidth = 2; g.strokeRect(1, 1, 30, 46);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
    }, []);
  }
  function Merged({ build }) {
    const M = useM();
    const lat = useLattice();
    const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffd98a', emissive: '#ffb347', emissiveIntensity: 0.9, roughness: 0.6 }), []);
    const brickRed = useMemo(() => { const m = M.mat('brick', 1, 2, { color: '#ffb0a0' }).clone(); m.emissive = new THREE.Color('#7a2a20'); m.emissiveIntensity = 0.55; m.roughness = 1; return m; }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const brickDark = useMemo(() => M.mat('brick', 1, 1, { color: '#d98a78' }), []); // eslint-disable-line react-hooks/exhaustive-deps
    const roofMat2 = useMemo(() => M.plain(ROOF, { roughness: 0.95 }), []); // eslint-disable-line react-hooks/exhaustive-deps
    const parts = useMemo(() => { const a = Acc(); build(a); return a.build(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
      <group>
        {parts.map(([k, g]) => (
          <mesh key={k} geometry={g} material={k === 'lattice' ? lat : k === 'glow' ? glow : k === RED ? brickRed : k === PLINTH ? brickDark : k === ROOF ? roofMat2 : M.plain(k)} castShadow receiveShadow />
        ))}
      </group>
    );
  }


  /* ---------- geometry of the palace ---------- */
  const zf = (x) => 5.8 - 0.03 * x * x; // clearly curved bow of the long front
  const ang = (x) => Math.atan(0.06 * x);
  const ROWS = [0.95, 2.1, 3.25];
  const TW = 2.2; // corner tower width (flush with the end of the front)
  const bays = []; const xb = [];
  {
    const ws = [TW, 1.22, 1.22, 1.22, 1.22, 1.22, 1.22, 1.5, 1.22, 1.22, 1.22, 1.22, 1.22, 1.22, TW];
    let cx = -ws.reduce((s, v) => s + v, 0) / 2; xb.push(cx);
    ws.forEach((w, i) => { bays.push({ x: cx + w / 2, w, i }); cx += w; xb.push(cx); });
  }
  const XE = -xb[0]; // half front length (about 9.67)
  const TX = XE - TW / 2; // tower centre x
  const TFZ = 3.75; // tower front face z (sits on the arc end)
  const WH = 4.0; // red wall height; cornice 4.0-4.26, parapet to 4.6

  // a tall green-louvre window with thin white hood and sill (outer red facade)
  function win(L, y, w = 0.42, h = 0.78) {
    L.box(WHITE, [w + 0.08, h + 0.06, 0.04], [0, y, 0.15]);
    L.box('lattice', [w, h, 0.08], [0, y, 0.17]);
    L.box(WHITE, [w + 0.12, 0.04, 0.08], [0, y + h / 2 + 0.06, 0.19]);
  }
  // red-framed courtyard window
  function cwin(L, y, w, h) {
    L.box(RED, [w + 0.16, h + 0.14, 0.05], [0, y, 0.16]);
    L.box('lattice', [w, h, 0.07], [0, y, 0.19]);
    L.box(CREAM, [w + 0.2, 0.05, 0.1], [0, y - h / 2 - 0.1, 0.2]);
  }
  function archOpening(acc, L, y, w, h) {
    L.geo(RED, archGeo(w + 0.16, h + 0.08, 0.05), [0, y - 0.04, 0.14]);
    L.geo(DARK, archGeo(w, h, 0.05), [0, y, 0.18]);
    L.box(WHITE, [w + 0.16, 0.26, 0.1], [0, y - 0.15, 0.2]);
    L.box(WHITE, [w + 0.22, 0.05, 0.13], [0, y - 0.01, 0.2]);
  }

  // outer red bay: face point (fx,fz), outward angle a
  function redBay(acc, fx, fz, a, w, door = false, mid = false) {
    const L = Loc(acc, fx - 0.15 * Math.sin(a), fz - 0.15 * Math.cos(a), a);
    L.box(RED, [w + 0.01, WH, 0.3], [0, WH / 2, 0]);
    L.box(PLINTH, [w + 0.01, 0.32, 0.34], [0, 0.16, 0.02]);
    L.box(WHITE, [w + 0.01, 0.1, 0.34], [0, 1.55, 0.02]);
    L.box(WHITE, [w + 0.01, 0.1, 0.34], [0, 2.7, 0.02]);
    L.box(WHITE, [w + 0.01, 0.26, 0.5], [0, 4.13, 0.1]);
    L.box(WHITE, [w + 0.01, 0.3, 0.3], [0, 4.45, -0.02]);
    ROWS.forEach((y, r) => {
      if (door && r === 0) {
        L.box(WHITE, [0.86, 1.14, 0.05], [0, 0.89, 0.15]);
        L.box(DARK, [0.7, 1.0, 0.08], [0, 0.82, 0.17]);
        L.box(WHITE, [0.96, 0.08, 0.12], [0, 1.5, 0.2]);
        return;
      }
      if (mid && r === 2) { // balcony door
        L.box(WHITE, [0.74, 1.3, 0.05], [0, 3.35, 0.15]);
        L.box('lattice', [0.62, 1.2, 0.08], [0, 3.32, 0.17]);
        return;
      }
      win(L, y);
    });
  }
  function courtBay(acc, fx, fz, a, w) {
    const L = Loc(acc, fx - 0.15 * Math.sin(a), fz - 0.15 * Math.cos(a), a);
    L.box(CW, [w + 0.01, WH, 0.3], [0, WH / 2, 0]);
    L.box(RED, [w + 0.01, 0.3, 0.34], [0, 0.15, 0.02]);
    L.box(CREAM, [w + 0.01, 0.1, 0.34], [0, 1.55, 0.02]);
    L.box(CREAM, [w + 0.01, 0.1, 0.34], [0, 2.62, 0.02]);
    L.box(CREAM, [w + 0.01, 0.24, 0.42], [0, 4.1, 0.06]);
    L.box(CREAM, [w + 0.01, 0.12, 0.3], [0, 4.28, -0.02]);
    cwin(L, 0.82, 0.4, 0.9);
    cwin(L, 2.06, 0.4, 0.7);
    archOpening(acc, L, 2.86, 0.5, 0.74);
  }

  function buildPalace(a) {
    // --- front curved facade (bays between the two end towers) ---
    bays.forEach((b) => {
      if (b.i === 0 || b.i === bays.length - 1) return;
      const an = ang(b.x);
      redBay(a, b.x, zf(b.x), an, b.w, b.i === 7, b.i === 7);
      if (b.i >= 2 && b.i <= bays.length - 3) {
        // inner (courtyard) side of the front wing
        const o = 2.4;
        courtBay(a, b.x - o * Math.sin(an), zf(b.x) - o * Math.cos(an), an + Math.PI, b.w);
      }
      // very low roof segment, set back 0.2 m behind the parapet
      a.add(ROOF, prism(2.2, 0.3, b.w + 0.02), [b.x - 1.3 * Math.sin(an), 4.1, zf(b.x) - 1.3 * Math.cos(an)], Math.PI / 2 + an);
    });
    // white pilasters between bays (plinth to cornice)
    xb.forEach((x, k) => {
      if (k < 2 || k > xb.length - 3) return;
      const an = ang(x); const L = Loc(a, x - 0.15 * Math.sin(an), zf(x) - 0.15 * Math.cos(an), an);
      L.box(WHITE, [0.3, 4.2, 0.5], [0, 2.1, 0.06]);
      L.box(WHITE, [0.4, 0.3, 0.56], [0, 0.15, 0.07]);
      L.box(WHITE, [0.4, 0.14, 0.56], [0, 3.96, 0.07]);
    });
    // --- porch: squat red piers on white diamond panels, short balcony, signboard, low thick canopy, 4-step stair ---
    const z0 = zf(0);
    const P = Loc(a, 0, z0 - 0.15, 0);
    P.box(STONE, [2.8, 0.3, 1.4], [0, 0.15, 0.85]);
    [0, 1, 2, 3].forEach((k) => P.box(STONE, [2.6, 0.24 - 0.06 * k, 0.25], [0, (0.24 - 0.06 * k) / 2, 1.65 + 0.25 * k]));
    [-0.95, 0.95].forEach((x) => {
      P.box(WHITE, [0.55, 0.6, 0.55], [x, 0.6, 1.0]);
      P.box(RED, [0.4, 1.7, 0.4], [x, 1.75, 1.0]);
      P.box(WHITE, [0.52, 0.12, 0.52], [x, 2.66, 1.0]);
      P.box(RED, [0.16, 0.16, 0.02], [x, 0.62, 1.29], Math.PI / 4);
    });
    P.box(WHITE, [2.7, 0.16, 1.55], [0, 2.8, 0.92]); // balcony slab
    P.box(WHITE, [2.6, 0.4, 0.07], [0, 3.08, 1.66]); // balustrade front
    P.box(WHITE, [0.07, 0.4, 1.5], [-1.28, 3.08, 0.94]);
    P.box(WHITE, [0.07, 0.4, 1.5], [1.28, 3.08, 0.94]);
    P.box('#fbf8ee', [2.5, 0.6, 0.07], [0, 3.58, 1.68]); // wide signboard
    P.box(RED, [2.2, 0.12, 0.02], [0, 3.72, 1.73]);
    P.box(RED, [1.7, 0.08, 0.02], [0, 3.46, 1.73]);
    [-1.25, 1.25].forEach((x) => P.box(WHITE, [0.09, 1.0, 0.09], [x, 3.6, 1.64]));
    // low, thick dark-green canopy over the balcony
    const zc = z0 - 0.15 + 0.95;
    a.add(PGREEN, new THREE.BoxGeometry(3.0, 0.2, 1.8), [0, 4.16, zc], 0, 0.08);
    a.box(PGREEN, [3.0, 0.26, 0.1], [0, 4.06, zc + 0.9]);
    // --- corner towers: stout square blocks about a third above the roofline, low hipped cap, white corner pilasters ---
    const tower = (sx) => {
      const xc = sx * TX; const T = 5.6; const zc2 = TFZ - TW / 2;
      a.box(RED, [TW + 0.06, T, TW], [xc, T / 2, zc2]);
      a.box(PLINTH, [TW + 0.14, 0.32, TW + 0.1], [xc, 0.16, zc2]);
      [1.55, 2.7, 4.3].forEach((y) => a.box(WHITE, [TW + 0.12, 0.1, TW + 0.08], [xc, y, zc2]));
      a.box(WHITE, [TW + 0.24, 0.24, TW + 0.2], [xc, 5.4, zc2]);
      a.box(WHITE, [TW + 0.02, 0.26, TW - 0.04], [xc, 5.73, zc2]);
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([qx, qz]) => a.box(WHITE, [0.3, T, 0.3], [xc + qx * (TW / 2 - 0.04), T / 2, zc2 + qz * (TW / 2 - 0.04)]));
      a.add(ROOF, new THREE.ConeGeometry(1.75, 0.5, 4), [xc, 6.11, zc2], Math.PI / 4);
      a.box(WHITE, [0.07, 0.4, 0.07], [xc, 6.5, zc2]);
      const LF = Loc(a, xc, TFZ - 0.13, 0);
      [0.95, 2.1, 3.25].forEach((y) => [-0.5, 0.5].forEach((dx) => { const L1 = Loc(a, xc + dx, TFZ - 0.13, 0); win(L1, y); }));
      win(LF, 4.85, 0.34, 0.56);
      [sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? Math.PI / 2 : -Math.PI / 2].forEach((an) => {
        const Ls = Loc(a, xc + Math.sin(an) * (TW / 2 - 0.1), zc2, an);
        win(Ls, 4.85, 0.34, 0.56);
      });
    };
    tower(-1); tower(1);
    // --- side wings and back wing (plain red outside, white courtyard inside) ---
    for (let i = 0; i < 8; i += 1) {
      const z = -5.6 + 1.2 * i;
      redBay(a, XE, z, Math.PI / 2, 1.2); redBay(a, -XE, z, -Math.PI / 2, 1.2);
      if (i >= 2 && i <= 6) { courtBay(a, XE - 2.4, z, -Math.PI / 2, 1.2); courtBay(a, -XE + 2.4, z, Math.PI / 2, 1.2); }
    }
    for (let i = 0; i < 15; i += 1) {
      const x = -XE + (2 * XE) / 15 * (i + 0.5);
      redBay(a, x, -6.2, Math.PI, (2 * XE) / 15);
    }
    for (let i = 0; i < 12; i += 1) courtBay(a, -6.6 + 1.2 * i, -3.8, 0, 1.2);
    a.add(ROOF, prism(2.2, 0.3, 9.2), [XE - 1.2, 4.1, -1.6]);
    a.add(ROOF, prism(2.2, 0.3, 9.2), [-XE + 1.2, 4.1, -1.6]);
    a.add(ROOF, prism(2.2, 0.3, 2 * XE - 2.0), [0, 4.1, -5.0], Math.PI / 2);
    // --- courtyard floor: brick paving ring, lawn, old stone foundation ---
    a.box('#8a6050', [14.4, 0.05, 6.4], [0, 0.025, -0.6]);
    a.box('#6f8f3e', [12.0, 0.06, 4.4], [0, 0.04, -0.6]);
    a.box('#8c8b84', [3.2, 0.12, 1.1], [3.2, 0.06, -1.5]);
    a.box('#8c8b84', [1.2, 0.12, 2.6], [-3.4, 0.06, -1.0]);
  }

  function TansenMain() {
    return (
      <group>
        <Merged build={buildPalace} />
        <Frame s={[21, 7.8, 13]} p={[0, 3.8, -0.2]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const sm = (a0, b0, x) => { const t = Math.min(1, Math.max(0, (x - a0) / (b0 - a0))); return t * t * (3 - 2 * t); };
  const STEP = 5.5;
  // broad terraced slope behind (and beside) the palace: three wide, smoothly-risen steps
  const terrInfo = (x, z) => {
    const back = sm(-13, -52, z);
    const side = sm(30, 56, Math.abs(x)) * sm(14, -6, z);
    const edge = 1 - sm(50, 60, Math.hypot(x, z));
    const hRaw = 17 * Math.max(back * (0.8 + 0.2 * Math.cos(x / 15)), side * 0.85) * edge;
    const k = Math.floor(hRaw / STEP); const fr = hRaw / STEP - k;
    return { y: (k + sm(0.6, 0.88, fr)) * STEP, k, fr };
  };
  const hillY = (x, z) => terrInfo(x, z).y;
  const WALLS = ['#e9d9b8', '#d9a79a', '#c9d3d0', '#f0e6d0', '#cfae7e', '#e7c4a0', '#b9c7d6', '#d8dccf'];
  const TIN = ['#8b4a3a', '#5e6e78', '#a2583f', '#707a80', '#7a3f35'];
  function house(a, x, y, z, w, d, fl, rot = 0) {
    const c = WALLS[Math.floor(rnd() * WALLS.length)], t = TIN[Math.floor(rnd() * TIN.length)];
    const h = fl * 0.9;
    a.box('#8a8272', [w + 0.2, 1.4, d + 0.2], [x, y - 0.55, z], rot);
    a.box(c, [w, h + 0.5, d], [x, y + h / 2 - 0.25, z], rot);
    const rv = rnd();
    if (rv < 0.5) a.add(t, prism(d + 0.3, 0.45, w + 0.3), [x, y + h, z], Math.PI / 2 + rot);
    else if (rv < 0.8) a.add(t, prism(w + 0.3, 0.4, d + 0.3), [x, y + h, z], rot);
    else { a.box('#cfc8b8', [w + 0.12, 0.18, d + 0.12], [x, y + h + 0.1, z], rot); a.box('#4f7a8c', [w * 0.35, 0.5, d * 0.35], [x + w * 0.15, y + h + 0.4, z], rot); }
    const L = Loc(a, x, z, rot);
    for (let f = 0; f < fl; f += 1) {
      const n = Math.max(2, Math.round(w / 0.6));
      for (let i = 0; i < n; i += 1) {
        const lx = (i - (n - 1) / 2) * (w / n);
        L.box(rnd() < 0.18 ? 'glow' : '#33424e', [0.2, 0.3, 0.04], [lx, y + 0.45 + f * 0.9, d / 2 + 0.02]);
      }
    }
  }
  const SHOPC = ['#e8d9b6', '#d9b8a0', '#cfd6c9', '#e2c7a3', '#c9c3d6', '#ecdcc4'];
  const SIGNC = ['#b83a30', '#2f6aa8', '#d79a2a', '#2e7a52', '#a23d7a'];
  // contiguous 3-4 storey concrete shop block (flat roof, shutters below, signs, window rows)
  function shop(a, x, z, w, d, fl, rot, c, sign) {
    const h = fl * 1.15 + 0.2;
    a.box(c, [w, h, d], [x, h / 2, z], rot);
    const L = Loc(a, x, z, rot);
    L.box('#ece6d6', [w + 0.06, 0.25, d + 0.06], [0, h + 0.12, 0]);
    L.box('#46525c', [w * 0.8, 0.85, 0.06], [0, 0.45, d / 2 + 0.02]);
    L.box(sign, [w * 0.92, 0.3, 0.08], [0, 1.15, d / 2 + 0.04]);
    for (let f = 1; f < fl; f += 1) {
      for (let i = 0; i < 3; i += 1) {
        const lx = (i - 1) * (w / 3.1);
        L.box('#e8e2d2', [0.62, 0.74, 0.05], [lx, 0.55 + f * 1.15, d / 2 + 0.02]);
        L.box(f === 2 && i === 1 ? 'glow' : '#33424e', [0.5, 0.62, 0.07], [lx, 0.55 + f * 1.15, d / 2 + 0.03]);
      }
    }
  }
  function Town() {
    return (
      <Merged
        build={(a) => {
          // houses climbing the terraced slopes behind and beside
          for (let i = 0; i < 46; i += 1) {
            const x = (rnd() - 0.5) * 100, z = -16 - rnd() * 40;
            if (Math.hypot(x, z) > 54) continue;
            house(a, x, hillY(x, z), z, 1.2 + rnd() * 0.9, 1.1 + rnd() * 0.5, 2 + Math.floor(rnd() * 2));
          }
          for (let i = 0; i < 12; i += 1) {
            const sx = rnd() < 0.5 ? -1 : 1; const x = sx * (34 + rnd() * 16), z = -6 + rnd() * 16;
            house(a, x, hillY(x, z), z, 1.3 + rnd() * 0.8, 1.2 + rnd() * 0.4, 2 + Math.floor(rnd() * 2));
          }
          // old town rows right behind the palace
          for (let i = 0; i < 15; i += 1) house(a, -19 + i * 2.7 + rnd(), 0, -11 - rnd() * 2.2, 1.6 + rnd() * 0.8, 1.4, 3 + (rnd() < 0.4 ? 1 : 0));
          // 3-4 storey shops closing the square on both sides
          for (let i = 0; i < 6; i += 1) {
            shop(a, 30.5, -7 + 5.6 * i, 5.5, 5, 3 + (i % 3 === 1 ? 1 : 0), -Math.PI / 2, SHOPC[i % 6], SIGNC[i % 5]);
            shop(a, -30.5, -7 + 5.6 * i, 5.5, 5, 3 + (i % 2 === 0 ? 1 : 0), Math.PI / 2, SHOPC[(i + 2) % 6], SIGNC[(i + 3) % 5]);
          }
          // modern concrete shops beyond the roofline
          [[-9, -15, 4], [9, -15.5, 3], [15, -14, 4], [-3, -16, 3]].forEach(([x, z, f]) => house(a, x, 0, z, 2.4, 2, f));
          // lamp posts and bulbs on the square
          [[-16, 22], [18, 22], [-5, 24], [8, 24]].forEach(([x, z]) => {
            a.box('#3a3a3a', [0.08, 2.6, 0.08], [x, 1.3, z]);
            a.box('glow', [0.26, 0.2, 0.26], [x, 2.7, z]);
          });
          // parked vehicles in front of the porch: SUV and pick-up
          const wheel = (x, z, ry, wx, wz) => a.add('#151515', new THREE.CylinderGeometry(0.24, 0.24, 0.18, 12), [x + wx * Math.cos(ry) + wz * Math.sin(ry), 0.24, z - wx * Math.sin(ry) + wz * Math.cos(ry)], ry, 0, Math.PI / 2);
          const suv = (x, z, ry, body) => {
            const L = Loc(a, x, z, ry);
            L.box(body, [1.05, 0.46, 2.1], [0, 0.5, 0]);
            L.box(body, [0.98, 0.5, 1.4], [0, 0.98, -0.15]);
            L.box('#1d2830', [1.0, 0.34, 1.3], [0, 1.0, -0.15]);
            L.box(body, [1.0, 0.06, 1.2], [0, 1.26, -0.15]);
            L.box('#cfd6d8', [0.3, 0.14, 0.04], [0, 0.55, 1.07]);
            L.box('glow', [0.2, 0.1, 0.04], [-0.38, 0.62, 1.06]); L.box('glow', [0.2, 0.1, 0.04], [0.38, 0.62, 1.06]);
            L.box('#222', [1.1, 0.12, 0.1], [0, 0.3, 1.08]);
            [[-0.54, 0.7], [0.54, 0.7], [-0.54, -0.7], [0.54, -0.7]].forEach(([wx, wz]) => wheel(x, z, ry, wx, wz));
          };
          const pick = (x, z, ry, body) => {
            const L = Loc(a, x, z, ry);
            L.box(body, [1.0, 0.4, 2.3], [0, 0.46, 0]);
            L.box(body, [0.96, 0.46, 0.85], [0, 0.88, 0.45]);
            L.box('#1d2830', [0.98, 0.3, 0.75], [0, 0.92, 0.46]);
            L.box(body, [0.96, 0.04, 0.9], [0, 1.12, 0.45]);
            L.box(body, [1.02, 0.28, 0.06], [0, 0.78, -0.5]);
            L.box('#222', [0.9, 0.04, 1.0], [0, 0.68, -0.62]);
            L.box('glow', [0.2, 0.1, 0.04], [-0.35, 0.62, 1.16]); L.box('glow', [0.2, 0.1, 0.04], [0.35, 0.62, 1.16]);
            [[-0.54, 0.75], [0.54, 0.75], [-0.54, -0.75], [0.54, -0.75]].forEach(([wx, wz]) => wheel(x, z, ry, wx, wz));
          };
          suv(4.0, 12.2, 0.3, '#3d4a3a'); pick(1.2, 12.4, -0.2, '#ecece6');
        }}
      />
    );
  }
  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(124, 80, 62, 40); g.rotateX(-Math.PI / 2); g.translate(0, 0, -62 + 40);
      const pos = g.attributes.position; const col = [];
      const tops = ['#789a4a', '#86a84a', '#7a9c42', '#8db053'].map((h) => new THREE.Color(h));
      const riser = new THREE.Color('#9c8f58'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const { y, k, fr } = terrInfo(pos.getX(i), pos.getZ(i));
        pos.setY(i, y - 0.02);
        c.copy(tops[Math.min(3, k)]); if (fr > 0.6 && k < 3) c.lerp(riser, 0.7 * sm(0.6, 0.75, fr) * (1 - sm(0.88, 0.97, fr)));
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={0.95} /></mesh>;
  }
  function Ridges() {
    const M = useM();
    return (
      <group>
        <group position={[-14, 0, -76]} scale={[1, 1, 0.5]}><Cyl rt={14} rb={50} h={26} seg={24} m={M.plain('#8aa39c')} /></group>
        <group position={[42, 0, -68]} scale={[1, 1, 0.5]}><Cyl rt={8} rb={34} h={20} seg={24} m={M.plain('#93aaa5')} /></group>
      </group>
    );
  }
  function SmallTemple({ p, s = 1, rot = 0, one = false }) {
    const M = useM();
    const brick = M.mat('brick', 2, 2, { color: '#f0c2a8' });
    const roof = M.mat('roof', 3, 3, { color: '#8a5e4c' });
    return (
      <group position={p} scale={s} rotation={[0, rot, 0]}>
        <Box s={[4.0, 0.25, 4.0]} p={[0, 0.125, 0]} m={M.stone} />
        <Box s={[3.5, 0.25, 3.5]} p={[0, 0.375, 0]} m={M.stone} />
        <Box s={[1.9, one ? 1.9 : 1.5, 1.9]} p={[0, one ? 1.45 : 1.25, 0]} m={brick} />
        <Box s={[0.7, 1.0, 0.06]} p={[0, 1.0, 0.97]} m={M.plain('#3a2a20')} />
        <Roof w={3.2} d={3.2} h={0.75} y={one ? 2.4 : 2.0} m={roof} />
        {!one && <Box s={[1.1, 0.8, 1.1]} p={[0, 2.8, 0]} m={brick} />}
        {!one && <Roof w={2.2} d={2.2} h={0.65} y={3.2} m={roof} />}
        <Cyl rt={0.02} rb={0.2} h={0.7} p={[0, one ? 3.5 : 4.2, 0]} m={M.gold} seg={8} />
        <Ball rad={0.14} p={[0, one ? 3.95 : 4.65, 0]} m={M.gold} />
      </group>
    );
  }
  function Sitalpati({ p }) {
    const M = useM();
    const roof = M.mat('roof', 3, 3, { color: '#8a5e4c' });
    return (
      <group position={p}>
        <Cyl rt={2.3} rb={2.4} h={0.5} p={[0, 0.25, 0]} seg={8} m={M.stone} />
        {Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * Math.PI * 2 + Math.PI / 8; return <Cyl key={i} rt={0.09} rb={0.1} h={1.6} p={[Math.sin(t) * 1.95, 1.3, Math.cos(t) * 1.95]} m={M.plain('#d6c9a8')} seg={8} />; })}
        <Cyl rt={2.1} rb={2.1} h={0.18} p={[0, 2.18, 0]} seg={8} m={M.plain('#e8dcc0')} />
        <Cyl rt={0.15} rb={2.7} h={1.1} p={[0, 2.85, 0]} seg={8} m={roof} />
        <Cyl rt={0.03} rb={0.06} h={0.5} p={[0, 3.65, 0]} m={M.gold} seg={8} />
      </group>
    );
  }
  function TansenEnv() {
    const M = useM();
    const trees = [[14.5, -3, 1.2], [13.5, 7, 1], [-13.5, -3, 1.3], [-21, -9, 1.3], [21, -9, 1.4], [20, 14, 1.1], [-24, 18, 1.2], [24, 20, 1.2]];
    return (
      <group>
        <Cyl rt={62} rb={62} h={0.2} p={[0, -0.11, 0]} seg={48} m={M.plain('#789a4a')} />
        <Box s={[56, 0.1, 34]} p={[0, -0.02, 7.5]} m={M.plain('#8f897c')} cast={false} />
        <Box s={[58, 0.09, 14]} p={[0, -0.03, -9]} m={M.plain('#9a8e7c')} cast={false} />
        <Box s={[14, 0.09, 6]} p={[-6, -0.01, 17]} m={M.plain('#aa9e8e')} cast={false} />
        <Terrain />
        <Ridges />
        <Town />
        <SmallTemple p={[-23, 0, 5]} s={1.15} rot={0.3} />
        <SmallTemple p={[-17.5, 0, -1]} s={0.85} rot={0.1} one />
        <Sitalpati p={[-26, 0, 14]} />
        {trees.map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s} kind="broad" />)}
      </group>
    );
  }

  return { 'tansen-durbar': { Main: TansenMain, Env: TansenEnv } };
}
