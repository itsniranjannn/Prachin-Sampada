// Guhyeshwari Temple (Guhyeshwari / Guheswari), Kathmandu: a walled Newar courtyard compound on the SOUTH bank of the
// Bagmati at Gauri Ghat, ~1 km upstream (east) of Pashupatinath. Outside read: a bright red-painted plaster wall (~3 m) on a
// grey stone plinth, ONE ornate cream/yellow/red/gilt torana gate reached by a wide flight of grey stone steps, two-storey
// exposed red-brick Newar ranges with dark carved timber windows, red balcony railings and red tin roofs, big pipal trees,
// a prayer-flag footbridge, Gauri Ghat steps and grey stone votive shrines. Inside: a LOW, wide gilded three-roof pagoda in
// the middle of the courtyard, crowned by four golden serpents, with three tall gilded-top stone pillars in front of it.
// Front = +z = the river (Bagmati) side; the compound sits on a raised terrace. Pashupatinath is NOT visible.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Diyo, PrayerFlags, THREE, useMemo, useRef, useEffect } = K;
  const PI = Math.PI;

  /* ---------- helpers ---------- */
  function Inst({ items, m, geo, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.rotation.set(0, it[6] || 0, 0);
        o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return (
      <instancedMesh key={items.length} ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {geo ? <primitive object={geo} attach="geometry" /> : <boxGeometry args={[1, 1, 1]} />}
      </instancedMesh>
    );
  }

  /** Hip roof with a flat ridge along x: eave rectangle w x d at y=0, ridge at height h. */
  function hipGeo(w, d, h) {
    const rl = Math.max(0.001, (w - d) / 2);
    const v = [[-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2], [-rl, h, 0], [rl, h, 0]];
    const tri = [[3, 2, 5], [3, 5, 4], [1, 0, 4], [1, 4, 5], [2, 1, 5], [0, 3, 4]];
    const pos = [];
    tri.forEach((t) => t.forEach((i) => pos.push(...v[i])));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }
  function HipRoof({ w, d, h, y = 0, m }) {
    const g = useMemo(() => hipGeo(w, d, h), [w, d, h]);
    return <mesh geometry={g} material={m} position={[0, y, 0]} castShadow receiveShadow />;
  }

  /** arched window profile (width 1, height 1, depth 1 centred) for instancing */
  const archGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, -0.5); s.lineTo(0.5, -0.5); s.lineTo(0.5, 0.1);
    s.absarc(0, 0.1, 0.5, 0, PI, false);
    s.lineTo(-0.5, -0.5);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -0.5);
    g.scale(1, 1 / 1.1, 1);
    return g;
  })();

  /* colours */
  const RED = '#8e4733';
  const TIN = '#6f3a30';

  /* ---------- a two-storey red-brick Newar range, local +z = courtyard face ---------- */
  function Block({ p, ry = 0, L, D = 1.2, outerRail = false, doors = [], base = 0.5, ground = 0.8, upper = 0.75 }) {
    const M = useM();
    const H = ground + upper;
    const frame = M.dark;
    const pane = useMemo(() => M.plain('#1d140f', { roughness: 0.6, emissive: '#ff9a3c', emissiveIntensity: 0.18 }), [M]);
    const { fr, pn, posts } = useMemo(() => {
      const fr = []; const pn = []; const posts = [];
      const n = Math.max(3, Math.floor(L / 0.95));
      for (let side = 1; side >= -1; side -= 2) {
        const z = side * (D / 2);
        const rot = side > 0 ? 0 : PI;
        for (let k = 0; k < n; k += 1) {
          const x = -L / 2 + ((k + 0.5) * L) / n;
          fr.push([x, ground + upper * 0.52, z + side * 0.01, 0.46, 0.5, 0.07, rot]);
          pn.push([x, ground + upper * 0.52, z + side * 0.04, 0.34, 0.38, 0.03, rot]);
          const isDoor = side > 0 && doors.includes(k);
          if (isDoor) {
            fr.push([x, 0.42, z + side * 0.01, 0.58, 0.8, 0.07, rot]);
            pn.push([x, 0.4, z + side * 0.04, 0.44, 0.74, 0.03, rot]);
          } else {
            fr.push([x, 0.46, z + side * 0.01, 0.4, 0.4, 0.07, rot]);
            pn.push([x, 0.46, z + side * 0.04, 0.3, 0.3, 0.03, rot]);
          }
        }
      }
      const np = Math.round(L / 0.26);
      for (let k = 0; k <= np; k += 1) {
        const x = -L / 2 + (k * L) / np;
        posts.push([x, ground + 0.2, D / 2 + 0.3, 0.035, 0.3, 0.035, 0]);
        if (outerRail) posts.push([x, ground + 0.2, -D / 2 - 0.3, 0.035, 0.3, 0.035, 0]);
      }
      return { fr, pn, posts };
    }, [L, D, ground, upper, doors, outerRail]);
    const brick = M.mat('brick', Math.max(1, L * 0.55), 1.1, { color: '#f7a27a' });
    const red = M.plain(RED, { roughness: 0.7 });
    const tin = M.plain(TIN, { roughness: 0.6, metalness: 0.05 });
    return (
      <group position={[p[0], base, p[2]]} rotation={[0, ry, 0]}>
        <Box s={[L, H, D]} p={[0, H / 2, 0]} m={brick} />
        <Box s={[L + 0.05, 0.07, D + 0.05]} p={[0, ground, 0]} m={M.dark} cast={false} />
        <Inst items={fr} m={frame} />
        <Inst items={pn} m={pane} />
        {/* red balcony on the courtyard face */}
        <Box s={[L, 0.05, 0.34]} p={[0, ground + 0.02, D / 2 + 0.17]} m={M.dark} cast={false} />
        <Box s={[L, 0.045, 0.05]} p={[0, ground + 0.36, D / 2 + 0.3]} m={red} cast={false} />
        <Box s={[L, 0.04, 0.04]} p={[0, ground + 0.16, D / 2 + 0.3]} m={red} cast={false} />
        {outerRail && <Box s={[L, 0.05, 0.34]} p={[0, ground + 0.02, -D / 2 - 0.17]} m={M.dark} cast={false} />}
        {outerRail && <Box s={[L, 0.045, 0.05]} p={[0, ground + 0.36, -D / 2 - 0.3]} m={red} cast={false} />}
        {outerRail && <Box s={[L, 0.04, 0.04]} p={[0, ground + 0.16, -D / 2 - 0.3]} m={red} cast={false} />}
        <Inst items={posts} m={red} />
        <HipRoof w={L + 0.5} d={D + 0.85} h={0.58} y={H} m={tin} />
        <Box s={[L + 0.5, 0.06, 0.05]} p={[0, H, (D + 0.85) / 2]} m={M.dark} cast={false} />
      </group>
    );
  }

  /* ---------- serpent: a tube arching up from the roof top ---------- */
  function Naga({ ry }) {
    const M = useM();
    const geo = useMemo(() => {
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.16, 0, 0), new THREE.Vector3(0.42, 0.14, 0), new THREE.Vector3(0.5, 0.42, 0),
        new THREE.Vector3(0.36, 0.7, 0), new THREE.Vector3(0.2, 0.86, 0),
      ]);
      return new THREE.TubeGeometry(c, 20, 0.045, 7, false);
    }, []);
    const gm = M.plain('#e0b030', { roughness: 0.3, metalness: 0.75 });
    return (
      <group rotation={[0, ry, 0]}>
        <mesh geometry={geo} material={gm} castShadow />
        <Ball rad={0.075} p={[0.18, 0.9, 0]} sc={[1.5, 1, 0.8]} m={gm} />
        <Ball rad={0.04} p={[0.12, 0.88, 0]} sc={[1.3, 1, 1]} m={gm} />
      </group>
    );
  }

  /* ---------- red rafter under-eaves ---------- */
  function Rafters({ w, d, y, m }) {
    const items = useMemo(() => {
      const a = [];
      const nx = Math.round(w / 0.2); const nz = Math.round(d / 0.2);
      for (let i = 0; i <= nx; i += 1) { const x = -w / 2 + (i * w) / nx; a.push([x, y, d / 2 - 0.05, 0.05, 0.07, 0.3, 0], [x, y, -d / 2 + 0.05, 0.05, 0.07, 0.3, 0]); }
      for (let i = 1; i < nz; i += 1) { const z = -d / 2 + (i * d) / nz; a.push([w / 2 - 0.05, y, z, 0.3, 0.07, 0.05, 0], [-w / 2 + 0.05, y, z, 0.3, 0.07, 0.05, 0]); }
      return a;
    }, [w, d, y]);
    return <Inst items={items} m={m} />;
  }

  /* ---------- the squat gilded four-roof shrine ---------- */
  function Shrine({ p }) {
    const M = useM();
    const gold = M.plain('#d9a82c', { roughness: 0.32, metalness: 0.7 });
    const goldRoof = M.plain('#d4a22a', { roughness: 0.45, metalness: 0.5 });
    const red = M.plain('#8e4a38', { roughness: 0.8 });
    const deepRed = M.plain('#6e2f26', { roughness: 0.8 });
    const cream = M.plain('#efe2c4', { roughness: 0.8 });
    const dark = M.plain('#2a0f0c', { roughness: 0.8 });
    const stone = M.plain('#b9b1a3', { roughness: 0.95 });
    const goldE = M.plain('#e0a828', { roughness: 0.4, metalness: 0.5, emissive: '#ff8a1c', emissiveIntensity: 0.22 });
    const tiers = [
      { w: 4.8, d: 3.9, y: 1.3 },
      { w: 3.7, d: 2.9, y: 2.1 },
    ];
    return (
      <group position={p}>
        <Box s={[5.4, 0.1, 4.6]} p={[0, 0.05, 0]} m={stone} />
        <Box s={[5.0, 0.14, 4.2]} p={[0, 0.17, 0]} m={stone} />
        {/* lower storey, wide: red walls, gilded repousse front panel */}
        <Box s={[4.1, 1.0, 3.1]} p={[0, 0.74, 0]} m={red} />
        <Box s={[3.8, 0.8, 0.06]} p={[0, 0.74, 1.57]} m={gold} />
        {[-1.5, -1.0, 1.0, 1.5].map((x) => <Box key={`rp${x}`} s={[0.34, 0.6, 0.07]} p={[x, 0.76, 1.585]} m={deepRed} />)}
        {[-1.5, -1.0, 1.0, 1.5].map((x) => <Box key={`gp${x}`} s={[0.2, 0.4, 0.08]} p={[x, 0.76, 1.6]} m={gold} />)}
        <Box s={[0.9, 0.62, 0.08]} p={[0, 0.62, 1.595]} m={dark} />
        <Box s={[1.1, 0.08, 0.1]} p={[0, 0.98, 1.6]} m={gold} />
        {[-0.6, 0.6, -1.85, 1.85].map((x) => <Box key={`cp${x}`} s={[0.09, 0.9, 0.1]} p={[x, 0.74, 1.6]} m={cream} />)}
        <Box s={[3.9, 0.07, 0.09]} p={[0, 1.12, 1.6]} m={cream} />
        <Box s={[3.9, 0.06, 0.09]} p={[0, 0.34, 1.6]} m={cream} />
        {[-2.06, 2.06].map((x) => <Box key={`c${x}`} s={[0.1, 1.0, 3.16]} p={[x, 0.74, 0]} m={gold} />)}
        {/* three deep gilded roofs, each over a red fascia and rafters */}
        {tiers.map((t, i) => (
          <group key={i}>
            <Box s={[t.w - 0.1, 0.16, t.d - 0.1]} p={[0, t.y - 0.04, 0]} m={red} cast={false} />
            <Box s={[t.w - 0.3, 0.025, 0.05]} p={[0, t.y - 0.1, (t.d - 0.3) / 2]} m={gold} cast={false} />
            <Rafters w={t.w - 0.2} d={t.d - 0.2} y={t.y - 0.08} m={deepRed} />
            <Roof w={t.w} d={t.d} h={0.34} y={t.y + 0.03} m={goldE} sag={1.3} lift={0.18} fascia={false} />
          </group>
        ))}
        {/* upper storeys */}
        <Box s={[3.2, 0.62, 2.4]} p={[0, 1.72, 0]} m={red} />
        <Box s={[2.7, 0.42, 0.05]} p={[0, 1.74, 1.22]} m={gold} />
        <Box s={[0.56, 0.3, 0.06]} p={[0, 1.72, 1.24]} m={dark} />
        {[-0.95, 0.95].map((x) => <Box key={`s${x}`} s={[0.14, 0.44, 0.07]} p={[x, 1.72, 1.24]} m={cream} />)}
        {/* crown: four golden serpents around a compact finial */}
        <group position={[0, 2.55, 0]} scale={1.0}>
          <Cyl rt={0.13} rb={0.22} h={0.12} p={[0, 0.06, 0]} m={gold} />
          <Cyl rt={0.04} rb={0.05} h={0.6} p={[0, 0.36, 0]} m={gold} seg={10} />
          <Cyl rt={0.16} rb={0.1} h={0.08} p={[0, 0.4, 0]} m={gold} seg={14} />
          <Ball rad={0.07} p={[0, 0.7, 0]} m={gold} />
          <Cyl rt={0.004} rb={0.025} h={0.2} p={[0, 0.84, 0]} m={gold} seg={6} />
          {[0, PI / 2, PI, (3 * PI) / 2].map((a, i) => <Naga key={i} ry={a + PI / 4} />)}
        </group>
        <pointLight position={[0, 2.6, 2.2]} intensity={5} distance={9} color="#ffb04a" />
        <pointLight position={[0, 1.0, 2.0]} intensity={3} distance={6} color="#ff9a3a" />
      </group>
    );
  }

  /* ---------- a tall weathered stone pillar with a gilded animal finial ---------- */
  function Pillar({ p, h = 3.2, k = 0 }) {
    const M = useM();
    const gold = M.plain('#d9a82c', { roughness: 0.32, metalness: 0.7 });
    const stone = M.plain('#9b9488', { roughness: 1 });
    const stoneD = M.plain('#85806f', { roughness: 1 });
    const brick = M.mat('brick', 1, 1, { color: '#f6a27c' });
    return (
      <group position={p}>
        <Box s={[0.72, 0.2, 0.72]} p={[0, 0.1, 0]} m={brick} />
        <Cyl rt={0.2} rb={0.27} h={0.16} p={[0, 0.28, 0]} m={stone} seg={12} />
        <Cyl rt={0.13} rb={0.17} h={h} p={[0, 0.36 + h / 2, 0]} m={stone} seg={12} />
        {[0.25, 0.5, 0.75].map((f) => <Cyl key={f} rt={0.15} rb={0.15} h={0.05} p={[0, 0.36 + h * f, 0]} m={stoneD} seg={12} />)}
        <group position={[0, 0.36 + h, 0]}>
          <Cyl rt={0.2} rb={0.14} h={0.1} p={[0, 0.05, 0]} m={gold} seg={12} />
          <Cyl rt={0.34} rb={0.16} h={0.26} p={[0, 0.23, 0]} m={gold} seg={14} />
          <Cyl rt={0.37} rb={0.37} h={0.05} p={[0, 0.38, 0]} m={gold} seg={14} />
          {k === 1 ? (
            <group position={[0, 0.4, 0]}>
              {/* Garuda: crouching body, head, spread wings */}
              <Box s={[0.14, 0.28, 0.1]} p={[0, 0.17, 0]} m={gold} />
              <Ball rad={0.07} p={[0, 0.36, 0.02]} m={gold} />
              <Box s={[0.05, 0.04, 0.09]} p={[0, 0.35, 0.1]} m={gold} />
              <Box s={[0.36, 0.05, 0.04]} p={[-0.22, 0.32, -0.02]} r={[0, 0, 0.5]} m={gold} />
              <Box s={[0.36, 0.05, 0.04]} p={[0.22, 0.32, -0.02]} r={[0, 0, -0.5]} m={gold} />
              <Box s={[0.06, 0.14, 0.04]} p={[0, 0.02, -0.08]} m={gold} />
            </group>
          ) : (
            <group position={[0, 0.4, 0]}>
              {/* seated lion facing the front */}
              <Box s={[0.22, 0.2, 0.34]} p={[0, 0.12, -0.02]} m={gold} />
              <Box s={[0.18, 0.18, 0.1]} p={[0, 0.2, 0.14]} m={gold} />
              <Ball rad={0.13} p={[0, 0.3, 0.1]} m={gold} />
              <Ball rad={0.075} p={[0, 0.28, 0.2]} m={gold} />
              <Box s={[0.05, 0.22, 0.05]} p={[k === 0 ? 0.08 : -0.08, 0.2, -0.22]} r={[0.5, 0, 0]} m={gold} />
            </group>
          )}
        </group>
      </group>
    );
  }

  /* ---------- the ornate torana gate ---------- */
  function Gate({ p }) {
    const M = useM();
    const gold = M.plain('#d9a82c', { roughness: 0.32, metalness: 0.7 });
    const cream = M.plain('#efe3c6', { roughness: 0.8 });
    const yellow = M.plain('#e6b422', { roughness: 0.7 });
    const redp = M.plain('#8e3a2a', { roughness: 0.7 });
    const dark = M.plain('#241208', { roughness: 0.8 });
    const tin = M.plain('#d4a22a', { roughness: 0.45, metalness: 0.5 });
    return (
      <group position={p}>
        {/* jambs: cream with yellow and red stripes */}
        {[-0.72, 0.72].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box s={[0.5, 1.35, 0.95]} p={[0, 0.675, 0]} m={cream} />
            <Box s={[0.1, 1.3, 0.04]} p={[-0.14, 0.65, 0.49]} m={yellow} cast={false} />
            <Box s={[0.1, 1.3, 0.04]} p={[0.0, 0.65, 0.49]} m={redp} cast={false} />
            <Box s={[0.1, 1.3, 0.04]} p={[0.14, 0.65, 0.49]} m={yellow} cast={false} />
            <Box s={[0.34, 0.14, 0.05]} p={[0, 0.2, 0.5]} m={gold} cast={false} />
          </group>
        ))}
        {/* lintel with the torana tympanum */}
        <Box s={[1.94, 0.35, 0.95]} p={[0, 1.18, 0]} m={cream} />
        <Box s={[1.9, 0.08, 0.06]} p={[0, 1.04, 0.5]} m={gold} cast={false} />
        <Box s={[1.94, 0.05, 0.06]} p={[0, 1.34, 0.5]} m={gold} cast={false} />
        {[-0.45, 0.45].map((x) => <Ball key={`tg${x}`} rad={0.2} p={[x, 1.2, 0.5]} sc={[1, 1.4, 0.1]} m={gold} />)}
        {[-0.28, 0, 0.28].map((x) => <Cyl key={`fl${x}`} rt={0.01} rb={0.05} h={0.2} p={[x * 2.2, 1.45, 0.3]} m={gold} seg={6} />)}
        <Ball rad={0.46} p={[0, 1.2, 0.47]} sc={[1.1, 1, 0.1]} m={gold} />
        <Ball rad={0.36} p={[0, 1.2, 0.5]} sc={[1.1, 1, 0.1]} m={redp} />
        <Ball rad={0.24} p={[0, 1.2, 0.53]} sc={[1.1, 1, 0.1]} m={yellow} />
        <Ball rad={0.11} p={[0, 1.2, 0.56]} sc={[1, 1, 0.12]} m={gold} />
        {[-0.8, 0.8].map((x) => <Ball key={x} rad={0.13} p={[x, 1.2, 0.5]} sc={[1, 1.2, 0.2]} m={gold} />)}
        {/* dark doorway */}
        <Box s={[0.72, 1.05, 0.9]} p={[0, 0.525, 0]} m={dark} />
        <Box s={[0.86, 0.06, 0.1]} p={[0, 1.06, 0.45]} m={gold} cast={false} />
        {/* small red pagoda gate roof */}
        <Box s={[2.2, 0.06, 1.3]} p={[0, 1.39, 0]} m={redp} cast={false} />
        <Roof w={2.5} d={1.55} h={0.5} y={1.42} m={tin} sag={1.35} lift={0.2} fascia={false} />
        <Box s={[2.5, 0.05, 0.05]} p={[0, 1.4, 0.78]} m={gold} cast={false} />
        <Cyl rt={0.06} rb={0.09} h={0.1} p={[0, 1.96, 0]} m={gold} seg={10} />
        <Ball rad={0.07} p={[0, 2.06, 0]} m={gold} />
        <Cyl rt={0.004} rb={0.02} h={0.2} p={[0, 2.2, 0]} m={gold} seg={6} />
      </group>
    );
  }

  /* ---------- small grey stone shikhara shrine (foot of the steps) ---------- */
  function StoneShikhara({ p, s = 1 }) {
    const M = useM();
    const stone = M.plain('#b6aea0', { roughness: 0.95 });
    const gold = M.plain('#d9a82c', { roughness: 0.32, metalness: 0.7 });
    const geo = useMemo(() => {
      const pts = [[0.5, 0], [0.46, 0.12], [0.4, 0.28], [0.34, 0.46], [0.27, 0.62], [0.2, 0.74], [0.13, 0.84], [0.06, 0.9], [0, 0.93]]
        .map(([x, y]) => new THREE.Vector2(x, y));
      return new THREE.LatheGeometry(pts, 4);
    }, []);
    return (
      <group position={p} scale={s}>
        <Box s={[1.3, 0.14, 1.3]} p={[0, 0.07, 0]} m={stone} />
        <Box s={[1.1, 0.12, 1.1]} p={[0, 0.2, 0]} m={stone} />
        <Box s={[0.82, 0.74, 0.82]} p={[0, 0.63, 0]} m={stone} />
        <Box s={[0.34, 0.52, 0.06]} p={[0, 0.5, 0.42]} m={M.plain('#1a1410')} />
        <Box s={[0.94, 0.08, 0.94]} p={[0, 1.04, 0]} m={stone} />
        <mesh geometry={geo} material={stone} position={[0, 1.08, 0]} rotation={[0, PI / 4, 0]} scale={[1, 1.15, 1]} castShadow />
        <Cyl rt={0.07} rb={0.07} h={0.06} p={[0, 2.18, 0]} m={stone} seg={10} />
        <Ball rad={0.06} p={[0, 2.25, 0]} m={gold} />
        <Cyl rt={0.004} rb={0.02} h={0.18} p={[0, 2.35, 0]} m={gold} seg={6} />
      </group>
    );
  }

  /* ---------- octagonal votive shrine: stepped octagonal plinth, 4 cream arched niches, ribbed bell roof, gold pinnacle ---------- */
  function Votive({ p, s = 1, tall = false }) {
    const M = useM();
    const stone = M.plain('#8f877a', { roughness: 0.95 });
    const rib = M.plain('#a49c8e', { roughness: 0.95 });
    const light = M.plain('#e8dfc9', { roughness: 0.9 });
    const gold = M.plain('#e0a828', { roughness: 0.3, metalness: 0.75, emissive: '#ff8a1c', emissiveIntensity: 0.25 });
    const dk = M.plain('#1a1410');
    const rings = [[0.62, 0.74, 0.15], [0.5, 0.62, 0.14], [0.4, 0.5, 0.13], [0.3, 0.4, 0.13], [0.2, 0.3, 0.13], [0.12, 0.2, 0.12]];
    let y = 0.97;
    const placed = rings.map(([rt, rb, h]) => { const yy = y + h / 2 - 0.1; y += h; return { rt, rb, h, yy }; });
    const ribs = useMemo(() => {
      const a = [];
      placed.forEach((r) => { const rad = (r.rt + r.rb) / 2 + 0.005; for (let k = 0; k < 8; k += 1) { const an = (k * PI) / 4; a.push([Math.sin(an) * rad, r.yy, Math.cos(an) * rad, 0.05, r.h * 0.95, 0.05, an]); } });
      return a;
    }, []); // eslint-disable-line
    return (
      <group position={p} scale={s}>
        <Cyl rt={1.0} rb={1.08} h={0.14} p={[0, 0.07, 0]} m={stone} seg={8} />
        <Cyl rt={0.82} rb={0.9} h={0.14} p={[0, 0.21, 0]} m={stone} seg={8} />
        <Cyl rt={0.56} rb={0.58} h={0.5} p={[0, 0.53, 0]} r={[0, PI / 8, 0]} m={light} seg={8} />
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * PI) / 2, 0]}>
            <mesh geometry={archGeo} material={light} position={[0, 0.5, 0.5]} scale={[0.34, 0.4, 0.14]} castShadow />
            <mesh geometry={archGeo} material={dk} position={[0, 0.49, 0.56]} scale={[0.22, 0.3, 0.08]} />
            <Box s={[0.4, 0.05, 0.1]} p={[0, 0.74, 0.53]} m={stone} />
          </group>
        ))}
        <Cyl rt={0.64} rb={0.62} h={0.06} p={[0, 0.81, 0]} m={stone} seg={8} />
        {placed.map((r, i) => <Cyl key={i} rt={r.rt} rb={r.rb} h={r.h} p={[0, r.yy, 0]} m={stone} seg={8} />)}
        <Inst items={ribs} m={rib} />
        <Cyl rt={0.05} rb={0.07} h={0.12} p={[0, y + 0.02, 0]} m={stone} seg={8} />
        <Ball rad={0.1} p={[0, y + 0.14, 0]} m={gold} />
        <Cyl rt={0.004} rb={0.03} h={tall ? 0.42 : 0.3} p={[0, y + (tall ? 0.38 : 0.32), 0]} m={gold} seg={6} />
      </group>
    );
  }

  /* ---------- pipal tree: thick branching trunk, 5 overlapping irregular canopy blobs ---------- */
  function Pipal({ p, s = 1, ry = 0 }) {
    const M = useM();
    const ls = [M.plain('#4a7430', { roughness: 1 }), M.plain('#5f8c3a', { roughness: 1 }), M.plain('#3d6a2c', { roughness: 1 }), M.plain('#6f9a40', { roughness: 1 }), M.plain('#37622a', { roughness: 1 })];
    const bark = M.plain('#5b4636', { roughness: 1 });
    const blobs = [[0, 7.6, 0, 3.0, 0], [3.1, 7.0, 0.8, 2.5, 1], [-3.2, 7.2, -0.6, 2.6, 2], [0.7, 8.6, -2.4, 2.3, 3], [-0.6, 7.0, 2.8, 2.4, 4]];
    return (
      <group position={p} scale={s} rotation={[0, ry, 0]}>
        <Cyl rt={0.55} rb={1.05} h={4.2} p={[0, 2.1, 0]} m={bark} seg={9} />
        <Cyl rt={0.3} rb={0.5} h={2.8} p={[1.1, 5.0, 0.2]} r={[0, 0, -0.7]} m={bark} seg={7} />
        <Cyl rt={0.3} rb={0.5} h={2.8} p={[-1.1, 5.0, -0.2]} r={[0, 0, 0.7]} m={bark} seg={7} />
        <Cyl rt={0.25} rb={0.4} h={2.4} p={[0.1, 5.0, 1.1]} r={[0.7, 0, 0]} m={bark} seg={7} />
        <Cyl rt={0.25} rb={0.4} h={2.4} p={[0.1, 5.1, -1.1]} r={[-0.7, 0, 0]} m={bark} seg={7} />
        {blobs.map(([x, y, z, r, c], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1.2, 0.8, 1.1]} m={ls[c]} />)}
      </group>
    );
  }

  /* ---------- arched-window white block (3 storeys, pale pink roof) ---------- */
  function WhiteBlock({ p, ry = 0, L = 3.4, D = 2.2, storeys = 3 }) {
    const M = useM();
    const H = storeys * 0.8;
    const white = M.plain('#f1ece2', { roughness: 0.85 });
    const redf = M.plain('#a8302b', { roughness: 0.7 });
    const pane = M.plain('#2a1c16', { roughness: 0.6 });
    const pink = M.plain('#d9a79a', { roughness: 0.6, metalness: 0.1 });
    const { fr, pn } = useMemo(() => {
      const fr = []; const pn = [];
      for (let r = 0; r < storeys; r += 1) {
        for (let k = 0; k < 4; k += 1) {
          const x = -L / 2 + ((k + 0.5) * L) / 4;
          fr.push([x, 0.42 + r * 0.8, D / 2 + 0.01, 0.4, 0.56, 0.06, 0]);
          pn.push([x, 0.42 + r * 0.8, D / 2 + 0.03, 0.28, 0.44, 0.04, 0]);
        }
      }
      return { fr, pn };
    }, [L, D, storeys]);
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[L, H, D]} p={[0, H / 2, 0]} m={white} />
        <Inst items={fr} m={redf} geo={archGeo} />
        <Inst items={pn} m={pane} geo={archGeo} />
        <Box s={[L + 0.1, 0.06, D + 0.1]} p={[0, H, 0]} m={white} cast={false} />
        <HipRoof w={L + 0.5} d={D + 0.5} h={0.55} y={H + 0.03} m={pink} />
      </group>
    );
  }

  /* ---------- brick house (Newar) for the far bank ---------- */
  function BrickHouse({ p, ry = 0, L = 3, D = 2.2, storeys = 2 }) {
    const M = useM();
    const H = storeys * 0.8;
    const brick = M.mat('brick', 2, 1, { color: '#f7a27a' });
    const tin = M.plain(TIN, { roughness: 0.6, metalness: 0.05 });
    const frames = useMemo(() => {
      const a = [];
      for (let r = 0; r < storeys; r += 1) for (let k = 0; k < 3; k += 1) a.push([-L / 2 + ((k + 0.5) * L) / 3, 0.45 + r * 0.8, D / 2 + 0.02, 0.34, 0.4, 0.05, 0]);
      return a;
    }, [L, D, storeys]);
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[L, H, D]} p={[0, H / 2, 0]} m={brick} />
        <Inst items={frames} m={M.dark} />
        <HipRoof w={L + 0.5} d={D + 0.6} h={0.55} y={H} m={tin} />
      </group>
    );
  }

  /* ---------- footbridge with prayer flags ---------- */
  function Footbridge({ x, z0, z1 }) {
    const M = useM();
    const len = z1 - z0; const zc = (z0 + z1) / 2;
    const steel = M.plain('#8e8a86', { roughness: 0.6, metalness: 0.4 });
    const posts = useMemo(() => {
      const a = []; const n = Math.round(len / 0.5);
      for (let i = 0; i <= n; i += 1) { const z = z0 + (i * len) / n; a.push([x - 0.4, 0.35, z, 0.04, 0.5, 0.04, 0], [x + 0.4, 0.35, z, 0.04, 0.5, 0.04, 0]); }
      return a;
    }, [x, z0, len]);
    return (
      <group>
        <Box s={[0.9, 0.08, len]} p={[x, 0.1, zc]} m={M.plain('#6f6558', { roughness: 0.9 })} />
        {[-0.4, 0.4].map((dx) => <Box key={dx} s={[0.05, 0.05, len]} p={[x + dx, 0.62, zc]} m={steel} cast={false} />)}
        {[-0.4, 0.4].map((dx) => <Box key={`b${dx}`} s={[0.04, 0.04, len]} p={[x + dx, 0.38, zc]} m={steel} cast={false} />)}
        <Inst items={posts} m={steel} />
        {/* abutments */}
        <Box s={[1.4, 0.4, 0.8]} p={[x, -0.1, z0 + 0.2]} m={M.plain('#8f877a', { roughness: 0.95 })} />
        <Box s={[1.4, 0.4, 0.8]} p={[x, -0.1, z1 - 0.2]} m={M.plain('#8f877a', { roughness: 0.95 })} />
        {/* mid pier in the river */}
        <Box s={[0.7, 1.0, 0.6]} p={[x, -0.5, zc]} m={M.plain('#8f877a', { roughness: 0.95 })} />
        {/* tall poles for the flags */}
        {[z0, z1].map((z) => [-0.5, 0.5].map((dx) => <Cyl key={`${z}${dx}`} rt={0.04} rb={0.06} h={3.2} p={[x + dx, 1.6, z]} m={M.plain('#c8c0b0')} seg={6} />))}
      </group>
    );
  }

  /* ================================ MAIN ================================ */
  function Main() {
    const M = useM();
    const stone = M.plain('#8c8478', { roughness: 0.95 });
    const redWall = M.mat('brick', 3, 1, { color: '#e8a888' });
    const redWallP = M.mat('brick', 1, 1, { color: '#e8a888' });
    const plinthM = M.plain('#8a8377', { roughness: 0.95 });
    const gold = M.plain('#d9a82c', { roughness: 0.32, metalness: 0.7 });
    const steps = [];
    for (let k = 0; k < 8; k += 1) steps.push(<Box key={k} s={[5.2 - k * 0.0, 0.5 - 0.0625 * k, 0.22 * (k + 1)]} p={[0, (0.5 - 0.0625 * k) / 2, 4.45 + (0.22 * (k + 1)) / 2]} m={stone} />);
    return (
      <group>
        <Frame s={[10, 4.4, 8]} p={[0, 2.2, 0.8]} />
        {/* raised courtyard terrace with grey stone plinth course */}
        <Box s={[10.6, 0.5, 8.6]} p={[0, 0.25, 0]} m={stone} />
        <Box s={[10.7, 0.18, 8.7]} p={[0, 0.09, 0]} m={plinthM} />
        <Box s={[7.4, 0.03, 5.6]} p={[0, 0.515, 0.6]} m={M.mat('herring', 6, 5, { color: '#d9a58a' })} cast={false} />
        {/* ranges: left and right pulled back so the courtyard stays open; long back range */}
        <Block p={[-4.7, 0, -1.4]} ry={PI / 2} L={4.4} doors={[1, 3]} />
        <Block p={[4.7, 0, -1.4]} ry={-PI / 2} L={4.4} doors={[2]} outerRail />
        <Block p={[0, 0, -3.8]} ry={0} L={10} doors={[2, 7]} />
        {/* tall red plastered front wall on a grey plinth course, with coping */}
        {[-1, 1].map((sg) => (
          <group key={sg}>
            <Box s={[4.4, 0.4, 0.4]} p={[sg * 3.1, 0.2, 4.0]} m={plinthM} />
            <Box s={[4.4, 0.9, 0.3]} p={[sg * 3.1, 0.85, 4.0]} m={redWall} />
            <Box s={[4.5, 0.08, 0.38]} p={[sg * 3.1, 1.34, 4.0]} m={M.plain('#e8dcc4')} cast={false} />
          </group>
        ))}
        <Box s={[0.4, 1.2, 0.3]} p={[-5.15, 0.6, 4.0]} m={redWallP} />
        <Box s={[0.4, 1.2, 0.3]} p={[5.15, 0.6, 4.0]} m={redWallP} />
        {/* the gate on the terrace edge, with steps up to it */}
        <group position={[0, 0.5, 3.98]} scale={[1.25, 1.3, 1.1]}><Gate p={[0, 0, 0]} /></group>
        {steps}
        <Box s={[5.4, 0.04, 0.12]} p={[0, 0.5, 6.25]} m={plinthM} cast={false} />
        {/* side cheek walls beside the steps */}
        {[-2.7, 2.7].map((x) => <Box key={x} s={[0.2, 0.34, 1.76]} p={[x, 0.17, 5.33]} m={plinthM} />)}
        {/* the shrine */}
        <group position={[0, 0.5, -0.6]} scale={1.3}><Shrine p={[0, 0, 0]} /></group>
        {/* three tall pillars in a loose row in front of it, the front one tallest */}
        <Pillar p={[-2.6, 0.5, 2.9]} h={2.6} k={0} />
        <Pillar p={[0.2, 0.5, 2.6]} h={2.4} k={1} />
        <Pillar p={[2.8, 0.5, 3.0]} h={2.9} k={2} />
        {/* small stone shikhara shrine at the foot of the steps (left) */}
        <StoneShikhara p={[-3.9, 0, 6.6]} s={0.95} />
        {/* dusk glows: gate, pillar bases, steps */}
        <pointLight position={[0, 1.6, 5.2]} intensity={6} distance={8} color="#ffb04a" />
        <pointLight position={[0, 1.2, 3.2]} intensity={5} distance={8} color="#ff9a3a" />
        <pointLight position={[-4, 1.0, 6.6]} intensity={2.5} distance={6} color="#ffb04a" />
        {[[-2.6, 2.9], [0.2, 2.6], [2.8, 3.0]].map(([x, z], i) => <Diyo key={'pd' + i} p={[x + 0.5, 0.5, z + 0.5]} light />)}
        {/* diyas on the steps */}
        <Diyo p={[-0.5, 0.5, 4.75]} light />
        <Diyo p={[0.5, 0.5, 4.75]} />
        <Diyo p={[0, 0.5, 4.75]} />
        <Diyo p={[1.2, 0.5, 4.75]} />
        <Diyo p={[1.8, 0.0, 6.4]} light />
                <Cyl rt={0.04} rb={0.06} h={3.4} p={[-4.2, 1.7, 7.2]} m={M.plain('#c8c0b0')} seg={6} />
      </group>
    );
  }

  /* ================================ ENV ================================ */
  const hillY = (x, z) => {
    const t = 1 - (x / 95) ** 2 - ((z - 94) / 38) ** 2;
    return t > 0 ? -6 + 20 * Math.sqrt(t) : -9;
  };

  function Env() {
    const M = useM();
    const grass = M.plain('#7d8c58', { roughness: 1 });
    const grassFar = M.plain('#76895a', { roughness: 1 });
    const paving = M.mat('herring', 5, 2, { color: '#d2a088' });
    const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b6a3a', roughness: 0.3, metalness: 0.15 }), []);
    const bed = M.plain('#7b7650', { roughness: 1 });
    const bankStone = M.plain('#958d7f', { roughness: 0.95 });
    const hillG = M.plain('#6f8f4a', { roughness: 1 });
    const hillG2 = M.plain('#7e9c55', { roughness: 1 });
    const ridge = M.plain('#7f97bd', { roughness: 1 });
    const ridge2 = M.plain('#a3b5d2', { roughness: 1 });

    // north-bank hillside houses (modern brick / concrete, flat roofs)
    const houses = useMemo(() => Array.from({ length: 30 }, (_, i) => {
      const x = -46 + ((i * 31) % 93);
      const z = 60 + ((i * 13) % 17) + Math.floor(i / 10) * 2;
      return { x, z, y: Math.max(0, hillY(x, z)), w: 1.6 + (i % 3) * 0.5, h: 1.2 + (i % 4) * 0.5, c: ['#d9c3a5', '#c99a7a', '#e6e0d2', '#b8664d', '#d0b090', '#ece6d8'][i % 6] };
    }), []);
    const trees = useMemo(() => Array.from({ length: 26 }, (_, i) => {
      const a = (i * 2.399) % 6.283;
      const r = 20 + ((i * 7) % 22);
      const x = Math.cos(a) * r * 1.5; const z = -Math.abs(Math.sin(a)) * r - 6;
      return { x, z, s: 0.9 + (i % 4) * 0.25, c: i % 3 };
    }), []);
    const leaves = [M.plain('#4f7a32', { roughness: 1 }), M.plain('#5d8a3a', { roughness: 1 }), M.plain('#3f6a34', { roughness: 1 })];

    // river bank steps
    const nearSteps = Array.from({ length: 5 }, (_, k) => (
      <Box key={`n${k}`} s={[11, 1.6, 0.5 * (k + 1)]} p={[-2, -0.1 * (k + 1) - 0.8, 9.2 + (0.5 * (k + 1)) / 2]} m={bankStone} />
    ));
    const farSteps = Array.from({ length: 5 }, (_, k) => (
      <Box key={`f${k}`} s={[11, 1.6, 0.5 * (k + 1)]} p={[-2, -0.1 * (k + 1) - 0.8, 22.9 - (0.5 * (k + 1)) / 2]} m={bankStone} />
    ));

    return (
      <group>
        <hemisphereLight args={['#ffe2b8', '#b8a27a', 0.5]} />
        <group position={[0, 0, -2.2]}>
        {/* ground: near bank (south), river channel, far bank (north) */}
        <Box s={[220, 3, 70]} p={[0, -1.5, -26.8]} m={grass} cast={false} />
        <Box s={[220, 3, 9]} p={[0, -1.5, 4.7]} m={grass} cast={false} />
        <Box s={[220, 3, 80]} p={[0, -1.5, 66]} m={grassFar} cast={false} />
        <Box s={[220, 0.6, 14]} p={[0, -1.4, 16.1]} m={bed} cast={false} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.25, 16.05]} material={water} receiveShadow><planeGeometry args={[220, 13.7]} /></mesh>
        <Box s={[220, 1.6, 0.6]} p={[0, -0.7, 9.0]} m={bankStone} cast={false} />
        {nearSteps}
        {farSteps}
        <Box s={[220, 2.4, 1.4]} p={[0, -0.5, 23.7]} m={bankStone} cast={false} />
        <Box s={[220, 0.5, 4]} p={[0, -0.26, 25.6]} m={grassFar} cast={false} />
        {/* Gauri Ghat: a small red shrine and a rock with offerings on the near bank */}
        {[0, 1, 2].map((k) => <Box key={`g${k}`} s={[3.6 - k * 0.3, 0.5, 1.0]} p={[-5.0, -0.2 - k * 0.2, 11.9 + k * 1.0]} m={bankStone} />)}
        <group position={[-4.2, -0.1, 10.3]} scale={1.5}>
          <Box s={[0.6, 0.9, 0.5]} p={[0, 0.45, 0]} m={M.plain('#9a4030')} />
          <Box s={[0.34, 0.5, 0.06]} p={[0, 0.42, 0.26]} m={M.plain('#1c1008')} />
          <Box s={[0.7, 0.1, 0.6]} p={[0, 0.95, 0]} m={M.plain('#6e2a22')} />
          <Ball rad={0.14} p={[0, 1.1, 0]} sc={[1, 1.1, 1]} m={M.plain('#9a4030')} />
        </group>
        <Ball rad={1.1} p={[1.0, -0.4, 11.4]} sc={[1.5, 0.55, 1.1]} m={M.plain('#9d968a', { roughness: 1 })} />
        <Diyo p={[1.6, 0.06, 11.6]} />
        {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.2, 0.08, 0.2]} p={[0.4 + (i % 3) * 0.3, 0.06, 11.2 + Math.floor(i / 3) * 0.3]} m={M.plain(i % 2 ? '#f08a1c' : '#d83a2e')} cast={false} />)}
        {/* footbridge beside the gate */}
        <Footbridge x={3.9} z0={8.6} z1={23.5} />
        </group>
        {/* paved riverside square */}
        <Box s={[9, 0.1, 2.6]} p={[-0.5, -0.03, 6.4]} m={paving} cast={false} />
        {/* shallow stone edging along the olive-brown water, and a wider embankment */}
        <Box s={[24, 0.35, 0.5]} p={[-1, -0.12, 7.6]} m={bankStone} cast={false} />
        <Box s={[24, 0.35, 0.5]} p={[-1, -0.12, 21.4]} m={bankStone} cast={false} />
        {/* pipal trees: left of the gate, behind the compound, right rear (clear of the default camera) */}
        <Pipal p={[-18, 0, -3]} s={1.0} ry={0.5} />
        <Pipal p={[-13, 0, -12]} s={1.1} ry={1.5} />
        <Pipal p={[22, 0, -17]} s={1.1} ry={2.5} />
        <Pipal p={[2, 0, -13]} s={1.25} ry={0.9} />
        <Pipal p={[-24, 0, 12]} s={1.1} ry={2} />
        {/* white block with arched windows beside the compound (left) */}
        <WhiteBlock p={[-9.0, 0, 1.6]} ry={0} L={3.4} D={2.3} storeys={3} />
        {/* votive stone shrines cluster (right) */}
        <Votive p={[10.8, 0, 0.8]} s={2.4} tall />
        <Votive p={[14.6, 0, 3.8]} s={2.1} tall />
        <Votive p={[9.6, 0, 4.8]} s={1.1} />
        <Votive p={[14.6, 0, -2.6]} s={1.2} />
        <Box s={[0.6, 0.5, 0.5]} p={[11.4, 0.25, 6]} m={M.plain('#a8a093', { roughness: 0.95 })} />
        {/* far bank (north): brick house, white block, hillside houses, trees */}
        <BrickHouse p={[-9, 0, 28.5]} ry={PI} L={3.2} D={2.4} />
        <BrickHouse p={[11, 0, 29.5]} ry={PI} L={2.8} D={2.2} />
        <WhiteBlock p={[-13, 0, 29]} ry={PI} L={3.0} D={2.2} storeys={3} />
        <Pipal p={[-16, 0, 34]} s={1.4} />
        <Pipal p={[17, 0, 33]} s={1.3} />
        {houses.map((h, i) => (
          <Box key={`h${i}`} s={[h.w, h.h, 1.5]} p={[h.x, h.y + h.h / 2, h.z]} m={M.plain(h.c, { roughness: 0.9 })} />
        ))}
        {/* hills: north-bank hillside, wooded southern hills behind the temple, blue ridge */}
        <Ball rad={1} p={[0, -6, 94]} sc={[95, 20, 38]} m={hillG2} />
        <Ball rad={1} p={[-30, -6, -40]} sc={[55, 19, 26]} m={hillG} />
        <Ball rad={1} p={[40, -6, -42]} sc={[50, 20, 28]} m={hillG2} />
        <Ball rad={1} p={[0, -8, -62]} sc={[100, 34, 26]} m={ridge} />
        <Ball rad={1} p={[-20, -10, -95]} sc={[120, 52, 24]} m={ridge2} />
        <Ball rad={1} p={[0, -8, 135]} sc={[120, 36, 22]} m={ridge2} />
        {trees.map((t, i) => <Pipal key={`t${i}`} p={[t.x, 0, t.z]} s={t.s} />).slice(0, 0)}
        {trees.map((t, i) => (
          <group key={`w${i}`} position={[t.x, 0, t.z]} scale={t.s * 1.25}>
            <Cyl rt={0.12} rb={0.2} h={1.8} p={[0, 0.9, 0]} m={M.plain('#5b4636')} seg={6} />
            <Ball rad={1.3} p={[0, 2.5, 0]} sc={[1.1, 0.95, 1.1]} m={leaves[t.c]} />
            <Ball rad={1.0} p={[0.9, 2.2, 0.3]} sc={[1.1, 0.9, 1.1]} m={leaves[(t.c + 1) % 3]} />
            <Ball rad={0.9} p={[-0.8, 2.9, -0.3]} sc={[1.1, 0.9, 1.1]} m={leaves[(t.c + 2) % 3]} />
          </group>
        ))}
      </group>
    );
  }

  return { 'guhyeshwari-temple': { Main, Env } };
}
