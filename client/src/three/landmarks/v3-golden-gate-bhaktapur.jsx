// Golden Gate (Lun Dhwakha), Bhaktapur Durbar Square: a gilded repousse doorway + arched torana set in the red brick palace wall.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, GroundDisc, Tree, PillarStatue, BellPavilion, THREE } = K;
  const { useMemo } = K;
  const memo = (f, d) => (useMemo ? useMemo(f, d) : f());
  const PI = Math.PI;

  // broad rounded-pointed arch outline, half-width a, rise h
  const archY = (h, u) => h * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 1.8)), 0.5);
  function archPts(a, h, n = 32, y0 = 0) {
    const pts = [];
    for (let i = 0; i <= n; i += 1) {
      const u = -1 + (2 * i) / n;
      pts.push(new THREE.Vector2(a * u, y0 + archY(h, u)));
    }
    return pts;
  }
  function ArchSlab({ a, h, hole, depth = 0.06, p = [0, 0, 0], m, y0 = 0 }) {
    const geo = memo(() => {
      const s = new THREE.Shape(archPts(a, h, 32, y0));
      if (hole) s.holes.push(new THREE.Path(archPts(hole[0], hole[1], 32, y0 + (hole[2] || 0)).reverse()));
      return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    }, [a, h, depth, y0, hole ? hole.join() : '']);
    return <mesh geometry={geo} position={p} material={m} castShadow receiveShadow />;
  }
  function Beads({ n, x0, x1, y, z, r, rows = 2, gap = 0.1, m }) {
    const obj = memo(() => {
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), m, n * rows);
      const d = new THREE.Object3D();
      let k = 0;
      for (let row = 0; row < rows; row += 1) {
        for (let i = 0; i < n; i += 1) {
          d.position.set(x0 + ((x1 - x0) * (i + 0.5 * (row % 2))) / (n - 1), y - row * gap, z);
          d.scale.set(1, 1, 0.8);
          d.updateMatrix();
          im.setMatrixAt(k++, d.matrix);
        }
      }
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = true;
      im.frustumCulled = false;
      return im;
    }, [n, x0, x1, y, z, r, rows, gap, m]);
    return <primitive object={obj} />;
  }
  function Grid({ pts, size, m }) {
    const obj = memo(() => {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(size[0], size[1], size[2]), m, pts.length);
      const d = new THREE.Object3D();
      pts.forEach((q, i) => { d.position.set(q[0], q[1], q[2]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = true;
      im.frustumCulled = false;
      return im;
    }, [pts, m]);
    return <primitive object={obj} />;
  }

  function HipRoof({ w, d, h, y = 0, p = [0, 0, 0], m, ridge }) {
    const geo = memo(() => {
      const hw = w / 2, hd = d / 2, rl = ridge !== undefined ? ridge / 2 : Math.max(0, (w - d) / 2);
      const v = [[-hw, 0, hd], [hw, 0, hd], [hw, 0, -hd], [-hw, 0, -hd], [-rl, h, 0], [rl, h, 0]];
      const tri = [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [3, 0, 4], [1, 2, 5]];
      const pos = [], uv = [];
      tri.forEach((t) => t.forEach((i) => { pos.push(...v[i]); uv.push((v[i][0] + hw) / 2.4, (v[i][2] + hd + v[i][1]) / 2.4); }));
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    }, [w, d, h, ridge]);
    return <mesh geometry={geo} position={[p[0], p[1] + y, p[2]]} material={m} castShadow receiveShadow />;
  }

  /* ---------- gold sculpture bits ---------- */
  // ten-armed, four-headed Taleju with halo: 5 arms fan out per side
  function Taleju({ m, dk }) {
    const arms = [-8, 16, 40, 63, 84];
    return (
      <group>
        <Box s={[0.56, 0.05, 0.06]} p={[0, 0.03, 0]} m={m} />
        <Box s={[0.34, 0.07, 0.07]} p={[0, 0.1, 0]} m={m} />
        <Box s={[0.25, 0.32, 0.07]} p={[0, 0.3, 0]} m={m} />
        <Box s={[0.3, 0.05, 0.06]} p={[0, 0.17, 0.01]} m={dk} cast={false} />
        <mesh material={dk} position={[0, 0.44, -0.02]}><torusGeometry args={[0.36, 0.025, 6, 28]} /></mesh>
        <Ball rad={0.075} p={[0, 0.53, 0.01]} m={m} />
        {[-1, 1].map((k) => <Ball key={k} rad={0.045} p={[k * 0.07, 0.51, -0.01]} m={m} />)}
        <Ball rad={0.045} p={[0, 0.62, 0]} m={m} />
        <mesh position={[0, 0.71, 0]} material={m}><coneGeometry args={[0.055, 0.13, 6]} /></mesh>
        {[-1, 1].map((k) => arms.map((a) => {
          const r = (a * PI) / 180, L = 0.36;
          return (
            <group key={k + '_' + a}>
              <Box s={[L, 0.034, 0.03]} p={[k * (0.13 + (L / 2) * Math.cos(r)), 0.42 + (L / 2) * Math.sin(r), 0.02]} r={[0, 0, k * r]} m={m} />
              <Ball rad={0.03} p={[k * (0.13 + L * Math.cos(r)), 0.42 + L * Math.sin(r), 0.02]} m={m} />
            </group>
          );
        }))}
      </group>
    );
  }
  function Attendant({ m }) {
    return (
      <group>
        <Box s={[0.09, 0.22, 0.05]} p={[0, 0.14, 0]} m={m} />
        <Box s={[0.2, 0.04, 0.05]} p={[0, 0.03, 0]} m={m} />
        <Ball rad={0.048} p={[0, 0.3, 0]} m={m} />
        <mesh position={[0, 0.38, 0]} material={m}><coneGeometry args={[0.038, 0.07, 6]} /></mesh>
        <Box s={[0.16, 0.025, 0.03]} p={[0.05, 0.2, 0.03]} r={[0, 0, 0.4]} m={m} />
        <Box s={[0.16, 0.025, 0.03]} p={[-0.05, 0.2, 0.03]} r={[0, 0, -0.4]} m={m} />
      </group>
    );
  }
  function Garuda3({ m }) {
    return (
      <group>
        <Box s={[0.18, 0.24, 0.08]} p={[0, 0.12, 0]} m={m} />
        <Box s={[0.26, 0.05, 0.07]} p={[0, 0.0, 0]} m={m} />
        <Ball rad={0.085} p={[0, 0.3, 0.02]} m={m} />
        <mesh position={[0, 0.28, 0.1]} rotation={[PI / 2, 0, 0]} material={m}><coneGeometry args={[0.03, 0.09, 6]} /></mesh>
        <mesh position={[0, 0.41, 0.0]} material={m}><coneGeometry args={[0.065, 0.11, 6]} /></mesh>
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.36, 0.09, 0.03]} p={[k * 0.26, 0.26, -0.01]} r={[0, 0, k * 0.5]} m={m} />
            <Box s={[0.32, 0.07, 0.03]} p={[k * 0.23, 0.15, -0.01]} r={[0, 0, k * 0.2]} m={m} />
            <Box s={[0.28, 0.06, 0.03]} p={[k * 0.2, 0.05, -0.01]} r={[0, 0, k * -0.1]} m={m} />
            <Box s={[0.05, 0.2, 0.04]} p={[k * 0.16, 0.12, 0.03]} r={[0, 0, k * -0.7]} m={m} />
            {/* naga-hooded attendant with hood arc */}
            <group position={[k * 0.5, 0.0, 0]}>
              <Box s={[0.1, 0.2, 0.05]} p={[0, 0.1, 0.01]} m={m} />
              <Ball rad={0.05} p={[0, 0.25, 0.02]} m={m} />
              <Ball rad={0.11} sc={[1, 1.1, 0.3]} p={[0, 0.3, -0.03]} m={m} />
              <mesh position={[0, 0.3, -0.01]} material={m}><cylinderGeometry args={[0.125, 0.125, 0.025, 14, 1, false, 0, PI]} /></mesh>
              <Box s={[0.2, 0.03, 0.04]} p={[0, 0.0, 0.01]} m={m} />
            </group>
          </group>
        ))}
        <Box s={[0.9, 0.04, 0.05]} p={[0, -0.03, 0]} m={m} cast={false} />
      </group>
    );
  }
  // winged kinnara bird-figure; k=1 faces +x
  function Kinnara({ m, k }) {
    return (
      <group scale={[k, 1, 1]}>
        <Box s={[0.12, 0.22, 0.08]} p={[0, 0.13, 0]} m={m} />
        <Ball rad={0.05} p={[0.05, 0.3, 0]} m={m} />
        <mesh position={[0.12, 0.29, 0]} rotation={[0, 0, -PI / 2]} material={m}><coneGeometry args={[0.025, 0.08, 5]} /></mesh>
        <Box s={[0.3, 0.07, 0.03]} p={[-0.14, 0.3, -0.02]} r={[0, 0, 0.7]} m={m} />
        <Box s={[0.28, 0.06, 0.03]} p={[-0.2, 0.17, -0.02]} r={[0, 0, 0.3]} m={m} />
        <Box s={[0.26, 0.05, 0.03]} p={[-0.2, 0.06, -0.02]} r={[0, 0, 0.05]} m={m} />
        <Box s={[0.36, 0.05, 0.05]} p={[0.0, 0.0, 0]} m={m} />
      </group>
    );
  }
  function Rosette({ p, s = 1, m, dk }) {
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.075} h={0.05} r={[PI / 2, 0, 0]} m={m} seg={14} />
        <mesh material={dk} position={[0, 0, 0.026]}><torusGeometry args={[0.045, 0.01, 6, 12]} /></mesh>
        <Ball rad={0.028} p={[0, 0, 0.03]} m={m} />
        <mesh material={m} position={[0, 0, 0.028]}><torusGeometry args={[0.062, 0.013, 6, 14]} /></mesh>
      </group>
    );
  }

  /* torana: half-width a, rise h. Solid gilt slab, rim of naga coils + 6 rosettes per side, recessed lens with Taleju,
     Garuda at apex with hooded figures, kinnaras standing on the capitals, small parasol on the right one. */
  function Torana({ m, dk, lt, mid, a = 1.2, h = 1.4 }) {
    const us = [0.9, 0.77, 0.63, 0.49, 0.35, 0.21];
    const sz = [1.7, 1.55, 1.7, 1.55, 1.6, 1.45];
    const off = 0.15;
    const pos = (u, k) => [k * (a - off) * u, archY(h - off, u) + 0.02, 0.17];
    const la = a - 0.34, lh = h - 0.34;
    return (
      <group>
        <ArchSlab a={a + 0.02} h={h + 0.02} depth={0.03} p={[0, -0.01, -0.01]} m={dk} />
        <ArchSlab a={a} h={h} depth={0.1} p={[0, 0, 0.02]} m={m} />
        {/* raised outer ridge and rim inner ridge */}
        <ArchSlab a={a} h={h} hole={[a - 0.05, h - 0.05]} depth={0.17} p={[0, 0, 0.02]} m={lt} />
        <ArchSlab a={a - 0.26} h={h - 0.26} hole={[a - 0.32, h - 0.32]} depth={0.17} p={[0, 0.03, 0.02]} m={lt} />
        {/* recessed lens: dark outline, darker-gold ground, thin inner ridge */}
        <ArchSlab a={la + 0.03} h={lh + 0.03} depth={0.11} p={[0, 0.05, 0.02]} m={dk} />
        <ArchSlab a={la} h={lh} depth={0.12} p={[0, 0.07, 0.02]} m={mid} />
        <ArchSlab a={la - 0.08} h={lh - 0.1} hole={[la - 0.12, lh - 0.14]} depth={0.16} p={[0, 0.1, 0.02]} m={m} />
        <group position={[0, 0.12, 0.15]} scale={1.2}><Taleju m={m} dk={dk} /></group>
        {[-1, 1].map((k) => <group key={k} position={[k * 0.72, 0.17, 0.15]} scale={1.0}><Attendant m={m} /></group>)}
        {[-1, 1].map((k) => us.map((u, i) => (
          <group key={k + '_' + i}>
            <Rosette p={pos(u, k)} s={sz[i]} m={m} dk={dk} />
            {i < us.length - 1 && <mesh material={m} position={pos((u + us[i + 1]) / 2, k)}><torusGeometry args={[0.065, 0.032, 6, 12]} /></mesh>}
          </group>
        )))}
        {/* naga coil running down each outer end */}
        {[-1, 1].map((k) => <mesh key={k} material={m} position={[k * (a - 0.15), 0.2, 0.17]}><torusGeometry args={[0.07, 0.032, 6, 12]} /></mesh>)}
        <group position={[0, h - 0.62, 0.17]} scale={1.45}><Garuda3 m={m} /></group>
        <group position={[-a - 0.02, 0.08, 0.12]} scale={2.2}><Kinnara m={m} k={-1} /></group>
        <group position={[a + 0.02, 0.08, 0.12]} scale={2.2}><Kinnara m={m} k={1} /></group>
        {/* small parasol carried by the right kinnara */}
        <Box s={[0.2, 0.03, 0.03]} p={[a + 0.28, 0.5, 0.12]} r={[0, 0, 0.4]} m={m} />
        <Cyl rt={0.014} h={0.62} p={[a + 0.38, 0.75, 0.12]} m={m} seg={6} />
        <mesh position={[a + 0.38, 1.1, 0.12]} material={m}><coneGeometry args={[0.15, 0.08, 12]} /></mesh>
        <Box s={[2 * a + 0.5, 0.09, 0.24]} p={[0, -0.03, 0.1]} m={m} />
      </group>
    );
  }

  function Plaque({ m, dk, x }) {
    const geo = memo(() => {
      const s = new THREE.Shape();
      s.moveTo(-0.17, 0); s.lineTo(0.17, 0); s.lineTo(0.17, 0.5);
      s.quadraticCurveTo(0.17, 0.66, 0, 0.82); s.quadraticCurveTo(-0.17, 0.66, -0.17, 0.5); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
    }, []);
    return (
      <group position={[x, 0.85, 0.4]} scale={1.1}>
        <mesh geometry={geo} material={m} castShadow />
        {[0, 1, 2, 3, 4, 5].map((i) => <Box key={i} s={[0.22, 0.012, 0.01]} p={[0, 0.12 + i * 0.09, 0.032]} m={dk} cast={false} />)}
        <Box s={[0.02, 0.5, 0.01]} p={[0, 0.38, 0.034]} m={dk} cast={false} />
      </group>
    );
  }

  const WH = 3.55; // wall height (gate apex sits just under the cornice)

  /* weathered plastered brick wall segment: coarse brick texture, plinth, a few darker/lighter patches */
  function WallPiece({ p, w, h = WH, d = 0.8, y0 = 0, patches = 3, seed = 1 }) {
    const M = useM();
    const brick = M.mat('brick', Math.max(1, w / 1.3), Math.max(1, h / 1.3), { color: '#fff0e6', roughness: 0.95 });
    const dkP = M.plain('#93493b', { roughness: 1 });
    const ltP = M.plain('#b06550', { roughness: 1 });
    const plinth = M.mat('stone', Math.max(1, w / 1.2), 1, { color: '#b0a08e' });
    const ps = memo(() => {
      const out = [];
      for (let i = 0; i < patches; i += 1) {
        const r1 = Math.abs(Math.sin(seed * 12.9 + i * 78.2)), r2 = Math.abs(Math.sin(seed * 4.1 + i * 31.7)), r3 = Math.abs(Math.sin(seed * 9.3 + i * 17.3));
        out.push({ x: (r1 - 0.5) * (w - 0.5), y: 0.7 + r2 * (h - 1.6), pw: 0.35 + r3 * 0.6, ph: 0.3 + r1 * 0.5, dark: i % 2 === 0 });
      }
      return out;
    }, [w, h, patches, seed]);
    return (
      <group position={[p[0], p[1], p[2]]}>
        <Box s={[w, h, d]} p={[0, y0 + h / 2, 0]} m={brick} />
        {y0 === 0 && <Box s={[w + 0.02, 0.35, d + 0.08]} p={[0, 0.175, 0.02]} m={plinth} />}
        {patches > 0 && ps.map((q, i) => <Box key={i} s={[q.pw, q.ph, 0.014]} p={[q.x, y0 + q.y, d / 2 + 0.006]} m={q.dark ? dkP : ltP} cast={false} />)}
      </group>
    );
  }

  /* lion with raised arms / elephant with raised trunk, gilt roof-edge finials */
  function Finial({ x, y, lion, gold, z = 0.5 }) {
    return (
      <group position={[x, y, z]} scale={2}>
        <Box s={[lion ? 0.14 : 0.2, 0.04, 0.07]} p={[0, 0.02, 0]} m={gold} />
        {lion ? (
          <>
            <Box s={[0.1, 0.11, 0.06]} p={[0, 0.1, 0]} m={gold} />
            <Box s={[0.03, 0.08, 0.03]} p={[-0.03, 0.06, 0]} m={gold} />
            <Box s={[0.03, 0.08, 0.03]} p={[0.04, 0.06, 0]} m={gold} />
            <Ball rad={0.052} p={[0.0, 0.2, 0]} m={gold} />
            <Ball rad={0.07} sc={[1, 1, 0.4]} p={[0, 0.2, -0.015]} m={gold} />
            <Box s={[0.025, 0.1, 0.025]} p={[-0.075, 0.2, 0]} r={[0, 0, 0.7]} m={gold} />
            <Box s={[0.025, 0.1, 0.025]} p={[0.075, 0.2, 0]} r={[0, 0, -0.7]} m={gold} />
            <mesh position={[-0.07, 0.1, 0]} material={gold}><torusGeometry args={[0.035, 0.01, 5, 10, 4.2]} /></mesh>
          </>
        ) : (
          <>
            <Ball rad={0.075} sc={[1.5, 0.95, 0.85]} p={[0, 0.1, 0]} m={gold} />
            {[-0.07, 0.07].map((lx) => <Box key={lx} s={[0.035, 0.07, 0.035]} p={[lx, 0.055, 0]} m={gold} />)}
            <Ball rad={0.048} p={[0.1, 0.15, 0]} m={gold} />
            <Ball rad={0.04} sc={[0.4, 1, 1]} p={[0.085, 0.15, 0.04]} m={gold} />
            <Box s={[0.022, 0.1, 0.022]} p={[0.155, 0.12, 0]} r={[0, 0, 0.15]} m={gold} />
            <Box s={[0.05, 0.022, 0.022]} p={[0.16, 0.18, 0]} r={[0, 0, 0.6]} m={gold} />
          </>
        )}
      </group>
    );
  }

  /* ---------- Main: the gate in its wall ---------- */
  function GoldenGateMain() {
    const M = useM();
    const gold = M.plain('#e0b73a', { metalness: 0.8, roughness: 0.3, emissive: '#d4a82a', emissiveIntensity: 0.16 });
    const dkGold = M.plain('#8a5f1c', { metalness: 0.6, roughness: 0.4 });
    const ltGold = M.plain('#f0cb55', { metalness: 0.8, roughness: 0.28, emissive: '#c9a227', emissiveIntensity: 0.14 });
    const midGold = M.plain('#6e4a14', { metalness: 0.5, roughness: 0.5 });
    const stone = M.mat('stone', 3, 1, { color: '#b0a08e' });
    const eave = M.plain('#4a2f20', { roughness: 0.85 });
    const black = M.plain('#120a06', { roughness: 1 });
    const leaf = M.plain('#2a1a10', { roughness: 0.9 });
    const WX = 2.6;
    const DW = 0.95, DH = 1.55, Y0 = 0.24;
    const JW = 0.28;
    const topY = Y0 + DH;
    const sideW = WX - DW / 2;
    const TB = topY + 0.34; // torana beam height
    return (
      <group>
        <Frame s={[4.8, 4.1, 3]} p={[0, 2.05, 1.2]} />
        {/* wall around a real recess */}
        <WallPiece p={[-(DW / 2 + sideW / 2), 0, 0]} w={sideW} seed={2} patches={2} />
        <WallPiece p={[DW / 2 + sideW / 2, 0, 0]} w={sideW} seed={5} patches={2} />
        <WallPiece p={[0, 0, 0]} w={DW} h={WH - topY} y0={topY} patches={0} />
        <Box s={[DW, 0.24, 0.8]} p={[0, 0.12, 0]} m={stone} />
        {/* dark passage: floor, linings, black back, deep door leaf with faint split and two knockers */}
        <Box s={[DW, 0.02, 0.8]} p={[0, Y0 - 0.01, 0]} m={black} />
        {[-1, 1].map((k) => <Box key={k} s={[0.03, DH, 0.8]} p={[k * (DW / 2 - 0.015), Y0 + DH / 2, 0]} m={black} />)}
        <Box s={[DW, DH, 0.03]} p={[0, Y0 + DH / 2, -0.38]} m={black} />
        <Box s={[DW - 0.12, DH - 0.1, 0.05]} p={[0, Y0 + DH / 2 - 0.03, -0.12]} m={leaf} />
        <Box s={[0.016, DH - 0.12, 0.02]} p={[0, Y0 + DH / 2 - 0.03, -0.085]} m={black} cast={false} />
        {[-1, 1].map((k) => <Ball key={k} rad={0.03} p={[k * 0.1, Y0 + 0.85, -0.075]} m={gold} />)}
        {/* two steps up to the threshold */}
        <Box s={[DW + 0.9, 0.12, 0.4]} p={[0, 0.06, 0.62]} m={stone} />
        <Box s={[DW + 0.6, 0.12, 0.28]} p={[0, 0.18, 0.5]} m={stone} />
        {/* gilded jambs with foliage ridges and chunky stepped capitals */}
        {[-1, 1].map((k) => {
          const jx = k * (DW / 2 + JW / 2);
          return (
            <group key={k}>
              <Box s={[JW, DH + 0.04, 0.2]} p={[jx, Y0 + (DH + 0.04) / 2, 0.45]} m={gold} />
              {[-0.08, 0.08].map((dx) => <Box key={dx} s={[0.045, DH - 0.12, 0.02]} p={[jx + dx, Y0 + DH / 2, 0.555]} m={dkGold} cast={false} />)}
              {[0.45, 0.8, 1.15, 1.5, 1.85].map((y) => <Box key={y} s={[0.07, 0.07, 0.03]} p={[jx, y, 0.57]} r={[0, 0, PI / 4]} m={ltGold} cast={false} />)}
              <Box s={[0.46, 0.1, 0.28]} p={[jx, topY + 0.1, 0.46]} m={gold} />
              <Box s={[0.6, 0.09, 0.32]} p={[jx + k * 0.03, topY + 0.19, 0.47]} m={ltGold} />
              <Box s={[0.74, 0.1, 0.36]} p={[jx + k * 0.06, topY + 0.28, 0.48]} m={gold} />
            </group>
          );
        })}
        <Box s={[DW + 0.9, 0.13, 0.26]} p={[0, topY + 0.07, 0.47]} m={gold} />
        <Box s={[DW + 1.5, 0.1, 0.32]} p={[0, topY + 0.28, 0.48]} m={ltGold} />
        <Box s={[2.9, 0.1, 0.3]} p={[0, TB - 0.04, 0.5]} m={gold} />
        <group position={[0, TB, 0.5]}><Torana m={gold} dk={dkGold} lt={ltGold} mid={midGold} a={1.2} h={1.4} /></group>
        <Plaque m={gold} dk={dkGold} x={-1.55} />
        <Plaque m={gold} dk={dkGold} x={1.55} />
        {/* bead cornice sitting just under the eave, two rows of fine beads on a dark band */}
        <Box s={[3.2, 0.2, 0.14]} p={[0, WH - 0.12, 0.44]} m={eave} />
        <Beads n={38} x0={-1.55} x1={1.55} y={WH - 0.08} z={0.52} r={0.04} rows={2} gap={0.08} m={gold} />
        {/* dark eave across the wall + tile edge */}
        <Box s={[WX * 2, 0.22, 0.95]} p={[0, WH + 0.11, 0.12]} m={eave} />
        <Box s={[WX * 2, 0.07, 1.0]} p={[0, WH + 0.25, 0.12]} m={M.mat('roof', 8, 1, { color: '#a8705c' })} />
        {/* gilded cap and finials only above the gate */}
        <group position={[0, WH + 0.28, 0.4]}>
          <Roof w={1.4} d={0.9} h={0.45} y={0} m={gold} sag={1.2} lift={0.06} fascia={false} />
          <Gajur y={0.45} s={0.32} />
        </group>
        <Finial x={-1.05} y={WH + 0.28} lion gold={gold} />
        <Finial x={1.05} y={WH + 0.28} lion gold={gold} />
        <Finial x={-1.55} y={WH + 0.28} gold={gold} />
        <Finial x={1.55} y={WH + 0.28} gold={gold} />
        <pointLight position={[0, 3, 3.2]} intensity={0.6} distance={9} color="#ffcf8a" />
      </group>
    );
  }

  /* ---------- Env ---------- */
  function PalaceFacade({ x0, w }) {
    const M = useM();
    const brick = M.plain('#b9695a', { roughness: 0.92 });
    const timber = M.plain('#6a3a22', { roughness: 0.85 });
    const dark = M.plain('#1c0f0a', { roughness: 0.9 });
    const eave = M.plain('#4a2f20', { roughness: 0.85 });
    const lit = M.plain('#ffcf80', { emissive: '#ff9a30', emissiveIntensity: 0.9 });
    const tile = M.mat('roof', 6, 2, { color: '#a8705c' });
    const cols = 22;
    const sp = (w - 1.2) / (cols - 1);
    const ys = [1.55, 3.85, 6.15];
    const row = (y, z) => Array.from({ length: cols }, (_, i) => [x0 + 0.6 + i * sp, y, z]);
    const frames = memo(() => ys.flatMap((y) => row(y, 0.95)), [x0, w]);
    const opens = memo(() => ys.flatMap((y) => row(y, 0.97)), [x0, w]);
    const sills = memo(() => ys.flatMap((y) => row(y - 0.6, 1.02)), [x0, w]);
    const glow = memo(() => [4, 11, 17].map((i) => [x0 + 0.6 + i * sp, 3.85, 1.03]), [x0, w]);
    return (
      <group>
        <Box s={[w, 7.1, 3.0]} p={[x0 + w / 2, 3.55, -0.7]} m={brick} />
        <Box s={[w + 0.3, 0.4, 3.3]} p={[x0 + w / 2, 0.2, -0.7]} m={M.mat('stone', 8, 1, { color: '#b0a08e' })} />
        {ys.map((y) => <Box key={y} s={[w - 0.5, 1.5, 0.12]} p={[x0 + w / 2, y, 0.86]} m={timber} />)}
        <Grid pts={frames} size={[0.64, 1.15, 0.1]} m={timber} />
        <Grid pts={opens} size={[0.45, 0.9, 0.12]} m={dark} />
        <Grid pts={sills} size={[0.74, 0.07, 0.22]} m={timber} />
        <Grid pts={glow} size={[0.3, 0.55, 0.05]} m={lit} />
        {[2.55, 4.85, 7.15].map((y) => <Box key={y} s={[w + 0.5, 0.14, 0.95]} p={[x0 + w / 2, y, 1.1]} m={eave} />)}
        {[3, 10, 18].map((i) => <Box key={i} s={[1.1, 1.9, 0.14]} p={[x0 + 0.6 + i * sp, 1.2, 1.0]} m={eave} />)}
        <group position={[x0 + w / 2, 7.2, 0]}>
          <HipRoof w={w + 1.4} d={3.8} h={1.1} p={[0, 0, -0.5]} m={tile} />
        </group>
      </group>
    );
  }
  function Museum({ p }) {
    const M = useM();
    const white = M.plain('#f3eee2', { roughness: 0.85 });
    const red = M.plain('#8e2f26', { roughness: 0.8 });
    const wpts = memo(() => [-2.9, -1.0, 1.0, 2.9].flatMap((x) => [[x, 1.8, 2.36], [x, 4.3, 2.36]]), []);
    return (
      <group position={p}>
        <Box s={[8.5, 6.0, 4.6]} p={[0, 3.0, 0]} m={white} />
        <Grid pts={wpts} size={[1.0, 1.6, 0.1]} m={red} />
        <Box s={[1.2, 2.4, 0.15]} p={[0, 1.3, 2.4]} m={red} />
        <Box s={[8.8, 0.18, 4.9]} p={[0, 6.0, 0]} m={M.plain('#5a3a2a')} />
        <HipRoof w={9.4} d={5.6} h={2.1} y={6.05} m={M.mat('roof', 4, 2, { color: '#a8705c' })} />
      </group>
    );
  }
  function GoldenGateEnv() {
    const M = useM();
    const ground = M.plain('#7a6c5c', { roughness: 1 });
    const paving = M.plain('#8f806e', { roughness: 1 });
    const joint = M.plain('#74665a', { roughness: 1 });
    const eaveM = M.plain('#4a2f20');
    const tile = M.mat('roof', 6, 3, { color: '#a8705c' });
    const brickBase = M.plain('#b9695a', { roughness: 0.92 });
    const zl = memo(() => Array.from({ length: 14 }, (_, i) => [4, 0.04, 1.2 + i * 1.7]), []);
    const xl = memo(() => Array.from({ length: 26 }, (_, i) => [-18 + i * 1.8, 0.04, 12.4]), []);
    return (
      <group>
        <GroundDisc r={90} m={ground} />
        {/* uniform grey-brown flagged paving with one narrow brick band */}
        <Box s={[44, 0.03, 24]} p={[4, 0.015, 12.4]} m={paving} cast={false} />
        <Grid pts={zl} size={[44, 0.01, 0.03]} m={joint} />
        <Grid pts={xl} size={[0.03, 0.01, 24]} m={joint} />
        <Box s={[44, 0.035, 0.32]} p={[4, 0.03, 5.2]} m={M.mat('brick', 24, 0.4, { color: '#c99a85' })} cast={false} />
        {/* wall: left (5 m) runs into the museum, right (1.8 m) meets the palace gallery */}
        <WallPiece p={[-5.1, 0, 0]} w={5} seed={7} patches={3} />
        <Box s={[5, 0.22, 0.95]} p={[-5.1, WH + 0.11, 0.12]} m={eaveM} />
        <WallPiece p={[3.5, 0, 0]} w={1.8} seed={11} patches={2} />
        <Box s={[1.8, 0.22, 0.95]} p={[3.5, WH + 0.11, 0.12]} m={eaveM} />
        {/* 55-Window Palace carved timber gallery, tight against the gate wall */}
        <group position={[0, 0, -1.2]}><PalaceFacade x0={4.4} w={17} /></group>
        {/* lower palace roofs behind the wall (Taleju chowk side) */}
        <Box s={[14, 3.1, 5]} p={[-6, 1.55, -7]} m={brickBase} />
        <HipRoof w={15.5} d={6.4} h={1.7} p={[-6, 3.1, -7]} m={tile} />
        {/* National Art Museum, whitewashed with red windows, at left */}
        <Museum p={[-11.85, 0, 2.2]} />
        {/* Bhupatindra Malla column with gilded seated king, front-right */}
        <group position={[9, 0, 11]} scale={1.3}><PillarStatue p={[0, 0, 0]} king face={-0.5} /></group>
        {/* Taleju bell housing behind the column */}
        <BellPavilion p={[13, 0, 8.6]} s={1.4} />
        {/* Chyasilin pavilion further south */}
        <Box s={[3.4, 3.2, 3.4]} p={[26, 1.6, 14]} m={M.mat('brick', 3, 2, { color: '#e8a590' })} />
        <group position={[26, 3.2, 14]}><HipRoof w={4.6} d={4.6} h={1.6} m={tile} /></group>
        <Tree p={[-30, 0, 18]} s={3.2} />
        <Tree p={[32, 0, -14]} s={3} />
        <Tree p={[-14, 0, 30]} s={3.4} />
        <mesh position={[0, -1, -80]} material={M.plain('#8fa595', { roughness: 1 })}><coneGeometry args={[60, 14, 5]} /></mesh>
        <mesh position={[-60, -1, -70]} material={M.plain('#8fa595', { roughness: 1 })}><coneGeometry args={[40, 10, 5]} /></mesh>
      </group>
    );
  }

  return { 'golden-gate-bhaktapur': { Main: GoldenGateMain, Env: GoldenGateEnv } };
}
