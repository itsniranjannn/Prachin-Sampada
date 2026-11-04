// Bagh Bhairab Temple, Kirtipur: squat three-roofed Newar pagoda on a wide rectangular plan, facing south (+z),
// on the hill-edge platform of Kirtipur with the valley open to the east.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Diyo, Elephant, Frame, THREE, useMemo } = K;

  /* ---------- procedural textures (cached) ---------- */
  const texCache = new Map();
  function canvasTex(key, w, h, draw, rx = 1, ry = 1) {
    const id = `${key}|${rx}|${ry}`;
    if (texCache.has(id)) return texCache.get(id);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    texCache.set(id, t);
    return t;
  }
  const matCache = new Map();
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* weathered clay tile with moss and grey patches */
  function tileMat(key, base, patches, seed) {
    const id = `tile${key}`;
    if (!matCache.has(id)) {
      const map = canvasTex(`tile${key}`, 256, 256, (g, w, h) => {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        const r = rng(seed);
        const rows = 8; const rh = h / rows;
        for (let k = 0; k < rows; k += 1) {
          const j = k * rh;
          g.fillStyle = 'rgba(255,225,200,0.10)'; g.fillRect(0, j + rh * 0.55, w, rh * 0.45);
          g.fillStyle = 'rgba(25,14,10,0.5)'; g.fillRect(0, j, w, 3.5);
          for (let i = k % 2 ? 0 : 8; i < w; i += 16) { g.fillStyle = 'rgba(30,18,12,0.2)'; g.fillRect(i, j, 1.5, rh); }
          for (let i = 0; i < w; i += 16) { g.fillStyle = `rgba(${r() < 0.5 ? '255,235,215' : '0,0,0'},0.07)`; g.fillRect(i, j + 4, 16, rh - 5); }
        }
        patches.forEach(([col, n, rad]) => {
          for (let k = 0; k < n; k += 1) {
            g.fillStyle = col;
            g.beginPath();
            g.ellipse(r() * w, r() * h, rad * (0.5 + r()), rad * (0.35 + r() * 0.6), r() * 3, 0, Math.PI * 2);
            g.fill();
          }
        });
      });
      matCache.set(id, new THREE.MeshStandardMaterial({ map, roughness: 0.95 }));
    }
    return matCache.get(id);
  }
  /* dense dark timber lattice (ankhi jhyal) */
  function latMat(rx, ry) {
    const id = `lat${rx}|${ry}`;
    if (!matCache.has(id)) {
      const map = canvasTex('lat2', 64, 64, (g, w, h) => {
        g.fillStyle = '#0c0705'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#7a5634';
        for (let i = 0; i < w; i += 8) g.fillRect(i, 0, 3, h);
        g.fillStyle = '#5a3e26';
        for (let j = 0; j < h; j += 16) g.fillRect(0, j, w, 3);
      }, rx, ry);
      matCache.set(id, new THREE.MeshStandardMaterial({ map, roughness: 0.8 }));
    }
    return matCache.get(id);
  }
  /* carved dark frieze: vertical slats with a lighter rail */
  function friezeMat(rx) {
    const id = `fr${rx}`;
    if (!matCache.has(id)) {
      const map = canvasTex('frieze', 64, 32, (g, w, h) => {
        g.fillStyle = '#1c120c'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#4a3322';
        for (let i = 2; i < w; i += 8) g.fillRect(i, 4, 3, h - 8);
        g.fillStyle = '#5a4030'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
      }, rx, 1);
      matCache.set(id, new THREE.MeshStandardMaterial({ map, roughness: 0.8 }));
    }
    return matCache.get(id);
  }
  /* a strip with three framed windows on a transparent ground, for the background houses */
  function stripMat(kind) {
    const id = `strip${kind}`;
    if (!matCache.has(id)) {
      const map = canvasTex(`strip${kind}`, 256, 96, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        const n = kind === 'shop' ? 2 : 3;
        for (let i = 0; i < n; i += 1) {
          const cx = ((i + 0.5) * w) / n;
          const ww = kind === 'shop' ? 80 : 46;
          g.fillStyle = kind === 'red' ? '#8e2a22' : '#4a3020';
          g.fillRect(cx - ww / 2 - 5, 14, ww + 10, h - 24);
          g.fillStyle = '#150d08'; g.fillRect(cx - ww / 2, 20, ww, h - 36);
          g.fillStyle = '#6a4a30';
          for (let k = 0; k < ww; k += 8) g.fillRect(cx - ww / 2 + k, 20, 3, h - 36);
        }
      });
      matCache.set(id, new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.4, roughness: 0.85 }));
    }
    return matCache.get(id);
  }

  /* ---------- hipped roof with a ridge and Newar curve ---------- */
  function hipGeo(w, d, h, sag = 1.3, lift = 0.18, rf = 0.5) {
    const hw = w / 2; const hd = d / 2;
    const rl = Math.max(0, hw - hd * rf);
    const seq = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
    const xs = [...seq(-hw, -rl, 7), ...seq(rl, hw, 7)];
    const zs = seq(-hd, hd, 16);
    const pos = []; const uv = []; const idx = [];
    zs.forEach((z) => xs.forEach((x) => {
      const ax = Math.abs(x);
      const ex = hw - rl > 0 ? Math.max(0, ax - rl) / (hw - rl) : ax / hw;
      const az = Math.abs(z) / hd;
      const s = Math.max(ex, az);
      pos.push(x, h * (1 - s) ** sag + lift * h * ((ax / hw) * az) ** 2.4, z);
      uv.push((x + hw) / 1.5, (z + hd) / 1.5);
    }));
    const cols = xs.length;
    for (let j = 0; j < zs.length - 1; j += 1) {
      for (let i = 0; i < cols - 1; i += 1) {
        const a = j * cols + i; const b = a + 1; const c = a + cols; const e = c + 1;
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
  function HipRoof({ w, d, h, y, m, sag = 1.3, lift = 0.18, rf = 0.5 }) {
    const geo = useMemo(() => hipGeo(w, d, h, sag, lift, rf), [w, d, h, sag, lift, rf]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
      </group>
    );
  }

  /* ---------- raking carved struts (tunala) ---------- */
  function Struts({ ww, wd, ew, ed, y, h, nF, nS, m }) {
    const out = [];
    const bx = ww / 2; const bz = wd / 2;
    const dz = ed / 2 - 0.1 - bz; const dx = ew / 2 - 0.1 - bx;
    const Lz = Math.hypot(dz, h); const az = Math.atan2(dz, h);
    const Lx = Math.hypot(dx, h); const ax = Math.atan2(dx, h);
    for (let k = 0; k < nF; k += 1) {
      const x = ((k + 0.5) / nF - 0.5) * ww * 0.94;
      out.push(<Box key={`f${k}`} s={[0.12, Lz, 0.14]} p={[x, y - h / 2 - 0.03, bz + dz / 2]} r={[az, 0, 0]} m={m} cast={false} />);
      out.push(<Box key={`b${k}`} s={[0.12, Lz, 0.14]} p={[x, y - h / 2 - 0.03, -(bz + dz / 2)]} r={[-az, 0, 0]} m={m} cast={false} />);
    }
    for (let k = 0; k < nS; k += 1) {
      const z = ((k + 0.5) / nS - 0.5) * wd * 0.92;
      out.push(<Box key={`r${k}`} s={[0.14, Lx, 0.12]} p={[bx + dx / 2, y - h / 2 - 0.03, z]} r={[0, 0, -ax]} m={m} cast={false} />);
      out.push(<Box key={`l${k}`} s={[0.14, Lx, 0.12]} p={[-(bx + dx / 2), y - h / 2 - 0.03, z]} r={[0, 0, ax]} m={m} cast={false} />);
    }
    return <group>{out}</group>;
  }

  /* ---------- one lattice window facing +z (carved frame, dense lattice) ---------- */
  function Win({ p, r = 0, w, h, frame }) {
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.12, h + 0.12, 0.07]} p={[0, 0, 0.02]} m={frame} cast={false} />
        <mesh position={[0, 0, 0.06]} material={latMat(Math.max(1, Math.round(w * 3.2)), Math.max(1, Math.round(h * 3.2)))}>
          <planeGeometry args={[w, h]} />
        </mesh>
        <Box s={[w + 0.2, 0.05, 0.13]} p={[0, -h / 2 - 0.08, 0.06]} m={frame} cast={false} />
      </group>
    );
  }
  function WinRing({ w, d, y, nF, nS, ww, wh, frame, backToo = true }) {
    const out = [];
    const put = (key, p, r) => out.push(<Win key={key} p={p} r={r} w={ww} h={wh} frame={frame} />);
    for (let k = 0; k < nF; k += 1) {
      const x = ((k + 0.5) / nF - 0.5) * w * 0.9;
      put(`f${k}`, [x, y, d / 2], 0);
      if (backToo) put(`b${k}`, [-x, y, -d / 2], Math.PI);
    }
    for (let k = 0; k < nS; k += 1) {
      const z = ((k + 0.5) / nS - 0.5) * d * 0.86;
      put(`r${k}`, [w / 2, y, z], Math.PI / 2);
      put(`l${k}`, [-w / 2, y, -z], -Math.PI / 2);
    }
    return <group>{out}</group>;
  }

  function Pinnacle({ p, m, s = 1 }) {
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.03} rb={0.05} h={0.08} p={[0, 0.04, 0]} m={m} seg={6} />
        <Ball rad={0.045} p={[0, 0.11, 0]} m={m} />
        <mesh position={[0, 0.22, 0]} material={m}><coneGeometry args={[0.03, 0.2, 6]} /></mesh>
      </group>
    );
  }

  /* hanging red valance: a thin ruffled fringe with a thin white edge */
  function Valance({ w, d, y, o = 0.03 }) {
    const M = useM();
    const r1 = M.plain('#b21f1c', { roughness: 0.9 });
    const r2 = M.plain('#8f1816', { roughness: 0.9 });
    const white = M.plain('#f4efe6', { roughness: 0.9 });
    const out = [];
    const nW = Math.round(w / 0.32); const nD = Math.round(d / 0.32);
    for (let i = 0; i < nW; i += 1) {
      const x = ((i + 0.5) / nW - 0.5) * w; const bw = w / nW;
      const m = i % 2 ? r1 : r2; const e = i % 2 ? 0.012 : 0;
      out.push(<Box key={`f${i}`} s={[bw, 0.35, 0.02]} p={[x, y, d / 2 + o + e]} m={m} cast={false} />);
      out.push(<Box key={`b${i}`} s={[bw, 0.35, 0.02]} p={[x, y, -d / 2 - o - e]} m={m} cast={false} />);
    }
    for (let i = 0; i < nD; i += 1) {
      const z = ((i + 0.5) / nD - 0.5) * d; const bd = d / nD;
      const m = i % 2 ? r1 : r2; const e = i % 2 ? 0.012 : 0;
      out.push(<Box key={`r${i}`} s={[0.02, 0.35, bd]} p={[w / 2 + o + e, y, z]} m={m} cast={false} />);
      out.push(<Box key={`l${i}`} s={[0.02, 0.35, bd]} p={[-w / 2 - o - e, y, z]} m={m} cast={false} />);
    }
    return (
      <group>
        {out}
        <Box s={[w + 0.1, 0.05, 0.025]} p={[0, y - 0.16, d / 2 + o + 0.01]} m={white} cast={false} />
        <Box s={[w + 0.1, 0.05, 0.025]} p={[0, y - 0.16, -d / 2 - o - 0.01]} m={white} cast={false} />
        <Box s={[0.025, 0.05, d + 0.1]} p={[w / 2 + o + 0.01, y - 0.16, 0]} m={white} cast={false} />
        <Box s={[0.025, 0.05, d + 0.1]} p={[-w / 2 - o - 0.01, y - 0.16, 0]} m={white} cast={false} />
      </group>
    );
  }

  /* small grey stone shikhara shrine */
  function StoneShikhara({ p, s = 1 }) {
    const M = useM();
    const st = M.plain('#8d9486', { roughness: 0.95 });
    return (
      <group position={p} scale={s}>
        <Box s={[0.62, 0.3, 0.62]} p={[0, 0.15, 0]} m={st} />
        <Box s={[0.46, 0.34, 0.46]} p={[0, 0.47, 0]} m={st} />
        <Box s={[0.14, 0.2, 0.02]} p={[0, 0.47, 0.235]} m={M.plain('#2a2420')} cast={false} />
        <mesh position={[0, 1.02, 0]} rotation={[0, Math.PI / 4, 0]} material={st} castShadow><cylinderGeometry args={[0.07, 0.3, 0.76, 4]} /></mesh>
        <Ball rad={0.1} p={[0, 1.44, 0]} sc={[1, 0.6, 1]} m={st} />
        <mesh position={[0, 1.6, 0]} material={M.gold}><coneGeometry args={[0.03, 0.22, 6]} /></mesh>
      </group>
    );
  }
  function StonePillar({ p, h = 2.0 }) {
    const M = useM();
    const st = M.plain('#8a8478', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[0.4, 0.2, 0.4]} p={[0, 0.1, 0]} m={st} />
        <Box s={[0.24, h, 0.24]} p={[0, 0.2 + h / 2, 0]} m={st} />
        <Box s={[0.38, 0.12, 0.38]} p={[0, 0.2 + h + 0.06, 0]} m={st} />
        <Box s={[0.3, 0.1, 0.3]} p={[0, 0.2 + h + 0.17, 0]} m={st} />
        <Ball rad={0.1} p={[0, 0.2 + h + 0.3, 0]} m={st} />
      </group>
    );
  }
  /* devotees' stall with a few worshippers */
  function Stall({ p }) {
    const M = useM();
    const wood = M.plain('#5a4030', { roughness: 0.9 });
    const cloth = M.plain('#c8641e', { roughness: 0.9 });
    const cols = ['#d23a2a', '#e8902a', '#e8c24a'];
    return (
      <group position={p}>
        <Box s={[0.95, 0.5, 0.5]} p={[0, 0.25, 0]} m={wood} />
        <Box s={[1.05, 0.05, 0.6]} p={[0, 0.52, 0]} m={cloth} />
        {[-0.45, 0.45].map((x) => <Box key={x} s={[0.04, 0.9, 0.04]} p={[x, 0.7, -0.22]} m={wood} cast={false} />)}
        <Box s={[1.1, 0.04, 0.6]} p={[0, 1.15, -0.05]} m={cloth} cast={false} />
        {cols.map((c, i) => (
          <group key={i} position={[-0.9 + i * 0.55, 0, 0.9 - (i % 2) * 0.3]}>
            <Cyl rt={0.07} rb={0.11} h={0.4} p={[0, 0.2, 0]} m={M.plain(c, { roughness: 0.9 })} seg={8} />
            <Ball rad={0.065} p={[0, 0.47, 0]} m={M.plain('#c89a78')} />
          </group>
        ))}
      </group>
    );
  }

  /* deep dark carved frieze band under a roof (box proud of the wall, slatted faces) */
  function Frieze({ w, d, y, h = 0.45 }) {
    const M = useM();
    const t = M.plain('#2a1a10', { roughness: 0.85 });
    const o = 0.075;
    return (
      <group position={[0, y, 0]}>
        <Box s={[w + 2 * o, h, d + 2 * o]} p={[0, 0, 0]} m={t} cast={false} />
        <mesh position={[0, 0, d / 2 + o + 0.004]} material={friezeMat(Math.round(w * 2.2))}><planeGeometry args={[w + 2 * o, h * 0.9]} /></mesh>
        <mesh position={[0, 0, -d / 2 - o - 0.004]} rotation={[0, Math.PI, 0]} material={friezeMat(Math.round(w * 2.2))}><planeGeometry args={[w + 2 * o, h * 0.9]} /></mesh>
        <mesh position={[w / 2 + o + 0.004, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={friezeMat(Math.round(d * 2.2))}><planeGeometry args={[d + 2 * o, h * 0.9]} /></mesh>
        <mesh position={[-w / 2 - o - 0.004, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={friezeMat(Math.round(d * 2.2))}><planeGeometry args={[d + 2 * o, h * 0.9]} /></mesh>
      </group>
    );
  }
  /* continuous lattice band (storey 3) with carved posts, on all four faces */
  function LatBand({ w, d, y, h, frame }) {
    const out = [];
    const face = (key, p, r, len) => {
      const n = Math.max(3, Math.round(len / 0.5));
      out.push(<Win key={key} p={p} r={r} w={len} h={h} frame={frame} />);
      const grp = [];
      for (let k = 0; k <= n; k += 1) grp.push(<Box key={k} s={[0.07, h + 0.1, 0.1]} p={[(k / n - 0.5) * len, 0, 0.1]} m={frame} cast={false} />);
      out.push(<group key={`${key}p`} position={p} rotation={[0, r, 0]}>{grp}</group>);
    };
    face('f', [0, y, d / 2], 0, w * 0.85);
    face('b', [0, y, -d / 2], Math.PI, w * 0.85);
    face('r', [w / 2, y, 0], Math.PI / 2, d * 0.85);
    face('l', [-w / 2, y, 0], -Math.PI / 2, d * 0.85);
    return <group>{out}</group>;
  }

  /* ======================= MAIN ======================= */
  function BaghMain() {
    const M = useM();
    const dark = M.plain('#33231a', { roughness: 0.8 });
    const timber = M.plain('#3a2518', { roughness: 0.8 });
    const carved = M.plain('#4a2f1f', { roughness: 0.8 });
    const near = M.plain('#1c120c', { roughness: 0.85 });
    const cream = M.plain('#e8dcc0', { roughness: 0.9, emissive: '#5a4c34', emissiveIntensity: 0.3 });
    const brickW = M.mat('brick', 4, 2, { color: '#f2b8a0', emissive: '#4a2216', emissiveIntensity: 0.35 });
    const brickP = M.mat('brick', 5, 1, { color: '#d9806a' });
    const upper = M.plain('#241810', { roughness: 0.85 });
    const roof1 = tileMat('r1', '#4e2a1e', [['rgba(38,56,30,0.55)', 30, 16], ['rgba(110,116,100,0.25)', 10, 12], ['rgba(50,30,22,0.32)', 14, 10]], 11);
    const roof2 = tileMat('r2', '#33231a', [['rgba(80,100,78,0.38)', 16, 14], ['rgba(130,138,128,0.30)', 14, 14]], 23);
    const roof3 = tileMat('r3', '#33231a', [['rgba(80,100,78,0.34)', 12, 12], ['rgba(140,146,136,0.28)', 12, 12]], 37);
    const stone = M.plain('#7a766c', { roughness: 0.95 });
    const stoneL = M.plain('#cfc9ba', { roughness: 0.9 });
    const sword = M.plain('#6f747a', { metalness: 0.7, roughness: 0.4 });

    const B = 0.5; // two low steps of 0.25
    const E1 = B + 1.9; const E2 = E1 + 2.0; const E3 = E2 + 1.8;
    const W1 = 8.0; const D1 = 6.0;
    const W2 = 6.0; const D2 = 4.5;
    const W3 = 4.0; const D3 = 3.0;
    const h1 = 1.35; const h2 = 0.95; const h3 = 0.8;
    const topY = E3 + h3;
    // storey walls at ~80% of the roof above-eave width
    const w2 = 4.8; const d2 = 3.6; const w3 = 3.2; const d3 = 2.4;
    const cx = 3.2; const cz = 2.4;
    const colsX = Array.from({ length: 8 }, (_, i) => -cx + (i * 2 * cx) / 7);

    return (
      <group>
        <Frame s={[8.8, 8.4, 6.8]} p={[0, 4.2, 0.5]} />
        {/* two low brick-and-stone steps, only a little larger than the veranda */}
        <Box s={[7.5, 0.22, 5.9]} p={[0, 0.11, 0.1]} m={stone} />
        <Box s={[7.6, 0.05, 6.0]} p={[0, 0.225, 0.1]} m={stone} />
        <Box s={[7.6, 0.04, 6.0]} p={[0, 0.02, 0.1]} m={stone} cast={false} />
        <Box s={[6.9, 0.22, 5.3]} p={[0, 0.36, 0.1]} m={brickP} />
        <Box s={[7.0, 0.05, 5.4]} p={[0, 0.475, 0.1]} m={stone} />
        {/* front stair */}
        <Box s={[2.2, 0.2, 0.45]} p={[0, 0.1, 3.3]} m={stone} />
        <Box s={[2.2, 0.12, 0.35]} p={[0, 0.06, 3.65]} m={stone} />
        {/* sword-and-trident yard: iron tridents and swords planted in a stone bed, right of the stair */}
        <group position={[4.3, 0, 3.2]}>
          <Box s={[1.5, 0.3, 0.7]} p={[0, 0.15, 0]} m={stone} />
          {[-0.55, -0.27, 0, 0.27, 0.55].map((x, i) => (
            <group key={i} position={[x, 0.3, 0]}>
              <Box s={[0.035, 1.3 + (i % 2) * 0.35, 0.035]} p={[0, 0.7, 0]} m={sword} cast={false} />
              {i % 2 === 0 ? (
                <group position={[0, 1.4 + 0.35 * 0, 0]}>
                  <Box s={[0.2, 0.03, 0.03]} p={[0, 0.0, 0]} m={sword} cast={false} />
                  {[-0.1, 0, 0.1].map((dx) => <Box key={dx} s={[0.025, 0.2, 0.025]} p={[dx, 0.1, 0]} m={sword} cast={false} />)}
                </group>
              ) : <Box s={[0.07, 0.025, 0.025]} p={[0, 1.3, 0]} m={sword} cast={false} />}
            </group>
          ))}
        </group>

        {/* ground storey: cream wall, timber ring of columns, big cusped stone door */}
        <Box s={[5.6, 1.9, 3.8]} p={[0, B + 0.95, 0]} m={cream} />
        <Box s={[5.64, 0.1, 3.84]} p={[0, B + 0.05, 0]} m={dark} cast={false} />
        {colsX.map((x) => (
          <group key={x}>
            <Cyl rt={0.08} rb={0.095} h={1.9} p={[x, B + 0.95, cz]} m={dark} seg={10} />
            <Cyl rt={0.08} rb={0.095} h={1.9} p={[x, B + 0.95, -cz]} m={dark} seg={10} />
          </group>
        ))}
        {[-1.2, 0, 1.2].map((z) => (
          <group key={z}>
            <Cyl rt={0.08} rb={0.095} h={1.9} p={[cx, B + 0.95, z]} m={dark} seg={10} />
            <Cyl rt={0.08} rb={0.095} h={1.9} p={[-cx, B + 0.95, z]} m={dark} seg={10} />
          </group>
        ))}
        <Box s={[2 * cx + 0.3, 0.2, 0.2]} p={[0, E1 - 0.13, cz]} m={carved} />
        <Box s={[2 * cx + 0.3, 0.2, 0.2]} p={[0, E1 - 0.13, -cz]} m={carved} />
        <Box s={[0.2, 0.2, 2 * cz + 0.3]} p={[cx, E1 - 0.13, 0]} m={carved} />
        <Box s={[0.2, 0.2, 2 * cz + 0.3]} p={[-cx, E1 - 0.13, 0]} m={carved} />
        <group position={[0, B, 1.9]}>
          <Box s={[1.4, 1.0, 0.04]} p={[0, 0.5, 0.01]} m={near} cast={false} />
          <mesh position={[0, 1.0, 0.015]} material={near}><circleGeometry args={[0.7, 24, 0, Math.PI]} /></mesh>
          <mesh position={[0, 0.65, 0.03]} material={M.plain('#ff9a3c', { emissive: '#ff8a2c', emissiveIntensity: 0.6 })}><planeGeometry args={[0.34, 0.55]} /></mesh>
          {[-0.8, 0.8].map((x) => <Box key={x} s={[0.22, 1.05, 0.2]} p={[x, 0.525, 0.07]} m={stoneL} />)}
          <mesh position={[0, 1.0, 0.07]} material={stoneL} castShadow><torusGeometry args={[0.78, 0.12, 6, 24, Math.PI]} /></mesh>
          {[-0.64, -0.32, 0, 0.32, 0.64].map((x, k) => <Ball key={k} rad={0.06} p={[x, 1.0 + Math.sqrt(Math.max(0, 0.78 ** 2 - x * x)), 0.14]} m={stoneL} />)}
          <Ball rad={0.09} p={[0, 1.82, 0.12]} m={stoneL} />
        </group>
        {[-2.0, 2.0].map((x) => <Win key={x} p={[x, B + 1.0, 1.9]} w={0.8} h={0.75} frame={carved} />)}

        {/* roof 1 with a thick red valance */}
        <Box s={[W1 - 0.1, 0.06, D1 - 0.1]} p={[0, E1 - 0.04, 0]} m={dark} cast={false} />
        <HipRoof w={W1} d={D1} h={h1} y={E1} m={roof1} sag={1.5} lift={0.28} />
        <Valance w={W1} d={D1} y={E1 - 0.2} />
        <Struts ww={6.0} wd={4.4} ew={W1} ed={D1} y={E1 - 0.06} h={0.6} nF={11} nS={7} m={carved} />
        <Struts ww={6.0} wd={4.4} ew={W1 - 1.2} ed={D1 - 1.0} y={E1 - 0.06} h={0.4} nF={6} nS={4} m={timber} />

        {/* storey 2: red brick, three wide lattice windows, dark frieze under roof 2 */}
        <Box s={[w2, 2.0, d2]} p={[0, E1 + 1.0, 0]} m={brickW} />
        <Box s={[w2 + 0.14, 0.14, d2 + 0.14]} p={[0, E1 + 0.07, 0]} m={timber} cast={false} />
        <Frieze w={w2} d={d2} y={E2 - 0.225} />
        <WinRing w={w2} d={d2} y={E1 + 1.15} nF={3} nS={2} ww={0.9} wh={0.8} frame={carved} />

        {/* roof 2 */}
        <Box s={[W2 - 0.1, 0.06, D2 - 0.1]} p={[0, E2 - 0.04, 0]} m={dark} cast={false} />
        <HipRoof w={W2} d={D2} h={h2} y={E2} m={roof2} sag={1.3} lift={0.2} />
        <Struts ww={w2} wd={d2} ew={W2} ed={D2} y={E2 - 0.06} h={0.8} nF={10} nS={6} m={carved} />
        <Struts ww={w2} wd={d2} ew={W2 - 0.9} ed={D2 - 0.7} y={E2 - 0.06} h={0.5} nF={6} nS={4} m={timber} />

        {/* storey 3: near-black carved timber, continuous dense lattice band, deep frieze */}
        <Box s={[w3, 1.8, d3]} p={[0, E2 + 0.9, 0]} m={upper} />
        <Box s={[w3 + 0.12, 0.12, d3 + 0.12]} p={[0, E2 + 0.06, 0]} m={timber} cast={false} />
        <Frieze w={w3} d={d3} y={E3 - 0.225} />
        <LatBand w={w3} d={d3} y={E2 + 0.95} h={0.9} frame={timber} />

        {/* roof 3, ridge pinnacles, gajur */}
        <Box s={[W3 - 0.1, 0.06, D3 - 0.1]} p={[0, E3 - 0.04, 0]} m={dark} cast={false} />
        <HipRoof w={W3} d={D3} h={h3} y={E3} m={roof3} sag={1.3} lift={0.2} />
        <Struts ww={w3} wd={d3} ew={W3} ed={D3} y={E3 - 0.06} h={0.7} nF={8} nS={5} m={carved} />
        <Struts ww={w3} wd={d3} ew={W3 - 0.7} ed={D3 - 0.5} y={E3 - 0.06} h={0.45} nF={6} nS={3} m={timber} />
        {Array.from({ length: 11 }, (_, i) => i).filter((i) => i !== 5).map((i) => (
          <Pinnacle key={i} p={[-1.0 + i * 0.2, topY - 0.04, 0]} m={M.copper} s={0.8} />
        ))}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0]].map(([sx, sz], i) => (
          <Pinnacle key={`p2${i}`} p={[sx * (W2 / 2 - 0.15), E2 + (sz ? 0.15 : 0.02), sz * (D2 / 2 - 0.15)]} m={M.copper} s={0.8} />
        ))}
        <Pinnacle p={[0, E1 + 0.03, D1 / 2 - 0.25]} m={M.copper} s={0.8} />
        <group position={[0, topY - 0.05, 0]}>
          <Box s={[0.42, 0.22, 0.42]} p={[0, 0.11, 0]} m={timber} />
          <mesh position={[0, 0.34, 0]} rotation={[0, Math.PI / 4, 0]} material={M.gold} castShadow><coneGeometry args={[0.38, 0.26, 4]} /></mesh>
          <Cyl rt={0.04} rb={0.07} h={0.18} p={[0, 0.55, 0]} m={M.gold} seg={8} />
          <Ball rad={0.07} p={[0, 0.68, 0]} m={M.gold} />
          <mesh position={[0, 0.88, 0]} material={M.gold}><coneGeometry args={[0.035, 0.34, 8]} /></mesh>
        </group>

        {/* long dark banner cord (pataka) from the gajur down the front */}
        {(() => {
          const ban = M.plain('#5a4a2a', { roughness: 0.9 });
          const seg = (key, a, b) => {
            const dy = b[1] - a[1]; const dz = b[2] - a[2]; const L = Math.hypot(dy, dz);
            return <Box key={key} s={[0.06, L, 0.035]} p={[0, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} r={[Math.atan2(-dz, -dy), 0, 0]} m={ban} cast={false} />;
          };
          return (
            <group>
              {seg('a', [0, topY + 0.1, 0.1], [0, E3 + 0.02, D3 / 2 + 0.02])}
              {seg('b', [0, E3 + 0.02, D3 / 2 + 0.02], [0, E2 + 0.5, D3 / 2 + 0.03])}
              {seg('c', [0, E2 + 0.5, D3 / 2 + 0.03], [0, E2 + 0.02, D2 / 2 + 0.02])}
              {seg('d', [0, E2 + 0.02, D2 / 2 + 0.02], [0, E1 + 0.12, D1 / 2 - 0.25])}
            </group>
          );
        })()}

        {/* a few small swords hung on the brick storey */}
        {[-2.1, -0.78, 0.78, 2.1].map((x, i) => (
          <group key={i} position={[x, E1 + 1.45 + (i % 2) * 0.04, d2 / 2 + 0.04]}>
            <Box s={[0.03, 0.4, 0.012]} p={[0, -0.02, 0]} r={[0, 0, 0.08 * (i % 2 ? 1 : -1)]} m={sword} cast={false} />
            <Box s={[0.08, 0.018, 0.014]} p={[0, 0.18, 0]} m={dark} cast={false} />
          </group>
        ))}
        {[-1.45, 0, 1.45].map((x, i) => (
          <group key={`sh${i}`} position={[x, E1 + 0.55, d2 / 2 + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <Cyl rt={0.2} rb={0.2} h={0.04} m={M.plain(i === 1 ? '#7a2a1c' : '#2a1a10', { roughness: 0.7 })} seg={16} />
            <Cyl rt={0.05} rb={0.05} h={0.07} m={M.copper} seg={8} />
          </group>
        ))}
        {[-0.7, 0.7].map((z, i) => <Box key={i} s={[0.012, 0.38, 0.03]} p={[w2 / 2 + 0.04, E1 + 1.45, z]} m={sword} cast={false} />)}

        {/* stone pillars and small stone shikhara in the courtyard in front */}
        <StonePillar p={[-2.7, 0, 3.9]} h={1.9} />
        <StonePillar p={[2.6, 0, 3.8]} h={1.7} />
        <StoneShikhara p={[-4.2, 0, 3.4]} s={1.0} />
        <Stall p={[3.6, 0, 4.2]} />
      </group>
    );
  }

  /* ======================= ENV ======================= */
  function Hse({ p, r = 0, w = 3, d = 2.4, st = 3, sh = 1.0, tint = '#c98a72', plaster = null, shop = false, roofTint = '#a8725c', red = false, ov = 0.7, rh = 0 }) {
    const M = useM();
    const H = st * sh;
    const walls = plaster ? M.plain(plaster, { roughness: 0.9 }) : M.mat('brick', w / 1.4, st * 0.8, { color: tint });
    const rm = M.mat('roof', 1, 1, { color: roofTint });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={walls} />
        <Box s={[w + 0.08, 0.1, d + 0.08]} p={[0, 0.05, 0]} m={M.stone} cast={false} />
        <Box s={[w + 0.08, 0.07, d + 0.08]} p={[0, H - 0.04, 0]} m={M.dark} cast={false} />
        {Array.from({ length: st }, (_, i) => (
          <mesh key={i} position={[0, i * sh + sh * 0.5, d / 2 + 0.02]} material={stripMat(i === 0 && shop ? 'shop' : (red ? 'red' : 'win'))}>
            <planeGeometry args={[w * 0.95, sh * 0.9]} />
          </mesh>
        ))}
        <HipRoof w={w + ov} d={d + ov} h={0.5 + st * 0.07 + rh} y={H} m={rm} sag={1.15} lift={0.08} rf={0.6} />
      </group>
    );
  }

  function HippedShrine({ p }) {
    const M = useM();
    const dark = M.plain('#33231a');
    return (
      <group position={p} rotation={[0, -0.25, 0]} scale={0.8}>
        <Box s={[3.6, 0.3, 3.6]} p={[0, 0.15, 0]} m={M.mat('brick', 3, 3, { color: '#b9a690' })} />
        <Box s={[3.2, 0.15, 3.2]} p={[0, 0.375, 0]} m={M.stone} />
        <Box s={[1.9, 1.5, 1.9]} p={[0, 1.2, 0]} m={M.plain('#e8dcc0', { roughness: 0.9 })} />
        <Box s={[0.7, 1.0, 0.04]} p={[0, 1.0, 0.96]} m={M.plain('#1c120c')} cast={false} />
        {[[-1.4, -1.4], [-1.4, 1.4], [1.4, -1.4], [1.4, 1.4]].map(([x, z], i) => <Cyl key={i} rt={0.09} rb={0.1} h={1.55} p={[x, 1.2, z]} m={dark} seg={8} />)}
        <Box s={[3.3, 0.1, 3.3]} p={[0, 1.94, 0]} m={dark} />
        <HipRoof w={4.1} d={4.1} h={1.15} y={1.98} m={tileMat('sh', '#a9705a', [['rgba(92,106,56,0.35)', 14, 12]], 5)} sag={1.25} lift={0.2} rf={0.1} />
        <Box s={[4.12, 0.2, 0.03]} p={[0, 1.88, 2.07]} m={M.plain('#b21f1c')} cast={false} />
        <Box s={[0.03, 0.2, 4.12]} p={[-2.07, 1.88, 0]} m={M.plain('#b21f1c')} cast={false} />
        <Box s={[0.03, 0.2, 4.12]} p={[2.07, 1.88, 0]} m={M.plain('#b21f1c')} cast={false} />
        <Cyl rt={0.05} rb={0.09} h={0.3} p={[0, 3.25, 0]} m={M.gold} seg={8} />
        <Ball rad={0.08} p={[0, 3.45, 0]} m={M.gold} />
      </group>
    );
  }

  /* magnolia: visible forked trunk and dense, rounded, dark-green crowns */
  function Magnolia({ p }) {
    const M = useM();
    const bark = M.plain('#4a3a2c', { roughness: 1 });
    const crowns = [
      [0, 6.0, 0, 2.2, 1.9, 2.2, '#2f4a2a'], [-2.0, 5.0, 0.8, 1.8, 1.6, 1.8, '#36562f'], [2.0, 5.3, -0.4, 1.9, 1.7, 1.9, '#2a4426'],
      [0.4, 7.4, -0.6, 1.6, 1.4, 1.6, '#3a5c32'], [-1.0, 4.3, -1.6, 1.6, 1.4, 1.6, '#2d4a29'], [1.2, 4.2, 1.8, 1.5, 1.3, 1.5, '#34532d'],
      [-2.6, 6.4, -0.8, 1.4, 1.3, 1.4, '#2f4d2b'], [2.6, 6.6, 0.8, 1.4, 1.3, 1.4, '#36562f'], [0, 4.6, 0, 2.3, 1.2, 2.3, '#26401f'],
    ];
    return (
      <group position={p}>
        <Cyl rt={0.3} rb={0.55} h={3.2} p={[0, 1.6, 0]} m={bark} seg={8} />
        <Box s={[0.26, 2.4, 0.26]} p={[-0.7, 4.0, 0.2]} r={[0, 0, 0.5]} m={bark} cast={false} />
        <Box s={[0.26, 2.4, 0.26]} p={[0.8, 4.0, -0.2]} r={[0, 0, -0.5]} m={bark} cast={false} />
        {crowns.map(([x, y, z, rx, ry, rz, c], i) => <Ball key={i} rad={1} p={[x, y, z]} sc={[rx, ry, rz]} m={M.plain(c, { roughness: 1 })} />)}
      </group>
    );
  }

  /* graded sky: pale warm haze at the horizon, soft blue overhead */
  function SkyDome() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(74, 32, 20);
      const pos = g.attributes.position; const col = [];
      const lo = new THREE.Color('#f0e2d0'); const hi = new THREE.Color('#9db9d8'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.min(1, Math.max(0, pos.getY(i) / 60));
        c.copy(lo).lerp(hi, Math.pow(t, 0.7)); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  function BaghEnv() {
    const M = useM();
    const dark = M.plain('#33231a');
    const lamp = M.plain('#ffd48a', { emissive: '#ffb14a', emissiveIntensity: 1.2 });
    const paveStone = M.plain('#b6a99a', { roughness: 1 });
    const mistMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#efe4d4', transparent: true, opacity: 0.3, side: THREE.BackSide, depthWrite: false, fog: false }), []);
    const hills = useMemo(() => Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 + 0.3;
      return { x: Math.cos(a) * 64, z: Math.sin(a) * 64, s: 0.8 + ((i * 37) % 7) / 9 };
    }), []);
    const ridge = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: 24 + (i % 3) * 3.5, z: -14 + i * 3.4, s: 0.8 + ((i * 53) % 5) / 6 })), []);
    return (
      <group>
        <SkyDome />
        <mesh position={[0, -3.8, 0]} material={mistMat}><cylinderGeometry args={[46, 46, 7, 48, 1, true]} /></mesh>
        {/* hill-top platform: paved brick top, stone retaining sides dropping into the valley */}
        <Box s={[30, 6, 29]} p={[-2.5, -3.02, -0.5]} m={M.mat('rock', 6, 2, { color: '#8a8174' })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.5, -0.012, -0.5]} receiveShadow material={M.mat('granite', 10, 10, { color: '#d8d0c2' })}><planeGeometry args={[30, 29]} /></mesh>
        {/* valley floor far below, terraced fields */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.1, 0]} receiveShadow material={M.mat('grass', 26, 26, { color: '#8e9a70' })}><circleGeometry args={[72, 48]} /></mesh>
        {[[22, -4.5, -6, 9, 5], [24, -4.2, 6, 10, 5], [30, -3.8, 0, 8, 9]].map(([x, y, z, w, d], i) => (
          <Box key={i} s={[w, 0.3, d]} p={[x, y - 1, z]} m={M.mat('grass', 3, 3, { color: i % 2 ? '#a3a874' : '#8a9a62' })} />
        ))}
        {/* hazy blue-grey ridges, low and flat */}
        {hills.map((h, i) => <Ball key={i} rad={16} sc={[1.6 * h.s, 0.34 * h.s, 1]} p={[h.x, -6.4, h.z]} m={M.plain(i % 3 ? '#8f9db0' : '#9ba7b8', { roughness: 1 })} />)}
        {/* houses along the eastern valley slope */}
        {ridge.map((q, i) => (
          <group key={i} position={[q.x + 8, -4.6 - (i % 3) * 0.5, q.z]}>
            <Box s={[1.6 * q.s, 1.3 * q.s, 1.4 * q.s]} p={[0, 0.65, 0]} m={M.plain(['#b88a78', '#c8a890', '#a8705c'][i % 3], { roughness: 1 })} />
            <Box s={[1.9 * q.s, 0.3, 1.7 * q.s]} p={[0, 1.4 * q.s, 0]} m={M.plain('#8a6a5a', { roughness: 1 })} />
          </group>
        ))}

        {/* west: four-storey houses of varied height, overhang and finish; the left one red-painted timber */}
        <Hse p={[-13, 0, 3.0]} r={Math.PI / 2} w={3.8} d={2.6} st={4} sh={1.1} plaster="#cdbf9f" roofTint="#8e5a48" ov={1.0} rh={0.15} />
        <Hse p={[-13, 0, -1.2]} r={Math.PI / 2} w={3.8} d={2.6} st={3} sh={1.05} tint="#b87a64" ov={0.5} />
        <Hse p={[-13.4, 0, -5.4]} r={Math.PI / 2} w={3.8} d={2.8} st={4} sh={1.0} plaster="#e0d2b4" ov={0.9} rh={0.1} />
        <Hse p={[-13, 0, -9.4]} r={Math.PI / 2} w={3.8} d={2.6} st={4} sh={1.08} tint="#a8705c" ov={0.65} />
        {/* north: orange plastered house behind, old brick and whitewashed neighbours */}
        <Hse p={[-8.5, 0, -13]} w={3.6} d={2.6} st={4} sh={1.05} tint="#a8705c" ov={0.9} />
        <Hse p={[-4.6, 0, -13.4]} w={3.6} d={2.8} st={3} sh={1.0} plaster="#e0d2b4" ov={0.5} />
        <Hse p={[-0.6, 0, -13.6]} w={4.2} d={2.8} st={4} sh={1.1} plaster="#e6d9bc" roofTint="#9a604c" ov={1.1} rh={0.12} />
        <Hse p={[3.8, 0, -13]} w={3.6} d={2.6} st={4} sh={0.98} tint="#b4786a" ov={0.6} />
        <Hse p={[8.0, 0, -13.2]} w={3.6} d={2.6} st={3} sh={1.05} plaster="#d8c8a8" ov={0.8} />
        {/* east: the platform opens to the valley; a small hipped shrine and a low parapet with railing */}
        <HippedShrine p={[9.4, 0, 1.6]} />
        <Box s={[0.5, 0.9, 24]} p={[12.0, 0.45, 0.5]} m={paveStone} />
        <Box s={[0.7, 0.1, 24.1]} p={[12.0, 0.95, 0.5]} m={M.stone} cast={false} />
        {Array.from({ length: 13 }, (_, i) => <Box key={i} s={[0.1, 0.5, 0.1]} p={[12.0, 1.25, -11 + i * 2]} m={M.plain('#6a6a68', { metalness: 0.5, roughness: 0.6 })} cast={false} />)}
        <Box s={[0.06, 0.06, 24]} p={[12.0, 1.5, 0.5]} m={M.plain('#6a6a68', { metalness: 0.5, roughness: 0.6 })} cast={false} />
        {/* front (south): plain paved edge */}
        <Box s={[30, 0.18, 0.5]} p={[-2.5, 0.09, 13.7]} m={paveStone} />
        {/* magnolia behind to the right, close to the temple */}
        <Magnolia p={[8.0, 0, -5.4]} />
        {/* diyas on the front steps and lamps (lit at dusk) */}
        {[-1.0, -0.5, 0, 0.5, 1.0].map((x, k) => <Diyo key={k} p={[x, 0.2, 4.15]} light={k === 1 || k === 3} />)}
        <mesh position={[0, 2.8, 1.9]} material={lamp}><sphereGeometry args={[0.07, 8, 8]} /></mesh>
        <pointLight position={[0, 2.6, 1.9]} intensity={0.8} distance={4} color="#ffb35a" />
      </group>
    );
  }

  return { 'bagh-bhairab-kirtipur': { Main: BaghMain, Env: BaghEnv } };
}
