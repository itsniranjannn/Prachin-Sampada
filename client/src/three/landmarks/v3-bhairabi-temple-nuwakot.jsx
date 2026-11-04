// Bhairabi Temple, Nuwakot (Bidur, Bagmati). A SQUAT two-roof copper pagoda (lower roof very wide, upper roof ~60% of it, gilded
// pinnacle) of dark carved timber and red brick, red bell-hung fringes on both eaves, on a low brick terrace in a quiet hilltop
// courtyard. Door faces west = +z, guarded by two pairs of lions. Stone stupa front-left, cream Rana-style house to the north (+x).
// Hilltop ridge: terraced slopes drop away, the Trishuli runs far below, layered blue hills behind. Heights are photo estimates.
// Scale: lower roof 7.2 units wide (about 11 m), roughly 0.65 units per metre.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Tree, Lion, Diyo, PrayerFlags, Chaitya, GroundDisc, curvedRoofGeometry, THREE, useMemo } = K;
  const V3 = THREE.Vector3;
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _one = new V3(1, 1, 1);
  const Y = new V3(0, 1, 0);

  /* merge many boxes into ONE geometry. item: {s:[w,h,d], p:[x,y,z], r?:[rx,ry,rz], q?:Quaternion} */
  function boxesGeo(list) {
    const P = []; const N = []; const U = []; const I = [];
    let off = 0;
    list.forEach((b) => {
      const g = new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]);
      if (b.q) _q.copy(b.q); else _q.setFromEuler(_e.set(...(b.r || [0, 0, 0])));
      _m.compose(new V3(b.p[0], b.p[1], b.p[2]), _q, _one);
      g.applyMatrix4(_m);
      const pa = g.attributes.position.array; const na = g.attributes.normal.array; const ua = g.attributes.uv.array;
      for (let i = 0; i < pa.length; i += 1) P.push(pa[i]);
      for (let i = 0; i < na.length; i += 1) N.push(na[i]);
      for (let i = 0; i < ua.length; i += 1) U.push(ua[i]);
      const ia = g.index.array;
      for (let i = 0; i < ia.length; i += 1) I.push(ia[i] + off);
      off += g.attributes.position.count;
      g.dispose();
    });
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    G.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    G.setIndex(I);
    return G;
  }
  const Bx = ({ list, m, cast = true }) => {
    const g = useMemo(() => boxesGeo(list), [list]);
    return <mesh geometry={g} material={m} castShadow={cast} receiveShadow />;
  };
  /* a slanted strut from a to b */
  function strut(a, b, th = 0.1) {
    const A = new V3(...a); const B = new V3(...b);
    const d = B.clone().sub(A); const len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(Y, d.normalize());
    return { s: [th, len, th * 0.75], p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], q };
  }
  /* rotate a list of local boxes (front = +z) by k quarter turns about y */
  const rotList = (list, k) => list.map((b) => {
    const c = Math.cos(k * Math.PI / 2); const s = Math.sin(k * Math.PI / 2);
    const [x, y, z] = b.p;
    const qk = new THREE.Quaternion().setFromAxisAngle(Y, k * Math.PI / 2);
    const q0 = b.q ? b.q.clone() : new THREE.Quaternion().setFromEuler(_e.set(...(b.r || [0, 0, 0])));
    return { s: b.s, p: [x * c + z * s, y, -x * s + z * c], q: qk.multiply(q0) };
  });
  const all4 = (list) => [0, 1, 2, 3].flatMap((k) => rotList(list, k));

  /* ---------- dimensions (units) ---------- */
  const TG = 0.45;            // terrace top
  const W1 = 7.2;            // lower roof width
  const E1 = 3.0;            // lower eave height (y)
  const CH = 2.2;            // half-width of dark core cella
  const PC = 2.95;           // colonnade half-width
  const W2 = 4.7;            // upper roof width
  const E2 = 6.05;            // upper eave

  /* eave fringe: red valance with little gold bells, on a square eave of side W at height y */
  function fringe(W, y, drop) {
    const red = []; const dark = []; const bells = [];
    const h = W / 2;
    red.push({ s: [W, drop, 0.04], p: [0, y - drop / 2 - 0.02, h] }, { s: [W, drop, 0.04], p: [0, y - drop / 2 - 0.02, -h] });
    red.push({ s: [0.04, drop, W], p: [h, y - drop / 2 - 0.02, 0] }, { s: [0.04, drop, W], p: [-h, y - drop / 2 - 0.02, 0] });
    dark.push({ s: [W + 0.06, 0.1, 0.1], p: [0, y + 0.01, h] }, { s: [W + 0.06, 0.1, 0.1], p: [0, y + 0.01, -h] });
    dark.push({ s: [0.1, 0.1, W + 0.06], p: [h, y + 0.01, 0] }, { s: [0.1, 0.1, W + 0.06], p: [-h, y + 0.01, 0] });
    const step = 0.26;
    for (let t = -h + 0.14; t <= h - 0.1; t += step) {
      bells.push({ s: [0.05, 0.1, 0.05], p: [t, y - drop - 0.06, h + 0.03] }, { s: [0.05, 0.1, 0.05], p: [t, y - drop - 0.06, -h - 0.03] });
      bells.push({ s: [0.05, 0.1, 0.05], p: [h + 0.03, y - drop - 0.06, t] }, { s: [0.05, 0.1, 0.05], p: [-h - 0.03, y - drop - 0.06, t] });
    }
    return { red, dark, bells };
  }
  const F1 = fringe(W1 - 0.04, E1 - 0.02, 0.3);
  const F2 = fringe(W2 - 0.04, E2 - 0.02, 0.24);
  const F3 = fringe(3.66, 5.45, 0.08);
  const SOFFIT = [
    { s: [W1 - 0.14, 0.08, W1 - 0.14], p: [0, E1 - 0.06, 0] },
    { s: [W2 - 0.12, 0.08, W2 - 0.12], p: [0, E2 - 0.06, 0] },
  ];

  /* ground storey: colonnade posts, beam, carved diagonal struts */
  const POSTS = (() => {
    const L = []; const xs = [-PC, -PC / 2, 0, PC / 2, PC];
    xs.forEach((x) => {
      L.push({ s: [0.17, E1 - 0.1 - TG, 0.17], p: [x, (E1 - 0.1 + TG) / 2, PC] });
      L.push({ s: [0.17, E1 - 0.1 - TG, 0.17], p: [x, (E1 - 0.1 + TG) / 2, -PC] });
      if (Math.abs(x) < PC) {
        L.push({ s: [0.17, E1 - 0.1 - TG, 0.17], p: [PC, (E1 - 0.1 + TG) / 2, x] });
        L.push({ s: [0.17, E1 - 0.1 - TG, 0.17], p: [-PC, (E1 - 0.1 + TG) / 2, x] });
      }
    });
    return L;
  })();
  const BEAMS = (() => {
    const L = [];
    const w = PC * 2 + 0.2;
    [2.4, 2.7].forEach((y, i) => {
      const t = i ? 0.1 : 0.2;
      L.push({ s: [w, t, 0.2], p: [0, y, PC] }, { s: [w, t, 0.2], p: [0, y, -PC] });
      L.push({ s: [0.2, t, w], p: [PC, y, 0] }, { s: [0.2, t, w], p: [-PC, y, 0] });
    });
    // low base beam
    L.push({ s: [w, 0.1, 0.22], p: [0, TG + 0.5, PC] }, { s: [w, 0.1, 0.22], p: [0, TG + 0.5, -PC] });
    L.push({ s: [0.22, 0.1, w], p: [PC, TG + 0.5, 0] }, { s: [0.22, 0.1, w], p: [-PC, TG + 0.5, 0] });
    return L;
  })();
  const STRUTS = (() => {
    const front = [];
    for (let x = -3.0; x <= 3.01; x += 0.6) {
      front.push(strut([x, 2.2, PC - 0.1], [x, E1 - 0.08, 3.4], 0.1));
      front.push(strut([x + 0.3, 1.8, PC - 0.1], [x + 0.3, E1 - 0.3, 3.2], 0.08));
    }
    return all4(front);
  })();
  const POSTBASE = (() => {
    const L = [];
    [-PC, -PC / 2, 0, PC / 2, PC].forEach((x) => {
      L.push({ s: [0.3, 0.12, 0.3], p: [x, TG + 0.06, PC] }, { s: [0.3, 0.12, 0.3], p: [x, TG + 0.06, -PC] });
      if (Math.abs(x) < PC) L.push({ s: [0.3, 0.12, 0.3], p: [PC, TG + 0.06, x] }, { s: [0.3, 0.12, 0.3], p: [-PC, TG + 0.06, x] });
    });
    return L;
  })();

  /* upper brick storey: carved lattice windows, 3 per face */
  const WIN_DARK = []; const WIN_WOOD = [];
  [-1.0, 0, 1.0].forEach((x) => {
    const y = 4.8; const z = 1.7;
    WIN_DARK.push({ s: [0.5, 0.58, 0.06], p: [x, y, z + 0.01] });
    WIN_WOOD.push({ s: [0.7, 0.07, 0.1], p: [x, y + 0.34, z + 0.03] }, { s: [0.64, 0.06, 0.1], p: [x, y - 0.32, z + 0.04] });
    WIN_WOOD.push({ s: [0.06, 0.64, 0.1], p: [x - 0.3, y, z + 0.03] }, { s: [0.06, 0.64, 0.1], p: [x + 0.3, y, z + 0.03] });
    [-0.12, 0.12].forEach((dx) => WIN_WOOD.push({ s: [0.035, 0.56, 0.06], p: [x + dx, y, z + 0.04] }));
    [-0.1, 0.1].forEach((dy) => WIN_WOOD.push({ s: [0.5, 0.035, 0.06], p: [x, y + dy, z + 0.04] }));
    WIN_WOOD.push({ s: [0.8, 0.06, 0.14], p: [x, y + 0.42, z + 0.04] });
  });
  const WINDARK4 = all4(WIN_DARK);
  const WINWOOD4 = all4(WIN_WOOD);
  /* short struts under the upper roof */
  const STRUTS2 = (() => {
    const f = [];
    for (let x = -1.7; x <= 1.71; x += 0.34) { f.push(strut([x, 5.5, 1.72], [x, E2 - 0.07, 2.28], 0.09)); f.push(strut([x + 0.17, 5.45, 1.72], [x + 0.17, E2 - 0.22, 2.1], 0.07)); }
    return all4(f);
  })();

  /* roof surface with ribbed, weathered copper vertex colours */
  function roofGeo(w, d, h, sag, lift, base, alt, amt, seed, ribK = 9) {
    const g = curvedRoofGeometry(w, d, h, sag, lift, 44);
    const pa = g.attributes.position;
    const cols = [];
    const cb = new THREE.Color(base); const ca = new THREE.Color(alt); const c = new THREE.Color();
    for (let i = 0; i < pa.count; i += 1) {
      const x = pa.getX(i); const z = pa.getZ(i);
      const ax = Math.abs(x) / (w / 2); const az = Math.abs(z) / (d / 2);
      const s = Math.max(ax, az);
      const rib = az >= ax ? x : z;
      const n = 0.5 + 0.5 * Math.sin(x * 1.7 + seed) * Math.cos(z * 1.3 - seed * 0.7) + 0.25 * Math.sin((x + z) * 3.1 + seed);
      const t = Math.min(1, Math.max(0, amt * (0.5 * n + 0.9 * s * s * s * s)));
      c.copy(cb).lerp(ca, t);
      c.multiplyScalar(0.93 + 0.07 * Math.cos(rib * ribK));
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }
  function CopperRoof({ w, d, h, y, sag, lift, base, alt, amt, seed, ribK }) {
    const geo = useMemo(() => roofGeo(w, d, h, sag, lift, base, alt, amt, seed, ribK), [w, d, h, sag, lift, base, alt, amt, seed, ribK]);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.3 }), []);
    return <mesh geometry={geo} material={mat} position={[0, y, 0]} castShadow receiveShadow />;
  }

  /* ---------- small figures ---------- */
  function Woman({ p, r = 0, sari }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={1.35}>
        <Cyl rt={0.09} rb={0.13} h={0.5} p={[0, 0.27, 0]} m={M.plain(sari, { roughness: 0.9 })} seg={10} />
        <Ball rad={0.075} p={[0, 0.6, 0]} m={M.plain('#b98863')} />
        <Cyl rt={0.075} h={0.04} p={[0, 0.67, 0]} m={M.plain('#1a1210')} seg={8} />
        <Box s={[0.05, 0.05, 0.22]} p={[0.1, 0.42, 0.1]} r={[0.2, 0, 0]} m={M.plain('#b98863')} />
        <Cyl rt={0.07} rb={0.04} h={0.05} p={[0.1, 0.45, 0.22]} m={M.plain('#c8321e')} seg={8} />
      </group>
    );
  }

  /* ===================================================================== MAIN */
  function BhairabiMain() {
    const M = useM();
    const brick = M.mat('brick', 4, 1, { color: '#b9785e' });
    const brickT = M.mat('brick', 5, 5, { color: '#b9785e' });
    const brickW = M.mat('brick', 2, 1, { color: '#b9785e' });
    const dark = M.plain('#1d110b', { roughness: 0.9 });
    const wood = M.plain('#2a1810', { roughness: 0.85 });
    const redM = M.plain('#b23a2a', { roughness: 0.8 });
    const gold = M.gold;
    const brass = M.plain('#c8923a', { metalness: 0.7, roughness: 0.4 });
    const stoneM = M.stone;
    const stoneG = M.plain('#8d8a82', { roughness: 0.95 });
    const WG = 4.1;
    return (
      <group>
        <Frame s={[8.4, 7.9, 9.6]} p={[0, 3.95, 1.3]} />
        {/* ---- brick terrace and parapet ---- */}
        <Box s={[8.6, TG, 8.6]} p={[0, TG / 2, 0]} m={brickT} />
        <Box s={[8.8, 0.1, 8.8]} p={[0, TG - 0.03, 0]} m={M.plain('#9a8062', { roughness: 1 })} />
        {/* parapet wall (about 0.5 high), gap in the front for the stair */}
        {[-1, 1].map((k) => <Box key={`pf${k}`} s={[3.35, 0.35, 0.3]} p={[k * 2.625, TG + 0.175, WG - 0.15]} m={brickW} />)}
        <Box s={[8.6, 0.35, 0.3]} p={[0, TG + 0.175, -WG - 0.15]} m={brickW} />
        <Box s={[0.3, 0.35, 8.6]} p={[WG + 0.15, TG + 0.175, 0]} m={brickW} />
        <Box s={[0.3, 0.35, 8.6]} p={[-WG - 0.15, TG + 0.175, 0]} m={brickW} />
        {/* stair through the gap: three low steps */}
        {[0, 1, 2].map((i) => <Box key={`st${i}`} s={[1.9, 0.15, 0.38]} p={[0, TG - i * 0.15 - 0.05, WG + 0.1 + i * 0.36]} m={stoneM} />)}

        {/* ---- lions: gold pair on the wall ends, stone pair at the foot of the steps ---- */}
        {[-1, 1].map((k) => (
          <group key={`lg${k}`}>
            <Box s={[0.6, 0.22, 0.65]} p={[k * 1.45, TG + 0.46, WG - 0.1]} m={stoneG} />
            <group position={[k * 1.45, TG + 0.57, WG - 0.1]} scale={2.0}><Lion m={brass} /></group>
            <Box s={[0.6, 0.36, 0.65]} p={[k * 1.45, 0.18, WG + 1.5]} m={stoneM} />
            <group position={[k * 1.45, 0.36, WG + 1.5]} scale={2.0}><Lion m={M.plain('#9d9a92', { roughness: 0.95 })} /></group>
          </group>
        ))}
        {/* two women holding sindur at the stair */}
        <Woman p={[-0.7, TG, WG - 0.35]} r={0.15} sari="#c8402a" />
        <Woman p={[0.62, TG, WG - 0.35]} r={-0.15} sari="#d9892a" />
        <Diyo p={[-0.4, 0.32, WG + 0.5]} />
        <Diyo p={[0.4, 0.32, WG + 0.5]} />

        {/* ---- stone chaitya in the courtyard, front left ---- */}
        <Box s={[1.5, 0.16, 1.5]} p={[-3.9, 0.08, 6.4]} m={stoneM} />
        <Box s={[1.1, 0.16, 1.1]} p={[-3.9, 0.24, 6.4]} m={stoneM} />
        <Chaitya p={[-3.9, 0.32, 6.4]} s={1.6} />

        {/* ---- ground storey: dark core, brick base band, door ---- */}
        <Box s={[CH * 2, E1 - TG - 0.05, CH * 2]} p={[0, (E1 + TG) / 2 - 0.02, 0]} m={dark} />
        <Box s={[CH * 2 + 0.06, 0.5, CH * 2 + 0.06]} p={[0, TG + 0.28, 0]} m={M.plain('#4a2a20', { roughness: 0.9 })} />
        <Bx list={POSTS} m={wood} />
        <Bx list={BEAMS} m={dark} />
        <Bx list={POSTBASE} m={stoneG} />
        <Bx list={STRUTS} m={M.plain('#2e1a10', { roughness: 0.85 })} />
        {/* door */}
        <Box s={[0.9, 1.3, 0.1]} p={[0, TG + 0.68, CH + 0.05]} m={M.plain('#0e0805')} />
        <Box s={[1.1, 0.12, 0.12]} p={[0, TG + 1.4, CH + 0.07]} m={M.plain('#2e1a10')} />
        {/* red-painted panels between the posts on the front */}
        {[-1.5, 1.5].map((x) => <Box key={`rp${x}`} s={[0.95, 0.9, 0.05]} p={[x, TG + 1.3, CH + 0.03]} m={M.plain('#1a0f0a')} />)}

        {/* ---- lower roof (very wide, low, weathered orange-brown to green) ---- */}
        <Bx list={SOFFIT} m={dark} />
        <CopperRoof w={W1} d={W1} h={1.7} y={E1} sag={1.3} lift={0.05} base="#97522c" alt="#56744a" amt={0.3} seed={1.3} ribK={20} />
        <Bx list={F1.red} m={redM} />
        <Bx list={F1.dark} m={dark} />
        <Bx list={F1.bells} m={gold} />

        {/* ---- brick storey with lattice windows ---- */}
        <Box s={[3.4, 1.7, 3.4]} p={[0, 4.6, 0]} m={M.mat('brick', 3, 1, { color: "#5a3428" })} />
        <Box s={[3.62, 0.3, 3.62]} p={[0, 3.85, 0]} m={wood} />
        <Bx list={WINDARK4} m={dark} />
        <Bx list={WINWOOD4} m={M.plain('#4a2a18', { roughness: 0.8 })} />
        {/* thin ledge skirt with red fringe */}
        <Box s={[3.8, 0.12, 3.8]} p={[0, 5.45, 0]} m={M.plain('#2a1810', { roughness: 0.85 })} />
        <Bx list={F3.red} m={redM} />
        <Bx list={STRUTS2} m={M.plain('#3a2216')} />

        {/* ---- upper roof (about 60% of lower width), gold-tan ---- */}
        <CopperRoof w={W2} d={W2} h={0.95} y={E2} sag={1.45} lift={0.08} base="#b08a4a" alt="#5e4a2a" amt={0.55} seed={2.2} ribK={20} />
        <Bx list={F2.red} m={redM} />
        <Bx list={F2.dark} m={dark} />
        <Bx list={F2.bells} m={gold} />
        {/* gilded pinnacle: gajur and small finial */}
        <Gajur y={E2 + 0.85} s={1.1} />
      </group>
    );
  }

  /* ===================================================================== ENV */
  const ribbon = (pts, width, y) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new V3(x, y, z)));
    const n = 80; const P = []; const I = [];
    for (let i = 0; i <= n; i += 1) {
      const t = i / n; const p = curve.getPoint(t); const tg = curve.getTangent(t);
      const nx = -tg.z; const nz = tg.x;
      const w = width * (0.7 + 0.5 * Math.sin(t * 9));
      P.push(p.x + nx * w, y, p.z + nz * w, p.x - nx * w, y, p.z - nz * w);
      if (i < n) { const a = i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setIndex(I); g.computeVertexNormals();
    return g;
  };
  function River({ pts, width, y, color, sand }) {
    const g = useMemo(() => ribbon(pts, width, y), [pts, width, y]);
    const gs = useMemo(() => ribbon(pts, width * 1.7, y - 0.05), [pts, width, y]);
    return (
      <group>
        <mesh geometry={gs}><meshStandardMaterial color={sand} roughness={1} side={THREE.DoubleSide} /></mesh>
        <mesh geometry={g}><meshStandardMaterial color={color} roughness={0.25} metalness={0.2} side={THREE.DoubleSide} /></mesh>
      </group>
    );
  }
  /* layered blue ridge: a sloped ring with a jagged crest */
  function Ridge({ r, crest, color, seed, base = -34, skirt = 30 }) {
    const g = useMemo(() => {
      const n = 120; const P = []; const I = [];
      for (let i = 0; i <= n; i += 1) {
        const a = (i / n) * Math.PI * 2;
        const hh = crest * (0.55 + 0.25 * Math.sin(a * 3 + seed) + 0.15 * Math.sin(a * 7 + seed * 2) + 0.08 * Math.sin(a * 17 + seed * 3));
        P.push(Math.cos(a) * (r - skirt), base, Math.sin(a) * (r - skirt), Math.cos(a) * r, hh, Math.sin(a) * r);
        if (i < n) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const G = new THREE.BufferGeometry();
      G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      G.setIndex(I); G.computeVertexNormals();
      return G;
    }, [r, crest, seed, base, skirt]);
    return <mesh geometry={g}><meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} /></mesh>;
  }
  const Slope = ({ r, top, mats }) => (
    <mesh position={[0, top - 13, 0]} material={mats} receiveShadow>
      <cylinderGeometry args={[r, r, 26, 56]} />
    </mesh>
  );

  function Hut({ p, r = 0, w = 2.0, d = 1.9, h = 1.5, roof = 'tin', wall = 'brick' }) {
    const M = useM();
    const wm = wall === 'brick' ? M.mat('brick', 2, 1, { color: '#d8a088' }) : M.plain('#cdb590', { roughness: 0.95 });
    const rm = { tin: M.plain('#9aa8ae', { metalness: 0.5, roughness: 0.5 }), thatch: M.plain('#a98a52', { roughness: 1 }), tile: M.plain('#a35a3e', { roughness: 0.9 }), rust: M.plain('#8a5a46', { metalness: 0.4, roughness: 0.6 }) }[roof];
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wm} />
        <Roof w={w + 0.5} d={d + 0.5} h={0.7} y={h} m={rm} sag={1} lift={0} fascia={false} />
        <Box s={[0.4, 0.8, 0.05]} p={[w * 0.18, 0.4, d / 2 + 0.02]} m={M.plain('#2a1a12')} />
        <Box s={[0.35, 0.35, 0.05]} p={[-w * 0.25, h * 0.6, d / 2 + 0.02]} m={M.plain('#2a1a12')} />
      </group>
    );
  }

  /* Rana-style cream two-storey house (the old Lampati palace, now a museum): arched windows, carved pediment, joined by a brick wall */
  function ArchWin({ p, w = 0.5, h = 0.95, lit }) {
    const M = useM();
    const glass = lit ? M.plain('#33261c', { emissive: '#ffb050', emissiveIntensity: 0.3, roughness: 0.6 }) : M.plain('#2a2018', { roughness: 0.6 });
    const frame = M.plain('#e6d6b2', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[w + 0.2, h - w / 2, 0.08]} p={[0, (h - w / 2) / 2, 0]} m={frame} />
        <Cyl rt={(w + 0.2) / 2} h={0.08} p={[0, h - w / 2, 0]} r={[Math.PI / 2, 0, 0]} m={frame} seg={14} />
        <Box s={[w, h - w / 2, 0.1]} p={[0, (h - w / 2) / 2, 0.02]} m={glass} />
        <Cyl rt={w / 2} h={0.1} p={[0, h - w / 2, 0.02]} r={[Math.PI / 2, 0, 0]} m={glass} seg={14} />
        <Box s={[w, 0.04, 0.1]} p={[0, h * 0.45, 0.04]} m={frame} />
        <Box s={[0.04, h * 0.8, 0.1]} p={[0, h * 0.4, 0.04]} m={frame} />
      </group>
    );
  }
  function CreamHouse() {
    const M = useM();
    const cream = M.plain('#e9dcbb', { roughness: 0.92 });
    const stain = M.plain('#b3a583', { roughness: 1 });
    const tile = M.plain('#8d8a84', { roughness: 0.6, metalness: 0.35 });
    const redM = M.plain('#b23a2a', { roughness: 0.8 });
    const w = 4.8; const d = 3.6; const hh = 4.1;
    const stepped = (hw, sc) => {
      const pts = [[1, 0], [1, 0.25], [0.78, 0.3], [0.74, 0.62], [0.52, 0.68], [0.46, 1.0], [0.26, 1.08], [0.18, 1.45], [0, 1.62]];
      const sh = new THREE.Shape();
      sh.moveTo(-hw, 0);
      pts.forEach(([x, y]) => sh.lineTo(x * hw, y * sc));
      for (let i = pts.length - 2; i >= 0; i -= 1) sh.lineTo(-pts[i][0] * hw, pts[i][1] * sc);
      sh.closePath();
      return sh;
    };
    const gable = useMemo(() => new THREE.ExtrudeGeometry(stepped(w / 2 + 0.1, 1.5), { depth: 0.2, bevelEnabled: false }), []);
    const gable2 = useMemo(() => new THREE.ExtrudeGeometry(stepped(w / 2 - 0.5, 1.3), { depth: 0.1, bevelEnabled: false }), []);
    const ang = Math.atan2(1.0, w / 2);
    const sl = Math.sqrt((w / 2) ** 2 + 1.0 ** 2) + 0.5;
    return (
      <group position={[11.5, 0, -2]}>
        <Box s={[w, hh, d]} p={[0, hh / 2, 0]} m={cream} />
        <Box s={[w + 0.12, 0.7, d + 0.12]} p={[0, 0.35, 0]} m={stain} />
        <Box s={[w + 0.3, 0.18, d + 0.3]} p={[0, 2.3, 0]} m={cream} />
        <Box s={[w + 0.4, 0.22, d + 0.4]} p={[0, hh + 0.04, 0]} m={cream} />
        {/* pediment on the front (+z) */}
        <mesh geometry={gable} position={[0, hh + 0.13, d / 2 - 0.1]} material={cream} castShadow />
        <mesh geometry={gable2} position={[0, hh + 0.16, d / 2 + 0.1]} material={M.plain('#d9c79c', { roughness: 0.9 })} />
        <Cyl rt={0.28} h={0.1} p={[0, hh + 0.55, d / 2 + 0.22]} r={[Math.PI / 2, 0, 0]} m={M.plain('#8a7a5a')} seg={14} />
        {[-1, 1].map((k) => <Ball key={`sc${k}`} rad={0.17} p={[k * 1.0, hh + 0.32, d / 2 + 0.2]} m={cream} />)}
        {[-1, 1].map((k) => <Ball key={`sd${k}`} rad={0.14} p={[k * 1.9, hh + 0.35, d / 2 + 0.2]} m={cream} />)}
        <Ball rad={0.13} p={[0, hh + 1.65, d / 2 + 0.1]} m={cream} />
        {/* grey-red tiled roof behind the pediment, ridge running front to back */}
        {[-1, 1].map((k) => <Box key={`rf${k}`} s={[sl, 0.1, d + 0.5]} p={[k * (w / 4 + 0.15), hh + 0.2 + 0.5, 0]} r={[0, 0, -k * ang]} m={tile} />)}
        <Box s={[0.12, 0.12, d + 0.4]} p={[0, hh + 1.02, 0]} m={M.plain('#6a6762')} />
        {/* windows: three arched on the upper floor, door and two below */}
        {[-1.7, 0, 1.7].map((x) => <ArchWin key={`w1${x}`} p={[x, 2.8, d / 2 + 0.01]} lit />)}
        {[-1.9, 1.7].map((x) => <ArchWin key={`w0${x}`} p={[x, 0.95, d / 2 + 0.01]} w={0.46} h={0.9} lit />)}
        <ArchWin p={[0, 0.6, d / 2 + 0.01]} w={0.8} h={1.45} />
        <Box s={[1.1, 0.12, 0.4]} p={[0, 2.22, d / 2 + 0.1]} m={cream} />
        {/* side windows */}
        {[-0.9, 0.9].map((z) => <ArchWin key={`ws${z}`} p={[-w / 2 - 0.01, 2.8, z]} lit />)}
      </group>
    );
  }

  function BhairabiEnv() {
    const M = useM();
    const earth = M.plain('#b09a78', { roughness: 1 });
    const pave = M.mat('brick', 7, 5, { color: '#d4ab90' });
    const brickW = M.mat('brick', 3, 1, { color: '#b9785e' });
        const TOPS = ['#4f7a38', '#5f8a3e', '#7c9a48', '#b0a05a', '#8aa550', '#a89a52'];
    const mats = (i) => {
      const top = i === 0 ? earth : M.plain(TOPS[(i - 1) % TOPS.length], { roughness: 1 });
      const side = M.plain(i % 2 ? '#8f7048' : '#a07a50', { roughness: 1 });
      return [side, top, top];
    };
    const riverPts = useMemo(() => [[-70, -38], [-48, -44], [-30, -52], [-5, -50], [20, -56], [45, -48], [70, -58]], []);
    const riverPts2 = useMemo(() => [[60, 58], [45, 45], [38, 20], [46, 0]], []);
    const lane = [-Math.PI / 4];
    return (
      <group>
        {/* ridge-top plateau and the terraced slopes falling away */}
        {[6, 5, 4, 3, 2, 1, 0].map((i) => <group key={`t${i}`} position={[6, 0, 8]}><Slope r={23 + i * 3.4} top={-i * 3.6 - (i ? 0.02 * i : 0)} mats={mats(i)} /></group>)}
        {/* terraced field steps just below the north and west edge */}
        {[0, 1, 2].map((i) => <group key={`tf${i}`} position={[6, 0, 8]}><Slope r={22.4 - i * 0.4} top={-0.7 - i * 0.7} mats={[M.plain('#7a5a3a', { roughness: 1 }), M.plain(i % 2 ? '#4a7a34' : '#5a8a3a', { roughness: 1 }), M.plain('#4f7a38', { roughness: 1 })]} /></group>)}
        <mesh position={[0, -30.2, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[130, 48]} /><meshStandardMaterial color="#86a054" roughness={1} /></mesh>
        <River pts={riverPts} width={2.6} y={-29.9} color="#6fa4be" sand="#d6c9a4" />
        <River pts={riverPts2} width={1.4} y={-29.9} color="#6fa4be" sand="#d6c9a4" />
        {/* layered blue hills behind (haze increasing with distance) */}
        <Ridge r={74} crest={-6} color="#6d8f5f" seed={0.5} />
        <Ridge r={92} crest={6} color="#6f8fae" seed={1.7} />
        <Ridge r={112} crest={18} color="#7d97b8" seed={3.1} />
        <Ridge r={134} crest={30} color="#a9bdd4" seed={4.4} />
        <Ridge r={150} crest={44} color="#8da3bd" seed={5.6} />

        {/* courtyard: brick paving in front of the terrace, dusty earth beyond */}
        <mesh position={[-1, 0.02, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[17, 14]} /><meshStandardMaterial {...{ color: '#c7a07c', roughness: 1 }} /></mesh>
        <mesh position={[0, 0.03, 8.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={pave}><planeGeometry args={[9, 5]} /></mesh>
        <mesh position={[6.5, 0.03, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={pave}><planeGeometry args={[5, 9]} /></mesh>
        {/* courtyard brick walls: from the cream house toward the front, and a low parapet at the ridge edge */}
        <Box s={[0.4, 1.0, 9.0]} p={[6.6, 0.5, 5.8]} m={brickW} />
        <Box s={[0.4, 0.8, 4.0]} p={[8.8, 0.4, -0.9]} m={brickW} />
        <Box s={[4.6, 0.55, 0.35]} p={[6.7, 0.28, 0.2]} m={brickW} />
        <Box s={[12.5, 0.8, 0.4]} p={[3.5, 0.4, 13.5]} m={brickW} />
        
        <Box s={[4.4, 0.6, 0.35]} p={[6.6, 0.3, -4.8]} m={brickW} />

        {/* weathered earth patches on the courtyard ground */}
        {[[-6, 2, 3.5, 2.2], [4, 9.5, 3, 2], [-2, 12, 4, 2.4], [-9, 6, 2.5, 3]].map(([x, z, a, b], i) => (
          <mesh key={`ep${i}`} position={[x, 0.035, z]} rotation={[-Math.PI / 2, 0, i]} scale={[a, b, 1]} receiveShadow><circleGeometry args={[1, 18]} /><meshStandardMaterial color={i % 2 ? '#a88a66' : '#bd9b72'} roughness={1} transparent opacity={0.8} /></mesh>
        ))}
        <CreamHouse />
        {/* second old house behind the cream one, tile roof (the other building of the palace complex) */}
        <Box s={[4, 3.3, 3.4]} p={[12.5, 1.65, -7.2]} m={M.plain('#e0d3b2')} />
        <Roof w={5} d={4.4} h={1.1} y={3.3} m={M.plain('#9a4a36', { metalness: 0.3, roughness: 0.6 })} sag={1} lift={0} fascia={false} />

        {/* village lane with strings of prayer flags, houses of brick with tin, thatch and tile roofs */}
        <group position={[-7.4, 0, 9]} rotation={[0, lane[0], 0]}>
          <Box s={[1.8, 0.05, 11]} p={[0, 0.03, 5.2]} m={M.mat('brick', 1, 6, { color: '#e8b894' })} cast={false} />
          {[[-2.5, 1.6, 'tin', 'brick', 1], [2.5, 2.6, 'thatch', 'brick', -1], [-2.5, 4.4, 'tile', 'plaster', 1], [2.5, 5.6, 'rust', 'brick', -1], [-2.5, 7.4, 'tin', 'brick', 1], [2.5, 8.8, 'tile', 'brick', -1], [-2.6, 10.2, 'thatch', 'brick', 1]].map(([x, z, roof, wall, k], i) => (
            <Hut key={`hu${i}`} p={[x, 0, z]} r={k * Math.PI / 2} roof={roof} wall={wall} w={1.9 + (i % 3) * 0.2} h={1.4 + (i % 2) * 0.3} />
          ))}
          <PrayerFlags from={[-2.5, 2.5, 3.0]} to={[2.5, 2.4, 3.5]} n={10} />
          <PrayerFlags from={[-2.5, 2.7, 6.2]} to={[2.5, 2.6, 6.8]} n={10} />
          <PrayerFlags from={[-2.5, 2.5, 9.2]} to={[2.5, 2.7, 9.9]} n={10} />
        </group>
        {/* flags strung from the temple's lower eave across the courtyard */}
        <PrayerFlags from={[-3.5, 3.0, 3.5]} to={[-7.4, 2.4, 7.6]} n={12} />
        <PrayerFlags from={[3.5, 3.0, 3.5]} to={[7.4, 3.4, 1.4]} n={10} />

        {/* iron lamp-post beside the terrace (lit at dusk) */}
        <Cyl rt={0.04} h={1.7} p={[-5.4, 0.85, 5.0]} m={M.plain('#2a2a2a', { metalness: 0.6 })} seg={8} />
        <Box s={[0.28, 0.34, 0.28]} p={[-5.4, 1.8, 5.0]} m={M.plain('#3a3a3a', { metalness: 0.6 })} />
        <mesh position={[-5.4, 1.8, 5.0]}><boxGeometry args={[0.2, 0.26, 0.2]} /><meshBasicMaterial color="#ffd48a" toneMapped={false} /></mesh>
        <pointLight position={[-5.4, 2.0, 5.2]} intensity={5} distance={9} color="#ffb35a" />
        <pointLight position={[0, 1.6, 6.4]} intensity={3} distance={7} color="#ffb35a" />

        {/* trees on the ridge */}
        {[[-14, -6, 1.2], [-6, -16, 1.5], [3, -14, 1.6], [16, -14, 1.6], [20, -6, 1.7], [19, 9, 1.6], [-17, 4, 1.4], [-9, 17, 1.3]].map(([x, z, s], i) => (
          <Tree key={`tr${i}`} p={[x, 0, z]} s={s} kind="broad" />
        ))}
        {/* a big peepal beside the cream house wall */}
        <Tree p={[12.5, 0, 8.5]} s={2.0} />
      </group>
    );
  }

  return { 'bhairabi-temple-nuwakot': { Main: BhairabiMain, Env: BhairabiEnv } };
}
