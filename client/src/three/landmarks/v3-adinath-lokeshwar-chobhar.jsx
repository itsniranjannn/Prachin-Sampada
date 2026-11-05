// Adinath Lokeshwar Temple, Chobhar ("pots and pans temple"): a small three-roof brick-and-timber pagoda at the back of an enclosed
// village courtyard, a grey stone shikhara standing on axis in front of it, and every wall hung with rows of metal utensils.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Tree, Frame, THREE, useMemo, useRef, useEffect } = K;
  const PI = Math.PI;

  /* ---------------- materials ---------------- */
  const brickM = (M, rx = 2, ry = 1, c = '#c0654a') => M.mat('brick', rx, ry, { color: c });
  const timber = (M) => M.plain('#2b1e18', { roughness: 0.85 });
  const stoneM = (M) => M.plain('#8f8b85', { roughness: 1 });
  const stoneDark = (M) => M.plain('#6f6b66', { roughness: 1 });
  const brass = (M) => M.plain('#b99a4a', { metalness: 0.7, roughness: 0.4 });
  const tin = (M) => M.plain('#8c9296', { metalness: 0.55, roughness: 0.5 });
  const tile = (M) => M.mat('roof', 3, 3, { color: '#b86a52' });
  const copperOld = (M, k = 0) => M.plain(k ? '#5a5244' : '#6b5a48', { metalness: 0.45, roughness: 0.6 });
  const vermilion = (M) => M.plain('#c8301e', { roughness: 0.8 });

  /* ---------------- utensils: instanced cups, plates and tubes in horizontal rows ---------------- */
  const PALETTE = ['#a8873c', '#8d9296', '#b9bbbd', '#a8873c', '#8d9296'];
  const PALETTE_OLD = ['#a8873c', '#8d9296', '#a86b3a', '#b9bbbd', '#7a6a3a', '#9a8f78', '#c2a050', '#8a7e6a', '#a7a9ab', '#d8b24a', '#cfd1d3', '#c97a3a', '#e3dcc6', '#b5562e'];
  function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function Inst({ geo, list, mat }) {
    const ref = useRef();
    useEffect(() => {
      const im = ref.current; if (!im) return;
      const col = new THREE.Color();
      list.forEach((it, i) => { im.setMatrixAt(i, it.m); col.set(it.c); im.setColorAt(i, col); });
      im.count = list.length;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }, [list]);
    return <instancedMesh ref={ref} args={[geo, mat, Math.max(1, list.length)]} castShadow />;
  }
  /** rows: { a: outward yaw (0 = +z), c: [x,y,z] on the wall, x0, x1: span along the wall, n } */
  function Utensils({ rows, seed = 3 }) {
    const M = useM();
    const mat = M.plain('#ffffff', { metalness: 0.5, roughness: 0.5 });
    const geos = useMemo(() => ({
      cup: new THREE.CylinderGeometry(0.058, 0.04, 0.075, 10),
      plate: new THREE.CylinderGeometry(0.11, 0.095, 0.014, 14),
      tube: new THREE.CylinderGeometry(0.028, 0.028, 0.17, 8),
    }), []);
    const lists = useMemo(() => {
      const r = rng(seed);
      const out = { cup: [], plate: [], tube: [] };
      const rx = new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, 0, 0));
      rows.forEach((row) => {
        const ca = Math.cos(row.a); const sa = Math.sin(row.a);
        for (let i = 0; i < row.n; i += 1) {
          const xl = row.x0 + ((row.x1 - row.x0) * (i + 0.5)) / row.n + (r() - 0.5) * 0.02;
          const yl = (r() - 0.5) * 0.025;
          const q = r();
          const kind = q < 0.5 ? 'cup' : q < 0.8 ? 'plate' : 'tube';
          const off = kind === 'plate' ? 0.02 : kind === 'tube' ? 0.0 : 0.04;
          const s = 0.7 + r() * 0.35;
          const m = new THREE.Matrix4();
          m.compose(
            new THREE.Vector3(row.c[0] + xl * ca + off * sa, row.c[1] + yl, row.c[2] - xl * sa + off * ca),
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), row.a).multiply(kind === 'tube' ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, PI / 2)) : rx),
            new THREE.Vector3(s, s, s),
          );
          out[kind].push({ m, c: PALETTE[Math.floor(r() * PALETTE.length)] });
        }
      });
      return out;
    }, [rows, seed]);
    return (
      <group>
        <Inst geo={geos.cup} list={lists.cup} mat={mat} />
        <Inst geo={geos.plate} list={lists.plate} mat={mat} />
        <Inst geo={geos.tube} list={lists.tube} mat={mat} />
      </group>
    );
  }
  /** helper: a row on the face whose outward yaw is a, at distance off from the centre (cx,cz) */
  const row = (a, off, y, x0, x1, cx = 0, cz = 0, dens = 0.2) => ({
    a, c: [cx + Math.sin(a) * off, y, cz + Math.cos(a) * off], x0, x1, n: Math.max(2, Math.round((x1 - x0) / dens)),
  });

  /* ---------------- small parts ---------------- */
  function Strut({ a = 0, x = 0, r0, y0, r1, y1, w = 0.09, m }) {
    const L = Math.hypot(r1 - r0, y1 - y0); const t = Math.atan2(y1 - y0, r1 - r0);
    return <group rotation={[0, a, 0]}><Box s={[w, w * 1.35, L]} p={[x, (y0 + y1) / 2, (r0 + r1) / 2]} r={[-t, 0, 0]} m={m} cast={false} /></group>;
  }
  function Win({ w = 0.42, h = 0.5, p = [0, 0, 0] }) {
    const M = useM();
    const t = timber(M); const inner = M.plain('#120b08'); const bar = M.plain('#5a3a22');
    return (
      <group position={p}>
        <Box s={[w, h, 0.07]} p={[0, 0, 0]} m={t} cast={false} />
        <Box s={[w * 0.78, h * 0.8, 0.08]} p={[0, 0, 0.005]} m={inner} cast={false} />
        {[-1, 0, 1].map((k) => <Box key={k} s={[0.02, h * 0.8, 0.09]} p={[k * w * 0.2, 0, 0.01]} m={bar} cast={false} />)}
        <Box s={[w * 1.12, 0.05, 0.1]} p={[0, h / 2 + 0.02, 0.01]} m={t} cast={false} />
      </group>
    );
  }
  const faces = (fn) => [0, 1, 2, 3].map((k) => <group key={k} rotation={[0, k * PI / 2, 0]}>{fn(k)}</group>);

  /* ---------------- the pagoda (3 roofs) ---------------- */
  function Pagoda() {
    const M = useM();
    const t = M.plain('#3a2a20', { roughness: 0.85 }); const br = brickM(M, 3, 1); const g = M.gold; const bs = M.plain('#8a7a5a', { metalness: 0.6, roughness: 0.45 });
    const tiers = [
      { hw: 1.5, y0: 0.16, y1: 1.1, eave: 1.12, ehw: 2.8, rh: 0.35, s0: [1.5, 0.55], s1: [2.6, 1.0], roof: copperOld(M, 0) },
      { hw: 1.3, y0: 1.1, y1: 2.9, eave: 2.92, ehw: 1.9, rh: 0.5, s0: [1.3, 2.35], s1: [1.75, 2.88], roof: copperOld(M, 0) },
      { hw: 1.0, y0: 2.9, y1: 3.75, eave: 3.75, ehw: 1.35, rh: 0.6, s0: [1.0, 3.3], s1: [1.3, 3.73], roof: copperOld(M, 0) },
    ];
    const strutX = [-1.15, -0.7, -0.25, 0.25, 0.7, 1.15];
    const rows = useMemo(() => {
      const R = [];
      // ground storey: sides and back full, front left and right of the doorway
      [1, 2, 3].forEach((k) => { [0.84, 0.6, 0.38].forEach((y) => R.push(row(k * PI / 2, 1.52, y, -1.35, 1.35))); });
      [0.84, 0.6, 0.38].forEach((y) => { R.push(row(0, 1.52, y, -1.4, -0.62)); R.push(row(0, 1.52, y, 0.62, 1.4)); });
      [0, 1, 2, 3].forEach((k) => { R.push(row(k * PI / 2, 2.6, 0.98, -2.6, 2.6)); });
      // wall bands 2 and 3: a thin course each, so brick shows
      [0, 1, 2, 3].forEach((k) => { R.push(row(k * PI / 2, 1.32, 1.6, -1.2, 1.2)); R.push(row(k * PI / 2, 1.33, 2.75, -1.2, 1.2)); });
      [0, 1, 2, 3].forEach((k) => { R.push(row(k * PI / 2, 1.02, 3.05, -0.9, 0.9)); });
      return R;
    }, []);
    const rim = (ehw, y) => (
      <>
        <Box s={[ehw * 2 + 0.06, 0.05, 0.045]} p={[0, y + 0.03, ehw]} m={bs} cast={false} />
        <Box s={[ehw * 2 + 0.06, 0.05, 0.045]} p={[0, y + 0.03, -ehw]} m={bs} cast={false} />
        <Box s={[0.045, 0.05, ehw * 2 + 0.06]} p={[ehw, y + 0.03, 0]} m={bs} cast={false} />
        <Box s={[0.045, 0.05, ehw * 2 + 0.06]} p={[-ehw, y + 0.03, 0]} m={bs} cast={false} />
      </>
    );
    return (
      <group>
        {/* one low brick plinth step */}
        <Box s={[3.7, 0.16, 3.7]} p={[0, 0.08, 0]} m={brickM(M, 3, 0.4, '#c98068')} />
        {tiers.map((T, i) => {
          const h = T.y1 - T.y0;
          return (
            <group key={i}>
              <Box s={[T.hw * 2, h, T.hw * 2]} p={[0, (T.y0 + T.y1) / 2, 0]} m={i === 0 ? brickM(M, 3, 1, '#d98a70') : brickM(M, 3, 1.4, '#d98a70')} />
              <Box s={[T.hw * 2 + 0.1, 0.09, T.hw * 2 + 0.1]} p={[0, T.y1 - 0.08, 0]} m={t} cast={false} />
              {i === 0 && <Box s={[T.hw * 2 + 0.06, 0.07, T.hw * 2 + 0.06]} p={[0, T.y0 + 0.07, 0]} m={t} cast={false} />}
              <Roof w={T.ehw * 2} d={T.ehw * 2} h={T.rh} y={T.eave} m={T.roof} sag={1.5} lift={0.22} />
              {rim(T.ehw, T.eave)}
              {/* struts: sides and diagonal corners */}
              {[0, 1, 2, 3].map((k) => strutX.filter((x) => !(i === 0 && k === 0 && Math.abs(x) < 0.5)).filter((x, j) => i > 0 ? j % 2 === 0 || Math.abs(x) < 0.3 : true).map((x) => (
                <Strut key={`${k}${x}`} a={k * PI / 2} x={x * (T.hw / 1.5)} r0={T.s0[0] + 0.02} y0={T.s0[1]} r1={T.s1[0]} y1={T.s1[1]} m={t} />
              )))}
              {[0, 1, 2, 3].map((k) => <Strut key={`c${k}`} a={PI / 4 + k * PI / 2} r0={(T.s0[0] + 0.02) * 1.414} y0={T.s0[1]} r1={T.s1[0] * 1.414} y1={T.s1[1]} w={0.12} m={t} />)}
            </group>
          );
        })}
        {/* windows: bands 2 and 3 */}
        {faces(() => (
          <>
            {[-0.72, 0, 0.72].map((x) => <Win key={x} w={0.44} h={0.44} p={[x, 2.1, 1.31]} />)}
            {[-0.38, 0.38].map((x) => <Win key={x} w={0.42} h={0.4} p={[x, 3.3, 1.01]} />)}
          </>
        ))}
        {/* ground storey side windows */}
        {[1, 2, 3].map((k) => <group key={k} rotation={[0, k * PI / 2, 0]}><Win w={0.7} h={0.62} p={[0, 0.74, 1.5]} /></group>)}
        {/* doorway: dark carved frame, white grille gate, gilded torana */}
        <Box s={[1.04, 0.94, 0.07]} p={[0, 0.62, 1.51]} m={t} cast={false} />
        <Box s={[0.74, 0.8, 0.08]} p={[0, 0.58, 1.52]} m={M.plain('#120b08')} cast={false} />
        {[-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3].map((x) => <Box key={x} s={[0.025, 0.78, 0.03]} p={[x, 0.58, 1.58]} m={M.plain('#f1eee8', { roughness: 0.6 })} cast={false} />)}
        {[0.28, 0.5, 0.74].map((y) => <Box key={y} s={[0.74, 0.025, 0.03]} p={[0, y, 1.58]} m={M.plain('#f1eee8', { roughness: 0.6 })} cast={false} />)}
        <group position={[0, 0.98, 1.56]} scale={1.3}>
          <mesh material={g} castShadow><torusGeometry args={[0.38, 0.035, 6, 20, PI]} /></mesh>
          <Box s={[0.95, 0.05, 0.06]} p={[0, 0, 0]} m={g} cast={false} />
          <Ball rad={0.07} p={[0, 0.42, 0]} m={g} />
          {[-1, 1].map((s) => <Box key={s} s={[0.05, 0.3, 0.05]} p={[s * 0.3, 0.22, 0]} r={[0, 0, s * 0.45]} m={g} cast={false} />)}
        </group>
        {/* guardian animals (painted pink), railing, bell */}
        {[-1, 1].map((s) => <group key={s} position={[s * 1.0, 0.16, 2.0]} scale={0.65}><Lion m={M.plain('#e6a0b0', { roughness: 0.7 })} /></group>)}
        {[-1, 1].map((s) => <Box key={`r${s}`} s={[0.03, 0.5, 0.03]} p={[s * 1.12, 0.41, 2.15]} m={M.plain('#161616')} cast={false} />)}
        {[-1.0, -0.5, 0, 0.5, 1.0].map((x) => <Box key={x} s={[0.025, 0.42, 0.025]} p={[x, 0.37, 2.15]} m={M.plain('#161616')} cast={false} />)}
        <Box s={[2.3, 0.03, 0.03]} p={[0, 0.58, 2.15]} m={M.plain('#161616')} cast={false} />
        <Box s={[0.03, 0.03, 0.62]} p={[1.12, 0.58, 1.84]} m={M.plain('#161616')} cast={false} />
        <Box s={[0.03, 0.03, 0.62]} p={[-1.12, 0.58, 1.84]} m={M.plain('#161616')} cast={false} />
        <group position={[0.62, 0.78, 1.7]} scale={1.3}>
          <Box s={[0.5, 0.05, 0.05]} p={[0, 0.17, 0]} m={t} cast={false} />
          <Cyl rt={0.07} rb={0.17} h={0.26} p={[0, 0, 0]} m={M.plain('#6a4a28', { metalness: 0.6, roughness: 0.45 })} seg={14} />
          <Ball rad={0.045} p={[0, -0.16, 0]} m={M.plain('#6a4a28', { metalness: 0.6, roughness: 0.45 })} />
        </group>
        {/* gilded gajur */}
        <Gajur y={4.4} s={0.85} />
        <Utensils rows={rows} seed={5} />
      </group>
    );
  }

  /* ---------------- the grey stone shikhara ---------------- */
  function Turret({ p, s = 1, S, G }) {
    return (
      <group position={p} scale={s}>
        <Box s={[0.3, 0.3, 0.3]} p={[0, 0.15, 0]} m={S} />
        <Box s={[0.37, 0.05, 0.37]} p={[0, 0.32, 0]} m={S} />
        <Box s={[0.25, 0.1, 0.25]} p={[0, 0.4, 0]} m={S} />
        <Box s={[0.2, 0.1, 0.2]} p={[0, 0.5, 0]} m={S} />
        <Box s={[0.14, 0.1, 0.14]} p={[0, 0.6, 0]} m={S} />
        <Ball rad={0.045} p={[0, 0.69, 0]} m={G} />
        <Box s={[0.13, 0.17, 0.03]} p={[0, 0.15, 0.155]} m={G} cast={false} />
      </group>
    );
  }
  function Niche({ w = 0.34, h = 0.4, z = 0 }) {
    const M = useM();
    const dk = M.plain('#26221e'); const fig = M.plain('#a29a8c', { roughness: 0.8 });
    return (
      <group position={[0, 0, z]}>
        <Box s={[w, h, 0.05]} p={[0, 0, 0]} m={dk} cast={false} />
        <Ball rad={w / 2} sc={[1, 0.9, 0.12]} p={[0, h / 2, 0]} m={dk} />
        <Box s={[w * 0.5, h * 0.55, 0.05]} p={[0, -h * 0.08, 0.03]} m={fig} cast={false} />
        <Ball rad={w * 0.14} p={[0, h * 0.28, 0.04]} m={fig} />
      </group>
    );
  }
  function Shikhara() {
    const M = useM();
    const S = stoneM(M); const D = stoneDark(M); const G = M.gold;
    const widths = [0.84, 0.76, 0.68, 0.6, 0.5, 0.4];
    return (
      <group>
        {/* arcade plinth */}
        <Box s={[2.1, 0.42, 2.1]} p={[0, 0.21, 0]} m={S} />
        {faces(() => (
          <>
            {[-0.58, 0, 0.58].map((x) => (
              <group key={x}>
                <Box s={[0.34, 0.3, 0.05]} p={[x, 0.2, 1.06]} m={M.plain('#1a1714')} cast={false} />
                <Ball rad={0.17} sc={[1, 0.8, 0.16]} p={[x, 0.35, 1.06]} m={M.plain('#1a1714')} />
              </group>
            ))}
          </>
        ))}
        {/* stepped moulded base */}
        <Box s={[2.3, 0.08, 2.3]} p={[0, 0.46, 0]} m={D} />
        <Box s={[2.0, 0.1, 2.0]} p={[0, 0.55, 0]} m={S} />
        <Box s={[1.78, 0.08, 1.78]} p={[0, 0.64, 0]} m={D} />
        {/* body 1 with four arched niches */}
        <Box s={[1.5, 0.78, 1.5]} p={[0, 1.07, 0]} m={S} />
        {faces(() => <group position={[0, 1.07, 0.74]}><Niche w={0.36} h={0.44} /></group>)}
        {faces(() => [-0.5, 0.5].map((x) => <Box key={x} s={[0.07, 0.6, 0.04]} p={[x, 1.07, 0.76]} m={D} cast={false} />))}
        <Box s={[1.72, 0.08, 1.72]} p={[0, 1.5, 0]} m={D} />
        <Box s={[1.6, 0.06, 1.6]} p={[0, 1.57, 0]} m={S} />
        {/* four corner turrets */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Turret key={`${a}${b}`} p={[a * 0.58, 1.6, b * 0.58]} s={1.05} S={S} G={G} />)}
        {/* stage 2 */}
        <Box s={[1.1, 0.5, 1.1]} p={[0, 1.88, 0]} m={S} />
        {faces(() => <group position={[0, 1.88, 0.55]}><Niche w={0.3} h={0.36} /></group>)}
        <Box s={[1.24, 0.07, 1.24]} p={[0, 2.16, 0]} m={D} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Turret key={`t${a}${b}`} p={[a * 0.43, 2.19, b * 0.43]} s={0.85} S={S} G={G} />)}
        {/* stage 3 */}
        <Box s={[0.82, 0.42, 0.82]} p={[0, 2.46, 0]} m={S} />
        {faces(() => <group position={[0, 2.46, 0.41]}><Niche w={0.24} h={0.28} /></group>)}
        <Box s={[0.94, 0.06, 0.94]} p={[0, 2.7, 0]} m={D} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Turret key={`u${a}${b}`} p={[a * 0.32, 2.72, b * 0.32]} s={0.55} S={S} G={G} />)}
        {/* curvilinear tapering tower: ribbed slabs on a convex curve */}
        {Array.from({ length: 9 }, (_, i) => {
          const t = i / 8; const w = 0.3 + 0.4 * Math.pow(1 - t, 0.8);
          return (
            <group key={i} position={[0, 2.76 + i * 0.1, 0]}>
              <Box s={[w - 0.05, 0.075, w - 0.05]} p={[0, 0.04, 0]} m={S} />
              <Box s={[w + 0.03, 0.03, w + 0.03]} p={[0, 0.093, 0]} m={D} />
            </group>
          );
        })}
        <Cyl rt={0.2} rb={0.26} h={0.07} p={[0, 3.7, 0]} m={D} seg={12} />
        <Ball rad={0.26} sc={[1, 0.5, 1]} p={[0, 3.78, 0]} m={S} />
        <Cyl rt={0.16} rb={0.12} h={0.05} p={[0, 3.88, 0]} m={D} seg={12} />
        <Cyl rt={0.045} rb={0.07} h={0.1} p={[0, 3.95, 0]} m={G} seg={10} />
        <Ball rad={0.06} p={[0, 4.05, 0]} m={G} />
        <mesh position={[0, 4.2, 0]} material={G}><coneGeometry args={[0.03, 0.22, 8]} /></mesh>
      </group>
    );
  }

  /* ---------------- vajra on a vermilion plinth under a red-and-blue canopy ---------------- */
  function Vajra() {
    const M = useM();
    const g = M.gold;
    return (
      <group>
        <Box s={[0.56, 0.3, 0.46]} p={[0, 0.15, 0]} m={vermilion(M)} />
        <Box s={[0.62, 0.05, 0.52]} p={[0, 0.32, 0]} m={M.plain('#b02818')} />
        <group position={[0, 0.5, 0]} scale={0.8}>
          <Ball rad={0.07} p={[0, 0, 0]} m={g} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Cyl rt={0.055} h={0.04} p={[s * 0.1, 0, 0]} r={[0, 0, PI / 2]} m={g} seg={10} />
              {[0, 1, 2, 3].map((k) => <Box key={k} s={[0.22, 0.022, 0.022]} p={[s * 0.24, Math.sin(k * PI / 2) * 0.05, Math.cos(k * PI / 2) * 0.05]} r={[0, 0, s * Math.cos(k * PI / 2) * 0.0 + (k % 2 ? 0 : 0)]} m={g} cast={false} />)}
              <mesh position={[s * 0.34, 0, 0]} rotation={[0, 0, -s * PI / 2]} material={g}><coneGeometry args={[0.04, 0.12, 8]} /></mesh>
            </group>
          ))}
        </group>
        {/* canopy */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.018} h={1.9} p={[a * 0.48, 0.95, b * 0.48]} m={M.plain('#2b1e18')} seg={6} />)}
        <group position={[0, 1.9, 0]} scale={[0.78, 1, 0.78]}>
          <Box s={[1.4, 0.03, 1.4]} p={[0, -0.02, 0]} m={M.plain('#1f2f7a', { roughness: 0.9 })} cast={false} />
          <Roof w={1.5} d={1.5} h={0.38} y={0} m={M.plain('#c8102e', { roughness: 0.9 })} sag={1.2} lift={0.1} fascia={false} />
          <Box s={[1.52, 0.2, 0.02]} p={[0, -0.12, 0.75]} m={M.plain('#c8102e')} cast={false} />
          <Box s={[1.4, 0.16, 0.02]} p={[0, -0.14, 0.7]} m={M.plain('#1f2f7a')} cast={false} />
          <Box s={[1.52, 0.1, 0.02]} p={[0, -0.07, -0.75]} m={M.plain('#c8102e')} cast={false} />
          <Box s={[0.02, 0.1, 1.52]} p={[0.75, -0.07, 0]} m={M.plain('#c8102e')} cast={false} />
          <Box s={[0.02, 0.1, 1.52]} p={[-0.75, -0.07, 0]} m={M.plain('#c8102e')} cast={false} />
          <Box s={[1.52, 0.018, 0.025]} p={[0, -0.12, 0.76]} m={M.gold} cast={false} />
        </group>
      </group>
    );
  }
  function WheelRack({ p }) {
    const M = useM();
    const blue = M.plain('#2f5fa8', { roughness: 0.6 });
    return (
      <group position={p}>
        <Box s={[0.9, 0.05, 0.3]} p={[0, 0.03, 0]} m={blue} />
        <Box s={[0.9, 0.05, 0.3]} p={[0, 0.56, 0]} m={blue} />
        {[-0.44, 0.44].map((x) => <Box key={x} s={[0.05, 0.56, 0.3]} p={[x, 0.29, 0]} m={blue} />)}
        {[-0.33, -0.2, -0.07, 0.07, 0.2, 0.33].map((x) => <Cyl key={x} rt={0.05} h={0.44} p={[x, 0.3, 0]} m={M.plain('#b08a3a', { metalness: 0.7, roughness: 0.4 })} seg={10} />)}
      </group>
    );
  }
  function Stall({ p }) {
    const M = useM();
    return (
      <group position={p}>
        {[[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.025} h={0.9} p={[x, 0.45, z]} m={M.plain('#3a2a20')} seg={6} />)}
        <Roof w={1.5} d={1.1} h={0.28} y={0.9} m={M.plain('#a8442e', { metalness: 0.4, roughness: 0.55 })} sag={1} lift={0} fascia={false} />
        <Box s={[1.1, 0.35, 0.5]} p={[0, 0.2, -0.1]} m={M.plain('#6a4a30')} />
      </group>
    );
  }

  function AdinathMain() {
    const M = useM();
    return (
      <group>
        <group position={[0, 0, -2.0]} scale={1.4}><Pagoda /></group>
        <group position={[0.4, 0, 4.7]} scale={1.35}><Shikhara /></group>
        <group position={[-1.5, 0, 2.5]} scale={1.25}><Vajra /></group>
        <WheelRack p={[-3.4, 0, 5.3]} />
        <WheelRack p={[3.6, 0, 5.3]} />
        <Stall p={[-5.4, 0, 4.6]} />
        {/* lamps: warm lights at the doorway and on the vajra */}
        <pointLight position={[0, 1.3, 1.9]} intensity={0.5} distance={3.5} color="#ffb060" />
        {[-0.2, 0.1, 0.4].map((x) => <mesh key={x} position={[x * 1.2, 0.5, 2.0]}><sphereGeometry args={[0.03, 8, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>)}
        <Frame s={[8.4, 7.0, 11.6]} p={[0, 3.5, 0.6]} />
      </group>
    );
  }

  /* ---------------- environment: courtyard, village, hill, valley, Himalaya ---------------- */
  function Bld({ p, r = 0, w, d, h, wall, roof, rh = 0.7, win = 3, floors = 2, glow = false, utens }) {
    const M = useM();
    const dk = M.plain('#2b1e18');
    const gl = glow ? M.plain('#ffd089', { emissive: '#ffa43a', emissiveIntensity: 0.6 }) : M.plain('#1c1410');
    const wins = [];
    for (let f = 0; f < floors; f += 1) {
      for (let i = 0; i < win; i += 1) {
        const x = -w / 2 + ((i + 0.5) * w) / win;
        wins.push(<group key={`${f}${i}`} position={[x, 0.55 + f * (h / floors), d / 2 + 0.02]}>
          <Box s={[0.4, 0.5, 0.04]} p={[0, 0, 0]} m={dk} cast={false} />
          <Box s={[0.3, 0.38, 0.045]} p={[0, 0, 0.005]} m={(f + i) % 3 === 0 ? gl : M.plain('#1c1410')} cast={false} />
        </group>);
      }
    }
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wall} />
        <Box s={[w + 0.05, 0.08, d + 0.05]} p={[0, h, 0]} m={dk} cast={false} />
        <Roof w={w + 0.4} d={d + 0.5} h={rh} y={h} m={roof} sag={1} lift={0} fascia={false} />
        {wins}
        {utens}
      </group>
    );
  }
  function Peaks() {
    const M = useM();
    const list = [[-150, 18, 34], [-105, 30, 40], [-62, 22, 36], [-18, 40, 44], [28, 26, 40], [72, 36, 46], [112, 24, 38], [150, 30, 36], [-130, 12, 30], [128, 14, 32]];
    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(230, 24, 16);
      const pos = g.attributes.position; const cols = [];
      const top = new THREE.Color('#7ea6d6'); const mid = new THREE.Color('#b4cde6'); const low = new THREE.Color('#dce6ee'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i) / 230;
        if (y > 0.3) c.copy(mid).lerp(top, Math.min(1, (y - 0.3) / 0.7)); else c.copy(low).lerp(mid, Math.max(0, (y + 0.05) / 0.35));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, []);
    return (
      <group>
        
        {list.map(([x, hh, r], k) => (
          <group key={k} position={[x, -10, -110 - (k % 3) * 6]}>
            <mesh position={[0, hh / 2, 0]} material={M.plain('#6a7088', { roughness: 1, emissive: '#3a4670', emissiveIntensity: 0.35 })}><coneGeometry args={[r, hh, 7]} /></mesh>
            <mesh position={[0, hh * 0.74, 0]} material={M.plain('#f4f7fc', { roughness: 0.7, emissive: '#a8b4cc', emissiveIntensity: 0.2 })}><coneGeometry args={[r * 0.5, hh * 0.52, 7]} /></mesh>
          </group>
        ))}
        <mesh position={[0, -4, -100]} material={M.plain('#8d98b0', { roughness: 1 })}><boxGeometry args={[330, 14, 10]} /></mesh>
      </group>
    );
  }
  function AdinathEnv() {
    const M = useM();
    const floor = M.mat('herring', 6, 8, { color: '#f0d2bc' });
    const plaster = whiteP(M); const br = brickM(M, 2, 1, '#e8977c');
    function whiteP() { return M.plain('#efe9dc', { roughness: 0.9 }); }
    const ochre = M.plain('#d9b87a', { roughness: 0.9 });
    const front = useMemo(() => {
      const R = [];
      [0.2, 0.4].forEach((y) => { R.push(row(PI, 0.1, y, -7.4, -1.4, 0, 7.2)); });
      return R;
    }, []);
    const back = useMemo(() => {
      const R = [];
      [0.7, 0.95, 1.2].forEach((y) => R.push(row(0, 0.0, y, -4.5, 4.5, 0, -5.4)));
      return R;
    }, []);
    const right = useMemo(() => {
      const R = [];
      [0.6, 0.85, 1.1, 1.35, 1.6, 1.85].forEach((y) => R.push(row(-PI / 2, 0, y, -3.4, 2.8, 5.7, 0.2)));
      return R;
    }, []);
    // village houses stepping down the hill
    const slope = useMemo(() => {
      const out = [];
      const mats = ['pl', 'br', 'oc', 'pl', 'br'];
      for (let i = 0; i < 26; i += 1) {
        const a = (i / 26) * PI * 2 + 0.25;
        const rr = 18 + ((i * 7) % 11) * 1.35;
        const x = Math.cos(a) * rr; const z = Math.sin(a) * rr;
        if (z > 9 && Math.abs(x) < 5) continue; // keep the lane open
        out.push({ x, z, y: -(rr - 16) * 0.294, rot: -a + PI / 2 + ((i % 3) - 1) * 0.4, w: 2.2 + (i % 3) * 0.7, d: 2 + (i % 2) * 0.6, h: 2.3 + (i % 4) * 0.55, wall: mats[i % 5], roofT: i % 3 === 0 ? 'tile' : 'tin' });
      }
      return out;
    }, []);
    const wallOf = (k) => (k === 'br' ? br : k === 'oc' ? ochre : plaster);
    const fields = useMemo(() => Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * PI * 2; const rr = 62 + (i % 5) * 9;
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, w: 12 + (i % 3) * 5, d: 8 + (i % 4) * 3, c: ['#9db25a', '#c3b865', '#7fa04a', '#b8b07a'][i % 4], r: a };
    }), []);
    return (
      <group>
        {/* hill: top, slopes falling away to the valley floor */}
        <mesh position={[0, -5, 0]} material={M.mat('grass', 12, 6, { color: '#a8a26e' })} receiveShadow><cylinderGeometry args={[16, 50, 10, 56]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -10.2, 0]} material={M.mat('grass', 40, 40, { color: '#b0b878' })} receiveShadow><circleGeometry args={[260, 48]} /></mesh>
        {fields.map((f, i) => <mesh key={i} rotation={[-PI / 2, 0, f.r]} position={[f.x, -10.1, f.z]} material={M.plain(f.c, { roughness: 1 })}><planeGeometry args={[f.w, f.d]} /></mesh>)}
        {/* distant town on the valley floor (north) */}
        {Array.from({ length: 16 }, (_, i) => <Box key={i} s={[3 + (i % 3), 1 + (i % 4) * 0.4, 3]} p={[-50 + (i % 8) * 8 + (i > 7 ? 4 : 0), -9.2, -72 - (i > 7 ? 7 : 0)]} m={i % 2 ? plaster : ochre} cast={false} />)}
        {/* Bagmati gorge: a dark ridge with a notch far to the south-west, river only a distant sliver */}
        <mesh position={[-60, -6, 96]} material={M.plain('#5f7a4e', { roughness: 1 })}><coneGeometry args={[34, 10, 6]} /></mesh>
        <mesh position={[-20, -6.4, 100]} material={M.plain('#566f48', { roughness: 1 })}><coneGeometry args={[30, 9, 6]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0.25]} position={[-42, -10, 90]}><planeGeometry args={[4, 30]} /><meshStandardMaterial color="#6f9aa0" metalness={0.3} roughness={0.2} /></mesh>
        {/* Bagmati gorge notch to the south-west: two steep ridges with the river between */}
        <mesh position={[-54, -10, 26]} material={M.plain('#4f6a42', { roughness: 1 })}><coneGeometry args={[16, 22, 6]} /></mesh>
        <mesh position={[-28, -10, 54]} material={M.plain('#47623c', { roughness: 1 })}><coneGeometry args={[16, 20, 6]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0.72]} position={[-42, -10.0, 40]}><planeGeometry args={[5, 46]} /><meshStandardMaterial color="#5f8e9a" metalness={0.3} roughness={0.2} /></mesh>
        <Peaks />
        {/* courtyard platform and lane */}
        <Box s={[17, 0.5, 15.4]} p={[0, -0.22, -0.2]} m={floor} cast={false} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.02, 14]} material={M.mat('herring', 2, 8, { color: '#c89a84' })} receiveShadow><planeGeometry args={[2.8, 14]} /></mesh>
        {/* courtyard edge: two-storey houses, left plaster/tile, back brick/tin with pots, right brick with pots */}
        <Bld p={[-6.9, 0, 0.3]} r={PI / 2} w={9.5} d={2.4} h={2.4} floors={2} rh={0.4} wall={plaster} roof={tile(M)} win={4} glow />
        <Bld p={[0, 0, -6.6]} r={0} w={17} d={2.4} h={3.4} floors={3} wall={plaster} roof={tin(M)} rh={0.8} win={5} utens={<Utensils rows={back} seed={11} />} />
        <Bld p={[6.8, 0, 0.2]} r={-PI / 2} w={9} d={2.2} h={2.4} floors={2} wall={br} roof={tin(M)} rh={0.4} win={4} glow utens={<Utensils rows={right} seed={13} />} />
        {/* low front wall of the courtyard with a gate gap, utensils on its inner face */}
        {[-1, 1].map((s) => <Box key={s} s={[6.6, 0.6, 0.3]} p={[s * 4.6, 0.3, 7.2]} m={br} />)}
        {[-1, 1].map((s) => <Box key={`p${s}`} s={[0.4, 1.3, 0.4]} p={[s * 1.3, 0.65, 7.2]} m={br} />)}
        <Utensils rows={front} seed={17} />
        <Utensils rows={useMemo(() => [0.2, 0.4].map((y) => row(PI, 0.1, y, 1.4, 7.4, 0, 7.2)), [])} seed={19} />
        {/* houses beyond the gate and on the slope: mixed walls, tin and tile roofs */}
        <Bld p={[-6.5, 0, 10.5]} r={0.1} w={4.5} d={2.6} h={3.4} wall={ochre} roof={tile(M)} win={3} glow />
        <Bld p={[7.5, -0.4, 12]} r={-0.1} w={3.6} d={2.4} h={2.4} wall={br} roof={tin(M)} win={3} />
        <Bld p={[-3.8, -0.2, 14.5]} r={0} w={3} d={2.2} h={2.4} wall={plaster} roof={tin(M)} win={2} />
        {/* modern white block with a green water tank behind the temple */}
        <Box s={[3.4, 5.4, 3.2]} p={[4.5, 2.7, -12]} m={plaster} />
        {[0, 1, 2, 3].map((f) => [-1, 0, 1].map((i) => <Box key={`${f}${i}`} s={[0.5, 0.55, 0.04]} p={[4.5 + i * 1.0, 0.9 + f * 1.25, -10.37]} m={M.plain('#2a3440')} cast={false} />))}
        <Cyl rt={0.55} h={0.7} p={[4.0, 5.75, -12]} m={M.plain('#3f7a4a', { roughness: 0.6 })} seg={16} />
        <Box s={[5, 3.4, 3]} p={[-6, 1.7, -11.5]} m={ochre} />
        {/* slope houses */}
        {slope.map((h, i) => (
          <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.rot, 0]}>
            <Box s={[h.w, h.h, h.d]} p={[0, h.h / 2, 0]} m={wallOf(h.wall)} />
            <Roof w={h.w + 0.4} d={h.d + 0.5} h={0.6} y={h.h} m={h.roofT === 'tile' ? tile(M) : tin(M)} sag={1} lift={0} fascia={false} />
            <Box s={[0.4, 0.45, 0.04]} p={[-h.w * 0.25, h.h * 0.55, h.d / 2 + 0.02]} m={M.plain('#2b1e18')} cast={false} />
            <Box s={[0.4, 0.45, 0.04]} p={[h.w * 0.25, h.h * 0.55, h.d / 2 + 0.02]} m={M.plain('#2b1e18')} cast={false} />
          </group>
        ))}
        {/* a few trees (no forest) */}
        {[[-14, -8], [12, -10], [-11, 13], [14, 7], [10, -15], [-16, -2]].map(([x, z], i) => {
          const rr = Math.hypot(x, z); return <Tree key={i} p={[x, -Math.max(0, rr - 16) * 0.294, z]} s={1.1 + (i % 3) * 0.2} kind="broad" />;
        })}
      </group>
    );
  }

  return { 'adinath-lokeshwar-chobhar': { Main: AdinathMain, Env: AdinathEnv } };
}
