// Kasthamandap (rebuilt 2022): squat three-roof all-timber hall on an open post floor at Maru Tole, Kathmandu.
// Axes: front = +z; east = +x, north = -z, west = -x (Swayambhu hill), south = +z. Maju Dega to the NE (+x,-z), Simha Sattal SW.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Lion, Frame, GroundDisc, THREE, useMemo } = K;

  /* ---------- dimensions (units; roof 1 span 5.4 ~ 18.7 m) ---------- */
  const PL = 0.14;          // plinth height (one low step)
  const EAVE1 = 1.72;       // underside of roof 1
  const PH = 1.56;          // post length
  const TIMBER = '#6d4a30';
  const TIMBER_D = '#5a3b25';
  const TILE = '#b09078';   // fresh terracotta tint over the roof texture
  const RED = '#b5322e';
  const POST = '#7a5236';
  const CREAM = '#e9dfc2';

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- canvas textures ---------- */
  const texCache = new Map();
  function latticeTex() {
    if (texCache.has('lat')) return texCache.get('lat');
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#2b1c12'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#a8794a'; g.lineWidth = 5;
    for (let i = 8; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 4); g.lineTo(i, 124); g.stroke(); g.beginPath(); g.moveTo(4, i); g.lineTo(124, i); g.stroke(); }
    g.strokeStyle = '#6b4528'; g.lineWidth = 8; g.strokeRect(2, 2, 124, 124);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set('lat', t); return t;
  }
  function facadeTex(col, floors, cols, seed) {
    const key = `f|${col}|${floors}|${cols}|${seed}`;
    if (texCache.has(key)) return texCache.get(key);
    const W = 256, H = 64 * Math.max(3, floors + 1);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const c1 = mk(), c2 = mk(), g = c1.getContext('2d'), e = c2.getContext('2d');
    const r = rng(seed);
    g.fillStyle = col; g.fillRect(0, 0, W, H);
    e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    const fh = H / (floors + 1);
    // shop front on the ground floor
    const shop = ['#2f6db5', '#b8312f', '#2e8b57', '#d9a23a', '#7a7a80'][Math.floor(r() * 5)];
    g.fillStyle = shop; g.fillRect(8, H - fh + 8, W - 16, fh - 8);
    g.fillStyle = '#e8e2d2'; g.fillRect(14, H - fh + 22, W - 28, fh - 22);
    for (let x = 14; x < W - 14; x += 26) { g.fillStyle = r() < 0.5 ? '#403a34' : '#6a5a48'; g.fillRect(x, H - fh + 24, 20, fh - 24); }
    e.fillStyle = '#7a5a2a'; e.fillRect(14, H - fh + 24, W - 28, fh - 24);
    for (let f = 0; f < floors; f++) {
      const y = f * fh + 10;
      const cw = (W - 24) / cols;
      const wob = r() * 0.25;
      for (let i = 0; i < cols; i++) {
        const x = 12 + i * cw + cw * (0.1 + wob);
        g.fillStyle = '#e8e2d2'; g.fillRect(x - 3, y - 3, cw * 0.64 + 6, fh * 0.6 + 6);
        g.fillStyle = '#34414c'; g.fillRect(x, y, cw * 0.64, fh * 0.6);
        g.fillStyle = '#9aa6ad'; g.fillRect(x + cw * 0.3, y, 2, fh * 0.6);
        if (r() < 0.12) continue;
        if (r() < 0.45) { e.fillStyle = '#ffb35a'; e.fillRect(x, y, cw * 0.64, fh * 0.6); }
      }
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, f * fh + fh - 2, W, 3);
    }
    const t = new THREE.CanvasTexture(c1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const te = new THREE.CanvasTexture(c2); te.colorSpace = THREE.SRGBColorSpace;
    const out = { t, te };
    texCache.set(key, out); return out;
  }

  /* ---------- small helpers ---------- */
  /** Instanced row of vertical slats around a square (half-extent hx), optional gap on +z. */
  function SlatRing({ half, y, h, sw = 0.035, gap = 0, step = 0.11, color = '#c9a36e', rails = true, railColor }) {
    const mesh = useMemo(() => {
      const pts = [];
      for (let s = 0; s < 4; s++) {
        const n = Math.floor((half * 2) / step);
        for (let i = 0; i <= n; i++) {
          const u = -half + (i * half * 2) / n;
          let x, z, ry;
          if (s === 0) { x = u; z = half; ry = 0; } else if (s === 1) { x = u; z = -half; ry = 0; } else if (s === 2) { x = half; z = u; ry = 0; } else { x = -half; z = u; ry = 0; }
          if (s === 0 && Math.abs(u) < gap / 2) continue;
          pts.push([x, z, ry]);
        }
      }
      const geo = new THREE.BoxGeometry(sw, h, sw);
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const im = new THREE.InstancedMesh(geo, m, pts.length);
      const o = new THREE.Object3D();
      pts.forEach((p, i) => { o.position.set(p[0], y + h / 2, p[1]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.castShadow = true; im.receiveShadow = true;
      return im;
    }, [half, y, h, sw, gap, step, color]);
    const rc = railColor || color;
    const rm = useMemo(() => new THREE.MeshStandardMaterial({ color: rc, roughness: 0.8 }), [rc]);
    return (
      <group>
        <primitive object={mesh} />
        {rails && [h, 0.04].map((yy, k) => (
          <group key={k}>
            <mesh position={[0, y + yy, half]} material={rm}><boxGeometry args={[half * 2 + 0.05, 0.05, 0.06]} /></mesh>
            <mesh position={[0, y + yy, -half]} material={rm}><boxGeometry args={[half * 2 + 0.05, 0.05, 0.06]} /></mesh>
            <mesh position={[half, y + yy, 0]} material={rm}><boxGeometry args={[0.06, 0.05, half * 2 + 0.05]} /></mesh>
            <mesh position={[-half, y + yy, 0]} material={rm}><boxGeometry args={[0.06, 0.05, half * 2 + 0.05]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /** Red valance and dark eave board on all four edges of a roof (w x w, eave at height y). */
  function Fringe({ w, y, drop = 0.16 }) {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.7 });
    const dk = M.plain(TIMBER_D, { roughness: 0.8 });
    const tabs = useMemo(() => {
      const step = 0.15, n = Math.floor(w / step);
      const geo = new THREE.BoxGeometry(0.1, drop * 0.6, 0.03);
      const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: RED, roughness: 0.7 }), n * 4);
      const o = new THREE.Object3D(); let k = 0;
      for (let e = 0; e < 4; e++) for (let i = 0; i < n; i++) {
        const u = -w / 2 + step / 2 + i * step;
        o.rotation.set(0, e * Math.PI / 2, 0);
        const c = Math.cos(e * Math.PI / 2), sn = Math.sin(e * Math.PI / 2);
        // local (u, ., w/2) rotated about y
        o.position.set(u * c + (w / 2) * sn, -drop * 0.7, -u * sn + (w / 2) * c);
        o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
      }
      return im;
    }, [w, drop]);
    const edges = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    return (
      <group position={[0, y, 0]}>
        <primitive object={tabs} />
        {edges.map(([ex, ez], i) => {
          const along = ex === 0;
          const pos = (dy) => [ex * w / 2, dy, ez * w / 2];
          const size = (t) => (along ? [w + 0.04, t[0], t[1]] : [t[1], t[0], w + 0.04]);
          return (
            <group key={i}>
              <Box s={size([drop * 0.4, 0.04])} p={pos(-drop * 0.2)} m={red} cast={false} />
              <Box s={size([0.07, 0.09])} p={pos(0.0)} m={dk} cast={false} />
            </group>
          );
        })}
      </group>
    );
  }

  /** Dark hip-ridge strips on the four diagonals of a roof. */
  function Hips({ w, h, y, lift = 0.12 }) {
    const M = useM();
    const dk = M.plain('#6b3a24', { roughness: 0.9 });
    const r = (w / 2) * Math.SQRT2;
    const len = Math.hypot(r, h);
    const th = Math.atan2(h, r);
    return (
      <group position={[0, y, 0]}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, Math.PI / 4 + k * Math.PI / 2, 0]}>
            <Box s={[0.04, 0.04, len * 0.92]} p={[0, h / 2 - 0.02 + lift * 0.1, r / 2]} r={[th, 0, 0]} m={dk} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  /** Flat dark underside so the roof is not see-through from below. */
  function Soffit({ w, y }) {
    const M = useM();
    return <Box s={[w - 0.04, 0.05, w - 0.04]} p={[0, y - 0.01, 0]} m={M.plain('#3a281a', { roughness: 0.95 })} cast={false} />;
  }

  /** Lattice window with a dark frame, on the +z face of the local group. */
  function LatWin({ p, w = 0.62, h = 0.5 }) {
    const M = useM();
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: latticeTex(), emissiveMap: latticeTex(), emissive: '#ff9a40', emissiveIntensity: 0.18, roughness: 0.85 }), []);
    return (
      <group position={p}>
        <Box s={[w + 0.1, h + 0.1, 0.04]} m={M.plain('#3b2819')} cast={false} />
        <mesh position={[0, 0, 0.025]} material={mat}><boxGeometry args={[w, h, 0.02]} /></mesh>
      </group>
    );
  }

  /* ---------- the monument ---------- */
  function KastaMain() {
    const M = useM();
    const wood = M.mat('wood', 1, 1, { color: '#9a6a46' });
    const woodDk = M.plain(TIMBER_D, { roughness: 0.85 });
    const woodMd = M.plain(TIMBER, { roughness: 0.85 });
    const post = M.plain(POST, { roughness: 0.8 });
    const cream = M.plain(CREAM, { roughness: 0.9 });
    const tile1 = M.mat('roof', 7, 7, { color: TILE });
    const tile2 = M.mat('roof', 4, 4, { color: TILE });
    const tile3 = M.mat('roof', 3, 3, { color: TILE });
    const white = M.plain('#f0ebe0', { roughness: 0.6 });
    const gx = [-1.9, -0.95, 0, 0.95, 1.9];

    const posts = [];
    gx.forEach((x) => gx.forEach((z) => {
      if (x === 0 && z === 0) return;
      const core = Math.abs(x) === 0.95 && Math.abs(z) === 0.95;
      const sw = core ? 0.26 : 0.14;
      posts.push(<Box key={`p${x}_${z}`} s={[sw, PH + 0.1, sw]} p={[x, PL + (PH + 0.1) / 2, z]} m={core ? woodMd : post} />);
    }));

    return (
      <group>
        {/* low stone plinth, a single step */}
        <Box s={[4.7, PL, 4.7]} p={[0, PL / 2, 0]} m={M.mat('stone', 3, 3, { color: '#cfc8bb' })} />
        {/* open ground floor: posts, beam ring, carved beam band */}
        {posts}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[4.1, 0.2, 0.2]} p={[0, EAVE1 - 0.12, k * 1.9]} m={woodMd} />
            <Box s={[0.2, 0.2, 4.1]} p={[k * 1.9, EAVE1 - 0.12, 0]} m={woodMd} />
            <Box s={[0.2, 0.2, 4.1]} p={[k * 0.95, EAVE1 - 0.12, 0]} m={woodMd} />
            <Box s={[4.1, 0.2, 0.2]} p={[0, EAVE1 - 0.12, k * 0.95]} m={woodMd} />
            {/* carved panels between outer posts at mid height */}
            <Box s={[3.6, 0.2, 0.05]} p={[0, 1.2, k * 1.96]} m={wood} />
            <Box s={[0.05, 0.2, 3.6]} p={[k * 1.96, 1.2, 0]} m={wood} />
            <pointLight position={[k * 0.9, 1.0, 0.9]} intensity={0.35} distance={4} color="#ffb870" />
          </group>
        ))}
        {/* waist-high light timber slat fence, with the entrance gap on +z */}
        <SlatRing half={2.2} y={PL} h={0.3} sw={0.035} step={0.12} gap={0} color="#b8946a" railColor="#8a653c" />
        {/* carved beam band at y 1.35 and bracket band under roof 1 */}
        {[0, 1, 2, 3].map((s) => (
          <group key={'b' + s} rotation={[0, s * Math.PI / 2, 0]}>
            <Box s={[3.9, 0.16, 0.12]} p={[0, 1.35, 1.9]} m={woodDk} cast={false} />
            <Box s={[3.9, 0.3, 0.08]} p={[0, EAVE1 - 0.38, 1.98]} m={wood} cast={false} />
          </group>
        ))}
        {/* roof 1: the huge low terracotta umbrella */}
        <Box s={[4.6, 0.02, 4.6]} p={[0, PL + 0.012, 0]} m={M.plain('#2a1d14', { roughness: 0.95 })} cast={false} />
        <Soffit w={5.9} y={EAVE1} />
        <Roof w={5.9} d={5.9} h={0.7} y={EAVE1} m={tile1} sag={1.5} lift={0.28} fascia={false} />
        <Hips w={5.9} h={0.7} y={EAVE1} lift={0.28} />
        <Fringe w={5.9} y={EAVE1} drop={0.18} />
        {/* carved brackets under roof 1 */}
        {[0, 1, 2, 3].map((s) => (
          <group key={s} rotation={[0, s * Math.PI / 2, 0]}>
            {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
              <Box key={x} s={[0.1, 0.08, 0.7]} p={[x, EAVE1 - 0.25, 2.2]} r={[0.7, 0, 0]} m={woodMd} cast={false} />
            ))}
          </group>
        ))}
        {/* Gorakhnath shrine: small idols between the posts */}
        <Box s={[0.7, 0.12, 0.7]} p={[0, PL + 0.06, 0]} m={M.mat('stone', 1, 1, { color: '#d8d0c0' })} />
        <Box s={[0.34, 0.45, 0.3]} p={[0, PL + 0.35, 0]} m={M.plain('#b9a47a', { roughness: 0.7 })} />
        <Ball rad={0.1} p={[0, PL + 0.68, 0]} m={M.gold} />
        {[[-0.95, 0.5], [0.95, 0.4], [-0.5, 1.4], [0.5, 1.4]].map(([x, z], i) => (
          <group key={i} position={[x, PL, z]}>
            <Box s={[0.22, 0.34, 0.2]} p={[0, 0.17, 0]} m={M.plain(i % 2 ? '#8a6a48' : '#c9b48a', { roughness: 0.7 })} cast={false} />
            <Ball rad={0.07} p={[0, 0.4, 0]} m={M.plain('#d8c9a0')} />
          </group>
        ))}

        {/* storey 2: tall dark timber gallery behind a long carved balustrade */}
        <Box s={[3.2, 1.15, 3.2]} p={[0, 2.88, 0]} m={woodDk} />
        <Box s={[4.0, 0.1, 4.0]} p={[0, 2.3, 0]} m={woodDk} />
        {[0, 1, 2, 3].map((s) => (
          <group key={s} rotation={[0, s * Math.PI / 2, 0]}>
            {[-1.0, 0, 1.0].map((x) => <LatWin key={x} p={[x, 2.9, 1.62]} w={0.62} h={0.62} />)}
            {[-0.5, 0.5].map((x) => <Box key={x} s={[0.3, 0.3, 0.03]} p={[x, 3.15, 1.61]} m={M.plain('#e9dfc2', { roughness: 0.9 })} cast={false} />)}
            {[-1.5, -0.5, 0.5, 1.5].map((x) => <Box key={x} s={[0.12, 1.0, 0.1]} p={[x, 2.85, 1.62]} m={woodMd} cast={false} />)}
            <Box s={[3.2, 0.1, 0.1]} p={[0, 3.35, 1.62]} m={woodMd} cast={false} />
            {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => <Box key={x} s={[0.1, 0.09, 0.5]} p={[x, 2.22, 1.92]} r={[0.6, 0, 0]} m={woodDk} cast={false} />)}
          </group>
        ))}
        <SlatRing half={1.95} y={2.35} h={0.4} sw={0.03} step={0.07} color="#4a3020" railColor="#5a3b25" />
        {/* roof 2 */}
        <Soffit w={3.7} y={3.45} />
        <Roof w={3.7} d={3.7} h={0.6} y={3.45} m={tile2} sag={1.5} lift={0.22} fascia={false} />
        <Hips w={3.7} h={0.6} y={3.45} lift={0.22} />
        <Fringe w={3.7} y={3.45} drop={0.15} />

        {/* storey 3: tall timber band, balustrade and lattice windows */}
        <Box s={[1.7, 1.0, 1.7]} p={[0, 3.95, 0]} m={woodDk} />
        {[0, 1, 2, 3].map((s) => (
          <group key={s} rotation={[0, s * Math.PI / 2, 0]}>
            {[-0.42, 0.42].map((x) => <LatWin key={x} p={[x, 4.1, 0.87]} w={0.42} h={0.48} />)}
            <Box s={[1.7, 0.08, 0.08]} p={[0, 4.42, 0.88]} m={woodMd} cast={false} />
          </group>
        ))}
        <SlatRing half={0.98} y={3.82} h={0.16} sw={0.025} step={0.07} color="#4a3020" />
        {/* roof 3 */}
        <Soffit w={2.2} y={4.4} />
        <Roof w={2.2} d={2.2} h={0.65} y={4.4} m={tile3} sag={1.5} lift={0.14} fascia={false} />
        <Hips w={2.2} h={0.65} y={4.4} lift={0.14} />
        <Fringe w={2.2} y={4.4} drop={0.15} />
        {/* modest white finial */}
        <Cyl rt={0.05} rb={0.08} h={0.14} p={[0, 5.12, 0]} m={white} seg={12} />
        <Ball rad={0.09} p={[0, 5.24, 0]} sc={[1, 1.15, 1]} m={white} />
        <mesh position={[0, 5.42, 0]} material={white} castShadow><coneGeometry args={[0.04, 0.25, 8]} /></mesh>
        <Frame s={[6.2, 5.8, 6.2]} p={[0, 2.8, 0]} />
      </group>
    );
  }

  /* ---------- environment pieces ---------- */
  function Town({ p, w = 3.2, d = 3.2, fl = 4, col = '#f1e7cf', tank, seed = 1, eave, bay, off = 0 }) {
    const M = useM();
    const rot = Math.atan2(-p[0], -p[2]);
    const H = fl * 0.82 + 0.35;
    const cols = Math.max(3, Math.round(w / 0.75));
    const { side, top } = useMemo(() => {
      const f = facadeTex(col, fl, cols, seed);
      const sm = new THREE.MeshStandardMaterial({ map: f.t, emissiveMap: f.te, emissive: '#ffffff', emissiveIntensity: 0.2, roughness: 0.9 });
      const bm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 });
      return { side: sm, top: bm };
    }, [col, fl, cols, seed]);
    const mats = [top, top, top, top, side, top];
    return (
      <group position={[p[0], 0, p[2]]} rotation={[0, rot + off, 0]}>
        {eave && <Box s={[w + 0.1, 0.05, 0.7]} p={[0, 0.98, d / 2 + 0.3]} r={[0.38, 0, 0]} m={M.mat('roof', 1, 1, { color: '#a89888' })} cast={false} />}
        {bay && <Box s={[w * 0.4, 0.6, 0.35]} p={[w * 0.15, 1.85, d / 2 + 0.17]} m={M.plain('#5a3b25', { roughness: 0.85 })} cast={false} />}
        <mesh position={[0, H / 2, 0]} material={mats} castShadow receiveShadow><boxGeometry args={[w, H, d]} /></mesh>
        <mesh position={[0, H + 0.04, 0]} castShadow><boxGeometry args={[w + 0.12, 0.1, d + 0.12]} /><meshStandardMaterial color="#8d8a84" roughness={0.9} /></mesh>
        {tank === 'blue' && <mesh position={[w * 0.25, H + 0.3, -d * 0.2]}><cylinderGeometry args={[0.22, 0.22, 0.42, 12]} /><meshStandardMaterial color="#2f7fc4" roughness={0.6} /></mesh>}
        {tank === 'green' && <mesh position={[-w * 0.25, H + 0.3, -d * 0.1]}><cylinderGeometry args={[0.22, 0.22, 0.42, 12]} /><meshStandardMaterial color="#3f9b6a" roughness={0.6} /></mesh>}
        {tank === 'room' && <mesh position={[0, H + 0.3, -d * 0.15]}><boxGeometry args={[w * 0.5, 0.5, d * 0.45]} /><meshStandardMaterial color="#d7c9a8" roughness={0.9} /></mesh>}
      </group>
    );
  }

  function Person({ p, c = '#c0392b', s = 1 }) {
    return (
      <group position={p} scale={s}>
        <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.06, 0.07, 0.26, 8]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
        <mesh position={[0, 0.31, 0]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#c99a75" roughness={0.9} /></mesh>
      </group>
    );
  }
  function Umbrella({ p, c = '#e2b33c' }) {
    return (
      <group position={p}>
        <Cyl rt={0.012} h={0.9} p={[0, 0.45, 0]} m={useM().plain('#555')} seg={6} />
        <mesh position={[0, 0.95, 0]} castShadow><coneGeometry args={[0.55, 0.2, 12]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
        <Box s={[0.5, 0.2, 0.3]} p={[0.1, 0.1, 0.35]} m={useM().plain('#a8743c')} />
      </group>
    );
  }
  function Bike({ p, r = 0, c = '#b8282e' }) {
    return (
      <group position={p} rotation={[0, r, 0]}>
        <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.55, 0.14, 0.14]} /><meshStandardMaterial color={c} roughness={0.5} /></mesh>
        {[-0.22, 0.22].map((x) => <mesh key={x} position={[x, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.05, 10]} /><meshStandardMaterial color="#222" /></mesh>)}
      </group>
    );
  }
  function Lamp({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.03} rb={0.04} h={1.5} p={[0, 0.75, 0]} m={M.plain('#3a3a3e')} seg={8} />
        <mesh position={[0, 1.55, 0]}><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color="#ffe2a0" emissive="#ffb25a" emissiveIntensity={1.6} /></mesh>
        <pointLight position={[0, 1.5, 0]} intensity={0.6} distance={5} color="#ffb870" />
      </group>
    );
  }

  /** Maju Dega: 9-step red-brick plinth, three roofs, white pinnacle. Faces SW towards Kasthamandap. */
  function MajuDega({ p }) {
    const M = useM();
    const brick = M.mat('brick', 2, 1, { color: '#f0a888' });
    const brickTop = M.mat('brick', 2, 2, { color: '#e89a78' });
    const woodMd = M.plain(TIMBER, { roughness: 0.85 });
    const tile = M.mat('roof', 3, 3, { color: '#cdb099' });
    const white = M.plain('#f0ebe0');
    const steps = [];
    for (let i = 0; i < 9; i++) steps.push(<Box key={i} s={[5.0 - i * 0.3, 0.14, 5.0 - i * 0.3]} p={[0, 0.07 + i * 0.14, 0]} m={i % 2 ? brickTop : brick} />);
    const y0 = 9 * 0.14;
    return (
      <group position={p} scale={1.2} rotation={[0, Math.atan2(-p[0], -p[2]), 0]}>
        {steps}
        <Box s={[1.5, 1.0, 1.5]} p={[0, y0 + 0.5, 0]} m={woodMd} />
        <Box s={[1.1, 0.5, 0.04]} p={[0, y0 + 0.5, 0.76]} m={M.plain('#2b1c12')} cast={false} />
        <Soffit w={2.7} y={y0 + 1.0} />
        <Roof w={2.7} d={2.7} h={0.5} y={y0 + 1.0} m={tile} sag={1.25} lift={0.14} fascia={false} />
        <Fringe w={2.7} y={y0 + 1.0} drop={0.08} />
        <Box s={[1.2, 0.8, 1.2]} p={[0, y0 + 1.55, 0]} m={woodMd} />
        <Roof w={2.0} d={2.0} h={0.45} y={y0 + 1.9} m={tile} sag={1.25} lift={0.14} fascia={false} />
        <Fringe w={2.0} y={y0 + 1.9} drop={0.06} />
        <Box s={[0.9, 0.7, 0.9]} p={[0, y0 + 2.3, 0]} m={woodMd} />
        <Roof w={1.4} d={1.4} h={0.45} y={y0 + 2.6} m={tile} sag={1.25} lift={0.14} fascia={false} />
        <Cyl rt={0.05} rb={0.09} h={0.16} p={[0, y0 + 3.14, 0]} m={white} seg={12} />
        <mesh position={[0, y0 + 3.5, 0]} material={white} castShadow><coneGeometry args={[0.12, 0.6, 10]} /></mesh>
      </group>
    );
  }

  /** Simha Sattal: small three-roof timber hall with stone lions. */
  function SimhaSattal({ p }) {
    const M = useM();
    const woodMd = M.plain(TIMBER, { roughness: 0.85 });
    const tile = M.mat('roof', 2, 2, { color: '#d9a07c' });
    const stone = M.stone;
    const rot = Math.atan2(-p[0], -p[2]);
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[2.5, 0.12, 2.5]} p={[0, 0.06, 0]} m={M.mat('stone', 2, 2, { color: '#cfc8bb' })} />
        {[-0.9, 0, 0.9].map((x) => [-0.9, 0.9].map((z) => <Box key={`${x}${z}`} s={[0.1, 0.9, 0.1]} p={[x, 0.57, z]} m={woodMd} />))}
        <Soffit w={2.9} y={1.05} />
        <Roof w={2.9} d={2.9} h={0.5} y={1.05} m={tile} sag={1.25} lift={0.14} fascia={false} />
        <Fringe w={2.9} y={1.05} drop={0.08} />
        <Box s={[1.7, 0.6, 1.7]} p={[0, 1.4, 0]} m={woodMd} />
        <Roof w={2.0} d={2.0} h={0.45} y={1.7} m={tile} sag={1.25} lift={0.14} fascia={false} />
        <Box s={[0.9, 0.5, 0.9]} p={[0, 2.0, 0]} m={woodMd} />
        <Roof w={1.3} d={1.3} h={0.4} y={2.25} m={tile} sag={1.25} lift={0.14} fascia={false} />
        <mesh position={[0, 2.8, 0]} material={M.plain('#e8d9a8')}><coneGeometry args={[0.04, 0.35, 8]} /></mesh>
        {[-1, 1].map((k) => <group key={k} position={[k * 0.7, 0.12, 1.5]} scale={1.2}><Lion m={stone} /></group>)}
      </group>
    );
  }

  /** Small Ganesh shrine at the edge of the plinth. */
  function GaneshShrine({ p }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, Math.PI * 0.3, 0]}>
        <Box s={[0.9, 0.1, 0.9]} p={[0, 0.05, 0]} m={M.mat('brick', 1, 1, { color: '#f0a888' })} />
        <Box s={[0.6, 0.55, 0.6]} p={[0, 0.375, 0]} m={M.mat('brick', 1, 1, { color: '#f0a888' })} />
        <Box s={[0.3, 0.3, 0.04]} p={[0, 0.35, 0.31]} m={M.plain('#2b1c12')} cast={false} />
        <Roof w={1.0} d={1.0} h={0.32} y={0.66} m={M.mat('roof', 1, 1, { color: '#cdb099' })} sag={1.25} lift={0.14} fascia={false} />
        <Cyl rt={0.02} rb={0.04} h={0.22} p={[0, 1.08, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  function Hill() {
    const M = useM();
    const green = M.plain('#3f6e40', { roughness: 1 });
    const green2 = M.plain('#4c7c4b', { roughness: 1 });
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(1, 40, 22, 0, Math.PI * 2, 0, Math.PI / 2);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const n = 1 + 0.1 * Math.sin(x * 5 + z * 3) + 0.06 * Math.cos(z * 7 - x * 2);
        const k = Math.pow(Math.max(0, 1 - Math.hypot(x, z)), 0) ;
        pos.setXYZ(i, x * n * (1.0 + (1 - y) * 0.25), Math.pow(y, 0.8), z * n * (1.0 + (1 - y) * 0.25));
      }
      g.computeVertexNormals();
      return g;
    }, []);
    return (
      <group position={[-12, 0, -46]} scale={1}>
        <mesh geometry={geo} scale={[18, 12, 12]} material={green} receiveShadow />
        <mesh geometry={geo} position={[18, 0, 8]} scale={[16, 5.5, 11]} material={green2} />
        <mesh geometry={geo} position={[-18, 0, 6]} scale={[14, 5, 10]} material={green2} />
        {/* Swayambhu stupa on the summit: white dome, gold harmika and spire */}
        <group position={[0, 11.4, 0]} scale={1.3}>
          <Cyl rt={2.0} rb={2.4} h={0.5} p={[0, 0.15, 0]} m={M.plain('#fbf7ee')} seg={20} />
          <Ball rad={1.6} sc={[1, 0.8, 1]} p={[0, 0.4, 0]} m={M.plain('#f6f2ea')} />
          <Box s={[0.9, 0.7, 0.9]} p={[0, 1.8, 0]} m={M.gold} />
          <mesh position={[0, 3.3, 0]} material={M.gold}><coneGeometry args={[0.55, 2.5, 12]} /></mesh>
        </group>
        {/* haze */}
        <mesh position={[0, 8, 6]} scale={[26, 12, 8]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#b8cfd0" transparent opacity={0.08} depthWrite={false} /></mesh>
      </group>
    );
  }

  /** Timber-fronted Newar house: brick body, dark carved window storeys, tiled eave and sloping roof. */
  function TimberHouse({ p, w = 3.4, d = 3.0, fl = 3 }) {
    const M = useM();
    const rot = Math.atan2(-p[0], -p[2]);
    const brick = M.mat('brick', 2, 2, { color: '#d89a7c' });
    const dk = M.plain('#4a3020', { roughness: 0.85 });
    const tile = M.mat('roof', 2, 2, { color: '#a88a72' });
    const sh = 0.8, H = fl * sh;
    return (
      <group position={[p[0], 0, p[2]]} rotation={[0, rot, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={brick} />
        {Array.from({ length: fl }).map((_, f) => (
          <group key={f}>
            <Box s={[w + 0.1, 0.07, 0.12]} p={[0, f * sh + 0.03, d / 2 + 0.05]} m={dk} cast={false} />
            {[-0.3, 0, 0.3].map((u, i) => f === 0 ? null : <Box key={i} s={[w * 0.24, sh * 0.55, 0.1]} p={[u * w * 1.2 * 0.8, f * sh + sh * 0.5, d / 2 + 0.05]} m={dk} cast={false} />)}
            {f === 0 && <Box s={[w * 0.8, sh * 0.6, 0.1]} p={[0, sh * 0.35, d / 2 + 0.05]} m={dk} cast={false} />}
            {f > 0 && <Box s={[w * 0.9, 0.05, 0.3]} p={[0, f * sh + 0.05, d / 2 + 0.15]} m={dk} cast={false} />}
          </group>
        ))}
        <Box s={[w + 0.9, 0.06, 0.9]} p={[0, sh + 0.12, d / 2 + 0.35]} r={[0.4, 0, 0]} m={tile} cast={false} />
        <Roof w={w + 0.6} d={d + 0.6} h={0.55} y={H} m={tile} sag={1.25} lift={0.1} fascia={false} />
      </group>
    );
  }

  function KastaEnv() {
    const M = useM();
    const paving = M.mat('stone', 14, 14, { color: '#efe1cd' });
    const lane = M.mat('brick', 3, 14, { color: '#cf9f86' });
    const towns = [
      // west side: irregular run of 3-5 storey houses, lane gap at SW
      { p: [-10, 0, -6], w: 4.4, fl: 4, col: '#c9c2b2', tank: 'blue', seed: 3, eave: 1 },
      { p: [-11.2, 0, -2.4], w: 2.6, fl: 5, col: '#b06f52', seed: 4, eave: 1, bay: 1 },
      { p: [-9.6, 0, 1.2], w: 3.6, fl: 3, col: '#e6dccb', seed: 5, bay: 1 },
      { p: [-10.4, 0, 6.8], w: 3.0, fl: 4, col: '#d8d0c0', tank: 'room', seed: 6, eave: 1 },
      // north side: stepped building line
      { p: [-6.4, 0, -9.4], w: 3.0, fl: 5, col: '#efe6c8', seed: 7, eave: 1, bay: 1 },
      { p: [-3.0, 0, -10.8], w: 4.2, fl: 4, col: '#dcd3c0', tank: 'green', seed: 8 },
      { p: [1.2, 0, -9.6], w: 2.4, fl: 3, col: '#9c5d46', seed: 9, eave: 1 },
      { p: [4.6, 0, -11.2], w: 3.8, fl: 5, col: '#cfd6c9', tank: 'blue', seed: 10, bay: 1 },
      // east side: a few houses, open towards Maju Dega
      { p: [12.4, 0, 6.6], w: 3.4, fl: 4, col: '#d9cdb4', tank: 'room', seed: 11, eave: 1 },
      { p: [11.6, 0, 3.6], w: 2.6, fl: 3, col: '#a9684c', seed: 12, bay: 1, eave: 1 },
      // far rows
      { p: [-15, 0, -8], w: 4.5, fl: 5, col: '#e4ddd0', seed: 13 },
      { p: [-15.6, 0, -1.6], w: 3.0, fl: 4, col: '#c9a468', tank: 'green', seed: 14, eave: 1 },
      { p: [-5, 0, -16], w: 4.0, fl: 6, col: '#a0634a', tank: 'blue', seed: 15 },
      { p: [2, 0, -16.5], w: 3.2, fl: 4, col: '#ecdca0', seed: 16, eave: 1 },
      { p: [-14.4, 0, 10], w: 3.6, fl: 3, col: '#e9e2d4', seed: 17 },
      { p: [11.5, 0, 11], w: 3.0, fl: 3, col: '#ecdca0', tank: 'blue', seed: 18 },
      { p: [-7.4, 0, 11.8], w: 3.2, fl: 4, col: '#efe6c8', tank: 'green', seed: 19 },
    ];    const timber = [
      { p: [8.5, 0, -11.8], w: 3.6, d: 3.0, fl: 3 },
      { p: [-13.2, 0, 3.6], w: 3.2, d: 3.0, fl: 3 },
      { p: [14.6, 0, -0.5], w: 3.0, d: 3.0, fl: 4 },
    ];
    const far = useMemo(() => {
      const r = rng(21); const out = [];
      for (let i = 0; i < 10; i++) {
        const a = Math.PI * (0.55 + i * 0.16);
        out.push({ x: Math.cos(a) * 56, z: Math.sin(a) * 56 - 0, s: [14 + r() * 8, 3 + r() * 3, 9 + r() * 5] });
      }
      return out;
    }, []);
    return (
      <group>
        <GroundDisc r={70} m={paving} y={-0.02} />
        {/* the two crossing streets (slightly darker, worn paving) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} material={lane}><planeGeometry args={[60, 3.2]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0.0]} position={[0, -0.011, 0]} material={lane}><planeGeometry args={[3.2, 60]} /></mesh>
        <Hill />
        {far.map((f, i) => (
          <mesh key={i} position={[f.x, 0, f.z]} scale={f.s} material={M.plain(i % 2 ? '#7d9a78' : '#8aa688', { roughness: 1 })}>
            <sphereGeometry args={[1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        ))}
        {towns.map((t, i) => <Town key={i} {...t} />)}
        <MajuDega p={[11, 0, -4]} />
        {timber.map((t, i) => <TimberHouse key={i} {...t} />)}
        <SimhaSattal p={[-12, 0, 10]} />
        <GaneshShrine p={[-4.0, 0, 3.4]} />
        {/* street life */}
        <Umbrella p={[5.2, 0, 6.2]} c="#e2b33c" />
        <Umbrella p={[6.4, 0, 5.2]} c="#2f6db5" />
        <Umbrella p={[-6.0, 0, 6.8]} c="#c0392b" />
        <Person p={[4.4, 0, 6.8]} c="#c0392b" />
        <Person p={[5.8, 0, 6.6]} c="#2e8b57" />
        <Person p={[7, 0, 4]} c="#2f6db5" />
        <Person p={[3, 0, 5.5]} c="#e6e0d0" />
        <Person p={[-5, 0, 5]} c="#d9a23a" />
        <Person p={[8, 0, 1]} c="#7a4a8a" />
        <Person p={[-3, 0, 6.5]} c="#c0392b" />
        <Person p={[0.6, 0, 3.4]} c="#e6e0d0" s={0.95} />
        <Bike p={[-7.4, 0, 3.0]} r={0.4} />
        <Bike p={[3.2, 0, 5.4]} r={1.2} c="#2f6db5" />
        <Umbrella p={[2.4, 0, 7.4]} c="#c0392b" />
        <Umbrella p={[-1.6, 0, 6.6]} c="#3f9b6a" />
        <Bike p={[-7.9, 0, 2.2]} r={0.3} c="#2b2b30" />
        <Bike p={[-7.2, 0, -1.2]} r={1.4} c="#e2b33c" />
        <Lamp p={[7.2, 0, 7.2]} />
        <Lamp p={[-7, 0, -7.5]} />
        <Lamp p={[7.5, 0, -6.5]} />
      </group>
    );
  }

  return { kasthamandap: { Main: KastaMain, Env: KastaEnv } };
}
