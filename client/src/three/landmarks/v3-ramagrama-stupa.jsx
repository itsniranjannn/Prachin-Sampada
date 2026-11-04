// Ramagrama Stupa (Ramgram, Parasi). The unexcavated relic stupa is today only a smooth grass-covered earthen mound
// (~24 m across, ~7.5 m high) with a huge bodhi tree hung with prayer flags and ribbons on its flank, on the flat Terai
// plain. 1 unit = 1 m. Mound at the origin; tree at the left-front foot; the road/gate come in from +z on the right.
export default function make(K) {
  const { useM, Box, Cyl, Ball, THREE, useMemo, Frame } = K;

  const R = 12; // mound radius
  const H = 5.8; // mound height
  const gh = (x, z) => {
    const u = Math.hypot(x, z) / R; if (u >= 1) return 0;
    const a = Math.atan2(z, x);
    const lump = 1 + 0.07 * Math.cos(a - 0.9) * u + 0.05 * Math.sin(a * 2 + 0.4) * u + 0.03 * Math.sin(x * 0.55 + 1) * Math.cos(z * 0.5);
    return H * Math.pow(1 - u * u, 0.9) * lump;
  };
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const TREE = [-9.6, 4.6]; // bodhi tree foot (x,z)
  const TY = gh(TREE[0], TREE[1]) - 0.15;
  const FLAGC = ['#2a62c9', '#f4f4ef', '#d6262b', '#2f9a4a', '#f2c22b', '#f08a1c'];
  const GOLD = '#d9a21b';

  /* ---------- the mound ---------- */
  function Mound() {
    const geo = useMemo(() => {
      const NR = 44; const NS = 96;
      const pos = []; const col = []; const idx = [];
      const c1 = new THREE.Color('#3a7a2c'); const c2 = new THREE.Color('#2c4a20'); const c3 = new THREE.Color('#6f9a38');
      const c4 = new THREE.Color('#9a7a3a'); const c5 = new THREE.Color('#5f9a34'); const tmp = new THREE.Color();
      for (let i = 0; i <= NR; i += 1) {
        const r = (i / NR) * R * 1.02;
        for (let j = 0; j <= NS; j += 1) {
          const a = (j / NS) * Math.PI * 2;
          const x = Math.cos(a) * r; const z = Math.sin(a) * r;
          const wob = 1 + 0.025 * Math.sin(a * 3 + 1) + 0.015 * Math.sin(a * 5);
          const y = gh(x / wob, z / wob);
          pos.push(x, y, z);
          const n = Math.sin(x * 0.9 + z * 0.4) * Math.sin(z * 1.1 - x * 0.3) + 0.5 * Math.sin(x * 2.3) * Math.sin(z * 2.1);
          const shade = Math.sin(x * 0.25 + 1) * 0.5 + 0.5;
          tmp.copy(c2).lerp(c1, 0.55 + 0.25 * shade + 0.12 * n);
          tmp.lerp(c3, Math.max(0, n - 0.5) * 0.25);
          const p2 = Math.sin(x * 0.7 + 3) * Math.sin(z * 0.6 + 1) * Math.sin(x * 0.2 - z * 0.3);
          const p3 = Math.sin(x * 1.3 + 2) * Math.sin(z * 1.7 - 1) * Math.sin(x * 0.4 + z * 0.35);
          if (p3 > 0.45 && r > 2) tmp.lerp(c4, Math.min(0.7, (p3 - 0.45) * 2.4));
          if (p2 > 0.25) tmp.lerp(c4, Math.min(0.4, (p2 - 0.25) * 1.2));
          tmp.lerp(c4, Math.max(0, y / H - 0.6) * 0.8);
          tmp.multiplyScalar(1 + 0.07 * Math.sin(r * 1.5));
          tmp.lerp(c5, Math.max(0, Math.sin(x * 0.45 - z * 0.3) * Math.sin(z * 0.5 + x * 0.2)) * 0.3);
          col.push(tmp.r, tmp.g, tmp.b);
        }
      }
      for (let i = 0; i < NR; i += 1) for (let j = 0; j < NS; j += 1) {
        const a = i * (NS + 1) + j; const b = a + NS + 1;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={1} metalness={0} /></mesh>;
  }

  /* ---------- the bodhi tree ---------- */
  const CROWN = [3.2, -1.2]; // crown centre relative to the foot: leans over the mound's shoulder
  const LIMBS = [[7.5, 7.4, -3.0, 1], [-1.5, 7.2, -6.5, 1], [4.0, 7.0, 5.5, 1], [-6.5, 6.6, 2.5, 1], [10.5, 6.4, 1.0, 0], [1.5, 7.6, 1.0, 0], [-3.5, 6.8, -3.5, 0], [6.5, 7.0, -7.0, 0], [-8.0, 6.2, -2.0, 0]];
  function Bodhi() {
    const M = useM();
    const bark = M.plain('#6b5440', { roughness: 1 });
    const leaves = useMemo(() => {
      const r = rng(17); const out = [];
      const cols = ['#5b7a2e', '#4f6e28', '#6d8a34', '#7a6a2a', '#5b7a2e', '#4a6624', '#8a5a2c', '#7a6a2a', '#556f2a', '#9a5a30', '#5b7a2e', '#6a7a30'];
      for (let i = 0; i < 170; i += 1) {
        const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * 10.4;
        const edge = d / 10.4;
        const x = CROWN[0] + Math.cos(a) * d; const z = CROWN[1] + Math.sin(a) * d * 0.9;
        const y = 5.3 + 4.6 * Math.sqrt(Math.max(0, 1 - edge * edge)) + (r() - 0.5) * 1.8;
        const rad = 1.3 + r() * 1.1 + (1 - edge) * 0.5;
        out.push({ p: [x, Math.max(5.2, y), z], rad, c: cols[i % cols.length], s: [1.6, 0.6 + r() * 0.2, 1.6] });
      }
      return out;
    }, []);
    const limbs = useMemo(() => LIMBS.map((q) => {
      const from = new THREE.Vector3(0, 3.4, 0); const to = new THREE.Vector3(q[0], q[1], q[2]);
      const mid = from.clone().add(to).multiplyScalar(0.5); mid.y += 0.4;
      const dir = to.clone().sub(from); const len = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      return { mid: mid.toArray(), len, quat: quat.toArray(), thick: q[3] };
    }), []);
    return (
      <group position={[TREE[0], TY, TREE[1]]}>
        {/* thick knotted, buttressed trunk */}
        <Cyl rt={1.2} rb={1.8} h={2.2} p={[0, 1.1, 0]} m={bark} seg={10} />
        <Cyl rt={0.9} rb={1.25} h={2.4} p={[0.2, 3.1, 0]} m={bark} seg={9} r={[0.04, 0, -0.08]} />
        {[[1.3, 0.4, 0], [-1.2, 0.35, 0.8], [0.2, 0.3, 1.4], [-0.3, 0.3, -1.4], [1.0, 0.3, -1.1], [-1.4, 0.3, -0.6]].map((q, i) => (
          <Cyl key={i} rt={0.28} rb={0.6} h={1.7} p={[q[0], 0.6, q[2]]} r={[q[2] * 0.6, 0, -q[0] * 0.6]} m={bark} seg={6} />
        ))}
        <Ball rad={0.95} p={[0.9, 2.6, 0.7]} m={bark} />
        <Ball rad={0.8} p={[-0.8, 3.7, -0.5]} m={bark} />
        <Ball rad={0.7} p={[0.5, 4.4, 0.6]} m={bark} />
        {limbs.map((l, i) => (
          <mesh key={i} position={l.mid} quaternion={l.quat} material={bark}><cylinderGeometry args={[l.thick ? 0.3 : 0.18, l.thick ? 0.75 : 0.42, l.len, 7]} /></mesh>
        ))}
        {leaves.map((l, i) => <Ball key={i} rad={l.rad} p={l.p} sc={l.s} m={M.plain(l.c, { roughness: 1 })} />)}
      </group>
    );
  }

  /* flags and ribbons: merged vertex-coloured quads */
  const POLES = [[2.6, 14.4, 4.8], [-21, -2, 4.8], [-5.5, 11.8, 4.2], [-2.2, -2, 4.4], [-16.5, 14, 4.6], [-19, -11, 4.6], [-9, -15, 4.8], [7, 12.5, 4.4], [-13.5, 12, 4.2]];
  const poleTop = (q) => [q[0], gh(q[0], q[1]) + q[2], q[1]];
  function FlagStrings() {
    const { fg, rg } = useMemo(() => {
      const pos = []; const col = []; const rpos = []; const rcol = [];
      const c = new THREE.Color();
      const quad = (arr, carr, a, b, hgt, color) => {
        c.set(color);
        const v = [[a[0], a[1], a[2]], [b[0], b[1], b[2]], [b[0], b[1] - hgt, b[2]], [a[0], a[1], a[2]], [b[0], b[1] - hgt, b[2]], [a[0], a[1] - hgt, a[2]]];
        v.forEach((q) => { arr.push(q[0], q[1], q[2]); carr.push(c.r, c.g, c.b); });
      };
      const rcols = ['#D9473B', '#D9473B', '#D9473B', '#f2c22b', '#f4f4ef', '#D9473B'];
      const base = [TREE[0], TY, TREE[1]];
      POLES.forEach((pl, s) => {
        const t = poleTop(pl);
        const ang = Math.atan2(t[2] - TREE[1], t[0] - TREE[0]);
        const f = [TREE[0] + Math.cos(ang) * 1.6, TY + 4.2 + (s % 3) * 0.7, TREE[1] + Math.sin(ang) * 1.6];
        const len = Math.hypot(t[0] - f[0], t[1] - f[1], t[2] - f[2]);
        const n = Math.max(8, Math.round(len / 0.66));
        const r = rng(40 + s);
        const pt = (u) => [f[0] + (t[0] - f[0]) * u, f[1] + (t[1] - f[1]) * u - Math.sin(u * Math.PI) * (0.9 + len * 0.045), f[2] + (t[2] - f[2]) * u];
        for (let i = 0; i < n; i += 1) quad(pos, col, pt((i + 0.06) / n), pt((i + 0.94) / n), 0.45, FLAGC[(i + s) % 6]);
        for (let i = 0; i < 6; i += 1) {
          const a = pt(0.03 + i * 0.02);
          quad(rpos, rcol, a, [a[0] + 0.12, a[1], a[2] + 0.1], 0.9 + r() * 1.3, rcols[Math.floor(r() * 6)]);
        }
      });
      // dense ribbons on trunk and limbs
      const r = rng(9);
      for (let i = 0; i < 70; i += 1) {
        const a = r() * Math.PI * 2; const d = 1.2 + r() * 0.9; const y = base[1] + 0.8 + r() * 3.8;
        const p0 = [base[0] + Math.cos(a) * d, y, base[2] + Math.sin(a) * d];
        quad(rpos, rcol, p0, [p0[0] + 0.14 * Math.sin(a), p0[1] + 0.02, p0[2] - 0.14 * Math.cos(a)], 0.8 + r() * 1.5, rcols[Math.floor(r() * 6)]);
      }
      LIMBS.forEach((q, li) => {
        for (let k = 0; k < 8; k += 1) {
          const u = 0.3 + r() * 0.65;
          const p0 = [base[0] + q[0] * u, base[1] + 3.4 + (q[1] - 3.4) * u + 0.15, base[2] + q[2] * u];
          quad(rpos, rcol, p0, [p0[0] + 0.12, p0[1], p0[2] + 0.1], 0.7 + r() * 1.7, rcols[Math.floor(r() * 6)]);
        }
      });
      const mk = (p, cc) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
        g.computeVertexNormals();
        return g;
      };
      return { fg: mk(pos, col), rg: mk(rpos, rcol) };
    }, []);
    return (
      <group>
        <mesh geometry={fg}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
        <mesh geometry={rg}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
      </group>
    );
  }

  function Poles() {
    const M = useM();
    const wood = M.plain('#7a5a3a', { roughness: 1 });
    return (
      <group>
        {POLES.map((q, i) => <Cyl key={i} rt={0.07} rb={0.11} h={q[2]} p={[q[0], gh(q[0], q[1]) + q[2] / 2, q[1]]} m={wood} seg={6} />)}
      </group>
    );
  }

  /* low fence, path and a small platform */
  function Precinct() {
    const M = useM();
    const rail = M.plain('#b5b0a2', { roughness: 0.9 });
    const posts = useMemo(() => Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2; return [Math.cos(a) * 14.6, Math.sin(a) * 14.6];
    }), []);
    const path = useMemo(() => new THREE.RingGeometry(13.6, 14.4, 96, 1), []);
    return (
      <group>
        <mesh geometry={path} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} receiveShadow>
          <meshStandardMaterial color="#7fae48" roughness={1} />
        </mesh>
        {posts.map((q, i) => <Cyl key={i} rt={0.05} rb={0.06} h={0.8} p={[q[0], 0.4, q[1]]} m={rail} seg={5} />)}
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[14.6, 0.025, 5, 120]} /><primitive object={rail} attach="material" /></mesh>
        {/* minimal prayer platform */}
        <Box s={[2.4, 0.22, 1.8]} p={[10.2, 0.11, 9.8]} r={[0, -0.78, 0]} m={M.plain('#aaa69c', { roughness: 0.95 })} />
        <Frame s={[28, 13, 24]} p={[-2, 4.5, 0]} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Mound />
        <Bodhi />
        <FlagStrings />
        <Poles />
        <Precinct />
      </group>
    );
  }

  /* =================== ENVIRONMENT =================== */
  function Inst({ geo, mat, items }) {
    const ref = K.useRef();
    K.useEffect(() => {
      const o = new THREE.Object3D(); const cc = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(...it.p);
        if (Array.isArray(it.s)) o.scale.set(...it.s); else o.scale.setScalar(it.s || 1);
        o.rotation.set(0, it.ry || 0, 0); o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) { cc.set(it.c); ref.current.setColorAt(i, cc); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[null, null, items.length]} frustumCulled={false} castShadow>{geo}<primitive object={mat} attach="material" /></instancedMesh>;
  }

  function Fields() {
    const patches = useMemo(() => {
      const r = rng(5); const out = [];
      const cols = ['#7da23c', '#8cab40'];
      for (let i = 0; i < 9; i += 1) {
        const a = r() * Math.PI * 2; const d = 38 + r() * 30;
        out.push({ p: [Math.cos(a) * d, 0.02 + i * 0.0006, Math.sin(a) * d], s: [22 + r() * 14, 16 + r() * 12], ry: Math.floor(r() * 3) * 0.5, c: cols[Math.floor(r() * cols.length)] });
      }
      return out;
    }, []);
    return (
      <group>
        {patches.map((q, i) => (
          <mesh key={i} position={q.p} rotation={[-Math.PI / 2, 0, q.ry]} receiveShadow>
            <planeGeometry args={q.s} /><meshStandardMaterial color={q.c} roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }

  function Grove({ items }) {
    const M = useM();
    const trunk = M.plain('#5a4632', { roughness: 1 });
    return (
      <group>
        {items.map((t, i) => (
          <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
            <Cyl rt={0.22} rb={0.38} h={4.2} p={[0, 2.1, 0]} m={trunk} seg={6} />
            <Ball rad={2.9} p={[0, 6, 0]} sc={[1.2, 0.95, 1.2]} m={M.plain(t.c, { roughness: 1 })} />
            <Ball rad={2.1} p={[1.7, 5.1, 0.6]} m={M.plain(t.c2, { roughness: 1 })} />
            <Ball rad={2.0} p={[-1.5, 5.3, -0.8]} m={M.plain(t.c, { roughness: 1 })} />
          </group>
        ))}
      </group>
    );
  }

  function Palm({ x, z, s = 1, lean = 0.1 }) {
    const M = useM();
    return (
      <group position={[x, 0, z]} scale={s}>
        <Cyl rt={0.22} rb={0.34} h={9} p={[0, 4.5, 0]} r={[0, 0, lean]} m={M.plain('#7a6a52', { roughness: 1 })} seg={6} />
        <group position={[-lean * 9, 9, 0]}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} rotation={[0.5, (i / 8) * Math.PI * 2, 0]} position={[0, 0, 0]} material={M.plain('#3e7a2c', { roughness: 1 })}>
              <coneGeometry args={[0.45, 4.6, 4]} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  function Gate() {
    const M = useM();
    const white = M.plain('#f3f1ea', { roughness: 0.7 });
    const orange = M.plain('#e8851c', { roughness: 0.7 });
    const black = M.plain('#1a1612', { roughness: 0.8 });
    const gold = M.gold;
    const gable = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-3.7, 0); sh.lineTo(3.7, 0); sh.quadraticCurveTo(1.5, 0.5, 0, 1.2); sh.quadraticCurveTo(-1.5, 0.5, -3.7, 0);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false });
    }, []);
    const Pillar = ({ x }) => (
      <group position={[x, 0, 0]}>
        <Box s={[1.5, 7.4, 1.5]} p={[0, 3.7, 0]} m={white} />
        <Box s={[1.62, 0.9, 1.62]} p={[0, 0.45, 0]} m={black} />
        <Box s={[1.62, 0.22, 1.62]} p={[0, 1.0, 0]} m={orange} />
        {[3.0, 5.0].map((y, i) => <Box key={i} s={[1.62, 0.2, 1.62]} p={[0, y + 1.2 * 0, 0]} m={orange} />)}
        {[2.0, 3.9, 5.8].map((y, i) => <Box key={i} s={[0.28, 1.0, 0.06]} p={[0, y, 0.77]} m={black} />)}
        <Box s={[1.62, 0.22, 1.62]} p={[0, 6.6, 0]} m={orange} />
        <Box s={[1.5, 0.8, 1.5]} p={[0, 7.15, 0]} m={black} />
        <Box s={[1.7, 0.2, 1.7]} p={[0, 7.65, 0]} m={white} />
        <mesh position={[0, 8.0, 0]} material={gold}><coneGeometry args={[0.32, 0.85, 10]} /></mesh>
        <Ball rad={0.2} p={[0, 8.5, 0]} m={gold} />
      </group>
    );
    return (
      <group>
        <Pillar x={-3.7} /><Pillar x={3.7} />
        <Box s={[7.6, 0.8, 0.9]} p={[0, 7.0, 0]} m={black} />
        <Box s={[7.6, 0.14, 1.0]} p={[0, 6.52, 0]} m={orange} />
        <Box s={[7.6, 0.14, 1.0]} p={[0, 7.5, 0]} m={orange} />
        <mesh geometry={gable} position={[0, 7.5, -0.3]} material={white}></mesh>
        <mesh position={[0, 8.3, 0.4]} material={orange}><torusGeometry args={[0.42, 0.07, 5, 16, Math.PI]} /></mesh>
        <mesh position={[0, 7.7, 0.4]} material={black}><circleGeometry args={[0.35, 12]} /></mesh>
        <mesh position={[0, 8.9, 0]} material={gold}><coneGeometry args={[0.2, 0.6, 8]} /></mesh>
      </group>
    );
  }

  function Shrine() {
    const M = useM();
    const white = M.plain('#f1ece0', { roughness: 0.8 });
    return (
      <group>
        <Box s={[3.2, 0.4, 3.2]} p={[0, 0.2, 0]} m={white} />
        {[[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].map((q, i) => <Cyl key={i} rt={0.17} rb={0.2} h={2.6} p={[q[0], 1.7, q[1]]} m={white} seg={8} />)}
        <Box s={[3.0, 0.3, 3.0]} p={[0, 3.15, 0]} m={M.plain('#e8851c')} />
        <mesh position={[0, 3.3, 0]} material={M.gold} castShadow><sphereGeometry args={[1.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[0, 5.2, 0]} material={M.gold}><coneGeometry args={[0.16, 0.9, 8]} /></mesh>
        <Ball rad={0.45} p={[0, 1.1, 0]} sc={[1, 1.3, 0.9]} m={M.gold} />
        <Cyl rt={0.5} rb={0.6} h={0.3} p={[0, 0.55, 0]} m={M.gold} seg={10} />
        <pointLight position={[0, 1.8, 1.2]} intensity={5} distance={8} color="#ffb35a" />
      </group>
    );
  }

  function Houses() {
    const M = useM();
    const spots = [
      { p: [8.5, 0, 6], ry: -Math.PI / 2, w: 5, c: '#c9a58a', aw: '#2a6cc4' },
      { p: [9, 0, 15], ry: -Math.PI / 2, w: 6, c: '#d9cdb0', aw: '#1e5fb4' },
      { p: [-8.5, 0, -6], ry: Math.PI / 2, w: 6, c: '#cfc4a8', aw: null },
    ];
    return (
      <group>
        {spots.map((h, i) => (
          <group key={i} position={h.p} rotation={[0, h.ry, 0]}>
            <Box s={[h.w, 3.6, 5]} p={[0, 1.8, 0]} m={M.plain(h.c, { roughness: 1 })} />
            <Box s={[h.w + 0.6, 0.3, 5.6]} p={[0, 3.75, 0]} m={M.plain('#8a8378', { roughness: 1 })} />
            <Box s={[h.w * 0.5, 2.0, 0.1]} p={[0, 1.2, 2.55]} m={M.dark} />
            {h.aw && <Box s={[h.w, 0.12, 2.4]} p={[0, 2.6, 3.5]} r={[0.22, 0, 0]} m={M.plain(h.aw, { roughness: 0.9 })} />}
          </group>
        ))}
      </group>
    );
  }

  function River() {
    const M = useM();
    return (
      <group position={[-10, 0, -46]} rotation={[0, 2.21, 0]}>
        <Box s={[11, 0.1, 100]} p={[0, -0.03, 0]} m={M.plain('#b9a77d', { roughness: 1 })} />
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 100]} />
          <meshStandardMaterial color="#5f8fa0" roughness={0.2} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.CylinderGeometry(150, 150, 70, 48, 4, true);
      const p = g.attributes.position; const c = [];
      for (let i = 0; i < p.count; i += 1) {
        const t = (p.getY(i) + 35) / 70;
        c.push(0.78 + 0.1 * t, 0.84 + 0.05 * t, 0.88 + 0.04 * t, Math.max(0, 0.85 * (1 - t * 1.25)));
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 4));
      g.translate(0, 35, 0);
      return g;
    }, []);
    const clouds = useMemo(() => {
      const r = rng(3); const out = [];
      for (let k = 0; k < 9; k += 1) {
        const cx = -110 + k * 26 + r() * 10; const cz = -115 - r() * 25; const cy = 42 + r() * 22;
        for (let j = 0; j < 4; j += 1) out.push({ p: [cx + (j - 1.5) * 9 + r() * 4, cy + (j % 2) * 2 + r() * 2, cz + r() * 4], s: [11 + r() * 7, 3.4 + r() * 2, 5 + r() * 3] });
      }
      return out;
    }, []);
    return (
      <group>
        <mesh geometry={geo}><meshBasicMaterial vertexColors transparent side={THREE.BackSide} depthWrite={false} fog={false} /></mesh>
        {clouds.map((q, i) => <mesh key={i} position={q.p} scale={q.s}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#fbf9f4" transparent opacity={0.92} fog={false} /></mesh>)}
      </group>
    );
  }

  function Env() {
    const M = useM();
    const hills = useMemo(() => Array.from({ length: 9 }, (_, i) => {
      const a = -0.9 + i * 0.55; return { x: Math.sin(a) * -150 + 20, z: -Math.cos(a) * 150 - 30, w: 55 + (i % 3) * 20, h: 6 + (i % 4) * 2.5 };
    }).filter((h) => h.z < -35), []);
    const trees = useMemo(() => {
      const r = rng(77); const out = [];
      const gc = ['#2f5a24', '#3a6a28', '#274c1f', '#44762c'];
      // scattered tall trees on the plain
      for (let i = 0; i < 22; i += 1) {
        const a = r() * Math.PI * 2; const d = 28 + r() * 30;
        const x = Math.cos(a) * d; const z = Math.sin(a) * d;
        if (x > -6 && z > -2) continue;
        if (Math.hypot(x - 17, z + 27) < 20 || (x > 4 && z > -40 && z < 6)) continue;
        out.push({ x, z, s: 0.8 + r() * 0.7, c: gc[i % 4], c2: gc[(i + 1) % 4] });
      }
      return out;
    }, []);
    const line = useMemo(() => {
      const r = rng(31); const out = [];
      const gc = ['#27491f', '#2f5a24', '#223f1a', '#34612a'];
      for (let i = 0; i < 84; i += 1) {
        const a = i / 84 * Math.PI * 2; const d = 60 + r() * 4;
        const x = Math.cos(a) * d; const z = Math.sin(a) * d;
        if (z > 8) continue;
        out.push({ p: [x, 3.6 + r() * 1.2, z], rad: 5 + r() * 2.4, c: gc[i % 4] });
      }
      return out;
    }, []);
    const roadTrees = useMemo(() => {
      const r = rng(55); const out = [];
      const gc = ['#2f5a24', '#3a6a28', '#274c1f', '#44762c'];
      for (let i = 0; i < 12; i += 1) {
        const side = i % 2 ? 1 : -1; const lz = -12 + Math.floor(i / 2) * 9 + r() * 3;
        out.push({ x: side < 0 ? -(12 + r() * 2.5) : 13 + r() * 2.5, z: side < 0 ? -(14 + r() * 8) : lz + 8, s: 0.9 + r() * 0.5, c: gc[i % 4], c2: gc[(i + 1) % 4] });
      }
      return out;
    }, []);
    return (
      <group>
        {/* flat Terai lawn and plain */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><circleGeometry args={[110, 64]} /><meshStandardMaterial color="#5f8a34" roughness={1} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow><circleGeometry args={[32, 64]} /><meshStandardMaterial color="#3f8a2e" roughness={1} /></mesh>
        <Fields />
        <Sky />
        {/* faint hazy low hills */}
        {hills.map((h, i) => (
          <mesh key={i} position={[h.x, 0, h.z]} scale={[h.w, h.h, h.w * 0.5]}><sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#8da3ad" roughness={1} fog={false} /></mesh>
        ))}
        {/* river strip across the plain behind the mound */}
        <River />
        {/* continuous dark tree line on the horizon */}
        {line.map((t, i) => <Ball key={i} rad={t.rad} p={t.p} sc={[1.5, 1, 1.2]} m={M.plain(t.c, { roughness: 1 })} />)}
        {/* approach road, white-and-orange gate, shrine and houses: right-front backdrop */}
        <group position={[17, 0, -27]} rotation={[0, 0.3, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 14]} receiveShadow><planeGeometry args={[7.2, 36]} /><meshStandardMaterial color="#8f8062" roughness={1} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 14]} receiveShadow><planeGeometry args={[6, 36]} /><meshStandardMaterial color="#bfae88" roughness={1} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -13]} receiveShadow><planeGeometry args={[4, 12]} /><meshStandardMaterial color="#bfae88" roughness={1} /></mesh>
          <Gate />
          <group position={[0, 0, -11]}><Shrine /></group>
          <Houses />
          {[0, 1, 2].map((i) => <Cyl key={i} rt={0.1} rb={0.14} h={7} p={[4.2, 3.5, 6 + i * 12]} m={M.plain('#8d8a83', { roughness: 1 })} seg={6} />)}
          <Grove items={roadTrees} />
        </group>
        <Grove items={trees} />
        {[[-34, -10, -0.08], [8, -34, 0.1], [-14, -30, -0.1], [22, -30, 0.1], [-44, -22, 0.1]].map((q, i) => (
          <Palm key={i} x={q[0]} z={q[1]} s={1 + (i % 3) * 0.12} lean={q[2]} />
        ))}
      </group>
    );
  }

  return { 'ramagrama-stupa': { Main, Env } };
}
