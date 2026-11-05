// Kudan (Nigrodharama), Taulihawa, Kapilvastu. An excavated Buddhist ruin in flat Terai grassland: a wide, low (~6.5 m),
// three-terraced red-brick mound with a central brick stair, crowned by a grassy hump carrying a tiny red-brick Shiva
// shrine with a curved spire; a smaller flat-topped brick block and low monastery foundations beside it; big broad
// trees behind, a pond hollow, a round brick well and grazing cattle.
// 1 unit = 1 m. Mound at the origin, stair on the +z face. Compass orientation, stair step counts and the shrine size are
// builder decisions / photo estimates (no source gives them).
export default function make(K) {
  const { useM, Box, Cyl, Ball, THREE, useMemo, useRef, useEffect, Frame } = K;

  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const BMC = new Map();
  /** Brick material with a warm self-glow so the dark photo texture reads as weathered terracotta. */
  const BM = (M, rx, ry, o) => {
    const k = `${rx}|${ry}|${o.color}`;
    if (!BMC.has(k)) { const m = M.mat('brick', rx, ry, o).clone(); m.emissive = new THREE.Color('#5a2c18'); m.emissiveIntensity = 0.3; BMC.set(k, m); }
    return BMC.get(k);
  };
  const FLAGC = ['#2f6fb0', '#f4f4ef', '#d6262b', '#2f9a4a', '#f2c22b'];

  // terrace tops (y) and plan sizes (w x d)
  const FOOT = { w: 42, d: 32, h: 0.8 };
  const T1 = { w: 37, d: 27, h: 2.4 };
  const T2 = { w: 30, d: 21, h: 4.2 };
  const T3 = { w: 24, d: 16, h: 5.7 };
  const BLOCK = [28, -6]; // second flat-topped block
  const FOUND = [28, 8]; // monastery foundations origin
  const POND = [-36, 26];
  const WELL = [2, 30];
  const SHR = 1.4; // shrine scale

  /* ---------- helpers ---------- */
  function Inst({ geo, mat, items, shadow = false }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(...it.p);
        const s = it.s;
        if (Array.isArray(s)) o.scale.set(...s); else o.scale.setScalar(s || 1);
        o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
        if (it.c) { col.set(it.c); ref.current.setColorAt(i, col); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[null, null, items.length]} castShadow={shadow} receiveShadow frustumCulled={false}>{geo}<primitive object={mat} attach="material" /></instancedMesh>;
  }

  /** Box whose UVs are in metres so the brick texture keeps its scale on any size. */
  const brickBoxGeo = (w, h, d) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    const sc = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f += 1) for (let k = 0; k < 4; k += 1) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sc[f][0], uv.getY(i) * sc[f][1]); }
    return g;
  };
  function BB({ s, p, r, m, cast = true }) {
    const g = useMemo(() => brickBoxGeo(s[0], s[1], s[2]), [s[0], s[1], s[2]]);
    return <mesh position={p} rotation={r} material={m} geometry={g} castShadow={cast} receiveShadow />;
  }

  /** Eroded, ragged rectangle outline (x, y=-z). */
  const raggedPts = (w, d, seed, amp = 0.5, step = 1.8) => {
    const r = rng(seed); const hw = w / 2; const hd = d / 2;
    const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
    const pts = []; let prev = 0;
    for (let e = 0; e < 4; e += 1) {
      const [x0, y0] = corners[e]; const [x1, y1] = corners[(e + 1) % 4];
      const len = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(2, Math.ceil(len / step));
      const nx = (y1 - y0) / len; const ny = -(x1 - x0) / len; // outward normal for CCW
      for (let i = 0; i < n; i += 1) {
        const t = i / n; let o = (r() - 0.62) * amp * 2.4; o = prev * 0.35 + o * 0.65; prev = o;
        if (i === 0) o -= amp * (0.8 + r() * 1.6); // bitten-off corners
        else if (r() < 0.14) o -= amp * (1.5 + r() * 2.5); // eroded bays
        pts.push([x0 + (x1 - x0) * t + nx * o, y0 + (y1 - y0) * t + ny * o]);
      }
    }
    return pts;
  };
  const shapeOf = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };

  /** A ragged terrace: brick sides, grass or dry-brick top. */
  function Terrace({ w, d, h, seed, amp = 0.5, cap, side, p = [0, 0, 0], step = 1.8 }) {
    const geo = useMemo(() => new THREE.ExtrudeGeometry(shapeOf(raggedPts(w, d, seed, amp, step)), { depth: h, bevelEnabled: false, steps: 1 }), [w, d, h, seed, amp, step]);
    return <mesh geometry={geo} material={[cap, side]} position={p} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow />;
  }

  /* ---------- the stair ---------- */
  function Flight({ zf, y0, top, n, run = 0.55, hw = 1.9, brick, x = 0 }) {
    const h = (top - y0) / n;
    const out = [];
    for (let i = 0; i < n; i += 1) {
      const ht = y0 + (i + 1) * h; const z = zf + (n - 1 - i) * run + run / 2;
      const ex = i === n - 1 ? 3 : 0;
      out.push(<BB key={`s${i}`} s={[hw * 2, ht, run + 0.02 + ex]} p={[x, ht / 2, z - ex / 2]} m={brick} />);
      const wh = ht + 0.55 - (i % 4 === 3 ? 0.25 : 0);
      [-1, 1].forEach((sd) => out.push(<BB key={`w${i}${sd}`} s={[0.8, wh, run + 0.02 + ex]} p={[x + sd * (hw + 0.4), wh / 2, z - ex / 2]} m={brick} />));
    }
    return <group>{out}</group>;
  }

  /* ---------- the shrine ---------- */
  function Shrine() {
    const M = useM();
    const red = BM(M, 0.7, 0.7, { color: '#ffd8b8' });
    const cream = M.plain('#e0cfae', { roughness: 1 });
    const dark = M.plain('#2a1a12', { roughness: 1 });
    const spire = useMemo(() => {
      const pts = []; const H = 2.7;
      for (let i = 0; i <= 24; i += 1) {
        const t = i / 24;
        const rib = 1 + 0.045 * Math.cos(t * 30);
        const r = (1.38 * Math.pow(1 - t, 1.25) * (1 + 0.14 * Math.sin(t * Math.PI)) + 0.03) * rib;
        pts.push(new THREE.Vector2(r, t * H));
      }
      pts.push(new THREE.Vector2(0.0, H + 0.02));
      return new THREE.LatheGeometry(pts, 12);
    }, []);
    const sm = BM(M, 2.2, 1.6, { color: '#ffdcbc' });
    return (
      <group>
        <BB s={[3.3, 0.4, 3.3]} p={[0, 0.2, 0]} m={red} />
        <BB s={[2.6, 2.7, 2.6]} p={[0, 1.75, 0]} m={red} />
        {/* cream plastered band and cornice */}
        <Box s={[2.85, 0.14, 2.85]} p={[0, 2.9, 0]} m={cream} />
        <Box s={[3.0, 0.16, 3.0]} p={[0, 3.05, 0]} m={red} />
        {/* arched door niche */}
        <Box s={[1.0, 1.6, 0.1]} p={[0, 1.2, 1.31]} m={cream} />
        <mesh position={[0, 2.0, 1.31]} rotation={[Math.PI / 2, 0, 0]} material={cream}><cylinderGeometry args={[0.5, 0.5, 0.1, 16, 1, false, 0, Math.PI]} /></mesh>
        <Box s={[0.74, 1.45, 0.2]} p={[0, 1.12, 1.33]} m={dark} />
        <mesh position={[0, 1.85, 1.33]} rotation={[Math.PI / 2, 0, 0]} material={dark}><cylinderGeometry args={[0.37, 0.37, 0.2, 14, 1, false, 0, Math.PI]} /></mesh>
        {/* window slits */}
        <Box s={[0.26, 0.5, 0.1]} p={[0, 2.5, 1.31]} m={dark} />
        <Box s={[0.1, 0.5, 0.26]} p={[1.31, 1.9, 0]} m={dark} />
        <Box s={[0.1, 0.5, 0.26]} p={[-1.31, 1.9, 0]} m={dark} />
        {/* brick neck, then the slender curved ribbed beehive spire */}
        <BB s={[2.0, 0.35, 2.0]} p={[0, 3.3, 0]} m={red} />
        <mesh geometry={spire} material={sm} position={[0, 3.47, 0]} castShadow rotation={[0, Math.PI / 12, 0]} />
        <Cyl rt={0.03} rb={0.07} h={0.5} p={[0, 6.4, 0]} m={M.plain('#5a4030')} seg={6} />
        <Ball rad={0.1} p={[0, 6.72, 0]} m={M.plain('#6a4a30')} />
      </group>
    );
  }

  /* ---------- Shiva linga with red tika ---------- */
  function Linga() {
    const M = useM();
    return (
      <group>
        <BB s={[1.5, 0.2, 1.2]} p={[0, 0.1, 0]} m={BM(M, 0.7, 0.7, { color: '#f0b090' })} />
        <mesh position={[0, 0.5, 0]} material={M.plain('#4c4a4c', { roughness: 0.8 })} castShadow><cylinderGeometry args={[0.22, 0.3, 0.55, 10]} /></mesh>
        <Ball rad={0.24} p={[0, 0.8, 0]} sc={[1, 1.1, 1]} m={M.plain('#5a5658', { roughness: 0.7 })} />
        <Ball rad={0.1} p={[0.02, 0.62, 0.22]} sc={[1, 1.3, 0.5]} m={M.plain('#c8231b', { roughness: 1 })} />
        <Ball rad={0.07} p={[-0.14, 0.45, 0.24]} sc={[1, 1, 0.5]} m={M.plain('#e8b21e', { roughness: 1 })} />
        <mesh position={[0.55, 0.28, 0.2]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#ffb347" emissive="#ff8a1c" emissiveIntensity={1.6} /></mesh>
        <pointLight position={[0.5, 0.7, 0.4]} color="#ffa24a" intensity={0.8} distance={8} />
      </group>
    );
  }

  /* ---------- foundations of the monastery ---------- */
  function Foundations() {
    const M = useM();
    const fb = BM(M, 1.3, 1.3, { color: '#dfae88' });
    const fl = BM(M, 1.0, 1.0, { color: '#c89a72' });
    const walls = [
      [-4, -6, 9, 1.6], [5.5, -6, 6, 1.6], [-5, 6, 7, 1.6], [4, 6, 8, 1.6], [-4, 0, 7.5, 1.4], [4.5, 0.5, 7, 1.4],
      [-8, 0, 1.6, 12.6], [8, 0, 1.6, 12.6], [0, -2, 1.5, 9],
    ];
    const parts = useMemo(() => {
      const r = rng(7); const out = [];
      walls.forEach(([cx, cz, w, d], wi) => {
        const h1 = 0.3 + r() * 0.1; const h2 = 0.28 + r() * 0.1; const h3 = 0.2 + r() * 0.2;
        out.push({ k: `${wi}a`, s: [w + 1.2, h1, d + 1.2], p: [cx, h1 / 2, cz] });
        out.push({ k: `${wi}b`, s: [w + 0.5, h2, d + 0.5], p: [cx, h1 + h2 / 2, cz] });
        out.push({ k: `${wi}c`, s: [Math.max(0.8, w - 0.1), h3, Math.max(0.8, d - 0.1)], p: [cx, h1 + h2 + h3 / 2, cz] });
      });
      return out;
    }, []);
    return (
      <group>
        <group position={[FOUND[0], 0, FOUND[1]]}>
          <BB s={[6.4, 0.12, 6.4]} p={[-4.2, 0.06, -3]} m={fl} cast={false} />
          <BB s={[5.8, 0.12, 6.6]} p={[3.9, 0.06, -3]} m={fl} cast={false} />
          <BB s={[7, 0.12, 4]} p={[-3.8, 0.06, 3.6]} m={fl} cast={false} />
          {parts.map((q) => <BB key={q.k} s={q.s} p={q.p} m={fb} />)}
        </group>
        {/* small eroded cruciform floor in the foreground */}
        <group position={[14, 0, 24]}>
          <BB s={[3, 0.25, 7]} p={[0, 0.125, 0]} m={fb} />
          <BB s={[7, 0.25, 3]} p={[0, 0.125, 0]} m={fb} />
          <BB s={[1.6, 0.25, 4.4]} p={[0, 0.375, 0]} m={fb} />
        </group>
      </group>
    );
  }

  /* ---------- the second, flat-topped block ---------- */
  function SecondBlock() {
    const M = useM();
    const side = BM(M, 0.7, 0.7, { color: '#e0ae88' });
    const top = BM(M, 0.5, 0.5, { color: '#ecc9a4' });
    const foot = BM(M, 0.7, 0.7, { color: '#d9a47c' });
    const mortar = M.plain('#4a2a1c', { roughness: 1 });
    return (
      <group position={[BLOCK[0], 0, BLOCK[1]]}>
        <BB s={[16.6, 0.5, 11.6]} p={[0, 0.25, 0]} m={foot} />
        <BB s={[15.6, 0.5, 10.6]} p={[0, 0.75, 0]} m={foot} />
        <BB s={[14, 2.4, 9]} p={[0, 2.0, 0]} m={side} />
        <BB s={[14, 0.12, 9]} p={[0, 3.26, 0]} m={top} cast={false} />
        {[0.7, 1.15, 1.6, 2.05, 2.5, 2.95].map((y) => (
          <group key={y}>
            <Box s={[14.02, 0.05, 0.06]} p={[0, y + 0.25, 4.5]} m={mortar} />
            <Box s={[0.06, 0.05, 9.02]} p={[-7, y + 0.25, 0]} m={mortar} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- trees ---------- */
  const treeSets = (list) => {
    const trunks = []; const blobs = [];
    const greens = ['#3a5a2a', '#46682f', '#355224', '#4f7234', '#2f4d24'];
    list.forEach(([x, z, s, seed]) => {
      const r = rng(seed); const th = (5 + r() * 2) * s; const S = (5.5 + r() * 2) * s;
      trunks.push({ p: [x, th / 2, z], s: [s, th, s], ry: r() * 3 });
      const n = 7;
      for (let i = 0; i < n; i += 1) {
        const a = r() * Math.PI * 2; const d = (i === 0 ? 0 : 0.35 + r() * 0.65) * S;
        const rad = (2.7 + r() * 1.5) * s * 1.3;
        blobs.push({ p: [x + Math.cos(a) * d, th + (0.4 + r() * 2.2) * s, z + Math.sin(a) * d], s: [rad, rad * 0.55, rad], ry: r() * 3, c: greens[Math.floor(r() * greens.length)] });
      }
    });
    return { trunks, blobs };
  };
  function Trees({ list }) {
    const M = useM();
    const t = useMemo(() => treeSets(list), [list]);
    const lm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), []);
    return (
      <group>
        <Inst geo={<cylinderGeometry args={[0.3, 0.55, 1, 7]} />} mat={M.plain('#5a4634', { roughness: 1 })} items={t.trunks} shadow />
        <Inst geo={<icosahedronGeometry args={[1, 1]} />} mat={lm} items={t.blobs} shadow />
      </group>
    );
  }

  /* ---------- prayer flags ---------- */
  function Flags({ from, to, n = 12 }) {
    const items = useMemo(() => {
      const ang = Math.atan2(to[0] - from[0], to[2] - from[2]);
      return Array.from({ length: n }, (_, i) => {
        const t = (i + 0.6) / (n + 0.4); const sag = Math.sin(t * Math.PI) * 0.7;
        return { p: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag - 0.15, from[2] + (to[2] - from[2]) * t], ry: ang + Math.PI / 2, c: FLAGC[i % 5] };
      });
    }, [from, to, n]);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 1 }), []);
    const line = useMemo(() => {
      const pts = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return new THREE.Vector3(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 0.7, from[2] + (to[2] - from[2]) * t); });
      return new THREE.BufferGeometry().setFromPoints(pts);
    }, [from, to]);
    return (
      <group>
        <Inst geo={<planeGeometry args={[0.35, 0.4]} />} mat={mat} items={items} />
        <line geometry={line}><lineBasicMaterial color="#3a2a1a" /></line>
      </group>
    );
  }

  /* ---------- cattle ---------- */
  function Cow({ p, r = 0, c = '#d9d3c5', sp = '#8a6a4a' }) {
    const M = useM();
    const body = M.plain(c, { roughness: 1 }); const dk = M.plain(sp, { roughness: 1 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.62, 0.6, 1.5]} p={[0, 1.0, 0]} m={body} />
        <Box s={[0.5, 0.35, 0.5]} p={[0, 1.15, 0.15]} m={dk} />
        <Ball rad={0.2} p={[0, 1.32, 0.45]} m={body} />
        <Box s={[0.3, 0.34, 0.5]} p={[0, 1.1, 0.95]} r={[0.5, 0, 0]} m={body} />
        <Box s={[0.7, 0.07, 0.07]} p={[0, 1.2, 1.08]} m={M.plain('#e8e0cc')} />
        {[[-0.2, -0.55], [0.2, -0.55], [-0.2, 0.55], [0.2, 0.55]].map(([x, z], i) => <Box key={i} s={[0.12, 0.72, 0.12]} p={[x, 0.36, z]} m={dk} />)}
        <Box s={[0.05, 0.6, 0.05]} p={[0, 0.9, -0.78]} r={[0.1, 0, 0]} m={dk} />
      </group>
    );
  }

  /* ---------- well ---------- */
  function Well() {
    const M = useM();
    const b = BM(M, 1.6, 0.6, { color: '#e9a47f' });
    return (
      <group position={[WELL[0], 0, WELL[1]]}>
        <mesh position={[0, 0.45, 0]} material={b} castShadow receiveShadow><cylinderGeometry args={[1.0, 1.1, 0.9, 20, 1, true]} /></mesh>
        <mesh position={[0, 0.88, 0]} rotation={[-Math.PI / 2, 0, 0]} material={b}><ringGeometry args={[0.72, 1.02, 20]} /></mesh>
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.8, 16]} /><meshStandardMaterial color="#1c1a14" roughness={1} /></mesh>
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.0, 1.9, 20]} /><meshStandardMaterial color="#b49a68" roughness={1} polygonOffset polygonOffsetFactor={-1} /></mesh>
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function Main() {
    const M = useM();
    const brick = BM(M, 1.3, 1.3, { color: '#e8b890' });
    const brickD = BM(M, 1.3, 1.3, { color: '#dba67e' });
    const grassA = M.plain('#76873a', { roughness: 1 });
    const deck = BM(M, 1.0, 1.0, { color: '#c89a72' });
    const grassB = M.plain('#6c7e34', { roughness: 1 });
    const domeMat = M.plain('#7f9040', { roughness: 1 });
    
    const extras = useMemo(() => {
      const r = rng(11);
      const rubble = []; const tufts = [];
      [[FOOT, 21, 0.9, 0.12]].forEach(([T, sd, sz, y]) => {
        raggedPts(T.w, T.d, sd, 0.5, 1.8).forEach(([x, yy]) => {
          if (r() < 0.78) return;
          const ox = x + Math.sign(x) * 0.5 * r(); const oz = -yy - Math.sign(-yy) * 0.5 * r();
          if (oz > 8 && Math.abs(Math.abs(ox) - 7) < 3.2) return; // keep the stair clear
          const q = 0.35 + r() * sz * 0.5;
          rubble.push({ p: [ox, y + q * 0.3, oz], s: [q, q * 0.6, q * 1.2], ry: r() * 3, rz: (r() - 0.5) * 0.5, c: r() > 0.5 ? '#c4825f' : '#a96a4a' });
        });
      });
      [[FOOT, T1, 0.8, 30], [T1, T2, 2.4, 8], [T2, T3, 4.2, 8]].forEach(([A, B, y, n]) => {
        for (let i = 0; i < n; i += 1) {
          const x = (r() - 0.5) * (A.w - 1.2); const z = (r() - 0.5) * (A.d - 1.2);
          if (Math.abs(x) < B.w / 2 + 0.4 && Math.abs(z) < B.d / 2 + 0.4) continue;
          if (z > 8 && Math.abs(Math.abs(x) - 7) < 3) continue;
          tufts.push({ p: [x, y + 0.14, z], s: [0.9 + r(), 0.8 + r() * 1.3, 0.9 + r()], c: r() > 0.5 ? '#9aa646' : '#b3a653' });
        }
      });
      const domeTufts = []; const domeSpill = [];
      for (let i = 0; i < 26; i += 1) {
        const a = r() * 6.283; const k = 0.35 + r() * 0.6; const x = Math.cos(a) * 8 * k; const z = Math.sin(a) * 6.4 * k;
        const hh = 3.6 * Math.sqrt(Math.max(0, 1 - k * k)) - 0.3;
        domeTufts.push({ p: [x, T3.h + hh + 0.1, z], s: [1 + r(), 0.9 + r() * 1.2, 1 + r()], c: r() > 0.5 ? '#8fa042' : '#a9a850' });
        if (i < 9) { const q = 0.4 + r() * 0.5; domeSpill.push({ p: [x * 1.02, T3.h + hh * 0.9, z * 1.02], s: [q, q * 0.6, q * 1.2], ry: r() * 3, c: '#9a5a3c' }); }
      }
      return { rubble, tufts, domeTufts, domeSpill };
    }, []);

    return (
      <group>
        {/* footing, three terraces */}
        <Terrace w={FOOT.w} d={FOOT.d} h={FOOT.h} seed={21} amp={0.5} cap={grassB} side={brickD} />
        <Terrace w={T1.w} d={T1.d} h={T1.h} seed={22} amp={0.9} cap={deck} side={brick} />
        <Terrace w={T2.w} d={T2.d} h={T2.h} seed={23} amp={0.9} cap={deck} side={brickD} />
        <Terrace w={T3.w} d={T3.d} h={T3.h} seed={24} amp={0.8} cap={deck} side={brick} />
        {/* grassy dome of the unexcavated stupa hump */}
        <mesh position={[0, T3.h - 0.3, 0]} scale={[1, 0.45, 0.8]} material={domeMat} castShadow receiveShadow><sphereGeometry args={[8, 32, 16]} /></mesh>
        <Inst geo={<coneGeometry args={[0.1, 0.55, 4]} />} mat={useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), [])} items={extras.domeTufts} />
        <Inst geo={<boxGeometry args={[1, 1, 1]} />} mat={useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), [])} items={extras.domeSpill} />

        {/* two separate stairs, each flanked by wing walls */}
        {[-7, 7].map((x) => (
          <group key={x}>
            <Flight zf={T1.d / 2} y0={0} top={T1.h} n={7} brick={brick} x={x} hw={1.5} />
            <Flight zf={T2.d / 2} y0={T1.h} top={T2.h} n={6} brick={brickD} hw={1.4} x={x} />
            <Flight zf={T3.d / 2} y0={T2.h} top={T3.h} n={5} brick={brick} hw={1.3} x={x} />
          </group>
        ))}

        {/* long low plinth wall along the base, continuous with gaps at the stairs */}
        {[[-26, -10], [-4, 4], [10, 26]].map(([x0, x1], i) => <BB key={i} s={[x1 - x0, 0.5, 1.2]} p={[(x0 + x1) / 2, 0.25, 17.3]} m={i === 1 ? brick : brickD} />)}

        {/* shrine on the crown */}
        <group position={[0, T3.h + 2.6, -0.5]} scale={SHR}><Shrine /></group>
        <group position={[2.4, T3.h + 2.7, 2.6]}><Linga /></group>

        {/* prayer flags strung across each stair above the wing walls */}
        {[-7, 7].flatMap((x) => [[T2.d / 2 + 1.8, 6.2, 1.6], [T3.d / 2 + 1.6, 7.6, 1.5]].map(([z, y, hw], i) => (
          <Flags key={`${x}${i}`} from={[x - hw, y, z]} to={[x + hw, y, z]} n={5} />
        )))}

        <Inst geo={<boxGeometry args={[1, 1, 1]} />} mat={useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), [])} items={extras.rubble} shadow />
        <Inst geo={<coneGeometry args={[0.1, 0.5, 4]} />} mat={useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), [])} items={extras.tufts} />

        <SecondBlock />
        <Foundations />
        <Well />

        {/* cattle grazing at the foot of the mound */}
        <Cow p={[-12, 0, 24]} r={0.6} />
        <Cow p={[-8.5, 0, 26.5]} r={-1.2} c="#8c6c4c" sp="#d9d3c5" />
        <Cow p={[-17, 0, 21]} r={2.2} c="#e4ddcc" sp="#7a5a3c" />
        <Cow p={[19, 0, 29]} r={1.6} c="#7c5c40" sp="#d9d3c5" />

        {/* the big tree beside the mound */}
        <Trees list={[[-31, -9, 1.4, 3], [-22, -19, 1.3, 5], [42, -16, 1.4, 4]]} />

        <Frame s={[52, 8, 32]} p={[9, 4, 4]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Ground() {
    const M = useM();
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(200, 200, 160, 160);
      const p = g.attributes.position; const cols = [];
      const base = new THREE.Color('#a3b04e'); const dry = new THREE.Color('#c4b861'); const lush = new THREE.Color('#84a044'); const bare = new THREE.Color('#b89f6a'); const wet = new THREE.Color('#5a6e34');
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i); const z = -p.getY(i);
        const e = ((x - POND[0]) / 15) ** 2 + ((z - POND[1]) / 9.5) ** 2;
        let y = 0; if (e < 1) y = -1.0 * Math.pow(1 - e, 0.9);
        p.setZ(i, y);
        const n = Math.sin(x * 0.21 + 1.3) * Math.sin(z * 0.17 + 0.4) + 0.5 * Math.sin(x * 0.57 + z * 0.43) + 0.3 * Math.sin(x * 1.3 - z * 1.1);
        c.copy(base);
        if (n > 0.5) c.lerp(dry, Math.min(1, (n - 0.5) * 0.9)); else if (n < -0.4) c.lerp(lush, Math.min(1, (-n - 0.4) * 0.8));
        const dm = Math.hypot(x, z); if (dm < 30 && n > 0.9) c.lerp(bare, 0.5);
        if (e < 1.25) c.lerp(wet, Math.min(1, (1.25 - e) * 1.6));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const gm = useMemo(() => {
      return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    }, [M]);
    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(150, 24, 16);
      const p = g.attributes.position; const cols = [];
      const hz = new THREE.Color('#e6ebe6'); const tp = new THREE.Color('#86b2dc'); const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) { const t = Math.pow(Math.max(0, p.getY(i) / 150), 0.55); c.copy(hz).lerp(tp, t); cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, []);
    const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }), []);
    const onBefore = (renderer, scene) => {
      const d = scene.background && scene.background.r !== undefined && scene.background.r < 0.35;
      if (skyMat.userData.d !== d) { skyMat.userData.d = d; if (d) skyMat.color.setRGB(0.42, 0.34, 0.6); else skyMat.color.setRGB(1, 1, 1); }
    };
    const tufts = useMemo(() => {
      const r = rng(5); const out = [];
      for (let i = 0; i < 160; i += 1) {
        const a = r() * 6.283; const d = 14 + r() * 50; const x = Math.cos(a) * d; const z = Math.sin(a) * d;
        if (Math.hypot(x - POND[0], z - POND[1]) < 14) continue;
        out.push({ p: [x, 0.14, z], s: [1, 0.8 + r() * 1.2, 1], c: r() > 0.5 ? '#a0a84a' : '#bfae58' });
      }
      return out;
    }, []);
    return (
      <group>
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} material={gm} receiveShadow />
        <mesh geometry={sky} material={skyMat} onBeforeRender={onBefore} />
        <Inst geo={<coneGeometry args={[0.1, 0.6, 4]} />} mat={useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), [])} items={tufts} />
      </group>
    );
  }

  function PondWater() {
    const water = useMemo(() => {
      const pts = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * 6.283; const k = 1 + 0.1 * Math.sin(3 * a + 1); return [Math.cos(a) * 9.6 * k, -Math.sin(a) * 6.2 * k]; });
      return new THREE.ShapeGeometry(shapeOf(pts), 1);
    }, []);
    const reeds = useMemo(() => {
      const r = rng(17); return Array.from({ length: 50 }, () => { const a = r() * 6.283; const k = 0.78 + r() * 0.22; return { p: [POND[0] + Math.cos(a) * 14 * k, 0.45, POND[1] + Math.sin(a) * 8.8 * k], s: [1, 0.7 + r(), 1], rz: (r() - 0.5) * 0.3, c: r() > 0.5 ? '#8c8a46' : '#6d7a3a' }; });
    }, []);
    return (
      <group>
        <mesh geometry={water} rotation={[-Math.PI / 2, 0, 0]} position={[POND[0], -0.7, POND[1]]}><meshStandardMaterial color="#6b7a3e" roughness={1} metalness={0} /></mesh>
        <Inst geo={<cylinderGeometry args={[0.03, 0.05, 1.1, 4]} />} mat={useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), [])} items={reeds} />
      </group>
    );
  }

  function Env() {
    const trees = useMemo(() => {
      const r = rng(77); const out = []; let sd = 100;
      // a row of big broad crowns 22-30 m behind the mounds
      for (let x = -96; x <= 96; x += 10) { if (r() < 0.3) continue; out.push([x + (r() - 0.5) * 5, -34 - r() * 8, 1.0 + r() * 0.4, sd++]); }
      for (let x = -90; x <= 90; x += 16) out.push([x + (r() - 0.5) * 6, -52 - r() * 12, 1.1 + r() * 0.4, sd++]);
      // scattered mango / banyan trees across the fields
      [[-62, -6], [-72, -24], [-56, -60], [-34, -22], [-78, -10], [84, -14], [60, -30], [-48, -26], [-75, -40]].forEach(([x, z]) => out.push([x, z, 1.1 + r() * 0.35, sd++]));
      return out.filter(([x, z]) => !(Math.hypot(x - POND[0], z - POND[1]) < 16));
    }, []);
    return (
      <group>
        <Ground />
        <PondWater />
        <Trees list={trees} />
      </group>
    );
  }

  return { 'kudan-nigrodharama': { Main, Env } };
}
