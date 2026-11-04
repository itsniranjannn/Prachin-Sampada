// Pathibhara Devi, Mukkumlung summit (3,794 m), Taplejung. An open-air summit shrine: gold-faced goddess under a red canopy,
// a huge bronze bell on a black gantry, strings of five-colour prayer flags on bare poles, a small tan-timber shelter with a
// blue two-tier tin roof on a stone plinth, set on a bare ridge-top with Kanchenjunga and layered blue ridges behind.
// Scale ~0.6 units per metre. All dimensions are estimates from photographs.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Trident, Diyo, THREE, useMemo, useRef, useEffect } = K;

  const FLAGC = ['#1f5fbf', '#f2f2ee', '#d6261f', '#2f9a4b', '#f2c718'];
  const unitBox = <boxGeometry args={[1, 1, 1]} />;
  const unitCone = <coneGeometry args={[1, 1, 7]} />;
  const unitIco = <icosahedronGeometry args={[1, 0]} />;
  const unitSphere = <sphereGeometry args={[1, 12, 8]} />;
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ridge-top terrain: flat stone plateau (ellipse 8.5 x 6) then a steep fall into the valleys */
  const PX = 6.5; const PZ = 4.5;
  function ell(x, z) { return Math.hypot(x / PX, z / PZ); }
  function H(x, z) {
    const e = ell(x, z);
    const t = Math.max(0, e - 1);
    let h = -Math.min(30, 5.5 * Math.pow(t, 1.2));
    h += (Math.sin(x * 0.55 + z * 0.3) * Math.cos(z * 0.6 - x * 0.2) * 0.5 + Math.sin(x * 1.3 + z * 0.9) * 0.15) * sm(1.0, 1.5, e) * (1 + Math.min(4, t));
    return h - 0.05 * (1 - sm(0.9, 1.0, e));
  }

  function Inst({ items, geo, mat, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D(); const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(...it.p); o.rotation.set(...(it.r || [0, 0, 0])); o.scale.set(...(it.s || [1, 1, 1]));
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
        if (it.c) ref.current.setColorAt(i, col.set(it.c));
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[null, null, items.length]} castShadow={cast} receiveShadow frustumCulled={false}>{geo}{mat}</instancedMesh>;
  }

  /* ---------- prayer flags ---------- */
  function FlagLines({ lines }) {
    const geo = useMemo(() => {
      const pos = []; const col = []; const idx = [];
      const c = new THREE.Color();
      const quad = (p0, p1, p2, p3, color) => {
        const b = pos.length / 3;
        [p0, p1, p2, p3].forEach((p) => { pos.push(...p); col.push(color.r, color.g, color.b); });
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      };
      lines.forEach((L, li) => {
        const { a, b, sag = 0.5, n = 30, h = 0.22 } = L;
        const dx = b[0] - a[0]; const dz = b[2] - a[2]; const len = Math.hypot(dx, dz) || 1;
        const px = -dz / len; const pz = dx / len; // horizontal perpendicular
        const at = (t) => [a[0] + dx * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + dz * t];
        // the string
        const m = 24;
        for (let k = 0; k < m; k += 1) {
          const p0 = at(k / m); const p1 = at((k + 1) / m);
          quad(p0, p1, [p1[0], p1[1] - 0.018, p1[2]], [p0[0], p0[1] - 0.018, p0[2]], c.set('#2a2622'));
        }
        for (let i = 0; i < n; i += 1) {
          const t0 = (i + 0.08) / n; const t1 = (i + 0.92) / n;
          const p0 = at(t0); const p1 = at(t1);
          const w0 = Math.sin(i * 1.7 + li) * 0.035; const w1 = Math.sin(i * 1.7 + li + 1.4) * 0.035;
          const hh = h * (0.85 + 0.25 * Math.sin(i * 2.3 + li * 1.3));
          quad(
            [p0[0], p0[1] - 0.02, p0[2]], [p1[0], p1[1] - 0.02, p1[2]],
            [p1[0] + px * w1, p1[1] - 0.02 - hh, p1[2] + pz * w1], [p0[0] + px * w0, p0[1] - 0.02 - hh * 0.95, p0[2] + pz * w0],
            c.set(FLAGC[(i + li * 2) % 5]),
          );
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [lines]);
    return <mesh geometry={geo} castShadow><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} emissive="#3a3a3a" emissiveIntensity={0.5} /></mesh>;
  }

  function PoleBetween({ a, b, r = 0.035 }) {
    const M = useM();
    const dx = b[0] - a[0]; const dy = b[1] - a[1]; const dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    return (
      <group position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[Math.atan2(dz, dy), 0, -Math.atan2(dx, dy)]}>
        <Cyl rt={r * 0.55} rb={r} h={len} m={M.plain('#6b5d4c', { roughness: 1 })} seg={6} />
      </group>
    );
  }
  function PoleTop({ p }) {
    const M = useM();
    const w = M.plain('#5d5040', { roughness: 1 });
    return (
      <group position={p}>
        <Cyl rt={0.006} rb={0.014} h={0.5} p={[0.03, 0.22, 0]} r={[0, 0, -0.15]} m={w} seg={4} />
        <Cyl rt={0.006} rb={0.012} h={0.34} p={[-0.07, 0.15, 0.03]} r={[0.1, 0, 0.5]} m={w} seg={4} />
      </group>
    );
  }

  /* leaning dead-branch flag poles: base, height, lean (degrees) and lean direction */
  const POLEDEF = [
    { id: 'p1', b: [-5.1, 0, -2.9], L: 5.1, tl: 11, d: [-0.9, 0.4] },
    { id: 'p2', b: [5.4, 0, -2.8], L: 4.8, tl: 9, d: [0.8, -0.3] },
    { id: 'p3', b: [-2.0, 0, -4.1], L: 4.4, tl: 12, d: [-0.3, -1] },
    { id: 'p4', b: [1.9, 0, -4.3], L: 5.0, tl: 8, d: [0.6, -0.8] },
    { id: 'p5', b: [5.3, 0, 2.2], L: 3.9, tl: 10, d: [0.5, 0.8] },
    { id: 'p6', b: [-5.2, 0, 1.6], L: 3.8, tl: 11, d: [-0.7, 0.5] },
  ];
  const poles = POLEDEF.map((q) => {
    const dl = Math.hypot(q.d[0], q.d[1]); const tr = (q.tl * Math.PI) / 180;
    return { id: q.id, b: q.b, t: [q.b[0] + q.L * Math.sin(tr) * q.d[0] / dl, q.L * Math.cos(tr), q.b[2] + q.L * Math.sin(tr) * q.d[1] / dl] };
  });
  const PM = {}; poles.forEach((q) => { PM[q.id] = q; });
  const at = (id, f) => { const q = PM[id]; return [q.b[0] + (q.t[0] - q.b[0]) * f, q.t[1] * f, q.b[2] + (q.t[2] - q.b[2]) * f]; };
  const G1 = [3.5, 3.0, -0.9]; const G2 = [5.8, 3.0, -0.9]; const G3 = [4.7, 3.08, -0.9]; const G4 = [4.1, 3.0, -0.9]; const G5 = [5.3, 3.0, -0.9];
  const lines = [
    { a: at('p1', 0.96), b: at('p2', 0.94), sag: 0.45, n: 62 },
    { a: at('p1', 0.86), b: at('p4', 0.96), sag: 0.35, n: 36 },
    { a: at('p3', 0.96), b: at('p2', 0.88), sag: 0.4, n: 38 },
    { a: at('p3', 0.8), b: at('p4', 0.8), sag: 0.3, n: 22 },
    { a: G1, b: at('p5', 0.92), sag: 0.3, n: 22 },
    { a: G2, b: at('p2', 0.88), sag: 0.25, n: 20 },
    { a: G1, b: at('p4', 0.85), sag: 0.25, n: 22 },
    { a: G2, b: at('p5', 0.7), sag: 0.2, n: 14 },
    { a: at('p1', 0.7), b: at('p6', 0.9), sag: 0.3, n: 24 },
    { a: at('p6', 0.92), b: at('p3', 0.75), sag: 0.35, n: 34 },
    { a: G1, b: at('p3', 0.7), sag: 0.35, n: 30 },
    { a: G2, b: at('p4', 0.65), sag: 0.2, n: 16 },
    { a: G3, b: at('p6', 0.6), sag: 0.5, n: 40 },
    { a: G4, b: at('p1', 0.55), sag: 0.5, n: 44 },
    { a: G5, b: at('p3', 0.5), sag: 0.35, n: 24 },
    { a: G3, b: at('p5', 0.8), sag: 0.25, n: 16 },
  ];

  function Flags() {
    const M = useM();
    const tall = [
      { p: [-4.6, 0, -4.6], h: 4.0, c: '#f2f2ee', tl: 0.17 }, { p: [-3.9, 0, -4.9], h: 3.4, c: '#f2f2ee', tl: -0.2 },
      { p: [4.4, 0, -4.6], h: 3.7, c: '#f2f2ee', tl: 0.15 }, { p: [3.7, 0, -4.9], h: 3.1, c: '#d6261f', tl: -0.18 }, { p: [0.3, 0, -5.0], h: 3.3, c: '#f2c718', tl: 0.2 },
    ];
    return (
      <group>
        {poles.map((q) => <group key={q.id}><PoleBetween a={q.b} b={q.t} /><PoleTop p={q.t} /></group>)}
        <FlagLines lines={lines} />
        {tall.map((q, i) => (
          <group key={i} position={q.p} rotation={[0, 0, q.tl]}>
            <Cyl rt={0.015} rb={0.03} h={q.h} p={[0, q.h / 2, 0]} m={M.plain('#6b5d4c', { roughness: 1 })} seg={5} />
            <mesh position={[0.1, q.h - 1.15, 0]} rotation={[0, 0.5 + i, 0]}><planeGeometry args={[0.2, 2.2, 1, 6]} /><meshStandardMaterial color={q.c} side={THREE.DoubleSide} roughness={1} emissive="#333" emissiveIntensity={0.4} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /* thin sagging cloth panel (0.02 thick) */
  function Cloth({ w, d, p, sag = 0.2, m, vertical = false }) {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(w, d, 8, 8);
      const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i += 1) {
        const x = pa.getX(i); const y = pa.getY(i);
        const f = (1 - Math.pow((2 * x) / w, 2)) * (1 - Math.pow((2 * y) / d, 2));
        pa.setZ(i, -sag * f + (vertical ? Math.sin(x * 7) * 0.025 : 0));
      }
      g.computeVertexNormals();
      if (!vertical) g.rotateX(-Math.PI / 2);
      return g;
    }, [w, d, sag, vertical]);
    return <mesh geometry={geo} position={p} material={m} castShadow />;
  }
  function Scallops({ x, y, z, w, m, t }) {
    const n = 6; const sw = w / n;
    return (
      <group position={[x, y, z]}>
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[-w / 2 + sw * (i + 0.5), -0.02, 0]} rotation={[0, 0, Math.PI]} material={m}><circleGeometry args={[sw * 0.52, 8, 0, Math.PI]} /></mesh>
        ))}
        <Box s={[w, 0.03, 0.03]} p={[0, 0.0, 0]} m={t} />
      </group>
    );
  }

  /* ---------- the goddess shrine ---------- */
  function Shrine() {
    const M = useM();
    const dotTex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const g = c.getContext('2d'); g.fillStyle = '#b8231f'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#f4efe6';
      for (let y = 0; y < 4; y += 1) for (let x = 0; x < 4; x += 1) { g.beginPath(); g.arc(8 + x * 16 + (y % 2) * 8, 8 + y * 16, 3.2, 0, 7); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
      if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []);
    const gold = M.gold;
    const red = M.plain('#b02a22', { roughness: 0.9 });
    const deepRed = M.plain('#8e1c1c', { roughness: 0.95 });
    const orange = M.plain('#f39c12', { roughness: 0.9 });
    const yellow = M.plain('#f4d03f', { roughness: 0.9 });
    const turq = M.plain('#1fa2d8', { roughness: 0.9 });
    const dot = useMemo(() => new THREE.MeshStandardMaterial({ map: dotTex, roughness: 0.9, side: THREE.DoubleSide }), [dotTex]);
    const poleM = M.plain('#5a3a22', { roughness: 0.9 });
    const strings = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ x: -1.3 + i * 0.37, l: 0.3 + ((i * 7) % 5) * 0.05 })), []);
    return (
      <group position={[0, 0, -0.1]}>
        {/* stone platform with one step, and a 0.35 m plinth for the idol */}
        <Box s={[3.5, 0.2, 2.2]} p={[0, 0.1, 0]} m={M.mat('stone', 2, 2, { color: '#cfcac0' })} />
        <Box s={[3.0, 0.09, 0.4]} p={[0, 0.045, 1.3]} m={M.mat('stone', 2, 1, { color: '#cfcac0' })} />
        <Box s={[1.7, 0.35, 1.15]} p={[0, 0.375, 0.15]} m={M.mat('stone', 1, 1, { color: '#d8d2c4' })} />
        <Box s={[1.74, 0.05, 1.2]} p={[0, 0.2, 0.15]} m={orange} />
        {/* open timber poles; red cloth draped above and behind the figure (no roof slab) */}
        {[[-1.45, 0.75], [1.45, 0.75], [-1.45, -0.8], [1.45, -0.8]].map(([x, z], i) => <Cyl key={i} rt={0.03} rb={0.04} h={3.25} p={[x, 1.8, z]} m={poleM} seg={6} />)}
        <Box s={[3.0, 0.04, 0.04]} p={[0, 3.4, -0.8]} m={poleM} />
        <Box s={[3.0, 0.04, 0.04]} p={[0, 3.3, 0.75]} m={poleM} />
        <group rotation={[0.05, 0.03, 0.06]}><Cloth w={1.15} d={1.65} p={[-0.98, 3.3, -0.03]} sag={0.32} m={deepRed} />
        <Cloth w={1.15} d={1.65} p={[0.0, 3.34, -0.03]} sag={0.42} m={red} />
        <Cloth w={1.15} d={1.65} p={[0.98, 3.3, -0.03]} sag={0.3} m={deepRed} />
        <group rotation={[0.05, 0.03, 0.06]}>{[-0.98, 0, 0.98].map((x, k) => <Scallops key={k} x={x} y={3.3 - (k === 1 ? 0.26 : 0.2) * 0.0} z={0.8} w={1.15} m={k === 1 ? red : deepRed} t={orange} />)}</group>
        <Cloth w={2.2} d={1.2} p={[0, 2.6, -0.8]} sag={0.0} vertical m={deepRed} /></group>
        
        {strings.map((q, i) => <group key={i}><Cyl rt={0.02} h={q.l} p={[q.x, 3.3 - q.l / 2 - 0.12, 0.86]} m={i % 2 ? yellow : orange} seg={5} />{[0.25, 0.55, 0.85].map((f, j) => <Ball key={j} rad={0.04} p={[q.x, 3.18 - q.l * f, 0.87]} m={(i + j) % 2 ? orange : yellow} />)}</group>)}
        {/* goddess: slim standing idol on a plain stone plinth */}
        <group position={[0, 0.55, 0.15]} scale={1.25}>
          {/* red dress, narrow, flaring slightly */}
          <Cyl rt={0.15} rb={0.25} h={0.95} p={[0, 0.48, 0]} m={red} seg={14} />
          <Cyl rt={0.152} rb={0.16} h={0.05} p={[0, 0.72, 0]} m={gold} seg={12} />
          <Cyl rt={0.25} rb={0.26} h={0.04} p={[0, 0.03, 0]} m={orange} seg={14} />
          {/* shoulders and arms */}
          <Box s={[0.42, 0.13, 0.2]} p={[0, 0.93, 0]} m={deepRed} />
          <Cyl rt={0.03} h={0.3} p={[-0.2, 0.78, 0.07]} r={[-0.5, 0, 0.15]} m={gold} seg={6} />
          <Cyl rt={0.03} h={0.3} p={[0.2, 0.78, 0.07]} r={[-0.5, 0, -0.15]} m={gold} seg={6} />
          <Ball rad={0.045} p={[0, 0.78, 0.2]} m={gold} />
          {/* turquoise cloth diagonally across the chest, with a trailing end */}
          <Box s={[0.1, 0.62, 0.05]} p={[-0.02, 0.72, 0.17]} r={[-0.12, 0, 0.62]} m={turq} />
          <Box s={[0.12, 0.32, 0.04]} p={[0.26, 0.55, 0.15]} r={[0, 0, -0.25]} m={turq} />
          <Box s={[0.12, 0.3, 0.04]} p={[-0.28, 0.55, 0.14]} r={[0, 0, 0.3]} m={turq} />
          {/* red-white dotted shawl crossing the other way, plus panels framing the face */}
          <mesh position={[0.03, 0.7, 0.19]} rotation={[-0.1, 0, -0.65]} material={dot}><boxGeometry args={[0.13, 0.6, 0.03]} /></mesh>
          <mesh position={[-0.2, 1.02, 0.02]} rotation={[0, 0.15, 0.08]} material={dot}><boxGeometry args={[0.11, 0.5, 0.05]} /></mesh>
          <mesh position={[0.2, 1.02, 0.02]} rotation={[0, -0.15, -0.08]} material={dot}><boxGeometry args={[0.11, 0.5, 0.05]} /></mesh>
          <mesh position={[0, 1.28, -0.05]} rotation={[0, 0, 0]} material={dot}><boxGeometry args={[0.4, 0.1, 0.08]} /></mesh>
          {/* hanging marigold strands, vertical */}
          {[-0.13, -0.07, 0.07, 0.13].map((x, i) => (
            <group key={x}>
              <Cyl rt={0.024} h={0.72 - Math.abs(x)} p={[x * 1.15, 0.58, 0.14 + (i % 2) * 0.03]} m={i % 2 ? yellow : orange} seg={5} />
              {[0, 1, 2, 3].map((k) => <Ball key={k} rad={0.034} p={[x * 1.15, 0.9 - k * 0.17, 0.17 + (i % 2) * 0.03]} m={(i + k) % 2 ? orange : yellow} />)}
            </group>
          ))}
          <Cyl rt={0.03} h={0.32} p={[-0.26, 0.73, 0.04]} m={orange} seg={5} /><Cyl rt={0.03} h={0.32} p={[0.26, 0.73, 0.04]} m={yellow} seg={5} />
          {/* head with gold face */}
          <Cyl rt={0.035} h={0.1} p={[0, 1.05, 0.01]} m={gold} seg={8} />
          <Ball rad={0.115} p={[0, 1.17, 0.02]} sc={[0.9, 1.15, 0.9]} m={gold} />
          <Box s={[0.02, 0.016, 0.02]} p={[-0.04, 1.2, 0.115]} m={M.dark} /><Box s={[0.02, 0.016, 0.02]} p={[0.04, 1.2, 0.115]} m={M.dark} />
          <Box s={[0.016, 0.05, 0.02]} p={[0, 1.15, 0.12]} m={deepRed} />
          {/* tall ornate gold crown */}
          <Cyl rt={0.13} rb={0.125} h={0.07} p={[0, 1.3, 0]} m={gold} seg={12} />
          <mesh position={[0, 1.57, 0]} material={gold}><coneGeometry args={[0.13, 0.5, 10]} /></mesh>
          {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 1.46, 0]} material={gold}><coneGeometry args={[0.05, 0.28, 6]} /></mesh>)}
          {[-0.065, 0.065].map((x) => <mesh key={x} position={[x, 1.52, 0.02]} material={gold}><coneGeometry args={[0.04, 0.34, 6]} /></mesh>)}
          <Ball rad={0.03} p={[0, 1.84, 0]} m={gold} />
          <mesh position={[0, 1.22, -0.1]} material={deepRed}><sphereGeometry args={[0.15, 10, 8, 0, 6.3, 0, 1.4]} /></mesh>
          {/* gold trident and curved blade at her left */}
          <group position={[-0.46, 0, 0.1]}>
            <Cyl rt={0.014} h={1.7} p={[0, 0.85, 0]} m={gold} seg={6} />
            {[-0.09, 0, 0.09].map((x) => <mesh key={x} position={[x, 1.76 + (x ? 0 : 0.06), 0]} material={gold}><coneGeometry args={[0.025, x ? 0.2 : 0.3, 5]} /></mesh>)}
            <Box s={[0.2, 0.025, 0.025]} p={[0, 1.68, 0]} m={gold} />
            <mesh position={[0.3, 0.95, 0]} rotation={[0, 0, 0.5]} material={gold}><torusGeometry args={[0.8, 0.02, 5, 18, 1.1]} /></mesh>
          </group>
          {/* second small figure in orange on her right */}
          <Cyl rt={0.06} rb={0.14} h={0.3} p={[0.58, 0.16, -0.08]} m={orange} seg={10} />
          <Ball rad={0.05} p={[0.58, 0.37, -0.07]} m={gold} />
          <mesh position={[0.58, 0.47, -0.07]} material={gold}><coneGeometry args={[0.05, 0.12, 6]} /></mesh>
        </group>
        <Diyo p={[-1.1, 0.2, 0.9]} light /><Diyo p={[-0.9, 0.2, 1.0]} /><Diyo p={[1.0, 0.2, 0.95]} light /><Diyo p={[1.2, 0.2, 1.0]} />
      </group>
    );
  }

  function IronTridents() {
    const M = useM();
    const iron = M.plain('#2a2623', { roughness: 0.5, metalness: 0.6 });
    const spots = [
      [-2.05, 0.6, 0.04, 1.9], [-2.35, 0.55, -0.05, 1.6], [-2.65, 0.62, 0.07, 1.8], [-2.95, 0.58, -0.03, 1.5], [-3.2, 0.64, 0.05, 1.7],
      [-2.1, -0.15, -0.04, 1.7], [-2.4, -0.1, 0.06, 2.0], [-2.7, -0.18, -0.06, 1.5], [-3.0, -0.12, 0.04, 1.8],
      [2.05, 0.65, 0.05, 1.8], [2.35, 0.7, -0.04, 1.5], [2.65, 0.62, 0.06, 2.0], [2.95, 0.68, -0.05, 1.6],
      [2.1, 1.4, -0.05, 1.6], [2.4, 1.45, 0.04, 1.9], [2.7, 1.38, -0.06, 1.5], [3.0, 1.44, 0.05, 1.7],
      [-1.0, -1.45, 0.06, 1.7], [0.95, -1.5, -0.08, 1.6],
    ];
    return (
      <group>
        {spots.map(([x, z, t, h], i) => (
          <group key={i} position={[x, 0.05, z]} rotation={[0, 0, t]}>
            <Cyl rt={0.03} rb={0.034} h={h} p={[0, h / 2, 0]} m={iron} seg={5} />
            <Box s={[0.26, 0.04, 0.04]} p={[0, h - 0.18, 0]} m={iron} />
            {[-0.12, 0, 0.12].map((px) => <mesh key={px} position={[px, h + (px ? 0.0 : 0.1), 0]} material={iron}><coneGeometry args={[px ? 0.03 : 0.035, px ? 0.3 : 0.4, 5]} /></mesh>)}
            <Ball rad={0.045} p={[0, h * 0.55, 0]} m={iron} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- bell on a black two-post gantry ---------- */
  function Bell({ p, s = 1, m }) {
    const geo = useMemo(() => new THREE.LatheGeometry([[0.0, 0.56], [0.05, 0.56], [0.07, 0.5], [0.13, 0.45], [0.15, 0.3], [0.2, 0.14], [0.27, 0.03], [0.29, 0], [0.26, 0.0], [0.14, 0.1], [0.1, 0.3], [0.0, 0.5]].map((q) => new THREE.Vector2(q[0], q[1])), 20), []);
    return (
      <group position={p} scale={s}>
        <mesh geometry={geo} material={m} castShadow />
        <mesh position={[0, 0.66, 0]} rotation={[0, 0, 0]} material={m}><torusGeometry args={[0.07, 0.022, 6, 12]} /></mesh>
        <Ball rad={0.05} p={[0, 0.04, 0]} m={m} />
      </group>
    );
  }
  function BellGantry() {
    const M = useM();
    const blk = M.plain('#1e1e1e', { roughness: 0.6, metalness: 0.3 });
    const bronze = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7a5f2b', metalness: 0.75, roughness: 0.4, side: THREE.DoubleSide }), []);
    const wall = M.mat('stone', 3, 1, { color: '#a8a398' });
    const BY = 2.9; // underside of the beam
    const big = [[0, 1.6], [-0.78, 1.15], [0.8, 1.2], [-1.12, 0.95]];
    const small = [[-0.45, 0.42, 0.34, 0.3], [0.42, 0.4, 0.4, -0.3], [-1.05, 0.36, 0.5, -0.32], [1.12, 0.45, 0.36, 0.3], [-0.2, 0.34, 0.52, -0.38], [0.2, 0.32, 0.3, 0.36], [1.1, 0.34, 0.6, -0.3]];
    return (
      <group position={[4.7, 0, -0.9]}>
        <Box s={[3.6, 0.12, 1.7]} p={[0, 0.06, 0]} m={M.mat('stone', 2, 1, { color: '#bfb9ad' })} />
        {[-1.35, 1.35].map((x) => <Box key={x} s={[0.2, 3.0, 0.2]} p={[x, 1.62, 0]} m={blk} />)}
        <Box s={[3.1, 0.24, 0.26]} p={[0, BY + 0.12, 0]} m={blk} />
        {[-1, 1].map((x) => <Box key={x} s={[0.1, 0.62, 0.1]} p={[x * 1.1, BY - 0.25, 0]} r={[0, 0, x * 0.75]} m={blk} />)}
        {big.map(([x, s], i) => (
          <group key={i}>
            <Cyl rt={0.02} h={0.1} p={[x, BY - 0.04, 0]} m={blk} seg={5} />
            <Bell p={[x, BY - 0.68 * s - 0.04, 0]} s={s} m={bronze} />
          </group>
        ))}
        {small.map(([x, s, cl, z], i) => (
          <group key={`s${i}`}>
            <Cyl rt={0.006} h={cl} p={[x, BY - cl / 2, z]} m={blk} seg={4} />
            <Bell p={[x, BY - cl - 0.68 * s, z]} s={s} m={bronze} />
          </group>
        ))}
        {/* low dark stone retaining wall in front of the bells */}
        <Box s={[3.7, 0.32, 0.26]} p={[0.1, 0.16, 0.95]} m={wall} />
      </group>
    );
  }


  /* ---------- timber shelter with blue two-tier tin roof ---------- */
  function Shelter() {
    const M = useM();
    const tinTex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 16; c.height = 8;
      const g = c.getContext('2d'); g.fillStyle = '#3f6fb5'; g.fillRect(0, 0, 16, 8); g.fillStyle = '#4f7fc3'; g.fillRect(0, 0, 6, 8);
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 1);
      if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []);
    const tin = useMemo(() => new THREE.MeshStandardMaterial({ map: tinTex, roughness: 0.5, metalness: 0.35 }), [tinTex]);
    const wood = M.mat('wood', 1, 1, { color: '#e0bc82' });
    const post = M.plain('#8a6838', { roughness: 0.9 });
    const dk = M.plain('#4a3320', { roughness: 0.9 });
    const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#33404c', emissive: '#ffb860', emissiveIntensity: 0.15, roughness: 0.3 }), []);
    const W = 3.5; const D = 2.8; const WH = 1.0; const Y0 = 0.28; const C = 0;
    const hull = useMemo(() => {
      const sh2 = new THREE.Shape();
      const x = W / 2; const z = D / 2;
      sh2.moveTo(-x + C, -z); sh2.lineTo(x - C, -z); sh2.lineTo(x, -z + C); sh2.lineTo(x, z - C); sh2.lineTo(x - C, z); sh2.lineTo(-x + C, z); sh2.lineTo(-x, z - C); sh2.lineTo(-x, -z + C); sh2.closePath();
      const g = new THREE.ExtrudeGeometry(sh2, { depth: WH, bevelEnabled: false });
      g.rotateX(-Math.PI / 2); g.translate(0, Y0, 0);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 0.5);
      return g;
    }, []);
    const posts = useMemo(() => {
      const o = []; const nP = 7; const sw = W - 2 * C; const sd = D - 2 * C;
      for (let i = 0; i < nP; i += 1) {
        const x = -sw / 2 + (i * sw) / (nP - 1); const z = -sd / 2 + (i * sd) / (nP - 1);
        o.push({ p: [x, Y0 + WH / 2, D / 2 + 0.02], s: [0.075, WH, 0.06] }, { p: [x, Y0 + WH / 2, -D / 2 - 0.02], s: [0.075, WH, 0.06] });
        o.push({ p: [W / 2 + 0.02, Y0 + WH / 2, z], s: [0.06, WH, 0.075] }, { p: [-W / 2 - 0.02, Y0 + WH / 2, z], s: [0.06, WH, 0.075] });
      }
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => o.push({ p: [sx * (W / 2 - C / 2), Y0 + WH / 2, sz * (D / 2 - C / 2)], s: [0.075, WH + 0.02, 0.075], r: [0, 0, 0] }));
      return o;
    }, []);
    const rails = useMemo(() => [
      { p: [0, Y0 + 0.04, D / 2 + 0.03], s: [W - 2 * C, 0.07, 0.06] }, { p: [0, Y0 + WH - 0.03, D / 2 + 0.03], s: [W - 2 * C, 0.08, 0.06] },
      { p: [0, Y0 + 0.04, -D / 2 - 0.03], s: [W - 2 * C, 0.07, 0.06] }, { p: [0, Y0 + WH - 0.03, -D / 2 - 0.03], s: [W - 2 * C, 0.08, 0.06] },
      { p: [W / 2 + 0.03, Y0 + 0.04, 0], s: [0.06, 0.07, D - 2 * C] }, { p: [W / 2 + 0.03, Y0 + WH - 0.03, 0], s: [0.06, 0.08, D - 2 * C] },
      { p: [-W / 2 - 0.03, Y0 + 0.04, 0], s: [0.06, 0.07, D - 2 * C] }, { p: [-W / 2 - 0.03, Y0 + WH - 0.03, 0], s: [0.06, 0.08, D - 2 * C] },
    ], []);
    return (
      <group position={[-3.6, 0, -2.0]} rotation={[0, 0.3, 0]}>
        <Box s={[W + 0.45, 0.28, D + 0.45]} p={[0, 0.14, 0]} m={M.mat('stone', 3, 1, { color: '#c4bfb4' })} />
        <mesh geometry={hull} material={wood} castShadow />
        <Inst items={posts} geo={unitBox} mat={<meshStandardMaterial color="#8a6838" roughness={0.9} />} />
        <Inst items={rails} geo={unitBox} mat={<meshStandardMaterial color="#5c4426" roughness={0.9} />} />
        {/* door at left bay, white-framed window right of centre */}
        <Box s={[0.5, 0.82, 0.05]} p={[-1.1, Y0 + 0.42, D / 2 + 0.045]} m={dk} />
        <Box s={[0.74, 0.5, 0.05]} p={[0.55, Y0 + 0.62, D / 2 + 0.05]} m={M.plain('#f3f1ea')} />
        <Box s={[0.6, 0.38, 0.06]} p={[0.55, Y0 + 0.62, D / 2 + 0.06]} m={glass} />
        <Box s={[0.03, 0.4, 0.07]} p={[0.55, Y0 + 0.62, D / 2 + 0.065]} m={M.plain('#f3f1ea')} />
        <Box s={[0.9, 0.12, 0.3]} p={[-1.1, 0.34, D / 2 + 0.3]} m={M.mat('stone', 1, 1, { color: '#c4bfb4' })} />
        {/* low wide blue hipped roof, deep eaves */}
        <Box s={[W + 1.2, 0.05, D + 1.2]} p={[0, Y0 + WH + 0.02, 0]} m={dk} cast={false} />
        <Roof w={W + 1.3} d={D + 1.3} h={0.5} y={Y0 + WH + 0.04} m={tin} sag={1} lift={0} />
        {/* taller white-grey clerestory drum under a steeper upper roof */}
        <Box s={[2.2, 0.62, 1.75]} p={[0, Y0 + WH + 0.5, 0]} m={M.plain('#d3d3cf', { roughness: 0.9 })} />
        {[-0.65, 0, 0.65].map((x) => <Box key={x} s={[0.4, 0.26, 0.03]} p={[x, Y0 + WH + 0.54, 0.885]} m={dk} />)}
        <Box s={[2.5, 0.04, 2.05]} p={[0, Y0 + WH + 0.82, 0]} m={dk} cast={false} />
        <Roof w={2.55} d={2.1} h={0.4} y={Y0 + WH + 0.84} m={tin} sag={1} lift={0} />
        <Cyl rt={0.025} rb={0.035} h={0.3} p={[0, Y0 + WH + 1.42, 0]} m={M.plain('#8a8a88', { metalness: 0.7, roughness: 0.4 })} seg={6} />
        <Ball rad={0.045} p={[0, Y0 + WH + 1.6, 0]} m={M.plain('#8a8a88', { metalness: 0.7, roughness: 0.4 })} />
        <pointLight position={[0, 0.9, 1.6]} intensity={0.9} distance={3} color="#ffb060" />
      </group>
    );
  }

  /* irregular wet flagstones, scrub and short dry-stone runs on the plateau */
  function Ground() {
    const M = useM();
    const slabs = useMemo(() => {
      const rg = rng(41); const out = [];
      for (let gx = -5.2; gx <= 5.2; gx += 1.5) for (let gz = -4.2; gz <= 3.9; gz += 1.5) {
        const x = gx + (rg() - 0.5) * 0.7; const z = gz + (rg() - 0.5) * 0.7;
        const edge = 1 + 0.18 * Math.sin(Math.atan2(z / 3.3, x / 4.6) * 5 + 1) + 0.08 * Math.sin(x * 1.7);
        if (Math.hypot(x / 4.7, (z + 0.2) / 3.4) > edge) continue;
        const sx = 1.0 + rg() * 0.45; const sz = 1.0 + rg() * 0.45;
        const tone = ['#8f8c84', '#85827b', '#9a968c', '#7d7a73'][Math.floor(rg() * 4)];
        out.push({ p: [x, 0.03 + rg() * 0.025, z], s: [sx, 0.07, sz], r: [0, rg() * 3, 0], c: tone });
      }
      return out;
    }, []);
    const stones = useMemo(() => {
      const rg = rng(57); const out = [];
      [[-5.4, 3.6, 0.35, 4.2], [-1.2, 3.7, 0.0, 3.0], [4.5, 3.3, 0.5, 3.2], [-6.6, 0.4, 1.4, 2.8]].forEach(([x0, z0, ang, len]) => {
        for (let k = 0; k * 0.65 < len; k += 1) {
          const l = 0.45 + rg() * 0.4; const h = 0.18 + rg() * 0.2;
          out.push({ p: [x0 + Math.cos(ang) * k * 0.65, h / 2, z0 + Math.sin(ang) * k * 0.65 + (rg() - 0.5) * 0.15], s: [l, h, 0.3 + rg() * 0.15], r: [0, ang + (rg() - 0.5) * 0.6, 0], c: rg() > 0.5 ? '#8e8a80' : '#77736a' });
        }
      });
      return out;
    }, []);
    return (
      <group>
        <mesh position={[0, 0.0, -0.1]} scale={[4.9, 1, 3.7]}><cylinderGeometry args={[1, 1, 0.05, 14]} /><meshStandardMaterial color="#6f6a52" roughness={1} /></mesh>
        <Inst items={slabs} geo={unitBox} mat={<meshStandardMaterial color="#ffffff" roughness={0.75} />} />
        <Inst items={stones} geo={unitIco} mat={<meshStandardMaterial color="#ffffff" roughness={1} flatShading />} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Ground />
        <Shrine />
        <IronTridents />
        <BellGantry />
        <Shelter />
        <Flags />
        <Frame s={[11.5, 5.0, 6.5]} p={[0.2, 2.4, -0.6]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function Terrain() {
    const geo = useMemo(() => {
      const nA = 84; const nR = 48; const R = 78;
      const pos = []; const col = []; const idx = [];
      const c = new THREE.Color();
      const rg = rng(7);
      const noise = Array.from({ length: 4000 }, () => rg());
      for (let i = 0; i <= nR; i += 1) {
        const r = R * Math.pow(i / nR, 1.7);
        for (let j = 0; j < nA; j += 1) {
          const a = (j / nA) * Math.PI * 2;
          const x = Math.cos(a) * r; const z = Math.sin(a) * r;
          const y = H(x, z);
          pos.push(x, y, z);
          const e = ell(x, z);
          const n = noise[(i * 31 + j * 17) % 4000];
          if (e < 1.0) c.set(n > 0.6 ? '#8d887c' : n > 0.3 ? '#8a7f5c' : '#7c7352');
          else if (y > -6) c.set(n > 0.7 ? '#98948c' : n > 0.35 ? '#948a5e' : '#847d5e');
          else if (y > -14) c.set(n > 0.65 ? '#8f8c88' : n > 0.3 ? '#8a8158' : '#7d7658');
          else c.set(n > 0.5 ? '#5a6340' : '#66683f');
          col.push(c.r, c.g, c.b);
        }
      }
      for (let i = 0; i < nR; i += 1) {
        for (let j = 0; j < nA; j += 1) {
          const a = i * nA + j; const b = i * nA + ((j + 1) % nA); const d = (i + 1) * nA + j; const e2 = (i + 1) * nA + ((j + 1) % nA);
          idx.push(a, d, b, b, d, e2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} emissive="#5a5236" emissiveIntensity={0.45} /></mesh>;
  }

  function Ridge({ z, top, amp, col, haze = '#c4cfe6', seed, x0 = -110, x1 = 110, glow = 0.5 }) {
    const geo = useMemo(() => {
      const N = 90; const pos = []; const cl = []; const idx = [];
      const a = new THREE.Color(col); const b = new THREE.Color(haze); const lo = a.clone().lerp(b, 0.55);
      for (let k = 0; k <= N; k += 1) {
        const x = x0 + ((x1 - x0) * k) / N;
        const h = top + amp * (Math.sin(x * 0.07 + seed) + 0.6 * Math.sin(x * 0.19 + seed * 2) + 0.3 * Math.sin(x * 0.47 + seed * 3));
        pos.push(x, -40, z + 14, x, h, z, x, -40, z - 14);
        cl.push(lo.r, lo.g, lo.b, a.r, a.g, a.b, lo.r, lo.g, lo.b);
      }
      for (let k = 0; k < N; k += 1) {
        const i = k * 3; const j = (k + 1) * 3;
        idx.push(i, j, i + 1, j, j + 1, i + 1, i + 1, j + 1, i + 2, j + 1, j + 2, i + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [z, top, amp, col, haze, seed, x0, x1]);
    return <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} flatShading roughness={1} emissive={col} emissiveIntensity={glow} /></mesh>;
  }

  /* Kanchenjunga: a broad glaciated massif (about 120 m wide): jagged white crest, snow-streaked blue-violet flanks down to the ridges */
  const SUMMITS = [[-36, 30, 10], [-20, 40, 9], [-4, 47, 12], [12, 40, 9], [27, 34, 10], [42, 26, 9]];
  function SnowWall({ x0 = -34, z = -92, base = -24 }) {
    const geo = useMemo(() => {
      const N = 170; const R = 9;
      const rg = rng(19); const nz = Array.from({ length: 400 }, () => rg());
      const crest = (x) => {
        let h = 9;
        SUMMITS.forEach(([sx, sh, w]) => { h = Math.max(h, 9 + (sh - 9) * Math.pow(Math.max(0, 1 - Math.abs(x - sx) / (w * 3.4)), 0.9)); });
        const vn = (u) => { const i = Math.floor(u); const t = u - i; const a = nz[((i % 400) + 400) % 400]; const b = nz[(((i + 1) % 400) + 400) % 400]; return a + (b - a) * t * t * (3 - 2 * t); };
        const jag = (vn((x + 70) * 0.3) - 0.5) * 9 + (vn((x + 70) * 0.9 + 100) - 0.5) * 3.5;
        return h + jag * (h > 12 ? 1 : 0.4);
      };
      const edge = (x) => sm(-64, -50, x) * (1 - sm(50, 64, x));
      const pos = []; const col = []; const idx = [];
      const snow = new THREE.Color('#f3f6fc'); const shade = new THREE.Color('#bccae6'); const r1 = new THREE.Color('#4d5a8c'); const r2 = new THREE.Color('#3b4778'); const c = new THREE.Color();
      for (let k = 0; k <= N; k += 1) {
        const x = -62 + (124 * k) / N;
        const ch = crest(x) * (0.25 + 0.75 * edge(x));
        const stripe = nz[(k * 7) % 400];
        for (let r = 0; r < R; r += 1) {
          const f = r / (R - 1); // 0 = crest (back), 1 = foot (front)
          const wob = Math.sin(x * 1.1 + r * 1.7) * 1.4 * (1 - f);
          const y = base + 6 + (ch + wob) * Math.pow(1 - f, 0.75) * 0.95;
          pos.push(x, Math.max(base, y), z + f * 26);
          const hh = (y - base) / 52;
          const sn = sm(0.6, 0.7, hh + (stripe - 0.5) * 0.18 + Math.sin(x * 2.1 + r) * 0.04);
          const lowSnow = (stripe > 0.7 ? 0.45 : 0.1) * sm(0.2, 0.55, hh);
          c.copy(r1).lerp(r2, 0.5 + 0.5 * Math.sin(x * 0.5 + r * 0.9)).lerp(shade, lowSnow).lerp(snow, sn).multiplyScalar(0.9 + 0.1 * Math.sin(x * 1.3 + r * 1.1));
          col.push(c.r, c.g, c.b);
        }
      }
      for (let k = 0; k < N; k += 1) for (let r = 0; r < R - 1; r += 1) {
        const a0 = k * R + r; const b0 = (k + 1) * R + r;
        idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} position={[x0, 0, 0]}><meshStandardMaterial vertexColors flatShading side={THREE.DoubleSide} roughness={0.95} emissive="#7f8fc0" emissiveIntensity={0.35} /></mesh>;
  }

  /* clear Himalayan sky dome, deep blue overhead fading to pale blue at the horizon */
  function SkyDome() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(215, 24, 16);
      const p = g.attributes.position; const cols = [];
      const hz = new THREE.Color('#bcd4f0'); const zn = new THREE.Color('#6fa3e0'); const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) { c.copy(hz).lerp(zn, sm(-0.05, 0.6, p.getY(i) / 215)); cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, []);
    return <mesh geometry={geo} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>;
  }


  function Clouds() {
    const items = useMemo(() => {
      const rg = rng(31); const out = [];
      for (let i = 0; i < 26; i += 1) {
        const a = rg() * Math.PI * 2; const r = 58 + rg() * 22;
        const sx = 5 + rg() * 9;
        out.push({ p: [Math.cos(a) * r, -27 - rg() * 3, Math.sin(a) * r], s: [sx, sx * (0.2 + rg() * 0.12), sx * (0.8 + rg() * 0.4)] });
      }
      return out;
    }, []);
    return <Inst items={items} geo={unitSphere} mat={<meshStandardMaterial color="#f4f7fb" emissive="#dfe8f6" emissiveIntensity={0.5} roughness={1} transparent opacity={0.9} />} />;
  }

  function Rocks() {
    const items = useMemo(() => {
      const rg = rng(11); const out = [];
      for (let i = 0; i < 46; i += 1) {
        const a = rg() * Math.PI * 2; const f = 0.78 + rg() * 0.42;
        const x = Math.cos(a) * PX * f; const z = Math.sin(a) * PZ * f;
        if (Math.abs(x) < 6.4 && z > -4.8 && z < 4.0 && ell(x, z) < 0.95) continue;
        const s = 0.18 + rg() * 0.55;
        out.push({ p: [x, H(x, z) + s * 0.25, z], s: [s * 1.3, s * 0.7, s], r: [rg(), rg() * 3, 0], c: rg() > 0.5 ? '#7d7a74' : '#6a6761' });
      }
      return out;
    }, []);
    const tufts = useMemo(() => {
      const rg = rng(23); const out = [];
      for (let i = 0; i < 90; i += 1) {
        const a = rg() * Math.PI * 2; const f = 0.85 + rg() * 0.9;
        const x = Math.cos(a) * PX * f; const z = Math.sin(a) * PZ * f;
        if (Math.abs(x) < 6.2 && z > -4.6 && z < 3.8 && ell(x, z) < 0.95) continue;
        const s = 0.12 + rg() * 0.14;
        out.push({ p: [x, H(x, z) + s * 0.4, z], s: [s, s * 1.2, s], c: rg() > 0.4 ? '#6f6438' : '#5f5a34' });
      }
      return out;
    }, []);
    return (
      <group>
        <Inst items={items} geo={unitIco} mat={<meshStandardMaterial color="#ffffff" roughness={1} flatShading />} />
        <Inst items={tufts} geo={unitCone} mat={<meshStandardMaterial color="#ffffff" roughness={1} flatShading />} />
      </group>
    );
  }

  function SlopeForest() {
    const items = useMemo(() => {
      const rg = rng(5); const out = [];
      for (let i = 0; i < 80; i += 1) {
        const a = rg() * Math.PI * 2; const r = 16 + rg() * 52;
        const x = Math.cos(a) * r; const z = Math.sin(a) * r;
        const y = H(x, z);
        if (y > -14 || y < -28) continue;
        const s = 0.5 + rg() * 0.9 + (-y) * 0.03;
        out.push({ p: [x, y + s * 0.8, z], s: [s * 0.55, s * 1.7, s * 0.55], c: rg() > 0.35 ? '#2c3b2b' : '#3b4a2c' });
      }
      return out;
    }, []);
    return <Inst items={items} geo={unitCone} mat={<meshStandardMaterial color="#ffffff" roughness={1} flatShading />} />;
  }

  function BareTree({ p, s = 1, seed = 1 }) {
    const M = useM();
    const bark = M.plain('#40352b', { roughness: 1 });
    const rg = useMemo(() => rng(seed * 13 + 3), [seed]);
    const br = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ a: rg() * 6.28, y: 0.8 + i * 0.2, l: 0.9 - i * 0.07 + rg() * 0.2, t: 0.7 + rg() * 0.5 })), [rg]);
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.035} rb={0.09} h={1.9} p={[0, 0.95, 0]} m={bark} seg={6} />
        {br.map((b, i) => (
          <group key={i} rotation={[0, b.a, 0]} position={[0, b.y, 0]}>
            <Cyl rt={0.012} rb={0.03} h={b.l} p={[b.l * 0.3, b.l * 0.4, 0]} r={[0, 0, -b.t]} m={bark} seg={5} />
            <Cyl rt={0.006} rb={0.012} h={b.l * 0.55} p={[b.l * 0.68, b.l * 0.78, 0]} r={[0, 0, -b.t * 0.4]} m={bark} seg={4} />
          </group>
        ))}
        <Cyl rt={0.005} rb={0.02} h={0.6} p={[0, 2.15, 0]} m={bark} seg={4} />
      </group>
    );
  }
  function DarkFir({ p, s = 1 }) {
    const M = useM();
    const lf = M.plain('#25362a', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.07} rb={0.14} h={1.4} p={[0, 0.7, 0]} m={M.plain('#3a2f26')} seg={6} />
        {[[0, 1.2, 0, 0.85, 0.9], [0.1, 1.8, 0.05, 0.7, 0.85], [-0.05, 2.35, 0, 0.52, 0.8], [0.02, 2.8, 0, 0.3, 0.7]].map(([x, y, z, r, h], i) => (
          <mesh key={i} position={[x, y, z]} material={lf} castShadow><coneGeometry args={[r, h, 8]} /></mesh>
        ))}
      </group>
    );
  }

  function Env() {
    const T = (x, z) => [x, H(x, z), z];
    return (
      <group>
        <mesh position={[0, -36, 0]}><cylinderGeometry args={[230, 230, 1, 24]} /><meshStandardMaterial color="#4f6040" roughness={1} /></mesh>
        <SkyDome />
        <Terrain />
        <Rocks />
        <SlopeForest />
        <Clouds />
        <BareTree p={T(7.2, -4.4)} s={1.4} seed={2} />
        <BareTree p={T(-8.0, 3.6)} s={1.1} seed={5} />
        <BareTree p={T(8.2, 1.2)} s={0.9} seed={8} />
        <BareTree p={T(1.0, -6.0)} s={1.2} seed={11} />
        <DarkFir p={T(-6.9, -4.3)} s={1.5} />
        <DarkFir p={T(-8.4, -2.0)} s={1.0} />
        <Ridge z={-34} top={-1} amp={2.8} col="#6b6558" haze="#8fa2b4" seed={1.3} glow={0.35} />
        <Ridge z={-48} top={3} amp={4.2} col="#586aa0" haze="#a9b8dc" seed={2.9} glow={0.5} />
        <Ridge z={-60} top={7} amp={5.5} col="#7d8fc2" haze="#bcc8e6" seed={4.4} glow={0.55} />
        <SnowWall x0={-14} z={-96} base={-26} />
      </group>
    );
  }

  return { 'pathibhara-devi': { Main, Env } };
}
