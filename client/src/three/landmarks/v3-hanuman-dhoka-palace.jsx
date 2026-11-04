// Hanuman Dhoka royal palace, Kathmandu: the long whitewashed Rana-era frontage with its upper veranda and tile hip roof, the
// Hanuman gate (red-cloaked Hanuman under a fringed parasol, white lions, blue-green gilded doorway, carved window above),
// Nasal Chowk behind with the five-roofed round Panchamukhi Hanuman temple, red-brick Lohan-chowk wing with carved oriels,
// and the nine-storey Basantapur tower at the south end. Front = +z. 1 unit ~ 3 m.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, GroundDisc, THREE, useMemo, useRef, useEffect, roofMat, wallMat } = K;

  const WHITE = '#ece5d3', CREAM = '#f3eee0', TIMBER = '#4a3020', BRICK = '#8b3a2b', RED = '#d03020', GOLD = '#c9a227', TEAL = '#1f5a5e';
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- instanced boxes ---------- */
  function Inst({ items, m, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    );
  }

  /* ---------- hip roof with a real ridge (long buildings) ---------- */
  function hipGeo(w, d, h) {
    const hw = w / 2, hd = d / 2, r = Math.min(hd, hw);
    const A = [-hw, 0, hd], B = [hw, 0, hd], C = [hw, 0, -hd], D = [-hw, 0, -hd];
    const R1 = [-(hw - r), h, 0], R2 = [hw - r, h, 0];
    const tris = [[A, B, R2], [A, R2, R1], [C, D, R1], [C, R1, R2], [D, A, R1], [B, C, R2]];
    const pos = [], uv = [];
    const sl = Math.hypot(hd, h);
    tris.forEach((t, ti) => t.forEach((v) => {
      pos.push(v[0], v[1], v[2]);
      const side = ti >= 4;
      uv.push((side ? v[2] : v[0]) * 0.55, (v[1] / h) * sl * 0.55);
    }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function Hip({ w, d, h, y = 0, p = [0, 0, 0], m, soffit }) {
    const M = useM();
    const geo = useMemo(() => hipGeo(w, d, h), [w, d, h]);
    return (
      <group position={[p[0], p[1] + y, p[2]]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        <Box s={[w, 0.1, d]} p={[0, -0.05, 0]} m={soffit || M.plain(TIMBER, { roughness: 0.9 })} cast={false} />
      </group>
    );
  }

  /* ---------- gilded torana arch ---------- */
  function ToranaArch({ m, hw = 0.88, hgt = 0.8, depth = 0.1 }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-hw, 0); s.lineTo(-hw, 0.1);
      s.quadraticCurveTo(-hw, hgt * 0.62, -hw * 0.45, hgt * 0.8);
      s.quadraticCurveTo(-hw * 0.2, hgt * 0.9, 0, hgt);
      s.quadraticCurveTo(hw * 0.2, hgt * 0.9, hw * 0.45, hgt * 0.8);
      s.quadraticCurveTo(hw, hgt * 0.62, hw, 0.1);
      s.lineTo(hw, 0); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    }, [hw, hgt, depth]);
    return <mesh geometry={geo} material={m} castShadow />;
  }

  /* ---------- lion (white stone) ---------- */
  function WhiteLion({ m }) {
    return (
      <group>
        <Box s={[0.3, 0.14, 0.42]} p={[0, 0.07, 0]} m={m} />
        <Box s={[0.22, 0.2, 0.32]} p={[0, 0.25, -0.03]} m={m} />
        <Box s={[0.18, 0.2, 0.1]} p={[0, 0.3, 0.14]} m={m} r={[-0.3, 0, 0]} />
        <Ball rad={0.13} p={[0, 0.44, 0.14]} m={m} />
        <Ball rad={0.24} p={[0, 0.43, 0.0]} sc={[1.1, 1.05, 0.75]} m={m} />
        <Ball rad={0.1} p={[-0.1, 0.55, 0.1]} m={m} />
        <Ball rad={0.1} p={[0.1, 0.55, 0.1]} m={m} />
        <Box s={[0.05, 0.3, 0.05]} p={[-0.1, 0.3, 0.2]} m={m} r={[-0.5, 0, 0]} />
        <Box s={[0.05, 0.3, 0.05]} p={[0.1, 0.3, 0.2]} m={m} r={[-0.5, 0, 0]} />
        <Ball rad={0.17} p={[0, 0.42, 0.06]} sc={[1, 1.05, 0.7]} m={m} />
        <Ball rad={0.07} p={[0, 0.4, 0.26]} sc={[1.1, 0.8, 1]} m={m} />
        <Box s={[0.05, 0.14, 0.18]} p={[0, 0.28, -0.25]} m={m} r={[0.5, 0, 0]} />
      </group>
    );
  }

  /* =====================================================================================================
   *  MAIN
   * ===================================================================================================== */
  const GX = 1.9;                    // gate x
  const PL = 0.25;                   // plinth height
  const S1 = 1.6, S2 = 1.3, S3 = 1.1;
  const Y1 = PL, Y2 = PL + S1, Y3 = Y2 + S2, EAVE = Y3 + S3;
  const FZ0 = 0.6, FZ1 = 3.0, FX = 8.6;
  const XL = -8.6, XR = GX + 3;      // frontage runs XL..XR; the courtyard opens to the right of XR
  const TILEC = '#8a4a30';           // orange-red clay tile

  // windows of the frontage: ground storey (4 left + 1 right of the door), second storey 8 at 1.5 spacing
  const FW1 = [], FW2 = [], FW1L = [], FW2L = [];
  [-8.0, -6.2, GX + 2.2].forEach((x) => {
    FW1.push([x, Y1 + 1.0, FZ1 + 0.03, 0.78, 1.05, 0.1]);
    FW1L.push([x, Y1 + 1.0, FZ1 + 0.075, 0.6, 0.88, 0.04]);
  });
  [-8.0, -6.5, -5.0, -3.5, -2.0, -0.5, 4.3].forEach((x) => {
    FW2.push([x, Y2 + 0.8, FZ1 + 0.03, 0.8, 1.18, 0.1]);
    FW2L.push([x, Y2 + 0.8, FZ1 + 0.075, 0.6, 0.98, 0.04]);
  });
  const LINT = [];
  for (let x = -8.4; x < 5.0; x += 0.42) { if (x > 0.6 && x < 3.3) continue; LINT.push([x, 0.25 + 1.45, FZ1 + 0.006, 0.035, 2.8, 0.012]); }
  const slats = (list, hgt) => list.flatMap((w) => [-0.3, -0.1, 0.1, 0.3].map((k) => [w[0], w[1] + k * hgt, w[2] + 0.03, w[3] * 0.98, 0.03, 0.03]));
  const SLATS = [...slats(FW1L, 0.88), ...slats(FW2L, 0.98)];
  const VPOSTS = [];
  for (let i = 0; i <= 24; i += 1) {
    const x = -8.4 + i * (13.1 / 24);
    if (x > 0.6 && x < 3.2) continue;
    VPOSTS.push([x, Y3 + 0.55, FZ1 - 0.1, 0.1, 1.1, 0.1]);
  }
  const VBAL = [];
  for (let i = 0; i <= 74; i += 1) {
    const x = -8.4 + i * (13.1 / 74);
    if (x > 0.5 && x < 3.3) continue;
    VBAL.push([x, Y3 + 0.27, FZ1 - 0.1, 0.035, 0.42, 0.035]);
  }
  const VWIN = [];
  for (let i = 0; i < 11; i += 1) {
    const x = -8.1 + i * 1.25;
    if (x > 0.4 && x < 3.5) continue;
    if (x > 4.5) continue;
    VWIN.push([x, Y3 + 0.6, FZ1 - 0.55, 0.55, 0.7, 0.06]);
  }

  /* --- the palace frontage (west wing, facing the plaza) --- */
  function Frontage() {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.88 });
    const cream = M.plain(CREAM, { roughness: 0.85 });
    const frameW = M.plain('#fbf8ef', { roughness: 0.8 });
    const frameT = M.plain(TIMBER, { roughness: 0.85 });
    const lintM = M.plain('#d6ccb4', { roughness: 0.95 });
    const wood = M.plain(TIMBER, { roughness: 0.85 });
    const lat = M.plain('#d8c7a4', { roughness: 0.8 });
    const dark = M.plain('#2b1a10', { roughness: 0.9 });
    const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2f1c', emissive: '#ff9a3c', emissiveIntensity: 0.1, roughness: 0.8 }), []);
    const tile = M.plain(TILEC, { roughness: 1 });
    const len = XR - XL, cx = (XR + XL) / 2, zc = (FZ0 + FZ1) / 2, dep = FZ1 - FZ0;
    return (
      <group>
        <Box s={[len + 0.3, PL, dep + 0.3]} p={[cx, PL / 2, zc + 0.05]} m={M.stone} />
        {/* ground + first storey, second storey */}
        <Box s={[len, S1 + S2, dep]} p={[cx, Y1 + (S1 + S2) / 2, zc]} m={white} />
        <Box s={[len + 0.08, 0.1, dep + 0.08]} p={[cx, Y2, zc]} m={cream} />
        <Box s={[len + 0.1, 0.16, dep + 0.16]} p={[cx, Y3 + 0.02, zc + 0.04]} m={wood} />
        {/* third storey: recessed wall + open wooden veranda */}
        <Box s={[len, S3, dep - 0.55]} p={[cx, Y3 + S3 / 2, zc - 0.275]} m={white} />
        <Box s={[len, 0.07, 0.07]} p={[cx, Y3 + 0.45, FZ1 - 0.1]} m={wood} />
        <Box s={[len, 0.08, 0.1]} p={[cx, Y3 + S3 - 0.03, FZ1 - 0.1]} m={wood} />
        <Inst items={VPOSTS} m={wood} />
        <Inst items={VBAL} m={wood} />
        <Inst items={VWIN} m={glow} />
        {/* windows */}
        <Inst items={FW1} m={frameT} />
        <Inst items={LINT} m={lintM} />
        <Inst items={FW1L} m={glow} />
        <Inst items={FW2} m={frameW} />
        <Inst items={FW2L} m={glow} />
        <Inst items={SLATS} m={lat} />
        {/* cornice and long hipped tile roof */}
        <Hip w={len + 1.0} d={dep + 1.1} h={0.95} y={EAVE} p={[cx, 0, zc + 0.05]} m={tile} soffit={dark} />
        {/* roof ridge cap */}
        <Box s={[len - 2.6, 0.08, 0.12]} p={[cx, EAVE + 1.08, zc + 0.05]} m={wood} cast={false} />
        {/* end of the wing */}
        <Box s={[0.25, 1.3, dep + 0.2]} p={[XR + 0.05, Y2 + 0.3, zc]} m={cream} cast={false} />
      </group>
    );
  }

  /* --- Hanuman gate: doorway, lions, steps, statue, inscription --- */
  function Gate() {
    const M = useM();
    const wood = M.plain(TIMBER, { roughness: 0.8 });
    const teal = M.plain(TEAL, { roughness: 0.6 });
    const gold = M.gold;
    const stone = M.plain('#8d8a84', { roughness: 0.9 });
    const stone2 = M.plain('#a29e96', { roughness: 0.9 });
    const wl = M.plain('#f4f0e6', { roughness: 0.75 });
    const red = M.plain(RED, { roughness: 0.85 });
    const plinth = M.plain('#7a1c16', { roughness: 0.9 });
    const orange = M.plain('#e8731f', { roughness: 0.7 });
    const parasol = M.plain('#8f1f1a', { roughness: 0.85 });
    const marig = M.plain('#f29a1e', { roughness: 0.7 });
    const blk = M.plain('#1a1512', { roughness: 0.9 });
    const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff8a1c', emissiveIntensity: 1.6 }), []);
    const brass = M.plain('#b8862b', { roughness: 0.4, metalness: 0.6 });
    const DB = 0.6; // door floor level (4 steps)
    return (
      <group>
        {/* four grey stone steps */}
        {[0, 1, 2, 3].map((k) => {
          const h = (k + 1) * 0.15, dz = (4 - k) * 0.36;
          return <Box key={k} s={[4.2, h, dz]} p={[GX + 0.15, h / 2, FZ1 + dz / 2]} m={k % 2 ? stone2 : stone} />;
        })}
        {/* doorway (1.25x): teal jambs, carved dark leaf, gilded torana */}
        <group position={[GX, DB, FZ1]} scale={[1.25, 1.25, 1]}>
          <Box s={[1.98, 1.62, 0.26]} p={[0, 0.8, 0.01]} m={wood} />
          <Box s={[0.2, 1.5, 0.34]} p={[-0.68, 0.75, 0.08]} m={teal} />
          <Box s={[0.2, 1.5, 0.34]} p={[0.68, 0.75, 0.08]} m={teal} />
          <Box s={[1.56, 0.2, 0.34]} p={[0, 1.48, 0.08]} m={teal} />
          <Box s={[0.06, 1.6, 0.36]} p={[-0.82, 0.8, 0.08]} m={gold} cast={false} />
          <Box s={[0.06, 1.6, 0.36]} p={[0.82, 0.8, 0.08]} m={gold} cast={false} />
          <Box s={[1.12, 1.36, 0.1]} p={[0, 0.68, -0.06]} m={M.plain('#2c1a0f', { roughness: 0.8 })} />
          {[-0.4, -0.2, 0, 0.2, 0.4].map((x) => <Box key={x} s={[0.025, 1.3, 0.03]} p={[x, 0.68, 0.0]} m={gold} cast={false} />)}
          <Box s={[1.1, 0.05, 0.04]} p={[0, 0.7, 0.0]} m={gold} cast={false} />
          <group position={[0, 1.58, 0.02]}><ToranaArch m={gold} hw={0.95} hgt={0.7} depth={0.12} /></group>
          <group position={[0, 1.62, 0.13]} scale={[0.78, 0.65, 1]}><ToranaArch m={teal} hw={0.95} hgt={0.7} depth={0.04} /></group>
          <Box s={[0.05, 1.4, 0.36]} p={[-0.58, 0.72, 0.08]} m={gold} cast={false} />
          <Box s={[0.05, 1.4, 0.36]} p={[0.58, 0.72, 0.08]} m={gold} cast={false} />
          <Box s={[1.2, 0.05, 0.36]} p={[0, 1.4, 0.08]} m={gold} cast={false} />
          {/* tympanum: deep-blue field with a gilded halo and three small gilded deities */}
          <Box s={[1.5, 0.5, 0.06]} p={[0, 1.78, 0.04]} m={wood} />
          <Box s={[1.4, 0.4, 0.05]} p={[0, 1.78, 0.08]} m={teal} cast={false} />
          {[-0.45, 0, 0.45].map((x) => (
            <group key={x} position={[x, 1.76, 0.12]}>
              <Box s={[0.14, 0.16, 0.05]} p={[0, 0, 0]} m={gold} />
              <Ball rad={0.065} p={[0, 0.14, 0]} m={gold} />
              <Box s={[0.26, 0.04, 0.05]} p={[0, -0.12, 0]} m={gold} />
            </group>
          ))}
          <Box s={[1.5, 0.05, 0.1]} p={[0, 2.04, 0.06]} m={gold} cast={false} />
          {[-0.38, 0, 0.38].map((x) => <Ball key={x} rad={0.07} p={[x, 2.12, 0.1]} m={gold} />)}
        </group>
        {/* carved timber oriel bank above the gate, under a stepped gilded-crest roof */}
        <Box s={[2.5, 0.14, 0.95]} p={[GX, Y3 + 0.38, FZ1 + 0.42]} m={wood} />
        <Box s={[2.3, 1.1, 0.75]} p={[GX, Y3 + 1.0, FZ1 + 0.32]} m={wood} />
        {[-0.7, 0, 0.7].map((x) => (
          <group key={x}>
            <Box s={[0.56, 0.84, 0.05]} p={[GX + x, Y3 + 1.0, FZ1 + 0.71]} m={M.plain('#caa66a', { roughness: 0.75 })} cast={false} />
            <Box s={[0.42, 0.68, 0.04]} p={[GX + x, Y3 + 1.0, FZ1 + 0.74]} m={M.plain('#3a2616', { roughness: 0.8 })} cast={false} />
            <Box s={[0.6, 0.04, 0.06]} p={[GX + x, Y3 + 1.44, FZ1 + 0.72]} m={gold} cast={false} />
            <Box s={[0.6, 0.04, 0.06]} p={[GX + x, Y3 + 0.58, FZ1 + 0.72]} m={gold} cast={false} />
            <Box s={[0.04, 0.88, 0.06]} p={[GX + x - 0.3, Y3 + 1.0, FZ1 + 0.72]} m={gold} cast={false} />
            <Box s={[0.04, 0.88, 0.06]} p={[GX + x + 0.3, Y3 + 1.0, FZ1 + 0.72]} m={gold} cast={false} />
          </group>
        ))}
        <Box s={[2.6, 0.08, 1.0]} p={[GX, Y3 + 1.6, FZ1 + 0.42]} m={gold} />
        <group position={[GX, Y3 + 1.64, FZ1 + 0.42]}>
          <Box s={[2.9, 0.12, 1.15]} p={[0, 0.06, 0]} m={M.plain('#5a3a24', { roughness: 0.9 })} />
          <Box s={[2.4, 0.12, 0.9]} p={[0, 0.34, 0]} m={M.plain('#5a3a24', { roughness: 0.9 })} />
          <Box s={[1.8, 0.12, 0.65]} p={[0, 0.6, 0]} m={M.plain('#5a3a24', { roughness: 0.9 })} />
          <Box s={[2.9, 0.04, 0.05]} p={[0, 0.13, 0.57]} m={gold} cast={false} />
          <Box s={[2.4, 0.04, 0.05]} p={[0, 0.41, 0.45]} m={gold} cast={false} />
          <Box s={[1.8, 0.04, 0.05]} p={[0, 0.67, 0.33]} m={gold} cast={false} />
          <Box s={[1.2, 0.1, 0.12]} p={[0, 0.78, 0]} m={gold} />
          {[-0.5, 0, 0.5].map((x) => <group key={x} position={[x, 0.78, 0]}><Gajur y={0.05} s={0.3} /></group>)}
          <Ball rad={0.1} p={[-1.45, 0.06, 0.58]} m={gold} />
          <Ball rad={0.1} p={[1.45, 0.06, 0.58]} m={gold} />
        </group>
        {/* lions */}
        {[-1.45, 1.45].map((dx) => (
          <group key={dx} position={[GX + dx, DB, FZ1 + 0.45]} scale={2.5}>
            <WhiteLion m={wl} />
          </group>
        ))}
        {/* tall red plinth tight to the door; seated Hanuman in a broad draped red cloak, orange face, ruby crown, marigold garlands, big red parasol with black fringe */}
        <group position={[GX - 2.3, 0, FZ1 + 0.6]} scale={1.3}>
          <Box s={[1.0, 0.1, 0.9]} p={[0, 0.05, 0]} m={stone} />
          <Box s={[0.82, 0.5, 0.74]} p={[0, 0.35, 0]} m={plinth} />
          <Box s={[0.92, 0.06, 0.82]} p={[0, 0.63, 0]} m={plinth} />
          <Cyl rt={0.24} rb={0.52} h={0.72} p={[0, 0.99, 0]} m={red} seg={16} />
          <Ball rad={0.42} p={[0, 0.7, 0.04]} sc={[1.35, 0.55, 1.05]} m={red} />
          <Box s={[0.3, 0.6, 0.12]} p={[-0.42, 0.85, 0.2]} m={red} r={[0.1, 0, 0.25]} />
          <Box s={[0.3, 0.6, 0.12]} p={[0.42, 0.85, 0.2]} m={red} r={[0.1, 0, -0.25]} />
          <Ball rad={0.27} p={[0, 1.3, 0]} sc={[1.2, 0.9, 0.9]} m={red} />
          <Ball rad={0.24} p={[0, 1.5, 0.08]} sc={[1.05, 1.05, 0.95]} m={orange} />
          <Cyl rt={0.03} rb={0.14} h={0.28} p={[0, 1.77, 0.03]} m={gold} seg={10} />
          <Cyl rt={0.0} rb={0.1} h={0.1} p={[0, 1.96, 0.03]} m={red} seg={8} />
          <mesh position={[0, 1.2, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={marig} castShadow>
            <torusGeometry args={[0.26, 0.05, 8, 20]} />
          </mesh>
          <mesh position={[0, 0.95, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={marig} castShadow>
            <torusGeometry args={[0.38, 0.04, 8, 22]} />
          </mesh>
          <Ball rad={0.03} p={[-0.07, 1.53, 0.2]} m={blk} />
          <Ball rad={0.03} p={[0.07, 1.53, 0.2]} m={blk} />
          {[[-0.48, -0.3], [0.48, -0.3], [-0.48, 0.3], [0.48, 0.3]].map(([x, z], i) => <Cyl key={i} rt={0.02} h={1.55} p={[x, 1.4, z]} m={wood} seg={6} />)}
          <Cyl rt={0.04} rb={0.62} h={0.24} p={[0, 2.3, 0]} m={parasol} seg={22} />
          <Cyl rt={0.62} rb={0.62} h={0.1} p={[0, 2.13, 0]} m={blk} seg={22} />
          <mesh position={[0, 2.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={blk}>
            <torusGeometry args={[0.62, 0.03, 6, 28]} />
          </mesh>
          <Ball rad={0.05} p={[0, 2.46, 0]} m={gold} />
        </group>
        {/* Narasimha: stepped plinth, lion-headed man with two raised arms */}
        <group position={[GX - 5.5, 0, FZ1 + 0.6]} scale={1.5}>
          <Box s={[1.15, 0.2, 0.7]} p={[0, 0.1, 0]} m={stone} />
          <Box s={[0.9, 0.5, 0.5]} p={[0, 0.45, 0]} m={stone} />
          <Box s={[0.5, 0.5, 0.28]} p={[0, 0.95, 0]} m={stone2} />
          <Ball rad={0.17} p={[0, 1.32, 0.02]} sc={[1.1, 1, 0.9]} m={stone2} />
          <Ball rad={0.22} p={[0, 1.32, -0.03]} sc={[1.25, 1.15, 0.5]} m={stone} />
          <Ball rad={0.07} p={[0, 1.27, 0.17]} sc={[1.2, 0.8, 1]} m={stone} />
          <Box s={[0.1, 0.1, 0.4]} p={[-0.27, 1.05, 0.1]} m={stone2} r={[0.4, 0, 0]} />
          <Box s={[0.1, 0.1, 0.4]} p={[0.27, 1.05, 0.1]} m={stone2} r={[0.4, 0, 0]} />
          <Box s={[0.08, 0.45, 0.08]} p={[-0.34, 1.25, 0.04]} m={stone2} r={[0, 0, 0.35]} />
          <Box s={[0.08, 0.45, 0.08]} p={[0.34, 1.25, 0.04]} m={stone2} r={[0, 0, -0.35]} />
        </group>
        {/* Pratap Malla's inscription slab on the wall, lighter than the wall so it reads */}
        <group position={[GX - 3.7, 1.7, FZ1 + 0.04]}>
          <Box s={[1.5, 0.95, 0.07]} m={M.plain('#8d8a84', { roughness: 0.95 })} />
          {[-0.32, -0.16, 0, 0.16, 0.32].map((y) => <Box key={y} s={[1.3, 0.035, 0.02]} p={[0, y, 0.045]} m={M.plain('#2e2b27')} cast={false} />)}
        </group>
        {/* lamps on the steps and a warm light at the door (shows at dusk) */}
        {[-1.3, -0.5, 0.4, 1.3, 2.1].map((x, i) => (
          <group key={i} position={[GX + x, 0.15, FZ1 + 1.4]}>
            <Cyl rt={0.05} rb={0.035} h={0.05} p={[0, 0.03, 0]} m={brass} seg={8} />
            <Ball rad={0.03} p={[0, 0.08, 0]} sc={[1, 1.5, 1]} m={lamp} />
          </group>
        ))}
        <pointLight position={[GX, 1.9, FZ1 + 1.3]} color="#ffb060" intensity={1.1} distance={9} decay={2} />
      </group>
    );
  }

  /* --- Nasal Chowk: wings, coronation platform, Panchamukhi temple, small chaitya --- */
  const OR_N = [];
  for (let s = 0; s < 2; s += 1) for (let k = 0; k < 4; k += 1) {
    const z = -7.2 + k * 1.85 + (s ? 0.3 : 0);
    if (s === 1 && Math.abs(z + 3.6) < 1.3) continue;
    OR_N.push([-6.5 + 0.22, 0.45 + (s ? 2.25 : 1.05) + 0.2, z, 0.5, 0.78, 0.95, 0]);
  }
  const ORL = OR_N.map((o) => [o[0] + 0.2, o[1], o[2], 0.04, 0.55, 0.62]);
  const BWP = [], BWD = [];
  for (let i = 0; i <= 17; i += 1) {
    const x = -6.3 + i * 0.7;
    if (x > 5.0) continue;
    BWP.push([x, 0.2 + 0.75, -7.7, 0.12, 1.5, 0.12]);       // yellow colonnade posts
    BWD.push([x, 1.85 + 0.62, -7.85, 0.1, 1.25, 0.1]);      // veranda posts upstairs
  }
  const BWBAL = [];
  for (let i = 0; i <= 60; i += 1) { const x = -6.3 + i * (11.3 / 60); BWBAL.push([x, 1.85 + 0.25, -7.85, 0.035, 0.4, 0.035]); }
  const BWG = [];
  for (let i = 0; i < 8; i += 1) BWG.push([-5.5 + i * 1.5, 0.2 + 0.85, -8.15, 0.55, 0.8, 0.06]);

  function Chowk() {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.88 });
    const wood = M.plain(TIMBER, { roughness: 0.85 });
    const dark = M.plain('#2b1a10', { roughness: 0.9 });
    const yellow = M.plain('#d9a521', { roughness: 0.7 });
    const green = M.plain('#2d6a4a', { roughness: 0.7 });
    const brickW = wallMat(M, 'red-brick', 4, 2, BRICK);
    const brickW2 = wallMat(M, 'red-brick', 2, 2, BRICK);
    const tile = M.plain(TILEC, { roughness: 1 });
    const paving = M.mat('granite', 6, 4, { color: '#ffffff' });
    const lat = M.plain('#caa66a', { roughness: 0.75 });
    const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2f1c', emissive: '#ff9a3c', emissiveIntensity: 0.1, roughness: 0.8 }), []);
    const stone = M.plain('#8d8a84', { roughness: 0.9 });
    const goldM = M.gold;
    const whiteT = M.plain('#f4efe2', { roughness: 0.8 });
    const redB = M.plain('#a02a20', { roughness: 0.8 });
    const tileD = M.plain('#4e2b1c', { roughness: 0.85 });
    const tileP = M.plain('#7a3a28', { roughness: 0.9 });
    return (
      <group>
        {/* courtyard paving */}
        <Box s={[18.0, 0.06, 8.7]} p={[2.3, 0.03, -3.7]} m={paving} cast={false} />
        <Box s={[7.0, 0.06, 2.5]} p={[8.1, 0.03, 1.85]} m={paving} cast={false} />

        {/* north wing: red brick, carved oriels, tiered eave (Lohan / Mohan chowk character) */}
        <Box s={[2.6, 0.25, 9.3]} p={[-7.8, 0.12, -3.95]} m={M.stone} />
        <Box s={[2.5, 3.6, 9.1]} p={[-7.8, 0.25 + 1.8, -3.95]} m={brickW} />
        <Box s={[0.5, 0.1, 9.1]} p={[-6.4, 1.85, -3.95]} m={tileD} />
        <Box s={[0.6, 0.1, 9.1]} p={[-6.4, 3.3, -3.95]} m={tileD} />
        <Inst items={OR_N} m={wood} cast />
        <Inst items={ORL} m={glow} />
        <group position={[-7.8, 0, -3.95]} rotation={[0, Math.PI / 2, 0]}>
          <Hip w={10.2} d={3.6} h={1.0} y={3.85} m={tile} soffit={dark} />
        </group>
        {/* the big carved window bank (stepped frame, three lattice windows) */}
        <group position={[-6.5, 2.35, -3.6]} rotation={[0, Math.PI / 2, 0]}>
          <Box s={[2.5, 1.25, 0.5]} p={[0, 0, 0.2]} m={wood} />
          {[-0.75, 0, 0.75].map((x) => <Box key={x} s={[0.62, 0.78, 0.05]} p={[x, -0.05, 0.47]} m={lat} cast={false} />)}
          {[-0.75, 0, 0.75].map((x) => <Box key={`g${x}`} s={[0.5, 0.65, 0.04]} p={[x, -0.05, 0.5]} m={glow} cast={false} />)}
          <Box s={[2.8, 0.12, 0.75]} p={[0, 0.72, 0.28]} m={tileD} />
          <Box s={[2.2, 0.1, 0.65]} p={[0, -0.7, 0.28]} m={wood} />
        </group>

        {/* east (back) wing: white, yellow colonnade + green lower window panel, upper veranda */}
        <Box s={[12.2, 0.25, 2.7]} p={[-0.8, 0.12, -9.3]} m={M.stone} />
        <Box s={[12.2, 3.0, 2.5]} p={[-0.8, 0.25 + 1.5, -9.3]} m={white} />
        <Box s={[11.7, 1.25, 0.12]} p={[-0.7, 0.2 + 0.85, -8.14]} m={green} />
        <Inst items={BWG} m={whiteT} />
        <Inst items={BWP} m={yellow} />
        <Box s={[11.7, 0.12, 0.2]} p={[-0.7, 1.85, -7.8]} m={wood} />
        <Box s={[11.7, 0.1, 0.25]} p={[-0.7, 1.58, -7.8]} m={yellow} cast={false} />
        <Inst items={BWD} m={wood} />
        <Inst items={BWBAL} m={wood} />
        <Box s={[11.7, 0.07, 0.07]} p={[-0.7, 1.85 + 0.45, -7.85]} m={wood} />
        <Box s={[11.7, 0.08, 0.14]} p={[-0.7, 3.05, -7.85]} m={wood} />
        <Hip w={13.0} d={3.8} h={0.85} y={3.28} p={[-0.8, 0, -9.0]} m={tile} soffit={dark} />

        {/* south: low brick arcade wing with tile roof (right in the courtyard photo) */}
        <Box s={[3.8, 0.2, 4.6]} p={[9.7, 0.1, -3.1]} m={M.stone} />
        <Box s={[3.4, 1.9, 4.2]} p={[9.7, 0.2 + 0.95, -3.1]} m={brickW2} />
        {[-4.4, -3.3, -2.2, -1.2].map((z) => <Box key={z} s={[0.06, 0.9, 0.7]} p={[7.98, 1.0, z]} m={dark} cast={false} />)}
        {[-4.8, -3.85, -2.75, -1.65, -0.9].map((z) => <Box key={`p${z}`} s={[0.14, 1.5, 0.14]} p={[7.9, 0.95, z]} m={wood} cast={false} />)}
        <group position={[9.7, 0, -3.1]} rotation={[0, Math.PI / 2, 0]}>
          <Hip w={4.9} d={4.4} h={1.0} y={2.1} m={tile} soffit={dark} />
        </group>

        {/* coronation platform with a low brick-red seat back */}
        <Box s={[3.2, 0.32, 2.3]} p={[-0.9, 0.2, -3.6]} m={stone} />
        <Box s={[2.5, 0.2, 1.7]} p={[-0.9, 0.46, -3.6]} m={M.plain('#9b968c', { roughness: 0.9 })} />
        <Box s={[1.0, 0.5, 0.2]} p={[-0.9, 0.82, -4.3]} m={redB} />
        <Cyl rt={0.07} h={0.4} p={[-0.9, 0.7, -3.3]} m={goldM} seg={8} />

        {/* Panchamukhi Hanuman temple: tall white base, five near-equal thin round red-brown tile roofs separated by white drums, gilded finial */}
        <group position={[3.2, 0, -1.4]}>
          <Box s={[2.3, 2.3, 2.3]} p={[0, 1.15, 0]} m={whiteT} />
          <Box s={[0.7, 1.1, 0.1]} p={[0, 0.6, 1.17]} m={dark} cast={false} />
          <Box s={[2.5, 0.12, 2.5]} p={[0, 2.36, 0]} m={whiteT} />
          {[0, 1, 2, 3, 4].map((k) => {
            const rb = 1.3 - k * 0.075, y0 = 2.42 + k * 0.95;
            return (
              <group key={k}>
                <Cyl rt={rb * 0.7} rb={rb * 0.72} h={0.6} p={[0, y0 + 0.3, 0]} m={whiteT} seg={20} />
                <Cyl rt={rb * 0.55} rb={rb} h={0.26} p={[0, y0 + 0.73, 0]} m={tileP} seg={24} />
                <Cyl rt={rb} rb={rb} h={0.05} p={[0, y0 + 0.6, 0]} m={whiteT} seg={24} />
              </group>
            );
          })}
          <Cyl rt={0.05} rb={0.1} h={0.3} p={[0, 2.42 + 4 * 0.95 + 1.1, 0]} m={goldM} seg={10} />
          <group position={[0, 2.42 + 4 * 0.95 + 1.2, 0]}><Gajur y={0.1} s={0.8} /></group>
        </group>
      </group>
    );
  }

  /* --- Basantapur: nine-storey tapering brick tower, wide carved-timber windows, broad crowning pavilion --- */
  const TX = 5.0, TZ = -6.0;
  const T_H = (i) => (i === 0 ? 1.4 : 1.15);
  const T_W = (i) => 4.6 - i * 0.2;
  const T_Y = (i) => { let y = 0.2; for (let k = 0; k < i; k += 1) y += T_H(k); return y; };
  const TWF = [], TWL = [], TWG = [];
  const FACES = [[0, 1, 0], [0, -1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]];
  for (let i = 1; i <= 8; i += 1) {
    const w = T_W(i), y = T_Y(i) + T_H(i) * 0.5;
    const offs = [-0.22 * w, 0.22 * w];
    const ww = 0.58;
    FACES.forEach(([dx, dz, ry]) => {
      const tx = dz ? 1 : 0, tz = dx ? 1 : 0;
      offs.forEach((o) => {
        const f = w / 2;
        TWF.push([TX + dx * (f + 0.05) + tx * o, y, TZ + dz * (f + 0.05) + tz * o, ww + 0.1, 0.7, 0.1, ry]);
        TWL.push([TX + dx * (f + 0.11) + tx * o, y, TZ + dz * (f + 0.11) + tz * o, ww - 0.06, 0.54, 0.04, ry]);
        TWG.push([TX + dx * (f + 0.13) + tx * o, y, TZ + dz * (f + 0.13) + tz * o, ww - 0.12, 0.025, 0.03, ry]);
      });
    });
  }
  function Tower() {
    const M = useM();
    const brick = wallMat(M, 'red-brick', 3, 2, '#b0553a');
    const wood = M.plain('#4a3020', { roughness: 0.85 });
    const dark = M.plain('#2b1a10', { roughness: 0.9 });
    const tile = M.plain(TILEC, { roughness: 1 });
    const plaster = M.plain('#e9e0cc', { roughness: 0.9 });
    const lat = M.plain('#3a2616', { roughness: 0.75 });
    const eaveM = M.plain('#5a3a28', { roughness: 1 });
    return (
      <group>
        <Box s={[5.0, 0.2, 5.0]} p={[TX, 0.1, TZ]} m={M.stone} />
        {Array.from({ length: 9 }, (_, i) => {
          const w = T_W(i), h = T_H(i), y = T_Y(i);
          return (
            <group key={i}>
              <Box s={[w, h - 0.06, w]} p={[TX, y + (h - 0.06) / 2, TZ]} m={i < 2 ? plaster : brick} />
              {i >= 2 && <Box s={[w + 0.03, 0.14, w + 0.03]} p={[TX, y + 0.07, TZ]} m={plaster} cast={false} />}
              <Box s={[w + 0.15, 0.07, w + 0.15]} p={[TX, y + h - 0.03, TZ]} m={eaveM} />
            </group>
          );
        })}
        <Inst items={TWF} m={wood} cast />
        <Inst items={TWL} m={lat} />
        <Inst items={TWG} m={M.gold} />
        <Box s={[0.9, 1.0, 0.1]} p={[TX, 0.7, TZ + T_W(0) / 2 + 0.05]} m={dark} />
        {/* crowning pavilion: small timber lantern under a single tiled roof, gilded finial */}
        <Box s={[2.3, 0.7, 2.3]} p={[TX, T_Y(9) + 0.35, TZ]} m={wood} />
        {FACES.map(([dx, dz, ry], k) => (
          <Box key={k} s={[1.5, 0.42, 0.06]} p={[TX + dx * 1.16, T_Y(9) + 0.38, TZ + dz * 1.16]} r={[0, ry, 0]} m={M.plain('#caa66a', { roughness: 0.75 })} cast={false} />
        ))}
        <group position={[TX, T_Y(9) + 0.7, TZ]}>
          <Roof w={3.3} d={3.3} h={0.8} y={0} m={tile} sag={1.3} lift={0.12} />
          <Gajur y={0.76} s={0.9} />
        </group>
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Frontage />
        <Gate />
        <Chowk />
        <Tower />
        <Frame s={[15, 11.5, 11]} p={[1.8, 5.2, -0.6]} />
      </group>
    );
  }

  /* =====================================================================================================
   *  ENV
   * ===================================================================================================== */
  function houseList() {
    const r = rng(11), a = [];
    // dense old-city rows behind the palace, getting taller towards the back to fill the sky band
    for (let row = 0; row < 4; row += 1) for (let i = 0; i < 15; i += 1) {
      const x = -52 + i * 7.2 + r() * 2 + row * 1.5, z = -22 - row * 8 - r() * 2;
      if (Math.abs(x - 8) < 8 && z > -33) continue;
      a.push({ x, z, w: 4.2 + r() * 2.4, d: 3.6 + r() * 2, h: 4 + row * 1.2 + r() * r() * 5 + (i % 4 === 0 ? 1.5 : 0), ry: (r() - 0.5) * 0.12, hue: r() });
    }
    // shops along the north side of the plaza (left)
    for (let i = 0; i < 6; i += 1) a.push({ x: -30 - r() * 3, z: 4 + i * 5.5, w: 4.5, d: 4.4, h: 5 + r() * 2.5, ry: Math.PI / 2, hue: r() });
    return a;
  }
  const HOUSES = houseList();
  function Houses() {
    const M = useM();
    const brick = wallMat(M, 'red-brick', 2, 3, '#d28a68');
    const brick2 = wallMat(M, 'red-brick', 2, 3, '#b86c4c');
    const wallB = M.plain('#d8c3a0', { roughness: 0.95 });
    const wh = M.plain('#e4dcc8', { roughness: 0.9 });
    const tile = M.mat('roof', 5, 5, { color: '#9a5a3a', roughness: 1 });
    const dark = M.plain('#3a2518', { roughness: 0.9 });
    const eaveM = M.plain('#7a4a30', { roughness: 1 });
    const winI = useMemo(() => HOUSES.filter((h) => Math.abs(h.ry) < 0.3).flatMap((h) => {
      const out = [], rows = Math.min(4, Math.max(1, Math.floor((h.h - 0.8) / 1.5)));
      for (let s = 0; s < rows; s += 1) for (let k = 0; k < 3; k += 1) {
        const lx = (k - 1) * (h.w / 3.3);
        out.push([h.x + lx * Math.cos(h.ry), 1.4 + s * 1.5, h.z + h.d / 2 + 0.03 + lx * Math.sin(h.ry), 0.62, 0.8, 0.08, h.ry]);
      }
      return out;
    }), []);
    return (
      <group>
        {HOUSES.map((h, i) => (
          <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.ry, 0]}>
            <Box s={[h.w, h.h, h.d]} p={[0, h.h / 2, 0]} m={h.hue > 0.6 ? brick : h.hue > 0.4 ? brick2 : h.hue > 0.18 ? wallB : wh} cast={false} />
            {h.h > 5 && <Box s={[h.w + 0.5, 0.1, h.d + 0.5]} p={[0, h.h * 0.55, 0]} m={eaveM} cast={false} />}
            <Hip w={h.w + 0.7} d={h.d + 0.7} h={0.9 + h.hue * 0.5} y={h.h} m={tile} soffit={dark} />
          </group>
        ))}
        <Inst items={winI} m={dark} />
      </group>
    );
  }

  function Taleju() {
    const M = useM();
    const brick = wallMat(M, 'red-brick', 2, 2, BRICK);
    const gil = roofMat(M, 'gilded-copper');
    const wood = M.plain(TIMBER, { roughness: 0.85 });
    return (
      <group position={[8, 0, -24]} scale={1.0}>
        {[0, 1, 2].map((k) => <Box key={k} s={[8 - k * 0.8, 0.45, 8 - k * 0.8]} p={[0, 0.22 + k * 0.45, 0]} m={M.stone} />)}
        {[0, 1, 2].map((k) => {
          const w = 3.8 - k * 0.55, y = 1.4 + k * 3.2;
          return (
            <group key={k}>
              <Box s={[w, 2.6, w]} p={[0, y + 1.3, 0]} m={brick} />
              <Box s={[w + 0.1, 0.12, w + 0.1]} p={[0, y + 2.55, 0]} m={wood} />
              <Roof w={w + 2.3} d={w + 2.3} h={1.0} y={y + 2.55} m={gil} sag={1.5} lift={0.3} />
            </group>
          );
        })}
        <Gajur y={1.4 + 2 * 3.2 + 3.5} s={1.8} />
      </group>
    );
  }

  function KalBhairavShrine() {
    // a small low whitewashed shrine on a plinth, left of the gate
    const M = useM();
    const wh = M.plain('#f1ecdc', { roughness: 0.85 });
    const tile = M.plain(TILEC, { roughness: 1 });
    return (
      <group position={[-13.5, 0, 6.5]}>
        <Box s={[2.0, 0.25, 2.0]} p={[0, 0.12, 0]} m={M.stone} />
        <Box s={[1.3, 1.1, 1.3]} p={[0, 0.8, 0]} m={wh} />
        <Box s={[0.4, 0.6, 0.06]} p={[0, 0.6, 0.66]} m={M.plain('#3a2518')} cast={false} />
        <Roof w={1.9} d={1.9} h={0.6} y={1.35} m={tile} sag={1.3} lift={0.1} />
        <Ball rad={0.06} p={[0, 2.0, 0]} m={M.gold} />
      </group>
    );
  }

  function WallExtension({ side }) {
    // the long palace frontage keeps running north (left) and south (right): same three window rows, veranda band and roof height
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.88 });
    const dark = M.plain('#2b1a10', { roughness: 0.9 });
    const wood = M.plain(TIMBER, { roughness: 0.85 });
    const tile = M.plain(TILEC, { roughness: 1 });
    const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2f1c', emissive: '#ff9a3c', emissiveIntensity: 0.1, roughness: 0.8 }), []);
    const len = side < 0 ? 12.5 : 6.5, x0 = side < 0 ? XL - len / 2 : XR + 7.6 + len / 2;
    const win = useMemo(() => {
      const a = [], n = Math.floor(len / 2.1);
      for (let i = 0; i < n; i += 1) { const x = x0 - len / 2 + 1.05 + i * 2.1; a.push([x, 1.25, FZ1 + 0.03, 0.74, 1.0, 0.1]); a.push([x, 2.65, FZ1 + 0.03, 0.74, 1.1, 0.1]); a.push([x, 3.6, FZ1 + 0.03, 0.6, 0.55, 0.1]); }
      return a;
    }, [len, x0]);
    const H = 4.0;
    return (
      <group>
        <Box s={[len, PL, 2.7]} p={[x0, PL / 2, 1.9]} m={M.stone} />
        <Box s={[len, H, 2.4]} p={[x0, PL + H / 2, 1.8]} m={white} />
        <Inst items={win} m={wood} />
        <Inst items={win.map((w) => [w[0], w[1], w[2] + 0.045, w[3] - 0.18, w[4] - 0.2, 0.04])} m={glow} />
        <Box s={[len, 0.07, 0.07]} p={[x0, PL + H - 0.7, FZ1 + 0.05]} m={wood} />
        <Box s={[len + 0.1, 0.12, 2.6]} p={[x0, PL + H, 1.85]} m={wood} />
        <Hip w={len + 1.0} d={3.5} h={0.95} y={PL + H + 0.06} p={[x0, 0, 1.8]} m={tile} soffit={dark} />
      </group>
    );
  }

  function Hills() {
    // low hazy-blue ring of far hills that fades into the sky, behind everything
    const M = useM();
    const far = M.plain('#8da8cc', { roughness: 1 });
    const haze = M.plain('#a6bcd6', { roughness: 1 });
    const hills = useMemo(() => {
      const r = rng(5), a = [];
      for (let i = 0; i < 16; i += 1) {
        const ang = (i / 16) * Math.PI * 2 + r() * 0.2, d = 95 + r() * 8;
        a.push([Math.sin(ang) * d, Math.cos(ang) * d, 26 + r() * 10, 5 + r() * 5, i % 2 ? haze : far]);
      }
      return a;
    }, []);
    return (
      <group>
        {hills.map(([x, z, rr, h, m], i) => <Ball key={i} rad={rr} p={[x, -2, z]} sc={[1.4, h / rr, 1]} m={m} />)}
      </group>
    );
  }

  function PlazaTemple({ p = [-26, 0, 17], sc = 0.8 }) {
    // a Newar pagoda of the Durbar Square, far off to the front-left (distant context only)
    const M = useM();
    const brick = wallMat(M, 'red-brick', 2, 2, '#9a4a38');
    const tile = M.plain(TILEC, { roughness: 1 });
    return (
      <group position={p} scale={sc}>
        {[0, 1, 2, 3].map((k) => <Box key={k} s={[7 - k * 0.7, 0.4, 7 - k * 0.7]} p={[0, 0.2 + k * 0.4, 0]} m={M.stone} />)}
        {[0, 1, 2].map((k) => (
          <group key={k}>
            <Box s={[3.2 - k * 0.5, 1.4, 3.2 - k * 0.5]} p={[0, 2.3 + k * 2.3, 0]} m={brick} />
            <Roof w={5 - k * 0.8} d={5 - k * 0.8} h={0.9} y={3.0 + k * 2.3} m={tile} sag={1.5} lift={0.25} />
          </group>
        ))}
        <Gajur y={3.0 + 2 * 2.3 + 0.8} s={1.4} />
      </group>
    );
  }

  function StoneApron() {
    const M = useM();
    const slab = M.plain('#a39a86', { roughness: 1 });
    const line = M.plain('#7d776a', { roughness: 1 });
    const brickB = M.plain('#8a6a58', { roughness: 1 });
    const items = useMemo(() => {
      const a = [];
      for (let i = 0; i <= 20; i += 1) a.push([-14 + i * 1.4, 0.026, 6.5, 0.06, 0.004, 6]);
      for (let k = 0; k <= 3; k += 1) a.push([0, 0.027, 3.5 + k * 1.5, 28, 0.004, 0.06]);
      return a;
    }, []);
    const bands = useMemo(() => [[0, 0.03, 9.3, 28, 0.006, 0.4], [-9.5, 0.03, 6.5, 0.4, 0.006, 5.6], [9.5, 0.03, 6.5, 0.4, 0.006, 5.6]], []);
    return (
      <group>
        <Box s={[28, 0.03, 6]} p={[0, 0.012, 6.5]} m={slab} cast={false} />
        <Inst items={items} m={line} />
        <Inst items={bands} m={brickB} />
      </group>
    );
  }

  function PlazaShrines() {
    const M = useM();
    const wh = M.plain('#eee8d8', { roughness: 0.85 });
    const stoneM = M.plain('#8d8a84', { roughness: 0.9 });
    return (
      <group>
        {[[-15, 13], [-23, 9], [22, 6]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[1.4, 0.3, 1.4]} p={[0, 0.15, 0]} m={stoneM} />
            <Box s={[0.9, 1.1, 0.9]} p={[0, 0.85, 0]} m={wh} />
            <Cyl rt={0.05} rb={0.42} h={0.9} p={[0, 1.85, 0]} m={wh} seg={10} />
            <Ball rad={0.07} p={[0, 2.35, 0]} m={M.gold} />
          </group>
        ))}
      </group>
    );
  }

  function Env() {
    const M = useM();
    const paving = M.plain('#968c78', { roughness: 1 });
    const earth = M.plain('#8a7860', { roughness: 1 });
    const brickPave = M.plain('#8c7e68', { roughness: 1 });
    const lampPost = M.plain('#2a2a2a', { roughness: 0.6, metalness: 0.4 });
    const lampG = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffb347', emissiveIntensity: 1.2 }), []);
    return (
      <group>
        <GroundDisc r={90} m={earth} y={-0.03} />
        <GroundDisc r={52} m={brickPave} y={-0.02} />
        <GroundDisc r={40} m={paving} y={-0.01} />
        {/* stone border strip at the foot of the palace and a few paving bands */}
        {[10, 18, 26].map((z) => <Box key={z} s={[70, 0.012, 0.18]} p={[0, 0.005, z]} m={M.plain('#9b9283')} cast={false} />)}
        <StoneApron />
        <PlazaShrines />
        <WallExtension side={-1} />
        <WallExtension side={1} />
        <KalBhairavShrine />
        <Houses />
        <Hills />
        <Taleju />
        <PlazaTemple p={[-38, 0, 0]} sc={0.9} />
        <PlazaTemple p={[-31, 0, -12]} sc={0.7} />
        <PlazaTemple p={[-20, 0, -33]} sc={1.0} />
        {/* street lamps (lit at dusk) */}
        {[[-16, 14], [14, 17], [-4, 22]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.05} rb={0.07} h={2.6} p={[0, 1.3, 0]} m={lampPost} seg={8} />
            <Ball rad={0.17} p={[0, 2.75, 0]} m={lampG} />
          </group>
        ))}
      </group>
    );
  }

  return { 'hanuman-dhoka-palace': { Main, Env } };
}
