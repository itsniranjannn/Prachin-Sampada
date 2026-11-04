/* Chandannath Temple (Khalanga bazaar, Jumla, Karnali), 2,514 m.
   A tiny whitewashed cube shrine (~4.5 m) with a projecting chrome-yellow cornice and a wide, squat hammered copper-silver dome
   on a short ribbed drum with a spike finial. What makes it recognisable is the group of very tall slender timber lingo poles
   (~24 m) with huge drooping saffron streamers standing tight behind it, the smaller Bhairavnath hipped-roof shrine and the open
   Hanuman cell beside it, in a small yard among 2-3 storey stone houses with tin roofs and blue-railed continuous balconies,
   under smooth treeless terraced brown hills.
   Unit = 1 m. Front/door = +z; poles behind (-z). Layout estimated from photographs (no published plan). */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Diyo, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const WHITE = '#f2f0ea', YELLOW = '#e0b030', BRONZE = '#b4a37a', SAFFRON = '#e8892a';

  /* ---------- terrain: flat bazaar floor, smooth terraced brown hills behind and at the sides ---------- */
  function rawH(x, z) {
    const back = Math.max(0, -z - 24) * 0.8;
    const side = Math.max(0, Math.abs(x) - 34) * 0.5;
    const front = Math.max(0, z - 56) * 0.5;
    let h = back + side + front;
    if (h > 0) h += Math.sin(x * 0.06 + 1.3) * 0.5 * Math.min(1, h / 4);
    if (h > 0) h += (Math.sin(x * 0.3 + z * 0.05) * 0.4 + Math.sin(z * 0.17 + x * 0.11) * 0.3) * Math.min(1, h / 3);
    return Math.min(Math.max(h, 0), 46);
  }
  const STEP = 0.9;
  function hgt(x, z) {
    const h = rawH(x, z);
    if (h < 0.01) return 0;
    const t = h / STEP, fl = Math.floor(t), fr = t - fl;
    const s = Math.min(1, Math.max(0, (fr - 0.25) / 0.75));
    return (fl + s * s * (3 - 2 * s)) * STEP;
  }

  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(220, 170, 280, 215);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i), z = pos.getZ(i) - 25;
        pos.setZ(i, z);
        const y = hgt(x, z);
        pos.setY(i, y - 0.03);
        const h = rawH(x, z), t = h / STEP, idx = Math.floor(t), fr = t - idx;
        const n = rnd(idx * 7.3 + Math.floor(x / 9) * 3.1) * 0.5 + 0.25;
        const riser = fr > 0.25 ? 0.93 : 1;
        const patch = Math.sin(x * 0.09 + idx * 0.7) * Math.sin(z * 0.13 + 1.7) > 0.35;
        if (y < 0.5) c.set('#9c8660');
        else if (y < 14) c.set(patch ? '#929452' : (idx % 7 === 1 ? '#8c9046' : (idx % 2 ? '#8e7a4e' : '#82704a')));
        else if (y < 26) c.set(patch ? '#868450' : (idx % 5 === 2 ? '#7e7c46' : '#74603f'));
        else c.set(n > 0.5 ? '#6a5c4a' : '#5e5444');
        c.multiplyScalar(riser * (0.94 + n * 0.12));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  /* backdrop planes graded into the sky haze */
  function Backdrop({ p, w, h, bottom, top }) {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(w, h, 1, 6);
      const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
      const a = new THREE.Color(bottom), b = new THREE.Color(top), c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        c.copy(a).lerp(b, Math.pow((pos.getY(i) + h / 2) / h, 0.8));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh position={p} geometry={geo}><meshBasicMaterial vertexColors fog={false} /></mesh>;
  }

  /* ---------- drooping saffron cloth: tall narrow triangle wrapped on the pole, wavy, ragged tails ---------- */
  function Cloth({ len = 7, W = 2, a0 = 18, a1 = 55, color = SAFFRON, ph = 0, tails = 3 }) {
    const { geo, tailPts } = useMemo(() => {
      const n = 14, pos = [], idx = [], tp = [], pts = [];
      let px = 0, py = 0;
      for (let i = 0; i <= n; i += 1) {
        const t = i / n;
        const ang = (a0 + (a1 - a0) * t) * Math.PI / 180;
        if (i > 0) { px += (len / n) * Math.cos(ang); py -= (len / n) * Math.sin(ang); }
        const w = W * Math.pow(1 - t, 0.85) * (1 + 0.1 * Math.sin(t * 21 + ph) * t);
        const top = py - (W - w) * 0.22;
        const z = Math.sin(t * 6.5 + ph) * 0.5 * t;
        pts.push([px, top, top - w, z]);
        pos.push(px, top, z, px, top - w, z);
      }
      for (let i = 0; i < n; i += 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      for (let k = 0; k < tails; k += 1) {
        const q = pts[Math.min(n - 1, 8 + k * 2)];
        tp.push([q[0], q[2] + 0.1, q[3], 0.9 + rnd(k + ph) * 1.6]);
      }
      return { geo: g, tailPts: tp };
    }, [len, W, a0, a1, ph, tails]);
    return (
      <group>
        <mesh geometry={geo} castShadow><meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} /></mesh>
        {tailPts.map((t, i) => (
          <group key={i} position={[t[0], t[1], t[2]]} rotation={[0, 0, Math.PI + 0.25 * (i - 1)]}>
            <mesh position={[0, t[3] / 2, 0]}><planeGeometry args={[0.28, t[3]]} /><meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} /></mesh>
          </group>
        ))}
      </group>
    );
  }
  function Lingo({ p, h = 24, rb = 0.27, rt = 0.1, lean = [0, 0], wood = '#b5632f', flag = null }) {
    const M = useM();
    const wm = M.plain(wood, { roughness: 0.85 });
    const dark = M.plain('#6e2a1a', { roughness: 0.9 });
    return (
      <group position={p} rotation={[lean[1], 0, lean[0]]}>
        <Cyl rt={rt} rb={rb} h={h} p={[0, h / 2, 0]} m={wm} seg={10} />
        <Cyl rt={rb + 0.07} rb={rb + 0.1} h={0.35} p={[0, 0.2, 0]} m={M.stone} seg={10} />
        {[0.28, 0.5, 0.72].map((k) => <Cyl key={k} rt={rb + (rt - rb) * k + 0.025} rb={rb + (rt - rb) * k + 0.025} h={0.12} p={[0, h * k, 0]} m={dark} seg={10} />)}
        <Cyl rt={0.02} rb={0.06} h={0.7} p={[0, h + 0.35, 0]} m={dark} seg={6} />
        {flag && (
          <group position={[0, h - 0.7, 0]} rotation={[0, (flag.dir > 0 ? 0 : Math.PI) + (flag.ry || 0), 0]}>
            <group position={[rt * 0.9, 0, 0]}><Cloth len={flag.len} W={flag.W} a0={flag.a0} a1={flag.a1} color={flag.color} ph={flag.ph} tails={flag.tails ?? 3} /></group>
            <Cyl rt={rt + 0.05} rb={rt + 0.08} h={1.1} p={[0, -0.5, 0]} m={M.plain(flag.color, { roughness: 0.95 })} seg={10} />
          </group>
        )}
      </group>
    );
  }

  /* wide squat hammered dome (r 2.2 m, 1.8 m high) with faint vertical rib bands */
  const DOME_PTS = [[2.15, 0], [2.2, 0.18], [2.18, 0.5], [2.02, 0.85], [1.7, 1.18], [1.2, 1.46], [0.66, 1.66], [0.26, 1.78], [0.16, 1.82]].map(([r, y]) => [r, y * 1.3]);
  function Dome({ m, rib }) {
    const geo = useMemo(() => new THREE.LatheGeometry(DOME_PTS.map(([r, y]) => new THREE.Vector2(r, y)), 32), []);
    const ribs = useMemo(() => {
      const out = [];
      for (let i = 0; i < 8; i += 1) out.push(new THREE.LatheGeometry(DOME_PTS.slice(1, 7).map(([r, y]) => new THREE.Vector2(r + 0.022, y)), 2, (i * Math.PI) / 4, 0.1));
      return out;
    }, []);
    return (
      <group>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        {ribs.map((g, i) => <mesh key={i} geometry={g} material={rib} />)}
      </group>
    );
  }

  /* ---------- the main shrine ---------- */
  function Shrine() {
    const M = useM();
    const wall = M.plain(WHITE, { roughness: 0.9 });
    const grey = M.plain('#cfcbc0', { roughness: 1 });
    const yel = M.plain(YELLOW, { roughness: 0.7 });
    const bronze = M.plain(BRONZE, { roughness: 0.55, metalness: 0.4 });
    const ribM = M.plain('#96855c', { roughness: 0.6, metalness: 0.4 });
    const gold = M.plain('#d8b040', { roughness: 0.3, metalness: 0.85 });
    const dark = M.plain('#2a2018', { roughness: 0.9 });
    return (
      <group>
        <Box s={[6.4, 0.3, 6.4]} p={[0, 0.15, 0]} m={M.plain('#a9a398', { roughness: 1 })} />
        <Box s={[4.5, 3.0, 4.5]} p={[0, 1.8, 0]} m={wall} />
        <Box s={[1.3, 0.8, 0.02]} p={[-1.2, 0.8, 2.255]} m={grey} cast={false} />
        <Box s={[0.9, 1.1, 0.02]} p={[1.5, 2.2, 2.255]} m={grey} cast={false} />
        <Box s={[1.25, 2.05, 0.1]} p={[0, 1.33, 2.27]} m={yel} />
        <Box s={[0.9, 1.8, 0.12]} p={[0, 1.22, 2.28]} m={dark} />
        <Box s={[4.75, 0.18, 4.75]} p={[0, 3.39, 0]} m={wall} />
        <Box s={[5.2, 0.42, 5.2]} p={[0, 3.6, 0]} m={yel} />
        <Box s={[4.7, 0.12, 4.7]} p={[0, 3.87, 0]} m={M.plain('#c99a22', { roughness: 0.7 })} />
        {/* short ribbed drum (0.6 m) at the dome's base radius, one visible ring ridge */}
        <Cyl rt={2.15} rb={2.15} h={0.6} p={[0, 4.23, 0]} m={bronze} seg={32} />
        <Cyl rt={2.3} rb={2.3} h={0.1} p={[0, 4.28, 0]} m={gold} seg={32} />
        <Cyl rt={2.2} rb={2.2} h={0.06} p={[0, 4.56, 0]} m={ribM} seg={32} />
        <group position={[0, 4.53, 0]}><Dome m={bronze} rib={ribM} /></group>
        <Cyl rt={0.03} rb={0.1} h={1.0} p={[0, 7.3, 0]} m={gold} seg={8} />
        <Ball rad={0.17} p={[0, 6.9, 0]} m={gold} />
        <Cyl rt={0.2} rb={0.1} h={0.2} p={[0, 6.86, 0]} m={gold} seg={8} />
      </group>
    );
  }

  /* ---------- Bhairavnath: low wide hipped roof, rust-brown, 0.5 m eaves ---------- */
  function Bhairav() {
    const M = useM();
    const wall = M.plain('#ebe6da', { roughness: 0.92 });
    const roof = M.plain('#8a4a3a', { roughness: 0.8, metalness: 0.2 });
    const ridge = M.plain('#a85e46', { roughness: 0.8 });
    const dark = M.plain('#2a2018');
    const gold = M.plain('#d8b040', { roughness: 0.3, metalness: 0.8 });
    return (
      <group position={[6.6, 0, 0.4]}>
        <Box s={[4.0, 0.22, 4.0]} p={[0, 0.11, 0]} m={M.plain('#a9a398', { roughness: 1 })} />
        <Box s={[3.0, 2.15, 3.0]} p={[0, 1.3, 0]} m={wall} />
        <Box s={[0.8, 1.45, 0.1]} p={[0, 0.95, 1.52]} m={dark} />
        <Box s={[4.0, 0.16, 4.0]} p={[0, 2.46, 0]} m={M.plain('#6e3a2c')} />
        <mesh position={[0, 3.14, 0]} rotation={[0, Math.PI / 4, 0]} material={roof} castShadow><coneGeometry args={[2.83, 1.2, 4]} /></mesh>
        {[0, 1].map((i) => (
          <group key={i} rotation={[0, i * Math.PI / 2, 0]}>
            <Box s={[0.1, 0.08, 4.0]} p={[0, 3.1, 0]} m={ridge} cast={false} />
          </group>
        ))}
        <Cyl rt={0.025} rb={0.07} h={0.8} p={[0, 4.0, 0]} m={gold} seg={6} />
        <Ball rad={0.1} p={[0, 3.7, 0]} m={gold} />
      </group>
    );
  }

  /* ---------- Hanuman: open cell facing +z/+x, broad yellow frame, striped valance, seated vermilion statue ---------- */
  function Hanuman() {
    const M = useM();
    const yel = M.plain(YELLOW, { roughness: 0.75 });
    const white = M.plain('#f3ecd0');
    const brick = M.mat('stone', 1.4, 1, { color: '#d0a88c' });
    const red = M.plain('#d2491f', { roughness: 0.7 });
    const redD = M.plain('#a83a1a', { roughness: 0.7 });
    const grey = M.plain('#5c5853', { roughness: 0.95 });
    const stripes = [];
    for (let i = 0; i < 16; i += 1) stripes.push(<Box key={i} s={[0.19, i % 2 ? 0.4 : 0.5, 0.05]} p={[-1.5 + 0.1 + i * 0.19, 2.45 - (i % 2 ? 0.2 : 0.25), 1.25]} m={i % 2 ? white : yel} cast={false} />);
    return (
      <group position={[-4.5, 0, 4.5]} rotation={[0, 0.45, 0]}>
        <Box s={[3.7, 0.2, 3.3]} p={[0, 0.1, 0]} m={M.plain('#8d8984', { roughness: 1 })} />
        <Box s={[3.0, 2.6, 0.22]} p={[0, 1.5, -1.0]} m={brick} />
        <Box s={[0.22, 2.6, 2.3]} p={[-1.4, 1.5, 0.1]} m={brick} />
        <Box s={[0.22, 2.6, 2.3]} p={[1.4, 1.5, 0.1]} m={brick} />
        <Box s={[3.3, 0.22, 2.9]} p={[0, 2.9, 0.1]} m={yel} />
        <Box s={[3.0, 0.14, 0.1]} p={[0, 2.62, 1.25]} m={yel} />
        {stripes}
        <Box s={[0.2, 2.7, 0.2]} p={[-1.5, 1.55, 1.25]} m={yel} />
        <Box s={[0.2, 2.7, 0.2]} p={[1.5, 1.55, 1.25]} m={yel} />
        <Box s={[1.5, 0.75, 0.95]} p={[0, 0.575, -0.15]} m={grey} />
        <Box s={[0.75, 0.22, 0.5]} p={[0, 1.07, 0.05]} m={red} />
        <Box s={[0.5, 0.52, 0.32]} p={[0, 1.44, -0.12]} m={red} />
        <Ball rad={0.17} p={[0, 1.86, -0.1]} m={red} />
        <Box s={[0.14, 0.4, 0.14]} p={[-0.34, 1.4, 0.0]} r={[0.35, 0, 0.1]} m={redD} />
        <Box s={[0.14, 0.4, 0.14]} p={[0.34, 1.4, 0.0]} r={[0.35, 0, -0.1]} m={redD} />
        <Cyl rt={0.05} rb={0.05} h={0.9} p={[0.5, 1.45, 0.1]} m={redD} seg={6} />
        <Ball rad={0.12} p={[0.5, 1.95, 0.1]} m={redD} />
        <Diyo p={[0, 0.9, 0.6]} />
      </group>
    );
  }

  function Wire({ a, b, n = 8, sag = 0.5 }) {
    const M = useM();
    const m = M.plain('#2b2b2b', { roughness: 0.7 });
    const segs = [];
    for (let i = 0; i < n; i += 1) {
      const t0 = i / n, t1 = (i + 1) / n;
      const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t];
      const p0 = P(t0), p1 = P(t1);
      const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
      const L = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      segs.push(<mesh key={i} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2]} quaternion={q} material={m}><cylinderGeometry args={[0.025, 0.025, L, 3]} /></mesh>);
    }
    return <group>{segs}</group>;
  }

  function Bunting({ a, b, n = 14, sag = 0.8 }) {
    const M = useM();
    const cols = ['#d94a3a', '#e8c030', '#3a8ad0', '#f0f0e0', '#3aa05a'].map((c) => M.plain(c, { roughness: 0.9 }));
    const out = [];
    for (let i = 1; i < n; i += 1) {
      const t = i / n;
      out.push(<mesh key={i} position={[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag - 0.2, a[2] + (b[2] - a[2]) * t]} rotation={[0, 0, Math.PI]} material={cols[i % cols.length]}><coneGeometry args={[0.28, 0.5, 3]} /></mesh>);
    }
    return <group><Wire a={a} b={b} n={8} sag={sag} />{out}</group>;
  }

  function Main() {
    const M = useM();
    return (
      <group>
        <Shrine />
        <Bhairav />
        <Hanuman />
        {/* two thick Chandannath lingo poles (52 haath), thinner Bhairav pole (48 haath), thin mast with crossbar */}
        <Lingo p={[-1.7, 0, -2.6]} h={24} rb={0.27} rt={0.1} lean={[0.02, -0.11]} wood="#b5632f"
          flag={{ len: 9, W: 3.2, a0: 16, a1: 44, color: SAFFRON, dir: -1, ry: 0.15, ph: 0.4 }} />
        <Lingo p={[1.9, 0, -2.6]} h={24} rb={0.27} rt={0.1} lean={[-0.02, -0.11]} wood="#a8442a"
          flag={{ len: 9, W: 3.2, a0: 20, a1: 48, color: '#d9742a', dir: 1, ry: -0.2, ph: 2.2 }} />
        <Lingo p={[6.6, 0, -2.4]} h={22} rb={0.22} rt={0.09} lean={[0.012, -0.1]} wood="#b5632f"
          flag={{ len: 4.4, W: 1.7, a0: 18, a1: 44, color: SAFFRON, dir: 1, ry: 0.35, ph: 4.1, tails: 2 }} />
        <group position={[4.1, 0, -2.9]} rotation={[-0.08, 0, 0]}>
          <Cyl rt={0.06} rb={0.13} h={16.5} p={[0, 8.25, 0]} m={M.plain('#7a5236', { roughness: 0.9 })} seg={6} />
          <Box s={[1.6, 0.08, 0.08]} p={[0, 15.2, 0]} m={M.plain('#5a3c28')} />
        </group>
        <Wire a={[4.1, 15.6, -3.9]} b={[10, 7.6, -9.5]} sag={0.6} />
        <Diyo p={[-1.0, 0.31, 2.9]} light />
        <Diyo p={[1.0, 0.31, 2.9]} />
        <Frame s={[18, 24, 10]} p={[0.5, 12, -0.5]} />
      </group>
    );
  }

  /* ---------- houses: weathered stone/mud, tin roofs, continuous balcony frontage ---------- */
  const TIN = ['#5f7f95', '#9aa0a4', '#a0583c', '#6a7a6a', '#7c9cb4', '#b0b4b8'];
  const WALL = ['#f0e4cc', '#e6dcc8', '#d8d0c0', '#eadfca', '#dcd2bf'];
  function Home({ p, ry = 0, w = 6, d = 5, st = 2, tin = 0, wash = false, balc = true, k = 0, tarp = false }) {
    const M = useM();
    const H = st * 3.0;
    const body = wash ? M.plain('#e4ddcb', { roughness: 1 }) : M.mat('plaster', w / 2, H / 2, { color: ['#f4ecd8', '#e6dfcf', '#fbf3e0', '#ece4d0', '#f0e8d6'][k % 5] });
    const tinM = M.plain(TIN[tin % TIN.length], { roughness: 0.55, metalness: 0.4 });
    const wood = M.plain('#6a4a30', { roughness: 0.9 });
    const blue = M.plain('#2f6fb5', { roughness: 0.7 });
    const win = M.plain('#2b2622', { roughness: 0.8 });
    const lit = M.plain('#ffd48a', { roughness: 0.6, emissive: '#ffa040', emissiveIntensity: 0.5 });
    const nW = Math.max(2, Math.round(w / 2.6));
    const rows = [];
    for (let s = 0; s < st; s += 1) {
      for (let i = 0; i < nW; i += 1) {
        const x = -w / 2 + (i + 0.5) * (w / nW) + (rnd(k * 5 + s * 3 + i) - 0.5) * 0.5;
        const ww = 0.55 + rnd(k * 9 + s + i * 2) * 0.35;
        rows.push(<Box key={`${s}-${i}`} s={[ww, 0.8 + rnd(k + i + s) * 0.25, 0.08]} p={[x, 1.75 + s * 3, d / 2 + 0.02]} m={rnd(k * 17 + s * 5 + i) > 0.7 ? lit : win} cast={false} />);
      }
    }
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={body} />
        <Box s={[w + 0.7, 0.14, d + 0.9]} p={[0, H + 0.12, 0.05]} r={[0.1, 0, 0]} m={tinM} />
        <Box s={[w + 0.2, 0.3, 0.2]} p={[0, H + 0.1, -d / 2]} m={M.plain('#8a8070', { roughness: 1 })} />
        {rows}
        <Box s={[1.0, 1.7, 0.1]} p={[(k % 3 - 1) * w * 0.25, 0.85, d / 2 + 0.03]} m={wood} />
        {balc && st > 1 && (
          <group position={[0, 3.0, d / 2 + 0.5]}>
            <Box s={[w, 0.14, 1.0]} p={[0, 0, 0]} m={wood} />
            <Box s={[w, 0.5, 0.06]} p={[0, 0.4, 0.45]} m={blue} cast={false} />
            <Box s={[w, 0.07, 0.07]} p={[0, 0.72, 0.45]} m={blue} cast={false} />
            {[-1, 0, 1].map((i) => <Box key={i} s={[0.1, 2.9, 0.1]} p={[i * (w / 2 - 0.2), -1.5, 0.45]} m={wood} cast={false} />)}
          </group>
        )}
        {k % 3 === 0 && <Box s={[0.6, 1.2, 0.6]} p={[w / 4, H + 0.7, -d / 4]} m={M.plain('#8a8070', { roughness: 1 })} />}
        {tarp && <Box s={[w * 0.5, 0.06, d * 0.5]} p={[-w * 0.15, H + 0.32, 0.4]} r={[0.1, 0, 0]} m={M.plain('#7fb0d8', { roughness: 0.8 })} cast={false} />}
        {k % 2 === 1 && <Box s={[0.9, 0.6, 0.9]} p={[w * 0.25, H + 0.5, -0.4]} m={M.plain('#c9c9c4', { roughness: 0.6, metalness: 0.3 })} cast={false} />}
      </group>
    );
  }

  function Conifer({ p, s = 1 }) {
    const M = useM();
    const leaf = M.plain('#25402c', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.12} rb={0.2} h={1.4} p={[0, 0.7, 0]} m={M.plain('#4a3626')} seg={6} />
        {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 1.5 + i * 1.1, 0]} material={leaf} castShadow><coneGeometry args={[1.5 - i * 0.28, 1.9, 7]} /></mesh>)}
      </group>
    );
  }
  function Willow({ p, s = 1 }) {
    const M = useM();
    const leaf = M.plain('#7c9a42', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.25} rb={0.4} h={4} p={[0, 2, 0]} m={M.plain('#5a4632')} seg={7} />
        {[[0, 5, 0, 2.6], [1.8, 4.2, 0.6, 1.9], [-1.7, 4.3, -0.4, 2], [0.2, 6.2, 0.3, 1.6]].map(([x, y, z, r], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1, 0.85, 1]} m={leaf} />)}
      </group>
    );
  }

  function Env() {
    const M = useM();
    const PI2 = Math.PI / 2;
    const houses = [
      // continuous back frontage facing the yard (+z)
      { p: [-21, 0, -11.5], w: 6, st: 2, tin: 0, k: 0 },
      { p: [-15, 0, -11.5], w: 6, st: 3, tin: 1, k: 1, tarp: true },
      { p: [-9, 0, -11.5], w: 6, st: 2, tin: 2, k: 2, wash: true },
      { p: [-3, 0, -11.5], w: 6, st: 2, tin: 3, k: 3 },
      { p: [3, 0, -11.5], w: 6, st: 3, tin: 4, k: 4, tarp: true },
      { p: [9, 0, -11.5], w: 6, st: 2, tin: 5, k: 5 },
      { p: [15, 0, -11.5], w: 6, st: 2, tin: 1, k: 6 },
      { p: [21, 0, -11.5], w: 6, st: 3, tin: 2, k: 7 },
      // second row up the slope
      { p: [-18, 0, -18], w: 6, st: 2, tin: 5, k: 8 },
      { p: [-6, 0, -19], w: 6, st: 2, tin: 0, k: 9 },
      { p: [7, 0, -19.5], w: 6.5, st: 2, tin: 2, k: 10 },
      { p: [20, 0, -19], w: 6, st: 2, tin: 3, k: 11 },
      // left street, facing +x, continuous
      { p: [-15, 0, -5], ry: PI2, w: 6, st: 3, tin: 4, k: 12 },
      { p: [-15, 0, 1], ry: PI2, w: 6, st: 2, tin: 1, k: 13, tarp: true },
      { p: [-15, 0, 7], ry: PI2, w: 6, st: 2, tin: 2, k: 14 },
      { p: [-15, 0, 13], ry: PI2, w: 6, st: 2, tin: 0, k: 15 },
      { p: [-22, 0, 2], ry: PI2, w: 6, st: 2, tin: 3, k: 16 },
      // right edge, facing -x
      { p: [19, 0, -6], ry: -PI2, w: 5, st: 1, tin: 0, k: 17, wash: true },
      // far ring
      { p: [-30, 0, -8], ry: PI2, w: 6, st: 2, tin: 4, k: 19 },
    ];
    const conifers = useMemo(() => {
      const out = [];
      for (let i = 0; i < 12; i += 1) {
        const x = (rnd(i + 3) - 0.5) * 110, z = -34 - rnd(i + 9) * 30;
        if (hgt(x, z) < 3) continue;
        out.push([x, hgt(x, z), z, 0.9 + rnd(i) * 0.6]);
      }
      return out;
    }, []);
    return (
      <group>
        <Terrain />
        {/* packed-earth yard + street strip */}
        <mesh position={[0, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[11.5, 40]} /><meshStandardMaterial color="#b49d78" roughness={1} /></mesh>
        <mesh position={[-9, 0.012, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[9, 34]} /><meshStandardMaterial color="#a8956f" roughness={1} /></mesh>
        {/* open grass field beyond the houses (+x, +z) */}
        <mesh position={[26, 0.014, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[13, 36]} /><meshStandardMaterial color="#8c9a50" roughness={1} /></mesh>
        <mesh position={[26, 0.02, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><ringGeometry args={[13, 13.8, 36]} /><meshStandardMaterial color="#a39060" roughness={1} /></mesh>
        {houses.map((h, i) => {
          const j = (a) => (rnd(i * 4 + a + 50) - 0.5) * 2;
          const st = h.st === 3 && i % 2 ? 2 : (i % 5 === 3 ? 1 : h.st);
          return <Home key={i} {...h} st={st} wash={h.wash || i % 3 === 1} p={[h.p[0] + j(0) * 1.5, 0, h.p[2] + j(1) * 1.5]} ry={(h.ry || 0) + j(2) * 0.1} />;
        })}
        <Bunting a={[-15, 6.8, -8.2]} b={[15, 6.8, -8.2]} n={16} sag={0.9} />
        <Box s={[14, 0.6, 0.5]} p={[26, 0.3, 27.5]} m={M.stone} />
        <Willow p={[-27, 0, -14]} s={1.1} />
        <Willow p={[33, 0, 12]} s={1} />
        {conifers.map((c, i) => <Conifer key={i} p={[c[0], c[1], c[2]]} s={c[3]} />)}
        <Conifer p={[-12, 0, 18]} s={1.1} />
        <Backdrop p={[0, 30, -62]} w={240} h={80} bottom="#7a6a58" top="#b4aea2" />
        <Backdrop p={[0, 48, -85]} w={300} h={100} bottom="#b0aca2" top="#c6c8c8" />
      </group>
    );
  }

  return { 'chandannath-temple': { Main, Env } };
}
