// Namo Buddha Stupa (Namura), Kavrepalanchok. Slim whitewashed stupa on a low railed platform on a forested ridge,
// small white chaityas beside it, flags radiating from the gilded spire, golden monastery far up the hill behind.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, THREE, useMemo, useRef, useEffect, Frame, eyesTexture, Diyo } = K;

  /* ---------- shared helpers ---------- */
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const MX = -2.5; // main stupa x on the platform
  const PT = 1.1; // platform top height
  const hz = (hex, z) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#a9b8b8'), Math.min(0.5, Math.max(0, (-z - 18) / 80))).getHexString();
  const laneX = (z) => -12.5 - 0.16 * Math.max(0, -z);
  const FLAG = ['#1f5fbf', '#f4f4ef', '#d6262b', '#2f9a4a', '#f2c22b'];

  /** Ground height: flat saddle at the stupa, forested ridge rising behind (-z), terraced valley falling in front (+z). */
  function hAt(x, z) {
    let h = 17 * sm(-12, -62, z) + 3 * sm(-20, -45, z) * Math.sin(x * 0.09 + 1.3);
    h += 7 * sm(24, 62, Math.abs(x)) * (0.5 + 0.5 * sm(30, -20, z));
    const d = z - 26;
    if (d > 0) {
      const lvl = Math.min(5, Math.floor(d / 6));
      const fr = d / 6 - Math.floor(d / 6);
      h -= lvl * 2.4 + (lvl < 5 ? 2.4 * sm(0.78, 1, fr) : 0);
    }
    return h;
  }
  const terrLvl = (z) => (z > 26 ? Math.floor((z - 26) / 6) : -1);

  let bottleGeo = null;
  const getBottle = () => bottleGeo || (bottleGeo = new THREE.LatheGeometry(
    [[0.001, 0], [0.25, 0], [0.28, 0.06], [0.27, 0.16], [0.21, 0.27], [0.15, 0.36], [0.13, 0.41], [0.15, 0.43], [0.12, 0.45], [0.001, 0.45]].map(([r, y]) => new THREE.Vector2(r, y)), 20));
  let bellGeo = null;
  const getBell = () => bellGeo || (bellGeo = new THREE.LatheGeometry(
    [[0.001, 0], [0.95, 0], [1.05, 0.12], [1.12, 0.55], [1.05, 1.0], [0.82, 1.4], [0.55, 1.68], [0.5, 1.76], [0.56, 1.82], [0.5, 1.88], [0.001, 1.88]].map(([r, y]) => new THREE.Vector2(r, y)), 36));

  /** Instanced mesh helper: items = [{p, s:[x,y,z]|n, ry, c}] */
  function Inst({ geo, mat, items, shadow = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(...it.p);
        const s = it.s ?? 1;
        if (Array.isArray(s)) o.scale.set(...s); else o.scale.set(s, s, s);
        o.rotation.set(0, it.ry || 0, 0);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) ref.current.setColorAt(i, col.set(it.c));
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={shadow} frustumCulled={false} />;
  }

  /** Strings of prayer flags (one merged mesh) + the cords (one line mesh). strings: [{a,b,sag}] */
  function Flags({ strings, fw = 0.36, fh = 0.28, start = 0.05, gap = 0.44, seed = 3 }) {
    const { fg, lg } = useMemo(() => {
      const r = rng(seed);
      const pos = []; const col = []; const idx = []; const lp = [];
      const c = new THREE.Color();
      let k = 0;
      strings.forEach((st) => {
        const [a, b] = [st.a, st.b];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const sag = st.sag ?? 0.05 * len;
        const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t];
        const seg = Math.max(4, Math.round(len / 1.5));
        for (let i = 0; i < seg; i += 1) lp.push(...P(i / seg), ...P((i + 1) / seg));
        const n = Math.max(3, Math.round(len * (1 - start) / gap));
        const dt = fw / len / 2;
        for (let i = 0; i < n; i += 1) {
          const t = start + (1 - start) * (i + 0.5) / n;
          const p0 = P(Math.max(0, t - dt)); const p1 = P(Math.min(1, t + dt));
          const hh = fh * (0.85 + 0.3 * r());
          const wob = 0.05 * Math.sin(i * 2.3 + k);
          pos.push(...p0, ...p1, p1[0] + wob, p1[1] - hh, p1[2] + wob, p0[0] + wob, p0[1] - hh, p0[2] + wob);
          c.set(st.mono ? st.mono[i % st.mono.length] : FLAG[(i + (st.o || 0)) % 5]);
          for (let q = 0; q < 4; q += 1) col.push(c.r, c.g, c.b);
          idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
          k += 4;
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const l = new THREE.BufferGeometry();
      l.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      return { fg: g, lg: l };
    }, [strings, fw, fh, start, gap, seed]);
    return (
      <group>
        <mesh geometry={fg}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
        <lineSegments geometry={lg}><lineBasicMaterial color="#2a2622" /></lineSegments>
      </group>
    );
  }

  function Pole({ p, h, r = 0.07, color = '#5a3f2b' }) {
    const M = useM();
    return <Cyl rt={r * 0.8} rb={r} h={h} p={[p[0], p[1] + h / 2, p[2]]} m={M.plain(color)} seg={6} />;
  }

  /** Small white ogive "bottle" chaitya, unit height about 1.25 */
  function Chai({ p, s = 1, gold = false, tall = false, plinth = 0, ry = 0 }) {
    const M = useM();
    const wm = M.plain('#e1ded4', { roughness: 0.92 });
    const gm = M.plain('#d8a423', { metalness: 0.55, roughness: 0.4 });
    const om = M.plain('#c9a227', { metalness: 0.4, roughness: 0.5 });
    return (
      <group position={p} scale={s} rotation={[0, ry, 0]}>
        {plinth > 0 && [1.1, 0.96, 0.82].map((w, i) => <Box key={i} s={[w, plinth / 3, w]} p={[0, plinth / 6 + i * plinth / 3, 0]} m={M.plain(i % 2 ? '#d0cdc2' : '#dcd9ce')} />)}
        <group position={[0, plinth, 0]}>
        <Box s={[0.74, 0.12, 0.74]} p={[0, 0.06, 0]} m={wm} />
        <Box s={[0.62, 0.1, 0.62]} p={[0, 0.17, 0]} m={wm} />
        <Box s={[0.5, 0.08, 0.5]} p={[0, 0.26, 0]} m={wm} />
        <mesh geometry={getBottle()} position={[0, 0.3, 0]} material={wm} castShadow receiveShadow />
        <Cyl rt={0.15} h={0.035} p={[0, 0.82, 0]} m={wm} seg={12} />
        <Box s={[0.18, tall ? 0.12 : 0.07, 0.18]} p={[0, tall ? 0.9 : 0.87, 0]} m={tall ? gm : wm} />
        <mesh position={[0, tall ? 1.17 : 1.06, 0]} material={gold ? om : wm} castShadow><coneGeometry args={[0.07, tall ? 0.42 : 0.34, 10]} /></mesh>
        <Ball rad={0.028} p={[0, tall ? 1.4 : 1.25, 0]} m={gm} />
        </group>
      </group>
    );
  }

  /** Pitched tin roof with gable-end fill. Ridge runs along x. */
  function Gable({ w, d, h, y, roof, wall, over = 0.45 }) {
    const D = d / 2 + over;
    const L = Math.hypot(D, h);
    const a = Math.atan2(h, D);
    const geo = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, h * 0.9); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); return g;
    }, [w, d, h]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} rotation={[0, Math.PI / 2, 0]} material={wall} />
        <Box s={[w + 0.5, 0.07, L]} p={[0, h / 2 + 0.02, D / 2]} r={[a, 0, 0]} m={roof} />
        <Box s={[w + 0.5, 0.07, L]} p={[0, h / 2 + 0.02, -D / 2]} r={[-a, 0, 0]} m={roof} />
        <Box s={[w + 0.55, 0.1, 0.16]} p={[0, h + 0.04, 0]} m={roof} />
      </group>
    );
  }

  /* ============================================================ MAIN ============================================================ */
  function NamoMain() {
    const M = useM();
    const eyes = useMemo(() => eyesTexture(), []);
    const white = M.plain('#e4e1d7', { roughness: 0.9 });
    const wall = M.plain('#cfcbbd', { roughness: 1 });
    const wall2 = M.plain('#c2bfb2', { roughness: 0.98 });
    const gold = M.plain('#d8a423', { metalness: 0.6, roughness: 0.35 });
    const red = M.plain('#a8341f', { roughness: 0.6 });
    const ochre = M.plain('#a07a2a', { metalness: 0.4, roughness: 0.5 });
    const harmM = useMemo(() => new THREE.MeshStandardMaterial({ map: eyes, roughness: 0.8 }), [eyes]);
    const TOPY = PT + 9.3;
    const flagEnds = [[-12, 4.6, 3], [-9, 4.2, 9.5], [8, 4.4, 9], [13, 4.6, 2], [12.5, 4.4, -2.5], [-13, 4.4, -4], [-8, 4.2, -11], [2, 4.6, -10.5], [9, 4.4, -10], [-5, 3.4, 12], [14, 3.6, 6.5], [-14.5, 3.6, -1], [5, 3.6, -12.5], [13, 3.6, -7]];
    const flag = useMemo(() => flagEnds.map((b, i) => ({ a: [MX, TOPY, 0], b: [b[0], b[1], b[2]], o: i, sag: 0.03 * Math.hypot(b[0] - MX, b[2]) })), []);
    // flagstone apron wrapping the platform front corners (L shape), 1 m flags in four grey tones
    const apron = useMemo(() => {
      const sh = new THREE.Shape();
      [[-8.6, -8.2], [8.6, -8.2], [8.6, -4.9], [-8.6, -4.9]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
      const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x2 = c.getContext('2d'); const r = rng(5);
      const tones = ['#6a6d70', '#585b60', '#62656a', '#747779'];
      for (let i = 0; i < 8; i += 1) for (let j = 0; j < 8; j += 1) { x2.fillStyle = tones[Math.floor(r() * 4)]; x2.fillRect(j * 32, i * 32, 32, 32); }
      x2.strokeStyle = '#3b3d41'; x2.lineWidth = 2;
      for (let i = 0; i <= 8; i += 1) { x2.beginPath(); x2.moveTo(i * 32, 0); x2.lineTo(i * 32, 256); x2.moveTo(0, i * 32); x2.lineTo(256, i * 32); x2.stroke(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.125, 0.125);
      if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return { g, t };
    }, []);
    // weathering streaks on the whitewashed wall
    const streaks = useMemo(() => {
      const r = rng(31); const out = [];
      for (let i = 0; i < 20; i += 1) out.push({ x: -7.4 + r() * 14.8, w: 0.1 + r() * 0.15, h: 0.3 + r() * 0.5, z: -4.6 + r() * 9.2 });
      return out;
    }, []);
    // rails
    const RX = 7.4; const RZ = 4.6; const RY = PT;
    const rails = useMemo(() => {
      const sides = [[[-RX, RZ], [RX, RZ]], [[RX, RZ], [RX, -RZ]], [[RX, -RZ], [-RX, -RZ]], [[-RX, -RZ], [-RX, -1.4]], [[-RX, 1.4], [-RX, RZ]]];
      const posts = []; const bars = []; const wheels = []; const wheels2 = [];
      sides.forEach(([a, b]) => {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.round(len / 2));
        const ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
        for (let i = 0; i <= n; i += 1) posts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
        bars.push({ c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], len, ang });
        const nw = Math.floor(len / 0.3);
        for (let i = 0; i < nw; i += 1) {
          const t = (i + 0.5) / nw;
          const P = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          wheels.push({ p: [P[0], RY + 0.55, P[1]], s: [1, 1, 1], c: ['#7a3f1d', '#9a6a2e', '#b07a36'][i % 3] });
        }
      });
      return { posts, bars, wheels, wheels2 };
    }, []);
    const wheelGeo = useMemo(() => new THREE.CylinderGeometry(0.14, 0.14, 0.4, 10), []);
    const wheelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.3 }), []);
    const SC = 1.2; // main stupa group scale
    const robes = ['#8c1f1f', '#a53030', '#9a2a22'];
    // monks on the terrace near the rail, scattered (x, z, rotY)
    const monks = [[-0.6, 3.9, 0.5], [4.6, 3.6, 0.2], [-5.0, 3.8, 0.3]];
    return (
      <group>
        {/* paved apron, platform */}
        <mesh geometry={apron.g} position={[0, 0.05, 0]} receiveShadow><meshStandardMaterial map={apron.t} roughness={0.95} /></mesh>
        <Box s={[16, PT, 10]} p={[0, PT / 2, 0]} m={wall} />
        <Box s={[16.2, 0.1, 10.2]} p={[0, PT + 0.02, 0]} m={wall2} />
        <Box s={[16.3, 0.3, 10.3]} p={[0, 0.15, 0]} m={M.plain('#b9b6a8', { roughness: 1 })} cast={false} />
        {streaks.map((s, i) => <Box key={`sf${i}`} s={[s.w, s.h, 0.02]} p={[s.x, PT - 0.08 - s.h / 2, 5.01]} m={M.plain('#c4c1b3', { roughness: 1 })} cast={false} />)}
        {streaks.slice(0, 10).map((s, i) => <Box key={`ss${i}`} s={[0.02, s.h, s.w]} p={[8.01, PT - 0.08 - s.h / 2, s.z]} m={M.plain('#c4c1b3', { roughness: 1 })} cast={false} />)}
        {/* three steps up at the lane-side gap */}
        <Box s={[0.9, 0.45, 2.4]} p={[-8.45, 0.225, 0]} m={wall2} />
        <Box s={[0.6, 0.9, 2.4]} p={[-8.15, 0.45, 0]} m={wall2} />
        <Flags strings={flag} fw={0.32} fh={0.26} start={0.06} gap={0.46} seed={21} />
        {flagEnds.map((b, i) => <Pole key={`fp${i}`} p={[b[0], 0, b[2]]} h={b[1]} r={0.06} />)}
        {/* railing: ochre tubes, prayer wheels in two bands below the top rail */}
        {rails.posts.map(([x, z], i) => <Box key={`p${i}`} s={[0.12, 1.0, 0.12]} p={[x, RY + 0.5, z]} m={ochre} cast={false} />)}
        {rails.bars.map((b, i) => (
          <group key={`b${i}`} position={[b.c[0], RY, b.c[1]]} rotation={[0, b.ang, 0]}>
            <Box s={[0.09, 0.09, b.len]} p={[0, 1.0, 0]} m={ochre} cast={false} />
            <Box s={[0.06, 0.06, b.len]} p={[0, 0.5, 0]} m={ochre} cast={false} />
          </group>
        ))}
        <Inst geo={wheelGeo} mat={wheelMat} items={rails.wheels} />

        {/* ---------------- main stupa: slim neck-moulded bell, tall slender spire ---------------- */}
        <group position={[MX, PT, 0]} scale={SC}>
          {[5.0, 4.2, 3.4].map((w, i) => <Box key={i} s={[w, 0.45, w]} p={[0, 0.225 + i * 0.45, 0]} m={i % 2 ? wall2 : white} />)}
          <Box s={[2.6, 0.15, 2.6]} p={[0, 1.42, 0]} m={white} />
          <mesh geometry={getBell()} position={[0, 1.5, 0]} material={white} castShadow receiveShadow />
          {[0.52, 0.48, 0.44].map((r, i) => <Cyl key={i} rt={r} h={0.07} p={[0, 3.41 + i * 0.07, 0]} m={white} seg={24} />)}
          <mesh position={[0, 3.98, 0]} material={[harmM, harmM, gold, gold, harmM, harmM]} castShadow><boxGeometry args={[1.1, 0.8, 1.1]} /></mesh>
          <Box s={[1.2, 0.12, 1.2]} p={[0, 4.44, 0]} m={red} />
          {Array.from({ length: 13 }, (_, i) => (
            <Cyl key={i} rt={0.4 - i * 0.026} rb={0.42 - i * 0.026} h={0.15} p={[0, 4.58 + i * 0.15, 0]} m={i % 4 === 0 ? red : gold} seg={14} />
          ))}
          <mesh position={[0, 6.62, 0]} material={gold} castShadow><coneGeometry args={[0.26, 0.14, 16]} /></mesh>
          <Cyl rt={0.04} h={0.3} p={[0, 6.84, 0]} m={gold} seg={8} />
          <mesh position={[0, 7.18, 0]} material={gold}><coneGeometry args={[0.09, 0.4, 10]} /></mesh>
          <Ball rad={0.06} p={[0, 7.42, 0]} m={gold} />
          {/* butter lamps on the platform at the foot of the steps */}
          {[-1.6, -1.0, -0.5, 0, 0.5, 1.0, 1.6].map((x, i) => <group key={i} position={[x, 0, 3.15]} scale={1.8}><Diyo p={[0, 0, 0]} light={i === 1 || i === 5} /></group>)}
        </group>

        {/* ---------------- chaitya cluster: tight rows to the right of and behind the stupa, on stepped plinths ---------------- */}
        <Chai p={[MX, PT, -3.9]} s={1.7} tall plinth={0.3} />
        <Chai p={[3.0, PT, 2.4]} s={1.6} plinth={0.3} />
        <Chai p={[4.7, PT, 1.9]} s={1.9} gold tall plinth={0.35} />
        <Chai p={[6.3, PT, 0.3]} s={1.5} plinth={0.3} />
        <Chai p={[3.6, PT, -0.3]} s={1.6} tall plinth={0.3} />
        <Chai p={[5.4, PT, -2.4]} s={1.6} plinth={0.35} />
        <Chai p={[2.9, PT, -2.8]} s={1.5} gold plinth={0.3} />

        {/* monks: robe, shoulders, ochre sash, arms, shaved head */}
        {monks.map(([x, z, ry], i) => (
          <group key={i} position={[x, PT, z]} rotation={[0, ry, 0]} scale={0.95}>
            <Cyl rt={0.14} rb={0.21} h={0.85} p={[0, 0.43, 0]} m={M.plain(robes[i % 3])} seg={8} />
            <Box s={[0.46, 0.12, 0.24]} p={[0, 0.86, 0]} m={M.plain(robes[(i + 1) % 3])} cast={false} />
            <Box s={[0.1, 0.5, 0.1]} p={[-0.25, 0.64, 0.02]} r={[0, 0, 0.12]} m={M.plain(robes[i % 3])} cast={false} />
            <Box s={[0.1, 0.5, 0.1]} p={[0.25, 0.64, 0.02]} r={[0, 0, -0.12]} m={M.plain(robes[i % 3])} cast={false} />
            <Box s={[0.1, 0.62, 0.05]} p={[0.05, 0.6, 0.165]} r={[0, 0, 0.55]} m={M.plain('#d9a23a')} cast={false} />
            <Cyl rt={0.04} h={0.08} p={[0, 0.95, 0]} m={M.plain('#d9a77d')} seg={6} />
            <Ball rad={0.1} p={[0, 1.04, 0]} m={M.plain('#d9a77d')} />
          </group>
        ))}
        <Frame s={[16.2, 11.2, 10.4]} p={[0, 5.5, 0.4]} />
      </group>
    );
  }

  /* ============================================================ ENV ============================================================ */
  function NamoEnv() {
    const M = useM();
    const timber = M.plain('#5a3f2b');
    // terrain
    const terrain = useMemo(() => {
      const W = 220; const N = 170;
      const g = new THREE.PlaneGeometry(W, W, N, N);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      const r = rng(11);
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i); const z = p.getZ(i);
        const y = hAt(x, z);
        p.setY(i, y);
        const lvl = terrLvl(z);
        const n = 0.92 + 0.12 * Math.sin(x * 0.7) * Math.sin(z * 0.6) + 0.06 * r();
        if (Math.abs(x - laneX(z)) < 1.7 && z < 30) c.set('#a98558');
        else if (Math.abs(x) < 8.6 && z > 4.9 && z < 8.2 && (Math.floor(x / 1.2) + Math.floor(z / 1.2)) % 3 !== 0) c.set('#8f908c');
        else if (Math.abs(x) < 8.6 && z > -8 && z < 8.2) c.set('#a89066');
        else if (lvl >= 0) c.set(lvl % 2 ? '#bda468' : '#8ea255');
        else if (z < -12) { c.set(y > 11 ? '#4d5a35' : '#6c7a40'); if (z < -22) c.multiplyScalar(Math.floor(y / 1.6) % 2 ? 0.86 : 1.04); }
        else c.set(Math.abs(x) < 24 ? '#a89066' : '#8a9650');
        c.multiplyScalar(n);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);

    // forest (instanced)
    const forest = useMemo(() => {
      const r = rng(77);
      const ok = (x, z) => !(Math.abs(x) < 12 && z > -9 && z < 16) && Math.abs(x - laneX(z)) > 3.5 && !(x > 6 && x < 25 && z > -14 && z < 3)
        && !(x < -13 && x > -28 && z > -17 && z < 7) && !(x > -44 && x < -16 && z > -62 && z < -40) && z < 24;
      const pines = []; const broad = []; const trunks = [];
      let tries = 0;
      while (pines.length < 95 && tries < 3000) {
        tries += 1;
        const x = (r() - 0.5) * 130; const z = -12 - r() * 70;
        if (!ok(x, z)) continue;
        const s = 0.6 + r() * 0.6;
        pines.push({ p: [x, hAt(x, z) + 2.4 * s, z], s: [s, s * (1 + r() * 0.5), s], c: hz(['#3a4b36', '#42563f', '#33452f', '#4a5e3f'][Math.floor(r() * 4)], z) });
      }
      tries = 0;
      while (broad.length < 70 && tries < 2000) {
        tries += 1;
        const x = (r() - 0.5) * 100; const z = -15 - r() * 42;
        if (!ok(x, z) || Math.abs(x) < 10) continue;
        const s = 0.8 + r() * 0.6; const y = hAt(x, z);
        trunks.push({ p: [x, y + 1.1 * s, z], s: [s, s, s] });
        broad.push({ p: [x, y + 3.0 * s, z], s: [2.0 * s, 1.5 * s, 2.0 * s], c: hz(['#7f7d4a', '#928050', '#6d7650', '#9a8a55'][Math.floor(r() * 4)], z) });
      }
      // a few on the sides / below
      for (let i = 0; i < 18; i += 1) {
        const x = (r() < 0.5 ? -1 : 1) * (26 + r() * 30); const z = -20 + r() * 50;
        if (!ok(x, z)) continue;
        const s = 0.9 + r() * 0.7;
        pines.push({ p: [x, hAt(x, z) + 2.4 * s, z], s: [s, s * 1.2, s], c: '#3f5340' });
      }
      return { pines, broad, trunks };
    }, []);
    const pineGeo = useMemo(() => new THREE.ConeGeometry(1.7, 5.2, 7), []);
    const broadGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.14, 0.22, 2.2, 6), []);
    const pineMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), []);
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 1 }), []);

    // terraces' crop rows, small huts down the valley
    const huts = [[-22, 38], [18, 46], [-8, 58], [32, 34], [-36, 52]];

    // Himalaya
    const peaks = useMemo(() => {
      const r = rng(5);
      return Array.from({ length: 11 }, (_, i) => ({ x: -100 + i * 20 + (r() - 0.5) * 8, h: 30 + r() * 20, rad: 20 + r() * 8, z: -112 - r() * 10 }));
    }, []);

    const bare = [[-9.8, 0, -9.5], [19, 0, 6], [-15.5, 0, -6], [-14.5, 0, -15], [11, 0, -13], [-26, 0, 2], [22, 0, -15], [-8, 0, -17], [27, 0, 4]];
    const tinGrey = M.plain('#8f9599', { roughness: 0.5, metalness: 0.35 });
    const tinBlue = M.plain('#2f6fb8', { roughness: 0.5, metalness: 0.3 });
    const tinRust = M.plain('#8d4a35', { roughness: 0.7, metalness: 0.2 });
    const cream = M.mat('plaster', 3, 3, { color: '#ebe0c6' });
    const orange = M.mat('plaster', 3, 3, { color: '#d98b55' });
    const frame = M.plain('#2d8f83', { roughness: 0.6 });
    const glass = M.plain('#6f93a3', { roughness: 0.3, emissive: '#ffb860', emissiveIntensity: 0.28 });
    const dark = M.plain('#3a2c22');
    const slab = M.plain('#cfc8b8');
    const rail = M.plain('#7b4a2a');

    // flags on the lane
    const lane = useMemo(() => {
      const poles = []; const strs = [];
      for (let i = 0; i < 7; i += 1) { const z = 3 - i * 5.5; poles.push([laneX(z) + 2.8, 0, z]); }
      for (let i = 0; i < 6; i += 1) {
        const a = poles[i]; const b = poles[i + 1];
        strs.push({ a: [a[0], 4.3, a[2]], b: [b[0], 4.3, b[2]], o: i }, { a: [a[0], 3.4, a[2]], b: [b[0], 3.4, b[2]], o: i + 2 });
      }
      const streamers = [];
      for (let i = 0; i < 9; i += 1) {
        const z = -2 - i * 2.4; const x = laneX(z) - 3.2;
        streamers.push({ a: [x, 5.2, z], b: [x, 5.2, z - 1.6], sag: 0, mono: [['#d6262b', '#2f9a4a', '#f2c22b'][i % 3]], o: i });
      }
      return { poles, strs, streamers };
    }, []);

    const gold = M.gold;
    const mred = M.plain('#8a3426', { roughness: 0.7 });
    const mwhite = M.plain('#efe9dc', { roughness: 0.8 });
    const monY = hAt(-30, -50);

    return (
      <group>
        <mesh geometry={terrain} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>

        {/* Himalaya on the northern horizon */}
        {peaks.map((p, i) => (
          <group key={i} position={[p.x, -6, p.z]}>
            <mesh position={[0, p.h / 2, 0]} material={M.plain('#7f8794', { roughness: 1 })}><coneGeometry args={[p.rad, p.h, 5]} /></mesh>
            <mesh position={[0, p.h * 0.78, 0]} material={M.plain('#f3f6fa', { roughness: 0.9 })}><coneGeometry args={[p.rad * 0.4, p.h * 0.45, 5]} /></mesh>
          </group>
        ))}
        {/* far hills across the valley in front */}
        {[[-60, 130, 40, 15], [10, 140, 55, 18], [70, 128, 38, 13], [-10, 118, 30, 9]].map(([x, z, rx, ry], i) => (
          <mesh key={i} position={[x, -11 + (i === 3 ? 0 : 0), z]} scale={[rx, ry, 22]} material={M.plain(i % 2 ? '#8a9eae' : '#7f95a4', { roughness: 1 })}><sphereGeometry args={[1, 12, 8]} /></mesh>
        ))}

        {/* forest */}
        <Inst geo={pineGeo} mat={pineMat} items={forest.pines} />
        <Inst geo={trunkGeo} mat={trunkMat} items={forest.trunks} />
        <Inst geo={broadGeo} mat={pineMat} items={forest.broad} />
        {/* bare winter trees near the stupa */}
        {bare.map(([x, , z], i) => (
          <group key={i} position={[x, hAt(x, z), z]} scale={1 + 0.07 * (i % 5)} rotation={[0, i * 1.3, 0]}>
            <Cyl rt={0.12} rb={0.22} h={3.2} p={[0, 1.6, 0]} m={timber} seg={6} />
            {[0, 1, 2, 3].map((k) => <Cyl key={k} rt={0.04} rb={0.09} h={2} p={[Math.cos(k * 1.6 + i) * 0.7, 3.6, Math.sin(k * 1.6 + i) * 0.7]} r={[Math.sin(k * 1.6 + i) * 0.7, 0, -Math.cos(k * 1.6 + i) * 0.7]} m={timber} seg={5} />)}
            <Ball rad={0.8} p={[0.4, 4.4, 0]} sc={[1.2, 0.7, 1.2]} m={M.plain(i % 2 ? '#b59a3c' : '#8c8a3a', { roughness: 1 })} />
            <Ball rad={0.6} p={[-0.6, 4.2, 0.4]} sc={[1.1, 0.6, 1.1]} m={M.plain('#a98e38', { roughness: 1 })} />
          </group>
        ))}

        {/* earth lane: small stupas on the platform side, flag poles, flag curtain */}
        <Chai p={[laneX(9) + 2.2, 0, 9]} s={2.2} gold plinth={0} />
        <Chai p={[laneX(2) + 2.3, 0, -9]} s={1.5} />
        <group position={[laneX(5) + 2.0, 0, 5.2]}>
          <Box s={[1.9, 0.9, 1.9]} p={[0, 0.45, 0]} m={M.plain('#d9d6cb')} />
          <Chai p={[0, 0.9, 0]} s={2.6} gold tall />
        </group>
        <Chai p={[laneX(-6) + 2.2, 0, -6]} s={1.8} />
        <Chai p={[laneX(-14) + 2.0, hAt(laneX(-14) + 2.0, -14), -14]} s={1.5} gold />
        {lane.poles.map((p, i) => <Pole key={i} p={p} h={5.2} />)}
        <Flags strings={lane.strs} fw={0.3} fh={0.24} start={0} gap={0.36} seed={9} />
        <Flags strings={lane.streamers} fw={0.28} fh={0.5} start={0} gap={0.3} seed={4} />

        {/* ---- lodge at the right: three storeys, balconies, tin roof ---- */}
        <group position={[16, 0, -8]}>
          <Box s={[7, 8.1, 5]} p={[0, 4.05, 0]} m={cream} />
          {[0, 1, 2].map((f) => (
            <group key={f}>
              {[-2.3, 0, 2.3].map((x, i) => (
                <group key={i} position={[x, f * 2.7 + (f === 0 ? 1.3 : 1.45), 2.52]}>
                  <Box s={[1.25, 1.45, 0.08]} m={frame} cast={false} />
                  <Box s={[1.0, 1.2, 0.1]} m={glass} cast={false} />
                  <Box s={[0.05, 1.2, 0.12]} m={frame} cast={false} />
                </group>
              ))}
              {f > 0 && (
                <group position={[0, f * 2.7, 3.0]}>
                  <Box s={[7.2, 0.16, 1.1]} m={slab} />
                  <Box s={[7.2, 0.07, 0.07]} p={[0, 1.0, 0.5]} m={rail} cast={false} />
                  <Box s={[7.2, 0.05, 0.05]} p={[0, 0.55, 0.5]} m={rail} cast={false} />
                  {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[0.06, 1.0, 0.06]} p={[-3.4 + i * 0.85, 0.5, 0.5]} m={rail} cast={false} />)}
                  <Box s={[0.06, 1.0, 0.06]} p={[3.55, 0.5, 0.5]} m={rail} cast={false} />
                </group>
              )}
            </group>
          ))}
          <Box s={[1.1, 2.1, 0.12]} p={[-0.0, 1.05, 2.52]} m={dark} cast={false} />
          <Gable w={7} d={5} h={1.8} y={8.1} roof={tinGrey} wall={cream} />
          {[[-3.55, 1.5], [-3.55, 4.2], [-3.55, 6.9]].map(([x, y], i) => (
            <group key={i} position={[x, y, 0]}>
              <Box s={[0.08, 1.2, 1.0]} m={frame} cast={false} />
            </group>
          ))}
        </group>
        <group position={[23, 0, -6]}>
          <Box s={[4.5, 2.6, 4]} p={[0, 1.3, 0]} m={orange} />
          <Gable w={4.5} d={4} h={0.9} y={2.6} roof={tinBlue} wall={orange} />
        </group>

        {/* ---- lane-side houses: orange-brown walls, blue-roofed shed ---- */}
        <group position={[-19.5, 0, 3.5]}>
          <Box s={[5, 2.3, 3.2]} p={[0, 1.15, 0]} m={orange} />
          <Gable w={5} d={3.2} h={0.8} y={2.3} roof={tinBlue} wall={orange} />
          <Box s={[1.4, 1.5, 0.1]} p={[-1, 0.9, 1.66]} m={dark} cast={false} />
          <Box s={[1.0, 0.8, 0.1]} p={[1.2, 1.3, 1.66]} m={glass} cast={false} />
        </group>
        <group position={[-20, 0, -4.5]}>
          <Box s={[5.2, 5.0, 4.4]} p={[0, 2.5, 0]} m={orange} />
          <Gable w={5.2} d={4.4} h={1.4} y={5.0} roof={tinRust} wall={orange} />
          {[-1.4, 1.4].map((x) => [1.4, 3.6].map((y) => <Box key={`${x}${y}`} s={[0.9, 1.0, 0.1]} p={[x, y, 2.23]} m={glass} cast={false} />))}
        </group>
        <group position={[-19, 0, -11.5]}>
          <Box s={[4, 2.6, 3.4]} p={[0, 1.3, 0]} m={M.mat('plaster', 3, 2, { color: '#e8d9b8' })} />
          <Gable w={4} d={3.4} h={1.0} y={2.6} roof={tinBlue} wall={M.plain('#e8d9b8')} />
        </group>

        {[[-21, 12, 0.2, 0], [-22, -17, -0.3, 1], [-24, 20, 0.5, 1], [-17.5, 24, 0.1, 0]].map(([x, z, ry, k], i) => (
          <group key={'lh' + i} position={[x, hAt(x, z), z]} rotation={[0, ry, 0]}>
            <Box s={[4.2, 2.4, 3]} p={[0, 1.2, 0]} m={k ? orange : cream} />
            <Gable w={4.2} d={3} h={0.9} y={2.4} roof={k ? tinBlue : tinRust} wall={k ? orange : cream} />
            <Box s={[0.9, 1.5, 0.1]} p={[-0.8, 0.8, 1.52]} m={dark} cast={false} />
            <Box s={[0.9, 0.7, 0.1]} p={[0.9, 1.4, 1.52]} m={glass} cast={false} />
          </group>
        ))}

        {/* ---- Thrangu Tashi Yangtse monastery: golden roofs high on the ridge, well behind ---- */}
        <group position={[-30, monY, -50]} scale={0.7}>
          <Box s={[18, 5, 11]} p={[0, -1.8, 0]} m={M.mat('plaster', 4, 1, { color: '#cfcabc' })} />
          <Box s={[10, 2.0, 7]} p={[0, 1.4, 0]} m={mwhite} />
          <Box s={[10.2, 1.6, 7.2]} p={[0, 3.2, 0]} m={mred} />
          <Box s={[10.3, 0.35, 7.3]} p={[0, 3.7, 0]} m={gold} />
          <Box s={[10.25, 0.3, 7.25]} p={[0, 2.75, 0]} m={M.plain('#e9b73a', { roughness: 0.5 })} />
          <Roof w={13} d={10} h={1.8} y={4.0} m={gold} sag={1.3} lift={0.25} fascia={false} />
          <Box s={[5.4, 2.2, 4.2]} p={[0, 6.0, 0]} m={mred} />
          <Box s={[5.5, 0.3, 4.3]} p={[0, 6.55, 0]} m={gold} />
          <Roof w={8} d={6.4} h={1.7} y={7.1} m={gold} sag={1.3} lift={0.25} fascia={false} />
          <Cyl rt={0.14} h={1.2} p={[0, 9.4, 0]} m={gold} seg={8} />
          <mesh position={[0, 10.3, 0]} material={gold}><coneGeometry args={[0.35, 0.9, 8]} /></mesh>
          {[[-5.6, 5.2], [5.6, 5.2], [-5.6, -5.2], [5.6, -5.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 4.4, z]} material={gold}><coneGeometry args={[0.25, 0.7, 6]} /></mesh>
          ))}
          {[-3.4, 3.4].map((x, i) => <Ball key={i} rad={0.4} p={[x, 8.8, 0]} sc={[1, 1.2, 1]} m={gold} />)}
          <Box s={[2, 1.8, 0.1]} p={[0, 1.5, 3.55]} m={M.plain('#7a2619')} cast={false} />
          {[-3.4, -1.7, 1.7, 3.4].map((x, i) => <Box key={i} s={[0.8, 0.8, 0.1]} p={[x, 3.0, 3.65]} m={M.plain('#e6b23a')} cast={false} />)}
          </group>

        {/* terraced fields: huts and field walls down the valley */}
        {huts.map(([x, z], i) => {
          const y = hAt(x, z);
          return (
            <group key={i} position={[x, y, z]} rotation={[0, i * 0.7, 0]}>
              <Box s={[3.4, 2.1, 2.6]} p={[0, 1.05, 0]} m={i % 2 ? orange : cream} />
              <Gable w={3.4} d={2.6} h={0.8} y={2.1} roof={i % 2 ? tinBlue : tinGrey} wall={i % 2 ? orange : cream} />
            </group>
          );
        })}
      </group>
    );
  }

  return { namobuddha: { Main: NamoMain, Env: NamoEnv } };
}
