/* Pindeshwor Babadham, Dharan (Koshi). A modest painted-plaster Shiva temple compound at the foot of forested Vijayapur hill.
   Main temple: a smooth straight-sided orange pyramid spire on a square block (yellow cornice band, grey stained wall, tall dark arched door,
   tin awning) at one end of a long low orange arcaded hall. Beyond the hall: raised terrace with small dome shrines and the red-yellow striped
   spire shrine (Pindeshwar Mahadev). Yellow welcome gate at the courtyard edge. Dimensions are estimates read from photographs.
   Units ~ metres. Front (arched face) faces +z; spire block at +x end, hall runs to -x. Forest hill behind (-z). */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo } = K;
  const Y = new THREE.Vector3(0, 1, 0);
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };

  /* palette (painted plaster) */
  const ORANGE = '#c4562c'; const RUST = '#a94a28'; const DADO = '#7f3520'; const MAROON = '#7a2a1e';
  const YEL = '#e6b93a'; const GATEY = '#e8c547'; const GREY = '#b4ab9a'; const CREAM = '#ece4d2';

  function Rod({ a, b, th = 0.05, m }) {
    const { p, q, len } = useMemo(() => {
      const va = new THREE.Vector3(...a); const vb = new THREE.Vector3(...b);
      const d = vb.clone().sub(va); const len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(Y, d.normalize());
      return { p: va.clone().add(vb).multiplyScalar(0.5).toArray(), q, len };
    }, [a.join(), b.join()]); // eslint-disable-line react-hooks/exhaustive-deps
    return <mesh position={p} quaternion={q} material={m}><boxGeometry args={[th, len, th]} /></mesh>;
  }

  function archShape(w, h) {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w / 2);
    sh.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
    return sh;
  }
  function Arch({ w, h, d, p, m }) {
    const g = useMemo(() => new THREE.ExtrudeGeometry(archShape(w, h), { depth: d, bevelEnabled: false }), [w, h, d]);
    return <mesh geometry={g} position={p} material={m} castShadow />;
  }

  function useTex(w, h, draw) {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  }
  const DEV = '"Nirmala UI","Mangal","Noto Sans Devanagari","Kokila",sans-serif';

  /* ---------- the main temple: spire block + long arcaded hall ---------- */
  const HX0 = -14; const HX1 = 6.9; const HZ = 3.2; const HH = 3.9; // hall x-range, front z, height
  const BX = 10.2; const BH = 4.6; const BW = 3.3; const BF = 3.5; // spire block centre x, wall height, half-width, front z

  function MainTemple() {
    const M = useM();
    const wall = M.plain(RUST, { roughness: 0.9 });
    const streakTex = useTex(512, 256, (c, w, h) => {
      c.fillStyle = ORANGE; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 150; i++) {
        const x = rnd(i * 1.7) * w; const lw = 1 + rnd(i * 3.3) * 4; const len = h * (0.4 + rnd(i * 5.9) * 0.6);
        const dark = rnd(i * 7.1) > 0.4;
        c.fillStyle = dark ? `rgba(70,30,15,${0.1 + rnd(i * 2.2) * 0.14})` : `rgba(225,150,100,${0.08 + rnd(i * 2.9) * 0.1})`;
        c.fillRect(x, 0, lw, len);
      }
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,30,15,0.18)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    const spireM = useMemo(() => new THREE.MeshStandardMaterial({ map: streakTex, roughness: 0.8 }), [streakTex]);
    const dado = M.plain(DADO, { roughness: 0.95 });
    const maroon = M.plain(MAROON, { roughness: 0.9 });
    const dark = M.plain('#1d1512', { roughness: 1 });
    const glass = M.plain('#2b2a31', { roughness: 0.7 });
    const bar = M.plain('#6b2a1e', { roughness: 0.8 });
    const yellow = M.plain(YEL, { roughness: 0.6 });
    const grey = M.plain(GREY, { roughness: 1 });
    const stain = M.plain('#8f8776', { roughness: 1 });
    const tin = M.plain('#6f7378', { roughness: 0.5, metalness: 0.5 });
    const roofTop = M.plain('#85807a', { roughness: 1 });
    const pennant = M.plain('#c8281c', { roughness: 0.8, side: THREE.DoubleSide });
    const pole = M.plain('#d9d4c8', { roughness: 0.7 });
    const tri = M.plain('#f5c518', { roughness: 0.3, metalness: 0.6 });

    const hallLen = HX1 - HX0; const hallCx = (HX0 + HX1) / 2;
    const N = 11; const pitch = 1.85; const x0 = HX0 + (hallLen - (N - 1) * pitch) / 2;
    const bays = Array.from({ length: N }, (_, i) => ({ x: x0 + i * pitch, door: i % 3 === 1 }));
    const BZ = HZ + 0.1; // block front z
    const topY = BH + 8.6;

    return (
      <group>
        {/* hall body */}
        <Box s={[hallLen, HH, HZ * 2]} p={[hallCx, HH / 2, 0]} m={wall} />
        <Box s={[hallLen + 0.1, 0.8, HZ * 2 + 0.1]} p={[hallCx, 0.4, 0]} m={dado} />
        <Box s={[hallLen + 0.16, 0.28, HZ * 2 + 0.16]} p={[hallCx, HH - 0.14, 0]} m={maroon} />
        <Box s={[hallLen - 0.4, 0.14, HZ * 2 - 0.4]} p={[hallCx, HH + 0.07, 0]} m={roofTop} />
        <Box s={[hallLen + 0.1, 0.25, 0.3]} p={[hallCx, HH + 0.125, HZ - 0.1]} m={wall} />
        <Box s={[hallLen + 0.1, 0.25, 0.3]} p={[hallCx, HH + 0.125, -HZ + 0.1]} m={wall} />
        <Box s={[0.3, 0.25, HZ * 2]} p={[HX0 + 0.05, HH + 0.125, 0]} m={wall} />
        <Box s={[0.3, 0.25, HZ * 2]} p={[HX1 - 0.05, HH + 0.125, 0]} m={wall} />
        {/* arched openings: alternating tall doors and grilled windows */}
        {bays.map((b, i) => (b.door ? (
          <group key={i}>
            <Arch w={1.35} h={2.8} d={0.1} p={[b.x, 0, HZ - 0.02]} m={maroon} />
            <Arch w={1.0} h={2.62} d={0.06} p={[b.x, 0, HZ + 0.07]} m={dark} />
          </group>
        ) : (
          <group key={i}>
            <Arch w={1.05} h={1.85} d={0.1} p={[b.x, 1.0, HZ - 0.02]} m={maroon} />
            <Arch w={0.76} h={1.62} d={0.06} p={[b.x, 1.1, HZ + 0.07]} m={glass} />
            {[-0.22, 0, 0.22].map((dx) => <Box key={dx} s={[0.04, 1.3, 0.04]} p={[b.x + dx, 1.8, HZ + 0.12]} m={bar} cast={false} />)}
            <Box s={[0.82, 0.05, 0.04]} p={[b.x, 1.7, HZ + 0.12]} m={bar} cast={false} />
          </group>
        )))}
        {/* hall rear: plain wall, a few small windows */}
        {[-10, -4, 2].map((x) => <Box key={x} s={[0.6, 0.9, 0.06]} p={[x, 2.3, -HZ - 0.02]} m={dark} cast={false} />)}

        {/* spire block: orange above, weathered grey-cream stained plaster below (front and east side) */}
        <Box s={[BW * 2, BH, BW * 2 + 0.2]} p={[BX, BH / 2, 0.1]} m={wall} />
        <Box s={[BW * 2 + 0.1, 2.4, 0.12]} p={[BX, 1.2, BF + 0.03]} m={grey} />
        <Box s={[0.12, 2.4, BW * 2 + 0.3]} p={[BX + BW + 0.03, 1.2, 0.1]} m={grey} />
        {/* ragged top edge of the grimy plaster, plus darker stain patches */}
        {Array.from({ length: 9 }, (_, k) => <Box key={'rg' + k} s={[0.45 + rnd(k + 2) * 0.5, 0.2 + rnd(k * 3) * 0.4, 0.12]} p={[BX - BW + 0.4 + k * 0.78, 2.5 + rnd(k * 3) * 0.2, BF + 0.03]} m={grey} cast={false} />)}
        {Array.from({ length: 8 }, (_, k) => <Box key={'rs' + k} s={[0.12, 0.2 + rnd(k * 4 + 1) * 0.4, 0.4 + rnd(k + 8) * 0.5]} p={[BX + BW + 0.03, 2.5 + rnd(k * 4 + 1) * 0.2, 0.1 - BW + 0.5 + k * 0.85]} m={grey} cast={false} />)}
        {[[-1.2, 1.5, 1.4, 0.9], [1.6, 0.9, 1.1, 1.3], [-2.5, 0.8, 0.8, 0.7]].map(([dx, y, w, h], k) => <Box key={'dp' + k} s={[w, h, 0.05]} p={[BX + dx, y, BF + 0.1]} m={stain} cast={false} />)}
        {[[-1.5, 1.4, 1.2, 1.0], [1.8, 1.0, 1.0, 0.8]].map(([dz, y, w, h], k) => <Box key={'dq' + k} s={[0.05, h, w]} p={[BX + BW + 0.1, y, 0.1 + dz]} m={stain} cast={false} />)}
        <Box s={[BW * 2 + 0.14, 0.1, 0.14]} p={[BX, 2.4, BF + 0.03]} m={stain} cast={false} />
        <Box s={[BW * 2 + 0.2, 0.5, 0.14]} p={[BX, 0.25, BF + 0.04]} m={stain} cast={false} />
        <Box s={[0.16, 0.5, BW * 2 + 0.34]} p={[BX + BW + 0.04, 0.25, 0.1]} m={stain} cast={false} />
        {[[-2.4, 1.1, 1.6], [-0.4, 1.3, 2.4], [0.9, 1.0, 2.0], [2.5, 1.2, 1.8], [-1.2, 1.4, 1.2]].map(([dx, h, y], k) => (
          <Box key={'sf' + k} s={[0.12, h + 0.6, 0.04]} p={[BX + dx, y, BF + 0.1]} m={stain} cast={false} />
        ))}
        {[-2.4, -0.6, 1.2, 2.6].map((dz, k) => (
          <Box key={'ss' + k} s={[0.04, 1.6 + (k % 2) * 0.7, 0.14]} p={[BX + BW + 0.1, 1.8 - (k % 2) * 0.3, 0.1 + dz]} m={stain} cast={false} />
        ))}
        {/* tall dark arched front door + maroon surround */}
        <Arch w={1.9} h={3.5} d={0.05} p={[BX - 1.5, 0, BF + 0.09]} m={maroon} />
        <Arch w={1.45} h={3.25} d={0.05} p={[BX - 1.5, 0, BF + 0.13]} m={dark} />
        {/* tin lean-to awning */}
        <Box s={[2.0, 0.06, 1.1]} p={[BX + 1.6, 2.5, BF + 0.6]} r={[0.28, 0, 0]} m={tin} />
        <Rod a={[BX + 0.7, 2.0, BF + 1.1]} b={[BX + 0.7, 0, BF + 1.1]} th={0.07} m={tin} />
        <Rod a={[BX + 2.5, 2.0, BF + 1.1]} b={[BX + 2.5, 0, BF + 1.1]} th={0.07} m={tin} />

        {/* yellow cornice band, smooth straight-sided pyramid, thin finial */}
        <Box s={[BW * 2 + 0.7, 0.28, BW * 2 + 0.9]} p={[BX, BH + 0.02, 0.1]} m={yellow} />
        <Box s={[BW * 2 + 0.5, 0.14, BW * 2 + 0.7]} p={[BX, BH - 0.2, 0.1]} m={maroon} />
        <mesh position={[BX, BH + 0.16 + 4.2, 0.1]} rotation={[0, Math.PI / 4, 0]} material={spireM} castShadow receiveShadow>
          <coneGeometry args={[(BW + 0.3) * Math.SQRT2, 8.4, 4]} />
        </mesh>
        <Cyl rt={0.06} rb={0.1} h={0.9} p={[BX, topY + 0.4, 0.1]} m={tri} seg={8} />
        <Ball rad={0.2} p={[BX, topY + 0.55, 0.1]} m={tri} />
        <Box s={[0.7, 0.07, 0.07]} p={[BX, topY + 0.95, 0.1]} m={tri} cast={false} />
        <Cyl rt={0.035} h={1.2} p={[BX, topY + 1.4, 0.1]} m={tri} seg={6} />
        <mesh position={[BX, topY + 2.12, 0.1]} material={tri}><coneGeometry args={[0.09, 0.3, 6]} /></mesh>
        {[-0.33, 0.33].map((dx) => (
          <group key={dx}>
            <Cyl rt={0.03} h={0.75} p={[BX + dx, topY + 1.3, 0.1]} m={tri} seg={6} />
            <mesh position={[BX + dx, topY + 1.8, 0.1]} material={tri}><coneGeometry args={[0.07, 0.26, 6]} /></mesh>
          </group>
        ))}

        {/* flag pole with red pennant, beside the spire */}
        <Cyl rt={0.08} rb={0.11} h={11} p={[BX + BW + 1.6, 5.5, BZ + 1.4]} m={pole} seg={8} />
        <mesh position={[BX + BW + 1.6 - 0.85, 10.4, BZ + 1.4]} material={pennant}><planeGeometry args={[1.7, 0.75]} /></mesh>
        <Frame s={[30, 15, 15]} p={[-2, 7.5, 5]} />
      </group>
    );
  }

  /* ---------- small shrines on the raised terrace behind the hall ---------- */
  function Dome({ p, r = 1.4, m, cm, fin, ribs = 0 }) {
    return (
      <group position={p}>
        <Ball rad={r} p={[0, 0, 0]} sc={[1, 1.1, 1]} m={m} />
        <Cyl rt={r * 0.28} rb={r * 0.4} h={0.25} p={[0, r * 1.1, 0]} m={cm || m} seg={12} />
        <Cyl rt={0.05} rb={0.07} h={0.9} p={[0, r * 1.1 + 0.5, 0]} m={fin} seg={6} />
        <Ball rad={0.13} p={[0, r * 1.1 + 1.0, 0]} m={fin} />
        {Array.from({ length: ribs }, (_, i) => {
          const a = (i / ribs) * Math.PI * 2;
          return <Box key={i} s={[0.05, r * 1.7, 0.05]} p={[Math.sin(a) * r * 0.72, r * 0.3, Math.cos(a) * r * 0.72]} r={[Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45]} m={cm || m} cast={false} />;
        })}
      </group>
    );
  }

  function Shrines() {
    const M = useM();
    const white = M.plain('#f1ece0', { roughness: 0.85 });
    const creamW = M.plain(CREAM, { roughness: 0.9 });
    const orangeDome = M.plain('#e8832e', { roughness: 0.7 });
    const orangeWall = M.plain('#d9702a', { roughness: 0.85 });
    const pinkDome = M.plain('#d99a82', { roughness: 0.7 });
    const redSp = M.plain('#c9302c', { roughness: 0.7 });
    const redSp2 = M.plain('#d4474a', { roughness: 0.7 });
    const yel = M.plain('#efc22c', { roughness: 0.55 });
    const dark = M.plain('#241815', { roughness: 1 });
    const ochre = M.plain('#a98a5c', { roughness: 1 });
    const ochreD = M.plain('#8a6d46', { roughness: 1 });
    const paving = M.plain('#8f8b7c', { roughness: 1 });
    const blue = M.plain('#2f6fc4', { roughness: 0.5, metalness: 0.3 });
    const postM = M.plain('#58595c', { roughness: 0.7 });
    const rail = M.plain('#f4f1ea', { roughness: 0.7 });
    const diya = <meshBasicMaterial color="#ffc66a" toneMapped={false} />;

    const TY = 0.9; // terrace height
    const ped = 1.5; // striped shrine half-width of cella
    const pH = 8; // pyramid height

    return (
      <group position={[0, 0, 3]}>
        {/* terrace with stained ochre retaining wall */}
        <Box s={[18, TY, 7]} p={[-6, TY / 2, -10]} m={ochre} />
        <Box s={[18.2, 0.5, 7.2]} p={[-6, 0.25, -10]} m={ochreD} cast={false} />
        <Box s={[17.6, 0.06, 6.6]} p={[-6, TY + 0.02, -10]} m={paving} cast={false} />
        {[0, 1].map((i) => <Box key={i} s={[4, 0.3, 0.6]} p={[-3, 0.15 + i * 0.3, -6.1 + i * 0.5]} m={paving} />)}

        {/* (a) white shrine on railed plinth, pink-orange dome */}
        <group position={[-12.4, TY, -10.3]}>
          <Box s={[4.6, 0.7, 4.6]} p={[0, 0.35, 0]} m={white} />
          <Box s={[2.9, 2.5, 2.9]} p={[0, 1.95, 0]} m={white} />
          <Box s={[3.3, 0.18, 3.3]} p={[0, 3.25, 0]} m={creamW} />
          <Arch w={0.9} h={1.7} d={0.06} p={[0, 0.7, 1.46]} m={dark} />
          <Arch w={0.7} h={1.3} d={0.06} p={[1.46, 0.7, 0]} r={[0, Math.PI / 2, 0]} m={dark} />
          <Dome p={[0, 4.15, 0]} r={1.15} m={pinkDome} cm={white} fin={yel} ribs={8} />
          {[-2, -1.2, -0.4, 0.4, 1.2, 2].map((x) => <Box key={x} s={[0.07, 0.6, 0.07]} p={[x, 1.0, 2.2]} m={rail} cast={false} />)}
          <Box s={[4.5, 0.07, 0.08]} p={[0, 1.32, 2.2]} m={rail} cast={false} />
          {[-1.2, 0, 1.2].map((z) => <Box key={z} s={[0.07, 0.6, 0.07]} p={[2.2, 1.0, z]} m={rail} cast={false} />)}
          <Box s={[0.08, 0.07, 3.6]} p={[2.2, 1.32, 0]} m={rail} cast={false} />
        </group>

        {/* (b) bright orange-ochre dome shrine */}
        <group position={[-8.5, TY, -8.6]}>
          <Box s={[2.5, 0.35, 2.5]} p={[0, 0.17, 0]} m={white} />
          <Box s={[2.2, 2.1, 2.2]} p={[0, 1.4, 0]} m={orangeWall} />
          <Arch w={0.8} h={1.4} d={0.06} p={[0, 0.35, 1.08]} m={dark} />
          <Dome p={[0, 3.0, 0]} r={1.25} m={orangeDome} fin={yel} />
        </group>

        {/* (e) small white tiered-dome shrine with yellow finial */}
        <group position={[-6.2, TY, -12.3]}>
          <Box s={[1.9, 1.7, 1.9]} p={[0, 0.85, 0]} m={white} />
          <Cyl rt={0.95} rb={1.05} h={0.35} p={[0, 1.9, 0]} m={white} seg={14} />
          <Cyl rt={0.75} rb={0.9} h={0.35} p={[0, 2.25, 0]} m={white} seg={14} />
          <Ball rad={0.65} p={[0, 2.5, 0]} sc={[1, 1.1, 1]} m={white} />
          <Cyl rt={0.05} h={0.9} p={[0, 3.4, 0]} m={yel} seg={6} />
          <Ball rad={0.14} p={[0, 3.9, 0]} m={yel} />
        </group>

        {/* (c) Pindeshwar Mahadev: red-and-yellow striped pyramid on a tall white cube cella */}
        <group position={[-2.2, TY, -9.8]}>
          <Box s={[ped * 2 + 0.4, 0.4, ped * 2 + 0.4]} p={[0, 0.2, 0]} m={paving} />
          <Box s={[ped * 2, 3.4, ped * 2]} p={[0, 2.1, 0]} m={creamW} />
          <Box s={[ped * 2 + 0.44, 0.34, ped * 2 + 0.44]} p={[0, 4.35, 0]} m={yel} />
          <Box s={[ped * 2 + 0.3, 0.2, ped * 2 + 0.3]} p={[0, 3.8, 0]} m={white} />
          <Arch w={0.9} h={1.8} d={0.06} p={[0, 0.4, ped + 0.01]} m={dark} />
          <Box s={[ped * 2 + 0.5, 0.26, ped * 2 + 0.5]} p={[0, 4.03, 0]} m={yel} />
          <mesh position={[0, 4.16 + pH / 2, 0]} rotation={[0, Math.PI / 4, 0]} material={redSp} castShadow>
            <coneGeometry args={[(ped + 0.2) * Math.SQRT2, pH, 4]} />
          </mesh>
          {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], i) => (
            <Rod key={i} a={[sx * (ped + 0.2), 4.16, sz * (ped + 0.2)]} b={[0, 4.16 + pH, 0]} th={0.3} m={yel} />
          ))}
          <Cyl rt={0.05} rb={0.08} h={1.0} p={[0, 4.16 + pH + 0.4, 0]} m={yel} seg={6} />
          <Ball rad={0.17} p={[0, 4.16 + pH + 0.2, 0]} m={yel} />
        </group>

        {/* (d) small white shrine with red-pink tiered/ribbed spire */}
        <group position={[1.6, TY, -10.4]}>
          <Box s={[2.0, 1.9, 2.0]} p={[0, 0.95, 0]} m={white} />
          <Box s={[2.3, 0.18, 2.3]} p={[0, 1.95, 0]} m={redSp2} />
          <mesh position={[0, 2.04 + 0.85, 0]} rotation={[0, Math.PI / 4, 0]} material={redSp2} castShadow>
            <coneGeometry args={[1.5, 1.7, 4]} />
          </mesh>
          <Box s={[1.4, 0.16, 1.4]} p={[0, 3.0, 0]} m={redSp} />
          <mesh position={[0, 3.08 + 0.7, 0]} rotation={[0, Math.PI / 4, 0]} material={redSp2}>
            <coneGeometry args={[0.95, 1.4, 4]} />
          </mesh>
          <Cyl rt={0.04} h={0.8} p={[0, 4.6, 0]} m={yel} seg={6} />
          <Ball rad={0.13} p={[0, 5.0, 0]} m={yel} />
        </group>

        {/* blue corrugated tin shelters on poles */}
        <group position={[7.5, 0, -9.4]}>
          {[[-1.8, -1.2], [1.8, -1.2], [-1.8, 1.2], [1.8, 1.2]].map(([x, z], i) => <Cyl key={i} rt={0.07} h={2.6} p={[x, 1.3, z]} m={postM} seg={6} />)}
          <Box s={[4.2, 0.07, 3.2]} p={[0, 2.7, 0]} r={[0.12, 0, 0]} m={blue} />
        </group>
        <group position={[-19.5, 0, -9]}>
          {[[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]].map(([x, z], i) => <Cyl key={i} rt={0.07} h={2.8} p={[x, 1.4, z]} m={postM} seg={6} />)}
          <Box s={[3.6, 0.07, 3.2]} p={[0, 2.9, 0]} r={[0.1, 0, 0]} m={postM} />
        </group>

        {/* diyas and a lamp glow on the terrace */}
        {[-3.2, -2.6, -1.8, -1.2].map((x, i) => (
          <mesh key={i} position={[x, TY + 0.55, -7.9]}><sphereGeometry args={[0.07, 8, 6]} />{diya}</mesh>
        ))}
        <pointLight position={[-2.2, TY + 1.0, -7.6]} intensity={0.9} distance={5} color="#ffb35a" />
        <pointLight position={[-12.4, TY + 1.4, -7.4]} intensity={0.6} distance={5} color="#ffb35a" />
      </group>
    );
  }

  /* ---------- yellow welcome gate ---------- */
  function WelcomeGate() {
    const M = useM();
    const yellow = M.plain(GATEY, { roughness: 0.75 });
    const red = M.plain('#b8321f', { roughness: 0.7 });
    const iron = M.plain('#7a1d1d', { roughness: 0.6 });
    const dark = M.plain('#1d1512', { roughness: 1 });
    const stained = M.plain('#c9a93a', { roughness: 1 });
    const marigold = M.plain('#f29a1f', { roughness: 0.8 });
    const nameTex = useTex(1024, 160, (c, w, h) => {
      c.fillStyle = '#e8c547'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#c23a22'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10);
      c.fillStyle = '#1f4fa5'; c.font = `bold 92px ${DEV}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('श्री पिण्डेश्वर बाबाधाम', w / 2, h / 2 + 6);
    });
    const omTex = useTex(512, 256, (c, w, h) => {
      c.fillStyle = '#e8c547'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1f4fa5'; c.font = `bold 58px ${DEV}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('ॐ नमः शिवाय', w / 2, 58);
      c.fillStyle = '#2b2a31'; c.beginPath(); c.moveTo(w / 2 - 36, 250); c.lineTo(w / 2 - 36, 150); c.arc(w / 2, 150, 36, Math.PI, 0); c.lineTo(w / 2 + 36, 250); c.fill();
      c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(w / 2, 175, 15, 0, Math.PI * 2); c.fill(); c.fillRect(w / 2 - 14, 188, 28, 40);
    });
    const swTex = useTex(128, 512, (c, w, h) => {
      c.fillStyle = '#e8c547'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1f4fa5'; c.font = `bold 96px ${DEV}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      ['स्वा', 'ग', 'त', 'म्'].forEach((t, i) => c.fillText(t, w / 2, 64 + i * 128));
    });
    const flags = useMemo(() => Array.from({ length: 16 }, (_, i) => {
      const t = (i + 0.5) / 16; const x = 2.1 + t * 8; const sag = Math.sin(t * Math.PI) * 0.7;
      return { x, y: 4.3 + t * 0.8 - sag, z: 0.4 + t * 3, c: ['#2f6db5', '#f2efe6', '#c0392b', '#2e8b57', '#e2b33c'][i % 5] };
    }), []);

    return (
      <group>
        {/* side walls and posts */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[1.9, 2.7, 0.9]} p={[s * 3.55, 1.35, 0]} m={yellow} />
            <Box s={[2.0, 0.16, 1.0]} p={[s * 3.55, 2.78, 0]} m={stained} />
            <Box s={[1.05, 4.2, 1.05]} p={[s * 2.1, 2.1, 0]} m={yellow} />
            <Box s={[1.2, 0.2, 1.2]} p={[s * 2.1, 4.25, 0]} m={stained} />
            {/* kalash finial */}
            <Cyl rt={0.3} rb={0.36} h={0.3} p={[s * 2.1, 4.5, 0]} m={yellow} seg={10} />
            <Ball rad={0.34} p={[s * 2.1, 4.85, 0]} sc={[1, 1.15, 1]} m={yellow} />
            <Cyl rt={0.03} h={0.45} p={[s * 2.1, 5.35, 0]} m={red} seg={6} />
            <mesh position={[s * 2.1, 2.2, 0.53]}><planeGeometry args={[0.98, 3.4]} /><meshStandardMaterial map={swTex} roughness={0.9} /></mesh>
            {/* red-patterned iron leaf swung open */}
            <Box s={[1.3, 2.6, 0.06]} p={[s * 1.85, 1.4, 1.0]} r={[0, s * 1.15, 0]} m={iron} />
            {/* small eye / painted roundel on wall */}
            <Box s={[0.5, 0.3, 0.05]} p={[s * 3.55, 1.55, 0.47]} m={dark} cast={false} />
          </group>
        ))}
        {/* name board and arched top */}
        <Box s={[5.2, 1.0, 0.9]} p={[0, 3.5, 0]} m={yellow} />
        <mesh position={[0, 3.5, 0.46]}><planeGeometry args={[5.1, 0.97]} /><meshStandardMaterial map={nameTex} roughness={0.9} /></mesh>
        <mesh position={[0, 3.95, 0.0]} material={red}><circleGeometry args={[2.0, 36, 0, Math.PI]} /></mesh>
        <mesh position={[0, 3.95, 0.45]} material={red}><circleGeometry args={[2.0, 36, 0, Math.PI]} /></mesh>
        <Box s={[4.0, 0.1, 0.9]} p={[0, 3.98, 0]} m={red} />
        <mesh position={[0, 3.95, 0.5]}><circleGeometry args={[1.82, 36, 0, Math.PI]} /><meshStandardMaterial map={omTex} roughness={0.9} /></mesh>
        <mesh position={[0, 3.95, 0.5]} />
        <Cyl rt={0.03} h={0.7} p={[0, 5.95, 0]} m={red} seg={6} />
        <Ball rad={0.12} p={[0, 6.3, 0]} m={yellow} />
        {/* marigold garland swag and a hanging banner */}
        {Array.from({ length: 15 }, (_, i) => { const t = i / 14; const x = -1.55 + t * 3.1; return <Ball key={'g' + i} rad={0.1} p={[x, 2.95 - Math.sin(t * Math.PI) * 0.45, 0.55]} m={i % 3 === 2 ? red : marigold} />; })}
        {[-1, 1].map((s) => <Box key={'gb' + s} s={[0.12, 0.8, 0.04]} p={[s * 1.6, 2.5, 0.56]} m={marigold} cast={false} />)}
        {/* pennant string */}
        <Rod a={[2.1, 5.1, 0.4]} b={[10.1, 5.1, 3.4]} th={0.012} m={dark} />
        {flags.map((f, i) => <Box key={i} s={[0.3, 0.38, 0.015]} p={[f.x, f.y - 0.1, f.z]} r={[0, 0.9, 0]} m={M.plain(f.c, { roughness: 0.9 })} cast={false} />)}
      </group>
    );
  }

  /* ---------- sacred pool with central idol ---------- */
  function Pool() {
    const M = useM();
    const rim = M.plain('#e9e3d3', { roughness: 0.9 });
    const water = M.plain('#4e7f78', { roughness: 0.25, metalness: 0.2 });
    const idol = M.plain('#d9702a', { roughness: 0.8 });
    return (
      <group>
        <Cyl rt={1.5} rb={1.55} h={0.4} p={[0, 0.2, 0]} m={rim} seg={20} />
        <Cyl rt={1.28} rb={1.28} h={0.42} p={[0, 0.21, 0]} m={water} seg={20} />
        <Box s={[0.5, 0.5, 0.5]} p={[0, 0.5, 0]} m={rim} />
        <Box s={[0.26, 0.4, 0.22]} p={[0, 0.95, 0]} m={idol} />
        <Ball rad={0.13} p={[0, 1.27, 0]} m={idol} />
      </group>
    );
  }

  function Main() {
    const M = useM();
    const paving = M.plain('#8a8678', { roughness: 1 });
    const grassP = M.plain('#74874f', { roughness: 1 });
    const dirt = M.plain('#9a8461', { roughness: 1 });
    const dark = M.plain('#1d1512', { roughness: 1 });
    return (
      <group>
        <MainTemple />
        <Shrines />
        {/* modest weathered paving, broken by grass and worn earth */}
        <Box s={[30, 0.1, 9]} p={[-4, 0.05, 7.9]} m={paving} cast={false} />
        {[[-17, 4.2, 2.4, 1.4], [-9, 11.9, 3, 1.1], [1, 12.1, 2.6, 1.0], [8.5, 8, 2, 2.4], [-1, 4.0, 1.7, 0.9], [-19.2, 9, 1.6, 2.2], [-12, 3.9, 1.4, 0.8]].map(([x, z, rx, rz], i) => (
          <Ball key={'gp' + i} rad={1} p={[x, 0.1, z]} sc={[rx, 0.05, rz]} m={grassP} />
        ))}
        {[[-5, 7, 1.5, 0.9], [4, 6, 1.2, 0.8], [-14, 8.5, 1.3, 0.9], [12, 5, 2, 1]].map(([x, z, rx, rz], i) => (
          <Ball key={'dp' + i} rad={1} p={[x, 0.11, z]} sc={[rx, 0.04, rz]} m={dirt} />
        ))}
        <group position={[-8, 0, 11]} rotation={[0, 0.2, 0]} scale={1.2}><WelcomeGate /></group>
        <group position={[-16, 0, 9]}><Pool /></group>
        {/* the long path of oil lamps at the hall foot */}
        {[-10, -6, -2, 2].map((x) => <mesh key={x} position={[x, 0.18, HZ + 0.5]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#ffc66a" toneMapped={false} /></mesh>)}
        <mesh position={[BX - 1.5, 0.2, HZ + 0.9]}><sphereGeometry args={[0.08, 8, 6]} /><meshBasicMaterial color="#ffc66a" toneMapped={false} /></mesh>
        {/* overhead wires (a utility pole at the courtyard corner) */}
        <Cyl rt={0.1} rb={0.14} h={9} p={[-24, 4.5, 8]} m={M.plain('#6a5a48', { roughness: 1 })} seg={6} />
        <Box s={[1.4, 0.08, 0.08]} p={[-24, 8.6, 8]} m={M.plain('#6a5a48', { roughness: 1 })} cast={false} />
        <Rod a={[-24, 8.6, 8]} b={[BX + BW + 1.6, 9.8, BZ()]} th={0.014} m={dark} />
      </group>
    );
  }
  function BZ() { return HZ + 0.1 + 1.4; }

  /* ---------- environment ---------- */
  function Palm({ p, h = 9, lean = 0.08, seed = 1 }) {
    const M = useM();
    const trunk = M.plain('#7b6a52', { roughness: 1 });
    const frond = M.plain('#3f7a34', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, 0, lean]}>
        <Cyl rt={0.16} rb={0.28} h={h} p={[0, h / 2, 0]} m={trunk} seg={8} />
        <group position={[0, h, 0]}>
          {Array.from({ length: 13 }, (_, i) => (
            <group key={i} rotation={[0, (i / 13) * Math.PI * 2 + seed, 0]}>
              <group rotation={[-0.25 + rnd(i + seed) * 0.3, 0, 0]}>
                <mesh position={[0, 0, 0.9]} material={frond}><boxGeometry args={[0.36, 0.04, 1.8]} /></mesh>
                <group position={[0, 0, 1.8]} rotation={[0.8 + rnd(i * 2 + seed) * 0.35, 0, 0]}>
                  <mesh position={[0, 0, 0.95]} material={frond}><boxGeometry args={[0.3, 0.04, 1.9]} /></mesh>
                  <group position={[0, 0, 1.9]} rotation={[0.5, 0, 0]}>
                    <mesh position={[0, 0, 0.5]} material={frond}><boxGeometry args={[0.16, 0.03, 1.0]} /></mesh>
                  </group>
                </group>
              </group>
            </group>
          ))}
          <Ball rad={0.25} p={[0, -0.1, 0]} m={trunk} />
        </group>
      </group>
    );
  }
  function BigTree({ p, s = 1, c = '#3f6f33', seed = 0 }) {
    const M = useM();
    const bark = M.plain('#5a4632', { roughness: 1 });
    const l1 = M.plain(c, { roughness: 1 });
    const l2 = M.plain('#4f7d3a', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.35} rb={0.6} h={6} p={[0, 3, 0]} m={bark} seg={8} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = rnd(i + seed) * 6.28; const r = 1.2 + rnd(i * 3 + seed) * 2;
          return <Ball key={i} rad={2.2 + rnd(i + 9 + seed) * 1.2} p={[Math.cos(a) * r, 7 + rnd(i + 4) * 2.4, Math.sin(a) * r]} sc={[1, 0.8, 1]} m={i % 2 ? l1 : l2} />;
        })}
      </group>
    );
  }

  function SkyDome() {
    const g = useMemo(() => {
      const geo = new THREE.SphereGeometry(170, 24, 14);
      const pos = geo.attributes.position; const col = [];
      const lo = new THREE.Color('#f0f8ff'); const hi = new THREE.Color('#8fc4ff'); const t = new THREE.Color();
      for (let i = 0; i < pos.count; i++) { const k = Math.min(1, Math.max(0, pos.getY(i) / 120)); t.copy(lo).lerp(hi, k); col.push(t.r, t.g, t.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return geo;
    }, []);
    return <mesh geometry={g}><meshStandardMaterial vertexColors side={THREE.BackSide} fog={false} roughness={1} emissive="#3d5a78" /></mesh>;
  }
  function Env() {
    const M = useM();
    const grass = M.plain('#7c8f58', { roughness: 1 });
    const hill1 = M.plain('#3d6a34', { roughness: 1 });
    const hill2 = M.plain('#2f5a2c', { roughness: 1 });
    const haze = M.plain('#8aa3b8', { roughness: 1 });
    const haze2 = M.plain('#a3b8c9', { roughness: 1 });
    const earth = M.plain('#a08b64', { roughness: 1 });
    const wall = M.plain('#b6996a', { roughness: 1 });
    const cap = M.plain('#d6cdb8', { roughness: 1 });
    const greens = ['#3d6a34', '#2a4d2a', '#55803c', '#244a2c', '#6b8f45', '#35582f', '#486b3a'].map((c) => M.plain(c, { roughness: 1 }));

    const blobs = useMemo(() => Array.from({ length: 34 }, (_, i) => {
      const x = -56 + rnd(i * 2.3) * 112; const z = -38 - rnd(i * 5.1) * 12;
      const k = 1 - (x / 70) ** 2 - ((z + 50) / 16) ** 2;
      const y = k > 0 ? 18 * Math.sqrt(k) - 2 : 0;
      return { x, z, y: y - 0.3, r: 2.2 + rnd(i + 20) * rnd(i + 31) * 5.5, m: i % greens.length };
    }).filter((b) => b.y > 1.5), []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={grass} receiveShadow>
          <circleGeometry args={[95, 48]} />
        </mesh>
        {/* hazy far hills, then a continuous forested Vijayapur slope */}
        <Ball rad={1} p={[-30, -4, -84]} sc={[52, 34, 20]} m={haze2} />
        <Ball rad={1} p={[34, -4, -86]} sc={[56, 30, 20]} m={haze2} />
        <Ball rad={1} p={[0, -4, -74]} sc={[60, 27, 18]} m={haze} />
        <Ball rad={1} p={[-6, -2, -50]} sc={[70, 18, 16]} m={hill2} />
        <Ball rad={1} p={[-26, -2, -38]} sc={[40, 14, 14]} m={hill1} />
        <Ball rad={1} p={[24, -2, -40]} sc={[44, 12, 14]} m={hill1} />
        <Ball rad={1} p={[0, -2, -32]} sc={[55, 8.5, 11]} m={hill2} />
        {blobs.map((b, i) => <Ball key={i} rad={b.r} p={[b.x, b.y, b.z]} sc={[1.3, 0.9, 1.1]} m={greens[b.m]} />)}

        {/* trees beside the compound, out of the sightline */}
        <BigTree p={[27, 0, -10]} s={1.1} c="#335d2d" seed={5} />
        <BigTree p={[-28, 0, -6]} s={1.15} seed={9} />
        {/* big dark broadleaf trees shading the compound edge */}
        <BigTree p={[-34, 0, -9]} s={1.3} c="#25472a" seed={13} />
        <BigTree p={[36, 0, -4]} s={1.25} c="#274c2a" seed={17} />
        <BigTree p={[-24, 0, -13]} s={1.1} c="#2c5030" seed={21} />
        <BigTree p={[31, 0, -6]} s={1.15} c="#2a4d2b" seed={23} />
        {/* hazy blue-grey far ridge and sky gradient */}
        <Ball rad={1} p={[0, -6, -130]} sc={[130, 40, 25]} m={M.plain('#9db3c6', { roughness: 1 })} />
        <SkyDome />

        {/* two pairs of palms: left end of the hall, and the right side */}
        <Palm p={[-15.5, 0, 4.6]} h={9.5} lean={0.07} seed={1} />
        <Palm p={[-17.3, 0, 3.4]} h={8.2} lean={-0.06} seed={2} />
        <Palm p={[21, 0, -2]} h={10} lean={0.05} seed={3} />
        <Palm p={[23, 0, -0.5]} h={8.6} lean={-0.05} seed={4} />

        {/* worn earth patches on the compound ground */}
        {[[14, 6, 3, 2], [-24, 12, 3, 2], [18, 12, 4, 2.4], [-5, 15, 3, 1.4], [6, -6, 4, 2]].map(([x, z, rx, rz], i) => (
          <Ball key={'ed' + i} rad={1} p={[x, 0.02, z]} sc={[rx, 0.04, rz]} m={earth} />
        ))}

        {/* stained ochre boundary wall along the west edge of the compound */}
        <Box s={[0.5, 1.5, 14]} p={[-31, 0.75, 10]} m={wall} />
        <Box s={[0.7, 0.14, 14]} p={[-31, 1.55, 10]} m={cap} cast={false} />
        <Box s={[0.5, 1.5, 12]} p={[-31, 0.75, -6]} m={wall} />
        {/* low front boundary wall and the far edge of the compound, kept low */}
        <Box s={[30, 0.9, 0.4]} p={[-16, 0.45, 17]} m={wall} />
      </group>
    );
  }
  const TERR = 0.9;

  return { 'pindeshwor-babadham': { Main, Env } };
}
