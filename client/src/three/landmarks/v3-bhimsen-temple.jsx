// Bhimsen Temple, Patan Durbar Square (Lalitpur). Built 1680 by Srinivasa Malla. Three-tier Newar pagoda on an unusually
// WIDE rectangular plan: red-brick ground storey, red-brown carved timber upper storeys, terracotta tile roofs shrinking
// about 1 : 0.72 : 0.5, three joined gilded windows in one projecting bay on the first floor, dense raking struts and
// hanging eave bells, gilded pinnacle. A slender metal pillar with a gilded figure stands on the axis in front.
// Front = +z = real east, toward the royal palace. Viewer's left (-x) is south: Vishwanath (2 tiers) on the same
// frontage line, then Krishna Mandir (stone shikhara). Right (+x) is north: brick Newar houses. Sunken Manga Hiti
// water tank with a tiled pavilion lies in the square in front.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Lion, Elephant, Garuda, Chaitya, Diyo, LatticeWindow, Doorway, Spire, THREE, useMemo, useRef, useEffect } = K;

  const PI = Math.PI;
  const DARKW = '#6a2a1e';

  /* ---------- instanced meshes ---------- */
  function Inst({ items, m, kind = 'box', geo, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.rotation.set(0, it[6] || 0, 0);
        o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return (
      <instancedMesh key={items.length} ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {geo ? <primitive object={geo} attach="geometry" />
          : kind === 'sphere' ? <sphereGeometry args={[0.5, 8, 6]} />
            : kind === 'cyl' ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} />
              : <boxGeometry args={[1, 1, 1]} />}
      </instancedMesh>
    );
  }

  /* ---------- raking struts (tunala) under an eave, all four sides and the four corners ---------- */
  function strutGeo(ov, v) {
    const dz = ov - 0.03; const dy = v; const L = Math.hypot(dz - 0.05, dy);
    const g = new THREE.BoxGeometry(0.075, L, 0.16);
    g.rotateX(Math.atan2(dz - 0.05, dy));
    g.translate(0, -v / 2, (dz + 0.05) / 2);
    return g;
  }
  function Struts({ bw, bd, y, ovx, ovz, v = 0.6, sp = 0.5, m }) {
    const gz = useMemo(() => strutGeo(ovz, v), [ovz, v]);
    const gx = useMemo(() => strutGeo(ovx, v), [ovx, v]);
    const gd = useMemo(() => strutGeo(Math.hypot(ovx, ovz) * 0.95, v), [ovx, ovz, v]);
    const fb = useMemo(() => {
      const out = []; const n = Math.max(2, Math.round(bw / sp));
      for (let k = 0; k < n; k += 1) { const x = -bw / 2 + ((k + 0.5) * bw) / n; out.push([x, y, bd / 2, 1, 1, 1, 0], [x, y, -bd / 2, 1, 1, 1, PI]); }
      return out;
    }, [bw, bd, y, sp]);
    const sd = useMemo(() => {
      const out = []; const n = Math.max(2, Math.round(bd / sp));
      for (let k = 0; k < n; k += 1) { const z = -bd / 2 + ((k + 0.5) * bd) / n; out.push([bw / 2, y, z, 1, 1, 1, PI / 2], [-bw / 2, y, z, 1, 1, 1, -PI / 2]); }
      return out;
    }, [bw, bd, y, sp]);
    const cr = useMemo(() => [[1, 1, PI / 4], [-1, 1, -PI / 4], [1, -1, 3 * PI / 4], [-1, -1, -3 * PI / 4]].map(([sx, sz, a]) => [sx * bw / 2, y, sz * bd / 2, 1.15, 1.15, 1.15, a]), [bw, bd, y]);
    return (
      <group>
        <Inst items={fb} m={m} geo={gz} />
        <Inst items={sd} m={m} geo={gx} />
        <Inst items={cr} m={m} geo={gd} />
      </group>
    );
  }

  /** One roof tier: curved tile roof, dark soffit, gilded eave trim and hanging bells. */
  function RoofTier({ w, d, h, y, sag = 1.45, lift = 0.22, bells = true, tile, gilt = false, fasc }) {
    const M = useM();
    const bellItems = useMemo(() => {
      if (!bells) return [];
      const out = [];
      const nx = Math.max(3, Math.round(w / 0.5)); const nz = Math.max(3, Math.round(d / 0.5));
      for (let k = 0; k < nx; k += 1) { const x = -w / 2 + 0.2 + (k * (w - 0.4)) / (nx - 1); out.push([x, y - 0.17, d / 2 - 0.03, 0.08, 0.14, 0.08, 0], [x, y - 0.17, -d / 2 + 0.03, 0.08, 0.14, 0.08, 0]); }
      for (let k = 0; k < nz; k += 1) { const z = -d / 2 + 0.2 + (k * (d - 0.4)) / (nz - 1); out.push([w / 2 - 0.03, y - 0.17, z, 0.08, 0.14, 0.08, 0], [-w / 2 + 0.03, y - 0.17, z, 0.08, 0.14, 0.08, 0]); }
      return out;
    }, [w, d, y, bells]);
    return (
      <group>
        <Roof w={w} d={d} h={h} y={y} m={tile} sag={sag} lift={lift} />
        <Box s={[w - 0.04, 0.07, d - 0.04]} p={[0, y - 0.06, 0]} m={M.dark} cast={false} />
        {[0, 1].map((k) => <Box key={k} s={[w + 0.02, 0.11, 0.07]} p={[0, y + 0.06, (k ? -1 : 1) * (d / 2 + 0.01)]} m={gilt ? M.gold : fasc} cast={false} />)}
        {[0, 1].map((k) => <Box key={k} s={[0.07, 0.11, d + 0.02]} p={[(k ? -1 : 1) * (w / 2 + 0.01), y + 0.06, 0]} m={gilt ? M.gold : fasc} cast={false} />)}
        <Inst items={bellItems} m={M.gold} kind="sphere" />
      </group>
    );
  }

  /** One of the three separate projecting windows of the first-floor bay: dark timber box, gilt lattice, small gilt canopy. */
  function ProjWin({ p, w = 1.1, h = 1.0, dp = 0.35 }) {
    const M = useM();
    const timber = M.plain(DARKW, { roughness: 0.8 });
    const dark = M.plain('#2a1208', { emissive: '#8a4a10', emissiveIntensity: 0.3, roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[w, h, dp]} p={[0, 0, dp / 2]} m={timber} />
        <Box s={[w - 0.2, h - 0.24, 0.05]} p={[0, -0.03, dp + 0.005]} m={dark} cast={false} />
        {[-0.36, -0.18, 0, 0.18, 0.36].map((x) => <Box key={x} s={[0.028, h - 0.28, 0.04]} p={[x, -0.03, dp + 0.04]} m={M.gold} cast={false} />)}
        {[-0.2, 0.12].map((y) => <Box key={y} s={[w - 0.22, 0.028, 0.04]} p={[0, y, dp + 0.04]} m={M.gold} cast={false} />)}
        <Box s={[w - 0.14, 0.12, 0.05]} p={[0, -h / 2 + 0.1, dp + 0.03]} m={M.gold} cast={false} />
        <Box s={[w + 0.06, 0.06, 0.05]} p={[0, h / 2 - 0.08, dp + 0.03]} m={M.gold} cast={false} />
        <group position={[0, h / 2 + 0.02, dp / 2 + 0.05]}><Roof w={w + 0.26} d={dp + 0.4} h={0.2} y={0} m={M.gold} sag={1.2} lift={0.05} /></group>
      </group>
    );
  }

  /** A carved timber window: dark frame, recess, vertical lattice. */
  function CarvedWin({ p, r = 0, w = 0.5, h = 0.7 }) {
    const M = useM();
    const frame = M.plain('#4a1e14', { roughness: 0.8 });
    const dark = M.plain('#1c0e08', { roughness: 0.9 });
    const bar = M.plain('#9a5a38', { roughness: 0.8 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w + 0.12, h + 0.12, 0.06]} m={frame} cast={false} />
        <Box s={[w, h, 0.07]} p={[0, 0, 0.012]} m={dark} cast={false} />
        {[-0.3, -0.1, 0.1, 0.3].map((k) => <Box key={k} s={[0.025, h * 0.9, 0.04]} p={[k * w * 0.9, 0, 0.05]} m={bar} cast={false} />)}
        <Box s={[w, 0.03, 0.04]} p={[0, h * 0.18, 0.05]} m={bar} cast={false} />
      </group>
    );
  }

  /** A short carved timber storey: wall, corner posts, and a continuous band of carved window panels with gilt trim. */
  function Storey({ w, d, y0, h, n, ns, ww, mat, timber }) {
    const M = useM();
    const yc = y0 + h * 0.52; const wh = h * 0.5;
    const xs = Array.from({ length: n }, (_, i) => -w / 2 + ((i + 0.5) * w) / n);
    const zs = Array.from({ length: ns }, (_, i) => -d / 2 + ((i + 0.5) * d) / ns);
    return (
      <group>
        <Box s={[w, h, d]} p={[0, y0 + h / 2, 0]} m={mat} />
        {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.14, h, 0.14]} p={[sx * w / 2, y0 + h / 2, sz * d / 2]} m={timber} cast={false} />))}
        <Box s={[w + 0.1, 0.1, d + 0.1]} p={[0, y0 + h - 0.05, 0]} m={timber} cast={false} />
        <Box s={[w + 0.1, 0.09, d + 0.1]} p={[0, y0 + 0.045, 0]} m={timber} cast={false} />
        {[1, -1].map((sz) => [yc + wh / 2 + 0.1, yc - wh / 2 - 0.1].map((y) => <Box key={`${sz}${y}`} s={[w + 0.04, 0.035, 0.05]} p={[0, y, sz * (d / 2 + 0.03)]} m={M.gold} cast={false} />))}
        {xs.map((x) => <CarvedWin key={x} p={[x, yc, d / 2 + 0.01]} w={ww} h={wh} />)}
        {xs.map((x) => <CarvedWin key={`b${x}`} p={[x, yc, -d / 2 - 0.01]} r={PI} w={ww} h={wh} />)}
        {zs.map((z) => <CarvedWin key={`r${z}`} p={[w / 2 + 0.01, yc, z]} r={PI / 2} w={ww * 0.8} h={wh} />)}
        {zs.map((z) => <CarvedWin key={`l${z}`} p={[-w / 2 - 0.01, yc, z]} r={-PI / 2} w={ww * 0.8} h={wh} />)}
      </group>
    );
  }

  /* ================= MAIN: the temple, plinth, pillar and the small shrines beside it ================= */
  function ArchPanel({ p, w = 0.7, h = 0.85, m1, m2 }) {
    return (
      <group position={p}>
        <Box s={[w + 0.16, h + 0.08, 0.07]} p={[0, h / 2, 0]} m={m1} cast={false} />
        <Cyl rt={(w + 0.16) / 2} rb={(w + 0.16) / 2} h={0.07} p={[0, h + 0.04, 0]} r={[PI / 2, 0, 0]} m={m1} seg={12} />
        <Box s={[w, h, 0.08]} p={[0, h / 2, 0.015]} m={m2} cast={false} />
        <Cyl rt={w / 2} rb={w / 2} h={0.08} p={[0, h, 0.015]} r={[PI / 2, 0, 0]} m={m2} seg={12} />
      </group>
    );
  }

  function BhimsenMain() {
    const M = useM();
    const brick = M.mat('brick', 5, 1.2, { color: '#e0a088' });
    const wallW = M.mat('wood', 3, 1, { color: '#a05040' });
    const tile1 = M.mat('roof', 9, 6, { color: '#eed2bc' });
    const tile2 = M.mat('roof', 8, 6, { color: '#e6c6ae' });
    const timber = M.plain(DARKW, { roughness: 0.8 });
    const fasc = M.plain('#7a3626', { roughness: 0.85 });
    const recess = M.plain('#3a1c12', { roughness: 0.9 });
    const plinthM = M.mat('stone', 2, 1, { color: '#cdb698' });
    const metal = M.plain('#58534a', { metalness: 0.7, roughness: 0.45 });

    const bw1 = 5.4; const bd1 = 4.2; const e1 = 2.7;
    const bw2 = 4.2; const bd2 = 3.0; const e2 = 4.2;
    const bw3 = 2.9; const bd3 = 2.0; const e3 = 5.8;
    const rw1 = 7.6; const rd1 = 6.0; const rw2 = 5.4; const rd2 = 4.2; const rw3 = 3.9; const rd3 = 3.0;

    const posts = useMemo(() => {
      const out = [];
      for (let x = -2.6; x <= 2.61; x += 0.5) { if (Math.abs(x) > 2.25) out.push([x, 2.05, bd1 / 2 + 0.03, 0.09, 1.1, 0.09, 0]); }
      return out;
    }, []);
    const skirt = useMemo(() => Array.from({ length: 12 }, (_, i) => [-1.8 + i * 0.33, 1.45, bd1 / 2 + 0.3, 0.16, 0.14, 0.04, 0]), []);

    return (
      <group>
        <Frame s={[8.6, 8.0, 9.8]} p={[0, 4.0, 1.4]} />

        <Box s={[6.7, 0.22, 5.4]} p={[0, 0.11, 0]} m={plinthM} />
        <Box s={[2.4, 0.11, 0.38]} p={[0, 0.055, 2.88]} m={plinthM} />
        <Box s={[2.4, 0.11, 0.2]} p={[0, 0.165, 2.78]} m={M.stone} cast={false} />

        {/* ground storey: low red brick with five recessed arched panels */}
        <Box s={[bw1, 1.2, bd1]} p={[0, 0.82, 0]} m={brick} />
        <Box s={[bw1 + 0.14, 0.12, bd1 + 0.14]} p={[0, 0.28, 0]} m={M.stone} cast={false} />
        {[-2.0, -1.0, 0, 1.0, 2.0].map((x) => <ArchPanel key={x} p={[x, 0.34, bd1 / 2 - 0.02]} w={0.62} h={0.72} m1={timber} m2={recess} />)}
        {[-2.7, 2.7].map((x) => <Box key={x} s={[0.14, 1.2, 0.14]} p={[x, 0.82, bd1 / 2 + 0.01]} m={timber} cast={false} />)}
        <Box s={[bw1 + 0.18, 0.2, bd1 + 0.18]} p={[0, 1.52, 0]} m={timber} />

        {/* first floor: timber wall and the projecting bay of three separate gilded windows */}
        <Box s={[bw1, 1.1, bd1]} p={[0, 2.1, 0]} m={wallW} />
        <Inst items={posts} m={timber} />
        <Box s={[4.1, 0.1, 0.5]} p={[0, 1.57, bd1 / 2 + 0.2]} m={timber} cast={false} />
        {[-1.25, 0, 1.25].map((x) => <ProjWin key={x} p={[x, 2.1, bd1 / 2]} />)}
        <Inst items={skirt} m={M.plain('#8a6410')} />
        {[-2.4, 2.4].map((x) => <LatticeWindow key={x} p={[x, 2.1, bd1 / 2 + 0.01]} w={0.5} h={0.6} bars={4} />)}
        {[-1.0, 1.0].map((z) => (
          <group key={z}>
            <LatticeWindow p={[bw1 / 2 + 0.01, 2.1, z]} r={PI / 2} w={0.75} h={0.6} bars={4} />
            <LatticeWindow p={[-bw1 / 2 - 0.01, 2.1, z]} r={-PI / 2} w={0.75} h={0.6} bars={4} />
          </group>
        ))}
        {[-1.6, 0, 1.6].map((x) => <LatticeWindow key={x} p={[x, 2.1, -bd1 / 2 - 0.01]} r={PI} w={0.75} h={0.6} bars={4} detail={false} />)}

        {/* roof 1: very wide and low, heavy overhang on a dense strut row, wooden fascia */}
        <Struts bw={bw1} bd={bd1} y={e1 - 0.06} ovx={(rw1 - bw1) / 2} ovz={(rd1 - bd1) / 2} v={0.62} sp={0.32} m={timber} />
        <RoofTier w={rw1} d={rd1} h={1.0} y={e1} sag={1.3} lift={0.3} tile={tile1} fasc={fasc} />
        <Box s={[rw1 - rd1 + 0.9, 0.09, 0.12]} p={[0, e1 + 0.98, 0]} m={fasc} cast={false} />

        {/* storey 2: short carved timber storey, band of six panels */}
        <Storey w={bw2} d={bd2} y0={e1} h={e2 - e1} n={6} ns={3} ww={0.46} mat={wallW} timber={timber} />
        <Struts bw={bw2} bd={bd2} y={e2 - 0.06} ovx={(rw2 - bw2) / 2} ovz={(rd2 - bd2) / 2} v={0.5} sp={0.3} m={timber} />
        <RoofTier w={rw2} d={rd2} h={0.95} y={e2} sag={1.3} lift={0.25} tile={tile2} fasc={fasc} />

        {/* storey 3: band of five panels */}
        <Storey w={bw3} d={bd3} y0={e2 + 0.3} h={e3 - e2 - 0.3} n={5} ns={3} ww={0.36} mat={wallW} timber={timber} />
        <Struts bw={bw3} bd={bd3} y={e3 - 0.06} ovx={(rw3 - bw3) / 2} ovz={(rd3 - bd3) / 2} v={0.42} sp={0.3} m={timber} />
        <RoofTier w={rw3} d={rd3} h={1.2} y={e3} sag={1.35} lift={0.22} tile={tile2} fasc={fasc} />
        <Gajur y={e3 + 1.2} s={0.8} />

        {/* thin pillar (about 0.2 m), gilded figure on top, rope hugging it up to the roof 3 eave */}
        <Box s={[0.7, 0.3, 0.7]} p={[-0.3, 0.15, 5.6]} m={plinthM} />
        <Box s={[0.5, 0.2, 0.5]} p={[-0.3, 0.4, 5.6]} m={M.stone} />
        <Cyl rt={0.05} rb={0.07} h={5.5} p={[-0.3, 3.35, 5.6]} m={metal} seg={12} />
        <Cyl rt={0.09} rb={0.06} h={0.14} p={[-0.3, 6.12, 5.6]} m={M.gold} seg={12} />
        <group position={[-0.3, 6.18, 5.6]} scale={0.8}><Lion m={M.gold} /></group>
        <mesh position={[-0.2, 3.4, 5.64]} material={M.plain('#c9b48a')}><cylinderGeometry args={[0.014, 0.014, 5.6, 5]} /></mesh>
        {[-1, 0, 1].map((k) => <Diyo key={k} p={[k * 0.8, 0.2, 3.3]} />)}

        <Chaitya p={[4.6, 0, 3.6]} s={1.35} />
        <group position={[6.0, 0, 3.4]}>
          <Box s={[0.9, 0.25, 0.9]} p={[0, 0.125, 0]} m={M.stone} />
          <Box s={[0.6, 0.7, 0.6]} p={[0, 0.6, 0]} m={M.plain('#4a4540', { roughness: 0.9 })} />
          <Spire r0={0.42} h={0.9} y={0.95} m={M.plain('#4a4540', { roughness: 0.9 })} />
        </group>
      </group>
    );
  }

  /* ================= Vishwanath: 2-tier square pagoda on a taller plinth, stone elephants in front ================= */
  function Vishwanath({ p }) {
    const M = useM();
    const brick = M.mat('brick', 4, 1.2, { color: '#c27860' });
    const wallW = M.mat('wood', 3, 1, { color: '#8a4838' });
    const tile = M.mat('roof', 8, 6, { color: '#e6c6ae' });
    const timber = M.plain(DARKW, { roughness: 0.8 });
    return (
      <group position={p}>
        <Box s={[5.0, 0.5, 5.0]} p={[0, 0.25, 0]} m={M.stone} />
        {[0, 1].map((k) => <Box key={k} s={[2.0, 0.17, 0.35]} p={[0, 0.085 + k * 0.17, 2.7 - k * 0.2]} m={M.stone} cast={false} />)}
        <Box s={[3.7, 1.15, 3.7]} p={[0, 1.075, 0]} m={brick} />
        <Doorway p={[0, 0.5, 1.82]} w={0.8} h={0.9} gold arch />
        <Box s={[3.9, 0.16, 3.9]} p={[0, 1.7, 0]} m={timber} />
        <Box s={[3.6, 0.95, 3.6]} p={[0, 2.2, 0]} m={wallW} />
        {[-1, 0, 1].map((k) => <LatticeWindow key={k} p={[k * 1.0, 2.25, 1.81]} w={0.62} h={0.5} bars={4} />)}
        <LatticeWindow p={[1.81, 2.25, 0]} r={PI / 2} w={0.7} h={0.5} bars={4} detail={false} />
        <LatticeWindow p={[-1.81, 2.25, 0]} r={-PI / 2} w={0.7} h={0.5} bars={4} detail={false} />
        <Struts bw={3.7} bd={3.7} y={2.64} ovx={0.85} ovz={0.85} v={0.55} sp={0.46} m={timber} />
        <RoofTier w={5.4} d={5.4} h={0.6} y={2.7} sag={1.2} lift={0.28} tile={tile} gilt fasc={M.plain('#7a3626')} />
        <Box s={[2.9, 1.0, 2.9]} p={[0, 3.55, 0]} m={wallW} />
        {[-0.8, 0, 0.8].map((k) => <LatticeWindow key={k} p={[k, 3.62, 1.46]} w={0.5} h={0.45} bars={4} />)}
        <Struts bw={2.9} bd={2.9} y={4.04} ovx={0.4} ovz={0.4} v={0.42} sp={0.42} m={timber} />
        <RoofTier w={3.7} d={3.7} h={0.65} y={4.1} sag={1.25} lift={0.22} tile={tile} fasc={M.plain('#7a3626')} />
        <Gajur y={4.72} s={0.6} />
        {[-1.4, 1.4].map((x) => <group key={x} position={[x, 0, 3.7]} scale={2.0}><Elephant m={M.stone} /></group>)}
      </group>
    );
  }

  /* ================= Krishna Mandir: all-stone shikhara, arcaded floors, Garuda column in front ================= */
  function KrishnaLite({ p }) {
    const M = useM();
    const st = M.mat('granite', 2, 2, { color: '#f0dcc0' });
    const dk = M.plain('#1e1915');
    const pin = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]];
    return (
      <group position={p}>
        <Box s={[7.0, 0.4, 6.4]} p={[0, 0.2, 0]} m={st} />
        {[0, 1].map((k) => <Box key={k} s={[3.0, 0.14, 0.4]} p={[0, 0.07 + k * 0.14, 3.4 - k * 0.2]} m={st} cast={false} />)}
        <Box s={[5.4, 1.9, 5.0]} p={[0, 1.35, 0]} m={st} />
        {[-1.7, 0, 1.7].map((x) => <Box key={x} s={[0.9, 1.3, 0.12]} p={[x, 1.1, 2.5]} m={dk} cast={false} />)}
        <Box s={[5.9, 0.16, 5.5]} p={[0, 2.38, 0]} m={st} />
        {pin.map(([sx, sz], i) => <Spire key={i} r0={0.26} h={0.85} y={2.46} x={sx * 2.55} z={sz * 2.3} m={st} />)}
        <Box s={[3.9, 1.3, 3.5]} p={[0, 3.1, 0]} m={st} />
        {[-1, 1].map((x) => <Box key={x} s={[0.7, 0.9, 0.12]} p={[x, 3.0, 1.76]} m={dk} cast={false} />)}
        <Box s={[4.3, 0.14, 3.9]} p={[0, 3.82, 0]} m={st} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <Spire key={i} r0={0.24} h={0.8} y={3.89} x={sx * 1.85} z={sz * 1.65} m={st} />)}
        <Box s={[2.5, 1.0, 2.5]} p={[0, 4.4, 0]} m={st} />
        <Spire r0={1.25} h={3.0} y={4.9} m={st} />
        <group position={[0, 0, 6.6]}>
          <Box s={[0.8, 0.5, 0.8]} p={[0, 0.25, 0]} m={st} />
          <Cyl rt={0.14} rb={0.18} h={3.0} p={[0, 2.0, 0]} m={st} seg={12} />
          <group position={[0, 3.5, 0]} scale={1.6}><Garuda m={M.gold} /></group>
        </group>
      </group>
    );
  }

  /* ================= cheap brick Newar houses: one body + one roof each, windows and signs instanced ================= */
  function HouseBlock({ houses }) {
    const M = useM();
    const sh = 1.7;
    const tileM = M.mat('roof', 3, 3, { color: '#e6c6ae' });
    const { frames, panes, signsA, signsB, signsC, shops, tarps, balc } = useMemo(() => {
      const W = (px, pz, r, lx, lz) => [px + lx * Math.cos(r) + lz * Math.sin(r), pz - lx * Math.sin(r) + lz * Math.cos(r)];
      const frames = []; const panes = []; const signsA = []; const signsB = []; const signsC = []; const shops = []; const tarps = []; const balc = [];
      houses.forEach((h, hi) => {
        const nw = Math.max(1, Math.round(h.w / 1.9));
        for (let s = 0; s < h.st; s += 1) {
          const y = (s + 0.55) * sh;
          if (h.set && s === h.st - 1) continue;
          if (s === 0 && h.w < 10) {
            const [x, z] = W(h.x, h.z, h.r, 0, h.d / 2 + 0.03);
            shops.push([x, 0.62 * sh * 0.55, z, h.w * 0.62, sh * 0.62, 0.1, h.r]);
            continue;
          }
          for (let i = 0; i < nw; i += 1) {
            const lx = -h.w / 2 + ((i + 0.5) * h.w) / nw;
            const [x, z] = W(h.x, h.z, h.r, lx, h.d / 2 + 0.03);
            const [x2, z2] = W(h.x, h.z, h.r, lx, h.d / 2 + 0.06);
            frames.push([x, y, z, 1.0, 1.2, 0.1, h.r]);
            panes.push([x2, y, z2, 0.78, 0.98, 0.1, h.r]);
          }
        }
        if (h.w < 10 && hi % 4 === 1 && h.st >= 3) { const [x, z] = W(h.x, h.z, h.r, -h.w * 0.1, h.d / 2 + 0.07); tarps.push([x, 1.9 * sh, z, h.w * 0.55, sh * 1.5, 0.05, h.r]); }
        if (h.w < 10 && hi % 3 === 0 && h.st >= 3) { const [x, z] = W(h.x, h.z, h.r, 0, h.d / 2 + 0.3); balc.push([x, 1.12 * sh, z, h.w * 0.7, 0.14, 0.6, h.r]); }
        if (h.w < 10 && hi % 2 === 0) {
          const [x, z] = W(h.x, h.z, h.r, h.w * 0.22, h.d / 2 + 0.1);
          (hi % 3 === 0 ? signsA : hi % 3 === 1 ? signsB : signsC).push([x, 1.55 * sh, z, h.w * 0.34, 0.36, 0.05, h.r]);
        }
      });
      return { frames, panes, signsA, signsB, signsC, shops, tarps, balc };
    }, [houses]);
    return (
      <group>
        {houses.map((h, i) => (
          <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.r, 0]}>
            <Box s={[h.w, (h.set ? h.st - 1 : h.st) * sh, h.d]} p={[0, ((h.set ? h.st - 1 : h.st) * sh) / 2, 0]} m={h.m} cast={false} />
            {h.set && <Box s={[h.w * 0.72, sh, h.d * 0.75]} p={[0, (h.st - 0.5) * sh, -h.d * 0.1]} m={h.m} cast={false} />}
            <Roof w={h.w * (h.set ? 0.72 : 1) + 0.7} d={h.d * (h.set ? 0.75 : 1) + 0.7} h={h.w > 10 ? 1.1 : 0.55 + h.st * 0.1} y={h.st * sh} m={tileM} sag={1.2} lift={0.1} fascia={false} />
            {h.set && <Box s={[0.1, 0.1, 0.1]} p={[0, h.st * sh, 0]} m={h.m} cast={false} />}
          </group>
        ))}
        <Inst items={frames} m={M.plain(DARKW)} />
        <Inst items={panes} m={M.plain('#1b100a')} />
        <Inst items={tarps} m={M.plain('#2f6fb0', { roughness: 0.9 })} />
        <Inst items={balc} m={M.plain(DARKW)} />
        <Inst items={shops} m={M.plain('#2a1810')} />
        <Inst items={signsA} m={M.plain('#5a3a30')} />
        <Inst items={signsB} m={M.plain('#7a5a3a')} />
        <Inst items={signsC} m={M.plain('#b83a2a')} />
      </group>
    );
  }

  function Person({ p, c = '#3a5a8a' }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.16} rb={0.2} h={0.75} p={[0, 0.55, 0]} m={M.plain(c)} seg={8} />
        <Ball rad={0.14} p={[0, 1.08, 0]} m={M.plain('#c99a76')} />
      </group>
    );
  }

  /* ================= ENV: brick plaza, sunken Manga Hiti, houses on every side, palace across the square ================= */
  function BhimsenEnv() {
    const M = useM();
    const paving = M.mat('herring', 0.28, 0.28, { color: '#ffffff' });
    const tcx = -12; const tcz = 17; const tw = 7; const td = 5.5; const depth = 1.3;
    const plazaGeo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-70, -70); s.lineTo(70, -70); s.lineTo(70, 70); s.lineTo(-70, 70); s.closePath();
      const hole = new THREE.Path();
      const x0 = tcx - tw / 2; const x1 = tcx + tw / 2; const y0 = -(tcz + td / 2); const y1 = -(tcz - td / 2);
      hole.moveTo(x0, y0); hole.lineTo(x0, y1); hole.lineTo(x1, y1); hole.lineTo(x1, y0); hole.closePath();
      s.holes.push(hole);
      return new THREE.ShapeGeometry(s);
    }, []);

    const houses = useMemo(() => {
      let seed = 11;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const brickTints = ['#d08a70', '#c07a62', '#d89478', '#b46c56'];
      const mats = [
        ...brickTints.map((c, i) => M.mat('brick', 1.6 + i * 0.1, 2.6, { color: c })),
        M.mat('brick', 1.9, 2.6, { color: '#a8644e' }), M.mat('brick', 2.0, 2.6, { color: '#b87058' }),
      ];
      const out = [];
      const lane = (a, b, fixed, axis, r, d, maxSt = 4) => {
        let pos = a;
        while (pos < b) {
          if (rnd() < 0.1) { pos += 1.6; continue; } // lane between houses
          const w = 2.8 + rnd() * 1.6;
          const c = pos + w / 2;
          const q = rnd();
          const st = q < 0.25 ? 2 : q < 0.6 ? 3 : Math.min(4, maxSt);
          const m = mats[Math.floor(rnd() * 5.99)];
          const dd = d + (rnd() - 0.5) * 1.2;
          const off = (rnd() - 0.5) * 0.9;
          out.push({ x: axis === 'x' ? c : fixed + off, z: axis === 'x' ? fixed + off : c, r, w, d: dd, st, m, set: st >= 3 && rnd() < 0.3 });
          pos += w + 0.1;
        }
      };
      lane(7.7, 38, 1.0, 'x', 0, 3.6, 4);
      lane(-48, 48, -22, 'x', 0, 4, 4);
      lane(8, 40, 41, 'z', -PI / 2, 4, 3);
      out.push({ x: -4, z: 56, r: PI, w: 46, d: 6, st: 3, m: M.mat('brick', 16, 2.4, { color: '#b87058' }) }); // royal palace facade across the square
      return out;
    }, [M]);

    const hills = useMemo(() => Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * PI * 2; const r = 190 + (i % 3) * 6;
      return { p: [Math.cos(a) * r, 0, Math.sin(a) * r], h: 3 + (i % 4) * 1.2, rad: 40 + (i % 3) * 5 };
    }), []);

    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow><circleGeometry args={[400, 48]} /><meshStandardMaterial color="#8e9c7c" roughness={1} fog={false} /></mesh>
        <mesh><sphereGeometry args={[420, 24, 12]} /><meshStandardMaterial color='#6fa6dc' side={THREE.BackSide} fog={false} roughness={1} emissive='#3a6a9c' emissiveIntensity={0.55} /></mesh>
        {hills.map((h, i) => (
          <mesh key={i} position={[h.p[0], h.h / 2 - 2, h.p[2]]} material={M.plain(i % 2 ? '#7f9a8c' : '#8aa496', { roughness: 1, fog: false })}><coneGeometry args={[h.rad, h.h, 7]} /></mesh>
        ))}
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 0]} geometry={plazaGeo} material={paving} receiveShadow />

        {/* Vishwanath (2 tiers) on the viewer's left, same frontage line; small shrines; Krishna Mandir beyond */}
        {[6, 14, 24].map((z) => <Box key={z} s={[110, 0.02, 0.45]} p={[0, 0.0, z]} m={M.plain('#9d988f', { roughness: 1 })} cast={false} />)}
        {[-30, -14, 0, 14, 30].map((x) => <Box key={x} s={[0.45, 0.02, 80]} p={[x, 0.0, 30]} m={M.plain('#9d988f', { roughness: 1 })} cast={false} />)}
        <Vishwanath p={[-8.4, 0, 0.4]} />
        <Chaitya p={[-13.4, 0, 3.6]} s={1.3} />
        <Chaitya p={[-14.6, 0, 3.0]} s={1.0} />
        <KrishnaLite p={[-20.2, 0, -0.3]} />

        <HouseBlock houses={houses} />

        {/* sunken Manga Hiti: brick-lined pit, stone steps, stone taps, tiled pavilion on the rim */}
        <group position={[tcx, 0, tcz]}>
          <Box s={[tw, 0.1, td]} p={[0, -depth, 0]} m={M.stone} cast={false} />
          <Box s={[tw - 0.5, 0.02, td - 0.5]} p={[0, -depth + 0.07, 0]} m={M.plain('#4a6358', { roughness: 0.2, metalness: 0.2 })} cast={false} />
          <Box s={[0.14, depth, td]} p={[-tw / 2 + 0.07, -depth / 2, 0]} m={M.mat('brick', 3, 1, { color: '#b87058' })} cast={false} />
          <Box s={[0.14, depth, td]} p={[tw / 2 - 0.07, -depth / 2, 0]} m={M.mat('brick', 3, 1, { color: '#b87058' })} cast={false} />
          <Box s={[tw, depth, 0.14]} p={[0, -depth / 2, -td / 2 + 0.07]} m={M.mat('brick', 4, 1, { color: '#b87058' })} cast={false} />
          <Box s={[tw, depth, 0.14]} p={[0, -depth / 2, td / 2 - 0.07]} m={M.mat('brick', 4, 1, { color: '#b87058' })} cast={false} />
          <Box s={[tw + 0.5, 0.12, 0.3]} p={[0, 0.0, -td / 2 - 0.1]} m={M.stone} cast={false} />
          <Box s={[tw + 0.5, 0.12, 0.3]} p={[0, 0.0, td / 2 + 0.1]} m={M.stone} cast={false} />
          <Box s={[0.3, 0.12, td]} p={[-tw / 2 - 0.1, 0.0, 0]} m={M.stone} cast={false} />
          {[0, 1, 2, 3].map((k) => <Box key={k} s={[0.5, depth - 0.26 * (k + 1), 1.8]} p={[-tw / 2 + 0.45 + k * 0.5, -depth + (depth - 0.26 * (k + 1)) / 2 + 0.05, 1.0]} m={M.stone} cast={false} />)}
          {[-1.6, -0.2, 1.2].map((x) => (
            <group key={x} position={[x, 0, -td / 2 + 0.32]}>
              <Box s={[0.55, 0.9, 0.4]} p={[0, -depth + 0.5, 0]} m={M.plain('#6f695f', { roughness: 0.95 })} cast={false} />
              <Cyl rt={0.045} h={0.35} p={[0, -depth + 0.62, 0.3]} r={[PI / 2, 0, 0]} m={M.gold} seg={8} />
            </group>
          ))}
          {/* tiled pavilion on the rim */}
          <group position={[tw / 2 + 1.7, 0, -0.4]}>
            <Box s={[2.5, 0.35, 2.5]} p={[0, 0.175, 0]} m={M.mat('brick', 2, 1, { color: '#b87058' })} />
            {[-1, 1].map((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} rt={0.07} h={1.6} p={[sx * 1.0, 1.15, sz * 1.0]} m={M.plain(DARKW)} seg={8} />))}
            <Roof w={3.1} d={3.1} h={0.85} y={1.95} m={M.mat('roof', 3, 3, { color: '#e6c6ae' })} sag={1.35} lift={0.2} />
          </group>
        </group>

        {/* people for scale */}
        {[[1.8, 4.6, '#b03a2e'], [3.4, 5.2, '#2f5d9e'], [-2.4, 6.4, '#e6dccb'], [5.2, 8.5, '#3d7a52'], [-5.0, 9.2, '#c9a227'], [2.2, 11.5, '#6a3a7a'], [-8.2, 7.0, '#b03a2e'], [9.0, 6.5, '#2a2a30']].map(([x, z, c], i) => <Person key={i} p={[x, 0, z]} c={c} />)}
      </group>
    );
  }

  return { 'bhimsen-temple': { Main: BhimsenMain, Env: BhimsenEnv } };
}
