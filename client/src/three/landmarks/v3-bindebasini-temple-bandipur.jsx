// Bindebasini Temple, Bandipur (Tanahun, Gandaki). A small two-roofed Newar pagoda of red brick and dark carved timber, at the head of
// the bazaar in a small stone-paved square, hemmed in by tall Newar houses. Front (door) faces +z toward the square.
// Scale: wall width 2.6 units (about 6 m), so roughly 0.43 units per metre.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Tree, lighten, THREE, useMemo } = K;
  const V3 = THREE.Vector3;
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _one = new V3(1, 1, 1);

  /* merge many boxes into ONE geometry. item: {s:[w,h,d], p:[x,y,z], r?:[rx,ry,rz], q?:Quaternion} */
  function boxesGeo(list) {
    const P = []; const N = []; const U = []; const I = [];
    let off = 0;
    list.forEach((b) => {
      const g = new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]);
      if (b.q) _q.copy(b.q); else _q.setFromEuler(_e.set(...(b.r || [0, 0, 0])));
      _m.compose(new V3(b.p[0], b.p[1], b.p[2]), _q, _one);
      g.applyMatrix4(_m);
      const pa = g.attributes.position.array; const na = g.attributes.normal.array; const ua = g.attributes.uv.array;
      for (let i = 0; i < pa.length; i += 1) P.push(pa[i]);
      for (let i = 0; i < na.length; i += 1) N.push(na[i]);
      for (let i = 0; i < ua.length; i += 1) U.push(ua[i]);
      const ia = g.index.array;
      for (let i = 0; i < ia.length; i += 1) I.push(ia[i] + off);
      off += g.attributes.position.count;
      g.dispose();
    });
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    G.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    G.setIndex(I);
    return G;
  }
  const Bx = ({ list, m, cast = true }) => {
    const g = useMemo(() => boxesGeo(list), [list]);
    return <mesh geometry={g} material={m} castShadow={cast} receiveShadow />;
  };
  const Y = new V3(0, 1, 0);
  /* a slanted strut from a to b */
  function strut(a, b, th = 0.1) {
    const A = new V3(...a); const B = new V3(...b);
    const d = B.clone().sub(A); const len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(Y, d.normalize());
    return { s: [th, len, th * 0.75], p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], q };
  }
  const rbase = (e, rh, hx, hz, rw, rd, sag, lift) => {
    const ax = hx / (rw / 2); const az = hz / (rd / 2);
    return e + rh * ((1 - Math.max(ax, az)) ** sag + lift * (ax * az) ** 2.4);
  };

  /* ---------- dimensions (units) ---------- */
  const G = 0.24;                       // plinth top
  const E1 = G + 1.5;                   // lower eave
  const R1 = { w: 4.2, d: 3.9, h: 0.3, sag: 1.15, lift: 0.15 };
  const B2 = rbase(E1, R1.h, 0.9, 0.85, R1.w, R1.d, R1.sag, R1.lift) - 0.08;
  const WH = 1.4;
  const E2 = B2 + WH;                  // upper eave
  const R2 = { w: 2.95, d: 2.85, h: 0.55, sag: 1.2, lift: 0.12 };
  const APEX = E2 + R2.h;

  /* ---------- small temple parts ---------- */
  function Valance({ w, d, y, h = 0.2 }) {
    const M = useM();
    const { band, fringe, trim } = useMemo(() => {
      const band = []; const fringe = []; const trim = [];
      [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, d, 1], [-w / 2, 0, d, 1]].forEach(([x, z, len, rot]) => {
        band.push(rot ? { s: [0.045, h, len], p: [x, y - h / 2, z] } : { s: [len, h, 0.045], p: [x, y - h / 2, z] });
        trim.push(rot ? { s: [0.08, 0.05, len + 0.05], p: [x, y + 0.005, z] } : { s: [len + 0.05, 0.05, 0.08], p: [x, y + 0.005, z] });
        trim.push(rot ? { s: [0.06, 0.035, len], p: [x, y - h - 0.01, z] } : { s: [len, 0.035, 0.06], p: [x, y - h - 0.01, z] });
        const n = Math.floor(len / 0.1);
        for (let i = 0; i < n; i += 1) {
          const t = -len / 2 + ((i + 0.5) * len) / n; const a = i % 2 ? 0.1 : 0.065;
          fringe.push(rot ? { s: [0.03, a, 0.05], p: [x, y - h - 0.03 - a / 2, z + t] } : { s: [0.05, a, 0.03], p: [x + t, y - h - 0.03 - a / 2, z] });
        }
      });
      return { band, fringe, trim };
    }, [w, d, y, h]);
    return (
      <group>
        <Bx list={band} m={M.plain('#d3304a', { roughness: 0.7, emissive: '#5a0d1a', emissiveIntensity: 0.3 })} cast={false} />
        <Bx list={fringe} m={M.plain('#f6dede', { roughness: 0.8 })} cast={false} />
        <Bx list={trim} m={M.dark} cast={false} />
      </group>
    );
  }
  function Lattice({ p, r = 0, w = 0.5, h = 0.6, nb = 3 }) {
    const M = useM();
    const { fr, bars } = useMemo(() => {
      const fr = [{ s: [w, h, 0.08], p: [0, 0, 0] }, { s: [w + 0.1, 0.07, 0.12], p: [0, h / 2 + 0.03, 0.01] }, { s: [w + 0.08, 0.05, 0.12], p: [0, -h / 2 - 0.02, 0.01] }];
      const bars = [];
      for (let i = 1; i <= nb; i += 1) {
        bars.push({ s: [0.025, h * 0.86, 0.03], p: [-w / 2 + (w * i) / (nb + 1), 0, 0.06] });
        bars.push({ s: [w * 0.86, 0.025, 0.03], p: [0, -h / 2 + (h * i) / (nb + 1), 0.06] });
      }
      return { fr, bars };
    }, [w, h, nb]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Bx list={fr} m={M.plain('#2b1c14', { roughness: 0.8 })} cast={false} />
        <Box s={[w * 0.88, h * 0.88, 0.05]} p={[0, 0, 0.04]} m={M.plain('#120b07', { emissive: '#ff9a3a', emissiveIntensity: 0.1 })} cast={false} />
        <Bx list={bars} m={M.plain('#6a4a30', { roughness: 0.8 })} cast={false} />
      </group>
    );
  }
  function Bell({ p }) {
    const M = useM();
    const bronze = M.plain('#8a6a2c', { metalness: 0.75, roughness: 0.4 });
    return (
      <group position={p}>
        <Cyl rt={0.012} h={0.14} p={[0, 0.07, 0]} m={M.dark} seg={5} />
        <Cyl rt={0.045} rb={0.1} h={0.2} p={[0, -0.08, 0]} m={bronze} seg={12} />
        <Ball rad={0.03} p={[0, -0.2, 0]} m={bronze} />
      </group>
    );
  }

  function Temple() {
    const M = useM();
    const stone = M.mat('stone', 3, 3, { color: '#ffffff' });
    const brick = M.mat('brick', 3, 2, { color: '#eaa994' });
    const redUp = M.plain('#b8281f', { roughness: 0.7 });
    const redUpDim = M.plain('#a3221b', { roughness: 0.75 });
    const roofM = M.plain('#5d645e', { roughness: 0.9, metalness: 0 });
    const dark = M.plain('#2b1c14', { roughness: 0.8 });
    const teal = M.plain('#2f8f80', { roughness: 0.6 });
    const gold = M.gold;
    const woodDk = M.plain('#3a281d', { roughness: 0.8 });

    const parts = useMemo(() => {
      const timber = []; const frieze = []; const goldB = []; const struts = []; const figs = [];
      /* ground storey front: posts, beams */
      [-0.5, 0.5].forEach((x) => timber.push({ s: [0.1, 1.4, 0.1], p: [x, G + 0.7, 1.7] }));
      [-1.42, 1.42].forEach((x) => timber.push({ s: [0.16, 0.95, 0.16], p: [x, G + 0.45 + 0.475, 1.75] }));
      timber.push({ s: [3.1, 0.1, 0.14], p: [0, G + 1.1, 1.72] });
      timber.push({ s: [3.1, 0.1, 0.13], p: [0, G + 0.45, 1.72] });
      timber.push({ s: [3.2, 0.13, 0.16], p: [0, E1 - 0.07, 1.72] });
      timber.push({ s: [2.7, 0.1, 0.1], p: [0, G + 0.04, 1.3] });
      /* side beams at the top of the ground storey and under the upper wall */
      timber.push({ s: [0.16, 0.13, 2.5], p: [1.35, E1 - 0.08, 0] });
      timber.push({ s: [0.16, 0.13, 2.5], p: [-1.35, E1 - 0.08, 0] });
      timber.push({ s: [0.14, 0.13, 2.5], p: [0, E1 - 0.08, -1.25] });
      /* teal and gold painted frieze under the lower roof (front and sides) */
      frieze.push({ s: [2.62, 0.1, 0.05], p: [0, E1 - 0.22, 1.22] });
      frieze.push({ s: [0.05, 0.1, 2.42], p: [1.32, E1 - 0.22, 0] });
      frieze.push({ s: [0.05, 0.1, 2.42], p: [-1.32, E1 - 0.22, 0] });
      goldB.push({ s: [2.64, 0.03, 0.06], p: [0, E1 - 0.29, 1.22] });
      goldB.push({ s: [2.64, 0.03, 0.06], p: [0, E1 - 0.15, 1.22] });
      goldB.push({ s: [0.06, 0.03, 2.44], p: [1.32, E1 - 0.29, 0] });
      goldB.push({ s: [0.06, 0.03, 2.44], p: [-1.32, E1 - 0.29, 0] });
      /* lower roof struts: front pair, side pairs, four corner diagonals */
      const yb = E1 - 0.62; const yt = E1 - 0.03;
      [-0.9, 0.9].forEach((x) => { struts.push(strut([x, yb, 1.3], [x, yt, 1.9], 0.2)); figs.push([x, (yb + yt) / 2 + 0.02, 1.62]); });
      [-0.55, 0.55].forEach((z) => {
        struts.push(strut([1.32, yb, z], [1.92, yt, z], 0.2)); figs.push([1.64, (yb + yt) / 2 + 0.02, z]);
        struts.push(strut([-1.32, yb, z], [-1.92, yt, z], 0.2)); figs.push([-1.64, (yb + yt) / 2 + 0.02, z]);
      });
      [-0.7, 0.7].forEach((x) => { struts.push(strut([x, yb, -1.22], [x, yt, -1.82], 0.12)); });
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
        struts.push(strut([1.32 * sx, yb, 1.22 * sz], [1.9 * sx, yt, 1.78 * sz], 0.22));
        figs.push([1.62 * sx, (yb + yt) / 2 + 0.04, 1.51 * sz]);
      });
      /* upper roof struts */
      const ub = E2 - 0.55; const ut = E2 - 0.03;
      [-0.4, 0.4].forEach((x) => { struts.push(strut([x, ub, 0.88], [x, ut, 1.28], 0.16)); figs.push([x, (ub + ut) / 2, 1.1]); });
      [-0.4, 0.4].forEach((z) => {
        struts.push(strut([0.92, ub, z], [1.28, ut, z], 0.16)); figs.push([1.1, (ub + ut) / 2, z]);
        struts.push(strut([-0.92, ub, z], [-1.28, ut, z], 0.16)); figs.push([-1.1, (ub + ut) / 2, z]);
      });
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
        struts.push(strut([0.92 * sx, ub, 0.87 * sz], [1.26 * sx, ut, 1.2 * sz], 0.18));
        figs.push([1.08 * sx, (ub + ut) / 2, 1.02 * sz]);
      });
      /* upper wall corner posts and beams */
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => timber.push({ s: [0.1, WH, 0.1], p: [0.92 * sx, B2 + WH / 2, 0.87 * sz] }));
      timber.push({ s: [1.9, 0.09, 0.1], p: [0, B2 + 0.05, 0.9] });
      timber.push({ s: [1.9, 0.09, 0.1], p: [0, E2 - 0.08, 0.9] });
      timber.push({ s: [0.1, 0.09, 1.8], p: [0.92, B2 + 0.05, 0] });
      timber.push({ s: [0.1, 0.09, 1.8], p: [-0.92, B2 + 0.05, 0] });
      return { timber, frieze, goldB, struts, figs };
    }, []);

    return (
      <group>
        {/* plinth: two broad steps */}
        <Box s={[4.5, 0.12, 4.3]} p={[0, 0.06, 0.15]} m={stone} />
        <Box s={[3.9, 0.12, 3.7]} p={[0, 0.18, 0.1]} m={stone} />
        <Box s={[1.7, 0.09, 0.28]} p={[0, 0.045, 2.44]} m={stone} />
        <Box s={[1.9, 0.05, 0.3]} p={[0, 0.025, 2.7]} m={stone} />
        {/* low stone seating walls beside the plinth */}
        <Box s={[0.34, 0.42, 3.4]} p={[-2.65, 0.21, 0.2]} m={stone} />
        <Box s={[1.5, 0.4, 0.34]} p={[-3.3, 0.2, 2.2]} m={stone} />
        <Box s={[0.34, 0.42, 1.6]} p={[2.65, 0.21, 1.0]} m={stone} />
        {/* small gilded finials at the plinth corners */}
        {[[2.1, 2.1], [-2.1, 2.1], [2.1, -1.85], [-2.1, -1.85]].map(([x, z], i) => (
          <group key={i} position={[x, 0.12, z]}>
            <Cyl rt={0.05} rb={0.07} h={0.16} p={[0, 0.08, 0]} m={gold} seg={8} />
            <Ball rad={0.075} p={[0, 0.2, 0]} m={gold} />
            <mesh position={[0, 0.34, 0]} material={gold}><coneGeometry args={[0.035, 0.16, 8]} /></mesh>
          </group>
        ))}
        {/* ground storey: red brick cella */}
        <Box s={[2.6, 1.5, 2.4]} p={[0, G + 0.75, 0]} m={brick} />
        <Box s={[2.62, 0.08, 2.42]} p={[0, G + 0.04, 0]} m={dark} />
        {/* dark timber lattice front, deep open verandah floor */}
        <Box s={[2.5, 1.38, 0.08]} p={[0, G + 0.73, 1.2]} m={M.plain('#1c120d', { roughness: 0.85 })} />
        <Box s={[3.1, 0.06, 0.6]} p={[0, G + 0.03, 1.5]} m={woodDk} />
        {[-1.0, 1.0].map((x) => <Box key={x} s={[0.6, 0.8, 0.05]} p={[x, G + 0.78, 1.25]} m={M.plain('#3a281d', { roughness: 0.9 })} cast={false} />)}
        {/* door: golden-yellow, in a dark frame */}
        <Box s={[0.82, 1.0, 0.1]} p={[0, G + 0.5, 1.23]} m={dark} />
        <Box s={[0.64, 0.9, 0.07]} p={[0, G + 0.45, 1.29]} m={M.plain('#e2b21c', { roughness: 0.5, metalness: 0.3, emissive: '#6a4a05', emissiveIntensity: 0.25 })} />
        <Box s={[0.03, 0.8, 0.02]} p={[0, G + 0.45, 1.335]} m={M.plain('#9a7a14')} cast={false} />
        <Ball rad={0.025} p={[0.08, G + 0.45, 1.35]} m={dark} />
        {/* carved dark lattice windows either side of the door */}
        <Lattice p={[-1.0, G + 0.78, 1.24]} w={0.7} h={0.85} nb={5} />
        <Lattice p={[1.0, G + 0.78, 1.24]} w={0.7} h={0.85} nb={5} />
        <Lattice p={[1.32, G + 0.82, 0.1]} r={Math.PI / 2} w={0.5} h={0.6} />
        <Lattice p={[-1.32, G + 0.82, 0.1]} r={-Math.PI / 2} w={0.5} h={0.6} />
        {/* gilded torana arch above the door */}
        <group position={[0, G + 1.0, 1.33]}>
          <mesh material={gold} castShadow><torusGeometry args={[0.4, 0.07, 6, 18, Math.PI]} /></mesh>
          <mesh material={gold}><torusGeometry args={[0.27, 0.032, 6, 14, Math.PI]} /></mesh>
          <mesh position={[0, 0.48, 0]} material={gold}><coneGeometry args={[0.06, 0.16, 8]} /></mesh>
          <Ball rad={0.14} sc={[1, 1.2, 0.22]} p={[0, 0.08, -0.02]} m={gold} />
          <Box s={[0.34, 0.12, 0.05]} p={[0, -0.3, 0.02]} m={gold} cast={false} />
          <Ball rad={0.05} p={[0, -0.3, 0.06]} m={M.plain('#2f8f80')} />
          {[-0.4, 0.4].map((x) => <Box key={x} s={[0.09, 0.1, 0.09]} p={[x, 0, 0]} m={gold} cast={false} />)}
        </group>
        {/* red offerings */}
        {[[-0.24, G + 0.98, 1.35], [0.28, G + 0.9, 1.35], [-0.5, G + 1.15, 1.77], [0.5, G + 1.15, 1.77]].map((q, i) => <Ball key={i} rad={0.03} p={q} m={M.plain('#d3202a')} />)}
        {/* stone bases of the front posts, bells between the posts */}
        {[-1.42, 1.42].map((x) => <Box key={x} s={[0.26, 0.45, 0.26]} p={[x, G + 0.225, 1.75]} m={M.plain('#8d8a85', { roughness: 0.9 })} />)}
        {[[-0.5, 1.15], [0.5, 1.15], [-1.42, 0.97], [1.42, 0.97]].map(([x, y], i) => <Box key={i} s={[0.2, 0.12, 0.2]} p={[x, G + y + 0.08, i < 2 ? 1.7 : 1.75]} m={i % 2 ? teal : gold} cast={false} />)}
        <Bell p={[-0.95, G + 1.02, 1.72]} />
        <Bell p={[0.95, G + 1.02, 1.72]} />
        <Bell p={[-0.5, G + 1.02, 1.72]} />
        <Bell p={[0.5, G + 1.02, 1.72]} />
        <Bx list={parts.timber} m={woodDk} />
        <Bx list={parts.frieze} m={teal} cast={false} />
        <Bx list={parts.goldB} m={gold} cast={false} />

        {/* lower roof, its valance and struts */}
        <Roof w={R1.w} d={R1.d} h={R1.h} y={E1} m={roofM} sag={R1.sag} lift={R1.lift} fascia={false} />
        <Valance w={R1.w} d={R1.d} y={E1} h={0.2} />
        <Bx list={parts.struts} m={teal} />
        {parts.figs.map((f, i) => <Ball key={i} rad={0.07} sc={[1, 1.4, 1]} p={f} m={gold} />)}

        {/* short red upper wall storey */}
        <Box s={[1.8, WH, 1.7]} p={[0, B2 + WH / 2, 0]} m={redUp} />
        <Lattice p={[0, B2 + 0.62, 0.86]} w={0.5} h={0.5} nb={3} />
        <Lattice p={[0.91, B2 + 0.62, 0]} r={Math.PI / 2} w={0.4} h={0.4} nb={2} />
        <Lattice p={[-0.91, B2 + 0.62, 0]} r={-Math.PI / 2} w={0.4} h={0.4} nb={2} />
        <Box s={[1.82, 0.06, 1.72]} p={[0, B2 + 0.3, 0]} m={redUpDim} cast={false} />
        <group position={[0, B2 + 1.1, 0.87]}>
          <mesh material={gold}><torusGeometry args={[0.22, 0.03, 6, 14, Math.PI]} /></mesh>
          <mesh position={[0, 0.27, 0]} material={gold}><coneGeometry args={[0.04, 0.1, 8]} /></mesh>
          <Box s={[0.5, 0.04, 0.05]} p={[0, -0.02, 0]} m={gold} cast={false} />
        </group>

        {/* upper roof */}
        <Roof w={R2.w} d={R2.d} h={R2.h} y={E2} m={roofM} sag={R2.sag} lift={R2.lift} fascia={false} />
        <Valance w={R2.w} d={R2.d} y={E2} h={0.18} />

        {/* gilded gajur finial with a tiny pale figure on a thin spike */}
        <Gajur y={APEX - 0.04} s={0.45} />
        <Cyl rt={0.012} h={0.26} p={[0, APEX + 0.5, 0]} m={gold} seg={5} />
        <Ball rad={0.045} sc={[1, 1.3, 1]} p={[0, APEX + 0.66, 0]} m={M.plain('#f1ece0')} />
        <pointLight position={[0, 1.2, 2.1]} intensity={0.9} distance={3.2} color="#ffb867" />
        <Frame s={[5.8, 5.2, 5.6]} p={[0, 2.5, 0.4]} />
      </group>
    );
  }

  /* ---------- houses ---------- */
  function Newar({ p, r = 0, w = 3, d = 3, st = 3, sh = 1.15, tex = 'ochre', col = '#f0dcb4', lk = 0.3, shut = '#4a3426', shutLit = 0.1, balcony = false, quoin = null, roofCol = '#6f6a66', arcade = false, tall = 0 }) {
    const M = useM();
    const H = st * sh + tall;
    const body = tex === 'flat' ? M.plain(col, { roughness: 0.9 }) : M.mat(tex, Math.max(1, Math.round(w / 2)), Math.max(1, st), { color: lk ? lighten(col, lk) : col });
    const { win, glass, wood, q } = useMemo(() => {
      const win = []; const glass = []; const wood = [];
      const n = Math.max(2, Math.round(w / 1.05)); const z = d / 2 + 0.01;
      for (let s = 0; s < st; s += 1) {
        const y0 = s * sh;
        wood.push({ s: [w + 0.06, 0.06, d + 0.06], p: [0, y0 + 0.02, 0] });
        if (s === 0) {
          for (let i = 0; i < n; i += 1) {
            const x = -w / 2 + ((i + 0.5) * w) / n;
            glass.push({ s: [Math.min(0.85, (w / n) * 0.7), sh * 0.66, 0.06], p: [x, sh * 0.4, z] });
            wood.push({ s: [Math.min(0.95, (w / n) * 0.78), 0.07, 0.1], p: [x, sh * 0.76, z] });
          }
        } else {
          for (let i = 0; i < n; i += 1) {
            const x = -w / 2 + ((i + 0.5) * w) / n;
            win.push({ s: [0.46, 0.6, 0.07], p: [x, y0 + sh * 0.5, z] });
            glass.push({ s: [0.34, 0.48, 0.09], p: [x, y0 + sh * 0.5, z + 0.005] });
            wood.push({ s: [0.58, 0.06, 0.1], p: [x, y0 + sh * 0.5 - 0.33, z + 0.02] });
          }
        }
      }
      if (balcony) {
        const by = sh + 0.02; const bz = d / 2 + 0.2;
        wood.push({ s: [w + 0.1, 0.1, 0.4], p: [0, by, bz] });
        wood.push({ s: [w + 0.1, 0.12, 0.06], p: [0, by - 0.12, bz + 0.18] });
        wood.push({ s: [w + 0.1, 0.05, 0.05], p: [0, by + 0.34, bz + 0.18] });
        wood.push({ s: [0.05, 0.34, 0.4], p: [w / 2 + 0.03, by + 0.17, bz] });
        wood.push({ s: [0.05, 0.34, 0.4], p: [-w / 2 - 0.03, by + 0.17, bz] });
        const nb = Math.floor(w / 0.15);
        for (let i = 0; i <= nb; i += 1) wood.push({ s: [0.03, 0.3, 0.03], p: [-w / 2 + (i * w) / nb, by + 0.19, bz + 0.18] });
        const np = Math.round(w / 1.4);
        for (let i = 0; i <= np; i += 1) wood.push({ s: [0.07, sh, 0.07], p: [-w / 2 + (i * w) / np, sh / 2, bz + 0.17] });
      }
      const q = [];
      if (quoin) for (let k = 0; k < H / 0.4; k += 1) [-1, 1].forEach((sx) => q.push({ s: [k % 2 ? 0.3 : 0.2, 0.2, 0.06], p: [sx * (w / 2 - 0.08), 0.2 + k * 0.4, d / 2 + 0.015] }));
      return { win, glass, wood, q };
    }, [w, d, st, sh, balcony, quoin, H]);
    return (
      <group position={[p[0], 0, p[1]]} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={body} />
        <Bx list={wood} m={M.plain('#3e2a1e', { roughness: 0.85 })} cast={false} />
        {quoin && <Bx list={q} m={M.plain(quoin, { roughness: 0.9 })} cast={false} />}
        <Bx list={win} m={M.plain(shut, { roughness: 0.8 })} cast={false} />
        <Bx list={glass} m={M.plain('#1e150f', { emissive: '#ff9a3a', emissiveIntensity: shutLit * 0.6 })} cast={false} />
        <Roof w={w + 0.55} d={d + 0.55} h={0.7} y={H} m={M.mat('stone', 4, 4, { color: new THREE.Color(roofCol).multiplyScalar(2.3).getStyle() })} sag={1} lift={0} fascia={false} />
        <Box s={[w + 0.58, 0.07, 0.07]} p={[0, H + 0.01, (d + 0.55) / 2]} m={M.dark} cast={false} />
      </group>
    );
  }
  /* plain brick back wall right behind the temple, with a dark window */
  function BackWall() {
    const M = useM();
    return (
      <group position={[0.3, 0, -3.4]}>
        <Box s={[5.8, 2.6, 1.5]} p={[0, 1.3, 0]} m={M.mat('brick', 4, 3, { color: '#e2a68e' })} />
        <Box s={[0.5, 0.66, 0.08]} p={[-1.7, 1.6, 0.77]} m={M.plain('#1a120d')} cast={false} />
        <Box s={[0.6, 0.06, 0.12]} p={[-1.7, 1.26, 0.78]} m={M.dark} cast={false} />
        <Box s={[0.5, 0.66, 0.08]} p={[1.6, 1.7, 0.77]} m={M.plain('#2b1c14')} cast={false} />
        <Roof w={6.4} d={2.1} h={0.7} y={2.6} m={M.mat('stone', 4, 4, { color: '#cfcac2' })} sag={1} lift={0} fascia={false} />
      </group>
    );
  }
  /* Padma Library: cream, two storeys, white-framed arched windows, faces the temple across the square */
  function Library({ p }) {
    const M = useM();
    const { fr, gl } = useMemo(() => {
      const fr = []; const gl = [];
      const z = 1.31;
      for (let s = 0; s < 2; s += 1) {
        for (let i = 0; i < 5; i += 1) {
          const x = -2.2 + i * 1.1; const y = 0.75 + s * 1.3;
          if (s === 0 && i === 2) continue;
          fr.push({ s: [0.6, 0.86, 0.06], p: [x, y, z] });
          gl.push({ s: [0.44, 0.7, 0.08], p: [x, y - 0.02, z + 0.01] });
        }
      }
      fr.push({ s: [6.3, 0.08, 0.1], p: [0, 1.4, z] });
      return { fr, gl };
    }, []);
    return (
      <group position={[p[0], 0, p[1]]} rotation={[0, Math.PI, 0]}>
        <Box s={[6.2, 2.7, 2.6]} p={[0, 1.35, 0]} m={M.plain('#ebdfc2', { roughness: 0.85 })} />
        <Bx list={fr} m={M.plain('#faf6ec', { roughness: 0.7 })} cast={false} />
        <Bx list={gl} m={M.plain('#2a2018', { emissive: '#ff9a3a', emissiveIntensity: 0.08 })} cast={false} />
        {[-2.2, -1.1, 0, 1.1, 2.2].map((x, i) => (i === 2 ? null : [0.75, 2.05].map((y) => <mesh key={`${x}${y}`} position={[x, y + 0.43, 1.32]} material={M.plain('#faf6ec')}><cylinderGeometry args={[0.3, 0.3, 0.06, 12, 1, false, 0, Math.PI]} /></mesh>)))}
        {/* entrance with porch */}
        <Box s={[0.9, 1.2, 0.08]} p={[0, 0.6, 1.32]} m={M.plain('#5a3a26')} />
        <Box s={[1.5, 0.12, 0.8]} p={[0, 1.5, 1.6]} m={M.plain('#faf6ec')} />
        {[-0.65, 0.65].map((x) => <Cyl key={x} rt={0.07} h={1.4} p={[x, 0.7, 1.9]} m={M.plain('#faf6ec')} seg={10} />)}
        <Box s={[2.2, 0.1, 0.6]} p={[0, 0.05, 1.8]} m={M.mat('stone', 1, 1, { color: '#c9c5bb' })} />
        <Box s={[1.6, 0.5, 0.06]} p={[0, 1.85, 1.62]} m={M.plain('#faf6ec')} />
        <Roof w={6.8} d={3.2} h={0.85} y={2.7} m={M.mat('roof', 3, 2, { color: '#b58a76' })} sag={1} lift={0} fascia={false} />
        <Box s={[1.6, 0.45, 0.1]} p={[0, 3.0, 1.1]} m={M.plain('#f3ead6')} cast={false} />
      </group>
    );
  }

  /* ---------- street furniture ---------- */
  function Lamp({ p }) {
    const M = useM();
    const iron = M.plain('#1d2a26', { roughness: 0.5, metalness: 0.6 });
    const glow = M.plain('#ffe6a8', { emissive: '#ffcf7a', emissiveIntensity: 0.9, roughness: 0.4 });
    return (
      <group position={p}>
        <Box s={[0.34, 0.1, 0.34]} p={[0, 0.05, 0]} m={M.plain('#6a3a2a')} />
        <Cyl rt={0.1} rb={0.15} h={0.45} p={[0, 0.32, 0]} m={iron} seg={12} />
        <Cyl rt={0.05} rb={0.07} h={1.7} p={[0, 1.4, 0]} m={iron} seg={10} />
        <Cyl rt={0.1} rb={0.07} h={0.12} p={[0, 2.3, 0]} m={iron} seg={10} />
        <Box s={[0.9, 0.04, 0.04]} p={[0, 2.38, 0]} m={iron} />
        {[-0.45, 0, 0.45].map((x) => (
          <group key={x} position={[x, 2.5, 0]}>
            <Cyl rt={0.08} rb={0.05} h={0.2} p={[0, 0, 0]} m={glow} seg={8} />
            <mesh position={[0, 0.14, 0]} material={iron}><coneGeometry args={[0.1, 0.1, 8]} /></mesh>
          </group>
        ))}
        <Ball rad={0.04} p={[0, 2.47, 0]} m={iron} />
        <pointLight position={[0, 2.5, 0.3]} intensity={0.9} distance={4.5} color="#ffb867" />
      </group>
    );
  }
  function Wire({ a, b, sag = 0.25 }) {
    const M = useM();
    const g = useMemo(() => {
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2];
      return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new V3(...a), new V3(...mid), new V3(...b)), 10, 0.008, 3, false);
    }, [a, b, sag]);
    return <mesh geometry={g} material={M.plain('#1b1b1d', { roughness: 0.6 })} />;
  }
  const WIRES = [
    [[6.5, 3.9, 3.5], [9.0, 3.7, 12.0]], [[6.5, 3.85, 3.5], [-8.1, 4.4, 12.0]],
    [[6.5, 3.9, 3.5], [4.6, 3.8, -1.4]], [[6.5, 3.6, 3.5], [8.0, 3.7, 5.0]], [[6.5, 3.55, 3.5], [-3.0, 3.1, -2.6]],
  ];
  function Pole({ p }) {
    const M = useM();
    const grey = M.plain('#6c6760', { roughness: 0.9 });
    return (
      <group position={p}>
        <Cyl rt={0.05} rb={0.075} h={4.2} p={[0, 2.1, 0]} m={grey} seg={8} />
        <Box s={[1.5, 0.07, 0.08]} p={[0, 3.9, 0]} m={M.dark} />
        <Box s={[1.1, 0.07, 0.08]} p={[0, 3.55, 0]} m={M.dark} />
        {[-0.65, -0.2, 0.25, 0.65].map((x) => <Cyl key={x} rt={0.03} h={0.1} p={[x, 3.97, 0]} m={M.plain('#6b8f86')} seg={6} />)}
      </group>
    );
  }

  function BindebasiniMain() {
    return <Temple />;
  }

  function BindebasiniEnv() {
    const M = useM();
    const peaks = useMemo(() => [
      [-1.15, 62, 15, 9], [-0.8, 64, 20, 11], [-0.45, 66, 14, 9], [-0.1, 64, 22, 12], [0.3, 66, 17, 10], [0.7, 64, 13, 8], [1.05, 62, 18, 10],
    ].map(([a, r, h, b]) => ({ x: Math.sin(a) * r, z: -Math.cos(a) * r, h, b })), []);
    const ridges = useMemo(() => Array.from({ length: 16 }, (_, i) => {
      const a = -1.7 + i * 0.23; const r = 44 + (i % 3) * 5; const sc = 8 + ((i * 7) % 5) * 2;
      return { x: Math.sin(a) * r, z: -Math.cos(a) * r, sc, hz: 4 + (i % 4) };
    }), []);
    const trees = useMemo(() => [[28, -0.3], [28.5, 0.5], [30, 1.1], [27, 2.3], [29, 2.8], [30.5, -1.6], [28, -2.5], [27.5, 3.9], [31, -3.1], [29, 4.5]].map(([r, a]) => {
      const rr = r + 0.5; return { x: Math.cos(a) * rr, z: -Math.sin(a) * rr, y: -0.06 - ((rr - 26) / 22) * 6 };
    }), []);
    const skyG = useMemo(() => {
      const g = new THREE.SphereGeometry(95, 24, 16); const pos = g.attributes.position; const c = []; const top = new THREE.Color('#2f6fc4'); const mid = new THREE.Color('#8fbce6'); const low = new THREE.Color('#d9e6ef'); const t = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) { const y = Math.max(0, pos.getY(i) / 95); if (y < 0.3) t.copy(low).lerp(mid, y / 0.3); else t.copy(mid).lerp(top, (y - 0.3) / 0.7); c.push(t.r, t.g, t.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g;
    }, []);
    return (
      <group>
        {/* paved square and bazaar street */}
        <Box s={[18, 0.1, 14.2]} p={[0, -0.05, 3.9]} m={M.mat('stone', 9, 7, { color: '#ffffff' })} cast={false} />
        <Box s={[3.6, 0.1, 24]} p={[-5.25, -0.06, 22]} m={M.mat('stone', 2, 12, { color: '#f0ece4' })} cast={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow material={M.plain('#8a7a64', { roughness: 1 })}><circleGeometry args={[26, 48]} /></mesh>
        {/* hillside falling away on all sides: saddle ridge */}
        <Cyl rt={26} rb={48} h={6} p={[0, -3.1, 0]} m={M.plain('#6f7f52', { roughness: 1 })} seg={40} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.1, 0]} material={M.plain('#6b7a58', { roughness: 1 })}><circleGeometry args={[90, 40]} /></mesh>
        {trees.map((t, i) => <Tree key={i} p={[t.x, t.y, t.z]} s={1.3 + (i % 3) * 0.25} />)}
        <mesh geometry={skyG}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false} /></mesh>
        {[[-30,-52],[-22,-48],[20,-50],[34,-46],[-12,-56],[8,-58],[26,-54],[-36,-40]].map(([x, z], i) => <Tree key={`ht${i}`} p={[x, -3.2, z]} s={2.2 + (i % 3) * 0.5} />)}
        {/* hazy layered ridges and the Ganesh Himal snow peaks */}
        {ridges.map((r, i) => <Ball key={i} rad={1} sc={[r.sc * 1.5, r.hz * 0.6, r.sc * 0.8]} p={[r.x, -2, r.z]} m={M.plain(i % 2 ? '#7f93a0' : '#8aa0ae', { roughness: 1 })} />)}
        {Array.from({ length: 9 }, (_, i) => { const a = -1.2 + i * 0.3; return (
          <group key={`sn${i}`} position={[Math.sin(a) * 70, -3, -Math.cos(a) * 70]}>
            <mesh material={M.plain('#aab4c0', { roughness: 1 })}><coneGeometry args={[5 + (i % 3) * 2, 8 + ((i * 5) % 4) * 3, 6]} /></mesh>
            <mesh position={[0, 2.6, 0]} material={M.plain('#eef2f8', { roughness: 0.9 })}><coneGeometry args={[3 + (i % 3), 5 + ((i * 5) % 4) * 1.6, 6]} /></mesh>
          </group>); })}
        {peaks.map((p, i) => (
          <group key={i} position={[p.x, -3, p.z]}>
            <mesh material={M.plain('#a9b3bf', { roughness: 1 })}><coneGeometry args={[p.b, p.h, 7]} /></mesh>
            <mesh position={[0, p.h * 0.2, 0]} material={M.plain('#f4f6fa', { roughness: 0.9 })}><coneGeometry args={[p.b * 0.62, p.h * 0.62, 7]} /></mesh>
          </group>
        ))}

        {/* left: cream/ochre 3-storey house with a long wooden balcony */}
        <Newar p={[-5.5, -0.8]} w={5.4} d={3} balcony col="#ecd9b0" tex="flat" roofCol="#5e625f" shut="#5b4636" />
        <Newar p={[-10.6, -1.2]} w={4.4} d={3} tex="plaster" col="#cdbfa6" shut="#5b4636" roofCol="#6a655f" tall={0.1} />
        {/* right: red-painted 3-storey house with blue shutters */}
        <Newar p={[5.3, -1.6]} r={-0.45} w={3.8} d={3} tex="plaster" col="#a33224" tex="flat" quoin="#8a5a42" shut="#6f86a0" roofCol="#3e3b38" tall={0.15} />
        <Newar p={[9.2, -2.8]} r={-Math.PI / 2} w={3.2} d={3} tex="brick" col="#e0a089" shut="#3e2a1e" roofCol="#6a655f" st={3} />
        <BackWall />
        <Newar p={[-9.7, -5.5]} w={4.5} d={3} tex="plaster" col="#e6d6b6" shut="#4a3426" roofCol="#6e6862" st={3} />
        <Newar p={[4.2, -6.5]} w={4.4} d={3} tex="ochre" col="#e2c48e" shut="#4a3426" roofCol="#767069" st={3} tall={0.4} />
        {/* left row facing the square */}
        <Newar p={[-9.6, 3.1]} r={Math.PI / 2} w={3.3} d={3} tex="plaster" col="#d9a98e" shut="#4a3426" roofCol="#6a655f" st={3} />
        <Newar p={[-9.6, 6.5]} r={Math.PI / 2} w={3.4} d={3} tex="ochre" col="#e9d3a2" shut="#2f4a6a" roofCol="#76706a" st={3} balcony />
        <Newar p={[-9.6, 9.9]} r={Math.PI / 2} w={3.3} d={3} tex="brick" col="#e3a58e" shut="#4a3426" roofCol="#6a655f" st={3} />
        {/* right row */}
        <Newar p={[9.6, 2.1]} r={-Math.PI / 2} w={3.3} d={3} tex="plaster" col="#cdb890" shut="#4a3426" roofCol="#6e6862" st={3} balcony />
        <Newar p={[9.6, 5.5]} r={-Math.PI / 2} w={3.4} d={3} tex="plaster" col="#b9473a" shut="#3a58a2" roofCol="#5d5853" st={3} />
        <Newar p={[9.6, 8.9]} r={-Math.PI / 2} w={3.3} d={3} tex="ochre" col="#ecd9ac" shut="#4a3426" roofCol="#76706a" st={3} />
        {/* across the square: Padma Library and a shop house; the bazaar street leaves between */}
        <Library p={[2.2, 12.4]} />
        <Newar p={[6.7, 12.4]} r={Math.PI} w={2.6} d={2.8} tex="plaster" col="#d0b9a0" shut="#4a3426" roofCol="#6e6862" st={3} />
        {/* the bazaar street running away, lined with houses */}
        <Newar p={[-9.6, 13.3]} r={Math.PI / 2} w={3.3} d={3} tex="plaster" col="#ddc9a6" shut="#4a3426" roofCol="#6a655f" st={3} balcony />
        <Newar p={[-9.6, 16.7]} r={Math.PI / 2} w={3.3} d={3} tex="brick" col="#e3a58e" shut="#3a58a2" roofCol="#6e6862" st={3} />
        <Newar p={[-9.6, 20.1]} r={Math.PI / 2} w={3.3} d={3} tex="ochre" col="#efd9a8" shut="#4a3426" roofCol="#76706a" st={3} />
        <Newar p={[-0.9, 15.5]} r={-Math.PI / 2} w={3.3} d={3} tex="plaster" col="#c9b79a" shut="#4a3426" roofCol="#6a655f" st={3} />
        <Newar p={[-0.9, 19.0]} r={-Math.PI / 2} w={3.3} d={3} tex="plaster" col="#b9473a" shut="#3a58a2" roofCol="#5d5853" st={3} balcony />
        <Newar p={[-0.9, 22.5]} r={-Math.PI / 2} w={3.3} d={3} tex="ochre" col="#e6cc98" shut="#4a3426" roofCol="#76706a" st={3} />

        {/* ornate cast-iron lamp posts, utility pole and overhead wires */}
        <Lamp p={[-4.2, 0, 4.2]} />
        <Lamp p={[2.9, 0, 7.2]} />
        <Pole p={[6.5, 0, 3.5]} />
        {WIRES.map((w, i) => <Wire key={i} a={w[0]} b={w[1]} sag={0.22 + (i % 3) * 0.08} />)}
      </group>
    );
  }

  return { 'bindebasini-temple-bandipur': { Main: BindebasiniMain, Env: BindebasiniEnv } };
}
