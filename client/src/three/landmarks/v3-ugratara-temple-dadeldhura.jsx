// Ugratara Temple, Dadeldhura (Amargadhi-7, Sudurpashchim). A low, modern PAINTED-CONCRETE compound on a grassy forested hilltop:
// a small candy-pink / turquoise sanctum with a goddess-and-lions arched crest atop a 7-step striped stair, a banded round mound
// (left), a dark-stone slate-roofed shrine (right), a long pink arcaded hall behind, strings of prayer flags, a freestanding
// entrance gate at the lawn edge, conifer forest on three sides. 1 unit = about 1 m. Front (stair) faces +z.
// Layout, counts and sizes are photo-based / estimated (web sources are thin).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Elephant, THREE, useMemo, Frame } = K;

  const PINK = '#eaa6b8';
  const TEAL = '#3bb3a8';
  const CREAM = '#e9e3d3';
  const BUFF = '#d8b873';
  const FLAGC = ['#2f6db5', '#f2efe6', '#c8372b', '#2e9b57', '#e8b92e'];
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const H0 = 2.0; // platform height (7 steps)
  const SW = 6.5; // stair width
  const NS = 7;
  const RISE = H0 / NS;
  const RUN = 0.46;
  const Z0 = 5.2; // stair foot z

  const pal = (M) => ({
    pink: M.plain(PINK, { roughness: 0.85 }),
    pink2: M.plain('#f3c1cf', { roughness: 0.85 }),
    teal: M.plain(TEAL, { roughness: 0.8 }),
    teal2: M.plain('#1f9a96', { roughness: 0.8 }),
    pink3: M.plain('#e58aa3', { roughness: 0.8 }),
    rose: M.plain('#c4607c', { roughness: 0.85 }),
    cream: M.plain(CREAM, { roughness: 0.85 }),
    white: M.plain('#f3efe6', { roughness: 0.9 }),
    dark: M.plain('#2a2522', { roughness: 1 }),
    slate: M.plain('#4a4a4e', { roughness: 0.95 }),
    gold: M.plain('#d9a93a', { roughness: 0.4, metalness: 0.6 }),
    grey: M.plain('#a9a29b', { roughness: 0.95 }),
    yellow: M.plain('#e2c12c', { roughness: 0.9 }),
  });

  function canvasTex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 4;
    return t;
  }

  /* ---------- statues (own, simple) ---------- */
  function LionS({ m, mane }) {
    return (
      <group>
        <Box s={[0.5, 0.55, 0.8]} p={[0, 0.45, -0.15]} m={m} />
        <Box s={[0.44, 0.7, 0.35]} p={[0, 0.7, 0.18]} r={[-0.15, 0, 0]} m={m} />
        <Ball rad={0.3} p={[0, 1.05, 0.28]} m={mane || m} />
        <Box s={[0.26, 0.2, 0.28]} p={[0, 0.98, 0.55]} m={m} />
        {[-1, 1].map((k) => <Box key={k} s={[0.12, 0.34, 0.14]} p={[k * 0.16, 0.2, 0.42]} m={m} />)}
        <Box s={[0.1, 0.55, 0.1]} p={[0, 0.5, -0.65]} r={[0.5, 0, 0]} m={m} />
        <Ball rad={0.1} p={[0, 0.8, -0.8]} m={m} />
      </group>
    );
  }
  function GoddessS({ m, gold, halo }) {
    return (
      <group>
        <Box s={[0.9, 0.2, 0.5]} p={[0, 0.1, 0]} m={m} />
        <Cyl rt={0.28} rb={0.4} h={0.7} p={[0, 0.55, 0]} m={m} seg={10} />
        <Ball rad={0.2} p={[0, 1.05, 0]} m={m} />
        <mesh position={[0, 1.38, 0]} material={gold} castShadow><coneGeometry args={[0.18, 0.4, 8]} /></mesh>
        <Cyl rt={0.55} h={0.05} p={[0, 1.0, -0.2]} r={[Math.PI / 2, 0, 0]} m={halo} seg={20} />
        {[-3, -2, -1, 1, 2, 3].map((k) => <Box key={k} s={[0.07, 0.6, 0.07]} p={[k * 0.2, 0.8 + Math.abs(k) * 0.05, 0.05]} r={[0, 0, -k * 0.16]} m={m} />)}
      </group>
    );
  }
  function GuardS() {
    const M = useM(); const P = pal(M);
    const skin = M.plain('#e9ddc8', { roughness: 0.9 });
    return (
      <group>
        <Box s={[0.95, 0.3, 0.95]} p={[0, 0.15, 0]} m={P.teal2} />
        <Box s={[0.8, 0.12, 0.8]} p={[0, 0.34, 0]} m={P.cream} />
        <Box s={[0.2, 0.9, 0.24]} p={[-0.14, 0.85, 0]} m={P.white} />
        <Box s={[0.2, 0.9, 0.24]} p={[0.14, 0.85, 0]} m={P.white} />
        <Cyl rt={0.3} rb={0.36} h={0.7} p={[0, 1.55, 0]} m={P.white} seg={10} />
        <Box s={[0.62, 0.16, 0.34]} p={[0, 1.78, 0]} m={P.gold} />
        <Cyl rt={0.31} rb={0.31} h={0.14} p={[0, 1.38, 0]} m={P.pink3} seg={10} />
        <Box s={[0.12, 0.5, 0.12]} p={[-0.38, 1.6, 0.05]} m={P.white} />
        <Box s={[0.12, 0.5, 0.12]} p={[0.38, 1.6, 0.05]} m={P.white} />
        <Cyl rt={0.025} rb={0.025} h={2.2} p={[0.45, 1.5, 0.12]} m={P.gold} seg={5} />
        <Ball rad={0.2} p={[0, 2.12, 0]} m={skin} />
        <Cyl rt={0.14} rb={0.24} h={0.3} p={[0, 2.38, 0]} m={P.gold} seg={8} />
      </group>
    );
  }
  function ElephantS({ p, s = 3, rot = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, rot, 0]} scale={s}>
        <Elephant m={M.plain('#f1eee6', { roughness: 0.9 })} />
      </group>
    );
  }

  /* ---------- geometry helpers ---------- */
  function crestGeo(hw, side, R, scallop, depth) {
    const pts = [[-hw, 0], [hw, 0], [hw, side]];
    const N = 40;
    for (let i = 0; i <= N; i += 1) {
      const a = (i / N) * Math.PI;
      const rr = R * (1 + scallop * Math.abs(Math.sin(i * 0.5 * 3.1416 * 1.0 * 2)));
      pts.push([Math.cos(a) * rr, side + Math.sin(a) * rr]);
    }
    pts.push([-hw, side]);
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  }
  function spandrelGeo(hw, h, depth) {
    const s = new THREE.Shape();
    s.moveTo(-hw, 0); s.lineTo(-hw, h); s.lineTo(hw, h); s.lineTo(hw, 0); s.lineTo(hw - 0.2, 0);
    s.quadraticCurveTo(hw - 0.3, h * 0.55, hw * 0.5, h * 0.66);
    s.quadraticCurveTo(hw * 0.25, h * 0.74, 0, h * 0.9);
    s.quadraticCurveTo(-hw * 0.25, h * 0.74, -hw * 0.5, h * 0.66);
    s.quadraticCurveTo(-hw + 0.3, h * 0.55, -hw + 0.2, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  }

  /* the arched goddess crest (also used on the gate) */
  function Crest({ w = 3.8, side = 0.6, lions = true, scale = 1, lionS = 1.25 }) {
    const M = useM();
    const P = pal(M);
    const hw = w / 2;
    const rim = useMemo(() => crestGeo(hw + 0.4, side, hw + 0.4, 0.09, 0.22), [hw, side]);
    const inner = useMemo(() => crestGeo(hw, side, hw, 0, 0.3), [hw, side]);
    const core = useMemo(() => crestGeo(hw - 0.4, side, hw - 0.4, 0, 0.36), [hw, side]);
    return (
      <group scale={scale}>
        <mesh geometry={rim} material={P.teal} castShadow />
        <mesh geometry={inner} material={P.pink} position={[0, 0.02, 0]} castShadow />
        <mesh geometry={core} material={P.cream} position={[0, 0.04, 0]} castShadow />
        <group position={[0, side + 0.05, 0.4]} scale={1.75}><GoddessS m={P.pink2} gold={P.gold} halo={P.gold} /></group>
        <mesh position={[0, side + hw + 0.55, 0.1]} material={P.gold} castShadow><coneGeometry args={[0.16, 0.7, 8]} /></mesh>
        {lions && [-1, 1].map((k) => (
          <group key={k} position={[k * (hw * 0.86), side + hw * 0.5 + 0.2, 0.1]} rotation={[0, k * Math.PI / 2, 0]} scale={lionS}>
            <LionS m={P.cream} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- merged prayer flags ---------- */
  function Flags({ strings, poles }) {
    const geo = useMemo(() => {
      const pos = []; const col = []; const c = new THREE.Color();
      const quad = (a, b, cc, d, color) => {
        [a, b, cc, a, cc, d].forEach((v) => { pos.push(v[0], v[1], v[2]); col.push(color.r, color.g, color.b); });
      };
      strings.forEach(([a, b, n, sag], si) => {
        const dx = b[0] - a[0]; const dz = b[2] - a[2];
        const len = Math.hypot(dx, dz) || 1;
        const ux = dx / len; const uz = dz / len;
        for (let i = 0; i < n; i += 1) {
          const t = (i + 0.5) / n; const t2 = t + 0.55 / n;
          const f = (tt) => [a[0] + dx * tt, a[1] + (b[1] - a[1]) * tt - Math.sin(tt * Math.PI) * sag, a[2] + dz * tt];
          const p0 = f(t); const p1 = f(Math.min(t2, 1));
          c.set(FLAGC[(i + si) % 5]);
          quad(p0, p1, [p1[0], p1[1] - 0.42, p1[2]], [p0[0], p0[1] - 0.42, p0[2]], c);
        }
      });
      poles.forEach(([x, y, z, h], pi) => {
        const m = Math.floor(h / 0.6) - 1;
        for (let i = 0; i < m; i += 1) {
          c.set(FLAGC[(i + pi) % 5]);
          const yy = y + h - 0.2 - i * 0.55;
          const wv = 0.45 + ((i * 7 + pi) % 3) * 0.12;
          const sx = pi % 2 ? 1 : -1;
          quad([x, yy, z], [x + sx * wv, yy - 0.05, z + 0.1 * sx], [x + sx * wv, yy - 0.42, z + 0.1 * sx], [x, yy - 0.4, z], c);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, [strings, poles]);
    const M = useM();
    return (
      <group>
        <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
        {poles.map(([x, y, z, h], i) => <Cyl key={i} rt={0.04} rb={0.06} h={h} p={[x, y + h / 2, z]} m={M.plain('#d7d0c2')} seg={5} />)}
      </group>
    );
  }

  /* ---------- the stair ---------- */
  function Stair() {
    const M = useM(); const P = pal(M);
    const stripe = [P.teal2, P.pink3, P.white];
    return (
      <group>
        {Array.from({ length: NS }, (_, i) => {
          const zf = Z0 - i * RUN; const zb = Z0 - NS * RUN; const d = zf - zb;
          return (
            <group key={i}>
              <Box s={[SW, (i + 1) * RISE, d]} p={[0, ((i + 1) * RISE) / 2, (zf + zb) / 2]} m={stripe[i % 3]} />
            </group>
          );
        })}
        {[-1, 1].map((k) => (
          <group key={k}>
            {Array.from({ length: NS }, (_, i) => {
              const zf = Z0 - i * RUN; const hh = (i + 1) * RISE + 0.55;
              return (
                <group key={i}>
                  <Box s={[0.5, hh, RUN]} p={[k * (SW / 2 + 0.25), hh / 2, zf - RUN / 2]} m={P.pink} />
                  <Box s={[0.6, 0.1, RUN + 0.02]} p={[k * (SW / 2 + 0.25), hh + 0.05, zf - RUN / 2]} m={i % 2 ? P.teal : P.white} />
                </group>
              );
            })}
            <Box s={[0.7, 1.1, 0.7]} p={[k * (SW / 2 + 0.25), 0.55, Z0 + 0.25]} m={P.pink} />
            <Box s={[0.8, 0.12, 0.8]} p={[k * (SW / 2 + 0.25), 1.16, Z0 + 0.25]} m={P.teal} />
            <ElephantS p={[k * (SW / 2 + 2.7), 0.15, Z0 + 1.0]} s={3.0} />
            <Box s={[1.3, 0.15, 1.9]} p={[k * (SW / 2 + 2.7), 0.075, Z0 + 0.7]} m={P.teal} />
            <group position={[k * (SW / 2 + 1.0), 0, Z0 + 0.9]} rotation={[0, -k * 0.25, 0]}><GuardS /></group>
            <group position={[k * (SW / 2 + 0.25), 3 * RISE + 1.1, Z0 - 3 * RUN - 0.2]} scale={0.85}><LionS m={P.white} /></group>
          </group>
        ))}
      </group>
    );
  }

  /* ---------- platform + sanctum ---------- */
  function Sanctum() {
    const M = useM(); const P = pal(M);
    const PW = 8.5; const PZ0 = Z0 - NS * RUN; const PZ1 = -5.0;
    const pd = PZ0 - PZ1;
    const doorGlow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2210', emissive: '#ff8a2a', emissiveIntensity: 0.35, roughness: 1 }), []);
    return (
      <group>
        {/* platform (wings either side of the stair) */}
        <Box s={[PW, H0, pd]} p={[0, H0 / 2, (PZ0 + PZ1) / 2]} m={P.pink} />
        <Box s={[PW + 0.1, 0.32, pd + 0.1]} p={[0, 0.16, (PZ0 + PZ1) / 2]} m={P.teal} />
        <Box s={[PW + 0.1, 0.26, pd + 0.1]} p={[0, H0 - 0.45, (PZ0 + PZ1) / 2]} m={P.teal} />
        <Box s={[PW + 0.25, 0.22, pd + 0.25]} p={[0, H0 - 0.11, (PZ0 + PZ1) / 2]} m={P.cream} />
        <group position={[0, H0, 0]}>
          {/* body */}
          <Box s={[5.0, 3.6, 3.4]} p={[0, 1.8, -1.2]} m={P.pink} />
          <Box s={[5.15, 0.28, 3.55]} p={[0, 0.14, -1.2]} m={P.teal} />
          <Box s={[5.15, 0.22, 3.55]} p={[0, 3.45, -1.2]} m={P.teal} />
          {/* portico */}
          <Box s={[5.5, 0.3, 1.9]} p={[0, 3.45, 1.35]} m={P.pink} />
          <Box s={[5.6, 0.14, 2.0]} p={[0, 3.64, 1.35]} m={P.teal} />
          <Box s={[5.4, 0.2, 1.8]} p={[0, 0.1, 1.4]} m={P.cream} />
          {[-2.4, -0.8, 0.8, 2.4].map((x) => (
            <group key={x}>
              <Cyl rt={0.17} rb={0.2} h={3.2} p={[x, 1.7, 2.1]} m={P.teal} seg={10} />
              <Cyl rt={0.22} h={0.2} p={[x, 2.1, 2.1]} m={P.pink} seg={10} />
              <Box s={[0.5, 0.2, 0.5]} p={[x, 3.28, 2.1]} m={P.pink2} />
            </group>
          ))}
          {/* door and flanking panels on the back wall of the portico */}
          <Box s={[1.7, 2.5, 0.1]} p={[0, 1.4, 0.55]} m={P.teal} />
          <Box s={[1.25, 2.2, 0.14]} p={[0, 1.3, 0.58]} m={doorGlow} />
          {[-1, 1].map((k) => (
            <group key={k}>
              <Box s={[1.1, 1.3, 0.08]} p={[k * 1.75, 1.7, 0.55]} m={P.teal} />
              <Box s={[0.8, 1.0, 0.1]} p={[k * 1.75, 1.7, 0.58]} m={P.cream} />
              <Box s={[0.6, 0.8, 0.12]} p={[k * 1.75, 1.7, 0.6]} m={P.pink2} />
            </group>
          ))}
          {/* arched crest */}
          <Box s={[5.2, 0.36, 0.55]} p={[0, 3.9, 2.15]} m={P.teal} />
          <group position={[0, 4.08, 2.0]}><Crest w={4.6} side={0.9} lionS={1.6} /></group>
          {/* two-tier hip roofs behind the crest, with small turrets */}
          <group position={[0, 3.6, -1.2]}>
            <Roof w={6.4} d={6.4} h={1.4} y={0} m={P.pink} sag={1.15} lift={0.06} fascia={false} />
            <Box s={[6.5, 0.14, 6.5]} p={[0, -0.02, 0]} m={P.teal} />
            <Box s={[2.8, 1.8, 2.8]} p={[0, 2.2, 0]} m={P.cream} />
            <Box s={[2.9, 0.12, 2.9]} p={[0, 1.35, 0]} m={P.teal} />
            <Roof w={4.0} d={4.0} h={1.1} y={3.1} m={P.pink} sag={1.15} lift={0.06} fascia={false} />
            <Box s={[4.1, 0.12, 4.1]} p={[0, 3.09, 0]} m={P.teal} />
            <Gajur y={4.2} s={0.85} />
            {[[-2.2, -2.2], [2.2, -2.2], [-2.5, 1.4], [2.5, 1.4]].map(([x, z], i) => (
              <group key={i} position={[x, 0.55, z]}>
                <Box s={[0.75, 1.2, 0.75]} p={[0, 0.6, 0]} m={i % 2 ? P.cream : P.pink2} />
                <Roof w={1.1} d={1.1} h={0.5} y={1.2} m={P.pink} sag={1.1} lift={0.05} fascia={false} />
                <Ball rad={0.1} p={[0, 1.85, 0]} m={P.white} />
              </group>
            ))}
          </group>
        </group>
        <pointLight position={[0, H0 + 2, 1.6]} intensity={1.4} distance={9} color="#ffb066" />
      </group>
    );
  }

  /* ---------- banded round mound (left) ---------- */
  function Mound() {
    const M = useM(); const P = pal(M);
    const chk = useMemo(() => canvasTex(128, 96, (g, w, h) => {
      for (let y = 0; y < 6; y += 1) for (let x = 0; x < 8; x += 1) {
        g.fillStyle = (x + y) % 2 ? '#f0ece2' : '#8c8c90';
        g.fillRect((x * w) / 8, (y * h) / 6, w / 8, h / 6);
      }
    }, 6, 1), []);
    const chkM = useMemo(() => new THREE.MeshStandardMaterial({ map: chk, roughness: 0.95 }), [chk]);
    return (
      <group position={[-11.2, 0, -0.5]}>
        <Cyl rt={3.95} rb={4.0} h={0.3} p={[0, 0.15, 0]} m={P.pink} seg={32} />
        <Cyl rt={3.8} rb={3.85} h={0.35} p={[0, 0.47, 0]} m={P.teal} seg={32} />
        <Cyl rt={3.65} rb={3.7} h={0.35} p={[0, 0.82, 0]} m={P.pink} seg={32} />
        <mesh position={[0, 1.7, 0]} material={chkM} castShadow><cylinderGeometry args={[3.35, 3.55, 1.4, 40]} /></mesh>
        <Cyl rt={3.45} h={0.16} p={[0, 2.48, 0]} m={P.pink} seg={32} />
        <mesh position={[0, 2.86, 0]} material={chkM} castShadow><cylinderGeometry args={[2.85, 3.0, 0.6, 36]} /></mesh>
        <Cyl rt={3.0} h={0.14} p={[0, 3.23, 0]} m={P.teal} seg={32} />
        <Cyl rt={2.4} rb={2.5} h={0.2} p={[0, 3.4, 0]} m={P.pink} seg={28} />
        <Cyl rt={2.3} h={0.06} p={[0, 3.52, 0]} m={P.cream} seg={28} />
        <Box s={[1.1, 0.7, 1.1]} p={[0, 0.35, 4.6]} m={P.pink} />
        <Box s={[1.2, 0.12, 1.2]} p={[0, 0.74, 4.6]} m={P.teal} />
        <group position={[0, 0.8, 4.6]} scale={1.05}><LionS m={P.white} /></group>
      </group>
    );
  }

  /* ---------- dark stone shrine (right) ---------- */
  function Shrine() {
    const M = useM(); const P = pal(M);
    const blk = useMemo(() => canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#e2e0da'; g.fillRect(0, 0, w, h);
      const cw = w / 6; const ch = h / 12;
      for (let y = 0; y < 12; y += 1) for (let x = 0; x < 7; x += 1) {
        const v = 78 + ((x * 37 + y * 53) % 34);
        g.fillStyle = `rgb(${v},${v},${v + 6})`;
        g.fillRect((x - (y % 2 ? 0.5 : 0)) * cw + 1.5, y * ch + 1.5, cw - 3, ch - 3);
      }
    }, 2, 1), []);
    const brick = useMemo(() => new THREE.MeshStandardMaterial({ map: blk, roughness: 0.95 }), [blk]);
    const rock = M.plain('#3d3e44', { roughness: 0.9 });
    return (
      <group position={[11.4, 0, 1.6]}>
        <Box s={[5.2, 0.45, 5.2]} p={[0, 0.22, 0]} m={P.pink} />
        <Box s={[5.3, 0.12, 5.3]} p={[0, 0.07, 0]} m={P.teal} />
        <Box s={[4.2, 3.0, 4.2]} p={[0, 1.95, 0]} m={brick} />
        <Box s={[1.3, 2.3, 0.1]} p={[0, 1.65, 2.13]} m={P.white} />
        <Box s={[0.9, 2.0, 0.14]} p={[0, 1.55, 2.14]} m={P.dark} />
        {[-1, 1].map((k) => <Box key={k} s={[0.9, 0.9, 0.08]} p={[k * 1.45, 2.3, 2.12]} m={P.cream} />)}
        <Box s={[4.5, 0.2, 4.5]} p={[0, 3.55, 0]} m={P.pink} />
        <Roof w={5.6} d={5.6} h={0.85} y={3.6} m={rock} sag={1.1} lift={0.05} fascia={false} />
        <Box s={[2.6, 0.7, 2.6]} p={[0, 4.55, 0]} m={P.slate} />
        <Roof w={3.5} d={3.5} h={0.75} y={4.85} m={rock} sag={1.1} lift={0.05} fascia={false} />
        <Cyl rt={0.03} rb={0.1} h={0.5} p={[0, 5.9, 0]} m={P.white} seg={8} />
        <Ball rad={0.12} p={[0, 6.2, 0]} m={P.white} />
      </group>
    );
  }

  /* ---------- long pink arcaded hall (behind) ---------- */
  function Hall() {
    const M = useM(); const P = pal(M);
    const stone = M.mat('stone', 5, 1.5, { color: BUFF });
    const sp = useMemo(() => spandrelGeo(1.1, 0.95, 0.24), []);
    const px = Array.from({ length: 7 }, (_, i) => -7.5 + i * 2.5);
    return (
      <group position={[-14.5, 0, -8.8]} rotation={[0, 0.4, 0]}>
        <Box s={[17.4, 0.42, 6.6]} p={[0, 0.21, 0]} m={P.teal} />
        <Box s={[17.2, 0.1, 6.4]} p={[0, 0.45, 0]} m={P.cream} />
        <Box s={[15.6, 3.2, 0.45]} p={[0, 2.05, -2.5]} m={stone} />
        {[-1, 1].map((k) => <Box key={k} s={[0.45, 3.2, 5.2]} p={[k * 7.8, 2.05, 0]} m={P.pink} />)}
        {[-4.5, 0, 4.5].map((x) => (
          <group key={x}>
            <Box s={[1.5, 2.5, 0.1]} p={[x, 1.7, -2.25]} m={P.teal} />
            <Box s={[1.1, 2.2, 0.12]} p={[x, 1.6, -2.22]} m={P.dark} />
          </group>
        ))}
        {px.map((x, i) => (
          <group key={i}>
            <Cyl rt={0.15} rb={0.2} h={2.5} p={[x, 1.75, 2.1]} m={P.teal} seg={8} />
            <Cyl rt={0.2} h={0.35} p={[x, 1.3, 2.1]} m={P.pink} seg={8} />
            <Ball rad={0.2} p={[x, 3.05, 2.1]} m={P.pink2} />
            <Box s={[0.9, 0.2, 0.28]} p={[x, 3.15, 2.1]} m={P.teal} />
          </group>
        ))}
        {px.slice(0, 6).map((x, i) => <mesh key={i} geometry={sp} material={i % 2 ? P.pink : P.pink2} position={[x + 1.25, 2.4, 1.98]} castShadow />)}
        <Box s={[17.4, 0.3, 0.4]} p={[0, 3.45, 2.1]} m={P.pink} />
        <Box s={[17.4, 0.1, 0.44]} p={[0, 3.62, 2.1]} m={P.teal} />
        {px.slice(0, 6).map((x, i) => (
          <group key={i} position={[x + 1.25, 2.1, 2.0]}>
            <Cyl rt={0.015} h={0.4} p={[0, 0.2, 0]} m={P.dark} seg={4} />
            <mesh position={[0, -0.05, 0]} material={P.gold} castShadow><coneGeometry args={[0.12, 0.22, 8]} /></mesh>
          </group>
        ))}
        <Roof w={18.0} d={8.0} h={1.9} y={3.7} m={P.pink} sag={1.0} lift={0} fascia={false} />
        <Box s={[18.1, 0.14, 8.1]} p={[0, 3.67, 0]} m={P.teal} />
        {[-1, 1].map((k) => <Box key={k} s={[18.1, 0.26, 0.16]} p={[0, 3.82, k * 4.0]} m={P.rose} />)}
        <Box s={[16.6, 0.2, 0.34]} p={[0, 5.62, 0]} m={P.pink3} />
        {[-5.5, 0, 5.5].map((x) => (
          <group key={x} position={[x, 5.6, 0]}>
            <Box s={[0.8, 0.7, 0.8]} p={[0, 0.35, 0]} m={P.cream} />
            <Roof w={1.2} d={1.2} h={0.4} y={0.7} m={P.pink} sag={1.1} lift={0.05} fascia={false} />
            <Ball rad={0.13} p={[0, 1.3, 0]} m={P.gold} />
          </group>
        ))}
        {[-8, -2.75, 2.75, 8].map((x) => <Ball key={x} rad={0.15} p={[x, 5.7, 0]} m={P.white} />)}
      </group>
    );
  }

  /* ---------- low pink curb wall, path, lamp, guard ---------- */
  function Grounds() {
    const M = useM(); const P = pal(M);
    return (
      <group>
        {/* apron and path with tactile strips */}
        <Box s={[7, 0.05, 1.9]} p={[0, 0.025, Z0 + 0.95]} m={P.grey} />
        <Box s={[2.7, 0.06, 20]} p={[0, 0.03, Z0 + 10.5]} m={P.grey} />
        {[-1, 1].map((k) => <Box key={k} s={[0.3, 0.07, 20]} p={[k * 1.4, 0.035, Z0 + 10.5]} m={P.pink} />)}
        {[-1, 1].map((k) => <Box key={k} s={[0.32, 0.08, 20]} p={[k * 0.5, 0.04, Z0 + 10.5]} m={P.yellow} />)}
        {/* curb wall */}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[10.5, 0.5, 0.45]} p={[k * 8.8, 0.25, 9.2]} m={P.pink} />
            <Box s={[10.7, 0.1, 0.6]} p={[k * 8.8, 0.55, 9.2]} m={P.pink2} />
          </group>
        ))}
        {/* solar lamp post */}
        <Cyl rt={0.05} rb={0.08} h={5} p={[6.4, 2.5, 5.4]} m={P.slate} seg={6} />
        <Box s={[0.8, 0.06, 0.55]} p={[6.4, 5.1, 5.2]} r={[0.4, 0, 0]} m={M.plain('#1d2b45', { roughness: 0.4 })} />
        <mesh position={[6.4, 4.8, 5.8]}><sphereGeometry args={[0.15, 10, 8]} /><meshBasicMaterial color="#fff2c0" toneMapped={false} /></mesh>
        {/* diyas at the stair foot */}
        {[-0.8, 0, 0.8].map((x) => (
          <mesh key={x} position={[x, 0.12, Z0 + 0.3]}><coneGeometry args={[0.05, 0.14, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
        ))}
      </group>
    );
  }

  const POLES = [
    [-12.8, 0, 4.0, 7], [-8.8, 0, 5.2, 6.5], [-11.2, 3.0, -0.5, 3.8], [-15, 0, 1.5, 6.5],
    [-3.6, H0, -3.4, 5], [7.2, 0, 3.6, 6], [14.5, 0, -4, 6.5],
  ];
  const STRINGS = [
    [[-12.8, 6.9, 4.0], [-8.8, 6.4, 5.2], 10, 0.6],
    [[-12.8, 6.9, 4.0], [-15, 6.4, 1.5], 10, 0.6],
    [[-12.8, 6.9, 4.0], [-11.2, 6.8, -0.5], 8, 0.5],
    [[-11.2, 6.8, -0.5], [-8.8, 6.4, 5.2], 12, 0.7],
    [[-11.2, 6.8, -0.5], [-3.6, 6.9, -3.4], 12, 0.8],
    [[7.2, 5.9, 3.6], [14.5, 6.4, -4], 12, 0.8],
  ];

  function UgrataraMain() {
    return (
      <group>
        <Stair />
        <Sanctum />
        <Mound />
        <Shrine />
        <Grounds />
        <Flags strings={STRINGS} poles={POLES} />
        <Frame s={[22, 9, 14]} p={[-1, 4.5, 0]} />
      </group>
    );
  }

  /* ---------- Env: hill crown, forest, ridges, gate ---------- */
  const gy = (r) => (r <= 26 ? 0 : -(r - 26) * 0.7);

  function Forest() {
    const data = useMemo(() => {
      const r = rng(77);
      const pines = []; const oaks = [];
      let guard = 0;
      while ((pines.length < 190 || oaks.length < 36) && guard < 5000) {
        guard += 1;
        const rad = 24 + r() * 24; const a = r() * Math.PI * 2;
        const x = Math.sin(a) * rad; const z = Math.cos(a) * rad;
        const ang = Math.abs(Math.atan2(x, z));
        if (ang < 1.0) continue; // open slope to the front
        if (z < 0 && Math.abs(x) < 8 && rad < 24) { /* fine */ }
        const h = 4.5 + r() * 4.5;
        if (r() < 0.2 && oaks.length < 36) oaks.push({ x, z, y: gy(rad), h: h * 0.7, s: r() });
        else if (pines.length < 190) pines.push({ x, z, y: gy(rad), h, s: r() });
      }
      [[-17, 6, 7], [-20, 2, 5.5], [-19, 9, 4.5], [-5, -17, 10], [17, -7, 9]].forEach(([x, z, h]) => pines.push({ x, z, y: 0, h, s: 0.5 }));
      return { pines, oaks };
    }, []);
    const geos = useMemo(() => {
      const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
      const trunk = new THREE.CylinderGeometry(0.12, 0.2, 1, 6); trunk.translate(0, 0.5, 0);
      const ball = new THREE.IcosahedronGeometry(1, 1);
      return { cone, trunk, ball };
    }, []);
    const mats = useMemo(() => ({
      leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }),
      bark: new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 1 }),
    }), []);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const col = new THREE.Color();
    const fillCone = (layer) => (mesh) => {
      if (!mesh) return;
      data.pines.forEach((t, i) => {
        const hh = t.h; const f = [[0.0, 0.5, 0.32], [0.28, 0.42, 0.26], [0.52, 0.34, 0.2]][layer];
        dummy.position.set(t.x, t.y + hh * (0.18 + f[0] * 0.8), t.z);
        dummy.scale.set(hh * (0.14 + f[2] * 0.3) * 1.1, hh * f[1], hh * (0.14 + f[2] * 0.3) * 1.1);
        dummy.rotation.set(0, t.s * 6, 0); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        col.set('#2d4a30').lerp(new THREE.Color('#3f5f3a'), t.s); mesh.setColorAt(i, col);
      });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    const fillTrunk = (mesh) => {
      if (!mesh) return;
      const all = [...data.pines, ...data.oaks];
      all.forEach((t, i) => {
        dummy.position.set(t.x, t.y, t.z); dummy.scale.set(1, t.h * 0.5, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    const fillOak = (mesh) => {
      if (!mesh) return;
      data.oaks.forEach((t, i) => {
        dummy.position.set(t.x, t.y + t.h * 0.7, t.z); dummy.scale.set(t.h * 0.42, t.h * 0.34, t.h * 0.42); dummy.rotation.set(0, t.s * 6, 0); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        col.set('#6f7f3c').lerp(new THREE.Color('#8a8a3a'), t.s); mesh.setColorAt(i, col);
      });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    const n = data.pines.length;
    return (
      <group>
        {[0, 1, 2].map((l) => <instancedMesh key={l} ref={fillCone(l)} args={[geos.cone, mats.leaf, n]} castShadow />)}
        <instancedMesh ref={fillTrunk} args={[geos.trunk, mats.bark, n + data.oaks.length]} />
        <instancedMesh ref={fillOak} args={[geos.ball, mats.leaf, data.oaks.length]} castShadow />
      </group>
    );
  }

  function Ridges() {
    const items = useMemo(() => {
      const r = rng(5); const out = [];
      [[95, '#5f7fa8', 16, 24], [115, '#7f9cc2', 14, 28], [135, '#9db4d0', 14, 34], [160, '#b4c6dc', 12, 38], [178, '#cbd8e8', 12, 42]].forEach(([rad, color, n, hgt], li) => {
        for (let i = 0; i < n; i += 1) {
          const a = (i / n) * Math.PI * 2 + li * 0.3 + r() * 0.2;
          out.push({ x: Math.sin(a) * rad, z: Math.cos(a) * rad, color, w: 34 + r() * 22, h: hgt * (0.6 + r() * 0.6), a });
        }
      });
      return out;
    }, []);
    const M = useM();
    return (
      <group>
        {items.map((t, i) => (
          <mesh key={i} position={[t.x, t.h * 0.3 - 22, t.z]} scale={[t.w, t.h, t.w * 0.6]} rotation={[0, t.a, 0]} material={M.plain(t.color, { roughness: 1 })}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
      </group>
    );
  }

  function Gate() {
    const M = useM(); const P = pal(M);
    const tiles = useMemo(() => canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h);
      const cols = ['#2f6db5', '#c8372b', '#2e9b57', '#e8b92e', '#3bb3a8'];
      for (let y = 0; y < 8; y += 1) for (let x = 0; x < 4; x += 1) {
        g.fillStyle = cols[(x * 3 + y) % 5]; g.fillRect(x * 16 + 3, y * 16 + 3, 10, 10);
        g.fillStyle = '#f2ece0'; g.fillRect(x * 16 + 6, y * 16 + 6, 4, 4);
      }
    }, 1, 1), []);
    const tileM = useMemo(() => new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.8 }), [tiles]);
    const board = useMemo(() => canvasTex(512, 96, (g, w, h) => {
      g.fillStyle = '#e8a3b5'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2e9b57'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
      g.fillStyle = '#b8261f'; g.font = 'bold 54px "Nirmala UI","Mangal","Noto Sans Devanagari",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('उग्रतारा मन्दिर मूल प्रवेश द्वार', w / 2, h / 2 + 2, w - 24);
    }), []);
    const boardM = useMemo(() => new THREE.MeshStandardMaterial({ map: board, roughness: 0.7 }), [board]);
    return (
      <group>
        {[-1, 1].map((k) => <mesh key={k} position={[k * 3.2, 1.7, 0]} material={tileM} castShadow><boxGeometry args={[0.8, 3.4, 0.8]} /></mesh>)}
        {[-1, 1].map((k) => <Box key={k} s={[1.0, 0.25, 1.0]} p={[k * 3.2, 0.12, 0]} m={P.cream} />)}
        <Box s={[7.8, 0.28, 0.9]} p={[0, 3.5, 0]} m={P.teal} />
        <Box s={[7.4, 1.0, 0.6]} p={[0, 4.1, 0]} m={P.pink} />
        <mesh position={[0, 4.1, 0.31]} material={boardM}><boxGeometry args={[7.2, 0.9, 0.02]} /></mesh>
        <mesh position={[0, 4.1, -0.31]} rotation={[0, Math.PI, 0]} material={boardM}><boxGeometry args={[7.2, 0.9, 0.02]} /></mesh>
        <Box s={[7.8, 0.14, 0.8]} p={[0, 4.68, 0]} m={P.teal} />
        <group position={[0, 4.75, -0.1]}><Crest w={3.0} side={0.3} scale={1} lions={false} /></group>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.9, 4.8, 0.05]} rotation={[0, k * Math.PI / 2, 0]} scale={0.8}><LionS m={P.cream} /></group>
        ))}
      </group>
    );
  }

  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(190, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2 + 0.12);
      const pos = g.attributes.position; const col = [];
      const top = new THREE.Color('#6fa2d8'); const hor = new THREE.Color('#efe6d4'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.min(1, Math.max(0, pos.getY(i) / 190));
        c.copy(hor).lerp(top, Math.pow(t, 0.6)); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>;
  }

  function UgrataraEnv() {
    const M = useM();
    const grass = M.plain('#a5b45f', { roughness: 1 });
    const slope = M.plain('#86a05a', { roughness: 1 });
    const gx = -23; const gz = 7;
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={grass}><circleGeometry args={[26, 64]} /></mesh>
        <mesh position={[0, -0.02 - 12.5, 0]} material={slope} receiveShadow><cylinderGeometry args={[26, 62, 25, 48, 1, true]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -25, 0]} material={M.plain('#5b7a4a', { roughness: 1 })}><circleGeometry args={[220, 32]} /></mesh>
        <Sky />
        <Forest />
        {[[-9, 14, 4], [8, 16, 3.5], [-16, 8, 3], [15, -9, 4], [3, -14, 3.5], [-6, 20, 3]].map(([x, z, r], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]} scale={[1, 0.7, 1]} material={M.plain(i % 2 ? '#a79a52' : '#8c9548', { roughness: 1 })}><circleGeometry args={[r, 14]} /></mesh>
        ))}
        <Ridges />
        <group position={[gx, 0, gz]} rotation={[0, 0.95, 0]}><Gate /></group>
        <Hall />
      </group>
    );
  }

  return { 'ugratara-temple-dadeldhura': { Main: UgrataraMain, Env: UgrataraEnv } };
}
