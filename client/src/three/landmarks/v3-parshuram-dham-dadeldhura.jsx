/* Parshuram Dham (Jogbudha, Dadeldhura): an open riverside pilgrim ground on the stony Mahakali bank.
   Landmark = a tall painted statue of bearded Parshuram (coral skin, saffron dhoti, green sash, bead garlands, golden bow/staff
   on the viewer's right, quiver behind the left shoulder, axe low on the left) on a 5-step plinth. Pink-capped WELCOME arch with
   Hanuman (blue roof) and Bhairav (pink roof) mini shrines, red-brick Ganesh temple with yellow bands, small coloured huts and a
   red pavilion along a grey paver path under tall straight trees, rock outcrop with white spire shrine + flag at the river edge.
   Authored in metres inside a 1/3 scale group. Positions of the statue/shrines are estimates from the 5 photos. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, THREE, useMemo, wallMat } = K;
  const S = 1 / 3;
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 7.3) * 43758.5453; return v - Math.floor(v); };

  const CORAL = '#e88f6a', SAFFRON = '#ee8a2a', GREEN = '#2e8b57', GOLDEN = '#d2a64a', BLACK = '#1d1a18';
  const CREAM = '#f1e1c8', PINK = '#e99a9f', BLUE = '#3f86d6', RED = '#b5302a';

  /* ---------- geometry helpers ---------- */
  function Gable({ w, d, h, p = [0, 0, 0], m }) {
    const g = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
      const e = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
      e.translate(0, 0, -d / 2);
      return e;
    }, [w, d, h]);
    return <mesh position={p} material={m} geometry={g} castShadow receiveShadow />;
  }

  function Person({ p, c = '#c0392b', c2 = '#2c3e6a', s = 1, r = 0 }) {
    const M = useM();
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Cyl rt={0.11} rb={0.09} h={0.8} p={[0, 0.4, 0]} m={M.plain(c2)} seg={6} />
        <Cyl rt={0.2} rb={0.17} h={0.65} p={[0, 1.12, 0]} m={M.plain(c)} seg={7} />
        <Ball rad={0.12} p={[0, 1.6, 0]} m={M.plain('#b07a56')} />
      </group>
    );
  }

  function Garland({ hw, yb, w }) {
    const M = useM();
    const g = useMemo(() => {
      const pts = [];
      const yt = 9.6;
      for (let j = 0; j <= 16; j += 1) {
        const t = (j / 16) * 2 - 1;
        const x = t * hw;
        const y = yb + t * t * (yt - yb);
        const rad = 1.2 + ((y - 5.75) / 4.1) * 0.3;
        const z = rad * 0.58 * Math.sqrt(Math.max(0.05, 1 - (x / rad) * (x / rad))) + 0.1;
        pts.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, w, 5, false);
    }, [hw, yb, w]);
    return <mesh geometry={g} material={M.plain('#2a1c14', { roughness: 0.5 })} castShadow />;
  }

  /* ---------- the statue ---------- */
  function Statue() {
    const M = useM();
    const skin = M.plain(CORAL, { roughness: 0.6 });
    const saf = M.plain(SAFFRON, { roughness: 0.65 });
    const safD = M.plain('#d56d1c', { roughness: 0.65 });
    const grn = M.plain(GREEN, { roughness: 0.6 });
    const blk = M.plain(BLACK, { roughness: 0.8 });
    const gold = M.plain(GOLDEN, { roughness: 0.4, metalness: 0.35 });
    const wood = M.plain('#4a3020');
    const cream = M.plain('#e6dcc6', { roughness: 0.9 });
    const bead = M.plain('#2a1c14', { roughness: 0.5 });
    return (
      <group>
        {/* 5-step rectangular plinth */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} s={[6.0 - i * 0.7, 0.5, 4.8 - i * 0.55]} p={[0, 0.25 + i * 0.5, 0]} m={i === 4 ? M.plain('#8f8c86', { roughness: 0.95 }) : i % 2 ? M.plain('#dcc2b2', { roughness: 0.95 }) : M.plain('#e8d2c2', { roughness: 0.95 })} />
        ))}
        <group position={[0, 2.5, 0]}>
          {/* feet and dhoti */}
          {[-0.55, 0.55].map((x) => <Box key={x} s={[0.75, 0.3, 1.2]} p={[x, 0.15, 0.25]} m={skin} />)}
          <group position={[0, 2.8, 0]} scale={[1, 1, 0.62]}>
            <Cyl rt={1.12} rb={1.3} h={5} m={saf} seg={16} />
          </group>
          <Box s={[0.55, 3.8, 0.16]} p={[0, 2.5, 0.84]} m={safD} />
          <Box s={[0.12, 3.4, 0.14]} p={[-0.45, 2.6, 0.83]} m={safD} />
          <Box s={[0.12, 3.4, 0.14]} p={[0.45, 2.6, 0.83]} m={safD} />
          {/* green sash with floral band and hanging end */}
          <group position={[0, 5.5, 0]} scale={[1, 1, 0.62]}><Cyl rt={1.28} rb={1.2} h={0.65} m={grn} seg={16} /></group>
          <Box s={[0.7, 0.45, 0.2]} p={[0.1, 5.5, 0.74]} m={M.plain('#f2c230')} />
          <Box s={[0.85, 2.1, 0.12]} p={[-0.45, 4.45, 0.84]} r={[0, 0, 0.08]} m={M.plain('#f6a02a')} />
          <Box s={[0.87, 0.3, 0.14]} p={[-0.45, 4.2, 0.86]} r={[0, 0, 0.08]} m={grn} />
          <Box s={[0.87, 0.18, 0.14]} p={[-0.43, 3.6, 0.86]} r={[0, 0, 0.08]} m={grn} />
          <Box s={[0.5, 1.2, 0.1]} p={[0.55, 4.9, 0.84]} r={[0, 0, -0.1]} m={M.plain('#f6a02a')} />
          {/* torso */}
          <group position={[0, 7.8, 0]} scale={[1, 1, 0.58]}><Cyl rt={1.5} rb={1.2} h={4.1} m={skin} seg={16} /></group>
          <Ball rad={0.5} p={[-1.55, 9.45, 0]} sc={[1, 0.9, 0.8]} m={skin} />
          <Ball rad={0.5} p={[1.55, 9.45, 0]} sc={[1, 0.9, 0.8]} m={skin} />
          {/* arms hanging, armlets, hands */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <Cyl rt={0.36} rb={0.3} h={3.8} p={[sx * 1.85, 7.45, 0.05]} r={[0, 0, sx * 0.04]} m={skin} seg={8} />
              <Cyl rt={0.4} rb={0.4} h={0.22} p={[sx * 1.8, 8.8, 0.05]} m={blk} seg={8} />
              <Cyl rt={0.33} rb={0.33} h={0.16} p={[sx * 1.9, 6.4, 0.05]} m={blk} seg={8} />
              <Ball rad={0.36} p={[sx * 1.95, 5.4, 0.1]} m={skin} />
            </group>
          ))}
          {/* long bead garlands: continuous U-curves from the neck to the sash */}
          <Garland hw={0.62} yb={6.1} w={0.07} />
          <Garland hw={0.78} yb={7.0} w={0.08} />
          <Garland hw={0.92} yb={7.9} w={0.07} />
          
          {/* neck, head, beard, hair */}
          <Cyl rt={0.5} rb={0.62} h={0.8} p={[0, 9.95, 0]} m={skin} seg={10} />
          <group position={[0, -2.8, 0]} scale={1.25}>
          <Ball rad={0.82} p={[0, 11.05, 0.05]} sc={[0.82, 1.02, 0.86]} m={skin} />
          <mesh position={[0, 9.75, 0.42]} rotation={[Math.PI, 0, 0]} scale={[1, 1, 0.55]} material={blk}><coneGeometry args={[0.7, 3.0, 10]} /></mesh>
          <Box s={[0.95, 0.16, 0.2]} p={[0, 10.85, 0.78]} m={blk} />
          <Box s={[0.18, 0.3, 0.2]} p={[0, 11.1, 0.82]} m={skin} />
          {[-0.28, 0.28].map((x) => <group key={x}><Box s={[0.26, 0.1, 0.06]} p={[x, 11.4, 0.74]} m={M.plain('#f6efe2')} /><Box s={[0.08, 0.09, 0.07]} p={[x, 11.4, 0.77]} m={blk} /><Box s={[0.38, 0.07, 0.07]} p={[x, 11.6, 0.73]} m={blk} /></group>)}
          <Box s={[0.1, 0.28, 0.06]} p={[0, 11.78, 0.76]} m={M.plain('#d4281c')} />
          <Ball rad={0.88} p={[0, 11.45, -0.2]} sc={[0.88, 0.95, 0.82]} m={blk} />
          <Cyl rt={0.2} rb={0.4} h={0.9} p={[0, 12.3, -0.05]} m={blk} seg={10} />
          <Ball rad={0.28} p={[0, 12.9, -0.05]} m={blk} />
          </group>
          {/* golden bow/staff on the viewer's right (+x), top above the head */}
          <group position={[2.5, 0, 0.3]} scale={[1.2, 1, 0.7]}>
            <Cyl rt={0.24} rb={0.28} h={13.6} p={[0, 6.8, 0]} m={gold} seg={12} />
            <Ball rad={0.24} p={[0, 13.6, 0]} m={gold} />
          </group>
          {/* quiver behind the left shoulder with arrows */}
          <group position={[-1.25, 10.2, -0.7]} rotation={[0, 0, 0.38]}>
            <Cyl rt={0.3} rb={0.24} h={2.7} p={[0, 0, 0]} m={M.plain('#f0a21f')} seg={10} />
            <Cyl rt={0.31} rb={0.31} h={0.2} p={[0, 0.9, 0]} m={grn} seg={10} />
            {[-0.12, 0.05, 0.2].map((x, i) => <group key={i}><Cyl rt={0.03} rb={0.03} h={0.9} p={[x, 1.7 + i * 0.1, 0]} m={wood} seg={4} /><Box s={[0.1, 0.35, 0.05]} p={[x, 2.1 + i * 0.1, 0]} m={M.plain('#f6efe2')} /></group>)}
          </group>
          {/* axe held low on the viewer's left */}
          <group position={[-2.4, 0, 0.45]}>
            <Cyl rt={0.1} rb={0.1} h={6.9} p={[0, 3.45, 0]} m={wood} seg={6} />
            <Box s={[0.14, 1.1, 0.95]} p={[0, 6.4, 0.45]} m={M.plain('#8d939a', { metalness: 0.6, roughness: 0.4 })} />
          </group>
        </group>
      </group>
    );
  }

  /* ---------- pink WELCOME arch + two mini shrines ---------- */
  function Gateway() {
    const M = useM();
    const white = M.plain('#f3eee2', { roughness: 0.85 });
    const pink = M.plain('#e8939a', { roughness: 0.7 });
    const blue = M.plain('#2f78cc', { roughness: 0.7 });
    const redM = M.plain(RED);
    const creamM = M.plain('#f3e4cc', { roughness: 0.9 });
    const arch = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-2.9, 0); sh.lineTo(2.9, 0); sh.lineTo(2.9, 4.5); sh.lineTo(-2.9, 4.5); sh.closePath();
      const h = new THREE.Path();
      h.moveTo(-1.75, 0); h.lineTo(-1.75, 2.3); h.absarc(0, 2.3, 1.75, Math.PI, 0, true); h.lineTo(1.75, 0); h.closePath();
      sh.holes.push(h);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: false, curveSegments: 14 });
      g.translate(0, 0, -0.4);
      return g;
    }, []);
    const Wing = ({ x, roofM, flip }) => (
      <group position={[x, 0.5, 0]}>
        <Box s={[3.1, 0.55, 2.8]} p={[0, 0.275, 0]} m={pink} />
        <Box s={[3, 2.0, 2.6]} p={[0, 1.55, 0]} m={creamM} />
        <Gable w={3} d={2.6} h={0.95} p={[0, 2.55, 0]} m={creamM} />
        {[-1, 1].map((sg) => <Box key={sg} s={[1.95, 0.16, 3.1]} p={[sg * 0.84, 3.02, 0]} r={[0, 0, -sg * 0.5]} m={roofM} />)}
        <Cyl rt={0.74} rb={0.74} h={0.14} p={[0, 1.45, 1.32]} r={[Math.PI / 2, 0, 0]} m={white} seg={20} />
        <Cyl rt={0.62} rb={0.62} h={0.18} p={[0, 1.45, 1.34]} r={[Math.PI / 2, 0, 0]} m={M.plain('#3a2a24')} seg={20} />
        <Ball rad={0.3} p={[0, 1.2, 1.38]} sc={[1, 1.1, 0.4]} m={M.plain(flip ? '#d9532a' : '#4a6fb0')} />
        <Box s={[1.5, 0.34, 0.05]} p={[0, 2.3, 1.32]} m={white} />
        <Box s={[1.2, 0.1, 0.06]} p={[0, 2.3, 1.34]} m={redM} />
        <pointLight position={[0, 1.4, 1.8]} intensity={0.7} distance={4} color="#ffb060" />
      </group>
    );
    return (
      <group>
        {/* whitewashed stone base with red steps */}
        <Box s={[16.5, 0.55, 3.4]} p={[0, 0.275, 0]} m={M.plain('#ece7da', { roughness: 0.95 })} />
        {[0, 1, 2].map((i) => <Box key={i} s={[4.2, 0.16, 0.55]} p={[0, 0.08 + i * 0.16 - 0.0, 2.1 - i * 0.0 + (2 - i) * 0.0 + 0.0 - i * 0.0]} m={M.plain('#b5262a')} />)}
        <Box s={[4.4, 0.16, 0.5]} p={[0, 0.08, 2.0]} m={M.plain('#b5262a')} />
        <Box s={[4.4, 0.16, 0.5]} p={[0, 0.24, 1.6]} m={M.plain('#c23a30')} />
        <group position={[0, 0.55, 0]}>
          <mesh geometry={arch} material={white} castShadow receiveShadow />
          {/* blue pillar bases, lettering strips */}
          {[-2.35, 2.35].map((x) => (
            <group key={x}>
              <Box s={[1.15, 1.0, 0.86]} p={[x, 0.5, 0]} m={blue} />
              <Box s={[0.42, 2.9, 0.05]} p={[x, 2.55, 0.42]} m={M.plain('#faf8f0')} />
              {[0, 1, 2, 3, 4, 5, 6].map((k) => <Box key={k} s={[0.3, 0.17, 0.06]} p={[x, 1.35 + k * 0.4, 0.45]} m={redM} />)}
            </group>
          ))}
          {/* pink flat cap with thin gable and gold pinnacle */}
          <Box s={[6.9, 0.3, 1.5]} p={[0, 4.65, 0]} m={white} />
          <Gable w={6.9} d={1.5} h={0.8} p={[0, 4.8, 0]} m={pink} />
          <Box s={[6.5, 0.22, 1.2]} p={[0, 4.38, 0]} m={redM} />
          <Cyl rt={0.03} rb={0.1} h={0.7} p={[0, 5.9, 0]} m={M.gold} seg={8} />
          <Ball rad={0.12} p={[0, 6.3, 0]} m={M.gold} />
          {/* hanging bell */}
          <mesh position={[0, 3.55, 0]} material={M.gold}><coneGeometry args={[0.2, 0.34, 10]} /></mesh>
          <Cyl rt={0.015} rb={0.015} h={0.5} p={[0, 3.9, 0]} m={M.dark} seg={4} />
        </group>
        <Wing x={-5.6} roofM={blue} />
        <Wing x={5.6} roofM={pink} flip />
      </group>
    );
  }

  /* ---------- Ganesh temple + railed yard ---------- */
  function GaneshTemple() {
    const M = useM();
    const brick = M.mat('brick', 5, 5, { color: '#ff8068', roughness: 0.9, emissive: '#7a2a18' });
    const yel = M.plain('#f0c818', { roughness: 0.7, emissive: '#503c00' });
    const dk = M.plain('#4e3626', { roughness: 0.85 });
    const steel = M.plain('#b9bec4', { metalness: 0.8, roughness: 0.35 });
    const pad = M.plain('#b9b6ae', { roughness: 0.95 });
    const posts = [];
    for (let i = 0; i <= 5; i += 1) posts.push([-3.6 + i * 1.44, 3.6]);
    for (let i = 1; i <= 4; i += 1) { posts.push([-3.6, 3.6 - i * 1.6]); posts.push([3.6, 3.6 - i * 1.6]); }
    return (
      <group>
        <Box s={[8.4, 0.3, 8.2]} p={[0, 0.15, 0]} m={pad} />
        <Box s={[3.6, 3.7, 3.6]} p={[0, 2.15, -0.4]} m={brick} />
        {[[0.95, 0.25], [2.25, 0.4], [3.2, 0.25]].map(([y, h], i) => <Box key={i} s={[3.7, h, 3.7]} p={[0, y + 0.3, -0.4]} m={yel} />)}
        <Box s={[1.1, 1.95, 0.1]} p={[0, 1.3, 1.44]} m={dk} />
        <Box s={[0.7, 0.45, 0.08]} p={[0, 2.9, 1.43]} m={dk} />
        <Cyl rt={0.35} rb={0.35} h={0.08} p={[0, 3.1, 1.43]} r={[Math.PI / 2, 0, 0]} m={dk} seg={12} />
        <Box s={[0.45, 0.4, 0.06]} p={[0, 3.55, 1.43]} m={dk} />
        {/* dark wooden overhanging flat eave with struts */}
        <Box s={[5.6, 0.28, 5.6]} p={[0, 4.15, -0.4]} m={dk} />
        <Box s={[3.8, 0.2, 3.8]} p={[0, 3.95, -0.4]} m={dk} />
        {[-1.4, 0, 1.4].map((x) => <Box key={x} s={[0.14, 0.14, 1.9]} p={[x, 3.7, 2.0]} r={[0.5, 0, 0]} m={dk} />)}
        {[-1.4, 0, 1.4].map((z) => [-1, 1].map((sg) => <Box key={`${z}${sg}`} s={[1.9, 0.14, 0.14]} p={[sg * 2.0, 3.7, z - 0.4]} r={[0, 0, sg * 0.5]} m={dk} />))}
        {/* steel railing */}
        {posts.map(([x, z], i) => <Cyl key={i} rt={0.045} rb={0.045} h={1.1} p={[x, 0.85, z]} m={steel} seg={6} />)}
        {[0.75, 1.3].map((y) => <group key={y}>
          <Box s={[2.9, 0.06, 0.06]} p={[-2.15, y, 3.6]} m={steel} />
          <Box s={[2.9, 0.06, 0.06]} p={[2.15, y, 3.6]} m={steel} />
          <Box s={[0.06, 0.06, 6.4]} p={[-3.6, y, 0.4]} m={steel} />
          <Box s={[0.06, 0.06, 6.4]} p={[3.6, y, 0.4]} m={steel} />
        </group>)}
        {/* notice board */}
        <Box s={[1.5, 1.1, 0.08]} p={[3.1, 1.2, 2.6]} r={[0, -0.3, 0]} m={M.plain('#e9e2cd')} />
        <Box s={[0.1, 0.8, 0.1]} p={[3.1, 0.5, 2.55]} m={dk} />
        <pointLight position={[0, 2, 2.6]} intensity={0.8} distance={5} color="#ffb060" />
      </group>
    );
  }

  /* ---------- paver path, lamp ---------- */
  function Path() {
    const M = useM();
    const paver = M.mat('herring', 2, 22, { color: '#ffffff', roughness: 0.95, emissive: '#6a6a68' });
    const edge = M.plain('#8e8d89');
    return (
      <group>
        <Box s={[3.2, 0.1, 62]} p={[0, 0.05, -14]} m={paver} cast={false} />
        <Box s={[0.2, 0.14, 62]} p={[-1.7, 0.07, -14]} m={edge} cast={false} />
        <Box s={[0.2, 0.14, 62]} p={[1.7, 0.07, -14]} m={edge} cast={false} />
      </group>
    );
  }

  function Lamp({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.07} rb={0.12} h={6.2} p={[0, 3.1, 0]} m={M.plain('#6a6e72', { metalness: 0.7, roughness: 0.4 })} seg={8} />
        <Box s={[0.9, 0.08, 0.08]} p={[-0.4, 6.15, 0]} m={M.plain('#6a6e72')} />
        <mesh position={[-0.8, 6.05, 0]}><sphereGeometry args={[0.2, 10, 8]} /><meshBasicMaterial color="#fff0c0" toneMapped={false} /></mesh>
        <pointLight position={[-0.8, 5.8, 0]} intensity={1.4} distance={12} color="#ffd9a0" />
      </group>
    );
  }

  /* ---------- Main ---------- */
  function ParshuramMain() {
    return (
      <group>
        <group scale={S}>
          <group position={[-2, 0, 0]}><Statue /></group>
          <group position={[-9, 0, 9]} rotation={[0, 0.18, 0]}><Gateway /></group>
          <Box s={[22, 0.08, 2.4]} p={[-3, 0.04, 14.5]} m={useM().plain('#9d9b94')} cast={false} />
          <group position={[-15, 0, -9]}><GaneshTemple /></group>
          <group position={[6, 0, 0]}><Path /></group>
          <Box s={[6.4, 0.08, 2]} p={[1.6, 0.04, 3.6]} m={useM().plain('#9d9b94')} cast={false} />
          <Lamp p={[9.4, 0, -5]} />
          <Person p={[4, 0, 5.5]} c="#d9534f" c2="#3b3b55" />
          <Person p={[8, 0, 14]} c="#f0c040" c2="#5a4a3a" s={0.95} r={3} />
        </group>
        <Frame s={[10, 5.9, 6.6]} p={[-1.4, 2.9, 2.2]} />
      </group>
    );
  }

  /* ---------- Env pieces ---------- */
  function TallTree({ p, h = 13, bare = false, paint = false, k = 0, s = 1 }) {
    const M = useM();
    const trunk = M.plain('#8d8577', { roughness: 1 });
    const crown = M.plain(['#6f8a4a', '#7a9250', '#66813f'][k % 3], { roughness: 1 });
    const twig = M.plain('#6a5f52', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.38} rb={0.6} h={h} p={[0, h / 2, 0]} m={trunk} seg={8} />
        {paint && <><Cyl rt={0.63} rb={0.66} h={0.45} p={[0, 1.2, 0]} m={M.plain(RED)} seg={8} /><Cyl rt={0.62} rb={0.63} h={0.9} p={[0, 0.45, 0]} m={M.plain('#f1ede4')} seg={8} /></>}
        {bare
          ? [0, 1, 2, 3, 4, 5].map((i) => <Cyl key={i} rt={0.05} rb={0.18} h={5.2} p={[Math.cos(i * 1.05) * 1.4, h - 0.5, Math.sin(i * 1.05) * 1.4]} r={[Math.sin(i * 1.05) * 0.6, 0, -Math.cos(i * 1.05) * 0.6]} m={twig} seg={4} />)
          : [[0, h + 1.0, 0, 2.0], [1.7, h - 0.3, 0.5, 1.6], [-1.6, h + 0.1, -0.6, 1.7], [0.3, h + 0.2, 1.6, 1.5]].map(([x, y, z, r], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1.05, 0.8, 1.05]} m={crown} />)}
      </group>
    );
  }

  function Willow({ p }) {
    const M = useM();
    const leaf = M.plain('#7f9150', { roughness: 1 });
    return (
      <group position={p}>
        <Cyl rt={0.3} rb={0.5} h={4.8} p={[0, 2.4, 0]} m={M.plain('#5c4e3d')} seg={7} />
        <Ball rad={3.4} p={[0, 5.6, 0]} sc={[1.3, 0.5, 1.3]} m={leaf} />
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2, rr = i % 2 ? 4.3 : 3.2;
          return <Box key={i} s={[0.3, 3.6 + (i % 3) * 0.3, 0.08]} p={[Math.cos(a) * rr, 3.75, Math.sin(a) * rr]} r={[0, -a + 1.5708, 0]} m={leaf} cast={false} />;
        })}
      </group>
    );
  }

  function Hut({ p, wall = '#f1e1c8', roof = '#e0603a', s = 1, kind = 'pyr', r = 0 }) {
    const M = useM();
    const wm = M.plain(wall, { roughness: 0.9 });
    const rm = M.plain(roof, { roughness: 0.7 });
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Box s={[3.6, 0.4, 3.6]} p={[0, 0.2, 0]} m={M.plain('#f0ece2')} />
        <Box s={[2.5, 2.2, 2.5]} p={[0, 1.5, 0]} m={wm} />
        <Box s={[0.8, 1.3, 0.06]} p={[0, 1.05, 1.27]} m={M.plain('#5b3a24')} />
        {kind === 'pyr' && <Roof w={3.4} d={3.4} h={1.3} y={2.6} m={rm} sag={1} lift={0} />}
        {kind === 'flat' && <><Box s={[3.5, 0.18, 3.5]} p={[0, 2.7, 0]} m={rm} /><Roof w={2.6} d={2.6} h={1.1} y={2.8} m={rm} sag={1} lift={0} /></>}
        {kind === 'gable' && <Gable w={3.2} d={3.4} h={1.4} p={[0, 2.6, 0]} m={rm} />}
        <Ball rad={0.1} p={[0, kind === 'gable' ? 4.1 : 4.0, 0]} m={M.gold} />
      </group>
    );
  }

  /* open-front canopied shrine on posts (photo 1) */
  function CanopyShrine({ p, roof = '#ee8f6a', base = '#f3e6d0', s = 1, r = 0 }) {
    const M = useM();
    const rm = M.plain(roof, { roughness: 0.7 });
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <Box s={[4.2, 0.45, 4.2]} p={[0, 0.22, 0]} m={M.plain('#f0ece2')} />
        <Box s={[2.2, 1.2, 2.0]} p={[0, 1.05, -0.4]} m={M.plain(base, { roughness: 0.9 })} />
        <Box s={[0.7, 0.8, 0.08]} p={[0, 1.0, 0.62]} m={M.plain('#8a3a2a')} />
        {[[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].map(([x, z], i) => <Cyl key={i} rt={0.1} rb={0.1} h={2.5} p={[x, 1.7, z]} m={M.plain('#c8c0b0')} seg={6} />)}
        <Box s={[4.4, 0.2, 4.4]} p={[0, 2.95, 0]} m={rm} />
        <Roof w={4.0} d={4.0} h={1.4} y={3.05} m={rm} sag={1} lift={0} />
        <Ball rad={0.14} p={[0, 4.55, 0]} m={M.gold} />
      </group>
    );
  }

  function Pavilion({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[4.4, 0.25, 3.4]} p={[0, 0.12, 0]} m={M.plain('#c9c4b8')} />
        {[[-1.9, -1.4], [1.9, -1.4], [-1.9, 1.4], [1.9, 1.4]].map(([x, z], i) => <Cyl key={i} rt={0.09} rb={0.09} h={2.6} p={[x, 1.5, z]} m={M.plain('#8a2a22')} seg={6} />)}
        <Roof w={5.2} d={4.2} h={1.2} y={2.8} m={M.plain('#d0392b', { roughness: 0.7 })} sag={1} lift={0} />
        <Box s={[5.2, 0.1, 0.1]} p={[0, 2.82, 2.1]} m={M.plain('#f1ede4')} />
      </group>
    );
  }

  function Rock({ p, s, r = 0, c = '#b5b1a7', t = 0 }) {
    const M = useM();
    return (
      <mesh position={p} scale={s} rotation={[0.2 * t, r, 0.15 * t]} material={M.plain(c, { roughness: 1 })} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </mesh>
    );
  }

  function Outcrop() {
    const M = useM();
    const rocks = [
      [0, 0.8, 0, 6.5, 1.7, 4.5], [1.4, 2.0, -0.4, 5, 1.1, 3.4], [-1.2, 1.5, 1.8, 3.6, 1.0, 2.4], [2.5, 3.0, -0.3, 3.2, 0.9, 2.4],
      [-5.0, 0.2, 1.0, 2.6, 1.0, 2.0], [6, 0.3, 2, 2.8, 1.2, 2.2], [3.5, 0.2, 3.8, 2.2, 0.8, 1.7], [-3.2, 0.5, -2.8, 2.6, 1.0, 2.0],
    ];
    return (
      <group>
        {rocks.map(([x, y, z, sx, sy, sz], i) => <Rock key={i} p={[x, y, z]} s={[sx, sy, sz]} r={i * 0.9} t={i % 3} c={i % 2 ? '#a9a59b' : '#b0aca1'} />)}
        {/* white spire shrine on top, pole with red/white flag */}
        <group position={[2.6, 3.7, -0.3]} scale={1.4}>
          <Box s={[1.3, 1.0, 1.3]} p={[0, 0.5, 0]} m={M.plain('#f6f3ec')} />
          <Cyl rt={0.05} rb={0.62} h={1.9} p={[0, 1.95, 0]} m={M.plain('#f6f3ec')} seg={8} />
          <Ball rad={0.1} p={[0, 3.0, 0]} m={M.plain(RED)} />
          <Box s={[0.5, 0.35, 0.06]} p={[0, 0.5, 0.67]} m={M.plain('#3a2a24')} />
          <Cyl rt={0.04} rb={0.05} h={7.5} p={[1.0, 3.5, 0.3]} m={M.plain('#b99a62')} seg={5} />
          <Box s={[0.12, 0.7, 1.4]} p={[1.0, 6.7, 1.0]} m={M.plain(RED)} />
          <Box s={[0.12, 0.7, 1.2]} p={[1.0, 6.0, 0.95]} m={M.plain('#f6f3ec')} />
        </group>
      </group>
    );
  }

  /* layered forested ridge: heightfield strip */
  function Ridge({ z0 = 0, depth = 60, H = 40, seed = 1, color = '#5d7561', x0 = -260, x1 = 260, base = -4, rotY = 0, p = [0, 0, 0] }) {
    const g = useMemo(() => {
      const NX = 44, NZ = 5;
      const pos = [], idx = [];
      for (let j = 0; j <= NZ; j += 1) {
        const t = j / NZ;
        for (let i = 0; i <= NX; i += 1) {
          const x = x0 + ((x1 - x0) * i) / NX;
          const n = 0.55 + 0.45 * Math.sin(x * 0.021 + seed) * Math.cos(x * 0.0073 + seed * 2.1) + 0.25 * (rnd(i * 3 + seed * 11) - 0.5);
          const prof = t < 0.35 ? (t / 0.35) : 1 - (t - 0.35) / 0.65 * 0.6;
          pos.push(x, base + Math.max(0, n) * H * prof, z0 - t * depth);
        }
      }
      for (let j = 0; j < NZ; j += 1) for (let i = 0; i < NX; i += 1) {
        const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      gg.setIndex(idx); gg.computeVertexNormals();
      return gg;
    }, [z0, depth, H, seed, x0, x1, base]);
    return <mesh geometry={g} position={p} rotation={[0, rotY, 0]} receiveShadow><meshStandardMaterial color={color} roughness={1} flatShading side={THREE.DoubleSide} /></mesh>;
  }

  function ParshuramEnv() {
    const M = useM();
    const ochre = M.plain('#b39c6a', { roughness: 1 });
    const litter = M.plain('#b3a58a', { roughness: 1 });
    const pale = M.plain('#c9bfa6', { roughness: 1 });
    const gravel = M.plain('#b9b09b', { roughness: 1 });
    const gravel2 = M.plain('#a59d89', { roughness: 1 });
    const chan = M.plain('#4f7a7e', { roughness: 0.25, metalness: 0.1 });
    const water = M.plain('#5e8788', { roughness: 0.25, metalness: 0.1 });
    const rockM = M.mat('rock', 20, 4, { color: '#8e8c86', roughness: 1 });
    const trees = [
      [-6, -9, 15, 0, 1], [-7, -19, 14, 0, 0], [3, -9, 16, 0, 1], [14.5, -9, 14, 0, 1], [27, -22, 15, 1, 0], [5, -30, 0, 0, 0],
      [-14, -4, 13, 0, 0], [-19, -14, 15, 1, 0], [-9, -20, 14, 0, 0], [24, -6, 15, 0, 1], [-26, 6, 14, 0, 0], [-22, 20, 15, 1, 0],
      [-30, -6, 16, 0, 0], [30, 8, 14, 0, 0], [22, 22, 13, 0, 0], [-34, 26, 15, 0, 0], [34, -14, 14, 1, 0], [28, 34, 16, 0, 0],
      [-8, 34, 14, 0, 0], [14, 40, 15, 1, 0], [-42, 10, 16, 0, 0], [44, 18, 15, 0, 0], [-18, 44, 14, 0, 0], [40, -2, 14, 0, 0],
    ];
    const bars = [[-30, -62, 40, 8], [30, -75, 50, 10], [-10, -95, 55, 12], [60, -100, 44, 9], [-60, -110, 60, 10], [10, -120, 40, 7], [10, -58, 46, 3.5], [-40, -72, 38, 3.5], [46, -84, 34, 4], [-6, -68, 30, 3], [-70, -86, 36, 4]];
    return (
      <group>
        <group scale={S}>
          {/* flat ochre plateau, level with the shrines, and the lip down to the river */}
          <Box s={[420, 2, 200]} p={[0, -1.02, 72]} m={ochre} cast={false} />
          <Box s={[420, 2, 24]} p={[0, -1.02, -16]} m={ochre} cast={false} />
          <Box s={[420, 0.5, 7.2]} p={[0, -1.6, -31.2]} r={[0.45, 0, 0]} m={ochre} cast={false} />
          <Box s={[420, 1, 24]} p={[0, -3.45, -40]} m={gravel} cast={false} />
          {/* rocky lip: grey boulders where the plateau ends */}
          {Array.from({ length: 26 }, (_, i) => <Rock key={'lip' + i} p={[-84 + i * 6.8 + rnd(i) * 3, -1.2 - (i % 2) * 0.5, -29.5 - rnd(i + 4) * 3.5]} s={[2.4 + rnd(i + 1) * 2.4, 1.3 + rnd(i + 2) * 1.2, 1.8 + rnd(i + 6) * 1.4]} r={i} t={i % 3} c={i % 2 ? '#8f8b82' : '#85817a'} />)}
          {/* shallow pale river with gravel bars */}
          <Box s={[420, 1, 130]} p={[0, -3.8, -120]} m={water} cast={false} />
          {Array.from({ length: 26 }, (_, i) => <mesh key={'gb' + i} position={[-200 + i * 16 + rnd(i + 20) * 8, -3.3, -46 - (i % 6) * 17 - rnd(i + 30) * 8]} scale={[16 + rnd(i + 40) * 30, 1, 3 + rnd(i + 50) * 6]} material={i % 3 ? gravel : gravel2} rotation={[0, (rnd(i + 60) - 0.5) * 0.2, 0]}><cylinderGeometry args={[1, 1, 0.5, 14]} /></mesh>)}
          {bars.map(([x, z, w, d], i) => <mesh key={i} position={[x, -3.3, z]} scale={[w, 1, d]} material={i % 2 ? gravel2 : gravel}><cylinderGeometry args={[1, 1, 0.5, 16]} /></mesh>)}
          {[[-30, -57, 80, 1.6], [25, -65, 90, 1.8], [-60, -79, 70, 1.6], [50, -92, 85, 1.8], [-15, -88, 70, 1.5], [0, -108, 110, 2]].map(([x, z, w, d], i) => <Box key={'ch' + i} s={[w, 0.1, d]} p={[x, -3.02, z]} m={chan} cast={false} />)}
          {[[-20, -68, 40], [40, -88, 36], [-50, -102, 44], [10, -52, 30]].map(([x, z, w], i) => <Box key={i} s={[w, 0.08, 1.2]} p={[x, -3.0, z]} m={M.plain('#e6efec', { roughness: 0.4 })} cast={false} />)}
          <Box s={[420, 2.5, 10]} p={[0, -2.6, -182]} m={gravel} cast={false} />
          <Box s={[420, 4, 10]} p={[0, 1, -186]} m={M.plain('#3f4630')} cast={false} />
          {Array.from({ length: 40 }, (_, i) => <Box key={'sc' + i} s={[7 + rnd(i) * 6, 1.5 + rnd(i + 3) * 4, 5]} p={[-200 + i * 10 + rnd(i + 8) * 4, 3 + rnd(i + 3) * 2, -184]} m={M.plain(i % 3 ? '#38412a' : '#4a5233')} cast={false} />)}
          {/* bathing outcrop at the river edge */}
          <group position={[14, -1.3, -21]} scale={1.75}><Outcrop /></group>
          <Box s={[26, 0.3, 1]} p={[39, -3.2, -57]} m={M.plain('#f2f6f4')} cast={false} />
          {[[18, -60, 16], [-22, -62, 20], [4, -64, 14]].map(([x, z, w], i) => <Box key={'rp' + i} s={[w, 0.08, 0.9]} p={[x, -3.2, z]} m={M.plain('#f2f6f4')} cast={false} />)}
          {Array.from({ length: 22 }, (_, i) => <Rock key={'cb' + i} p={[-52 + i * 5 + rnd(i) * 3, -0.9, -28.5 - rnd(i + 5) * 2]} s={[0.7 + rnd(i + 2) * 0.8, 0.45, 0.6 + rnd(i + 9) * 0.5]} r={i} t={i % 3} c={i % 2 ? '#a8a49a' : '#8e8c86'} />)}
          {[[18, -64], [21, -66], [31, -63], [27, -70]].map(([x, z], i) => <Person key={i} p={[x, -3, z]} c={['#d9534f', '#f0c040', '#3b82c4', '#e8e0d0'][i]} c2={['#3b3b55', '#7a5a3a', '#f0f0f0', '#5a3a2a'][i]} r={i} s={0.95} />)}
          <Person p={[11, 0, -11]} c="#e07a1f" c2="#e07a1f" r={2} />
          {/* shrine row 25-40 m down the path: scattered, different colours */}
          <Hut p={[-3, 0, -13]} roof="#3f86d6" wall="#f3e6d0" s={1.05} kind="gable" />
          <CanopyShrine p={[1.8, 0, -17]} roof="#ee8f6a" s={1.1} r={0.2} />
          <Hut p={[-9, 0, -15]} roof="#4a90d9" wall="#e9e2d0" s={0.9} kind="gable" r={-0.3} />
          <CanopyShrine p={[37, 0, -20]} roof="#e9949a" base="#f4e4c8" />
          <Pavilion p={[20, 0, -8]} />
          <Hut p={[-15, 0, -20]} roof="#e8869a" wall="#f1e1c8" s={0.8} kind="flat" r={0.4} />
          <Willow p={[-27, 0, 13]} />
          {trees.filter(([x, z]) => !(z > 3 && x > -24 && x < 40 && z < 38) && !(x < -10 && x > -32 && z > -8 && z < 8) && !(x < 0 && z > 8)).map(([x, z, h, bare, paint], i) => <TallTree key={i} p={[x, 0, z]} h={(h || 12) * 0.78} bare={!!bare || i % 2 === 1} paint={!!paint} k={i} s={0.95 + rnd(i) * 0.2} />)}
          <Person p={[8, 0, -10]} c="#2f9a6a" c2="#3b3b55" r={1.2} />
          <Person p={[10, 0, -13]} c="#e8c040" c2="#5a3a2a" r={2.2} s={0.9} />
          <Person p={[-4, 0, 14]} c="#c04a6a" c2="#2a2a40" r={0.5} />
          {/* sparse pale buildings: one yellow-white block behind the Ganesh temple, two far off */}
          <group position={[-22, 0, -8]}>
            <Box s={[8, 3.6, 5]} p={[0, 1.8, 0]} m={M.plain('#efe6b8', { roughness: 0.9 })} />
            <Box s={[8.6, 0.3, 5.6]} p={[0, 3.75, 0]} m={M.plain('#c7c1b2')} />
            <Box s={[1.4, 2, 0.1]} p={[-1.5, 1.0, 2.52]} m={M.plain('#6b4a2a')} />
          </group>
          <group position={[62, 0, 4]}>
            <Box s={[7, 3.2, 4.5]} p={[0, 1.6, 0]} m={M.plain('#f2efe6', { roughness: 0.9 })} />
            <Roof w={8} d={5.6} h={1.5} y={3.2} m={M.plain('#8f7a6a', { roughness: 0.9 })} sag={1} lift={0} />
          </group>
          <group position={[-58, 0, -4]}>
            <Box s={[6, 3, 4]} p={[0, 1.5, 0]} m={M.plain('#e9e4d6', { roughness: 0.9 })} />
            <Roof w={7} d={5} h={1.4} y={3} m={M.plain('#9a5b44', { roughness: 0.9 })} sag={1} lift={0} />
          </group>
          {/* layered hazy hills across the river and either side, no snow */}
          <Ridge z0={-188} depth={50} H={44} seed={1.3} color="#46604c" />
          <Ridge z0={-225} depth={60} H={48} seed={4.1} color="#6e8584" />
          <Ridge z0={-265} depth={70} H={68} seed={7.7} color="#8ea0a9" />
          <Ridge z0={-170} depth={50} H={24}  seed={2.2} color="#56705a" rotY={Math.PI / 2} x0={-120} x1={200} />
          <Ridge z0={-170} depth={50} H={26} seed={5.5} color="#5c7762" rotY={-Math.PI / 2} x0={-200} x1={120} />
          <Ridge z0={-190} depth={50} H={20} seed={9.2} color="#62795e" rotY={Math.PI} x0={-260} x1={260} p={[0, 0, 0]} />
        </group>
      </group>
    );
  }

  return { 'parshuram-dham-dadeldhura': { Main: ParshuramMain, Env: ParshuramEnv } };
}
