// Doleshwor Mahadev, Sipadol (Suryabinayak, Bhaktapur). What a pilgrim sees today is NOT a tall pagoda: the old Malla pagoda
// fell in an earthquake and a small modest sanctum (four doors, a huge rough black boulder linga with three silver stripes)
// stands in a wide, open, pale-concrete courtyard. Signatures: a big dark-grey stone Nandi on a red-smeared two-step plinth
// (small Nandis at its foot, a gold Nandi elsewhere), a large copper hooded cobra beside a glass offering box, a long steel
// shed with a red-maroon roof on green posts, a copper-orange chhatra on a pole, a yellow-canopied kiosk, gilt trishuls,
// broad low steps rising from a lane of yellow-awning stalls, and a steep forested hill right behind. Four small shrines
// stand at irregular places on the edges. Sizes and the front direction (+z here) are photo-based estimates, not facts.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, THREE, useMemo, useRef, useEffect } = K;
  const PI = Math.PI;

  /* ---------- small maths helpers ---------- */
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const wob = (x, z) => Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.17) * 0.5 + Math.sin(x * 0.07 - z * 0.11 + 2) * 0.5;

  /* ---------- terrain model (shared by ground mesh, trees and houses) ---------- */
  const SHELF = -0.3; // level pad the court is cut into
  function frontH(z) { // terraced fall to the stream valley in the south
    if (z <= 14) return 0;
    if (z <= 44) { const raw = 0.3 * (z - 14); const b = Math.floor(raw + 1e-6); return -(b + sstep(0.72, 1, raw - b)); }
    if (z <= 49) return -9;
    const v = z - 49;
    return -9 + 0.02 * v * v + 0.15 * v;
  }
  const bandZ = (b) => 14 + (b + 0.36) / 0.3; // centre of the flat part of terrace b
  function hAt(x, z) {
    const ax = Math.abs(x);
    const u = Math.max(0, -z - 8.5);
    const back = Math.min(36, 1.4 * u) + sstep(0, 8, u) * wob(x, z) * 1.8 * Math.min(1, u / 10);
    const sideStart = 13 + 12 * sstep(8, 16, z);
    const side = Math.min(30, 0.5 * Math.max(0, ax - sideStart)) + sstep(sideStart, sideStart + 9, ax) * wob(x * 1.3, z) * 1.0;
    let h = SHELF + back + side;
    if (z > 8) h += -0.7 * sstep(8, 10.5, z) + frontH(z);
    return h;
  }

  /* ---------- instanced meshes (trees) ---------- */
  function Inst({ items, m, geo }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]); o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix); c.set(it[7] || '#ffffff'); ref.current.setColorAt(i, c);
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return (
      <instancedMesh key={items.length} ref={ref} args={[null, null, items.length]} material={m} castShadow frustumCulled={false}>
        <primitive object={geo} attach="geometry" />
      </instancedMesh>
    );
  }

  function Tor({ r, t, p, rot, m, sc, arc = PI * 2, seg = 20 }) {
    return <mesh position={p} rotation={rot} scale={sc} material={m} castShadow><torusGeometry args={[r, t, 8, seg, arc]} /></mesh>;
  }

  /* ---------- Nandi (faces +z), body length ~1 ---------- */
  function NandiFig({ p, r = 0, s = 1, body, horn, red }) {
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Ball rad={0.27} sc={[0.95, 0.85, 1.35]} p={[0, 0.3, -0.2]} m={body} />
        <Ball rad={0.23} sc={[1, 1, 1.1]} p={[0, 0.34, 0.14]} m={body} />
        <Ball rad={0.14} sc={[0.9, 1, 1.1]} p={[0, 0.57, 0.08]} m={body} />
        <Cyl rt={0.12} rb={0.18} h={0.42} p={[0, 0.5, 0.3]} r={[0.8, 0, 0]} m={body} seg={10} />
        <Ball rad={0.15} sc={[0.85, 0.9, 1.25]} p={[0, 0.6, 0.52]} m={body} />
        <Ball rad={0.09} sc={[1.1, 0.85, 1.1]} p={[0, 0.5, 0.68]} m={body} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <mesh position={[k * 0.11, 0.76, 0.47]} rotation={[0, 0, k * -0.9]} material={horn} castShadow><coneGeometry args={[0.03, 0.2, 6]} /></mesh>
            <mesh position={[k * 0.16, 0.66, 0.4]} rotation={[0, 0, k * -1.4]} material={body}><coneGeometry args={[0.04, 0.14, 6]} /></mesh>
            <Cyl rt={0.065} h={0.4} p={[k * 0.12, 0.08, 0.36]} r={[PI / 2, 0, 0]} m={body} seg={8} />
            <Ball rad={0.13} sc={[0.8, 1, 1.2]} p={[k * 0.2, 0.14, -0.3]} m={body} />
          </group>
        ))}
        <Tor r={0.17} t={0.05} p={[0, 0.5, 0.34]} rot={[-0.77, 0, 0]} m={red} />
        <Tor r={0.21} t={0.035} p={[0, 0.44, 0.3]} rot={[-0.77, 0, 0]} m={red} />
        <Ball rad={0.13} sc={[1.0, 0.9, 0.5]} p={[0, 0.34, 0.41]} m={red} />
        <Ball rad={0.075} sc={[1, 0.9, 0.6]} p={[0, 0.66, 0.6]} m={red} />
        <Ball rad={0.1} sc={[1, 0.5, 1.2]} p={[0.0, 0.5, -0.45]} m={red} />
        <Ball rad={0.035} p={[0, 0.37, 0.43]} m={horn} />
        <Ball rad={0.1} sc={[1, 0.45, 0.8]} p={[0, 0.66, 0.1]} m={red} />
      </group>
    );
  }

  /* ---------- copper hooded cobra, coiled ---------- */
  function Cobra({ p, r = 0, s = 1 }) {
    const M = useM();
    const cu = M.plain('#b9733f', { metalness: 0.6, roughness: 0.45 });
    const cu2 = M.plain('#c98650', { metalness: 0.6, roughness: 0.4 });
    const pale = M.plain('#e4b98a', { metalness: 0.4, roughness: 0.5 });
    const rim = M.plain('#e6a66a', { metalness: 0.6, roughness: 0.4 });
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        {[[0.52, 0.1], [0.45, 0.25], [0.36, 0.39]].map(([rr, y], i) => (
          <Tor key={i} r={rr} t={0.13} p={[0, y, 0]} rot={[PI / 2, 0, 0]} m={i % 2 ? cu2 : cu} sc={[1, 1, 1.1]} seg={24} />
        ))}
        {[0.1, 0.25, 0.39].map((y, i) => (
          <Box key={i} s={[0.5 - i * 0.06, 0.05, 0.05]} p={[0, y - 0.02, [0.66, 0.58, 0.48][i]]} m={pale} cast={false} />
        ))}
        <group position={[0, 0.5, 0.05]} rotation={[0.3, 0, 0]}>
          <Cyl rt={0.12} rb={0.19} h={0.6} p={[0, 0.3, 0]} m={cu} seg={12} />
          <Box s={[0.1, 0.5, 0.03]} p={[0, 0.3, 0.17]} m={pale} cast={false} />
          <group position={[0, 0.9, 0.06]} rotation={[-0.15, 0, 0]}>
            <Ball rad={0.36} sc={[1, 1.6, 0.26]} p={[0, 0.1, 0]} m={cu2} />
            <Tor r={0.35} t={0.03} p={[0, 0.1, 0.05]} rot={[0, 0, 0]} sc={[1, 1.62, 0.5]} m={rim} seg={28} />
            <Box s={[0.05, 0.8, 0.05]} p={[0, 0.1, 0.09]} m={rim} cast={false} />
            <Ball rad={0.14} sc={[0.9, 0.9, 1.5]} p={[0, 0.58, 0.12]} m={cu} />
            <Ball rad={0.05} p={[0.1, -0.05, 0.1]} m={M.plain('#8a2a1c')} />
            <Ball rad={0.05} p={[-0.1, -0.05, 0.1]} m={M.plain('#8a2a1c')} />
          </group>
        </group>
      </group>
    );
  }

  /* ---------- gilt trishul ---------- */
  function Trishul({ p, h = 1.5 }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.025} h={h} p={[0, h / 2, 0]} m={M.gold} seg={8} />
        <Box s={[0.28, 0.035, 0.035]} p={[0, h - 0.12, 0]} m={M.gold} />
        <mesh position={[0, h + 0.14, 0]} material={M.gold} castShadow><coneGeometry args={[0.035, 0.34, 6]} /></mesh>
        {[-1, 1].map((k) => (
          <group key={k}>
            <Cyl rt={0.02} h={0.26} p={[k * 0.14, h - 0.02, 0]} m={M.gold} seg={6} />
            <mesh position={[k * 0.14, h + 0.2, 0]} material={M.gold} castShadow><coneGeometry args={[0.03, 0.2, 6]} /></mesh>
          </group>
        ))}
        <Ball rad={0.045} sc={[1, 1.3, 1]} p={[0.07, h - 0.4, 0]} m={M.plain('#e8a020')} />
      </group>
    );
  }

  function Person({ p, c = '#c0392b', s = 1, r = 0 }) {
    const M = useM();
    return (
      <group position={p} scale={s} rotation={[0, r, 0]}>
        <mesh position={[0, 0.3, 0]} material={M.plain(c, { roughness: 0.9 })}><capsuleGeometry args={[0.085, 0.3, 4, 8]} /></mesh>
        <Ball rad={0.07} p={[0, 0.66, 0]} m={M.plain('#c99a76')} />
      </group>
    );
  }

  /* ---------- the sanctum: single storey, four doors, boulder linga inside ---------- */
  function WallSide({ rot, W, m, trim }) {
    const dw = rot === 0 ? 1.1 : 0.7; const wh = 1.25; const t = 0.2; const sx = (W / 2 - dw / 2) / 2 + dw / 4 + 0.0;
    const pw = W / 2 - dw / 2;
    return (
      <group rotation={[0, rot, 0]}>
        <Box s={[pw, wh, t]} p={[-(dw / 2 + pw / 2), wh / 2, W / 2]} m={m} />
        <Box s={[pw, wh, t]} p={[dw / 2 + pw / 2, wh / 2, W / 2]} m={m} />
        <Box s={[dw + 0.1, wh - 0.95, t]} p={[0, 0.95 + (wh - 0.95) / 2, W / 2]} m={m} />
        {[-1, 1].map((k) => <Box key={k} s={[0.07, 0.97, t + 0.04]} p={[k * (dw / 2 + 0.035), 0.485, W / 2]} m={trim} cast={false} />)}
        <Box s={[dw + 0.18, 0.07, t + 0.04]} p={[0, 0.97, W / 2]} m={trim} cast={false} />
        {sx > 99 && null}
      </group>
    );
  }
  function Sanctum({ p }) {
    const M = useM();
    const W = 2.3;
    const wall = M.plain('#eee3cc', { roughness: 0.9 });
    const trim = M.plain('#d9722b', { roughness: 0.7 });
    const roofM = M.plain('#8f2f28', { metalness: 0.25, roughness: 0.6 });
    const rock = M.plain('#3e3a36', { roughness: 0.95 });
    const silver = M.plain('#d4d8dc', { metalness: 0.8, roughness: 0.25 });
    const mari = M.plain('#f09a1a', { roughness: 0.8 });
    const mari2 = M.plain('#ffd23a', { roughness: 0.8 });
    return (
      <group position={p} scale={1.1}>
        <Box s={[W + 0.7, 0.16, W + 0.7]} p={[0, 0.08, 0]} m={M.plain('#c9c1b0')} />
        <Box s={[1.3, 0.08, 0.4]} p={[0, 0.04, W / 2 + 0.55]} m={M.plain('#bdb5a4')} />
        <Box s={[W - 0.2, 0.02, W - 0.2]} p={[0, 0.17, 0]} m={M.plain('#f4f3ee')} cast={false} />
        <group position={[0, 0.16, 0]}>
          {[0, PI / 2, PI, -PI / 2].map((r) => <WallSide key={r} rot={r} W={W} m={wall} trim={trim} />)}
          <Box s={[W + 0.12, 0.08, W + 0.12]} p={[0, 1.25, 0]} m={trim} cast={false} />
        </group>
        <Roof w={W + 0.7} d={W + 0.7} h={0.38} y={1.5} m={roofM} sag={1} lift={0.04} />
        <Gajur y={1.86} s={0.16} />
        <group position={[0, 0.16, -W / 2 - 0.05]}>
          <Box s={[0.84, 1.0, 0.05]} p={[0, 0.5, 0]} m={trim} />
          {[-0.28, 0, 0.28].map((x) => <Box key={x} s={[0.03, 0.96, 0.07]} p={[x, 0.5, 0]} m={M.plain('#7a3a14')} cast={false} />)}
          {[0.25, 0.5, 0.75].map((y) => <Box key={y} s={[0.84, 0.03, 0.07]} p={[0, y, 0]} m={M.plain('#7a3a14')} cast={false} />)}
        </group>
        {/* the linga: huge rough black boulder, three silver stripes, marigold garlands */}
        <group position={[0, 0.17, 0]}>
          <Cyl rt={0.5} rb={0.55} h={0.1} p={[0, 0.05, 0]} m={M.plain('#c9c1b0')} />
          <Ball rad={0.34} sc={[1, 1.15, 0.95]} p={[0, 0.4, 0]} m={rock} />
          {[[-0.08, 0.335], [0.04, 0.34], [0.16, 0.318]].map(([dy, rr], i) => (
            <Tor key={i} r={rr} t={0.014} p={[0, 0.4 + dy, 0]} rot={[PI / 2, 0, 0]} m={silver} seg={28} />
          ))}
          <Tor r={0.285} t={0.05} p={[0, 0.65, 0]} rot={[PI / 2, 0, 0]} m={mari} seg={22} />
          <Tor r={0.25} t={0.04} p={[0, 0.72, 0]} rot={[PI / 2, 0.3, 0]} m={mari2} seg={22} />
          <Trishul p={[-0.62, 0, 0.25]} h={0.95} />
        </group>
        <pointLight position={[0, 0.9, 0.2]} intensity={0.9} distance={3.2} color="#ffb060" />
      </group>
    );
  }

  /* ---------- wide steel shed along the back of the court: red-maroon roof, green-teal posts ---------- */
  function Shed() {
    const M = useM();
    const green = M.plain('#2f6b57', { metalness: 0.3, roughness: 0.6 });
    const roofM = M.plain('#8c2d26', { metalness: 0.3, roughness: 0.55 });
    const truss = M.plain('#e0a030', { metalness: 0.3, roughness: 0.6 });
    const x0 = -7; const x1 = 7; const z0 = -7.8; const z1 = -4.4; const ha = 2.9; const hb = 2.4; const n = 9; const lift = 0.8;
    const D = z1 - z0; const th = Math.atan2(ha - hb, D); const span = Math.hypot(D, ha - hb);
    const xs = Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n);
    const bay = [-1.6, 2.2];
    return (
      <group>
        {xs.map((x, i) => (
          <group key={i}>
            <Box s={[0.1, ha, 0.1]} p={[x, ha / 2, z0]} m={green} />
            <Box s={[0.1, hb, 0.1]} p={[x, hb / 2, z1]} m={green} />
            <Box s={[0.05, 0.05, span]} p={[x, (ha + hb) / 2 - 0.1, (z0 + z1) / 2]} r={[th, 0, 0]} m={truss} cast={false} />
          </group>
        ))}
        <Box s={[14.3, 0.08, span + 0.6]} p={[0, (ha + hb) / 2 + 0.07, (z0 + z1) / 2 + 0.1]} r={[th, 0, 0]} m={roofM} />
        <Box s={[14.3, 0.2, 0.08]} p={[0, hb, z1 + 0.35]} m={M.plain('#b83a2c')} cast={false} />
        {[bay[0], bay[1]].map((x, i) => (
          <group key={i}>
            <Box s={[0.1, lift + 0.2, 0.1]} p={[x, hb + lift / 2, z1]} m={green} />
            <Box s={[0.1, lift + 0.2, 0.1]} p={[x, ha + lift / 2, z0]} m={green} />
          </group>
        ))}
        <Box s={[bay[1] - bay[0] + 0.5, 0.08, span + 0.7]} p={[(bay[0] + bay[1]) / 2, (ha + hb) / 2 + 0.07 + lift, (z0 + z1) / 2 + 0.1]} r={[th, 0, 0]} m={roofM} />
        <Box s={[bay[1] - bay[0] + 0.5, 0.22, 0.08]} p={[(bay[0] + bay[1]) / 2, hb + lift, z1 + 0.45]} m={M.plain('#b83a2c')} cast={false} />
        <Box s={[14, 0.08, 0.08]} p={[0, ha - 0.03, z0]} m={green} cast={false} />
        <Box s={[14, 0.08, 0.08]} p={[0, hb - 0.03, z1]} m={green} cast={false} />
        <Box s={[14, 1.05, 0.1]} p={[0, 0.52, z0 + 0.05]} m={M.plain('#d98a3a', { roughness: 0.95 })} />
        {[-5.8, -3.2, 5.6].map((x, i) => <Box key={i} s={[1.3, 0.2, 0.5]} p={[x, 0.1, z0 + 0.8]} m={M.plain('#6b5a48')} />)}
        <Person p={[-5.6, 0, -5.4]} c="#d4452f" /><Person p={[-4.4, 0, -5.0]} c="#2f7d5a" s={0.9} />
        <Person p={[-2.6, 0, -5.6]} c="#e0a030" /><Person p={[5.2, 0, -5.4]} c="#c0392b" s={0.95} />
        <Person p={[6.2, 0, -5.8]} c="#3a6ea5" /><Person p={[-6.2, 0, -6.2]} c="#d4452f" s={0.9} />
        <Person p={[3.8, 0, -5.0]} c="#2f7d5a" s={0.95} /><Person p={[-3.4, 0, -4.9]} c="#8a3a8a" />
        <Person p={[4.6, 0, -4.7]} c="#e0a030" s={0.9} /><Person p={[-1.0, 0, -4.7]} c="#3a6ea5" s={0.95} />
      </group>
    );
  }

  /* ---------- little shrines at the court edge, deliberately irregular ---------- */
  function GableRoof({ w, d, y, m }) {
    const a = 0.62; const hh = (d / 2) / Math.cos(a) + 0.06;
    return (
      <group position={[0, y, 0]}>
        <Box s={[w, 0.05, hh]} p={[0, (d / 4) * Math.tan(a), d / 4]} r={[a, 0, 0]} m={m} />
        <Box s={[w, 0.05, hh]} p={[0, (d / 4) * Math.tan(a), -d / 4]} r={[-a, 0, 0]} m={m} />
      </group>
    );
  }
  function Shrine({ p, r = 0, kind }) {
    const M = useM();
    const white = M.plain('#f1ebdd'); const red = M.plain('#a8402e', { metalness: 0.2, roughness: 0.6 });
    const grey = M.plain('#9a968c'); const dk = M.plain('#2c2622');
    const lg = M.plain('#3d3a38', { roughness: 0.6 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        {kind === 'gable' && (
          <>
            <Box s={[1.15, 0.1, 1.05]} p={[0, 0.05, 0]} m={grey} />
            <Box s={[0.95, 1.0, 0.85]} p={[0, 0.6, 0]} m={white} />
            <Box s={[0.34, 0.5, 0.05]} p={[0, 0.35, 0.44]} m={dk} cast={false} />
            <GableRoof w={1.2} d={1.1} y={1.1} m={red} />
          </>
        )}
        {kind === 'hip' && (
          <>
            <Cyl rt={0.55} rb={0.6} h={0.1} p={[0, 0.05, 0]} m={grey} seg={16} />
            <Cyl rt={0.4} rb={0.42} h={0.8} p={[0, 0.5, 0]} m={M.plain('#6fb5b0')} seg={16} />
            <Box s={[0.3, 0.46, 0.05]} p={[0, 0.33, 0.41]} m={dk} cast={false} />
            <mesh position={[0, 1.18, 0]} material={M.plain('#d9692a', { metalness: 0.4 })} castShadow><coneGeometry args={[0.58, 0.45, 16]} /></mesh>
            <Ball rad={0.05} p={[0, 1.44, 0]} m={M.gold} />
          </>
        )}
        {kind === 'open' && (
          <>
            <Box s={[1.2, 0.14, 1.2]} p={[0, 0.07, 0]} m={grey} />
            {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => <Box key={i} s={[0.08, 0.95, 0.08]} p={[x, 0.62, z]} m={M.plain('#7a2a22')} />)}
            <Ball rad={0.15} sc={[1, 1.2, 1]} p={[0, 0.3, 0]} m={lg} />
            <Roof w={1.4} d={1.4} h={0.3} y={1.1} m={M.plain('#9aa0a4', { metalness: 0.5 })} sag={1} lift={0.05} />
          </>
        )}
        {kind === 'stone' && (
          <>
            <Box s={[1.0, 0.1, 1.0]} p={[0, 0.05, 0]} m={grey} />
            <Box s={[0.8, 0.7, 0.8]} p={[0, 0.45, 0]} m={M.plain('#8b8780')} />
            <Box s={[0.28, 0.42, 0.05]} p={[0, 0.31, 0.41]} m={dk} cast={false} />
            <Box s={[0.95, 0.07, 0.95]} p={[0, 0.84, 0]} m={M.plain('#a29e94')} />
            <Box s={[0.7, 0.2, 0.7]} p={[0, 0.98, 0]} m={M.plain('#8b8780')} />
            <Box s={[0.45, 0.2, 0.45]} p={[0, 1.18, 0]} m={M.plain('#9a968c')} />
            <mesh position={[0, 1.45, 0]} material={M.plain('#a29e94')} castShadow><coneGeometry args={[0.22, 0.4, 4]} /></mesh>
            <Cyl rt={0.012} h={0.5} p={[0.3, 1.1, 0.3]} m={dk} seg={6} />
            <Box s={[0.22, 0.14, 0.01]} p={[0.41, 1.25, 0.3]} m={M.plain('#c0392b')} cast={false} />
          </>
        )}
      </group>
    );
  }

  /* ---------- court-edge lamps ---------- */
  function Lamp({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.03} rb={0.045} h={1.9} p={[0, 0.95, 0]} m={M.plain('#4a4f52', { metalness: 0.5 })} seg={8} />
        <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.09, 10, 8]} /><meshBasicMaterial color="#ffe6a8" toneMapped={false} /></mesh>
        <pointLight position={[0, 1.9, 0]} intensity={0.8} distance={5} color="#ffd48a" />
      </group>
    );
  }

  /* ---------- low flat-roofed stalls along the lane below the court ---------- */
  function Stall({ x, z = 11.0, wall, awn }) {
    const M = useM();
    return (
      <group position={[x, -1.0, z]}>
        <Box s={[1.15, 1.3, 0.8]} p={[0, 0.65, 0]} m={wall} />
        <Box s={[1.3, 0.07, 1.25]} p={[0, 1.33, 0.2]} r={[0.12, 0, 0]} m={awn} />
        <Box s={[0.95, 0.85, 0.04]} p={[0, 0.45, 0.41]} m={M.plain('#6a4a30')} cast={false} />
        {[-0.36, -0.12, 0.12, 0.36].map((dx, i) => <Box key={i} s={[0.02, 0.85, 0.05]} p={[dx, 0.45, 0.43]} m={M.plain('#3a2a1c')} cast={false} />)}
        <Box s={[0.9, 0.08, 0.22]} p={[0, 0.2, 0.55]} m={M.plain('#7a5a3a')} />
        {[-0.3, 0, 0.3].map((dx, i) => <Ball key={i} rad={0.06} p={[dx, 0.3, 0.55]} m={M.plain(['#c0392b', '#e8c040', '#3a8a4a'][i])} />)}
      </group>
    );
  }

  /* ================= MAIN ================= */
  function DoleshworMain() {
    const M = useM();
    const conc = M.plain('#b9b2a0', { roughness: 1 });
    const joint = M.plain('#a29c8a', { roughness: 1 });
    const red1 = M.plain('#a8402e'); const red2 = M.plain('#c24a33');
    const nandiGrey = M.plain('#6e6b68', { roughness: 0.9 });
    const mud = M.plain('#8c8068', { roughness: 1 }); const mud2 = M.plain('#7d725c', { roughness: 1 }); const grey = M.plain('#a09e98', { roughness: 1 });
    const horn = M.plain('#d9d2c0');
    const redM = M.plain('#b5301f', { roughness: 0.8 });
    const goldB = M.plain('#d19a3a', { metalness: 0.55, roughness: 0.35 });
    const orangeB = M.plain('#c8793a', { roughness: 0.6 });
    const cu = M.plain('#d9692a', { metalness: 0.6, roughness: 0.4 });
    const yel = M.plain('#e2b830', { roughness: 0.7 });
    const glass = M.plain('#cfe6ea', { transparent: true, opacity: 0.35, roughness: 0.1 });
    const brickM = M.mat('brick', 2, 1, { color: '#e9b49c' });
    const steps = [0, 1, 2, 3, 4];
    const walls = [M.plain('#f1ebdd'), brickM, M.mat('ochre', 1, 1, { color: '#f0d8a0' }), M.plain('#e6d8c0'), brickM];
    const yAw = M.plain('#e8c040', { roughness: 0.8 }); const oAw = M.plain('#e0802a', { roughness: 0.8 });
    return (
      <group>
        <Frame s={[11.5, 5.2, 12]} p={[2.2, 2.3, -1.2]} />
        {/* pale concrete court, faded joints, mud and grey patches */}
        <Box s={[14, 1.3, 15]} p={[0, -0.65, -0.5]} m={conc} cast={false} />
        {[-4.5, -2.25, 0, 2.25, 4.5].map((x) => <Box key={`jx${x}`} s={[0.025, 0.012, 15]} p={[x, 0.004, -0.5]} m={joint} cast={false} />)}
        {[-5.5, -3, -0.5, 2, 4.5].map((z) => <Box key={`jz${z}`} s={[14, 0.012, 0.025]} p={[0, 0.004, z]} m={joint} cast={false} />)}
        {[[-3, 2.5, 3.2, 2.2, 0], [4.5, 1.8, 2.4, 1.6, 1], [-5, 5, 2.4, 1.6, 0], [0.5, 4.4, 2.8, 1.4, 2], [6.5, 5.5, 1.8, 2, 2], [-1, -0.8, 2.2, 1.0, 2], [3.5, 3.0, 2.0, 1.4, 0]].map(([x, z, w, d, k], i) => (
          <Box key={`pt${i}`} s={[w, 0.014, d]} p={[x, 0.007, z]} m={k === 0 ? mud : k === 1 ? grey : mud2} cast={false} />
        ))}
        <Box s={[14.1, 1.25, 0.1]} p={[0, -0.65, 7.04]} m={M.mat('stone', 6, 1, { color: '#cfc6b0' })} cast={false} />
        {[-0.3, -0.62, -0.95].map((y) => <Box key={y} s={[14.15, 0.025, 0.12]} p={[0, y, 7.06]} m={M.plain('#7c7566')} cast={false} />)}
        <Box s={[14.2, 0.1, 0.3]} p={[0, -0.03, 7.0]} m={M.plain('#d4cdbb')} cast={false} />
        {/* broad low steps from the lane */}
        {steps.map((k) => {
          const top = -(k + 1) * (1 / 6); const dep = 0.45 * (5 - k);
          return <Box key={k} s={[8, top + 1, dep]} p={[0.6, (top - 1) / 2, 7 + dep / 2]} m={M.plain(k % 2 ? '#c4bdad' : '#cfc8b8', { roughness: 1 })} />;
        })}
        {[-3.4, 4.6].map((x) => <Box key={x} s={[0.1, 0.55, 2.4]} p={[x, -0.25, 8.2]} m={M.plain('#2f6b57')} cast={false} />)}
        {/* low flat-roofed stalls with thin yellow and orange awnings, shutters below */}
        {[-9.2, -7.4, -5.6, -3.8].map((x, i) => <Stall key={x} x={x} wall={walls[i % 5]} awn={i % 2 ? oAw : yAw} />)}
        {[7.4, 9.2].map((x, i) => <Stall key={x} x={x} wall={walls[(i + 2) % 5]} awn={i % 2 ? yAw : oAw} />)}

        {/* shed behind, the sanctum in its open bay, the big Nandi on a two-step plinth in front of both */}
        <Shed />
        <Sanctum p={[0.3, 0, -6.0]} />
        <Box s={[2.7, 0.7, 4.0]} p={[1.8, 0.35, -0.5]} m={M.plain('#8f3426', { roughness: 0.95 })} />
        <Box s={[2.35, 0.6, 3.6]} p={[1.8, 1.0, -0.5]} m={M.plain('#9c3a2c', { roughness: 0.95 })} />
        <Box s={[2.55, 0.08, 3.8]} p={[1.8, 1.34, -0.5]} m={M.plain('#b9604c', { roughness: 0.9 })} />
        {[[-0.9, 0.3], [-0.3, 0.45], [0.35, 0.35], [0.9, 0.5]].map(([dx, hh], i) => (
          <Box key={`sf${i}`} s={[0.1, hh, 0.02]} p={[1.8 + dx, 0.7 - hh / 2, 1.52]} m={M.plain('#b5201a')} cast={false} />
        ))}
        {[[-0.8, 0.35], [0.0, 0.5], [0.7, 0.3]].map(([dz, hh], i) => (
          <Box key={`sg${i}`} s={[0.02, hh, 0.12]} p={[3.16, 1.3 - hh / 2, -0.5 + dz * 1.4]} m={M.plain('#b5201a')} cast={false} />
        ))}
        {[[-0.7, 0.3], [0.5, 0.4]].map(([dx, hh], i) => (
          <Box key={`sh${i}`} s={[0.1, hh, 0.02]} p={[1.8 + dx, 1.3 - hh / 2, 1.3]} m={M.plain('#b5201a')} cast={false} />
        ))}
        <Box s={[0.9, 0.1, 0.02]} p={[1.8, 0.4, 1.51]} m={M.gold} cast={false} />
        <NandiFig p={[1.8, 1.34, -0.4]} r={PI} s={3.2} body={nandiGrey} horn={horn} red={redM} />
        <NandiFig p={[0.5, 0, 2.0]} r={PI * 0.9} s={0.6} body={orangeB} horn={horn} red={redM} />
        <NandiFig p={[3.1, 0, 2.0]} r={PI * 1.1} s={0.6} body={M.plain('#8a4a2a')} horn={horn} red={redM} />
        <Trishul p={[3.8, 0, 1.6]} h={2.0} />
        <Trishul p={[-0.2, 0, 1.4]} h={1.7} />
        {/* gold Nandi on a red base, front-right where the camera sees it */}
        <Box s={[1.1, 0.18, 1.5]} p={[6.2, 0.09, -0.6]} m={red1} />
        <NandiFig p={[6.2, 0.18, -0.85]} r={0.5} s={1.2} body={goldB} horn={goldB} red={redM} />
        {/* low brick building beyond the shed's right end */}
        <Box s={[2.4, 1.3, 2.0]} p={[9.8, 0.35, -3.5]} m={brickM} />
        <Box s={[0.5, 0.35, 0.05]} p={[9.0, 0.45, -2.48]} m={M.plain('#26221f')} cast={false} />
        <Box s={[2.8, 0.06, 2.4]} p={[9.8, 1.05, -3.5]} r={[0.12, 0, 0]} m={M.plain('#7f858a', { metalness: 0.5, roughness: 0.5 })} />
        {/* huge copper cobra and its glass offering box near the entry steps, front-right */}
        <Cobra p={[6.4, 0, 3.6]} r={0.4} s={1.2} />
        <Box s={[0.95, 0.75, 0.8]} p={[5, 0.4, 3.6]} m={glass} cast={false} />
        <Box s={[1.0, 0.06, 0.86]} p={[5, 0.79, 3.6]} m={M.plain('#b8a890')} cast={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Box key={i} s={[0.06, 0.75, 0.06]} p={[5 + a * 0.47, 0.4, 3.6 + b * 0.4]} m={M.plain('#b8a890')} cast={false} />)}
        <Person p={[5.8, 0, 5.2]} c="#d4252f" /><Person p={[2.4, 0, 3.2]} c="#2f7d5a" s={0.95} />
        {/* copper-orange chhatra on a tall pole, yellow-canopied kiosk */}
        <Box s={[0.3, 0.12, 0.3]} p={[-1.3, 0.06, 0.5]} m={M.plain('#8a847a')} />
        <Cyl rt={0.022} h={2.35} p={[-1.3, 1.2, 0.5]} m={M.plain('#7a6a4a', { metalness: 0.5 })} seg={8} />
        <mesh position={[-1.3, 2.4, 0.5]} material={cu} castShadow><coneGeometry args={[0.55, 0.3, 18]} /></mesh>
        <Cyl rt={0.55} h={0.05} p={[-1.3, 2.26, 0.5]} m={M.plain('#e8a040', { metalness: 0.5 })} seg={18} />
        <Ball rad={0.05} p={[-1.3, 2.6, 0.5]} m={M.gold} />
        <group position={[-3.4, 0, 2.6]}>
          <Box s={[0.7, 0.6, 0.7]} p={[0, 0.3, 0]} m={M.plain('#77766f')} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Box key={i} s={[0.04, 0.45, 0.04]} p={[a * 0.32, 0.82, b * 0.32]} m={M.plain('#b09040')} cast={false} />)}
          <mesh position={[0, 1.2, 0]} rotation={[0, PI / 4, 0]} material={yel} castShadow><coneGeometry args={[0.62, 0.34, 4]} /></mesh>
        </group>
        {/* four small shrines, each different, and the taps */}
        <Shrine p={[-5.6, 0, 3.4]} r={0.15} kind="gable" />
        <Shrine p={[8.2, 0, 1.0]} r={-0.1} kind="open" />
        <Shrine p={[-2.0, 0, 5.4]} r={0.3} kind="stone" />
        <Shrine p={[1.4, 0, 5.8]} r={-0.2} kind="hip" />
        <group position={[-6.4, 0, 0.8]}>
          <Box s={[0.3, 0.4, 1.7]} p={[0, 0.2, 0]} m={M.plain('#9ea4a8')} />
          {[-0.6, -0.2, 0.2, 0.6].map((z) => <Cyl key={z} rt={0.02} h={0.18} p={[-0.2, 0.5, z]} r={[0, 0, PI / 2]} m={M.plain('#4a8aa8', { metalness: 0.6 })} seg={6} />)}
        </group>
        <Lamp p={[-3.2, 0, 0.8]} /><Lamp p={[4.2, 0, 1.4]} />
        {[[0.2, 0, 2.6], [1.6, 0, 2.5], [2.8, 0, 2.7]].map((q, i) => (
          <group key={i} position={q}>
            <Cyl rt={0.07} rb={0.04} h={0.04} p={[0, 0.02, 0]} m={M.plain('#8b4a2a')} seg={10} />
            <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.025, 0.08, 8]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
          </group>
        ))}
        <Person p={[1.2, 0, 3.0]} c="#d4452f" s={0.95} r={PI} /><Person p={[3.6, 0, 3.2]} c="#e0a030" s={0.9} /><Person p={[-1.6, 0, 2.0]} c="#2f7d5a" /><Person p={[0.3, 0, 3.8]} c="#3a6ea5" /><Person p={[-0.6, 0, 4.2]} c="#e0a030" s={0.9} />
      </group>
    );
  }

  /* ================= ENV ================= */
  function House({ p, w, d, h, r, kind }) {
    const M = useM();
    const wall = kind === 'w' ? M.plain('#efe8d8') : kind === 'o' ? M.mat('ochre', 1, 1, { color: '#e8c890' }) : M.mat('brick', 1.5, 1, { color: '#e9b49c' });
    const roof = kind === 'o' ? M.plain('#9c4a30', { roughness: 0.8 }) : M.plain('#8e9498', { metalness: 0.4, roughness: 0.6 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wall} />
        <Roof w={w + 0.35} d={d + 0.35} h={0.45} y={h} m={roof} sag={1} lift={0} fascia={false} />
        <Box s={[0.28, 0.26, 0.04]} p={[-w * 0.22, h * 0.6, d / 2 + 0.01]} m={M.plain('#2a2a2a', { emissive: '#ffb347', emissiveIntensity: 0.35 })} cast={false} />
        <Box s={[0.28, 0.5, 0.04]} p={[w * 0.2, 0.26, d / 2 + 0.01]} m={M.plain('#4a2c18')} cast={false} />
      </group>
    );
  }

  function BigTree({ p, s = 1 }) {
    const M = useM();
    const l1 = M.plain('#3f6f34', { roughness: 1 }); const l2 = M.plain('#4f8040', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.14} rb={0.24} h={1.7} p={[0, 0.85, 0]} m={M.plain('#5a4030')} seg={8} />
        <Cyl rt={0.07} rb={0.12} h={1} p={[0.4, 1.9, 0.1]} r={[0, 0, -0.8]} m={M.plain('#5a4030')} seg={6} />
        <Cyl rt={0.07} rb={0.12} h={1} p={[-0.4, 1.9, -0.1]} r={[0, 0, 0.8]} m={M.plain('#5a4030')} seg={6} />
        {[[0, 2.9, 0, 1.15, l1], [0.9, 2.5, 0.2, 0.85, l2], [-0.9, 2.5, -0.2, 0.9, l2], [0.3, 3.4, -0.4, 0.8, l2], [-0.4, 3.2, 0.5, 0.75, l1], [1.2, 3.0, -0.6, 0.65, l1], [-1.3, 3.0, 0.4, 0.6, l1]].map(([x, y, z, r, m], i) => <Ball key={i} rad={r} p={[x, y, z]} m={m} />)}
      </group>
    );
  }

  const bare = (x, z) => (((x + 4) / 7.5) ** 2 + ((z + 15.5) / 4.8) ** 2 < 1) || (((x - 9) / 5.5) ** 2 + ((z + 17) / 4.2) ** 2 < 1);
  function DoleshworEnv() {
    const M = useM();
    /* terrain with vertex colours */
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(150, 150, 170, 170);
      g.rotateX(-PI / 2);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
      const fields = ['#86a844', '#6f9a3a', '#b9b24a', '#7aa145', '#9aae4e', '#5f8f3a'];
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i); const h = hAt(x, z); pos.setY(i, h);
        const ax = Math.abs(x);
        if (z > 14 && z < 50 && ax < 30) {
          const b = Math.floor(0.3 * (z - 14) + 1e-6);
          c.set(fields[Math.floor(hash(b * 7 + Math.floor((x + 70) / 11)) * fields.length)]);
          if (z > 43.5) c.set('#6f8a48');
        } else if (z > 49 || ax > 20) {
          c.set('#456f3a'); c.offsetHSL(0, 0, (wob(x * 1.7, z * 1.3) - 0.2) * 0.06);
        } else if (h > 0.5) {
          c.set(h < 5 ? '#2d5530' : '#3f6b35'); c.offsetHSL(0, 0, (wob(x * 1.9, z * 1.4)) * 0.05);
          if (wob(x * 0.9 + 5, z * 0.8) > 0.55 && h < 14) c.set('#8c7d55');
          if (bare(x, z)) c.set(wob(x * 3, z * 3) > 0.1 ? '#8c7d55' : '#7a6c48');
        } else { c.set('#86a052'); c.offsetHSL(0, 0, wob(x * 2.3, z * 2.1) * 0.04); }
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const tMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), []);
    const leaf = M.plain('#ffffff', { roughness: 1 });
    const ico = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const cone = useMemo(() => new THREE.ConeGeometry(1, 2.4, 7), []);
    const trees = useMemo(() => {
      const A = []; const B = []; const greens = ['#2f5a2c', '#3b6b34', '#47783a', '#2c5530', '#5f8a3c', '#274a2e', '#6b9040'];
      for (let i = 0; i < 2400; i += 1) {
        const x = (hash(i * 3 + 1) - 0.5) * 140; const z = (hash(i * 3 + 2) - 0.5) * 140;
        const ax = Math.abs(x);
        const forest = (z < -9.5 && ax < 70) || (ax > 17 && z < 14) || (z > 52) || (ax > 32 && z > 14);
        if (!forest) continue;
        if (ax < 15 && z > -10.5 && z < 14) continue;
        if (bare(x, z)) continue;
        const s = 0.55 + hash(i * 5 + 4) * hash(i * 13 + 2) * 2.0; const y = hAt(x, z);
        const col = greens[Math.floor(hash(i * 7) * greens.length)];
        if (hash(i * 11) > 0.62) B.push([x, y + s * 0.9, z, s * 0.8, s * 1.2, s * 0.8, 0, col]);
        else A.push([x, y + s * 0.5, z, s, s * 0.9, s, hash(i) * 6, col]);
      }
      for (let i = 5000; i < 6100; i += 1) {
        const x = (hash(i * 3 + 1) - 0.5) * 90; const z = -9.5 - hash(i * 3 + 2) * 21;
        if (bare(x, z) || (Math.abs(x) < 24 && hash(i * 17) < 0.5)) continue;
        const s = 0.8 + hash(i * 5 + 4) * hash(i * 13 + 2) * 2.2; const y = hAt(x, z);
        const col = greens[Math.floor(hash(i * 7) * greens.length)];
        if (hash(i * 11) > 0.55) B.push([x, y + s * 0.9, z, s * 0.8, s * 1.2, s * 0.8, 0, col]);
        else A.push([x, y + s * 0.5, z, s, s * 0.9, s, hash(i) * 6, col]);
      }
      return { A, B };
    }, []);
    const houses = [
      [-9, 2, 1.6, 1.3, 1.0, 0.1, 'b'], [6, 1, 1.5, 1.2, 0.9, -0.1, 'w'], [12, 3, 1.8, 1.4, 1.2, 0.2, 'b'], [-14, 4, 1.4, 1.2, 0.9, 0, 'o'],
      [2, 5, 1.6, 1.3, 1.1, 0.15, 'b'], [-5, 6, 1.7, 1.3, 1.0, -0.1, 'w'], [9, 7, 1.5, 1.2, 1.2, 0.1, 'b'], [16, 6, 1.4, 1.2, 0.9, 0, 'o'],
      [-18, 7, 1.7, 1.4, 1.1, 0.2, 'b'], [-2, 8, 1.6, 1.3, 1.0, 0, 'b'], [-12, 0, 1.5, 1.3, 1.0, 0.1, 'w'], [14, 0, 1.6, 1.2, 1.1, -0.1, 'b'],
      [-8, 3, 1.3, 1.1, 0.9, 0.3, 'b'], [18, 8, 1.5, 1.3, 1.0, 0, 'w'], [5, 4, 1.4, 1.2, 1.0, -0.2, 'o'], [-16, 1, 1.5, 1.2, 1.1, 0, 'b'],
    ];
    const streamPts = Array.from({ length: 16 }, (_, i) => { const x = -66 + i * 8.8; return [x, 47 + 2.2 * Math.sin(x * 0.11)]; });
    const lane = M.plain('#8f8878', { roughness: 1 });
    const wallM = M.plain('#b3ab9a');
    return (
      <group>
        <mesh geometry={geo} material={tMat} receiveShadow />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -14, 0]} material={M.plain('#5a7f3a', { roughness: 1 })}><circleGeometry args={[130, 40]} /></mesh>
        {/* lane below the steps */}
        <Box s={[40, 0.06, 3.4]} p={[0, -0.99, 11.0]} m={lane} cast={false} />
        <Box s={[14.2, 1.1, 0.3]} p={[0, -0.5, 7.0]} m={wallM} cast={false} />
        {/* forest */}
        <Inst items={trees.A} m={leaf} geo={ico} />
        <Inst items={trees.B} m={leaf} geo={cone} />
        {/* village below: brick walls, tin roofs, on the terraces */}
        {houses.map(([x, b, w, d, h, r, k], i) => <House key={i} p={[x, hAt(x, bandZ(b)), bandZ(b)]} w={w} d={d} h={h} r={r} kind={k} />)}
        {/* the small stream in the valley to the south */}
        {streamPts.map(([x, z], i) => {
          const nx = streamPts[i + 1] || [x + 8, z]; const a = Math.atan2(nx[1] - z, nx[0] - x);
          return <Box key={i} s={[9.4, 0.14, 2.3]} p={[x + 4.4, hAt(x, z) + 0.1, z + 1.1]} r={[0, -a, 0]} m={M.plain('#6fa3c4', { roughness: 0.2, metalness: 0.2 })} cast={false} />;
        })}
        {/* big spreading broadleaf beside the court, and yellow prayer flags on the slope behind */}
        <BigTree p={[-11, hAt(-11, -2), -2]} s={2.4} />
        {[[-5.5, -10.5], [2, -11.5], [9.5, -10]].map(([x, z], i) => (
          <group key={i} position={[x, hAt(x, z), z]}>
            <Cyl rt={0.03} h={3.4} p={[0, 1.7, 0]} m={M.plain('#8a6a3a')} seg={6} />
            <Box s={[0.7, 0.4, 0.02]} p={[0.36, 3.1, 0]} m={M.plain('#e8c040')} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  return { 'doleshwor-mahadev': { Main: DoleshworMain, Env: DoleshworEnv } };
}
