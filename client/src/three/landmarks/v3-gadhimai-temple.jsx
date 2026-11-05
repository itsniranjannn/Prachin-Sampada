/* Gadhimai Temple, Bariyarpur (Mahagadhimai), Bara, Madhesh. A modest (~9 m) cream-plaster Terai shrine: one cubic block with a big
   cusped ogee arch in front, striding relief tigers on the walls, a gold bracketed cornice, a white-balustraded flat roof terrace and a
   small set-back two-tier red-orange tiled pavilion with a gold pinnacle. Paved plaza under huge old trees, a low hip-roofed tiled
   hall beside it, a pond with benches, and the flat brick-walled festival arena on a table-flat plain. 1 unit = 1 m. Front = +z.
   All sizes are photo estimates (six photographs, no published dimensions). */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Diyo, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const CREAM = '#efe6d2', GOLD = '#e1b12c', TILE = '#c4562b', RED = '#c81d1d', TIGER = '#b7512c', STRIPE = '#3a1a0e', WHITE = '#f6f3ea';

  /* ---------- instancing ---------- */
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 6);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitBall = new THREE.SphereGeometry(1, 10, 8);
  const mx = (pos, sc, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(...sc));
  function Inst({ geo, mat, mats, cast = true }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(geo, mat, mats.length);
      mats.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true; im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, mat, mats, cast]);
    return <primitive object={mesh} />;
  }

  /* ---------- cusped ogee arch outline (shape in XY, extruded +z) ---------- */
  function archShape(w, hs, ht, foil = 0.06) {
    const W2 = w / 2, n = 40, left = [], right = [];
    for (let i = 1; i <= n; i += 1) {
      const u = i / n;
      let hw = W2 * ((1 - u) + 0.13 * Math.sin(2 * Math.PI * u));
      if (u < 0.97) hw -= foil * W2 * Math.abs(Math.sin(u * Math.PI * 4)) * Math.min(1, u * 6);
      const y = hs + ht * u;
      left.push([-Math.max(hw, 0), y]); right.push([Math.max(hw, 0), y]);
    }
    const s = new THREE.Shape();
    s.moveTo(-W2, 0); s.lineTo(-W2, hs);
    left.forEach(([x, y]) => s.lineTo(x, y));
    right.reverse().forEach(([x, y]) => s.lineTo(x, y));
    s.lineTo(W2, hs); s.lineTo(W2, 0); s.closePath();
    return s;
  }
  function Arch({ w, hs, ht, depth = 0.06, m, p, r, foil }) {
    const geo = useMemo(() => new THREE.ExtrudeGeometry(archShape(w, hs, ht, foil), { depth, bevelEnabled: false }), [w, hs, ht, depth, foil]);
    return <mesh geometry={geo} material={m} position={p} rotation={r} castShadow receiveShadow />;
  }

  /* ---------- relief tiger, striding to +x, depth thin in z ---------- */
  function Tiger({ m, p, r, s = 1, flip = false }) {
    const M = useM();
    const body = M.plain(TIGER, { roughness: 0.8 }), dark = M.plain(STRIPE, { roughness: 0.9 });
    return (
      <group position={p} rotation={r} scale={[flip ? -s : s, s, s]}>
        <Box s={[1.25, 0.34, 0.1]} p={[0, 0.0, 0]} m={body} cast={false} />
        <Ball rad={0.2} p={[0.62, 0.1, 0]} sc={[1, 0.95, 0.5]} m={body} />
        <Box s={[0.14, 0.1, 0.08]} p={[0.8, 0.04, 0]} m={body} cast={false} />
        <Box s={[0.07, 0.1, 0.06]} p={[0.55, 0.3, 0]} m={body} cast={false} />
        {[[0.38, 0.25], [0.28, -0.2], [-0.32, 0.2], [-0.4, -0.25]].map(([x, a], i) => (
          <Box key={i} s={[0.1, 0.36, 0.08]} p={[x + a * 0.25, -0.3, 0]} r={[0, 0, a]} m={body} cast={false} />
        ))}
        <Box s={[0.5, 0.07, 0.07]} p={[-0.8, 0.05, 0]} r={[0, 0, -0.35]} m={body} cast={false} />
        {[-0.5, -0.36, -0.22, -0.08, 0.06, 0.2, 0.34].map((x, i) => <Box key={i} s={[0.05, 0.3, 0.115]} p={[x, 0.02, 0]} r={[0, 0, 0.18]} m={dark} cast={false} />)}
        <Box s={[0.05, 0.12, 0.12]} p={[0.68, 0.1, 0]} m={dark} cast={false} />
      </group>
    );
  }

  /* ---------- tiny devotee ---------- */
  function Person({ p, c, h = 1, ry = 0, skin = '#8a5a3c' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, ry, 0]} scale={h}>
        <Cyl rt={0.13} rb={0.19} h={0.95} p={[0, 0.5, 0]} m={M.plain(c, { roughness: 0.9 })} seg={8} />
        <Cyl rt={0.07} rb={0.07} h={0.45} p={[0, 0.2, 0]} m={M.plain('#3a3550')} seg={6} />
        <Ball rad={0.12} p={[0, 1.15, 0]} m={M.plain(skin)} />
        <Cyl rt={0.16} rb={0.2} h={0.4} p={[0, 0.95, -0.02]} m={M.plain(c === '#d1281f' ? '#f2b01c' : '#d1281f', { roughness: 0.9 })} seg={8} />
        <Ball rad={0.125} p={[0, 1.2, -0.01]} sc={[1, 0.8, 1]} m={M.plain('#15100c')} />
      </group>
    );
  }

  /* =================== MAIN: the shrine =================== */
  function GadhimaiMain() {
    const M = useM();
    const plaster = M.plain(CREAM, { roughness: 0.95 });
    const plasterSh = M.plain('#e4d6bc', { roughness: 0.9 });
    const gold = M.plain(GOLD, { roughness: 0.4, metalness: 0.5 });
    const dark = M.plain('#1a0c0a', { roughness: 1 });
    const red = M.plain(RED, { roughness: 0.8 });
    const white = M.plain(WHITE, { roughness: 0.6 });
    const tile = M.plain('#b24c26', { roughness: 0.75 });
    const stone = M.plain('#cfc6b4', { roughness: 1 });
    const brass = M.plain('#d9a52a', { roughness: 0.3, metalness: 0.8 });
    const marigold = M.plain('#f09a10', { roughness: 0.9 });
    const green = M.plain('#2f8a3a', { roughness: 0.8 });

    const BH = 4.35;            // top of the cream block
    const TY = 4.5;             // terrace floor
    const hw = 3;               // half-width of block

    /* balustrade: 13 balusters across each face */
    const balusters = useMemo(() => {
      const out = [], a = 3.2, n = 13;
      for (let i = 0; i < n; i += 1) {
        const t = -a + 0.25 + (i * (2 * a - 0.5)) / (n - 1);
        out.push(mx([t, TY + 0.5, a], [0.045, 0.85, 0.045]), mx([t, TY + 0.5, -a], [0.045, 0.85, 0.045]),
          mx([a, TY + 0.5, t], [0.045, 0.85, 0.045]), mx([-a, TY + 0.5, t], [0.045, 0.85, 0.045]));
      }
      return out;
    }, []);
    const posts = useMemo(() => {
      const out = [], a = 3.2;
      [-a, -a / 3, a / 3, a].forEach((t) => {
        out.push(mx([t, TY + 0.55, a], [0.16, 1.0, 0.16]), mx([t, TY + 0.55, -a], [0.16, 1.0, 0.16]));
        if (Math.abs(t) < a - 0.01) out.push(mx([a, TY + 0.55, t], [0.16, 1.0, 0.16]), mx([-a, TY + 0.55, t], [0.16, 1.0, 0.16]));
      });
      return out;
    }, []);
    /* cornice brackets / dentils */
    const dentils = useMemo(() => {
      const out = [], a = 3.25;
      for (let i = 0; i < 17; i += 1) {
        const t = -3.2 + i * 0.4;
        out.push(mx([t, BH - 0.1, a + 0.05], [0.2, 0.22, 0.28]), mx([t, BH - 0.1, -a - 0.05], [0.2, 0.22, 0.28]),
          mx([a + 0.05, BH - 0.1, t], [0.28, 0.22, 0.2]), mx([-a - 0.05, BH - 0.1, t], [0.28, 0.22, 0.2]));
      }
      return out;
    }, []);

    const shoulder = [[-2.0, 2.85], [2.0, 2.85]];
    return (
      <group>
        {/* one low step and cream block */}
        <Box s={[6.9, 0.14, 6.9]} p={[0, 0.07, 0]} m={stone} />
        <Box s={[6, BH - 0.14, 6]} p={[0, 0.14 + (BH - 0.14) / 2, 0]} m={plaster} />
        {/* plinth skirting */}
        <Box s={[6.12, 0.35, 6.12]} p={[0, 0.32, 0]} m={plasterSh} />

        {/* ---- front: gold-edged ogee arch, dark opening, red cloth altar glimpse ---- */}
        <Arch w={3.9} hs={1.8} ht={1.5} depth={0.06} m={gold} p={[0, 0.14, hw + 0.01]} foil={0.05} />
        <Arch w={3.55} hs={1.7} ht={1.45} depth={0.1} m={M.plain('#8a1f18', { roughness: 0.8 })} p={[0, 0.14, hw + 0.03]} foil={0.07} />
        <Arch w={3.2} hs={1.6} ht={1.38} depth={0.12} m={dark} p={[0, 0.14, hw + 0.05]} foil={0.08} />
        <Box s={[2.5, 1.05, 0.12]} p={[0, 0.75, hw + 0.13]} m={red} cast={false} />
        <Box s={[2.5, 0.1, 0.14]} p={[0, 1.3, hw + 0.14]} m={gold} cast={false} />
        {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => <Ball key={i} rad={0.1} p={[x, 1.42, hw + 0.22]} sc={[1, 0.6, 1]} m={i % 2 ? marigold : green} />)}
        <Cyl rt={0.12} rb={0.1} h={0.22} p={[0.15, 1.5, hw + 0.2]} m={brass} seg={10} />
        <Box s={[1.2, 0.8, 0.1]} p={[0, 2.0, hw + 0.13]} m={M.plain('#6a1410', { roughness: 0.9 })} cast={false} />
        <Box s={[1.2, 0.08, 0.12]} p={[0, 2.42, hw + 0.15]} m={gold} cast={false} />
        {/* flanking niches with brass pots and lamps */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Arch w={0.95} hs={0.95} ht={0.85} depth={0.05} m={gold} p={[sx * 2.5 - 0.475, 0.14, hw + 0.01]} foil={0.04} />
            <Arch w={0.75} hs={0.9} ht={0.8} depth={0.08} m={dark} p={[sx * 2.5 - 0.375, 0.14, hw + 0.03]} foil={0.05} />
            <Cyl rt={0.1} rb={0.08} h={0.2} p={[sx * 2.5, 0.28, hw + 0.15]} m={brass} seg={10} />
            <Box s={[0.5, 0.5, 0.05]} p={[sx * 2.5, 0.7, hw + 0.1]} m={M.plain('#6a1410', { roughness: 0.9 })} cast={false} />
          </group>
        ))}
        {/* drape swag across arch top */}
        <Box s={[0.1, 0.9, 0.06]} p={[-1.45, 2.3, hw + 0.15]} m={red} cast={false} />
        <Box s={[0.1, 0.9, 0.06]} p={[1.45, 2.3, hw + 0.15]} m={red} cast={false} />
        {/* front tigers, left and right of the arch, face outward */}
        <Tiger p={[-2.2, 3.3, hw + 0.06]} s={1.35} />
        <Tiger p={[2.2, 3.3, hw + 0.06]} s={1.35} flip />
        {/* hanging lamp bracket on arch pier */}
        <Box s={[0.07, 0.4, 0.07]} p={[2.5, 2.3, hw + 0.12]} m={dark} cast={false} />

        {/* ---- side walls: arcaded porch arch + tiger above ---- */}
        {[1, -1].map((sx) => (
          <group key={sx}>
            <Arch w={2.5} hs={1.2} ht={1.2} depth={0.06} m={gold} p={[sx * (hw + 0.01), 0.14, 1.2]} r={[0, sx * Math.PI / 2, 0]} foil={0.05} />
            <Arch w={2.2} hs={1.12} ht={1.15} depth={0.1} m={dark} p={[sx * (hw + 0.03), 0.14, 1.2]} r={[0, sx * Math.PI / 2, 0]} foil={0.06} />
            <Box s={[0.1, 0.9, 1.8]} p={[sx * (hw + 0.1), 0.65, 1.2]} m={M.plain('#6a1410')} cast={false} />
            <Arch w={1.5} hs={0.9} ht={0.8} depth={0.05} m={gold} p={[sx * (hw + 0.01), 0.14, -1.7]} r={[0, sx * Math.PI / 2, 0]} foil={0.04} />
            <Arch w={1.3} hs={0.85} ht={0.75} depth={0.08} m={dark} p={[sx * (hw + 0.03), 0.14, -1.7]} r={[0, sx * Math.PI / 2, 0]} foil={0.05} />
            
            <Tiger p={[sx * (hw + 0.06), 3.45, 1.2]} r={[0, sx * Math.PI / 2, 0]} s={1.2} />
            <Box s={[0.18, BH - 0.3, 0.18]} p={[sx * (hw - 0.05), 2.3, hw - 0.05]} m={plasterSh} cast={false} />
            <Box s={[0.18, BH - 0.3, 0.18]} p={[sx * (hw - 0.05), 2.3, -hw + 0.05]} m={plasterSh} cast={false} />
          </group>
        ))}
        {/* back wall tiger */}
        <Tiger p={[0, 3.45, -hw - 0.06]} r={[0, Math.PI, 0]} s={1.35} />

        {/* ---- gold cornice ---- */}
        <Box s={[6.9, 0.14, 6.9]} p={[0, BH - 0.22, 0]} m={gold} />
        <Inst geo={unitBox} mat={gold} mats={dentils} />
        <Box s={[7.0, 0.2, 7.0]} p={[0, BH - 0.02, 0]} m={gold} />
        <Box s={[7.1, 0.12, 7.1]} p={[0, BH + 0.1, 0]} m={plaster} />
        {/* roof terrace slab */}
        <Box s={[6.7, 0.1, 6.7]} p={[0, TY - 0.0, 0]} m={plaster} />

        {/* ---- white balustrade ---- */}
        <Inst geo={unitCyl} mat={white} mats={balusters} />
        <Inst geo={unitBox} mat={white} mats={posts} />
        <Box s={[6.6, 0.16, 0.2]} p={[0, TY + 1.0, 3.2]} m={white} cast={false} />
        <Box s={[6.6, 0.16, 0.2]} p={[0, TY + 1.0, -3.2]} m={white} cast={false} />
        <Box s={[0.2, 0.16, 6.6]} p={[3.2, TY + 1.0, 0]} m={white} cast={false} />
        <Box s={[0.2, 0.16, 6.6]} p={[-3.2, TY + 1.0, 0]} m={white} cast={false} />
        <Box s={[6.6, 0.09, 0.14]} p={[0, TY + 0.1, 3.2]} m={white} cast={false} />
        <Box s={[6.6, 0.09, 0.14]} p={[0, TY + 0.1, -3.2]} m={white} cast={false} />
        <Box s={[0.14, 0.09, 6.6]} p={[3.2, TY + 0.1, 0]} m={white} cast={false} />
        <Box s={[0.14, 0.09, 6.6]} p={[-3.2, TY + 0.1, 0]} m={white} cast={false} />

        {/* ---- set-back two-tier tiled pavilion ---- */}
        <group position={[0, TY + 0.05, 0]}>
          <Box s={[2.3, 1.15, 2.3]} p={[0, 0.58, 0]} m={plaster} />
          <Box s={[2.46, 0.12, 2.46]} p={[0, 1.1, 0]} m={gold} />
          <Box s={[0.9, 0.85, 0.06]} p={[0, 0.5, 1.17]} m={dark} cast={false} />
          <Box s={[0.9, 0.08, 0.1]} p={[0, 0.96, 1.18]} m={gold} cast={false} />
          {[-1, 1].map((s) => <Box key={s} s={[0.05, 0.6, 0.05]} p={[s * 0.8, 0.5, 1.18]} m={gold} cast={false} />)}
          {/* roof tier 1: concave terracotta-gold eaves, gilded fascia, pendants */}
          <Roof w={4.3} d={4.3} h={0.95} y={1.16} m={tile} sag={1.8} lift={0.4} fascia={false} />
          {[[0, 2.15, 4.35, 0.12], [0, -2.15, 4.35, 0.12], [2.15, 0, 0.12, 4.35], [-2.15, 0, 0.12, 4.35]].map(([x, z, sx, sz], i) => <Box key={i} s={[sx, 0.2, sz]} p={[x, 1.2, z]} m={gold} cast={false} />)}
          <Box s={[4.25, 0.2, 0.04]} p={[0, 0.98, 2.13]} m={red} cast={false} />
          <Box s={[0.04, 0.2, 4.25]} p={[2.13, 0.98, 0]} m={red} cast={false} />
          <Box s={[0.04, 0.2, 4.25]} p={[-2.13, 0.98, 0]} m={red} cast={false} />
          {[-1.6, -0.55, 0.55, 1.6].map((t, i) => (
            <group key={i}>
              <Ball rad={0.09} p={[t, 0.82, 2.15]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? gold : green} />
              <Ball rad={0.09} p={[t, 0.82, -2.15]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? gold : green} />
              <Ball rad={0.09} p={[2.15, 0.82, t]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? gold : green} />
              <Ball rad={0.09} p={[-2.15, 0.82, t]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? gold : green} />
            </group>
          ))}
          {/* storey 2 */}
          <Box s={[1.5, 1.5, 1.5]} p={[0, 1.7, 0]} m={plaster} />
          <Box s={[1.64, 0.1, 1.64]} p={[0, 2.5, 0]} m={gold} />
          <Box s={[0.62, 0.8, 0.05]} p={[0, 1.75, 0.77]} m={red} cast={false} />
          <Box s={[0.66, 0.07, 0.07]} p={[0, 2.18, 0.78]} m={gold} cast={false} />
          {/* roof tier 2 */}
          <Roof w={2.7} d={2.7} h={1.05} y={2.56} m={tile} sag={1.8} lift={0.4} fascia={false} />
          {[[0, 1.35, 2.75, 0.1], [0, -1.35, 2.75, 0.1], [1.35, 0, 0.1, 2.75], [-1.35, 0, 0.1, 2.75]].map(([x, z, sx, sz], i) => <Box key={i} s={[sx, 0.2, sz]} p={[x, 2.6, z]} m={gold} cast={false} />)}
          <Box s={[2.65, 0.18, 0.04]} p={[0, 2.4, 1.33]} m={red} cast={false} />
          <Box s={[0.04, 0.18, 2.65]} p={[1.33, 2.4, 0]} m={red} cast={false} />
          <Box s={[0.04, 0.18, 2.65]} p={[-1.33, 2.4, 0]} m={red} cast={false} />
          {[-0.9, 0, 0.9].map((t, i) => (
            <group key={i}>
              <Ball rad={0.08} p={[t, 2.25, 1.36]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? green : gold} />
              <Ball rad={0.08} p={[1.36, 2.25, t]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? green : gold} />
              <Ball rad={0.08} p={[-1.36, 2.25, t]} sc={[0.7, 1.7, 0.7]} m={i % 2 ? green : gold} />
            </group>
          ))}
          <Gajur y={3.55} s={1.15} />
          {[[-2.05, 2.22, 0.9], [-1.0, 2.22, 0.8], [2.05, 2.22, 1.0], [-2.22, 2.05, 0.7]].map(([x, z, k], i) => (i < 3 ? <Box key={i} s={[0.25, 1.8, 0.03]} p={[x, 0.2, z]} m={red} cast={false} /> : <Box key={i} s={[0.03, 1.8, 0.25]} p={[x, 0.2, z - 0.35]} m={red} cast={false} />))}
          {/* gold-framed arched panels on side and back faces of storey 2 */}
          {[[0, -0.77, 0], [0.77, 0, 1], [-0.77, 0, 1]].map(([x, z, o], i) => (
            <group key={i}>
              <Box s={o ? [0.05, 0.84, 0.66] : [0.66, 0.84, 0.05]} p={[x, 1.75, z]} m={gold} cast={false} />
              <Box s={o ? [0.06, 0.74, 0.54] : [0.54, 0.74, 0.06]} p={[x, 1.74, z]} m={red} cast={false} />
              <Ball rad={0.27} p={[x, 2.1, z]} sc={o ? [0.2, 0.55, 1] : [1, 0.55, 0.2]} m={gold} />
            </group>
          ))}
          {[-0.5, 0.5].map((x) => <Box key={x} s={[0.3, 0.55, 0.05]} p={[x, 1.75, 0.77]} m={gold} cast={false} />)}
        </group>

        {/* ---- diyas and lamp inside the arch ---- */}
        {[-1.1, -0.55, 0, 0.55, 1.1].map((x, i) => <Diyo key={i} p={[x, 0.16, 3.7]} />)}
        <pointLight position={[0, 1.4, 3.6]} intensity={0.7} distance={5} color="#ff9a50" />
        {/* lit lamp (dusk glow) over the arch */}
        {[-2.5, 2.5].map((x) => <mesh key={x} position={[x, 2.3, hw + 0.2]}><sphereGeometry args={[0.1, 8, 6]} /><meshBasicMaterial color="#ffd27a" toneMapped={false} /></mesh>)}

        {/* ---- devotees at the arch ---- */}
        {[[-3.6,4.6,0,1.0,0],[-2.6,6.2,1,0.92,1],[-1.1,4.9,2,1.05,2],[-0.3,6.6,3,0.95,3],[1.3,5.1,4,1.0,1],[2.3,6.4,5,0.88,2],[3.5,4.7,6,1.04,0],[4.3,6.0,7,0.9,3],[-4.4,6.7,5,0.97,1],[0.9,4.2,2,0.86,2],[-1.9,7.0,4,1.02,0],[3.0,7.0,1,0.93,3]].map(([x, z, ci, h, sk], i) => (
          <Person key={i} p={[x, 0.14, z]} c={['#b4566e', '#4a6f9c', '#c9ad55', '#4f8a66', '#a8493f', '#75609a', '#d1281f', '#f2b01c'][ci]} skin={['#8a5a3c', '#a06a46', '#6e442c', '#b57d58'][sk]} ry={((i * 7) % 5 - 2) * 0.35} h={h} />
        ))}

        <Frame s={[8.4, 9.8, 7.6]} p={[0, 4.9, 0.9]} />
      </group>
    );
  }

  /* =================== ENV =================== */
  function BigTree({ p, s = 1, lean = 0, ry = 0, platform = false, seed = 0 }) {
    const M = useM();
    const bark = M.plain('#6d5a48', { roughness: 1 });
    const leafA = M.plain('#6f8a3a', { roughness: 1 }), leafB = M.plain('#82983f', { roughness: 1 });
    const leafC = M.plain('#5f7a2f', { roughness: 1 });
    const blobs = useMemo(() => Array.from({ length: 8 }, (_, i) => {
      const a = rnd(seed * 9 + i) * 6.28, r = 0.8 + rnd(seed * 5 + i + 3) * 4.2;
      return [Math.cos(a) * r, 9 + rnd(seed * 7 + i + 9) * 2.2, Math.sin(a) * r, 1.6 + rnd(seed + i * 3) * 0.8];
    }), [seed]);
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s}>
        {platform && <Cyl rt={1.9} rb={2.0} h={0.22} p={[0, 0.11, 0]} m={M.plain('#c2b8a2')} seg={28} />}
        <group rotation={[0, 0, lean]}>
          <Cyl rt={0.8} rb={1.25} h={4.2} p={[0, 2.1, 0]} m={bark} seg={10} />
          <Cyl rt={0.55} rb={0.8} h={3.4} p={[0.05, 5.6, 0]} m={bark} seg={9} />
          <Cyl rt={0.25} rb={0.45} h={3.2} p={[1.2, 7.4, 0.2]} r={[0, 0, -0.8]} m={bark} seg={7} />
          <Cyl rt={0.25} rb={0.45} h={3.2} p={[-1.2, 7.5, -0.3]} r={[0, 0, 0.8]} m={bark} seg={7} />
          <Cyl rt={0.12} rb={0.22} h={3} p={[0.1, 7.4, 1.2]} r={[0.8, 0, 0]} m={bark} seg={7} />
          {blobs.map(([x, y, z, r], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1, 0.55, 1]} m={i % 3 === 0 ? leafC : i % 3 === 1 ? leafA : leafB} />)}
        </group>
      </group>
    );
  }

  function TiledHall() {
    const M = useM();
    const wall = M.plain('#ece0c8', { roughness: 0.95 });
    const tile = M.plain('#b24c26', { roughness: 0.75 });
    const gold = M.plain(GOLD, { roughness: 0.4, metalness: 0.5 });
    const red = M.plain(RED, { roughness: 0.8 });
    const dark = M.plain('#1c1410');
    return (
      <group>
        <Box s={[8, 0.25, 5]} p={[0, 0.12, 0]} m={M.plain('#cfc6b4')} />
        <Box s={[7.4, 2.4, 4.4]} p={[0, 1.45, 0]} m={wall} />
        {[-2.5, -0.8, 0.9, 2.6].map((x) => (
          <group key={x}>
            <Box s={[0.7, 0.8, 0.06]} p={[x, 1.7, 2.22]} m={dark} cast={false} />
            {[-0.2, 0, 0.2].map((b) => <Box key={b} s={[0.03, 0.8, 0.04]} p={[x + b, 1.7, 2.26]} m={M.plain('#8a8a8a')} cast={false} />)}
          </group>
        ))}
        <Box s={[1.1, 1.9, 0.06]} p={[3.1, 1.2, 2.22]} m={M.plain('#6a4a30')} cast={false} />
        {/* lower hip roof */}
        <Roof w={9.0} d={6.0} h={1.1} y={2.65} m={tile} sag={1.0} lift={0} fascia={false} />
        <Box s={[9.0, 0.3, 0.05]} p={[0, 2.5, 3.0]} m={red} cast={false} />
        <Box s={[0.05, 0.3, 6.0]} p={[4.5, 2.5, 0]} m={red} cast={false} />
        <Box s={[0.05, 0.3, 6.0]} p={[-4.5, 2.5, 0]} m={red} cast={false} />
        <Box s={[9.05, 0.1, 0.1]} p={[0, 2.65, 3.0]} m={gold} cast={false} />
        {/* raised upper tier */}
        <Box s={[4.4, 0.8, 2.6]} p={[0, 3.9, 0]} m={wall} />
        <Roof w={5.4} d={3.6} h={1.0} y={4.3} m={tile} sag={1.0} lift={0} fascia={false} />
        <Box s={[5.4, 0.22, 0.05]} p={[0, 4.18, 1.8]} m={red} cast={false} />
        <Box s={[5.45, 0.08, 0.08]} p={[0, 4.3, 1.8]} m={gold} cast={false} />
      </group>
    );
  }

  function Fence({ from, to, n }) {
    const M = useM();
    const rust = M.plain('#6b2f22', { roughness: 0.8, metalness: 0.4 });
    const dx = to[0] - from[0], dz = to[1] - from[1], len = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
    const posts = useMemo(() => Array.from({ length: n + 1 }, (_, i) => mx([from[0] + (dx * i) / n, 0.55, from[1] + (dz * i) / n], [0.07, 1.1, 0.07])), [from, to, n]);
    return (
      <group>
        <Inst geo={unitBox} mat={rust} mats={posts} />
        {[0.45, 0.85].map((y) => <mesh key={y} position={[from[0] + dx / 2, y, from[1] + dz / 2]} rotation={[0, ang, 0]} material={rust}><boxGeometry args={[0.05, 0.05, len]} /></mesh>)}
      </group>
    );
  }

  function Pond() {
    const M = useM();
    const water = M.plain('#8fa597', { roughness: 0.15, metalness: 0.3 });
    const bank = M.mat('grass', 6, 6, { color: '#b9c06a' });
    const paving = M.plain('#c9bda6', { roughness: 1 });
    const wood = M.plain('#7a5a3a'), conc = M.plain('#b9b2a2');
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[1.15, 1, 1]} material={bank} receiveShadow><circleGeometry args={[12.5, 40]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[1.15, 1, 1]} material={paving} receiveShadow><circleGeometry args={[9.8, 40]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} scale={[1.15, 1, 1]} material={water} receiveShadow><circleGeometry args={[8.2, 40]} /></mesh>
        {[[-4.6, 5.0, 0.55], [0.4, 7.3, 0.15], [4.8, 5.4, -0.5], [-8.5, 0.8, 1.4]].map(([x, z, ry], i) => (
          <group key={i} position={[x, 0.03, z]} rotation={[0, ry, 0]}>
            <Box s={[1.5, 0.08, 0.45]} p={[0, 0.5, 0]} m={wood} cast={false} />
            <Box s={[1.5, 0.4, 0.06]} p={[0, 0.78, -0.2]} m={wood} cast={false} />
            <Box s={[0.1, 0.5, 0.4]} p={[-0.65, 0.25, 0]} m={conc} cast={false} />
            <Box s={[0.1, 0.5, 0.4]} p={[0.65, 0.25, 0]} m={conc} cast={false} />
          </group>
        ))}
        <Fence from={[-6, 8.6]} to={[7, 8.8]} n={12} />
      </group>
    );
  }

  function Arena() {
    const M = useM();
    const brick = M.mat('brick', 18, 1, { color: '#dd9a7e' });
    const brickC = M.plain('#b9644a', { roughness: 1 });
    const grass = M.plain('#79953a', { roughness: 1 });
    const W = 46, D = 36;
    const pillars = useMemo(() => {
      const out = [];
      for (let x = 0; x <= W; x += 4) { out.push(mx([x - W / 2, 1.2, D / 2], [0.55, 2.4, 0.55]), mx([x - W / 2, 1.2, -D / 2], [0.55, 2.4, 0.55])); }
      for (let z = 4; z < D; z += 4) { out.push(mx([-W / 2, 1.2, z - D / 2], [0.55, 2.4, 0.55]), mx([W / 2, 1.2, z - D / 2], [0.55, 2.4, 0.55])); }
      return out;
    }, []);
    const pole = M.plain('#8a8478', { roughness: 0.9 });
    const poles = useMemo(() => Array.from({ length: 7 }, (_, i) => -W / 2 - 3.5 + 0 * i), []);
    return (
      <group>
        <Box s={[W, 0.06, D]} p={[0, 0.03, 0]} m={grass} cast={false} />
        <Box s={[W, 2.1, 0.3]} p={[0, 1.05, D / 2]} m={brick} />
        <Box s={[W, 2.1, 0.3]} p={[0, 1.05, -D / 2]} m={brick} />
        <Box s={[0.3, 2.1, D]} p={[-W / 2, 1.05, 0]} m={brick} />
        <Box s={[0.3, 2.1, D]} p={[W / 2, 1.05, 0]} m={brick} />
        <Inst geo={unitBox} mat={brickC} mats={pillars} />
        <Box s={[W + 0.2, 0.14, 0.5]} p={[0, 2.15, D / 2]} m={brickC} cast={false} />
        <Box s={[0.5, 0.14, D + 0.2]} p={[-W / 2, 2.15, 0]} m={brickC} cast={false} />
        {/* electric poles along the near wall with sagging wires */}
        {Array.from({ length: 7 }, (_, i) => {
          const z = D / 2 - i * 6.5;
          return <Cyl key={i} rt={0.09} rb={0.13} h={7.5} p={[-W / 2 - 3, 3.75, z]} m={pole} seg={8} />;
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const z0 = D / 2 - i * 6.5 - 3.25;
          return [7.3, 6.9].map((y) => <mesh key={`${i}${y}`} position={[-W / 2 - 3, y - 0.12, z0]} material={pole}><boxGeometry args={[0.02, 0.02, 6.55]} /></mesh>);
        })}
      </group>
    );
  }

  function GadhimaiEnv() {
    const M = useM();
    const ground = M.plain('#b9b66a', { roughness: 1 });
    const slabs = M.plain('#b8ae98', { roughness: 1 });
    const lineM = M.plain('#b0a690', { roughness: 1 });
    const lines = useMemo(() => { const o = []; for (let x = -14; x <= 14; x += 2) o.push(mx([x, 0.075, 1.5], [0.05, 0.01, 26])); for (let z = -10; z <= 14; z += 2) o.push(mx([0, 0.075, z], [28, 0.01, 0.05])); return o; }, []);
    const tone = useMemo(() => {
      const o = [];
      for (let i = 0; i < 70; i += 1) o.push(mx([-13 + Math.floor(rnd(i) * 13) * 2, 0.08, -9 + Math.floor(rnd(i + 90) * 12) * 2], [1.94, 0.01, 1.94], 0));
      return o;
    }, []);
    const slabsB = M.plain('#bfb59f', { roughness: 1 });
    const leaf = M.plain('#4a6a30', { roughness: 1 });
    const bark = M.plain('#6d5a48', { roughness: 1 });
    const treeline = useMemo(() => Array.from({ length: 90 }, (_, i) => {
      const a = (i / 90) * Math.PI * 2 + rnd(i) * 0.05, r = 70 + rnd(i * 3 + 1) * 6, s = 3 + rnd(i * 7 + 2) * 3.4;
      return mx([Math.cos(a) * r, s * 0.55, Math.sin(a) * r], [s * 1.25, s * 0.85, s * 1.25]);
    }), []);
    const lowTrees = useMemo(() => [[22, 6], [30, -4], [-34, -8], [-30, 8], [40, 24], [-42, 24], [12, 40], [-10, 44], [48, -12], [-48, -26]].flatMap(([x, z], i) => {
      const s = 3.2 + rnd(i * 5) * 1.8;
      return [mx([x, s * 0.55, z], [s, s * 0.8, s]), mx([x + 1.6, s * 0.45, z + 1.2], [s * 0.7, s * 0.6, s * 0.7])];
    }), []);
    return (
      <group>
        <fog attach="fog" args={['#eadcc8', 50, 150]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={ground}><circleGeometry args={[150, 48]} /></mesh>
        {/* paved plaza */}
        <Box s={[28, 0.08, 26]} p={[0, 0.03, 1.5]} m={slabs} cast={false} />
        <Box s={[7.6, 0.08, 4]} p={[0, 0.03, -1]} m={slabs} cast={false} />
        <Inst geo={unitBox} mat={lineM} mats={lines} cast={false} />
        <Inst geo={unitBox} mat={slabsB} mats={tone} cast={false} />
        {/* rusty railing around the plaza front and sides, with gaps for the paths */}
        <Fence from={[-14, 14.5]} to={[-3, 14.5]} n={8} />
        <Fence from={[3, 14.5]} to={[14, 14.5]} n={8} />
        <Fence from={[-14, 14.5]} to={[-14, -10]} n={16} />
        <Fence from={[14, 14.5]} to={[14, 6]} n={7} />
        {/* huge old trees; the leaning one on its round platform stands front-left like in the photo */}
        <BigTree p={[-9.5, 0, -6.5]} lean={-0.06} platform seed={1} s={0.95} />
        <BigTree p={[-15, 0, 1]} seed={2} s={1.1} />
        <BigTree p={[-3.5, 0, -10]} seed={3} s={1.2} />
        <BigTree p={[6, 0, -13]} seed={4} s={1.1} />
        <BigTree p={[17, 0, -9]} seed={5} s={1.0} />
        <BigTree p={[-18, 0, 10]} seed={6} s={1.1} />
        <BigTree p={[-16, 0, -12]} seed={7} s={1.2} />
        {/* cut log stump near the leaning tree */}
        <group position={[-5.0, 0.05, 8.2]}>
          <Cyl rt={0.55} rb={0.6} h={0.6} p={[0, 0.3, 0]} r={[0, 0, 0]} m={M.plain('#8a6a4c', { roughness: 1 })} seg={12} />
          <Cyl rt={0.5} rb={0.5} h={0.03} p={[0, 0.61, 0]} m={M.plain('#c9a574', { roughness: 1 })} seg={12} />
          <Cyl rt={0.25} rb={0.35} h={1.7} p={[1.1, 0.35, -0.2]} r={[0, 0, 1.45]} m={M.plain('#7a5e44', { roughness: 1 })} seg={8} />
        </group>
        {/* the neighbouring hip-roofed hall, right and behind the shrine */}
        <group position={[10.3, 0, 0.3]} rotation={[0, -0.4, 0]}><TiledHall /></group>
        {/* pond with benches, left-front */}
        <group position={[-23, 0, 19]} scale={0.55}><Pond /></group>
        {/* walled festival arena, right-rear */}
        <group position={[28, 0, -38]}><Arena /></group>
        {/* flat horizon tree-line and scattered low trees */}
        <Inst geo={unitBall} mat={leaf} mats={treeline} cast={false} />
        <Inst geo={unitBall} mat={leaf} mats={lowTrees} />
        {/* a few distant low village roofs (minimal, far) */}
        {[[52, 30], [-55, 12], [30, 58]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[5, 2.2, 3.5]} p={[0, 1.1, 0]} m={M.plain('#e2d6bf')} />
            <Box s={[5.6, 0.5, 4.1]} p={[0, 2.45, 0]} m={M.plain('#b95a38')} />
          </group>
        ))}
        {/* slim bark trunks for the lowest layer so the tree-line reads as trees */}
        <Cyl rt={0.3} rb={0.4} h={1.6} p={[60, 0.8, 4]} m={bark} seg={6} />
      </group>
    );
  }

  return { 'gadhimai-temple': { Main: GadhimaiMain, Env: GadhimaiEnv } };
}
