// Palace of Fifty-five Windows, Bhaktapur Durbar Square. A long red-brick palace block under one deep, dark-eaved hipped tile
// roof, the dense 55-window timber gallery on top, the raga cornice, the Golden Gate flush with the west (left) end, the white
// shrine and lion at the wall foot, and the open brick-paved square with Chyasilin Mandap and the temples across it. Facade faces +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Spire, Frame, PagodaBody, PillarStatue, useMemo, useRef, useEffect, THREE } = K;

  const L = 16; // palace length
  const D = 3.8; // palace depth
  const HW = 5.7; // wall height to the eave (ground 0-1.9, first floor 2.1-3.98, gallery 4.2-5.6)
  const FZ = D / 2; // facade plane

  const GL = { emissive: '#6a3a28', emissiveIntensity: 0.1 };
  const BRK = '#f2bc9e';
  const TILE = { color: '#d98a5c', emissive: '#3a1a10', emissiveIntensity: 0.1 };
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const mk = (pts) => {
    const s = new THREE.Shape();
    const full = pts.concat(pts.slice().reverse().map(([x, y]) => [-x, y]));
    s.moveTo(full[0][0], full[0][1]);
    full.slice(1).forEach(([x, y]) => s.lineTo(x, y));
    return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  };
  // pointed carved crown (gallery windows)
  const crownGeo = mk([[0.5, 0], [0.5, 0.16], [0.36, 0.3], [0.24, 0.5], [0.12, 0.78], [0, 1]].slice(0, 5).concat([[0.0, 1]]));
  // stepped, cusped tympanum (large first-floor windows)
  const crownStep = mk([[0.5, 0], [0.5, 0.13], [0.42, 0.15], [0.42, 0.3], [0.33, 0.34], [0.3, 0.5], [0.2, 0.56], [0.16, 0.74], [0.08, 0.82], [0.04, 0.93], [0, 1]]);

  function hipGeometry(W, Dp, h) {
    const hw = W / 2;
    const hd = Dp / 2;
    const rx = Math.max(0.05, hw - hd);
    const T = [
      [[-hw, 0, hd], [hw, 0, hd], [rx, h, 0]], [[-hw, 0, hd], [rx, h, 0], [-rx, h, 0]],
      [[hw, 0, -hd], [-hw, 0, -hd], [-rx, h, 0]], [[hw, 0, -hd], [-rx, h, 0], [rx, h, 0]],
      [[hw, 0, hd], [hw, 0, -hd], [rx, h, 0]],
      [[-hw, 0, -hd], [-hw, 0, hd], [-rx, h, 0]],
    ];
    const pos = [];
    const uv = [];
    T.forEach((tri) => tri.forEach(([x, y, z]) => { pos.push(x, y, z); uv.push(x / 2.2, (z + y * 3) / 2.2); }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  /** Many copies of one geometry in a single draw call. items: [x,y,z, sx,sy,sz, rx,ry,rz] */
  function Inst({ items, geo = unitBox, m, shadow = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.rotation.set(it[6] || 0, it[7] || 0, it[8] || 0);
        o.scale.set(it[3] ?? 1, it[4] ?? 1, it[5] ?? 1);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, m, items.length]} frustumCulled={false} castShadow={shadow} receiveShadow />;
  }

  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const rnd = (i) => ((i * 9301 + 49297) % 233280) / 233280;

  /* ------------------------------------------------------------------ palace */
  function Palace() {
    const M = useM();
    const dark = M.plain('#2d211a', { roughness: 0.8 });
    const lat = M.plain('#8a6540', { roughness: 0.75 });
    const black = M.plain('#1c120b');
    const carve = M.plain('#9a7248', { roughness: 0.7 });
    const outline = M.plain('#7a5a3a', { roughness: 0.75 });
    const panelM = M.plain('#5a3d26', { roughness: 0.75 });
    const barM = M.plain('#a07848', { roughness: 0.7 });
    const leafM = M.plain('#6b4a2e', { roughness: 0.85 });
    const rafM = M.plain('#4a2c18', { roughness: 0.9 });
    const brick = M.mat('brick', 10, 3.2, { color: BRK, ...GL });
    const brickB = M.plain('#b87258', { roughness: 0.95 });
    const brickP = M.plain('#e6bea6', { roughness: 0.95 });
    const brickPl = M.mat('brick', 10, 0.4, { color: '#d88a6e', ...GL });
    const tile = M.mat('roof', 10, 5, TILE);
    const courseM = M.plain('#7a3220', { roughness: 0.9 });
    const ridgeM = M.plain('#3a2216', { roughness: 0.9 });
    const soffit = M.plain('#3c2415', { roughness: 0.9 });
    const stone = M.stone;

    const W2 = L + 2.0;
    const D2 = D + 2.0;
    const roofH = 1.45;
    const rg = useMemo(() => hipGeometry(W2, D2, roofH), [W2, D2]);

    const bays = [-6.1, -3.2, -0.1, 3.1, 5.9];
    const smalls = [-7.55, -4.65, -1.65, 1.5, 4.5, 7.2];
    const gx = useMemo(() => range(55, (k) => (k - 27) * 0.295), []);
    const gz = useMemo(() => range(15, (k) => (k - 7) * 0.29), []);
    const GF = FZ + 0.33;

    // mottled brick patches on the facade
    const patchL = useMemo(() => range(22, (i) => [(rnd(i) - 0.5) * (L - 1), 0.5 + rnd(i + 90) * 3.3, FZ + 0.012, 0.4 + rnd(i + 40) * 0.8, 0.2 + rnd(i + 7) * 0.35, 0.02]), []);
    const patchD = useMemo(() => range(58, (i) => [(rnd(i + 300) - 0.5) * (L - 1), 0.4 + rnd(i + 17) * 3.4, FZ + 0.013, 0.4 + rnd(i + 71) * 1.4, 0.2 + rnd(i + 3) * 0.55, 0.02]), []);

    // ground floor: tall dark doors alternating with wide low lattice windows
    const doorFrames = useMemo(() => bays.map((x) => [x, 1.0, FZ + 0.04, 0.66, 1.52, 0.1]), []);
    const doorLeaves = useMemo(() => bays.map((x) => [x, 0.98, FZ + 0.1, 0.5, 1.4, 0.05]), []);
    const doorLintel = useMemo(() => bays.map((x) => [x, 1.8, FZ + 0.1, 0.9, 0.09, 0.2]), []);
    const doorMull = useMemo(() => bays.flatMap((x) => [[x, 0.98, FZ + 0.14, 0.03, 1.4, 0.02], [x, 0.55, FZ + 0.14, 0.5, 0.035, 0.02], [x, 1.2, FZ + 0.14, 0.5, 0.035, 0.02]]), []);
    const gwFrames = useMemo(() => smalls.map((x) => [x, 1.15, FZ + 0.04, 0.66, 0.36, 0.1]), []);
    const gwLat = useMemo(() => smalls.map((x) => [x, 1.15, FZ + 0.09, 0.54, 0.26, 0.04]), []);
    const gwBars = useMemo(() => smalls.flatMap((x) => range(7, (k) => [x - 0.24 + k * 0.08, 1.15, FZ + 0.115, 0.016, 0.26, 0.02]).concat(range(2, (k) => [x, 1.09 + k * 0.1, FZ + 0.115, 0.54, 0.016, 0.02]))), []);
    const gwSill = useMemo(() => smalls.map((x) => [x, 0.94, FZ + 0.08, 0.78, 0.05, 0.16]), []);

    // first floor: large crowned windows over the doors, small lattice windows between
    const FY = 3.05;
    const lgOut = useMemo(() => bays.map((x) => [x, FY, FZ + 0.025, 0.9, 1.0, 0.08]), []);
    const lgFrame = useMemo(() => bays.map((x) => [x, FY, FZ + 0.05, 0.75, 0.85, 0.1]), []);
    const lgLat = useMemo(() => bays.map((x) => [x, FY, FZ + 0.11, 0.6, 0.72, 0.04]), []);
    const lgBars = useMemo(() => bays.flatMap((x) => range(7, (k) => [x - 0.24 + k * 0.08, FY, FZ + 0.14, 0.02, 0.72, 0.02]).concat(range(5, (k) => [x, FY - 0.28 + k * 0.14, FZ + 0.14, 0.6, 0.02, 0.02]))), []);
    const lgCrownO = useMemo(() => bays.map((x) => [x, FY + 0.43, FZ + 0.0, 1.28, 0.56, 0.12]), []);
    const lgCrown = useMemo(() => bays.map((x) => [x, FY + 0.45, FZ + 0.12, 1.1, 0.5, 0.05]), []);
    const lgCrownIn = useMemo(() => bays.map((x) => [x, FY + 0.5, FZ + 0.16, 0.7, 0.3, 0.03]), []);
    const lgSill = useMemo(() => bays.map((x) => [x, FY - 0.52, FZ + 0.12, 0.92, 0.06, 0.26]), []);
    const smFrame = useMemo(() => smalls.map((x) => [x, FY, FZ + 0.03, 0.44, 0.52, 0.08]), []);
    const smLat = useMemo(() => smalls.map((x) => [x, FY, FZ + 0.08, 0.34, 0.42, 0.04]), []);
    const smBars = useMemo(() => smalls.flatMap((x) => range(5, (k) => [x - 0.12 + k * 0.06, FY, FZ + 0.105, 0.016, 0.42, 0.02]).concat(range(3, (k) => [x, FY - 0.14 + k * 0.14, FZ + 0.105, 0.34, 0.016, 0.02]))), []);
    const smCrown = useMemo(() => smalls.map((x) => [x, FY + 0.38, FZ + 0.0, 0.56, 0.3, 0.1]), []);

    // raga cornice (147 carvings) between ground and first floors
    const raga = useMemo(() => range(147, (k) => [(k - 73) * 0.11, 2.0, FZ + 0.4, 0.07, 0.1, 0.05]), []);
    const ragaBr = useMemo(() => range(44, (k) => [(k - 21.5) * 0.37, 1.8, FZ + 0.12, 0.08, 0.22, 0.24, 0.5, 0, 0]), []);

    // the 55-window gallery: 0.88 tall panels, 0.44 tall pointed crowns
    const panels = useMemo(() => gx.map((x) => [x, 4.72, GF, 0.25, 0.88, 0.05]), [gx, GF]);
    const panelBars = useMemo(() => gx.flatMap((x) => [[x, 4.45, GF + 0.03, 0.25, 0.022, 0.015], [x, 4.72, GF + 0.03, 0.25, 0.022, 0.015], [x, 4.99, GF + 0.03, 0.25, 0.022, 0.015], [x, 4.72, GF + 0.03, 0.026, 0.88, 0.015]]), [gx, GF]);
    const panelCrown = useMemo(() => gx.map((x) => [x, 5.16, GF - 0.03, 0.27, 0.44, 0.08]), [gx, GF]);
    const panelCrownIn = useMemo(() => gx.map((x) => [x, 5.2, GF + 0.05, 0.15, 0.28, 0.03]), [gx, GF]);
    const sidePanels = useMemo(() => [1, -1].flatMap((sd) => gz.map((z) => [sd * (L / 2 + 0.33), 4.72, z, 0.25, 0.88, 0.05, 0, Math.PI / 2, 0])), [gz]);
    const sideBars = useMemo(() => [1, -1].flatMap((sd) => gz.flatMap((z) => [4.45, 4.72, 4.99].map((y) => [sd * (L / 2 + 0.36), y, z, 0.25, 0.022, 0.015, 0, Math.PI / 2, 0]))), [gz]);
    const sideCrown = useMemo(() => [1, -1].flatMap((sd) => gz.map((z) => [sd * (L / 2 + 0.3), 5.16, z, 0.27, 0.44, 0.08, 0, sd * Math.PI / 2, 0])), [gz]);
    const gBrackets = useMemo(() => range(44, (k) => [(k - 21.5) * 0.375, 3.88, FZ + 0.16, 0.1, 0.36, 0.4, 0.6, 0, 0]), []);
    const gBrackets2 = useMemo(() => range(44, (k) => [(k - 21.5) * 0.375, 3.78, FZ + 0.06, 0.08, 0.26, 0.22, 0.6, 0, 0]), []);
    const cornFin = useMemo(() => range(56, (k) => [(k - 27.5) * 0.295, 5.72, FZ + 0.44, 0.1, 0.14, 0.06]), []);
    // eave
    const rafters = useMemo(() => [1, -1].flatMap((sd) => range(50, (k) => [(k - 24.5) * 0.34, HW + 0.05, sd * (D / 2 + 0.7), 0.09, 0.15, 1.3])).concat(
      [1, -1].flatMap((sd) => range(12, (k) => [sd * (L / 2 + 0.7), HW + 0.05, (k - 5.5) * 0.34, 1.3, 0.15, 0.09]))), []);
    const struts = useMemo(() => [1, -1].flatMap((sd) => range(21, (k) => [(k - 10) * 0.78, HW - 0.15, sd * (FZ + 0.62), 0.1, 0.1, 1.0, -sd * 0.75, 0, 0])), []);
    // tile courses
    const courses = useMemo(() => {
      const hd = D2 / 2;
      const hw = W2 / 2;
      const ang = Math.atan(roofH / hd);
      const out = [];
      range(14, (i) => {
        const t = (i + 0.5) / 14;
        const hx = hw - t * hd;
        [1, -1].forEach((sd) => out.push([0, HW + 0.27 + roofH * t + 0.02, sd * hd * (1 - t), hx * 2 * 0.985, 0.035, 0.06, sd * ang, 0, 0]));
      });
      return out;
    }, [W2, D2]);

    return (
      <group>
        {/* body + brick plinth */}
        <Box s={[L, HW, D]} p={[0, HW / 2, 0]} m={brick} />
        <Box s={[L + 0.24, 0.2, D + 0.24]} p={[0, 0.1, 0]} m={brickPl} />
        <Box s={[L + 0.3, 0.04, D + 0.3]} p={[0, 0.21, 0]} m={stone} />
        <Inst items={patchL} m={brickP} />
        <Inst items={patchD} m={brickB} />
        {/* ground floor */}
        <Inst items={doorFrames} m={dark} />
        <Inst items={doorLeaves} m={leafM} />
        <Inst items={doorMull} m={dark} />
        <Inst items={doorLintel} m={dark} />
        <Inst items={gwFrames} m={dark} />
        <Inst items={gwLat} m={black} />
        <Inst items={gwBars} m={lat} />
        <Inst items={gwSill} m={dark} />
        {/* raga cornice between ground and first floors */}
        <Box s={[L + 0.3, 0.18, 0.5]} p={[0, 2.0, FZ + 0.15]} m={dark} />
        <Box s={[L + 0.1, 0.07, 0.34]} p={[0, 1.88, FZ + 0.08]} m={dark} />
        <Inst items={raga} m={carve} />
        <Inst items={ragaBr} m={dark} />
        <Box s={[0.5, 0.18, D + 0.3]} p={[L / 2 + 0.1, 2.0, 0]} m={dark} />
        <Box s={[0.5, 0.18, D + 0.3]} p={[-L / 2 - 0.1, 2.0, 0]} m={dark} />
        <Box s={[L + 0.3, 0.18, 0.5]} p={[0, 2.0, -FZ - 0.15]} m={dark} />
        {/* first floor */}
        <Inst items={lgOut} m={outline} />
        <Inst items={lgFrame} m={dark} />
        <Inst items={lgLat} m={black} />
        <Inst items={lgBars} m={lat} />
        <Inst items={lgCrownO} geo={crownStep} m={outline} />
        <Inst items={lgCrown} geo={crownStep} m={dark} />
        <Inst items={lgCrownIn} geo={crownStep} m={carve} />
        <Inst items={lgSill} m={dark} />
        <Inst items={smFrame} m={dark} />
        <Inst items={smLat} m={black} />
        <Inst items={smBars} m={lat} />
        <Inst items={smCrown} geo={crownStep} m={dark} />
        {/* stepped brackets and the projecting gallery */}
        <Box s={[L + 0.3, 0.1, D + 0.3]} p={[0, 3.98, 0]} m={dark} />
        <Box s={[L + 0.55, 0.1, D + 0.55]} p={[0, 4.08, 0]} m={dark} />
        <Box s={[L + 0.8, 0.1, D + 0.8]} p={[0, 4.18, 0]} m={dark} />
        <Inst items={gBrackets} m={dark} />
        <Inst items={gBrackets2} m={dark} />
        <Box s={[L + 0.6, 1.4, D + 0.6]} p={[0, 4.9, 0]} m={dark} />
        <Inst items={panels} m={panelM} />
        <Inst items={panelBars} m={barM} />
        <Inst items={panelCrown} geo={crownGeo} m={carve} />
        <Inst items={panelCrownIn} geo={crownGeo} m={dark} />
        <Inst items={sidePanels} m={panelM} />
        <Inst items={sideBars} m={barM} />
        <Inst items={sideCrown} geo={crownGeo} m={carve} />
        <Box s={[L + 0.9, 0.12, D + 0.9]} p={[0, 5.64, 0]} m={dark} />
        <Box s={[L + 0.95, 0.06, 0.1]} p={[0, 5.74, FZ + 0.45]} m={carve} />
        <Inst items={cornFin} m={carve} />
        {/* roof: deep dark eave, exposed rafters and struts, dark ridge, tile courses */}
        <Box s={[W2, 0.14, D2]} p={[0, HW + 0.2, 0]} m={soffit} />
        <mesh geometry={rg} material={tile} position={[0, HW + 0.27, 0]} castShadow receiveShadow />
        <Inst items={courses} m={courseM} />
        <Box s={[W2 - D2 + 0.3, 0.14, 0.24]} p={[0, HW + 0.27 + roofH + 0.05, 0]} m={ridgeM} />
        <Box s={[W2, 0.2, 0.08]} p={[0, HW + 0.3, D2 / 2]} m={ridgeM} />
        <Box s={[W2, 0.2, 0.08]} p={[0, HW + 0.3, -D2 / 2]} m={ridgeM} />
        <Box s={[0.08, 0.2, D2]} p={[W2 / 2, HW + 0.3, 0]} m={ridgeM} />
        <Box s={[0.08, 0.2, D2]} p={[-W2 / 2, HW + 0.3, 0]} m={ridgeM} />
        <Inst items={rafters} m={rafM} />
        <Inst items={struts} m={rafM} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ Golden Gate (flush with the west end) */
  function GoldenGate() {
    const M = useM();
    const brick = M.mat('brick', 3, 2.4, { color: BRK, ...GL });
    const dark = M.plain('#2d211a', { roughness: 0.8 });
    const red = M.plain('#b3261e', { roughness: 0.7 });
    const deep = M.plain('#8b2a1c', { roughness: 0.6 });
    const GW = 3.4;
    const GH = 3.0;
    const GD = 3.4;
    const gz0 = FZ - GD / 2; // front plane flush with the palace facade
    return (
      <group position={[-L / 2 - GW / 2 - 0.1, 0, gz0]}>
        <Box s={[GW, GH, GD]} p={[0, GH / 2, 0]} m={brick} />
        <Box s={[GW + 0.14, 0.12, GD + 0.14]} p={[0, 0.06, 0]} m={M.stone} />
        <Box s={[GW + 0.1, 0.12, GD + 0.1]} p={[0, GH + 0.02, 0]} m={dark} />
        {/* gilt doorway, torana and repousse tympanum on the front plane */}
        <group position={[0, 0, GD / 2]}>
          <Box s={[1.5, 1.95, 0.08]} p={[0, 1.0, 0.02]} m={dark} />
          <Box s={[0.18, 1.9, 0.18]} p={[-0.7, 0.98, 0.07]} m={M.gold} />
          <Box s={[0.18, 1.9, 0.18]} p={[0.7, 0.98, 0.07]} m={M.gold} />
          <Box s={[1.58, 0.18, 0.2]} p={[0, 1.98, 0.08]} m={M.gold} />
          <Box s={[1.1, 1.7, 0.07]} p={[0, 0.88, 0.04]} m={deep} />
          <Box s={[0.03, 1.7, 0.05]} p={[0, 0.88, 0.09]} m={M.gold} />
          {[-0.28, 0.28].map((x) => range(6, (k) => <Box key={`${x}${k}`} s={[0.42, 0.22, 0.03]} p={[x, 0.3 + k * 0.27, 0.09]} m={M.gold} />))}
          <mesh position={[0, 2.06, 0.02]} scale={[2.0, 0.85, 0.14]} material={red} castShadow><primitive object={crownStep} attach="geometry" /></mesh>
          <mesh position={[0, 2.08, 0.1]} scale={[1.8, 0.78, 0.07]} material={M.gold} castShadow><primitive object={crownStep} attach="geometry" /></mesh>
          <mesh position={[0, 2.14, 0.16]} scale={[1.2, 0.52, 0.04]} material={deep}><primitive object={crownStep} attach="geometry" /></mesh>
          <Ball rad={0.17} p={[0, 2.5, 0.2]} m={M.gold} />
          {[-0.62, 0.62].map((x) => <Box key={x} s={[0.22, 0.5, 0.05]} p={[x, 2.45, 0.1]} m={M.gold} />)}
        </group>
        {/* two-step red-edged tiled eave with gilt finials */}
        <Roof w={GW + 0.9} d={GD + 0.9} h={0.55} y={GH + 0.06} m={M.mat('roof', 3, 3, TILE)} sag={1.25} lift={0.1} fascia={false} />
        <Roof w={GW + 0.3} d={GD + 0.3} h={0.4} y={GH + 0.6} m={M.mat('roof', 2, 2, TILE)} sag={1.2} lift={0.06} fascia={false} />
        <Box s={[GW + 0.95, 0.14, 0.12]} p={[0, GH + 0.1, (GD + 0.9) / 2]} m={red} />
        <Box s={[GW + 0.95, 0.14, 0.12]} p={[0, GH + 0.1, -(GD + 0.9) / 2]} m={red} />
        <Box s={[0.12, 0.14, GD + 0.95]} p={[(GW + 0.9) / 2, GH + 0.1, 0]} m={red} />
        <Box s={[0.12, 0.14, GD + 0.95]} p={[-(GW + 0.9) / 2, GH + 0.1, 0]} m={red} />
        <Gajur y={GH + 1.0} s={0.8} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ small shrines at the wall foot */
  function Shrine({ p, s = 1, wall = '#f6f2ea', dome = '#6d9a84' }) {
    const M = useM();
    const white = M.plain(wall, { roughness: 0.85 });
    const green = M.plain(dome, { roughness: 0.65, metalness: 0.25 });
    return (
      <group position={p} scale={s}>
        <Box s={[0.95, 0.2, 0.95]} p={[0, 0.1, 0]} m={M.mat('brick', 1, 1, { color: '#d88a6e', ...GL })} />
        <Box s={[0.7, 0.62, 0.7]} p={[0, 0.51, 0]} m={white} />
        <Box s={[0.82, 0.07, 0.82]} p={[0, 0.85, 0]} m={white} />
        <Box s={[0.28, 0.3, 0.03]} p={[0, 0.5, 0.36]} m={M.plain('#2a1d14')} />
        <Cyl rt={0.3} rb={0.34} h={0.14} p={[0, 0.96, 0]} m={white} seg={16} />
        <Ball rad={0.34} sc={[1, 0.85, 1]} p={[0, 1.1, 0]} m={green} />
        <Cyl rt={0.07} rb={0.1} h={0.12} p={[0, 1.43, 0]} m={green} seg={10} />
        <Cyl rt={0.015} rb={0.04} h={0.28} p={[0, 1.6, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  function Person({ p, c, s = 1, r = 0 }) {
    const M = useM();
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Cyl rt={0.06} rb={0.07} h={0.3} p={[0, 0.15, 0]} m={M.plain('#3b3a46')} seg={8} />
        <Cyl rt={0.075} rb={0.07} h={0.2} p={[0, 0.4, 0]} m={M.plain(c)} seg={8} />
        <Ball rad={0.055} p={[0, 0.58, 0]} m={M.plain('#c99a76')} />
      </group>
    );
  }

  function Main() {
    const M = useM();
    const people = [[[2.4, 0, 4.8], '#d9532a', 1.5, 0.5], [[2.75, 0, 4.7], '#2f5fb5', 1.4, 0.3], [[3.1, 0, 4.9], '#e8d9a0', 1.3, 0], [[3.45, 0, 4.7], '#c0392b', 1.5, 0.2],
      [[-4.6, 0, 4.4], '#2e8b57', 1.5, 0], [[-4.2, 0, 4.5], '#e5a2b8', 1.2, 0.4], [[0.8, 0, 6.0], '#4a7fb5', 1.5, 2]];
    return (
      <group>
        <Palace />
        <GoldenGate />
        <Shrine p={[6.9, 0, FZ + 1.3]} s={1.4} />
        <Shrine p={[-6.7, 0, FZ + 2.0]} s={1.0} wall="#d6a088" dome="#9aa890" />
        <group position={[-2.3, 0.0, FZ + 0.7]} scale={2.3}>
          <Box s={[0.34, 0.1, 0.5]} p={[0, 0.05, 0]} m={M.stone} />
          <group position={[0, 0.08, 0]}><Lion m={M.stone} /></group>
        </group>
        {people.map(([p, c, s, r], i) => <Person key={i} p={p} c={c} s={s} r={r} />)}
        <Frame s={[18.4, 6.8, 4.6]} p={[-0.6, 3.4, 0.9]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ environment */
  /** Street wall of Newar brick houses: window grids, dark timber trim, varied tiled roofs. */
  function HouseRows({ list }) {
    const M = useM();
    const dark = M.plain('#2d211a');
    const wood = M.plain('#4a3322');
    const lat = M.plain('#1c120b');
    const cols = ['#c8a088', '#d9b89c', '#cfa07a', '#e4d2bc', '#b9937c', '#d4aa88'];
    const mats = cols.map((c) => M.mat('brick', 2, 2, { color: c, ...GL }));
    const roofs = ['#9a6048', '#a86a48', '#8a5a44', '#b27050'].map((c) => M.mat('roof', 2, 2, { color: c, emissive: '#3a1a10', emissiveIntensity: 0.1 }));
    const SH = 1.3;
    const win = useMemo(() => {
      const out = [];
      const bar = [];
      list.forEach((h) => {
        const c = Math.cos(h.r);
        const s = Math.sin(h.r);
        const nWin = Math.max(2, Math.round(h.w / 1.1));
        for (let k = 0; k < h.st; k++) {
          for (let j = 0; j < nWin; j++) {
            const lx = (j - (nWin - 1) / 2) * (h.w / nWin);
            const ly = k * SH + (k === 0 ? 0.66 : 0.72);
            const lz = h.d / 2 + 0.02;
            const wx = h.p[0] + lx * c + lz * s;
            const wz = h.p[2] - lx * s + lz * c;
            const big = k > 0;
            out.push([wx, ly, wz, big ? 0.46 : 0.4, big ? 0.62 : 0.68, 0.06, 0, h.r, 0]);
            const lz2 = lz + 0.02;
            bar.push([h.p[0] + lx * c + lz2 * s, ly, h.p[2] - lx * s + lz2 * c, 0.28, big ? 0.46 : 0.52, 0.03, 0, h.r, 0]);
          }
        }
      });
      return { out, bar };
    }, [list]);
    return (
      <group>
        {list.map((h, i) => {
          const ht = h.st * SH;
          return (
            <group key={i} position={h.p} rotation={[0, h.r, 0]}>
              <Box s={[h.w, ht, h.d]} p={[0, ht / 2, 0]} m={mats[(i * 5 + h.st) % 6]} />
              {h.st > 1 && <Box s={[h.w + 0.1, 0.08, h.d + 0.1]} p={[0, SH, 0]} m={dark} cast={false} />}
              {h.st > 2 && <Box s={[h.w + 0.1, 0.08, h.d + 0.1]} p={[0, SH * 2, 0]} m={dark} cast={false} />}
              <Box s={[h.w + 0.18, 0.09, h.d + 0.18]} p={[0, ht, 0]} m={wood} cast={false} />
              <Roof w={h.w + 0.7} d={h.d + 0.7} h={0.5 + ((i * 3) % 4) * 0.12} y={ht} m={roofs[(i * 7 + 1) % 4]} sag={1.05} lift={0.04} />
            </group>
          );
        })}
        <Inst items={win.out} m={dark} />
        <Inst items={win.bar} m={lat} />
      </group>
    );
  }

  /** Stepped brick-and-stone plinth platform for a temple. */
  function Platform({ w, d, n = 3 }) {
    const M = useM();
    const brick = M.mat('brick', 3, 1, { color: '#d88a6e', ...GL });
    return (
      <group>
        {range(n, (k) => {
          const sc = 1 - k * 0.1;
          return <Box key={k} s={[w * sc, 0.2, d * sc]} p={[0, 0.1 + k * 0.2, 0]} m={k % 2 === 0 ? brick : M.stone} />;
        })}
      </group>
    );
  }

  /** Chyasilin Mandap: octagonal pavilion, brick base, open timber upper floor with eight posts, tiled roof, gilt finial. */
  function Chyasilin({ p, s = 1 }) {
    const M = useM();
    const brick = M.mat('brick', 4, 1, { color: '#dc8a6e', ...GL });
    const dark = M.plain('#2d211a');
    const wood = M.plain('#4a3322');
    const rail = M.plain('#6b4a2e');
    const tile = M.mat('roof', 4, 2, TILE);
    const oct = Math.PI / 8;
    return (
      <group position={p} scale={s}>
        <mesh position={[0, 0.1, 0]} rotation={[0, oct, 0]} material={M.stone} castShadow receiveShadow><cylinderGeometry args={[1.75, 1.85, 0.2, 8]} /></mesh>
        <mesh position={[0, 0.34, 0]} rotation={[0, oct, 0]} material={brick} castShadow receiveShadow><cylinderGeometry args={[1.62, 1.7, 0.28, 8]} /></mesh>
        <mesh position={[0, 0.8, 0]} rotation={[0, oct, 0]} material={brick} castShadow receiveShadow><cylinderGeometry args={[1.3, 1.36, 0.7, 8]} /></mesh>
        {range(8, (k) => {
          const a = (k / 8) * Math.PI * 2;
          return (
            <group key={k} position={[Math.sin(a) * 1.22, 0.7, Math.cos(a) * 1.22]} rotation={[0, a, 0]}>
              <Box s={[0.36, 0.42, 0.06]} p={[0, 0, 0.08]} m={dark} cast={false} />
              <Box s={[0.26, 0.32, 0.05]} p={[0, 0, 0.12]} m={wood} cast={false} />
            </group>
          );
        })}
        <mesh position={[0, 1.17, 0]} rotation={[0, oct, 0]} material={dark}><cylinderGeometry args={[1.42, 1.42, 0.12, 8]} /></mesh>
        <mesh position={[0, 1.65, 0]} rotation={[0, oct, 0]} material={dark}><cylinderGeometry args={[0.6, 0.6, 0.84, 8]} /></mesh>
        {range(8, (k) => {
          const pa = (k / 8) * Math.PI * 2 + oct;
          const a = pa + oct;
          return (
            <group key={k}>
              <Box s={[0.1, 0.9, 0.1]} p={[Math.sin(pa) * 1.22, 1.68, Math.cos(pa) * 1.22]} m={wood} cast={false} />
              <group position={[Math.sin(a) * 1.18, 1.43, Math.cos(a) * 1.18]} rotation={[0, a, 0]}>
                <Box s={[0.62, 0.34, 0.05]} p={[0, 0, 0]} m={rail} cast={false} />
              </group>
            </group>
          );
        })}
        <mesh position={[0, 2.17, 0]} rotation={[0, oct, 0]} material={tile} castShadow><cylinderGeometry args={[1.05, 1.9, 0.2, 8]} /></mesh>
        <mesh position={[0, 2.6, 0]} rotation={[0, oct, 0]} material={tile} castShadow><cylinderGeometry args={[0.06, 1.35, 0.68, 8]} /></mesh>
        <Gajur y={2.9} s={0.8} />
      </group>
    );
  }

  /** Stone shikhara temple: stepped plinth, small sanctum, tall curved spire. */
  function Shikhara({ p, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Box s={[2.5, 0.14, 2.5]} p={[0, 0.07, 0]} m={M.stone} />
        <Box s={[2.1, 0.14, 2.1]} p={[0, 0.21, 0]} m={M.stone} />
        <Box s={[1.7, 0.14, 1.7]} p={[0, 0.35, 0]} m={M.stone} />
        <Box s={[1.1, 0.9, 1.1]} p={[0, 0.87, 0]} m={M.stone} />
        <Box s={[0.4, 0.55, 0.06]} p={[0, 0.7, 0.57]} m={M.dark} cast={false} />
        <Spire r0={0.62} h={2.3} y={1.32} m={M.stone} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const paving = M.mat('herring', 30, 22, { color: '#ecdcc8', emissive: '#7a6a58', emissiveIntensity: 0.2 });
    const strip = M.plain('#7e7a72', { roughness: 0.95 });
    const brickStrip = M.plain('#b87050', { roughness: 0.95 });
    const ground = M.plain('#9a9082', { roughness: 1, emissive: '#3a3630', emissiveIntensity: 0.2 });
    const edge = M.plain('#b09480', { roughness: 1 });
    const haze = M.plain('#b8b2a8', { roughness: 1, emissive: '#6a665e', emissiveIntensity: 0.4 });
    const houses = useMemo(() => {
      const out = [];
      const ht = (i, a = 2, b = 2) => a + ((i * 7 + b) % 2);
      // east of the palace: dense 3-4 storey houses, the square narrowing toward Tachapal
      range(9, (i) => out.push({ p: [10.6 + i * 3.6, 0, -0.4 + i * 0.55], r: 0, w: 3.4, d: 2.6, st: 3 + (i % 3 === 1 ? 1 : 0) }));
      range(3, (i) => out.push({ p: [14 + i * 3.6, 0, -4.2 - i * 0.3], r: 0, w: 3.4, d: 2.6, st: 3 }));
      // west beyond the Golden Gate wall
      range(4, (i) => out.push({ p: [-19 - i * 3.6, 0, -0.6], r: 0, w: 3.4, d: 2.6, st: 3 - (i % 2) }));
      // south street wall, facing north onto the square
      // east side street wall
      // west side street wall
      range(7, (i) => out.push({ p: [-30.5, 0, 12 + i * 3.6], r: Math.PI / 2, w: 3.4, d: 2.7, st: ht(i, 2, i + 1) + (i % 5 === 2 ? 1 : 0) }));
      // behind the palace
      range(8, (i) => out.push({ p: [-26 + i * 7.4, 0, -12], r: 0, w: 3.6, d: 2.7, st: 2 + (i % 2) }));
      return out;
    }, []);
    const hillsRing = useMemo(() => range(14, (i) => { const a = (i / 14) * Math.PI * 2; return { x: Math.sin(a) * 125, z: Math.cos(a) * 125, s: 30 + (i % 3) * 6, h: 2.5 + (i % 3) * 0.8 }; }), []);
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={ground}><circleGeometry args={[140, 48]} /></mesh>
        {hillsRing.map((h, i) => <mesh key={i} position={[h.x, h.h / 2 - 0.4, h.z]} material={haze}><coneGeometry args={[h.s, h.h, 7]} /></mesh>)}
        {/* darker apron fading the square into the ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 12]} receiveShadow material={edge}><planeGeometry args={[76, 62]} /></mesh>
        {/* the brick-paved square with grey stone strips */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 12]} receiveShadow material={paving}><planeGeometry args={[58, 42]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, FZ + 0.35]} material={strip}><planeGeometry args={[56, 0.34]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, FZ + 0.8]} material={brickStrip}><planeGeometry args={[56, 0.3]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 14]} material={strip}><planeGeometry args={[56, 0.34]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 14.5]} material={brickStrip}><planeGeometry args={[56, 0.28]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 26]} material={strip}><planeGeometry args={[56, 0.34]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.004, 14]} material={strip}><planeGeometry args={[0.34, 28]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.004, 14]} material={strip}><planeGeometry args={[0.34, 28]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14.5, 0.004, 14]} material={brickStrip}><planeGeometry args={[0.28, 28]} /></mesh>
        {/* plain brick wall west of the Golden Gate, short */}
        <Box s={[3.6, 2.7, 2.6]} p={[-L / 2 - 3.5 - 0.1 - 1.8, 1.35, FZ - 1.3]} m={M.mat('brick', 3, 1, { color: BRK, ...GL })} />
        <group position={[-L / 2 - 3.5 - 0.1 - 1.8, 0, FZ - 1.3]}><Roof w={4.6} d={3.6} h={0.55} y={2.7} m={M.mat('roof', 4, 2, TILE)} sag={1.05} lift={0.05} /></group>
        {/* temples across the square, on stepped brick-and-stone platforms */}
        <group position={[-15, 0, 9.5]}><Platform w={4.2} d={4.2} n={2} /><Chyasilin p={[0, 0.4, 0]} s={1.5} /></group>
        <group position={[-25, 0, 12]}><Platform w={4.6} d={4.6} n={3} /><Shikhara p={[0, 0.6, 0]} s={1.5} /></group>
        <group position={[-21.5, 0, 6.2]}>
          <Platform w={5.0} d={5.0} n={3} />
          <group position={[0, 0.6, 0]}><PagodaBody tiers={3} w={2.9} d={2.9} y0={0} walls="red-brick" roof="clay-tile" f={new Set(['carved-struts'])} /></group>
        </group>
        <group position={[-12.5, 0, 13.5]} scale={1.4}>
          <Box s={[1.5, 0.14, 1.5]} p={[0, 0.07, 0]} m={M.stone} />
          <Box s={[1.1, 0.14, 1.1]} p={[0, 0.21, 0]} m={M.stone} />
          <PillarStatue p={[0, 0.28, 0]} king face={0} />
        </group>
        <HouseRows list={houses} />
      </group>
    );
  }

  return { 'fifty-five-window-palace': { Main, Env } };
}
