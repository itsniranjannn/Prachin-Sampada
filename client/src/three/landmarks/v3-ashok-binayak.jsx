// Ashok Binayak (Maru Ganesh): a tiny all-gold single-roof Ganesh shrine with NO pinnacle, caged by gold bars in a cramped brick-paved
// lane beside the huge dark-timber Kasthamandap, a rack of brass bells, a brass mouse across the lane, Newar brick houses behind.
// Model unit: 1 u = about 1.25 m (shrine ~3 m square body+roof, ~3.8 m tall).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, GroundDisc, THREE, useMemo, useRef, useEffect } = K;
  const PI = Math.PI;

  /* ---------------- materials ---------------- */
  const goldA = (M) => M.plain('#dcb232', { metalness: 0.4, roughness: 0.38 });
  const goldB = (M) => M.plain('#a47c18', { metalness: 0.4, roughness: 0.45 });
  const goldC = (M) => M.plain('#f0cc55', { metalness: 0.4, roughness: 0.35 });
  const brass = (M) => M.plain('#c49d2e', { metalness: 0.5, roughness: 0.4 });
  const silver = (M) => M.plain('#c3c6ca', { metalness: 0.5, roughness: 0.35 });
  const woodD = (M) => M.plain('#3b2416', { roughness: 0.85 });
  const redCloth = (M) => M.plain('#b3151b', { roughness: 0.9 });
  const vermil = (M) => M.plain('#c8341e', { roughness: 0.7 });
  const marigold = (M) => M.plain('#f08a1c', { roughness: 0.8 });
  const greyStone = (M) => M.mat('stone', 2, 2, { color: '#a89d92', roughness: 0.95 });
  const rackStone = (M) => M.plain('#8f8478', { roughness: 0.95 });

  /* ---------------- lattice window texture ---------------- */
  function useLattice() {
    return useMemo(() => {
      const mk = (lit) => {
        const c = document.createElement('canvas'); c.width = 64; c.height = 96;
        const x = c.getContext('2d');
        x.fillStyle = lit ? '#ff9a3a' : '#22150d'; x.fillRect(0, 0, 64, 96);
        x.strokeStyle = '#6e4a2c'; x.lineWidth = 3;
        for (let i = 4; i < 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 96); x.stroke(); }
        for (const y of [30, 64]) { x.beginPath(); x.moveTo(0, y); x.lineTo(64, y); x.stroke(); }
        x.strokeStyle = '#3f2816'; x.lineWidth = 7; x.strokeRect(0, 0, 64, 96);
        const t = new THREE.CanvasTexture(c);
        if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };
      const day = mk(false); const lit = mk(true);
      const dark = new THREE.MeshStandardMaterial({ color: '#3f2816', roughness: 0.85 });
      return {
        day: [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: day, roughness: 0.8 }), dark],
        lit: [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: lit, emissiveMap: lit, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.8 }), dark],
      };
    }, []);
  }
  function Win({ p, r = 0, w = 0.9, h = 1.0, lit = false, wm }) {
    return (
      <mesh position={p} rotation={[0, r, 0]} material={lit ? wm.lit : wm.day}>
        <boxGeometry args={[w, h, 0.12]} />
      </mesh>
    );
  }

  /* ---------------- tubes: garlands, cables ---------------- */
  function Tube({ pts, r = 0.03, m }) {
    const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 20, r, 5), []); // eslint-disable-line
    return <mesh geometry={geo} material={m} />;
  }
  function sagPts(a, b, sag, n = 8) {
    return Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]; });
  }
  function Cable({ a, b, sag = 0.5 }) {
    const M = useM();
    return <Tube pts={sagPts(a, b, sag, 8)} r={0.008} m={M.plain('#4a423a')} />;
  }

  /* ---------------- the gilded single roof: squat, curved, flat-topped, NO finial ---------------- */
  const geoH = {};
  function GoldRoof({ m }) {
    const geo = useMemo(() => {
      const pts = [];
      const N = 9; const H = 0.6; const hw0 = 1.55; const hw1 = 0.8;
      for (let i = 0; i <= N; i += 1) {
        const t = i / N;
        const hw = hw0 + (hw1 - hw0) * t;
        pts.push(new THREE.Vector2(hw * Math.SQRT2, H * t ** 1.3 + (i === 0 ? 0.07 : 0)));
      }
      pts.push(new THREE.Vector2(0.001, H));
      geoH.H = H;
      const g = new THREE.LatheGeometry(pts, 4, PI / 4, PI * 2).toNonIndexed();
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} material={m} castShadow receiveShadow />;
  }

  function RoofRibs({ m }) {
    const geo = useMemo(() => {
      const parts = [];
      const hw0 = 1.55; const hw1 = 0.8; const H = 0.6;
      const prof = (t) => [hw0 + (hw1 - hw0) * t, H * t ** 1.3 + 0.07 * (1 - t)];
      for (let face = 0; face < 4; face += 1) {
        for (let k = 0; k < 7; k += 1) {
          const u = -0.88 + (1.76 * k) / 6; // fraction of half-width
          const pts = [0, 0.5, 1].map((t) => { const [hw, y] = prof(t); return new THREE.Vector3(u * hw, y + 0.03, hw + 0.025); });
          const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.022, 5);
          g.rotateY(face * PI / 2);
          parts.push(g);
        }
      }
      let n = 0; parts.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3); const idx = []; let off = 0;
      parts.forEach((g) => {
        pos.set(g.attributes.position.array, off * 3);
        g.index.array.forEach((i) => idx.push(i + off));
        off += g.attributes.position.count;
      });
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      out.setIndex(idx); out.computeVertexNormals();
      return out;
    }, []);
    return <mesh geometry={geo} material={m} />;
  }

  /* ---------------- the shrine ---------------- */
  function Ganesh() {
    const M = useM();
    const v = vermil(M);
    return (
      <group position={[0, 0, 0.78]}>
        <Box s={[0.7, 0.3, 0.5]} p={[0, 0.45, 0]} m={silver(M)} />
        <Cyl rt={0.27} rb={0.34} h={0.3} p={[0, 0.75, 0]} m={M.plain('#2f6a3c')} seg={14} />
        <Cyl rt={0.28} rb={0.28} h={0.05} p={[0, 0.62, 0]} m={redCloth(M)} seg={14} />
        <Ball rad={0.27} p={[0, 1.0, 0]} sc={[1, 1.25, 0.8]} m={v} />
        <Ball rad={0.18} p={[0, 1.38, 0.02]} sc={[1, 1.05, 0.95]} m={v} />
        <Ball rad={0.11} p={[0.2, 1.38, 0]} sc={[0.3, 1, 0.85]} m={v} />
        <Ball rad={0.11} p={[-0.2, 1.38, 0]} sc={[0.3, 1, 0.85]} m={v} />
        <Cyl rt={0.035} rb={0.06} h={0.34} p={[-0.02, 1.2, 0.2]} r={[-0.15, 0, 0.12]} m={v} seg={8} />
        <Ball rad={0.04} p={[0.12, 1.3, 0.19]} m={M.plain('#f4efe0')} />
        <mesh position={[0, 1.62, 0.02]} material={goldC(M)}><coneGeometry args={[0.11, 0.2, 10]} /></mesh>
        <mesh position={[0, 1.18, 0.02]} rotation={[PI / 2, 0, 0]} material={marigold(M)}><torusGeometry args={[0.25, 0.05, 8, 18]} /></mesh>
        <Tube pts={[[-0.24, 1.15, 0.12], [-0.27, 0.9, 0.2], [-0.2, 0.62, 0.26]]} r={0.04} m={marigold(M)} />
        <Tube pts={[[0.24, 1.15, 0.12], [0.27, 0.9, 0.2], [0.2, 0.62, 0.26]]} r={0.04} m={marigold(M)} />
      </group>
    );
  }
  function Torana() {
    const M = useM();
    const s = silver(M);
    return (
      <group position={[0, 0, 0.5]}>
        <Box s={[1.0, 0.56, 0.05]} p={[0, 0.58, 0]} m={s} />
        <mesh position={[0, 0.86, 0]} rotation={[PI / 2, 0, 0]} material={s}>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 28, 1, false, PI / 2, PI]} />
        </mesh>
        <mesh position={[0, 0.86, 0.04]} material={s}><torusGeometry args={[0.5, 0.045, 8, 24, PI]} /></mesh>
        <mesh position={[0, 1.42, 0.05]} material={s}><coneGeometry args={[0.08, 0.2, 8]} /></mesh>
        {[-0.4, 0.4].map((x) => <Ball key={x} rad={0.07} p={[x, 0.95, 0.06]} sc={[1, 1, 0.5]} m={goldB(M)} />)}
      </group>
    );
  }
  function ShrineBody() {
    const M = useM();
    const a = goldA(M); const b = goldB(M); const c = goldC(M);
    const wood = woodD(M);
    const brick = M.mat('brick', 1, 1, { color: '#c0614a' });
    const face = (rot, key) => (
      <group key={key} rotation={[0, rot, 0]}>
        {[-0.52, 0.52].map((x) => (
          <group key={x}>
            <Box s={[0.78, 1.15, 0.04]} p={[x, 0.85, 1.21]} m={b} cast={false} />
            <Ball rad={0.2} p={[x, 0.9, 1.24]} sc={[1, 1, 0.25]} m={c} />
          </group>
        ))}
      </group>
    );
    return (
      <group>
        <Box s={[2.7, 0.09, 2.7]} p={[0, 0.045, 0]} m={greyStone(M)} />
        {/* hollow front: back core, two jambs, lintel, sill */}
        <Box s={[2.4, 1.7, 1.4]} p={[0, 0.93, -0.5]} m={a} />
        <Box s={[0.65, 1.7, 2.4]} p={[-0.875, 0.93, 0]} m={a} />
        <Box s={[0.65, 1.7, 2.4]} p={[0.875, 0.93, 0]} m={a} />
        <Box s={[1.1, 0.25, 2.4]} p={[0, 1.655, 0]} m={a} />
        <Box s={[1.1, 0.22, 2.4]} p={[0, 0.19, 0]} m={a} />
        {/* inside: brick wall with gilded ashok-leaf relief */}
        <Box s={[1.1, 1.24, 0.03]} p={[0, 0.915, 0.215]} m={brick} cast={false} />
        {[-0.42, 0.42].flatMap((x) => [0.5, 0.78, 1.06, 1.3].map((y) => <Ball key={`${x}${y}`} rad={0.07} p={[x, y, 0.24]} sc={[0.6, 1.5, 0.3]} m={c} />))}
        <Torana />
        <Ganesh />
        <pointLight position={[0, 1.3, 1.0]} intensity={1.2} distance={3.5} color="#ffb060" />
        {/* corner posts */}
        {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.17, 1.72, 0.17]} p={[x, 0.94, z]} m={c} />)}
        {/* repousse door frame */}
        {[-0.63, 0.63].map((x) => (
          <group key={x}>
            <Box s={[0.15, 1.28, 0.09]} p={[x, 0.93, 1.23]} m={c} />
            {[0.55, 0.9, 1.25].map((y) => <Ball key={y} rad={0.07} p={[x, y, 1.29]} sc={[1, 1.3, 0.35]} m={b} />)}
          </group>
        ))}
        <Box s={[1.45, 0.08, 0.1]} p={[0, 1.54, 1.23]} m={c} />
        <Box s={[1.7, 0.09, 0.12]} p={[0, 1.62, 1.23]} m={a} />
        {Array.from({ length: 8 }, (_, k) => <Box key={k} s={[0.09, 0.05, 0.03]} p={[-0.6 + k * 0.17, 1.575, 1.3]} m={wood} cast={false} />)}
        <Box s={[2.5, 0.1, 2.5]} p={[0, 1.72, 0]} m={c} />
        {/* panels on the three plain faces */}
        {face(PI / 2, 'r')}{face(PI, 'b')}{face(-PI / 2, 'l')}
        {/* timber under the eave and exposed struts */}
        <Box s={[3.05, 0.07, 3.05]} p={[0, 1.83, 0]} m={wood} />
        {[0, PI / 2, PI, -PI / 2].map((rot) => (
          <group key={rot} rotation={[0, rot, 0]}>
            {[-1.0, -0.5, 0, 0.5, 1.0].map((x) => <Box key={x} s={[0.08, 0.56, 0.08]} p={[x, 1.58, 1.33]} r={[0.46, 0, 0]} m={M.plain('#a37d2c')} cast={false} />)}
          </group>
        ))}
        {/* red-and-gold valance and marigold garlands across the front */}
        <Box s={[2.6, 0.26, 0.03]} p={[0, 1.7, 1.42]} m={redCloth(M)} cast={false} />
        <Box s={[2.6, 0.04, 0.04]} p={[0, 1.56, 1.42]} m={c} cast={false} />
        <Tube pts={sagPts([-1.2, 1.55, 1.46], [-0.4, 1.55, 1.46], 0.28)} r={0.04} m={marigold(M)} />
        <Tube pts={sagPts([-0.4, 1.55, 1.46], [0.4, 1.55, 1.46], 0.3)} r={0.04} m={M.plain('#f6c52a')} />
        <Tube pts={sagPts([0.4, 1.55, 1.46], [1.2, 1.55, 1.46], 0.28)} r={0.04} m={marigold(M)} />
        <Tube pts={[[-0.78, 1.5, 1.35], [-0.84, 1.1, 1.38], [-0.78, 0.65, 1.36]]} r={0.04} m={marigold(M)} />
        <Tube pts={[[0.78, 1.5, 1.35], [0.84, 1.1, 1.38], [0.78, 0.65, 1.36]]} r={0.04} m={marigold(M)} />
        {/* the gilded roof, flat at the top, nothing above it */}
        <group position={[0, 1.88, 0]}>
          <GoldRoof m={a} />
          <Box s={[1.64, 0.05, 1.64]} p={[0, 0.6, 0]} m={c} />
          {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => <Tube key={`${sx}${sz}`} pts={[[sx * 1.58, 0.1, sz * 1.58], [sx * 1.2, 0.2, sz * 1.2], [sx * 0.82, 0.6, sz * 0.82]]} r={0.04} m={c} />)}
          <RoofRibs m={c} />
        </group>
        <Box s={[3.3, 0.07, 3.3]} p={[0, 1.88, 0]} m={goldB(M)} />
        <Box s={[3.15, 0.07, 3.15]} p={[0, 1.96, 0]} m={goldC(M)} />
        {[[0, 1.55], [0, -1.55]].map(([x, z]) => <Box key={z} s={[3.15, 0.14, 0.09]} p={[x, 1.9, z]} m={c} />)}
        {[1.55, -1.55].map((x) => <Box key={x} s={[0.09, 0.14, 3.15]} p={[x, 1.9, 0]} m={c} />)}
      </group>
    );
  }

  /* ---------------- gold bar cage, one side open ---------------- */
  function Cage() {
    const M = useM();
    const m = brass(M); const mb = goldB(M);
    const A = 1.8; const H = 2.0;
    const bars = useMemo(() => {
      const L = [];
      for (let i = 0; i <= 16; i += 1) {
        const t = -A + (2 * A * i) / 16;
        L.push([t, -A]); L.push([-A, t]); L.push([A, t]);
        if (Math.abs(t) > 0.92) L.push([t, A]);
      }
      return L;
    }, []);
    return (
      <group>
        <Box s={[4.1, 0.16, 4.1]} p={[0, 0.0, 0]} m={M.plain('#6f6258', { roughness: 0.95 })} />
        <Box s={[3.85, 0.22, 3.85]} p={[0, 0.0, 0]} m={M.plain('#6f6459', { roughness: 0.95 })} />
        <mesh position={[0, 1.99, 0]}><boxGeometry args={[3.5, 0.02, 3.5]} /><meshStandardMaterial color="#f4f1ea" transparent opacity={0.6} roughness={0.9} /></mesh>
        {bars.map(([x, z], i) => <Box key={i} s={[0.07, H, 0.07]} p={[x, H / 2 + 0.05, z]} m={m} cast={false} />)}
        {[0.06, 1.0, H + 0.04].map((y) => (
          <group key={y}>
            <Box s={[2 * A, 0.06, 0.06]} p={[0, y, -A]} m={mb} cast={false} />
            <Box s={[0.06, 0.06, 2 * A]} p={[-A, y, 0]} m={mb} cast={false} />
            <Box s={[0.06, 0.06, 2 * A]} p={[A, y, 0]} m={mb} cast={false} />
            <Box s={[A - 0.92, 0.06, 0.06]} p={[-(A + 0.92) / 2, y, A]} m={mb} cast={false} />
            <Box s={[A - 0.92, 0.06, 0.06]} p={[(A + 0.92) / 2, y, A]} m={mb} cast={false} />
          </group>
        ))}
        {[-0.92, 0.92].map((x) => <Box key={x} s={[0.1, H + 0.12, 0.1]} p={[x, (H + 0.12) / 2 + 0.02, A]} m={mb} />)}
        {[[-A, -A], [A, -A], [-A, A], [A, A]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.1, H + 0.1, 0.1]} p={[x, (H + 0.1) / 2 + 0.02, z]} m={mb} />)}
      </group>
    );
  }

  /* ---------------- bell rack, big bell, corner post ---------------- */
  const bellProfile = [[0.001, 0.15], [0.03, 0.14], [0.045, 0.1], [0.06, 0.05], [0.09, 0.0], [0.07, 0.0], [0.05, 0.02], [0.001, 0.02]];
  function Bells({ list, m, scale = 1 }) {
    const ref = useRef();
    const geo = useMemo(() => new THREE.LatheGeometry(bellProfile.map(([x, y]) => new THREE.Vector2(x * scale, y * scale)), 10), [scale]);
    useEffect(() => {
      const im = ref.current; if (!im) return;
      const o = new THREE.Object3D();
      list.forEach((q, i) => { o.position.set(q[0], q[1], q[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.instanceMatrix.needsUpdate = true;
    }, [list]);
    return <instancedMesh ref={ref} args={[geo, m, list.length]} castShadow />;
  }
  function BellRack({ p }) {
    const M = useM();
    const list = useMemo(() => {
      const L = [];
      for (let row = 0; row < 5; row += 1) for (let i = 0; i < 9; i += 1) L.push([-0.62 + i * 0.155, 1.42 - row * 0.2, 0.08]);
      return L;
    }, []);
    const wood = M.plain('#5a3a22', { roughness: 0.85 });
    const bigGeo = useMemo(() => new THREE.LatheGeometry([[0.001, 0.55], [0.05, 0.54], [0.12, 0.5], [0.2, 0.3], [0.27, 0.1], [0.32, 0.0], [0.28, 0.0], [0.22, 0.06], [0.001, 0.08]].map(([x, y]) => new THREE.Vector2(x, y)), 14), []);
    return (
      <group position={p}>
        <Box s={[1.75, 0.4, 0.8]} p={[0, 0.2, 0]} m={rackStone(M)} />
        <Box s={[0.08, 1.35, 0.08]} p={[-0.78, 1.07, 0.1]} m={wood} />
        <Box s={[0.08, 1.35, 0.08]} p={[0.78, 1.07, 0.1]} m={wood} />
        <Box s={[1.6, 1.25, 0.05]} p={[0, 1.02, -0.03]} m={M.plain('#5a3a24')} cast={false} />
        {[1.5, 1.3, 1.1, 0.9, 0.7].map((y) => <Box key={y} s={[1.6, 0.04, 0.05]} p={[0, y, 0.08]} m={wood} cast={false} />)}
        <Bells list={list} m={brass(M)} />
        <Box s={[1.85, 0.32, 0.06]} p={[0, 1.72, 0.18]} m={redCloth(M)} cast={false} />
        <Box s={[1.85, 0.04, 0.07]} p={[0, 1.54, 0.18]} m={goldC(M)} cast={false} />
        <Box s={[1.75, 0.06, 0.5]} p={[0, 1.78, 0]} m={wood} />
        {/* carved stone corner post */}
        <Box s={[0.36, 1.7, 0.36]} p={[-1.07, 0.85, 0.05]} m={rackStone(M)} />
        <Box s={[0.3, 0.5, 0.04]} p={[-1.07, 1.0, 0.25]} m={goldB(M)} />
        <Box s={[0.2, 0.36, 0.05]} p={[-1.07, 0.97, 0.26]} m={M.plain('#2a1a10')} cast={false} />
        <mesh position={[-1.07, 1.15, 0.26]} rotation={[PI / 2, 0, 0]} material={goldC(M)}><cylinderGeometry args={[0.1, 0.1, 0.05, 12, 1, false, PI / 2, PI]} /></mesh>
        <Ball rad={0.07} p={[-1.07, 0.98, 0.29]} sc={[1, 1.2, 0.5]} m={vermil(M)} />
        <Box s={[0.4, 0.06, 0.4]} p={[-1.07, 1.72, 0.05]} m={goldB(M)} />
        {/* big bell on the ground */}
        <mesh geometry={bigGeo} material={M.plain('#9a7a2a', { metalness: 0.6, roughness: 0.4 })} position={[0.25, 0, 0.75]} castShadow />
      </group>
    );
  }

  /* ---------------- mouse (Ganesh's vehicle) on a low pedestal ---------------- */
  function Mouse({ p, r = 0 }) {
    const M = useM();
    const g = M.plain('#c9a227', { metalness: 0.55, roughness: 0.35 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.0, 0.4, 0.62]} p={[0, 0.2, 0]} m={rackStone(M)} />
        <Box s={[1.1, 0.07, 0.72]} p={[0, 0.43, 0]} m={M.mat('stone', 1, 1, { color: '#8d8378' })} />
        <group position={[0, 0.47, 0]}>
          <Ball rad={0.3} p={[0, 0.2, 0]} sc={[1.35, 0.7, 0.7]} m={g} />
          <Ball rad={0.17} p={[0.38, 0.22, 0]} sc={[1.2, 0.85, 0.8]} m={g} />
          <mesh position={[0.6, 0.2, 0]} rotation={[0, 0, -PI / 2]} material={g}><coneGeometry args={[0.1, 0.22, 8]} /></mesh>
          <Ball rad={0.08} p={[0.3, 0.38, 0.1]} sc={[0.5, 1, 1]} m={g} />
          <Ball rad={0.08} p={[0.3, 0.38, -0.1]} sc={[0.5, 1, 1]} m={g} />
          <Tube pts={[[-0.38, 0.14, 0], [-0.6, 0.12, 0.1], [-0.8, 0.1, 0.05], [-0.95, 0.2, -0.05]]} r={0.025} m={g} />
        </group>
      </group>
    );
  }

  function ShrineMain() {
    const M = useM();
    return (
      <group>
        <ShrineBody />
        <Cage />
        <BellRack p={[-3.2, 0, 1.2]} />
        <Mouse p={[3.5, 0, 3.2]} r={2.4} />
        <Frame s={[8.4, 3.6, 5.8]} p={[0.0, 1.8, 0.9]} />
        <mesh visible={false} material={M.gold} />
      </group>
    );
  }

  /* ---------------- surroundings ---------------- */
  function Home({ p, w = 4.4, d = 5, storeys = 3, sh = 1.9, wall = 'brick', roof = 'tile', lit = [], wm, tint = '#f0c2a8', plaster = '#cdb99a', shutters = true, sign = null }) {
    const M = useM();
    const H = storeys * sh;
    const wallM = wall === 'brick' ? M.mat('brick', w / 1.3, H / 1.3, { color: tint }) : M.plain(plaster, { roughness: 0.9 });
    const rm = roof === 'red' ? M.plain('#a3241c', { roughness: 0.7 }) : M.mat('roof', 4, 4, { color: '#a8664f' });
    return (
      <group position={p}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={wallM} />
        {Array.from({ length: storeys }, (_, k) => (
          <Box key={`b${k}`} s={[w + 0.1, 0.1, d + 0.1]} p={[0, (k + 1) * sh - 0.05, 0]} m={woodD(M)} cast={false} />
        ))}
        {Array.from({ length: storeys - 1 }, (_, k) => [-w / 4, w / 4].map((x, i) => (
          <Win key={`w${k}${i}`} p={[x, (k + 1) * sh + sh * 0.5, d / 2 + 0.02]} w={k === 0 ? 1.1 : 0.9} h={k === 0 ? 1.0 : 0.95} lit={lit.includes(`${k}${i}`)} wm={wm} />
        )))}
        {shutters && <Box s={[w * 0.7, sh * 0.7, 0.08]} p={[0, sh * 0.38, d / 2 + 0.03]} m={M.plain('#2e1c11')} cast={false} />}
        {shutters && <Box s={[w * 0.75, 0.12, 0.2]} p={[0, sh * 0.78, d / 2 + 0.1]} m={woodD(M)} cast={false} />}
        {sign && (
          <group>
            <Box s={[w * 0.6, 0.42, 0.06]} p={[0, sh * 0.92, d / 2 + 0.16]} m={M.plain(sign[0], { roughness: 0.7 })} cast={false} />
            <Box s={[w * 0.5, 0.1, 0.07]} p={[0, sh * 0.92, d / 2 + 0.2]} m={M.plain(sign[1], { roughness: 0.7 })} cast={false} />
          </group>
        )}
        {roof === 'flat' ? (
          <group position={[0, H, 0]}>
            <Box s={[w + 0.2, 0.35, d + 0.2]} p={[0, 0.17, 0]} m={M.plain('#b9ad9c', { roughness: 0.95 })} />
            <Cyl rt={0.45} rb={0.45} h={0.8} p={[w / 4, 0.75, 0]} m={M.plain('#2c4a6e', { roughness: 0.6 })} seg={10} />
            <Box s={[w * 0.4, 1.2, d * 0.4]} p={[-w / 4, 0.95, -d / 6]} m={M.plain('#cdb99a', { roughness: 0.9 })} />
          </group>
        ) : roof === 'tin' ? (
          <Roof w={w + 0.5} d={d + 0.5} h={1.1} y={H} m={M.plain('#6f747a', { roughness: 0.6, metalness: 0.3 })} sag={1} lift={0.02} />
        ) : roof === 'red' ? (
          <group position={[0, H, 0]}>
            <Roof w={w + 0.6} d={d + 0.6} h={1.4} y={0} m={rm} sag={1.4} lift={0.15} />
            {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => (
              <mesh key={`${sx}${sz}`} position={[sx * (w + 0.6) / 2, 0.3, sz * (d + 0.6) / 2]} material={goldC(M)}><coneGeometry args={[0.1, 0.34, 6]} /></mesh>
            ))}
            <Box s={[w + 0.65, 0.08, 0.06]} p={[0, -0.02, (d + 0.6) / 2]} m={goldC(M)} cast={false} />
          </group>
        ) : (
          <Roof w={w + 0.7} d={d + 0.7} h={1.5} y={H} m={rm} sag={1.1} lift={0.04} fascia />
        )}
      </group>
    );
  }

  function Kasthamandap() {
    const M = useM();
    const wm = useLattice();
    const wood = M.mat('wood', 3, 2, { color: '#6b4a35' });
    const dk = woodD(M);
    const tile = M.mat('roof', 5, 5, { color: '#7a4f3e' });
    const ring = useMemo(() => {
      const L = []; const n = 6; const hlf = 4.5;
      for (let i = 0; i <= n; i += 1) { const t = -hlf + (2 * hlf * i) / n; L.push([t, hlf], [t, -hlf]); if (i > 0 && i < n) L.push([hlf, t], [-hlf, t]); }
      return L;
    }, []);
    return (
      <group position={[-9.5, 0, 0]}>
        <Box s={[11.4, 0.3, 11.4]} p={[0, 0.15, 0]} m={M.mat('brick', 8, 1, { color: '#7d4c3c' })} />
        <Box s={[10.8, 0.55, 10.8]} p={[0, 0.58, 0]} m={M.mat('brick', 8, 1, { color: '#865646' })} />
        <Box s={[10.2, 0.7, 10.2]} p={[0, 0.35, 0]} m={M.mat('brick', 8, 1, { color: '#865646' })} />
        <Box s={[9.4, 3.2, 9.4]} p={[0, 2.3, 0]} m={M.plain('#1a110b')} />
        {ring.map(([x, z], i) => <Cyl key={i} rt={0.2} rb={0.22} h={3.3} p={[x, 2.35, z]} m={wood} seg={10} />)}
        <Box s={[11.8, 0.3, 11.8]} p={[0, 4.0, 0]} m={dk} />
        <Roof w={14} d={14} h={1.9} y={4.05} m={tile} sag={1.5} lift={0.2} />
        <Box s={[10.4, 3.0, 10.4]} p={[0, 5.7, 0]} m={wood} />
        <Roof w={12} d={12} h={1.9} y={6.95} m={tile} sag={1.5} lift={0.2} />
        <Box s={[7.8, 2.8, 7.8]} p={[0, 8.65, 0]} m={wood} />
        <Roof w={9.6} d={9.6} h={2.3} y={9.8} m={tile} sag={1.5} lift={0.22} />
        <Gajur y={11.95} s={1.4} />
        {[-3.9, -1.95, 0, 1.95, 3.9].flatMap((t, i) => [
          <Win key={`a${i}`} p={[5.22, 5.7, t]} r={PI / 2} w={1.0} h={1.4} lit={i === 2} wm={wm} />,
          <Win key={`b${i}`} p={[t, 5.7, 5.22]} w={1.0} h={1.4} wm={wm} />,
        ])}
        {[-2.6, -0.87, 0.87, 2.6].flatMap((t, i) => [
          <Win key={`c${i}`} p={[3.92, 8.65, t]} r={PI / 2} w={0.9} h={1.3} wm={wm} />,
          <Win key={`d${i}`} p={[t, 8.65, 3.92]} w={0.9} h={1.3} wm={wm} />,
        ])}
      </group>
    );
  }

  function Person({ p, r = 0, c = '#5a6470', k = '#3a3a40' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.2, 0.56, 0.2]} p={[0, 0.28, 0]} m={M.plain(k)} />
        <Box s={[0.32, 0.46, 0.2]} p={[0, 0.8, 0]} m={M.plain(c)} />
        <Ball rad={0.11} p={[0, 1.16, 0]} m={M.plain('#b98462')} />
      </group>
    );
  }
  function Scooter({ p, r = 0 }) {
    const M = useM();
    const tire = M.plain('#1b1b1b');
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.3, 0.18, 0.28]} p={[0, 0.38, 0]} m={M.plain('#d8d8d8')} />
        <Box s={[0.5, 0.3, 0.3]} p={[-0.45, 0.58, 0]} m={M.plain('#c9ccd0')} />
        <Box s={[0.1, 0.55, 0.1]} p={[0.58, 0.62, 0]} r={[0, 0, 0.2]} m={M.plain('#2a2a2a')} />
        <Box s={[0.08, 0.08, 0.5]} p={[0.65, 0.9, 0]} m={M.plain('#2a2a2a')} />
        <Cyl rt={0.2} h={0.12} p={[0.6, 0.2, 0]} r={[PI / 2, 0, 0]} m={tire} seg={12} />
        <Cyl rt={0.2} h={0.12} p={[-0.55, 0.2, 0]} r={[PI / 2, 0, 0]} m={tire} seg={12} />
      </group>
    );
  }
  function Scaffold({ p, w = 4.2, h = 5.5 }) {
    const M = useM();
    const pole = M.plain('#9a9690', { metalness: 0.4, roughness: 0.6 });
    return (
      <group position={p}>
        {[-w / 2, 0, w / 2].map((x) => <Cyl key={x} rt={0.04} h={h} p={[x, h / 2, 0]} m={pole} seg={6} />)}
        {[1.8, 3.6, 5.3].map((y) => (
          <group key={y}>
            <Box s={[w, 0.05, 0.05]} p={[0, y, 0]} m={pole} cast={false} />
            <Box s={[w, 0.05, 0.4]} p={[0, y - 0.1, -0.15]} m={M.plain('#8a6a45')} cast={false} />
          </group>
        ))}
        <Box s={[w - 0.2, 2.6, 0.03]} p={[0, 3.9, 0.02]} m={M.plain('#2f7a63', { roughness: 0.9 })} cast={false} />
        <Box s={[0.05, h, 0.05]} p={[w / 2 - 0.5, h / 2, 0.0]} r={[0, 0, 0.05]} m={pole} cast={false} />
      </group>
    );
  }
  function OilLamp({ p }) {
    const M = useM();
    const b = brass(M);
    return (
      <group position={p}>
        <Cyl rt={0.18} rb={0.22} h={0.12} p={[0, 0.06, 0]} m={b} seg={10} />
        <Cyl rt={0.05} rb={0.07} h={0.8} p={[0, 0.5, 0]} m={b} seg={8} />
        <Cyl rt={0.2} rb={0.1} h={0.1} p={[0, 0.95, 0]} m={b} seg={10} />
        <mesh position={[0, 1.07, 0]}><coneGeometry args={[0.04, 0.12, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
        <pointLight position={[0, 1.2, 0.1]} intensity={1.0} distance={4} color="#ffb35a" />
      </group>
    );
  }

  function ShrineEnv() {
    const M = useM();
    const wm = useLattice();
    const paving = M.mat('stone', 40, 40, { color: '#8d7f72', roughness: 0.97 });
    const lane = M.mat('brick', 30, 30, { color: '#c0a08e', roughness: 0.97 });
    const far = useMemo(() => {
      const L = [];
      const cols = ['#cdb99a', '#e0b9a0', '#d9a88c', '#c9b49a', '#e6cfae'];
      for (let i = 0; i < 16; i += 1) {
        const ang = (100 + i * 14.5) * PI / 180;
        const rad = 36 + (i % 4) * 5;
        L.push({ x: Math.cos(ang) * rad, z: -Math.sin(ang) * rad, rot: Math.atan2(-Math.cos(ang), Math.sin(ang)) + PI / 2 * 0, h: 8 + (i * 5) % 6, w: 6 + (i % 3) * 1.5, c: cols[i % 5] });
      }
      return L;
    }, []);
    return (
      <group>
        <GroundDisc r={90} y={-0.04} m={paving} />
        <GroundDisc r={36} y={-0.01} m={lane} />
        <Kasthamandap />
        {/* north row of Newar houses behind the shrine: red-pagoda-roofed one behind-left, plain plaster one behind-right */}
        <Home p={[-2.3, 0, -4.7]} d={4} w={4.4} storeys={3} roof="red" lit={['00']} wm={wm} sign={['#8a1a1a', '#d9b24a']} />
        <Home p={[2.35, 0, -4.7]} d={4} w={4.8} storeys={4} wall="plaster" roof="flat" lit={['11', '20']} wm={wm} sign={['#1d5fa8', '#f2f2f2']} />
        <Home p={[7.0, 0, -8.0]} w={4.6} storeys={3} lit={['01']} wm={wm} tint="#e8b69c" sign={['#b3151b', '#f6c52a']} />
        <Home p={[11.6, 0, -8.0]} w={4.6} storeys={4} wall="plaster" plaster="#d8c4a6" roof="tin" lit={['21']} wm={wm} sign={['#1f7a4a', '#f2f2f2']} />
        <Home p={[16.2, 0, -8.0]} w={4.6} storeys={3} wm={wm} sign={['#e0701a', '#2a1a10']} />
        <Home p={[-6.6, 0, -4.7]} d={4} w={4.4} storeys={3} wall="plaster" plaster="#c8b090" roof="flat" wm={wm} sign={['#f6c52a', '#b3151b']} />
        <Scaffold p={[2.4, 0, -2.5]} w={4.2} h={5.5} />
        {/* east side of the lane */}
        <group rotation={[0, -PI / 2, 0]}>
          <Home p={[-4.9, 0, -7.6]} w={4.6} d={5} storeys={4} wall="plaster" wm={wm} />
          <Home p={[-9.5, 0, -7.6]} w={4.6} d={5} storeys={3} wm={wm} tint="#e8b69c" lit={['01']} />
          <Home p={[-14.1, 0, -7.6]} w={4.6} d={5} storeys={3} wall="plaster" plaster="#c9b394" wm={wm} />
        </group>
        {/* distant town blocks */}
        {far.map((f, i) => (
          <group key={i} position={[f.x, 0, f.z]} rotation={[0, f.rot, 0]}>
            <Box s={[f.w, f.h, 5]} p={[0, f.h / 2, 0]} m={M.plain(f.c, { roughness: 0.9 })} />
            <Roof w={f.w + 0.6} d={5.6} h={1.8} y={f.h} m={M.mat('roof', 3, 3, { color: '#a8664f' })} sag={1.1} lift={0.04} />
            {[-f.w / 4, f.w / 4].flatMap((x, a) => [f.h * 0.35, f.h * 0.65].map((y, b) => <Win key={`${a}${b}`} p={[x, y, 2.52]} w={0.9} h={1.0} wm={wm} />))}
          </group>
        ))}
        {/* cables overhead */}
        <Cable a={[-6.5, 6.0, -2.8]} b={[4.5, 6.0, -2.8]} sag={0.5} />
        <Cable a={[-4.5, 4.4, 1.0]} b={[2.0, 5.6, -2.8]} sag={0.4} />
        {/* life in the lane */}
        <Person p={[4.2, 0, 1.0]} r={-PI / 2 - 0.3} c="#5a6a80" />
        <Person p={[-2.0, 0, 4.4]} r={PI} c="#7a5550" />
        <Scooter p={[3.7, 0, 5.4]} r={0.5} />
        <OilLamp p={[-1.1, 0, 4.1]} />
        <Person p={[-4.4, 0, 3.4]} r={PI * 0.9} c="#7a6a4a" />
      </group>
    );
  }

  return { 'ashok-binayak': { Main: ShrineMain, Env: ShrineEnv } };
}
