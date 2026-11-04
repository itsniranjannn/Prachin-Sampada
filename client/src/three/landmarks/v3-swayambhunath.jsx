// Swayambhunath: white dome, gilded harmika with Buddha eyes, 13-ring spire, two white shikharas, Vajra, east stairs, forested hill.
// Axes: front (east stairs) = +z, north = +x, west = -z, south = -x. Platform top at y = 0.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Monkey, Chaitya, Tree, Frame, GroundDisc, THREE, useMemo, useRef, useEffect } = K;
  const FLAGC = ['#2f6db5', '#f4f1e8', '#c0392b', '#2e8b57', '#e2b33c'];
  const R = 3.4;            // dome radius
  const PR = 8.8;           // platform radius
  const HV = 45;            // hill height above valley
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ramp = (z) => Math.max(-HV, -0.8 * (z - (PR - 0.1)));
  const corridor = (x, z) => (z > PR - 0.3 ? 1 - sstep(2.3, 6.5, Math.abs(x)) : 0);
  function hill(x, z) {
    const r = Math.hypot(x, z) || 0.001;
    const d = r - PR;
    if (d <= 0.6) return -0.4;
    const east = Math.max(0, z / r);
    const L = 14 + 7 * east * east;
    const t = Math.min(1, (d - 0.6) / L);
    const tt = Math.pow(t, 0.85);
    let y = -HV * (0.55 * tt + 0.45 * tt * tt * (3 - 2 * tt));
    y += (Math.sin(x * 0.37 + 1.3) * Math.cos(z * 0.31) + Math.sin(x * 0.14 - z * 0.19)) * 1.6 * 4 * t * (1 - t);
    const c = corridor(x, z);
    if (c > 0) y = y * (1 - c) + (ramp(z) - 0.25) * c;
    return y;
  }

  const HOUSES = [[-2.4, -10.2], [-9.8, -4.5], [6.2, -9.0], [2.8, -9.2]];

  /* ---------- textures ---------- */
  function useEyes() {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = '#c79a2c'; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(120,80,10,0.35)'; g.lineWidth = 2;
      for (let y = 6; y < 256; y += 12) for (let x = (y / 12) % 2 ? 0 : 8; x < 256; x += 16) { g.beginPath(); g.arc(x, y, 8, 0, Math.PI); g.stroke(); }
      g.lineCap = 'round';
      g.save(); g.translate(0, -16);
      for (const x of [64, 192]) {
        g.strokeStyle = '#7a1620'; g.lineWidth = 12;
        g.beginPath(); g.moveTo(x - 62, 126); g.quadraticCurveTo(x, 84, x + 62, 126); g.stroke();
        g.strokeStyle = '#15121c'; g.lineWidth = 11; g.fillStyle = '#fbf6ea';
        g.beginPath(); g.moveTo(x - 58, 150); g.quadraticCurveTo(x, 112, x + 58, 150); g.quadraticCurveTo(x, 184, x - 58, 150); g.fill(); g.stroke();
        g.beginPath(); g.arc(x, 148, 19, 0, Math.PI * 2); g.fillStyle = '#243f7a'; g.fill();
        g.beginPath(); g.arc(x, 148, 9, 0, Math.PI * 2); g.fillStyle = '#0c0c12'; g.fill();
      }
      g.beginPath(); g.arc(128, 98, 10, 0, Math.PI * 2); g.fillStyle = '#fbf6ea'; g.fill(); g.strokeStyle = '#15121c'; g.lineWidth = 5; g.stroke();
      g.strokeStyle = '#7a1620'; g.lineWidth = 13;
      g.beginPath(); g.moveTo(128, 128); g.quadraticCurveTo(108, 176, 130, 188); g.quadraticCurveTo(150, 200, 120, 232); g.stroke();
      g.restore();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }, []);
  }
  function useValance() {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      const bands = [['#2e8b57', 20], ['#2f6db5', 8], ['#f4f1e8', 8], ['#c0392b', 12], ['#e2b33c', 8], ['#2e8b57', 8]];
      let y = 0; for (const [col, h] of bands) { g.fillStyle = col; g.fillRect(0, y, 256, h); y += h; }
      for (let x = 0; x < 256; x += 32) { g.fillStyle = FLAGC[(x / 32) % 5]; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 16, 54); g.lineTo(x + 32, 64); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
      return t;
    }, []);
  }

  /* ---------- pieces ---------- */
  function Spire13({ y0 }) {
    const M = useM();
    const gold = M.gold, dg = M.plain('#3e2a07', { roughness: 0.8, metalness: 0.3 });
    const out = [];
    for (let i = 0; i < 13; i++) {
      const rb = 0.92 - i * 0.062, y = y0 + i * 0.26;
      out.push(<Cyl key={`r${i}`} rb={rb} rt={rb - 0.05} h={0.17} p={[0, y + 0.085, 0]} m={gold} seg={32} />);
      out.push(<Cyl key={`g${i}`} rb={rb - 0.07} rt={rb - 0.07} h={0.09} p={[0, y + 0.215, 0]} m={dg} seg={32} />);
    }
    const top = y0 + 13 * 0.26;
    return (
      <group>
        {out}
        <Cyl rb={0.2} rt={0.14} h={0.14} p={[0, top + 0.07, 0]} m={gold} seg={20} />
        <mesh position={[0, top + 0.27, 0]} material={gold} castShadow><coneGeometry args={[0.8, 0.28, 32]} /></mesh>
        <Cyl rb={0.06} rt={0.06} h={0.3} p={[0, top + 0.56, 0]} m={gold} seg={10} />
        <Ball rad={0.14} p={[0, top + 0.76, 0]} m={gold} />
        <mesh position={[0, top + 1.04, 0]} material={gold} castShadow><coneGeometry args={[0.07, 0.5, 10]} /></mesh>
      </group>
    );
  }

  function Harmika({ y0 }) {
    const M = useM();
    const eyes = useEyes(), val = useValance();
    const eyeM = useMemo(() => new THREE.MeshStandardMaterial({ map: eyes, roughness: 0.6, metalness: 0.35 }), [eyes]);
    const valM = useMemo(() => new THREE.MeshStandardMaterial({ map: val, roughness: 0.95 }), [val]);
    const red = M.plain('#c4201f', { roughness: 0.95 });
    const W = 1.9, H = 1.25, B = 0.12;
    return (
      <group position={[0, y0, 0]}>
        <Box s={[W + 0.14, B, W + 0.14]} p={[0, B / 2, 0]} m={red} />
        <mesh position={[0, B + H / 2, 0]} castShadow material={[eyeM, eyeM, M.gold, M.gold, eyeM, eyeM]}><boxGeometry args={[W, H, W]} /></mesh>
        <mesh position={[0, B + H - 0.2, 0]} material={valM}><boxGeometry args={[W + 0.1, 0.4, W + 0.1]} /></mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.1, H, 0.1]} p={[a * (W / 2 + 0.01), B + H / 2, b * (W / 2 + 0.01)]} m={M.gold} />)}
        <Box s={[W + 0.2, 0.12, W + 0.2]} p={[0, B + H + 0.06, 0]} m={M.gold} />
        <Box s={[W - 0.35, 0.14, W - 0.35]} p={[0, B + H + 0.19, 0]} m={M.gold} />
      </group>
    );
  }

  function Dhyani({ p, r = 0, s = 1 }) {
    const M = useM();
    const dark = M.plain('#16130f', { roughness: 0.6 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[1.5, 0.3, 1.0]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[1.1, 1.25, 0.55]} p={[0, 0.92, -0.05]} m={M.gold} />
        <Box s={[0.55, 0.8, 0.08]} p={[0, 0.88, 0.25]} m={dark} />
        <Box s={[0.7, 0.1, 0.12]} p={[0, 1.34, 0.26]} m={M.gold} />
        <Box s={[0.1, 0.9, 0.12]} p={[-0.34, 0.9, 0.27]} m={M.gold} />
        <Box s={[0.1, 0.9, 0.12]} p={[0.34, 0.9, 0.27]} m={M.gold} />
        <Ball rad={0.13} p={[0, 0.72, 0.28]} m={M.gold} />
        <Roof w={1.35} d={0.9} h={0.55} y={1.55} m={M.gold} sag={1.5} />
        <Gajur y={2.05} s={0.75} />
        {[-0.62, -0.42, -0.21, 0, 0.21, 0.42, 0.62].map((x) => <Box key={x} s={[0.035, 0.6, 0.035]} p={[x, 0.55, 0.62]} m={dark} />)}
        <Box s={[1.3, 0.04, 0.04]} p={[0, 0.82, 0.62]} m={dark} />
        <Box s={[1.3, 0.04, 0.04]} p={[0, 0.4, 0.62]} m={dark} />
      </group>
    );
  }

  function Shikhara({ p, s = 1 }) {
    const M = useM();
    const cream = M.plain('#f6f2ea', { roughness: 0.85 });
    const cream2 = M.plain('#e4dcc8', { roughness: 0.85 });
    const red = M.plain('#b3261e', { roughness: 0.9 });
    const goldD = M.plain('#a67c1e', { roughness: 0.6, metalness: 0.5 });
    const brick = M.mat('brick', 2, 1, { color: '#ecc3ae' });
    const N = 16, y0 = 2.0, H = 3.6, hh = H / N, rr = (t) => 0.45 + 0.55 * Math.pow(1 - t, 1.5) + 0.1 * Math.sin(Math.PI * t);
    const ribs = [0, 0.5].map((t) => {
      const ra = rr(t) * 0.924, rb2 = rr(t + 0.5) * 0.924;
      const len = Math.hypot(0.5 * H, ra - rb2);
      return { y: y0 + (t + 0.25) * H, z: (ra + rb2) / 2 + 0.02, tilt: Math.atan2(ra - rb2, 0.5 * H), len };
    });
    return (
      <group position={p} scale={s}>
        <Box s={[2.9, 0.4, 2.9]} p={[0, 0.2, 0]} m={brick} />
        <Box s={[2.4, 0.3, 2.4]} p={[0, 0.55, 0]} m={M.stone} />
        <Box s={[2.0, 1.2, 2.0]} p={[0, 1.3, 0]} m={cream} />
        <Box s={[2.08, 0.35, 2.08]} p={[0, 1.55, 0]} m={red} />
        <Box s={[2.15, 0.1, 2.15]} p={[0, 1.95, 0]} m={cream2} />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, k * Math.PI / 2, 0]}>
            <Box s={[0.6, 0.62, 0.04]} p={[0, 1.2, 1.01]} m={M.gold} />
            <Box s={[0.42, 0.46, 0.05]} p={[0, 1.18, 1.02]} m={goldD} />
            <Ball rad={0.2} sc={[1, 0.6, 0.2]} p={[0, 1.5, 1.01]} m={M.gold} />
          </group>
        ))}
        {Array.from({ length: N }, (_, i) => (
          <Cyl key={i} rb={rr(i / N)} rt={rr((i + 1) / N)} h={hh + 0.01} p={[0, y0 + i * hh + hh / 2, 0]} r={[0, Math.PI / 8, 0]} m={i % 5 === 4 ? cream2 : cream} seg={8} />
        ))}
        {[0, 1, 2, 3].map((k) => (
          <group key={`n${k}`} rotation={[0, k * Math.PI / 2, 0]}>
            {ribs.map((rb, q) => <Box key={q} s={[0.14, rb.len, 0.1]} p={[0, rb.y, rb.z]} r={[-rb.tilt, 0, 0]} m={cream2} />)}
            {ribs.map((rb, q) => <Box key={`s${q}`} s={[0.1, rb.len * 0.9, 0.1]} p={[0.3, rb.y, rb.z - 0.02]} r={[-rb.tilt, 0, 0]} m={cream2} />)}
            {ribs.map((rb, q) => <Box key={`t${q}`} s={[0.1, rb.len * 0.9, 0.1]} p={[-0.3, rb.y, rb.z - 0.02]} r={[-rb.tilt, 0, 0]} m={cream2} />)}
            <Box s={[0.3, 0.7, 0.06]} p={[0, y0 + 0.75, 0.95]} r={[-0.16, 0, 0]} m={M.gold} />
            <Ball rad={0.15} sc={[1, 0.8, 0.3]} p={[0, y0 + 1.12, 0.93]} r={[-0.16, 0, 0]} m={M.gold} />
          </group>
        ))}
        <Cyl rb={0.5} rt={0.46} h={0.07} p={[0, y0 + H + 0.03, 0]} m={cream2} seg={16} />
        <Ball rad={0.56} sc={[1, 0.38, 1]} p={[0, y0 + H + 0.14, 0]} m={cream} />
        <Cyl rb={0.58} rt={0.58} h={0.06} p={[0, y0 + H + 0.14, 0]} m={red} seg={16} />
        <Cyl rb={0.2} rt={0.2} h={0.14} p={[0, y0 + H + 0.36, 0]} m={M.gold} seg={12} />
        <Ball rad={0.19} sc={[1, 1.1, 1]} p={[0, y0 + H + 0.58, 0]} m={M.gold} />
        <mesh position={[0, y0 + H + 0.95, 0]} material={M.gold} castShadow><coneGeometry args={[0.08, 0.55, 10]} /></mesh>
      </group>
    );
  }

  function Harati({ p, r = 0 }) {
    const M = useM();
    const wall = M.plain('#f1ebdc', { roughness: 0.85 });
    const wood = M.plain('#5a3418');
    const brick = M.mat('brick', 2, 1, { color: '#ecc3ae' });
    return (
      <group position={p} rotation={[0, r, 0]} scale={1.2}>
        <Box s={[2.7, 0.35, 2.7]} p={[0, 0.17, 0]} m={M.stone} />
        <Box s={[1.8, 0.5, 1.8]} p={[0, 0.6, 0]} m={brick} />
        <Box s={[1.7, 1.1, 1.7]} p={[0, 1.4, 0]} m={wall} />
        <Box s={[0.6, 0.9, 0.06]} p={[0, 1.25, 0.86]} m={wood} />
        <Box s={[0.7, 0.08, 0.1]} p={[0, 1.76, 0.86]} m={M.gold} />
        <Roof w={3.4} d={3.4} h={0.95} y={1.95} m={M.gold} sag={1.5} />
        <Box s={[1.15, 0.85, 1.15]} p={[0, 3.0, 0]} m={wall} />
        <Box s={[0.5, 0.45, 0.06]} p={[0, 3.0, 0.58]} m={wood} />
        <Roof w={2.6} d={2.6} h={0.9} y={3.45} m={M.gold} sag={1.5} />
        <Gajur y={4.3} s={1.2} />
      </group>
    );
  }

  function MonkHouse({ p, r = 0, w = 2.5, d = 2.2, h = 2.8, tileC = '#5f5f63', st = 2, brickUp = false }) {
    const M = useM();
    const brick = M.mat('brick', 2, 1, { color: '#f4d6c4' });
    const wall = M.plain('#f3eee2', { roughness: 0.85 });
    const wood = M.plain('#4a2c16');
    const tile = M.plain(tileC, { roughness: 0.95 });
    const nx = Math.max(2, Math.floor(w / 0.9));
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.3, 4.0, d + 0.3]} p={[0, -1.98, 0]} m={M.stone} />
        <Box s={[w, h * 0.45, d]} p={[0, h * 0.225, 0]} m={brick} />
        <Box s={[w, h * 0.55, d]} p={[0, h * 0.725, 0]} m={brickUp ? brick : wall} />
        <Box s={[w + 0.1, 0.1, d + 0.1]} p={[0, h * 0.46, 0]} m={wood} />
        {Array.from({ length: nx }, (_, i) => {
          const x = (i - (nx - 1) / 2) * 0.9;
          return (
            <group key={i}>
              <Box s={[0.38, 0.45, 0.05]} p={[x, h * 0.72, d / 2 + 0.01]} m={wood} />
              <Box s={[0.3, 0.45, 0.05]} p={[x, h * 0.24, d / 2 + 0.01]} m={wood} />
            </group>
          );
        })}
        <Roof w={w + 0.6} d={d + 0.6} h={0.65} y={h} m={tile} sag={1.0} lift={0.05} />
      </group>
    );
  }

  function Vajra({ z }) {
    const M = useM();
    const granite = M.mat('granite', 1, 1, { color: '#a8a095' });
    const ends = [-1, 1].map((k) => (
      <group key={k}>
        <Ball rad={0.22} sc={[1, 0.6, 1]} p={[0, k * 0.2, 0]} m={M.gold} />
        {[0, 1, 2, 3].map((j) => (
          <group key={j} rotation={[0, j * Math.PI / 2 + Math.PI / 4, 0]}>
            <Cyl rt={0.03} rb={0.045} h={0.58} p={[0.12, k * 0.5, 0]} r={[0, 0, k * 0.4]} m={M.gold} seg={6} />
          </group>
        ))}
        <mesh position={[0, k * 0.8, 0]} rotation={[k < 0 ? Math.PI : 0, 0, 0]} material={M.gold} castShadow><coneGeometry args={[0.05, 0.34, 8]} /></mesh>
      </group>
    ));
    return (
      <group position={[0, 0, z]} scale={0.85}>
        <Cyl rb={1.45} rt={1.35} h={0.2} p={[0, 0.1, 0]} m={M.stone} seg={32} />
        <Cyl rb={1.15} rt={1.05} h={0.55} p={[0, 0.48, 0]} m={granite} seg={32} />
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <Box key={i} s={[0.18, 0.16, 0.06]} p={[Math.cos(a) * 1.12, 0.5, Math.sin(a) * 1.12]} r={[0, -a + Math.PI / 2, 0]} m={M.gold} />; })}
        <Cyl rb={1.0} rt={0.95} h={0.1} p={[0, 0.8, 0]} m={M.gold} seg={32} />
        <Cyl rb={0.45} rt={0.3} h={0.35} p={[0, 1.02, 0]} m={granite} seg={20} />
        <group position={[0, 1.18, 0]} scale={1.0}>
          <group position={[0, 0.82, 0]}>
            <Ball rad={0.2} m={M.gold} />
            {ends}
          </group>
        </group>
      </group>
    );
  }

  function Flags({ top }) {
    const geo = useMemo(() => {
      let geoEnds;
      const pos = [], col = [], lpos = [];
      const c = new THREE.Color();
      const N = 12, F = 20;
      const rr2 = rng(91);
      const ends = [];
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2 + 0.13 + (rr2() - 0.5) * 0.3;
        const er = 8.0 + rr2() * 2.2, ey = 5 + rr2() * 2;
        let da = Math.abs(a - Math.PI / 2) % (Math.PI * 2); if (da > Math.PI) da = Math.PI * 2 - da;
        if (da < 0.35) continue;
        ends.push([a, er, ey]);
        const ex = Math.cos(a) * er, ez = Math.sin(a) * er;
        const dx = -Math.sin(a), dz = Math.cos(a);
        const at = (t) => [ex * t, top + (ey - top) * t - Math.sin(Math.PI * t) * 0.4, ez * t];
        for (let s = 0; s < 24; s++) { lpos.push(...at(s / 24), ...at((s + 1) / 24)); }
        for (let i = 0; i < F; i++) {
          const t = 0.05 + (i / (F - 1)) * 0.9;
          const [x, y, z] = at(t);
          const hw = 0.2, hh = 0.45;
          const v = [[x - dx * hw, y, z - dz * hw], [x + dx * hw, y, z + dz * hw], [x + dx * hw, y - hh, z + dz * hw], [x - dx * hw, y - hh, z - dz * hw]];
          c.set(FLAGC[(i + k) % 5]);
          for (const q of [0, 1, 2, 0, 2, 3]) { pos.push(...v[q]); col.push(c.r, c.g, c.b); }
        }
      }
      geoEnds = ends;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const l = new THREE.BufferGeometry();
      l.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3));
      return { g, l, ends: geoEnds };
    }, [top]);
    const M = useM();
    return (
      <group>
        <mesh geometry={geo.g}><meshBasicMaterial vertexColors side={THREE.DoubleSide} toneMapped={false} /></mesh>
        <lineSegments geometry={geo.l}><lineBasicMaterial color="#b9ae98" transparent opacity={0.6} /></lineSegments>
        {geo.ends.map(([a, er, ey], k) => { const x = Math.cos(a) * er, z = Math.sin(a) * er; if (HOUSES.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 3.4)) return null; const yb = hill(x, z), ph = ey - yb; return <Cyl key={k} rt={0.03} rb={0.045} h={ph} p={[x, yb + ph / 2, z]} m={M.plain('#4a4034')} seg={6} />; })}
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function SwayMain() {
    const M = useM();
    const white = M.plain('#f6f4ee', { roughness: 0.85 });
    const wallW = M.plain('#efece2', { roughness: 0.85 });
    const parapetM = M.plain('#f4f1e8', { roughness: 0.9 });
    const flag = M.plain('#cdc4b0', { roughness: 0.95 });
    const wheelM = M.plain('#6b3a22', { roughness: 0.45, metalness: 0.5 });
    const stoneW = M.plain('#b9b09c', { roughness: 0.9 });
    const domeH = 0.85;
    const base = 0.55;
    const domeTop = base + R * domeH;
    const spireY0 = domeTop + 0.03 + 1.65;
    return (
      <group>
        <Cyl rt={PR} rb={PR} h={0.5} p={[0, -0.25, 0]} m={flag} seg={64} />
        {/* low circular plinth; a continuous gold-trimmed wall of prayer wheels */}
        <Cyl rt={4.7} rb={4.8} h={0.18} p={[0, 0.09, 0]} m={M.stone} seg={56} />
        <Cyl rt={4.25} rb={4.3} h={base - 0.18} p={[0, 0.18 + (base - 0.18) / 2, 0]} m={wallW} seg={56} />
        <Cyl rt={4.78} rb={4.82} h={0.3} p={[0, 0.33, 0]} m={wallW} seg={56} />
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><torusGeometry args={[4.8, 0.035, 5, 72]} /></mesh>
        {Array.from({ length: 56 }, (_, i) => {
          const a = (i / 56) * Math.PI * 2;
          if (Math.abs(a - Math.PI / 2) < 0.2) return null;
          return <Cyl key={i} rt={0.15} rb={0.15} h={0.6} p={[Math.cos(a) * 4.62, 0.83, Math.sin(a) * 4.62]} m={i % 8 === 0 ? M.gold : wheelM} seg={8} />;
        })}
        <mesh position={[0, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><torusGeometry args={[4.62, 0.04, 5, 72]} /></mesh>
        
        {/* dome */}
        <mesh position={[0, base, 0]} scale={[1, domeH, 1]} castShadow receiveShadow material={white}><sphereGeometry args={[R, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={1.4} rb={1.45} h={0.12} p={[0, domeTop - 0.08, 0]} m={M.gold} seg={32} />
        <Harmika y0={domeTop + 0.03} />
        <Spire13 y0={spireY0} />
        <Flags top={spireY0 + 13 * 0.26 + 0.8} />
        {/* Dhyani Buddha shrines: east (front) Akshobhya shrine is larger, at the dome base */}
        <Dhyani p={[0, 0, 4.9]} r={0} s={1.3} />
        <Dhyani p={[5.0, 0, 0]} r={Math.PI / 2} />
        <Dhyani p={[-5.0, 0, 0]} r={-Math.PI / 2} />
        <Dhyani p={[0, 0, -5.4]} r={Math.PI} />
        {/* Vajra with lions at the top of the east stairs */}
        <Vajra z={7.3} />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.5, 0, 7.9]}>
            <Box s={[0.7, 0.45, 0.8]} p={[0, 0.22, 0]} m={M.stone} />
            <group position={[0, 0.45, 0]} scale={2.0}><Lion m={M.plain('#e2dccc', { roughness: 0.9 })} /></group>
          </group>
        ))}
        {/* Pratappur (north) and Anantapur (south) shikharas flank the dome */}
        <Shikhara p={[7.2, 0, 0]} s={0.7} />
        <Shikhara p={[-7.2, 0, 0]} s={0.7} />
        {/* Harati pagoda (north) */}
        <Harati p={[4.8, 0, -4.4]} r={-0.9} />
        {/* small chaityas */}
        <Chaitya p={[-5.0, 0, -5.4]} s={1.8} />
        <Chaitya p={[-6.0, 0, -2.8]} s={1.4} />
        <Chaitya p={[4.6, 0, 5.6]} s={1.4} />
        <Chaitya p={[-4.6, 0, 5.6]} s={1.4} />
        {/* sparse monks' houses behind the parapet */}
        <MonkHouse p={[-2.4, 0, -10.2]} r={0.1} w={2.6} d={2.2} h={3.0} brickUp />
        <MonkHouse p={[-9.8, 0, -4.5]} r={Math.PI / 2 + 0.45} w={2.4} d={2.2} h={2.6} />
        <MonkHouse p={[6.2, 0, -9.0]} r={-0.6} w={2.5} d={2.2} h={3.0} brickUp />
        <Box s={[2.0, 1.5, 1.8]} p={[2.8, 0.75, -9.2]} r={[0, -0.1, 0]} m={M.mat('brick', 2, 1, { color: '#f4d6c4' })} />
        {/* continuous white parapet with a gap at the east stairs */}
        {Array.from({ length: 64 }, (_, i) => {
          const a = (i / 64) * Math.PI * 2;
          if (Math.abs(a - Math.PI / 2) < 0.3) return null;
          return <Box key={i} s={[1.0, 0.55, 0.3]} p={[Math.cos(a) * 8.4, 0.27, Math.sin(a) * 8.4]} r={[0, -a + Math.PI / 2, 0]} m={parapetM} />;
        })}
        {[[2.6, 7.6, 0.4], [-2.9, 7.9, 2], [4.4, 7.0, 3.5]].map(([x, z, r], k) => <Monkey key={k} p={[x, 0, z]} r={r} />)}
        <Frame s={[16, 10.8, 13]} p={[0, 5.4, 0.5]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Terrain() {
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(140, 140, 100, 100);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      const rnd = rng(7);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const y = hill(x, z);
        p.setY(i, y);
        const r = Math.hypot(x, z), d = r - PR;
        const cc = corridor(x, z);
        const n = rnd();
        if (y < -HV + 0.6) c.set('#a39580').offsetHSL(0, 0, n * 0.04 - 0.02);
        else if (y < -HV + 3) c.set('#4a5a37').offsetHSL(0, 0, n * 0.04 - 0.02);
        else if (d < 3.5) c.set('#1c3519').offsetHSL((n - 0.5) * 0.03, 0, (n - 0.5) * 0.05);
        else c.set('#233d20').offsetHSL((n - 0.5) * 0.04, 0, (n - 0.5) * 0.08);
        if (cc > 0.4) c.set('#8d836f');
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  function Inst({ items, geo, color = '#ffffff', rough = 1, flat = false }) {
    const ref = useRef();
    useEffect(() => {
      const m = ref.current; if (!m) return;
      const o = new THREE.Object3D(), c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.scale.set(it.s[0], it.s[1], it.s[2]);
        o.rotation.set(0, it.r || 0, 0);
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
        c.set(it.c); m.setColorAt(i, c);
      });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false} castShadow={false}>{geo}<meshStandardMaterial color={color} roughness={rough} flatShading={flat} /></instancedMesh>;
  }

  function Forest() {
    const { cones, blobs } = useMemo(() => {
      const rnd = rng(21), cones = [], blobs = [];
      const greens = ['#16301c', '#1d3a21', '#264628', '#1b3620', '#2c4d2c', '#203f27', '#173020'];
      const nearHouse = (x, z) => HOUSES.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 3.2);
      const skip = (x, z) => (corridor(x, z) > 0 && Math.abs(x) < 5.5 && z > PR - 1) || nearHouse(x, z);
      for (let gx = -46; gx <= 46; gx += 1.25) for (let gz = -46; gz <= 46; gz += 1.25) {
        const x = gx + (rnd() - 0.5) * 1.3, z = gz + (rnd() - 0.5) * 1.3;
        const r = Math.hypot(x, z), d = r - PR;
        if (d < 0.9) continue;
        const y = hill(x, z);
        if (y < -HV + 1.2) continue;
        if (skip(x, z)) continue;
        let sz = 1.0 + rnd() * 0.9;
        const cap = z > 1 ? 0.0 : 1.6;
        if (d < 4) sz = Math.min(sz, Math.max(0.4, (cap - y + 0.4) / 2.3));
        const col = greens[Math.floor(rnd() * greens.length)];
        if (rnd() < 0.45) {
          cones.push({ p: [x, y + sz * 1.25, z], s: [sz * 0.9, sz * 1.5, sz * 0.9], r: rnd() * 6, c: col });
        } else {
          blobs.push({ p: [x, y + sz * 0.8, z], s: [sz * 1.2, sz * 0.9, sz * 1.2], r: rnd() * 6, c: col });
          blobs.push({ p: [x + (rnd() - 0.5) * 0.6, y + sz * 1.5, z + (rnd() - 0.5) * 0.6], s: [sz * 0.8, sz * 0.7, sz * 0.8], r: rnd() * 6, c: greens[Math.floor(rnd() * greens.length)] });
        }
      }
      return { cones, blobs };
    }, []);
    return (
      <group>
        <Inst items={cones} geo={<coneGeometry args={[1, 2, 7]} />} flat />
        <Inst items={blobs} geo={<icosahedronGeometry args={[1, 1]} />} flat />
      </group>
    );
  }

  function City() {
    const items = useMemo(() => {
      const rnd = rng(5), out = [];
      const cols = ['#8e6f5c', '#9a7b67', '#a58a76', '#b49a86', '#98806e', '#8f7765', '#a38b7c', '#a68a72'];
      const haze = new THREE.Color('#c6cdd2'), c = new THREE.Color();
      for (let gx = -66; gx <= 66; gx += 2.6) for (let gz = -66; gz <= 66; gz += 2.6) {
        const x = gx + (rnd() - 0.5) * 1.0, z = gz + (rnd() - 0.5) * 1.0;
        if (hill(x, z) > -HV + 0.3) continue;
        const r = Math.hypot(x, z);
        if (r < PR + 20) continue;
        if (Math.abs(x) < 4.5 && z > 30) continue;
        if (rnd() < 0.1) continue;
        const h = 0.5 + rnd() * rnd() * 1.8, w = 1.1 + rnd() * 1.0;
        c.set(cols[Math.floor(rnd() * cols.length)]).lerp(haze, sstep(32, 80, r) * 0.7);
        out.push({ p: [x, -HV + h / 2, z], s: [w, h, w * (0.8 + rnd() * 0.5)], r: rnd() * 1.5, c: '#' + c.getHexString() });
      }
      return out;
    }, []);
    return <Inst items={items} geo={<boxGeometry args={[1, 1, 1]} />} rough={0.95} />;
  }

  function Stairs() {
    const M = useM();
    const z0 = PR - 0.3, z1 = PR + 57.5, rise = 0.26, tread = rise / 0.8, W = 3.6;
    const geo = useMemo(() => {
      const sh = new THREE.Shape();
      const n = Math.ceil((z1 - z0) / tread);
      sh.moveTo(z0, -HV - 1);
      let y = ramp(z0) ;
      sh.lineTo(z0, 0);
      for (let i = 0; i < n; i++) {
        const za = z0 + i * tread, ya = -i * rise;
        sh.lineTo(za, ya); sh.lineTo(za + tread, ya);
        if (ya - rise < -HV) { sh.lineTo(za + tread, -HV - 1); break; }
        sh.lineTo(za + tread, ya - rise);
      }
      sh.lineTo(z1, -HV - 1);
      sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false });
      g.rotateY(-Math.PI / 2);
      g.translate(W / 2, 0, 0);
      return g;
    }, []);
    const ang = Math.atan(0.8), len = (z1 - z0) / Math.cos(ang);
    const zc = (z0 + z1) / 2, yc = -0.8 * (zc - z0);
    const stone = M.plain('#b8ad98', { roughness: 0.95 });
    const wall = M.plain('#ece7da', { roughness: 0.9 });
    const brickW = M.mat('brick', 6, 1, { color: '#d9a58c' });
    const posts = [14, 24, 34, 44, 54, 62];
    const mk = [[1.2, 14.5, 0.2], [-1.3, 20.5, 3], [1.0, 27, 4], [-0.8, 34, 1], [0.6, 41, 2.2], [-1.2, 47, 5], [0.9, 55, 1]];
    return (
      <group>
        <mesh geometry={geo} material={stone} receiveShadow castShadow />
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * (W / 2 + 0.2), yc + 0.3, zc]} rotation={[ang, 0, 0]} material={brickW} castShadow>
            <boxGeometry args={[0.4, 0.55, len]} />
          </mesh>
        ))}
        {posts.map((z) => [-1, 1].map((k) => {
          const y = ramp(z) + 0.55;
          return (
            <group key={`${z}${k}`} position={[k * (W / 2 + 0.2), y, z]}>
              <Box s={[0.6, 0.5, 0.6]} p={[0, 0.0, 0]} m={wall} />
              <Cyl rt={0.2} rb={0.26} h={0.14} p={[0, 0.32, 0]} m={M.gold} seg={10} />
              <Ball rad={0.22} p={[0, 0.58, 0]} m={M.gold} />
              <mesh position={[0, 0.98, 0]} material={M.gold}><coneGeometry args={[0.09, 0.45, 8]} /></mesh>
            </group>
          );
        }))}
        {mk.map(([x, z, r], i) => <Monkey key={i} p={[x, ramp(z) + 0.0, z]} r={r} />)}
        {[16, 25, 36, 44, 52].map((z, i) => <Monkey key={`w${i}`} p={[(i % 2 ? -1 : 1) * (W / 2 + 0.2), ramp(z) + 0.85, z]} r={i} />)}
        {/* gateway landings with chaityas */}
        {[24, 40, 56].map((z) => (
          <group key={z} position={[0, ramp(z), z]}>
            <Box s={[W + 1.2, 0.16, 1.4]} p={[0, 0.0, 0]} m={wall} />
          </group>
        ))}
      </group>
    );
  }

  function Backdrop() {
    const M = useM();
    const ridges = useMemo(() => {
      const rnd = rng(33), o = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + rnd() * 0.2;
        const r = 92 + rnd() * 10;
        o.push({ p: [Math.cos(a) * r, 0, Math.sin(a) * r], rad: 34 + rnd() * 14, h: 7 + rnd() * 6, rot: rnd() * 3 });
      }
      return o;
    }, []);
    return (
      <group>
        <GroundDisc r={170} y={-HV - 0.4} m={M.plain('#aa9d88', { roughness: 1 })} />
        {ridges.map((h, i) => (
          <mesh key={i} position={[h.p[0], -HV + h.h / 2 - 0.5, h.p[2]]} rotation={[0, h.rot, 0]} material={M.plain(i % 2 ? '#9fb0a2' : '#93a698', { roughness: 1 })}><coneGeometry args={[h.rad, h.h, 7]} /></mesh>
        ))}
        {[[0.15, 150, 30], [0.45, 158, 32], [0.75, 152, 28], [1.05, 160, 32], [-0.2, 154, 26], [0.3, 165, 28]].map(([a, r, h], i) => {
          const bx = Math.cos(a) * r, bz = Math.sin(a - 0.9) * r - 20;
          const haze = i % 2 ? '#b4bfcf' : '#bcc6d3';
          const k = 0.36;
          return (
            <group key={i} position={[bx, -HV + h / 2 - 1, bz]}>
              <mesh rotation={[0, i, 0]} material={M.plain(haze, { roughness: 1 })}><coneGeometry args={[52, h, 6]} /></mesh>
              <mesh position={[-30, -h * 0.14, 6]} rotation={[0, i + 1, 0]} material={M.plain('#aab6c7', { roughness: 1 })}><coneGeometry args={[36, h * 0.7, 6]} /></mesh>
              <mesh position={[30, -h * 0.2, -4]} rotation={[0, i + 2, 0]} material={M.plain('#b0bbcb', { roughness: 1 })}><coneGeometry args={[34, h * 0.6, 6]} /></mesh>
              <mesh position={[0, h * (1 - k) / 2 + 0.1, 0]} rotation={[0, i, 0]} material={M.plain('#d8dee9', { roughness: 0.9 })}><coneGeometry args={[52 * k, h * k, 6]} /></mesh>
            </group>
          );
        })}
        {[[-HV + 1.5, 0.14], [-HV + 6, 0.08]].map(([y, o], i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[34, 175, 64, 1]} />
            <meshBasicMaterial color="#cfd7dc" transparent opacity={o} depthWrite={false} fog={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    );
  }

  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(120, 24, 16);
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      const top = new THREE.Color('#4a82c8'), mid = new THREE.Color('#9dbfe0'), hor = new THREE.Color('#d3dde6'), c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const t = Math.max(0, p.getY(i) / 120);
        if (t < 0.35) c.copy(hor).lerp(mid, t / 0.35); else c.copy(mid).lerp(top, Math.min(1, (t - 0.35) / 0.5));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    const mat = useRef();
    return <mesh geometry={geo} renderOrder={-1000} frustumCulled={false} onBeforeRender={(r, sc) => { const b = sc.background, m = mat.current; if (m && b && b.isColor) m.color.set(b.r + b.g + b.b < 1.2 ? '#3d2f66' : '#ffffff'); }}><meshBasicMaterial ref={mat} vertexColors side={THREE.BackSide} depthWrite={false} depthTest={false} fog={false} toneMapped={false} /></mesh>;
  }

  function SwayEnv() {
    const M = useM();
    return (
      <group>
        <Terrain />
        <Stairs />
        <Forest />
        <City />
        <Backdrop />
        <Sky />
      </group>
    );
  }

  return { swayambhunath: { Main: SwayMain, Env: SwayEnv } };
}
