/* Swargadwari (Bhingri, Pyuthan): a humble hilltop ashram on a ridge crest, ~2,100 m.
   Whitewashed two-storey, two-roof-stage temple with grey slate roofs and one small gold pinnacle at the back of a bare tan
   courtyard; pink shrines (a pink two-stage mini-pagoda + low pink shrines) flank it; a light metal railing, then a rough
   dry-stone boundary wall across the foreground. Palms, bamboo flag poles with red flags, a trident, a wire overhead.
   Two-storey white ashram house with red timber columns/balcony/shutters at the right. Yagya kunda shed, Mahaprabhu statue,
   banyan, cows. Ridge falls steeply into forested slopes; scattered village roofs; hazy ridges + snow range far north.
   Units ~ 2 m. Layout is estimated (no measured plan is published). Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Trident, Diyo, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- terrain: flat ridge crest, steep drop on all sides, far ridges rise ---------- */
  const RX = 26, RZ = 13, RZF = 9.5;
  const qf = (x, z) => Math.hypot(x / RX, z / (z > 0 ? RZF : RZ));
  function hgt(x, z) {
    const q = qf(x, z);
    let h = 0;
    if (q < 1) h = Math.sin(x * 0.4) * Math.cos(z * 0.5) * 0.06;
    else { const d = (q - 1) * (z > 0 ? RZF : RZ); h = -Math.min(d * 1.15, 13) - Math.sin(x * 0.6 + z * 0.3) * 0.5 * Math.min(1, d / 4); }
    const r = Math.hypot(x, z);
    if (r > 40) h += (r - 40) * 0.3;
    return h;
  }

  const PINK = '#e3a5b0', WHITE = '#f2f0ea', SLATE = '#6e6a63', RED = '#b5302a';

  /* ---------- helpers ---------- */
  function Wire({ a, b, n = 8, sag = 0.25 }) {
    const M = useM();
    const m = M.plain('#2b2b2b', { roughness: 0.7 });
    const segs = [];
    for (let i = 0; i < n; i += 1) {
      const t0 = i / n, t1 = (i + 1) / n;
      const p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0 - Math.sin(t0 * Math.PI) * sag, a[2] + (b[2] - a[2]) * t0];
      const p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1 - Math.sin(t1 * Math.PI) * sag, a[2] + (b[2] - a[2]) * t1];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2];
      const L = Math.hypot(dx, dy, dz);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
      const e = new THREE.Euler().setFromQuaternion(q);
      segs.push(<mesh key={i} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2]} rotation={e} material={m}><cylinderGeometry args={[0.008, 0.008, L, 3]} /></mesh>);
    }
    return <group>{segs}</group>;
  }

  function Palm({ p, h = 6, lean = 0, s = 1 }) {
    const M = useM();
    const trunk = M.plain('#7b6a52', { roughness: 1 });
    const leaf = M.plain('#4f7d3a', { roughness: 0.9 });
    const leaf2 = M.plain('#5f8f44', { roughness: 0.9 });
    return (
      <group position={p} scale={s}>
        <group rotation={[0, 0, lean]}>
          <Cyl rt={0.09} rb={0.14} h={h} p={[0, h / 2, 0]} m={trunk} seg={7} />
          {[0, 0.5, 1, 1.5].map((k) => <Cyl key={k} rt={0.15} rb={0.15} h={0.03} p={[0, 0.5 + k * 0.4, 0]} m={trunk} seg={7} />)}
          <group position={[0, h, 0]}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.15;
              const up = 1.5 + (i % 3) * 0.2; /* rotation about x tilts +z frond upward-negative; use as elevation below */
              return (
                <group key={i} rotation={[0, a, 0]}>
                  <group rotation={[-(0.55 + (i % 3) * 0.12), 0, 0]}>
                    <Box s={[0.34, 0.03, 1.1]} p={[0, 0, 0.55]} m={i % 2 ? leaf : leaf2} cast={false} />
                    <group position={[0, 0, 1.1]} rotation={[0.3 + up * 0.55, 0, 0]}>
                      <Box s={[0.28, 0.025, 0.95]} p={[0, 0, 0.47]} m={i % 2 ? leaf2 : leaf} cast={false} />
                    </group>
                  </group>
                </group>
              );
            })}
            <Ball rad={0.2} p={[0, 0.05, 0]} m={M.plain('#5b6a35')} />
          </group>
        </group>
      </group>
    );
  }

  function Bamboo({ p, h = 7, flag = true, tilt = 0.03, c = '#c0222a' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, 0, tilt]}>
        <Cyl rt={0.025} rb={0.05} h={h} p={[0, h / 2, 0]} m={M.plain('#b9a050', { roughness: 0.8 })} seg={6} />
        {flag && <Box s={[0.5, 0.3, 0.015]} p={[0.27, h - 0.25, 0]} m={M.plain(c, { roughness: 0.9 })} cast={false} />}
        {flag && <Box s={[0.35, 0.22, 0.015]} p={[0.2, h - 0.7, 0]} m={M.plain('#e8e4dc', { roughness: 0.9 })} cast={false} />}
      </group>
    );
  }

  /* a small pink one-storey shrine with a grey hipped roof */
  function PinkShrine({ p, r = 0, w = 1.7, d = 1.5, h = 1.15, door = true }) {
    const M = useM();
    const pink = M.plain(PINK, { roughness: 0.9 });
    const slate = M.plain('#807b73', { roughness: 0.7, metalness: 0.2 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.12, 0.14, d + 0.12]} p={[0, 0.07, 0]} m={M.plain('#cfc7b8', { roughness: 1 })} />
        <Box s={[w, h, d]} p={[0, 0.14 + h / 2, 0]} m={pink} />
        <Box s={[w + 0.04, 0.07, d + 0.04]} p={[0, 0.14 + h * 0.88, 0]} m={M.plain('#c77d8d')} cast={false} />
        {door && <Box s={[0.5, 0.75, 0.03]} p={[0, 0.14 + 0.38, d / 2 + 0.01]} m={M.plain('#5a2f2a')} cast={false} />}
        <Roof w={w + 0.6} d={d + 0.6} h={0.55} y={0.14 + h} m={slate} sag={1} lift={0} fascia={false} />
        <Ball rad={0.06} p={[0, 0.14 + h + 0.55, 0]} m={M.gold} />
      </group>
    );
  }

  /* pink two-stage mini pagoda with a gold finial (~5 m = 2.5 units) */
  function PinkPagoda({ p }) {
    const M = useM();
    const pink = M.plain(PINK, { roughness: 0.9 });
    const slate = M.plain('#807b73', { roughness: 0.7, metalness: 0.2 });
    return (
      <group position={p}>
        <Box s={[2.0, 0.16, 2.0]} p={[0, 0.08, 0]} m={M.plain('#cfc7b8', { roughness: 1 })} />
        <Box s={[1.5, 1.0, 1.5]} p={[0, 0.66, 0]} m={pink} />
        <Box s={[0.46, 0.7, 0.03]} p={[0, 0.51, 0.77]} m={M.plain('#5a2f2a')} cast={false} />
        <Roof w={2.3} d={2.3} h={0.5} y={1.16} m={slate} sag={1.1} lift={0.04} fascia={false} />
        <Box s={[0.95, 0.65, 0.95]} p={[0, 1.55, 0]} m={pink} />
        <Box s={[0.3, 0.3, 0.03]} p={[0, 1.58, 0.49]} m={M.plain('#6a3a30')} cast={false} />
        <Roof w={1.7} d={1.7} h={0.5} y={1.88} m={slate} sag={1.1} lift={0.04} fascia={false} />
        <Cyl rt={0.03} rb={0.1} h={0.32} p={[0, 2.54, 0]} m={M.gold} seg={8} />
        <Ball rad={0.1} p={[0, 2.46, 0]} m={M.gold} />
        <Cyl rt={0.012} h={0.2} p={[0, 2.8, 0]} m={M.gold} seg={5} />
        <Box s={[0.28, 0.18, 0.012]} p={[0.17, 2.7, 0]} m={M.plain('#c0222a')} cast={false} />
      </group>
    );
  }

  /* ---------- the main white two-storey, two-roof-stage temple ---------- */
  function WhiteTemple({ p }) {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.85 });
    const slate = M.plain('#85807a', { roughness: 0.7, metalness: 0.2 });
    const trim = M.plain('#d9d4c6', { roughness: 0.9 });
    const door = M.plain('#5b3a28');
    const glass = M.plain('#3a4a58');
    const UX = 0;
    return (
      <group position={p}>
        <Box s={[6.6, 0.3, 4.2]} p={[0, 0.15, 0]} m={M.plain('#cbc3b3', { roughness: 1 })} />
        {/* long low wing */}
        <Box s={[6.0, 1.9, 3.6]} p={[0, 1.25, 0]} m={white} />
        <Box s={[6.1, 0.12, 3.7]} p={[0, 2.16, 0]} m={trim} cast={false} />
        {[-2.4, -1.5, 1.5, 2.4].map((x) => (
          <group key={x}>
            <Box s={[0.5, 0.62, 0.04]} p={[x, 1.5, 1.82]} m={glass} cast={false} />
            <Box s={[0.62, 0.06, 0.07]} p={[x, 1.85, 1.84]} m={trim} cast={false} />
          </group>
        ))}
        <Box s={[0.9, 1.25, 0.05]} p={[0, 0.93, 1.82]} m={door} cast={false} />
        <Box s={[1.1, 0.1, 0.1]} p={[0, 1.6, 1.84]} m={trim} cast={false} />
        {/* long hipped slate roof */}
        <Roof w={7} d={4.6} h={0.8} y={2.2} m={slate} sag={1.05} lift={0.03} fascia={false} />
        {/* upper stage */}
        <Box s={[2.0, 1.8, 2.0]} p={[UX, 3.4, 0]} m={white} />
        <Box s={[2.1, 0.1, 2.1]} p={[UX, 4.34, 0]} m={trim} cast={false} />
        {[-0.5, 0.5].map((x) => <Box key={x} s={[0.4, 0.7, 0.04]} p={[UX + x, 3.5, 1.01]} m={glass} cast={false} />)}
        <Roof w={3.0} d={3.0} h={1.1} y={4.3} m={slate} sag={1.1} lift={0.04} fascia={false} />
        {/* ONE small gold pinnacle */}
        <Cyl rt={0.07} rb={0.12} h={0.14} p={[UX, 5.45, 0]} m={M.gold} seg={8} />
        <Ball rad={0.17} p={[UX, 5.6, 0]} m={M.gold} />
        <Cyl rt={0.01} rb={0.05} h={0.5} p={[UX, 5.9, 0]} m={M.gold} seg={6} />
        <Diyo p={[0.8, 0.3, 2.35]} light />
        <Diyo p={[-0.8, 0.3, 2.35]} />
      </group>
    );
  }

  /* ---------- two-storey white ashram house, red timber ---------- */
  function AshramHouse({ p, r = 0 }) {
    const M = useM();
    const white = M.plain('#f3f0e8', { roughness: 0.9 });
    const red = M.plain(RED, { roughness: 0.75 });
    const rust = M.plain('#7a4a3a', { roughness: 0.7, metalness: 0.25 });
    const dark = M.plain('#2c2420');
    const W = 5.8, D = 3.6, g = 1.4, u = 1.35;
    const glow = <meshBasicMaterial color="#ffd27a" toneMapped={false} />;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[W + 0.2, 0.2, D + 0.2]} p={[0, 0.1, 0]} m={M.plain('#bdb5a5', { roughness: 1 })} />
        {/* ground floor: white walls, open verandah with red columns in the middle bays */}
        <Box s={[W, g, D]} p={[0, 0.2 + g / 2, -0.2]} m={white} />
        <Box s={[2.9, g - 0.15, 0.6]} p={[0, 0.2 + (g - 0.15) / 2, D / 2 - 0.25]} m={dark} cast={false} />
        {[-1.4, -0.5, 0.5, 1.4].map((x) => <Box key={x} s={[0.13, g, 0.13]} p={[x, 0.2 + g / 2, D / 2 + 0.05]} m={red} />)}
        <Box s={[3.2, 0.14, 0.2]} p={[0, 0.2 + g, D / 2 + 0.05]} m={red} />
        {[-2.35, 2.35].map((x) => <Box key={x} s={[0.7, 0.8, 0.03]} p={[x, 0.2 + g * 0.55, D / 2 - 0.19]} m={M.plain('#3a4a58')} cast={false} />)}
        {/* upper floor */}
        <Box s={[W - 0.2, u, D - 0.4]} p={[0, 0.2 + g + u / 2, -0.2]} m={white} />
        <Box s={[W + 0.1, 0.1, D]} p={[0, 0.2 + g + 0.02, -0.05]} m={red} cast={false} />
        {/* projecting red timber balcony */}
        <Box s={[3.1, 0.1, 0.95]} p={[0, 0.2 + g + 0.08, D / 2 + 0.2]} m={red} />
        {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((x) => <Box key={x} s={[0.06, 0.5, 0.06]} p={[x, 0.2 + g + 0.38, D / 2 + 0.62]} m={red} cast={false} />)}
        {[-1, 1].map((s) => <Box key={s} s={[0.06, 0.5, 0.9]} p={[s * 1.5, 0.2 + g + 0.38, D / 2 + 0.2]} m={red} cast={false} />)}
        <Box s={[3.1, 0.07, 0.07]} p={[0, 0.2 + g + 0.65, D / 2 + 0.64]} m={red} cast={false} />
        {[-1.5, 1.5].map((x) => <Box key={x} s={[0.11, 1.35, 0.11]} p={[x, 0.2 + g + 0.7, D / 2 + 0.62]} m={red} />)}
        {/* red louvred shutters */}
        {[-2.2, -0.75, 0.75, 2.2].map((x, i) => (
          <group key={i} position={[x, 0.2 + g + 0.72, D / 2 - 0.45]}>
            <Box s={[0.55, 0.7, 0.05]} p={[0, 0, 0]} m={red} cast={false} />
            {[-0.22, -0.11, 0, 0.11, 0.22].map((y) => <Box key={y} s={[0.5, 0.02, 0.07]} p={[0, y, 0.02]} m={dark} cast={false} />)}
          </group>
        ))}
        <mesh position={[0, 0.2 + g + 0.72, D / 2 - 0.41]}><planeGeometry args={[0.5, 0.65]} />{glow}</mesh>
        {/* hipped rust roof + small attic gable */}
        <Roof w={W + 0.9} d={D + 0.9} h={1.15} y={0.2 + g + u} m={rust} sag={1} lift={0} fascia={false} />
        <Box s={[0.8, 0.5, 0.8]} p={[0, 0.2 + g + u + 0.75, 0.2]} m={white} />
        <Roof w={1.3} d={1.3} h={0.45} y={0.2 + g + u + 1.0} m={rust} sag={1} lift={0} fascia={false} />
        <Box s={[0.1, 0.25, 0.1]} p={[-1.6, 0.2 + g + u + 1.1, -0.6]} m={M.plain('#a69a8c')} />
      </group>
    );
  }

  function YagyaKunda({ p }) {
    const M = useM();
    const rust = M.plain('#7a4a3a', { roughness: 0.7, metalness: 0.2 });
    return (
      <group position={p}>
        <Box s={[2.2, 0.18, 2.2]} p={[0, 0.09, 0]} m={M.plain('#bdb5a5', { roughness: 1 })} />
        {[[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]].map(([x, z], i) => <Box key={i} s={[0.1, 1.5, 0.1]} p={[x, 0.93, z]} m={M.plain('#7a5236')} />)}
        <Box s={[0.8, 0.28, 0.8]} p={[0, 0.32, 0]} m={M.plain('#9b4a38', { roughness: 1 })} />
        <mesh position={[0, 0.55, 0]}><coneGeometry args={[0.28, 0.42, 7]} /><meshBasicMaterial color="#ff9b3a" toneMapped={false} /></mesh>
        <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.16, 0.34, 6]} /><meshBasicMaterial color="#ffd86a" toneMapped={false} /></mesh>
        <Roof w={2.6} d={2.6} h={0.65} y={1.68} m={rust} sag={1} lift={0} fascia={false} />
        <pointLight position={[0, 0.8, 0]} intensity={1.4} distance={4} color="#ff9a4a" />
      </group>
    );
  }

  function Statue({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[0.9, 0.3, 0.9]} p={[0, 0.15, 0]} m={M.plain('#e6e0d2', { roughness: 0.95 })} />
        <Box s={[0.65, 0.55, 0.65]} p={[0, 0.58, 0]} m={M.plain('#f2f0ea', { roughness: 0.9 })} />
        <Cyl rt={0.2} rb={0.34} h={1.25} p={[0, 1.5, 0]} m={M.plain('#e8862a', { roughness: 0.9 })} seg={10} />
        <Ball rad={0.17} p={[0, 2.3, 0]} m={M.plain('#c98c62')} />
        <Cyl rt={0.1} rb={0.15} h={0.25} p={[0, 2.08, 0.06]} m={M.plain('#f4f1ea')} seg={8} />
        <Box s={[0.14, 0.9, 0.12]} p={[0.28, 1.5, 0.05]} r={[0, 0, -0.12]} m={M.plain('#e8862a')} cast={false} />
        <Box s={[0.14, 0.9, 0.12]} p={[-0.28, 1.5, 0.05]} r={[0, 0, 0.12]} m={M.plain('#e8862a')} cast={false} />
      </group>
    );
  }

  function Cow({ p, r = 0, c = '#efe6d6', patch }) {
    const M = useM();
    const body = M.plain(c, { roughness: 1 });
    const pt = M.plain(patch || c, { roughness: 1 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={0.9}>
        <Box s={[0.95, 0.42, 0.4]} p={[0, 0.58, 0]} m={body} />
        <Box s={[0.35, 0.3, 0.38]} p={[-0.2, 0.62, 0.01]} m={pt} cast={false} />
        <Box s={[0.28, 0.3, 0.3]} p={[0.58, 0.68, 0]} r={[0, 0, -0.3]} m={body} />
        <Box s={[0.12, 0.12, 0.28]} p={[0.74, 0.58, 0]} m={M.plain('#caa28a')} cast={false} />
        {[[-0.35, -0.14], [-0.35, 0.14], [0.35, -0.14], [0.35, 0.14]].map(([x, z], i) => <Box key={i} s={[0.07, 0.4, 0.07]} p={[x, 0.2, z]} m={body} cast={false} />)}
        <Box s={[0.04, 0.04, 0.1]} p={[0.62, 0.86, 0.1]} m={M.plain('#e8e4dc')} cast={false} />
        <Box s={[0.04, 0.04, 0.1]} p={[0.62, 0.86, -0.1]} m={M.plain('#e8e4dc')} cast={false} />
        <Box s={[0.04, 0.3, 0.04]} p={[-0.5, 0.5, 0]} m={body} cast={false} />
      </group>
    );
  }

  function CowShed({ p, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[3.2, 0.9, 0.2]} p={[0, 0.45, -1.0]} m={M.mat('rock', 2, 1, { color: '#a89c88' })} />
        <Box s={[0.2, 0.9, 2.0]} p={[-1.6, 0.45, 0]} m={M.mat('rock', 1, 1, { color: '#a89c88' })} />
        {[[-1.5, 0.9], [1.5, 0.9], [1.5, -0.9], [-1.5, -0.9]].map(([x, z], i) => <Box key={i} s={[0.1, 1.4, 0.1]} p={[x, 0.7, z]} m={M.plain('#6a4a30')} />)}
        <Roof w={3.6} d={2.6} h={0.55} y={1.4} m={M.plain('#7a7570', { roughness: 0.6, metalness: 0.35 })} sag={1} lift={0} fascia={false} />
      </group>
    );
  }

  function Banyan({ p }) {
    const M = useM();
    const bark = M.plain('#6b5a48', { roughness: 1 });
    const leaf = M.plain('#2f5c2d', { roughness: 1 });
    const leaf2 = M.plain('#3d6e34', { roughness: 1 });
    return (
      <group position={p}>
        <Cyl rt={0.35} rb={0.6} h={2.2} p={[0, 1.1, 0]} m={bark} seg={9} />
        {[[0.7, 0.6], [-0.65, 0.5], [0.2, -0.75], [-0.3, 0.8]].map(([x, z], i) => <Cyl key={i} rt={0.07} rb={0.1} h={2.6} p={[x * 1.6, 1.3, z * 1.6]} m={bark} seg={5} />)}
        <Ball rad={2.1} p={[0, 3.5, 0]} sc={[1.3, 0.8, 1.3]} m={leaf} />
        <Ball rad={1.5} p={[1.9, 3.1, 0.6]} sc={[1.1, 0.75, 1.1]} m={leaf2} />
        <Ball rad={1.5} p={[-1.9, 3.0, -0.4]} sc={[1.1, 0.75, 1.1]} m={leaf2} />
        <Ball rad={1.3} p={[0.3, 3.9, -1.7]} sc={[1.1, 0.8, 1.1]} m={leaf} />
      </group>
    );
  }

  /* dry-stone boundary wall: rough grey-brown rubble in 3 offset courses of irregular stones */
  function StoneWall({ a, b, h = 1.05, t = 0.9, seed = 1 }) {
    const M = useM();
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz), ang = Math.atan2(dx, dz) - Math.PI / 2;
    const core = M.plain('#6f665a', { roughness: 1 });
    const mats = [M.plain('#8a7f6e', { roughness: 1 }), M.plain('#7d7364', { roughness: 1 }), M.plain('#948876', { roughness: 1 }), M.plain('#6f6659', { roughness: 1 })];
    const courses = 3, ch = h / courses;
    const stones = [];
    for (let c = 0; c < courses; c += 1) {
      let x = -L / 2 - (c % 2) * 0.35;
      let i = 0;
      while (x < L / 2 - 0.1) {
        const w = 0.35 + rnd(c * 97 + i * 3 + seed * 11) * 0.55, hh = 0.3 + rnd(c * 31 + i + seed * 5) * 0.2;
        const gap = 0.02 + rnd(c * 13 + i * 7 + seed) * 0.05;
        const cx = x + w / 2;
        if (cx > -L / 2 + 0.1 && cx < L / 2 - 0.1) {
          stones.push({ x: cx, y: c * ch + hh / 2 + 0.02, z: (rnd(i * 5 + c + seed) - 0.5) * 0.1, w: w - gap, h: Math.min(hh, ch + 0.12), d: t + 0.04 + rnd(i + c * 3) * 0.16, rz: (rnd(i * 2 + c * 9 + seed) - 0.5) * 0.12, m: mats[(i * 2 + c) % 4] });
        }
        x += w; i += 1;
      }
    }
    return (
      <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, ang, 0]}>
        <Box s={[L, h - 0.05, t - 0.1]} p={[0, (h - 0.05) / 2, 0]} m={core} />
        {stones.map((q, i) => <Box key={i} s={[q.w, q.h, q.d]} p={[q.x, q.y, q.z]} r={[0, 0, q.rz]} m={q.m} cast={false} />)}
      </group>
    );
  }

  /* light metal railing around the temple court: posts + two rails + vertical bars (instanced) */
  function Railing({ a, b, h = 0.72 }) {
    const M = useM();
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz), ang = Math.atan2(dx, dz) - Math.PI / 2;
    const post = M.plain('#e9e6df', { roughness: 0.6 });
    const bar = M.plain('#bfc3c4', { roughness: 0.4, metalness: 0.5 });
    const nb = Math.round(L / 0.18);
    const inst = useMemo(() => {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, h - 0.1, 0.025), bar, nb);
      const d = new THREE.Object3D();
      for (let i = 0; i < nb; i += 1) { d.position.set(-L / 2 + (i + 0.5) * (L / nb), h / 2 + 0.03, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
      im.instanceMatrix.needsUpdate = true;
      return im;
    }, [L, h, nb, bar]);
    const np = Math.max(2, Math.round(L / 1.6) + 1);
    return (
      <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, ang, 0]}>
        {Array.from({ length: np }, (_, i) => <Box key={i} s={[0.07, h + 0.08, 0.07]} p={[-L / 2 + (i * L) / (np - 1), (h + 0.08) / 2, 0]} m={post} cast={false} />)}
        <Box s={[L, 0.04, 0.04]} p={[0, h, 0]} m={bar} cast={false} />
        <Box s={[L, 0.03, 0.03]} p={[0, 0.12, 0]} m={bar} cast={false} />
        <primitive object={inst} />
      </group>
    );
  }

  /* ================= MAIN ================= */
  function Main() {
    return (
      <group>
        <WhiteTemple p={[0, 0, -2.6]} />
        <group position={[-4.2, 0, 0.2]} scale={1.4}><PinkPagoda p={[0, 0, 0]} /></group>
        <PinkShrine p={[-7.6, 0, 1]} r={0.15} />
        <PinkShrine p={[-9.4, 0, 0.8]} r={0.2} w={1.3} d={1.2} h={0.95} />
        <Statue p={[1.8, 0, 1.7]} />
        <YagyaKunda p={[5.4, 0, -4.4]} />
        <group position={[9, 0, -2]} scale={0.8}><AshramHouse p={[0, 0, 0]} r={0.25} /></group>
        <CowShed p={[-5.5, 0, -5.6]} />
        <Banyan p={[-10.5, 0, -5.0]} />
        <Palm p={[-7.6, 0, -1.6]} h={5.6} lean={0.04} />
        <Palm p={[-6.2, 0, -2.2]} h={6.0} lean={-0.05} />
        <Palm p={[-4.6, 0, -1.2]} h={5.2} lean={0.05} />
        <Palm p={[3.6, 0, -0.8]} h={5.4} lean={0.04} s={0.95} />
        <Bamboo p={[-0.4, 0, 0.8]} h={6.5} tilt={0.025} />
        <Bamboo p={[-1.6, 0, 2.6]} h={5.6} tilt={-0.03} c="#e07a1c" />
        <Bamboo p={[5.2, 0, 1.1]} h={6.0} tilt={0.03} />
        <Trident p={[3.0, 0, 2.6]} h={3.0} />
        <Wire a={[-0.4, 6.4, 0.8]} b={[5.2, 5.9, 1.1]} sag={0.35} />
        <Wire a={[-0.4, 6.4, 0.8]} b={[-1.6, 5.2, 2.6]} n={4} sag={0.15} />
        <Wire a={[5.2, 5.9, 1.1]} b={[9.6, 3.8, 0.9]} sag={0.4} />
        <Wire a={[-0.4, 6.4, 0.8]} b={[-7.6, 5.2, -1.6]} n={10} sag={0.5} />
        <Railing a={[-10, 3.4]} b={[5.6, 3.4]} />
        <Railing a={[-10, 3.4]} b={[-10, -3.0]} />
        <StoneWall a={[-12, 6]} b={[3.0, 6]} seed={1} />
        <StoneWall a={[4.4, 6]} b={[14, 6]} seed={2} />
        <StoneWall a={[-12, 6]} b={[-12, -7]} seed={3} />
        <Cow p={[1.5, 0, 4.7]} r={0.5} />
        <Cow p={[4.2, 0, 4.3]} r={-0.8} c="#8a6a4a" patch="#efe6d6" />
        <Cow p={[-3.8, 0, 4.8]} r={2.2} c="#e9dcc4" patch="#b58a5c" />
        <Cow p={[-6.2, 0, -4.0]} r={1.2} c="#3a312c" patch="#ffffff" />
        <Frame s={[21, 6.5, 10]} p={[0.5, 3, -1]} />
      </group>
    );
  }

  /* ================= ENV ================= */
  function Terrain() {
    const M = useM();
    const geo = useMemo(() => {
      const size = 130, seg = 130;
      const g = new THREE.PlaneGeometry(size, size, seg, seg);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i), z = p.getZ(i);
        const h = hgt(x, z);
        p.setY(i, h - 0.03);
        const q = qf(x, z);
        const n = rnd(Math.floor(x * 1.1) * 7 + Math.floor(z * 1.1) * 13);
        if (q < 0.9 && h > -0.2) {
          const m = Math.sin(x * 0.45 + Math.sin(z * 0.6) * 1.5) * Math.cos(z * 0.38 - x * 0.1) + (n - 0.5) * 0.6 + q * 0.7;
          c.set(m > 0.75 ? '#7d8650' : m > 0.4 ? '#948a5c' : n > 0.5 ? '#b9a07c' : '#a88f6c');
        }
        else if (q < 1.0) c.set(n > 0.5 ? '#98925a' : '#7d8650');
        else {
          const terr = h > -9 && h < -2 && Math.sin(h * 2.2 + x * 0.05) > 0.2 && Math.abs(x) > 12;
          if (terr) c.set(n > 0.5 ? '#aab35a' : '#86a04a');
          else if (h < -6 || h > 6) c.set(n > 0.5 ? '#2f5a2c' : '#3b6a32');
          else c.set(n > 0.6 ? '#3b6a32' : n > 0.3 ? '#2f5a2c' : '#4a7a3a');
        }
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} material={M.plain('#ffffff', { vertexColors: true, roughness: 1 })} receiveShadow />;
  }

  function Forest() {
    const { pines, broad } = useMemo(() => {
      const pg = new THREE.ConeGeometry(0.55, 3.0, 7); pg.translate(0, 1.6, 0);
      const bg = new THREE.IcosahedronGeometry(0.85, 1); bg.translate(0, 1.4, 0);
      const mk = (geo, n, seed, cols) => {
        const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), n);
        const d = new THREE.Object3D(); const c = new THREE.Color(); let k = 0;
        for (let i = 0; i < n * 12 && k < n; i += 1) {
          const x = (rnd(i * 2 + seed) - 0.5) * 100, z = (rnd(i * 2 + 1 + seed) - 0.5) * 90;
          const q = qf(x, z);
          const h = hgt(x, z);
          if (q < 0.97 || h < -10 || Math.hypot(x, z) > 36) continue;
          if (z > 3 && h > -6) continue;
          if (q < 1.12 && z > 2) continue; /* open slope in front of the wall so nothing blocks the view */
          if (z > 3 && x > -2 && Math.abs(x) < 30 && h > -4) continue;
          const s = 0.7 + rnd(i + seed * 3) * 0.9;
          d.position.set(x, h - 0.2, z); d.scale.set(s, s * (0.9 + rnd(i) * 0.5), s); d.rotation.y = rnd(i + 9) * 6;
          d.updateMatrix(); im.setMatrixAt(k, d.matrix);
          c.set(cols[Math.floor(rnd(i + 5) * cols.length)]); im.setColorAt(k, c); k += 1;
        }
        im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = true;
        return im;
      };
      return {
        pines: mk(pg, 160, 11, ['#27472a', '#2f5a2a', '#355f30']),
        broad: mk(bg, 260, 71, ['#3a6a30', '#46763a', '#2f5c2b', '#557f3a']),
      };
    }, []);
    return <group><primitive object={pines} /><primitive object={broad} /></group>;
  }

  /* tall grey-trunked pines and oaks standing on the ridge itself */
  function RidgeTrees() {
    const M = useM();
    const spots = [[-15, -8, 'p'], [-17.5, -3, 'p'], [19, -7, 'p'], [14, -9, 'o'], [-20, 3, 'o'], [22, 2, 'p'], [-16.5, -10, 'o'], [-12, -11, 'p']];
    return (
      <group>
        {spots.map(([x, z, k], i) => {
          const s = 1.5 + rnd(i) * 0.7;
          return k === 'p' ? (
            <group key={i} position={[x, hgt(x, z), z]} scale={s}>
              <Cyl rt={0.07} rb={0.13} h={3.2} p={[0, 1.6, 0]} m={M.plain('#6d6559', { roughness: 1 })} seg={6} />
              <mesh position={[0, 3.6, 0]} material={M.plain('#2f5a2a', { roughness: 1 })}><coneGeometry args={[0.75, 1.9, 7]} /></mesh>
              <mesh position={[0, 2.7, 0]} material={M.plain('#2a4d27', { roughness: 1 })}><coneGeometry args={[0.95, 1.4, 7]} /></mesh>
            </group>
          ) : (
            <group key={i} position={[x, hgt(x, z), z]} scale={s}>
              <Cyl rt={0.12} rb={0.2} h={1.6} p={[0, 0.8, 0]} m={M.plain('#5a4838', { roughness: 1 })} seg={6} />
              <Ball rad={1.1} p={[0, 2.1, 0]} sc={[1.3, 0.85, 1.3]} m={M.plain('#3b6a32', { roughness: 1 })} />
              <Ball rad={0.8} p={[0.8, 1.8, 0.2]} m={M.plain('#2f5c2b', { roughness: 1 })} />
            </group>
          );
        })}
      </group>
    );
  }

  /* small village houses scattered along the ridge crest (red + white roofs) */
  function VillageHouse({ x, z, w = 2.2, d = 1.7, c = '#f1eee6', roof = '#b5382e', r = 0 }) {
    const M = useM();
    const y = hgt(x, z);
    return (
      <group position={[x, y, z]} rotation={[0, r, 0]}>
        <Box s={[w, 1.4, d]} p={[0, 0.7, 0]} m={M.plain(c, { roughness: 0.95 })} />
        <Roof w={w + 0.5} d={d + 0.5} h={0.7} y={1.4} m={M.plain(roof, { roughness: 0.7, metalness: 0.15 })} sag={1} lift={0} fascia={false} />
        <Box s={[0.35, 0.3, 0.03]} p={[-w / 4, 0.85, d / 2 + 0.01]} m={M.plain('#3a4a58')} cast={false} />
        <Box s={[0.35, 0.6, 0.03]} p={[w / 4, 0.4, d / 2 + 0.01]} m={M.plain('#5a3a2a')} cast={false} />
      </group>
    );
  }

  /* far ridges + snow range as vertex-coloured ribbons */
  function Ridge({ R, base, amp, cols, seed, a0 = 0, a1 = Math.PI * 2, snow = false, sharp = 0.2 }) {
    const geo = useMemo(() => {
      const N = 160;
      const pos = [], col = [], idx = [];
      const c0 = new THREE.Color(cols[0]), c1 = new THREE.Color(cols[1]), c2 = new THREE.Color(cols[2]);
      for (let i = 0; i <= N; i += 1) {
        const a = a0 + ((a1 - a0) * i) / N;
        const n = snow ? (1 - Math.abs(Math.sin(a * 9 + seed))) * 0.9 + (1 - Math.abs(Math.sin(a * 23 + seed * 2))) * 0.5 - 0.5 + Math.sin(a * 3 + seed) * 0.3 : Math.sin(a * 5 + seed) * 0.5 + Math.sin(a * 11 + seed * 2) * 0.3 + Math.sin(a * 23 + seed * 3) * sharp;
        const h = base + amp * (0.55 + 0.45 * n);
        const x = Math.cos(a) * R, z = Math.sin(a) * R;
        const lowY = -9;
        pos.push(x, lowY, z, x, base + (h - base) * 0.55, z, x, h, z);
        col.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        if (i < N) { const k = i * 3; idx.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      return g;
    }, [R, base, amp, seed, a0, a1, sharp, cols]);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} /></mesh>;
  }

  /* soft blue haze dome, partly transparent so the host sky still tints through (no cream wash above the hills) */
  function SkyHaze() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(85, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const p = g.attributes.position; const col = new Float32Array(p.count * 3);
      const lo = new THREE.Color('#d5e0ec'), hi = new THREE.Color('#7ea2cf'), c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) { c.copy(lo).lerp(hi, Math.min(1, p.getY(i) / 70)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, -4, 0]} renderOrder={-1}><meshBasicMaterial vertexColors side={THREE.BackSide} transparent opacity={0.6} depthWrite={false} fog={false} /></mesh>;
  }

  function Env() {
    const M = useM();
    const cols1 = useMemo(() => ['#7d97a8', '#8fa7b4', '#9fb4bf'], []);
    const cols2 = useMemo(() => ['#8ea4b6', '#a5b9c9', '#bccbd6'], []);
    const colsS = useMemo(() => ['#8197b2', '#98acc8', '#d4e0ee'], []);
    const BACK0 = Math.PI * 1.02, BACK1 = Math.PI * 1.98; /* northern half (z < 0) */
    return (
      <group>
        <SkyHaze />
        <Terrain />
        <Forest />
        <RidgeTrees />
        {/* village roofs on the ridge, away from the compound */}
        <VillageHouse x={-17} z={-1} roof="#b5382e" r={0.1} />
        <VillageHouse x={-19.5} z={-5.5} c="#e9d9a0" roof="#8a8a86" r={0.3} />
        <VillageHouse x={-15.5} z={-1.5} roof="#b5382e" r={-0.2} w={2.6} />
        <VillageHouse x={15.5} z={5} c="#f1eee6" roof="#8a8a86" r={0.2} />
        <VillageHouse x={18.5} z={-3} roof="#b5382e" r={-0.15} w={2.8} />
        <VillageHouse x={21} z={1.5} c="#e9d9a0" roof="#b5382e" r={0.4} w={1.8} />
        <VillageHouse x={-21.5} z={0.5} roof="#b5382e" r={0.5} w={2.0} />
        <VillageHouse x={-9} z={-9.5} c="#f1eee6" roof="#8a8a86" r={-0.1} />
        {/* a few cows grazing on the open ridge, and goats' path of boulders */}
        {Array.from({ length: 10 }, (_, i) => { const x = -22 + rnd(i) * 44, z = -9 + rnd(i + 9) * 18; return qf(x, z) < 0.95 && Math.abs(x) > 14 ? <Ball key={i} rad={0.25 + rnd(i + 3) * 0.2} p={[x, 0.08, z]} sc={[1.3, 0.6, 1]} m={M.plain('#9a9082', { roughness: 1 })} /> : null; })}
        {/* sea of cloud in the valleys */}
        <mesh position={[0, -11.5, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[60, 48]} /><meshBasicMaterial color="#e8eef4" transparent opacity={0.4} depthWrite={false} /></mesh>
        <mesh position={[0, -10.5, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[52, 48]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.15} depthWrite={false} /></mesh>
        {/* layered hazy ridges and the snow range across the north */}
        <Ridge R={55} base={3} amp={6} cols={cols1} seed={1.3} sharp={0.15} />
        <Ridge R={58} base={5} amp={6} cols={cols2} seed={4.1} a0={BACK0 - 0.5} a1={BACK1 + 0.5} sharp={0.18} />
        <Ridge R={52} base={9} amp={10} cols={colsS} seed={2.2} a0={BACK0} a1={BACK1} snow sharp={0.35} />
      </group>
    );
  }

  return { swargadwari: { Main, Env } };
}
