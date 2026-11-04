// Lagankhel Ashok Stupa (Lagan Thura), Lalitpur: a huge, low, bright-green grass mound (height : diameter about 1 : 4)
// with a tiny white-and-gold chaitya on top, a red brick ring wall carrying a blue-capped / yellow-post prayer-wheel band,
// small white gilt-spired chaityas, dark stone stupas and a seated Buddha on a red brick path, prayer-flag strings
// radiating from the crown, and an urban street / bus park setting. Rotationally symmetric, no front.
// Scale: 1 unit is about 2.4 m (mound ~ 20 units = 47 m across). Small shrines are drawn ~1.5x true size to stay readable.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, THREE, useMemo } = K;

  const R = 9.9;        // mound radius at the wall
  const WALL = 1.65;    // top of wall + wheel band
  const H = 5.7;        // crown height
  const TAU = Math.PI * 2;
  const hash = (i, j = 0) => { const s = Math.sin(i * 127.1 + j * 311.7 + 7.7) * 43758.5453; return s - Math.floor(s); };
  const moundY = (r) => { const q = Math.min(1, Math.max(0, r - 1.3) / (R - 1.3)); return WALL + (H - WALL) * Math.pow(Math.max(0, 1 - Math.pow(q, 2.4)), 0.8); };
  const FLAGC = ['#7fb0e0', '#f3f0e6', '#d9604c', '#6fb27c', '#e8c850'];

  /* ---------- generic instancing helper ---------- */
  function Inst({ n, mat, place, children, cast = true }) {
    const set = (im) => {
      if (!im) return;
      const o = new THREE.Object3D();
      for (let i = 0; i < n; i += 1) {
        const q = place(i);
        o.position.set(q.p[0], q.p[1], q.p[2]);
        o.rotation.set(0, q.r || 0, 0);
        o.scale.set(...(q.s || [1, 1, 1]));
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    };
    return <instancedMesh ref={set} args={[null, null, n]} material={mat} castShadow={cast} receiveShadow frustumCulled={false}>{children}</instancedMesh>;
  }

  /* ---------- the grass mound (lathe) ---------- */
  function Mound() {
    const M = useM();
    const geo = useMemo(() => {
      const pts = [];
      const N = 44;
      for (let i = 0; i <= N; i += 1) {
        const t = i / N;
        const r = R * (1 - Math.pow(1 - t, 1.6)); // denser near the rim
        pts.push(new THREE.Vector2(Math.max(r, 0.001), moundY(r)));
      }
      const g = new THREE.LatheGeometry(pts, 72);
      // patchy colour: lighter on sunlit tufts, darker/yellower in patches
      const pos = g.attributes.position; const col = [];
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i);
        const n = 0.5 * Math.sin(x * 1.3 + Math.cos(z * 0.9)) + 0.5 * Math.sin(z * 1.7 - x * 0.6) ;
        const ang = Math.atan2(z, x); const streak = 0;
        const k = 1.0 + 0.16 * n + streak + 0.1 * (hash(Math.round(x * 3.1), Math.round(z * 3.1)) - 0.5) - (hash(Math.round(x * 0.5), Math.round(z * 0.5)) > 0.8 ? 0.14 : 0);
        col.push(k * (1 + 0.06 * n), k * (1.0 - 0.03 * n), k * 0.9);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    const mat = M.mat('grass', 22, 4, { color: '#c4e870', vertexColors: true, side: THREE.DoubleSide, roughness: 1, emissive: '#6a9a2c', emissiveIntensity: 0.32 });
    return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
  }

  /* ---------- ring wall, prayer-wheel band, blue cap, yellow posts ---------- */
  function RingWall() {
    const M = useM();
    const brick = M.mat('brick', 34, 2, { color: '#b07a52', emissive: '#6a3a28', emissiveIntensity: 0.2 });
    const base = M.plain('#a89684', { roughness: 1 });
    const blue = M.plain('#2f9fe0', { roughness: 0.7, metalness: 0, side: THREE.DoubleSide });
    const yellow = M.plain('#e0b020', { roughness: 0.7 });
    const wheelM = M.plain('#7a3322', { roughness: 0.6 });
    const goldM = M.gold;
    const NW = 150; const NP = 60;
    return (
      <group>
        <Cyl rt={10.05} rb={10.1} h={0.12} p={[0, 0.06, 0]} m={base} seg={72} />
        <Cyl rt={9.95} rb={9.95} h={1.2} p={[0, 0.6, 0]} m={brick} seg={72} />
        <Cyl rt={9.85} rb={9.85} h={0.34} p={[0, 1.37, 0]} m={M.plain('#3a2218')} seg={72} />
        <Inst n={NW} mat={wheelM} place={(i) => { const a = (i / NW) * TAU; return { p: [Math.cos(a) * 9.93, 1.37, Math.sin(a) * 9.93] }; }}>
          <cylinderGeometry args={[0.14, 0.14, 0.34, 8]} />
        </Inst>
        <Inst n={NW} mat={goldM} cast={false} place={(i) => { const a = (i / NW) * TAU; return { p: [Math.cos(a) * 9.93, 1.37, Math.sin(a) * 9.93] }; }}>
          <cylinderGeometry args={[0.15, 0.15, 0.07, 8]} />
        </Inst>
        <mesh position={[0, 1.58, 0]} material={blue}><cylinderGeometry args={[10.0, 10.0, 0.14, 72, 1, true]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.655, 0]} material={blue}><ringGeometry args={[9.82, 10.0, 72]} /></mesh>
        <Inst n={NP} mat={yellow} place={(i) => { const a = (i / NP) * TAU; return { p: [Math.cos(a) * 10.02, 1.1, Math.sin(a) * 10.02], r: -a }; }}>
          <boxGeometry args={[0.08, 2.2, 0.08]} />
        </Inst>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.05, 0]} material={yellow}><torusGeometry args={[10.03, 0.025, 6, 96]} /></mesh>
      </group>
    );
  }

  /* ---------- little shrines ---------- */
  function WhiteChaitya({ p, r = 0, s = 1, door = true }) {
    const M = useM();
    const white = M.plain('#f6f3ec', { roughness: 0.85 });
    const gold = M.gold;
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[1.1, 0.14, 1.1]} p={[0, 0.07, 0]} m={white} />
        <Box s={[0.94, 0.14, 0.94]} p={[0, 0.21, 0]} m={white} />
        <Box s={[0.78, 0.2, 0.78]} p={[0, 0.38, 0]} m={white} />
        {door && <Box s={[0.26, 0.3, 0.02]} p={[0, 0.3, 0.4]} m={M.plain('#5a2b20')} cast={false} />}
        <Cyl rt={0.3} rb={0.36} h={0.38} p={[0, 0.67, 0]} m={white} seg={20} />
        <Cyl rt={0.36} rb={0.36} h={0.14} p={[0, 0.93, 0]} m={gold} seg={20} />
        <Box s={[0.4, 0.2, 0.4]} p={[0, 1.05, 0]} m={white} />
        <Cyl rt={0.24} rb={0.24} h={0.1} p={[0, 1.2, 0]} m={gold} seg={16} />
        <mesh position={[0, 1.5, 0]} material={gold} castShadow><coneGeometry args={[0.16, 0.55, 14]} /></mesh>
        <Ball rad={0.06} p={[0, 1.8, 0]} m={gold} />
      </group>
    );
  }
  function DarkStupa({ p, r = 0, s = 1, tall = false }) {
    const M = useM();
    const dk = M.plain('#35383a', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        {tall && <><Box s={[1.0, 0.2, 1.0]} p={[0, -0.1, 0]} m={dk} /><Box s={[0.82, 0.2, 0.82]} p={[0, 0.1, 0]} m={dk} /><group position={[0, 0.2, 0]} scale={[1, 1.35, 1]}>
        <Box s={[0.9, 0.14, 0.9]} p={[0, 0.07, 0]} m={dk} /></group></>}
        {!tall && <Box s={[0.9, 0.14, 0.9]} p={[0, 0.07, 0]} m={dk} />}
        <Box s={[0.74, 0.14, 0.74]} p={[0, 0.21, 0]} m={dk} />
        <Box s={[0.58, 0.14, 0.58]} p={[0, 0.35, 0]} m={dk} />
        <Cyl rt={0.2} rb={0.24} h={0.22} p={[0, 0.53, 0]} m={dk} seg={12} />
        <mesh position={[0, 0.64, 0]} material={dk} castShadow><sphereGeometry args={[0.2, 12, 8, 0, TAU, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.2, 0.12, 0.2]} p={[0, 0.76, 0]} m={dk} />
        {[0, 1, 2, 3].map((i) => <Cyl key={i} rt={0.13 - i * 0.025} rb={0.15 - i * 0.025} h={0.07} p={[0, 0.85 + i * 0.075, 0]} m={dk} seg={10} />)}
        <mesh position={[0, 1.28, 0]} material={dk}><coneGeometry args={[0.035, 0.2, 8]} /></mesh>
      </group>
    );
  }
  function BuddhaShrine({ p, r = 0, s = 1 }) {
    const M = useM();
    const dk = M.plain('#2f3234', { roughness: 0.85 });
    const red = M.plain('#c4202a', { roughness: 1 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[0.9, 0.2, 0.9]} p={[0, 0.1, 0]} m={dk} />
        <Box s={[0.7, 0.5, 0.7]} p={[0, 0.45, 0]} m={dk} />
        <Box s={[0.78, 0.07, 0.78]} p={[0, 0.72, 0]} m={dk} />
        {/* seated figure facing out (+z) */}
        <Box s={[0.5, 0.1, 0.34]} p={[0, 0.81, 0.04]} m={dk} />
        <mesh position={[0, 1.04, 0]} material={dk} castShadow><cylinderGeometry args={[0.1, 0.2, 0.4, 8]} /></mesh>
        <Ball rad={0.09} p={[0, 1.33, 0.01]} m={dk} />
        <mesh position={[0, 1.46, 0]} material={dk}><coneGeometry args={[0.05, 0.14, 8]} /></mesh>
        <Box s={[0.52, 0.1, 0.1]} p={[0, 0.95, 0.12]} m={dk} />
        {[1, 2, 3].map((q) => <group key={q} rotation={[0, q * Math.PI / 2, 0]}><Box s={[0.3, 0.34, 0.08]} p={[0, 0.5, 0.38]} m={M.plain('#444849')} /></group>)}
        <Ball rad={0.07} p={[0.05, 1.45, 0.02]} sc={[1, 0.5, 1]} m={red} />
        <Ball rad={0.1} p={[0.22, 0.78, 0.3]} sc={[1, 0.45, 1]} m={red} />
        <Ball rad={0.08} p={[-0.2, 0.78, 0.32]} sc={[1, 0.45, 1]} m={red} />
      </group>
    );
  }
  function Shrines() {
    const out = (deg, r) => { const a = (deg * Math.PI) / 180; return { p: [Math.cos(a) * r, 0.03, Math.sin(a) * r], r: Math.PI / 2 - a }; };
    const white = [[24, 11.4], [34, 12.3], [52, 11.4], [66, 12.2], [100, 11.5], [146, 11.6], [205, 11.8], [250, 11.6], [300, 11.8], [338, 11.6]];
    const dark = [[8, 12.2], [44, 12.3], [58, 11.3], [72, 12.4], [84, 11.5], [118, 11.8], [128, 12.7], [172, 12.0], [228, 12.3], [275, 12.2], [320, 12.4]];
    const bud = [[40, 11.5], [62, 12.0], [138, 11.5], [186, 11.8]];
    return (
      <group>
        {white.map(([d, r], i) => { const o = out(d, r); return <WhiteChaitya key={`w${i}`} p={o.p} r={o.r} s={i % 3 === 0 ? 1.0 : (i % 3 === 1 ? 1.3 : 1.15)} />; })}
        {dark.map(([d, r], i) => { const o = out(d, r); return <DarkStupa key={`d${i}`} p={[o.p[0], o.p[1] + (i % 4 === 1 ? 0.2 : 0), o.p[2]]} r={o.r + hash(i) * 0.4} s={1.3} tall={i % 4 === 1} />; })}
        {bud.map(([d, r], i) => { const o = out(d, r); return <BuddhaShrine key={`b${i}`} p={o.p} r={o.r} s={1.05} />; })}
      </group>
    );
  }

  /* ---------- small red-roofed shed on the slope ---------- */
  function Shed() {
    const M = useM();
    const a = (58 * Math.PI) / 180; const rr = 10.9;
    const roof = M.plain('#b8392b', { roughness: 0.6, metalness: 0.25, side: THREE.DoubleSide });
    const post = M.plain('#d9a520');
    const wall = M.plain('#8d5a3c');
    return (
      <group position={[Math.cos(a) * rr, 0.03, Math.sin(a) * rr]} rotation={[0, Math.PI / 2 - a, 0]}>
        <Box s={[1.6, 1.0, 0.06]} p={[0, 0.5, -0.5]} m={wall} />
        <Box s={[0.06, 1.0, 1.1]} p={[-0.8, 0.5, 0]} m={wall} />
        <Box s={[0.06, 1.0, 1.1]} p={[0.8, 0.5, 0]} m={wall} />
        {[-0.78, 0.78].map((x) => <Box key={x} s={[0.06, 1.2, 0.06]} p={[x, 0.6, 0.52]} m={post} />)}
        <Box s={[1.8, 0.05, 1.45]} p={[0, 1.18, 0.02]} r={[0.28, 0, 0]} m={roof} />
        <Box s={[1.8, 0.07, 0.05]} p={[0, 1.04, 0.66]} r={[0.28, 0, 0]} m={M.plain('#7a2a20')} />
      </group>
    );
  }

  /* ---------- prayer flags ---------- */
  const A0 = [0, H + 2.7, 0];
  const POLE_R = 14.2; const POLE_H = 3.7;
  const poleAng = (k) => ((22.5 + 45 * k) * Math.PI) / 180;
  function FlagStrings() {
    const { flags, lines } = useMemo(() => {
      const fpos = []; const fcol = []; const lpos = [];
      const addString = (A, B, nf, sag, fw, fh, seed) => {
        const d = new THREE.Vector3(B[0] - A[0], 0, B[2] - A[2]).normalize();
        const P = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - Math.sin(Math.PI * t) * sag, A[2] + (B[2] - A[2]) * t];
        const seg = 24;
        for (let i = 0; i < seg; i += 1) { lpos.push(...P(i / seg), ...P((i + 1) / seg)); }
        for (let i = 0; i < nf; i += 1) {
          const t = (i + 0.5) / nf; const c = P(t);
          const col = new THREE.Color(FLAGC[(i + seed) % 5]);
          const hx = (d.x * fw) / 2; const hz = (d.z * fw) / 2;
          const q = [[c[0] - hx, c[1], c[2] - hz], [c[0] + hx, c[1], c[2] + hz], [c[0] + hx, c[1] - fh, c[2] + hz], [c[0] - hx, c[1] - fh, c[2] - hz]];
          [0, 1, 2, 0, 2, 3].forEach((k) => { fpos.push(...q[k]); fcol.push(col.r, col.g, col.b); });
        }
      };
      for (let k = 0; k < 8; k += 1) {
        if (k % 2) continue;
        const a = poleAng(k);
        for (let j = 0; j < 3; j += 1) {
          const da = (j - 1) * 0.1;
          const B = [Math.cos(a + da) * (POLE_R - 0.4 * Math.abs(j - 1)), POLE_H - 0.15 * Math.abs(j - 1), Math.sin(a + da) * (POLE_R - 0.4 * Math.abs(j - 1))];
          addString([0, H + 2.7 - j * 0.12, 0], B, 14, 0.5 + j * 0.06, 0.42, 0.5, k + j);
        }
        const a2 = a + 0.3;
        addString([0, H + 2.2, 0], [Math.cos(a2) * 11.6, 2.4, Math.sin(a2) * 11.6], 12, 0.4, 0.42, 0.5, k + 2);
      }
      // two long strings across the foreground between the front poles
      const pf = (k) => [Math.cos(poleAng(k)) * POLE_R, Math.sin(poleAng(k)) * POLE_R];
      [[0, 1, 0], [0, 1, 1.2]].forEach(([k0, k1, up], q) => {
        const A = pf(0); const B = pf(2);
        addString([A[0], POLE_H - 0.1 - q * 0.5, A[1]], [B[0], POLE_H - 0.1 - q * 0.5, B[1]], 20, 1.1 + q * 0.3, 0.45, 0.55, 3 + q);
      });
      const fg = new THREE.BufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
      fg.setAttribute('color', new THREE.Float32BufferAttribute(fcol, 3));
      fg.computeVertexNormals();
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3));
      return { flags: fg, lines: new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#3b3b3b' })) };
    }, []);
    const M = useM();
    const pole = M.plain('#6b6258', { roughness: 0.8 });
    return (
      <group>
        <mesh geometry={flags}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
        <primitive object={lines} />
        {Array.from({ length: 8 }, (_, k) => { if (k % 2) return null; const a = poleAng(k); return <Cyl key={k} rt={0.05} rb={0.07} h={POLE_H} p={[Math.cos(a) * POLE_R, POLE_H / 2, Math.sin(a) * POLE_R]} m={pole} seg={6} />; })}
      </group>
    );
  }

  /* ---------- crown chaitya ---------- */
  function Crown() {
    const M = useM();
    return (
      <group>
        <Cyl rt={0.75} rb={0.78} h={0.1} p={[0, H - 0.02, 0]} m={M.plain('#f6f3ec', { roughness: 0.9 })} seg={24} />
        <WhiteChaitya p={[0, H - 0.05, 0]} s={1.7} door={false} />
        <mesh position={[0, H + 2.55, 0]} material={M.gold} castShadow><coneGeometry args={[0.2, 0.9, 14]} /></mesh>
        <Ball rad={0.1} p={[0, H + 3.05, 0]} m={M.gold} />
      </group>
    );
  }

  /* ---------- brick path ---------- */
  function Path() {
    const M = useM();
    const mat = M.plain('#a8805f', { side: THREE.DoubleSide, roughness: 1, emissive: '#5a4030', emissiveIntensity: 0.1 });
    return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={mat} receiveShadow><ringGeometry args={[10.05, 16, 96]} /></mesh>;
  }

  function Main() {
    return (
      <group>
        <Mound />
        <RingWall />
        <Path />
        <Shrines />
        <Shed />
        <Crown />
        <FlagStrings />
        <Frame s={[24, 7.6, 24]} p={[0, 3.8, 0]} />
      </group>
    );
  }

  /* ================================================== environment ================================================== */
  const PAL = ['#e8dcc2', '#d9b9a0', '#cfd3cf', '#e5c98a', '#d7a08a', '#b9c6c9', '#efe7d6', '#c9a27c'];
  function House({ a, r, i }) {
    const M = useM();
    const w = 3.4 + hash(i, 1) * 3.4; const d = 3 + hash(i, 2) * 2.6; const st = 2 + Math.floor(hash(i, 3) * 3);
    const h = st * 1.15; const col = PAL[Math.floor(hash(i, 4) * PAL.length)];
    const brickHouse = hash(i, 5) > 0.45;
    const body = brickHouse ? M.mat('brick', 2, st, { color: '#c08a6a' }) : M.plain(col, { roughness: 0.95 });
    const win = M.plain('#2f3d4d', { roughness: 0.5, emissive: '#ffbf66', emissiveIntensity: 0.22 });
    const x = Math.cos(a) * r; const z = Math.sin(a) * r;
    const ry = Math.atan2(-Math.cos(a), -Math.sin(a));
    const tin = hash(i, 6) > 0.72;
    return (
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={body} />
        {Array.from({ length: st }, (_, k) => <Box key={k} s={[w * 0.78, 0.4, 0.05]} p={[0, 0.65 + k * 1.15, d / 2 + 0.02]} m={win} cast={false} />)}
        {tin
          ? <Box s={[w + 0.3, 0.1, d + 0.3]} p={[0, h + 0.25, 0]} r={[0.2, 0, 0]} m={M.plain('#8f4a3a', { roughness: 0.7, metalness: 0.2 })} />
          : <Box s={[w + 0.15, 0.2, d + 0.15]} p={[0, h + 0.1, 0]} m={M.plain('#9b9488')} />}
        {!tin && hash(i, 7) > 0.5 && <Cyl rt={0.35} rb={0.35} h={0.6} p={[w * 0.25, h + 0.5, -d * 0.2]} m={M.plain('#1f2a33')} seg={10} />}
      </group>
    );
  }
  function Bus({ a, r, c, i }) {
    const M = useM();
    const x = Math.cos(a) * r; const z = Math.sin(a) * r;
    return (
      <group position={[x, 0, z]} rotation={[0, -a, 0]}>
        <Box s={[1.9, 1.15, 4.8]} p={[0, 0.8, 0]} m={M.plain(c, { roughness: 0.6 })} />
        <Box s={[1.94, 0.4, 4.4]} p={[0, 1.05, 0]} m={M.plain('#26323d')} cast={false} />
        {[-1.5, 1.5].map((q) => <Cyl key={q} rt={0.26} rb={0.26} h={0.2} p={[0.9, 0.26, q]} r={[0, 0, Math.PI / 2]} m={M.dark} seg={10} />)}
        {[-1.5, 1.5].map((q) => <Cyl key={'b' + q} rt={0.26} rb={0.26} h={0.2} p={[-0.9, 0.26, q]} r={[0, 0, Math.PI / 2]} m={M.dark} seg={10} />)}
      </group>
    );
  }
  function Hill({ a, r, w, h, c }) {
    const M = useM();
    return <Ball rad={1} p={[Math.cos(a) * r, -h * 0.25, Math.sin(a) * r]} sc={[w, h, w * 0.7]} m={M.plain(c, { roughness: 1 })} />;
  }

  function Row({ a, r, n, i0 }) {
    const M = useM();
    const x = Math.cos(a) * r; const z = Math.sin(a) * r;
    const ry = Math.atan2(-Math.cos(a), -Math.sin(a));
    const wd = 3.4; const st = 3;
    return (
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        {Array.from({ length: n }, (_, k) => {
          const h = (2 + Math.floor(hash(i0 + k, 3) * 3)) * 1.15;
          const brick = hash(i0 + k, 5) > 0.35;
          const body = brick ? M.mat('brick', 1.4, Math.round(h / 1.15), { color: '#c08a6a' }) : M.plain(PAL[(i0 + k) % PAL.length], { roughness: 0.95 });
          const cx = (k - (n - 1) / 2) * wd;
          return (
            <group key={k} position={[cx, 0, 0]}>
              <Box s={[wd, h, 3.6]} p={[0, h / 2, 0]} m={body} />
              <Box s={[wd * 0.7, 0.45, 0.05]} p={[0, h * 0.7, 1.82]} m={M.plain('#2f3d4d', { roughness: 0.5 })} cast={false} />
              <Box s={[wd + 0.05, 0.2, 3.8]} p={[0, h + 0.1, 0]} m={M.plain('#9b9488')} />
            </group>
          );
        })}
      </group>
    );
  }
  function Env() {
    const M = useM();
    const houses = useMemo(() => {
      const out = [];
      for (let i = 0; i < 40; i += 1) {
        const a = (i / 40) * TAU + hash(i, 9) * 0.1;
        const deg = ((a * 180) / Math.PI) % 360;
        if (deg > 235 && deg < 300) continue; // bus park side
        const front = deg > 55 && deg < 125;
        if (front && i % 2) continue;
        if (deg > -5 && deg < 110 && Math.abs(deg - 45) < 60) continue; // keep the camera side open
        if (Math.sin(a) * (front ? 30 : 24) > 24) continue; // road band south
        out.push({ a, r: (front ? 30 : 24) + hash(i, 10) * 9, i });
      }
      return out;
    }, []);
    const poles = useMemo(() => Array.from({ length: 14 }, (_, k) => (k / 14) * TAU + 0.2), []);
    const wires = useMemo(() => {
      const pos = []; const Rp = 21; const top = 4.3;
      for (let k = 0; k < poles.length; k += 1) {
        const a = poles[k]; const b = poles[(k + 1) % poles.length];
        for (let off = 0; off < 2; off += 1) {
          const y0 = top - off * 0.3; const rr = Rp + (off - 1) * 0.35;
          const A = [Math.cos(a) * rr, Math.sin(a) * rr]; const B = [Math.cos(b) * rr, Math.sin(b) * rr];
          const seg = 8;
          const P = (t) => [A[0] + (B[0] - A[0]) * t, y0 - Math.sin(Math.PI * t) * 0.5, A[1] + (B[1] - A[1]) * t];
          for (let s = 0; s < seg; s += 1) pos.push(...P(s / seg), ...P((s + 1) / seg));
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#2b2b2b' }));
    }, [poles]);
    const lamp = M.plain('#fff2c8', { emissive: '#ffd27a', emissiveIntensity: 1.4 });
    const treeList = [[200, 16.6, 1.5], [178, 17.2, 1.6], [224, 16.8, 1.7], [240, 22, 2], [255, 24, 2.2], [165, 22, 1.9], [185, 24, 2], [205, 27, 2.1], [140, 24, 1.8], [310, 20, 1.8], [320, 26, 2], [345, 20, 1.7], [165, 17.5, 1.7], [190, 18, 1.5], [214, 17, 1.9], [150, 25, 2.1], [330, 17.5, 1.6], [352, 24, 1.8], [100, 36, 2], [30, 34, 1.9], [270, 36, 2.2], [235, 40, 2.1]];
    return (
      <group>
        {/* ground: dusty paving, then road ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.plain('#8d8778', { roughness: 1 })}><circleGeometry args={[95, 64]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 6]} receiveShadow material={M.plain('#a49c8c', { roughness: 1 })}><planeGeometry args={[46, 24]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 31]} receiveShadow material={M.plain('#47484c', { roughness: 0.95 })}><planeGeometry args={[150, 5]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 31]} material={M.plain('#e8e0b0', { roughness: 1 })}><planeGeometry args={[150, 0.12]} /></mesh>
        {/* houses */}
        {houses.map((h) => <House key={h.i} a={h.a} r={h.r} i={h.i} />)}
        {[[-0.35, 27, 5, 50], [3.5, 28, 4, 60], [4.2, 27, 5, 70], [2.1, 29, 4, 80], [0.15, 28, 5, 90]].map(([a, r, n, i0], k) => <Row key={k} a={a} r={r} n={n} i0={i0} />)}
        {/* Lagankhel bus park to the north */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -30]} receiveShadow material={M.plain('#5a5b5e', { roughness: 1 })}><circleGeometry args={[9, 32]} /></mesh>
        {[[-5.5, 'c0392b', -26], [-4.7, '2e7d5b', -27], [-4.2, 'e9e5dc', -29], [-3.7, '1f5fa8', -31], [-3.2, 'c0392b', -33]].map(([a, c, r], i) => <Bus key={i} a={-Math.PI / 2 + (i - 2) * 0.12} r={26 + i * 1.6} c={'#' + c} i={i} />)}
        {/* roadside trees */}
        {treeList.map(([deg, r, s], i) => <Tree key={i} p={[Math.cos((deg * Math.PI) / 180) * r, 0, Math.sin((deg * Math.PI) / 180) * r]} s={s} />)}
        {/* utility poles, wires and street lamps */}
        {poles.map((a, k) => (
          <group key={k} position={[Math.cos(a) * 21, 0, Math.sin(a) * 21]} rotation={[0, -a, 0]}>
            <Cyl rt={0.07} rb={0.1} h={4.4} p={[0, 2.2, 0]} m={M.plain('#8a8a86')} seg={6} />
            <Box s={[0.1, 0.08, 1.2]} p={[0, 4.15, 0]} m={M.plain('#6c6c68')} />
            {k % 2 === 0 && <><Box s={[1.1, 0.06, 0.06]} p={[-0.5, 4.5, 0]} m={M.plain('#6c6c68')} /><Box s={[0.34, 0.1, 0.2]} p={[-1.05, 4.46, 0]} m={lamp} cast={false} /></>}
          </group>
        ))}
        
        {/* whitewashed pillared building near the path (west) */}
        <group position={[-19, 0, 6]} rotation={[0, Math.PI / 2 - 0.25, 0]}>
          <Box s={[5, 2.2, 3]} p={[0, 1.1, 0]} m={M.plain('#f3f0e8')} />
          {[-2, -0.7, 0.7, 2].map((x) => <Cyl key={x} rt={0.1} rb={0.1} h={2} p={[x, 1, 1.7]} m={M.plain('#f6f3ec')} seg={8} />)}
          <Box s={[5.4, 0.15, 3.8]} p={[0, 2.25, 0.3]} m={M.plain('#8f4a3a', { roughness: 0.7 })} />
        </group>
        {/* hazy green hills of the southern valley rim */}
        <Hill a={-0.2} r={74} w={30} h={13} c="#5f8a55" />
        <Hill a={0.7} r={78} w={34} h={15} c="#5f8a55" />
        <Hill a={1.6} r={82} w={36} h={12} c="#5f8a55" />
        <Hill a={2.5} r={76} w={32} h={16} c="#5f8a55" />
        <Hill a={3.4} r={80} w={36} h={14} c="#5f8a55" />
        <Hill a={4.2} r={84} w={40} h={20} c="#5f8a55" />
        <Hill a={5.0} r={78} w={30} h={14} c="#5f8a55" />
        <Hill a={5.8} r={84} w={34} h={17} c="#5f8a55" />
        {[0.2, 1.1, 2.0, 2.9, 3.8, 4.7, 5.5].map((a, k) => <Hill key={"b" + k} a={a} r={64} w={26} h={9} c="#4f7a48" />)}
      </group>
    );
  }

  return { 'lagankhel-ashok-stupa': { Main, Env } };
}
