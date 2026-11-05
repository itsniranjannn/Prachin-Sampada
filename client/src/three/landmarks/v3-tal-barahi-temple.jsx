// Tal Barahi Temple, island in Phewa Lake, Pokhara.
// Tiny two-roofed Newari pagoda (ribbed silver-grey metal roofs, white-and-red lace valance, dark timber storeys,
// gilded corner birds and pinnacle) on a long low tree-covered island with a stone wall and white rim railing,
// a wide brick-red ghat with sand beach and boats, a small grey hip-roofed pavilion, Machapuchare and Annapurna behind.
// Scale: about 0.4 units per metre (temple ~8.4 m tall, lower roof 2.7 units = 6.7 m). Front = +z (ghat side).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Frame, THREE, useMemo, useRef } = K;

  const WATER = -0.6; // lake surface; island top is y = 0
  const IC = -2.5; // island centre x
  const IA = 13.5; // island half length
  const IB = 3.4; // island half width

  /* ---------- island outline (superellipse, slightly irregular) ---------- */
  const OUT = [];
  {
    const N = 72;
    const n = 2.6;
    for (let i = 0; i < N; i += 1) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t);
      const s = Math.sin(t);
      const x = IC + IA * Math.sign(c) * Math.abs(c) ** (2 / n);
      const z = IB * Math.sign(s) * Math.abs(s) ** (2 / n) * (1 + 0.05 * Math.sin(3 * t + 0.6));
      OUT.push([x, z]);
    }
  }
  const INSET = OUT.map(([x, z]) => [IC + (x - IC) * 0.985, z * 0.965]);

  /* ---------- procedural textures ---------- */
  const cache = {};
  function canvasTex(key, w, h, draw) {
    if (!cache[key]) {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      draw(cv.getContext('2d'));
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      cache[key] = t;
    }
    return cache[key];
  }
  function ribMat(kind) {
    const k = `rib${kind}`;
    if (!cache[k]) {
      const base = kind === 'pav' ? '#8f9490' : '#98a89a';
      const t = canvasTex(`ribtex${kind}`, 32, 8, (g) => {
        g.fillStyle = base; g.fillRect(0, 0, 32, 8);
        g.fillStyle = '#d3dad0'; g.fillRect(0, 0, 4, 8);
        g.fillStyle = '#3d4a40'; g.fillRect(4, 0, 4, 8);
      });
      cache[k] = new THREE.MeshStandardMaterial({ map: t, metalness: 0.35, roughness: 0.55, side: THREE.DoubleSide });
    }
    return cache[k];
  }
  function valMat() {
    if (!cache.val) {
      const t = canvasTex('valtex', 128, 64, (g) => {
        g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, 128, 40);
        g.fillStyle = '#b3322a'; g.fillRect(0, 0, 128, 10);
        for (let i = 0; i < 4; i += 1) {
          const cx = 16 + 32 * i;
          g.beginPath(); g.moveTo(cx, 14); g.lineTo(cx + 8, 25); g.lineTo(cx, 36); g.lineTo(cx - 8, 25); g.closePath(); g.fill();
        }
        g.strokeStyle = '#b3322a'; g.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
          const x = i * 16;
          g.fillStyle = '#f4f0e6';
          g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 16, 40); g.lineTo(x + 8, 62); g.closePath(); g.fill(); g.stroke();
        }
      });
      cache.val = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
    }
    return cache.val;
  }

  /* ---------- curved pagoda roof with downslope ribs ---------- */
  function roofY(w, h, lift, sag, x, z) {
    const ax = Math.abs(x) / (w / 2);
    const az = Math.abs(z) / (w / 2);
    const s = Math.max(ax, az);
    return h * (1 - s) ** sag + lift * h * (ax * az) ** 2.4;
  }
  function roofGeo(w, h, sag, lift, N = 22) {
    const hw = w / 2;
    const pos = []; const uv = []; const idx = [];
    for (let j = 0; j <= N; j += 1) {
      for (let i = 0; i <= N; i += 1) {
        const x = -hw + (w * i) / N;
        const z = -hw + (w * j) / N;
        const ax = Math.abs(x) / hw; const az = Math.abs(z) / hw;
        pos.push(x, roofY(w, h, lift, sag, x, z), z);
        const front = az >= ax;
        uv.push((front ? x : z) / 0.9, Math.max(ax, az));
      }
    }
    for (let j = 0; j < N; j += 1) {
      for (let i = 0; i < N; i += 1) {
        const a = j * (N + 1) + i; const b = a + 1; const c = a + (N + 1); const e = c + 1;
        idx.push(a, c, b, b, c, e);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  /** Lace valance: a strip hanging from the curved eave all the way round. */
  function valGeo(w, h, lift, band) {
    const hw = w / 2; const E = 22;
    const pts = [];
    for (let k = 0; k < E; k += 1) pts.push([-hw + (w * k) / E, hw]);
    for (let k = 0; k < E; k += 1) pts.push([hw, hw - (w * k) / E]);
    for (let k = 0; k < E; k += 1) pts.push([hw - (w * k) / E, -hw]);
    for (let k = 0; k < E; k += 1) pts.push([-hw, -hw + (w * k) / E]);
    const pos = []; const uv = []; const idx = [];
    let u = 0;
    pts.push(pts[0]);
    pts.forEach(([x, z], i) => {
      if (i > 0) u += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
      const y = lift * h * ((Math.abs(x) / hw) * (Math.abs(z) / hw)) ** 2.4;
      pos.push(x * 1.004, y + 0.012, z * 1.004, x * 1.004, y - band, z * 1.004);
      uv.push(u / 0.8, 1, u / 0.8, 0);
    });
    const L = pts.length;
    for (let i = 0; i < L - 1; i += 1) {
      const a = i * 2; const b = (i + 1) * 2;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    // closing vertices need a continuous uv: duplicate the first pair at the end of the loop
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const uvs = uv.slice();
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function TRoof({ w, h, y, lift = 0.45, sag = 1.5, kind = 'main', val = true, band = 0.2 }) {
    const M = useM();
    const geo = useMemo(() => roofGeo(w, h, sag, lift), [w, h, sag, lift]);
    const vg = useMemo(() => (val ? valGeo(w, h, lift, band) : null), [w, h, lift, band, val]);
    const hw = w / 2;
    const cy = lift * h;
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} material={ribMat(kind)} castShadow receiveShadow />
        {vg && <mesh geometry={vg} material={valMat()} />}
        <Box s={[w * 0.8, 0.03, w * 0.8]} p={[0, 0.02, 0]} m={M.dark} cast={false} />
        {val && [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[sx * hw, cy, sz * hw]} rotation={[0, Math.atan2(sx, sz), 0]}>
            <mesh position={[0, 0.09, 0.06]} rotation={[0.75, 0, 0]} material={M.gold} castShadow><coneGeometry args={[0.045, 0.3, 8]} /></mesh>
            <Ball rad={0.04} p={[0, 0.21, 0.17]} m={M.gold} />
            <Box s={[0.012, 0.07, 0.09]} p={[0, 0.2, 0.08]} m={M.gold} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- temple parts ---------- */
  const TIM = '#4a372c';
  const ROOT = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  function Struts({ half, eave, xs, len = 0.8, sw = 0.2, rows = 2 }) {
    const M = useM();
    const red = M.plain('#a8321f', { roughness: 0.8 });
    return (
      <>
        {xs.map((x) => (
          <group key={x}>
            {Array.from({ length: rows }).map((_, r) => (
              <group key={r} position={[x, eave - 0.3 - r * 0.12, half + 0.19 + r * 0.1]}>
                <Box s={[sw, len, 0.1]} r={[0.9, 0, 0]} m={r ? red : M.dark} cast={false} />
                <Box s={[sw * 0.8, 0.07, 0.12]} p={[0, -0.3, -0.27]} r={[0.9, 0, 0]} m={r ? M.gold : red} cast={false} />
              </group>
            ))}
          </group>
        ))}
      </>
    );
  }

  function TempleBody() {
    const M = useM();
    const wood = M.mat('wood', 1, 1, { color: TIM });
    const white = M.plain('#f2eee4', { roughness: 0.8 });
    const red = M.plain('#9c3b2e', { roughness: 0.8 });
    const door = M.plain('#2b1d15', { roughness: 0.7 });
    const gold = M.plain('#c9a23a', { metalness: 0.45, roughness: 0.4, emissive: '#5a3d06', emissiveIntensity: 0.4 });
    const half = 0.875; const y0 = 0.2; const h = 1.2;
    const half2 = 0.475; const yb = 1.65; const h2 = 0.7;
    return (
      <group>
        {/* plinth: two low steps */}
        <Box s={[2.8, 0.07, 2.8]} p={[0, 0.095, 0]} m={M.plain('#9d978a')} />
        <Box s={[2.4, 0.07, 2.4]} p={[0, 0.165, 0]} m={M.plain('#8f897d')} />
        {/* ground storey */}
        <Box s={[half * 2, 1.3, half * 2]} p={[0, y0 + 0.65, 0]} m={wood} />
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([a, b]) => (
          <Box key={`c${a}${b}`} s={[0.14, h, 0.14]} p={[a * (half - 0.02), y0 + h / 2, b * (half - 0.02)]} m={red} />
        ))}
        {ROOT.map((ry, k) => (
          <group key={k} rotation={[0, ry, 0]}>
            {[-1, 1].map((sx) => (
              <group key={sx}>
                <Box s={[0.26, 0.8, 0.03]} p={[sx * 0.5, y0 + 0.5, half + 0.025]} m={white} cast={false} />
                <Box s={[0.1, h - 0.1, 0.07]} p={[sx * 0.34, y0 + h / 2 - 0.05, half + 0.02]} m={red} cast={false} />
              </group>
            ))}
            {k === 0 ? (
              <group>
                <Box s={[0.56, 0.86, 0.05]} p={[0, y0 + 0.42, half - 0.08]} m={door} cast={false} />
                <Box s={[0.02, 0.8, 0.06]} p={[0, y0 + 0.42, half - 0.04]} m={gold} cast={false} />
                <Box s={[0.7, 0.08, 0.1]} p={[0, y0 + 0.9, half + 0.03]} m={M.dark} cast={false} />
                <Box s={[0.07, 0.86, 0.14]} p={[-0.3, y0 + 0.42, half - 0.02]} m={M.dark} cast={false} />
                <Box s={[0.07, 0.86, 0.14]} p={[0.3, y0 + 0.42, half - 0.02]} m={M.dark} cast={false} />
              </group>
            ) : (
              <group>
                <Box s={[0.5, 0.62, 0.05]} p={[0, y0 + 0.58, half + 0.02]} m={M.dark} cast={false} />
                {[-0.15, 0, 0.15].map((x) => <Box key={x} s={[0.03, 0.5, 0.06]} p={[x, y0 + 0.58, half + 0.05]} m={gold} cast={false} />)}
              </group>
            )}
            {/* carved window zone under the eave */}
            <Box s={[0.64, 0.2, 0.05]} p={[0, y0 + 1.02, half + 0.02]} m={M.dark} cast={false} />
            {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => <Box key={x} s={[0.025, 0.14, 0.06]} p={[x, y0 + 1.02, half + 0.05]} m={gold} cast={false} />)}
            <Struts half={half} eave={1.4} xs={[-0.74, -0.5, 0.5, 0.74]} len={0.8} sw={0.2} />
            <Box s={[half * 2 + 0.16, 0.09, 0.09]} p={[0, 1.34, half + 0.04]} m={M.dark} cast={false} />
          </group>
        ))}
        {/* upper (second) storey */}
        <Box s={[half2 * 2, h2 + 0.1, half2 * 2]} p={[0, yb + h2 / 2 - 0.05, 0]} m={wood} />
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([a, b]) => (
          <Box key={`u${a}${b}`} s={[0.09, h2, 0.09]} p={[a * (half2 - 0.01), yb + h2 / 2, b * (half2 - 0.01)]} m={red} />
        ))}
        {ROOT.map((ry, k) => (
          <group key={k} rotation={[0, ry, 0]}>
            <Box s={[0.34, 0.38, 0.04]} p={[0, yb + 0.36, half2 + 0.015]} m={M.dark} cast={false} />
            {[-0.09, 0, 0.09].map((x) => <Box key={x} s={[0.025, 0.3, 0.05]} p={[x, yb + 0.36, half2 + 0.04]} m={gold} cast={false} />)}
            <Box s={[0.9, 0.14, 0.03]} p={[0, yb + 0.1, half2 + 0.012]} m={white} cast={false} />
            <Struts half={half2} eave={yb + h2} xs={[-0.36, -0.18, 0.18, 0.36]} len={0.38} sw={0.09} rows={1} />
          </group>
        ))}
      </group>
    );
  }

  function Ribbons() {
    const cols = ['#e8731c', '#2f9a4a', '#f2c230', '#c8281e', '#e8731c', '#2f9a4a', '#f2c230', '#c8281e'];
    const list = [];
    for (let i = 0; i < 8; i += 1) list.push({ x: -0.7 + i * 0.2, z: 0.76, ry: 0, i });
    for (let i = 0; i < 5; i += 1) list.push({ x: 0.76, z: -0.5 + i * 0.25, ry: 1, i: i + 3 });
    for (let i = 0; i < 5; i += 1) list.push({ x: -0.76, z: -0.5 + i * 0.25, ry: 1, i: i + 1 });
    return (
      <group>
        {list.map((r, n) => {
          const len = 0.45 + ((n * 37) % 5) * 0.05;
          return (
            <mesh key={n} position={[r.x, 2.34 - len / 2, r.z]} rotation={[0, r.ry ? Math.PI / 2 : 0, ((n % 3) - 1) * 0.05]}>
              <boxGeometry args={[0.035, len, 0.008]} />
              <meshStandardMaterial color={cols[r.i % 8]} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>
    );
  }

  function Pigeons() {
    const M = useM();
    const spots = [[-1.0, 1.05, 1], [-0.62, 1.1, 1], [-0.2, 1.08, 1], [0.35, 1.1, 1], [0.8, 1.06, 1], [1.12, 0.7, 1], [1.1, -0.2, 1], [-1.12, 0.1, 1], [-0.45, 0.62, 2], [0.3, 0.62, 2], [0.62, 0.1, 2]];
    return (
      <group>
        {spots.map(([x, z, lvl], i) => {
          const y = lvl === 1 ? 1.4 + roofY(2.7, 0.45, 0.3, 1.5, x, z) : 2.35 + roofY(1.55, 0.45, 0.28, 1.5, x, z);
          return (
            <group key={i} position={[x, y + 0.04, z]} rotation={[0, i * 1.7, 0]}>
              <Ball rad={0.068} sc={[0.8, 0.9, 1.4]} m={M.plain('#8d8f93')} />
              <Ball rad={0.039} p={[0, 0.068, 0.09]} m={M.plain('#6e7075')} />
            </group>
          );
        })}
      </group>
    );
  }

  function Terrace() {
    const M = useM();
    const stone = M.plain('#9d978a', { roughness: 0.95 });
    const white = M.plain('#f4f0e6');
    const red = M.plain('#a33a2c');
    const T = 2.3;
    const posts = [];
    const run = (x1, z1, x2, z2, n) => { for (let i = 0; i <= n; i += 1) posts.push([x1 + ((x2 - x1) * i) / n, z1 + ((z2 - z1) * i) / n]); };
    run(-T, T, -1.2, T, 2); run(1.2, T, T, T, 2); run(-T, T, -T, -T, 6); run(T, T, T, -T, 6); run(-T, -T, T, -T, 6);
    const rails = [[-T, T, -1.2, T], [1.2, T, T, T], [-T, T, -T, -T], [T, T, T, -T], [-T, -T, T, -T]];
    return (
      <group>
        <Box s={[T * 2 + 0.2, 0.06, T * 2 + 0.2]} p={[0, 0.03, 0]} m={stone} />
        {posts.map(([x, z], i) => (
          <Box key={i} s={[0.07, 0.34, 0.07]} p={[x, 0.23, z]} m={red} cast={false} />
        ))}
        {rails.map(([x1, z1, x2, z2], i) => {
          const len = Math.hypot(x2 - x1, z2 - z1);
          const ang = Math.atan2(x2 - x1, z2 - z1);
          return <Box key={i} s={[0.035, 0.035, len]} p={[(x1 + x2) / 2, 0.34, (z1 + z2) / 2]} r={[0, ang, 0]} m={white} cast={false} />;
        })}
        {/* red brick lamp pedestals in front of the door */}
        {[-1.5, 1.5].map((x) => (
          <group key={x}>
            <Box s={[0.34, 0.42, 0.34]} p={[x, 0.27, 1.75]} m={M.mat('brick', 1, 1, { color: '#d9806c' })} />
            <Box s={[0.2, 0.04, 0.2]} p={[x, 0.5, 1.75]} m={M.plain('#c9a23a', { metalness: 0.4 })} />
            <Ball rad={0.06} p={[x, 0.58, 1.75]} m={M.plain('#ffcf6a', { emissive: '#ff9a20', emissiveIntensity: 0.9 })} />
          </group>
        ))}
      </group>
    );
  }

  function Pavilion({ p }) {
    const M = useM();
    const post = M.plain('#6e3a2c');
    return (
      <group position={p}>
        <Box s={[1.8, 0.1, 1.8]} p={[0, 0.05, 0]} m={M.plain('#aaa293')} />
        <Box s={[1.55, 0.1, 1.55]} p={[0, 0.14, 0]} m={M.plain('#bdb5a3')} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.07, 0.8, 0.07]} p={[a * 0.74, 0.55, b * 0.74]} m={post} />)}
        <Box s={[1.5, 0.45, 0.04]} p={[0, 0.4, -0.76]} m={M.plain('#e9e4d6')} />
        <Box s={[0.5, 0.36, 0.03]} p={[0.35, 0.36, 0.76]} m={M.plain('#f4f0e6')} />
        <Box s={[1.6, 0.06, 0.06]} p={[0, 0.9, 0.76]} m={M.dark} />
        <TRoof w={1.95} h={0.34} y={0.95} lift={0.22} sag={1.2} kind="pav" val={false} />
      </group>
    );
  }

  /* ---------- ghat, beach, boats ---------- */
  function Boat({ p, r = 0, color = '#c8372a', L = 1.9, W = 0.34, canopy = false }) {
    const M = useM();
    const hull = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-L / 2, 0); s.quadraticCurveTo(0, W * 1.6, L / 2, 0); s.quadraticCurveTo(0, -W * 1.6, -L / 2, 0);
      return new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
    }, [L, W]);
    const inner = useMemo(() => {
      const s = new THREE.Shape();
      const l = L * 0.9; const w = W * 0.78;
      s.moveTo(-l / 2, 0); s.quadraticCurveTo(0, w * 1.6, l / 2, 0); s.quadraticCurveTo(0, -w * 1.6, -l / 2, 0);
      return new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false });
    }, [L, W]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <mesh geometry={hull} rotation={[-Math.PI / 2, 0, 0]} material={M.plain(color, { roughness: 0.6 })} castShadow />
        <mesh geometry={inner} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.155, 0]} material={M.plain('#6a4a30')} />
        {[-0.3, 0.2].map((x) => <Box key={x} s={[0.07, 0.02, W * 2.2]} p={[x * L / 1.9, 0.14, 0]} m={M.plain('#8a6a48')} cast={false} />)}
        <Box s={[L * 0.9, 0.03, 0.04]} p={[0, 0.16, W * 0.95]} m={M.plain('#f4f0e6')} cast={false} />
        {canopy && (
          <>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.04, 0.62, 0.04]} p={[a * L * 0.22, 0.45, b * W * 1.1]} m={M.plain('#e9e4d6')} />)}
            <Box s={[L * 0.6, 0.05, W * 2.8]} p={[0, 0.78, 0]} m={M.plain('#2f6db5')} />
          </>
        )}
      </group>
    );
  }

  function Ghat() {
    const M = useM();
    const red = M.plain('#b5503f', { roughness: 0.85 });
    const tan = M.plain('#cfae80', { roughness: 0.9 });
    const pale = M.plain('#d8c9bd', { roughness: 0.9 });
    const x0 = 0.0; const x1 = 3.9; const W = x1 - x0; const cx = (x0 + x1) / 2;
    const depth = [0.28, 0.28, 0.28, 0.75, 0.28, 0.28, 0.28];
    let z = 3.9;
    const steps = depth.map((d, k) => {
      const zc = z + d / 2;
      z += d;
      const top = k < 3 ? -0.12 * (k + 1) : k === 3 ? -0.36 : -0.12 * k;
      return { zc, d, top, k };
    });
    const zEnd = z;
    return (
      <group>
        {/* paved landing at the head of the steps */}
        <Box s={[W + 0.3, 0.04, 0.6]} p={[cx, 0.02, 3.6]} m={M.plain('#8d877b')} />
        <Box s={[1.0, 0.035, 1.6]} p={[0, 0.0175, 3.0]} m={M.plain('#8d877b')} />
        {steps.map(({ zc, d, top, k }) => (
          <group key={k}>
            <Box s={[W, top - WATER, d]} p={[cx, (top + WATER) / 2, zc]} m={k === 3 ? M.plain('#9d9484', { roughness: 0.95 }) : red} />
            {k !== 3 && <Box s={[W + 0.02, 0.035, 0.1]} p={[cx, top + 0.005, zc - d / 2 + 0.06]} m={tan} cast={false} />}
          </group>
        ))}
        {/* white-and-red posts along both flanks of the ghat */}
        {[x0 - 0.12, x1 + 0.12].map((x) => [0, 1, 2, 3].map((i) => (
          <group key={`${x}${i}`}>
            <Box s={[0.07, 0.42, 0.07]} p={[x, -0.12 * Math.min(i * 1.2 + 1, 5) + 0.19, 4.0 + i * 0.5]} m={M.plain('#f4f0e6')} />
            <Box s={[0.075, 0.07, 0.075]} p={[x, -0.12 * Math.min(i * 1.2 + 1, 5) + 0.41, 4.0 + i * 0.5]} m={M.plain('#b3322a')} />
          </group>
        )))}
        {/* sand beach at the foot */}
        <mesh position={[cx, WATER + 0.02, zEnd + 0.9]} scale={[3.6, 1, 2.3]} material={M.plain('#d2c7ab', { roughness: 1 })} receiveShadow>
          <cylinderGeometry args={[1, 1, 0.04, 32]} />
        </mesh>
        <Boat p={[0.5, WATER - 0.02, zEnd + 1.7]} r={0.25} color="#c8372a" />
        <Boat p={[2.9, WATER - 0.02, zEnd + 1.6]} r={-0.15} color="#2f6db5" L={2.1} />
        <Boat p={[4.9, WATER - 0.02, zEnd + 0.9]} r={0.9} color="#2f8a54" L={1.8} />
        <Boat p={[-1.0, WATER - 0.02, zEnd + 0.7]} r={-0.5} color="#e8a21c" L={1.8} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function TalMain() {
    return (
      <group>
        <Frame s={[6.6, 3.5, 6.2]} p={[1.1, 1.7, 1.6]} />
        <Terrace />
        <TempleBody />
        <TRoof w={2.7} h={0.45} y={1.4} lift={0.3} />
        <TRoof w={1.55} h={0.45} y={2.35} lift={0.28} />
        <Gajur y={2.76} s={0.55} />
        <Cyl rt={0.012} rb={0.012} h={0.95} p={[0, 2.08, 0.62]} m={useM().plain('#9a9a9a', { metalness: 0.6 })} seg={6} />
        <Ribbons />
        <Pigeons />
        <Pavilion p={[3.7, 0, 0.3]} />
        <Ghat />
        <pointLight position={[0, 0.8, 1.4]} color="#ffb060" intensity={0.5} distance={4} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Sky({ lamps }) {
    const mat = useMemo(() => new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#7fa6d6') }, bot: { value: new THREE.Color('#eadcc8') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; float t = smoothstep(-0.02, 0.5, h); vec3 c = mix(bot, top, t); gl_FragColor = vec4(pow(c, vec3(0.4545)), 1.0); }',
    }), []);
    const before = (renderer, scene) => {
      const bg = scene.background;
      const dusk = !!(bg && bg.isColor && bg.getHSL({}).l < 0.2);
      mat.uniforms.top.value.set(dusk ? '#150c2a' : '#7fa6d6');
      mat.uniforms.bot.value.set(dusk ? '#2a1a44' : '#eadcc8');
      lamps.current.forEach((l) => { if (l) l.intensity = dusk ? l.userData.k : 0; });
    };
    return <mesh material={mat} renderOrder={-10} onBeforeRender={before}><sphereGeometry args={[175, 24, 16]} /></mesh>;
  }

  const PATCH = [];
  for (let i = 0; i < 34; i += 1) {
    const x = IC + (((i * 53) % 100) / 100) * 2 * IA * 0.9 - IA * 0.9;
    const z = (((i * 37) % 100) / 100) * 2 * IB * 0.8 - IB * 0.8;
    if (Math.abs(x) < 4.6 && z > -2.8 && z < 4) continue;
    PATCH.push([x, z, 0.3 + ((i * 7) % 5) * 0.1, ["#6a5c3e", "#4a6238", "#7a6c4c", "#556b3a", "#5b4d34"][i % 5], 1.5 + (i % 3) * 0.4]);
  }
  function Island() {
    const M = useM();
    const { top, band } = useMemo(() => {
      const sh = new THREE.Shape();
      OUT.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
      return {
        top: new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }),
        band: new THREE.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: false }),
      };
    }, []);
    // white railing along the rim, with a gap at the ghat
    const rail = useMemo(() => {
      const pos = []; const idx = [];
      const skip = (x, z) => z > 1.5 && x > -0.2 && x < 4.1;
      for (let i = 0; i < INSET.length; i += 1) {
        const a = INSET[i]; const b = INSET[(i + 1) % INSET.length];
        if (skip(a[0], a[1]) || skip(b[0], b[1])) continue;
        const o = pos.length / 3;
        pos.push(a[0], 0.2, a[1], a[0], 0.17, a[1], b[0], 0.2, b[1], b[0], 0.17, b[1]);
        idx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    const posts = INSET.filter((p, i) => i % 2 === 0 && !(p[1] > 1.5 && p[0] > -0.2 && p[0] < 4.1));
    return (
      <group>
        <mesh geometry={top} material={[M.plain('#5f7a45', { roughness: 1 }), M.plain('#b9b3a4')]} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER, 0]} receiveShadow castShadow />
        <mesh geometry={band} material={M.plain('#3a3d36')} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER - 0.001, 0]} scale={[1.004, 1.004, 1]} />
        <mesh geometry={rail} material={M.plain('#f4f0e6')} />
        <mesh geometry={rail} material={M.plain('#f4f0e6')} position={[0, -0.12, 0]} />
        {PATCH.map(([x, z, r, c, sx], i) => (
          <mesh key={`pt${i}`} position={[x, 0.006 + (i % 3) * 0.002, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, 1, 1]} receiveShadow>
            <circleGeometry args={[r, 14]} />
            <meshStandardMaterial color={c} roughness={1} />
          </mesh>
        ))}
        {posts.map(([x, z], i) => <Box key={i} s={[0.05, 0.24, 0.05]} p={[x, 0.11, z]} m={M.plain('#f4f0e6')} cast={false} />)}
      </group>
    );
  }

  const GREENS = ['#2f6a35', '#3a7440', '#27582f', '#3f7a3a', '#2d6232'];
  function TreeB({ p, s = 1.6, i = 0 }) {
    const M = useM();
    const g = GREENS[i % GREENS.length];
    const g2 = GREENS[(i + 2) % GREENS.length];
    const g3 = GREENS[(i + 4) % GREENS.length];
    return (
      <group position={[p[0], 0, p[1]]} scale={s}>
        <Cyl rt={0.1} rb={0.17} h={0.8} p={[0, 0.4, 0]} m={M.plain('#4d3a2c')} seg={8} />
        <Ball rad={0.95} p={[0, 1.4, 0]} sc={[1.1, 0.85, 1.1]} m={M.plain(g)} />
        <Ball rad={0.7} p={[0.7, 1.3, 0.2]} m={M.plain(g2)} />
        <Ball rad={0.68} p={[-0.7, 1.35, -0.2]} m={M.plain(g2)} />
        <Ball rad={0.6} p={[0.1, 1.2, 0.75]} m={M.plain(g3)} />
        <Ball rad={0.6} p={[-0.2, 1.25, -0.75]} m={M.plain(g)} />
        <Ball rad={0.7} p={[0.2, 2.0, 0.1]} m={M.plain(g3)} />
        <Ball rad={0.5} p={[-0.5, 1.9, 0.3]} m={M.plain(g2)} />
        <Ball rad={0.45} p={[0.55, 1.85, -0.3]} m={M.plain(g)} />
      </group>
    );
  }
  function Palm({ p, h = 2.6, i = 0 }) {
    const M = useM();
    return (
      <group position={[p[0], 0, p[1]]} rotation={[0, i, 0]}>
        <Cyl rt={0.05} rb={0.08} h={h} p={[0.06, h / 2, 0]} r={[0, 0, -0.05]} m={M.plain('#8a7a62')} seg={6} />
        <group position={[0.12, h, 0]}>
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <group key={k} rotation={[0, (k * Math.PI * 2) / 7, 0]}>
              <Box s={[0.95, 0.02, 0.2]} p={[0.45, -0.1, 0]} r={[0, 0, -0.4]} m={M.plain('#4a7a3a')} cast={false} />
            </group>
          ))}
        </group>
      </group>
    );
  }

  const TREES = [
    [-0.6, -3.3, 1.9], [2.4, -3.3, 1.7], [-4.2, -3.3, 1.5], [-3.2, -3.4, 1.6], [6.3, -1.8, 1.8], [9.0, -1.3, 1.5], [-6.5, -1.4, 1.7], [-8.5, -2.4, 1.5],
    [-10.2, -1, 1.9], [-12, 0.8, 1.5], [-14, -0.4, 1.3], [-6.4, -3.2, 1.3], [9.6, -2.4, 1.6], [11.2, -0.4, 1.3], [1.2, -3.6, 1.8], [4.6, -3.3, 1.6],
    [-8, -3, 1.6], [-11.5, -2.8, 1.5], [-10.4, 2.3, 1.3], [-12.6, 2.4, 1.2],
    [-2.2, -2.7, 1.5], [0.6, -2.4, 1.4], [3.2, -2.6, 1.5], [5.4, -2.5, 1.4], [-5.2, -2.6, 1.4], [-7.4, -2.7, 1.4], [7.6, -2.2, 1.4], [-3.6, -2.2, 1.3], [2.0, -2.2, 1.3], [10.6, -1.6, 1.3],
    [6.2, -1.1, 1.5],
  ];

  function Peak({ at, r, h, seg = 6, rock = '#56657a', snowK = 0.5 }) {
    const M = useM();
    const [x, z] = at;
    const sr = r * (1 - (1 - snowK)) * 1.01;
    return (
      <group position={[x, WATER, z]}>
        <mesh position={[0, h / 2, 0]} material={M.plain(rock, { flatShading: true, fog: false })}><coneGeometry args={[r, h, seg]} /></mesh>
        <mesh position={[0, h * (1 - snowK / 2), 0]} material={M.plain('#eef3fa', { flatShading: true, fog: false })}><coneGeometry args={[sr, h * snowK, seg]} /></mesh>
      </group>
    );
  }
  const polar = (deg, R) => [R * Math.sin((deg * Math.PI) / 180), -R * Math.cos((deg * Math.PI) / 180)];

  function Hills() {
    const M = useM();
    const out = [];
    for (let i = 0; i < 24; i += 1) {
      const deg = i * 15;
      const dd = Math.abs(((deg + 180) % 360) - 180);
      if (dd > 115) continue;
      const R = 62 + (i % 3) * 9;
      const [x, z] = polar(deg, R);
      const far = i % 3 === 2;
      out.push(<Ball key={i} rad={10 + (i % 4)} p={[x, WATER, z]} sc={[1.6, 0.8 + (i % 2) * 0.15, 1]} m={M.plain(far ? '#4b6a52' : '#365236')} />);
    }
    for (let i = 0; i < 16; i += 1) {
      const deg = -120 + i * 15;
      const [x, z] = polar(deg, 92 + (i % 2) * 8);
      out.push(<mesh key={`f${i}`} position={[x, WATER + (15 + (i % 3) * 4) / 2, z]} material={M.plain(i % 2 ? '#2f4a3a' : '#3a5742', { flatShading: true, fog: false })}><coneGeometry args={[24 + (i % 3) * 3, 15 + (i % 3) * 4, 7]} /></mesh>);
    }
    for (let i = 0; i < 10; i += 1) {
      const deg = 140 + i * 8;
      const [x, z] = polar(deg, 58);
      out.push(<Ball key={`s${i}`} rad={12} p={[x, WATER, z]} sc={[1.6, 0.25, 1]} m={M.plain('#4f7a48')} />);
      if (i % 2) out.push(<Box key={`b${i}`} s={[2.2, 1.4, 1.6]} p={[x * 0.93, WATER + 1, z * 0.93]} m={M.plain(i % 4 === 1 ? '#e9e4d6' : '#c98a6a')} cast={false} />);
    }
    return <group>{out}</group>;
  }

  function TalEnv() {
    const M = useM();
    const lamps = useRef([]);
    const lampPos = [[0, 0.9, 1.6, 2.2], [4.5, 0.8, 1.0, 1.4], [-1.5, 0.8, 4.4, 1.6], [3.5, 0.8, 4.4, 1.6]];
    return (
      <group>
        <Sky lamps={lamps} />
        {/* lake */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER, 0]} receiveShadow>
          <circleGeometry args={[170, 48]} />
          <meshStandardMaterial color="#4f7468" metalness={0.45} roughness={0.12} />
        </mesh>
        <Island />
        {TREES.map(([x, z, s], i) => <TreeB key={i} p={[x, z]} s={s} i={i} />)}
        <Palm p={[8.4, 2.6]} h={2.5} i={2.1} />
        <Palm p={[-8.2, 2.4]} h={2.9} i={1.1} />
        {/* small white building, left of the temple */}
        <group position={[-9, 0, 1.0]}>
          <Box s={[2.4, 1.4, 1.3]} p={[0, 0.7, 0]} m={M.plain('#f4f0e6')} />
          <Box s={[2.55, 0.1, 1.45]} p={[0, 1.45, 0]} m={M.plain('#8a8c86')} />
          <Box s={[2.3, 0.14, 1.3]} p={[0, 1.55, 0]} m={M.plain('#7a7c76')} />
          <Box s={[0.4, 0.8, 0.04]} p={[0.5, 0.4, 0.67]} m={M.dark} />
          <Box s={[0.4, 0.4, 0.04]} p={[-0.6, 0.85, 0.67]} m={M.dark} />
        </group>
        {/* low red wall at the right end of the island */}
        <Box s={[5, 0.7, 0.45]} p={[7.2, 0.35, 1.7]} m={M.mat('brick', 2, 1, { color: '#d9806c' })} />
        <Box s={[5.1, 0.06, 0.55]} p={[7.2, 0.73, 1.7]} m={M.plain('#f4f0e6')} />
        {/* boat with a canopy off the right end */}
        <Boat p={[12.5, WATER - 0.02, 4.2]} r={0.15} color="#e9e4d6" L={3.0} W={0.5} canopy />
        <Hills />
        {[-100, -75, -50, -25, 0, 25, 50, 75, 100].map((d, i) => { const [x, z] = polar(d, 82); return <Ball key={`mh${i}`} rad={14} p={[x, WATER, z]} sc={[2.2, 0.85 + (i % 2) * 0.2, 1]} m={M.plain('#4b6a52')} />; })}
        {/* Machapuchare (fishtail, two summits) and the Annapurna range */}
        <Peak at={polar(-30, 100)} r={9} h={55} snowK={0.7} seg={5} />
        <Peak at={[polar(-30, 100)[0] + 4.2, polar(-30, 100)[1] + 1]} r={7.5} h={51} snowK={0.7} seg={5} />
        <Peak at={polar(-10, 118)} r={15} h={60} snowK={0.65} />
        <Peak at={polar(2, 120)} r={14} h={68} snowK={0.65} />
        <Peak at={polar(15, 118)} r={15} h={58} snowK={0.65} />
        <Peak at={polar(32, 112)} r={14} h={54} snowK={0.65} />
        <Peak at={polar(-62, 108)} r={14} h={46} snowK={0.6} />
        {lampPos.map(([x, y, z, k], i) => (
          <pointLight key={i} ref={(l) => { if (l) { l.userData.k = k; lamps.current[i] = l; } }} position={[x, y, z]} color="#ffb060" intensity={0} distance={6} />
        ))}
      </group>
    );
  }

  return { 'tal-barahi-temple': { Main: TalMain, Env: TalEnv } };
}
