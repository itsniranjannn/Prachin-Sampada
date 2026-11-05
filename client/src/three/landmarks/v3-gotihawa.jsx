// Gotihawa (Taulihawa, Kapilvastu). A tiny open-air ruin: the broken, uninscribed stump of an Ashokan pillar in a
// golden fence cage (with prayer flags and a white khata) inside a shallow brick-walled enclosure with a short brick stair,
// at the foot of the low grassy hump of a buried round brick stupa (~21 m), in flat Terai farmland under a huge hazy sky.
// 1 unit = about 1 m here (the monument is genuinely tiny); the enclosure sits at the origin, front faces +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, THREE, useMemo, useRef, useEffect, Frame } = K;

  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const GOLD = '#d9a21b';
  const FLAGC = ['#1f5fbf', '#f4f4ef', '#d6262b', '#2f9a4a', '#f2c22b', '#f08a1c'];
  const FLOOR = -0.35; // enclosure floor
  const TOP = 0.08; // brick wall top
  const PX = 3.0; const PZ = 2.3; // enclosure half-sizes (inner)
  const HX = 2.1; const HZ = 1.4; // cage half-sizes (4.2 x 2.8 m)
  const MOUND = [-10, -6]; // buried stupa centre
  const MR = 8.5; // stupa radius (steep grassy rise)
  const MH = 2.8; // hump height
  const hump = (d) => (d >= MR ? 0 : MH * (1 - Math.pow(d / MR, 2.6)));
  const SW = 1.4; const SN = 2; // stair well width, number of steps
  const POND = [-36, -27];

  /** Instanced mesh helper. items: [{p,s,ry,rx,rz,c}] */
  function Inst({ geo, mat, items, shadow = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(...it.p);
        const s = it.s;
        if (Array.isArray(s)) o.scale.set(...s); else o.scale.setScalar(s || 1);
        o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) { col.set(it.c); ref.current.setColorAt(i, col); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[null, null, items.length]} castShadow={shadow} receiveShadow frustumCulled={false}>{geo}<primitive object={mat} attach="material" /></instancedMesh>;
  }

  /* ---------- the stump: a wide rounded boulder-like stone, reddish-grey patina ---------- */
  function Stump() {
    const geo = useMemo(() => {
      const prof = [[0, 0], [0.8, 0], [0.82, 0.25], [0.66, 0.8], [0.55, 1.3], [0.47, 1.7], [0.4, 1.9], [0, 2.1]];
      const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 7);
      const p = g.attributes.position; const cols = []; const c = new THREE.Color();
      const c1 = new THREE.Color('#7D7468'); const c2 = new THREE.Color('#8a6a52'); const c3 = new THREE.Color('#5f574f');
      for (let i = 0; i < p.count; i += 1) {
        let x = p.getX(i); let z = p.getZ(i); let y = p.getY(i);
        const a = Math.atan2(z, x); const t = y / 2.1;
        const k = 1 + 0.13 * Math.sin(3 * a + 1) + 0.09 * Math.cos(2 * a) + 0.05 * Math.sin(t * 7 + a);
        x *= k; z *= k;
        if (y > 1.85 && y < 2.05) y += 0.2 * Math.cos(a - 0.6) - 0.02;
        if (y >= 2.05) { x += 0.1; y += 0.06; }
        p.setXYZ(i, x, y, z);
        const m = 0.5 + 0.5 * Math.sin(a * 3 + t * 9) * Math.cos(t * 5 + a);
        c.copy(c1).lerp(c2, Math.max(0, Math.min(1, m))).lerp(c3, t > 0.8 ? 0.35 : 0);
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.85, metalness: 0.03, flatShading: true }), []);
    const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.9, side: THREE.DoubleSide }), []);
    const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6f6658', roughness: 0.9, flatShading: true }), []);
    return (
      <group position={[0, FLOOR - 0.02, 0]}>
        <mesh geometry={geo} material={mat} castShadow receiveShadow />
        <mesh position={[0.1, 2.2, 0]} material={stone} castShadow><dodecahedronGeometry args={[0.13, 0]} /></mesh>
        {/* khata: a flat scarf band round the neck (0.12 thick), two ends trailing */}
        <mesh position={[0.02, 1.62, 0]} rotation={[0.05, 0, 0.06]} material={white}><cylinderGeometry args={[0.55, 0.57, 0.12, 10, 1, true]} /></mesh>
        <mesh position={[0.34, 1.32, 0.42]} rotation={[0.12, 0.7, -0.1]} material={white}><planeGeometry args={[0.16, 0.6]} /></mesh>
        <mesh position={[0.05, 1.34, 0.54]} rotation={[0.1, 0.1, 0.08]} material={white}><planeGeometry args={[0.14, 0.52]} /></mesh>
      </group>
    );
  }

  /* ---------- golden fence cage with spear tips: low wide rectangle ---------- */
  function Cage() {
    const M = useM();
    const gold = M.plain(GOLD, { roughness: 0.4, metalness: 0.55 });
    const items = useMemo(() => {
      const bars = []; const tips = []; const posts = []; const fin = [];
      const run = (n, half, fix, alongX) => {
        for (let i = 1; i < n; i += 1) {
          const u = -half + (i * 2 * half) / n;
          const q = alongX ? [u, fix] : [fix, u];
          bars.push({ p: [q[0], 0.65, q[1]] }); tips.push({ p: [q[0], 1.38, q[1]] });
        }
      };
      run(10, HX, HZ, true); run(10, HX, -HZ, true); run(7, HZ, HX, false); run(7, HZ, -HX, false);
      [[-HX, -HZ], [HX, -HZ], [HX, HZ], [-HX, HZ], [0, HZ], [0, -HZ], [-HX / 2, HZ], [HX / 2, HZ], [-HX / 2, -HZ], [HX / 2, -HZ], [HX, 0], [-HX, 0]].forEach(([a, b]) => {
        posts.push({ p: [a, 0.75, b] }); fin.push({ p: [a, 1.55, b] });
      });
      return { bars, tips, posts, fin };
    }, []);
    const rails = [0.14, 1.2];
    return (
      <group position={[0, FLOOR, 0]}>
        <Inst geo={<cylinderGeometry args={[0.018, 0.018, 1.15, 5]} />} mat={gold} items={items.bars} />
        <Inst geo={<coneGeometry args={[0.035, 0.16, 5]} />} mat={gold} items={items.tips} />
        <Inst geo={<boxGeometry args={[0.1, 1.5, 0.1]} />} mat={gold} items={items.posts} shadow />
        <Inst geo={<sphereGeometry args={[0.07, 8, 6]} />} mat={gold} items={items.fin} />
        {rails.map((y, i) => (
          <group key={i}>
            <Box s={[2 * HX, 0.05, 0.05]} p={[0, y, HZ]} m={gold} cast={false} />
            <Box s={[2 * HX, 0.05, 0.05]} p={[0, y, -HZ]} m={gold} cast={false} />
            <Box s={[0.05, 0.05, 2 * HZ]} p={[HX, y, 0]} m={gold} cast={false} />
            <Box s={[0.05, 0.05, 2 * HZ]} p={[-HX, y, 0]} m={gold} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- prayer flags strung corner to corner over the cage ---------- */
  function Flags() {
    const data = useMemo(() => {
      const top = 1.45 + FLOOR;
      const corners = [[-HX, top, HZ], [HX, top, HZ], [HX, top, -HZ], [-HX, top, -HZ]];
      const ropes = []; const flags = [];
      let k = 0;
      for (let s = 0; s < 4; s += 1) {
        const a = corners[s]; const b = corners[(s + 1) % 4];
        const mid = [(a[0] + b[0]) / 2, top - 0.16, (a[2] + b[2]) / 2];
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(mid[0], mid[1], mid[2]), new THREE.Vector3(...b));
        ropes.push(new THREE.TubeGeometry(curve, 14, 0.012, 4));
        const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
        const nf = s % 2 ? 6 : 9;
        for (let i = 0; i < nf; i += 1) {
          const t = (i + 0.7) / (nf + 0.4);
          const q = curve.getPoint(t);
          flags.push({ p: [q.x, q.y - 0.14, q.z], ry: ang + Math.PI / 2 + Math.sin(i * 1.7 + s) * 0.25, rz: Math.sin(i * 2.3 + s) * 0.12, c: FLAGC[k % 6] });
          k += 1;
        }
      }
      return { ropes, flags };
    }, []);
    const rope = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 1 }), []);
    const fm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: THREE.DoubleSide }), []);
    return (
      <group>
        {data.ropes.map((g, i) => <mesh key={i} geometry={g} material={rope} />)}
        <Inst geo={<planeGeometry args={[0.4, 0.3]} />} mat={fm} items={data.flags} />
      </group>
    );
  }

  /* ---------- shallow brick-walled enclosure with a short brick stair ---------- */
  function Pit() {
    const M = useM();
    const brick = M.mat('brick', 1, 0.2, { color: '#a86b4e' });
    const dark = M.mat('brick', 1, 0.2, { color: '#8a5038' });
    const cop = M.plain('#6a3a2a', { roughness: 0.9 });
    const floor = M.plain('#a9a08c', { roughness: 1 });
    const crack = M.plain('#5b564d', { roughness: 1 });
    const T = 0.3; const top = TOP; const wh = top - FLOOR; const yc = (top + FLOOR) / 2;
    const LX = 2 * PX + 2 * T;
    const sy = (i) => [-0.03, -0.1, -0.17][i];
    return (
      <group>
        <Box s={[2 * PX, 0.1, 2 * PZ]} p={[0, FLOOR - 0.05, 0]} m={floor} cast={false} />
        {[[-1.6, -0.4, 1.4, 0.1], [0.4, 0.6, 0.1, 1.3], [1.2, -1.2, 1.6, 0.1], [-0.3, 0.2, 0.08, 1.0], [-2.0, 1.2, 0.9, 0.08], [1.8, 0.2, 0.08, 0.9], [0.9, -0.6, 1.1, 0.07], [-1.0, -1.7, 0.07, 0.6]].map(([x, z, w, d], i) => (
          <Box key={i} s={[w, 0.012, d]} p={[x, FLOOR + 0.006, z]} m={crack} cast={false} />
        ))}
        <Box s={[LX, wh, T]} p={[0, yc, -PZ - T / 2]} m={brick} />
        <Box s={[LX, wh, T]} p={[0, yc, PZ + T / 2]} m={brick} />
        <Box s={[T, wh, 2 * PZ]} p={[-PX - T / 2, yc, 0]} m={brick} />
        <Box s={[T, wh, 2 * PZ - 1.4]} p={[PX + T / 2, yc, -0.7]} m={brick} />
        <Box s={[LX + 0.1, 0.06, T + 0.1]} p={[0, top + 0.02, -PZ - T / 2]} m={cop} cast={false} />
        <Box s={[LX + 0.1, 0.06, T + 0.1]} p={[0, top + 0.02, PZ + T / 2]} m={cop} cast={false} />
        <Box s={[T + 0.1, 0.06, 2 * PZ]} p={[-PX - T / 2, top + 0.02, 0]} m={cop} cast={false} />
        <Box s={[T + 0.1, 0.06, 2 * PZ - 1.4]} p={[PX + T / 2, top + 0.02, -0.7]} m={cop} cast={false} />
        {/* brick stair: four 0.2 m steps down at the front-right corner, with cheek walls */}
        {Array.from({ length: SN }, (_, i) => {
          const tr = SW / SN; const topY = FLOOR + 0.2 * (SN - i) + 0.03; const h = topY - FLOOR;
          const x = PX + SW - tr * (i + 0.5);
          return (
            <group key={i}>
              <Box s={[tr, h, 1.2]} p={[x, FLOOR + h / 2, PZ - 0.8]} m={dark} />
              <Box s={[tr + 0.02, 0.03, 1.22]} p={[x, topY + 0.012, PZ - 0.8]} m={cop} cast={false} />
            </group>
          );
        })}
        <Box s={[SW, wh, 0.2]} p={[PX + SW / 2, yc, PZ - 0.1]} m={brick} />
        <Box s={[SW, wh, 0.2]} p={[PX + SW / 2, yc, PZ - 1.5]} m={brick} />
        <Box s={[0.5, wh, T]} p={[PX + SW / 2 + 0.05, yc, PZ + T / 2]} m={brick} />
        {/* a few loose bricks tumbled beside the stair */}
        {[[PX + 1.5, PZ + 0.5, 0.4], [PX + 1.9, PZ - 0.5, 1.2], [-PX - 0.9, PZ + 0.4, 0.2]].map(([x, z, r], i) => (
          <Box key={i} s={[0.3, 0.07, 0.15]} p={[x, 0.03, z]} r={[0, r, 0]} m={dark} />
        ))}
      </group>
    );
  }

  /* ---------- the buried round brick stupa: a smooth grassy hump with a few ragged brick patches ---------- */
  function Mound() {
    const grass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b2a24f', roughness: 1 }), []);
    const geo = useMemo(() => {
      const pts = []; const n = 36;
      for (let i = n; i >= 0; i -= 1) { const d = (i / n) * (MR + 0.3); pts.push(new THREE.Vector2(d, hump(d) - (d > MR ? 0.05 : 0))); }
      return new THREE.LatheGeometry(pts, 56);
    }, []);
    // short curved stretch of stepped red-brick wall built into the slope, facing the enclosure
    const courses = useMemo(() => {
      const out = []; const r = rng(77); const a0 = 0.4; const a1 = 1.7; const nseg = 11;
      const cols = ['#9C5B3B', '#8a4f33', '#a9653f', '#94563a'];
      for (let k = 0; k < 5; k += 1) {
        const rr = 6.7 - 0.25 * k;
        const base = hump(7.1) - 0.06;
        for (let j = 0; j < nseg; j += 1) {
          if (k > 2 && (j < 2 || j > nseg - 3 || k === 4 && j % 2)) continue;
          const a = a0 + ((j + 0.5) / nseg) * (a1 - a0);
          const len = (2 * rr * Math.sin((a1 - a0) / nseg / 2)) + 0.08;
          out.push({ p: [Math.sin(a) * rr, base + 0.17 * k + 0.09, Math.cos(a) * rr], s: [len, 0.17, 0.8], ry: a, c: cols[Math.floor(r() * 4)] });
        }
      }
      return out;
    }, []);
    const tufts = useMemo(() => {
      const r = rng(8); const out = [];
      for (let i = 0; i < 120; i += 1) {
        const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * (MR - 0.3);
        out.push({ p: [Math.cos(a) * d, hump(d) + 0.1, Math.sin(a) * d], s: [1, 0.8 + r() * 1.2, 1], c: r() > 0.4 ? '#7f9440' : '#d2bc62' });
      }
      return out;
    }, []);
    return (
      <group position={[MOUND[0], 0, MOUND[1]]}>
        <mesh geometry={geo} material={grass} castShadow receiveShadow />
        <Inst geo={<boxGeometry args={[1, 1, 1]} />} mat={new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 })} items={courses} shadow />
        <Inst geo={<coneGeometry args={[0.06, 0.35, 4]} />} mat={new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 })} items={tufts} />
      </group>
    );
  }

  /* ---------- maroon information signboard on a green post, front-left ---------- */
  function Signboard() {
    const M = useM();
    const tex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 360;
      const g = c.getContext('2d');
      g.fillStyle = '#7a2a2c'; g.fillRect(0, 0, 512, 360);
      g.strokeStyle = '#c9a08a'; g.lineWidth = 6; g.strokeRect(10, 10, 492, 340);
      g.fillStyle = '#f2e6dc'; g.textAlign = 'center';
      g.font = 'bold 44px serif'; g.fillText('The Asoka Pillar', 256, 70);
      g.font = 'bold 40px "Nirmala UI", "Noto Sans Devanagari", sans-serif'; g.fillText('अशोक स्तम्भ', 256, 122);
      g.font = '22px serif'; g.textAlign = 'left';
      ['Erected by Emperor Asoka in 249 BC', 'to commemorate his pilgrimage', 'to the birth site of Krakuchhanda Buddha.', '', 'यो स्तम्भ सम्राट अशोकले आफ्नो', 'तीर्थयात्राको सम्झनामा बनाएका हुन्।'].forEach((t, i) => g.fillText(t, 36, 175 + i * 30));
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    }, []);
    return (
      <group position={[-3.7, 0, 3.5]} rotation={[0, 0.32, 0]}>
        <Cyl rt={0.045} rb={0.045} h={1.15} p={[0, 0.575, 0]} m={M.plain('#2f6b3a', { roughness: 0.6 })} seg={8} />
        <group position={[0, 1.2, 0.04]} rotation={[-0.38, 0, 0]}>
          <Box s={[1.4, 0.98, 0.05]} p={[0, 0, 0]} m={M.plain('#6d2428', { roughness: 0.7 })} />
          <mesh position={[0, 0, 0.03]}><planeGeometry args={[1.34, 0.94]} /><meshStandardMaterial map={tex} roughness={0.6} /></mesh>
        </group>
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Pit />
        <Stump />
        <Cage />
        <Flags />
        <Signboard />
        <Mound />
        <Frame s={[6.4, 2.2, 5.0]} p={[0.4, 0.75, 0.5]} />
      </group>
    );
  }

  /* ================= ENVIRONMENT ================= */
  function Umbrella({ p, s = 1, c = '#3e5c2d', seed = 1 }) {
    const M = useM();
    const r = rng(seed * 13);
    const leaf = M.plain(c, { roughness: 1 });
    const leaf2 = M.plain('#4f6e33', { roughness: 1 });
    const lobes = useMemo(() => Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + r();
      return [Math.cos(a) * 2.6 * (0.5 + r() * 0.6), 5.7 + r() * 0.8, Math.sin(a) * 2.6 * (0.5 + r() * 0.6), 2.0 + r() * 1.0];
    }), []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.28} rb={0.5} h={4.6} p={[0, 2.3, 0]} m={M.plain('#4d3a2b', { roughness: 1 })} seg={7} />
        <Cyl rt={0.12} rb={0.2} h={2} p={[1, 4.8, 0.3]} r={[0, 0, -0.9]} m={M.plain('#4d3a2b', { roughness: 1 })} seg={5} />
        <Ball rad={3.4} p={[0, 6, 0]} sc={[1.2, 0.62, 1.2]} m={leaf} />
        {lobes.map(([x, y, z, rd], i) => <Ball key={i} rad={rd} p={[x, y, z]} sc={[1.1, 0.7, 1.1]} m={i % 2 ? leaf2 : leaf} />)}
      </group>
    );
  }

  function BareTree({ p, s = 1 }) {
    const M = useM();
    const wood = M.plain('#5a4636', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.12} rb={0.25} h={5} p={[0, 2.5, 0]} m={wood} seg={6} />
        <Cyl rt={0.05} rb={0.1} h={3} p={[0.9, 5, 0]} r={[0, 0, -0.6]} m={wood} seg={5} />
        <Cyl rt={0.05} rb={0.1} h={2.6} p={[-0.8, 5, 0.2]} r={[0, 0, 0.7]} m={wood} seg={5} />
        <Ball rad={1.2} p={[0.1, 6.3, 0]} sc={[1.3, 0.7, 1]} m={M.plain('#6d7d3f', { roughness: 1 })} />
      </group>
    );
  }

  function Hut({ p, r = 0, s = 1, wall = '#c8b08a', roof = '#a8472f' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[7, 3, 5]} p={[0, 1.5, 0]} m={M.plain(wall, { roughness: 1 })} />
        <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.05, 1, 0.76]} material={M.plain(roof, { roughness: 0.9 })} castShadow><coneGeometry args={[5, 2.2, 4]} /></mesh>
      </group>
    );
  }

  function Pole({ p }) {
    const M = useM();
    const wire = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 7.6, 0), new THREE.Vector3(-14, 7.0, 3), new THREE.Vector3(-1.4, 7.6, 0), new THREE.Vector3(12, 7.0, -3)]), []);
    return (
      <group position={p}>
        <Cyl rt={0.1} rb={0.16} h={8} p={[0, 4, 0]} m={M.plain('#8f8a82', { roughness: 0.9 })} seg={8} />
        <Box s={[2.6, 0.1, 0.1]} p={[0, 7.6, 0]} m={M.plain('#4a463f')} />
        <lineSegments geometry={wire}><lineBasicMaterial color="#2a2622" /></lineSegments>
      </group>
    );
  }

  /** Irregular blob outline (for the pond and its mud bank). */
  const blob = (cx, cz, rx, rz, seed, n = 40) => {
    const r = rng(seed); const ph = [r() * 6, r() * 6, r() * 6];
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + 0.16 * Math.sin(2 * a + ph[0]) + 0.1 * Math.sin(3 * a + ph[1]) + 0.06 * Math.sin(5 * a + ph[2]);
      return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k];
    });
  };
  const shapeOf = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); s.closePath(); return s; };

  function Pond() {
    const M = useM();
    const bank = useMemo(() => new THREE.ShapeGeometry(shapeOf(blob(POND[0], POND[1], 24, 15, 5)), 1), []);
    const water = useMemo(() => new THREE.ShapeGeometry(shapeOf(blob(POND[0], POND[1], 20, 11.5, 5)), 1), []);
    const pads = useMemo(() => {
      const r = rng(31); const out = []; const flow = [];
      for (let i = 0; i < 90; i += 1) {
        const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * 0.8;
        const x = POND[0] + Math.cos(a) * 20 * d * 0.92; const z = POND[1] + Math.sin(a) * 11.5 * d * 0.92;
        out.push({ p: [x, 0.07, z], s: [0.7 + r() * 1.5, 1, 0.7 + r() * 1.5], c: r() > 0.3 ? '#5f8a3a' : '#7a9a45' });
        if (r() > 0.88) flow.push({ p: [x + 0.3, 0.2, z], s: 1, c: '#e8a2c0' });
      }
      return { out, flow };
    }, []);
    const mud = useMemo(() => {
      const r = rng(52);
      return Array.from({ length: 40 }, () => {
        const a = r() * Math.PI * 2; const k = 0.95 + r() * 0.35;
        return { p: [POND[0] + Math.cos(a) * 20.5 * k, 0.04, POND[1] + Math.sin(a) * 12 * k], s: [0.8 + r() * 1.8, 0.5 + r(), 1], rx: -Math.PI / 2, rz: r() * 3, c: r() > 0.5 ? '#4f4232' : '#8a7a5c' };
      });
    }, []);
    const stalks = useMemo(() => {
      const r = rng(9); return Array.from({ length: 70 }, () => {
        const a = r() * Math.PI * 2; const k = 0.9 + r() * 0.2;
        return { p: [POND[0] + Math.cos(a) * 21.5 * k, 0.55, POND[1] + Math.sin(a) * 12.5 * k], s: [1, 0.6 + r() * 0.8, 1], rz: (r() - 0.5) * 0.4, c: r() > 0.5 ? '#8c7a42' : '#6d6a35' };
      });
    }, []);
    return (
      <group>
        <mesh geometry={bank} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow><meshStandardMaterial color="#665641" roughness={1} polygonOffset polygonOffsetFactor={-1} /></mesh>
        <Inst geo={<circleGeometry args={[0.7, 7]} />} mat={new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 })} items={mud} />
        <mesh geometry={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}><meshStandardMaterial color="#5f7f94" roughness={0.3} metalness={0.2} polygonOffset polygonOffsetFactor={-2} /></mesh>
        <Inst geo={<cylinderGeometry args={[0.5, 0.5, 0.03, 9]} />} mat={M.plain('#ffffff', { roughness: 1 })} items={pads.out} />
        <Inst geo={<sphereGeometry args={[0.16, 7, 5]} />} mat={M.plain('#ffffff', { roughness: 0.8 })} items={pads.flow} />
        <Inst geo={<cylinderGeometry args={[0.02, 0.04, 1.1, 4]} />} mat={M.plain('#ffffff', { roughness: 1 })} items={stalks} />
        <Umbrella p={[POND[0] - 27, 0, POND[1] - 3]} s={0.9} seed={5} />
        <BareTree p={[POND[0] + 14, 0, POND[1] - 12]} s={1.2} />
      </group>
    );
  }

  function Ground() {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape(); s.absarc(0, 0, 110, 0, Math.PI * 2, false);
      const h = new THREE.Path();
      // enclosure (inner rectangle) plus the stair well, in shape space (y = -z)
      const pts = [[-PX, PZ], [PX, PZ], [PX, PZ - 0.2], [PX + SW, PZ - 0.2], [PX + SW, PZ - 1.4], [PX, PZ - 1.4], [PX, -PZ], [-PX, -PZ]];
      pts.forEach(([x, z], i) => (i ? h.lineTo(x, -z) : h.moveTo(x, -z)));
      h.closePath(); s.holes.push(h);
      return new THREE.ShapeGeometry(s, 48);
    }, []);
    const patches = useMemo(() => {
      const r = rng(4); const out = [];
      const spots = [[MOUND[0] - 2, MOUND[1] - 2, 30, 22], [MOUND[0] - 3, MOUND[1] + 9, 10, 6], [28, -26, 16, 10], [-40, 30, 16, 12], [36, 24, 12, 10], [-8, 14, 9, 7]];
      spots.forEach(([x, z, w, d], i) => out.push({ p: [x, 0.025, z], s: [w, 1, d], ry: r() * 0.6 - 0.3, c: ['#b9a95c', '#aab45d', '#96ab50', '#8ea54a', '#9bb04f', '#8aa148'][i] }));
      return out;
    }, []);
    const tufts = useMemo(() => {
      const r = rng(21); const out = [];
      for (let i = 0; i < 260; i += 1) {
        const a = r() * Math.PI * 2; const d = 3.8 + (i < 150 ? Math.sqrt(r()) * 9 : Math.sqrt(r()) * 34);
        const x = Math.cos(a) * d; const z = Math.sin(a) * d;
        if (Math.hypot(x - MOUND[0], z - MOUND[1]) < MR + 0.5) continue;
        if (Math.abs(x) < PX + SW + 0.3 && Math.abs(z) < PZ + 0.5) continue;
        out.push({ p: [x, 0.16, z], s: [1 + r() * 0.8, 0.8 + r() * 1.2, 1 + r() * 0.8], ry: r() * 3, c: Math.hypot(x - MOUND[0], z - MOUND[1]) < MR + 8 ? (r() > 0.4 ? '#cdb75e' : '#aa9a4a') : (r() > 0.4 ? '#6f8f3a' : '#8aa447') });
      }
      return out;
    }, []);
    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(150, 24, 16);
      const p = g.attributes.position; const cols = [];
      const hz = new THREE.Color('#dde4e6'); const tp = new THREE.Color('#8fb3d6'); const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) { const t = Math.pow(Math.max(0, p.getY(i) / 150), 0.6); c.copy(hz).lerp(tp, t); cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, []);
    return (
      <group>
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={M.plain('#7f9a45', { roughness: 1 })} />
        <Inst geo={<planeGeometry args={[1, 1]} />} mat={new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 })} items={patches.map((q) => ({ ...q, rx: -Math.PI / 2 }))} />
        <mesh geometry={sky}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
        <Inst geo={<coneGeometry args={[0.05, 0.2, 4]} />} mat={M.plain('#ffffff', { roughness: 1 })} items={tufts} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const line = useMemo(() => Array.from({ length: 14 }, (_, i) => {
      const a = 0.15 + i * 0.47; const rad = 52 + (i % 3) * 4;
      return [Math.round(rad * Math.cos(a)), Math.round(rad * Math.sin(a)), 0.95 + 0.06 * (i % 4), ['#3e5c2d', '#365428', '#3b5a2b', '#44602f'][i % 4]];
    }), []);
    return (
      <group>
        <Ground />
        <Pond />
        {/* scattered broad umbrella trees at the edges of the fields */}
        <Umbrella p={[-34, 0, 8]} s={1.05} seed={2} />
        <Umbrella p={[26, 0, -40]} s={1.2} seed={3} c="#365428" />
        <Umbrella p={[-8, 0, -44]} s={1.0} seed={4} />
        <Umbrella p={[44, 0, -22]} s={1.1} seed={6} c="#3b5a2b" />
        <Umbrella p={[8, 0, -58]} s={1.3} seed={7} />
        <Umbrella p={[58, 0, 12]} s={1.1} seed={8} />
        <Umbrella p={[-56, 0, -40]} s={1.2} seed={9} c="#365428" />
        <Umbrella p={[-22, 0, 46]} s={1.15} seed={10} />
        <Umbrella p={[30, 0, 50]} s={1.0} seed={11} c="#3b5a2b" />
        <Umbrella p={[62, 0, -50]} s={1.2} seed={12} />
        <Umbrella p={[-70, 0, 18]} s={1.3} seed={14} />
        <BareTree p={[16, 0, -30]} s={1.0} />
        {/* low tree line round the horizon */}
        {line.map(([x, z, s, c], i) => <Umbrella key={i} p={[x, 0, z]} s={s} seed={20 + i} c={c} />)}
        {/* a sparse far village: low red-roofed houses and haystacks */}
        <Hut p={[44, 0, -64]} r={0.2} s={1.1} />
        <Hut p={[54, 0, -60]} r={-0.3} s={1.0} wall="#d8c9a5" />
        <Hut p={[66, 0, -68]} r={0.1} s={1.15} wall="#c4a984" />
        <Hut p={[30, 0, -72]} r={0.6} s={1.05} wall="#d3bd96" />
        <Hut p={[-48, 0, -64]} r={-0.2} s={1.1} />
        <Hut p={[-64, 0, -60]} r={0.4} s={1.0} wall="#d8c9a5" />
        {[[44, -52], [58, -52], [-52, -54]].map(([x, z], i) => <Cyl key={i} rt={0.5} rb={1.6} h={3.4} p={[x, 1.7, z]} m={M.plain('#c9a85a', { roughness: 1 })} seg={8} />)}
        <Pole p={[-62, 0, -44]} />
      </group>
    );
  }

  return { gotihawa: { Main, Env } };
}
