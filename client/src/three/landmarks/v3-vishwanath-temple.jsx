// Vishwanath Temple, Patan Durbar Square (Lalitpur). 1627 two-roofed Newar Shiva pagoda of red brick and carved timber:
// open five-bay cusped arcade on the ground floor, two grey stone elephants with riders on brick pedestals at the stair ends,
// Krishna Mandir (pale stone shikhara) on the viewer's right and Bhimsen (wide brick temple, gilt windows) on the left [inferred],
// Garuda column and Yoganarendra Malla column in the brick-paved square in front. Front = +z (east, toward the palace).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Tree, Diyo, THREE, useMemo, useRef, useEffect } = K;

  const BRICK = '#b0553a', BRICK_D = '#a3472f', STONE_C = '#e4ded2';
  const RED = '#4a2a1c', RED_D = '#2e1a10';
  const TAU = Math.PI * 2;
  const side = (k, lx, lz) => { const a = k * Math.PI / 2; return [lx * Math.cos(a) + lz * Math.sin(a), -lx * Math.sin(a) + lz * Math.cos(a), a]; };

  /* ---------- instanced boxes: [x,y,z, sx,sy,sz, rotY, rotX] ---------- */
  function Inst({ items, m, cast = true }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      o.rotation.order = 'YXZ';
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(it[7] || 0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    );
  }

  /* 45-degree carved struts under an eave, all four sides + diagonal corner struts */
  function strutItems({ half, y, run, rise, n, span, th = 0.09 }) {
    const strut = []; const block = []; const tip = [];
    const len = Math.hypot(run, rise); const tilt = Math.atan2(run, rise);
    for (let k = 0; k < 4; k += 1) {
      for (let i = 0; i < n; i += 1) {
        const lx = n === 1 ? 0 : -span + (2 * span * i) / (n - 1);
        const [x, z, a] = side(k, lx, half + run / 2);
        strut.push([x, y + rise / 2, z, th, len, th * 1.3, a, tilt]);
        const [bx, bz] = side(k, lx, half + run * 0.62);
        block.push([bx, y + rise * 0.5, bz, th * 1.5, th * 1.8, th * 1.4, a, 0]);
        const [tx, tz] = side(k, lx, half + run);
        (i % 3 === 0 ? tip : block).push([tx, y + rise + 0.02, tz, th * 1.4, th * 1.1, th * 1.4, a, 0]);
      }
      // diagonal corner strut (towards the upturned corner of the roof)
      const [cx, cz] = side(k, half + run * 0.5, half + run * 0.5);
      strut.push([cx, y + rise / 2, cz, th * 1.5, len * 1.45, th * 1.7, k * Math.PI / 2 + Math.PI / 4, Math.atan2(run * 1.41, rise)]);
    }
    return { strut, block, tip };
  }
  function fringeItems(halfEave, y, step, size) {
    const out = [];
    for (let k = 0; k < 4; k += 1) {
      const m = Math.floor((halfEave * 2 - 0.3) / step);
      for (let i = 0; i < m; i += 1) {
        const lx = -((m - 1) * step) / 2 + i * step;
        const [x, z, a] = side(k, lx, halfEave - 0.03);
        out.push([x, y, z, size[0], size[1], size[2], a, 0]);
      }
    }
    return out;
  }
  function EaveSet({ half, eaveHalf, y, run, rise, n, span, th, fringeStep }) {
    const M = useM();
    const { strut, block, tip } = useMemo(() => strutItems({ half, y, run, rise, n, span, th }), [half, y, run, rise, n, span, th]);
    const fr = useMemo(() => fringeItems(eaveHalf, y + rise - 0.1, fringeStep, [0.045, 0.15, 0.04]), [eaveHalf, y, rise, fringeStep]);
    return (
      <group>
        <Inst items={strut} m={M.plain('#3a2012', { roughness: 0.75 })} />
        <Inst items={block} m={M.plain('#4a2a1c', { roughness: 0.8 })} />
        <Inst items={tip} m={M.gold} />
        <Inst items={fr} m={M.plain('#5a3a22', { roughness: 0.8 })} cast={false} />
      </group>
    );
  }

  /* roof with red/gilt eave trim and hanging corner bells */
  function PagodaRoof({ w, h, y }) {
    const M = useM();
    const roofM = M.mat('roof', 4, 4, { color: '#bd8a6c' });
    const hw = w / 2;
    return (
      <group>
        <Roof w={w} d={w} h={h} y={y} m={roofM} sag={1.5} lift={0.3} fascia={false} />
        <Box s={[w, 0.1, 0.07]} p={[0, y - 0.02, hw]} m={M.plain('#6e2a1c')} cast={false} />
        <Box s={[w, 0.1, 0.07]} p={[0, y - 0.02, -hw]} m={M.plain('#6e2a1c')} cast={false} />
        <Box s={[0.07, 0.1, w]} p={[hw, y - 0.02, 0]} m={M.plain('#6e2a1c')} cast={false} />
        <Box s={[0.07, 0.1, w]} p={[-hw, y - 0.02, 0]} m={M.plain('#6e2a1c')} cast={false} />
        <Box s={[w, 0.025, 0.075]} p={[0, y + 0.04, hw]} m={M.gold} cast={false} />
        <Box s={[w, 0.025, 0.075]} p={[0, y + 0.04, -hw]} m={M.gold} cast={false} />
        <Box s={[0.075, 0.025, w]} p={[hw, y + 0.04, 0]} m={M.gold} cast={false} />
        <Box s={[0.075, 0.025, w]} p={[-hw, y + 0.04, 0]} m={M.gold} cast={false} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => (
          <group key={`${a}${b}`} position={[a * (hw + 0.02), y + w * 0.075, b * (hw + 0.02)]}>
            <Cyl rt={0.012} h={0.14} p={[0, -0.07, 0]} m={M.gold} seg={6} />
            <Ball rad={0.05} p={[0, -0.17, 0]} m={M.gold} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- carved arch panel with cusped openings ---------- */
  function archPanelGeom(w, h, n, pier, sill, apex, depth) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
    const bw = (w - (n + 1) * pier) / n; const r = bw / 2; const r0 = r * 0.86; const spring = apex - r;
    for (let i = 0; i < n; i += 1) {
      const cx = -w / 2 + pier + bw / 2 + i * (bw + pier);
      const p = new THREE.Path();
      p.moveTo(cx - r0, sill); p.lineTo(cx + r0, sill); p.lineTo(cx + r0, spring);
      for (let j = 1; j <= 30; j += 1) {
        const t = (j / 30) * Math.PI;
        const rr = r * (0.86 + 0.14 * Math.abs(Math.sin(3 * t)));
        p.lineTo(cx + rr * Math.cos(t), spring + rr * Math.sin(t) * 1.12);
      }
      p.closePath();
      s.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  }
  function toranaGeom(w, h) {
    const pts = [[-0.5, 0], [-0.46, 0.14], [-0.36, 0.1], [-0.3, 0.3], [-0.2, 0.24], [-0.14, 0.5], [-0.06, 0.42], [0, 0.78], [0.06, 0.42], [0.14, 0.5], [0.2, 0.24], [0.3, 0.3], [0.36, 0.1], [0.46, 0.14], [0.5, 0]];
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => { if (i) s.lineTo(x * w, y * h / 0.78); else s.moveTo(x * w, y * h / 0.78); });
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false });
    g.translate(0, 0, -0.02);
    return g;
  }

  /* carved window: dark opening, red timber frame, gilt edging and a small torana */
  function Win({ p, r = [0, 0, 0], w = 0.5, h = 0.5, torana = true, glow }) {
    const M = useM();
    const tg = useMemo(() => toranaGeom(w * 1.1, h * 0.55), [w, h]);
    return (
      <group position={p} rotation={r}>
        <Box s={[w, h, 0.05]} p={[0, 0, 0.01]} m={glow || M.plain('#2a150d')} cast={false} />
        <Box s={[w + 0.1, 0.06, 0.09]} p={[0, h / 2 + 0.03, 0.03]} m={M.plain(RED)} cast={false} />
        <Box s={[w + 0.1, 0.06, 0.09]} p={[0, -h / 2 - 0.03, 0.03]} m={M.plain(RED)} cast={false} />
        <Box s={[0.06, h, 0.09]} p={[-w / 2 - 0.03, 0, 0.03]} m={M.plain(RED)} cast={false} />
        <Box s={[0.06, h, 0.09]} p={[w / 2 + 0.03, 0, 0.03]} m={M.plain(RED)} cast={false} />
        <Box s={[w - 0.04, 0.018, 0.06]} p={[0, 0.0, 0.04]} m={M.gold} cast={false} />
        {[-1, 1].map((k) => <Box key={k} s={[0.018, h - 0.04, 0.06]} p={[k * w * 0.16, 0, 0.04]} m={M.gold} cast={false} />)}
        {torana && <mesh geometry={tg} material={M.gold} position={[0, h / 2 + 0.06, 0.07]} />}
      </group>
    );
  }

  /* ---------- elephant on pedestal, rider on its head, facing +z ---------- */
  function Elph({ stone, cloth, cap }) {
    const M = useM();
    const ivory = M.plain('#d9d2c0');
    return (
      <group>
        <Ball rad={1} sc={[0.42, 0.38, 0.66]} p={[0, 0.66, -0.05]} m={stone} />
        <Ball rad={0.27} sc={[1, 1.1, 1.05]} p={[0, 0.82, 0.55]} m={stone} />
        <Ball rad={0.14} sc={[1.4, 0.9, 0.7]} p={[0, 1.02, 0.5]} m={stone} />
        {[-1, 1].map((k) => [0.32, -0.34].map((z) => <Cyl key={`${k}${z}`} rt={0.13} rb={0.14} h={0.46} p={[k * 0.21, 0.23, z]} m={stone} seg={10} />))}
        {[-1, 1].map((k) => [0.32, -0.34].map((z) => <Box key={`f${k}${z}`} s={[0.22, 0.05, 0.24]} p={[k * 0.2, 0.025, z + 0.02]} m={stone} />))}
        {/* trunk: thick root, curling down to a lifted tip */}
        <Cyl rt={0.14} rb={0.11} h={0.36} p={[0, 0.66, 0.78]} r={[0.35, 0, 0]} m={stone} seg={10} />
        <Cyl rt={0.11} rb={0.08} h={0.36} p={[0, 0.34, 0.9]} r={[-0.05, 0, 0]} m={stone} seg={10} />
        <Cyl rt={0.08} rb={0.06} h={0.2} p={[0, 0.1, 0.96]} r={[-0.5, 0, 0]} m={stone} seg={8} />
        {/* big drooping ears and tusks */}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.05, 0.4, 0.3]} p={[k * 0.3, 0.8, 0.43]} r={[0, k * 0.35, 0]} m={stone} />
            <Ball rad={0.13} sc={[0.3, 1.1, 0.9]} p={[k * 0.35, 0.62, 0.45]} m={stone} />
            <Cyl rt={0.012} rb={0.035} h={0.34} p={[k * 0.12, 0.52, 0.82]} r={[0.7, 0, k * 0.12]} m={ivory} seg={6} />
          </group>
        ))}
        <Cyl rt={0.03} rb={0.02} h={0.3} p={[0, 0.5, -0.7]} r={[0.2, 0, 0]} m={stone} seg={6} />
        <Box s={[0.5, 0.05, 0.5]} p={[0, 1.03, 0.0]} m={cloth} />
        <Box s={[0.3, 0.04, 0.26]} p={[0, 1.08, 0.52]} m={cloth} />
        {/* rider, carved in the same stone */}
        <Box s={[0.15, 0.2, 0.1]} p={[0, 1.22, 0.52]} m={stone} />
        <Ball rad={0.065} p={[0, 1.38, 0.52]} m={stone} />
        <mesh position={[0, 1.47, 0.52]} material={cap}><coneGeometry args={[0.055, 0.12, 8]} /></mesh>
        <Box s={[0.04, 0.16, 0.12]} p={[0.1, 1.16, 0.58]} r={[0.4, 0, 0]} m={stone} />
        <Box s={[0.04, 0.16, 0.12]} p={[-0.1, 1.16, 0.58]} r={[0.4, 0, 0]} m={stone} />
      </group>
    );
  }

  /* seated / standing figures: [x, y, z, height, colourIndex] */
  function People({ list }) {
    const M = useM();
    const cols = ['#b5362c', '#e9e2d2', '#2f5d8a', '#d99a2b', '#6b7f3a', '#8a3d7a'];
    return (
      <group>
        {cols.map((c, ci) => {
          const L = list.filter((q) => q[4] % cols.length === ci);
          const body = L.map((q) => [q[0], q[1] + q[3] * 0.56, q[2], q[3] * 0.3, q[3] * 0.4, q[3] * 0.2, q[5] || 0]);
          const arms = L.flatMap((q) => [-1, 1].map((k) => [q[0] + k * q[3] * 0.19, q[1] + q[3] * 0.56, q[2], q[3] * 0.08, q[3] * 0.36, q[3] * 0.09, 0]));
          return L.length ? <group key={c}><Inst items={body} m={M.plain(c, { roughness: 0.9 })} /><Inst items={arms} m={M.plain(c, { roughness: 0.9 })} cast={false} /></group> : null;
        })}
        <Inst items={list.map((q) => [q[0], q[1] + q[3] * 0.88, q[2], q[3] * 0.18, q[3] * 0.2, q[3] * 0.18, 0])} m={M.plain('#b5835f')} />
        <Inst items={list.flatMap((q) => [-1, 1].map((k) => [q[0] + k * q[3] * 0.08, q[1] + q[3] * 0.18, q[2], q[3] * 0.12, q[3] * 0.36, q[3] * 0.14, 0]))} m={M.plain('#3a3028')} cast={false} />
        <Inst items={list.map((q) => [q[0], q[1] + q[3] * 0.97, q[2], q[3] * 0.19, q[3] * 0.07, q[3] * 0.19, 0])} m={M.plain('#2a2018')} cast={false} />
      </group>
    );
  }

  /* =====================================================================================================
     MAIN: the temple on its plinth, the stair-end elephants, Nandi, lamps
     ===================================================================================================== */
  function VishwanathMain() {
    const M = useM();
    const wallB = M.mat('brick', 4, 1.6, { color: BRICK });
    const wallBack = M.mat('brick', 3, 1.6, { color: '#8a4430' });
    const wallB2 = M.mat('brick', 3, 1.6, { color: BRICK });
    const wallBU = M.mat('brick', 2, 1.4, { color: BRICK });
    const plinthB = M.mat('brick', 6, 0.5, { color: BRICK_D });
    const stairB = M.mat('brick', 4, 0.4, { color: '#b85a3f' });
    const brickP = M.mat('brick', 1.5, 1.2, { color: BRICK_D });
    const timber = M.plain(RED, { roughness: 0.75 });
    const timberD = M.plain(RED_D, { roughness: 0.8 });
    const door = M.plain('#3b1f14');
    const stone = M.plain('#8a7f70', { roughness: 0.95 });
    const edge = M.plain('#b9b0a0', { roughness: 0.95 });
    const slab = M.plain('#8c6f5c', { roughness: 0.95 });
    const cloth = M.plain('#6a4a38');
    const cap = M.gold;

    const y0 = 0.8;           // plinth top
    const GH = 1.9;           // ground-floor height (open arcade)
    const yF = y0 + GH;       // 2.7
    const BW = 3.4;           // body width/depth
    const half = BW / 2;
    const yE1 = 3.95;         // lower eave
    const W1 = 5.6;           // lower roof width
    const yU0 = 4.9;          // upper wall base
    const yE2 = 6.2;         // upper eave
    const UW = 2.2;           // upper wall width
    const W2 = 3.6;           // upper roof width (64% of lower)

    const arch = useMemo(() => archPanelGeom(BW, GH, 5, 0.12, 0.04, GH - 0.22, 0.12), []);
    const torG = useMemo(() => toranaGeom(0.54, 0.36), []);
    const bw = (BW - 6 * 0.12) / 5;
    const bayX = (i) => -BW / 2 + 0.12 + bw / 2 + i * (bw + 0.12);
    const frieze = useMemo(() => {
      const out = [];
      for (let i = 0; i < 16; i += 1) out.push([-1.52 + i * 0.2026, yF + 0.16, half + 0.09, 0.1, 0.12, 0.05, 0, 0]);
      return out;
    }, [yF, half]);
    const glowWin = M.plain('#1c0e08');
    const panelM = M.plain('#3d2216', { roughness: 0.8 });
    const panelD = M.plain('#2a170e', { roughness: 0.85 });
    const strutRow = useMemo(() => {
      const out = [];
      for (let k = 0; k < 4; k += 1) for (let i = 0; i < 13; i += 1) {
        const [x, z, a] = side(k, -1.5 + i * 0.25, half + 0.12);
        out.push([x, yE1 - 0.42, z, 0.07, 0.3, 0.1, a, 0.5]);
        out.push([x, yE1 - 0.72, z, 0.07, 0.3, 0.1, a, -0.5]);
      }
      return out;
    }, [yE1, half]);
    const strutRow2 = useMemo(() => {
      const out = [];
      for (let k = 0; k < 4; k += 1) for (let i = 0; i < 9; i += 1) {
        const [x, z, a] = side(k, -0.95 + i * 0.2375, UW / 2 + 0.1);
        out.push([x, yE2 - 0.35, z, 0.06, 0.26, 0.09, a, 0.5]);
      }
      return out;
    }, [yE2, UW]);

    return (
      <group>
        {/* plinth: broad raised brick platform, stone edge courses, five-level brick stair across the front */}
        <Box s={[6.0, 0.25, 5.8]} p={[0, 0.125, 0]} m={plinthB} />
        <Box s={[5.6, 0.55, 5.4]} p={[0, 0.275, 0]} m={plinthB} />
        <Box s={[5.2, 0.8, 5.0]} p={[0, 0.4, 0]} m={wallB} />
        <Box s={[5.3, 0.05, 5.1]} p={[0, 0.775, 0]} m={edge} cast={false} />
        <Box s={[5.0, 0.03, 4.8]} p={[0, 0.8, 0]} m={wallB} cast={false} />
        {[1, 2, 3, 4].map((j) => {
          const reach = 2.5 + (5 - j) * 0.45;
          const d = reach - 2.3;
          return (
            <group key={j}>
              <Box s={[5.0, 0.16 * j, d]} p={[0, 0.08 * j, 2.3 + d / 2]} m={stairB} />
              <Box s={[5.06, 0.04, 0.1]} p={[0, 0.16 * j, reach - 0.04]} m={edge} cast={false} />
            </group>
          );
        })}

        {/* ground floor: back wall, side returns, ceiling of the verandah */}
        <Box s={[BW, GH, BW - 0.9]} p={[0, y0 + GH / 2, -0.45]} m={wallBack} />
        {[-1, 1].map((k) => <Box key={k} s={[0.14, GH, 0.92]} p={[k * (half - 0.07), y0 + GH / 2, half - 0.46]} m={wallB2} />)}
        <Box s={[BW, 0.06, 0.95]} p={[0, yF - 0.03, half - 0.47]} m={timberD} cast={false} />
        <Box s={[BW - 0.2, 0.03, 0.9]} p={[0, y0 + 0.015, half - 0.45]} m={M.plain('#2a170e')} cast={false} />
        {[-1, 0, 1].map((k) => (
          <group key={k} position={[k * 0.95, y0 + 0.7, half - 0.86]}>
            <Box s={[0.62, 1.4, 0.05]} m={door} cast={false} />
            <Box s={[0.72, 0.07, 0.07]} p={[0, 0.72, 0.01]} m={timber} cast={false} />
            {[-1, 1].map((q) => <Box key={q} s={[0.07, 1.42, 0.07]} p={[q * 0.35, 0, 0.01]} m={timber} cast={false} />)}
            <Box s={[0.02, 1.3, 0.06]} m={M.gold} cast={false} />
          </group>
        ))}
        {/* cusped arcade */}
        <mesh geometry={arch} material={timber} position={[0, y0, half - 0.06]} castShadow receiveShadow />
        {[...Array(5)].map((_, i) => <mesh key={i} geometry={torG} material={M.gold} position={[bayX(i), y0 + GH - 0.32, half + 0.02]} />)}
        {[...Array(6)].map((_, i) => {
          const x = -BW / 2 + 0.06 + i * ((BW - 0.12) / 5);
          return (
            <group key={i} position={[x, y0, half + 0.04]}>
              <Cyl rt={0.045} rb={0.05} h={GH - 0.04} p={[0, (GH - 0.04) / 2, 0]} m={timberD} seg={10} />
              <Box s={[0.13, 0.06, 0.13]} p={[0, GH - 0.05, 0]} m={M.gold} cast={false} />
              <Box s={[0.12, 0.05, 0.12]} p={[0, 0.025, 0]} m={stone} cast={false} />
            </group>
          );
        })}
        {/* carved valance above the arcade */}
        <Box s={[BW + 0.04, 0.35, 0.16]} p={[0, yF + 0.175, half + 0.04]} m={timber} />
        <Box s={[BW + 0.04, 0.035, 0.18]} p={[0, yF + 0.355, half + 0.04]} m={M.gold} cast={false} />
        <Box s={[BW + 0.04, 0.035, 0.18]} p={[0, yF + 0.03, half + 0.04]} m={M.gold} cast={false} />
        <Inst items={frieze} m={M.gold} cast={false} />

        {/* first-floor band: brick wall, carved window row, timber posts */}
        <Box s={[BW, yE1 - yF, BW]} p={[0, (yE1 + yF) / 2, 0]} m={wallB} />
        {[0, 1, 2, 3].map((k) => {
          const [x, z, a] = side(k, 0, half + 0.03);
          return (
            <group key={k} position={[x, 0, z]} rotation={[0, a, 0]}>
              <Box s={[BW - 0.04, yE1 - yF - 0.28, 0.07]} p={[0, (yE1 + yF) / 2 + 0.05, 0]} m={panelM} />
              {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((q) => <Box key={q} s={[0.06, yE1 - yF - 0.4, 0.06]} p={[q, (yE1 + yF) / 2 + 0.05, 0.05]} m={panelD} cast={false} />)}
              <Box s={[BW, 0.07, 0.1]} p={[0, yF + 0.22, 0.04]} m={M.gold} cast={false} />
            </group>
          );
        })}
        <Inst items={strutRow} m={M.plain('#3a2012', { roughness: 0.8 })} cast={false} />
        <Box s={[BW + 0.06, 0.1, BW + 0.06]} p={[0, yF + 0.02, 0]} m={timberD} cast={false} />
        {[0, 1, 2, 3].map((k) => {
          const mk = (lx, w, h, tor, key) => {
            const [x, z, a] = side(k, lx, half + 0.03);
            return <Win key={key} p={[x, (yE1 + yF) / 2 - 0.05, z]} r={[0, a, 0]} w={w} h={h} torana={tor} glow={glowWin} />;
          };
          const items = k === 0
            ? [mk(-1.05, 0.46, 0.46, true, 'a'), mk(0, 0.6, 0.52, true, 'b'), mk(1.05, 0.46, 0.46, true, 'c')]
            : [mk(-0.55, 0.42, 0.44, true, 'a'), mk(0.55, 0.42, 0.44, true, 'b')];
          return <group key={k}>{items}</group>;
        })}
        
        {/* lower eave beam, struts, roof */}
        <Box s={[W1 - 1.6, 0.08, W1 - 1.6]} p={[0, yE1 - 0.06, 0]} m={timberD} cast={false} />
        <EaveSet half={half} eaveHalf={W1 / 2} y={yE1 - 0.95} run={0.9} rise={0.9} n={9} span={1.5} th={0.11} fringeStep={0.15} />
        <PagodaRoof w={W1} h={1.35} y={yE1} />

        {/* upper storey */}
        <Box s={[UW, yE2 - yU0, UW]} p={[0, (yE2 + yU0) / 2, 0]} m={wallBU} />
        {[0, 1, 2, 3].map((k) => {
          const [x, z, a] = side(k, 0, UW / 2 + 0.03);
          return <Box key={k} s={[UW - 0.04, yE2 - yU0 - 0.2, 0.07]} p={[x, (yE2 + yU0) / 2, z]} r={[0, a, 0]} m={panelM} />;
        })}
        <Inst items={strutRow2} m={M.plain('#3a2012', { roughness: 0.8 })} cast={false} />
        {[0, 1, 2, 3].map((k) => {
          const [x, z, a] = side(k, 0, UW / 2 + 0.03);
          return <Win key={k} p={[x, (yU0 + yE2) / 2, z]} r={[0, a, 0]} w={0.7} h={0.56} glow={glowWin} />;
        })}
        {[0, 1, 2, 3].map((k) => [-0.7, 0.7].map((lx) => {
          const [x, z, a] = side(k, lx, UW / 2 + 0.04);
          return <Box key={`${k}${lx}`} s={[0.09, 0.8, 0.08]} p={[x, (yU0 + yE2) / 2, z]} r={[0, a, 0]} m={timber} />;
        }))}
        <Box s={[UW + 0.08, 0.08, UW + 0.08]} p={[0, yE2 - 0.12, 0]} m={timberD} cast={false} />
        <EaveSet half={UW / 2} eaveHalf={W2 / 2} y={yE2 - 0.65} run={0.6} rise={0.6} n={5} span={0.8} th={0.095} fringeStep={0.14} />
        <PagodaRoof w={W2} h={1.3} y={yE2} />
        <Gajur y={yE2 + 1.3} s={1.0} />

        {/* elephants on brick pedestals at the stair ends */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 3.2, 0, 3.3]}>
            <Box s={[1.3, 0.3, 2.0]} p={[0, 0.15, 0]} m={brickP} />
            <Box s={[1.15, 0.55, 1.8]} p={[0, 0.575, 0]} m={wallB2} />
            <Box s={[1.25, 0.1, 1.9]} p={[0, 0.9, 0]} m={edge} />
            <group position={[0, 0.95, -0.05]} scale={1.0}><Elph stone={stone} cloth={cloth} cap={stone} /></group>
          </group>
        ))}

        {/* stone Nandi lying on a brick plinth at the north (left) side, facing the temple */}
        <group position={[-4.3, 0, 0.4]} rotation={[0, Math.PI / 2, 0]} scale={2}>
          <Box s={[0.62, 0.2, 0.95]} p={[0, 0.1, 0]} m={wallB2} />
          <Box s={[0.66, 0.04, 0.99]} p={[0, 0.22, 0]} m={edge} cast={false} />
          <Ball rad={0.2} sc={[0.85, 0.78, 1.55]} p={[0, 0.45, -0.05]} m={stone} />
          <Ball rad={0.13} sc={[0.9, 1, 1.1]} p={[0, 0.63, 0.1]} m={stone} />
          <Ball rad={0.11} sc={[0.9, 0.95, 1.4]} p={[0, 0.55, 0.3]} m={stone} />
          <Ball rad={0.105} sc={[0.85, 0.85, 1.3]} p={[0, 0.5, 0.45]} m={stone} />
          <Box s={[0.1, 0.07, 0.1]} p={[0, 0.45, 0.55]} m={stone} />
          {[-1, 1].map((q) => (
            <group key={q}>
              <Cyl rt={0.006} rb={0.02} h={0.12} p={[q * 0.09, 0.64, 0.4]} r={[0, 0, -q * 0.9]} m={M.plain('#d9d2c0')} seg={6} />
              <Box s={[0.03, 0.05, 0.08]} p={[q * 0.12, 0.58, 0.36]} m={stone} />
              <Box s={[0.12, 0.1, 0.45]} p={[q * 0.2, 0.28, 0.12]} m={stone} />
              <Box s={[0.12, 0.1, 0.4]} p={[q * 0.2, 0.28, -0.25]} m={stone} />
            </group>
          ))}
          <Box s={[0.03, 0.03, 0.22]} p={[0, 0.4, -0.38]} r={[0.5, 0, 0]} m={stone} />
        </group>

        {/* people sitting on the brick steps and plinth edge */}
        <People list={[
          [-1.4, 0.32, 3.62, 0.36, 0], [-0.9, 0.32, 3.62, 0.36, 1], [-0.25, 0.48, 3.18, 0.36, 3], [0.2, 0.48, 3.18, 0.36, 2], [0.6, 0.32, 3.62, 0.36, 4],
          [1.4, 0.48, 3.18, 0.36, 5], [-1.15, 0.64, 2.72, 0.36, 1], [1.0, 0.64, 2.72, 0.36, 0], [-0.1, 0.16, 4.08, 0.36, 2],
        ]} />

        {/* diyas on the steps (lit at dusk) */}
        <Diyo p={[-1.9, 0.64, 2.7]} light />
        <Diyo p={[1.9, 0.64, 2.7]} light />
        <Diyo p={[0, 0.32, 3.6]} />

        <Frame s={[8.6, 9.2, 8.2]} p={[0, 4.5, 1.1]} />
      </group>
    );
  }

  /* =====================================================================================================
     ENV: Krishna Mandir (right), Bhimsen (left), the square, columns, skyline of Newar houses
     ===================================================================================================== */
  function KrishnaMandirEnv({ p }) {
    const M = useM();
    const st = M.plain('#968d7d', { roughness: 0.95 });
    const stD = M.plain('#8a816f', { roughness: 0.95 });
    const dark = M.plain('#4f493f');
    const shG = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 28; i += 1) {
        const t = i / 28;
        pts.push(new THREE.Vector2(0.06 + 0.58 * Math.pow(1 - t, 0.62) * (1 - 0.08 * Math.sin(t * 40) * (1 - t)), t * 2.3));
      }
      return new THREE.LatheGeometry(pts, 16);
    }, []);
    const pillars = useMemo(() => {
      const out = [];
      const mk = (half, y, h, n, s) => {
        for (let k = 0; k < 4; k += 1) for (let i = 0; i < n; i += 1) {
          const lx = -half + (2 * half * i) / n; const [x, z] = side(k, lx, half);
          out.push([x, y + h / 2, z, s, h, s, 0]);
        }
      };
      mk(1.75, 0.34, 1.1, 6, 0.14);
      mk(1.25, 1.84, 0.95, 4, 0.12);
      mk(0.8, 3.1, 0.85, 3, 0.1);
      return out;
    }, []);
    /* cusped chhatri pavilion with one gilded pinnacle */
    const chh = (x, y, z, s, key) => (
      <group key={key} position={[x, y, z]} scale={s}>
        <Box s={[0.26, 0.06, 0.26]} p={[0, 0.03, 0]} m={stD} cast={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.025} rb={0.03} h={0.2} p={[a * 0.1, 0.16, b * 0.1]} m={st} seg={6} />)}
        <Box s={[0.28, 0.05, 0.28]} p={[0, 0.28, 0]} m={st} cast={false} />
        <Ball rad={0.16} sc={[1, 0.85, 1]} p={[0, 0.3, 0]} m={st} />
        <mesh position={[0, 0.52, 0]} material={M.gold}><coneGeometry args={[0.035, 0.2, 6]} /></mesh>
      </group>
    );
    const ring = (half, y, n, s, key, cornersOnly) => {
      const out = [];
      for (let k = 0; k < 4; k += 1) for (let i = 0; i < n; i += 1) {
        if (n === 2 && i === 1) continue; // corner + one mid per side later
        const lx = -half + (2 * half * i) / n; const [x, z] = side(k, lx, half);
        out.push(chh(x, y, z, s, `${key}c${k}${i}`));
      }
      if (!cornersOnly) for (let k = 0; k < 4; k += 1) { const [x, z] = side(k, 0, half); out.push(chh(x, y, z, s, `${key}m${k}`)); }
      return out;
    };
    return (
      <group position={p}>
        <Box s={[5.4, 0.16, 5.4]} p={[0, 0.08, 0]} m={stD} />
        <Box s={[4.9, 0.14, 4.9]} p={[0, 0.23, 0]} m={st} />
        {/* storey 1 */}
        <Box s={[3.1, 1.1, 3.1]} p={[0, 0.9, 0]} m={dark} />
        <Inst items={pillars} m={st} />
        <Box s={[4.2, 0.18, 4.2]} p={[0, 1.54, 0]} m={st} />
        <Box s={[4.3, 0.05, 4.3]} p={[0, 1.65, 0]} m={stD} cast={false} />
        {ring(1.85, 1.67, 2, 0.8, 'a', false)}
        {/* storey 2 */}
        <Box s={[2.3, 0.95, 2.3]} p={[0, 2.3, 0]} m={dark} />
        <Box s={[3.2, 0.16, 3.2]} p={[0, 2.84, 0]} m={st} />
        {ring(1.35, 2.92, 2, 0.75, 'b', false)}
        {/* storey 3 */}
        <Box s={[1.6, 0.85, 1.6]} p={[0, 3.5, 0]} m={dark} />
        <Box s={[2.4, 0.16, 2.4]} p={[0, 3.98, 0]} m={st} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => chh(a * 1.0, 4.06, b * 1.0, 0.7, `c${i}`))}
        {/* central curvilinear shikhara */}
        <Box s={[1.25, 0.9, 1.25]} p={[0, 4.52, 0]} m={st} />
        <Box s={[1.4, 0.08, 1.4]} p={[0, 5.0, 0]} m={stD} cast={false} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <group key={i}>
            <Box s={[1.2 - i * 0.12, 0.34, 1.2 - i * 0.12]} p={[0, 5.15 + i * 0.32, 0]} m={i % 2 ? stD : st} />
            <Box s={[1.28 - i * 0.12, 0.05, 1.28 - i * 0.12]} p={[0, 5.3 + i * 0.32, 0]} m={stD} cast={false} />
          </group>
        ))}
        <Cyl rt={0.3} rb={0.34} h={0.14} p={[0, 7.45, 0]} m={st} seg={12} />
        <Ball rad={0.2} sc={[1, 0.6, 1]} p={[0, 7.6, 0]} m={st} />
        <Ball rad={0.09} p={[0, 7.78, 0]} m={M.gold} />
        <mesh position={[0, 8.05, 0]} material={M.gold}><coneGeometry args={[0.07, 0.5, 8]} /></mesh>
        {/* lions at the stair foot */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.3, 0.36, 3.1]}>
            <Box s={[0.5, 0.4, 0.5]} p={[0, -0.16, 0]} m={st} />
            <Ball rad={0.18} sc={[0.9, 1, 1.2]} p={[0, 0.2, 0]} m={stD} />
          </group>
        ))}
        {[0, 1, 2].map((i) => <Box key={i} s={[2.4, 0.1, 0.5]} p={[0, 0.1, 2.9 + i * 0.4]} m={st} />)}
      </group>
    );
  }

  function BhimsenEnv({ p }) {
    const M = useM();
    const wallB = M.mat('brick', 5, 1.6, { color: '#b0553a' });
    const wallS = M.mat('brick', 3, 1.4, { color: '#a3472f' });
    const roofM = M.mat('roof', 5, 4, { color: '#bd8a6c' });
    const timber = M.plain(RED);
    const win3 = (y, key) => (
      <group key={key} position={[0, y, 1.42]}>
        <Box s={[3.1, 0.82, 0.1]} m={M.plain(RED_D)} />
        {[-0.95, 0, 0.95].map((x) => (
          <group key={x} position={[x, 0, 0.06]}>
            <Box s={[0.74, 0.64, 0.05]} m={M.plain('#2a150d')} cast={false} />
            <Box s={[0.82, 0.07, 0.07]} p={[0, 0.3, 0]} m={M.gold} cast={false} />
            <Box s={[0.82, 0.05, 0.07]} p={[0, -0.28, 0]} m={M.gold} cast={false} />
            {[-1, 1].map((q) => <Box key={q} s={[0.05, 0.56, 0.07]} p={[q * 0.38, 0, 0]} m={M.gold} cast={false} />)}
            <mesh position={[0, 0.34, 0]} material={M.gold}><coneGeometry args={[0.2, 0.22, 3]} /></mesh>
          </group>
        ))}
      </group>
    );
    return (
      <group position={p}>
        <Box s={[6.8, 0.15, 5.2]} p={[0, 0.075, 0]} m={M.mat('brick', 6, 0.5, { color: BRICK_D })} />
        <Box s={[6.4, 0.3, 4.8]} p={[0, 0.15, 0]} m={wallB} />
        {/* storey 1 */}
        <Box s={[5.4, 1.2, 3.4]} p={[0, 0.9, 0]} m={wallB} />
        {[-1.8, -0.9, 0, 0.9, 1.8].map((x) => <Box key={x} s={[0.12, 1.0, 0.12]} p={[x, 0.9, 1.74]} m={timber} />)}
        {[-1.35, -0.45, 0.45, 1.35].map((x) => <Box key={x} s={[0.7, 0.8, 0.05]} p={[x, 0.85, 1.72]} m={M.plain('#3b1f14')} cast={false} />)}
        <Box s={[5.6, 0.12, 3.6]} p={[0, 1.55, 0]} m={M.plain(RED_D)} />
        <EaveSet half={2.7} eaveHalf={3.2} y={1.5} run={0.4} rise={0.3} n={9} span={2.3} th={0.08} fringeStep={0.14} />
        <Roof w={6.4} d={4.6} h={0.75} y={1.75} m={roofM} sag={1.4} lift={0.2} fascia={false} />
        <Box s={[6.4, 0.1, 0.07]} p={[0, 1.73, 2.3]} m={M.plain('#6e2a1c')} cast={false} />
        {/* storey 2 with the three linked gilt windows */}
        <Box s={[4.4, 1.15, 2.8]} p={[0, 2.4, 0]} m={wallS} />
        {win3(2.45, 'w')}
        <Roof w={5.4} d={3.8} h={0.7} y={3.1} m={roofM} sag={1.4} lift={0.2} fascia={false} />
        <Box s={[5.4, 0.1, 0.07]} p={[0, 3.08, 1.9]} m={M.plain('#6e2a1c')} cast={false} />
        {/* storey 3 */}
        <Box s={[2.9, 1.0, 2.0]} p={[0, 3.6, 0]} m={wallS} />
        {[-0.6, 0.6].map((x) => <Box key={x} s={[0.5, 0.5, 0.05]} p={[x, 3.65, 1.02]} m={M.plain('#2a150d')} cast={false} />)}
        <Roof w={3.8} d={2.8} h={0.8} y={4.1} m={roofM} sag={1.4} lift={0.2} fascia={false} />
        <Box s={[3.8, 0.1, 0.07]} p={[0, 4.08, 1.4]} m={M.plain('#6e2a1c')} cast={false} />
        <Gajur y={4.78} s={0.7} />
      </group>
    );
  }

  function GarudaColumn({ p }) {
    const M = useM();
    const st = M.plain('#a8a091', { roughness: 0.95 });
    const stB = M.plain('#928a7c', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[0.95, 0.18, 0.95]} p={[0, 0.09, 0]} m={stB} />
        <Box s={[0.7, 0.18, 0.7]} p={[0, 0.27, 0]} m={stB} />
        <Cyl rt={0.14} rb={0.16} h={2.7} p={[0, 1.65, 0]} m={st} seg={14} />
        <Cyl rt={0.2} rb={0.14} h={0.18} p={[0, 3.09, 0]} m={stB} seg={14} />
        <group position={[0, 3.18, 0]} scale={0.8}>
          <Box s={[0.34, 0.3, 0.2]} p={[0, 0.28, 0]} m={M.gold} />
          <Ball rad={0.1} p={[0, 0.5, 0.04]} m={M.gold} />
          <mesh position={[0, 0.64, 0.04]} material={M.gold}><coneGeometry args={[0.08, 0.2, 8]} /></mesh>
          <Box s={[0.2, 0.2, 0.3]} p={[0, 0.1, 0.18]} m={M.gold} />
          {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.4, 0.36]} p={[k * 0.2, 0.46, -0.12]} r={[-0.3, 0, k * 0.4]} m={M.gold} />)}
        </group>
      </group>
    );
  }
  function KingColumn({ p }) {
    const M = useM();
    const st = M.plain('#a8a091', { roughness: 0.95 });
    const stB = M.plain('#928a7c', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[1.1, 0.2, 1.1]} p={[0, 0.1, 0]} m={stB} />
        <Box s={[0.85, 0.2, 0.85]} p={[0, 0.3, 0]} m={stB} />
        <Box s={[0.6, 0.2, 0.6]} p={[0, 0.5, 0]} m={stB} />
        <Box s={[0.3, 3.5, 0.3]} p={[0, 2.35, 0]} m={st} />
        <Box s={[0.46, 0.14, 0.46]} p={[0, 4.17, 0]} m={stB} />
        <group position={[0, 4.24, 0]} scale={0.85}>
          <Box s={[0.36, 0.12, 0.3]} p={[0, 0.06, 0]} m={M.gold} />
          <Box s={[0.18, 0.28, 0.12]} p={[0, 0.26, 0]} m={M.gold} />
          <Ball rad={0.07} p={[0, 0.5, 0]} m={M.gold} />
          <mesh position={[0, 0.65, 0]} material={M.gold}><coneGeometry args={[0.18, 0.26, 10]} /></mesh>
          <mesh position={[0, 0.92, 0]} material={M.gold}><coneGeometry args={[0.05, 0.28, 6]} /></mesh>
          <Box s={[0.1, 0.1, 0.22]} p={[0, 1.12, 0]} m={M.gold} />
        </group>
      </group>
    );
  }

  /* Newar brick houses: each [x, z, w, d, h, rotY, tint, roofType(0 hip, 1 flat parapet, 2 steep hip, 3 hip + attic)] */
  const HOUSES_RAW = [
    [-27, -8.6, 4.2, 3.2, 3.6, 0, 0, 2], [-22.5, -8.4, 3.6, 3.2, 5.0, 0, 1, 3], [-17.8, -8.8, 4.0, 3.2, 2.5, 0, 2, 1],
    [-13.4, -8.2, 3.2, 3.2, 4.2, 0, 0, 0], [13.8, -8.6, 3.8, 3.2, 3.0, 0, 1, 1], [18.2, -8.3, 4.2, 3.2, 4.8, 0, 2, 3],
    [23, -8.7, 3.6, 3.2, 2.6, 0, 0, 0], [28, -8.4, 4.0, 3.2, 3.9, 0, 1, 2], [-4, -9.4, 3.6, 3.2, 3.3, 0, 2, 0], [4.6, -9.0, 3.8, 3.2, 4.6, 0, 0, 3],
    [-24, -14.5, 4.4, 3.4, 5.4, 0, 1, 2], [-14, -14.8, 4.0, 3.4, 4.0, 0, 2, 1], [-4, -14.6, 4.2, 3.4, 5.8, 0, 0, 3], [6, -14.7, 4.4, 3.4, 4.4, 0, 1, 0],
    [16, -14.5, 4.0, 3.4, 5.2, 0, 2, 2], [26, -14.8, 4.2, 3.4, 4.0, 0, 0, 1],
    [-30, -2, 3.4, 3.8, 3.4, Math.PI / 2, 1, 0], [-30, 3.5, 3.4, 4.0, 4.6, Math.PI / 2, 2, 3], [-30, 9, 3.4, 3.8, 2.6, Math.PI / 2, 0, 1], [-30, 14.5, 3.4, 4.0, 4.0, Math.PI / 2, 1, 2],
    [-30, 20, 3.4, 4.0, 3.0, Math.PI / 2, 2, 0],
    [31, -2, 3.4, 3.8, 4.4, -Math.PI / 2, 2, 3], [31, 3.5, 3.4, 4.0, 3.1, -Math.PI / 2, 0, 1], [31, 9, 3.4, 3.8, 3.8, -Math.PI / 2, 1, 0], [31, 14.5, 3.4, 4.0, 5.0, -Math.PI / 2, 2, 2],
    [31, 20, 3.4, 4.0, 2.9, -Math.PI / 2, 0, 1],
  ];
  const HOUSES = HOUSES_RAW.map((r) => [r[0], r[1], r[2], r[3], 2.5 + (r[4] - 2.5) * 0.4, r[5], r[6], r[7]]);
  const TINTS = ['#a3472f', '#c47a5a', '#b85a3f', '#8f4a38', '#c98f6e'];

  function Houses() {
    const M = useM();
    const roofM = M.mat('roof', 4, 3, { color: '#bd8a6c' });
    const roofD = M.mat('roof', 4, 3, { color: '#b98764' });
    const brick = TINTS.map((c) => M.mat('brick', 2.5, 2, { color: c }));
    const wins = useMemo(() => {
      const out = [];
      HOUSES.forEach(([x, z, w, d, h, ry]) => {
        const n = Math.max(2, Math.floor(w / 1.05));
        const storeys = Math.max(2, Math.round(h / 0.95));
        for (let s = 0; s < storeys; s += 1) for (let i = 0; i < n; i += 1) {
          const lx = -w / 2 + ((i + 0.5) * w) / n;
          const ly = 0.5 + s * (h - 0.9) / Math.max(1, storeys - 1);
          const c = Math.cos(ry); const sn = Math.sin(ry);
          const lz = d / 2 + 0.03;
          out.push([x + lx * c + lz * sn, ly, z - lx * sn + lz * c, s === 0 ? 0.62 : 0.4, s === 0 ? 0.6 : 0.46, 0.06, ry]);
        }
      });
      return out;
    }, []);
    return (
      <group>
        {HOUSES.map(([x, z, w, d, h, ry, t, rt], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
            <Box s={[w, h, d]} p={[0, h / 2, 0]} m={brick[(t + i * 2) % 5]} />
            {rt === 1 ? (
              <>
                <Box s={[w + 0.2, 0.18, d + 0.2]} p={[0, h + 0.05, 0]} m={M.plain('#6e3a2a')} />
                <Box s={[w * 0.5, 0.6, d * 0.5]} p={[-w * 0.15, h + 0.4, 0]} m={brick[(t + i * 2 + 1) % 5]} />
                <Roof w={w * 0.5 + 0.4} d={d * 0.5 + 0.4} h={0.4} y={h + 0.65} m={roofD} sag={1.2} lift={0.05} fascia={false} />
              </>
            ) : (
              <>
                {rt === 3 && <Box s={[w * 0.6, 0.8, d * 0.6]} p={[0, h + 0.3, 0]} m={brick[(t + i * 2 + 3) % 5]} />}
                <Roof w={w + 0.7} d={d + 0.7} h={rt === 2 ? 0.8 : 0.55} y={rt === 3 ? h + 0.65 : h - 0.05} m={rt === 2 ? roofD : roofM} sag={rt === 2 ? 1.3 : 1.15} lift={rt === 2 ? 0.1 : 0.05} fascia={false} />
                <Box s={[w + 0.7, 0.07, 0.07]} p={[0, h - 0.08, (d + 0.7) / 2]} m={M.plain('#6e2a1c')} cast={false} />
              </>
            )}
          </group>
        ))}
        <Inst items={wins} m={M.plain('#2e1a10')} cast={false} />
      </group>
    );
  }

  /* multi-roofed pagoda seen across the square (Taleju-like) */
  function PagodaSil({ p, tiers, w, s = 1 }) {
    const M = useM();
    const brickM = M.mat('brick', 2, 1.5, { color: '#a3472f' });
    const roofM = M.mat('roof', 4, 4, { color: '#bd8a6c' });
    const out = [];
    let y = 0.9 * s;
    for (let i = 0; i < tiers; i += 1) {
      const rw = (w - i * w * 0.14) * s; const bh = (1.3 - i * 0.1) * s;
      out.push(
        <group key={i}>
          <Box s={[rw * 0.62, bh, rw * 0.62]} p={[0, y + bh / 2, 0]} m={brickM} />
          <Roof w={rw} d={rw} h={0.8 * s} y={y + bh - 0.05} m={roofM} sag={1.5} lift={0.28} fascia={false} />
        </group>,
      );
      y += bh + 0.45 * s;
    }
    return (
      <group position={p}>
        {[0, 1, 2].map((i) => <Box key={i} s={[(w + 1.6 - i * 0.7) * s, 0.3 * s, (w + 1.6 - i * 0.7) * s]} p={[0, (0.15 + i * 0.3) * s, 0]} m={M.stone} />)}
        {out}
        <Gajur y={y - 0.2 * s} s={0.9 * s} />
      </group>
    );
  }

  function ShikharaSil({ p, s = 1 }) {
    const M = useM();
    const st = M.plain('#b9ae9c', { roughness: 0.95 });
    const g = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 20; i += 1) { const t = i / 20; pts.push(new THREE.Vector2(0.06 + 0.8 * Math.pow(1 - t, 0.65), t * 3.2)); }
      return new THREE.LatheGeometry(pts, 14);
    }, []);
    return (
      <group position={p} scale={s}>
        <Box s={[3.8, 0.4, 3.8]} p={[0, 0.2, 0]} m={st} />
        <Box s={[2.2, 2.0, 2.2]} p={[0, 1.4, 0]} m={st} />
        <Box s={[2.6, 0.15, 2.6]} p={[0, 2.45, 0]} m={st} />
        <mesh geometry={g} material={st} position={[0, 2.5, 0]} castShadow />
        <Ball rad={0.13} p={[0, 5.8, 0]} m={M.gold} />
        <mesh position={[0, 6.05, 0]} material={M.gold}><coneGeometry args={[0.07, 0.4, 8]} /></mesh>
      </group>
    );
  }

  function VishwanathEnv() {
    const M = useM();
    const paving = M.mat('brick', 70, 70, { color: '#eab89c' });
    const slab = M.plain('#8c6f5c', { roughness: 0.95 });
    const ridge = M.plain('#8fa5a6', { roughness: 1 });
    const ridge2 = M.plain('#9db0b0', { roughness: 1 });
    const walkers = useMemo(() => {
      const out = [];
      const base = [[-6, 8], [-2.5, 6.5], [1, 9.5], [4.4, 7], [-9.5, 12], [9, 11], [12, 5.5], [-12, 5.5], [2, 14], [-5, 16], [7.5, 15], [-1.5, 11.5]];
      base.forEach(([x, z], i) => out.push([x, 0, z, 0.36, i]));
      return out;
    }, []);
    return (
      <group>
        <Box s={[160, 0.2, 160]} p={[0, -0.1, 0]} m={paving} cast={false} />
        {[6, 12, 18].map((z) => <Box key={z} s={[70, 0.012, 0.34]} p={[0, 0.006, z]} m={slab} cast={false} />)}
        {[-14, -4, 6, 16].map((x) => <Box key={x} s={[0.34, 0.012, 40]} p={[x, 0.007, 14]} m={slab} cast={false} />)}

        <KrishnaMandirEnv p={[7.4, 0, -0.6]} />
        <BhimsenEnv p={[-9.2, 0, -0.4]} />
        <GarudaColumn p={[7.6, 0, 5.4]} />
        <KingColumn p={[-3.6, 0, 7.4]} />

        {/* pagodas across the square */}
        <PagodaSil p={[-21, 0, -1.5]} tiers={3} w={5.2} s={1.15} />
        <PagodaSil p={[24, 0, 2]} tiers={2} w={4.2} s={1.0} />

        <People list={walkers} />
        <Houses />

        <group position={[0, 0, 36]}>
          <Box s={[60, 4.2, 3.4]} p={[0, 2.1, 0]} m={M.mat('brick', 18, 2, { color: '#b86a4e' })} />
          <Roof w={61} d={4.6} h={0.9} y={4.1} m={M.mat('roof', 12, 2, { color: '#9a5a40' })} sag={1.1} lift={0.02} fascia={false} />
          <Inst items={Array.from({ length: 34 }, (_, i) => [-29 + i * 1.75, 2.4, -1.72, 0.7, 0.9, 0.06, 0]).concat(Array.from({ length: 34 }, (_, i) => [-29 + i * 1.75, 2.4, 1.72, 0.7, 0.9, 0.06, 0]))} m={M.plain('#2e1a10')} cast={false} />
        </group>

        {[[-34, -24], [-18, -26], [20, -25], [36, -22], [-38, 6], [40, 8]].map(([x, z], i) => <Tree key={i} p={[x, 0, z]} s={1.5 + (i % 3) * 0.3} />)}
        {/* low hazy ridge of the valley rim */}
        {[[-75, -55, 38, 6], [-30, -85, 44, 7], [20, -90, 48, 6], [65, -65, 40, 7], [90, -15, 36, 6], [-92, -5, 36, 6], [-70, 50, 36, 5], [75, 45, 36, 5]].map(([x, z, r, h], i) => (
          <Ball key={i} rad={r} p={[x, -r * 0.82 + h, z]} sc={[1.5, 1, 1]} m={i % 2 ? ridge : ridge2} />
        ))}
      </group>
    );
  }

  return { 'vishwanath-temple': { Main: VishwanathMain, Env: VishwanathEnv } };
}
