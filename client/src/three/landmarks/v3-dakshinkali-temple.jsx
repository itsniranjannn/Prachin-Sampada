/* Dakshinkali Temple: a low single-storey sacrificial shrine at the bottom of a steep wooded gorge.
   Terraced stack (front = +z): gravel stream bed -> green-railed tank + broad stone stairs -> rubble terrace carrying the long
   grey metal-sheet roof (small dark cupola) with the red gold-fringed canopy behind it, and a red-tile open pavilion on a
   raised stone base at the right. Forested hills close in on three sides. Units ~ 2 m. Dimensions are approximate. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, Tree, PrayerFlags, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---- terrain: flat gravel gorge floor, steep hills behind and to both sides, a distant ring ---- */
  function hgt(x, z) {
    let h = 0;
    const back = -z - 3.4;
    if (back > 0) h += back * 1.9;
    const lim = 9.5 + 5 * clamp(z / 7, 0, 1);
    const sx = Math.abs(x) - lim;
    if (sx > 0) h += sx * 2.3 * clamp((13 - z) / 7, 0.15, 1);
    if (z > 15) h += (z - 15) * 0.16;
    const r = Math.hypot(x, z * 0.9);
    if (r > 27) h += (r - 27) * 0.75;
    if (h > 0) h += (Math.sin(x * 0.7 + z * 0.4) * 0.5 + Math.sin(x * 0.23 - z * 0.5) * 0.8) * Math.min(1, h / 5);
    const pd = Math.hypot(x - 5.5, (z + 3) * 1.1), pk = clamp((pd - 3.2) / 2.4, 0, 1);
    h *= pk * pk;
    return 24 * Math.tanh(Math.max(0, h) / 24);
  }

  /* ---------- small helpers ---------- */
  function RailRun({ a, b, y = 0 }) {
    /* green steel handrail with posts between two ground points a,b = [x,z]; follows height ya,yb via y=[ya,yb] */
    const M = useM();
    const g = M.plain('#2f9e84', { roughness: 0.55, metalness: 0.25 });
    const [ya, yb] = Array.isArray(y) ? y : [y, y];
    const dx = b[0] - a[0], dz = b[1] - a[1], dy = yb - ya;
    const len = Math.hypot(dx, dz);
    const L = Math.hypot(len, dy);
    const ang = Math.atan2(dx, dz);
    const pitch = Math.atan2(dy, len);
    const n = Math.max(2, Math.round(len / 0.9));
    return (
      <group>
        {Array.from({ length: n + 1 }, (_, i) => {
          const t = i / n;
          return <Box key={i} s={[0.05, 0.5, 0.05]} p={[a[0] + dx * t, ya + dy * t + 0.25, a[1] + dz * t]} m={g} cast={false} />;
        })}
        <group position={[(a[0] + b[0]) / 2, (ya + yb) / 2 + 0.5, (a[1] + b[1]) / 2]} rotation={[0, ang, 0]}>
          <group rotation={[-pitch, 0, 0]}>
            <Box s={[0.06, 0.06, L]} m={g} cast={false} />
            <Box s={[0.04, 0.04, L]} p={[0, -0.22, 0]} m={g} cast={false} />
          </group>
        </group>
      </group>
    );
  }

  /* red scalloped cloth valance with gold fringe round a w x d eave at height y */
  function Valance({ w, d, y, drop = 0.32 }) {
    const M = useM();
    const red = M.plain('#b3262a', { roughness: 0.9, emissive: '#5a0a0c', emissiveIntensity: 0.06 });
    const gold = M.plain('#d4a92a', { roughness: 0.5, metalness: 0.5 });
    const side = (len, pos, rot, key) => {
      const n = Math.max(3, Math.round(len / 0.3));
      return (
        <group key={key} position={pos} rotation={[0, rot, 0]}>
          <Box s={[len, drop * 0.55, 0.05]} p={[0, -drop * 0.27, 0]} m={red} cast={false} />
          {Array.from({ length: n }, (_, i) => {
            const x = -len / 2 + (len * (i + 0.5)) / n;
            return (
              <group key={i} position={[x, -drop * 0.55, 0]}>
                <mesh scale={[len / n / 2.1, drop * 0.45, 0.2]} material={red}><sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
                <Box s={[len / n * 0.55, 0.03, 0.04]} p={[0, -drop * 0.42, 0]} m={gold} cast={false} />
              </group>
            );
          })}
        </group>
      );
    };
    return (
      <group position={[0, y, 0]}>
        {side(w, [0, 0, d / 2], 0, 'f')}
        {side(w, [0, 0, -d / 2], Math.PI, 'b')}
        {side(d, [w / 2, 0, 0], Math.PI / 2, 'r')}
        {side(d, [-w / 2, 0, 0], -Math.PI / 2, 'l')}
      </group>
    );
  }

  /* gilded curled serpent finial */
  function Serpent({ p, r = 0, s = 1 }) {
    const M = useM();
    const geo = useMemo(() => new THREE.TorusGeometry(0.16, 0.04, 6, 16, Math.PI * 1.5), []);
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Cyl rt={0.03} rb={0.045} h={0.28} p={[0, 0.14, 0]} m={M.gold} seg={6} />
        <mesh geometry={geo} material={M.gold} position={[0.0, 0.34, 0]} castShadow />
        <Ball rad={0.055} p={[0.15, 0.2, 0]} m={M.gold} />
      </group>
    );
  }

  function Person({ p, c = '#c0392b', s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.11} rb={0.14} h={0.55} p={[0, 0.4, 0]} m={M.plain(c)} seg={8} />
        <Ball rad={0.09} p={[0, 0.78, 0]} m={M.plain('#8a5a3c')} />
      </group>
    );
  }

  function Stall({ p, r = 0, tarp = '#d8452e' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.1, 0.4, 0.55]} p={[0, 0.2, 0]} m={M.plain('#7a5a3a')} />
        <Box s={[1.0, 0.04, 0.4]} p={[0, 0.42, 0]} m={M.plain('#e8c43a')} />
        {[-0.5, 0.5].map((x) => <Cyl key={x} rt={0.025} h={1.05} p={[x, 0.55, 0.25]} m={M.plain('#6a5040')} seg={5} />)}
        <Box s={[1.25, 0.04, 0.75]} p={[0, 1.08, 0.05]} r={[0.2, 0, 0]} m={M.plain(tarp, { roughness: 0.9 })} />
        {[-0.3, 0, 0.3].map((x, i) => <Box key={i} s={[0.16, 0.1, 0.16]} p={[x, 0.5, 0]} m={M.plain(['#e8a020', '#c0392b', '#e8c43a'][i])} cast={false} />)}
      </group>
    );
  }

  /* ================= MAIN ================= */
  const T = 1.0; /* shrine terrace height */

  function Stairs() {
    const M = useM();
    const rubble = M.plain('#9d9381', { roughness: 1 });
    const step = M.plain('#8b8a85', { roughness: 0.95 });
    const N = 8, run = 0.5, x0 = -9.8, w = 5.5;
    return (
      <group>
        {Array.from({ length: N }, (_, i) => {
          const top = T * (1 - (i + 1) / N);
          const zc = 1.6 + run * i + run / 2;
          return <Box key={i} s={[w, Math.max(0.06, top + 0.01), run]} p={[x0 + w / 2, top / 2 + 0.0, zc]} m={step} />;
        })}
        {/* flank walls */}
        <Box s={[0.34, T * 0.8, N * run]} p={[x0 - 0.17, T * 0.4, 1.6 + (N * run) / 2]} m={rubble} />
        <Box s={[0.34, T * 0.8, N * run]} p={[x0 + w + 0.17, T * 0.4, 1.6 + (N * run) / 2]} m={rubble} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Box key={i} s={[0.06, 0.18, 0.5]} p={[x0 + w + 0.36, 0.2 + (i % 3) * 0.25, 2.0 + i * 0.6]} m={M.plain('#7a7060', { roughness: 1 })} cast={false} />)}
        <RailRun a={[x0 - 0.17, 1.6]} b={[x0 - 0.17, 1.6 + N * run]} y={[T, 0.05]} />
        <RailRun a={[x0 + w + 0.17, 1.6]} b={[x0 + w + 0.17, 1.6 + N * run]} y={[T, 0.05]} />
      </group>
    );
  }

  function Tank() {
    const M = useM();
    const rim = M.plain('#2fa08a', { roughness: 0.5, metalness: 0.2 });
    const water = M.plain('#4f7f78', { roughness: 0.15, metalness: 0.3 });
    const stone = M.plain('#8f8676', { roughness: 1 });
    const x0 = -3.3, x1 = 3.9, z0 = 2.5, z1 = 5.0, WH = 0.7;
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const jets = [-1.8, 0.2, 2.3];
    return (
      <group>
        <Box s={[w + 0.3, WH, d + 0.3]} p={[cx, WH / 2, cz]} m={stone} />
        {/* rubble face stones along the front wall */}
        {Array.from({ length: 22 }, (_, i) => <Box key={i} s={[0.3 + rnd(i) * 0.15, 0.18 + rnd(i + 3) * 0.1, 0.06]} p={[x0 + 0.2 + i * (w - 0.2) / 21, 0.18 + (i % 2) * 0.2, z1 + 0.17]} m={M.plain(i % 3 ? '#a39a86' : '#7b7262', { roughness: 1 })} cast={false} />)}
        <Box s={[w - 0.1, 0.02, d - 0.1]} p={[cx, WH - 0.1, cz]} m={water} cast={false} />
        <Box s={[w + 0.3, 0.07, 0.14]} p={[cx, WH + 0.03, z0 - 0.08]} m={rim} cast={false} />
        <Box s={[w + 0.3, 0.07, 0.14]} p={[cx, WH + 0.03, z1 + 0.08]} m={rim} cast={false} />
        <Box s={[0.14, 0.07, d + 0.3]} p={[x0 - 0.08, WH + 0.03, cz]} m={rim} cast={false} />
        <Box s={[0.14, 0.07, d + 0.3]} p={[x1 + 0.08, WH + 0.03, cz]} m={rim} cast={false} />
        {/* turquoise wall band on the front face */}
        <Box s={[w + 0.3, 0.25, 0.05]} p={[cx, 0.5, z1 + 0.17]} m={rim} cast={false} />
        {/* weir sheet spilling to the bed */}
        <Box s={[w * 0.9, 0.62, 0.04]} p={[cx, 0.32, z1 + 0.22]} m={M.plain('#e3f4f1', { transparent: true, opacity: 0.7 })} cast={false} />
        {Array.from({ length: 14 }, (_, i) => <Box key={i} s={[0.05, 0.5, 0.02]} p={[x0 + 0.4 + i * (w - 0.8) / 13, 0.3, z1 + 0.26]} m={M.plain('#ffffff', { transparent: true, opacity: 0.8 })} cast={false} />)}
        <mesh position={[cx, 0.03, z1 + 0.7]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w * 0.9, 0.9]} /><meshStandardMaterial color="#9fbfb8" transparent opacity={0.6} roughness={0.2} /></mesh>
        {/* spray jets */}
        {jets.map((jx, i) => (
          <group key={i} position={[cx + jx, WH - 0.05, cz]}>
            <Cyl rt={0.15} rb={0.2} h={0.1} p={[0, 0.04, 0]} m={stone} seg={10} />
            <mesh position={[0, 0.32, 0]}><coneGeometry args={[0.08, 0.5, 8, 1, true]} /><meshStandardMaterial color="#e8f6f4" transparent opacity={0.6} /></mesh>
            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.22, 0.42, 14]} /><meshBasicMaterial color="#d6eeea" transparent opacity={0.5} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  function MainShrine() {
    const M = useM();
    const wall = M.plain('#9d9381', { roughness: 1 });
    const metal = M.plain('#8d949a', { roughness: 0.45, metalness: 0.55 });
    const rib = M.plain('#5f666b', { roughness: 0.5, metalness: 0.5 });
    const dark = M.plain('#2e2a2a', { roughness: 0.8 });
    const redCloth = M.plain('#b3262a', { roughness: 0.9 });
    const W = 9.2, D = 3.2, cx = -2.2, cz = -1.7;
    const eave = T + 1.2, rh = 0.9;
    const slopeLen = Math.hypot(D / 2 + 0.3, rh);
    const slope = Math.atan2(rh, D / 2 + 0.3);
    return (
      <group>
        {/* low walls with a dark open front band (rail zone) */}
        <Box s={[W, 0.85, D]} p={[cx, T + 0.425, cz]} m={wall} />
        <Box s={[W + 0.1, 0.06, 0.1]} p={[cx, T + 0.05, cz + D / 2 + 0.03]} m={dark} cast={false} />
        {[-3.4, -1.6, 0.2, 2.0, 3.6].map((dx, i) => <Box key={i} s={[0.5, 0.35, 0.04]} p={[cx + dx, T + 0.45, cz + D / 2 + 0.02]} m={dark} cast={false} />)}
        {/* long shallow hipped metal roof */}
        <group position={[cx, eave, cz]}>
          <Roof w={W + 0.7} d={D + 0.6} h={rh} y={0} m={metal} sag={1} lift={0} fascia={false} />
          {/* standing-seam ribs down the front slope */}
          {Array.from({ length: 17 }, (_, i) => {
            const x = -3.5 + i * 0.44;
            return <Box key={i} s={[0.035, 0.03, slopeLen - 0.05]} p={[x, rh / 2 + 0.015, (D / 2 + 0.3) / 2]} r={[slope, 0, 0]} m={rib} cast={false} />;
          })}
          <Box s={[W + 0.7, 0.09, 0.08]} p={[0, -0.02, D / 2 + 0.3]} m={rib} cast={false} />
          {[[-3.6, 0.5], [-1.9, 0.9], [1.9, 0.6], [3.4, 1.0], [0.6, 0.2], [-0.2, 1.2]].map(([x, z], i) => <Box key={i} s={[0.9, 0.02, 0.7]} p={[x, rh * (1 - z / (D / 2 + 0.3)) + 0.03, z]} r={[slope, 0, 0]} m={M.plain('#7a8085', { roughness: 0.6, metalness: 0.4 })} cast={false} />)}
          {/* small dark square cupola on the slope */}
          <group position={[0, 0.3, 0.5]} scale={1.3}>
            <Box s={[0.55, 0.08, 0.55]} p={[0, 0.02, 0]} m={dark} />
            <Box s={[0.4, 0.32, 0.4]} p={[0, 0.22, 0]} m={dark} />
            <Box s={[0.3, 0.16, 0.02]} p={[0, 0.22, 0.21]} m={M.plain('#b9b6a8')} cast={false} />
            <Roof w={0.62} d={0.62} h={0.24} y={0.38} m={dark} sag={1} lift={0} fascia={false} />
            <Ball rad={0.04} p={[0, 0.66, 0]} m={M.gold} />
          </group>
        </group>
        {/* sanctum behind: low base, slim posts, dim interior, DARK-roofed hip canopy with red fringed valance, gilded serpents */}
        <group position={[-2.6, T + 1.1, -3.9]}>
          <Box s={[3.6, 0.6, 2.6]} p={[0, -0.3, 0]} m={M.plain('#9d9381', { roughness: 1 })} />
          <Box s={[3.0, 0.9, 2.0]} p={[0, 0.5, 0]} m={M.plain('#1a1514', { roughness: 1 })} cast={false} />
          {[[-1.7, 1.15], [1.7, 1.15], [-1.7, -1.15], [1.7, -1.15]].map(([x, z], i) => <Box key={i} s={[0.14, 0.95, 0.14]} p={[x, 0.5, z]} m={M.plain('#8a2a22')} />)}
          <Box s={[3.8, 0.12, 2.8]} p={[0, 1.02, 0]} m={M.plain('#4a3a36', { roughness: 0.8 })} />
          <Roof w={4.0} d={3.0} h={0.5} y={1.08} m={M.plain('#4a3a36', { roughness: 0.8, metalness: 0.2 })} sag={1} lift={0} fascia={false} />
          <Valance w={4.0} d={3.0} y={1.08} drop={0.6} />
          <Box s={[4.0, 0.06, 0.03]} p={[0, 1.06, 1.5]} m={M.gold} cast={false} />
          {[[-1.9, 1.4], [1.9, 1.4], [-1.9, -1.4], [1.9, -1.4]].map(([x, z], i) => <Serpent key={i} p={[x, 1.1, z]} r={x > 0 ? Math.PI : 0} s={1.2} />)}
          <Cyl rt={0.03} rb={0.08} h={0.3} p={[0, 1.72, 0]} m={M.gold} seg={8} />
          <Ball rad={0.08} p={[0, 1.6, 0]} m={M.gold} />
        </group>
        {/* bells in front of the shrine */}
        {[-5.2, -3.9].map((x, i) => (
          <group key={i} position={[x, T, 0.6]}>
            <Cyl rt={0.05} h={1.3} p={[0, 0.65, 0]} m={M.plain('#6a5040')} seg={6} />
            <mesh position={[0, 1.08, 0]} material={M.gold} castShadow><coneGeometry args={[0.3, 0.44, 12]} /></mesh>
            <Ball rad={0.06} p={[0, 0.82, 0]} m={M.gold} />
          </group>
        ))}
      </group>
    );
  }

  function Pavilion() {
    const M = useM();
    const wall = M.mat('stone', 2, 1, { color: '#b3ae9f' });
    const dark = M.plain('#1c1818', { roughness: 0.9 });
    const tile = M.mat('roof', 3, 3, { color: '#a85a42' });
    const post = M.plain('#8a4a38');
    const base = 1.0, cx = 5.5, cz = -3, S = 2.6, fz = (S + 0.6) / 2;
    const stepM = M.plain('#8b8a85', { roughness: 0.95 });
    return (
      <group position={[cx, 0, cz]}>
        <Box s={[S + 0.6, base, S + 0.6]} p={[0, base / 2, 0]} m={wall} />
        {/* wide dark arched undercroft */}
        <group position={[0.3, 0, fz + 0.02]}>
          <Box s={[2.2, 0.5, 0.1]} p={[0, 0.25, 0]} m={dark} cast={false} />
          <group scale={[2.2, 1, 1]} position={[0, 0.5, 0]}><Cyl rt={0.5} rb={0.5} h={0.1} r={[Math.PI / 2, 0, 0]} m={dark} seg={14} cast={false} /></group>
        </group>
        <Box s={[2.5, 0.2, 0.04]} p={[0.3, 0.9, fz + 0.05]} m={M.plain('#f1ede2')} cast={false} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Box key={i} s={[0.16, 0.08, 0.05]} p={[-0.6 + i * 0.25 + 0.3, 0.9, fz + 0.08]} m={M.plain('#8a2a22')} cast={false} />)}
        <Box s={[S + 0.7, 0.07, S + 0.7]} p={[0, base + 0.03, 0]} m={M.plain('#8f8574')} cast={false} />
        {[[-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15], [1.15, 1.15], [0, 1.15], [-1.15, 0], [1.15, 0]].map(([x, z], i) => <Box key={i} s={[0.2, 1.1, 0.2]} p={[x, base + 0.6, z]} m={post} />)}
        <Box s={[S, 0.12, S]} p={[0, base + 1.2, 0]} m={M.plain('#7a3a2c')} />
        {[-1, 1].map((s2) => <group key={s2}>
          <Box s={[S - 0.1, 0.07, 0.07]} p={[0, base + 0.55, s2 * 1.2]} m={M.plain('#2f9e84')} cast={false} />
          <Box s={[0.07, 0.07, S - 0.1]} p={[s2 * 1.2, base + 0.55, 0]} m={M.plain('#2f9e84')} cast={false} />
        </group>)}
        <Box s={[2.0, 0.5, 0.2]} p={[0, base + 0.25, -1.1]} m={M.plain('#6a3a26')} />
        <Roof w={3.3} d={3.3} h={0.6} y={base + 1.26} m={tile} sag={1.05} lift={0.06} fascia={false} />
        <Box s={[3.3, 0.14, 0.04]} p={[0, base + 1.3, 1.66]} m={M.plain('#f1ede2')} cast={false} />
        <Valance w={3.3} d={3.3} y={base + 1.26} drop={0.12} />
        <Cyl rt={0.03} rb={0.09} h={0.3} p={[0, base + 1.98, 0]} m={M.gold} seg={8} />
        <Person p={[-0.6, base + 0.07, 0.4]} c="#d8d8d0" />
        <Person p={[0.7, base + 0.07, -0.2]} c="#c0392b" />
        {/* flight A on the right face, flight B at the front-left */}
        {[0, 1, 2].map((i) => <Box key={'a' + i} s={[0.35, 0.33 * (3 - i) / 3 + 0.1, 1.1]} p={[1.9 + i * 0.35, (0.33 * (3 - i) / 3 + 0.1) / 2, 0.3]} m={stepM} />)}
        {[0, 1, 2].map((i) => <Box key={'b' + i} s={[0.7, 0.33 * (3 - i) / 3 + 0.1, 0.35]} p={[-1.25, (0.33 * (3 - i) / 3 + 0.1) / 2, fz + 0.2 + i * 0.35]} m={stepM} />)}
      </group>
    );
  }

  function Terrace() {
    const M = useM();
    const rubble = M.plain('#9d9381', { roughness: 1 });
    const floor = M.plain('#8f8574', { roughness: 0.95 });
    return (
      <group>
        {/* rubble retaining wall + paved shrine terrace */}
        <Box s={[13.7, T, 7.8]} p={[-3.15, T / 2, -2.3]} m={rubble} />
        <Box s={[13.7, 0.04, 7.8]} p={[-3.15, T + 0.01, -2.3]} m={floor} cast={false} />
        {/* terrace railing, between stairs and pavilion */}
        <RailRun a={[-4.1, 1.6]} b={[3.7, 1.6]} y={T} />
        <RailRun a={[3.7, 1.6]} b={[3.7, -1.5]} y={T} />
        {/* left end */}
        <RailRun a={[-10, 1.6]} b={[-10, -5.8]} y={T} />
        {/* white plaque board with Devanagari-style lettering beside the stairs */}
        <group position={[-3.85, T, 1.2]}>
          <Cyl rt={0.04} h={1.5} p={[-0.55, 0.75, 0]} m={M.plain('#555555')} seg={5} />
          <Cyl rt={0.04} h={1.5} p={[0.55, 0.75, 0]} m={M.plain('#555555')} seg={5} />
          <Box s={[1.4, 0.8, 0.06]} p={[0, 1.2, 0]} m={M.plain('#f4f1e8', { roughness: 0.6 })} />
          <Box s={[1.4, 0.1, 0.07]} p={[0, 1.55, 0]} m={M.plain('#b3262a')} cast={false} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <Box key={i} s={[0.1, 0.1, 0.07]} p={[-0.5 + i * 0.17, 1.22 + (i % 2) * 0.12 - 0.05, 0.01]} m={M.plain('#2a2a2a')} cast={false} />)}
          <Box s={[1.1, 0.02, 0.075]} p={[0, 1.3, 0]} m={M.plain('#2a2a2a')} cast={false} />
        </group>
        {/* offering trays / slab area in front of shrine */}
        {[-4.6, -3.7, -2.8].map((x, i) => <Box key={i} s={[0.5, 0.16, 0.4]} p={[x, T + 0.1, 0.9]} r={[0, 0.2, 0]} m={M.plain('#d4a92a', { metalness: 0.5, roughness: 0.5 })} />)}
      </group>
    );
  }

  function Poles() {
    const M = useM();
    const y = M.plain('#e5c229', { roughness: 0.7 });
    const steel = M.plain('#88a8a0', { metalness: 0.4 });
    return (
      <group>
        {[[-6.5, 1.3], [-0.2, 0.4], [3.0, -3.8], [-8.6, -4.0]].map(([x, z], i) => (
          <group key={i} position={[x, T, z]}>
            <Cyl rt={0.1} h={4.2} p={[0, 2.1, 0]} m={y} seg={8} />
            <Box s={[0.24, 0.12, 0.24]} p={[0, 4.25, 0]} m={y} />
          </group>
        ))}
        {/* lamp post with arm and lamp head */}
        <Cyl rt={0.08} h={4.4} p={[-6.0, T + 2.2, 0.8]} m={steel} seg={8} />
        <Box s={[0.8, 0.1, 0.1]} p={[-5.65, T + 4.4, 0.8]} m={steel} />
        <Box s={[0.4, 0.14, 0.3]} p={[-5.3, T + 4.32, 0.8]} m={M.plain('#444444')} />
        <mesh position={[-5.3, T + 4.2, 0.8]}><sphereGeometry args={[0.12, 8, 6]} /><meshBasicMaterial color="#fff1c2" toneMapped={false} /></mesh>
        <pointLight position={[-5.3, T + 3.8, 1.2]} intensity={4} distance={14} color="#ffcf8a" />
        <PrayerFlags from={[-6.5, T + 4.6, 1.3]} to={[5.5, T + 3.4, -3]} n={30} />
        <PrayerFlags from={[-6.5, T + 4.4, 1.3]} to={[-0.2, T + 4.0, 0.4]} n={14} />
        <group position={[-2.2, T + 2.55, 0.2]}><Valance w={9} d={0.1} y={0} drop={0.35} /></group>
      </group>
    );
  }

  function BedProps() {
    const M = useM();
    const rockM = M.plain('#76705f', { roughness: 1, flatShading: true });
    const rockL = M.plain('#8a8270', { roughness: 1, flatShading: true });
    const rockD = M.plain('#625b4f', { roughness: 1, flatShading: true });
    const leaf = M.plain('#4a8a3c', { roughness: 1 });
    const leaf2 = M.plain('#3c7434', { roughness: 1 });
    const streamZ = (x) => 8.2 + Math.sin(x * 0.28 + 0.6) * 0.9 + Math.sin(x * 0.11) * 0.7;
    const segs = Array.from({ length: 34 }, (_, i) => -16 + i);
    const clusters = [[-8, 7.4, 3], [-4.5, 9.6, 2], [-1.5, 6.8, 3], [2.2, 9.8, 2], [5.5, 7.0, 3], [8.5, 9.2, 2]];
    const rocks = [];
    clusters.forEach(([cx, cz, n], ci) => { for (let k = 0; k < n; k += 1) { const q = ci * 7 + k; rocks.push([cx + (rnd(q) - 0.5) * 1.6, cz + (rnd(q + 30) - 0.5) * 1.4, 0.22 + rnd(q + 60) * 0.13, rnd(q + 90) * 6, q]); } });
    return (
      <group>
        {rocks.map(([x, z, r, ry, q], i) => (
          <mesh key={i} position={[x, r * 0.45, z]} rotation={[0.3, ry, 0.2]} scale={[1.3, 0.75, 1]} material={[rockM, rockL, rockD][q % 3]} castShadow>
            <dodecahedronGeometry args={[r, 0]} />
          </mesh>
        ))}
        {Array.from({ length: 24 }, (_, i) => <mesh key={i} position={[-12 + rnd(i + 200) * 24, 0.05, 6.2 + rnd(i + 230) * 5.5]} rotation={[0, rnd(i) * 6, 0]} scale={[1.2, 0.6, 1]} material={i % 2 ? rockM : rockD}><dodecahedronGeometry args={[0.1 + rnd(i + 260) * 0.08, 0]} /></mesh>)}
        {/* big-leaf plants, right foreground */}
        {[[8.4, 4.4], [9.6, 6.4], [7.4, 6.9]].map(([px, pz], pi) => (
          <group key={pi} position={[px, 0, pz]}>
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <group key={k} rotation={[0, k * 1.05 + pi, 0]}>
                <group position={[0.5, 0.45 + (k % 2) * 0.18, 0]} rotation={[0, 0, 0.45]}>
                  <mesh scale={[0.62, 0.05, 0.42]} material={k % 2 ? leaf : leaf2}><sphereGeometry args={[1, 8, 6]} /></mesh>
                </group>
              </group>
            ))}
            <Cyl rt={0.04} h={0.5} p={[0, 0.25, 0]} m={leaf2} seg={5} />
          </group>
        ))}
        {/* offering stalls set back beside the terrace, tarps muted */}
        <Stall p={[-10.8, 0, 5.4]} r={0.5} tarp="#a8553f" />
        <Stall p={[-11.5, 0, 6.9]} r={0.7} tarp="#b58a3a" />
        <Stall p={[-10.5, 0, 8.2]} r={0.4} tarp="#4f7090" />
        <Person p={[-9.0, 0, 7.0]} c="#c0392b" />
        <Person p={[-3.6, 0.0, 6.1]} c="#2a6fb0" />
        <Person p={[-8.0, 0.0, 1.8]} s={1} c="#e08a1a" />
        <Person p={[3.6, 0, 6.4]} c="#2a8a4a" />
        {/* thin stream, gently meandering */}
        {segs.slice(0, -1).map((x0, i) => {
          const x1 = x0 + 1, z0 = streamZ(x0), z1 = streamZ(x1);
          const len = Math.hypot(1, z1 - z0) + 0.05, ang = Math.atan2(-(z1 - z0), 1);
          return <Box key={i} s={[len, 0.03, 0.55 + 0.15 * Math.sin(i)]} p={[(x0 + x1) / 2, 0.03, (z0 + z1) / 2]} r={[0, ang, 0]} m={M.plain('#6f938c', { roughness: 0.2, metalness: 0.2 })} cast={false} />;
        })}
        <Box s={[0.5, 0.03, streamZ(0) - 5.6]} p={[0, 0.03, (streamZ(0) + 5.6) / 2]} m={M.plain('#8fb0a9', { roughness: 0.2 })} cast={false} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Terrace />
        <Stairs />
        <Tank />
        <MainShrine />
        <Pavilion />
        <Poles />
        <BedProps />
        <Frame s={[17, 5, 9]} p={[-1.5, 2.4, 0.5]} />
      </group>
    );
  }

  /* ================= ENV ================= */
  function Hills() {
    const M = useM();
    const geo = useMemo(() => {
      const size = 150, seg = 100;
      const g = new THREE.PlaneGeometry(size, size, seg, seg);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i), z = p.getZ(i);
        const h = hgt(x, z);
        p.setY(i, h - 0.04);
        if (h < 0.15) { const q = rnd(Math.floor(x * 1.5) * 5 + Math.floor(z * 1.5) * 11), w2 = Math.sin(x * 0.45 + z * 0.8) + Math.sin(x * 0.17 - z * 0.5); c.set(w2 > 0.9 ? '#5a5547' : q > 0.7 ? '#85806c' : q > 0.35 ? '#6f6a5a' : '#625d4e'); }
        else {
          const n = rnd(Math.floor(x * 1.3) * 7 + Math.floor(z * 1.3) * 13);
          const terr = (x < -22 || x > 22) && z < 2 && h > 6 && h < 12 && Math.sin(h * 2.6) > 0.5;
          if (terr) c.set(n > 0.5 ? '#9a9a46' : '#86994a');
          else if (h < 1.4) c.set(n > 0.5 ? '#4a5c34' : '#3f5230');
          else c.set(n > 0.55 ? '#2c4b2a' : n > 0.25 ? '#223d25' : '#30502b');
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
      const pg = new THREE.ConeGeometry(0.5, 2.6, 7); pg.translate(0, 1.2, 0);
      const bg = new THREE.IcosahedronGeometry(0.7, 1); bg.translate(0, 1.1, 0);
      const mk = (geo, n, seed, cols) => {
        const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), n + 80);
        const d = new THREE.Object3D(); const c = new THREE.Color(); let k = 0;
        for (let i = 0; i < n * 30 && k < n; i += 1) {
          const x = (rnd(i * 2 + seed) - 0.5) * 100, z = (rnd(i * 2 + 1 + seed) - 0.5) * 80 - 12;
          const h = hgt(x, z);
          if (h < 0.8) continue;
          if (Math.abs(x) < 9 && z > -3 && h < 4) continue;
          if (z > 7.5) continue;
          if (Math.abs(x) < 12 && z > -3.5 && h < 3.5) continue;
          const terr = (x < -22 || x > 22) && z < 2 && h > 6 && h < 12 && Math.sin(h * 2.6) > 0.5;
          if (terr) continue;
          const s = 0.5 + rnd(i + seed * 3) * 0.6;
          d.position.set(x, h - 0.2, z); d.scale.set(s, s * (0.9 + rnd(i) * 0.5), s); d.rotation.y = rnd(i + 9) * 6;
          d.updateMatrix(); im.setMatrixAt(k, d.matrix);
          c.set(cols[Math.floor(rnd(i + 5) * cols.length)]); im.setColorAt(k, c); k += 1;
        }
        for (let j = 0; j < 60; j += 1) { const x = (rnd(j * 3 + seed + 500) - 0.5) * 28, z = -3 - rnd(j * 5 + seed + 77) * 9; const h = hgt(x, z); if (h < 0.5 || (Math.abs(x) < 8 && z > -5.5)) continue; const s = 0.7 + rnd(j + seed) * 0.7; d.position.set(x, h - 0.2, z); d.scale.set(s, s * 1.1, s); d.rotation.y = rnd(j) * 6; d.updateMatrix(); im.setMatrixAt(k, d.matrix); c.set(cols[j % cols.length]); im.setColorAt(k, c); k += 1; }
        im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = true;
        return im;
      };
      return {
        pines: mk(pg, 1500, 11, ['#1f3a22', '#2a4a2c', '#2e5030']),
        broad: mk(bg, 1700, 71, ['#2a4a2c', '#3a5a30', '#2e5030', '#274427']),
      };
    }, []);
    return <group><primitive object={pines} /><primitive object={broad} /></group>;
  }

  function HillBuilding({ x, z, w = 2.4, d = 1.8, h = 1.8, c = '#e5c84a', roof = '#8a5a4a', r = 0 }) {
    const M = useM();
    const hs = [hgt(x - w / 2, z - d / 2), hgt(x + w / 2, z - d / 2), hgt(x - w / 2, z + d / 2), hgt(x + w / 2, z + d / 2)];
    const lo = Math.min(...hs), hi = Math.max(...hs);
    const y = lo + (hi - lo) * 0.45 + 0.1, drop = y - lo + 0.6, bh = h + drop;
    return (
      <group position={[x, y, z]} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.plain(c, { roughness: 0.95 })} />
        <Box s={[w + 0.2, drop, d + 0.2]} p={[0, -drop / 2, 0]} m={M.plain('#7a705f', { roughness: 1 })} />
        <Box s={[w + 1.2, 0.1, d + 1.2]} p={[0, 0.02, 0]} m={M.plain('#8f8574', { roughness: 1 })} cast={false} />
                <Roof w={w + 0.4} d={d + 0.4} h={0.45} y={h} m={M.plain(roof, { roughness: 0.6, metalness: 0.3 })} sag={1} lift={0} fascia={false} />
        {Array.from({ length: Math.floor(w / 0.8) }, (_, i) => <Box key={i} s={[0.3, 0.3, 0.03]} p={[-w / 2 + 0.5 + i * 0.8, h * 0.6, d / 2 + 0.01]} m={M.plain('#3a4a58')} cast={false} />)}
        <Box s={[0.4, 0.7, 0.03]} p={[w / 2 - 0.45, 0.35, d / 2 + 0.01]} m={M.plain('#5a3a2a')} cast={false} />
      </group>
    );
  }

  function MataPath() {
    const M = useM();
    const pts = useMemo(() => {
      const out = []; let x = 2, z = -7.5;
      const legs = [[-10, -12], [14, -17], [-6, -23], [10, -29], [0, -33]];
      legs.forEach(([tx, tz]) => {
        const n = 9;
        for (let i = 0; i < n; i += 1) { out.push([x + ((tx - x) * i) / n, z + ((tz - z) * i) / n]); }
        x = tx; z = tz;
      });
      return out;
    }, []);
    const top = pts[pts.length - 1];
    const ty = hgt(top[0], top[1]);
    return (
      <group>
        {pts.map(([x, z], i) => <Box key={i} s={[0.5, 0.08, 0.5]} p={[x, hgt(x, z) + 0.04, z]} m={M.plain('#c9c0aa')} cast={false} />)}
        {/* small Mata temple on the hilltop */}
        <group position={[top[0], ty, top[1]]}>
          <Box s={[1.6, 1.2, 1.6]} p={[0, 0.5, 0]} m={M.plain('#efe8da')} />
          <Roof w={2.1} d={2.1} h={0.7} y={1.1} m={M.plain('#a8452f')} sag={1.05} lift={0.05} fascia={false} />
          <Cyl rt={0.02} h={1.6} p={[1.2, 0.8, 0.6]} m={M.plain('#e5c229')} seg={5} />
          <Box s={[0.5, 0.3, 0.02]} p={[1.45, 1.45, 0.6]} m={M.plain('#c0392b')} cast={false} />
        </group>
      </group>
    );
  }

  function Env() {
    const M = useM();
    return (
      <group>
        <Hills />
        <Forest />
        {/* plain concrete buildings clinging to the hillside */}
        <HillBuilding x={-11.5} z={-3.5} w={3.2} d={2.4} h={2.2} c="#e5c84a" roof="#8a4a3a" r={0.2} />
        <HillBuilding x={13.5} z={-3} w={2.4} d={1.9} h={1.7} c="#f1eee6" roof="#7a7a78" r={-0.15} />
        <MataPath />
        {/* varied scrub clumps at the foot of the hill */}
        {[[-9.5, -6.2, 0.9, 1.4], [-5.2, -7.6, 0.6, 1.0], [1.5, -8.2, 1.1, 0.9], [8.6, -6.6, 0.7, 1.2], [12.2, -2.0, 0.8, 1.0], [-12.8, -1.8, 0.6, 1.3]].map(([x, z, r, k], i) => (
          <group key={i} position={[x, hgt(x, z) - 0.05, z]}>
            <Ball rad={r} p={[0, r * 0.5, 0]} sc={[1.2, 0.8, 1]} m={M.plain(i % 2 ? '#35602f' : '#2c5028', { roughness: 1 })} />
            <Ball rad={r * 0.6} p={[r * 0.8, r * 0.35, r * 0.3]} sc={[1, 0.8, 1]} m={M.plain('#3f6a34', { roughness: 1 })} />
            {k > 1.1 && <Ball rad={r * 0.5} p={[-r * 0.7, r * 0.4, -r * 0.2]} m={M.plain('#2a4a2c', { roughness: 1 })} />}
          </group>
        ))}
        {/* birds' resting shrine-side trees overhanging the terrace */}
        <Tree p={[-10.4, T, -5.5]} s={1.9} />
        <Tree p={[5.0, T, -7.4]} s={1.8} />
        <Tree p={[-6.5, T, -7.0]} s={2.0} />
        <Tree p={[-1.5, T, -7.4]} s={2.0} />
        <Tree p={[11.8, 0, -7.5]} s={2.2} kind="pine" />
        <Tree p={[12.6, 0, -3]} s={1.8} />
        {/* distant ridge haze */}
        <mesh position={[0, 9, -24]}><planeGeometry args={[80, 16]} /><meshBasicMaterial color="#7f9a86" transparent opacity={0.2} depthWrite={false} /></mesh>
        <mesh position={[0, 14, -38]}><planeGeometry args={[110, 22]} /><meshBasicMaterial color="#6f8a78" transparent opacity={0.3} depthWrite={false} /></mesh>
        <mesh position={[0, 6, -62]}><planeGeometry args={[150, 30]} /><meshBasicMaterial color="#6f8a68" transparent opacity={0.45} /></mesh>
      </group>
    );
  }

  return { 'dakshinkali-temple': { Main, Env } };
}
