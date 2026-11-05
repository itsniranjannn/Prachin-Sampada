// Akash Bhairab Temple, Indra Chowk, Kathmandu: a long, low, two-storey Newar "house-type" temple on the WEST side of the junction
// (front faces east into the square; here front = +z, north = +x). Shops on the ground floor, the Bhairav shrine upstairs behind a
// carved dark-timber balcony with a gilded torana and four gilded griffins, one wide dark hipped tile roof with a red-and-white
// fringed valance, a gilded ridge pinnacle and a long gilded banner down the front slope. Flat street level, hemmed in by taller
// modern brick/concrete shop buildings; Shiva dome shrine to the north, Raki Bazaar alley east, Shukra Path south-west.
export default function make(K) {
  const { THREE, useMemo, useRef, useEffect, useState, useM, Frame, Box, Cyl, Ball, Gajur, Griffin, Lion, silverMat } = K;

  const W = 3.3; // body width
  const D = 2.1; // body depth
  const GH = 0.65; // ground floor height
  const EAVE = 1.65; // eave height
  const RH = 0.55; // roof rise
  const HW = 1.85; // roof half width
  const HD = 1.32; // roof half depth
  const RL = 1.35; // ridge half length
  const FZ = D / 2; // front plane z

  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  /* ---------- small helpers: canvas textures, cached materials, instancing ---------- */
  const CACHE = new Map();
  const cached = (key, fn) => { if (!CACHE.has(key)) CACHE.set(key, fn()); return CACHE.get(key); };
  const cvTex = (w, h, draw, rep) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  };
  const matOf = (key, o) => cached(`m|${key}`, () => new THREE.MeshStandardMaterial(o));

  function Inst({ items, mat, geo = 'box', cast = true }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set(it.rx || 0, it.r || 0, it.rz || 0);
        const s = it.s || [1, 1, 1];
        o.scale.set(s[0], s[1], s[2]);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) { col.set(it.c); ref.current.setColorAt(i, col); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={mat} frustumCulled={false} castShadow={cast} receiveShadow>
        {geo === 'box' ? <boxGeometry args={[1, 1, 1]} /> : geo === 'cyl' ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} /> : <sphereGeometry args={[0.5, 10, 8]} />}
      </instancedMesh>
    );
  }

  /* hip roof: front/back trapezoids and two triangular hips, flat shaded, with tile uvs */
  function hipGeo(hw, hd, h, rl, k = 0.55) {
    const P = []; const U = [];
    const tri = (a, b, c, uv) => { [a, b, c].forEach((v) => { P.push(v[0], v[1], v[2]); U.push(...uv(v)); }); };
    const fb = (v) => [v[0] * k, (hd - Math.abs(v[2])) * k * 1.1];
    const en = (v) => [v[2] * k, (hw - Math.abs(v[0])) * k * 1.2];
    tri([-hw, 0, hd], [hw, 0, hd], [rl, h, 0], fb); tri([-hw, 0, hd], [rl, h, 0], [-rl, h, 0], fb);
    tri([hw, 0, -hd], [-hw, 0, -hd], [-rl, h, 0], fb); tri([hw, 0, -hd], [-rl, h, 0], [rl, h, 0], fb);
    tri([hw, 0, hd], [hw, 0, -hd], [rl, h, 0], en);
    tri([-hw, 0, -hd], [-hw, 0, hd], [-rl, h, 0], en);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.computeVertexNormals();
    return g;
  }
  function Hip({ hw, hd, h, rl, m, k }) {
    const geo = useMemo(() => hipGeo(hw, hd, h, rl, k), [hw, hd, h, rl, k]);
    return <mesh geometry={geo} material={m} castShadow receiveShadow />;
  }

  /* ---------- textures ---------- */
  const latticeTex = () => cached('t|lattice', () => cvTex(64, 96, (g, w, h) => {
    g.fillStyle = '#1c120d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a9743f'; g.lineWidth = 2;
    for (let x = 8; x < w; x += 8) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 6); g.stroke(); }
    for (let y = 12; y < h; y += 10) { g.beginPath(); g.moveTo(4, y); g.lineTo(w - 4, y); g.stroke(); }
    g.strokeStyle = '#b08040'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#c99a4a'; g.fillRect(6, 6, w - 12, 6);
  }));
  const tileTex = () => cached('t|tile', () => cvTex(64, 64, (g, w, h) => {
    g.fillStyle = '#6a5e56'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row += 1) {
      const y = row * 8; const off = row % 2 ? 4 : 0;
      g.fillStyle = 'rgba(20,14,10,0.55)'; g.fillRect(0, y + 6, w, 2);
      g.fillStyle = 'rgba(170,150,130,0.16)'; g.fillRect(0, y, w, 2);
      g.fillStyle = 'rgba(20,14,10,0.35)';
      for (let x = off; x < w; x += 8) g.fillRect(x, y, 1, 6);
    }
  }, [1, 1]));
  const valanceTex = (rx, ry) => cached(`t|val|${rx}`, () => {
    const t = cvTex(32, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#b0222a'; g.fillRect(0, 0, w, 40);
      g.fillStyle = '#f2ede2'; g.fillRect(0, 36, w, 4);
      for (let i = 0; i < 4; i += 1) { g.fillStyle = i % 2 ? '#f2ede2' : '#b0222a'; g.fillRect(i * 8 + 1, 40, 6, 22); }
      g.fillStyle = '#f2ede2'; g.fillRect(12, 8, 8, 20);
    }, [rx, ry]);
    return t;
  });

  /* facade textures for the surrounding modern buildings */
  function facadeTex(kind, cols, rows, dusk, seed) {
    return cached(`f|${kind}|${cols}|${rows}|${dusk}|${seed}`, () => cvTex(cols * 36, rows * 48, (g, w, h) => {
      const r = rng(seed * 13 + cols * 7 + rows);
      const base = { brick: '#a87868', concrete: '#bdb6a8', white: '#e0dacb', old: '#94503c', grey: '#a9a59c' }[kind] || '#cccccc';
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      if (kind === 'brick' || kind === 'old') { g.strokeStyle = 'rgba(255,225,200,0.16)'; g.lineWidth = 1; for (let y = 0; y < h; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
      for (let i = 0; i < 60; i += 1) { g.fillStyle = `rgba(60,40,30,${0.03 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 6 + r() * 20, 4 + r() * 12); }
      const cw = w / cols; const ch = h / rows;
      const signs = ['#a82a2e', '#2f5598', '#e0ddd4', '#c9a236', '#2f7a4a'];
      for (let j = 0; j < rows; j += 1) {
        const y0 = j * ch;
        if (j === rows - 1) {
          // ground floor: roll-down shop shutters and signs
          g.fillStyle = 'rgba(40,30,25,0.55)'; g.fillRect(0, y0, w, ch);
          for (let i = 0; i < cols; i += 1) {
            g.fillStyle = ['#8d9094', '#a33a32', '#2f5fa8', '#d9d4c4', '#6a6f74'][Math.floor(r() * 5)]; g.fillRect(i * cw + 3, y0 + ch * 0.3, cw - 6, ch * 0.68);
            g.fillStyle = signs[Math.floor(r() * 5)]; g.fillRect(i * cw + 3, y0 + 2, cw - 6, ch * 0.24);
          }
          continue;
        }
        if (kind !== 'old') { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, y0 + ch - 5, w, 5); }
        for (let i = 0; i < cols; i += 1) {
          const x0 = i * cw;
          const lit = dusk && r() < 0.45;
          g.fillStyle = kind === 'old' ? '#4a3022' : '#cfc9bc'; g.fillRect(x0 + cw * 0.27, y0 + ch * 0.26, cw * 0.46, ch * 0.44);
          g.fillStyle = lit ? '#ffd47a' : (kind === 'old' ? '#2a1c14' : '#34414c'); g.fillRect(x0 + cw * 0.31, y0 + ch * 0.3, cw * 0.38, ch * 0.36);
          if (kind === 'old') { g.fillStyle = '#7a4a2e'; g.fillRect(x0 + cw * 0.3, y0 + ch * 0.46, cw * 0.4, 2); }
          if (kind === 'white') { g.fillStyle = '#4a6a55'; g.fillRect(x0 + cw * 0.12, y0 + ch * 0.2, cw * 0.1, ch * 0.54); g.fillRect(x0 + cw * 0.78, y0 + ch * 0.2, cw * 0.1, ch * 0.54); }
          if ((kind === 'concrete' || kind === 'grey') && r() < 0.35) { g.fillStyle = signs[Math.floor(r() * 5)]; g.fillRect(x0 + cw * 0.1, y0 + ch * 0.8, cw * 0.8, ch * 0.1); }
          if (r() < 0.12) { g.fillStyle = '#e8e4da'; g.fillRect(x0 + cw * 0.3, y0 + ch * 0.8, cw * 0.4, ch * 0.14); }
        }
        if (kind === 'white') { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, y0, w, 3); }
      }
    }));
  }
  const SIGNC = ['#b3262c', '#2a58a6', '#e8e4d6', '#d4a82e', '#2f7a4a', '#e07a2a'];
  function Bld({ p, w, h, d, r = 0, kind = 'brick', dusk, seed = 1, tank = false, roof = false, bal = 0, rsign = false }) {
    const cols = Math.max(2, Math.round(w / 0.5));
    const rows = Math.max(3, Math.round(h / 0.62));
    const tx = facadeTex(kind, cols, rows, dusk, seed);
    const m = matOf(`bld|${kind}|${cols}|${rows}|${dusk}|${seed}`, { map: tx, roughness: 0.92 });
    const top = matOf('bldtop', { color: '#7b766e', roughness: 1 });
    const mats = [m, m, top, top, m, m];
    const sc = SIGNC[seed % SIGNC.length];
    const sc2 = SIGNC[(seed + 2) % SIGNC.length];
    const rw = h / rows;
    const balM = matOf(`bal|${seed % 3}`, { color: ['#3c6a4c', '#5a4636', '#8a8478'][seed % 3], roughness: 0.9 });
    return (
      <group position={[p[0], 0, p[1]]} rotation={[0, r, 0]}>
        <mesh position={[0, h / 2, 0]} material={mats} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
        <mesh position={[0, h + 0.03, 0]} material={top}><boxGeometry args={[w + 0.06, 0.06, d + 0.06]} /></mesh>
        {/* heavy shop-sign hoarding over the ground floor */}
        <mesh position={[0, rw * 1.02, d / 2 + 0.04]} material={matOf(`sg|${sc}`, { color: sc, roughness: 0.7 })}><boxGeometry args={[w * 0.92, rw * 0.3, 0.07]} /></mesh>
        {bal > 0 && <mesh position={[0, rw * 2.1, d / 2 + 0.11]} material={balM}><boxGeometry args={[w * 0.82, 0.1, 0.22]} /></mesh>}
        {bal > 1 && <mesh position={[0, rw * 3.1 + 0.1, d / 2 + 0.11]} material={balM}><boxGeometry args={[w * 0.82, 0.1, 0.22]} /></mesh>}
        {bal > 0 && <mesh position={[0, rw * 2.1 + 0.1, d / 2 + 0.2]} material={balM}><boxGeometry args={[w * 0.82, 0.14, 0.02]} /></mesh>}
        {rsign && <mesh position={[0, h + 0.4, d * 0.25]} material={matOf(`rs|${sc2}`, { color: sc2, roughness: 0.7 })}><boxGeometry args={[w * 0.85, 0.5, 0.06]} /></mesh>}
        {tank && <mesh position={[w * 0.25, h + 0.22, -d * 0.2]} material={matOf('tank', { color: '#2b3a4a', roughness: 0.6 })}><cylinderGeometry args={[0.2, 0.2, 0.32, 12]} /></mesh>}
        {roof && <group position={[0, h + 0.06, 0]}><Hip hw={w / 2 + 0.12} hd={d / 2 + 0.12} h={0.6} rl={w * 0.3} k={2} m={matOf('hiproof2', { map: tileTex(), color: '#b8a89a', roughness: 0.95, side: THREE.DoubleSide })} /></group>}
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function Torana({ M }) {
    const gold = M.gold;
    const sv = silverMat(M);
    const red = M.plain('#a8231c', { roughness: 0.6 });
    const white = M.plain('#f4f0e6', { roughness: 0.5 });
    const dark = M.plain('#120c09', { roughness: 0.9 });
    const spikes = useMemo(() => Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI; return { p: [Math.cos(a) * 0.37, Math.sin(a) * 0.4 * 1.1, 0], rz: a - Math.PI / 2 }; }), []);
    return (
      <group position={[0, 0, FZ]}>
        {/* recessed shrine window: dark box, silver surround, bars, the mask behind */}
        <Box s={[0.56, 0.42, 0.02]} p={[0, 1.03, 0.012]} m={sv} cast={false} />
        <Box s={[0.48, 0.36, 0.03]} p={[0, 1.03, 0.02]} m={dark} cast={false} />
        <group position={[0, 1.02, 0.045]} scale={0.88}>
          <mesh position={[0, 0, -0.004]} scale={[1, 1.1, 0.35]} material={sv}><torusGeometry args={[0.15, 0.022, 8, 26]} /></mesh>
          <Ball rad={0.095} sc={[1, 1.12, 0.55]} p={[0, 0, 0]} m={red} />
          <Ball rad={0.026} sc={[1, 0.8, 0.5]} p={[-0.04, 0.025, 0.045]} m={white} />
          <Ball rad={0.026} sc={[1, 0.8, 0.5]} p={[0.04, 0.025, 0.045]} m={white} />
          <Ball rad={0.012} p={[-0.04, 0.025, 0.058]} m={dark} />
          <Ball rad={0.012} p={[0.04, 0.025, 0.058]} m={dark} />
          <Box s={[0.06, 0.012, 0.02]} p={[0, -0.05, 0.05]} m={white} cast={false} />
          <Box s={[0.14, 0.04, 0.05]} p={[0, 0.115, 0.01]} m={gold} cast={false} />
          <mesh position={[0, 0.16, 0.01]} material={gold}><coneGeometry args={[0.04, 0.07, 6]} /></mesh>
          <Ball rad={0.022} p={[-0.11, -0.03, 0.01]} m={M.plain('#2457a8')} />
          <Ball rad={0.022} p={[0.11, -0.03, 0.01]} m={M.plain('#2457a8')} />
          <Box s={[0.3, 0.12, 0.05]} p={[0, -0.14, 0.0]} m={M.plain('#e6823a')} cast={false} />
        </group>
        {[-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18].map((x) => <Box key={x} s={[0.012, 0.36, 0.012]} p={[x, 1.03, 0.075]} m={sv} cast={false} />)}
        {/* gilded frame and the torana arch above */}
        <Box s={[0.6, 0.03, 0.04]} p={[0, 0.83, 0.04]} m={gold} cast={false} />
        <Box s={[0.03, 0.4, 0.04]} p={[-0.27, 1.03, 0.04]} m={gold} cast={false} />
        <Box s={[0.03, 0.4, 0.04]} p={[0.27, 1.03, 0.04]} m={gold} cast={false} />
        <group position={[0, 1.1, 0.06]} scale={[0.86, 0.72, 1]}>
          <mesh scale={[1, 1.1, 1]} material={gold}><torusGeometry args={[0.37, 0.026, 6, 30, Math.PI]} /></mesh>
          <mesh scale={[1, 1.05, 1]} material={gold}><torusGeometry args={[0.28, 0.018, 6, 30, Math.PI]} /></mesh>
          <mesh scale={[1, 0.9, 1]} position={[0, 0, -0.01]} material={M.plain('#6b4a14', { roughness: 0.6 })}><circleGeometry args={[0.28, 24, 0, Math.PI]} /></mesh>
          {spikes.map((s, i) => <mesh key={i} position={s.p} rotation={[0, 0, s.rz]} material={gold}><coneGeometry args={[0.022, 0.07, 5]} /></mesh>)}
          <Ball rad={0.035} p={[-0.34, -0.01, 0]} m={gold} /><Ball rad={0.035} p={[0.34, -0.01, 0]} m={gold} />
          <Ball rad={0.03} p={[0, 0.42, 0]} m={gold} />
        </group>
      </group>
    );
  }

  function Temple({ dusk }) {
    const M = useM();
    const brickF = M.mat('brick', 4, 1, { color: '#dd9279' });
    const brickS = M.mat('brick', 3, 1, { color: '#dd9279' });
    const timberTop = M.plain('#2a1c15', { roughness: 0.8 });
    const timberFront = M.mat('wood', 4, 1, { color: '#3a2b22' });
    const timberSide = M.mat('wood', 3, 1, { color: '#3a2b22' });
    const beam = M.plain('#22160f', { roughness: 0.85 });
    const roofM = matOf('roofTile', { map: tileTex(), color: '#8c8078', roughness: 0.95, side: THREE.DoubleSide });
    const lat = matOf('latmat', { map: latticeTex(), roughness: 0.8 });
    const valF = matOf('valF', { map: valanceTex(48, 1), side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.8 });
    const valS = matOf('valS', { map: valanceTex(36, 1), side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.8 });
    const bulb = matOf(`bulb|${dusk}`, { color: '#ffcf80', emissive: '#ffa530', emissiveIntensity: dusk ? 2.2 : 0.35 });
    const brass = M.plain('#c9a247', { metalness: 0.7, roughness: 0.3 });
    const glow = matOf(`glowsh|${dusk}`, { color: '#e8d4a8', emissive: '#ffb04a', emissiveIntensity: dusk ? 0.9 : 0, roughness: 0.9 });

    const bays = [-1.45, -1.15, -0.85, -0.55, 0.55, 0.85, 1.15, 1.45];
    const frameItems = useMemo(() => bays.map((x) => ({ p: [x, 1.1, FZ + 0.012], s: [0.29, 0.66, 0.02] })), []);
    const panelItems = useMemo(() => bays.map((x) => ({ p: [x, 1.1, FZ + 0.03], s: [0.22, 0.56, 0.05] })), []);
    const sidePanels = useMemo(() => [-0.65, 0, 0.65].map((z) => ({ p: [W / 2 + 0.04, 1.1, z], s: [0.05, 0.56, 0.3] })), []);
    const sideShops = useMemo(() => [-0.7, 0, 0.7].map((z, i) => ({ p: [W / 2 + 0.012, 0.27, z], s: [0.03, 0.3, 0.38], c: ['#7d8084', '#8d3a32', '#3a5a88'][i] })), []);
    const shutters = useMemo(() => {
      const cs = ['#7d8084', '#8d3a32', '#3a5a88', '#c9c4b4', '#5a5f64', '#4c6a4e'];
      return [-1.45, -1.0, 1.0, 1.45].map((x, i) => ({ p: [x, 0.3, FZ + 0.012], s: [0.4, 0.5, 0.03], c: cs[(i * 2 + 1) % 6] }))
        .concat([-1.25, 1.25].map((x, i) => ({ p: [x, 0.29, FZ + 0.012], s: [0.0001, 0.0001, 0.0001], c: '#fff' })));
    }, []);
    const signs = useMemo(() => [[-1.45, '#c0272d'], [-1.0, '#2457a8'], [1.0, '#f2f0ea'], [1.45, '#e7b52c']].map(([x, c]) => ({ p: [x, 0.6, FZ + 0.015], s: [0.4, 0.07, 0.03], c })), []);
    const posts = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ p: [-W / 2 + 0.1 + i * ((W - 0.2) / 11), 0.83, FZ + 0.34], s: [0.035, 0.19, 0.035] })), []);
    const orns = useMemo(() => [-1.3, -0.8, -0.3, 0.3, 0.8, 1.3].map((x) => ({ p: [x, 0.97, FZ + 0.34], s: [0.05, 0.08, 0.05], r: Math.PI / 4 })), []);
    const bulbs = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ p: [-1.5 + i * (3.0 / 21), 0.74, FZ + 0.39], s: [0.03, 0.03, 0.03] })), []);
    const struts = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ p: [-1.5 + i * (3.0 / 11), 1.45, FZ + 0.1], s: [0.05, 0.26, 0.05], rx: 0.9 })), []);
    const sideStruts = useMemo(() => [-1, 1].flatMap((sx) => Array.from({ length: 6 }, (_, i) => ({ p: [sx * (W / 2 + 0.1), 1.45, -0.8 + i * 0.32], s: [0.05, 0.26, 0.05], rz: -sx * 0.95 }))), []);
    const rrOff = 0.015;
    const slopeLen = Math.hypot(RH, HD);
    const slopeAng = Math.atan2(RH, HD);

    return (
      <group>
        {/* ground floor: red brick shops at street level */}
        <mesh position={[0, GH / 2, 0]} material={[brickS, brickS, brickF, brickF, brickF, brickF]} castShadow receiveShadow><boxGeometry args={[W, GH, D]} /></mesh>
        <Box s={[W + 0.06, 0.04, D + 0.06]} p={[0, 0.02, 0]} m={M.plain('#6c6359', { roughness: 1 })} />
        {[-W / 2, -0.38, 0.38, W / 2].map((x) => <Box key={x} s={[0.1, GH, 0.06]} p={[x, GH / 2, FZ + 0.02]} m={beam} />)}
        <Inst items={shutters} mat={M.plain('#ffffff', { roughness: 0.6 })} />
        <Inst items={signs} mat={M.plain('#ffffff', { roughness: 0.6 })} />
        {/* central doorway with gilded frame */}
        <Box s={[0.6, 0.52, 0.03]} p={[0, 0.29, FZ + 0.012]} m={M.plain('#150f0b')} cast={false} />
        <Box s={[0.05, 0.56, 0.05]} p={[-0.33, 0.3, FZ + 0.03]} m={M.gold} cast={false} />
        <Box s={[0.05, 0.56, 0.05]} p={[0.33, 0.3, FZ + 0.03]} m={M.gold} cast={false} />
        <Box s={[0.7, 0.05, 0.05]} p={[0, 0.57, FZ + 0.03]} m={M.gold} cast={false} />
        <mesh position={[0, 0.58, FZ + 0.03]} scale={[1, 0.25, 1]} material={M.gold}><torusGeometry args={[0.3, 0.025, 6, 20, Math.PI]} /></mesh>
        <Box s={[0.5, 0.38, 0.02]} p={[0, 0.22, FZ + 0.03]} m={glow} cast={false} />
        {/* two seated brass lions flank the doorway, facing out */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.5, 0, FZ + 0.2]}>
            <Box s={[0.26, 0.08, 0.32]} p={[0, 0.04, 0]} m={M.plain('#5a5148', { roughness: 0.95 })} />
            <group position={[0, 0.08, 0]} scale={1.2}><Lion m={brass} /></group>
          </group>
        ))}
        {/* low sloping shop awning */}
        <Box s={[W + 0.2, 0.025, 0.5]} p={[0, 0.6, FZ + 0.25]} r={[0.2, 0, 0]} m={M.mat('roof', 3, 1, { color: '#9a7a64' })} />
        <Box s={[W + 0.2, 0.05, 0.03]} p={[0, 0.52, FZ + 0.5]} m={M.plain('#6a1d1a')} cast={false} />

        {/* first floor: one tall dark carved-timber face */}
        <mesh position={[0, (GH + EAVE - 0.07) / 2, 0]} material={[timberSide, timberSide, timberTop, timberTop, timberFront, timberFront]} castShadow receiveShadow><boxGeometry args={[W + 0.04, EAVE - 0.07 - GH, D + 0.04]} /></mesh>
        <group>
        {/* carved frieze band and short eave brackets under the eave */}
        <Box s={[W + 0.14, 0.1, 0.22]} p={[0, 1.5, FZ + 0.12]} m={lat} />
        <Box s={[W + 0.18, 0.05, 0.3]} p={[0, 1.57, FZ + 0.15]} m={beam} />
        <Box s={[0.22, 0.1, D + 0.14]} p={[W / 2 + 0.12, 1.5, 0]} m={lat} />
        <Box s={[0.22, 0.1, D + 0.14]} p={[-W / 2 - 0.12, 1.5, 0]} m={lat} />
        <Box s={[W + 0.12, 0.05, D + 0.12]} p={[0, GH + 0.01, 0]} m={beam} />
        <Box s={[W + 0.1, 0.05, D + 0.1]} p={[0, EAVE - 0.03, 0]} m={beam} />
        {[-W / 2, W / 2].map((x) => <Box key={x} s={[0.1, EAVE - 0.07 - GH, 0.1]} p={[x, (GH + EAVE - 0.07) / 2, FZ + 0.03]} m={beam} />)}
        <Inst items={frameItems} mat={M.plain('#3a2616', { roughness: 0.8 })} />
        <Inst items={panelItems} mat={lat} />
        <Inst items={sidePanels} mat={lat} />
        <Inst items={sideShops} mat={M.plain('#ffffff', { roughness: 0.7 })} />
        <Inst items={struts} mat={beam} />
        <Inst items={sideStruts} mat={beam} />
        <group position={[0, 0.09, 0]}><Torana M={M} /></group>

        {/* balcony: slab, sparse rail posts, gilded ornaments, lamps, four large griffins */}
        <Box s={[W + 0.02, 0.05, 0.36]} p={[0, 0.69, FZ + 0.18]} m={beam} />
        <Box s={[W + 0.02, 0.07, 0.34]} p={[0, 0.63, FZ + 0.17]} m={lat} />
        <Box s={[W - 0.06, 0.04, 0.04]} p={[0, 0.93, FZ + 0.34]} m={beam} />
        <Box s={[W - 0.06, 0.03, 0.03]} p={[0, 0.74, FZ + 0.34]} m={beam} />
        <Inst items={posts} mat={beam} />
        <Inst items={orns} mat={M.gold} />
        <Inst items={bulbs} mat={bulb} geo="sph" cast={false} />
        {[-1.04, -0.56, 0.56, 1.04].map((x) => (
          <group key={x} position={[x, 0.95, FZ + 0.34]} scale={1.1}><Griffin m={M.gold} /></group>
        ))}
        </group>

        {/* the one wide hipped tile roof */}
        <group position={[0, EAVE, 0]}>
          <Hip hw={HW} hd={HD} h={RH} rl={RL} m={roofM} k={2.2} />
          <Box s={[2 * RL + 0.12, 0.06, 0.09]} p={[0, RH + 0.01, 0]} m={timberTop} />
          <Box s={[2 * HW + 0.04, 0.09, 0.06]} p={[0, -0.04, HD]} m={beam} cast={false} />
          <Box s={[2 * HW + 0.04, 0.09, 0.06]} p={[0, -0.04, -HD]} m={beam} cast={false} />
          <Box s={[0.06, 0.09, 2 * HD]} p={[HW, -0.04, 0]} m={beam} cast={false} />
          <Box s={[0.06, 0.09, 2 * HD]} p={[-HW, -0.04, 0]} m={beam} cast={false} />
          <Box s={[2 * HW, 0.02, 2 * HD]} p={[0, -0.05, 0]} m={beam} cast={false} />
          {/* gilded strip along the eave edge and red-white fringed valance */}
          <Box s={[2 * HW + 0.02, 0.045, 0.045]} p={[0, 0.03, HD + 0.01]} m={M.gold} cast={false} />
          <mesh position={[0, -0.15, HD + 0.025]} material={valF}><planeGeometry args={[2 * HW + 0.02, 0.22]} /></mesh>
          <mesh position={[0, -0.15, -HD - 0.025]} rotation={[0, Math.PI, 0]} material={valF}><planeGeometry args={[2 * HW + 0.02, 0.22]} /></mesh>
          <mesh position={[HW + 0.025, -0.15, 0]} rotation={[0, Math.PI / 2, 0]} material={valS}><planeGeometry args={[2 * HD + 0.02, 0.22]} /></mesh>
          <mesh position={[-HW - 0.025, -0.15, 0]} rotation={[0, -Math.PI / 2, 0]} material={valS}><planeGeometry args={[2 * HD + 0.02, 0.22]} /></mesh>
          {/* long gilded banner (pataka) from the pinnacle down the front slope */}
          <group position={[0, RH / 2 + rrOff + 0.01, HD / 2]} rotation={[slopeAng, 0, 0]}>
            <Box s={[0.06, 0.014, slopeLen * 0.98]} p={[0, 0, 0]} m={M.gold} cast={false} />
            <Box s={[0.2, 0.018, slopeLen * 0.36]} p={[0, 0.003, slopeLen * 0.3]} m={M.gold} cast={false} />
            <mesh position={[0, 0.006, slopeLen * 0.48 + 0.02]} rotation={[Math.PI / 2, Math.PI / 4, 0]} scale={[1, 1, 1]} material={M.gold}><coneGeometry args={[0.15, 0.2, 4]} /></mesh>
          </group>
          {/* gilded ridge pinnacle */}
          <Gajur y={RH + 0.04} s={0.72} />
        </group>
      </group>
    );
  }

  function Main() {
    const [dusk, ref] = useDusk();
    return (
      <group ref={ref}>
        <Temple dusk={dusk} />
        <Frame s={[4.3, 2.5, 3.2]} p={[0, 1.25, 0.15]} />
      </group>
    );
  }

  /* ---------- environment: Indra Chowk ---------- */
  function Pole({ p, h = 2.3 }) {
    return (
      <group position={p}>
        <Cyl rt={0.035} rb={0.05} h={h} p={[0, h / 2, 0]} m={matOf('pole', { color: '#7d756c', roughness: 0.9 })} seg={8} />
        <Box s={[0.5, 0.03, 0.03]} p={[0, h - 0.1, 0]} m={matOf('pole', { color: '#7d756c', roughness: 0.9 })} />
        <Box s={[0.5, 0.03, 0.03]} p={[0, h - 0.32, 0]} m={matOf('pole', { color: '#7d756c', roughness: 0.9 })} />
      </group>
    );
  }
  function Wire({ a, b, sag = 0.12 }) {
    const obj = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 12; i += 1) { const t = i / 12; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t)); }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#2b2824' }));
    }, [a, b, sag]);
    return <primitive object={obj} />;
  }
  function Rickshaw({ p, r = 0, c = '#c0392b' }) {
    const M = useM();
    const blk = M.plain('#222');
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-0.14, 0.14].map((x) => <Cyl key={x} rt={0.09} h={0.03} p={[x, 0.09, -0.12]} r={[0, 0, Math.PI / 2]} m={blk} seg={14} />)}
        <Cyl rt={0.09} h={0.03} p={[0, 0.09, 0.22]} r={[0, 0, Math.PI / 2]} m={blk} seg={14} />
        <Box s={[0.28, 0.04, 0.34]} p={[0, 0.17, -0.1]} m={M.plain(c)} />
        <Box s={[0.28, 0.1, 0.03]} p={[0, 0.24, -0.26]} m={M.plain(c)} />
        <mesh position={[0, 0.34, -0.12]} rotation={[0.35, 0, 0]} material={M.plain('#e8d9b0')}><boxGeometry args={[0.32, 0.02, 0.3]} /></mesh>
        <Box s={[0.03, 0.12, 0.3]} p={[0, 0.2, 0.1]} r={[0.9, 0, 0]} m={blk} />
        <Box s={[0.12, 0.03, 0.08]} p={[0, 0.3, 0.2]} m={blk} />
      </group>
    );
  }
  function Bike({ p, r = 0, c = '#b02a2a' }) {
    const M = useM();
    const blk = M.plain('#1c1c1e');
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-0.18, 0.18].map((z) => <Cyl key={z} rt={0.075} h={0.03} p={[0, 0.075, z]} r={[0, 0, Math.PI / 2]} m={blk} seg={12} />)}
        <Box s={[0.07, 0.09, 0.3]} p={[0, 0.15, 0]} m={M.plain(c)} />
        <Box s={[0.07, 0.025, 0.14]} p={[0, 0.215, -0.07]} m={blk} />
        <Box s={[0.16, 0.02, 0.02]} p={[0, 0.25, 0.15]} m={blk} />
      </group>
    );
  }
  function Umbrella({ p, c = '#c0272d' }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.008} h={0.42} p={[0, 0.21, 0]} m={M.plain('#444')} seg={6} />
        <mesh position={[0, 0.44, 0]} material={M.plain(c)} castShadow><coneGeometry args={[0.26, 0.1, 10]} /></mesh>
        <Box s={[0.34, 0.07, 0.2]} p={[0, 0.035, 0.0]} m={M.plain('#8a6a4a')} />
      </group>
    );
  }
  function Awning({ p, w, c }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[w, 0.03, 0.5]} p={[0, 0.66, 0.22]} r={[0.25, 0, 0]} m={M.plain(c, { roughness: 0.8 })} />
        <Box s={[w, 0.07, 0.025]} p={[0, 0.56, 0.45]} m={M.plain('#f0ebe0', { roughness: 0.8 })} cast={false} />
      </group>
    );
  }
  function Stall({ p, c }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[0.5, 0.2, 0.3]} p={[0, 0.1, 0]} m={M.plain('#7a5a3a')} />
        <Box s={[0.46, 0.04, 0.26]} p={[0, 0.22, 0]} m={M.plain(c === '#e7b52c' ? '#d96a2a' : '#8ab04a', { roughness: 0.9 })} />
        <Cyl rt={0.01} h={0.6} p={[0.22, 0.3, 0.12]} m={M.plain('#444')} seg={6} />
        <mesh position={[0, 0.64, 0]} material={M.plain(c)} castShadow><coneGeometry args={[0.42, 0.1, 10]} /></mesh>
      </group>
    );
  }
  function Crate({ p, c }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[0.28, 0.16, 0.22]} p={[0, 0.08, 0]} m={M.plain('#7a5a3a')} />
        <Box s={[0.24, 0.05, 0.18]} p={[0, 0.18, 0]} m={M.plain(c, { roughness: 0.9 })} />
      </group>
    );
  }
  function Handcart({ p, r = 0 }) {
    const M = useM();
    const wood = M.plain('#7a5a3a', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        {[-0.2, 0.2].map((x) => <Cyl key={x} rt={0.1} h={0.03} p={[x, 0.1, 0]} r={[0, 0, Math.PI / 2]} m={M.plain('#222')} seg={14} />)}
        <Box s={[0.4, 0.04, 0.7]} p={[0, 0.2, 0]} m={wood} />
        <Box s={[0.4, 0.14, 0.03]} p={[0, 0.28, -0.34]} m={wood} />
        <Box s={[0.4, 0.14, 0.03]} p={[0, 0.28, 0.34]} m={wood} />
        <Box s={[0.34, 0.14, 0.5]} p={[0, 0.3, 0]} m={M.plain(['#c0392b', '#d8c9a0', '#2457a8'][Math.floor(Math.abs(r * 7)) % 3], { roughness: 0.9 })} />
        <Box s={[0.03, 0.03, 0.5]} p={[-0.14, 0.2, 0.6]} m={wood} />
        <Box s={[0.03, 0.03, 0.5]} p={[0.14, 0.2, 0.6]} m={wood} />
      </group>
    );
  }
  function Car({ p, r = 0, c = '#d9d4c4' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.48, 0.16, 1.0]} p={[0, 0.17, 0]} m={M.plain(c, { roughness: 0.5 })} />
        <Box s={[0.42, 0.14, 0.52]} p={[0, 0.31, -0.04]} m={M.plain('#3a4650', { roughness: 0.3 })} />
        <Box s={[0.4, 0.04, 0.46]} p={[0, 0.39, -0.04]} m={M.plain(c, { roughness: 0.5 })} />
        {[[-0.25, 0.32], [0.25, 0.32], [-0.25, -0.32], [0.25, -0.32]].map(([x, z], i) => <Cyl key={i} rt={0.08} h={0.06} p={[x, 0.08, z]} r={[0, 0, Math.PI / 2]} m={M.plain('#1c1c1e')} seg={12} />)}
      </group>
    );
  }
  function DomeShrine({ p, r = 0 }) {
    const M = useM();
    const wh = M.plain('#f1ece0', { roughness: 0.85 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.0, 0.1, 1.0]} p={[0, 0.05, 0]} m={M.mat('stone', 1, 1, { color: '#cfc6b6' })} />
        <Box s={[0.84, 0.5, 0.84]} p={[0, 0.35, 0]} m={wh} />
        <Box s={[0.34, 0.34, 0.04]} p={[0, 0.3, 0.43]} m={M.plain('#2a1a12')} />
        <Box s={[0.88, 0.05, 0.88]} p={[0, 0.62, 0]} m={M.plain('#d96a2a')} />
        <Cyl rt={0.3} h={0.14} p={[0, 0.7, 0]} m={wh} seg={16} />
        <Ball rad={0.34} sc={[1, 0.85, 1]} p={[0, 0.77, 0]} m={wh} />
        <Cyl rt={0.03} rb={0.06} h={0.14} p={[0, 1.1, 0]} m={M.gold} seg={8} />
        <Ball rad={0.05} p={[0, 1.2, 0]} m={M.gold} />
        <mesh position={[0, 1.34, 0]} material={M.gold}><coneGeometry args={[0.02, 0.18, 6]} /></mesh>
        {[-1, 1].map((k) => <Ball key={k} rad={0.045} p={[k * 0.46, 0.14, 0.46]} m={M.plain('#e08a2a')} />)}
      </group>
    );
  }
  function GaneshShrine({ p, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.6, 0.34, 0.6]} p={[0, 0.17, 0]} m={M.mat('brick', 1, 1, { color: '#dd9279' })} />
        <Box s={[0.26, 0.24, 0.03]} p={[0, 0.16, 0.31]} m={M.plain('#1a110c')} />
        <group position={[0, 0.34, 0]}><Hip hw={0.46} hd={0.46} h={0.28} rl={0.05} k={1} m={M.mat('roof', 1, 1, { color: '#8d7a6e', side: THREE.DoubleSide })} /></group>
        <Gajur y={0.62} s={0.22} />
        <Box s={[0.1, 0.06, 0.1]} p={[0, 0.03, 0.42]} m={M.plain('#e08a2a')} />
      </group>
    );
  }
  function Crowd({ list, dusk }) {
    const M = useM();
    const bodies = useMemo(() => list.map((q) => ({ p: [q.x, 0.19, q.z], s: [0.11, 0.15, 0.08], c: q.c })), [list]);
    const legs = useMemo(() => list.map((q, i) => ({ p: [q.x, 0.06, q.z], s: [0.08, 0.12, 0.07], c: i % 3 ? '#2b2f3a' : '#4a3d33' })), [list]);
    const heads = useMemo(() => list.map((q) => ({ p: [q.x, 0.3, q.z], s: [0.08, 0.09, 0.08], c: q.h })), [list]);
    const mat = M.plain('#ffffff', { roughness: 0.9 });
    return (
      <>
        <Inst items={bodies} mat={mat} />
        <Inst items={legs} mat={mat} />
        <Inst items={heads} mat={mat} geo="sph" />
      </>
    );
  }

  /* the older brick house left of the temple: pitched tile roof, green-painted balcony at first-floor level */
  function OldHouse({ p, w, h, d }) {
    const M = useM();
    const green = M.plain('#2f7a4a', { roughness: 0.8 });
    const dk = M.plain('#2a1c14', { roughness: 0.9 });
    const brick = M.mat('brick', 2, 2, { color: '#cf866c' });
    const roofT = matOf('oldroof', { map: tileTex(), color: '#c4b4a6', roughness: 0.95, side: THREE.DoubleSide });
    const fz = d / 2;
    const fy = h * 0.5;
    return (
      <group position={[p[0], 0, p[1]]}>
        <mesh position={[0, h / 2, 0]} material={brick} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
        <Box s={[w + 0.04, 0.05, d + 0.04]} p={[0, fy, 0]} m={M.plain('#3a281c')} />
        {/* ground floor: shutter and door */}
        <Box s={[0.5, 0.6, 0.03]} p={[-w * 0.22, 0.4, fz + 0.01]} m={M.plain('#7d8084')} cast={false} />
        <Box s={[0.4, 0.7, 0.03]} p={[w * 0.25, 0.42, fz + 0.01]} m={dk} cast={false} />
        {/* first floor: two timber-framed windows opening onto the balcony */}
        {[-0.38, 0.38].map((x) => (
          <group key={x} position={[w * x * 0.9, fy + 0.5, fz + 0.01]}>
            <Box s={[0.36, 0.55, 0.03]} p={[0, 0, 0]} m={M.plain('#3a281c')} cast={false} />
            <Box s={[0.28, 0.46, 0.04]} p={[0, 0, 0.01]} m={dk} cast={false} />
            <Box s={[0.02, 0.46, 0.05]} p={[0, 0, 0.02]} m={green} cast={false} />
          </group>
        ))}
        {/* green balcony: slab, rail, balusters */}
        <Box s={[w * 0.92, 0.06, 0.34]} p={[0, fy + 0.06, fz + 0.17]} m={green} />
        <Box s={[w * 0.92, 0.04, 0.04]} p={[0, fy + 0.4, fz + 0.33]} m={green} />
        <Box s={[0.04, 0.34, 0.34]} p={[-w * 0.46, fy + 0.23, fz + 0.17]} m={green} />
        <Box s={[0.04, 0.34, 0.34]} p={[w * 0.46, fy + 0.23, fz + 0.17]} m={green} />
        {Array.from({ length: 11 }, (_, i) => <Box key={i} s={[0.025, 0.32, 0.025]} p={[-w * 0.44 + i * (w * 0.88 / 10), fy + 0.23, fz + 0.33]} m={green} cast={false} />)}
        {/* pitched tile roof with overhanging eaves */}
        <group position={[0, h, 0]}>
          <Hip hw={w / 2 + 0.2} hd={d / 2 + 0.22} h={0.55} rl={w * 0.2} k={2.2} m={roofT} />
          <Box s={[w + 0.44, 0.05, 0.05]} p={[0, 0, d / 2 + 0.22]} m={dk} cast={false} />
        </group>
      </group>
    );
  }

  function Env() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const asphalt = M.plain('#4b4b4f', { roughness: 0.95 });
    const paving = M.mat('stone', 4, 4, { color: '#cdbfae' });

    const crowd = useMemo(() => {
      const r = rng(77);
      const cs = ['#c0392b', '#2457a8', '#e7b52c', '#2d8a4e', '#f2f0ea', '#8a3a7a', '#e07a2a', '#2b2b2f', '#d96a8a'];
      const sk = ['#c58a62', '#a8714a', '#8a5a3a', '#d6a07a'];
      const out = [];
      for (let i = 0; i < 30; i += 1) out.push({ x: -3.4 + r() * 7.6, z: 2.6 + r() * 2.8, c: cs[Math.floor(r() * cs.length)], h: sk[Math.floor(r() * sk.length)] });
      for (let i = 0; i < 14; i += 1) out.push({ x: -8 + r() * 18, z: 5.5 + r() * 9, c: cs[Math.floor(r() * cs.length)], h: sk[Math.floor(r() * sk.length)] });
      for (let i = 0; i < 10; i += 1) out.push({ x: -26 + r() * 16, z: 3.4 + r() * 5, c: cs[Math.floor(r() * cs.length)], h: sk[Math.floor(r() * sk.length)] });
      return out;
    }, []);

    const B = (k, p, w, h, d, r, kind, seed, extra) => <Bld key={k} p={p} w={w} h={h} d={d} r={r} kind={kind} seed={seed} dusk={dusk} {...extra} />;
    const NEG = Math.PI;
    return (
      <group ref={ref}>
        {/* ground: grey city floor, tarmac across most of the front, narrow stone pavements */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.plain('#8d887d', { roughness: 1 })}><circleGeometry args={[95, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.003, 7]} receiveShadow material={paving}><planeGeometry args={[26, 12]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.005, 10]} receiveShadow material={asphalt}><planeGeometry args={[24, 6]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-38, 0.007, 6]} receiveShadow material={asphalt}><planeGeometry args={[58, 6]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.5, 0.007, -20]} receiveShadow material={asphalt}><planeGeometry args={[1.8, 42]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.15, 0.007, 30]} receiveShadow material={asphalt}><planeGeometry args={[1.3, 24]} /></mesh>
        {/* kerbed pavements: in front of the shops (west side) and a paved patch round the Shiva shrine */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 2.2]} receiveShadow material={M.plain('#b8ae9e', { roughness: 1 })}><planeGeometry args={[13, 2.2]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9.6, 0.009, 6.2]} receiveShadow material={paving}><planeGeometry args={[4.2, 4.2]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.6, 0.009, 2.6]} receiveShadow material={paving}><planeGeometry args={[2.2, 1.8]} /></mesh>
        {[-6, -2, 2, 6].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.011, 9.5]} material={M.plain('#d8d4c4', { roughness: 1 })}><planeGeometry args={[1.4, 0.07]} /></mesh>)}
        <Crate p={[-2.3, 0, 2.4]} c="#d96a2a" />
        <Crate p={[-2.6, 0, 2.7]} c="#8ab04a" />
        <Crate p={[2.4, 0, 2.5]} c="#e7b52c" />
        <Crate p={[2.7, 0, 2.3]} c="#c0392b" />
        <Awning p={[-2.6, 0, 1.15]} w={0.8} c="#2457a8" />
        <Awning p={[2.6, 0, 1.0]} w={0.9} c="#e7b52c" />

        {/* neighbours of the temple: older brick house (left), narrow 4-5 storey shops right and behind */}
        <OldHouse p={[-3.2, -0.1]} w={2.1} h={1.95} d={2.0} />
        {B('L2a', [-4.9, -0.9], 1.5, 3.3, 1.8, 0, 'concrete', 5, { tank: true, bal: 2 })}
        {B('L2b', [-6.5, -1.4], 1.7, 4.8, 1.9, 0, 'white', 6, { bal: 1, rsign: true })}
        {B('L3a', [-8.2, -0.7], 1.7, 2.8, 2.0, 0, 'brick', 8, { bal: 1 })}
        {B('L3b', [-9.9, -1.6], 1.6, 4.2, 2.0, 0, 'grey', 9, { bal: 2, tank: true })}
        {B('R1', [3.4, -0.7], 1.7, 2.9, 2.4, 0, 'brick', 11, { bal: 1 })}
        {B('R1b', [5.1, -1.9], 1.6, 4.0, 2.4, 0, 'concrete', 13, { bal: 2, tank: true })}
        {B('R2', [6.9, -0.9], 1.8, 3.1, 2.6, 0, 'white', 12, { bal: 1 })}
        {B('R3', [8.7, -1.9], 1.7, 4.8, 2.6, 0, 'grey', 14, { bal: 1, rsign: true })}
        {B('R4', [10.0, -0.5], 1.6, 4.2, 2.6, 0, 'brick', 15, { bal: 2 })}
        {['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10', 'K11', 'K12'].map((k, i) => {
          const ws = [1.8, 1.5, 2.1, 1.6, 1.9, 1.5, 2.0, 1.7, 1.6, 2.2, 1.8, 1.5];
          const hs = [4.0, 3.4, 4.6, 3.8, 4.4, 3.6, 4.8, 3.5, 4.2, 3.8, 4.6, 3.4];
          const ks = ['concrete', 'brick', 'grey', 'white', 'brick', 'concrete'];
          const xs = ws.reduce((acc, w, j) => { acc.push(j ? acc[j - 1] + ws[j - 1] / 2 + w / 2 + 0.06 : -12); return acc; }, []);
          return B(k, [xs[i], -4.4], ws[i], hs[i], 2.4, 0, ks[i % 6], 21 + i, { tank: i % 3 === 0, bal: (i % 2) + 1, rsign: i % 4 === 1 });
        })}
        {/* north side of the chowk (faces west) */}
        {B('N1', [12.2, 0.8], 2.2, 3.4, 2.8, -Math.PI / 2, 'brick', 31, { bal: 1 })}
        {B('N1b', [12.2, 3.2], 2.0, 4.4, 2.8, -Math.PI / 2, 'grey', 34, { bal: 2, rsign: true })}
        {B('N2', [12.0, 5.5], 2.4, 3.8, 2.6, -Math.PI / 2, 'concrete', 32, { tank: true, bal: 1 })}
        {B('N2b', [12.0, 8.0], 2.2, 4.6, 2.6, -Math.PI / 2, 'white', 35, { bal: 2 })}
        {B('N3', [12.2, 10.4], 2.4, 3.4, 2.8, -Math.PI / 2, 'brick', 33, { bal: 1 })}
        {B('N3b', [12.2, 12.9], 2.4, 4.2, 2.8, -Math.PI / 2, 'concrete', 36, { rsign: true })}
        {/* east side (Raki Bazaar alley between the two blocks) */}
        {B('E1', [-5.5, 18.4], 2.2, 3.4, 3.2, NEG, 'white', 41, { bal: 1 })}
        {B('E1b', [-3.4, 18.4], 1.8, 4.2, 3.2, NEG, 'brick', 47, { bal: 2, rsign: true })}
        {B('E2', [-0.4, 18.3], 2.0, 3.8, 3.0, NEG, 'brick', 42, { tank: true, bal: 1 })}
        {B('E3', [3.6, 18.4], 2.4, 4.4, 3.2, NEG, 'concrete', 43, { bal: 2 })}
        {B('E3b', [6.2, 18.4], 2.0, 3.4, 3.2, NEG, 'grey', 48, { bal: 1 })}
        {B('E4', [8.8, 18.2], 2.4, 4.0, 3.0, NEG, 'grey', 44, { bal: 1, rsign: true })}
        {B('A1', [-2.4, 31], 3.0, 2.8, 22, NEG, 'brick', 45)}
        {B('A2', [4.6, 31], 3.0, 3.0, 22, NEG, 'white', 46)}
        {/* Shukra Path: wide road to the south-west lined with white stucco houses */}
        {[0, 1, 2, 3, 4, 5].map((i) => B(`S${i}`, [-14 - i * 3.6, 1.2], 3.2, 2.5 + (i % 3) * 0.6, 3.6, 0, i % 3 === 1 ? 'grey' : 'white', 50 + i, { bal: i % 2 }))}
        {[0, 1, 2, 3, 4, 5].map((i) => B(`T${i}`, [-14 - i * 3.6, 11.4], 3.2, 2.5 + ((i + 1) % 3) * 0.6, 3.6, NEG, i % 2 ? 'white' : 'grey', 70 + i, { bal: (i + 1) % 2 }))}
        {/* SW street towards Makhan and Durbar Square */}
        {[0, 1, 2].map((i) => B(`W${i}`, [-10.5, -4 - i * 5.2], 3.4, 3.0 + (i % 2) * 0.8, 4.6, Math.PI / 2, i % 2 ? 'brick' : 'white', 90 + i))}

        {/* shrines and street furniture: Shiva dome shrine at the north side of the chowk, Ganesh shrine at the south-west corner */}
        <group scale={1.5} position={[9.6, 0, 6.2]}><DomeShrine p={[0, 0.01, 0]} r={-1.2} /></group>
        <group scale={1.3} position={[-6.6, 0, 2.6]}><GaneshShrine p={[0, 0.01, 0]} r={0.2} /></group>
        {/* shop awnings and pavement stalls in front of the neighbouring shops */}
        <Awning p={[-3.2, 0, 1.15]} w={1.8} c="#c0392b" />
        <Awning p={[-4.9, 0, -0.15]} w={1.3} c="#2457a8" />
        <Awning p={[-6.5, 0, -0.65]} w={1.5} c="#e7b52c" />
        <Awning p={[3.4, 0, 0.25]} w={1.6} c="#2d8a4e" />
        <Awning p={[6.9, 0, 0.15]} w={1.7} c="#c0392b" />
        <Stall p={[-4.3, 0, 2.2]} c="#e7b52c" />
        <Stall p={[-7.2, 0, 1.4]} c="#c0272d" />
        <Stall p={[4.4, 0, 1.4]} c="#2457a8" />
        <Stall p={[8.0, 0, 1.6]} c="#2d8a4e" />
        <Handcart p={[2.6, 0, 3.3]} r={0.4} />
        <Handcart p={[-2.5, 0, 4.4]} r={-0.5} />
        <Handcart p={[6.1, 0, 4.4]} r={1.2} />
        <Handcart p={[-9.4, 0, 2.3]} r={0.1} />
        <Car p={[3.0, 0, 7.4]} r={0.5} c="#d9d4c4" />
        <Car p={[-4.5, 0, 6.8]} r={2.9} c="#2457a8" />
        <Car p={[-17, 0, 6.6]} r={3.1} c="#8d3a32" />
        <Pole p={[-2.9, 0, 2.5]} />
        <Pole p={[7.8, 0, 3.2]} h={2.4} />
        <Pole p={[-9.5, 0, 3.4]} h={2.4} />
        <Wire a={[-2.9, 2.2, 2.5]} b={[7.8, 2.3, 3.2]} />
        <Wire a={[-2.9, 2.0, 2.5]} b={[7.8, 2.1, 3.2]} />
        <Wire a={[-2.9, 2.2, 2.5]} b={[-9.5, 2.3, 3.4]} />
        <Wire a={[-2.9, 2.0, 2.5]} b={[-5.0, 2.8, 0.8]} sag={0.05} />
        <Wire a={[7.8, 2.3, 3.2]} b={[3.2, 3.2, 0.6]} sag={0.05} />
        <Wire a={[-9.5, 2.3, 3.4]} b={[-20, 2.2, 3.8]} sag={0.2} />
        <Rickshaw p={[1.9, 0, 3.6]} r={0.5} c="#c0392b" />
        <Rickshaw p={[-1.8, 0, 3.7]} r={-0.3} c="#2457a8" />
        <Rickshaw p={[4.8, 0, 5.2]} r={2.6} c="#2d8a4e" />
        <Rickshaw p={[-12, 0, 5.2]} r={1.5} c="#e7b52c" />
        <Bike p={[0.4, 0, 2.9]} r={0.3} c="#b02a2a" />
        <Bike p={[-0.6, 0, 3.2]} r={-0.2} c="#2457a8" />
        <Bike p={[3.1, 0, 2.7]} r={1.2} c="#222" />
        <Bike p={[-4.0, 0, 3.8]} r={0.6} c="#d9d4c4" />
        <Bike p={[2.6, 0, 8.3]} r={0.4} c="#b02a2a" />
        <Bike p={[-15, 0, 4.4]} r={1.6} c="#2457a8" />
        <Bike p={[1.2, 0, 4.6]} r={0.2} c="#222" />
        <Bike p={[-1.0, 0, 5.4]} r={-0.4} c="#b02a2a" />
        <Bike p={[2.0, 0, 6.2]} r={2.8} c="#d9d4c4" />
        <Bike p={[-5.6, 0, 3.0]} r={0.3} c="#2d8a4e" />
        <Bike p={[7.0, 0, 2.8]} r={-0.3} c="#2457a8" />
        <Bike p={[5.6, 0, 6.6]} r={3.4} c="#222" />
        <Bike p={[-8.2, 0, 5.2]} r={1.7} c="#b02a2a" />
        <Bike p={[0.2, 0, 7.8]} r={0.1} c="#e7b52c" />
        <Bike p={[-11, 0, 3.9]} r={-0.2} c="#222" />
        <Pole p={[3.9, 0, 2.2]} h={2.5} />
        <Wire a={[3.9, 2.3, 2.2]} b={[-2.9, 2.2, 2.5]} sag={0.1} />
        <Wire a={[3.9, 2.1, 2.2]} b={[7.8, 2.3, 3.2]} sag={0.1} />
        <Wire a={[3.9, 2.4, 2.2]} b={[12, 3.0, 6]} sag={0.2} />
        <Umbrella p={[3.8, 0, 2.2]} c="#c0272d" />
        <Umbrella p={[-2.2, 0, 2.2]} c="#2457a8" />
        <Umbrella p={[5.4, 0, 3.9]} c="#e7b52c" />
        <Umbrella p={[-3.2, 0, 3.3]} c="#2d8a4e" />
        <Crowd list={crowd} dusk={dusk} />

        {/* dusk: warm shop-light pools and street lamps */}
        {dusk && (
          <>
            <pointLight position={[0, 0.9, 2.6]} intensity={5} distance={7} color="#ffb060" />
            <pointLight position={[-3.5, 1.2, 3]} intensity={3} distance={6} color="#ffc070" />
            <pointLight position={[4.5, 1.2, 3]} intensity={3} distance={6} color="#ffc070" />
            <pointLight position={[6.8, 0.9, 6.9]} intensity={2.5} distance={4} color="#ffa040" />
          </>
        )}
        {[[-2.9, 2.1, 2.55], [7.8, 2.2, 3.25], [-9.5, 2.2, 3.45]].map((q, i) => (
          <Ball key={i} rad={0.05} p={q} m={matOf(`lamp|${dusk}`, { color: '#fff1c8', emissive: '#ffd27a', emissiveIntensity: dusk ? 3 : 0.3 })} />
        ))}
      </group>
    );
  }

  return { 'akash-bhairab-temple': { Main, Env } };
}
