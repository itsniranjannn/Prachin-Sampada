// Changu Narayan (Changunarayan, Bhaktapur): a squat two-roofed Newar pagoda of warm red-orange brick with dark timber,
// on one broad grey stone plinth (walkway around the walls), four triple-door faces with gilded toranas under tilted
// figure struts, stone lions / sarabhas / caparisoned elephants on pedestals at the stair heads, a kneeling Garuda and
// chakra + shankha pillars on axis in front of the main door, in an open brick-paved hilltop village courtyard.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, Frame, THREE } = K;

  const RED = '#fff0e2'; // tint for the brick texture (warm red-orange)
  const TILE = '#e9b48c'; // muted terracotta tile
  const TIMBER = '#4a3020';
  const P = Math.PI;

  /* ---------- shared bits ---------- */
  const brick = (M, rx, ry, c = RED) => M.mat('brick', rx, ry, { color: c, emissive: '#7a3418', emissiveIntensity: 0.55 });
  const tile = (M, c = TILE) => M.mat('roof', 10, 10, { color: c, roughness: 1 });
  const stoneM = (M) => M.plain('#7f786c', { roughness: 0.98 });
  const stoneL = (M) => M.plain('#8f877a', { roughness: 0.98 });
  const goldM = (M) => M.plain('#d9ae2e', { metalness: 0.45, roughness: 0.55, emissive: '#4a3400', emissiveIntensity: 0.08 });
  const timber = (M) => M.plain(TIMBER, { roughness: 0.9 });

  /* gilded torana over a door, drawn on the z=0 plane facing +z */
  function Torana({ p, s = 1 }) {
    const M = useM();
    const gold = goldM(M);
    return (
      <group position={p} scale={s}>
        <mesh material={gold} castShadow><torusGeometry args={[0.3, 0.05, 8, 24, P]} /></mesh>
        <mesh material={gold}><torusGeometry args={[0.21, 0.03, 8, 20, P]} /></mesh>
        <Box s={[0.5, 0.26, 0.02]} p={[0, 0.1, -0.01]} m={M.plain('#4a2a1c')} cast={false} />
        <Box s={[0.74, 0.06, 0.08]} p={[0, -0.02, 0.01]} m={gold} cast={false} />
        <Box s={[0.1, 0.15, 0.05]} p={[0, 0.07, 0.03]} m={gold} cast={false} />
        <Ball rad={0.055} p={[0, 0.19, 0.035]} m={gold} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.06, 0.1, 0.04]} p={[k * 0.14, 0.05, 0.03]} m={gold} cast={false} />
            <Ball rad={0.065} p={[k * 0.3, 0.02, 0.03]} m={gold} />
            <Ball rad={0.04} p={[k * 0.22, 0.2, 0.03]} m={gold} />
          </group>
        ))}
        <Ball rad={0.075} p={[0, 0.36, 0.035]} sc={[1, 0.85, 0.7]} m={gold} />
        <mesh position={[0, 0.47, 0.02]} material={gold}><coneGeometry args={[0.035, 0.14, 8]} /></mesh>
      </group>
    );
  }

  /* carved timber window with a dark frame and a small gilded canopy */
  function CarvedWindow({ p, w = 0.3, h = 0.4 }) {
    const M = useM();
    const gold = goldM(M);
    return (
      <group position={p}>
        <Box s={[w + 0.12, h + 0.12, 0.06]} m={M.plain('#2e1a10')} cast={false} />
        <Box s={[w, h, 0.1]} p={[0, 0, 0.03]} m={M.plain('#7a4a2a')} />
        {[-1, 1].map((i) => <Box key={i} s={[0.025, h * 0.9, 0.04]} p={[i * w * 0.28, 0, 0.09]} m={gold} cast={false} />)}
        <Box s={[w + 0.2, 0.05, 0.16]} p={[0, h / 2 + 0.09, 0.07]} m={gold} cast={false} />
      </group>
    );
  }

  /* tilted figure struts under an eave on the +z side: dark timber post, gilded head and torso, dark bracket on top */
  function Struts({ half, y0, y1, out, n, w = 0.22, brackets = true }) {
    const M = useM();
    const wood = M.plain('#b02a1c', { roughness: 0.8 });
    const dark = timber(M);
    const gold = goldM(M);
    const L = Math.hypot(y1 - y0, out);
    const th = Math.atan2(out, y1 - y0);
    const items = [];
    for (let i = 0; i < n; i += 1) {
      const x = -half + 0.1 + (i * (2 * half - 0.2)) / (n - 1);
      items.push(
        <group key={i}>
          <group position={[x, (y0 + y1) / 2, half + out / 2]} rotation={[th, 0, 0]}>
            <Box s={[w, L, 0.16]} m={wood} cast={false} />
            <Box s={[w * 0.7, L * 0.42, 0.05]} p={[0, -L * 0.05, 0.1]} m={gold} cast={false} />
            <Ball rad={0.075} p={[0, L * 0.38, 0.1]} m={gold} />
          </group>
          {brackets && <Box s={[w * 0.9, 0.07, 0.2]} p={[x, y1 - 0.04, half + out - 0.02]} m={dark} cast={false} />}
        </group>,
      );
    }
    return <group>{items}</group>;
  }

  /* ---------- sculpture ---------- */
  function SLion({ m, wings = false }) {
    const M = useM();
    return (
      <group>
        <Ball rad={0.24} sc={[1, 1.15, 1.15]} p={[0, 0.32, -0.17]} m={m} />
        <Box s={[0.34, 0.52, 0.28]} p={[0, 0.5, 0.06]} m={m} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Cyl rt={0.055} rb={0.065} h={0.4} p={[k * 0.11, 0.2, 0.2]} m={m} seg={8} />
            <Box s={[0.11, 0.05, 0.16]} p={[k * 0.11, 0.025, 0.25]} m={m} />
            <Box s={[0.13, 0.05, 0.2]} p={[k * 0.15, 0.025, -0.2]} m={m} />
            <Ball rad={0.045} p={[k * 0.15, 0.95, 0.08]} m={m} />
          </group>
        ))}
        <Ball rad={0.36} sc={[1.05, 1.05, 0.7]} p={[0, 0.8, 0.0]} m={m} />
        <Ball rad={0.2} p={[0, 0.82, 0.16]} m={m} />
        <Box s={[0.2, 0.12, 0.16]} p={[0, 0.74, 0.34]} m={m} />
        <Box s={[0.1, 0.045, 0.05]} p={[0, 0.8, 0.43]} m={M.dark} cast={false} />
        {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.02} p={[k * 0.09, 0.9, 0.33]} m={M.dark} />)}
        {[-1, 1].map((k) => <Ball key={`r${k}`} rad={0.05} p={[k * 0.14, 0.97, 0.08]} m={m} />)}
        <Cyl rt={0.02} rb={0.03} h={0.4} p={[0, 0.5, -0.42]} r={[-0.5, 0, 0]} m={m} seg={6} />
        {wings && [-1, 1].map((k) => <Box key={`w${k}`} s={[0.03, 0.4, 0.34]} p={[k * 0.2, 0.7, -0.14]} r={[0.2, 0, k * 0.45]} m={m} />)}
        {wings && <mesh position={[0, 1.0, 0.18]} rotation={[-0.3, 0, 0]} material={m}><coneGeometry args={[0.035, 0.2, 8]} /></mesh>}
      </group>
    );
  }

  function SElephant({ m }) {
    const M = useM();
    const cloth = M.plain('#8a8378', { roughness: 0.95 });
    const gold = goldM(M);
    return (
      <group>
        <Ball rad={0.34} sc={[0.85, 0.85, 1.45]} p={[0, 0.58, -0.08]} m={m} />
        {[-1, 1].map((k) => [0.2, -0.34].map((z) => <Cyl key={`${k}${z}`} rt={0.085} rb={0.095} h={0.42} p={[k * 0.17, 0.21, z]} m={m} seg={8} />))}
        <Ball rad={0.22} p={[0, 0.74, 0.4]} m={m} />
        {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.2} sc={[0.3, 1.1, 0.95]} p={[k * 0.26, 0.74, 0.36]} m={m} />)}
        <Cyl rt={0.09} rb={0.13} h={0.4} p={[0, 0.5, 0.6]} r={[-0.15, 0, 0]} m={m} seg={8} />
        <Cyl rt={0.05} rb={0.09} h={0.36} p={[0, 0.2, 0.74]} r={[-0.5, 0, 0]} m={m} seg={8} />
        {[-1, 1].map((k) => <mesh key={`t${k}`} position={[k * 0.1, 0.4, 0.68]} rotation={[1.2, 0, 0]} material={M.plain('#e8dfc8')}><coneGeometry args={[0.025, 0.2, 6]} /></mesh>)}
        {[-1, 1].map((k) => <Ball key={`y${k}`} rad={0.018} p={[k * 0.15, 0.8, 0.55]} m={M.dark} />)}
        {/* thick caparison cloth with gold trim, flaps and a gilded rope */}
        <Box s={[0.72, 0.1, 0.66]} p={[0, 0.9, -0.08]} m={cloth} />
        {[-1, 1].map((k) => <Box key={`f${k}`} s={[0.08, 0.34, 0.64]} p={[k * 0.36, 0.74, -0.08]} m={cloth} />)}
        {[-1, 1].map((k) => <Box key={`g${k}`} s={[0.09, 0.03, 0.66]} p={[k * 0.36, 0.56, -0.08]} m={gold} cast={false} />)}
        <Box s={[0.74, 0.035, 0.05]} p={[0, 0.96, 0.26]} m={gold} cast={false} />
        <Box s={[0.74, 0.035, 0.05]} p={[0, 0.96, -0.42]} m={gold} cast={false} />
        <Box s={[0.22, 0.2, 0.05]} p={[0, 0.86, 0.5]} m={cloth} />
        <Box s={[0.24, 0.03, 0.06]} p={[0, 0.76, 0.52]} m={gold} cast={false} />
        <Cyl rt={0.015} h={0.5} p={[0, 0.62, 0.15]} r={[0, 0, P / 2]} m={gold} seg={5} />
      </group>
    );
  }

  /* tall stepped pedestal (0.9) carrying a guardian; stands on the ground beside the stair */
  function Guardian({ p, kind }) {
    const M = useM();
    const st = stoneM(M);
    const lt = stoneL(M);
    return (
      <group position={p}>
        <Box s={[0.8, 0.14, 0.8]} p={[0, 0.07, 0]} m={st} />
        <Box s={[0.6, 0.56, 0.6]} p={[0, 0.42, 0]} m={lt} />
        <Box s={[0.7, 0.1, 0.7]} p={[0, 0.75, 0]} m={st} />
        <Box s={[0.78, 0.1, 0.78]} p={[0, 0.85, 0]} m={lt} />
        <group position={[0, 0.9, 0]} scale={1.05}>
          {kind === 'elephant' ? <SElephant m={lt} /> : <SLion m={lt} wings={kind === 'sarabha'} />}
        </group>
      </group>
    );
  }

  /* one face of the temple (+z); rotate the group for the other three */
  function Face({ guard }) {
    const M = useM();
    const st = stoneL(M);
    const dk = timber(M);
    const gold = goldM(M);
    const B = 0.65; // plinth top
    const roofY = 3.1;
    const frameC = M.plain('#8a5230', { roughness: 0.85 });
    return (
      <group>
        {/* dark timber corner posts */}
        {[-1, 1].map((k) => <Box key={`p${k}`} s={[0.1, 2.3, 0.1]} p={[k * 1.5, B + 1.15, 1.5]} m={dk} cast={false} />)}
        {/* central gilded door with timber frame */}
        <Box s={[1.0, 1.45, 0.05]} p={[0, B + 0.72, 1.51]} m={frameC} cast={false} />
        <Box s={[0.82, 1.35, 0.07]} p={[0, B + 0.67, 1.53]} m={gold} cast={false} />
        <Box s={[0.014, 1.3, 0.08]} p={[0, B + 0.67, 1.54]} m={M.plain('#5a3a08')} cast={false} />
        {[-1, 1].map((k) => <Box key={k} s={[0.3, 1.05, 0.03]} p={[k * 0.21, B + 0.66, 1.575]} m={M.plain('#e0b838', { metalness: 0.4, roughness: 0.6 })} cast={false} />)}
        <Torana p={[0, B + 1.5, 1.54]} s={1.4} />
        {/* flanking arched doors */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.82, 0, 1.5]}>
            <Box s={[0.42, 1.0, 0.05]} p={[0, B + 0.5, 0.01]} m={frameC} cast={false} />
            <Box s={[0.32, 0.78, 0.07]} p={[0, B + 0.4, 0.03]} m={M.plain('#3e2214')} cast={false} />
            <mesh position={[0, B + 0.79, 0.03]} material={M.plain('#3e2214')}><cylinderGeometry args={[0.16, 0.16, 0.07, 14, 1, false, 0, P]} /></mesh>
            <Box s={[0.38, 0.04, 0.09]} p={[0, B + 0.99, 0.03]} m={gold} cast={false} />
          </group>
        ))}
        {/* carved windows and niches */}
        {[-1, 1].map((k) => (
          <group key={`w${k}`}>
            <CarvedWindow p={[k * 1.2, B + 1.3, 1.52]} w={0.28} h={0.4} />
            <Box s={[0.3, 0.42, 0.06]} p={[k * 1.2, B + 0.5, 1.52]} m={frameC} cast={false} />
            <Box s={[0.13, 0.26, 0.06]} p={[k * 1.2, B + 0.48, 1.56]} m={gold} cast={false} />
          </group>
        ))}
        {/* gilded carved band between wall and struts */}
        <Box s={[3.06, 0.25, 0.09]} p={[0, 2.82, 1.52]} m={gold} cast={false} />
        <Box s={[3.06, 0.05, 0.11]} p={[0, 2.67, 1.52]} m={M.plain('#8a1f1a')} cast={false} />
        {/* dark bracket course, red struts (16) with gold heads, bracket row, roof edge */}
        <Box s={[3.0, 0.4, 0.04]} p={[0, 2.9, 1.5]} m={M.plain('#5a2a1c')} cast={false} />
        <Struts half={1.5} y0={2.2} y1={3.05} out={0.6} n={16} />
        <Box s={[4.3, 0.06, 0.12]} p={[0, 3.04, 2.1]} m={dk} cast={false} />
        <Box s={[4.5, 0.05, 0.2]} p={[0, roofY + 0.02, 2.22]} m={gold} cast={false} />
        {/* upper storey: windows, band, struts (12), rim */}
        {[-1, 1].map((k) => <CarvedWindow key={`u${k}`} p={[k * 0.62, 3.62, 1.1]} w={0.24} h={0.3} />)}
        <Box s={[2.2, 0.2, 0.06]} p={[0, 4.1, 1.12]} m={gold} cast={false} />
        <Struts half={1.1} y0={3.85} y1={4.35} out={0.45} n={12} brackets={false} w={0.2} />
        <Box s={[3.6, 0.06, 0.12]} p={[0, 4.4, 1.82]} m={dk} cast={false} />
        <Box s={[3.8, 0.05, 0.2]} p={[0, 4.42, 1.86]} m={gold} cast={false} />
        {/* broad low stair, 1.6 wide, 3 steps */}
        {[1, 2, 3].map((k) => <Box key={k} s={[1.6, 0.2167 * k, 0.3 * (4 - k)]} p={[0, 0.1083 * k, 2.7 + 0.15 * (4 - k)]} m={k % 2 ? st : stoneM(M)} />)}
        {/* guardians on tall stepped pedestals flanking the stair */}
        {[-1, 1].map((k) => <Guardian key={`g${k}`} p={[k * 1.4, 0, 3.25]} kind={guard} />)}
      </group>
    );
  }

  /* kneeling winged Garuda with folded hands, on a short thick stone base */
  function GarudaPillar({ p, r = 0 }) {
    const M = useM();
    const st = stoneL(M);
    const br = M.plain('#7a6a4a', { roughness: 0.75, metalness: 0.25 });
    const gold = goldM(M);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.95, 0.18, 0.95]} p={[0, 0.09, 0]} m={st} />
        <Box s={[0.72, 0.24, 0.72]} p={[0, 0.3, 0]} m={st} />
        <Cyl rt={0.2} rb={0.26} h={1.2} p={[0, 0.42 + 0.6, 0]} m={st} seg={8} />
        <Cyl rt={0.3} rb={0.2} h={0.14} p={[0, 1.69, 0]} m={st} seg={10} />
        <Box s={[0.56, 0.08, 0.56]} p={[0, 1.8, 0]} m={st} />
        <group position={[0, 1.84, 0]} scale={1.3}>
          <Box s={[0.16, 0.1, 0.36]} p={[0.1, 0.06, -0.08]} m={br} />
          <Box s={[0.16, 0.26, 0.16]} p={[-0.1, 0.2, 0.1]} m={br} r={[0.4, 0, 0]} />
          <Box s={[0.15, 0.08, 0.2]} p={[-0.1, 0.05, 0.22]} m={br} />
          <Box s={[0.2, 0.18, 0.2]} p={[0.1, 0.18, -0.12]} m={br} />
          <Box s={[0.28, 0.4, 0.17]} p={[0, 0.52, -0.04]} m={br} />
          <Box s={[0.3, 0.05, 0.19]} p={[0, 0.34, -0.04]} m={gold} cast={false} />
          <Ball rad={0.095} p={[0, 0.84, 0]} m={br} />
          <mesh position={[0, 0.82, 0.1]} rotation={[P / 2, 0, 0]} material={br}><coneGeometry args={[0.03, 0.09, 8]} /></mesh>
          <mesh position={[0, 1.02, 0]} material={gold}><coneGeometry args={[0.1, 0.24, 8]} /></mesh>
          <Cyl rt={0.1} rb={0.1} h={0.05} p={[0, 0.92, 0]} m={gold} seg={10} />
          {[-1, 1].map((k) => <Box key={k} s={[0.07, 0.07, 0.3]} p={[k * 0.12, 0.58, 0.14]} r={[0, k * -0.35, 0]} m={br} />)}
          <Ball rad={0.06} p={[0, 0.58, 0.3]} m={gold} />
          {[-1, 1].map((k) => (
            <group key={`w${k}`}>
              <Box s={[0.04, 0.62, 0.3]} p={[k * 0.22, 0.78, -0.16]} r={[0.2, 0, k * 0.5]} m={br} />
              <Box s={[0.05, 0.22, 0.26]} p={[k * 0.38, 1.04, -0.18]} r={[0.2, 0, k * 0.5]} m={gold} />
            </group>
          ))}
        </group>
      </group>
    );
  }

  /* square stone pillar with the chakra (disc) or shankha (conch) of Vishnu */
  function EmblemPillar({ p, kind }) {
    const M = useM();
    const st = stoneL(M);
    const gold = goldM(M);
    return (
      <group position={p}>
        <Box s={[0.6, 0.16, 0.6]} p={[0, 0.08, 0]} m={st} />
        <Box s={[0.44, 0.22, 0.44]} p={[0, 0.27, 0]} m={st} />
        <Box s={[0.26, 1.15, 0.26]} p={[0, 0.38 + 0.575, 0]} m={st} />
        <Box s={[0.36, 0.1, 0.36]} p={[0, 1.58, 0]} m={st} />
        {kind === 'chakra' && <Box s={[0.2, 0.5, 0.2]} p={[0, 1.88, 0]} m={st} />}
        {kind === 'chakra' ? (
          <group position={[0, 2.25, 0]}>
            <mesh material={gold}><torusGeometry args={[0.5, 0.07, 8, 32]} /></mesh>
            {[0, P / 4, P / 2, (3 * P) / 4].map((a, i) => <Box key={i} s={[1.0, 0.04, 0.04]} r={[0, 0, a]} m={gold} cast={false} />)}
            <Ball rad={0.1} m={gold} />
          </group>
        ) : (
          <group position={[0, 1.95, 0]} scale={1.4}>
            <mesh rotation={[0, 0, -0.35]} position={[0, 0.16, 0]} material={M.plain('#e4dccb', { roughness: 0.55 })}><coneGeometry args={[0.13, 0.46, 12]} /></mesh>
            <Ball rad={0.13} p={[0.04, -0.03, 0]} sc={[1, 0.85, 1]} m={M.plain('#e4dccb', { roughness: 0.55 })} />
          </group>
        )}
      </group>
    );
  }

  /* Manadeva (464 AD) inscription slab on a round lotus-and-snake base */
  function ManadevaPillar({ p }) {
    const M = useM();
    const st = stoneL(M);
    return (
      <group position={p}>
        <Cyl rt={0.36} rb={0.4} h={0.1} p={[0, 0.05, 0]} m={st} seg={20} />
        <Cyl rt={0.3} rb={0.34} h={0.12} p={[0, 0.16, 0]} m={st} seg={20} />
        <Ball rad={0.3} p={[0, 0.2, 0]} sc={[1, 0.45, 1]} m={st} />
        <Box s={[0.46, 1.5, 0.12]} p={[0, 0.95, 0]} m={M.plain('#766f64', { roughness: 0.95 })} />
        <Box s={[0.5, 0.06, 0.16]} p={[0, 1.72, 0]} m={st} />
        <Ball rad={0.07} p={[0, 0.32, 0.32]} m={M.plain('#c4281e')} />
      </group>
    );
  }

  /* darker hip ridges from each roof corner to the apex */
  function HipRidges({ w, y, h, m }) {
    const items = K.useMemo(() => [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => {
      const a = new THREE.Vector3(sx * w * 0.5, y + 0.06, sz * w * 0.5);
      const b = new THREE.Vector3(0, y + h + 0.04, 0);
      const d = b.clone().sub(a);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      return { pos: a.clone().add(b).multiplyScalar(0.5).toArray(), q: q.toArray(), len: d.length() };
    }), [w, y, h]);
    return <group>{items.map((it, i) => <mesh key={i} position={it.pos} quaternion={it.q} material={m}><boxGeometry args={[0.09, it.len, 0.09]} /></mesh>)}</group>;
  }

  /* ---------- MAIN ---------- */
  function ChanguMain() {
    const M = useM();
    const st = stoneL(M);
    const lamp = M.plain('#ffd27a', { emissive: '#ffa030', emissiveIntensity: 1.6 });
    const gold = goldM(M);
    const wall = brick(M, 4, 4, RED);
    const roofM = tile(M);
    const ridge = M.plain('#6a3420', { roughness: 0.9 });
    return (
      <group>
        {/* low stone walkway plinth, 0.65 high: kerb step, dark moulded base, body, cap */}
        <Box s={[5.9, 0.08, 5.9]} p={[0, 0.04, 0]} m={stoneM(M)} />
        <Box s={[5.5, 0.22, 5.5]} p={[0, 0.19, 0]} m={M.plain('#625c52', { roughness: 0.98 })} />
        <Box s={[5.4, 0.3, 5.4]} p={[0, 0.45, 0]} m={st} />
        <Box s={[5.5, 0.05, 5.5]} p={[0, 0.625, 0]} m={stoneM(M)} />
        {/* small pedestals along the plinth edge */}
        {[-1.8, 0, 1.8].map((x) => <Box key={`e${x}`} s={[0.3, 0.24, 0.3]} p={[x, 0.77, -2.5]} m={stoneM(M)} />)}
        {[-1.8, 0, 1.8].map((z) => [-1, 1].map((k) => <Box key={`s${z}${k}`} s={[0.3, 0.24, 0.3]} p={[k * 2.5, 0.77, z]} m={stoneM(M)} />))}
        {/* lower storey (2.3) and upper storey (1.3) of red-orange brick */}
        <Box s={[3.0, 2.3, 3.0]} p={[0, 0.65 + 1.15, 0]} m={wall} />
        <Box s={[2.2, 1.3, 2.2]} p={[0, 3.1 + 0.65, 0]} m={brick(M, 3, 3, RED)} />
        {/* soffits so the eaves read dark underneath */}
        <Box s={[4.4, 0.08, 4.4]} p={[0, 3.08, 0]} m={timber(M)} cast={false} />
        <Box s={[3.7, 0.08, 3.7]} p={[0, 4.38, 0]} m={timber(M)} cast={false} />
        {/* the two broad low roofs with darker hip ridges */}
        <Roof w={4.5} d={4.5} h={0.45} y={3.1} m={roofM} sag={1.3} lift={0.2} fascia={false} />
        <HipRidges w={4.5} y={3.1} h={0.45} m={ridge} />
        <Roof w={3.8} d={3.8} h={0.45} y={4.4} m={roofM} sag={1.3} lift={0.2} fascia={false} />
        <HipRidges w={3.8} y={4.4} h={0.45} m={ridge} />
        <Gajur y={4.82} s={0.85} />
        {/* gilded corner bells */}
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => (
          <group key={i}>
            <mesh position={[sx * 2.2, 3.0, sz * 2.2]} material={gold}><coneGeometry args={[0.06, 0.16, 8]} /></mesh>
            <mesh position={[sx * 1.85, 4.3, sz * 1.85]} material={gold}><coneGeometry args={[0.05, 0.14, 8]} /></mesh>
          </group>
        ))}
        {/* four faces: lions (front), elephants, sarabhas, elephants */}
        {['lion', 'elephant', 'sarabha', 'elephant'].map((g, k) => <group key={k} rotation={[0, k * (P / 2), 0]}><Face guard={g} /></group>)}
        {/* plinth-corner lamps (glow at dusk) */}
        {[[-2.5, 2.5], [2.5, 2.5], [-2.5, -2.5], [2.5, -2.5]].map(([x, z], i) => (
          <group key={`l${i}`} position={[x, 0.65, z]}>
            <Box s={[0.2, 0.3, 0.2]} p={[0, 0.15, 0]} m={st} />
            <Ball rad={0.1} p={[0, 0.38, 0]} m={lamp} />
          </group>
        ))}
        {/* tight row in front of the main door: chakra, Garuda facing the sanctum, shankha; Manadeva pillar to the left */}
        <EmblemPillar p={[-1.8, 0, 5.8]} kind="chakra" />
        <EmblemPillar p={[1.8, 0, 5.8]} kind="shankha" />
        <GarudaPillar p={[0, 0, 5.8]} r={P} />
        <ManadevaPillar p={[-4.5, 0, 3]} />
        <Frame s={[9.6, 5.6, 9.6]} p={[0, 2.8, 1.5]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  const HOUSE_TINTS = ['#d9ab92', '#dfb299', '#d2a086', '#e0b79f'];
  const HOUSE_ROOFS = ['#b27a5a', '#a86f50', '#b9855f', '#a2684c'];

  function Houses({ list, M }) {
    const dk = M.plain('#3a2416');
    const lat = M.mat('wood', 1, 1, { color: '#6a4a36' });
    const eave = M.plain('#4a2c1a');
    return (
      <group>
        {list.map(([x, z, r, w, h, t], i) => {
          const nw = w > 3.3 ? 3 : 2;
          return (
            <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
              <Box s={[w, h, 2.0]} p={[0, h / 2, 0]} m={M.mat('brick', w / 1.3, h / 1.3, { color: HOUSE_TINTS[t % 4], emissive: '#7a3418', emissiveIntensity: 0.18 })} />
              <Roof w={w + 0.5} d={2.6} h={0.5 + (i % 3) * 0.08} y={h} m={M.mat('roof', 5, 5, { color: HOUSE_ROOFS[(t + i) % 4], roughness: 1 })} sag={1.1} lift={0.1} fascia={false} />
              <Box s={[w + 0.06, 0.16, 2.06]} p={[0, h * 0.5, 0]} m={eave} cast={false} />
              <Box s={[w + 0.06, 0.1, 2.06]} p={[0, h - 0.05, 0]} m={eave} cast={false} />
              {Array.from({ length: nw }).map((_, k) => {
                const wx = (k - (nw - 1) / 2) * (w / nw) * 0.95;
                return (
                  <group key={k}>
                    <Box s={[0.5, 0.6, 0.08]} p={[wx, h * 0.76, 1.02]} m={lat} cast={false} />
                    <Box s={[0.5, 0.55, 0.08]} p={[wx + (k % 2 ? 0.1 : -0.1), h * 0.27, 1.02]} m={lat} cast={false} />
                  </group>
                );
              })}
              <Box s={[0.55, 1.0, 0.06]} p={[w * 0.36, 0.5, 1.02]} m={dk} cast={false} />
            </group>
          );
        })}
      </group>
    );
  }

  // items: [w, h] houses, or [gap] lane / opening
  function rowList(items, start, fixed, axis, rot, seed) {
    const out = [];
    let c = start;
    items.forEach((it, i) => {
      if (it.length === 1) { c += it[0]; return; }
      const [w, h] = it;
      const cx = c + w / 2;
      out.push(axis === 'x' ? [cx, fixed, rot, w, h, i + seed] : [fixed, cx, rot, w, h, i + seed]);
      c += w + 0.08;
    });
    return out;
  }

  function WhiteShikhara({ p, M }) {
    const w = M.plain('#f1ede4', { roughness: 0.85 });
    return (
      <group position={p} scale={0.7}>
        <Box s={[1.7, 0.16, 1.7]} p={[0, 0.08, 0]} m={stoneM(M)} />
        <Box s={[1.4, 0.16, 1.4]} p={[0, 0.24, 0]} m={stoneL(M)} />
        <Box s={[1.1, 0.16, 1.1]} p={[0, 0.4, 0]} m={w} />
        <Box s={[0.9, 0.9, 0.9]} p={[0, 0.93, 0]} m={w} />
        <Box s={[0.34, 0.5, 0.05]} p={[0, 0.73, 0.46]} m={M.dark} cast={false} />
        <Box s={[1.0, 0.08, 1.0]} p={[0, 1.42, 0]} m={w} />
        <K.Spire r0={0.52} h={1.5} y={1.46} m={w} />
      </group>
    );
  }

  function StoneSculpture({ p, M, r = 0 }) {
    const st = stoneL(M);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.0, 0.18, 0.8]} p={[0, 0.09, 0]} m={st} />
        <Box s={[0.4, 0.5, 0.25]} p={[0, 0.43, 0]} m={st} />
        <Ball rad={0.13} p={[0, 0.78, 0]} m={st} />
      </group>
    );
  }

  function useRowsMemo() {
    return K.useMemo(() => {
      const back = rowList([[3.4, 2.7], [3.0, 3.0], [4.8], [3.6, 2.7], [3.0, 2.9], [3.8], [3.4, 2.8]], -16, -14.5, 'x', 0, 0);
      const left = rowList([[3.4, 2.8], [3.0, 3.0], [4.2], [3.4, 2.7], [2.8, 2.9], [5.0], [3.2, 2.8]], -12, -14.5, 'z', P / 2, 3);
      const right = rowList([[3.2, 2.8], [3.0, 3.0], [4.8], [3.4, 2.7], [3.0, 2.9]], -1, 14.5, 'z', -P / 2, 5);
      return [...back, ...left, ...right];
    }, []);
  }

  function ChanguEnv() {
    const M = useM();
    const rows = useRowsMemo();
    const grass = (c) => M.mat('grass', 12, 12, { color: c });
    const flag = M.plain('#9a9184', { roughness: 0.97 });
    const flagL = M.plain('#a69d90', { roughness: 0.97 });
    const kerb = stoneL(M);
    const terrace = [[17.5, -0.12, '#9db35a'], [20.5, -0.5, '#b9c46e'], [23.2, -0.82, '#8fa84e']];
    return (
      <group>
        {/* courtyard: fine muted brick paving */}
        <mesh rotation={[-P / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow material={M.mat('brick', 22, 22, { color: '#e8c6ae' })}><planeGeometry args={[30, 30]} /></mesh>
        {/* narrow grey flag border around the plinth, and a flagged path to the pillars */}
        <mesh rotation={[-P / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow material={flag}><planeGeometry args={[6.8, 6.8]} /></mesh>
        <mesh rotation={[-P / 2, 0, 0]} position={[0, 0.013, 4.6]} receiveShadow material={flagL}><planeGeometry args={[2.0, 3.4]} /></mesh>
        {/* stone kerb lines across the courtyard and in the lane mouths */}
        <Box s={[10, 0.1, 0.18]} p={[0, 0.05, 8.6]} m={kerb} />
        <Box s={[0.18, 0.1, 9]} p={[-8.2, 0.05, 1]} m={kerb} />
        <Box s={[4.2, 0.2, 0.4]} p={[-1.2, 0.1, -13.4]} m={kerb} />
        <Box s={[0.4, 0.2, 4.2]} p={[-13.4, 0.1, -0.8]} m={kerb} />
        <Box s={[0.4, 0.2, 4.4]} p={[13.4, 0.1, 6]} m={kerb} />
        {/* raised grass island with shrubs (front right) */}
        <group position={[6.8, 0, 8.2]}>
          <Box s={[5.0, 0.14, 3.6]} p={[0, 0.07, 0]} m={brick(M, 3, 0.3)} />
          <Box s={[4.8, 0.05, 3.4]} p={[0, 0.16, 0]} m={M.mat('grass', 3, 3, { color: '#a9c27a' })} cast={false} />
          {[[-1.4, 0.3, 0.38, '#5f8a3a'], [-0.3, -0.5, 0.3, '#6f9a42'], [0.8, 0.4, 0.34, '#5a8436'], [1.7, -0.3, 0.28, '#78a24a'], [0.2, 0.9, 0.24, '#6f9a42']].map(([x, z, r, c], i) => (
            <Ball key={i} rad={r} p={[x, 0.2 + r * 0.9, z]} sc={[1, 0.85, 1]} m={M.plain(c, { roughness: 1 })} />
          ))}
        </group>
        {/* small white shikhara shrine beside the temple's left corner, stone sculptures */}
        <WhiteShikhara p={[-6, 0, -3]} M={M} />
        <StoneSculpture p={[-6.4, 0, 7.4]} r={0.5} M={M} />
        <StoneSculpture p={[8.4, 0, 0.4]} r={-P / 2} M={M} />
        {/* low two-storey village houses with lanes between them */}
        <Houses list={rows} M={M} />
        {/* grassy hilltop edge (open at the back-right) and terraced drop into the valley */}
        <mesh rotation={[-P / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow material={grass('#bfd08e')}><circleGeometry args={[24, 64, 0.98, 2 * P - 0.8]} /></mesh>
        {terrace.map(([R, top, c], i) => (
          <mesh key={`tf${i}`} position={[0, top / 2 - 3.2, 0]} receiveShadow material={M.mat('grass', 8, 2, { color: c })}>
            <cylinderGeometry args={[R, R, top + 6.4, 36, 1, false, 1.75, 0.8]} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Cyl key={i} rt={24 + i * 4.5} rb={25 + i * 4.5} h={1.3} p={[0, -0.9 - i * 0.85 - 0.65, 0]} m={M.mat('grass', 14, 2, { color: i % 2 ? '#a9bb62' : '#8ea64e' })} seg={56} />
        ))}
        <mesh rotation={[-P / 2, 0, 0]} position={[0, -6.4, 0]} material={M.plain('#a3b690', { roughness: 1 })}><circleGeometry args={[150, 48]} /></mesh>
        {/* village rooftops on the slope below */}
        {[[-25, -1.6, -11], [-27, -2.0, 5], [26, -2.2, -18], [28, -2.4, 9], [-6, -1.9, -28], [9, -2.0, 27], [-16, -2.0, 24]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]} rotation={[0, i, 0]}>
            <Box s={[2.4, 1.1, 1.8]} p={[0, 0.55, 0]} m={brick(M, 2, 1, '#d8a68a')} />
            <Roof w={3} d={2.4} h={0.5} y={1.1} m={tile(M, '#a8643f')} sag={1.1} lift={0.1} fascia={false} />
          </group>
        ))}
        {/* trees: courtyard, lane gaps, champak giants in the back-right opening */}
        {[[-10.6, 10.6], [-11, -1.5], [3.5, -11.5], [11.5, 2.4], [-3, -11], [10, -9.5]].map(([x, z], i) => <Tree key={`c${i}`} p={[x, 0, z]} s={1.2 + (i % 2) * 0.2} />)}
        {[[-19, -14], [19, 15], [-20, 9], [20, -5], [-3, 19], [6, -20]].map(([x, z], i) => <Tree key={`t${i}`} p={[x, -0.1, z]} s={1.3 + (i % 3) * 0.25} kind={i % 2 ? 'pine' : 'broad'} />)}
        <Tree p={[13.5, -0.1, -10.5]} s={2.0} kind="broad" />
        <Tree p={[16.5, -0.3, -6.5]} s={1.8} kind="broad" />
        {[[-28, -2.4, -9], [29, -2.6, -3], [-29, -2.6, 14], [23, -3.0, 24]].map(([x, y, z], i) => <Tree key={`s${i}`} p={[x, y, z]} s={1.6} kind="pine" />)}
        {/* low blue-grey layered ridges, fading into haze */}
        {[[-20, -44, 34, 4.6, '#8a9db0'], [26, -46, 30, 3.8, '#93a5b8'], [-6, -58, 42, 5.5, '#a3b3c4'], [34, -62, 34, 5.0, '#abbac9'], [-36, -66, 36, 5.0, '#b1bfce'], [0, -76, 56, 6.5, '#bfcad6']].map(([x, z, rad, hh, c], i) => (
          <Ball key={`r${i}`} rad={rad} p={[x, -6.3, z]} sc={[1, hh / rad, 0.28]} m={M.plain(c, { roughness: 1 })} />
        ))}
        {/* a few low, far Ganesh Himal peaks behind a haze band */}
        {[[-48, -125, 30, 16], [-10, -130, 34, 20], [28, -126, 32, 17], [64, -122, 28, 13]].map(([x, z, r, h], i) => (
          <group key={`m${i}`} position={[x, -6.2, z]} rotation={[0, i * 0.7, 0]}>
            <mesh position={[0, h / 2, 0]} material={M.plain('#8a98ae', { roughness: 1 })}><coneGeometry args={[r, h, 5]} /></mesh>
            <mesh position={[0, h * 0.72, 0]} material={M.plain('#f2f4f9', { roughness: 0.7 })}><coneGeometry args={[r * 0.55, h * 0.58, 5]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  return { 'changu-narayan-temple': { Main: ChanguMain, Env: ChanguEnv } };
}
