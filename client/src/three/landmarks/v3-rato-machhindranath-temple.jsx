// Rato Machhindranath Temple (Ta Bahal, Patan). Square three-roofed Newar pagoda standing ALONE on a low base in the
// middle of a big open paved courtyard, ringed by a bright blue iron fence (spear-tipped posts), a door + two white
// lions on each of the four sides, a very wide low pale grey-green bottom roof and two much smaller copper-brown
// roofs, gilded pinnacle with guy lines. Brick houses (4-5 storeys) around, one tall conifer right, shrubs left.
// Front = +z. Height/width and courtyard size are estimates (true height is undocumented).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, THREE, useMemo } = K;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rotY = (a, [x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
  const FACES = [0, 1, 2, 3].map((k) => k * Math.PI / 2);

  /* ---------- dimensions (world units, 1 unit ~ 2 m) ---------- */
  const BASE_T = 0.3;                // top of low base
  const HW1 = 1.9;                   // lower shrine half-width
  const E1 = 2.3, W1 = 6.4, H1 = 1.2;   // bottom roof: eave y, width, rise
  const HW2 = 1.35, B2 = 3.1, E2 = 4.0, W2 = 4.0, H2 = 1.55;
  const HW3 = 0.85, B3 = 4.7, E3 = 5.7, W3 = 2.5, H3 = 1.5;
  const TOP = E3 + H3;

  const Inst = ({ geo, mat, items, cast = true }) => {
    const mesh = useMemo(() => {
      const m = new THREE.InstancedMesh(geo, mat, items.length);
      const d = new THREE.Object3D();
      items.forEach((it, i) => {
        d.position.set(...it.p); d.rotation.set(...(it.r || [0, 0, 0])); d.scale.set(...(it.s || [1, 1, 1]));
        d.updateMatrix(); m.setMatrixAt(i, d.matrix);
      });
      m.instanceMatrix.needsUpdate = true; m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false;
      return m;
    }, [geo, mat, items, cast]);
    return <primitive object={mesh} />;
  };
  /** thin rod between two points */
  const Rod = ({ a, b, r = 0.012, m }) => {
    const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = v.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
    return <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} material={m}><cylinderGeometry args={[r, r, len, 5]} /></mesh>;
  };

  /* ---------- struts under one roof, on all four faces + diagonal corner struts ---------- */
  function Struts({ hw, ov, y, drop, xs, m, m2, wd = 1 }) {
    const list = [];
    FACES.forEach((a, k) => xs.forEach((x, i) => list.push({ a, x, hw, ov, key: `f${k}-${i}` })));
    FACES.forEach((a, k) => list.push({ a: a + Math.PI / 4, x: 0, hw: hw * 1.414, ov: ov * 1.414, key: `c${k}`, big: true }));
    return (
      <group>
        {list.map(({ a, x, hw: h0, ov: o0, key, big }, i) => {
          const dz = o0 - h0; const yb = y - drop; const yt = y - 0.1;
          const len = Math.hypot(dz, yt - yb); const ang = Math.atan2(dz, yt - yb);
          return (
            <group key={key} rotation={[0, a, 0]}>
              <Box s={[(big ? 0.16 : 0.1) * wd, len, (big ? 0.14 : 0.09) * wd]} p={[x, (yb + yt) / 2, (h0 + o0) / 2]} r={[ang, 0, 0]} m={i % 2 ? m : m2} />
            </group>
          );
        })}
      </group>
    );
  }

  /* ---------- one white stone lion with gold collar ---------- */
  function WLion({ white, gold, red }) {
    const manes = useM().plain('#d9b27a', { roughness: 0.8 });
    const mane2 = useM().plain('#d9622a', { roughness: 0.8 });
    return (
      <group>
        <Box s={[0.2, 0.2, 0.34]} p={[0, 0.2, -0.02]} m={white} />
        <Box s={[0.2, 0.08, 0.1]} p={[0, 0.34, -0.15]} m={white} />
        <Ball rad={0.14} p={[0, 0.37, 0.14]} m={white} />
        <Ball rad={0.09} sc={[1.2, 0.7, 1]} p={[0, 0.34, 0.26]} m={white} />
        <Cyl rt={0.13} rb={0.16} h={0.05} p={[0, 0.3, 0.1]} r={[0.5, 0, 0]} m={gold} seg={12} />
        <Ball rad={0.19} sc={[1.1, 0.95, 0.45]} p={[0, 0.38, 0.0]} m={mane2} />
        <Ball rad={0.17} sc={[1.05, 0.9, 0.5]} p={[0, 0.38, 0.03]} m={manes} />
        <mesh position={[0, 0.31, 0.11]} rotation={[0.5, 0, 0]} material={gold}><torusGeometry args={[0.13, 0.025, 6, 14]} /></mesh>
        <Ball rad={0.13} p={[0, 0.38, 0.16]} m={white} />
        {[-0.07, 0.07].map((x) => <Box key={x} s={[0.05, 0.04, 0.12]} p={[x, 0.03, 0.2]} m={white} />)}
        <Box s={[0.03, 0.05, 0.03]} p={[-0.06, 0.5, 0.15]} m={red} />
        <Box s={[0.03, 0.05, 0.03]} p={[0.06, 0.5, 0.15]} m={red} />
        {[-0.07, 0.07].map((x) => <Cyl key={x} rt={0.035} h={0.16} p={[x, 0.08, 0.1]} m={white} seg={8} />)}
        {[-0.07, 0.07].map((x) => <Cyl key={x} rt={0.04} h={0.12} p={[x, 0.06, -0.1]} m={white} seg={8} />)}
      </group>
    );
  }

  /* ================================================================ MAIN */
  function RatoMain() {
    const M = useM();
    const brick = M.mat('brick', 3, 1, { color: '#b5553e' });
    const brickBand = M.mat('brick', 2, 0.6, { color: '#b24a33' });
    const dkw = M.plain('#3a1d11', { roughness: 0.8 });
    const redw = M.plain('#6e2c1a', { roughness: 0.8 });
    const carve = M.plain('#8a5530', { roughness: 0.7 });
    const doorM = M.plain('#5a331d', { roughness: 0.75 });
    const gold = M.gold;
    const grey = M.mat('granite', 2, 1, { color: '#b9b2a8' });
    const greyD = M.plain('#8f8a82', { roughness: 0.9 });
    const plinthM = M.plain('#6f6a63', { roughness: 0.95 });
    const white = M.plain('#f2eee6', { roughness: 0.7 });
    const redLion = M.plain('#c4452a');
    const roof1 = M.plain('#8f9a8c', { roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide });
    const roofU = M.plain('#5a3a24', { roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide });
    const blue = M.plain('#1f62c4', { roughness: 0.45, metalness: 0.3 });
    const wheelM = M.plain('#a67c2e', { metalness: 0.6, roughness: 0.4 });
    const wire = M.plain('#1e1e1e');
    const seamM = M.plain('#566052', { roughness: 0.6, metalness: 0.2 });

    const g = useMemo(() => ({
      bar: new THREE.CylinderGeometry(0.012, 0.012, 1.15, 5),
      tip: new THREE.ConeGeometry(0.06, 0.22, 4),
      post: new THREE.BoxGeometry(0.1, 1.5, 0.1),
      wheel: new THREE.CylinderGeometry(0.07, 0.07, 0.2, 8),
      bell: new THREE.SphereGeometry(0.05, 6, 5),
    }), []);

    /* fence */
    const FH = 4.4;
    const { barsFull, posts, tips } = useMemo(() => {
      const barsFull = []; const posts = []; const tips = [];
      FACES.forEach((a) => {
        const n = 36;
        for (let i = 0; i <= n; i += 1) {
          const x = -FH + (2 * FH * i) / n;
          const p = rotY(a, [x, 0.6, FH]);
          if (i % 4 === 0) { posts.push({ p: [p[0], 0.75, p[2]] }); tips.push({ p: [p[0], 1.6, p[2]] }); } else barsFull.push({ p });
        }
      });
      return { barsFull, posts, tips };
    }, []);

    /* prayer wheels along the wall base */
    const wheels = useMemo(() => {
      const arr = [];
      FACES.forEach((a) => [-1, 1].forEach((sd) => { for (let i = 0; i < 6; i += 1) arr.push({ p: rotY(a, [sd * (0.62 + i * 0.17), 0.62, HW1 + 0.09]) }); }));
      return arr;
    }, []);
    /* little bells hung along the bottom roof eave */
    const bells = useMemo(() => {
      const arr = [];
      FACES.forEach((a) => { for (let i = 0; i < 15; i += 1) { const x = -W1 / 2 + 0.35 + i * ((W1 - 0.7) / 14); arr.push({ p: rotY(a, [x, E1 - 0.2, W1 / 2 - 0.05]) }); } });
      return arr;
    }, []);

    const seams = useMemo(() => {
      const out = [];
      FACES.forEach((a, k) => {
        [-2.4, -1.2, 0, 1.2, 2.4].forEach((x, i) => {
          const f = 1 - Math.abs(x) / 3.2 * 0 ;
          out.push(<Rod key={`s${k}-${i}`} a={rotY(a, [x, E1 + 0.1, W1 / 2 - 0.15])} b={rotY(a, [x * 0.25, E1 + H1 * 0.78 + 0.06, 0.9])} r={0.022} m={seamM} />);
        });
      });
      return out;
    }, []);
    const storey = (hw, B, E) => {
      const hh = E - B; const brickH = hh * 0.45;
      return (
        <group>
          <Box s={[hw * 2, brickH, hw * 2]} p={[0, B + brickH / 2, 0]} m={brickBand} />
          <Box s={[hw * 2 + 0.04, hh - brickH, hw * 2 + 0.04]} p={[0, B + brickH + (hh - brickH) / 2, 0]} m={dkw} />
          <Box s={[W1 * 0 + hw * 2 + 0.1, 0.05, hw * 2 + 0.1]} p={[0, E - 0.05, 0]} m={redw} />
          {FACES.map((a, k) => (
            <group key={k} rotation={[0, a, 0]}>
              {Array.from({ length: Math.round(hw * 7) }, (_, i) => {
                const n = Math.round(hw * 7); const w = hw * 1.6; const x = -w / 2 + (w * (i + 0.5)) / n;
                return <Box key={i} s={[w / n * 0.5, hh - brickH - 0.14, 0.07]} p={[x, B + brickH + (hh - brickH) / 2, hw + 0.04]} m={carve} />;
              })}
              <Box s={[hw * 1.7, 0.04, 0.08]} p={[0, B + brickH + 0.07, hw + 0.04]} m={gold} />
            </group>
          ))}
        </group>
      );
    };

    return (
      <group>
        {/* paved base + steps (low: two steps) */}
        <Box s={[7.4, 0.12, 7.4]} p={[0, 0.06, 0]} m={greyD} />
        <Box s={[6.7, 0.2, 6.7]} p={[0, 0.1, 0]} m={grey} />
        <Box s={[6.1, BASE_T, 6.1]} p={[0, BASE_T / 2, 0]} m={grey} />

        {/* lower shrine: brick plinth wall, carved timber zone */}
        <Box s={[HW1 * 2, 1.0, HW1 * 2]} p={[0, BASE_T + 0.5, 0]} m={brick} />
        <Box s={[HW1 * 2 + 0.08, 0.1, HW1 * 2 + 0.08]} p={[0, 1.3, 0]} m={dkw} />
        <Box s={[HW1 * 2 - 0.04, 0.9, HW1 * 2 - 0.04]} p={[0, 1.78, 0]} m={redw} />
        <Box s={[HW1 * 2 + 0.06, 0.07, HW1 * 2 + 0.06]} p={[0, 2.2, 0]} m={dkw} />
        {/* dark ceiling closing the strut zone */}
        <Box s={[W1 - 0.3, 0.1, W1 - 0.3]} p={[0, E1 - 0.08, 0]} m={dkw} />
        {FACES.map((a, k) => (
          <group key={k} rotation={[0, a, 0]}>
            {/* door, frame, tympanum */}
            <Box s={[0.9, 1.15, 0.08]} p={[0, BASE_T + 0.57, HW1 + 0.03]} m={dkw} />
            <Box s={[0.62, 0.98, 0.07]} p={[0, BASE_T + 0.5, HW1 + 0.07]} m={doorM} />
            <Box s={[0.012, 0.9, 0.08]} p={[0, BASE_T + 0.5, HW1 + 0.11]} m={dkw} />
            <Box s={[0.22, 0.34, 0.08]} p={[-0.16, BASE_T + 0.5, HW1 + 0.11]} m={carve} />
            <Box s={[0.22, 0.34, 0.08]} p={[0.16, BASE_T + 0.5, HW1 + 0.11]} m={carve} />
            <Cyl rt={0.72} h={0.1} p={[0, 1.55, HW1 + 0.07]} r={[Math.PI / 2, 0, 0]} m={dkw} seg={24} />
            <Cyl rt={0.6} h={0.12} p={[0, 1.55, HW1 + 0.1]} r={[Math.PI / 2, 0, 0]} m={carve} seg={24} />
            <Cyl rt={0.4} h={0.14} p={[0, 1.55, HW1 + 0.13]} r={[Math.PI / 2, 0, 0]} m={gold} seg={16} />
            <Box s={[1.3, 0.08, 0.1]} p={[0, 2.05, HW1 + 0.08]} m={gold} />
            {/* carved side windows */}
            {[-1, 1].map((s) => (
              <group key={s}>
                <Box s={[0.5, 0.62, 0.06]} p={[s * 1.4, 1.75, HW1 - 0.02]} m={dkw} />
                <Box s={[0.38, 0.5, 0.08]} p={[s * 1.4, 1.75, HW1 - 0.01]} m={carve} />
                <Box s={[0.5, 0.62, 0.06]} p={[s * 0.82, 1.75, HW1 - 0.02]} m={dkw} />
                <Box s={[0.38, 0.5, 0.08]} p={[s * 0.82, 1.75, HW1 - 0.01]} m={carve} />
                <Box s={[0.46, 0.5, 0.06]} p={[s * 1.4, 0.95, HW1 + 0.02]} m={dkw} />
                <Box s={[0.34, 0.38, 0.07]} p={[s * 1.4, 0.95, HW1 + 0.03]} m={carve} />
              </group>
            ))}
            {/* lions on grey plinths flanking the steps */}
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.95, BASE_T, 2.35]}>
                <Box s={[0.8, 0.3, 0.8]} p={[0, 0.15, 0]} m={plinthM} />
                <group position={[0, 0.3, 0]} scale={2.0}><WLion white={white} gold={gold} red={redLion} /></group>
              </group>
            ))}
            {/* two low steps to the door */}
            <Box s={[1.5, 0.12, 0.45]} p={[0, BASE_T + 0.06, HW1 + 0.5]} m={greyD} />
            <Box s={[1.2, 0.08, 0.3]} p={[0, BASE_T + 0.16, HW1 + 0.3]} m={grey} />
          </group>
        ))}
        <Inst geo={g.wheel} mat={wheelM} items={wheels} cast={false} />
        <Struts hw={HW1} ov={W1 / 2 - 0.25} y={E1} drop={1.5} wd={1.35} xs={[-1.7, -1.4, -1.1, -0.8, -0.5, -0.2, 0.2, 0.5, 0.8, 1.1, 1.4, 1.7]} m={redw} m2={dkw} />

        {/* bottom roof */}
        <Roof w={W1} d={W1} h={H1} y={E1} m={roof1} sag={1.12} lift={0.1} fascia={false} />
        {seams}
        {FACES.map((a, k) => <group key={k} rotation={[0, a, 0]}><Box s={[W1 + 0.04, 0.16, 0.07]} p={[0, E1 - 0.04, W1 / 2]} m={gold} /><Box s={[W1 + 0.04, 0.06, 0.09]} p={[0, E1 - 0.1, W1 / 2 - 0.02]} m={dkw} /></group>)}
        <Inst geo={g.bell} mat={gold} items={bells} cast={false} />

        {/* middle storey: brick course, dark carved lattice frieze */}
        {storey(HW2, B2, E2)}
        <Struts hw={HW2} ov={W2 / 2 - 0.15} y={E2} drop={1.0} wd={1.3} xs={[-1.15, -0.85, -0.55, -0.25, 0.25, 0.55, 0.85, 1.15]} m={dkw} m2={dkw} />
        <Roof w={W2} d={W2} h={H2} y={E2} m={roofU} sag={1.15} lift={0.3} fascia={false} />
        {FACES.map((a, k) => <group key={k} rotation={[0, a, 0]}><Box s={[W2 + 0.04, 0.09, 0.06]} p={[0, E2 - 0.02, W2 / 2]} m={gold} /><Box s={[W2 + 0.04, 0.06, 0.09]} p={[0, E2 - 0.09, W2 / 2 - 0.02]} m={dkw} /></group>)}

        {/* top storey */}
        {storey(HW3, B3, E3)}
        <Struts hw={HW3} ov={W3 / 2 - 0.1} y={E3} drop={0.8} wd={1.25} xs={[-0.7, -0.45, -0.2, 0.2, 0.45, 0.7]} m={dkw} m2={dkw} />
        <Roof w={W3} d={W3} h={H3} y={E3} m={roofU} sag={1.15} lift={0.3} fascia={false} />
        {FACES.map((a, k) => <group key={k} rotation={[0, a, 0]}><Box s={[W3 + 0.04, 0.08, 0.06]} p={[0, E3 - 0.02, W3 / 2]} m={gold} /><Box s={[W3 + 0.04, 0.06, 0.08]} p={[0, E3 - 0.08, W3 / 2 - 0.02]} m={dkw} /></group>)}

        {/* gilded pinnacle */}
        <Cyl rt={0.18} rb={0.4} h={0.3} p={[0, TOP + 0.05, 0]} m={gold} seg={12} />
        <Gajur y={TOP + 0.12} s={1.2} />
        {/* guy lines from the pinnacle to the bottom roof */}
        <Rod a={[0, TOP + 0.5, 0]} b={[2.6, E1 + 0.2, -2.0]} m={wire} />
        <Rod a={[0, TOP + 0.5, 0]} b={[-2.4, E1 + 0.2, -2.4]} m={wire} />

        {/* blue iron fence */}
        <Inst geo={g.bar} mat={blue} items={barsFull} cast={false} />
        <Inst geo={g.post} mat={blue} items={posts} cast={false} />
        <Inst geo={g.tip} mat={blue} items={tips} cast={false} />
        {FACES.map((a, k) => (
          <group key={k} rotation={[0, a, 0]}>
            {[0.2, 1.1].map((y) => <Box key={y} s={[FH * 2 + 0.1, 0.05, 0.05]} p={[0, y, FH]} m={blue} cast={false} />)}
          </group>
        ))}

        <Frame s={[9.4, 8.4, 9.4]} p={[0, 4.2, 0]} />
      </group>
    );
  }

  /* ================================================================ ENV */
  function RatoEnv() {
    const M = useM();
    const pave = M.plain('#a39a8c', { roughness: 1 });
    const pave2 = M.plain('#8c8374', { roughness: 1 });
    const outer = M.plain('#7a746a', { roughness: 1 });
    const winM = M.plain('#2a2420', { roughness: 0.6 });
    const litM = M.plain('#ffd98a', { emissive: '#ffb347', emissiveIntensity: 0.3 });
    const frameM = M.plain('#e9e2d2');
    const tankM = M.plain('#2f4f7a');
    const wireM = M.plain('#1b1b1b');

    const winGeo = useMemo(() => new THREE.BoxGeometry(0.42, 0.62, 0.1), []);
    const woodM = M.plain('#4a2c1a', { roughness: 0.85 });
    const frameGeo = useMemo(() => new THREE.BoxGeometry(0.56, 0.76, 0.07), []);
    const frGeo = useMemo(() => new THREE.BoxGeometry(0.58, 0.08, 0.14), []);

    const prism = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 1); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g;
    }, []);
    const { houses, wins, lits, ledges, skyline, bays } = useMemo(() => {
      const r = rng(41);
      const tints = ['#a65a45', '#935040', '#b0694f', '#8a4a3a', '#a8826a'];
      const plains = ['#c9bda6', '#b3a894', '#a89e8d', '#bdae96', '#9d927f'];
      const roofs = ['#6d4a38', '#7a5a46', '#5a5550', '#7d3f2c'];
      const houses = []; const wins = []; const lits = []; const ledges = []; const bays = [];
      [0, 1, 2, 3].forEach((side) => {
        const a = side * Math.PI / 2;      // side 0 = +z (behind the camera), 1 = +x, 2 = -z, 3 = -x
        const near = side === 0 || side === 1;
        const face = near ? 31 : 21;
        let t = -30;
        while (t < 28) {
          const w = 3 + r() * 3.2;
          const gap = r() < 0.3 ? 1.8 + r() * 2.4 : 0;
          const floors = 3 + Math.floor(r() * 4);
          const fh = 1.35 + r() * 0.3;
          const h = floors * fh + 0.5;
          const d = 4.5 + r() * 3;
          const red = r() < 0.5;
          const c = (t + w / 2);
          const fz = face + (r() - 0.5) * 1.6;          // staggered street line
          const skip = near && Math.abs(c) < 6.5;
          if (!skip) {
            const pitched = r() < 0.5;
            houses.push({ a, c, w, h, d, face: fz, red, pitched, rc: roofs[Math.floor(r() * roofs.length)], col: red ? tints[Math.floor(r() * tints.length)] : plains[Math.floor(r() * plains.length)], tank: r() < 0.3, key: `${side}-${t.toFixed(1)}` });
            const cols = Math.max(2, Math.floor(w / 1.3));
            const bayAt = r() < 0.7 ? Math.floor(r() * cols) : -1;
            for (let f = 0; f < floors; f += 1) {
              const y = 1.0 + f * fh;
              for (let i = 0; i < cols; i += 1) {
                const x = c - w / 2 + (w * (i + 0.5)) / cols;
                const rv = r();
                if (rv < 0.12) continue;                       // blank wall
                if (i === bayAt && f > 0 && f < floors - 1) { bays.push({ p: rotY(a, [x, y, fz - 0.22]), r: [0, a, 0] }); continue; }
                const it = { p: rotY(a, [x, y, fz - 0.06]), r: [0, a, 0], s: [0.7 + r() * 0.6, 0.8 + r() * 0.5, 1] };
                if (rv < 0.2) lits.push(it); else wins.push(it);
              }
              if (r() < 0.45) ledges.push({ p: rotY(a, [c, 0.55 + f * fh, fz - 0.12]), r: [0, a, 0], s: [w / 0.58 * (0.5 + r() * 0.4), 1, 1.8] });
            }
          }
          t += w + gap;
        }
      });
      /* hazy distant skyline: irregular urban horizon */
      const skyline = [];
      const rr = rng(5);
      for (let i = 0; i < 40; i += 1) {
        const an = (i / 40) * Math.PI * 2 + rr() * 0.1;
        const rad = 46 + rr() * 14;
        skyline.push({ p: [Math.cos(an) * rad, 0, Math.sin(an) * rad], w: 5 + rr() * 6, h: 6 + rr() * 8, a: an, col: ['#b3a79a', '#a79c92', '#bcb0a2', '#a89a8e'][i % 4] });
      }
      return { houses, wins, lits, ledges, skyline, bays };
    }, []);
    const bayGeo = useMemo(() => new THREE.BoxGeometry(1.1, 0.85, 0.45), []);

    const ledgeGeo = useMemo(() => new THREE.BoxGeometry(0.58, 0.07, 0.12), []);
    void frGeo; void frameM;

    return (
      <group>
        {/* ground: wide road ring, large paved courtyard */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={outer}><circleGeometry args={[90, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={pave2}><planeGeometry args={[60, 60]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow material={pave}><planeGeometry args={[14, 14]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow material={M.plain('#968d7e', { roughness: 1 })}><planeGeometry args={[40, 40]} /></mesh>

        {/* houses around the courtyard: irregular heights, brick red and cream */}
        {houses.map((h) => {
          const mat = h.red ? M.mat('brick', Math.max(1, Math.round(h.w / 2)), Math.max(1, Math.round(h.h / 2.5)), { color: h.col }) : M.plain(h.col, { roughness: 0.9 });
          const p = rotY(h.a, [h.c, h.h / 2, h.face + h.d / 2]);
          const top = rotY(h.a, [h.c, h.h + 0.15, h.face + h.d / 2]);
          return (
            <group key={h.key}>
              <Box s={[h.w, h.h, h.d]} p={p} r={[0, h.a, 0]} m={mat} />
              <Box s={[h.w + 0.2, 0.2, h.d + 0.1]} p={rotY(h.a, [h.c, h.h - 0.1, h.face + h.d / 2])} r={[0, h.a, 0]} m={woodM} cast={false} />
              {h.pitched
                ? <mesh position={rotY(h.a, [h.c, h.h, h.face + h.d / 2])} rotation={[0, h.a, 0]} scale={[h.w + 0.4, 1.3 + h.w * 0.22, h.d + 0.5]} geometry={prism} material={M.plain(h.rc, { roughness: 0.8, side: THREE.DoubleSide })} castShadow />
                : <Box s={[h.w + 0.12, 0.3, h.d + 0.12]} p={top} r={[0, h.a, 0]} m={M.plain('#9d9487')} cast={false} />}
              {h.tank && !h.pitched && <Cyl rt={0.45} h={0.9} p={rotY(h.a, [h.c + 0.5, h.h + 0.75, h.face + h.d * 0.6])} m={tankM} seg={10} />}
            </group>
          );
        })}
        <Inst geo={frameGeo} mat={woodM} items={wins.concat(lits)} cast={false} />
        <Inst geo={winGeo} mat={winM} items={wins} cast={false} />
        <Inst geo={winGeo} mat={litM} items={lits} cast={false} />
        <Inst geo={bayGeo} mat={woodM} items={bays} cast={false} />
        <Inst geo={ledgeGeo} mat={M.plain('#a89f90')} items={ledges} cast={false} />

        {/* hazy skyline */}
        {skyline.map((s, i) => <Box key={i} s={[s.w, s.h, s.w * 0.9]} p={[s.p[0], s.h / 2 - 0.05, s.p[2]]} r={[0, -s.a, 0]} m={M.plain(s.col, { roughness: 1 })} cast={false} />)}

        {/* lamp pole and overhead wires */}
        <group position={[-5.8, 0, 5.4]}>
          <Cyl rt={0.07} rb={0.1} h={4.4} p={[0, 2.2, 0]} m={M.plain('#5a4a40')} seg={8} />
          <Box s={[0.7, 0.05, 0.05]} p={[0.3, 4.35, 0]} m={M.plain('#5a4a40')} />
          <Ball rad={0.13} p={[0.62, 4.25, 0]} m={M.plain('#fff2c0', { emissive: '#ffd27a', emissiveIntensity: 0.8 })} />
          <pointLight position={[0.62, 4.1, 0]} intensity={0.5} distance={9} color="#ffcf8a" />
        </group>
        <Rod a={[-5.8, 4.3, 5.4]} b={[-15, 6.5, -1]} r={0.012} m={wireM} />
        <Rod a={[-5.8, 4.2, 5.4]} b={[8, 5.5, -16]} r={0.012} m={wireM} />
        <Rod a={[-5.8, 4.1, 5.4]} b={[-14, 6.2, 12]} r={0.012} m={wireM} />
        <Rod a={[-5.5, 4.0, 5.4]} b={[14, 6.8, 10]} r={0.012} m={wireM} />
        <Rod a={[-5.5, 3.9, 5.4]} b={[-2, 7.2, -20]} r={0.012} m={wireM} />
        <Rod a={[-6.0, 3.8, 5.4]} b={[-18, 5.2, 4]} r={0.012} m={wireM} />
        <Rod a={[-15, 6.5, -1]} b={[-14, 6.2, 12]} r={0.01} m={wireM} />
        <Rod a={[14, 6.8, 10]} b={[8, 5.5, -16]} r={0.01} m={wireM} />

        {/* shaggy araucaria-like pine, right of the temple */}
        <group position={[9, 0, -1]}>
          <Cyl rt={0.18} rb={0.32} h={8} p={[0, 4, 0]} m={M.plain('#4a3626')} seg={8} />
          {Array.from({ length: 9 }, (_, i) => {
            const rr = rng(100 + i); const y = 2.0 + i * 0.7; const rad = 2.8 - i * 0.26; const nb = 5 + (i % 2);
            return (
              <group key={i} position={[0, y, 0]} rotation={[0, rr() * 6, 0]}>
                {Array.from({ length: nb }, (_, b) => {
                  const ang = (b / nb) * Math.PI * 2 + rr() * 0.6; const L = rad * (0.75 + rr() * 0.5);
                  return (
                    <group key={b} rotation={[0, ang, 0]}>
                      <mesh position={[L * 0.45, -0.12 - rr() * 0.1, 0]} rotation={[0, 0, -0.28 - rr() * 0.25]} scale={[L, 0.2, 0.55 + rr() * 0.4]} material={M.plain(['#2b4a2c', '#345a35', '#3b5f33'][(i + b) % 3], { roughness: 1 })} castShadow><sphereGeometry args={[0.5, 6, 4]} /></mesh>
                    </group>
                  );
                })}
              </group>
            );
          })}
          <Ball rad={0.45} sc={[1, 1.4, 1]} p={[0, 7.9, 0]} m={M.plain('#345a35', { roughness: 1 })} />
        </group>

        {/* a few low shrubs on the left (-x, +z) */}
        {[[-9.2, 6.5, 0.9], [-10.6, 5.2, 0.75], [-8.4, 4.4, 0.6], [-11.4, 7.3, 0.8]].map(([x, z, s], i) => (
          <group key={i} position={[x, 0, z]}>
            <Ball rad={s} sc={[1.5, 0.45, 1.2]} p={[0, s * 0.25, 0]} m={M.plain(i % 2 ? '#3f6a30' : '#4a7a38', { roughness: 1 })} />
          </group>
        ))}
      </group>
    );
  }

  return { 'rato-machhindranath-temple': { Main: RatoMain, Env: RatoEnv } };
}
