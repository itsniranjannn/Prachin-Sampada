// Rani Mahal (Ranighat Palace), Palpa. A small isolated Rana-era palace on a red earth bluff over the Kali Gandaki:
// blue two-storey block with white pilasters, arched windows, pediment and a low red hipped roof, standing on white
// crenellated terrace wings and weathered brown arcaded terraces, a round turret, a diagonal stair to the river bar.
// Front faces +z (river side).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, useMemo, useRef, useEffect, THREE } = K;

  const BLUE = '#2E8FD0';
  const WHITE = '#F4F4F0';
  const RED = '#C0504D';
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  /** arched opening: rectangle with a semicircular head, centred on x, base at y=0, thin in z */
  function archGeo(w, h, depth = 0.08) {
    const r = w / 2;
    const s = new THREE.Shape();
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r);
    s.absarc(0, h - r, r, 0, Math.PI, false);
    s.lineTo(-r, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -depth / 2);
    return g;
  }
  function hipGeometry(W, Dp, h) {
    const hw = W / 2; const hd = Dp / 2; const rx = Math.max(0.05, hw - hd);
    const T = [
      [[-hw, 0, hd], [hw, 0, hd], [rx, h, 0]], [[-hw, 0, hd], [rx, h, 0], [-rx, h, 0]],
      [[hw, 0, -hd], [-hw, 0, -hd], [-rx, h, 0]], [[hw, 0, -hd], [-rx, h, 0], [rx, h, 0]],
      [[hw, 0, hd], [hw, 0, -hd], [rx, h, 0]], [[-hw, 0, -hd], [-hw, 0, hd], [-rx, h, 0]],
    ];
    const pos = []; const uv = [];
    T.forEach((tri) => tri.forEach(([x, y, z]) => { pos.push(x, y, z); uv.push(x / 2, (z + y * 1.4) / 2); }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  /** many copies of one geometry, one draw call. items [x,y,z, sx,sy,sz, rx,ry,rz, colorHex?] */
  function Inst({ items, geo = unitBox, m, shadow = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.rotation.set(it[6] || 0, it[7] || 0, it[8] || 0);
        o.scale.set(it[3] ?? 1, it[4] ?? 1, it[5] ?? 1);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
        if (it[9]) { c.set(it[9]); ref.current.setColorAt(i, c); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, m, items.length]} frustumCulled={false} castShadow={shadow} receiveShadow />;
  }

  /** a row of arched openings along +z facing wall. xs: centres; y: base; recessed dark opening with a pale frame */
  function ArchRow({ xs, y, z, w, h, M, ry = 0, px = 0, glow = false, frame = WHITE, dk = '#1d2326' }) {
    const geo = useMemo(() => archGeo(w, h, 0.1), [w, h]);
    const geo2 = useMemo(() => archGeo(w + 0.16, h + 0.08, 0.06), [w, h]);
    const dark = glow ? M.plain('#5a4a30', { roughness: 0.6, emissive: '#ffb050', emissiveIntensity: 0.4 }) : M.plain(dk, { roughness: 0.9 });
    const fr = M.plain(frame, { roughness: 0.9 });
    return (
      <group position={[px, y, z]} rotation={[0, ry, 0]}>
        <Inst items={xs.map((x) => [x, -0.02, 0.01, 1, 1, 1])} geo={geo2} m={fr} />
        <Inst items={xs.map((x) => [x, 0, 0.04, 1, 1, 1])} geo={geo} m={dark} />
      </group>
    );
  }
  /** crenellated cresting along a straight run (axis x) */
  function Merlons({ x0, x1, y, z, M, n, ry = 0, px = 0, h = 0.28, d = 0.3 }) {
    const items = useMemo(() => range(n, (i) => [x0 + ((i + 0.5) * (x1 - x0)) / n, h / 2, 0, ((x1 - x0) / n) * 0.55, h, d]), [x0, x1, n, h, d]);
    return <group position={[px, y, z]} rotation={[0, ry, 0]}><Inst items={items} m={M.plain(WHITE, { roughness: 0.95 })} shadow /></group>;
  }
  /** baluster band: low rail with posts */
  function Balustrade({ x0, x1, y, z, M, ry = 0, color = WHITE, h = 0.42 }) {
    const n = Math.max(2, Math.round((x1 - x0) / 0.2));
    const items = useMemo(() => range(n, (i) => [x0 + ((i + 0.5) * (x1 - x0)) / n, h / 2 - 0.04, 0, 0.07, h - 0.14, 0.07]), [x0, x1, n, h]);
    const mat = M.plain(color, { roughness: 0.95 });
    return (
      <group position={[0, y, z]} rotation={[0, ry, 0]}>
        <Inst items={items} m={mat} />
        <Box s={[x1 - x0, 0.07, 0.16]} p={[(x0 + x1) / 2, h - 0.03, 0]} m={mat} cast={false} />
        <Box s={[x1 - x0, 0.06, 0.14]} p={[(x0 + x1) / 2, 0.0, 0]} m={mat} cast={false} />
      </group>
    );
  }

  // ---------------------------------------------------------------- geometry constants
  const BLUFF = 3.0; // top of the red bluff
  const L1 = 4.0; // top of the brown arcaded terrace
  const BASE = 6.0; // floor of the blue block (top of the right-hand white terrace)
  const WALL = 3.0; // blue wall height
  const BW = 11; const BD = 3.2; const BZ = -0.5; const BX = 2.0;
  const DEEPBLUE = '#1f6fb0';
  const DARK = '#1d2326';

  // ---------------------------------------------------------------- the blue block
  function BlueBlock() {
    const M = useM();
    const blue = M.plain(BLUE, { roughness: 0.75 });
    const deep = M.plain(DEEPBLUE, { roughness: 0.7 });
    const white = M.plain(WHITE, { roughness: 0.9 });
    const roofM = M.plain(RED, { roughness: 0.8 });
    const hip = useMemo(() => hipGeometry(BW + 0.9, BD + 0.9, 1.25), []);
    const zf = BZ + BD / 2; // facade plane
    const bayZ = zf + 0.45; const bayF = zf + 0.9; // projecting bay centre / front
    const winX = [-4.2, -2.8, 2.8, 4.2];
    const pil = [-5.4, -4.9, -3.5, 3.5, 4.9, 5.4];
    const pedGeo = useMemo(() => {
      const s = new THREE.Shape(); s.moveTo(-2.4, 0); s.lineTo(2.4, 0); s.lineTo(0, 1.3); s.lineTo(-2.4, 0);
      return new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
    }, []);
    const pedIn = useMemo(() => {
      const s = new THREE.Shape(); s.moveTo(-2.1, 0.1); s.lineTo(2.1, 0.1); s.lineTo(0, 1.08); s.lineTo(-2.1, 0.1);
      return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
    }, []);
    const y0 = BASE;
    return (
      <group position={[BX, 0, 0]}>
        {/* blue walls */}
        <Box s={[BW, WALL, BD]} p={[0, y0 + WALL / 2, BZ]} m={blue} />
        {/* wide projecting portico bay */}
        <Box s={[4.4, WALL, 0.9]} p={[0, y0 + WALL / 2, bayZ]} m={blue} />
        {/* white base band, mid cornice, top cornice */}
        <Box s={[BW + 0.12, 0.22, BD + 0.12]} p={[0, y0 + 0.11, BZ]} m={white} />
        <Box s={[BW + 0.16, 0.12, BD + 0.16]} p={[0, y0 + WALL * 0.5, BZ]} m={white} cast={false} />
        <Box s={[BW + 0.3, 0.2, BD + 0.3]} p={[0, y0 + WALL + 0.0, BZ]} m={white} />
        <Box s={[4.7, 0.22, 1.15]} p={[0, y0 + WALL, bayZ + 0.03]} m={white} />
        <Box s={[4.6, 0.14, 1.05]} p={[0, y0 + 0.1, bayZ + 0.05]} m={white} />
        {/* four white columns on the projecting bay */}
        {[-2.1, -0.7, 0.7, 2.1].map((x, i) => (
          <group key={i}>
            <Cyl rt={0.11} rb={0.12} h={WALL - 0.2} p={[x, y0 + WALL / 2 + 0.0, bayF + 0.12]} m={white} seg={10} />
            <Box s={[0.3, 0.12, 0.3]} p={[x, y0 + 0.2, bayF + 0.12]} m={white} cast={false} />
            <Box s={[0.3, 0.12, 0.3]} p={[x, y0 + WALL - 0.18, bayF + 0.12]} m={white} cast={false} />
          </group>
        ))}
        {/* pilasters on the front wings of the facade */}
        {pil.map((x, i) => <Box key={i} s={[0.14, WALL - 0.2, 0.09]} p={[x, y0 + WALL / 2 + 0.05, zf + 0.045]} m={white} cast={false} />)}
        {/* windows: lower and upper rows each side; the portico gets three round-headed doors per level */}
        <ArchRow xs={winX} y={y0 + 0.28} z={zf + 0.01} w={0.62} h={1.0} M={M} />
        <ArchRow xs={winX} y={y0 + WALL * 0.5 + 0.14} z={zf + 0.01} w={0.62} h={1.1} M={M} glow />
        <ArchRow xs={[-1.4, 0, 1.4]} y={y0 + 0.28} z={bayF + 0.0} w={0.6} h={1.1} M={M} />
        <ArchRow xs={[-1.4, 0, 1.4]} y={y0 + WALL * 0.5 + 0.14} z={bayF + 0.0} w={0.6} h={1.1} M={M} glow />
        <Balustrade x0={-2.0} x1={2.0} y={y0 + WALL * 0.5 + 0.14} z={bayF + 0.24} M={M} h={0.34} />
        {/* side facades */}
        {[1, -1].map((sd) => (
          <group key={sd}>
            <ArchRow xs={[-1.1, 0, 1.1]} y={y0 + 0.28} px={BW / 2 * sd} z={BZ} w={0.55} h={0.95} M={M} ry={sd * Math.PI / 2} />
            <ArchRow xs={[-1.1, 0, 1.1]} y={y0 + WALL * 0.5 + 0.14} px={BW / 2 * sd} z={BZ} w={0.55} h={1.05} M={M} ry={sd * Math.PI / 2} glow />
            {[-1.65, -0.55, 0.55, 1.65].map((z, i) => <Box key={i} s={[0.09, WALL - 0.2, 0.14]} p={[sd * (BW / 2 + 0.04), y0 + WALL / 2 + 0.05, BZ + z]} m={white} cast={false} />)}
          </group>
        ))}
        {/* hipped pink-red roof */}
        <mesh geometry={hip} material={roofM} position={[0, y0 + WALL + 0.08, BZ]} castShadow receiveShadow />
        <Box s={[BW + 0.95, 0.08, BD + 0.95]} p={[0, y0 + WALL + 0.06, BZ]} m={M.plain('#8f3a38')} cast={false} />
        {/* big pediment: white frame, deep-blue field, round/oval tympanum */}
        <group position={[0, y0 + WALL + 0.11, bayF + 0.5]}>
          <mesh geometry={pedGeo} material={white} position={[0, 0, -0.08]} castShadow />
          <mesh geometry={pedIn} material={deep} position={[0, 0, 0.06]} />
          <mesh position={[0, 0.45, 0.15]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.25]} material={white}><cylinderGeometry args={[0.3, 0.3, 0.05, 20]} /></mesh>
          <mesh position={[0, 0.45, 0.18]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.25]} material={M.plain('#103f6e', { roughness: 0.6 })}><cylinderGeometry args={[0.22, 0.22, 0.04, 20]} /></mesh>
        </group>
        <Box s={[BW - 2.0, 0.07, 0.1]} p={[0, y0 + WALL + 1.08, BZ]} m={M.plain('#8f3a38')} cast={false} />
      </group>
    );
  }

  // ---------------------------------------------------------------- terraces
  function Terraces() {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.95 });
    const brown = M.mat('brick', 3, 1, { color: '#b08068' });
    const brownDk = M.plain('#8f6454', { roughness: 1 });
    const stain = M.plain('#7a5a4c', { roughness: 1 });
    const dark = M.plain(DARK, { roughness: 0.9 });
    const frameM = M.plain('#e9e7e0', { roughness: 0.9 });
    // ruined arcade: bays 2 and 6 missing (open wall), bay 4 bricked up
    const arches = [-5.6, -4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2, 5.6];
    const ruinArches = arches.filter((_, i) => i !== 2 && i !== 6 && i !== 4);
    const rectWin = range(6, (i) => -6.1 + i * 0.85);
    return (
      <group>
        {/* weathered brown arcaded lower terrace */}
        <Box s={[13.2, L1 - BLUFF, 4.6]} p={[0, (L1 + BLUFF) / 2, 1.6]} m={brown} />
        <Box s={[13.3, 0.45, 4.65]} p={[0, BLUFF + 0.22, 1.6]} m={stain} cast={false} />
        <ArchRow xs={ruinArches} y={BLUFF + 0.02} z={3.92} w={0.85} h={0.82} M={M} frame="#8d6a5a" dk="#3a2c26" />
        <Box s={[1.1, 0.8, 0.06]} p={[arches[4], BLUFF + 0.42, 3.9]} m={brownDk} cast={false} />
        {[2, 6].map((i) => <Box key={i} s={[1.0, 0.7, 0.05]} p={[arches[i], BLUFF + 0.55, 3.91]} m={stain} cast={false} />)}
        <Box s={[13.5, 0.14, 4.9]} p={[0, L1 + 0.04, 1.6]} m={brownDk} cast={false} />
        {/* broken parapet stubs */}
        {[-5.5, -3.2, 3.4, 5.6].map((x, i) => <Box key={i} s={[0.5, 0.35 + (i % 2) * 0.2, 0.2]} p={[x, L1 + 0.3, 3.9]} m={brownDk} />)}

        {/* white left wing: arches below, small rectangular windows above, crenellated top */}
        <Box s={[5.6, 3.45, 2.7]} p={[-3.9, L1 + 1.725, 2.45]} m={white} />
        <ArchRow xs={[-5.9, -4.55, -3.2, -1.85]} y={L1 + 0.1} z={3.81} w={0.8} h={1.0} M={M} />
        <ArchRow xs={[-5.9, -4.55, -3.2, -1.85]} y={L1 + 1.25} z={3.81} w={0.8} h={1.0} M={M} />
        <Inst items={rectWin.map((x) => [x, L1 + 2.9, 3.82, 0.5, 0.62, 0.05])} m={frameM} />
        <Inst items={rectWin.map((x) => [x, L1 + 2.9, 3.845, 0.34, 0.46, 0.05])} m={dark} />
        {[1, 2].map((k) => <Box key={k} s={[5.75, 0.1, 2.85]} p={[-3.9, L1 + k * 1.15 - 0.04, 2.45]} m={white} cast={false} />)}
        <Box s={[5.85, 0.14, 2.9]} p={[-3.9, L1 + 3.5, 2.45]} m={white} />
        <Merlons x0={-6.7} x1={-1.1} y={L1 + 3.57} z={3.82} M={M} n={12} h={0.4} d={0.4} />
        <Merlons x0={-6.7} x1={-1.1} y={L1 + 3.57} z={1.12} M={M} n={12} h={0.4} d={0.4} />
        <ArchRow xs={[-0.6, 0.6]} y={L1 + 0.1} px={-6.72} z={2.45} w={0.6} h={0.9} M={M} ry={-Math.PI / 2} />
        <Inst items={[-0.6, 0.6].map((z) => [-6.74, L1 + 2.9, 2.45 + z, 0.05, 0.5, 0.34])} m={dark} />
        <Merlons x0={-1.3} x1={1.3} y={L1 + 3.57} px={-6.74} z={2.45} M={M} n={5} ry={-Math.PI / 2} h={0.4} d={0.4} />

        {/* right-hand white terrace: lower, with balustrade, in front of the block */}
        <Box s={[7.9, 0.6, 2.6]} p={[2.75, L1 + 0.3, 2.0]} m={white} />
        <ArchRow xs={[0.2, 1.3, 2.4, 3.5, 4.6]} y={L1 + 0.08} z={3.31} w={0.45} h={0.42} M={M} />
        <Box s={[8.1, 0.12, 2.8]} p={[2.75, L1 + 0.64, 2.0]} m={white} />
        <Balustrade x0={-1.25} x1={5.0} y={L1 + 0.68} z={3.38} M={M} h={0.4} />
        <Merlons x0={-1.25} x1={5.0} y={L1 + 1.1} z={3.38} M={M} n={14} />
        {/* the main block stands on this platform; fill behind */}
        <Box s={[BW + 0.4, BASE - L1, 4.6]} p={[BX, (BASE + L1) / 2 - 0.02, -0.5]} m={white} />
        <ArchRow xs={[-2.5, -1.2, 0.1, 1.4, 2.7, 4.0]} y={L1 + 0.95} z={1.81} w={0.55} h={0.75} M={M} />
        {/* the round crenellated turret at the right end of the white terrace */}
        <Cyl rt={0.78} rb={0.82} h={2.7} p={[5.9, L1 + 1.35, 1.4]} m={white} seg={20} />
        <Cyl rt={0.9} rb={0.86} h={0.16} p={[5.9, L1 + 2.7, 1.4]} m={white} seg={20} />
        {range(10, (i) => { const a = (i / 10) * Math.PI * 2; return <Box key={i} s={[0.28, 0.3, 0.22]} p={[5.9 + Math.cos(a) * 0.84, L1 + 2.93, 1.4 + Math.sin(a) * 0.84]} r={[0, -a, 0]} m={white} />; })}
        {[-0.5, 0.5].map((dx, i) => <Box key={i} s={[0.22, 0.5, 0.1]} p={[5.9 + dx * 0.9, L1 + 1.7, 1.4 + 0.74]} r={[0, dx * 0.7, 0]} m={dark} />)}
      </group>
    );
  }

  // ---------------------------------------------------------------- stair down to the river: a solid stone flight
  function Stair() {
    const M = useM();
    const grey = M.plain('#8d8a84', { roughness: 0.95 });
    const greyDk = M.plain('#7b7873', { roughness: 1 });
    const wallM = M.plain('#a3a099', { roughness: 0.95 });
    const x0 = -7.4; const z0 = 4.2; const x1 = -9.8; const z1 = 7.9;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const yaw = Math.atan2(x1 - x0, z1 - z0);
    const n = 16; const run = len / n; const rise = (L1 - 0.2) / n;
    return (
      <group position={[x0, 0, z0]} rotation={[0, yaw, 0]}>
        {range(n, (i) => {
          const top = L1 - i * rise;
          return (
            <group key={i}>
              <Box s={[1.0, top, run + 0.02]} p={[0, top / 2, i * run + run / 2]} m={i % 2 ? grey : greyDk} />
              {[-0.55, 0.55].map((sx) => <Box key={sx} s={[0.1, top + 0.35, run + 0.02]} p={[sx, (top + 0.35) / 2, i * run + run / 2]} m={wallM} cast={false} />)}
            </group>
          );
        })}
        {/* landing on the bar */}
        <Box s={[1.8, 0.12, 1.4]} p={[0, 0.06, len + 0.7]} m={grey} />
        {/* top landing and retaining wall block against the slope */}
        <Box s={[1.0, L1, 0.4]} p={[0, L1 / 2, -0.2]} m={greyDk} />
      </group>
    );
  }

  // ---------------------------------------------------------------- bluff: ragged red earth spur with stone retaining courses
  function Bluff() {
    const M = useM();
    const earth = M.plain('#9a6a52', { roughness: 1, flatShading: true });
    const earthDk = M.plain('#85604c', { roughness: 1, flatShading: true });
    const ochre = M.plain('#a98a68', { roughness: 1, flatShading: true });
    const streak = M.plain('#7a5645', { roughness: 1 });
    const wallBand = M.plain('#a8a090', { roughness: 1 });
    const wallCourse = M.plain('#8f887a', { roughness: 1 });
    const scrub = M.plain('#46703a', { roughness: 1, flatShading: true });
    const scrub2 = M.plain('#35602f', { roughness: 1, flatShading: true });
        const geo = useMemo(() => {
      const g = new THREE.CylinderGeometry(5.4, 6.4, BLUFF, 13, 3, false);
      const p = g.attributes.position; const hash = (a, b) => { const s = Math.sin(a * 91.7 + b * 12.9) * 43758.5453; return s - Math.floor(s); };
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
        const a = Math.round(Math.atan2(z, x) * 100) / 100; const yy = Math.round(y * 10) / 10;
        const k = Math.abs(x) + Math.abs(z) < 0.01 ? 1 : 1 + (hash(a, yy) - 0.5) * 0.14;
        p.setX(i, x * k); p.setZ(i, z * k);
        if (y < BLUFF / 2 - 0.01 && y > -BLUFF / 2 + 0.01) p.setY(i, y + (hash(yy, a) - 0.5) * 0.5);
      }
      g.computeVertexNormals();
      return g;
    }, []);
    const lumps = useMemo(() => {
      const r = rng(23);
      return range(5, (i) => { const a = -0.15 * Math.PI + (i / 5) * Math.PI * 1.3 + r() * 0.3; const rr = 1.0 + r() * 0.08; return [Math.cos(a) * 8.4 * rr, 0.3 + r() * 1.7, 0.5 + Math.sin(a) * 5.7 * rr, 0.35 + r() * 0.4, 0.35 + r() * 0.3, i % 2]; });
    }, []);
    const stones = useMemo(() => {
      const r = rng(41); const out = [];
      [0.28, 0.78, 1.28].forEach((y, row) => {
        const rad = 6.4 - (y + 1.5) / 3 + 0.1; const N = 20;
        for (let i = 0; i < N; i++) {
          const a = -0.05 * Math.PI + ((i + (row % 2) * 0.5 + r() * 0.2) / N) * Math.PI * 1.1;
          const x = Math.cos(a) * 1.5 * rad; const z = 0.5 + Math.sin(a) * 1.02 * rad;
          const nx = Math.cos(a) / 1.5; const nz = Math.sin(a) / 1.02;
          out.push([x, y, z, 0.9 + r() * 0.5, 0.42 + r() * 0.12, 0.55 + r() * 0.25, 0, Math.atan2(nx, nz) + (r() - 0.5) * 0.15, 0, r() > 0.5 ? '#9a8f7e' : '#b0a593']);
        }
      });
      return out;
    }, []);
    const streaks = useMemo(() => {
      const r = rng(77);
      return range(12, (i) => { const a = 0.05 * Math.PI + (i / 12) * Math.PI * 0.95 + r() * 0.1; const rad = 6.0 - 0.25; const nx = Math.cos(a) / 1.5; const nz = Math.sin(a) / 1.02; return { p: [Math.cos(a) * 1.5 * rad, 1.9 + r() * 0.3, 0.5 + Math.sin(a) * 1.02 * rad], ry: Math.atan2(nx, nz), h: 0.8 + r() * 1.0, i }; });
    }, []);
    return (
      <group>
        <mesh geometry={geo} position={[0, BLUFF / 2, 0.5]} scale={[1.5, 1, 1.02]} material={earth} castShadow receiveShadow />
        {lumps.map(([x, y, z, rad, sy, k], i) => <mesh key={i} position={[x, y, z]} scale={[rad * 1.6, rad * sy * 1.2, rad * 1.3]} rotation={[0, i, 0]} material={k ? earthDk : ochre} castShadow><icosahedronGeometry args={[1, 0]} /></mesh>)}
        {streaks.map((s) => <Box key={s.i} s={[0.22, s.h, 0.12]} p={s.p} r={[0, s.ry, 0]} m={s.i % 2 ? streak : ochre} cast={false} />)}
        {/* continuous pale stone retaining wall around the front of the spur */}
        <group position={[0, 0, 0.5]} scale={[1.5, 1, 1.02]}>
          <mesh position={[0, 0.55, 0]} material={wallBand} receiveShadow castShadow><cylinderGeometry args={[6.4, 6.75, 1.1, 40, 1, true, -2.1, 4.2]} /></mesh>
          {[0.28, 0.55, 0.82].map((y, i) => <mesh key={i} position={[0, y, 0]} material={wallCourse}><cylinderGeometry args={[6.6 - y * 0.3 + 0.03, 6.6 - y * 0.3 + 0.03, 0.035, 40, 1, true, -2.1, 4.2]} /></mesh>)}
        </group>
        {/* green scrub on the bluff face */}
        {[[-5.5, 2.0, 5.2, 1.0], [-2.2, 1.9, 6.0, 0.9], [4.0, 2.0, 5.4, 1.0], [8.2, 1.6, 3.2, 0.9], [-8.4, 1.7, 3.0, 0.9], [0.8, 2.1, 5.8, 0.7]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} scale={[r * 1.3, r * 0.6, r]} rotation={[0, i, 0]} material={i % 2 ? scrub : scrub2}><icosahedronGeometry args={[1, 1]} /></mesh>)}
      </group>
    );
  }

  function Peepal({ p, s = 1, tall = 1, m1, m2, bark }) {
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.18} rb={0.32} h={2.4 * tall} p={[0, 1.2 * tall, 0]} m={bark} seg={8} />
        {[[0, 2.6, 0, 1.7, 0.62, m1], [1.5, 2.3, 0.4, 1.2, 0.55, m2], [-1.4, 2.4, -0.3, 1.3, 0.55, m1]].map(([x, y, z, r, f, m], i) => <Ball key={i} rad={r} p={[x, y * tall, z]} sc={[1, f, 1]} m={m} />)}
      </group>
    );
  }

  function MainTrees() {
    const M = useM();
    const leaf = M.plain('#3f6a2f', { roughness: 1 });
    const leaf2 = M.plain('#4f7a35', { roughness: 1 });
    const bark = M.plain('#5a4030', { roughness: 1 });
    return (
      <group>
        <Peepal p={[-7.0, BLUFF - 0.3, -1.2]} s={0.8} m1={leaf} m2={leaf2} bark={bark} />
        {/* one tall peepal at the right end */}
        <group position={[8.2, 0.3, -3]}>
          <Cyl rt={0.22} rb={0.38} h={4.6} p={[0, 2.3, 0]} m={bark} seg={8} />
          {[[0.5, 5.2, 0, 1.5, 0.7], [1.9, 4.5, 0.2, 1.2, 0.6], [0.9, 6.2, -0.4, 1.1, 0.6]].map(([x, y, z, r, f], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1.1, f, 1.1]} m={i % 2 ? leaf : leaf2} />)}
        </group>
        <Peepal p={[6.2, 1.2, -3.2]} s={0.75} m1={leaf2} m2={leaf} bark={bark} />
        {/* scrub on the bluff face (kept low, right and centre) */}
        {[[2.5, 1.2, 6.0], [7.4, 1.4, 4.6], [-1.5, 1.2, 6.2]].map(([x, y, z], i) => <Ball key={i} rad={0.7} p={[x, y, z]} sc={[1.2, 0.6, 1]} m={leaf} />)}
      </group>
    );
  }

  function RaniMain() {
    return (
      <group>
        <Bluff />
        <Terraces />
        <BlueBlock />
        <Stair />
        <MainTrees />
        <pointLight position={[BX, BASE + 1.5, 3.4]} intensity={0.7} distance={8} color="#ffb35a" />
        <Frame s={[20, 11.4, 10]} p={[-0.5, 5.7, 2.8]} />
      </group>
    );
  }

  // ---------------------------------------------------------------- environment
  /** steep forested gorge wall: a tall truncated cone with canopy blobs and an optional pale landslide scar that hugs the slope */
  function Face({ c, rt, rb, h, sx = 1, sz = 0.6, seed, base = '#2a4d2b', n = 260, scar }) {
    const M = useM();
    const mat = M.plain(base, { roughness: 1, flatShading: true });
    const treeMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), []);
    const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const at = (a, t, push = 0) => { const r = rb + (rt - rb) * t + push; return [c[0] + Math.sin(a) * r * sx, c[1] + t * h, c[2] + Math.cos(a) * r * sz]; };
    const items = useMemo(() => {
      const r = rng(seed); const out = [];
      const greens = ['#1f4a26', '#2f5f2c', '#1b3f22', '#3d7232', '#2a5a2b', '#48803a'];
      for (let i = 0; i < n; i++) {
        const a = (r() - 0.5) * Math.PI * 0.95; const t = 0.03 + r() * 0.92;
        if (scar && Math.abs(a - scar.a) < scar.da + 0.1 && Math.abs(t - scar.t) < scar.dt / 2 + 0.06) continue;
        const q = at(a, t, 0.4); const sc = 0.6 + r() * 0.8;
        out.push([q[0], q[1], q[2], sc * 1.5, sc * 1.2, sc * 1.5, 0, r() * 3, 0, greens[Math.floor(r() * greens.length)]]);
      }
      return out;
    }, [seed, n]);
    const patches = useMemo(() => {
      if (!scar) return [];
      const r = rng(seed + 5); const out = [];
      for (let i = 0; i < 24; i++) {
        const u = r(); const t = scar.t - scar.dt / 2 + u * scar.dt;
        const a = scar.a + (u - 0.5) * 0.12 + (r() - 0.5) * scar.da * 1.6;
        const q = at(a, t, 0.25);
        const nx = Math.sin(a) / sx; const nz = Math.cos(a) / sz;
        out.push({ p: q, ry: Math.atan2(nx, nz), w: 2.2 + r() * 2.4, hh: 2.0 + r() * 2.8, k: i % 3 });
      }
      return out;
    }, [seed]);
    const tilt = Math.atan((rb - rt) / h);
    const sc1 = M.plain('#c9b898', { roughness: 1, flatShading: true });
    const sc2 = M.plain('#d4c6a6', { roughness: 1, flatShading: true });
    const sc3 = M.plain('#b9a888', { roughness: 1, flatShading: true });
    return (
      <group>
        <mesh position={[c[0], c[1] + h / 2, c[2]]} scale={[sx, 1, sz]} material={mat} receiveShadow><cylinderGeometry args={[rt, rb, h, 14, 1, true, -Math.PI / 2, Math.PI]} /></mesh>
        <Inst items={items} geo={geo} m={treeMat} />
        {patches.map((q, i) => (
          <group key={i} position={q.p} rotation={[0, q.ry, 0]}>
            <mesh rotation={[-tilt, 0, 0]} scale={[q.w, q.hh, 0.35]} material={q.k === 0 ? sc1 : q.k === 1 ? sc2 : sc3}><icosahedronGeometry args={[1, 0]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  function RaniEnv() {
    const M = useM();
    const gravel = M.plain('#d3c9ae', { roughness: 1 });
    const bar = M.plain('#ddd3b8', { roughness: 1 });
    const bar2 = M.plain('#d8cdb2', { roughness: 1 });
    const water = M.plain('#5aa8a0', { roughness: 0.25, metalness: 0.1 });
    const far = M.plain('#7fa08f', { roughness: 1, flatShading: true });
    const far2 = M.plain('#8aa898', { roughness: 1, flatShading: true });
    const farGround = M.plain('#6f8f66', { roughness: 1 });
    const cobbles = useMemo(() => {
      const r = rng(5);
      return range(120, () => [(r() - 0.5) * 70, 0.09, 9 + r() * 22, 0.25 + r() * 0.35, 0.1, 0.2 + r() * 0.3, 0, r() * 3, 0, r() > 0.5 ? '#bdb398' : '#efe7d2']);
    }, []);
    // sky dome with a blue-grey haze at the horizon
    const skyGeo = useMemo(() => {
      const g = new THREE.SphereGeometry(110, 24, 14);
      const pos = g.attributes.position; const col = []; const top = new THREE.Color('#7fb2dc'); const hz = new THREE.Color('#bcd4e6'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const t = Math.min(1, Math.max(0, pos.getY(i) / 70));
        c.copy(hz).lerp(top, Math.pow(t, 0.7)); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return (
      <group>
        <mesh geometry={skyGeo} position={[0, -2, 0]} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
        {/* ground: wooded far shore, then the pale gravel bar */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} material={farGround}><circleGeometry args={[105, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={gravel} receiveShadow><circleGeometry args={[72, 48]} /></mesh>
        <Inst items={cobbles} m={M.plain('#fff', { roughness: 1 })} />
        {/* one continuous river ribbon wrapping the spur from the right side to the back and left */}
        <group scale={[1.5, 1, 1.02]} position={[0, 0, 0.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={water}>
            <ringGeometry args={[5.8, 15.2, 64, 1, -0.22 * Math.PI, Math.PI * 1.22]} />
          </mesh>
        </group>
        {/* gravel bars lying over the ends of the ribbon so no cut edge shows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.06, 21.5]} material={bar} receiveShadow><circleGeometry args={[25, 56]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16.5, 0.065, 0.5]} scale={[1.9, 1.2, 1]} material={bar2} receiveShadow><circleGeometry args={[8.5, 32]} /></mesh>

        {/* steep forested gorge faces behind and to the sides, with a pale landslide scar */}
        <Face c={[-4, 0, -41]} rt={16} rb={40} h={28} sx={1.7} sz={0.62} seed={3} n={700} scar={{ a: -0.5, t: 0.5, dt: 0.5, da: 0.1 }} />
        <Face c={[58, 0, -40]} rt={8} rb={30} h={26} sx={1.0} sz={0.8} seed={13} base="#30602f" n={420} />
        <Face c={[-52, 0, -32]} rt={8} rb={26} h={24} sx={1.0} sz={1.0} seed={8} base="#2a4f2c" n={380} />
        {/* hazy ridges behind */}
        <mesh position={[10, 20, -78]} scale={[2.2, 1, 0.5]} material={far}><cylinderGeometry args={[18, 60, 40, 9, 1, true]} /></mesh>
        <mesh position={[-45, 24, -82]} scale={[1.6, 1, 0.5]} material={far2}><cylinderGeometry args={[6, 50, 48, 9, 1, true]} /></mesh>
        <mesh position={[70, 18, -60]} scale={[1.2, 1, 0.8]} material={far}><cylinderGeometry args={[6, 40, 36, 9, 1, true]} /></mesh>

        {/* a few trees on the bar and the opposite bank */}
        <Tree p={[20, 0, 14]} s={1.8} />
        <Tree p={[-24, 0, 16]} s={1.5} />
        <Tree p={[-30, 0, 8]} s={2} />
      </group>
    );
  }

  return { 'rani-mahal-palpa': { Main: RaniMain, Env: RaniEnv } };
}
