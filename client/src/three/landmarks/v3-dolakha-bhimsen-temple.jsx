/* Dolakha Bhimsen Temple: a ROOFLESS brick-walled courtyard on a knoll in Dolakha bazaar (front = +z).
   Broad stone steps climb from the bazaar lane to an orange steel scissor-grille gate between two carved red-brick piers with a
   pair of gold-yellow stone guardian lions; a tall stone pillar topped by a statue stands just behind the gate. Wall tops carry
   an orange-finial railing and prayer flags; the inner wall is vermilion brick with arched deity niches under a red valance with
   bells; a small red-dressed black idol with marigolds sits open to the sky. Pale stone retaining wall and scrub slope below.
   Units ~ 2.5 m. Dimensions are estimates. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Tree, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 3.3) * 43758.5453; return v - Math.floor(v); };

  const KY = 1.7;          // knoll / courtyard floor height
  const WH = 1.3;          // enclosure wall height
  const ZF = 2.0;          // front wall z
  const ZB = -3.0;         // back wall z
  const HW = 3.3;          // half width of enclosure

  /* orange scissor lattice as a transparent-textured plane */
  function Grille({ w, h, p }) {
    const tex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.strokeStyle = '#e2561d'; g.lineWidth = 9; g.lineCap = 'butt';
      const n = 4, s = 256 / n;
      for (let i = -n; i <= n * 2; i += 1) {
        g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s + 256, 256); g.stroke();
        g.beginPath(); g.moveTo(i * s, 256); g.lineTo(i * s + 256, 0); g.stroke();
      }
      g.lineWidth = 14; g.strokeRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 0.9, h / 0.9);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }, [w, h]);
    return (
      <mesh position={p}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.6} metalness={0.3} />
      </mesh>
    );
  }

  /* carved brick pier with moulded cap and white mortar lines */
  function Pier({ p, h = 2.35 }) {
    const M = useM();
    const brick = M.mat('brick', 1, 4, { color: '#9a4a30' });
    const dark = M.plain('#7d3522', { roughness: 0.8 });
    const mort = M.plain('#d9cdb6', { roughness: 1 });
    return (
      <group position={p}>
        <Box s={[0.5, h, 0.5]} p={[0, h / 2, 0]} m={brick} />
        {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.51, 0.018, 0.51]} p={[0, 0.25 + i * 0.16, 0]} m={mort} cast={false} />)}
        <Box s={[0.58, 0.1, 0.58]} p={[0, 0.05, 0]} m={dark} />
        {[0.35, 0.52, 0.7].map((y, i) => <Box key={i} s={[0.55, 0.07, 0.55]} p={[0, h - 0.6 + y * 0.6, 0]} m={i === 1 ? dark : brick} />)}
        <Box s={[0.64, 0.1, 0.64]} p={[0, h + 0.05, 0]} m={dark} />
        <Box s={[0.56, 0.1, 0.56]} p={[0, h + 0.15, 0]} m={brick} />
        <Box s={[0.42, 0.1, 0.42]} p={[0, h + 0.25, 0]} m={dark} />
      </group>
    );
  }

  /* wall-top railing with orange trident finials along x (length L at z) */
  function Rail({ p, L, axis = 'x', fin = 0.42 }) {
    const M = useM();
    const or = M.plain('#e0561c', { roughness: 0.5, metalness: 0.3 });
    const n = Math.max(2, Math.round(L / fin));
    const rot = axis === 'x' ? [0, 0, 0] : [0, Math.PI / 2, 0];
    return (
      <group position={p} rotation={rot}>
        <Box s={[L, 0.045, 0.045]} p={[0, 0.24, 0]} m={or} cast={false} />
        <Box s={[L, 0.045, 0.045]} p={[0, 0.02, 0]} m={or} cast={false} />
        {Array.from({ length: n + 1 }, (_, i) => {
          const x = -L / 2 + (L * i) / n;
          return (
            <group key={i} position={[x, 0, 0]}>
              <Box s={[0.035, 0.26, 0.035]} p={[0, 0.13, 0]} m={or} cast={false} />
              <mesh position={[0, 0.4, 0]} material={or}><coneGeometry args={[0.075, 0.28, 4]} /></mesh>
              {[-1, 1].map((k) => <mesh key={k} position={[k * 0.085, 0.33, 0]} rotation={[0, 0, -k * 0.35]} material={or}><coneGeometry args={[0.035, 0.18, 4]} /></mesh>)}
            </group>
          );
        })}
      </group>
    );
  }

  /* red valance with gold fringe and hanging bronze bells (length L, along x) */
  function Valance({ p, L, bells = 6, rot = [0, 0, 0] }) {
    const M = useM();
    const red = M.plain('#b0182a', { roughness: 0.9 });
    const gold = M.plain('#e0b032', { roughness: 0.5, metalness: 0.5 });
    const bronze = M.plain('#a8742e', { roughness: 0.4, metalness: 0.75 });
    const scal = Math.max(3, Math.round(L / 0.3));
    return (
      <group position={p} rotation={rot}>
        <Box s={[L, 0.2, 0.05]} p={[0, 0, 0]} m={red} cast={false} />
        {Array.from({ length: scal }, (_, i) => (
          <mesh key={i} position={[-L / 2 + (L * (i + 0.5)) / scal, -0.14, 0]} rotation={[0, 0, Math.PI]} material={red}>
            <coneGeometry args={[L / scal / 1.9, 0.14, 3]} />
          </mesh>
        ))}
        <Box s={[L, 0.025, 0.06]} p={[0, -0.1, 0]} m={gold} cast={false} />
        {Array.from({ length: bells }, (_, i) => (
          <group key={i} position={[-L / 2 + (L * (i + 0.5)) / bells, -0.2, 0.04]}>
            <Cyl rt={0.012} h={0.14} p={[0, 0.07, 0]} m={bronze} seg={5} />
            <mesh position={[0, -0.03, 0]} material={bronze}><coneGeometry args={[0.065, 0.1, 10]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /* arched niche with a little deity relief on a wall face (faces +z in local frame) */
  function Niche({ p, rot = [0, 0, 0] }) {
    const M = useM();
    const dk = M.plain('#6c2418', { roughness: 0.9 });
    const rl = M.plain('#d9532f', { roughness: 0.8 });
    return (
      <group position={p} rotation={rot}>
        <Box s={[0.3, 0.46, 0.03]} p={[0, 0, 0]} m={dk} cast={false} />
        <mesh position={[0, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]} material={dk}><cylinderGeometry args={[0.15, 0.15, 0.03, 14, 1, false, 0, Math.PI]} /></mesh>
        <Box s={[0.11, 0.3, 0.04]} p={[0, -0.02, 0.01]} m={rl} cast={false} />
        <Ball rad={0.045} p={[0, 0.17, 0.02]} m={rl} />
      </group>
    );
  }

  function Lion({ p, rot = [0, 0, 0] }) {
    const M = useM();
    const gold = M.plain('#d9a42a', { roughness: 0.55, metalness: 0.15 });
    const stone = M.mat('stone', 1, 1, { color: '#c9bca2' });
    return (
      <group position={p} rotation={rot}>
        <Box s={[0.5, 0.5, 0.5]} p={[0, 0.25, 0]} m={stone} />
        <Box s={[0.3, 0.34, 0.32]} p={[0, 0.67, -0.04]} m={gold} />
        <Ball rad={0.2} p={[0, 0.97, 0.03]} m={gold} />
        <Ball rad={0.17} p={[0, 0.95, 0.08]} sc={[1.3, 1, 0.6]} m={M.plain('#b9851d', { roughness: 0.6 })} />
        <Box s={[0.15, 0.1, 0.1]} p={[0, 0.92, 0.2]} m={gold} />
        {[-1, 1].map((k) => <Box key={k} s={[0.07, 0.3, 0.09]} p={[k * 0.1, 0.55, 0.13]} m={gold} />)}
        {[-1, 1].map((k) => <Ball key={k} rad={0.05} p={[k * 0.13, 1.13, 0.0]} m={gold} />)}
      </group>
    );
  }

  /* tall dark banded stone pillar with lotus capital and a figure on top */
  function Pillar({ p }) {
    const M = useM();
    const st = M.plain('#4a4640', { roughness: 0.9 });
    const stl = M.plain('#5a5650', { roughness: 0.9 });
    const yel = M.plain('#e3b829', { roughness: 0.55 });
    const ochre = M.plain('#b8862a', { roughness: 0.6 });
    return (
      <group position={p}>
        <Box s={[0.85, 0.55, 0.85]} p={[0, 0.275, 0]} m={stl} />
        <Box s={[0.66, 0.14, 0.66]} p={[0, 0.62, 0]} m={st} />
        <Cyl rt={0.29} rb={0.33} h={1.85} p={[0, 1.62, 0]} m={st} seg={16} />
        <Cyl rt={0.34} rb={0.34} h={0.08} p={[0, 2.58, 0]} m={stl} seg={16} />
        <Cyl rt={0.335} rb={0.335} h={0.36} p={[0, 2.8, 0]} m={yel} seg={16} />
        <Cyl rt={0.34} rb={0.34} h={0.08} p={[0, 3.02, 0]} m={stl} seg={16} />
        <Cyl rt={0.28} rb={0.3} h={1.4} p={[0, 3.75, 0]} m={st} seg={16} />
        <Cyl rt={0.33} rb={0.29} h={0.12} p={[0, 4.51, 0]} m={stl} seg={16} />
        <Cyl rt={0.45} rb={0.36} h={0.14} p={[0, 4.64, 0]} m={st} seg={16} />
        <Cyl rt={0.45} rb={0.45} h={0.1} p={[0, 4.76, 0]} m={stl} seg={16} />
        <Ball rad={0.38} p={[0, 4.98, 0]} sc={[1, 0.6, 1]} m={st} />
        <Cyl rt={0.36} rb={0.36} h={0.07} p={[0, 5.2, 0]} m={stl} seg={16} />
        <Cyl rt={0.3} rb={0.3} h={0.07} p={[0, 5.27, 0]} m={st} seg={16} />
        <Cyl rt={0.31} rb={0.31} h={0.02} p={[0, 5.31, 0]} m={ochre} seg={16} />
        {/* seated animal (lion-like) in dark stone */}
        <Box s={[0.4, 0.25, 0.3]} p={[0, 5.46, -0.02]} m={stl} />
        <Box s={[0.12, 0.2, 0.1]} p={[-0.1, 5.4, 0.17]} m={stl} />
        <Box s={[0.12, 0.2, 0.1]} p={[0.1, 5.4, 0.17]} m={stl} />
        <Ball rad={0.14} p={[0, 5.68, 0.1]} m={stl} />
        <Box s={[0.1, 0.07, 0.1]} p={[0, 5.64, 0.23]} m={st} />
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.09, 5.84, 0.09]} rotation={[0, 0, -k * 0.25]} material={st}><coneGeometry args={[0.04, 0.12, 4]} /></mesh>)}
        <Box s={[0.07, 0.07, 0.2]} p={[0, 5.5, -0.22]} r={[0.5, 0, 0]} m={st} />
      </group>
    );
  }

  /* small open pati: 4 dark posts, low pitched roof */
  function Pati({ p }) {
    const M = useM();
    const post = M.plain('#2e231d', { roughness: 0.8 });
    const tile = M.mat('roof', 2, 1, { color: '#8a5440' });
    return (
      <group position={p}>
        {[[-0.65, -0.5], [0.65, -0.5], [-0.65, 0.5], [0.65, 0.5]].map(([x, z], i) => <Box key={i} s={[0.07, 1.05, 0.07]} p={[x, 0.55, z]} m={post} />)}
        <Box s={[1.4, 0.06, 0.07]} p={[0, 1.08, 0.5]} m={post} cast={false} />
        <Box s={[1.4, 0.06, 0.07]} p={[0, 1.08, -0.5]} m={post} cast={false} />
        <Roof w={1.6} d={1.3} h={0.3} y={1.1} m={tile} sag={1} lift={0} />
      </group>
    );
  }

  /* low metal-railed frame around the idol */
  function IdolFrame({ p }) {
    const M = useM();
    const br = M.plain('#b68a3a', { roughness: 0.4, metalness: 0.7 });
    return (
      <group position={p}>
        {[[-0.5, 0.45], [0.5, 0.45], [-0.5, -0.4], [0.5, -0.4]].map(([x, z], i) => <Cyl key={i} rt={0.018} h={0.6} p={[x, 0.3, z]} m={br} seg={6} />)}
        <Box s={[1.0, 0.03, 0.03]} p={[0, 0.58, 0.45]} m={br} cast={false} />
        <Box s={[1.0, 0.03, 0.03]} p={[0, 0.32, 0.45]} m={br} cast={false} />
        {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.03, 0.85]} p={[k * 0.5, 0.58, 0.02]} m={br} cast={false} />)}
        <Box s={[1.0, 0.03, 0.03]} p={[0, 0.58, -0.4]} m={br} cast={false} />
      </group>
    );
  }

  /* small red-dressed black triangular idol with marigold garland */
  function Idol({ p }) {
    const M = useM();
    const blk = M.plain('#1d1715', { roughness: 0.6 });
    const red = M.plain('#c0222a', { roughness: 0.85 });
    const mar = M.plain('#f2a516', { roughness: 0.8, emissive: '#6a3d00', emissiveIntensity: 0.3 });
    const vm = M.plain('#d04820', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[0.7, 0.06, 0.55]} p={[0, 0.03, 0]} m={vm} />
        <mesh position={[0, 0.3, 0]} material={blk} castShadow><coneGeometry args={[0.17, 0.5, 3]} /></mesh>
        <mesh position={[0, 0.3, 0.02]} scale={[1.05, 1.02, 1.05]} material={red}><coneGeometry args={[0.145, 0.42, 3, 1, true]} /></mesh>
        <mesh position={[0, 0.34, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={mar}><torusGeometry args={[0.085, 0.022, 6, 14]} /></mesh>
        <Ball rad={0.025} p={[0, 0.49, 0.06]} m={vm} />
        {[-1, 1].map((k) => <Cyl key={k} rt={0.012} h={0.5} p={[k * 0.3, 0.3, 0.22]} m={M.gold} seg={6} />)}
      </group>
    );
  }

  /* ---------------------------------------------------------------- MAIN */
  function Main() {
    const M = useM();
    const brick = M.mat('brick', 4, 1, { color: '#b4573a' });
    const brickV = M.mat('brick', 3, 1, { color: '#b8402a' });   // inner face
    const paved = M.plain('#8f8068', { roughness: 0.95 });
    const rubble = M.plain('#cbbd9c', { roughness: 1 });
    const rubbleDk = M.plain('#85775e', { roughness: 1 });
    const mortar = M.plain('#6a5d48', { roughness: 1 });
    const stoneT = ['#d2c6aa', '#b3a68b', '#ddd2b8', '#a79a80'].map((c) => M.plain(c, { roughness: 1 }));
    const stepDk = M.plain('#9a917e', { roughness: 0.95 });
    const stepLt = M.plain('#a9a08a', { roughness: 0.95 });
    const dk = M.plain('#1c130e');
    const scrub = M.plain('#6f7a3e', { roughness: 1 });
    const scrub2 = M.plain('#8a8248', { roughness: 1 });
    const dry = M.plain('#8d7e55', { roughness: 1 });
    const brn = M.plain('#5a4a38', { roughness: 1 });
    const timber = M.plain('#3A2E28', { roughness: 0.8 });
    const bronze = M.plain('#a8742e', { roughness: 0.4, metalness: 0.75 });
    const weather = M.plain('#8a7d64', { roughness: 1 });
    const corn1 = M.plain('#8e402b');
    const corn2 = M.plain('#bd6a48');

    const L = 2 * HW;           // enclosure width
    const D = ZF - ZB;          // depth
    const cz = (ZF + ZB) / 2;
    const nSteps = 12;
    const sZ0 = 5.4, sZ1 = ZF + 0.25;
    const dz = (sZ0 - sZ1) / nSteps;
    const KW = L + 0.4, KD = D + 0.4;   // knoll wall footprint

    return (
      <group>
        <Frame s={[9.4, 6.4, 9.4]} p={[0, 3.2, 0.5]} />

        {/* knoll: rubble-faced retaining wall */}
        <Box s={[KW, KY, KD]} p={[0, KY / 2 - 0.02, cz]} m={rubble} />
        {/* mortar courses (front, left, right) */}
        {[0.3, 0.62, 0.95, 1.28, 1.6].map((y, i) => (
          <group key={i}>
            <Box s={[KW + 0.02, 0.035, 0.03]} p={[0, y, ZF + 0.2]} m={mortar} cast={false} />
            {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.035, KD + 0.02]} p={[k * (KW / 2), y, cz]} m={mortar} cast={false} />)}
          </group>
        ))}
        {/* irregular stone blocks proud of the face */}
        {Array.from({ length: 46 }, (_, i) => {
          const face = i % 3;
          const y = 0.15 + rnd(i + 40) * (KY - 0.3);
          const w = 0.28 + rnd(i + 3) * 0.3, h = 0.2 + rnd(i + 7) * 0.12;
          const m = stoneT[i % 4];
          if (face === 0) return <Box key={i} s={[w, h, 0.05]} p={[(rnd(i) - 0.5) * (KW - 0.6), y, ZF + 0.22]} m={m} cast={false} />;
          const k = face === 1 ? -1 : 1;
          return <Box key={i} s={[0.05, h, w]} p={[k * (KW / 2 + 0.02), y, ZB + 0.3 + rnd(i) * (KD - 0.8)]} m={m} cast={false} />;
        })}
        {/* regular row of small square holes (as in the photo) */}
        {[-3.0, -2.45, -1.9, 1.9, 2.45, 3.0].map((x, i) => <Box key={`f${i}`} s={[0.13, 0.13, 0.06]} p={[x, KY * 0.74, ZF + 0.22]} m={dk} cast={false} />)}
        {[-1, 1].map((k) => [-2.7, -2.0, -1.3, -0.6, 0.1, 0.8, 1.5].map((z, i) => <Box key={`s${k}${i}`} s={[0.06, 0.13, 0.13]} p={[k * (KW / 2 + 0.02), KY * 0.74, z]} m={dk} cast={false} />))}
        {/* projecting stone string course under the brick wall */}
        <Box s={[KW + 0.12, 0.1, KD + 0.12]} p={[0, KY - 0.03, cz]} m={rubbleDk} cast={false} />

        {/* scrub slope tumbling below the retaining wall, widening downhill */}
        {[[-4.2, 0.3, 0.8, 1.3], [4.2, 0.3, 0.6, 1.4], [-4.1, 0.25, -2, 1.2], [4.2, 0.25, -2.1, 1.2], [-2.6, 0.2, 2.9, 0.8], [2.9, 0.2, 2.8, 0.8], [0, 0.4, -3.9, 1.6], [-5.4, 0.2, 2.4, 1.0], [5.5, 0.2, 2.2, 1.0], [-5.2, 0.35, -1.0, 1.6], [5.3, 0.35, -1.2, 1.6]].map(([x, y, z, r], i) => (
          <Ball key={i} rad={r} p={[x, y, z]} sc={[1.1, 0.5, 1.1]} m={i % 3 === 0 ? dry : i % 2 ? scrub2 : scrub} />
        ))}
        {/* bare twiggy shrubs on the slope */}
        {Array.from({ length: 18 }, (_, i) => {
          const side = i % 2 ? 1 : -1;
          const x = side * (HW + 0.7 + rnd(i) * 1.8);
          const z = ZF - rnd(i + 20) * 4.8;
          return <Cyl key={i} rt={0.015} rb={0.045} h={0.8 + rnd(i + 9) * 0.6} p={[x, 0.5, z]} r={[0, 0, (rnd(i + 5) - 0.5) * 0.6]} m={brn} seg={5} />;
        })}
        {/* bare winter trees on the slope */}
        {[[-4.6, 3.6, 1.0], [4.8, 3.4, 0.9], [-5.0, -0.8, 1.15], [5.2, -1.5, 1.05]].map(([x, z, s], i) => (
          <group key={i} position={[x, 0.2, z]} scale={s}>
            <Cyl rt={0.05} rb={0.1} h={2.4} p={[0, 1.2, 0]} m={brn} seg={6} />
            {[0, 1, 2, 3, 4].map((j) => (
              <Cyl key={j} rt={0.012} rb={0.04} h={1.1} p={[Math.sin(j * 1.9) * 0.4, 2.5 + (j % 2) * 0.3, Math.cos(j * 1.9) * 0.4]} r={[Math.cos(j * 1.9) * 0.6, 0, -Math.sin(j * 1.9) * 0.6]} m={brn} seg={4} />
            ))}
          </group>
        ))}

        {/* courtyard floor */}
        <Box s={[L - 0.3, 0.06, D - 0.3]} p={[0, KY + 0.03, cz]} m={paved} />

        {/* enclosure walls (outer face brick, inner face vermilion) */}
        <Box s={[L, WH, 0.35]} p={[0, KY + WH / 2, ZB]} m={brick} />
        <Box s={[L - 0.4, WH - 0.15, 0.04]} p={[0, KY + WH / 2, ZB + 0.19]} m={brickV} cast={false} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.35, WH, D]} p={[k * HW, KY + WH / 2, cz]} m={brick} />
            <Box s={[0.04, WH - 0.15, D - 0.4]} p={[k * (HW - 0.19), KY + WH / 2, cz]} m={brickV} cast={false} />
          </group>
        ))}
        {/* front wall, in two halves either side of the gate */}
        {[-1, 1].map((k) => (
          <Box key={k} s={[HW - 1.3, WH - 0.2, 0.35]} p={[k * (1.3 + (HW - 1.3) / 2), KY + (WH - 0.2) / 2, ZF]} m={brick} />
        ))}
        {/* stepped wall-top cornice */}
        <Box s={[L + 0.16, 0.08, 0.52]} p={[0, KY + WH + 0.04, ZB]} m={corn1} cast={false} />
        <Box s={[L + 0.04, 0.06, 0.42]} p={[0, KY + WH + 0.11, ZB]} m={corn2} cast={false} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.52, 0.08, D + 0.16]} p={[k * HW, KY + WH + 0.04, cz]} m={corn1} cast={false} />
            <Box s={[0.42, 0.06, D + 0.04]} p={[k * HW, KY + WH + 0.11, cz]} m={corn2} cast={false} />
            <Box s={[HW - 1.3, 0.07, 0.5]} p={[k * (1.3 + (HW - 1.3) / 2), KY + WH - 0.16, ZF]} m={corn1} cast={false} />
          </group>
        ))}

        {/* railings with orange trident finials */}
        <Rail p={[0, KY + WH + 0.14, ZB]} L={L - 0.3} />
        {[-1, 1].map((k) => <Rail key={k} p={[k * HW, KY + WH + 0.14, cz]} L={D - 0.3} axis="z" />)}
        {[-1, 1].map((k) => <Rail key={k} p={[k * (1.3 + (HW - 1.3) / 2), KY + WH - 0.1, ZF]} L={HW - 1.8} />)}

        {/* gate: two darker carved brick piers, orange scissor grille, black timber canopy */}
        <Pier p={[-1.15, KY, ZF]} />
        <Pier p={[1.15, KY, ZF]} />
        <Grille w={1.8} h={1.7} p={[0, KY + 0.95, ZF + 0.14]} />
        <Box s={[1.8, 0.2, 0.36]} p={[0, KY + 1.95, ZF]} m={timber} />
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => <Box key={i} s={[0.12, 0.1, 0.1]} p={[x, KY + 1.82, ZF + 0.2]} m={timber} cast={false} />)}
        {/* projecting canopy, ~0.5 deep, with an upper tier */}
        <Box s={[2.0, 0.1, 0.62]} p={[0, KY + 2.07, ZF + 0.22]} m={timber} />
        <Box s={[1.7, 0.1, 0.4]} p={[0, KY + 2.2, ZF + 0.14]} m={timber} />
        {/* red and gold valance on the outer face, under the canopy */}
        <Valance p={[0, KY + 1.8, ZF + 0.45]} L={1.75} bells={0} />
        {/* bells and a pendant lamp hanging under the canopy */}
        {[-0.75, -0.45, 0.45, 0.75].map((x, i) => (
          <group key={i} position={[x, KY + 1.98, ZF + 0.4]}>
            <Cyl rt={0.01} h={0.18} p={[0, -0.09, 0]} m={bronze} seg={5} />
            <mesh position={[0, -0.26, 0]} material={bronze}><coneGeometry args={[0.07, 0.12, 10]} /></mesh>
          </group>
        ))}
        <group position={[0, KY + 2.02, ZF + 0.4]}>
          <Cyl rt={0.008} h={0.3} p={[0, -0.15, 0]} m={bronze} seg={4} />
          <Cyl rt={0.07} rb={0.04} h={0.2} p={[0, -0.42, 0]} m={bronze} seg={8} />
          <mesh position={[0, -0.56, 0]} rotation={[Math.PI, 0, 0]} material={bronze}><coneGeometry args={[0.05, 0.1, 8]} /></mesh>
        </group>
        <Rail p={[0, KY + 2.26, ZF]} L={1.8} />
        <Box s={[1.8, 0.05, 0.3]} p={[0, KY + 0.04, ZF + 0.05]} m={stepLt} />
        {/* long valance along the inner side wall */}
        <Valance p={[-HW + 0.3, KY + 1.0, cz]} L={D - 0.9} bells={9} rot={[0, Math.PI / 2, 0]} />

        {/* arched deity niches on the inner faces of the back and side walls */}
        {[-2.6, -1.7, -0.8, 0.1, 1.0, 1.9, 2.7].map((x, i) => <Niche key={`b${i}`} p={[x, KY + 0.62, ZB + 0.22]} />)}
        {[-1.9, -1.0, -0.1, 0.8].map((z, i) => <Niche key={`l${i}`} p={[-HW + 0.22, KY + 0.62, z - 0.3]} rot={[0, Math.PI / 2, 0]} />)}
        {[-1.9, -1.0, -0.1, 0.8].map((z, i) => <Niche key={`r${i}`} p={[HW - 0.22, KY + 0.62, z - 0.3]} rot={[0, -Math.PI / 2, 0]} />)}
        <Box s={[L - 0.5, 0.12, 0.22]} p={[0, KY + 0.12, ZB + 0.3]} m={M.plain('#a43c26', { roughness: 0.9 })} />
        <Box s={[L - 1.4, 0.04, D - 1.4]} p={[0, KY + 0.07, cz]} m={M.plain('#9b8c72', { roughness: 0.95 })} cast={false} />
        {[0, 1, 2, 3].map((i) => <Box key={`pl${i}`} s={[L - 0.5, 0.012, 0.025]} p={[0, KY + 0.095, ZB + 0.8 + i * 1.1]} m={mortar} cast={false} />)}
        {[-2.2, -1.1, 0, 1.1, 2.2].map((x, i) => <Box key={`pv${i}`} s={[0.025, 0.012, D - 0.7]} p={[x, KY + 0.095, cz]} m={mortar} cast={false} />)}
        <Pati p={[-HW + 1.0, KY, ZB + 0.95]} />
        <IdolFrame p={[0.7, KY, ZB + 0.85]} />
        {/* weathering patches on the retaining wall */}
        {[[-2.4, 0.5, 0.5], [-0.8, 1.1, 0.7], [1.4, 0.4, 0.6], [2.5, 1.2, 0.5], [0.3, 0.75, 0.4]].map(([x, y, w], i) => <Box key={`wp${i}`} s={[w, 0.3, 0.04]} p={[x, y, ZF + 0.23]} m={weather} cast={false} />)}
        {[-1, 1].map((k) => [[-0.5, 0.5], [1.4, 1.1]].map(([z, y], i) => <Box key={`ws${k}${i}`} s={[0.04, 0.3, 0.7]} p={[k * (KW / 2 + 0.03), y, z]} m={weather} cast={false} />))}

        {/* idol of Bhimsen */}
        <Idol p={[0.7, KY + 0.06, ZB + 0.85]} />
        <pointLight position={[0.7, KY + 0.9, ZB + 1.2]} intensity={1.0} distance={4} color="#ffb060" />

        {/* tall stone pillar behind the gate */}
        <Pillar p={[-0.2, KY, ZF - 1.0]} />

        {/* separate stone treads, alternating dark and light, rising from the lane to the gate */}
        {Array.from({ length: nSteps }, (_, i) => {
          const h = KY * ((i + 1) / nSteps);
          const zc = sZ0 - (i + 0.5) * dz;
          return (
            <group key={i}>
              <Box s={[2.7, h, dz + 0.01]} p={[0, h / 2, zc]} m={i % 3 === 1 ? stepLt : stepDk} cast={false} />
              {/* stepped parapet either side: one weathered stone colour */}
              {[-1, 1].map((k) => <Box key={k} s={[0.32, h + 0.3, dz + 0.01]} p={[k * 1.51, (h + 0.3) / 2, zc]} m={weather} cast={i % 3 === 0} />)}
            </group>
          );
        })}
        {/* landing + lions */}
        <Box s={[2.7, 0.1, 0.5]} p={[0, KY - 0.05, ZF + 0.4]} m={stepLt} cast={false} />
        <Lion p={[-0.78, KY, ZF + 0.5]} />
        <Lion p={[0.78, KY, ZF + 0.5]} />

        {/* heavy prayer-flag strings: pillar capital to the wall corners, plus cross strings */}
        {[[-HW, ZF], [HW, ZF], [-HW, ZB], [HW, ZB]].map(([x, z], i) => (
          <FlagLine key={i} from={[-0.2, KY + 4.9, ZF - 1.0]} to={[x, KY + WH + 0.4, z]} n={22} off={i} />
        ))}
        <FlagLine from={[-HW, KY + WH + 0.4, ZF]} to={[HW, KY + WH + 0.4, ZF]} n={26} off={7} />
        <FlagLine from={[-HW, KY + WH + 0.4, ZB]} to={[HW, KY + WH + 0.4, ZB]} n={26} off={3} />
      </group>
    );
  }

  const FLAGC = ['#2f6db5', '#f2efe6', '#c0392b', '#2e8b57', '#e2b33c'];
  function FlagLine({ from, to, n = 12, off = 0 }) {
    const pts = useMemo(() => Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const sag = Math.sin(t * Math.PI) * 0.45;
      return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag, from[2] + (to[2] - from[2]) * t];
    }), [from, to, n]);
    const ang = Math.atan2(to[0] - from[0], to[2] - from[2]);
    return (
      <group>
        {pts.map((q, i) => (
          <mesh key={i} position={[q[0], q[1] - 0.1, q[2]]} rotation={[0, ang + Math.PI / 2, 0]}>
            <planeGeometry args={[0.13, 0.16]} />
            <meshStandardMaterial color={FLAGC[(i + off) % 5]} side={THREE.DoubleSide} roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }

  /* ---------------------------------------------------------------- ENV */
  function Palm({ p, s = 1, lean = 0 }) {
    const M = useM();
    const trunk = M.plain('#8a7658', { roughness: 1 });
    const leaf = M.plain('#4a7a34', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.06} rb={0.1} h={3.2} p={[lean * 0.3, 1.6, 0]} r={[0, 0, -lean * 0.19]} m={trunk} seg={6} />
        <group position={[lean * 0.6, 3.2, 0]}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} rotation={[0, (i / 7) * Math.PI * 2, 1.0]} position={[0, 0, 0]} material={leaf}>
              <coneGeometry args={[0.16, 1.7, 3]} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  /* Newar stone/brick lane house; varied roofs (tile, slate, tin), optional shop awning and hanging goods */
  function LaneHouse({ p, r = 0, w = 3, d = 3, st = 3, wall = 'stone', glow = false, roof = 'tile', awn = null, sh = 0.9, bal = false }) {
    const M = useM();
    const wm = wall === 'brick' ? M.mat('brick', 2, st, { color: '#d0785a' }) : M.mat('plaster', 2, st, { color: '#a89f8c' });
    const timber = M.plain('#4a2c1c', { roughness: 0.8 });
    const roofM = roof === 'slate' ? M.plain('#5b6066', { roughness: 0.9 })
      : roof === 'tin' ? M.plain('#9ea4a6', { roughness: 0.45, metalness: 0.55 })
      : M.mat('roof', 3, 2, { color: '#8a5440' });
    const h = st * sh;
    const win = M.plain(glow && st > 2 ? '#ffc870' : '#32241c', glow && st > 2 ? { emissive: '#ff9a30', emissiveIntensity: 0.35 } : { roughness: 0.7 });
    const gc = ['#d8352a', '#e9b324', '#2e7fb8', '#f2efe6'];
    const aM = awn ? M.plain(awn, { roughness: 0.9 }) : null;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wm} />
        {p[1] > 0 && <Box s={[w + 0.5, p[1] + 0.1, d + 0.5]} p={[0, -p[1] / 2, 0]} m={M.plain('#8f8468', { roughness: 1 })} />}
        {Array.from({ length: st }, (_, s) => (
          <group key={s}>
            <Box s={[w + 0.08, 0.06, d + 0.08]} p={[0, (s + 1) * sh - 0.03, 0]} m={timber} cast={false} />
            {Array.from({ length: Math.max(2, Math.round(w / 1.4)) }, (_, i) => (
              <Box key={i} s={[0.24, 0.32, 0.05]} p={[-w / 2 + (w * (i + 0.5)) / Math.max(2, Math.round(w / 1.4)), s * sh + 0.55, d / 2 + 0.02]} m={s === 0 && i === 1 ? timber : win} cast={false} />
            ))}
          </group>
        ))}
        {bal && (
          <group>
            <Box s={[w * 0.7, 0.06, 0.45]} p={[0, sh + 0.02, d / 2 + 0.22]} m={timber} />
            <Box s={[w * 0.7, 0.3, 0.04]} p={[0, sh + 0.2, d / 2 + 0.43]} m={timber} cast={false} />
            {[-0.3, 0, 0.3].map((f, i) => <Box key={i} s={[0.05, 0.5, 0.05]} p={[f * w, sh + 0.3, d / 2 + 0.43]} m={timber} cast={false} />)}
          </group>
        )}
        {aM && (
          <group>
            <Box s={[w * 0.85, 0.04, 0.65]} p={[0, 0.95, d / 2 + 0.3]} r={[0.28, 0, 0]} m={aM} cast={false} />
            {[-0.35, -0.12, 0.12, 0.35].map((f, i) => <Ball key={i} rad={0.07} p={[f * w, 0.62, d / 2 + 0.38]} sc={[1, 1.4, 1]} m={M.plain(gc[i % 4], { roughness: 0.9 })} />)}
          </group>
        )}
        <Roof w={w + 0.9} d={d + 0.9} h={0.7 + (st % 2) * 0.15} y={h} m={roofM} sag={1} lift={0} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const ground = M.plain('#7f8a55', { roughness: 1 });
    const lane = M.plain('#8f8670', { roughness: 0.95 });
    const hill = M.plain('#6b7a4a', { roughness: 1 });
    const hill2 = M.plain('#5c6c40', { roughness: 1 });
    const trunk = M.plain('#5b4632', { roughness: 1 });
    const leaf = M.plain('#46682f', { roughness: 1 });
    const leaf2 = M.plain('#5c7c34', { roughness: 1 });
    const slab = M.plain('#a79b82', { roughness: 1 });

    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={ground}><circleGeometry args={[75, 48]} /></mesh>
        {/* hills rising behind the town */}
        {[[-30, -34, 22, 9], [10, -42, 30, 12], [42, -28, 20, 8], [-52, -10, 18, 8], [55, 0, 16, 7], [-8, -58, 36, 15]].map(([x, z, r, h], i) => (
          <mesh key={i} position={[x, -0.3, z]} scale={[1, h / r, 1]} material={i % 2 ? hill : hill2}><sphereGeometry args={[r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        ))}

        {/* green-brown terraces on the hillsides */}
        {[[-14, -14, 9], [-6, -20, 11], [8, -22, 12], [18, -14, 9], [-24, -4, 8], [26, -2, 8]].map(([x, z, w], i) => [0, 1, 2].map((j) => <Box key={i + '-' + j} s={[w + j * 2, 0.35, 2.2]} p={[x, 0.3 + j * 0.7, z - j * 1.8]} m={(i + j) % 2 ? hill : hill2} cast={false} />))}
        {/* stone-flagged bazaar lane across the foot of the steps */}
        <mesh position={[0, 0.01, 8.3]} rotation={[-Math.PI / 2, 0, 0]} material={lane}><planeGeometry args={[60, 3.0]} /></mesh>
        <mesh position={[0, 0.01, 6.6]} rotation={[-Math.PI / 2, 0, 0]} material={lane}><planeGeometry args={[5, 2.2]} /></mesh>
        {[-9, -5, -1.5, 2, 6, 11].map((x, i) => <Box key={i} s={[1.4, 0.02, 0.9]} p={[x, 0.02, 8.0 + (i % 2) * 0.6]} m={slab} cast={false} />)}

        {/* tight cluster hugging the gate-side lane: tall stone house at left of the steps, as in the lane photo */}
        <LaneHouse p={[-4.6, 0, 6.8]} w={2.9} d={3} st={3} wall="stone" r={0.06} roof="tin" awn="#c4452e" bal glow />
        <LaneHouse p={[-7.6, 0, 7.3]} w={3.0} d={3} st={2} wall="brick" roof="slate" awn="#2f6f9e" />
        <LaneHouse p={[-10.7, 0, 6.6]} w={3.2} d={3.2} st={3} wall="stone" roof="tile" bal glow />
        <LaneHouse p={[-14.0, 0, 6.9]} w={2.8} d={3.0} st={2} wall="brick" roof="tin" awn="#d6a21f" />
        <LaneHouse p={[-17.2, 0, 6.0]} w={3.4} d={3.2} st={3} wall="stone" roof="slate" glow />
        {/* right side, low brick houses further down the lane */}
        <LaneHouse p={[13.5, 0, 8.6]} w={3} d={2.8} st={2} wall="brick" roof="tin" r={-0.08} glow awn="#c4452e" />
        <LaneHouse p={[17.0, 0, 7.6]} w={3.0} d={3} st={3} wall="stone" roof="slate" bal awn="#2f6f9e" />
        <LaneHouse p={[20.6, 0, 7.0]} w={3.2} d={3} st={2} wall="brick" roof="tile" glow />
        {/* houses across the lane (south) and up the slope behind the temple */}
        <LaneHouse p={[12, 0, 15]} w={3.6} d={3} st={3} wall="stone" roof="tin" r={Math.PI} />
        <LaneHouse p={[-11, 0, 13.2]} w={3.4} d={3} st={2} wall="brick" roof="tile" r={Math.PI} glow />
        <LaneHouse p={[-9, 2.2, -8]} w={3.4} d={3} st={2} wall="stone" roof="slate" glow />
        <LaneHouse p={[9, 2.8, -9]} w={3.2} d={3} st={3} wall="brick" roof="tin" />
        <LaneHouse p={[-2, 4.2, -17]} w={3.6} d={3} st={2} wall="stone" roof="tile" glow />
        <LaneHouse p={[14, 5, -16]} w={3.4} d={3} st={2} wall="brick" roof="slate" />
        <LaneHouse p={[-16, 4, -14]} w={3.4} d={3} st={3} wall="stone" roof="tin" />
        <LaneHouse p={[3.5, 3.4, -13]} w={3.0} d={3} st={2} wall="stone" roof="tile" />
        <LaneHouse p={[-6.5, 3.2, -12]} w={2.8} d={3} st={3} wall="brick" roof="tin" glow />
        <LaneHouse p={[20, 3.5, -8]} w={3.0} d={3} st={2} wall="stone" roof="slate" />
        <LaneHouse p={[-21, 3, -8]} w={3.2} d={3} st={2} wall="brick" roof="tile" />

        {/* palms pushed back so they do not block the gate; broadleaf trees behind */}
        <Palm p={[-7.5, 0, -4.5]} s={1.0} lean={0.3} />
        <Palm p={[8.2, 0, -6]} s={1.0} lean={-0.3} />
        <Palm p={[-10.5, 0, 0]} s={1.0} lean={0.2} />
        <Palm p={[12, 0, -3]} s={1.1} lean={-0.2} />
        {[[-6.5, -5, 1.0], [7.2, -4.5, 1.1], [-8, -9, 1.3], [8.5, -9.5, 1.2], [1, -10, 1.4], [-13, -4, 1.2], [14, -3, 1.1]].map(([x, z, s], i) => (
          <group key={i} position={[x, 0, z]} scale={s}>
            <Cyl rt={0.1} rb={0.16} h={1.8} p={[0, 0.9, 0]} m={trunk} seg={7} />
            <Ball rad={1.1} p={[0, 2.3, 0]} sc={[1.2, 0.9, 1.2]} m={i % 2 ? leaf : leaf2} />
            <Ball rad={0.8} p={[0.6, 2.9, 0.2]} m={i % 2 ? leaf2 : leaf} />
          </group>
        ))}
        <pointLight position={[0, 1.2, 6.2]} intensity={1.2} distance={7} color="#ffb060" />
      </group>
    );
  }

  return { 'dolakha-bhimsen-temple': { Main, Env } };
}
