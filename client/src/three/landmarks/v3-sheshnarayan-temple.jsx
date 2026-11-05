/* Sheshnarayan Temple, Pharping: a small squat Newar Vishnu temple with ONE overhanging gilded roof and red timber lattice
   windows, pressed against the foot of a huge overhanging grey limestone cliff. Front = +z onto a paved courtyard with dark-green
   ponds, small pink and white domed shrines, orange deity + grey Garuda; stone stairs climb the wooded hill (right) to the cave.
   1 unit ~ 2.5 m. Temple ~6.5 m wide, ~5.5 m tall. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, LatticeWindow, Diyo, PrayerFlags, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sm = (v, a, b) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------------- cliff profile (shared by Main and the placement helpers) ---------------- */
  const CL_X = 15;
  const cliffTop = (x) => 8.4 - sm(Math.abs(x), 9, 15) * 4.2 + Math.sin(x * 0.9) * 0.4 + Math.sin(x * 0.33) * 0.5;
  function cliffNoise(x, y) {
    return 0.34 * Math.sin(x * 0.8 + y * 0.5) + 0.22 * Math.sin(x * 1.6 - y * 0.9 + 1) + 0.07 * Math.sin(x * 3.7 + y * 2.3)
      + 0.2 * Math.sin(x * 2.0) * Math.sin(y * 0.4 + 1.2)
      + 0.38 * (1 - Math.abs(Math.sin(x * 1.15 + Math.sin(y * 0.6) * 1.6))) + 0.22 * (1 - Math.abs(Math.sin(y * 1.3 + x * 0.4)));
  }
  function cliffZ(x, y) {
    const A = Math.exp(-(((x - 2.2) / 3.9) ** 2));
    const A2 = 0.45 * Math.exp(-(((x + 4.5) / 2.6) ** 2));
    const V = sm(y, 2.8, 4.4) * (1 - sm(y, 6.4, 8.4));
    const ax = Math.abs(x);
    const wing = (ax / CL_X) ** 2 * 3.4;
    const bulge = (2.25 * A + 1.1 * A2) * V;
    const n = cliffNoise(x, y) * (0.6 + 0.5 * sm(y, 1, 4));
    return -2.5 + bulge + wing + n - sm(y, 7.2, 8.6) * 1.2;
  }

  /* ---------------- terrain behind / around (heightfield) ---------------- */
  function hgt(x, z) {
    let h = 0;
    const w = sm(-z, 1.9, 3.1);
    if (w > 0) h = w * (cliffTop(clamp(x, -12, 12)) + 0.2 + Math.max(0, -z - 3.2) * 0.45);
    const side = Math.max(0, Math.abs(x) - (x > 0 ? 9.5 : 11.5));
    const front = sm(14 - z, 0, 10);
    h += side * (x > 0 ? 0.62 : 0.5) * (0.35 + 0.65 * front) + Math.max(0, side - 6) * 0.3;
    // keep the front courtyard flat
    const dx = Math.max(-11.5 - x, x - 9, 0);
    const dz = Math.max(-2.3 - z, z - 11, 0);
    const d = Math.hypot(dx, dz);
    const flat = 1 - sm(d, 0, 2.5);
    h = h * (1 - flat) - 0.06 * flat;
    h += (Math.sin(x * 0.55 + z * 0.3) * 0.35 + Math.sin(x * 0.2 - z * 0.45) * 0.55) * Math.min(1, Math.max(0, h) / 3);
    const r = Math.hypot(x, z * 0.85);
    if (r > 32) h += (r - 32) * 0.7;
    return 26 * Math.tanh(h / 26);
  }

  /* ---------------- colours ---------------- */
  const T_GREY = new THREE.Color('#6e6e66');
  const T_GREY2 = new THREE.Color('#82807a');
  const T_OCHRE = new THREE.Color('#9a8a66');
  const T_BROWN = new THREE.Color('#7a6248');
  const T_DARK = new THREE.Color('#2f2d29');
  const T_MOSS = new THREE.Color('#55713a');
  const T_SOIL = new THREE.Color('#364428');

  /* ---------------- the cliff: faceted, one discrete tone per face ---------------- */
  function CliffFace() {
    const geo = useMemo(() => {
      const NX = 150, NY = 84;
      const P = [];
      for (let j = 0; j <= NY; j += 1) {
        for (let i = 0; i <= NX; i += 1) {
          const x = -CL_X + (2 * CL_X * i) / NX;
          const yy = (cliffTop(x) * j) / NY;
          P.push([x, yy, cliffZ(x, yy)]);
        }
      }
      const pos = [], col = [];
      const c = new THREE.Color();
      const face = (a, b, d, k) => {
        const cx = (a[0] + b[0] + d[0]) / 3, cy = (a[1] + b[1] + d[1]) / 3;
        const top = cliffTop(cx);
        const n = cliffNoise(cx * 1.7, cy * 1.3);
        c.copy(n < 0.5 ? T_GREY : n < 0.93 ? T_GREY2 : T_OCHRE);
        const streak = Math.sin(cx * 1.3 + Math.sin(cy * 0.5) * 1.5);
        if (streak > 0.93) c.copy(T_BROWN);
        const under = sm(cy, 3.0, 3.6) * (1 - sm(cy, 5.4, 6.0)) * (1 - sm(Math.abs(cx - 2), 4.2, 5.0));
        if (under > 0.5 + 0.2 * rnd(k * 0.37)) c.copy(T_DARK);
        const mo = Math.sin(cx * 1.9 + 2) * Math.sin(cy * 1.4 + cx * 0.6) + 0.2 * Math.sin(cx * 3.1 + cy * 2);
        if (mo > 0.85) c.copy(T_MOSS);
        if (cy > top - 0.8) c.copy(rnd(k * 0.71) > 0.45 ? T_SOIL : T_MOSS);
        if (cy < 0.5) c.lerp(T_SOIL, 0.35);
        c.multiplyScalar(0.88 + 0.2 * rnd(k));
        for (let q = 0; q < 3; q += 1) col.push(c.r, c.g, c.b);
        pos.push(...a, ...b, ...d);
      };
      let k = 0;
      for (let j = 0; j < NY; j += 1) {
        for (let i = 0; i < NX; i += 1) {
          const a = P[j * (NX + 1) + i], b = P[j * (NX + 1) + i + 1], d = P[(j + 1) * (NX + 1) + i], e = P[(j + 1) * (NX + 1) + i + 1];
          face(a, b, d, k += 1);
          face(b, e, d, k += 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return (
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.98} side={THREE.DoubleSide} />
      </mesh>
    );
  }

  function CliffDetails() {
    const M = useM();
    const stal = M.plain('#7a725f', { roughness: 0.95 });
    const stal2 = M.plain('#625b4c', { roughness: 0.95 });
    const root = M.plain('#5c4a3a', { roughness: 1 });
    const root2 = M.plain('#6d6354', { roughness: 1 });
    const leaf = M.plain('#3f5c2e', { roughness: 1 });
    const stals = useMemo(() => Array.from({ length: 6 }, (_, i) => {
      const x = -1.2 + i * 1.5 + rnd(i + 1) * 0.5;
      const y = 3.9 + rnd(i * 5 + 2) * 0.7;
      return { x, y, z: cliffZ(x, y) + 0.2, len: 0.7 + rnd(i + 9) * 0.8, r: 0.22 + rnd(i + 3) * 0.14 };
    }), []);
    const roots = useMemo(() => Array.from({ length: 14 }, (_, i) => {
      const x = -7 + rnd(i * 7 + 4) * 17;
      const yt = 7.3 + rnd(i) * 0.6, len = 1.6 + rnd(i * 2 + 5) * 2.2;
      const yc = yt - len / 2;
      return { x, y: yc, z: cliffZ(x, yc) + 0.16, len, tilt: (rnd(i + 20) - 0.5) * 0.5, tilt2: (rnd(i + 31) - 0.5) * 0.9 };
    }), []);
    return (
      <group>
        {stals.map((s, i) => (
          <group key={`s${i}`} position={[s.x, s.y, s.z]}>
            <Ball rad={s.r * 0.6} p={[0, 0.05, 0]} sc={[1.2, 1.1, 1]} m={stal2} />
            <Ball rad={s.r * 0.6} p={[0.03, -s.len * 0.4, 0.02]} sc={[1, 2.6, 0.9]} m={stal} />
            <Ball rad={s.r * 0.3} p={[-0.02, -s.len * 0.95, 0.03]} sc={[1, 2.2, 1]} m={stal2} />
          </group>
        ))}
        {roots.map((r, i) => (
          <group key={`r${i}`}>
            <Cyl rt={0.06} rb={0.09} h={r.len} p={[r.x, r.y, r.z]} r={[0, 0, r.tilt]} m={i % 2 ? root : root2} seg={6} />
            <Cyl rt={0.04} rb={0.07} h={r.len * 0.6} p={[r.x + 0.18, r.y + 0.3, r.z + 0.03]} r={[0, 0, r.tilt2]} m={i % 2 ? root2 : root} seg={6} />
            <Ball rad={0.1} p={[r.x, r.y - r.len / 2, r.z]} sc={[1.2, 1.2, 0.8]} m={leaf} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------------- shrines ---------------- */
  function Arch({ w, h, p, m, z = 0 }) {
    /* dark arched opening (faces +z) */
    return (
      <group position={p}>
        <Box s={[w, h - w / 2, 0.06]} p={[0, (h - w / 2) / 2, z]} m={m} cast={false} />
        <Cyl rt={w / 2} h={0.06} p={[0, h - w / 2, z]} r={[Math.PI / 2, 0, 0]} m={m} seg={16} />
      </group>
    );
  }

  function DomedShrine({ p = [0, 0, 0], s = 1, r = 0, wall = '#c4574f', trim = '#8f3a35', white = false }) {
    const M = useM();
    const wm = white ? M.plain('#f0ece2', { roughness: 0.85 }) : M.mat('plaster', 1, 1, { color: '#f0a79d' });
    const tm = white ? M.plain('#b9b4a8', { roughness: 0.9 }) : M.plain(trim, { roughness: 0.9 });
    const dm = M.plain('#120c09', { roughness: 1 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        {white ? (
          <>
            <Box s={[1.9, 0.14, 1.9]} p={[0, 0.07, 0]} m={tm} />
            <Box s={[1.6, 0.14, 1.6]} p={[0, 0.21, 0]} m={wm} />
            <Box s={[1.3, 0.14, 1.3]} p={[0, 0.35, 0]} m={tm} />
          </>
        ) : (
          <Box s={[1.25, 0.14, 1.25]} p={[0, 0.07, 0]} m={tm} />
        )}
        <Box s={[0.98, 0.78, 0.98]} p={[0, white ? 0.81 : 0.53, 0]} m={wm} />
        <Box s={[1.06, 0.07, 1.06]} p={[0, white ? 1.24 : 0.96, 0]} m={tm} />
        <mesh position={[0, white ? 1.26 : 0.98, 0]} scale={[1, white ? 0.62 : 1, 1]} material={wm} castShadow><sphereGeometry args={[0.54, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.04} rb={0.07} h={0.2} p={[0, white ? 1.52 : 1.58, 0]} m={white ? tm : M.gold} seg={8} />
        <Ball rad={0.055} p={[0, white ? 1.66 : 1.72, 0]} m={M.gold} />
        {(white ? [-0.3, 0, 0.3] : [-0.24, 0.24]).map((x, i) => <Arch key={i} w={white ? 0.24 : 0.3} h={0.55} p={[x, white ? 0.5 : 0.28, 0.5]} m={dm} />)}
      </group>
    );
  }

  function Pedestal({ p, s = [0.5, 0.3, 0.5] }) {
    const M = useM();
    return <Box s={s} p={[p[0], p[1] + s[1] / 2, p[2]]} m={M.mat('granite', 1, 1, { color: '#a8a59c' })} />;
  }

  function OrangeDeity({ p, s = 1 }) {
    const M = useM();
    const o = M.plain('#d4451f', { roughness: 0.75 });
    return (
      <group position={p} scale={s}>
        <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={M.mat('granite', 1, 1, { color: '#8e8c83' })} />
        <Box s={[0.3, 0.45, 0.18]} p={[0, 0.52, 0]} m={o} />
        <Box s={[0.1, 0.4, 0.1]} p={[-0.15, 0.52, 0.04]} r={[0, 0, 0.3]} m={o} />
        <Box s={[0.1, 0.4, 0.1]} p={[0.15, 0.52, 0.04]} r={[0, 0, -0.3]} m={o} />
        <Ball rad={0.1} p={[0, 0.84, 0]} m={o} />
        <mesh position={[0, 0.98, 0]} material={o}><coneGeometry args={[0.08, 0.18, 8]} /></mesh>
        <Box s={[0.5, 0.5, 0.06]} p={[0, 0.58, -0.12]} m={o} />
      </group>
    );
  }

  function GarudaStone({ p, s = 1 }) {
    const M = useM();
    const g = M.mat('granite', 1, 1, { color: '#8f8d84' });
    return (
      <group position={p} scale={s}>
        <Box s={[0.5, 0.25, 0.5]} p={[0, 0.125, 0]} m={g} />
        <Box s={[0.3, 0.14, 0.26]} p={[0, 0.32, 0]} m={g} />
        <Box s={[0.22, 0.34, 0.16]} p={[0, 0.56, 0]} m={g} />
        <Ball rad={0.1} p={[0, 0.82, 0.02]} m={g} />
        <mesh position={[0, 0.8, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={g}><coneGeometry args={[0.035, 0.1, 8]} /></mesh>
        <Box s={[0.05, 0.36, 0.2]} p={[-0.17, 0.58, -0.02]} r={[0, 0, 0.2]} m={g} />
        <Box s={[0.05, 0.36, 0.2]} p={[0.17, 0.58, -0.02]} r={[0, 0, -0.2]} m={g} />
      </group>
    );
  }

  /* ---------------- the main temple ---------------- */
  function Temple() {
    const M = useM();
    const brick = M.mat('brick', 2, 1, { color: '#e9a690' });
    const wood = M.plain('#4a2418', { roughness: 0.8 });
    const redwood = M.plain('#7c2b1c', { roughness: 0.75 });
    const gold = M.plain('#a97f26', { roughness: 0.4, metalness: 0.6 });
    const dark = M.plain('#120a07', { roughness: 1 });
    const stone = M.mat('granite', 3, 1, { color: '#b5b1a7' });
    const pink = M.mat('plaster', 1, 1, { color: '#f0a79d' });
    const W = 2.8, D = 2.2, WH = 1.0;
    const winX = [-1.08, -0.58, 0.58, 1.08];
    return (
      <group position={[2.4, 0, -1.4]} scale={1.6}>
        {/* plinth */}
        <Box s={[3.7, 0.18, 3.1]} p={[0, 0.09, 0.05]} m={stone} />
        <Box s={[3.45, 0.16, 2.85]} p={[0, 0.26, 0.05]} m={M.mat('granite', 3, 1, { color: '#c4a08c' })} />
        <Box s={[1.5, 0.1, 0.4]} p={[0, 0.05, 1.85]} m={stone} />
        <group position={[0, 0.34, 0]}>
          {/* body */}
          <Box s={[W, WH, D]} p={[0, WH / 2, 0]} m={brick} />
          {/* front timber face: base rail, posts, header */}
          <Box s={[W + 0.04, 0.08, 0.06]} p={[0, 0.04, D / 2 + 0.02]} m={wood} cast={false} />
          <Box s={[W + 0.04, 0.1, 0.07]} p={[0, WH - 0.04, D / 2 + 0.03]} m={wood} cast={false} />
          {[-1.4, -0.8, 0, 0.8, 1.4].map((x, i) => <Box key={i} s={[0.1, WH, 0.1]} p={[x, WH / 2, D / 2 + 0.03]} m={wood} />)}
          {/* door */}
          <Box s={[0.56, 0.78, 0.06]} p={[0, 0.42, D / 2 + 0.04]} m={dark} cast={false} />
          <Box s={[0.7, 0.07, 0.1]} p={[0, 0.84, D / 2 + 0.06]} m={gold} cast={false} />
          {[-0.33, 0.33].map((x, i) => <Box key={i} s={[0.06, 0.8, 0.08]} p={[x, 0.42, D / 2 + 0.06]} m={gold} cast={false} />)}
          <mesh position={[0, 0.9, D / 2 + 0.06]} material={gold}><torusGeometry args={[0.28, 0.035, 6, 20, Math.PI]} /></mesh>
          {/* lattice windows: two each side of the door */}
          {winX.map((x, i) => <LatticeWindow key={i} p={[x, 0.46, D / 2 + 0.02]} w={0.36} h={0.58} bars={6} />)}
          {/* sides: lattice too */}
          {[-1, 1].map((k) => (
            <group key={k}>
              <LatticeWindow p={[k * (W / 2 + 0.01), 0.46, 0.32]} r={k * Math.PI / 2} w={0.4} h={0.55} bars={6} />
              <LatticeWindow p={[k * (W / 2 + 0.01), 0.46, -0.32]} r={k * Math.PI / 2} w={0.4} h={0.55} bars={6} />
            </group>
          ))}
          {/* gilded frieze + red timber band under the eave */}
          <Box s={[W + 0.12, 0.12, D + 0.12]} p={[0, WH + 0.04, 0]} m={redwood} />
          <Box s={[W + 0.14, 0.04, 0.05]} p={[0, WH - 0.1, D / 2 + 0.07]} m={gold} cast={false} />
          {/* eave struts (tunala): deep carved brackets carrying the roof edge, two layers */}
          {[-1.3, -0.87, -0.44, 0, 0.44, 0.87, 1.3].map((x, i) => (
            <group key={i} position={[x, WH + 0.04, D / 2 + 0.1]}>
              <Box s={[0.08, 0.62, 0.08]} p={[0, -0.04, 0.3]} r={[-0.95, 0, 0]} m={redwood} cast={false} />
              <Box s={[0.07, 0.3, 0.07]} p={[0, -0.22, 0.12]} r={[-0.3, 0, 0]} m={wood} cast={false} />
              <Box s={[0.1, 0.1, 0.34]} p={[0, 0.1, 0.18]} m={gold} cast={false} />
            </group>
          ))}
          {[-1, 1].map((k) => [-0.7, 0, 0.7].map((z, i) => (
            <group key={`${k}${i}`} position={[k * (W / 2 + 0.1), WH + 0.04, z]}>
              <Box s={[0.08, 0.6, 0.08]} p={[k * 0.3, -0.04, 0]} r={[0, 0, k * 0.95]} m={redwood} cast={false} />
            </group>
          )))}
          {/* the single gilded roof */}
          <group position={[0, WH + 0.1, 0]}>
            <Box s={[3.1, 0.05, 2.5]} p={[0, -0.02, 0]} m={M.plain('#26110b', { roughness: 1 })} cast={false} />
            <Roof w={3.2} d={2.6} h={0.9} y={0} m={M.plain('#7a5f28', { roughness: 0.5, metalness: 0.5 })} sag={1.3} lift={0.14} fascia={false} />
            <Box s={[3.2, 0.07, 0.06]} p={[0, 0.0, 1.3]} m={gold} cast={false} />
            <Box s={[3.2, 0.07, 0.06]} p={[0, 0.0, -1.3]} m={gold} cast={false} />
            <Box s={[0.06, 0.07, 2.6]} p={[1.6, 0.0, 0]} m={gold} cast={false} />
            <Box s={[0.06, 0.07, 2.6]} p={[-1.6, 0.0, 0]} m={gold} cast={false} />
            {/* hanging gilt pendants on the front eave */}
            {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[0.05, 0.1, 0.02]} p={[-1.45 + i * 0.36, -0.08, 1.32]} m={gold} cast={false} />)}
            <Cyl rt={0.03} rb={0.06} h={0.22} p={[0, 0.98, 0]} m={M.gold} seg={8} />
            <Ball rad={0.06} p={[0, 1.12, 0]} m={M.gold} />
          </group>
          {/* small pink arched stucco alcove on the left front corner of the plinth */}
          <group position={[-1.95, 0, 0.35]} />
        </group>
        {/* pink arched porch against the left flank */}
        <group position={[-2.15, 0.34, 0.35]}>
          <Box s={[0.7, 0.8, 0.8]} p={[0, 0.4, 0]} m={pink} />
          <Arch w={0.3} h={0.55} p={[0.0, 0.0, 0.405]} m={dark} />
          <Box s={[0.82, 0.06, 0.9]} p={[0, 0.83, 0]} m={M.plain('#8f3a35')} />
        </group>
        {/* oil lamp stand + bell before the temple */}
        <Diyo p={[0.7, 0.16, 1.85]} light />
        <Diyo p={[-0.7, 0.16, 1.85]} light />
      </group>
    );
  }

  /* low pink-red shrine to the left of the main temple */
  function PinkShrine() {
    const M = useM();
    const pink = M.mat('plaster', 1, 1, { color: '#f0a79d' });
    const trim = M.plain('#8f3a35', { roughness: 0.9 });
    const dark = M.plain('#120a07', { roughness: 1 });
    const tile = M.mat('roof', 3, 3, { color: '#8a4a38' });
    return (
      <group position={[-3.9, 0, -1.0]} scale={1.15}>
        <Box s={[2.5, 0.18, 1.9]} p={[0, 0.09, 0]} m={M.mat('granite', 2, 1, { color: '#b5b1a7' })} />
        <Box s={[2.2, 0.95, 1.5]} p={[0, 0.65, 0]} m={pink} />
        <Box s={[2.3, 0.1, 1.6]} p={[0, 1.17, 0]} m={trim} />
        <Roof w={2.6} d={1.9} h={0.5} y={1.2} m={tile} sag={1.1} lift={0.04} />
        {/* arched doorway + a window */}
        <Arch w={0.72} h={0.9} p={[0.4, 0.18, 0.76]} m={dark} />
        <Box s={[0.86, 0.06, 0.08]} p={[0.4, 1.1, 0.77]} m={trim} cast={false} />
        <Box s={[0.34, 0.34, 0.05]} p={[-0.55, 0.78, 0.76]} m={dark} cast={false} />
        <Box s={[0.4, 0.05, 0.08]} p={[-0.55, 0.57, 0.77]} m={trim} cast={false} />
        {/* small finial at the ridge */}
        <Cyl rt={0.03} rb={0.06} h={0.18} p={[0, 1.8, 0]} m={M.gold} seg={8} />
        <Ball rad={0.05} p={[0, 1.93, 0]} m={M.gold} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <CliffFace />
        <CliffDetails />
        <Temple />
        <PinkShrine />
        {/* orange deity and grey Garuda on plinths, front-left of the temple */}
        <OrangeDeity p={[-5.4, 0, 1.4]} s={1.8} />
        <GarudaStone p={[-3.1, 0, 1.7]} s={1.9} />
        <Frame s={[11, 5.5, 7]} p={[-0.3, 2.6, 1.2]} />
      </group>
    );
  }

  /* ---------------- environment ---------------- */
  function Terrain() {
    const geo = useMemo(() => {
      const NX = 110, NZ = 100, X0 = -50, X1 = 50, Z0 = -50, Z1 = 36;
      const pos = [], col = [], idx = [];
      const c = new THREE.Color();
      for (let j = 0; j <= NZ; j += 1) {
        for (let i = 0; i <= NX; i += 1) {
          const x = X0 + ((X1 - X0) * i) / NX;
          const z = Z0 + ((Z1 - Z0) * j) / NZ;
          const y = hgt(x, z);
          pos.push(x, y, z);
          const n = rnd(i * 7 + j * 13);
          c.set('#34522f').lerp(new THREE.Color('#2a432a'), clamp(y / 14, 0, 0.8)).lerp(new THREE.Color('#4a5035'), n * 0.25);
          if (y < 0.1) c.set('#46583a').lerp(new THREE.Color('#5a5c44'), n * 0.4);
          col.push(c.r, c.g, c.b);
        }
      }
      for (let j = 0; j < NZ; j += 1) {
        for (let i = 0; i < NX; i += 1) {
          const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1;
          idx.push(a, d, b, b, d, e);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  /* paved courtyard: irregular outline, stone kerbs, grass creeping in */
  const PAVE = { x0: -11.6, x1: 8.8, z0: -2.0, z1: 9.4 };
  const OUT = [[-11, -2], [-4, -2.1], [8, -2], [8.7, 1], [8.1, 4.2], [8.8, 7], [7, 9], [2, 9.4], [-3, 9], [-8, 9.3], [-11, 8], [-11.6, 4], [-11.1, 1]];
  const LONG = { x0: -9.0, x1: -2.0, z0: 4.2, z1: 7.4 };
  const ROUND = { x: 4.6, z: 5.6, r: 2.0 };

  function Paving() {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      OUT.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
      s.closePath();
      const h1 = new THREE.Path();
      h1.moveTo(LONG.x0, -LONG.z0); h1.lineTo(LONG.x0, -LONG.z1); h1.lineTo(LONG.x1, -LONG.z1); h1.lineTo(LONG.x1, -LONG.z0); h1.lineTo(LONG.x0, -LONG.z0);
      const h2 = new THREE.Path();
      h2.absarc(ROUND.x, -ROUND.z, ROUND.r, 0, Math.PI * 2, true);
      s.holes.push(h1, h2);
      return new THREE.ShapeGeometry(s, 40);
    }, []);
    const pave = M.plain('#6a675e', { roughness: 0.95 });
    const stone = M.mat('granite', 2, 1, { color: '#a9a69c' });
    const kerb = M.mat('granite', 2, 1, { color: '#bdbab0' });
    const grass = M.plain('#3b5a30', { roughness: 1 });
    const water = M.plain('#27473a', { roughness: 0.5, metalness: 0, envMapIntensity: 0.15 });
    const bottom = M.plain('#16261e', { roughness: 1 });
    const lw = LONG.x1 - LONG.x0, ld = LONG.z1 - LONG.z0;
    const edges = useMemo(() => OUT.map((a, i) => {
      const b = OUT[(i + 1) % OUT.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, len: Math.hypot(dx, dz), ang: -Math.atan2(dz, dx), back: i < 3 };
    }), []);
    return (
      <group>
        <mesh geometry={geo} material={pave} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} receiveShadow />
        {/* kerbs / low retaining walls round the compound */}
        {edges.map((e, i) => <Box key={`k${i}`} s={[e.len + 0.1, e.back ? 0.22 : 0.14, 0.26]} p={[e.x, e.back ? 0.11 : 0.07, e.z]} r={[0, e.ang, 0]} m={kerb} cast={false} />)}
        {/* grass creeping onto the edges */}
        {OUT.map(([x, z], i) => (
          <mesh key={`g${i}`} position={[x + (x > 0 ? 0.6 : -0.6), 0.03, z + (z > 4 ? 0.7 : -0.4)]} rotation={[-Math.PI / 2, 0, 0]} material={grass}>
            <circleGeometry args={[1.0 + rnd(i) * 0.8, 10]} />
          </mesh>
        ))}
        {/* long pond: sunk water, stone lining, raised coping */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(LONG.x0 + LONG.x1) / 2, -0.03, (LONG.z0 + LONG.z1) / 2]} material={water}><planeGeometry args={[lw, ld]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(LONG.x0 + LONG.x1) / 2, -0.7, (LONG.z0 + LONG.z1) / 2]} material={bottom}><planeGeometry args={[lw, ld]} /></mesh>
        <Box s={[lw, 0.7, 0.06]} p={[(LONG.x0 + LONG.x1) / 2, -0.35, LONG.z0 + 0.03]} m={stone} cast={false} />
        <Box s={[lw, 0.7, 0.06]} p={[(LONG.x0 + LONG.x1) / 2, -0.35, LONG.z1 - 0.03]} m={stone} cast={false} />
        <Box s={[0.06, 0.7, ld]} p={[LONG.x0 + 0.03, -0.35, (LONG.z0 + LONG.z1) / 2]} m={stone} cast={false} />
        <Box s={[0.06, 0.7, ld]} p={[LONG.x1 - 0.03, -0.35, (LONG.z0 + LONG.z1) / 2]} m={stone} cast={false} />
        <Box s={[lw + 0.5, 0.14, 0.26]} p={[(LONG.x0 + LONG.x1) / 2, 0.07, LONG.z0 - 0.13]} m={stone} />
        <Box s={[lw + 0.5, 0.14, 0.26]} p={[(LONG.x0 + LONG.x1) / 2, 0.07, LONG.z1 + 0.13]} m={stone} />
        <Box s={[0.26, 0.14, ld]} p={[LONG.x0 - 0.13, 0.07, (LONG.z0 + LONG.z1) / 2]} m={stone} />
        <Box s={[0.26, 0.14, ld]} p={[LONG.x1 + 0.13, 0.07, (LONG.z0 + LONG.z1) / 2]} m={stone} />
        {/* steps down at the west end */}
        {[0, 1, 2].map((i) => <Box key={i} s={[0.4, 0.14, 1.3]} p={[LONG.x0 + 0.25 + i * 0.4, -0.08 - i * 0.14, 5.8]} m={stone} />)}
        {/* round pond */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUND.x, -0.03, ROUND.z]} material={water}><circleGeometry args={[ROUND.r, 36]} /></mesh>
        <mesh position={[ROUND.x, -0.3, ROUND.z]} material={stone}><cylinderGeometry args={[ROUND.r + 0.03, ROUND.r + 0.03, 0.6, 36, 1, true]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUND.x, 0.14, ROUND.z]} material={stone}><ringGeometry args={[ROUND.r, ROUND.r + 0.3, 36]} /></mesh>
        <mesh position={[ROUND.x, 0.07, ROUND.z]} material={stone}><cylinderGeometry args={[ROUND.r + 0.3, ROUND.r + 0.3, 0.14, 36, 1, true]} /></mesh>
      </group>
    );
  }

  /* raised walkway with a metal railing along the long pond */
  function Walkway() {
    const M = useM();
    const stone = M.mat('granite', 4, 1, { color: '#a29f95' });
    const steel = M.plain('#c4cacc', { roughness: 0.45, metalness: 0.5 });
    const x0 = LONG.x0 - 0.2, x1 = LONG.x1 + 2.0, z = LONG.z1 + 0.75;
    const n = 16;
    return (
      <group>
        <Box s={[x1 - x0, 0.28, 1.2]} p={[(x0 + x1) / 2, 0.14, z]} m={stone} />
        {Array.from({ length: n + 1 }, (_, i) => <Box key={i} s={[0.06, 0.62, 0.06]} p={[x0 + ((x1 - x0) * i) / n, 0.58, LONG.z1 + 0.2]} m={steel} cast={false} />)}
        <Box s={[x1 - x0, 0.05, 0.05]} p={[(x0 + x1) / 2, 0.9, LONG.z1 + 0.2]} m={steel} cast={false} />
        <Box s={[x1 - x0, 0.04, 0.04]} p={[(x0 + x1) / 2, 0.6, LONG.z1 + 0.2]} m={steel} cast={false} />
      </group>
    );
  }

  function CaveShrine() {
    const M = useM();
    const wall = M.mat('plaster', 2, 1, { color: '#e07d72' });
    const stele = M.mat('granite', 1, 1, { color: '#6e6c66' });
    const dark = M.plain('#0b0706', { roughness: 1 });
    const ledge = M.mat('granite', 1, 1, { color: '#8e8b82' });
    const stelae = [[-0.62, 0.78, 0.46], [0, 1.1, 0.62], [0.64, 0.74, 0.46]];
    return (
      <group position={[7.0, 0, -1.6]}>
        <Box s={[3.3, 1.9, 0.35]} p={[0, 0.95, 0]} m={wall} />
        <Box s={[3.3, 0.14, 0.7]} p={[0, 0.07, 0.3]} m={ledge} />
        {[-0.75, 0.75].map((x, i) => <Cyl key={i} rt={0.11} h={0.1} p={[x, 1.55, 0.18]} r={[Math.PI / 2, 0, 0]} m={dark} seg={14} />)}
        {stelae.map(([x, h, w], i) => (
          <group key={i} position={[x, 0.14, 0.24]}>
            <Box s={[w, h - w / 2, 0.14]} p={[0, (h - w / 2) / 2, 0]} m={stele} />
            <Cyl rt={w / 2} h={0.14} p={[0, h - w / 2, 0]} r={[Math.PI / 2, 0, 0]} m={stele} seg={14} />
          </group>
        ))}
        {[-0.8, -0.35, 0.35, 0.8].map((x, i) => <Diyo key={i} p={[x, 0.16, 0.5]} light={i % 2 === 0} />)}
      </group>
    );
  }

  function RestHouse() {
    const M = useM();
    const brick = M.mat('brick', 3, 2, { color: '#e29783' });
    const wood = M.plain('#4a2418', { roughness: 0.8 });
    const tile = M.mat('roof', 4, 3, { color: '#8a5a46' });
    return (
      <group position={[-12, 0, -1]} scale={0.85}>
        <Box s={[3.2, 0.2, 3.0]} p={[0, 0.1, 0]} m={M.stone} />
        <Box s={[3.0, 1.6, 2.8]} p={[0, 1.0, 0]} m={brick} />
        <Box s={[3.1, 0.1, 2.9]} p={[0, 1.5, 0]} m={wood} />
        <Roof w={4.0} d={3.6} h={0.8} y={1.8} m={tile} sag={1} lift={0.04} />
        {/* deep sloping tiled eave over the front */}
        <Box s={[3.9, 0.08, 1.1]} p={[0, 1.45, 1.85]} r={[0.38, 0, 0]} m={tile} />
        {[-0.7, 0, 0.7].map((x, i) => <Box key={i} s={[0.08, 0.7, 0.08]} p={[x * 1.9 / 0.7 * 0.5, 1.15, 2.1]} r={[0.8, 0, 0]} m={wood} cast={false} />)}
        {[-0.85, 0.85].map((x, i) => <LatticeWindow key={i} p={[x, 1.3, 1.42]} w={0.5} h={0.55} bars={5} />)}
        <Box s={[0.7, 1.0, 0.06]} p={[0, 0.7, 1.42]} m={M.plain('#2a150c')} cast={false} />
        {[-0.6, 0.6].map((z, i) => <LatticeWindow key={`s${i}`} p={[1.52, 1.3, z]} r={Math.PI / 2} w={0.5} h={0.55} bars={5} />)}
      </group>
    );
  }

  function Stairs() {
    const M = useM();
    const stone = M.mat('granite', 1, 1, { color: '#9b988d' });
    const rail = M.plain('#6a665c');
    const steps = useMemo(() => {
      const a = [9.0, 1.8], b = [13.5, -3.2];
      const n = 22;
      return Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const x = a[0] + (b[0] - a[0]) * t + Math.sin(t * 5) * 0.35;
        const z = a[1] + (b[1] - a[1]) * t;
        return { x, z, y: hgt(x, z) };
      });
    }, []);
    return (
      <group>
        {steps.map((s, i) => <Box key={i} s={[1.3, 0.2, 0.55]} p={[s.x, s.y + 0.06, s.z]} r={[0, -0.75, 0]} m={stone} cast={false} />)}
        {(() => {
          const e = steps[steps.length - 1];
          const rock = M.plain('#6e6a60', { roughness: 1 });
          return (
            <group position={[e.x + 0.4, e.y, e.z - 0.7]}>
              <Box s={[2.4, 0.22, 2.0]} p={[0, 0.05, 0]} r={[0, -0.75, 0]} m={stone} />
              <Ball rad={1.1} p={[0.3, 0.6, -0.9]} sc={[1.3, 1.1, 0.8]} m={M.plain('#120c09', { roughness: 1 })} />
              <Ball rad={0.7} p={[-0.9, 0.9, -1.0]} sc={[1, 1.5, 0.9]} m={rock} />
              <Ball rad={0.7} p={[1.5, 0.9, -1.0]} sc={[1, 1.5, 0.9]} m={rock} />
              <Ball rad={1.0} p={[0.3, 1.9, -1.2]} sc={[1.6, 0.8, 0.9]} m={rock} />
            </group>
          );
        })()}
        {steps.filter((_, i) => i % 3 === 0).map((s, i) => <Box key={`p${i}`} s={[0.1, 0.5, 0.1]} p={[s.x - 0.55, s.y + 0.3, s.z - 0.45]} m={rail} cast={false} />)}
      </group>
    );
  }

  function HillBuilding({ x = 17.5, z = -4.5, rot = -0.5, sc = 1 }) {
    const M = useM();
    const wall = M.plain('#f1eee6', { roughness: 0.85 });
    const roof = M.plain('#b5382c', { roughness: 0.8 });
    const glass = M.plain('#2b3a44', { roughness: 0.4 });
    const y0 = hgt(x, z) - 0.9;
    return (
      <group position={[x, y0, z]} rotation={[0, rot, 0]} scale={sc}>
        <Box s={[4.4, 4.4, 3.6]} p={[0, 2.2, 0]} m={wall} />
        {[0.9, 2.3, 3.7].map((y, k) => [-1.4, -0.45, 0.5, 1.4].map((xx, i) => <Box key={`${k}${i}`} s={[0.5, 0.55, 0.05]} p={[xx, y, 1.82]} m={glass} cast={false} />))}
        <Roof w={5.2} d={4.4} h={1.0} y={4.4} m={roof} sag={1} lift={0.05} />
        <Box s={[4.5, 0.1, 0.5]} p={[0, 2.95, 1.9]} m={M.plain('#b09070')} cast={false} />
        <Box s={[5.0, 0.12, 0.8]} p={[0, 0.06, 2.1]} m={M.stone} cast={false} />
      </group>
    );
  }

  /* instanced forest */
  function Forest() {
    const pts = useMemo(() => {
      const out = [];
      let k = 0;
      while (out.length < 300 && k < 8000) {
        k += 1;
        const band = out.length < 140;
        const flank = !band && out.length < 190;
        let x = -46 + rnd(k * 3 + 1) * 92;
        let z = -46 + rnd(k * 7 + 2) * 62;
        if (band) { x = -26 + rnd(k * 3 + 1) * 52; z = -12 + rnd(k * 7 + 2) * 8.6; }
        if (flank) { const left = rnd(k * 5 + 3) < 0.5; x = left ? -27 + rnd(k * 3 + 1) * 8 : 15 + rnd(k * 3 + 1) * 9; z = -3.4 + rnd(k * 7 + 2) * 7; }
        const inPave = x > PAVE.x0 - 1 && x < PAVE.x1 + 1 && z > PAVE.z0 - 0.5 && z < PAVE.z1 + 1;
        if (inPave) continue;
        if (!flank && z > -3.4 && (x < 26 && x > -30)) continue;
        if (z > 3 && x > -30 && x < 8 && !flank) continue;
        if (z > 16) continue;
        if (Math.hypot(x - 17.5, z + 4.5) < 4.5 || Math.hypot(x + 15, z + 6.5) < 5.5) continue;
        if (flank && x > 0 && x < 17 && z > -4.5 && z < 3.5) continue;
        const y = hgt(x, z);
        if (y < -0.1 && z < 0) continue;
        out.push({ x, z, y, s: 0.8 + rnd(k) * 0.9 });
      }
      return out;
    }, []);
    const setTrunks = (m) => {
      if (!m) return;
      const o = new THREE.Object3D();
      pts.forEach((t, i) => { o.position.set(t.x, t.y + 1.3 * t.s, t.z); o.scale.set(t.s, t.s, t.s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
      m.instanceMatrix.needsUpdate = true;
    };
    const setCrowns = (m) => {
      if (!m) return;
      const o = new THREE.Object3D();
      const c = new THREE.Color();
      pts.forEach((t, i) => {
        o.position.set(t.x + (rnd(i + 5) - 0.5) * 0.6, t.y + (3.2 + rnd(i) * 0.8) * t.s, t.z);
        o.scale.set(t.s * 0.7, t.s * 0.55, t.s * 0.7);
        o.rotation.y = rnd(i * 2) * 6;
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
        c.set(i % 3 === 0 ? '#3e6234' : i % 3 === 1 ? '#46703a' : '#527a40');
        m.setColorAt(i, c);
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    return (
      <group>
        <instancedMesh ref={setTrunks} args={[null, null, pts.length]} castShadow>
          <cylinderGeometry args={[0.13, 0.22, 2.6, 6]} />
          <meshStandardMaterial color="#4e3a2a" roughness={1} />
        </instancedMesh>
        <instancedMesh ref={setCrowns} args={[null, null, pts.length]} castShadow>
          <icosahedronGeometry args={[1.9, 1]} />
          <meshStandardMaterial roughness={1} flatShading />
        </instancedMesh>
      </group>
    );
  }

  function Env() {
    const M = useM();
    const stone = M.mat('granite', 2, 1, { color: '#a9a69c' });
    const sky = M.plain('#9fb4a0', { roughness: 1 });
    void sky;
    return (
      <group>
        <Terrain />
        <Paving />
        <Walkway />
        <CaveShrine />
        <RestHouse />
        <Stairs />
        <HillBuilding />
        <HillBuilding x={-15} z={-6.5} rot={0.35} sc={1.45} />
        <Forest />
        {/* small domed shrines at the pond edge */}
        <DomedShrine p={[LONG.x1 + 1.5, 0, LONG.z1 + 0.75]} s={1.15} />
        <DomedShrine p={[-1, 0, 3.3]} s={1.0} white />
        <DomedShrine p={[7.1, 0.0, 2.2]} s={0.85} r={-0.4} wall="#c4574f" />
        {/* stone lamp post (festival photo) */}
        <Box s={[0.3, 0.5, 0.3]} p={[1.4, 0.25, 3.0]} m={stone} />
        <Box s={[0.18, 0.7, 0.18]} p={[1.4, 0.85, 3.0]} m={stone} />
        <Box s={[0.34, 0.2, 0.34]} p={[1.4, 1.3, 3.0]} m={stone} />
        {/* prayer flags strung through the trees */}
        <PrayerFlags from={[-12, 6.0, 4]} to={[-4, 5.4, -2]} n={14} />
        <PrayerFlags from={[-9, 5.2, 8]} to={[-1.5, 5.8, -0.5]} n={14} />
        <PrayerFlags from={[7, 5.5, 3]} to={[12, 6.5, -2]} n={9} />
        <PointLights />
      </group>
    );
  }

  function PointLights() {
    return (
      <group>
        <pointLight position={[7.0, 0.8, -1.0]} intensity={1.2} distance={4} color="#ffb35a" />
        <pointLight position={[1.7, 0.6, 0.6]} intensity={1.2} distance={4} color="#ffb35a" />
      </group>
    );
  }

  return { 'sheshnarayan-temple': { Main, Env } };
}
