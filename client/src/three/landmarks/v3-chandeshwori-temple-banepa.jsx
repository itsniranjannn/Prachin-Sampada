// Chandeshwori Temple, Banepa. A compact three-roofed Newar pagoda: red-brick walls, three gilded roofs (28/20/12 carved
// struts), a gilded door with a carved torana between two stone lions, a row of five stone pillars with ball and animal
// finials in front, a white gumbaj shrine and a red shrine at front-left, a long saffron banner from the gajur. It stands in
// a stone-paved court ringed by two-storey brick buildings with tiled roofs and red valances, a brick gateway with a gilded
// toran panel on the front side, the Punyamata stream on the right and a steep forested hill rising straight behind.
// Front (+z). Compass facing and exact court plan are estimates.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Frame, Diyo, Tree, Water, THREE, useMemo, useRef, useEffect } = K;

  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- merged boxes: item = [sx,sy,sz, px,py,pz, rx,ry,rz] ---------- */
  function mergeBoxes(items) {
    const pos = [];
    const nor = [];
    const uv = [];
    const idx = [];
    let off = 0;
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    const mtx = new THREE.Matrix4();
    const nm = new THREE.Matrix3();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const ps = new THREE.Vector3();
    const base = new THREE.BoxGeometry(1, 1, 1);
    const bp = base.attributes.position;
    const bn = base.attributes.normal;
    const bu = base.attributes.uv;
    const bi = base.index;
    items.forEach(([sx, sy, sz, px, py, pz, rx = 0, ry = 0, rz = 0]) => {
      e.set(rx, ry, rz, 'YXZ');
      q.setFromEuler(e);
      ps.set(px, py, pz);
      sc.set(sx, sy, sz);
      mtx.compose(ps, q, sc);
      nm.getNormalMatrix(mtx);
      for (let i = 0; i < bp.count; i += 1) {
        v.fromBufferAttribute(bp, i).applyMatrix4(mtx);
        pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(bn, i).applyMatrix3(nm).normalize();
        nor.push(v.x, v.y, v.z);
        uv.push(bu.getX(i), bu.getY(i));
      }
      for (let i = 0; i < bi.count; i += 1) idx.push(bi.getX(i) + off);
      off += bp.count;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }
  function Merged({ items, m, cast = true }) {
    const g = useMemo(() => mergeBoxes(items), [items]);
    return <mesh geometry={g} material={m} castShadow={cast} receiveShadow />;
  }
  /* rotate a +z-face local item list round to face k (0 = +z, 1 = +x, 2 = -z, 3 = -x) */
  const face = (k, list) => list.map(([sx, sy, sz, x, y, z, rx = 0]) => {
    const a = (k * Math.PI) / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [sx, sy, sz, x * c + z * s, y, -x * s + z * c, rx, a, 0];
  });
  const allFaces = (list) => [0, 1, 2, 3].flatMap((k) => face(k, list));

  /* ---------- palette ---------- */
  function useP(M) {
    return {
      brick: M.mat('brick', 3, 2, { color: '#cc6a44' }),
      brickC: M.mat('brick', 3, 2, { color: '#a4503a' }),
      brickW: M.plain('#bd6038', { roughness: 0.9 }),
      blue: M.plain('#2b5fae', { roughness: 0.7 }),
      pstone: M.plain('#4b4641', { roughness: 0.95 }),
      brickD: M.mat('brick', 4, 2, { color: '#a9533a' }),
      dark: M.plain('#35200f', { roughness: 0.85 }),
      timber: M.plain('#4e2c16', { roughness: 0.85 }),
      lattice: M.plain('#8a4a1e', { roughness: 0.8, emissive: '#ff8a2a', emissiveIntensity: 0.12 }),
      void_: M.plain('#140d08', { roughness: 1 }),
      red: M.plain('#b3301d', { roughness: 0.8 }),
      redD: M.plain('#8e2415', { roughness: 0.85 }),
      white: M.plain('#f4efe4', { roughness: 0.8 }),
      cream: M.plain('#e9dcc0', { roughness: 0.85 }),
      stone: M.plain('#6b6560', { roughness: 0.95 }),
      figure: M.plain('#2b2521', { roughness: 0.6, metalness: 0.2 }),
      sindoor: M.plain('#b8341c', { roughness: 0.9 }),
      stoneL: M.plain('#b8b0a0', { roughness: 0.95 }),
      bronze: M.plain('#5d4128', { roughness: 0.5, metalness: 0.4 }),
      banner: new THREE.MeshStandardMaterial({ color: '#f3e4a2', roughness: 0.7, side: THREE.DoubleSide }),
      tile: M.plain('#8c4a2e', { roughness: 0.9 }),
      paving: M.mat('granite', 10, 10, { color: '#bdb5a5' }),
      earth: M.plain('#8c7d63', { roughness: 1 }),
      teal: M.plain('#3a8088', { roughness: 0.7 }),
    };
  }

  /* ---------- strut ring: dense carved brackets under a roof ---------- */
  function Struts({ hw, ez, yw, ye, n, P }) {
    const { dark, tips } = useMemo(() => {
      const d = [];
      const t = [];
      const dz = ez - hw;
      const dy = ye - yw;
      const L = Math.hypot(dz, dy);
      const th = Math.atan2(dz, dy);
      const side = range(n, (i) => {
        const x = lerp(-hw * 0.9, hw * 0.9, n === 1 ? 0.5 : i / (n - 1));
        d.push([0.09, L, 0.09, x, (yw + ye) / 2, (hw + ez) / 2, th]);
        d.push([0.05, 0.3 * L, 0.2, x, yw + 0.06, hw + 0.06, th * 0.3]);
        return [0.14, 0.13, 0.14, x, ye - 0.02, ez];
      });
      return { dark: allFaces(d.map((i) => i)), tips: allFaces(side) };
    }, [hw, ez, yw, ye, n]);
    return (
      <>
        <Merged items={dark} m={P.timber} />
        <Merged items={tips} m={P.redD} />
      </>
    );
  }

  /* ---------- upper-storey window band ---------- */
  function WindowBand({ hw, y, ws, hgt, P }) {
    const { frames, lat, bars } = useMemo(() => {
      const f = [];
      const l = [];
      const b = [];
      ws.forEach(([x, w]) => {
        f.push([w, hgt, 0.07, x, y, hw + 0.02]);
        l.push([w * 0.82, hgt * 0.8, 0.05, x, y, hw + 0.05]);
        [-0.25, 0, 0.25].forEach((k) => b.push([0.025, hgt * 0.8, 0.03, x + k * w * 0.8, y, hw + 0.08]));
        b.push([w * 0.82, 0.025, 0.03, x, y, hw + 0.08]);
      });
      return { frames: allFaces(f), lat: allFaces(l), bars: allFaces(b) };
    }, [hw, y, hgt, ws]);
    return (
      <>
        <Merged items={frames} m={P.dark} />
        <Merged items={lat} m={P.lattice} cast={false} />
        <Merged items={bars} m={P.dark} cast={false} />
      </>
    );
  }

  const W2 = [[-0.6, 0.38], [0, 0.48], [0.6, 0.38]];
  const W3 = [[-0.3, 0.22], [0, 0.26], [0.3, 0.22]];

  /* ---------- stone pillar: dark stained shaft, sindoor base, bulbous capital, dark animal figure ---------- */
  function Pillar({ p, kind, P }) {
    return (
      <group position={p}>
        <Box s={[0.32, 0.14, 0.32]} p={[0, 0.07, 0]} m={P.stone} />
        <Cyl rt={0.088} rb={0.1} h={1.25} p={[0, 0.76, 0]} m={P.pstone} seg={12} />
        <Cyl rt={0.108} rb={0.108} h={0.2} p={[0, 0.24, 0]} m={P.sindoor} seg={12} />
        <Cyl rt={0.14} rb={0.14} h={0.06} p={[0, 1.4, 0]} m={P.pstone} seg={12} />
        <Ball rad={0.23} sc={[1, 1.4, 1]} p={[0, 1.65, 0]} m={P.pstone} />
        <Cyl rt={0.08} rb={0.14} h={0.12} p={[0, 1.46, 0]} m={P.pstone} seg={12} />
        <Cyl rt={0.2} rb={0.15} h={0.07} p={[0, 1.96, 0]} m={P.pstone} seg={12} />
        {kind === 'lion' && (
          <group position={[0, 2.0, 0]} scale={1.33}>
            <Lion m={P.figure} />
          </group>
        )}
        {kind === 'peacock' && (
          <group position={[0, 2.0, 0]} scale={1.4}>
            <Ball rad={0.1} sc={[1, 0.85, 1.5]} p={[0, 0.1, 0]} m={P.figure} />
            <Cyl rt={0.025} rb={0.04} h={0.22} p={[0, 0.26, 0.1]} m={P.figure} seg={6} />
            <Ball rad={0.045} p={[0, 0.39, 0.12]} m={P.figure} />
            <Cyl rt={0.17} rb={0.17} h={0.012} p={[0, 0.24, -0.14]} r={[Math.PI / 2 - 0.35, 0, 0]} m={P.figure} seg={14} />
          </group>
        )}
      </group>
    );
  }

  /* ---------- small whitewashed shikhara shrine ---------- */
  function WhiteShrine({ p, s = 1, P, M }) {
    return (
      <group position={p} scale={s}>
        <Box s={[0.6, 0.14, 0.6]} p={[0, 0.07, 0]} m={P.stoneL} />
        <Box s={[0.44, 0.42, 0.44]} p={[0, 0.35, 0]} m={P.white} />
        <Box s={[0.5, 0.05, 0.5]} p={[0, 0.58, 0]} m={P.white} />
        <Cyl rt={0.2} rb={0.27} h={0.3} p={[0, 0.76, 0]} m={P.white} seg={8} />
        <Cyl rt={0.1} rb={0.2} h={0.3} p={[0, 1.04, 0]} m={P.white} seg={8} />
        <Cyl rt={0.03} rb={0.1} h={0.28} p={[0, 1.3, 0]} m={P.white} seg={8} />
        <Box s={[0.18, 0.24, 0.05]} p={[0, 0.36, 0.23]} m={M.gold} />
        <Box s={[0.1, 0.17, 0.06]} p={[0, 0.35, 0.24]} m={P.void_} />
        <Gajur y={1.42} s={0.3} />
      </group>
    );
  }
  /* red-painted octagonal shrine with small white dome */
  function RedShrine({ p, s = 1, P, M }) {
    return (
      <group position={p} scale={s}>
        <Box s={[0.95, 0.16, 0.95]} p={[0, 0.08, 0]} m={P.stoneL} />
        <Cyl rt={0.4} rb={0.43} h={0.95} p={[0, 0.63, 0]} m={P.red} seg={8} />
        <Cyl rt={0.45} rb={0.45} h={0.07} p={[0, 0.62, 0]} m={P.white} seg={8} />
        <Cyl rt={0.46} rb={0.42} h={0.1} p={[0, 1.15, 0]} m={P.white} seg={8} />
        <Box s={[0.24, 0.36, 0.05]} p={[0, 0.5, 0.42]} m={M.gold} />
        <Box s={[0.14, 0.26, 0.06]} p={[0, 0.48, 0.43]} m={P.void_} />
        <Ball rad={0.3} sc={[1, 0.9, 1]} p={[0, 1.2, 0]} m={P.white} />
        <Cyl rt={0.06} rb={0.14} h={0.3} p={[0, 1.5, 0]} m={P.white} seg={8} />
        <Gajur y={1.62} s={0.4} />
      </group>
    );
  }

  /* hanging saffron ribbon with slight sag */
  function Ribbon({ a, b, w = 0.1, sag = 0.14, m }) {
    const g = useMemo(() => {
      const n = 16;
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const l = Math.hypot(dx, dz) || 1;
      const px = (dz / l) * (w / 2);
      const pz = (-dx / l) * (w / 2);
      const pos = [];
      const idx = [];
      for (let i = 0; i <= n; i += 1) {
        const t = i / n;
        const x = lerp(a[0], b[0], t);
        const y = lerp(a[1], b[1], t) - sag * Math.sin(Math.PI * t);
        const z = lerp(a[2], b[2], t);
        pos.push(x - px, y, z - pz, x + px, y, z + pz);
        if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    }, [a, b, w, sag]);
    return <mesh geometry={g} material={m} />;
  }

  /* ---------- the three-roofed pagoda ---------- */
  function ChandeshMain() {
    const M = useM();
    const P = useP(M);
    const ZF = 1.5;
    const doorItems = useMemo(() => {
      const c = [];
      [-1, 1].forEach((k) => {
        [0.92, 1.26].forEach((x) => c.push([0.3, 0.62, 0.05, k * x, 1.12, ZF + 0.0]));
        [0.92, 1.26].forEach((x) => c.push([0.2, 0.5, 0.06, k * x, 1.12, ZF + 0.02]));
        [0.92, 1.26].forEach((x) => c.push([0.22, 0.12, 0.05, k * x, 1.55, ZF + 0.0]));
      });
      return c;
    }, []);
    const doorDark = useMemo(() => {
      const c = [];
      [-1, 1].forEach((k) => {
        [0.92, 1.26].forEach((x) => c.push([0.3, 0.62, 0.05, k * x, 1.12, ZF - 0.01]));
        [0.92, 1.26].forEach((x) => c.push([0.36, 0.08, 0.06, k * x, 1.46, ZF + 0.0]));
      });
      return c;
    }, []);
    const arches = useMemo(() => {
      const d = [];
      const g = [];
      range(7, (i) => lerp(-1.2, 1.2, i / 6)).forEach((x) => {
        d.push([0.2, 0.2, 0.07, x, 1.98, 1.47]);
        d.push([0.14, 0.08, 0.07, x, 2.12, 1.47]);
        d.push([0.08, 0.05, 0.07, x, 2.19, 1.47]);
        g.push([0.09, 0.15, 0.08, x, 1.97, 1.48]);
      });
      return { d: allFaces(d), g: allFaces(g) };
    }, []);
    return (
      <group>
        <Frame s={[9.2, 7.4, 6.4]} p={[0.5, 3.7, 1.0]} />
        {/* low court-level base */}
        <Box s={[3.9, 0.14, 3.9]} p={[0, 0.07, 0]} m={P.stone} />
        {/* ground storey: tall, dark, slightly battered brick cella */}
        <Cyl rt={2.05} rb={2.21} h={2.1} p={[0, 1.1, 0]} r={[0, Math.PI / 4, 0]} m={P.brickC} seg={4} />
        <Box s={[3.14, 0.12, 3.14]} p={[0, 2.12, 0]} m={P.dark} />
        <Box s={[3.2, 0.08, 3.2]} p={[0, 0.2, 0]} m={P.dark} />
        <Box s={[3.06, 0.07, 3.06]} p={[0, 1.15, 0]} m={P.timber} />
        <Box s={[3.0, 0.07, 3.0]} p={[0, 1.78, 0]} m={P.timber} />
        <Roof w={4.4} d={4.4} h={0.62} y={2.2} m={M.gold} />
        <Box s={[4.3, 0.06, 4.3]} p={[0, 2.18, 0]} m={P.dark} cast={false} />
        <Struts hw={1.5} ez={2.15} yw={1.75} ye={2.17} n={9} P={P} />
        <Merged items={arches.d} m={P.dark} />
        <Merged items={arches.g} m={M.gold} cast={false} />
        {/* second storey: tall, dark, carved strut zone */}
        <Box s={[2.1, 1.3, 2.1]} p={[0, 3.03, 0]} m={P.brickC} />
        <Box s={[2.2, 0.1, 2.2]} p={[0, 3.67, 0]} m={P.dark} />
        <WindowBand hw={1.05} y={3.05} ws={W2} hgt={0.6} P={P} />
        <Roof w={3.1} d={3.1} h={0.68} y={3.7} m={M.gold} />
        <Box s={[3.0, 0.06, 3.0]} p={[0, 3.68, 0]} m={P.dark} cast={false} />
        <Struts hw={1.05} ez={1.5} yw={2.75} ye={3.66} n={6} P={P} />
        {/* third storey */}
        <Box s={[1.5, 1.08, 1.5]} p={[0, 4.44, 0]} m={P.brickC} />
        <Box s={[1.58, 0.1, 1.58]} p={[0, 4.97, 0]} m={P.dark} />
        <WindowBand hw={0.75} y={4.5} ws={W3} hgt={0.5} P={P} />
        <Roof w={2.2} d={2.2} h={0.8} y={5.0} m={M.gold} />
        <Box s={[2.1, 0.06, 2.1]} p={[0, 4.98, 0]} m={P.dark} cast={false} />
        <Struts hw={0.75} ez={1.1} yw={4.05} ye={4.96} n={4} P={P} />
        {/* gajur and pale rope/banner draped down the front-right hip */}
        <Cyl rt={0.12} rb={0.2} h={0.2} p={[0, 5.88, 0]} m={M.gold} />
        <Gajur y={5.82} s={1.3} />
        <Ribbon a={[0.04, 5.95, 0.06]} b={[1.14, 5.04, 1.14]} w={0.18} sag={0.06} m={P.banner} />
        <Ribbon a={[1.14, 5.04, 1.14]} b={[1.6, 3.74, 1.6]} w={0.18} sag={0.22} m={P.banner} />
        <Ribbon a={[1.6, 3.74, 1.6]} b={[2.24, 2.34, 2.24]} w={0.18} sag={0.25} m={P.banner} />
        {/* gilded door with dark timber surround, large torana arch, niche panels */}
        <Box s={[1.05, 1.6, 0.1]} p={[0, 0.9, ZF + 0.0]} m={P.timber} />
        <Box s={[0.8, 1.15, 0.08]} p={[0, 0.74, ZF + 0.04]} m={M.gold} />
        <Box s={[0.5, 1.02, 0.1]} p={[0, 0.68, ZF + 0.07]} m={P.void_} />
        <Box s={[0.07, 1.1, 0.08]} p={[-0.33, 0.72, ZF + 0.09]} m={M.gold} />
        <Box s={[0.07, 1.1, 0.08]} p={[0.33, 0.72, ZF + 0.09]} m={M.gold} />
        <Box s={[0.72, 0.07, 0.08]} p={[0, 1.27, ZF + 0.09]} m={M.gold} />
        <mesh position={[0, 1.2, ZF + 0.03]} material={P.timber} castShadow><circleGeometry args={[0.64, 22, 0, Math.PI]} /></mesh>
        <mesh position={[0, 1.2, ZF + 0.045]} material={M.gold}><circleGeometry args={[0.52, 22, 0, Math.PI]} /></mesh>
        <mesh position={[0, 1.2, ZF + 0.06]} material={P.dark}><circleGeometry args={[0.4, 22, 0, Math.PI]} /></mesh>
        <mesh position={[0, 1.2, ZF + 0.07]} material={M.gold}><torusGeometry args={[0.6, 0.04, 6, 22, Math.PI]} /></mesh>
        <mesh position={[0, 1.2, ZF + 0.075]} material={M.gold}><torusGeometry args={[0.3, 0.025, 6, 18, Math.PI]} /></mesh>
        <Merged items={doorDark} m={P.timber} cast={false} />
        <Merged items={doorItems.slice(8)} m={M.gold} cast={false} />
        <Merged items={doorItems.slice(4, 8)} m={M.gold} cast={false} />
        {/* stone lions on pedestals */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.15, 0, 2.0]}>
            <Box s={[0.34, 0.3, 0.34]} p={[0, 0.15, 0]} m={P.red} />
            <Box s={[0.4, 0.06, 0.4]} p={[0, 0.31, 0]} m={P.stoneL} />
            <group position={[0, 0.32, 0]} scale={1.3}><Lion m={P.bronze} /></group>
          </group>
        ))}
        {/* row of five stone pillars, set well off the door */}
        {[[-1.8, 'peacock'], [-0.9, 'lion'], [0, 'peacock'], [0.9, 'lion'], [1.8, 'peacock']].map(([x, kind]) => (
          <Pillar key={x} p={[x, 0, 2.85]} kind={kind} P={P} />
        ))}
        {/* shrines, front-left */}
        <WhiteShrine p={[-3.3, 0, 2.7]} s={1.05} P={P} M={M} />
        <RedShrine p={[-3.7, 0, 0.9]} s={0.7} P={P} M={M} />
        <Diyo p={[-2.5, 0.16, 3.3]} light />
        <Diyo p={[-0.3, 0.02, 2.2]} />
        <pointLight position={[0, 1.2, 2.3]} intensity={1.0} distance={5} color="#ffb35a" />
      </group>
    );
  }

  /* ---------- court wing: one-storey orange brick range, lean-to tile skirt on timber struts, red valance ---------- */
  function gableGeo(L, hd, h) {
    const s = new THREE.Shape();
    s.moveTo(-hd, 0); s.lineTo(hd, 0); s.lineTo(0, h); s.lineTo(-hd, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false });
    g.translate(0, 0, -L / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }
  /* lean-to: eave at local z = +1.95 (court side), high edge at the back wall z = -1.1 */
  function leanGeo(L, rise) {
    const s = new THREE.Shape();
    s.moveTo(-1.95, 0); s.lineTo(1.1, 0); s.lineTo(1.1, rise); s.lineTo(-1.95, 0.16); s.lineTo(-1.95, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false });
    g.translate(0, 0, -L / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }
  function Wing({ p, r = 0, len, P, h = 1.9 }) {
    const roofGeo = useMemo(() => leanGeo(len + 0.3, 0.45), [len]);
    const { fr, lat, bars, st } = useMemo(() => {
      const n = Math.max(1, Math.floor(len / 2.0));
      const f = [];
      const l = [];
      const b = [];
      const t = [];
      const wy = h * 0.5;
      const ww = 0.9;
      const wh = Math.min(1.0, h * 0.56);
      range(n, (i) => lerp(-len / 2 + 1.0, len / 2 - 1.0, n === 1 ? 0.5 : i / (n - 1))).forEach((x) => {
        f.push([ww + 0.14, wh + 0.14, 0.08, x, wy, 1.1]);
        l.push([ww, wh, 0.05, x, wy, 1.13]);
        [-0.3, -0.15, 0, 0.15, 0.3].forEach((k) => b.push([0.025, wh, 0.03, x + k * ww / 0.9, wy, 1.16]));
        [-0.25, 0.05, 0.3].forEach((k) => b.push([ww, 0.025, 0.03, x, wy + k * wh, 1.16]));
      });
      const m = Math.floor(len / 1.0);
      const dz = 1.75 - 1.1;
      const dy = 0.5;
      const th = Math.atan2(dz, dy);
      range(m, (i) => lerp(-len / 2 + 0.5, len / 2 - 0.5, m === 1 ? 0.5 : i / (m - 1))).forEach((x) => {
        t.push([0.09, Math.hypot(dz, dy), 0.09, x, h - 0.2, 1.1 + dz / 2, th]);
      });
      return { fr: f, lat: l, bars: b, st: t };
    }, [len, h]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[len, h, 2.2]} p={[0, h / 2, 0]} m={P.brickW} />
        <Box s={[len + 0.02, 0.1, 2.28]} p={[0, 0.05, 0]} m={P.stone} />
        <Box s={[len + 0.04, 0.1, 2.26]} p={[0, h - 0.05, 0]} m={P.dark} />
        <mesh geometry={roofGeo} position={[0, h, 0]} material={P.tile} castShadow receiveShadow />
        <Box s={[len + 0.3, 0.2, 0.05]} p={[0, h + 0.02, 1.96]} m={P.red} cast={false} />
        <Box s={[len + 0.3, 0.035, 0.06]} p={[0, h - 0.1, 1.96]} m={P.white} cast={false} />
        <Merged items={st} m={P.timber} />
        <Merged items={fr} m={P.dark} />
        <Merged items={lat} m={P.lattice} cast={false} />
        <Merged items={bars} m={P.dark} cast={false} />
      </group>
    );
  }

  /* ---------- brick gateway with gilded toran panel ---------- */
  function Gateway({ p, P, M }) {
    const roofGeo = useMemo(() => gableGeo(3.9, 1.6, 0.85), []);
    return (
      <group position={p}>
        <Box s={[3.1, 3.1, 2.3]} p={[0, 1.55, 0]} m={P.brick} />
        <Box s={[3.16, 0.12, 2.36]} p={[0, 1.52, 0]} m={P.dark} />
        <Box s={[3.16, 0.1, 2.36]} p={[0, 0.05, 0]} m={P.stone} />
        {/* passage */}
        <Box s={[1.1, 1.75, 2.5]} p={[0, 0.9, 0]} m={P.void_} />
        <Box s={[1.3, 0.14, 0.14]} p={[0, 1.82, 1.2]} m={M.gold} />
        <Box s={[0.1, 1.8, 0.14]} p={[-0.6, 0.95, 1.2]} m={P.red} />
        <Box s={[0.1, 1.8, 0.14]} p={[0.6, 0.95, 1.2]} m={P.red} />
        {/* gilded toran deity panel */}
        <Box s={[1.5, 1.05, 0.06]} p={[0, 2.38, 1.17]} m={P.red} />
        <Box s={[1.2, 0.8, 0.07]} p={[0, 2.38, 1.2]} m={P.teal} />
        <mesh position={[0, 2.38, 1.24]} material={M.gold}><torusGeometry args={[0.38, 0.04, 6, 20]} /></mesh>
        <mesh position={[0, 2.38, 1.235]} material={M.gold}><circleGeometry args={[0.34, 20]} /></mesh>
        <Box s={[0.16, 0.3, 0.05]} p={[0, 2.38, 1.26]} m={P.blue} />
        <Box s={[0.5, 0.06, 0.05]} p={[0, 2.34, 1.27]} m={M.gold} />
        <Ball rad={0.06} p={[-0.2, 2.5, 1.26]} m={P.blue} />
        <Ball rad={0.06} p={[0.2, 2.5, 1.26]} m={P.blue} />
        <Box s={[0.1, 0.34, 0.05]} p={[-0.28, 2.3, 1.26]} m={P.teal} />
        <Box s={[0.1, 0.34, 0.05]} p={[0.28, 2.3, 1.26]} m={P.teal} />
        <Box s={[1.7, 0.1, 0.1]} p={[0, 2.95, 1.2]} m={M.gold} />
        <Ball rad={0.07} p={[0, 2.62, 1.26]} m={M.gold} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.18, 0.4, 0.05]} p={[k * 0.7, 2.38, 1.24]} m={M.gold} />
            <Box s={[0.7, 0.75, 0.05]} p={[k * 1.17, 2.35, 1.17]} m={P.cream} />
            {[-0.2, 0, 0.2].map((o) => <Box key={o} s={[0.03, 0.7, 0.03]} p={[k * 1.17 + o, 2.35, 1.2]} m={P.dark} cast={false} />)}
            <Box s={[0.7, 0.03, 0.03]} p={[k * 1.17, 2.35, 1.2]} m={P.dark} cast={false} />
            <group position={[k * 1.0, 0, 1.5]}>
              <Box s={[0.4, 0.34, 0.4]} p={[0, 0.17, 0]} m={P.red} />
              <group position={[0, 0.34, 0]} scale={1.8}><Lion m={P.bronze} /></group>
            </group>
          </group>
        ))}
        {/* red-valance tiled roof with gold ridge finials */}
        <mesh geometry={roofGeo} position={[0, 3.1, 0]} material={P.tile} castShadow />
        {[1, -1].map((k) => (
          <group key={k}>
            <Box s={[4.2, 0.24, 0.05]} p={[0, 3.0, k * 1.62]} m={P.red} cast={false} />
            <Box s={[4.2, 0.04, 0.06]} p={[0, 2.87, k * 1.62]} m={P.white} cast={false} />
          </group>
        ))}
        {[-1.6, 0, 1.6].map((x) => <group key={x} position={[x, 0, 0]}><Gajur y={3.9} s={0.3} /></group>)}
        <pointLight position={[0, 1.4, 1.8]} intensity={0.9} distance={5} color="#ffb35a" />
      </group>
    );
  }

  /* ---------- terrain: flat court, steep forested hill behind, Punyamata channel on the right ---------- */
  const RIVER_X = 15.5;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function H(x, z) {
    let h = 0;
    const t = -9.5 - z;
    if (t > 0) {
      h = 20 * (1 - Math.exp(-Math.pow(t / 12, 1.5)));
      h += Math.sin(x * 0.33 + z * 0.21) * 0.9 * Math.min(1, t / 6) + Math.sin(x * 0.13 - z * 0.37) * 0.8 * Math.min(1, t / 8);
    }
    h += 0.28 * Math.max(0, Math.abs(x) - 30);
    h += 0.3 * Math.max(0, z - 36);
    if (z > -13) {
      const dx = Math.abs(x - RIVER_X - Math.sin(z * 0.18) * 0.8);
      h -= 0.55 * (1 - smooth(1.4, 3.4, dx)) * smooth(-13, -10, z);
    }
    return h;
  }
  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(150, 130, 210, 182);
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0, -5);
      const p = g.attributes.position;
      const col = [];
      const c = new THREE.Color();
      const grass = new THREE.Color('#5f7d3f');
      const mid = new THREE.Color('#2a5226');
      const hi = new THREE.Color('#244a22');
      const sand = new THREE.Color('#b3a78c');
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i);
        const z = p.getZ(i);
        const h = H(x, z);
        p.setY(i, h);
        if (h < -0.08) c.copy(sand);
        else {
          c.copy(grass).lerp(mid, Math.min(1, h / 2.5)).lerp(hi, Math.min(1, Math.max(0, (h - 4) / 6)));
          const nz = Math.sin(x * 1.7) * Math.cos(z * 1.3) * 0.04;
          c.offsetHSL(0, 0, nz * 0.5);
        }
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return (
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
    );
  }
  function Forest() {
    const ref = useRef();
    const data = useMemo(() => {
      let s = 12345;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const out = [];
      const greens = ['#3a6a33', '#35622f', '#3f7036', '#33602d'];
      let tries = 0;
      while (out.length < 11000 && tries < 150000) {
        tries += 1;
        const x = (rnd() - 0.5) * 120;
        const z = -62 + rnd() * 100;
        if (Math.abs(x - RIVER_X) < 4 && z > -14) continue;
        const h = H(x, z);
        if (h < 0.9) continue;
        const sc = 0.22 + rnd() * 0.16;
        out.push({ x, y: h + sc * 0.6, z, s: sc, r: rnd() * 6, c: greens[Math.floor(rnd() * greens.length)] });
      }
      return out;
    }, []);
    useEffect(() => {
      const o = new THREE.Object3D();
      const c = new THREE.Color();
      data.forEach((t, i) => {
        o.position.set(t.x, t.y, t.z);
        o.scale.set(t.s * 1.1, t.s * 1.3, t.s * 1.1);
        o.rotation.y = t.r;
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        c.set(t.c);
        ref.current.setColorAt(i, c);
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [data]);
    return (
      <instancedMesh ref={ref} args={[undefined, undefined, data.length]} castShadow frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    );
  }

  function ChandeshEnv() {
    const M = useM();
    const P0 = useP(M);
    const flag = useMemo(() => {
      if (typeof document === 'undefined') return null;
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const c = cv.getContext('2d');
      c.fillStyle = '#6d665a'; c.fillRect(0, 0, 256, 256);
      let sd = 5;
      const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
        const v = 118 + Math.floor(r() * 36);
        c.fillStyle = `rgb(${v},${v - 6},${v - 18})`;
        c.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
      }
      c.strokeStyle = '#3c372f'; c.lineWidth = 3;
      for (let i = 0; i <= 4; i += 1) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 256); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(256, i * 64); c.stroke(); }
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(8, 8);
      if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []);
    const P = useMemo(() => (flag ? { ...P0, paving: new THREE.MeshStandardMaterial({ map: flag, roughness: 1 }) } : P0), [P0, flag]);
    const boulders = useMemo(() => {
      let s = 777;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      return range(26, () => {
        const z = -10 + rnd() * 40;
        const side = rnd() < 0.5 ? -1 : 1;
        const x = RIVER_X + Math.sin(z * 0.18) * 0.8 + side * (1.0 + rnd() * 1.6) * (rnd() < 0.4 ? 0.3 : 1);
        return [x, z, 0.14 + rnd() * 0.3, rnd() * 3];
      });
    }, []);
    return (
      <group>
        <Terrain />
        <Forest />
        {/* stone-paved court, about 10 x 10 m */}
        <Box s={[17.6, 0.06, 17]} p={[0, -0.02, 0.4]} m={P.earth} cast={false} />
        <Box s={[10.4, 0.1, 10.4]} p={[0, 0.0, 0]} m={P.paving} cast={false} />
        {/* ranges round the court: back (lowest, so the hill shows), left, right, front (low) */}
        <Wing p={[0, 0.05, -6.3]} r={0} len={14.8} P={P} h={1.4} />
        <Wing p={[-6.3, 0.05, 0]} r={Math.PI / 2} len={10.4} P={P} h={1.55} />
        <Wing p={[6.3, 0.05, 0]} r={-Math.PI / 2} len={10.4} P={P} h={1.55} />
        <Box s={[11.4, 0.7, 0.6]} p={[-1.7, 0.35, 6.3]} m={P.brickW} />
        <Box s={[11.5, 0.08, 0.72]} p={[-1.7, 0.72, 6.3]} m={P.stone} />
        <group position={[5.6, 0.05, 6.5]} scale={0.56}><Gateway p={[0, 0, 0]} P={P} M={M} /></group>
        {/* the Punyamata stream */}
        <Water w={4.2} d={66} p={[RIVER_X, -0.14, 20]} color="#6e9a9c" />
        {boulders.map(([x, z, r, k], i) => (
          <Ball key={i} rad={r} sc={[1.2, 0.7, 1]} p={[x, r * 0.3 - 0.08, z]} m={P.stone} />
        ))}
        {/* a few broadleaf trees on the lane side */}
        <Tree p={[11.5, 0, 10]} s={1.6} />
        <Tree p={[12.5, 0, 6]} s={1.3} />
        <Tree p={[-12, 0, 9]} s={1.5} />
        <Tree p={[-11.5, 0, -3]} s={1.7} />
        <Tree p={[11.8, 0, -8]} s={1.6} />
      </group>
    );
  }

  return { 'chandeshwori-temple-banepa': { Main: ChandeshMain, Env: ChandeshEnv } };
}
