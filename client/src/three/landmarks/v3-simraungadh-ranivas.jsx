/* Simraungadh and Ranivas Temple (Ram Janaki Mandir, "Mahal Sarai"), Bara, Madhesh. Rana-era (1878) small white Nagara shikhara
   temple: slender curvilinear spire with red ribs, small corner spires, red-banded low plinth, round-headed door. It stands in an
   open yard of the flat Terai; ruined exposed pink-brick palace range with arches to its right, free-standing broken arches,
   a tin-roofed brick entrance range, dark stone pillar/fragments/Hanuman in the yard, far-off Jharokhar pond and tree line.
   Sizes are estimates from photo 0 (no published dimensions). 1 unit = 1 m. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Water, Diyo, THREE, useMemo } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 7.3) * 43758.5453; return v - Math.floor(v); };
  const WH = '#f4f0e6';
  const RED = '#b03a2e';
  const GREEN = '#6faf8a';
  const BRK = { color: '#ffe3d8', emissive: '#b08a80', emissiveIntensity: 0.22 };
  const BRICK = '#d9a99a';

  /* ---------- curvilinear square shikhara spire (flat faces, curved profile) ---------- */
  const TMAX = 0.92;
  const wAt = (w0, t) => w0 * Math.pow(1 - t, 0.5) * (1 - 0.2 * Math.exp(-Math.pow((t - 0.7) / 0.14, 2)));
  function spireGeo(w0, H, N = 18) {
    const pos = [];
    const rot = (x, z, k) => { const c = Math.cos(k * Math.PI / 2), s = Math.sin(k * Math.PI / 2); return [x * c + z * s, -x * s + z * c]; };
    for (let k = 0; k < 4; k += 1) {
      for (let i = 0; i < N; i += 1) {
        const t0 = TMAX * i / N, t1 = TMAX * (i + 1) / N;
        const w0_ = wAt(w0, t0), w1_ = wAt(w0, t1), y0 = H * i / N, y1 = H * (i + 1) / N;
        const q = [[-w0_, y0, w0_], [w0_, y0, w0_], [w1_, y1, w1_], [-w1_, y1, w1_]].map(([x, y, z]) => { const [a, b] = rot(x, z, k); return [a, y, b]; });
        pos.push(...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }
  function ribGeo(w0, H, fs, rw, N = 18) {
    const pos = [];
    const rot = (x, z, k) => { const c = Math.cos(k * Math.PI / 2), s = Math.sin(k * Math.PI / 2); return [x * c + z * s, -x * s + z * c]; };
    for (let k = 0; k < 4; k += 1) {
      fs.forEach((f) => {
        for (let i = 0; i < N; i += 1) {
          const t0 = TMAX * i / N, t1 = TMAX * (i + 1) / N;
          const a = wAt(w0, t0), b = wAt(w0, t1), y0 = H * i / N, y1 = H * (i + 1) / N;
          const ra = rw * (0.35 + 0.65 * a / w0), rb = rw * (0.35 + 0.65 * b / w0);
          const q = [[f * a - ra, y0, a + 0.03], [f * a + ra, y0, a + 0.03], [f * b + rb, y1, b + 0.03], [f * b - rb, y1, b + 0.03]].map(([x, y, z]) => { const [u, v] = rot(x, z, k); return [u, y, v]; });
          pos.push(...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
        }
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }

  function Shikhara({ w0, H, y0 = 0, x = 0, z = 0, big = false }) {
    const M = useM();
    const body = useMemo(() => spireGeo(w0, H), [w0, H]);
    const ribs = useMemo(() => ribGeo(w0, H, big ? [-0.97, 0, 0.97] : [0], big ? 0.1 : 0.05), [w0, H, big]);
    const white = M.plain(WH, { side: THREE.DoubleSide, roughness: 0.85 });
    const red = M.plain(RED, { side: THREE.DoubleSide, roughness: 0.8 });
    const metal = M.plain('#b7a26a', { metalness: 0.6, roughness: 0.4 });
    const fr = big ? [0.22, 0.45, 0.68] : [0.5];
    const wTop = wAt(w0, TMAX);
    const ar = big ? 0.62 : 0.3;
    return (
      <group position={[x, y0, z]}>
        <mesh geometry={body} material={white} castShadow receiveShadow />
        <mesh geometry={ribs} material={red} />
        {fr.map((f, i) => {
          const w = wAt(w0, TMAX * f);
          return (
            <group key={i} position={[0, H * f, 0]}>
              <Box s={[2 * w + (big ? 0.3 : 0.14), big ? 0.12 : 0.07, 2 * w + (big ? 0.3 : 0.14)]} m={white} />
              <Box s={[2 * w + (big ? 0.34 : 0.16), big ? 0.2 : 0.05, 2 * w + (big ? 0.34 : 0.16)]} p={[0, big ? -0.14 : -0.05, 0]} m={red} cast={false} />
            </group>
          );
        })}
        {/* amalaka, neck, pot and finial */}
        <group position={[0, H, 0]}>
          <Box s={[2 * wTop + 0.1, big ? 0.14 : 0.08, 2 * wTop + 0.1]} p={[0, 0, 0]} m={white} />
          <Ball rad={ar} p={[0, ar * 0.45, 0]} sc={[1, 0.5, 1]} m={white} />
          <Cyl rt={ar * 0.9} rb={ar * 0.9} h={big ? 0.06 : 0.04} p={[0, ar * 0.45, 0]} m={red} seg={20} />
          <Cyl rt={ar * 0.18} rb={ar * 0.25} h={ar * 0.5} p={[0, ar * 0.9, 0]} m={white} seg={10} />
          <Ball rad={ar * 0.34} p={[0, ar * 1.3, 0]} m={metal} />
          <Cyl rt={ar * 0.04} rb={ar * 0.06} h={big ? 1.3 : 0.55} p={[0, ar * 1.55 + (big ? 0.6 : 0.25), 0]} m={metal} seg={6} />
          <Ball rad={ar * 0.12} p={[0, ar * 1.55 + (big ? 1.3 : 0.55), 0]} m={red} />
        </group>
      </group>
    );
  }

  /* ---------- Hanuman, small dark stone figure ---------- */
  function Hanuman({ p, r = 0 }) {
    const M = useM();
    const st = M.plain('#3f3c3a', { roughness: 0.9 });
    const sin = M.plain('#a3331f', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.3, 0.5, 1.3]} p={[0, 0.25, 0]} m={M.stone} />
        <Box s={[0.9, 0.3, 0.9]} p={[0, 0.65, 0]} m={st} />
        <Box s={[0.24, 0.9, 0.26]} p={[-0.17, 1.25, 0]} m={st} />
        <Box s={[0.24, 0.9, 0.26]} p={[0.17, 1.25, 0]} m={st} />
        <Box s={[0.6, 0.8, 0.34]} p={[0, 2.1, 0]} m={st} />
        <Box s={[0.5, 0.18, 0.04]} p={[0, 2.25, 0.19]} m={sin} />
        <Ball rad={0.24} p={[0, 2.78, 0.02]} m={st} />
        <Box s={[0.2, 0.14, 0.14]} p={[0, 2.72, 0.2]} m={st} />
        <Box s={[0.3, 0.07, 0.04]} p={[0, 2.92, 0.22]} m={sin} />
        <Box s={[0.14, 0.7, 0.14]} p={[-0.4, 2.05, 0.1]} r={[0.2, 0, 0.1]} m={st} />
        <Box s={[0.14, 0.7, 0.14]} p={[0.42, 2.4, 0.05]} r={[0, 0, -0.5]} m={st} />
        <Cyl rt={0.06} rb={0.07} h={0.9} p={[0.72, 2.8, 0.05]} m={st} seg={8} />
        <Ball rad={0.2} p={[0.72, 3.3, 0.05]} m={st} />
        <Box s={[0.1, 1.3, 0.1]} p={[0.0, 2.3, -0.28]} r={[-0.2, 0, 0]} m={st} />
        <Box s={[0.1, 0.1, 0.5]} p={[0, 2.95, -0.35]} m={st} />
      </group>
    );
  }

  /* ---------- the old dark stone pillar (octagonal shaft, carved foliage band at the foot) ---------- */
  function StonePillar({ p, h = 4.6 }) {
    const M = useM();
    const st = M.plain('#4a4745', { roughness: 0.95 });
    const dk = M.plain('#36322f', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[1.1, 0.35, 1.1]} p={[0, 0.17, 0]} m={M.stone} />
        <Box s={[0.7, 0.9, 0.7]} p={[0, 0.8, 0]} m={st} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.22, 0.6, 0.06]} p={[0, 0.9, 0.37]} r={[0, i * Math.PI / 2, 0]} m={dk} cast={false} />)}
        {[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, i * Math.PI / 2, 0]}><Box s={[0.5, 0.5, 0.05]} p={[0, 0.85, 0.37]} m={dk} cast={false} /></group>)}
        <Cyl rt={0.27} rb={0.33} h={h - 1.8} p={[0, 1.25 + (h - 1.8) / 2, 0]} m={st} seg={8} />
        <Cyl rt={0.42} rb={0.3} h={0.3} p={[0, h - 0.4, 0]} m={st} seg={8} />
        <Box s={[0.9, 0.2, 0.9]} p={[0, h - 0.15, 0]} m={dk} />
        <Box s={[0.55, 0.15, 0.55]} p={[0, h, 0]} m={st} />
      </group>
    );
  }

  /* ---------- broken brick arch, free standing ---------- */
  function BrokenArch({ p, r = 0, ro = 2.0, ri = 1.15, ys = 2.4, th = 0.85, cut = 55, stub = 1.5, flip = false, seed = 1 }) {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      const tb = cut * Math.PI / 180;
      s.moveTo(-ro, 0);
      s.lineTo(-ro, ys);
      const n = 14;
      for (let i = 0; i <= n; i += 1) { const a = Math.PI - (Math.PI - tb) * i / n; s.lineTo(ro * Math.cos(a), ys + ro * Math.sin(a)); }
      s.lineTo(ro * Math.cos(tb) - 0.22, ys + ro * Math.sin(tb) - 0.35);
      s.lineTo(ri * Math.cos(tb) + 0.18, ys + ri * Math.sin(tb) - 0.1);
      for (let i = 0; i <= n; i += 1) { const a = tb + (Math.PI - tb) * i / n; s.lineTo(ri * Math.cos(a), ys + ri * Math.sin(a)); }
      s.lineTo(-ri, 0);
      s.lineTo(-ro, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false });
      g.translate(0, 0, -th / 2);
      return g;
    }, [ro, ri, ys, th, cut]);
    const br = M.mat('brick', 0.6, 0.6, BRK);
    const pl = M.plain('#e6d6bf', { roughness: 1 });
    const sc = flip ? -1 : 1;
    return (
      <group position={p} rotation={[0, r, 0]} scale={[sc, 1, 1]}>
        <mesh geometry={geo} material={br} castShadow receiveShadow />
        <Box s={[0.78, stub, th]} p={[(ro + ri) / 2, stub / 2, 0]} m={br} />
        <Box s={[0.45, 0.4, th * 0.9]} p={[(ro + ri) / 2 - 0.1, stub + 0.15, 0]} r={[0, 0, 0.3]} m={br} />
        <Box s={[0.3, 0.5, th + 0.04]} p={[-ro + 0.4, 1.2, 0]} m={pl} cast={false} />
        {[0, 1, 2].map((i) => <Box key={i} s={[0.4, 0.3, 0.5]} p={[ro * 0.5 + 0.6 + i * 0.5 + rn(seed + i), 0.15, 0.9 + rn(seed + i + 4) * 0.6]} r={[0, rn(seed + i) * 3, 0]} m={br} />)}
      </group>
    );
  }

  /* ---------- the ruined two-storey exposed-brick range ---------- */
  function RuinRange({ p, len = 9.5, d = 2.8, seed = 3 }) {
    const M = useM();
    const dark = M.plain('#2b211c', { roughness: 1 });
    const plaster = M.plain('#e7d8c2', { roughness: 1 });
    const shut = M.plain('#6c4a2a', { roughness: 0.9 });
    const rust = M.plain('#c27a66', { roughness: 1 });
    const n = Math.round(len / 1.9);
    const bw = len / n;
    const bays = [];
    for (let i = 0; i < n; i += 1) {
      const hs = [5.4, 2.4, 5.2, 2.9, 4.6, 2.2];
      const full = hs[i % 6] > 4;
      bays.push({ z: -len / 2 + bw * (i + 0.5), h: i === n - 1 ? 1.3 : hs[i % 6], full, i });
    }
    return (
      <group position={p}>
        {bays.map((b) => {
          const m = M.mat('brick', Math.max(1, Math.round(d / 1.6)), Math.max(1, Math.round(b.h / 1.6)), BRK);
          const dep = d * (b.full ? 1 : 0.85);
          return (
            <group key={b.i}>
              <Box s={[dep, b.h, bw - 0.04]} p={[0, b.h / 2, b.z]} m={m} />
              {/* broken, uneven top */}
              {[0, 1, 2].map((k) => <Box key={k} s={[0.5 + rn(seed + b.i + k) * 0.5, 0.35 + rn(seed + k * 7 + b.i) * 0.5, 0.5]} p={[(rn(seed + k + b.i * 2) - 0.5) * (dep - 0.6), b.h + 0.12, b.z + (rn(seed + k * 3 + b.i) - 0.5) * (bw - 0.8)]} r={[0, rn(seed + k) * 0.6, 0]} m={m} />)}
              {[1, -1].map((sd) => (
                <group key={sd}>
                  {/* ground floor arched opening */}
                  {(b.i + (sd > 0 ? 0 : 1)) % 2 === 0 && (
                    <group position={[sd * (dep / 2 + 0.01), 0, b.z]}>
                      <Box s={[0.05, 1.8, 0.95]} p={[0, 0.9, 0]} m={dark} cast={false} />
                      <Cyl rt={0.475} h={0.05} p={[0, 1.8, 0]} r={[0, 0, Math.PI / 2]} m={dark} seg={14} />
                      <Box s={[0.07, 0.12, 1.25]} p={[0, 0.06, 0]} m={plaster} cast={false} />
                    </group>
                  )}
                  {/* upper window, one with shutter */}
                  {b.full && (
                    <group position={[sd * (dep / 2 + 0.01), 4.1, b.z]}>
                      <Box s={[0.05, 1.15, 0.75]} p={[0, 0, 0]} m={dark} cast={false} />
                      <Cyl rt={0.375} h={0.05} p={[0, 0.575, 0]} r={[0, 0, Math.PI / 2]} m={dark} seg={12} />
                      {b.i % 2 === 0 && <Box s={[0.08, 1.0, 0.36]} p={[sd * 0.02, 0, 0.19]} m={shut} cast={false} />}
                      <Box s={[0.06, 0.12, 1.0]} p={[0, -0.64, 0]} m={plaster} cast={false} />
                    </group>
                  )}
                  {/* plaster patch / rust wash */}
                  <Box s={[0.04, 1.4 + rn(seed + b.i * 5) * 1.2, 0.9]} p={[sd * (dep / 2 + 0.005), 2.8 + rn(seed + b.i) * 1.5, b.z + 0.3]} m={rn(seed + b.i + sd) > 0.5 ? plaster : rust} cast={false} />
                </group>
              ))}
            </group>
          );
        })}
        {/* string course between the storeys */}
        <Box s={[d + 0.14, 0.18, len * 0.7]} p={[0, 3.0, -len * 0.1]} m={M.plain('#d9a58c')} />
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function Railing() {
    const M = useM();
    const white = M.plain(WH);
    const red = M.plain(RED);
    const e = 3.95;
    const posts = [];
    for (let i = 0; i <= 8; i += 1) {
      const u = -e + (2 * e * i) / 8;
      posts.push([u, e], [u, -e], [e, u], [-e, u]);
    }
    const uniq = posts.filter(([x, z], i) => posts.findIndex(([a, b]) => a === x && b === z) === i && !(z === e && Math.abs(x) < 1.8));
    return (
      <group position={[0, 0.7, 0]}>
        {uniq.map(([x, z], i) => <Box key={i} s={[0.14, 0.62, 0.14]} p={[x, 0.31, z]} m={white} cast={false} />)}
        {[[0, e, 1], [0, -e, 1], [e, 0, 0], [-e, 0, 0]].map(([x, z, h], i) => (h
          ? (z > 0
            ? [-1, 1].map((sd) => <Box key={`${i}${sd}`} s={[e - 1.8 + 0.14, 0.1, 0.12]} p={[sd * ((e + 1.8) / 2), 0.62, z]} m={red} cast={false} />)
            : <Box key={i} s={[2 * e, 0.1, 0.12]} p={[x, 0.62, z]} m={red} cast={false} />)
          : <Box key={i} s={[0.12, 0.1, 2 * e]} p={[x, 0.62, z]} m={red} cast={false} />))}
      </group>
    );
  }

  function Temple() {
    const M = useM();
    const white = M.plain(WH, { roughness: 0.85 });
    const red = M.plain(RED, { roughness: 0.8 });
    const green = M.plain(GREEN, { roughness: 0.8 });
    const dark = M.plain('#2a201b', { roughness: 1 });
    const glow = M.plain('#ffb85a', { emissive: '#ff9a3a', emissiveIntensity: 0.8 });
    const wall = 4.2;
    const wy = 0.75;
    const wh = 3.0;
    const top = wy + wh;
    return (
      <group>
        {/* plinth: white foot, thick red band, white cap */}
        <Box s={[7.4, 0.28, 7.4]} p={[0, 0.14, 0]} m={white} />
        <Box s={[7.2, 0.3, 7.2]} p={[0, 0.42, 0]} m={red} />
        <Box s={[7.3, 0.12, 7.3]} p={[0, 0.64, 0]} m={white} />
        {/* steps at the front */}
        {[0, 1, 2].map((i) => <Box key={`s${i}`} s={[3.2, 0.24 + 0.23 * (2 - i), 0.45]} p={[0, (0.24 + 0.23 * (2 - i)) / 2, 3.95 + 0.45 * i]} m={i === 1 ? red : white} />)}
        {/* sanctum block */}
        <Box s={[wall, wh, wall]} p={[0, wy + wh / 2, 0]} m={white} />
        <Box s={[wall + 0.12, 0.45, wall + 0.12]} p={[0, wy + 0.22, 0]} m={red} cast={false} />
        <Box s={[wall + 0.5, 0.18, wall + 0.5]} p={[0, top + 0.09, 0]} m={white} />
        <Box s={[wall + 0.5, 0.12, wall + 0.5]} p={[0, top - 0.06, 0]} m={red} cast={false} />
        <Box s={[wall + 0.3, 0.1, wall + 0.3]} p={[0, top + 0.23, 0]} m={white} />
        {/* side and back blind arched niches with green frames */}
        {[[1, 0], [-1, 0], [0, -1]].map(([ax, az], i) => (
          <group key={i} position={[ax * (wall / 2 + 0.01), 0, az * (wall / 2 + 0.01)]} rotation={[0, ax ? (ax > 0 ? Math.PI / 2 : -Math.PI / 2) : Math.PI, 0]}>
            {[-1.2, 1.2].map((o) => (
              <group key={o} position={[o, 0, 0]}>
                <Box s={[0.98, 1.68, 0.04]} p={[0, 2.1, 0.015]} m={red} cast={false} />
                <Cyl rt={0.49} h={0.04} p={[0, 2.94, 0.015]} r={[Math.PI / 2, 0, 0]} m={red} seg={14} />
                <Box s={[0.9, 1.6, 0.05]} p={[0, 2.1, 0.02]} m={green} cast={false} />
                <Cyl rt={0.45} h={0.05} p={[0, 2.9, 0.02]} r={[Math.PI / 2, 0, 0]} m={green} seg={14} />
                <Box s={[0.66, 1.5, 0.07]} p={[0, 2.1, 0.03]} m={dark} cast={false} />
                <Cyl rt={0.33} h={0.07} p={[0, 2.85, 0.03]} r={[Math.PI / 2, 0, 0]} m={dark} seg={12} />
              </group>
            ))}
            <Box s={[0.05, 0.9, 0.05]} p={[0, 1.95, 0.06]} m={red} cast={false} />
          </group>
        ))}
        {/* front porch with round-headed door */}
        <Box s={[2.4, 2.6, 1.4]} p={[0, wy + 1.3, wall / 2 + 0.5]} m={white} />
        <Box s={[2.7, 0.16, 1.7]} p={[0, wy + 2.68, wall / 2 + 0.5]} m={white} />
        <Box s={[2.7, 0.1, 1.7]} p={[0, wy + 2.56, wall / 2 + 0.5]} m={red} cast={false} />
        <group position={[0, wy, wall / 2 + 1.21]}>
          <Box s={[1.45, 1.75, 0.04]} p={[0, 0.88, 0]} m={red} cast={false} />
          <Cyl rt={0.725} h={0.04} p={[0, 1.75, 0]} r={[Math.PI / 2, 0, 0]} m={red} seg={16} />
          <Box s={[1.1, 1.75, 0.06]} p={[0, 0.88, 0.01]} m={dark} cast={false} />
          <Cyl rt={0.55} h={0.06} p={[0, 1.75, 0.01]} r={[Math.PI / 2, 0, 0]} m={dark} seg={16} />
          
          <Box s={[1.3, 0.1, 0.1]} p={[0, 0.05, 0.06]} m={white} />
        </group>
        {/* small windows beside the door */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 1.95, wy + 1.9, wall / 2 + 0.01]}>
            <Box s={[0.6, 0.9, 0.05]} m={green} cast={false} />
            <Box s={[0.42, 0.72, 0.07]} m={dark} cast={false} />
          </group>
        ))}
        {/* spires */}
        <Shikhara w0={1.7} H={6.5} y0={top + 0.28} big />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <Shikhara key={`${sx}${sz}`} w0={0.5} H={2.4} y0={top + 0.28} x={sx * 2.0} z={sz * 1.6} />)}
        <Shikhara w0={0.85} H={1.7} y0={wy + 2.74} z={wall / 2 + 0.55} />
        <pointLight position={[0, 1.8, 6.2]} intensity={2.2} distance={7} color="#ffb35a" />
        <Frame s={[12, 12.4, 9.5]} p={[1.6, 6.2, 0.5]} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Temple />
        <RuinRange p={[12.5, 0, -3]} />
        <BrokenArch p={[15, 0, -11]} r={0.6} />
        <BrokenArch p={[12.5, 0, 3.4]} r={0} ro={1.9} ri={1.1} ys={2.3} cut={50} stub={1.1} flip seed={6} />
        
      </group>
    );
  }

  /* ---------- trees ---------- */
  function Limb({ a, b, r, m }) {
    const { pos, q, len } = useMemo(() => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
      const d = vb.clone().sub(va);
      const l = d.length();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: va.clone().add(vb).multiplyScalar(0.5), q: qq, len: l };
    }, [a[0], a[1], a[2], b[0], b[1], b[2]]); // eslint-disable-line react-hooks/exhaustive-deps
    return <mesh position={pos} quaternion={q} material={m} castShadow><cylinderGeometry args={[r * 0.7, r, len, 6]} /></mesh>;
  }
  function BareTree({ p, s = 1, seed = 1 }) {
    const M = useM();
    const wood = M.plain('#4e4034', { roughness: 1 });
    const segs = useMemo(() => {
      const out = [];
      const grow = (a, dir, len, r, depth, id) => {
        const b = [a[0] + dir[0] * len, a[1] + dir[1] * len, a[2] + dir[2] * len];
        out.push({ a, b, r });
        if (depth <= 0) return;
        const k = depth > 2 ? 3 : 2;
        for (let i = 0; i < k; i += 1) {
          const ang = rn(id * 7 + i * 3 + seed) * Math.PI * 2;
          const sp = 0.5 + rn(id + i * 5 + seed) * 0.4;
          const nd = [dir[0] * 0.6 + Math.cos(ang) * sp, dir[1] * 0.7 + 0.35, dir[2] * 0.6 + Math.sin(ang) * sp];
          const l = Math.hypot(...nd);
          grow(b, nd.map((v) => v / l), len * (0.72 - i * 0.04), r * 0.62, depth - 1, id * 3 + i + 1);
        }
      };
      grow([0, 0, 0], [0.08, 1, 0.03], 3.4, 0.2, 4, 1);
      return out;
    }, [seed]);
    return <group position={p} scale={s}>{segs.map((sg, i) => <Limb key={i} a={sg.a} b={sg.b} r={sg.r} m={wood} />)}</group>;
  }
  function Mango({ p, s = 1, seed = 1 }) {
    const M = useM();
    const leaf = M.plain('#3d5a2a', { roughness: 1 });
    const leaf2 = M.plain('#4c6a30', { roughness: 1 });
    const leaf3 = M.plain('#2c4220', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.22} rb={0.4} h={2.6} p={[0, 1.3, 0]} r={[0.05 * (rn(seed) - 0.5) * 6, 0, 0.08 * (rn(seed + 1) - 0.5) * 6]} m={M.plain('#4a3a2e')} seg={7} />
        <Cyl rt={0.12} rb={0.2} h={2.2} p={[0.7, 3.0, 0.2]} r={[0, 0, -0.5]} m={M.plain('#4a3a2e')} seg={6} />
        <Cyl rt={0.12} rb={0.2} h={2.2} p={[-0.7, 3.0, -0.1]} r={[0, 0, 0.5]} m={M.plain('#4a3a2e')} seg={6} />
        {[[0.1, 4.9, 0.1, 1.5, 0], [1.9, 4.0, 0.5, 1.35, 1], [-1.9, 3.9, -0.4, 1.4, 0], [0.4, 3.7, 1.7, 1.2, 1], [-0.3, 3.8, -1.7, 1.25, 0]].map(([x, y, z, r, k], i) => (
          <group key={i} position={[x, y, z]} rotation={[0, i * 1.3, 0]}>
            <Ball rad={r * 0.95} p={[0, -0.3, 0]} sc={[1.25, 0.4, 1.2]} m={leaf3} />
            <Ball rad={r} p={[0.1, 0, 0]} sc={[1.2, 0.5, 1.15]} m={k ? leaf2 : leaf} />
            <Ball rad={r * 0.6} p={[-0.3, 0.35, 0.2]} sc={[1.1, 0.5, 1]} m={k ? leaf : leaf2} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- tin-roofed brick entrance range ---------- */
  function TinRange({ p, len = 13 }) {
    const M = useM();
    const dark = M.plain('#2b211c', { roughness: 1 });
    const tin = M.plain('#8a8d8e', { metalness: 0.45, roughness: 0.6 });
    const tin2 = M.plain('#8d6a50', { metalness: 0.4, roughness: 0.7 });
    const shut = M.plain('#6c4a2a');
    const plaster = M.plain('#e7d8c2', { roughness: 1 });
    const brick = M.mat('brick', 6, 3, BRK);
    const h1 = 4.8;
    return (
      <group position={p}>
        <Box s={[4.6, h1, len]} p={[0, h1 / 2, 0]} m={brick} />
        <Box s={[4.9, 0.16, len]} p={[0, 2.9, 0]} m={M.plain('#d6a590')} />
        {[-1, 0, 1].map((i) => (
          <group key={i} position={[2.31, 0, i * 3.6]}>
            <Box s={[0.05, 2.0, 1.1]} p={[0, 1.0, 0]} m={dark} cast={false} />
            <Cyl rt={0.55} h={0.05} p={[0, 2.0, 0]} r={[0, 0, Math.PI / 2]} m={dark} seg={14} />
            <Box s={[0.05, 1.1, 0.8]} p={[0, 4.2, 0]} m={dark} cast={false} />
            {i !== 0 && <Box s={[0.08, 1.0, 0.38]} p={[0.02, 4.2, 0.2]} m={shut} cast={false} />}
          </group>
        ))}
        {[0, 1, 2].map((i) => <Box key={i} s={[0.55, 0.2 * (3 - i), 3.2]} p={[3.0 - i * 0.45 + 0.3, 0.1 * (3 - i), 0]} m={plaster} />)}
        <Box s={[2.9, 0.08, len + 1.0]} p={[1.2, h1 + 0.5, 0]} r={[0, 0, -0.4]} m={tin} />
        <Box s={[2.9, 0.08, len + 1.0]} p={[-1.2, h1 + 0.5, 0]} r={[0, 0, 0.4]} m={tin2} />
        <Box s={[1.4, 0.08, 4]} p={[1.9, h1 + 0.22, 3.4]} r={[0, 0, -0.4]} m={tin2} />
      </group>
    );
  }

  /* ---------- small distant brick-and-tin houses ---------- */
  function FarHouse({ p, r = 0, s = 1 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[5, 2.6, 3.4]} p={[0, 1.3, 0]} m={M.mat('brick', 3, 1, BRK)} />
        <Box s={[3.1, 0.08, 4.2]} p={[1.2, 3.0, 0]} r={[0, 0, -0.38]} m={M.plain('#8a8d8e', { metalness: 0.4 })} />
        <Box s={[3.1, 0.08, 4.2]} p={[-1.2, 3.0, 0]} r={[0, 0, 0.38]} m={M.plain('#8d6a50', { metalness: 0.4 })} />
      </group>
    );
  }

  function Ellipse({ rx, rz, h = 0.2, y = 0, p = [0, 0, 0], m }) {
    return <mesh position={[p[0], y + h / 2, p[2]]} scale={[rx, 1, rz]} material={m} receiveShadow><cylinderGeometry args={[1, 1, h, 48]} /></mesh>;
  }

  function Env() {
    const M = useM();
    const dirt = M.plain('#a8975f', { roughness: 1 });
    const yard = M.plain('#b9a778', { roughness: 1 });
    const grass = M.plain('#7f8f4a', { roughness: 1 });
    const bank = M.plain('#a8915f', { roughness: 1 });
    const dk = M.plain('#3d3a38', { roughness: 0.95 });
    const brick = M.mat('brick', 1, 1, BRK);
    const horizon = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * Math.PI * 2 + rn(i) * 0.05;
      const r = 80 + rn(i + 9) * 14;
      horizon.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, s: 3 + rn(i + 3) * 2.5, i });
    }
    const leaf = M.plain('#3f5a38', { roughness: 1 });
    const leaf2 = M.plain('#4d6a44', { roughness: 1 });
    return (
      <group>
        <mesh position={[0, 20, 0]}><sphereGeometry args={[120, 24, 12]} /><meshBasicMaterial color="#a9c8e4" side={THREE.BackSide} fog={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={dirt}><circleGeometry args={[110, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow material={yard}><circleGeometry args={[17, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow material={M.plain('#a3a463', { roughness: 1 })}><ringGeometry args={[16, 24, 48]} /></mesh>
        {[[-8, 14, 2.5], [14, 12, 3], [-14, -6, 2.2], [6, -14, 3.2], [-4, -22, 3], [20, -4, 2.6], [-24, 6, 3], [-3, 20, 3.4], [8, 6, 1.8], [-18, 14, 2.6], [24, 16, 3], [-10, -16, 2.4], [12, -20, 3]].map(([x, z, r], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]} material={grass}><circleGeometry args={[r, 14]} /></mesh>
        ))}
        {/* trees: bare spreading tree left foreground, mangoes and kabhro around */}
        <BareTree p={[-22, 0, -7]} s={1.0} seed={4} />
        <BareTree p={[-30, 0, 4]} s={1.0} seed={6} />
        <BareTree p={[-32, 0, -3]} s={0.9} seed={8} />
        <BareTree p={[17, 0, 17]} s={0.8} seed={9} />
        <Mango p={[15.5, 0, -11]} s={1.5} seed={2} />
        <Mango p={[-19, 0, -13]} s={1.5} seed={5} />
        <Mango p={[24, 0, 4]} s={1.4} seed={7} />
        <Mango p={[-26, 0, 16]} s={1.5} seed={3} />
        <Mango p={[4, 0, -27]} s={1.6} seed={11} />
        <Mango p={[-8, 0, 28]} s={1.3} seed={13} />
        {/* yard relics: dark stone pillar, carved fragments, fallen toran */}
        <StonePillar p={[-14, 0, 6]} />
        <Hanuman p={[-17, 0, 10]} r={0.5} />
        {[[-8, -9, 0.4], [-9.4, -8.2, 0.9], [-7, -10.3, 1.6], [-10.6, -10, 2.2]].map(([x, z, r], i) => <Box key={i} s={[0.8 + (i % 2) * 0.4, 0.4 + (i % 3) * 0.15, 0.6]} p={[x, 0.22, z]} r={[0, r, 0.1 * i]} m={dk} />)}
        <Box s={[0.5, 0.5, 3.0]} p={[-9, 0.28, -7.4]} r={[0, 0.5, 0]} m={dk} />
        <Box s={[0.4, 2.0, 0.4]} p={[-6, 1.0, -8]} r={[0, 0.3, 0.12]} m={dk} />
        <Box s={[0.55, 0.55, 0.55]} p={[-5.2, 0.28, -7.2]} r={[0, 0.7, 0]} m={M.plain('#5a4e46')} />
        {/* ruined palace walls behind and at the sides, broken and uneven */}
        <group>
          {[-22, -16.5, -10, -4, 2.5, 9, 15].map((x, i) => (
            <Box key={i} s={[3 + rn(i) * 2, 1.2 + rn(i + 4) * 3.4, 1.4]} p={[x + 3, (1.2 + rn(i + 4) * 3.4) / 2, -19 - rn(i + 8) * 1.2]} m={M.mat('brick', 2, Math.max(1, Math.round((1.2 + rn(i + 4) * 3.4) / 1.5)), BRK)} />
          ))}
          <BrokenArch p={[-4, 0, -17.5]} r={0.1} ro={2.2} ri={1.3} ys={2.8} flip seed={5} />
          <BrokenArch p={[-17, 0, -6]} r={1.3} ro={1.9} ri={1.1} ys={2.2} cut={90} stub={0.9} seed={8} />
          <BrokenArch p={[20, 0, -9]} r={-0.7} ro={2.0} ri={1.2} ys={2.4} cut={40} stub={2.2} flip seed={2} />
        </group>
        <TinRange p={[-21, 0, 3]} />
        <Hanuman p={[16, 0, 20]} r={-2.6} />
        {/* houses far out */}
        <FarHouse p={[-44, 0, 20]} r={0.4} />
        <FarHouse p={[-40, 0, -18]} r={1.2} s={1.1} />
        <FarHouse p={[46, 0, 6]} r={-0.3} />
        <FarHouse p={[36, 0, 38]} r={2} s={0.9} />
        <FarHouse p={[-12, 0, -46]} r={0.2} />
        {/* Jharokhar-like pond: flat brown-green water inside a low earthen bank */}
        <Ellipse rx={30} rz={15} h={0.5} p={[10, 0, -40]} m={bank} />
        <Ellipse rx={26.5} rz={12} h={0.3} y={-0.05} p={[10, 0, -40]} m={M.plain('#7f8a62', { roughness: 0.25, metalness: 0.1 })} />
        {/* tree line in the haze */}
        {horizon.map((h) => (
          <group key={h.i} position={[h.x, 0, h.z]}>
            <Ball rad={h.s} p={[0, h.s * 0.9, 0]} sc={[1.3, 0.85, 1.3]} m={h.i % 3 ? leaf : leaf2} />
            <Ball rad={h.s * 0.7} p={[h.s * 0.7, h.s * 0.7, 0]} sc={[1.2, 0.8, 1.2]} m={leaf2} />
          </group>
        ))}
      </group>
    );
  }

  return { 'simraungadh-ranivas': { Main, Env } };
}
