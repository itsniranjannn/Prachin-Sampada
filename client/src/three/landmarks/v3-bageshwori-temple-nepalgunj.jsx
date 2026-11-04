// Bageshwori Temple, Nepalgunj (Banke, Lumbini Province). A MODERN three-roof pagoda: pale silvery sheet roofs edged with red
// bands, short whitewashed wall bands between them, a small cupola with gilded finial and a red flag, over an open orange
// pillared hall hung with bells. It stands in a wide stone-paved plaza in flat central Nepalgunj; beside it lies the big green
// Bageshwori pond with the small red Mahadev pavilion on an island, reached by a straight causeway (mosaic broken-tile entrance
// walls, white parapet, yellow rails, orange posts). Palms ring the pond, low town buildings stand behind, big shade trees frame
// the temple, a pink pavilion with a two-tier red roof sits on a lawn among tall cypress-like trees. Flat Terai, no hill, no river.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Lion, Lingam, Diyo, THREE, useMemo } = K;
  const PI = Math.PI;

  /* ---------- palette ---------- */
  const RED = '#c4161c'; const ORG = '#e5701f'; const CREAM = '#efe9d6'; const PALE = '#dcdad0';
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 17.3) * 43758.5453; return s - Math.floor(s); };

  /* ---------- canvas textures (paving, broken-tile mosaic) ---------- */
  const cache = {};
  const canvasMat = (key, size, draw, rx, ry, opts = {}) => {
    if (!cache[key]) {
      const c = document.createElement('canvas'); c.width = size; c.height = size;
      draw(c.getContext('2d'), size);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      t.repeat.set(rx, ry);
      cache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, ...opts });
    }
    return cache[key];
  };
  const pavingMat = (rx, ry) => canvasMat(`pave${rx}x${ry}`, 256, (g, S) => {
    g.fillStyle = '#d3ccbb'; g.fillRect(0, 0, S, S);
    // 4x4 slabs; a darker square pattern on alternate 2x2 blocks
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
      const dark = ((i >> 1) + (j >> 1)) % 2 === 0;
      g.fillStyle = dark ? '#c6bfae' : '#d9d3c3';
      g.fillRect(i * S / 4 + 2, j * S / 4 + 2, S / 4 - 4, S / 4 - 4);
    }
    g.strokeStyle = '#8f897b'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i += 1) { g.beginPath(); g.moveTo(i * S / 4, 0); g.lineTo(i * S / 4, S); g.stroke(); g.beginPath(); g.moveTo(0, i * S / 4); g.lineTo(S, i * S / 4); g.stroke(); }
  }, rx, ry);
  const mosaicMat = () => canvasMat('mosaic', 256, (g, S) => {
    g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, S, S);
    const cols = ['#4f8fc4', '#2f9a78', '#f2f0e8', '#e8c22a', '#b5c9d2', '#d98a3a', '#2c6aa0', '#79b86a', '#f6f3ea', '#c96a52'];
    for (let n = 0; n < 150; n += 1) {
      const cx = rnd(n * 3 + 1) * S; const cy = rnd(n * 3 + 2) * S; const r = 12 + rnd(n * 3 + 3) * 20; const k = 3 + Math.floor(rnd(n + 400) * 3);
      g.beginPath();
      for (let v = 0; v < k; v += 1) { const a = (v / k) * 2 * PI + rnd(n * 7 + v) * 0.9; const rr = r * (0.6 + rnd(n * 11 + v) * 0.6); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.closePath(); g.fillStyle = cols[Math.floor(rnd(n + 900) * cols.length)]; g.fill(); g.strokeStyle = '#efece2'; g.lineWidth = 1.5; g.stroke();
    }
  }, 1, 1);

  /* ---------- merged palm crowns (one mesh for every palm) ---------- */
  function crownGeometry(palms) {
    const pos = []; const idx = []; const N = 6;
    palms.forEach(([px, py, pz, s, sd]) => {
      const nf = 8;
      for (let k = 0; k < nf; k += 1) {
        const a = (k / nf) * 2 * PI + rnd(sd + k) * 0.5; const len = (1.5 + rnd(sd * 3 + k) * 0.5) * s; const base = pos.length / 3;
        const droop = 0.7 + rnd(sd * 5 + k) * 0.5;
        for (let i = 0; i <= N; i += 1) {
          const t = i / N; const r = len * t; const y = (0.5 * t - droop * t * t) * len * 0.8;
          const w = 0.2 * s * Math.sin(PI * Math.min(1, t * 0.92 + 0.06));
          [-1, 1].forEach((sg) => {
            const lx = r; const lz = sg * w;
            pos.push(px + lx * Math.cos(a) - lz * Math.sin(a), py + y + (sg === 0 ? 0 : -0.05 * Math.abs(lz)), pz + lx * Math.sin(a) + lz * Math.cos(a));
          });
        }
        for (let i = 0; i < N; i += 1) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function Palms({ list }) {
    const M = useM();
    const geo = useMemo(() => crownGeometry(list.map(([x, z, h, sd]) => [x, h, z, 1 + (h - 3.4) * 0.15, sd])), [list]);
    return (
      <group>
        {list.map(([x, z, h], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.07} rb={0.14} h={h} p={[0, h / 2, 0]} m={M.plain('#8a7358')} seg={8} />
            <Ball rad={0.14} p={[0, h - 0.05, 0]} m={M.plain('#6a5538')} />
          </group>
        ))}
        <mesh geometry={geo} material={M.plain('#3f7d2c', { roughness: 0.8, side: THREE.DoubleSide })} castShadow />
      </group>
    );
  }

  /* ---------- simple trees ---------- */
  function ShadeTree({ p, s = 1 }) {
    const M = useM();
    const g1 = M.plain('#3f6d2e', { roughness: 1 }); const g2 = M.plain('#587f36', { roughness: 1 }); const g3 = M.plain('#2f5a2a', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.22} rb={0.36} h={2.6} p={[0, 1.3, 0]} m={M.plain('#5b4331')} seg={9} />
        <Cyl rt={0.08} rb={0.14} h={1.6} p={[0.5, 2.8, 0.1]} r={[0, 0, -0.7]} m={M.plain('#5b4331')} seg={6} />
        <Ball rad={1.9} sc={[1, 0.8, 1]} p={[0, 4, 0]} m={g1} />
        <Ball rad={1.5} p={[1.5, 3.5, 0.5]} m={g2} />
        <Ball rad={1.5} p={[-1.5, 3.6, -0.3]} m={g3} />
        <Ball rad={1.3} p={[0.2, 5, -0.2]} m={g2} />
        <Ball rad={1.2} p={[-0.2, 3.5, 1.5]} m={g1} />
      </group>
    );
  }
  function Cypress({ p, h = 5 }) {
    const M = useM();
    return <Ball rad={0.5} sc={[1, h / 1.0, 1]} p={[p[0], h * 0.5 + 0.1, p[2]]} m={M.plain('#2b4d2a', { roughness: 1 })} />;
  }

  /* ---------- the main temple ---------- */
  function Tier({ w, y, h, fz = 0.14 }) {
    const M = useM();
    const roof = M.plain(PALE, { roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide });
    const red = M.plain(RED, { roughness: 0.6 });
    return (
      <group>
        <Roof w={w} d={w} h={h} y={y} m={roof} sag={1.1} lift={0.06} fascia={false} />
        <Box s={[w + 0.1, 0.05, w + 0.1]} p={[0, y - 0.02, 0]} m={M.plain('#8c2a22')} cast={false} />
        {[1, -1].map((k) => (
          <group key={k}>
            <Box s={[w + 0.16, fz, 0.09]} p={[0, y + fz / 2 - 0.02, k * (w / 2 + 0.04)]} m={red} cast={false} />
            <Box s={[0.09, fz, w + 0.16]} p={[k * (w / 2 + 0.04), y + fz / 2 - 0.02, 0]} m={red} cast={false} />
            <Box s={[w + 0.2, 0.03, 0.12]} p={[0, y + fz + 0.01, k * (w / 2 + 0.04)]} m={M.plain('#f2ead8')} cast={false} />
            <Box s={[0.12, 0.03, w + 0.2]} p={[k * (w / 2 + 0.04), y + fz + 0.01, 0]} m={M.plain('#f2ead8')} cast={false} />
          </group>
        ))}
      </group>
    );
  }
  function Hall() {
    const M = useM();
    const org = M.plain('#e8501c', { roughness: 0.7 }); const red = M.plain(RED, { roughness: 0.7 });
    const gold = M.gold; const dark = M.plain('#2a1812');
    const bellM = M.plain('#e0a82a', { roughness: 0.4, metalness: 0.6, emissive: '#ffb347', emissiveIntensity: 0.55 });
    const glow = M.plain('#ffd48a', { roughness: 0.8, emissive: '#ffa43a', emissiveIntensity: 0.6 });
    const front = [-3, -2, -1, 0, 1, 2, 3];
    const sideZ = [1.8, 0.4, -1.0, -2.4];
    const CH = 1.85; const cy = 0.3 + CH / 2; const top = 0.3 + CH;
    return (
      <group>
        <Box s={[7.3, 0.3, 7.3]} p={[0, 0.15, 0]} m={M.plain('#cfc8b6')} />
        <Box s={[2.6, 0.1, 1.2]} p={[0, 0.05, 4.2]} m={M.plain('#d6cfbd')} />
        <Box s={[2.6, 0.2, 0.7]} p={[0, 0.1, 3.95]} m={M.plain('#d6cfbd')} />
        {/* inner sanctum, orange with a lit doorway */}
        <Box s={[4.6, 2.2, 4.4]} p={[0, 1.4, -0.8]} m={M.plain('#ee6a24', { roughness: 0.8 })} />
        <Box s={[1.5, 1.45, 0.05]} p={[0, 1.02, 1.42]} m={glow} />
        <Box s={[1.5, 0.14, 0.12]} p={[0, 1.82, 1.43]} m={gold} />
        {[-0.8, 0.8].map((x) => <Box key={x} s={[0.14, 1.5, 0.1]} p={[x, 1.02, 1.43]} m={red} />)}
        <Box s={[1.0, 0.7, 0.04]} p={[-1.6, 1.4, 1.42]} m={M.plain('#f0d28a')} />
        <Box s={[1.0, 0.7, 0.04]} p={[1.6, 1.4, 1.42]} m={M.plain('#f0d28a')} />
        <Box s={[6.2, 2.2, 0.2]} p={[0, 1.4, -3.0]} m={M.plain('#ee6a24', { roughness: 0.8 })} />
        {/* front colonnade of seven orange columns */}
        {front.map((x) => (
          <group key={x}>
            <Box s={[0.28, 0.16, 0.28]} p={[x, 0.38, 3.0]} m={red} />
            <Box s={[0.24, CH, 0.24]} p={[x, cy, 3.0]} m={org} />
            <Box s={[0.3, 0.12, 0.3]} p={[x, top + 0.06, 3.0]} m={red} />
          </group>
        ))}
        {[-3, 3].map((x) => sideZ.map((z) => (
          <group key={`${x}${z}`}>
            <Box s={[0.24, 0.16, 0.24]} p={[x, 0.38, z]} m={red} />
            <Box s={[0.24, CH, 0.24]} p={[x, cy, z]} m={org} />
          </group>
        )))}
        {/* red beams and a gold line under the first roof */}
        <Box s={[6.6, 0.3, 0.22]} p={[0, top + 0.22, 3.0]} m={red} />
        <Box s={[6.6, 0.05, 0.24]} p={[0, top + 0.4, 3.0]} m={gold} />
        {[-3, 3].map((x) => <Box key={x} s={[0.2, 0.28, 6.4]} p={[x, top + 0.2, 0]} m={red} />)}
        <Box s={[6.4, 0.28, 0.2]} p={[0, top + 0.2, -3.0]} m={red} />
        <Box s={[6.4, 0.04, 6.4]} p={[0, top + 0.1, 0]} m={M.plain('#9b3a1c')} cast={false} />
        {/* hanging bells */}
        {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x) => (
          <group key={x} position={[x, 0, 3.15]}>
            <Cyl rt={0.01} h={0.3} p={[0, top - 0.1, 0]} m={dark} seg={4} />
            <Cyl rt={0.06} rb={0.14} h={0.22} p={[0, top - 0.34, 0]} m={bellM} seg={10} />
          </group>
        ))}
        {/* signboards between the columns */}
        <Box s={[0.85, 0.32, 0.03]} p={[-2.5, 1.45, 3.05]} m={M.plain('#2a62a8')} />
        <Box s={[0.8, 0.32, 0.03]} p={[0.5, 1.45, 3.05]} m={M.plain('#c4161c')} />
        <Box s={[0.8, 0.32, 0.03]} p={[2.5, 1.45, 3.05]} m={M.plain('#f0b21a')} />
        {[-2.5, -1.5, 1.5, 2.5].map((x, i) => <Box key={x} s={[0.1, 0.4, 0.1]} p={[x, 0.7, 3.08]} m={M.plain(i % 2 ? '#f0a31a' : '#d4207a')} cast={false} />)}
        <pointLight position={[0, 1.4, 2.2]} intensity={2.0} distance={10} color="#ffb04a" />
        <pointLight position={[0, 1.2, -0.2]} intensity={1.2} distance={6} color="#ff9a3a" />
      </group>
    );
  }
  function Upper() {
    const M = useM();
    const cream = M.plain(CREAM, { roughness: 0.9 });
    const roofM = M.plain(PALE, { roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide });
    const red = M.plain(RED);
    return (
      <group>
        <Tier w={7.0} y={2.5} h={0.9} fz={0.16} />
        <Box s={[4.7, 2.0, 4.7]} p={[0, 3.5, 0]} m={cream} />
        <Box s={[4.76, 0.08, 4.76]} p={[0, 4.5, 0]} m={red} />
        {[-1, 0, 1].map((k) => <Box key={k} s={[0.5, 0.55, 0.04]} p={[k * 1.2, 3.95, 2.36]} m={M.plain('#d9d3c2')} cast={false} />)}
        <Tier w={5.2} y={4.5} h={0.8} fz={0.14} />
        <Box s={[3.4, 1.7, 3.4]} p={[0, 5.35, 0]} m={cream} />
        <Box s={[3.46, 0.07, 3.46]} p={[0, 6.2, 0]} m={red} />
        {[-0.7, 0.7].map((k) => <Box key={k} s={[0.45, 0.45, 0.04]} p={[k, 5.75, 1.71]} m={M.plain('#d9d3c2')} cast={false} />)}
        <Tier w={3.8} y={6.2} h={0.65} fz={0.12} />
        <Box s={[0.8, 0.5, 0.8]} p={[0, 7.05, 0]} m={cream} />
        <Roof w={1.3} d={1.3} h={0.4} y={7.28} m={roofM} sag={1.3} lift={0.05} fascia={false} />
        <Box s={[1.35, 0.08, 1.35]} p={[0, 7.26, 0]} m={red} cast={false} />
        <Cyl rt={0.1} rb={0.14} h={0.12} p={[0, 7.72, 0]} m={M.gold} seg={12} />
        <Ball rad={0.13} p={[0, 7.89, 0]} m={M.gold} />
        <mesh position={[0, 8.22, 0]} material={M.gold} castShadow><coneGeometry args={[0.045, 0.5, 10]} /></mesh>
        <Cyl rt={0.02} h={1.2} p={[0.5, 7.6, 0.1]} m={M.plain('#6a4a30')} seg={6} />
        <Box s={[0.5, 0.28, 0.02]} p={[0.78, 8.04, 0.1]} m={M.plain('#d4161c')} cast={false} />
      </group>
    );
  }
  function FrontPlatforms() {
    const M = useM();
    const org = M.plain('#e0561c', { roughness: 0.7 });
    const stalls = ['#d4207a', '#f0a31a', '#2a62a8', '#c4161c'];
    const flame = M.plain('#ffcf5a', { emissive: '#ffa21a', emissiveIntensity: 1.2 });
    return (
      <group>
        {[-1, 1].map((sg, si) => {
          const w = 3.0;
          return (
            <group key={si} position={[sg * 3.0, 0, 5.1]}>
              <Box s={[w, 0.26, 1.0]} p={[0, 0.13, 0]} m={org} />
              <Box s={[w, 0.07, 0.07]} p={[0, 0.74, 0.47]} m={org} />
              <Box s={[w, 0.05, 0.05]} p={[0, 0.5, 0.47]} m={org} />
              <Box s={[w, 0.07, 0.07]} p={[0, 0.74, -0.47]} m={org} />
              <Box s={[0.07, 0.07, 1.0]} p={[-w / 2 + 0.03, 0.74, 0]} m={org} />
              <Box s={[0.07, 0.07, 1.0]} p={[w / 2 - 0.03, 0.74, 0]} m={org} />
              {Array.from({ length: 7 }, (_, i) => <Box key={i} s={[0.07, 0.5, 0.07]} p={[-w / 2 + 0.06 + i * ((w - 0.12) / 6), 0.5, 0.47]} m={org} />)}
              {stalls.map((c, i) => <Box key={i} s={[0.3, 0.2, 0.3]} p={[-0.9 + i * 0.6, 0.36, 0.0]} m={M.plain(c)} cast={false} />)}
              <Cyl rt={0.03} h={0.1} p={[sg * 0.9, 0.31, 0.15]} m={flame} seg={6} />
            </group>
          );
        })}
        <Box s={[0.14, 1.7, 0.14]} p={[-4.6, 0.85, 6.2]} m={org} />
        <Box s={[0.22, 0.12, 0.22]} p={[-4.6, 1.75, 6.2]} m={M.plain(RED)} />
        <Diyo p={[-0.5, 0.2, 4.4]} light />
        <Diyo p={[0.5, 0.2, 4.4]} />
        <pointLight position={[0, 0.9, 5.2]} intensity={2.0} distance={10} color="#ffb870" />
      </group>
    );
  }
  function SeatedLion() {
    const M = useM();
    const st = M.plain('#9d9482', { roughness: 0.9 });
    const mane = M.plain('#877e6c', { roughness: 0.95 });
    const dk = M.plain('#2a2420');
    return (
      <group>
        <Ball rad={0.3} sc={[1, 1, 1.2]} p={[0, 0.34, -0.15]} m={st} />
        <Ball rad={0.24} sc={[1, 1.5, 0.9]} p={[0, 0.58, 0.12]} m={st} />
        {[-1, 1].map((k) => <Cyl key={k} rt={0.06} rb={0.075} h={0.5} p={[k * 0.13, 0.25, 0.3]} m={st} seg={8} />)}
        {[-1, 1].map((k) => <Box key={k} s={[0.1, 0.05, 0.16]} p={[k * 0.13, 0.03, 0.36]} m={st} />)}
        <Ball rad={0.3} sc={[1.1, 1, 0.8]} p={[0, 0.9, 0.05]} m={mane} />
        <Ball rad={0.2} p={[0, 0.88, 0.2]} m={st} />
        <Box s={[0.18, 0.1, 0.14]} p={[0, 0.82, 0.38]} m={st} />
        <Box s={[0.12, 0.03, 0.06]} p={[0, 0.77, 0.45]} m={dk} />
        {[-1, 1].map((k) => <Ball key={k} rad={0.035} p={[k * 0.09, 0.94, 0.38]} m={dk} />)}
        {[-1, 1].map((k) => <Ball key={k} rad={0.07} p={[k * 0.22, 1.12, 0]} m={mane} />)}
        {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => <Ball key={i} rad={0.03} p={[x, 0.66 - Math.abs(x) * 0.4, 0.3]} m={M.gold} />)}
      </group>
    );
  }
  function Statues() {
    const M = useM();
    const black = M.plain('#1c1a1b', { roughness: 0.35, metalness: 0.2 });
    const stone = M.plain('#d6cfbd'); const stone2 = M.plain('#cfc8b6');
    return (
      <group>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.95, 0, 3.9]}>
            <Box s={[1.15, 0.22, 1.25]} p={[0, 0.11, 0]} m={stone2} />
            <Box s={[0.95, 0.4, 1.05]} p={[0, 0.42, 0]} m={stone} />
            <Box s={[1.0, 0.05, 1.1]} p={[0, 0.64, 0]} m={M.plain(RED)} cast={false} />
            <group position={[0, 0.64, 0]} scale={1.5}><SeatedLion /></group>
          </group>
        ))}
        <group position={[4.7, 0, 2.5]}>
          <Box s={[1.8, 0.2, 1.7]} p={[0, 0.1, 0]} m={stone2} />
          <Box s={[1.4, 0.2, 1.3]} p={[0, 0.3, 0]} m={stone} />
          <Box s={[1.0, 0.2, 0.9]} p={[0, 0.5, 0]} m={stone2} />
          <Box s={[1.84, 0.04, 1.74]} p={[0, 0.22, 0]} m={M.plain(RED)} cast={false} />
          <group position={[0, 0.6, 0]} scale={1.05}>
            <Ball rad={0.3} sc={[1.15, 0.95, 1]} p={[0, 0.3, 0]} m={black} />
            <Ball rad={0.23} sc={[1, 1.2, 0.9]} p={[0, 0.68, 0.0]} m={black} />
            <Ball rad={0.18} p={[0, 1.05, 0.05]} m={black} />
            <Cyl rt={0.035} rb={0.07} h={0.4} p={[0, 0.86, 0.2]} r={[0.35, 0, 0]} m={black} seg={8} />
            {[-1, 1].map((s2) => <Box key={s2} s={[0.05, 0.3, 0.24]} p={[s2 * 0.22, 1.05, 0]} r={[0, s2 * 0.3, 0]} m={black} />)}
            <Cyl rt={0.07} rb={0.16} h={0.24} p={[0, 1.3, 0.05]} m={M.gold} seg={10} />
            <Box s={[0.14, 0.12, 0.05]} p={[0, 0.4, 0.3]} m={M.plain('#d4207a')} cast={false} />
          </group>
        </group>
      </group>
    );
  }
  function Plaza() {
    const M = useM();
    return (
      <group>
        <Box s={[22, 0.05, 18]} p={[0, 0.02, 3]} m={pavingMat(5, 4)} cast={false} />
        <Box s={[0.3, 0.85, 7.5]} p={[-5.7, 0.43, 0.2]} m={M.plain('#e8a0a8', { roughness: 0.95 })} />
        <Box s={[0.38, 0.1, 7.6]} p={[-5.7, 0.9, 0.2]} m={M.plain('#c4545e')} cast={false} />
      </group>
    );
  }
  function BageshworiMain() {
    return (
      <group>
        <Plaza />
        <Hall />
        <Upper />
        <FrontPlatforms />
        <Statues />
        <Frame s={[11, 8.6, 8]} p={[0, 4.2, 1.5]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  const PX = -34; const PZ = 4; const PW = 40; const PD = 28; // pond centre and size

  function Pond() {
    const M = useM();
    const white = M.plain('#f4f2ea', { roughness: 0.9 }); const rim = M.plain('#2f4a24', { roughness: 0.6 });
    const hx = PW / 2; const hz = PD / 2;
    return (
      <group position={[PX, 0, PZ]}>
        {/* concrete rim and walkway */}
        <Box s={[PW + 3.4, 0.05, PD + 3.4]} p={[0, 0.01, 0]} m={pavingMat(8, 6)} cast={false} />
        <Box s={[PW + 1.4, 0.3, 0.7]} p={[0, 0.15, -hz - 0.35]} m={white} />
        <Box s={[PW + 1.4, 0.3, 0.7]} p={[0, 0.15, hz + 0.35]} m={white} />
        <Box s={[0.7, 0.3, PD]} p={[-hx - 0.35, 0.15, 0]} m={white} />
        <Box s={[0.7, 0.3, PD]} p={[hx + 0.35, 0.15, 0]} m={white} />
        <Box s={[PW + 0.2, 0.2, 0.12]} p={[0, 0.2, -hz + 0.05]} m={rim} />
        <Box s={[PW + 0.2, 0.2, 0.12]} p={[0, 0.2, hz - 0.05]} m={rim} />
        <Box s={[0.12, 0.2, PD]} p={[-hx + 0.05, 0.2, 0]} m={rim} />
        <Box s={[0.12, 0.2, PD]} p={[hx - 0.05, 0.2, 0]} m={rim} />
        {/* opaque green water */}
        <mesh position={[0, 0.16, 0]} rotation={[-PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[PW, PD]} />
          <meshStandardMaterial color="#3f6b2c" roughness={0.15} metalness={0.3} />
        </mesh>
        {[[-12, -6], [8, 6], [-4, 9], [13, -8], [-14, 8], [3, -10]].map(([x, z], i) => <Cyl key={i} rt={0.5 + (i % 2) * 0.2} h={0.02} p={[x, 0.17, z]} m={M.plain('#5c8a3a')} seg={10} />)}
      </group>
    );
  }
  function Island() {
    const M = useM();
    const org = M.plain(ORG, { roughness: 0.7 });
    const red = M.plain('#c8301f', { roughness: 0.65 });
    return (
      <group position={[PX, 0, PZ]} scale={[1.4, 1.8, 1.4]}>
        <Box s={[3.9, 0.3, 3.9]} p={[0, 0.15, 0]} m={M.plain('#c9c5b8')} />
        <Box s={[3.4, 0.08, 3.4]} p={[0, 0.34, 0]} m={pavingMat(2, 2)} cast={false} />
        <Box s={[2.5, 0.2, 2.5]} p={[0, 0.48, 0]} m={M.plain('#d8cdb0')} />
        {/* the open Mahadev pavilion */}
        {[[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]].map(([x, z], i) => <Box key={i} s={[0.14, 1.0, 0.14]} p={[x, 1.08, z]} m={org} />)}
        <Box s={[2.2, 0.14, 2.2]} p={[0, 1.62, 0]} m={M.plain('#a02a1c')} />
        <Box s={[0.9, 0.7, 0.9]} p={[0, 0.93, 0]} m={M.plain('#3a2a24')} />
        <group position={[0, 0.58, 0]}><Lingam p={[0, 0.0, 0]} /></group>
        <Roof w={2.9} d={2.9} h={0.6} y={1.69} m={red} sag={1.3} lift={0.08} fascia={false} />
        <Box s={[3.0, 0.1, 3.0]} p={[0, 1.68, 0]} m={org} cast={false} />
        <Box s={[1.1, 0.4, 1.1]} p={[0, 2.12, 0]} m={M.plain('#d9602a')} />
        <Roof w={1.7} d={1.7} h={0.5} y={2.3} m={red} sag={1.3} lift={0.08} fascia={false} />
        <Cyl rt={0.06} rb={0.1} h={0.1} p={[0, 2.82, 0]} m={M.gold} seg={10} />
        <mesh position={[0, 3.05, 0]} material={M.gold}><coneGeometry args={[0.05, 0.4, 8]} /></mesh>
        {/* flag pole with a string of prayer flags */}
        <Cyl rt={0.03} h={3.4} p={[1.5, 1.9, 1.5]} m={M.plain('#7a6a5a')} seg={6} />
        {['#2a62a8', '#f2f0e8', '#c4161c', '#f0b21a'].map((c, i) => <Box key={c} s={[0.16, 0.26, 0.02]} p={[1.5, 3.4 - i * 0.28, 1.58]} m={M.plain(c)} cast={false} />)}
        <Diyo p={[0, 0.6, 1.5]} light />
        <pointLight position={[0, 1.5, 0.8]} intensity={2.0} distance={10} color="#ffa850" />
      </group>
    );
  }
  function Causeway() {
    const M = useM();
    const org = M.plain(ORG, { roughness: 0.7 });
    const white = M.plain('#f1eee6', { roughness: 0.9 });
    const yellow = M.plain('#f0c21a', { roughness: 0.7 });
    const mosaic = mosaicMat();
    const x0 = PX + PW / 2 + 4; // bank end (east), long causeway
    const x1 = PX + 2.6; // island edge
    const len = x0 - x1; const cx = (x0 + x1) / 2;
    const posts = []; for (let x = x1 + 0.4; x <= x0 - 0.2; x += 1.15) posts.push(x);
    return (
      <group position={[0, 0, PZ]}>
        <Box s={[len, 0.3, 1.25]} p={[cx, 0.15, 0]} m={M.plain('#cbbfa4', { roughness: 0.95 })} />
        <Box s={[len, 0.04, 0.2]} p={[cx, 0.32, 0]} m={M.plain('#b6aa90')} cast={false} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[len - 1.6, 0.34, 0.12]} p={[cx - 0.8, 0.47, k * 0.62]} m={white} />
            <Box s={[len - 1.6, 0.32, 0.1]} p={[cx - 0.8, 0.8, k * 0.62]} m={yellow} />
            {posts.map((x, i) => (
              <group key={i} position={[x, 0, k * 0.62]}>
                <Box s={[0.16, 0.95, 0.16]} p={[0, 0.78, 0]} m={org} />
                <Ball rad={0.1} p={[0, 1.3, 0]} m={org} />
              </group>
            ))}
            {/* mosaic wing walls at the entrance */}
            <Box s={[1.5, 1.05, 0.22]} p={[x0 - 0.45, 0.65, k * 0.95]} r={[0, k * 0.28, 0]} m={mosaic} />
            <Box s={[0.9, 0.7, 0.2]} p={[x0 - 1.7, 0.5, k * 0.78]} r={[0, k * 0.12, 0]} m={mosaic} />
          </group>
        ))}
        {/* entrance gate frame with its bell */}
        {[-0.82, 0.82].map((z) => <Box key={z} s={[0.2, 1.9, 0.2]} p={[x0 + 0.5, 1.0, z]} m={org} />)}
        <Box s={[0.28, 0.22, 2.0]} p={[x0 + 0.5, 2.0, 0]} m={M.plain(RED)} />
        <Cyl rt={0.07} rb={0.14} h={0.2} p={[x0 + 0.5, 1.8, 0]} m={M.gold} seg={10} />
        {/* lamps */}
        {[x1 + 1, cx, x0 - 1].map((x, i) => (
          <group key={i} position={[x, 0, 0.7]}>
            <Cyl rt={0.03} h={1.5} p={[0, 0.9, 0]} m={M.plain('#3a3a3a')} seg={6} />
            <mesh position={[0, 1.7, 0]}><sphereGeometry args={[0.1, 10, 8]} /><meshBasicMaterial color="#ffe3a0" toneMapped={false} /></mesh>
          </group>
        ))}
        {[x1 + 3, cx, x0 - 3].map((x, i) => <pointLight key={i} position={[x, 1.6, 0]} intensity={2.0} distance={10} color="#ffc66e" />)}
      </group>
    );
  }
  function Pavilion({ p }) {
    const M = useM();
    const pink = M.plain('#e0777f', { roughness: 0.8 });
    const red = M.plain('#c3262d', { roughness: 0.6 });
    return (
      <group position={p}>
        <Box s={[4.6, 0.18, 4.6]} p={[0, 0.09, 0]} m={M.plain('#8fc060', { roughness: 1 })} cast={false} />
        <Box s={[3.0, 0.4, 3.0]} p={[0, 0.38, 0]} m={M.plain('#a8a498', { roughness: 0.95 })} />
        {[-1.2, 0, 1.2].map((x) => [-1.2, 1.2].map((z) => <Box key={`${x}${z}`} s={[0.2, 1.3, 0.2]} p={[x, 1.23, z]} m={pink} />))}
        {[-1.2, 1.2].map((x) => <Box key={x} s={[0.2, 1.3, 0.2]} p={[x, 1.23, 0]} m={pink} />)}
        <Box s={[2.2, 1.1, 2.2]} p={[0, 1.15, 0]} m={M.plain('#3a2a24')} />
        <Box s={[3.0, 0.2, 3.0]} p={[0, 1.95, 0]} m={pink} />
        <Roof w={3.8} d={3.8} h={0.7} y={2.05} m={red} sag={1.25} lift={0.1} fascia={false} />
        <Box s={[1.4, 0.4, 1.4]} p={[0, 2.5, 0]} m={pink} />
        <Roof w={2.0} d={2.0} h={0.6} y={2.68} m={red} sag={1.25} lift={0.1} fascia={false} />
        <Cyl rt={0.03} rb={0.06} h={0.5} p={[0, 3.2, 0]} m={M.plain('#4a3a30')} seg={6} />
      </group>
    );
  }
  function Bldg({ p, r = 0, w, d = 3.2, floors = 3, color, seed, sign }) {
    const M = useM();
    const fh = 1.1; const h = floors * fh;
    const glass = M.plain('#35505e', { roughness: 0.3 });
    const lit = rnd(seed) > 0.5; const setback = floors >= 3 && rnd(seed + 5) > 0.5;
    return (
      <group position={p} rotation={[0, r, 0]}>
        {setback ? (
          <group>
            <Box s={[w, h - fh, d]} p={[0, (h - fh) / 2, 0]} m={M.plain(color, { roughness: 0.95 })} />
            <Box s={[w + 0.1, 0.1, d + 0.1]} p={[0, h - fh + 0.05, 0]} m={M.plain('#9d9a90')} cast={false} />
            <Box s={[w * 0.75, fh, d * 0.6]} p={[0, h - fh / 2, -d * 0.18]} m={M.plain(color, { roughness: 0.95 })} />
          </group>
        ) : <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.plain(color, { roughness: 0.95 })} />}
        <Box s={[w + 0.1, 0.12, d + 0.1]} p={[0, h + 0.06, 0]} m={M.plain('#9d9a90')} cast={false} />
        <Box s={[w * 0.86, 0.5, 0.06]} p={[0, 0.4, d / 2 + 0.02]} m={M.plain(rnd(seed + 3) > 0.5 ? '#9a5a3a' : '#4a5a6a')} cast={false} />
        {sign && <Box s={[w * 0.7, 0.34, 0.08]} p={[0, fh + 0.05, d / 2 + 0.05]} m={M.plain(sign)} cast={false} />}
        {Array.from({ length: floors - 1 }, (_, i) => <Box key={i} s={[w * 0.8, 0.4, 0.06]} p={[0, fh * (i + 1) + 0.55, d / 2 + 0.02]} m={lit ? M.plain('#ffd98a', { emissive: '#ffb347', emissiveIntensity: 0.35 }) : glass} cast={false} />)}
        {rnd(seed + 7) > 0.55 && <Cyl rt={0.35} h={0.7} p={[w * 0.25, h + 0.5, 0]} m={M.plain('#222a2e')} seg={10} />}
      </group>
    );
  }
  const PALETTE = ['#d9d2c0', '#cfd3c6', '#dcc9b8', '#c6ced6', '#e3dccb', '#cdbcae', '#e0d6c0', '#c5d0c8'];
  const SIGNS = ['#2a62a8', '#c4161c', '#e8a21a', '#2f8a5a', '#f2f0e8'];
  function row(x0, z0, dx, dz, n, r, seed0, brickAt = -1) {
    const out = []; let x = x0; let z = z0;
    for (let i = 0; i < n; i += 1) {
      const w = 2.8 + rnd(seed0 + i) * 2.6; const fl = 2 + Math.floor(rnd(seed0 + i * 5 + 1) * 2.99);
      const col = (i === brickAt || rnd(seed0 + i * 17) > 0.84) ? (rnd(seed0 + i) > 0.5 ? '#a24f3c' : '#b4593f') : PALETTE[Math.floor(rnd(seed0 + i * 3) * PALETTE.length)];
      out.push({ p: [x + dx * w / 2, 0, z + dz * w / 2], r, w, floors: fl, color: col, seed: seed0 + i * 13, sign: SIGNS[Math.floor(rnd(seed0 + i * 9) * SIGNS.length)] });
      x += dx * (w + 0.15); z += dz * (w + 0.15);
    }
    return out;
  }
  const hazeTex = () => {
    if (!cache.haze) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#555'); gr.addColorStop(1, '#fff');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
      cache.haze = new THREE.CanvasTexture(c);
    }
    return cache.haze;
  };
  const skyTex = () => {
    if (!cache.skyg) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#bbb'); gr.addColorStop(1, '#000');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
      cache.skyg = new THREE.CanvasTexture(c);
    }
    return cache.skyg;
  };
  function BageshworiEnv() {
    const M = useM();
    const bl = useMemo(() => [
      ...row(-52, -17.5, 1, 0, 16, 0, 11, 6),
      ...row(30, -14, 0, 1, 3, -PI / 2, 71),
      ...row(-62, 22, 0, -1, 9, PI / 2, 131, 3),
    ], []);
    const palms = useMemo(() => {
      const l = []; let s0 = 0; const H = () => 6 + rnd(s0 + 2) * 2;
      for (let x = PX - PW / 2 + 1; x <= PX + PW / 2; x += 5.2) { l.push([x + rnd(s0) * 0.6, PZ - PD / 2 - 2 - rnd(s0 + 1) * 0.6, H(), s0]); s0 += 3; }
      for (let x = PX - PW / 2 + 2; x <= PX + PW / 2 - 12; x += 5.6) { l.push([x + rnd(s0) * 0.6, PZ + PD / 2 + 2 + rnd(s0 + 1) * 0.6, H(), s0]); s0 += 3; }
      for (let z = PZ - PD / 2 + 3; z <= PZ + PD / 2 - 2; z += 5.5) { l.push([PX - PW / 2 - 2 - rnd(s0) * 0.5, z, H(), s0]); s0 += 3; }
      for (let z = PZ - PD / 2 + 3; z <= PZ + PD / 2 - 2; z += 5.5) { if (z < PZ - 3) { l.push([PX + PW / 2 + 2 + rnd(s0) * 0.5, z, H(), s0]); s0 += 3; } }
      return l;
    }, []);
    return (
      <group>
        <mesh position={[0, 14, 0]}><cylinderGeometry args={[86, 86, 40, 40, 1, true]} /><meshLambertMaterial color="#efe8d6" emissive="#cfc8b4" emissiveIntensity={0.5} alphaMap={hazeTex()} transparent side={THREE.BackSide} depthWrite={false} /></mesh>
        <mesh position={[0, 40, 0]}><cylinderGeometry args={[87, 87, 70, 40, 1, true]} /><meshLambertMaterial color="#bcd2e2" emissive="#a9c0d2" emissiveIntensity={0.5} alphaMap={skyTex()} transparent side={THREE.BackSide} depthWrite={false} /></mesh>
        {/* flat Terai ground, roads and the town */}
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><circleGeometry args={[90, 48]} /><meshStandardMaterial color="#b4b48a" roughness={1} /></mesh>
        <Box s={[170, 0.03, 2.6]} p={[0, 0, -12.5]} m={M.plain('#6c6a66', { roughness: 1 })} cast={false} />
        <Box s={[2.6, 0.03, 70]} p={[18.2, 0, 0]} m={M.plain('#6c6a66', { roughness: 1 })} cast={false} />
        {bl.map((b, i) => <Bldg key={i} {...b} />)}

        {/* the pond, island shrine and causeway */}
        <Pond />
        <Island />
        <Causeway />
        <Palms list={palms} />

        {/* shade trees framing the main temple */}
        <ShadeTree p={[-7.2, 0, -2.6]} s={1.15} />
        <ShadeTree p={[7.4, 0, -3.4]} s={1.25} />
        <ShadeTree p={[-9.5, 0, -6.5]} s={1.0} />
        <ShadeTree p={[10.5, 0, -7.5]} s={0.9} />

        {/* pink pavilion on its lawn with cypress-like trees */}
        <Pavilion p={[15, 0, -3]} />
        {[-2.5, -1, 0.5, 2, 3.5, 5, 6.5].map((z, i) => <Cypress key={i} p={[18.6, 0, -3 + z]} h={4.2 + (i % 3) * 0.7} />)}

        {/* far tree line, hazy */}
        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * 2 * PI; const r = 70 + rnd(i) * 8;
          return <Ball key={i} rad={3 + rnd(i + 5) * 2} sc={[1, 0.8, 1]} p={[Math.cos(a) * r, 2, Math.sin(a) * r]} m={M.plain('#6f8f5a', { roughness: 1 })} />;
        })}
        {/* street lamps around the plaza */}
        {[[-8.3, 11.5], [8.5, 11], [8.5, -4.5]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.04} h={2.4} p={[0, 1.2, 0]} m={M.plain('#3a3a3a')} seg={6} />
            <mesh position={[0, 2.5, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshBasicMaterial color="#ffe3a0" toneMapped={false} /></mesh>
          </group>
        ))}
        <pointLight position={[0, 1.2, 2.2]} intensity={1.2} distance={6} color="#ffb870" />
      </group>
    );
  }

  return { 'bageshwori-temple-nepalgunj': { Main: BageshworiMain, Env: BageshworiEnv } };
}
