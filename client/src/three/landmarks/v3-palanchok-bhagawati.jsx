/* Palanchok Bhagawati Temple (Panchkhal, Kavrepalanchok), 1,563 m summit.
   A modest square pagoda of THREE roofs (two weathered grey roofs with red cloth frills and gold fringe, a small gold top roof,
   a tall gilded spire with two hanging metal banners) stands in the middle of a square paved courtyard that is walled in by a
   continuous red-brick range with one low rusty-red sheet roof sloping inward. Iron trident to the right, small white arched
   shrine front-left, lions, bells, a big old peepal over the court from the upper left. Flat hilltop, terraced slopes, hazy
   ridges, snow range to the north (-z). Units ~ 2 m. Front = +z. Dimensions are estimated from photographs. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Lion, LatticeWindow, EaveStruts, THREE, useMemo } = K;

  const RED = '#a82226';
  const BRICK = '#b5644a';
  const WALLB = '#a85a40';
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const CI = 4.6; // courtyard half-width
  const CO = 6.0; // outer face of the perimeter range

  /* ---- terrain: flat summit, then terraced slopes falling away on all sides ---- */
  function hgt(x, z) {
    const d = Math.hypot(x, z);
    const drop = Math.max(0, d - 12);
    if (drop <= 0) return 0;
    let y = -(drop * 0.5 + drop * drop * 0.0045);
    const far = clamp((d - 26) / 30, 0, 1);
    y += Math.sin(x * 0.075 + 1.3) * Math.sin(z * 0.06 + 0.4) * 5 * far + Math.sin(x * 0.04 - z * 0.05) * 3 * far;
    const t = clamp(drop / 5, 0, 1);
    const yq = Math.round(y / 1.3) * 1.3;
    y = y + (yq - y) * 0.9 * t;
    y += (Math.sin(x * 0.31 + z * 0.17) + Math.sin(z * 0.43 - x * 0.12)) * 0.12 * t;
    return Math.max(y, -28);
  }

  /* ---------- the three-roof pagoda ---------- */
  function Frill({ w, d, y, drop = 0.3, gap = 0.04 }) {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.95 });
    const gold = M.plain('#d9ad2c', { roughness: 0.4, metalness: 0.6 });
    const sides = [
      { s: [w, drop, 0.04], p: [0, 0, d / 2 - gap], f: [w, 0.05, 0.06] },
      { s: [w, drop, 0.04], p: [0, 0, -d / 2 + gap], f: [w, 0.05, 0.06] },
      { s: [0.04, drop, d], p: [w / 2 - gap, 0, 0], f: [0.06, 0.05, d] },
      { s: [0.04, drop, d], p: [-w / 2 + gap, 0, 0], f: [0.06, 0.05, d] },
    ];
    return (
      <group position={[0, y, 0]}>
        {sides.map((q, i) => (
          <group key={i} position={q.p}>
            <Box s={[q.s[0] + 0.04, 0.09, q.s[2] + 0.04]} p={[0, 0.08, 0]} m={M.plain('#2a1a10', { roughness: 0.8 })} cast={false} />
            <Box s={q.s} p={[0, -drop / 2 + 0.02, 0]} m={red} cast={false} />
            <Box s={q.f} p={[0, -drop + 0.02, 0]} m={gold} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function windowsOn(w, y, ww, hh, bars, key) {
    return [[0, 0], [Math.PI / 2, 1], [Math.PI, 2], [-Math.PI / 2, 3]].map(([r, i]) => (
      <group key={`${key}${i}`} rotation={[0, r, 0]}>
        <LatticeWindow p={[0, y, w / 2 + 0.01]} w={ww} h={hh} bars={bars} />
      </group>
    ));
  }

  function SpireTop({ y }) {
    const M = useM();
    const pts = useMemo(() => {
      const P = (r, h) => new THREE.Vector2(r * 0.8, h * 1.12);
      return [P(0.01, 0), P(0.34, 0), P(0.36, 0.06), P(0.26, 0.14), P(0.2, 0.24), P(0.3, 0.38), P(0.34, 0.5), P(0.2, 0.62),
        P(0.14, 0.68), P(0.26, 0.76), P(0.15, 0.86), P(0.2, 0.92), P(0.12, 1.0), P(0.16, 1.06), P(0.09, 1.16), P(0.12, 1.2),
        P(0.06, 1.3), P(0.08, 1.34), P(0.045, 1.42), P(0.03, 1.5), P(0.0, 1.7)];
    }, []);
    return (
      <group position={[0, y, 0]}>
        <mesh material={M.gold} castShadow><latheGeometry args={[pts, 14]} /></mesh>
        <Cyl rt={0.006} rb={0.015} h={0.2} p={[0, 1.99, 0]} m={M.gold} seg={5} />
        {/* lotus petals round the base and a jewelled crown ring */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(a) * 0.25, 0.12, Math.sin(a) * 0.25]} rotation={[Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7]} material={M.gold}><coneGeometry args={[0.055, 0.22, 5]} /></mesh>;
        })}
        {/* two long metallic banners (gold-plated and copper gilt) hanging from the spire */}
        <Box s={[0.1, 1.5, 0.012]} p={[0.3, -0.62, 0.22]} r={[0.28, 0, -0.22]} m={M.plain('#e2b83a', { metalness: 0.85, roughness: 0.25 })} cast={false} />
        <Box s={[0.1, 1.45, 0.012]} p={[-0.18, -0.6, 0.3]} r={[0.3, 0, 0.14]} m={M.plain('#b8733a', { metalness: 0.85, roughness: 0.3 })} cast={false} />
      </group>
    );
  }

  function Pagoda() {
    const M = useM();
    const brick = M.mat('brick', 1.4, 1, { color: BRICK });
    const timber = M.plain('#3a2416', { roughness: 0.8 });
    const wall2 = M.plain('#442a18', { roughness: 0.85 });
    const wall3 = M.plain('#4a2c18', { roughness: 0.85 });
    const post = M.plain('#5a3820', { roughness: 0.8 });
    const dark = M.plain('#120a06', { roughness: 1 });
    const roofM = M.plain('#6E6A64', { roughness: 0.85, metalness: 0.05 });
    const goldRoof = M.plain('#d2a62a', { metalness: 0.75, roughness: 0.3 });
    const bell = M.plain('#c99a35', { metalness: 0.8, roughness: 0.35 });
    const W1 = 2.9;
    return (
      <group scale={1.25}><group rotation={[0, 0, -0.03]}>{/* the 2015 quake left it leaning slightly to its right (+x) */}
        {/* one low plinth step */}
        <Box s={[4.5, 0.3, 4.5]} p={[0, 0.15, 0]} m={M.mat('stone', 3, 3, { color: '#b9b0a2' })} />
        {/* storey 1: open dark ground storey, brick sides, timber posts, gold-plated door at the front */}
        <Box s={[W1, 1.6, 0.3]} p={[0, 1.1, -W1 / 2 + 0.15]} m={brick} />
        <Box s={[0.3, 1.6, W1]} p={[W1 / 2 - 0.15, 1.1, 0]} m={brick} />
        <Box s={[0.3, 1.6, W1]} p={[-W1 / 2 + 0.15, 1.1, 0]} m={brick} />
        <Box s={[W1 - 0.6, 1.4, W1 - 0.6]} p={[0, 1.0, 0]} m={dark} />
        {[-1, 1].map((k) => <Box key={k} s={[0.62, 1.6, 0.3]} p={[k * (W1 / 2 - 0.31), 1.1, W1 / 2 - 0.15]} m={brick} />)}
        <Box s={[W1 - 1.0, 0.42, 0.3]} p={[0, 1.69, W1 / 2 - 0.15]} m={brick} />
        {[-1, 1].map((k) => <Box key={k} s={[0.14, 1.6, 0.14]} p={[k * 0.97, 1.1, W1 / 2 + 0.02]} m={timber} />)}
        <Box s={[2.0, 0.14, 0.16]} p={[0, 1.5, W1 / 2 + 0.02]} m={timber} />
        {/* gold-plated carved door with metal-clad jambs */}
        <Box s={[1.22, 1.0, 0.05]} p={[0, 0.82, W1 / 2 - 0.2]} m={M.plain('#caa13a', { metalness: 0.8, roughness: 0.35 })} />
        {[-1, 1].map((k) => <Box key={k} s={[0.1, 1.15, 0.1]} p={[k * 0.66, 0.88, W1 / 2 - 0.12]} m={M.plain('#8d7a4c', { metalness: 0.7, roughness: 0.4 })} />)}
        <Box s={[1.4, 0.1, 0.1]} p={[0, 1.45, W1 / 2 - 0.12]} m={M.plain('#8d7a4c', { metalness: 0.7, roughness: 0.4 })} />
        <Box s={[0.5, 0.1, 0.04]} p={[0, 1.58, W1 / 2 - 0.1]} m={M.gold} />
        {[-1, 1].map((a) => [-1, 1].map((b) => <Box key={`${a}${b}`} s={[0.2, 1.7, 0.2]} p={[a * (W1 / 2), 1.15, b * (W1 / 2)]} m={timber} />))}
        {/* roof 1 */}
        <Box s={[4.8, 0.02, 4.8]} p={[0, 1.86, 0]} m={dark} cast={false} />
        <Roof w={4.9} d={4.9} h={1.3} y={1.9} m={roofM} lift={0.25} fascia={false} />
        <Frill w={4.9} d={4.9} y={1.92} drop={0.26} />
        <EaveStruts w={3.1} d={3.1} y={2.02} n={3} h={0.95} />
        {/* storey 2: dark timber between the roofs, lattice windows */}
        <Box s={[2.1, 1.4, 2.1]} p={[0, 3.0, 0]} m={wall2} />
        {[-1, 1].map((a) => [-1, 1].map((b) => <Box key={`${a}${b}`} s={[0.16, 1.4, 0.16]} p={[a * 1.05, 3.0, b * 1.05]} m={post} />))}
        <Box s={[2.2, 0.1, 2.2]} p={[0, 2.35, 0]} m={post} cast={false} />
        <Box s={[2.2, 0.1, 2.2]} p={[0, 3.62, 0]} m={post} cast={false} />
        {windowsOn(2.1, 3.0, 0.72, 0.7, 5, 's2')}
        <Box s={[3.5, 0.02, 3.5]} p={[0, 3.61, 0]} m={dark} cast={false} />
        <Roof w={3.6} d={3.6} h={1.05} y={3.65} m={roofM} lift={0.25} fascia={false} />
        <Frill w={3.6} d={3.6} y={3.67} drop={0.2} />
        <EaveStruts w={2.2} d={2.2} y={3.75} n={2} h={0.8} />
        {/* storey 3 */}
        <Box s={[1.5, 1.2, 1.5]} p={[0, 4.45, 0]} m={wall3} />
        {[-1, 1].map((a) => [-1, 1].map((b) => <Box key={`${a}${b}`} s={[0.12, 1.2, 0.12]} p={[a * 0.75, 4.45, b * 0.75]} m={post} />))}
        <Box s={[1.6, 0.08, 1.6]} p={[0, 3.9, 0]} m={post} cast={false} />
        {windowsOn(1.5, 4.5, 0.52, 0.52, 4, 's3')}
        {/* roof 3: small, GOLD */}
        <Box s={[2.4, 0.02, 2.4]} p={[0, 4.99, 0]} m={dark} cast={false} />
        <Roof w={2.5} d={2.5} h={0.7} y={5.0} m={goldRoof} lift={0.25} fascia={false} />
        <Frill w={2.5} d={2.5} y={5.02} drop={0.18} />
        <EaveStruts w={1.6} d={1.6} y={5.1} n={2} h={0.65} />
        <SpireTop y={5.53} />
        {/* bronze bells hung under the eaves of roof 1 and 2 */}
        {[-1.5, 0, 1.5].map((x) => (
          <group key={x} position={[x, 1.7, 2.43]}>
            <Cyl rt={0.02} h={0.1} p={[0, 0.07, 0]} m={timber} seg={6} />
            <mesh material={bell} position={[0, -0.05, 0]}><coneGeometry args={[0.1, 0.18, 10]} /></mesh>
          </group>
        ))}
        {[-1, 1].map((a) => [-1, 1].map((b) => (
          <group key={`c${a}${b}`} position={[a * 2.38, 1.72, b * 2.38]}>
            <Cyl rt={0.015} h={0.14} p={[0, 0.08, 0]} m={timber} seg={5} />
            <mesh material={bell} position={[0, -0.05, 0]}><coneGeometry args={[0.1, 0.2, 10]} /></mesh>
          </group>
        )))}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.7, 3.5, 1.78]}>
            <mesh material={bell} position={[0, -0.05, 0]}><coneGeometry args={[0.09, 0.16, 10]} /></mesh>
          </group>
        ))}
      </group></group>
    );
  }

  /* ---------- the perimeter range (local frame: courtyard at z<CI, outer face at z=CO) ---------- */
  function wedgeGeo(len, yb, e) {
    const sh = new THREE.Shape();
    sh.moveTo(CI, yb); sh.lineTo(CO, yb); sh.lineTo(CO, 1.0 + e); sh.lineTo(CI, 0.8 + e); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    return g;
  }
  function Seg({ x0, x1, e = 0, yb = 0, roof = true, balcony = false, windows = true }) {
    const M = useM();
    const len = x1 - x0;
    const cx = (x0 + x1) / 2;
    const geo = useMemo(() => wedgeGeo(len, yb, e), [len, yb, e]);
    const brick = M.mat('brick', 0.8, 0.8, { color: WALLB });
    const tin = M.plain('#9a4a40', { roughness: 0.7, metalness: 0.15 });
    const seam = M.plain('#a85d52', { roughness: 0.6, metalness: 0.2 });
    const patch = M.plain('#a88784', { roughness: 0.8 });
    const timber = M.plain('#3a2416', { roughness: 0.8 });
    const slope = Math.atan2(0.5, CO - CI);
    const nSeam = Math.max(2, Math.round(len / 0.55));
    const nWin = Math.max(1, Math.floor(len / 2.4));
    const nBr =Math.max(2, Math.round(len / 1.1));
    const iron = M.plain('#3b3b3d', { metalness: 0.6, roughness: 0.5 });
    return (
      <group>
        <mesh geometry={geo} material={brick} position={[cx, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow />
        {roof && (
          <group position={[cx, 0.98 + e, (CI + CO) / 2]} rotation={[-slope, 0, 0]}>
            <Box s={[len + 0.1, 0.07, 1.55]} m={tin} />
            {[0, 1, 2].map((i) => <Box key={`p${i}`} s={[0.5 + rnd(i + x0 * 3 + 50) * 0.9, 0.012, 0.4 + rnd(i + 70 + len) * 0.5]} p={[(rnd(i + 11 + x0 * 7) - 0.5) * len * 0.8, 0.04, (rnd(i + 33 + len) - 0.5) * 1.0]} m={patch} cast={false} />)}
            {Array.from({ length: nSeam + 1 }, (_, i) => <Box key={i} s={[0.05, 0.05, 1.55]} p={[-len / 2 + (len * i) / nSeam, 0.055, 0]} m={seam} cast={false} />)}
          </group>
        )}
        {/* timber brackets under the eave, outer side */}
        {Array.from({ length: nBr }, (_, i) => {
          const x = x0 + (len * (i + 0.5)) / nBr;
          return <Box key={i} s={[0.07, 0.34, 0.07]} p={[x, 0.86 + e, CO + 0.1]} r={[0.6, 0, 0]} m={timber} cast={false} />;
        })}
        {windows && Array.from({ length: nWin }, (_, i) => {
          const x = x0 + (len * (i + 0.5)) / nWin;
          return (
            <group key={i}>
              <LatticeWindow p={[x, 0.5 + e * 0.5, CO + 0.01]} w={0.36} h={0.34} bars={4} />
              {/* inner side: low dark doorway to a priest's room */}
              <group rotation={[0, Math.PI, 0]}>
                <Box s={[0.7, 0.8, 0.06]} p={[-x, 0.42, -CI + 0.02]} m={M.plain('#1c120c')} cast={false} />
                <Box s={[0.84, 0.08, 0.1]} p={[-x, 0.85, -CI + 0.03]} m={timber} cast={false} />
              </group>
            </group>
          );
        })}
        {balcony && (
          <group>
            <Box s={[len, 0.1, 0.6]} p={[cx, 1.42, CI - 0.3]} m={timber} />
            <Box s={[len, 0.05, 0.05]} p={[cx, 1.95, CI - 0.58]} m={iron} cast={false} />
            <Box s={[len, 0.04, 0.04]} p={[cx, 1.72, CI - 0.58]} m={iron} cast={false} />
            {Array.from({ length: Math.round(len / 0.45) + 1 }, (_, i) => <Box key={i} s={[0.04, 0.5, 0.04]} p={[x0 + (len * i) / Math.round(len / 0.45), 1.7, CI - 0.58]} m={iron} cast={false} />)}
            {[0, 1, 2].map((i) => (
              <group key={i} rotation={[0, Math.PI, 0]}>
                <LatticeWindow p={[-(x0 + (len * (i + 0.5)) / 3), 2.0, -CI + 0.01]} w={0.5} h={0.5} bars={4} />
              </group>
            ))}
          </group>
        )}
      </group>
    );
  }
  function Range() {
    const M = useM();
    return (
      <group>
        {/* +z (front) range with the entrance gate in the middle */}
        <group>
          <Seg x0={-6.35} x1={-0.95} />
          <Seg x0={0.95} x1={6.35} />
          <Seg x0={-0.95} x1={0.95} yb={0.78} windows={false} />
        </group>
        <group rotation={[0, Math.PI, 0]}><Seg x0={-6.35} x1={6.35} /></group>
        <group rotation={[0, Math.PI / 2, 0]}><Seg x0={-CI} x1={CI} /></group>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <Seg x0={-CI} x1={-0.6} e={0.7} balcony windows />
          <Seg x0={-0.6} x1={CI} />
        </group>
        {/* gate: timber posts and a dark passage */}
        {[-1, 1].map((k) => <Box key={k} s={[0.18, 0.8, 0.18]} p={[k * 0.95, 0.4, CO - 0.1]} m={M.plain('#3a2416')} />)}
        <Box s={[2.3, 0.14, 0.34]} p={[0, 0.8, CO - 0.12]} m={M.plain('#4a2c18', { roughness: 0.7 })} />
        <Box s={[2.5, 0.06, 0.4]} p={[0, 0.9, CO - 0.12]} m={M.plain('#2d1a0e')} />
      </group>
    );
  }

  /* ---------- courtyard furniture ---------- */
  function Trident3({ p, h = 6.0 }) {
    const M = useM();
    const fe = M.plain('#2b2a2a', { metalness: 0.75, roughness: 0.45 });
    return (
      <group position={p}>
        <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={M.mat('stone', 1, 1, { color: '#b9b0a2' })} />
        <Cyl rt={0.06} rb={0.08} h={h} p={[0, h / 2 + 0.3, 0]} m={fe} seg={8} />
        <Cyl rt={0.09} rb={0.09} h={0.05} p={[0, 0.3 + h * 0.55, 0]} m={fe} seg={8} />
        <group position={[0, h + 0.3, 0]}>
          <mesh material={fe} position={[0, 0.38, 0]}><coneGeometry args={[0.09, 0.8, 6]} /></mesh>
          {[-1, 1].map((k) => (
            <group key={k}>
              <Cyl rt={0.05} h={0.44} p={[k * 0.46, 0.2, 0]} m={fe} seg={6} />
              <mesh material={fe} position={[k * 0.46, 0.64, 0]}><coneGeometry args={[0.08, 0.42, 6]} /></mesh>
            </group>
          ))}
          <mesh material={fe} position={[0, 0.02, 0]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.46, 0.05, 6, 20, Math.PI]} /></mesh>
          <Box s={[0.2, 0.18, 0.012]} p={[0.18, -0.3, 0]} m={M.plain('#a82226')} cast={false} />
        </group>
      </group>
    );
  }

  function WhiteShrine({ p }) {
    const M = useM();
    const wh = M.plain('#f3efe6', { roughness: 0.85 });
    return (
      <group position={p} rotation={[0, 0.25, 0]}>
        <Box s={[1.05, 0.2, 1.05]} p={[0, 0.1, 0]} m={M.mat('stone', 1, 1, { color: '#b9b0a2' })} />
        <Box s={[0.9, 0.85, 0.9]} p={[0, 0.62, 0]} m={wh} />
        <Box s={[0.46, 0.5, 0.06]} p={[0, 0.5, 0.45]} m={M.plain('#1a0f0a')} cast={false} />
        <mesh position={[0, 0.75, 0.45]} material={M.plain('#1a0f0a')}><cylinderGeometry args={[0.23, 0.23, 0.06, 14, 1, false, 0, Math.PI]} /></mesh>
        <Box s={[1.0, 0.07, 1.0]} p={[0, 1.07, 0]} m={wh} />
        <mesh position={[0, 1.1, 0]} material={wh} castShadow><sphereGeometry args={[0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.03} rb={0.05} h={0.2} p={[0, 1.6, 0]} m={M.gold} seg={8} />
        <mesh position={[0, 1.78, 0]} material={M.gold}><coneGeometry args={[0.04, 0.2, 6]} /></mesh>
        {[-0.14, 0.14].map((x) => <Cyl key={x} rt={0.03} h={0.06} p={[x, 0.23, 0.55]} m={M.plain('#b3262a')} seg={6} />)}
      </group>
    );
  }

  const PEOPLE = [
    [-2.0, 3.9, '#c8302f'], [-1.45, 3.7, '#2f7d4e'], [-0.9, 4.15, '#d9892a'], [-0.35, 3.85, '#c8302f'], [0.45, 4.1, '#2f5d9e'],
    [1.0, 3.75, '#b3262a'], [1.6, 4.05, '#e0c040'], [2.05, 3.8, '#7a3f8a'], [-1.2, 3.45, '#2f5d9e'], [1.3, 3.5, '#2f7d4e'],
  ];
  function Devotees() {
    const M = useM();
    const skin = M.plain('#7a5236');
    return (
      <group>
        {PEOPLE.map(([x, z, c], i) => (
          <group key={i} position={[x, 0.04, z]}>
            <Cyl rt={0.1} rb={0.15} h={0.62} p={[0, 0.31, 0]} m={M.plain(c, { roughness: 0.95 })} seg={8} />
            <Ball rad={0.09} p={[0, 0.72, 0]} m={skin} />
            <Ball rad={0.1} p={[0, 0.76, -0.01]} sc={[1, 0.7, 1]} m={M.plain('#1b1210')} />
          </group>
        ))}
      </group>
    );
  }

  function Main() {
    const M = useM();
    const lion = M.plain('#8c6b34', { metalness: 0.7, roughness: 0.45 });
    return (
      <group>
        {/* paved courtyard */}
        <Box s={[CI * 2 + 0.2, 0.05, CI * 2 + 0.2]} p={[0, 0.025, 0]} m={M.plain('#a89d8a', { roughness: 1 })} cast={false} />
        <Pagoda />
        <Range />
        <Trident3 p={[4.0, 0, 1.2]} />
        <WhiteShrine p={[-3.8, 0.05, 3.4]} />
        {/* paved path from the gate to the plinth */}
        <Box s={[1.5, 0.04, CO - 2.7]} p={[0, 0.05, (CO + 2.7) / 2]} m={M.plain('#8a8070', { roughness: 1 })} cast={false} />
        {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[1.3, 0.012, 0.02]} p={[0, 0.076, 2.9 + i * 0.6]} m={M.plain('#6f6657')} cast={false} />)}
        {/* stone and brass details: sindoor-smeared deity stones, bell post, brass lamps */}
        {[[-4.1, 0.1, 0.6], [-4.3, 0.1, -0.4], [4.2, 0.1, -2.6]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <Box s={[0.5, 0.22, 0.4]} p={[0, 0.11, 0]} m={M.mat('stone', 1, 1, { color: '#a89f90' })} />
            <Box s={[0.28, 0.5, 0.2]} p={[0, 0.45, 0]} r={[0, 0, 0.05 * (i - 1)]} m={M.plain('#8a3a2a', { roughness: 0.9 })} />
          </group>
        ))}
        <group position={[-2.6, 0.05, 4.2]}>
          {[-1, 1].map((k) => <Box key={k} s={[0.1, 1.5, 0.1]} p={[k * 0.45, 0.75, 0]} m={M.plain('#3a2416')} />)}
          <Box s={[1.1, 0.1, 0.1]} p={[0, 1.5, 0]} m={M.plain('#3a2416')} />
          <mesh position={[0, 1.25, 0]} material={M.plain('#c99a35', { metalness: 0.8, roughness: 0.35 })}><coneGeometry args={[0.2, 0.34, 12]} /></mesh>
        </group>
        {[[-0.9, 3.0], [0.9, 3.0]].map(([x, z], i) => (
          <group key={i} position={[x, 0.05, z + 1.1]}>
            <Cyl rt={0.14} rb={0.1} h={0.18} p={[0, 0.09, 0]} m={M.plain('#c99a35', { metalness: 0.8, roughness: 0.35 })} seg={10} />
            <Cyl rt={0.05} h={0.3} p={[0, 0.33, 0]} m={M.plain('#c99a35', { metalness: 0.8, roughness: 0.35 })} seg={8} />
          </group>
        ))}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.5, 0.3, 3.0]} scale={1.7}><Lion m={lion} /></group>
        ))}
        <Devotees />
        {/* offering lamps and the glow of the dark sanctum veranda */}
        <pointLight position={[0, 1.3, 2.2]} intensity={0.8} distance={4} color="#ffb060" />
        {[-0.5, 0, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.22, 3.1]}><sphereGeometry args={[0.045, 8, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
        ))}
        <Frame s={[11.6, 11.0, 11.4]} p={[0, 5.5, 0]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(190, 190, 120, 120);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      const col = [];
      const cA = new THREE.Color('#6f9a3a');
      const cB = new THREE.Color('#9a7d52');
      const cC = new THREE.Color('#4f6e32');
      const cS = new THREE.Color('#8f8b66');
      const cE = new THREE.Color('#9bb852');
      const cD = new THREE.Color('#aebfcc');
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = hgt(x, z);
        pos.setY(i, y - 0.05);
        const d = Math.hypot(x, z);
        const t = clamp((d - 12) / 5, 0, 1);
        const n = Math.sin(x * 0.9) * Math.sin(z * 0.8);
        tmp.copy(cS).lerp(cA, t);
        tmp.lerp(cC, clamp(0.5 + n * 0.5, 0, 1) * 0.5 * t);
        const frac = y / 1.3 - Math.round(y / 1.3);
        tmp.lerp(cB, clamp(Math.abs(frac) * 1.6, 0, 0.7) * t);
        if (Math.round(y / 1.3) % 2) tmp.lerp(cE, 0.55 * t);
        tmp.lerp(cD, clamp((d - 34) / 40, 0, 0.9));
        col.push(tmp.r, tmp.g, tmp.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  function Limb({ a, b, r0, r1, m }) {
    const { q, len, mid } = useMemo(() => {
      const va = new THREE.Vector3(...a);
      const vb = new THREE.Vector3(...b);
      const d = vb.clone().sub(va);
      const l = d.length();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { q: qq, len: l, mid: va.clone().add(vb).multiplyScalar(0.5).toArray() };
    }, [a, b]);
    return <mesh position={mid} quaternion={q} material={m} castShadow><cylinderGeometry args={[r1, r0, len, 6]} /></mesh>;
  }
  function Peepal({ p }) {
    const M = useM();
    const bark = M.plain('#4a382a', { roughness: 1 });
    const leaf = M.plain('#33552c', { roughness: 1 });
    const leaf2 = M.plain('#456b34', { roughness: 1 });
    const P = (t) => [5.6 * t, 5.0 + 2.9 * t - 1.7 * t * t, 1.8 * t];
    const ts = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const canopy = useMemo(() => Array.from({ length: 16 }, (_, i) => {
      const t = 0.3 + (i / 15) * 0.78;
      const c = P(Math.min(t, 1.05));
      return { x: c[0] + (rnd(i + 5) - 0.5) * 0.9, y: c[1] - 0.45 + (rnd(i + 9) - 0.5) * 0.7, z: c[2] + (rnd(i + 13) - 0.5) * 1.8, r: 0.65 + rnd(i + 17) * 0.45 };
    }), []);
    return (
      <group position={p}>
        <Cyl rt={0.34} rb={0.6} h={5} p={[0, 2.5, 0]} r={[0, 0, -0.04]} m={bark} seg={9} />
        {/* the heavy limb reaching over the courtyard, carrying a dense leaf canopy */}
        {ts.slice(0, -1).map((t, i) => <Limb key={i} a={P(t)} b={P(ts[i + 1])} r0={0.3 - i * 0.045} r1={0.3 - (i + 1) * 0.045} m={bark} />)}
        {canopy.map((c, i) => <Ball key={i} rad={c.r} p={[c.x, c.y, c.z]} sc={[1.25, 0.7, 1.05]} m={i % 2 ? leaf : leaf2} />)}
        {/* crown at the trunk top */}
        {[[0.4, 5.6, 0.2, 1.5], [-1.0, 5.4, -0.5, 1.2], [0.9, 6.3, -0.7, 1.1], [-0.4, 6.4, 0.7, 1.1], [1.6, 5.9, 0.3, 1.0]].map(([x, y, z, r], i) => <Ball key={`k${i}`} rad={r} p={[x, y, z]} sc={[1.2, 0.8, 1.1]} m={i % 2 ? leaf : leaf2} />)}
      </group>
    );
  }
  /* eucalyptus: tall pale trunk with a full, drooping, blue-green crown */
  function Euca({ p, h = 8, s = 1 }) {
    const M = useM();
    const lf = M.plain('#3f5c3f', { roughness: 1 });
    const lf2 = M.plain('#4d6a47', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.07} rb={0.17} h={h} p={[0, h / 2, 0]} r={[0, 0, 0.03]} m={M.plain('#a29c88', { roughness: 1 })} seg={6} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Ball key={i} rad={0.75} p={[Math.sin(i * 2.4) * 0.8, h - 0.2 - i * 0.55, Math.cos(i * 2.4) * 0.7]} sc={[1, 1.3, 1]} m={i % 2 ? lf : lf2} />
        ))}
      </group>
    );
  }
  /* schima / hill broadleaf: dense dark rounded crown */
  function Schima({ p, s = 1 }) {
    const M = useM();
    const lf = M.plain('#2f5a30', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.14} rb={0.25} h={2.0} p={[0, 1.0, 0]} m={M.plain('#5a4636', { roughness: 1 })} seg={6} />
        <Ball rad={1.5} p={[0, 3.0, 0]} sc={[1.25, 0.95, 1.15]} m={lf} />
        <Ball rad={1.0} p={[1.0, 2.6, 0.5]} sc={[1, 0.8, 1]} m={M.plain('#3d6a3a', { roughness: 1 })} />
        <Ball rad={0.9} p={[-1.0, 2.7, -0.3]} sc={[1, 0.8, 1]} m={M.plain('#376236', { roughness: 1 })} />
      </group>
    );
  }
  /* chir pine: layered dark conical crown */
  function Pine({ p, s = 1 }) {
    const M = useM();
    const lf = M.plain('#2b4d2c', { roughness: 1 });
    const lf2 = M.plain('#35592f', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.12} rb={0.2} h={2.4} p={[0, 1.2, 0]} m={M.plain('#4e3b2c', { roughness: 1 })} seg={6} />
        {[[1.35, 2.1, 1.7], [1.1, 3.1, 1.5], [0.85, 4.0, 1.3], [0.55, 4.8, 1.1]].map(([r, y, h], i) => (
          <mesh key={i} position={[0, y, 0]} material={i % 2 ? lf2 : lf} castShadow><coneGeometry args={[r, h, 8]} /></mesh>
        ))}
      </group>
    );
  }

  function TeaShop({ p, r = 0, w = 2.6, d = 1.6, wall = '#d8c9a8', roof = '#3d6b86' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, 1.3, d]} p={[0, 0.65, 0]} m={M.mat('plaster', 1, 1, { color: wall })} />
        <Box s={[w * 0.6, 0.75, 0.06]} p={[0, 0.7, d / 2 + 0.01]} m={M.plain('#2a1a10')} cast={false} />
        <Box s={[w + 0.3, 0.06, d + 0.6]} p={[0, 1.42, 0.05]} r={[0.12, 0, 0]} m={M.plain(roof, { metalness: 0.3, roughness: 0.6 })} />
        <Box s={[w * 0.8, 0.07, 0.4]} p={[0, 0.38, d / 2 + 0.35]} m={M.plain('#6a4a2a')} />
        <mesh position={[0.5, 0.95, d / 2 + 0.04]}><boxGeometry args={[0.16, 0.1, 0.02]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
      </group>
    );
  }

  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(150, 32, 20);
      const pos = g.attributes.position;
      const hz = new THREE.Color('#d3e0ea');
      const mid = new THREE.Color('#9cc3e6');
      const top = new THREE.Color('#4d8bd4');
      const tmp = new THREE.Color();
      const col = [];
      for (let i = 0; i < pos.count; i += 1) {
        const e = pos.getY(i) / 150;
        if (e < 0.04) tmp.copy(hz);
        else if (e < 0.35) tmp.copy(hz).lerp(mid, clamp((e - 0.04) / 0.31, 0, 1));
        else tmp.copy(mid).lerp(top, clamp((e - 0.35) / 0.55, 0, 1));
        col.push(tmp.r, tmp.g, tmp.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, 6, 0]} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>;
  }
  /* long layered ridge bands (open cylinders, noisy crest line, vertex-coloured, hazier with distance) */
  function Band({ R, base, top, amp, seed, c0, c1, snow = false, a0 = 0, a1 = Math.PI * 2 }) {
    const geo = useMemo(() => {
      const segs = 160;
      const rows = 6;
      const g = new THREE.CylinderGeometry(R, R, 1, segs, rows, true, a0, a1 - a0);
      const pos = g.attributes.position;
      const col = [];
      const cc0 = new THREE.Color(c0);
      const cc1 = new THREE.Color(c1);
      const sn = new THREE.Color('#f4f8fc');
      const sh = new THREE.Color('#aebfd2');
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        let ang = Math.atan2(x, z); if (ang < 0) ang += Math.PI * 2;
        const v = pos.getY(i) + 0.5; // 0 bottom .. 1 top
        let crest = top + (Math.sin(ang * 7 + seed) * 0.5 + Math.sin(ang * 17 + seed * 2.3) * 0.3 + Math.sin(ang * 31 + seed * 1.7) * 0.2) * amp;
        if (snow) {
          const k = Math.abs(Math.sin(ang * 5.5 + seed)) * 0.6 + Math.abs(Math.sin(ang * 13 + seed * 1.9)) * 0.4;
          const env = clamp(1 - Math.abs(ang - Math.PI) / 1.25, 0, 1);
          crest = top - 8 + k * amp * (0.2 + env) * 1.1 + env * 6;
        }
        pos.setY(i, base + v * (crest - base));
        if (snow) {
          const hgtv = base + v * (crest - base);
          tmp.copy(sh).lerp(cc0, clamp((top - hgtv) / 8, 0, 1));
          if (hgtv > top + 1) tmp.lerp(sn, clamp((hgtv - top - 1) / 5, 0, 1));
        } else {
          tmp.copy(cc0).lerp(cc1, v);
        }
        col.push(tmp.r, tmp.g, tmp.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} toneMapped={false} /></mesh>;
  }
  function Ridges() {
    return (
      <group>
        {/* four hazy ridge bands, nearest darkest green-blue, farthest pale blue-grey */}
        <Band R={62} base={-34} top={-9} amp={5} seed={0.3} c0="#4b6b52" c1="#6b8a70" />
        <Band R={78} base={-34} top={-6} amp={6} seed={1.9} c0="#6b8791" c1="#8aa4ad" />
        <Band R={96} base={-34} top={-2} amp={7} seed={3.1} c0="#8aa0b4" c1="#a7bacb" />
        <Band R={116} base={-34} top={3} amp={8} seed={4.4} c0="#a9bad0" c1="#c4d2e0" />
        {/* thin snow range to the north (-z) only */}
        <Band R={140} base={-34} top={5} amp={11} seed={5.7} c0="#8da2bd" c1="#9db1c9" snow a0={Math.PI - 1.25} a1={Math.PI + 1.25} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const slopeTrees = useMemo(() => {
      const out = [];
      for (let i = 0; i < 32; i += 1) {
        const a = rnd(i + 200) * Math.PI * 2;
        const d = 15 + rnd(i + 300) * 22;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        if (z > 6 && Math.abs(x) < 6) continue;
        if (z > 0 && x > 0 && Math.abs(a - 0.93) < 0.5) continue; // keep the default camera line clear
        out.push({ x, z, y: hgt(x, z), k: i % 3, s: 0.8 + rnd(i + 400) * 0.7 });
      }
      return out;
    }, []);
    const houses = useMemo(() => Array.from({ length: 9 }, (_, i) => {
      const a = (-0.3 + rnd(i + 500) * 3.6);
      const d = 24 + rnd(i + 510) * 18;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      return { x, z, y: hgt(x, z), r: rnd(i + 520) * 3 };
    }), []);
    const pave = M.plain('#9d9384', { roughness: 1 });
    return (
      <group>
        <Sky />
        <Terrain />
        {/* paved apron round the temple range and the approach track from the gate */}
        <Box s={[14.4, 0.04, 14.4]} p={[0, 0.0, 0]} m={pave} cast={false} />
        <Box s={[4.2, 0.04, 9]} p={[0, 0.005, 11]} m={pave} cast={false} />
        <Box s={[24, 0.03, 4]} p={[1, 0.0, 14]} m={M.plain('#8c8266')} cast={false} />
        {/* old peepal over the courtyard from the upper left, eucalyptus and pines around */}
        <Peepal p={[-9.6, 0, -3.8]} />
        <Euca p={[9.4, 0, -6.6]} h={11} />
        <Euca p={[11, 0, -5]} h={9} s={0.9} />
        <Euca p={[-11.5, 0, -2]} h={10} s={1.0} />
        <Schima p={[-10.8, 0, -9]} s={1.2} />
        <Schima p={[10.5, 0, -9]} s={1.3} />
        {/* a few tea shops on the approach side */}
        <TeaShop p={[9, 0, 14.5]} r={-0.15} wall="#e1d3b0" roof="#3d6b86" />
        <TeaShop p={[12, 0, 12.6]} r={0.2} w={2.2} wall="#cdbfa0" roof="#a8483f" />
        <TeaShop p={[-6.5, 0, 12.2]} r={0.1} w={2.8} wall="#d9b99a" roof="#5a7f95" />
        {slopeTrees.map((q, i) => (q.k === 0
          ? <Schima key={i} p={[q.x, q.y, q.z]} s={q.s * 1.3} />
          : q.k === 1 ? <Euca key={i} p={[q.x, q.y, q.z]} h={6 + q.s * 3} s={q.s} />
            : <Pine key={i} p={[q.x, q.y, q.z]} s={q.s * 1.2} />))}
        {/* scattered hill houses far below */}
        {houses.map((q, i) => (
          <group key={i} position={[q.x, q.y, q.z]} rotation={[0, q.r, 0]}>
            <Box s={[2, 1.2, 1.5]} p={[0, 0.6, 0]} m={M.plain('#d9cdb0')} />
            <Box s={[2.3, 0.1, 1.8]} p={[0, 1.3, 0]} m={M.plain(i % 2 ? '#a8483f' : '#6d8aa0', { metalness: 0.3 })} />
          </group>
        ))}
        <Ridges />
      </group>
    );
  }

  return { 'palanchok-bhagawati': { Main, Env } };
}
