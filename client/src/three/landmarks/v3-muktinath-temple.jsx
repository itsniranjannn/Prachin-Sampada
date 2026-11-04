// Muktinath Temple, Ranipauwa (Mustang). Small 3-tier dark-roofed pagoda rising out of a low whitewashed gabled building,
// two stone-edged pools in the paved yard, the arc dry-stone wall of 108 bull-head spouts behind, bare brown valley and snow peaks.
// Scale: roughly 0.33 units per metre. Compass bearing is deliberately not claimed.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Water, Diyo, PrayerFlags, THREE, useMemo, useRef, useEffect } = K;

  const TZ = -1.6; // temple centre z
  const WCZ = -4; // spout wall arc centre z
  const WRX = 8; // spout wall centre-line ellipse radii
  const WRZ = 4.5;
  const ERX = WRX - 0.13; const ERZ = WRZ - 0.14;
  const rad = (d) => (d * Math.PI) / 180;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* terrain height: flat yard, hill wrapping the spout-wall arc, valley sides, bare ridge behind */
  function H(x, z) {
    const ell = Math.hypot(x / ERX, (z - WCZ) / ERZ);
    const wz = sm(-1.3, -2.6, z);
    let h = wz * (sm(1.06, 1.13, ell) * 1.0 + Math.min(Math.max(0, ell - 1.06), 2.2) * 0.9);
    h += Math.min(Math.pow(Math.max(0, -z - 12), 1.1) * 0.11, 3.2);
    h += Math.pow(Math.max(0, Math.abs(x) - 11), 1.2) * 0.3;
    h += Math.max(0, z - 24) * 0.15;
    h += (1 - Math.abs(Math.sin(x * 0.17 + z * 0.06 + Math.sin(z * 0.2)))) * 2.2 * sm(-14, -34, z) + Math.max(0, Math.sin(x * 0.45 + 1.3) * Math.cos(z * 0.33)) * 0.8 * sm(-10, -30, z);
    h += (Math.abs(Math.sin(x * 0.9 + Math.sin(z * 0.15) * 2)) * 1.6 + Math.abs(Math.sin(x * 2.1 + z * 0.1)) * 0.5) * sm(-10, -26, z) * 0.9;
    const r = Math.hypot(x, z - 1.5);
    h += Math.sin(x * 0.9 + z * 0.5) * Math.cos(z * 0.7 - x * 0.3) * 0.1 * (1 + h * 0.3) * sm(6, 10, r);
    return h;
  }

  /* ---------- helpers ---------- */
  function Inst({ items, geo, mat, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(...it.p);
        o.rotation.set(...(it.r || [0, 0, 0]));
        o.scale.set(...(it.s || [1, 1, 1]));
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) ref.current.setColorAt(i, col.set(it.c));
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow={cast} receiveShadow frustumCulled={false}>
        {geo}
        {mat}
      </instancedMesh>
    );
  }
  const unitBox = <boxGeometry args={[1, 1, 1]} />;
  const whiteMatEl = <meshStandardMaterial color="#ffffff" roughness={0.92} />;

  function Tri({ p, ry = 0, w, h, color, dbl = true }) {
    const g = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
      return new THREE.ShapeGeometry(s);
    }, [w, h]);
    return <mesh geometry={g} position={p} rotation={[0, ry, 0]}><meshStandardMaterial color={color} roughness={0.9} side={dbl ? THREE.DoubleSide : THREE.FrontSide} /></mesh>;
  }

  function Seg({ a, b, t = 0.03, m }) {
    const { pos, q, len } = useMemo(() => {
      const va = new THREE.Vector3(...a); const vb = new THREE.Vector3(...b);
      const d = vb.clone().sub(va); const l = d.length();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize());
      return { pos: va.clone().add(vb).multiplyScalar(0.5).toArray(), q: qq, len: l };
    }, [a, b]);
    return <mesh position={pos} quaternion={q} material={m}><boxGeometry args={[t, t, len]} /></mesh>;
  }

  /* ---------- the pagoda ---------- */
  function Tier({ w, h, y0, rw, rh, windows, M }) {
    const white = M.plain('#f4efe3', { roughness: 0.9 });
    const dk = M.plain('#3a281c', { roughness: 0.85 });
    const roofM = M.plain('#2b2019', { roughness: 0.85 });
    const gold = M.plain('#c9a23a', { roughness: 0.4, metalness: 0.6 });
    const yE = y0 + h; // eave height
    const dx = (rw - w) / 2;
    const dy = Math.min(dx * 0.95, 0.2);
    const L = Math.hypot(dx * 0.9, dy);
    const ang = -Math.atan2(dy, dx * 0.9);
    const hips = useMemo(() => {
      const out = [];
      const sag = 1.3; const lift = 0.12; const n = 5;
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
        for (let i = 0; i < n; i += 1) {
          const pt = (t) => [sx * (rw / 2) * (1 - t), yE + rh * Math.pow(t, sag) * 0 + rh * (Math.pow(t, sag) + lift * Math.pow(1 - t, 4.8)) + 0.012, sz * (rw / 2) * (1 - t)];
          out.push([pt(i / n), pt((i + 1) / n)]);
        }
      });
      return out;
    }, [rw, rh, yE]);
    const hw = w / 2;
    return (
      <group>
        <Box s={[w, h, w]} p={[0, y0 + h / 2, 0]} m={white} />
        {/* timber frame on every face */}
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            <Box s={[w + 0.03, 0.05, 0.05]} p={[0, y0 + 0.03, hw + 0.005]} m={dk} cast={false} />
            <Box s={[w + 0.03, 0.06, 0.05]} p={[0, yE - 0.03, hw + 0.005]} m={dk} cast={false} />
            {windows && [0].map((i) => (
              <group key={`w${i}`}>
                <Box s={[w * 0.22, h * 0.36, 0.03]} p={[i * w * 0.135, y0 + h * 0.74, hw + 0.012]} m={M.plain('#26180f')} cast={false} />
                <Box s={[w * 0.19, 0.025, 0.045]} p={[i * w * 0.135, y0 + h * 0.74 + h * 0.19, hw + 0.014]} m={dk} cast={false} />
              </group>
            ))}
            {/* diagonal eave struts (tunala) */}
            {[-0.3, 0, 0.3].map((i) => (
              <Box key={`s${i}`} s={[0.04, 0.04, L]} p={[i * w, yE - dy / 2 - 0.02, hw + dx * 0.45]} r={[ang, 0, 0]} m={dk} cast={false} />
            ))}
          </group>
        ))}
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => <Box key={`c${a}${b}`} s={[0.065, h, 0.065]} p={[a * hw, y0 + h / 2, b * hw]} m={dk} cast={false} />)}
        {/* dark roof with gilded trim */}
        <Roof w={rw} d={rw} h={rh} y={yE} m={roofM} sag={1.3} lift={0.12} fascia={false} />
        <Box s={[rw * 0.99, 0.1, rw * 0.99]} p={[0, yE - 0.02, 0]} m={M.plain('#1a130d')} cast={false} />
        <Box s={[rw, 0.05, 0.05]} p={[0, yE + 0.02, rw / 2]} m={gold} cast={false} />
        <Box s={[rw, 0.05, 0.05]} p={[0, yE + 0.02, -rw / 2]} m={gold} cast={false} />
        <Box s={[0.05, 0.05, rw]} p={[rw / 2, yE + 0.02, 0]} m={gold} cast={false} />
        <Box s={[0.05, 0.05, rw]} p={[-rw / 2, yE + 0.02, 0]} m={gold} cast={false} />
        {hips.map((h2, i) => <Seg key={i} a={h2[0]} b={h2[1]} t={0.035} m={gold} />)}
      </group>
    );
  }

  function Pagoda() {
    const M = useM();
    return (
      <group position={[0, 0, TZ]}>
        <Tier w={1.0} h={0.62} y0={0.95} rw={1.9} rh={0.38} M={M} />
        <Tier w={0.82} h={0.62} y0={1.65} rw={1.58} rh={0.34} windows M={M} />
        <Tier w={0.62} h={0.55} y0={2.35} rw={1.25} rh={0.3} windows M={M} />
        <Gajur y={3.18} s={0.6} />
      </group>
    );
  }

  /* low whitewashed gabled building with dark timber porch */
  function BaseBlock() {
    const M = useM();
    const white = M.plain('#f2eee3', { roughness: 0.9 });
    const dk = M.plain('#3a281c', { roughness: 0.85 });
    const metal = M.plain('#8b9093', { roughness: 0.55, metalness: 0.35 });
    const rib = M.plain('#767b7e', { roughness: 0.6, metalness: 0.3 });
    const lit = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b1e14', emissive: '#ff9a3c', emissiveIntensity: 0.08 }), []);
    const ribs = useMemo(() => {
      const out = [];
      for (let i = 0; i < 28; i += 1) { const x = -2.85 + i * 0.205; out.push({ p: [x, 0, 0], s: [0.018, 0.018, 1] }); }
      return out;
    }, []);
    const tilt = 0.31;
    const ridgeY = 0.85 + 1.15 * Math.tan(tilt);
    const sl = 1.15 / Math.cos(tilt);
    const cy = (0.85 + ridgeY) / 2 + 0.02;
    return (
      <group position={[0, 0, TZ]}>
        <Box s={[5.6, 0.85, 2.0]} p={[0, 0.425, 0]} m={white} />
        <Box s={[5.64, 0.14, 2.04]} p={[0, 0.07, 0]} m={M.plain('#7a2e2a', { roughness: 0.9 })} />
        {/* gable ends */}
        {[-1, 1].map((s) => <Tri key={s} p={[s * 2.801, 0.85, 0]} ry={Math.PI / 2} w={2.0} h={ridgeY - 0.85} color="#f2eee3" />)}
        {/* grey corrugated roof */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[5.95, 0.04, sl]} p={[0, cy, s * 0.575]} r={[s * tilt, 0, 0]} m={metal} />
            {ribs.map((r, i) => <Box key={i} s={[0.02, 0.025, sl]} p={[r.p[0], cy + 0.025, s * 0.575]} r={[s * tilt, 0, 0]} m={rib} cast={false} />)}
          </group>
        ))}
        <Box s={[5.95, 0.05, 0.1]} p={[0, ridgeY + 0.03, 0]} m={rib} />
        {/* windows and blue signboards on the front wall */}
        {[-2.35, -1.75, 1.75, 2.35].map((x) => (
          <group key={x}>
            <Box s={[0.36, 0.3, 0.04]} p={[x, 0.5, 1.01]} m={dk} cast={false} />
            <Box s={[0.28, 0.22, 0.045]} p={[x, 0.5, 1.012]} m={lit} cast={false} />
          </group>
        ))}
        {[-1.08, 1.08].map((x) => <Box key={x} s={[0.32, 0.4, 0.03]} p={[x, 0.46, 1.02]} m={M.plain('#2a5aa8')} cast={false} />)}
        {[-1.08, 1.08].map((x) => <Box key={`n${x}`} s={[0.22, 0.14, 0.032]} p={[x, 0.58, 1.025]} m={M.plain('#f4f1e6')} cast={false} />)}
        {/* dark timber gabled porch, projecting forward */}
        <group position={[0, 0, 1.0]}>
          <Box s={[1.5, 0.06, 0.75]} p={[0, 0.03, 0.34]} m={M.plain('#aaa294')} />
          {[-1, 1].map((s) => <Box key={s} s={[0.08, 0.72, 0.08]} p={[s * 0.68, 0.4, 0.66]} m={dk} />)}
          {[-1, 1].map((s) => <Box key={`b${s}`} s={[0.05, 0.6, 0.62]} p={[s * 0.7, 0.36, 0.34]} m={M.plain('#4a352a')} />)}
          <Box s={[1.52, 0.1, 0.1]} p={[0, 0.78, 0.68]} m={dk} />
          <Box s={[1.44, 0.07, 0.07]} p={[0, 0.5, 0.67]} m={dk} />
          <Tri p={[0, 0.8, 0.66]} w={1.48} h={0.5} color="#4a3626" ry={0} />
          <Tri p={[0, 0.8, 0.5]} w={1.1} h={0.34} color="#d9d2c0" ry={0} />
          {[-1, 1].map((s) => (
            <Box key={`r${s}`} s={[0.94, 0.04, 0.96]} p={[s * 0.4, 1.0, 0.34]} r={[0, 0, -s * 0.5]} m={M.plain('#3a2b20', { roughness: 0.85 })} />
          ))}
          <Box s={[0.05, 0.06, 0.96]} p={[0, 1.265, 0.34]} m={M.plain('#2b1f16')} />
          {/* door */}
          <Box s={[0.56, 0.62, 0.05]} p={[0, 0.37, 0.02]} m={M.plain('#2a1a10')} />
          <Box s={[0.4, 0.46, 0.055]} p={[0, 0.36, 0.025]} m={lit} />
          <Box s={[0.62, 0.05, 0.08]} p={[0, 0.7, 0.04]} m={M.gold} cast={false} />
          {/* two low steps */}
          <Box s={[1.0, 0.04, 0.22]} p={[0, 0.02, 0.84]} m={M.plain('#b5ad9c')} />
          <Box s={[0.92, 0.07, 0.14]} p={[0, 0.035, 0.74]} m={M.plain('#b5ad9c')} />
        </group>
      </group>
    );
  }

  /* ---------- pools, paving, courtyard ---------- */
  function Pool({ x, z, w, d }) {
    const M = useM();
    const cope = M.plain('#8f897c', { roughness: 0.95 });
    const t = 0.12;
    return (
      <group position={[x, 0, z]}>
        <Box s={[w + t * 2, 0.05, t]} p={[0, 0.025, d / 2 + t / 2]} m={cope} />
        <Box s={[w + t * 2, 0.05, t]} p={[0, 0.025, -d / 2 - t / 2]} m={cope} />
        <Box s={[t, 0.05, d]} p={[w / 2 + t / 2, 0.025, 0]} m={cope} />
        <Box s={[t, 0.05, d]} p={[-w / 2 - t / 2, 0.025, 0]} m={cope} />
        <Box s={[w, 0.03, d]} p={[0, 0.03, 0]} m={M.plain('#3c4f47', { roughness: 1 })} cast={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.056, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color="#45584f" metalness={0.3} roughness={0.3} /></mesh>
      </group>
    );
  }

  const paveTiles = (() => {
    const out = [];
    for (let i = 0; i < 13; i += 1) {
      for (let j = 0; j < 9; j += 1) {
        const x = -4.5 + i * 0.7; const z = 0.45 + j * 0.5;
        if (Math.abs(x) < 0.6) continue;
        out.push({ p: [x, 0.019, z], s: [0.68, 0.004, 0.48], c: (i + j) % 2 ? '#938d80' : '#8f897c' });
      }
    }
    return out;
  })();

  function Yard() {
    const M = useM();
    return (
      <group>
        <Box s={[9.4, 0.03, 4.9]} p={[0.1, 0.0, 2.55]} m={M.plain('#6f6a5e', { roughness: 0.97 })} cast={false} />
        <Box s={[1.0, 0.02, 4.9]} p={[0, 0.012, 2.55]} m={M.plain('#9b937f', { roughness: 0.97 })} cast={false} />
        <Pool x={-2.72} z={2.2} w={4.2} d={1.9} />
        <Pool x={2.72} z={2.2} w={4.2} d={1.9} />
        <Inst items={paveTiles} geo={unitBox} mat={whiteMatEl} />
      </group>
    );
  }

  /* ---------- the 108-spout wall ---------- */
  const spoutData = (() => {
    const wallB = []; const wallC = []; const wallT = []; const spouts = []; const jets = []; const scarves = []; const posts = []; const rails = [];
    const rnd = rng(77);
    const stone = ['#7c6038', '#8c6e44', '#6c5230', '#8c6e44', '#927a4c', '#a08454'];
    const P = (th, rx, rz) => [rx * Math.sin(th), WCZ - rz * Math.cos(th)];
    const n = 40;
    for (let i = 0; i < n; i += 1) {
      const a = rad(-62 + (124 * i) / n); const b = rad(-62 + (124 * (i + 1)) / n);
      const pa = P(a, WRX, WRZ); const pb = P(b, WRX, WRZ);
      const dx = pb[0] - pa[0]; const dz = pb[1] - pa[1]; const L = Math.hypot(dx, dz);
      const ry = Math.atan2(-dz, dx);
      const mx = (pa[0] + pb[0]) / 2; const mz = (pa[1] + pb[1]) / 2;
      wallB.push({ p: [mx, 0.55, mz], r: [0, ry, 0], s: [L + 0.02, 1.1, 0.26], c: '#2e2417' });
      for (let c = 0; c < 6; c += 1) {
        const th = 0.3 + (c % 2) * -0.012;
        wallC.push({ p: [mx, 0.09 + c * 0.18, mz], r: [0, ry, 0], s: [L + 0.01, 0.152, th + (i % 3) * 0.004], c: stone[Math.floor(rnd() * stone.length)] });
      }
      wallT.push({ p: [mx, 1.11, mz], r: [0, ry, 0], s: [L + 0.03, 0.05, 0.42], c: '#8f8672' });
    }
    for (let i = 0; i < 108; i += 1) {
      const th = rad(-58 + (116 * i) / 107);
      const [x, z] = P(th, ERX, ERZ);
      const nx = -x / (ERX * ERX); const nz = -(z - WCZ) / (ERZ * ERZ);
      const phi = Math.atan2(nx, nz);
      spouts.push({ p: [x + Math.sin(phi) * 0.1, 0.96, z + Math.cos(phi) * 0.1], r: [0, phi, 0], s: [0.17, 0.13, 0.34] });
      jets.push({ p: [x + Math.sin(phi) * 0.24, 0.7, z + Math.cos(phi) * 0.24], s: [0.012, 0.5, 0.012] });
    }
    const cols = ['#e8742a', '#e0457b', '#c0282d', '#f0a21e', '#e8742a'];
    for (let i = 0; i < 20; i += 1) {
      const th = rad(-50 + 100 * rnd());
      const [x, z] = P(th, WRX - 0.18, WRZ - 0.1);
      const nx = -x / (ERX * ERX); const nz = -(z - WCZ) / (ERZ * ERZ);
      scarves.push({ p: [x, 0.72, z], r: [0, Math.atan2(nx, nz) + Math.PI / 2, 0], s: [0.1, 0.55 + rnd() * 0.25, 0.015], c: cols[i % cols.length] });
    }
    for (let i = 0; i <= 6; i += 1) {
      const th = rad(-34 + (26 * i) / 6);
      const [x, z] = P(th, WRX - 0.55, WRZ - 0.4);
      posts.push({ p: [x, 0.25, z], s: [0.03, 0.5, 0.03], c: '#e6e6e2' });
      if (i < 6) {
        const [x2, z2] = P(rad(-34 + (26 * (i + 1)) / 6), WRX - 0.55, WRZ - 0.4);
        const L = Math.hypot(x2 - x, z2 - z); const ry = Math.atan2(-(z2 - z), x2 - x);
        rails.push({ p: [(x + x2) / 2, 0.48, (z + z2) / 2], r: [0, ry, 0], s: [L, 0.025, 0.025], c: '#e6e6e2' });
        rails.push({ p: [(x + x2) / 2, 0.3, (z + z2) / 2], r: [0, ry, 0], s: [L, 0.02, 0.02], c: '#e6e6e2' });
      }
    }
    const walk = [];
    for (let i = 0; i < 30; i += 1) {
      const a = rad(-66 + (132 * i) / 29); const b = rad(-66 + (132 * (i + 1)) / 29);
      const pa = P(a, WRX - 0.8, WRZ - 0.65); const pb = P(b, WRX - 0.8, WRZ - 0.65);
      walk.push({ p: [(pa[0] + pb[0]) / 2, 0.02, (pa[1] + pb[1]) / 2], r: [0, Math.atan2(-(pb[1] - pa[1]), pb[0] - pa[0]), 0], s: [Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) + 0.04, 0.03, 0.62], c: i % 2 ? '#8b8576' : '#98927f' });
    }
    return { walk, wallB, wallC, wallT, spouts, jets, scarves, posts, rails };
  })();

  function SpoutWall() {
    return (
      <group>
        <Inst items={spoutData.walk} geo={unitBox} mat={whiteMatEl} />
        <Inst items={spoutData.wallB} geo={unitBox} mat={whiteMatEl} />
        <Inst items={spoutData.wallC} geo={unitBox} mat={whiteMatEl} />
        <Inst items={spoutData.wallT} geo={unitBox} mat={whiteMatEl} />
        <Inst items={spoutData.spouts} geo={unitBox} mat={<meshStandardMaterial color="#3a3026" roughness={0.8} metalness={0.1} />} />
        <Inst items={spoutData.jets} geo={unitBox} mat={<meshStandardMaterial color="#b9d6e6" roughness={0.3} transparent opacity={0.8} />} />
        <Inst items={spoutData.scarves} geo={unitBox} mat={whiteMatEl} />
        <Inst items={spoutData.posts} geo={unitBox} mat={whiteMatEl} />
        <Inst items={spoutData.rails} geo={unitBox} mat={whiteMatEl} />
      </group>
    );
  }

  function Main() {
    const M = useM();
    return (
      <group>
        <Yard />
        <BaseBlock />
        <Pagoda />
        <SpoutWall />
        {/* butter lamps / diyas by the door and pools */}
        <Diyo p={[-0.55, 0.06, 0.1]} light />
        <Diyo p={[0.55, 0.06, 0.1]} />
        <Diyo p={[-3.0, 0.1, 1.9]} />
        <Diyo p={[3.0, 0.1, 1.9]} />
        <pointLight position={[0, 0.8, -0.4]} intensity={1.2} distance={3.5} color="#ffb35a" />
        <Frame s={[7.2, 4.1, 6.6]} p={[0, 2.0, 0.4]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  const stairItems = (() => {
    const out = [];
    for (let i = 0; i < 26; i += 1) {
      const z = -10.0 - i * 0.3; const x = 0.5 - i * 0.06;
      out.push({ p: [x, H(x, z) + 0.06, z], r: [0, -0.18, 0], s: [0.8, 0.3, 0.32], c: i % 2 ? '#948b78' : '#a19882' });
    }
    for (let i = 0; i < 26; i += 1) {
      [-1, 1].forEach((sd) => {
        const z = -10.0 - i * 0.3; const x = 0.5 - i * 0.06 + sd * 0.5;
        out.push({ p: [x, H(x, z) + 0.2, z], r: [0, -0.18, 0], s: [0.16, 0.36, 0.34], c: '#6b6354' });
      });
    }
    return out;
  })();
  const rockItems = (() => {
    const out = []; const rnd = rng(11);
    for (let i = 0; i < 190; i += 1) {
      const x = (rnd() - 0.5) * 110; const z = -75 + rnd() * 90;
      if (Math.hypot(x, z - 1.5) < 7.5) continue;
      if (Math.abs(x - 0.2) < 1.2 && z < -4) continue;
      const s = 0.08 + rnd() * rnd() * 0.22;
      out.push({ p: [x, H(x, z) - s * 0.2, z], r: [rnd() * 2, rnd() * 3, rnd()], s: [s * 1.3, s * 0.8, s], c: ['#6a5d50', '#4c4237', '#6f6254', '#5a4e43', '#74675a'][i % 5] });
    }
    return out;
  })();
  const cliffItems = (() => {
    const out = []; const rnd = rng(41);
    for (let i = 0; i < 110; i += 1) {
      const x = (rnd() - 0.5) * 96; const z = -14 - rnd() * 32;
      const hh = 0.3 + rnd() * 0.5; const w = 0.7 + rnd() * 1.0;
      out.push({ p: [x, H(x, z) - hh * 0.3, z], r: [0, rnd() * 3, 0], s: [w, hh, 1.2 + rnd() * 1.6], c: ['#7a6850', '#5a4a3a', '#6a5a4a', '#7a6850', '#524639'][i % 5] });
    }
    return out;
  })();
  const scrubItems = (() => {
    const out = []; const rnd = rng(23);
    for (let i = 0; i < 260; i += 1) {
      const x = (rnd() - 0.5) * 100; const z = -60 + rnd() * 75;
      if (Math.hypot(x, z - 1.5) < 7.5) continue;
      if (Math.abs(x - 0.2) < 1.2 && z < -4) continue;
      const s = 0.12 + rnd() * 0.22;
      out.push({ p: [x, H(x, z) + s * 0.3, z], s: [s * 1.5, s, s * 1.3], c: ['#9a8442', '#8a7a46', '#a08c4c', '#6a5a38'][i % 4] });
    }
    return out;
  })();

  function Terrain() {
    const geo = useMemo(() => {
      const N = 110; const W = 130;
      const g = new THREE.PlaneGeometry(W, W, N, N);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      const c1 = new THREE.Color('#7a6850'); const c2 = new THREE.Color('#5a4a3a'); const c3 = new THREE.Color('#8a7458');
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i);
        const y = H(x, z);
        pos.setY(i, y);
        const n = (Math.sin(x * 1.3 + z * 0.4) * Math.cos(z * 1.1 - x * 0.7) + 1) / 2;
        c.copy(c1).lerp(c2, Math.min(1, y / 10)).lerp(c3, n * 0.35);
        if (Math.sin(y * 3.4 + x * 0.15) > 0.55 && z < -9) c.multiplyScalar(0.72);
        if (Math.hypot(x, z - 1.5) < 9 && z > -1.4) c.set('#74695a');
        cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow position={[0, -0.002, 0]}><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  function Peak({ x, z, r, h, y = 8, snow = 0.55, rot = 0, col = '#8c7f74' }) {
    const sr = r * snow;
    return (
      <group position={[x, y, z]} rotation={[0, rot, 0]}>
        <mesh position={[0, h / 2, 0]}><coneGeometry args={[r, h, 7]} /><meshStandardMaterial color={col} roughness={1} flatShading /></mesh>
        <mesh position={[0, h - (h * snow) / 2 + 0.05, 0]}><coneGeometry args={[sr * 1.015, h * snow, 7]} /><meshStandardMaterial color="#e4eaf2" emissive="#aab6c8" emissiveIntensity={0.45} roughness={0.9} flatShading /></mesh>
      </group>
    );
  }

  function Sky() {
    const g = useMemo(() => {
      const geo = new THREE.SphereGeometry(135, 20, 14);
      const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3);
      const top = new THREE.Color('#4f86c8'); const hor = new THREE.Color('#cfe0ee'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) { c.copy(hor).lerp(top, Math.min(1, Math.max(0, pos.getY(i) / 70))); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      return geo;
    }, []);
    return <mesh geometry={g}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  function Poplar({ p, s = 1, leaf = 0 }) {
    const M = useM();
    const bark = M.plain('#5a5148', { roughness: 1 });
    const lf = M.plain(leaf ? '#a89a40' : '#8a8460', { roughness: 1 });
    const br = [0, 1, 2, 3, 4, 5, 6];
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.045} rb={0.115} h={2.4} p={[0, 1.2, 0]} m={bark} seg={7} />
        {br.map((i) => {
          const a = i * 2.4; const y = 0.9 + i * 0.28;
          return (
            <group key={i} rotation={[0, a, 0]} position={[0, y, 0]}>
              <Cyl rt={0.016} rb={0.04} h={0.95 - i * 0.05} p={[0.17, 0.42, 0]} r={[0, 0, -0.38]} m={bark} seg={5} />
              {leaf && i % 3 === 0 ? <Ball rad={0.1} p={[0.34, 0.85 - i * 0.05, 0]} sc={[1.3, 0.8, 1.2]} m={lf} /> : null}
            </group>
          );
        })}
        <Cyl rt={0.006} rb={0.02} h={0.9} p={[0, 2.7, 0]} m={bark} seg={5} />
        
      </group>
    );
  }

  function GuestBuilding() {
    const M = useM();
    const white = M.plain('#efe9dc', { roughness: 0.9 });
    const dk = M.plain('#3b2a1f', { roughness: 0.85 });
    const roof = M.plain('#7e8386', { roughness: 0.7, metalness: 0.15 });
    const lit = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1410', emissive: '#ffa040', emissiveIntensity: 0.08 }), []);
    const Z0 = -1.6; const LEN = 5; const zc = Z0 + LEN / 2;
    const bal = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ p: [-4.82, 0.78, Z0 + 0.1 + i * 0.205], s: [0.025, 0.28, 0.025] })), []);
    const tilt = 0.3;
    const run = 1.08; const sl = run / Math.cos(tilt);
    const rY = 1.18 + run * Math.tan(tilt);
    return (
      <group position={[-7, 0, 0]}>
        <Box s={[1.5, 0.6, LEN]} p={[0, 0.3, zc]} m={white} />
        <Box s={[1.5, 0.56, LEN]} p={[0, 0.88, zc]} m={white} />
        <Box s={[1.54, 0.07, LEN + 0.04]} p={[0, 0.035, zc]} m={M.plain('#8a3a30')} />
        {/* ground-floor openings */}
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i}>
            <Box s={[0.04, 0.26, 0.36]} p={[0.76, 0.34, Z0 + 0.5 + i * 0.8]} m={dk} cast={false} />
            <Box s={[0.045, 0.2, 0.28]} p={[0.765, 0.34, Z0 + 0.5 + i * 0.8]} m={i % 2 ? lit : M.plain('#1a120c')} cast={false} />
          </group>
        ))}
        {/* upper floor openings */}
        {Array.from({ length: 6 }, (_, i) => (
          <group key={`u${i}`}>
            <Box s={[0.04, 0.3, 0.4]} p={[0.76, 0.92, Z0 + 0.5 + i * 0.8]} m={dk} cast={false} />
            <Box s={[0.045, 0.24, 0.32]} p={[0.765, 0.92, Z0 + 0.5 + i * 0.8]} m={i % 3 === 1 ? lit : M.plain('#1a120c')} cast={false} />
          </group>
        ))}
        {/* timber balcony */}
        <Box s={[0.55, 0.06, LEN]} p={[1.02, 0.6, zc]} m={dk} />
        <Box s={[0.05, 0.05, LEN]} p={[1.26, 0.96, zc]} m={dk} />
        <Box s={[0.05, 0.05, LEN]} p={[1.26, 0.7, zc]} m={dk} />
        <group position={[6.08, 0, 0]}><Inst items={bal} geo={unitBox} mat={<meshStandardMaterial color="#3b2a1f" roughness={0.85} />} /></group>
        {Array.from({ length: 13 }, (_, i) => <Box key={i} s={[0.08, 0.58, 0.08]} p={[1.26, 0.9, Z0 + 0.1 + i * 0.4]} m={dk} />)}
        <Box s={[0.08, 0.06, LEN + 0.1]} p={[1.26, 1.2, zc]} m={dk} />
        {/* roof */}
        {[-1, 1].map((s) => (
          <Box key={s} s={[sl, 0.05, LEN + 0.1]} p={[0.22 + s * run / 2, (1.18 + rY) / 2 + 0.03, zc]} r={[0, 0, -s * tilt]} m={roof} />
        ))}
        <Box s={[0.12, 0.06, LEN + 0.3]} p={[0.22, rY + 0.04, zc]} m={M.plain('#6f7476')} />
        {/* blue signboards by the doors */}
        {[0.8, 1.6, 2.4, 3.2].map((z) => <Box key={z} s={[0.03, 0.2, 0.3]} p={[0.77, 0.45, Z0 + z + 0.35]} m={M.plain('#2a5aa8')} cast={false} />)}
        <pointLight position={[1.4, 0.7, zc]} intensity={0.8} distance={3} color="#ffb060" />
      </group>
    );
  }

  function Gompa() {
    const M = useM();
    const white = M.plain('#f2eee3', { roughness: 0.9 });
    const roof = M.plain('#7e8384', { roughness: 0.6, metalness: 0.3 });
    return (
      <group position={[5.5, 0, 3.4]}>
        <Box s={[1.1, 0.5, 0.78]} p={[0, 0.25, 0]} m={white} />
        <Box s={[1.14, 0.07, 0.82]} p={[0, 0.035, 0]} m={M.plain('#7a2e2a')} />
        <Tri p={[0.551, 0.5, 0]} ry={Math.PI / 2} w={0.78} h={0.22} color="#f2eee3" />
        <Tri p={[-0.551, 0.5, 0]} ry={Math.PI / 2} w={0.78} h={0.22} color="#f2eee3" />
        {[-1, 1].map((s) => <Box key={s} s={[1.24, 0.03, 0.5]} p={[0, 0.6, s * 0.2]} r={[-s * 0.45, 0, 0]} m={roof} />)}
        <Box s={[0.3, 0.38, 0.04]} p={[0, 0.2, -0.4]} m={M.plain('#2a1a10')} />
        <mesh position={[0, 0.16, -0.43]}><coneGeometry args={[0.05, 0.14, 8]} /><meshBasicMaterial color="#ffb347" toneMapped={false} /></mesh>
        <pointLight position={[0, 0.3, -0.7]} intensity={0.8} distance={2.2} color="#ff9a3c" />
        <Box s={[0.3, 0.2, 0.03]} p={[0.35, 0.3, -0.395]} m={M.plain('#3a6ab0')} cast={false} />
        <Cyl rt={0.012} h={1.4} p={[0.62, 0.7, 0.3]} m={M.plain('#6d5a44')} seg={5} />
      </group>
    );
  }

  function Compound() {
    const M = useM();
    const wallM = M.plain('#c9c1b0', { roughness: 0.95 });
    const dk = M.plain('#3b2a1f', { roughness: 0.85 });
    const fence = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ p: [6.3, 0.17, -0.9 + i * 0.5], s: [0.05, 0.34, 0.05] })), []);
    return (
      <group>
        {/* low front coping wall at the edges only */}
        <Box s={[2.6, 0.2, 0.2]} p={[-3.4, 0.1, 5.65]} m={wallM} />
        <Box s={[2.2, 0.2, 0.2]} p={[3.4, 0.1, 5.65]} m={wallM} />
        {/* timber-railed lane on the right */}
        <Inst items={fence} geo={unitBox} mat={<meshStandardMaterial color="#4a3426" roughness={0.9} />} />
        <Box s={[0.04, 0.04, 7]} p={[6.3, 0.3, 2.6]} m={dk} cast={false} />
        <Box s={[0.04, 0.04, 7]} p={[6.3, 0.18, 2.6]} m={dk} cast={false} />
        <Gompa />
        <PrayerFlags from={[-4.6, 1.3, 5.65]} to={[-2.2, 0.35, 5.65]} n={7} />
        <PrayerFlags from={[2.3, 0.35, 5.65]} to={[4.6, 1.3, 5.65]} n={7} />
      </group>
    );
  }

  const trees = [
    [-9.5, -0.2, 1.0, 0], [7.6, -1.6, 1.1, 1], [8.8, 2.4, 1.0, 0], [6.4, -1.0, 1.2, 0], [7.0, 5.6, 0.9, 0],
    [-6.8, -1.5, 1.1, 0], [-6.9, 5.8, 1.0, 1], [-6.2, -4.2, 1.0, 0], [6.6, -5.6, 1.0, 0], [6.8, -3.8, 1.3, 0], [-7.8, 2.0, 1.2, 0],
    [-3.6, -11.0, 1.4, 0], [-1.8, -12.4, 1.5, 0], [2.4, -11.6, 1.4, 0], [4.0, -10.6, 1.3, 1], [-5.2, -10.2, 1.3, 0], [-0.4, -13.4, 1.6, 0],
  ];

  function Env() {
    const M = useM();
    return (
      <group>
        <Terrain />
        <Inst items={stairItems} geo={unitBox} mat={whiteMatEl} />
        <Inst items={rockItems} geo={<icosahedronGeometry args={[1, 0]} />} mat={whiteMatEl} />
        <Inst items={cliffItems} geo={<icosahedronGeometry args={[1, 0]} />} mat={whiteMatEl} />
        <Inst items={scrubItems} geo={<icosahedronGeometry args={[1, 0]} />} mat={whiteMatEl} />
        <GuestBuilding />
        <Compound />
        {trees.map(([x, z, s, lf], i) => <Poplar key={i} p={[x, H(x, z), z]} s={s} leaf={lf} />)}
        {/* snow peaks and rocky ridges beyond the valley */}
        <Peak x={-34} z={-58} r={30} h={9} y={0} snow={0} rot={0.2} col="#6a5a4a" />
        <Peak x={34} z={-58} r={30} h={10} y={0} snow={0} rot={1.2} col="#6a5a4a" />
        <Peak x={-12} z={-34} r={15} h={9} y={0} snow={0} rot={0.3} col="#7a6850" />
        <Peak x={-30} z={-36} r={14} h={10} y={0} snow={0} rot={1.1} col="#5a4a3a" />
        <Peak x={14} z={-33} r={15} h={10} y={0} snow={0} rot={0.7} col="#7a6850" />
        <Peak x={32} z={-35} r={14} h={9} y={0} snow={0} rot={0.2} col="#5a4a3a" />
        <Peak x={-10} z={-82} r={27} h={32} y={0} snow={0.62} rot={0.3} col="#6a5a4a" />
        <Peak x={22} z={-86} r={28} h={34} y={0} snow={0.62} rot={0.7} col="#6a5a4a" />
        <Peak x={-44} z={-78} r={24} h={26} y={0} snow={0.55} rot={1.1} col="#6a5a4a" />
        <Peak x={52} z={-72} r={22} h={25} y={0} snow={0.55} rot={0.2} col="#6a5a4a" />
        <Peak x={5} z={-100} r={32} h={40} y={0} snow={0.66} rot={0.9} col="#6a5a4a" />
        <Sky />
        <Peak x={62} z={10} r={14} h={12} y={10} snow={0} col="#8a8074" />
        <Peak x={-62} z={14} r={14} h={12} y={10} snow={0} col="#8a8074" />
      </group>
    );
  }

  return { 'muktinath-temple': { Main, Env } };
}
