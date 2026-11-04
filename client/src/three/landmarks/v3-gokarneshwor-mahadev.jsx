// Gokarneshwor Mahadev: a stout three-roofed brick pagoda with mossy tile roofs, on the Bagmati bank in the Gokarna forest.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Trident, Nandi, Diyo, Frame, THREE, useMemo, useRef, useEffect } = K;
  const DS = THREE.DoubleSide;
  const sstep = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---- terrain: courtyard flat, narrow Bagmati in front (+z) that curves, wooded hill behind (-z), far bank ---- */
  const zc = (x) => 7.5 + 0.5 * Math.sin(x * 0.08 + 0.4);
  const HW = 3.2; const WY = -1.5;
  function tH(x, z) {
    const zr = z - zc(x);
    let h;
    if (zr < -2) h = -0.06;
    else if (zr < 1) h = -0.06 - 1.74 * sstep((zr + 2) / 3);
    else if (zr < HW) h = -1.8;
    else h = -1.8 + 2.1 * sstep((zr - HW) / 3.5);
    if (z > 36) h += sstep((z - 36) / 26) * 6 * (0.65 + 0.35 * Math.sin(x * 0.07 + 1));
    if (z < -9) { const t = Math.min(1, (-9 - z) / 34); h += 17 * Math.pow(t, 1.35) * (0.7 + 0.3 * Math.sin(x * 0.06 + 2) + 0.1 * Math.sin(x * 0.19)); }
    const ax = Math.abs(x);
    if (ax > 36) h += Math.pow(Math.min(1, (ax - 36) / 26), 1.5) * 9;
    const inCourt = x > -12 && x < 18 && z > -9 && z < 5.6;
    if (!inCourt && h > -1) h += 0.18 * Math.sin(x * 0.9) * Math.sin(z * 0.7);
    return h;
  }

  const Inst = ({ geo, mat, items }) => {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]); o.rotation.set(0, it.ry || 0, 0); o.scale.set(it.s[0], it.s[1], it.s[2]); o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix); if (it.c) { c.set(it.c); ref.current.setColorAt(i, c); }
      });
      ref.current.instanceMatrix.needsUpdate = true; if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow receiveShadow frustumCulled={false} />;
  };
  const GEO = { cone: new THREE.ConeGeometry(1, 1, 7), ico: new THREE.IcosahedronGeometry(1, 0), trunk: new THREE.CylinderGeometry(0.06, 0.1, 1, 6) };
  const IM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
  const TRM = new THREE.MeshStandardMaterial({ color: '#4a3526', roughness: 1 });

  /* lattice (jali) panel material with see-through gaps */
  function useLat(color = '#8a5a34') {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'); g.strokeStyle = '#ffffff'; g.lineWidth = 9;
      for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.45, side: DS, roughness: 0.9, color });
    }, [color]);
  }
  function useTile(base = '#5a6340', seed = 5) {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'); const R = rng(seed);
      g.fillStyle = base; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 256; i += 8) { g.fillStyle = i % 16 ? 'rgba(30,26,18,0.4)' : 'rgba(30,26,18,0.12)'; g.fillRect(0, i, 256, 2); g.fillRect(i, 0, 2, 256); }
      for (let k = 0; k < 160; k += 1) { g.fillStyle = `rgba(${110 + R() * 40},${105 + R() * 30},${80 + R() * 30},0.12)`; g.fillRect(R() * 256, R() * 256, 4 + R() * 10, 3); }
      for (let k = 0; k < 30; k += 1) {
        const x = R() * 256; const y = R() * 256; const r = 12 + R() * 28;
        const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, (k % 3 ? 'rgba(86,98,48,0.8)' : 'rgba(52,62,36,0.85)')); gr.addColorStop(1, 'rgba(79,92,54,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.7, R() * 3, 0, 7); g.fill();
      }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: DS });
    }, [base, seed]);
  }
  const Sides = ({ children }) => [0, 1, 2, 3].map((k) => <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>{children}</group>);

  /* ---------- temple ---------- */
  const TIERS = (() => {
    const t = [{ ww: 2.3, wh: 1.7, rw: 5.2, rh: 0.55, n: 9, len: 1.1 }, { ww: 1.85, wh: 1.3, rw: 4.0, rh: 0.5, n: 8, len: 0.9 }, { ww: 1.43, wh: 1.1, rw: 3.0, rh: 0.45, n: 7, len: 0.72 }];
    let y = 0.4; let prev = null;
    t.forEach((q) => {
      q.base = prev ? prev.eave + prev.rh * Math.pow(1 - q.ww / prev.rw, 1.5) - 0.1 : y;
      q.top = q.base + q.wh; q.eave = q.top + 0.06; prev = q;
    });
    return t;
  })();
  const TOP = TIERS[2].eave + TIERS[2].rh;

  function Win({ x = 0, y, z, s = 1 }) {
    const M = useM(); const lat = useLat('#6a4426');
    return (
      <group position={[x, y, z + 0.02]} scale={s}>
        <Box s={[0.36, 0.46, 0.06]} m={M.dark} cast={false} />
        <mesh position={[0, 0, 0.035]} material={M.plain('#120b07', { emissive: '#ff9a3c', emissiveIntensity: 0.22 })}><planeGeometry args={[0.26, 0.36]} /></mesh>
        <mesh position={[0, 0, 0.045]} material={lat}><planeGeometry args={[0.26, 0.36]} /></mesh>
      </group>
    );
  }

  function Temple() {
    const M = useM();
    const brick = M.mat('brick', 2, 1.4, { color: '#ffb89a' });
    const moss = useTile('#5a6340', 5);
    const stone = M.mat('stone', 2, 1, { color: '#c9c4b6' });
    const gold = M.gold;
    const t1 = TIERS[0];
    const half1 = t1.ww / 2;
    return (
      <group scale={1.3}>
        {/* stepped stone plinth + entrance steps (+z) */}
        <Box s={[5.9, 0.14, 5.9]} p={[0, 0.07, 0]} m={stone} />
        <Box s={[5.3, 0.13, 5.3]} p={[0, 0.205, 0]} m={stone} />
        <Box s={[4.7, 0.13, 4.7]} p={[0, 0.335, 0]} m={stone} />
        {[0, 1, 2].map((i) => <Box key={i} s={[2.1, 0.13 * (3 - i), 0.5]} p={[0, (0.13 * (3 - i)) / 2, 2.95 + 0.25 + i * 0.5]} m={stone} />)}
        <Box s={[0.2, 0.5, 1.6]} p={[-1.15, 0.25, 3.7]} m={stone} /><Box s={[0.2, 0.5, 1.6]} p={[1.15, 0.25, 3.7]} m={stone} />
        {[0, 1, 2].map((i) => <Box key={'r' + i} s={[2.1, 0.03, 0.04]} p={[0, 0.13 * (3 - i) + 0.005, 2.95 + 0.5 + i * 0.5 - 0.23]} m={M.plain('#7d786c', { roughness: 1 })} cast={false} />)}

        {TIERS.map((q, i) => {
          const h = q.ww / 2;
          return (
            <group key={i}>
              <Box s={[q.ww, q.wh, q.ww]} p={[0, q.base + q.wh / 2, 0]} m={M.mat('brick', q.ww / 1.2, q.wh / 1.2, { color: '#ffb89a' })} />
              <Box s={[q.ww + 0.18, 0.14, q.ww + 0.18]} p={[0, q.top - 0.07, 0]} m={M.plain('#5c3b28', { roughness: 0.85 })} />
              <Box s={[q.ww + 0.08, 0.06, q.ww + 0.08]} p={[0, q.top - 0.2, 0]} m={M.plain('#c8946a', { roughness: 0.8 })} />
              <Box s={[q.ww + 0.3, 0.12, q.ww + 0.3]} p={[0, q.top - 0.3, 0]} m={M.plain('#8c5638', { roughness: 0.8 })} />
              <Box s={[q.ww + 0.2, 0.05, q.ww + 0.2]} p={[0, q.top - 0.4, 0]} m={M.plain('#a8704a', { roughness: 0.8 })} />
              <Sides>{Array.from({ length: Math.round(q.ww / 0.2) }, (_, k) => <Box key={k} s={[0.09, 0.09, 0.08]} p={[((k + 0.5) / Math.round(q.ww / 0.2) - 0.5) * (q.ww + 0.1), q.top - 0.48, h + 0.12]} m={M.plain('#5a3622')} cast={false} />)}</Sides>
              {i === 0 && <Box s={[q.ww + 0.1, 0.26, q.ww + 0.1]} p={[0, 0.53, 0]} m={M.plain('#4f3322', { roughness: 0.8 })} />}
              <Box s={[q.rw - 0.1, 0.1, q.rw - 0.1]} p={[0, q.eave - 0.02, 0]} m={M.plain('#2e2418', { roughness: 1 })} cast={false} />
              <Box s={[q.rw - 0.5, 0.1, q.rw - 0.5]} p={[0, q.eave + 0.06, 0]} m={moss} cast={false} />
              <Roof w={q.rw} d={q.rw} h={q.rh} y={q.eave} m={moss} sag={1.3} lift={0.14} />
              {/* diagonal carved struts under the eave */}
              <Sides>
                {Array.from({ length: q.n }, (_, k) => {
                  const x = ((k + 0.5) / q.n - 0.5) * q.ww * 0.92;
                  if (i === 0 && Math.abs(x) < 0.5) return null;
                  const th = 0.75;
                  return <Box key={k} s={[0.075, q.len, 0.08]} p={[x, q.eave - 0.05 - (q.len * Math.cos(th)) / 2, h + (q.len * Math.sin(th)) / 2]} r={[th, 0, 0]} m={M.dark} cast={false} />;
                })}
              </Sides>
              {/* small latticed windows */}
              {i === 0 ? (
                <>
                  <Sides>
                    <Win x={-0.8} y={1.55} z={h} /><Win x={0.8} y={1.55} z={h} />
                  </Sides>
                  {[1, 2, 3].map((k) => <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}><Win x={0} y={1.55} z={h} /></group>)}
                </>
              ) : (
                <Sides>
                  <Win x={-q.ww * 0.3} y={q.base + q.wh * 0.52} z={h} s={0.85} /><Win x={0} y={q.base + q.wh * 0.52} z={h} s={0.85} /><Win x={q.ww * 0.3} y={q.base + q.wh * 0.52} z={h} s={0.85} />
                </Sides>
              )}
            </group>
          );
        })}
        {/* top finial */}
        <Box s={[0.1, 0.5, 0.1]} p={[0, TOP + 0.02, 0]} m={M.dark} />
        <Gajur y={TOP - 0.05} s={0.8} />

        {/* front door: gilded leaves, carved frame, torana with Garuda */}
        <group position={[0, 0, half1]}>
          <Box s={[1.04, 1.2, 0.12]} p={[0, 1.0, 0.03]} m={M.dark} />
          {[-1, 1].map((k) => <Box key={k} s={[0.4, 1.05, 0.06]} p={[k * 0.21, 0.93, 0.1]} m={gold} />)}
          {[0.62, 0.95, 1.28].map((y) => <Box key={y} s={[0.9, 0.04, 0.07]} p={[0, y, 0.14]} m={M.dark} />)}
          <Box s={[0.04, 1.05, 0.08]} p={[0, 0.93, 0.14]} m={M.dark} />
          <Box s={[1.35, 0.1, 0.12]} p={[0, 1.66, 0.08]} m={gold} />
          <mesh position={[0, 1.7, 0.1]} material={gold}><circleGeometry args={[0.52, 24, 0, Math.PI]} /></mesh>
          <mesh position={[0, 1.7, 0.13]} material={M.plain('#3a2416')}><circleGeometry args={[0.36, 24, 0, Math.PI]} /></mesh>
          <mesh position={[0, 1.7, 0.16]} material={gold}><circleGeometry args={[0.28, 24, 0, Math.PI]} /></mesh>
          <mesh position={[0, 1.7, 0.12]} material={gold}><torusGeometry args={[0.56, 0.05, 6, 24, Math.PI]} /></mesh>
          <Ball rad={0.08} p={[-0.62, 1.68, 0.14]} m={gold} /><Ball rad={0.08} p={[0.62, 1.68, 0.14]} m={gold} />
          <Ball rad={0.08} p={[0, 2.12, 0.14]} m={gold} /><Box s={[0.34, 0.06, 0.05]} p={[0, 2.1, 0.14]} m={gold} />
          <Box s={[0.1, 0.18, 0.06]} p={[0, 1.92, 0.19]} m={gold} /><Ball rad={0.06} p={[0, 1.8, 0.19]} m={gold} />
          {[-1, 1].map((k) => <Box key={k} s={[0.08, 1.2, 0.1]} p={[k * 0.58, 1.0, 0.1]} m={M.plain('#7a4a28')} />)}
        </group>
        <Trident p={[-1.28, 0.4, half1 + 0.5]} h={1.35} />
        <mesh position={[-0.9, 1.0, half1 + 0.08]} material={M.plain('#c0392b')}><planeGeometry args={[0.08, 0.6]} /></mesh>
        <Diyo p={[-0.5, 0.45, 2.9]} /><Diyo p={[0.5, 0.45, 2.9]} />
        
      </group>
    );
  }

  /* ---------- statues ---------- */
  function Statue({ p, k = 'deity', r = 0, s = 1.1, round = true }) {
    const M = useM();
    const st = M.plain('#8a877e', { roughness: 1 });
    const stD = M.plain('#6e6b62', { roughness: 1 });
    const vm = M.plain('#c0391f', { roughness: 0.7 });
    const pl = M.plain('#a5402c', { roughness: 0.85 });
    const Tilak = ({ y, rr = 0.11 }) => <Cyl rt={rr} rb={rr} h={0.035} p={[0, y, 0]} m={vm} seg={10} />;
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        {round ? <Cyl rt={0.34} rb={0.42} h={0.36} p={[0, 0.18, 0]} m={pl} seg={14} /> : <Box s={[0.7, 0.36, 0.7]} p={[0, 0.18, 0]} m={pl} />}
        <Cyl rt={0.3} h={0.03} p={[0, 0.375, 0]} m={vm} seg={14} />
        {k === 'ganesh' ? (
          <group position={[0, 0.38, 0]}>
            <Ball rad={0.22} sc={[1, 1.1, 0.9]} p={[0, 0.3, 0]} m={st} /><Ball rad={0.14} p={[0, 0.62, 0.03]} m={st} />
            <Cyl rt={0.03} rb={0.045} h={0.28} p={[0, 0.48, 0.18]} r={[0.5, 0, 0]} m={st} seg={6} />
            {[-1, 1].map((q) => <Ball key={q} rad={0.09} sc={[0.4, 1, 1]} p={[q * 0.14, 0.62, 0]} m={stD} />)}
            <mesh position={[0, 0.82, 0]} material={stD}><coneGeometry args={[0.08, 0.14, 8]} /></mesh>
            <Tilak y={0.3} rr={0.2} />
          </group>
        ) : k === 'hanuman' ? (
          <group position={[0, 0.38, 0]}>
            <Cyl rt={0.1} rb={0.17} h={0.55} p={[0, 0.28, 0]} m={st} seg={8} /><Ball rad={0.11} p={[0, 0.66, 0]} m={st} />
            <Box s={[0.07, 0.42, 0.07]} p={[0.17, 0.78, 0.04]} r={[0, 0, -0.25]} m={st} />
            <Cyl rt={0.025} h={0.62} p={[0.24, 1.1, 0.04]} m={stD} seg={6} /><Ball rad={0.1} p={[0.24, 1.46, 0.04]} m={stD} />
            <Box s={[0.07, 0.35, 0.07]} p={[-0.18, 0.42, 0.08]} r={[0.5, 0, 0.2]} m={st} />
            <Cyl rt={0.02} rb={0.02} h={0.4} p={[-0.1, 0.1, -0.2]} r={[0.9, 0, 0]} m={st} seg={6} />
            <Tilak y={0.52} />
          </group>
        ) : k === 'indra' ? (
          <group position={[0, 0.38, 0]}>
            <Ball rad={0.3} sc={[0.9, 0.8, 1.5]} p={[0, 0.5, 0]} m={st} /><Ball rad={0.2} p={[0, 0.62, 0.45]} m={st} />
            <Cyl rt={0.04} rb={0.07} h={0.4} p={[0, 0.35, 0.62]} r={[0.2, 0, 0]} m={st} seg={6} />
            {[-1, 1].map((a) => <Ball key={a} rad={0.12} sc={[0.3, 1, 1]} p={[a * 0.2, 0.64, 0.42]} m={stD} />)}
            {[[-0.18, -0.35], [0.18, -0.35], [-0.18, 0.3], [0.18, 0.3]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.07} h={0.4} p={[x, 0.2, z]} m={st} seg={6} />)}
            <Cyl rt={0.06} rb={0.1} h={0.35} p={[0, 0.95, 0.05]} m={stD} seg={8} /><Ball rad={0.08} p={[0, 1.2, 0.05]} m={stD} />
          </group>
        ) : (
          <group position={[0, 0.38, 0]}>
            <Cyl rt={0.1} rb={0.18} h={0.6} p={[0, 0.3, 0]} m={st} seg={8} /><Ball rad={0.1} p={[0, 0.7, 0]} m={st} />
            <mesh position={[0, 0.88, 0]} material={stD}><coneGeometry args={[0.07, 0.18, 8]} /></mesh>
            <Tilak y={0.74} rr={0.085} /><Tilak y={0.4} rr={0.15} />
            {k === 'durga' && (
              <>
                {[0, 1, 2, 3].map((n) => [-1, 1].map((q) => <Box key={`${n}${q}`} s={[0.045, 0.38, 0.045]} p={[q * (0.17 + n * 0.035), 0.62 + n * 0.1, 0.04]} r={[0, 0, q * (0.5 + n * 0.28)]} m={st} />))}
                <Cyl rt={0.4} h={0.04} p={[0, 0.7, -0.12]} r={[Math.PI / 2, 0, 0]} m={stD} seg={16} />
                <Box s={[0.04, 0.3, 0.04]} p={[0.46, 1.0, 0.04]} m={stD} />
              </>
            )}
            {k === 'krishna' && <Box s={[0.04, 0.5, 0.04]} p={[0.15, 0.56, 0.08]} r={[0, 0, 0.7]} m={stD} />}
          </group>
        )}
      </group>
    );
  }
  function Narayan({ p }) {
    const M = useM(); const st = M.plain('#6e6c64', { roughness: 1 }); const stD = M.plain('#5a5951', { roughness: 1 });
    return (
      <group position={p} scale={1.25}>
        <Box s={[2.0, 0.22, 0.95]} p={[0, 0.11, 0]} m={M.plain('#b9b4a8', { roughness: 1 })} />
        <mesh position={[0.05, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} material={st} castShadow><capsuleGeometry args={[0.15, 1.15, 4, 10]} /></mesh>
        <Ball rad={0.15} p={[-0.78, 0.5, 0]} m={st} />
        <mesh position={[-0.78, 0.68, 0]} material={stD}><coneGeometry args={[0.1, 0.22, 8]} /></mesh>
        <Box s={[0.08, 0.34, 0.08]} p={[-0.42, 0.58, 0.14]} r={[0, 0, 0.5]} m={st} />
        <Box s={[0.08, 0.3, 0.08]} p={[0.0, 0.58, 0.16]} r={[0, 0, 0.2]} m={st} />
        {[-2, -1, 0, 1, 2].map((i) => <Ball key={i} rad={0.1} sc={[0.8, 1, 0.5]} p={[-0.9, 0.85 + (2 - Math.abs(i)) * 0.05, i * 0.12]} m={stD} />)}
        <Cyl rt={0.02} h={0.3} p={[0.5, 0.2, 0.3]} m={stD} seg={6} />
      </group>
    );
  }

  function Pavilion({ p, r = 0 }) {
    const M = useM(); const lat = useLat('#7d4e2b');
    const moss = useTile('#5a6340', 9);
    const W = 3.0; const D = 2.6;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[W + 0.5, 0.18, D + 0.5]} p={[0, 0.09, 0]} m={M.plain('#b9b4a8', { roughness: 1 })} />
        <Box s={[W + 0.2, 0.18, D + 0.2]} p={[0, 0.25, 0]} m={M.mat('brick', 2, 1, { color: '#e0b8a2' })} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.16, 1.4, 0.16]} p={[a * W / 2, 1.04, b * D / 2]} m={M.dark} />)}
        {[[0, D / 2, W], [0, -D / 2, W], [W / 2, 0, D], [-W / 2, 0, D]].map(([x, z, L], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}>
            <mesh position={[0, 0.9, 0]} material={lat}><planeGeometry args={[L - 0.2, 0.95]} /></mesh>
            <Box s={[L, 0.14, 0.1]} p={[0, 0.42, 0]} m={M.dark} /><Box s={[L, 0.12, 0.1]} p={[0, 1.4, 0]} m={M.dark} />
          </group>
        ))}
        <Box s={[W + 0.2, 0.1, D + 0.2]} p={[0, 1.5, 0]} m={M.dark} />
        <Roof w={W + 1.0} d={D + 0.9} h={0.55} y={1.55} m={moss} sag={1.2} lift={0.12} />
        <Gajur y={2.1} s={0.35} />
      </group>
    );
  }
  function Umbrella({ p, r = 0 }) {
    const M = useM(); const bl = M.plain('#7a8da3', { roughness: 0.5, metalness: 0.3, side: DS });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.4, 0.14, 1.4]} p={[0, 0.07, 0]} m={M.mat('stone', 1, 1, { color: '#c9c5bb' })} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.06, 1.7, 0.06]} p={[a * 0.55, 0.95, b * 0.55]} m={M.plain('#8e8a82')} />)}
        <mesh position={[0, 2.12, 0]} rotation={[0, Math.PI / 4, 0]} material={bl} castShadow><coneGeometry args={[1.05, 0.55, 4]} /></mesh>
        <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} material={bl} castShadow><coneGeometry args={[0.62, 0.42, 4]} /></mesh>
        <Cyl rt={0.02} h={0.4} p={[0, 2.95, 0]} m={M.plain('#8e8a82')} seg={6} />
      </group>
    );
  }
  function WhiteChaitya({ p, s = 0.6 }) {
    const M = useM(); const w = M.plain('#f1eee6', { roughness: 0.85 });
    return (
      <group position={p} scale={s}>
        <Box s={[0.8, 0.3, 0.8]} p={[0, 0.15, 0]} m={w} /><Box s={[0.6, 0.22, 0.6]} p={[0, 0.41, 0]} m={w} />
        <mesh position={[0, 0.52, 0]} material={w} castShadow><sphereGeometry args={[0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.2, 0.16, 0.2]} p={[0, 0.9, 0]} m={w} />
        <mesh position={[0, 1.15, 0]} material={w}><coneGeometry args={[0.12, 0.4, 10]} /></mesh>
        <Ball rad={0.05} p={[0, 1.4, 0]} m={M.gold} />
      </group>
    );
  }
  function RedShrine({ p, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.5, 0.2, 1.5]} p={[0, 0.1, 0]} m={M.mat('stone', 1, 1, { color: '#c9c5bb' })} />
        <Box s={[1.1, 0.95, 1.1]} p={[0, 0.67, 0]} m={M.mat('brick', 1, 1, { color: '#e0b8a2' })} />
        <Box s={[0.4, 0.55, 0.05]} p={[0, 0.55, 0.57]} m={M.dark} />
        <Roof w={1.8} d={1.8} h={0.7} y={1.15} m={M.plain('#a8442e', { roughness: 0.6, metalness: 0.2, side: DS })} sag={1.1} lift={0.1} />
        <Gajur y={1.8} s={0.3} />
      </group>
    );
  }
  function RoundPlatform({ p }) {
    const M = useM(); const br = M.mat('brick', 2, 1, { color: '#e6b4a0' }); const rope = M.plain('#a85a42', { roughness: 0.8 });
    return (
      <group position={p}>
        <Box s={[3.2, 0.06, 2.8]} p={[0, 0.03, 0]} m={M.plain('#a85a42', { roughness: 0.9 })} />
        <Cyl rt={0.62} rb={0.64} h={0.7} p={[0, 0.4, 0]} m={br} seg={28} />
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} material={rope}><torusGeometry args={[0.63, 0.05, 6, 32]} /></mesh>
        <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={rope}><torusGeometry args={[0.64, 0.05, 6, 32]} /></mesh>
        <Ball rad={0.3} sc={[1.3, 0.8, 1.3]} p={[0, 0.92, 0]} m={M.plain('#3f6a2e', { roughness: 1 })} />
        {[-1.1, 1.1].map((x) => (
          <group key={x} position={[x, 0, 0.6]}>
            <Box s={[0.6, 0.7, 0.6]} p={[0, 0.4, 0]} m={br} /><Box s={[0.64, 0.08, 0.64]} p={[0, 0.3, 0]} m={rope} />
          </group>
        ))}
      </group>
    );
  }
  function SmallShrine({ p, r = 0, big = false }) {
    const M = useM(); const tile = useTile('#5a6340', 11);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.9, 0.2, 0.9]} p={[0, 0.1, 0]} m={M.mat('stone', 1, 1, { color: '#a9a69c' })} />
        <Box s={[0.6, 0.55, 0.6]} p={[0, 0.47, 0]} m={M.mat('stone', 1, 1, { color: '#c9c5bb' })} />
        <Roof w={0.95} d={0.95} h={0.4} y={0.74} m={tile} sag={1.2} lift={0.1} />
      </group>
    );
  }

  function FigTree({ p }) {
    const M = useM(); const bark = M.plain('#6b5a48', { roughness: 1 }); const leaf = M.plain('#3f5d30', { roughness: 1 }); const leaf2 = M.plain('#4d6c38', { roughness: 1 });
    return (
      <group position={p}>
        <SmallShrine p={[0, 0, 0]} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 7) * Math.PI * 2; return <Cyl key={i} rt={0.16} rb={0.34} h={1.9} p={[Math.cos(a) * 0.5, 0.95, Math.sin(a) * 0.5]} r={[Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1]} m={bark} seg={6} />; })}
        <Cyl rt={0.7} rb={0.85} h={1.0} p={[0, 2.3, 0]} m={bark} seg={9} />
        {[[0, 3.5, 0, 1.9, 0.62], [1.9, 3.2, 0.5, 1.5, 0.6], [-1.9, 3.3, -0.4, 1.6, 0.6], [0.6, 3.6, -1.8, 1.4, 0.62], [0.3, 3.2, 1.9, 1.4, 0.6], [-0.9, 3.6, 1.2, 1.3, 0.6], [2.6, 3.1, -1.2, 1.1, 0.6], [-2.7, 3.1, 1.0, 1.1, 0.6]].map(([x, y, z, rr, fl], i) => <Ball key={i} rad={rr} sc={[1.15, fl, 1.15]} p={[x, y, z]} m={i % 2 ? leaf2 : leaf} />)}
        {[[1.4, 0.9], [-1.4, 0.8], [0.4, 1.7], [-0.8, -1.5], [1.9, -0.6], [-2.0, -0.2], [0.9, -1.8]].map(([x, z], i) => <Cyl key={i} rt={0.018} rb={0.03} h={2.9 - (i % 3) * 0.3} p={[x, 1.75 + (i % 3) * 0.15, z]} m={M.plain('#5a4838', { roughness: 1 })} seg={4} cast={false} />)}
      </group>
    );
  }

  function GokMain() {
    const M = useM();
    const statues = useMemo(() => {
      const out = []; const kinds = ['deity', 'durga', 'deity', 'ganesh', 'deity', 'hanuman', 'krishna', 'deity', 'indra'];
      const bad = (x, z) => (Math.abs(x) < 4.7 && z > -4.6 && z < 6.4) || (x > -9.3 && x < -4.9 && z > 1.4 && z < 6.2) || (x > 4.4 && x < 7.7 && z > 1.4 && z < 5.6) || (Math.abs(x) < 1.9 && z < -4.3 && z > -7.4) || (x > -7.6 && x < -4.4 && z > -6.4 && z < -3.4) || (x < -9.3 && x > -12.8 && z > 1.6 && z < 5.4) || (x > 9 && z > 1.0 && z < 6) || (x < -10.5 && z < -1);
      let n = 0;
      [[6.2, 15, 170, 0], [8.4, 12, 160, 0.2]].forEach(([R, step, lim, off]) => {
        for (let a = -lim; a <= lim; a += step) {
          const t = ((a + off) * Math.PI) / 180; const x = R * Math.sin(t) * 1.15; const z = R * Math.cos(t) * 0.85 - 0.8;
          if (bad(x, z) || z > 5.2) continue;
          out.push({ p: [x, 0, z], k: kinds[n % kinds.length], r: t + Math.PI + (n % 3) * 0.12, s: 1.15 + (n % 4) * 0.06, round: n % 3 !== 1 }); n += 1;
        }
      });
      [[-3.4, 6.2, 'durga'], [3.3, 6.2, 'hanuman'], [-4.9, 6.6, 'krishna'], [4.6, 6.8, 'indra'], [-5.1, 4.3, 'ganesh'], [5.3, 4.3, 'deity']].forEach(([x, z, k], i) => out.push({ p: [x, 0, z], k, r: 0.1 * (i - 2), s: 1.25, round: i % 2 === 0 }));
      return out;
    }, []);
    return (
      <group>
        <Temple />
        <Frame s={[10.4, TOP * 1.3 + 1.0, 10.4]} p={[0, (TOP * 1.3 + 0.8) / 2, 1]} />
        {/* Nandi sits BEHIND the temple on a raised brick plinth, facing it */}
        <Box s={[2.0, 0.34, 2.2]} p={[0, 0.17, -5.6]} m={M.mat('brick', 1, 1, { color: '#e0b8a2' })} />
        <Box s={[2.14, 0.06, 2.34]} p={[0, 0.36, -5.6]} m={M.plain('#b9b4a8', { roughness: 1 })} />
        <group position={[0, 0.39, -5.6]} scale={1.4}><Nandi p={[0, 0, 0]} face={0} /></group>
        <Pavilion p={[-7.0, 0, 3.8]} r={0.05} />
        <RoundPlatform p={[6.0, 0, 3.4]} />
        {statues.map((q, i) => <Statue key={i} {...q} />)}
        <Narayan p={[0.2, 0, 6.3]} />
        <RedShrine p={[-6.0, 0, -4.8]} r={0.3} />
        <SmallShrine p={[-11.3, 0, 3.4]} r={0.2} />
        <group scale={[1, 0.8, 1]}><FigTree p={[-12, 0, -3]} /></group>
        <Umbrella p={[9.0, 0, 3.4]} r={0.1} /><Umbrella p={[11.0, 0, 4.4]} r={-0.1} />
        <WhiteChaitya p={[12.6, 0, 1.6]} /><WhiteChaitya p={[13.4, 0, 3.0]} s={0.5} /><WhiteChaitya p={[12.3, 0, 3.4]} s={0.45} />
        <Diyo p={[-4.2, 0.2, 6.0]} light /><Diyo p={[7.3, 0.2, 5.0]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function House({ p, r = 0, w = 3.6, d = 3, st = 2, roof = '#a8442e', plaster = false }) {
    const M = useM(); const h = st * 1.25;
    const y = tH(p[0], p[2]);
    return (
      <group position={[p[0], y, p[2]]} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={plaster ? M.plain('#d9c8a8') : M.mat('brick', w / 1.5, h / 1.5, { color: '#f0aa8c' })} />
        {Array.from({ length: st }, (_, k) => [-1, 0, 1].map((q) => <Box key={`${k}${q}`} s={[0.4, 0.5, 0.06]} p={[q * w * 0.28, 0.75 + k * 1.2, d / 2 + 0.01]} m={M.plain('#4a3020')} cast={false} />))}
        <Roof w={w + 0.7} d={d + 0.7} h={0.9} y={h} m={M.plain(roof, { roughness: 0.55, metalness: 0.25, side: DS })} sag={1.1} lift={0.05} />
      </group>
    );
  }

  function Terrain() {
    const geo = useMemo(() => {
      const N = 150; const X = 150; const Z0 = -62; const Z1 = 62;
      const g = new THREE.PlaneGeometry(X, Z1 - Z0, N, N); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const col = []; const c = new THREE.Color(); const c2 = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i) + (Z0 + Z1) / 2; const h = tH(x, z);
        pos.setXYZ(i, x, h, z);
        const n = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.sin(z * 0.27);
        if (z > 4 && z < zc(x) + 10 && h < 0.6) c.set('#7a7566').lerp(c2.set('#566f3e'), sstep((z - zc(x) - HW - 0.3) / 3) * (0.75 + 0.25 * n));
        else if (z < -9 || z > 22) c.set('#2f4a2c').lerp(c2.set('#3f5a37'), n * 0.7).lerp(c2.set('#9fb0a2'), Math.max(sstep((h - 6) / 14) * 0.7, sstep((-z - 22) / 36) * 0.8));
        else c.set('#6f8050').lerp(c2.set('#58703f'), n);
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} flatShading /></mesh>;
  }

  function Forest() {
    const { pines, broads, trunks } = useMemo(() => {
      const R = rng(7); const pines = []; const broads = []; const trunks = [];
      const greens = ['#263d27', '#2f4a2e', '#385534', '#2b4430', '#46603f'];
      let tries = 0;
      while (pines.length + broads.length < 340 && tries < 6000) {
        tries += 1;
        const reg = R();
        let x; let z;
        if (reg < 0.7) { x = (R() - 0.5) * 100; z = -10 - R() * 48; if (R() < 0.5) { x = Math.round(x / 9) * 9 + (R() - 0.5) * 5; } }
        else if (reg < 0.8) { x = (R() - 0.5) * 120; z = 17 + R() * 32; }
        else { x = (R() < 0.5 ? -1 : 1) * (13 + R() * 40); z = -10 + R() * 30; }
        if (x > -11.5 && x < 18.5 && z > -9 && z < 8.5) continue;
        const zr = z - zc(x); if (zr > -6 && zr < 6) continue;
        if (z > -26 && z < -6 && x > -16 && x < 22 && R() < 0.3) continue;
        const y = tH(x, z); const s = 0.8 + R() * 1.0; const col = '#' + new THREE.Color(greens[Math.floor(R() * greens.length)]).lerp(new THREE.Color('#9fb0a2'), Math.min(0.7, Math.max(0, (-z - 20) / 50))).getHexString();
        if (R() < 0.3) pines.push({ p: [x, y + 1.9 * s, z], s: [1.0 * s, 3.8 * s, 1.0 * s], c: col, ry: R() * 6 });
        else { broads.push({ p: [x, y + 2.6 * s, z], s: [1.15 * s, 1.0 * s, 1.15 * s], c: col, ry: R() * 6 }); trunks.push({ p: [x, y + 0.9 * s, z], s: [1.4 * s, 1.8 * s, 1.4 * s] }); }
      }
      return { pines, broads, trunks };
    }, []);
    return (<group><Inst geo={GEO.cone} mat={IM} items={pines} /><Inst geo={GEO.ico} mat={IM} items={broads} /><Inst geo={GEO.trunk} mat={TRM} items={trunks} /></group>);
  }

  function RiverBits() {
    const M = useM();
    const ribbon = useMemo(() => {
      const N = 80; const pos = []; const idx = [];
      for (let i = 0; i <= N; i += 1) { const x = -75 + (150 * i) / N; const c = zc(x); pos.push(x, WY, c - HW, x, WY, c + HW); }
      for (let i = 0; i < N; i += 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    }, []);
    const rocks = useMemo(() => { const R = rng(3); return Array.from({ length: 30 }, (_, i) => { const x = -34 + R() * 68; const zz = i < 12 ? zc(x) + (R() - 0.5) * 5 : zc(x) + HW + 0.5 + R() * 5; return { p: [x, i < 12 ? WY - 0.05 : tH(x, zz) + 0.05, zz], s: [0.3 + R() * 0.5, 0.2 + R() * 0.3, 0.3 + R() * 0.5], c: i % 2 ? '#8a857a' : '#a39e92' }; }); }, []);
    const stoneF = M.plain('#877f72', { roughness: 1 });
    const steps = Array.from({ length: 6 }, (_, k) => ({ z: 5.75 + k * 0.5, top: -0.3 * (k + 1) }));
    return (
      <group>
        <mesh geometry={ribbon}><meshStandardMaterial color="#4f7a68" metalness={0.1} roughness={0.25} side={DS} transparent opacity={0.92} /></mesh>
        <Inst geo={GEO.ico} mat={IM} items={rocks} />
        {/* ghat: six stone-flag treads, 0.3 m high x 0.5 m deep */}
        {steps.map((q, k) => (
          <group key={k}>
            <Box s={[19, q.top + 2.0, 0.5]} p={[3.5, (q.top - 2.0) / 2, q.z]} m={k % 2 ? stoneF : M.plain('#9b9587', { roughness: 1 })} cast={false} />
            <Box s={[19, 0.03, 0.06]} p={[3.5, q.top + 0.01, q.z - 0.22]} m={M.plain('#8d877a', { roughness: 1 })} cast={false} />
          </group>
        ))}
        {[-6.15, 13.15].map((x) => <Box key={x} s={[0.3, 0.5, 3.2]} p={[x, -0.45, 7.1]} m={M.plain('#8d8779', { roughness: 1 })} cast={false} />)}
        <Box s={[19, 0.1, 0.25]} p={[3.5, 0.04, 5.4]} m={M.plain('#8d8779', { roughness: 1 })} cast={false} />
      </group>
    );
  }

  function Bridge() {
    const M = useM(); const x = -17; const c = zc(x);
    const z0 = c - 4.4; const z1 = c + 4.4; const dy = 1.0; const ty = 3.0;
    const cable = useMemo(() => {
      const pts = []; for (let i = 0; i <= 16; i += 1) { const t = i / 16; pts.push(new THREE.Vector3(0, ty - (ty - dy - 0.5) * 4 * t * (1 - t), z0 + (z1 - z0) * t)); }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 5, false);
    }, [z0, z1]);
    const metal = M.plain('#7e8388', { metalness: 0.6, roughness: 0.4 });
    return (
      <group position={[x, 0, 0]}>
        <Box s={[0.9, 0.06, z1 - z0]} p={[0, dy, (z0 + z1) / 2]} m={M.plain('#6a5238')} />
        {[z0, z1].map((z) => (
          <group key={z}>
            <Box s={[1.8, dy + 1.0, 1.3]} p={[0, (dy - 1.0) / 2 - 0.05, z]} m={M.plain('#b9b4a8', { roughness: 1 })} />
            {[-0.5, 0.5].map((s) => <Box key={s} s={[0.12, ty - dy, 0.12]} p={[s, (ty + dy) / 2, z]} m={metal} />)}
            <Box s={[1.2, 0.1, 0.12]} p={[0, ty, z]} m={metal} />
          </group>
        ))}
        {[-0.5, 0.5].map((s) => (
          <group key={s} position={[s, 0, 0]}>
            <mesh geometry={cable} material={metal} />
            {Array.from({ length: 9 }, (_, i) => { const t = (i + 1) / 10; const hy = ty - (ty - dy - 0.5) * 4 * t * (1 - t); return <Box key={i} s={[0.02, hy - dy, 0.02]} p={[0, (hy + dy) / 2, z0 + (z1 - z0) * t]} m={metal} cast={false} />; })}
          </group>
        ))}
      </group>
    );
  }

  function GokEnv() {
    const M = useM();
    return (
      <group>
        <Terrain />
        {/* flagged stone courtyard sloping to the river */}
        <Box s={[30, 0.5, 13.9]} p={[3, -0.27, -1.45]} m={M.mat('stone', 15, 8, { color: '#ffffff' })} cast={false} />
        <Forest />
        {[[-30, 0.9, 30], [8, 1.1, 36], [42, 0.8, 28]].map(([x, k, r], i) => <Ball key={'rg' + i} rad={r} sc={[1.6, 0.45 * k, 0.9]} p={[x, 4 + i, -64]} m={M.plain(i === 1 ? '#b7c4bb' : '#aebdb2', { roughness: 1 })} />)}
        <RiverBits />
        <Bridge />
        {/* red-brick and tin-roofed buildings behind-left, a big red-roofed house on the right */}
        <House p={[-14, 0, -8]} r={0.2} w={4.2} d={3.2} st={3} />
        <House p={[-18.5, 0, -5]} r={-0.1} w={3.6} d={3} st={2} roof="#9e3d2a" />
        <House p={[-9.5, 0, -9.5]} r={0.1} w={3.4} d={2.8} st={2} roof="#b0563c" />
        <House p={[-21, 0, 1]} r={0.4} w={3.4} d={3} st={2} roof="#a8442e" plaster />
        <House p={[21.5, 0, -2]} r={-0.15} w={5.2} d={3.4} st={2} roof="#b24a34" />
        <House p={[22.5, 0, 2.5]} r={0.1} w={3} d={2.6} st={1} roof="#8f5a3c" />
        <House p={[12, 0, -9.8]} r={0} w={3.6} d={2.8} st={2} roof="#a8442e" />
        {/* a few big trees among the courtyard */}
        {[[-13.5, -5], [16.5, 3.5], [12, -11], [-3, -12]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.25} rb={0.4} h={2.6} p={[0, 1.3, 0]} m={M.plain('#5b4635')} seg={8} />
            <Ball rad={1.9} p={[0, 3.8, 0]} m={M.plain('#47683a', { roughness: 1 })} /><Ball rad={1.3} p={[1.0, 3.2, 0.6]} m={M.plain('#3d5d32', { roughness: 1 })} />
          </group>
        ))}
        <pointLight position={[0, 1.4, 3.6]} intensity={0.7} distance={5} color="#ffb35a" />
      </group>
    );
  }

  return { 'gokarneshwor-mahadev': { Main: GokMain, Env: GokEnv } };
}
